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
        const leaveList = await leaveApi.getLeaveList(user?.id?.toString());
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

  // 일수 계산 - 주말 제외
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

  // 연차 취소 기능
  const handleCancelLeave = async (leaveId: string | undefined) => {
    if (!leaveId) return;
    
    if (!window.confirm('정말로 연차 신청을 취소하시겠습니까?')) {
      return;
    }

    try {
      await leaveApi.updateLeaveStatus(leaveId, 'canceled');
      
      // 목록 새로고침
      const leaveList = await leaveApi.getLeaveList(user?.id?.toString());
      setLeaves(leaveList);
      
      alert('연차 신청이 취소되었습니다.');
    } catch (error) {
      console.error('연차 취소 오류:', error);
      alert('취소 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 취소 가능 여부 확인
  const canCancelLeave = (leave: LeaveData): boolean => {
    if (leave.status !== 'pending') return false;
    
    // 휴가 시작일이 오늘 이후인 경우에만 취소 가능
    if (leave.startDate && new Date(leave.startDate) <= new Date()) {
      return false;
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

      {/* 통계 섹션 */}
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">전체 신청</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">승인 대기</div>
        </div>
        <div className="stat-card approved">
          <div className="stat-number">{stats.approved}</div>
          <div className="stat-label">승인됨</div>
        </div>
        <div className="stat-card rejected">
          <div className="stat-number">{stats.rejected}</div>
          <div className="stat-label">반려됨</div>
        </div>
        <div className="stat-card canceled">
          <div className="stat-number">{stats.canceled}</div>
          <div className="stat-label">취소됨</div>
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
                  <th>취소</th>
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
                    <td>
                      {canCancelLeave(leave) && leave.id && (
                        <button 
                          className="btn-secondary"
                          onClick={() => handleCancelLeave(leave.id)}
                        >
                          취소
                        </button>
                      )}
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