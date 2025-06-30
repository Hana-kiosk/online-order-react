import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { EventClickArg } from '@fullcalendar/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { leaveApi, LeaveData } from '../../services/api';
import './LeaveCalendar.css';

interface LeaveEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    employeeName: string;
    leaveType: string;
    status: 'pending' | 'approved' | 'rejected';
    reason?: string;
  };
}

interface EventModalData {
  employeeName: string;
  leaveType: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  period: string;
  days: number;
}

const LeaveCalendar: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<LeaveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState<EventModalData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string>('');

  // 주말을 제외한 일수 계산 함수
  const calculateBusinessDays = (startDate: Date, endDate: Date): number => {
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

  // 연차 데이터를 캘린더 이벤트로 변환
  const convertLeaveToEvent = (leave: LeaveData): LeaveEvent => {
    // 상태별 색상 설정
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'approved':
          return { bg: '#28a745', border: '#28a745' };
        case 'rejected':
          return { bg: '#dc3545', border: '#dc3545' };
        case 'pending':
        default:
          return { bg: '#ffc107', border: '#ffc107' };
      }
    };

    const colors = getStatusColor(leave.status || 'pending');
    const statusText = leave.status === 'pending' ? ' (대기중)' : '';

    return {
      id: leave.id || '',
      title: `${leave.name} - ${leave.leaveType}${statusText}`,
      start: leave.startDate ? leave.startDate.toISOString().split('T')[0] : '',
      end: leave.endDate ? 
        // FullCalendar의 end는 exclusive이므로 하루 추가
        new Date(leave.endDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
        undefined,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      extendedProps: {
        employeeName: leave.name,
        leaveType: leave.leaveType,
        status: leave.status || 'pending',
        reason: leave.reason
      }
    };
  };

  // 연차 데이터 조회
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setLoading(true);
        setError('');
        
        // 모든 연차 데이터 조회 (모든 사용자가 전체 연차를 볼 수 있음)
        const leaveList = await leaveApi.getLeaveList(); // 모든 데이터 조회
        
        // 연차 데이터를 캘린더 이벤트로 변환
        const calendarEvents = leaveList.map(convertLeaveToEvent);
        setEvents(calendarEvents);
      } catch (error) {
        console.error('연차 데이터 조회 오류:', error);
        setError('연차 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchLeaves();
    }
  }, [user?.id]);

  // 날짜 클릭 핸들러 - 연차 신청 페이지로 이동
  const handleDateClick = (info: DateClickArg) => {
    const selectedDate = info.dateStr;
    navigate(`/leave-system/apply?date=${selectedDate}`);
  };

  // 이벤트 클릭 핸들러 - 연차 상세 정보 모달 표시
  const handleEventClick = (info: EventClickArg) => {
    const event = info.event;
    const props = event.extendedProps;
    
    // 실제 표시되는 기간 계산 (FullCalendar의 end는 exclusive이므로)
    let periodText = '';
    let days = 0;
    
    if (event.start) {
      const startDate = event.start.toLocaleDateString('ko-KR');
      const actualStartDate = new Date(event.start);
      
      if (event.end) {
        // end 날짜에서 하루를 빼서 실제 마지막 날 계산
        const actualEndDate = new Date(event.end);
        actualEndDate.setDate(actualEndDate.getDate() - 1);
        const endDate = actualEndDate.toLocaleDateString('ko-KR');
        periodText = startDate === endDate ? startDate : `${startDate} ~ ${endDate}`;
        
        // 주말을 제외한 일수 계산
        days = calculateBusinessDays(actualStartDate, actualEndDate);
      } else {
        periodText = startDate;
        // 단일 날짜인 경우 해당 날짜가 평일인지 확인
        const dayOfWeek = actualStartDate.getDay();
        days = (dayOfWeek !== 0 && dayOfWeek !== 6) ? 1 : 0;
      }
    }
    
    setModalData({
      employeeName: props.employeeName,
      leaveType: props.leaveType,
      status: props.status,
      reason: props.reason,
      period: periodText,
      days: days
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalData(null);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return '승인됨';
      case 'pending': return '대기중';
      case 'rejected': return '반려됨';
      default: return '알 수 없음';
    }
  };

  if (loading) {
    return (
      <div className="leave-calendar-container">
        <div className="loading">캘린더를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leave-calendar-container">
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
    <div className="leave-calendar-container">
      <div className="calendar-header">
        <h1>연차 캘린더</h1>
        <div className="calendar-actions">
          <button 
            className="btn-primary"
            onClick={() => navigate('/leave-system/apply')}
          >
            새 연차 신청
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/leave-system/list')}
          >
            신청 내역 보기
          </button>
        </div>
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-color approved"></span>
          <span>승인된 연차</span>
        </div>
        <div className="legend-item">
          <span className="legend-color pending"></span>
          <span>대기 중인 연차</span>
        </div>
        <div className="legend-item">
          <span className="legend-color rejected"></span>
          <span>반려된 연차</span>
        </div>
      </div>

      <div className="calendar-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="ko"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
          }}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
          dayMaxEvents={3}
          moreLinkClick="popover"
          eventDisplay="block"
          displayEventTime={false}
          weekends={true}
          selectable={true}
          selectMirror={true}
          dayCellContent={(args) => {
            return args.dayNumberText.replace('일', '');
          }}
        />
      </div>

      <div className="calendar-help">
        <h3>사용 방법</h3>
        <ul>
          <li>날짜를 클릭하면 해당 날짜에 연차를 신청할 수 있습니다.</li>
          <li>연차 이벤트를 클릭하면 상세 정보를 확인할 수 있습니다.</li>
          <li>색상별로 연차 상태를 구분할 수 있습니다.</li>
          <li>모든 직원의 연차 일정을 확인할 수 있습니다.</li>
        </ul>
      </div>

      {/* 이벤트 상세 정보 모달 */}
      {isModalOpen && modalData && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>연차 정보</h3>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="info-row">
                <span className="info-label">직원명:</span>
                <span className="info-value">{modalData.employeeName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">휴가 종류:</span>
                <span className="info-value">{modalData.leaveType}</span>
              </div>
              <div className="info-row">
                <span className="info-label">상태:</span>
                <span className={`info-value status-${modalData.status}`}>
                  {getStatusText(modalData.status)}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">기간:</span>
                <span className="info-value">{modalData.period}</span>
              </div>
              <div className="info-row">
                <span className="info-label">일수:</span>
                <span className="info-value">{modalData.days}일</span>
              </div>
              {modalData.reason && (
                <div className="info-row">
                  <span className="info-label">사유:</span>
                  <span className="info-value">{modalData.reason}</span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveCalendar; 