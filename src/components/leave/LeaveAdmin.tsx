import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Navigate } from 'react-router-dom';
import { leaveApi, LeaveData } from '../../services/api';
import './LeaveAdmin.css';

interface ApprovalModalData {
  leave: LeaveData;
  action: 'approved' | 'rejected';
}

const LeaveAdmin: React.FC = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ApprovalModalData | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // 연차 목록 조회
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setLoading(true);
        setError('');
        
        // 모든 연차 목록 조회 (관리자용)
        const leaveList = await leaveApi.getLeaveList();
        
        // 취소된 연차는 관리자 페이지에서 제외
        const activeLeaves = leaveList.filter((leave: LeaveData) => leave.status !== 'canceled');
        setLeaves(activeLeaves);
      } catch (error) {
        console.error('연차 목록 조회 오류:', error);
        setError('연차 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, []);

  // admin 권한이 없으면 접근 거부
  if (!user || user.role !== 'admin') {
    return <Navigate to="/leave-system/calendar" replace />;
  }

  // 필터링된 연차 목록
  const filteredLeaves = leaves.filter(leave => {
    // 취소된 연차는 관리자 페이지에서 제외
    if (leave.status === 'canceled') return false;
    
    const matchesFilter = filter === 'all' || leave.status === filter;
    const matchesSearch = searchTerm === '' || 
      leave.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.leaveType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (leave.reason && leave.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  // 통계 계산
  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length
  };

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

  // 일수 계산 - 주말 제외
  const calculateDays = (startDate: Date | null, endDate: Date | null): number => {
    if (!startDate || !endDate) return 0;
    
    let count = 0;
    const currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
  };

  // 승인/반려 처리
  const handleApproval = (leave: LeaveData, action: 'approved' | 'rejected') => {
    setModalData({ leave, action });
    setRejectionReason('');
    setIsModalOpen(true);
  };

  // 승인/반려 확인
  const confirmApproval = async () => {
    if (!modalData) return;

    if (modalData.action === 'rejected' && !rejectionReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }

    setProcessing(true);

    try {
      await leaveApi.updateLeaveStatus(
        modalData.leave.id!, 
        modalData.action,
        modalData.action === 'rejected' ? rejectionReason : undefined
      );
      
      // 목록 새로고침
      const leaveList = await leaveApi.getLeaveList();
      
      // 취소된 연차는 관리자 페이지에서 제외
      const activeLeaves = leaveList.filter((leave: LeaveData) => leave.status !== 'canceled');
      setLeaves(activeLeaves);
      
      setIsModalOpen(false);
      setModalData(null);
      setRejectionReason('');
      
      const actionText = modalData.action === 'approved' ? '승인' : '반려';
      alert(`연차 신청이 ${actionText}되었습니다.`);
    } catch (error) {
      console.error('승인 처리 오류:', error);
      alert('처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setProcessing(false);
    }
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setModalData(null);
    setRejectionReason('');
  };

  if (loading) {
    return (
      <div className="leave-admin-container">
        <div className="loading">연차 관리 데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leave-admin-container">
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
    <div className="leave-admin-container">
      <div className="admin-header">
        <h1>연차 관리 (관리자)</h1>
        <p>직원들의 연차 신청을 승인하거나 반려할 수 있습니다.</p>
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
      </div>

      {/* 필터 및 검색 */}
      <div className="admin-controls">
        <div className="filter-controls">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
            className="filter-select"
          >
            <option value="all">전체</option>
            <option value="pending">승인 대기</option>
            <option value="approved">승인됨</option>
            <option value="rejected">반려됨</option>
          </select>
        </div>
        <div className="search-controls">
          <input
            type="text"
            placeholder="직원명, 휴가종류, 사유로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* 연차 목록 */}
      {filteredLeaves.length === 0 ? (
        <div className="no-data">
          <div className="no-data-icon">📋</div>
          <h3>표시할 연차 신청이 없습니다</h3>
          <p>필터 조건을 변경하거나 검색어를 확인해보세요.</p>
        </div>
      ) : (
        <div className="leave-admin-table-container">
          <table className="leave-admin-table">
            <thead>
              <tr>
                <th>신청일</th>
                <th>직원명</th>
                <th>휴가종류</th>
                <th>기간</th>
                <th>일수</th>
                <th>상태</th>
                <th>사유</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.map((leave) => (
                <tr key={leave.id}>
                  <td>
                    {leave.appliedAt 
                      ? new Date(leave.appliedAt).toLocaleDateString('ko-KR')
                      : '-'
                    }
                  </td>
                  <td>
                    <span className="employee-name">{leave.name}</span>
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
                    <div className="action-buttons">
                      {leave.status === 'pending' && (
                        <>
                          <button
                            className="btn-approve"
                            onClick={() => handleApproval(leave, 'approved')}
                            title="승인"
                          >
                            ✓
                          </button>
                          <button
                            className="btn-reject"
                            onClick={() => handleApproval(leave, 'rejected')}
                            title="반려"
                          >
                            ✗
                          </button>
                        </>
                      )}
                      {leave.status !== 'pending' && (
                        <span className="processed-text">
                          {leave.reviewedBy && `${leave.reviewedBy}님이 처리`}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 승인/반려 확인 모달 */}
      {isModalOpen && modalData && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalData.action === 'approved' ? '연차 승인' : '연차 반려'}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="leave-info">
                <div className="info-row">
                  <span className="info-label">직원명:</span>
                  <span className="info-value">{modalData.leave.name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">휴가종류:</span>
                  <span className="info-value">{modalData.leave.leaveType}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">기간:</span>
                  <span className="info-value">
                    {calculatePeriod(modalData.leave.startDate, modalData.leave.endDate)}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">일수:</span>
                  <span className="info-value">
                    {calculateDays(modalData.leave.startDate, modalData.leave.endDate)}일
                  </span>
                </div>
                {modalData.leave.reason && (
                  <div className="info-row">
                    <span className="info-label">신청사유:</span>
                    <span className="info-value">{modalData.leave.reason}</span>
                  </div>
                )}
              </div>

              {modalData.action === 'rejected' && (
                <div className="rejection-reason">
                  <label htmlFor="rejectionReason">반려 사유 (필수)</label>
                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="반려 사유를 입력해주세요..."
                    rows={4}
                    required
                  />
                </div>
              )}

              <div className="confirmation-text">
                <p>
                  <strong>{modalData.leave.name}</strong>님의 연차 신청을{' '}
                  <strong style={{ color: modalData.action === 'approved' ? '#28a745' : '#dc3545' }}>
                    {modalData.action === 'approved' ? '승인' : '반려'}
                  </strong>
                  하시겠습니까?
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal} disabled={processing}>
                취소
              </button>
              <button 
                className={`btn-primary ${modalData.action === 'approved' ? 'approve' : 'reject'}`}
                onClick={confirmApproval}
                disabled={processing || (modalData.action === 'rejected' && !rejectionReason.trim())}
              >
                {processing ? '처리 중...' : (modalData.action === 'approved' ? '승인' : '반려')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveAdmin; 