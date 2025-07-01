import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { leaveApi, LeaveData, LeaveSummary } from '../../services/api';
import './LeaveList.css';

const LeaveList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [leaveSummary, setLeaveSummary] = useState<LeaveSummary | null>(null);

  // 연차 목록 및 잔여량 조회
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        if (!user?.id) return;

        // 연차 목록과 잔여량 동시 조회
        const [leaveList, summary] = await Promise.allSettled([
          leaveApi.getLeaveList(user.id.toString()),
          leaveApi.getLeaveSummary(user.id.toString(), new Date().getFullYear())
        ]);

        // 연차 목록 설정
        if (leaveList.status === 'fulfilled') {
          setLeaves(leaveList.value);
        } else {
          console.error('연차 목록 조회 오류:', leaveList.reason);
          setError('연차 목록을 불러오는 중 오류가 발생했습니다.');
        }

        // 연차 잔여량 설정
        if (summary.status === 'fulfilled') {
          setLeaveSummary(summary.value);
        } else {
          console.error('연차 잔여량 조회 오류:', summary.reason);
          // 잔여량 조회 실패는 목록 표시에 영향주지 않음
        }

      } catch (error) {
        console.error('데이터 조회 오류:', error);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  // 상태별 CSS 클래스 반환
  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'canceled':
        return 'status-canceled';
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
      case 'canceled':
        return '취소됨';
      case 'pending':
      default:
        return '대기중';
    }
  };

  // 날짜 포맷팅
  const formatDate = (date: Date | null | string | undefined): string => {
    if (!date) return '-';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('ko-KR', {
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

  // 일수 반환 - 서버에서 계산된 값 사용
  const getDaysCount = (leave: LeaveData): number => {
    // 서버에서 계산된 일수가 있으면 사용
    if (leave.daysCount !== undefined) {
      return leave.daysCount;
    }
    
    // 백업: 클라이언트에서 계산 (주말 제외)
    return calculateDays(leave.startDate, leave.endDate);
  };

  // 일수 계산 - 주말 제외 (백업용)
  const calculateDays = (startDate: Date | null, endDate: Date | null): number => {
    if (!startDate || !endDate) return 0;
    
    let count = 0;
    const currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    // 시작일부터 종료일까지 반복하면서 평일만 카운트
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay(); // 0: 일요일, 6: 토요일
      
      // 평일(월-금)인 경우에만 카운트
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      
      // 다음 날로 이동
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
  };

  // 통계 계산
  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
    canceled: leaves.filter(l => l.status === 'canceled').length
  };

  // 연차 취소 기능 (새로운 API 사용)
  const handleCancelLeave = async (leave: LeaveData) => {
    if (!leave.id || !user?.id) return;
    
    if (!window.confirm('정말로 연차 신청을 취소하시겠습니까?')) {
      return;
    }

    try {
      // 새로운 취소 API 사용
      await leaveApi.cancelLeave(leave.id, user.id.toString());
      
      // 목록 새로고침
      const leaveList = await leaveApi.getLeaveList(user.id.toString());
      setLeaves(leaveList);
      
      // 잔여량 정보도 새로고침
      try {
        const summary = await leaveApi.getLeaveSummary(user.id.toString(), new Date().getFullYear());
        setLeaveSummary(summary);
      } catch (summaryError) {
        console.error('잔여량 새로고침 오류:', summaryError);
      }
      
      alert('연차 신청이 취소되었습니다.');
    } catch (error: unknown) {
      console.error('연차 취소 오류:', error);
      
      let errorMessage = '취소 처리 중 오류가 발생했습니다.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  // 취소 가능 여부 확인
  const canCancelLeave = (leave: LeaveData): boolean => {
    if (leave.status !== 'pending') return false;
    
    // 휴가 시작일이 오늘 이후인 경우에만 취소 가능
    if (leave.startDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startDate = new Date(leave.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      if (startDate <= today) {
        return false;
      }
    }
    
    return true;
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

      {/* 연차 잔여량 정보 */}
      {leaveSummary && (
        <div className="leave-summary-card">
          <h3>연차 잔여량 현황 ({leaveSummary.year}년)</h3>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="label">부여 연차</span>
              <span className="value total">{leaveSummary.total_granted}일</span>
            </div>
            <div className="stat-item">
              <span className="label">사용 연차</span>
              <span className="value used">{leaveSummary.used_days}일</span>
            </div>
            <div className="stat-item">
              <span className="label">대기중</span>
              <span className="value pending">{leaveSummary.pending_days}일</span>
            </div>
            <div className="stat-item">
              <span className="label">남은 연차</span>
              <span className="value available">{leaveSummary.available_for_request}일</span>
            </div>
          </div>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">전체 신청</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">대기중</div>
        </div>
        <div className="stat-card approved">
          <div className="stat-number">{stats.approved}</div>
          <div className="stat-label">승인됨</div>
        </div>
        <div className="stat-card rejected">
          <div className="stat-number">{stats.rejected}</div>
          <div className="stat-label">반려됨</div>
        </div>
      </div>

      {/* 연차 목록 */}
      {leaves.length === 0 ? (
        <div className="no-data">
          <div className="no-data-icon">📝</div>
          <h3>신청한 연차가 없습니다</h3>
          <p>새로운 연차를 신청해보세요.</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/leave-system/apply')}
          >
            연차 신청하기
          </button>
        </div>
      ) : (
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
                <th>승인자</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave.id}>
                  <td className="date-cell">
                    {formatDate(leave.appliedAt)}
                  </td>
                  <td className="type-cell">
                    <span className={`leave-type ${leave.leaveType}`}>
                      {leave.leaveType}
                    </span>
                  </td>
                  <td className="period-cell">
                    {calculatePeriod(leave.startDate, leave.endDate)}
                  </td>
                  <td className="days-cell">
                    <span className="days-count">
                      {getDaysCount(leave)}일
                    </span>
                  </td>
                  <td className="status-cell">
                    <span className={`status-badge ${getStatusClass(leave.status || 'pending')}`}>
                      {getStatusText(leave.status || 'pending')}
                    </span>
                  </td>
                  <td className="reason-cell">
                    <div className="reason-text" title={leave.reason}>
                      {leave.reason || '-'}
                    </div>
                  </td>
                  <td className="approver-cell">
                    {leave.approverName || '-'}
                  </td>
                  <td className="action-cell">
                    {canCancelLeave(leave) ? (
                      <button
                        className="btn-cancel"
                        onClick={() => handleCancelLeave(leave)}
                        title="연차 신청 취소"
                      >
                        취소
                      </button>
                    ) : (
                      <span className="no-action">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaveList; 