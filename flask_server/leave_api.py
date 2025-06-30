from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import datetime
from datetime import datetime as dt, timedelta
import uuid
import os
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

app = Flask(__name__)
CORS(app)

# 데이터베이스 설정
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'order_db'),
    'charset': 'utf8mb4'
}

def get_db_connection():
    """데이터베이스 연결 함수"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"데이터베이스 연결 오류: {e}")
        return None

def calculate_business_days(start_date, end_date):
    """주말을 제외한 실제 근무일 수 계산"""
    current_date = start_date
    business_days = 0
    
    while current_date <= end_date:
        # 월요일=0, 일요일=6
        if current_date.weekday() < 5:  # 월~금
            business_days += 1
        current_date += timedelta(days=1)
    
    return business_days

@app.route('/api/leave/apply', methods=['POST'])
def apply_leave():
    """연차 신청 API"""
    try:
        data = request.get_json()
        
        # 필수 필드 검증
        required_fields = ['userid', 'name', 'leave_type', 'start_date', 'end_date']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field} 필드가 누락되었습니다.'
                }), 400
        
        # 날짜 파싱
        try:
            start_date = dt.strptime(data['start_date'], '%Y-%m-%d').date()
            end_date = dt.strptime(data['end_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({
                'success': False,
                'message': '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD 형식 사용)'
            }), 400
        
        # 날짜 유효성 검증
        today = datetime.date.today()
        if start_date < today:
            return jsonify({
                'success': False,
                'message': '과거 날짜에는 연차를 신청할 수 없습니다.'
            }), 400
        
        if start_date > end_date:
            return jsonify({
                'success': False,
                'message': '시작일이 종료일보다 늦을 수 없습니다.'
            }), 400
        
        # 근무일 수 계산
        business_days = calculate_business_days(start_date, end_date)
        
        # 데이터베이스 연결
        connection = get_db_connection()
        if not connection:
            return jsonify({
                'success': False,
                'message': '데이터베이스 연결에 실패했습니다.'
            }), 500
        
        cursor = connection.cursor()
        
        try:
            # 연차 신청 데이터 삽입
            leave_id = str(uuid.uuid4())
            insert_query = """
                INSERT INTO leave 
                (id, userid, name, leave_type, start_date, end_date, reason, status, applied_at, days_count)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            cursor.execute(insert_query, (
                leave_id,
                data['userid'],
                data['name'],
                data['leave_type'],
                start_date,
                end_date,
                data.get('reason', ''),
                'pending',
                datetime.datetime.now(),
                business_days
            ))
            
            # 연가인 경우 잔여 연차 차감 (승인 후에 처리하도록 수정 가능)
            if data['leave_type'] == '연가':
                # 현재는 신청과 동시에 차감, 실제로는 승인 후 차감하는 것이 좋음
                update_balance_query = """
                    UPDATE employee_leave_balance 
                    SET used_days = used_days + %s
                    WHERE userid = %s AND year = %s
                """
                cursor.execute(update_balance_query, (
                    business_days,
                    data['userid'],
                    start_date.year
                ))
            
            connection.commit()
            
            return jsonify({
                'success': True,
                'message': '연차 신청이 완료되었습니다.',
                'data': {
                    'leave_id': leave_id,
                    'days_count': business_days,
                    'status': 'pending'
                }
            }), 200
            
        except Error as e:
            connection.rollback()
            print(f"데이터베이스 오류: {e}")
            return jsonify({
                'success': False,
                'message': '연차 신청 처리 중 오류가 발생했습니다.'
            }), 500
            
        finally:
            cursor.close()
            connection.close()
            
    except Exception as e:
        print(f"일반 오류: {e}")
        return jsonify({
            'success': False,
            'message': '서버 오류가 발생했습니다.'
        }), 500

@app.route('/api/leave/list', methods=['GET'])
def get_leave_list():
    """연차 목록 조회 API"""
    try:
        userid = request.args.get('userid')
        
        connection = get_db_connection()
        if not connection:
            return jsonify({
                'success': False,
                'message': '데이터베이스 연결에 실패했습니다.'
            }), 500
        
        cursor = connection.cursor(dictionary=True)
        
        try:
            if userid:
                # 특정 사용자의 연차 목록
                query = """
                    SELECT * FROM leave 
                    WHERE userid = %s 
                    ORDER BY applied_at DESC
                """
                cursor.execute(query, (userid,))
            else:
                # 모든 연차 목록 (관리자용)
                query = """
                    SELECT * FROM leave 
                    ORDER BY applied_at DESC
                """
                cursor.execute(query)
            
            leaves = cursor.fetchall()
            
            # 날짜 필드 포맷팅
            for leave in leaves:
                if leave['start_date']:
                    leave['start_date'] = leave['start_date'].strftime('%Y-%m-%d')
                if leave['end_date']:
                    leave['end_date'] = leave['end_date'].strftime('%Y-%m-%d')
                if leave['applied_at']:
                    leave['applied_at'] = leave['applied_at'].strftime('%Y-%m-%d %H:%M:%S')
                if leave['reviewed_at']:
                    leave['reviewed_at'] = leave['reviewed_at'].strftime('%Y-%m-%d %H:%M:%S')
            
            return jsonify(leaves), 200
            
        except Error as e:
            print(f"데이터베이스 오류: {e}")
            return jsonify({
                'success': False,
                'message': '연차 목록 조회 중 오류가 발생했습니다.'
            }), 500
            
        finally:
            cursor.close()
            connection.close()
            
    except Exception as e:
        print(f"일반 오류: {e}")
        return jsonify({
            'success': False,
            'message': '서버 오류가 발생했습니다.'
        }), 500

@app.route('/api/leave/<leave_id>/status', methods=['PUT'])
def update_leave_status(leave_id):
    """연차 상태 업데이트 API (관리자용)"""
    try:
        data = request.get_json()
        status = data.get('status')
        
        if status not in ['approved', 'rejected']:
            return jsonify({
                'success': False,
                'message': '올바르지 않은 상태값입니다.'
            }), 400
        
        connection = get_db_connection()
        if not connection:
            return jsonify({
                'success': False,
                'message': '데이터베이스 연결에 실패했습니다.'
            }), 500
        
        cursor = connection.cursor()
        
        try:
            # 연차 상태 업데이트
            update_query = """
                UPDATE leave 
                SET status = %s, reviewed_at = %s, reviewed_by = %s
                WHERE id = %s
            """
            
            cursor.execute(update_query, (
                status,
                datetime.datetime.now(),
                data.get('reviewed_by', 'admin'),  # 실제로는 로그인한 관리자 정보 사용
                leave_id
            ))
            
            if cursor.rowcount == 0:
                return jsonify({
                    'success': False,
                    'message': '해당 연차 신청을 찾을 수 없습니다.'
                }), 404
            
            connection.commit()
            
            return jsonify({
                'success': True,
                'message': f'연차가 {status}되었습니다.'
            }), 200
            
        except Error as e:
            connection.rollback()
            print(f"데이터베이스 오류: {e}")
            return jsonify({
                'success': False,
                'message': '상태 업데이트 중 오류가 발생했습니다.'
            }), 500
            
        finally:
            cursor.close()
            connection.close()
            
    except Exception as e:
        print(f"일반 오류: {e}")
        return jsonify({
            'success': False,
            'message': '서버 오류가 발생했습니다.'
        }), 500

@app.route('/api/leave/<leave_id>', methods=['GET'])
def get_leave_detail(leave_id):
    """특정 연차 정보 조회 API"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({
                'success': False,
                'message': '데이터베이스 연결에 실패했습니다.'
            }), 500
        
        cursor = connection.cursor(dictionary=True)
        
        try:
            query = "SELECT * FROM leave WHERE id = %s"
            cursor.execute(query, (leave_id,))
            leave = cursor.fetchone()
            
            if not leave:
                return jsonify({
                    'success': False,
                    'message': '해당 연차 신청을 찾을 수 없습니다.'
                }), 404
            
            # 날짜 필드 포맷팅
            if leave['start_date']:
                leave['start_date'] = leave['start_date'].strftime('%Y-%m-%d')
            if leave['end_date']:
                leave['end_date'] = leave['end_date'].strftime('%Y-%m-%d')
            if leave['applied_at']:
                leave['applied_at'] = leave['applied_at'].strftime('%Y-%m-%d %H:%M:%S')
            if leave['reviewed_at']:
                leave['reviewed_at'] = leave['reviewed_at'].strftime('%Y-%m-%d %H:%M:%S')
            
            return jsonify(leave), 200
            
        except Error as e:
            print(f"데이터베이스 오류: {e}")
            return jsonify({
                'success': False,
                'message': '연차 정보 조회 중 오류가 발생했습니다.'
            }), 500
            
        finally:
            cursor.close()
            connection.close()
            
    except Exception as e:
        print(f"일반 오류: {e}")
        return jsonify({
            'success': False,
            'message': '서버 오류가 발생했습니다.'
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 