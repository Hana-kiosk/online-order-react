import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { leaveApi, LeaveData } from '../../services/api';
import './LeaveList.css';

const LeaveList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // 연차 목록 조회
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setLoading(true);
        setError('');
        
        // 현재 사용자의 연차 목록만 조회
        const leaveList = await leaveApi.getLeaveList(user?.id.toString());
        setLeaves(leaveList);
      } catch (error) {
        console.error('연차 목록 조회 오류:', error);
        setError('연차 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchLeaves();
    }
  }, [user?.id]);

  // 상태별 CSS 클래스 반환
  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'pending':
      default:
        return 'status-pending';
    }
  };

  // 상태 텍스트 반환
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'approved':
        return '승인됨';
      case 'rejected':
        return '반려됨';
      case 'pending':
      default:
        return '대기중';
    }
  };

  // 날짜 포맷팅
  const formatDate = (date: Date | null): string => {
    if (!date) return '-';
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // 기간 계산
  const calculatePeriod = (startDate: Date | null, endDate: Date | null): string => {
    if (!startDate || !endDate) return '-';
    
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    
    if (start === end) {
      return start;
    }
    return `${start} ~ ${end}`;
  };

  // 일수 계산
  const calculateDays = (startDate: Date | null, endDate: Date | null): number => {
    if (!startDate || !endDate) return 0;
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  };

  if (loading) {
    return (
      <div className="leave-list-container">
        <div className="loading">연차 신청 내역을 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leave-list-container">
        <div className="error-message">
          <p>{error}</p>
          <button 
            className="btn-primary" 
            onClick={() => window.location.reload()}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="leave-list-container">
      <div className="leave-list-header">
        <h1>연차 신청 내역</h1>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => navigate('/leave-system/apply')}
          >
            새 연차 신청
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/leave-system/calendar')}
          >
            캘린더 보기
          </button>
        </div>
      </div>

      {leaves.length === 0 ? (
        <div className="no-data">
          <div className="no-data-icon">📝</div>
          <h3>신청한 연차가 없습니다</h3>
          <p>연차를 신청하여 휴가를 계획해보세요.</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/leave-system/apply')}
          >
            연차 신청하기
          </button>
        </div>
      ) : (
        <div className="leave-list-content">
          <div className="list-stats">
            <div className="stat-item">
              <span className="stat-number">{leaves.length}</span>
              <span className="stat-label">총 신청</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {leaves.filter(leave => leave.status === 'approved').length}
              </span>
              <span className="stat-label">승인됨</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {leaves.filter(leave => leave.status === 'pending').length}
              </span>
              <span className="stat-label">대기중</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {leaves.filter(leave => leave.status === 'rejected').length}
              </span>
              <span className="stat-label">반려됨</span>
            </div>
          </div>

          <div className="leave-table-container">
            <table className="leave-table">
              <thead>
                <tr>
                  <th>신청일</th>
                  <th>휴가 종류</th>
                  <th>기간</th>
                  <th>일수</th>
                  <th>상태</th>
                  <th>사유</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.id}>
                    <td>
                      {leave.appliedAt 
                        ? new Date(leave.appliedAt).toLocaleDateString('ko-KR')
                        : '-'
                      }
                    </td>
                    <td>
                      <span className="leave-type">{leave.leaveType}</span>
                    </td>
                    <td>{calculatePeriod(leave.startDate, leave.endDate)}</td>
                    <td>
                      <span className="days-count">
                        {calculateDays(leave.startDate, leave.endDate)}일
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(leave.status || 'pending')}`}>
                        {getStatusText(leave.status || 'pending')}
                      </span>
                    </td>
                    <td>
                      <div className="reason-cell">
                        {leave.reason || '사유 없음'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveList; 