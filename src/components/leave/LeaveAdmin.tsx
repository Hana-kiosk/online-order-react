import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Navigate } from 'react-router-dom';
import './LeaveAdmin.css';

const LeaveAdmin: React.FC = () => {
  const { user } = useAuth();

  // admin 권한이 없으면 접근 거부
  if (!user || user.role !== 'admin') {
    return <Navigate to="/leave-system/calendar" replace />;
  }

  return (
    <div className="leave-admin-container">
      <div className="admin-header">
        <h1>연차 관리 (관리자)</h1>
        <p>관리자 전용 연차 관리 페이지입니다.</p>
      </div>

      <div className="admin-content">
        <div className="admin-section">
          <h2>연차 승인 관리</h2>
          <p>직원들의 연차 신청을 승인하거나 반려할 수 있습니다.</p>
          <div className="coming-soon">
            🚧 개발 중입니다...
          </div>
        </div>

        <div className="admin-section">
          <h2>연차 현황 통계</h2>
          <p>전체 직원의 연차 사용 현황을 확인할 수 있습니다.</p>
          <div className="coming-soon">
            📊 개발 중입니다...
          </div>
        </div>

        <div className="admin-section">
          <h2>연차 정책 설정</h2>
          <p>연차 관련 정책을 설정하고 관리할 수 있습니다.</p>
          <div className="coming-soon">
            ⚙️ 개발 중입니다...
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveAdmin; 