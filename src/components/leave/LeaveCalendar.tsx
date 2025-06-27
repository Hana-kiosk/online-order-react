import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { EventClickArg } from '@fullcalendar/core';
import { useNavigate } from 'react-router-dom';
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

const LeaveCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<LeaveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // 샘플 연차 데이터
  useEffect(() => {
    // 실제로는 API에서 데이터를 가져올 예정
    const sampleEvents: LeaveEvent[] = [
      {
        id: '1',
        title: '김철수 - 연차',
        start: '2024-01-15',
        backgroundColor: '#28a745',
        borderColor: '#28a745',
        extendedProps: {
          employeeName: '김철수',
          leaveType: '연차',
          status: 'approved',
          reason: '가족 여행'
        }
      },
      {
        id: '2',
        title: '이영희 - 반차',
        start: '2024-01-18',
        backgroundColor: '#17a2b8',
        borderColor: '#17a2b8',
        extendedProps: {
          employeeName: '이영희',
          leaveType: '반차',
          status: 'approved',
          reason: '병원 진료'
        }
      },
      {
        id: '3',
        title: '박민수 - 연차 (대기중)',
        start: '2024-01-22',
        end: '2024-01-25',
        backgroundColor: '#ffc107',
        borderColor: '#ffc107',
        extendedProps: {
          employeeName: '박민수',
          leaveType: '연차',
          status: 'pending',
          reason: '개인 사정'
        }
      },
      {
        id: '4',
        title: '정민정 - 병가',
        start: '2024-01-25',
        backgroundColor: '#dc3545',
        borderColor: '#dc3545',
        extendedProps: {
          employeeName: '정민정',
          leaveType: '병가',
          status: 'approved',
          reason: '몸살감기'
        }
      }
    ];

    setTimeout(() => {
      setEvents(sampleEvents);
      setLoading(false);
    }, 500);
  }, []);

  // 날짜 클릭 핸들러 - 연차 신청 페이지로 이동
  const handleDateClick = (info: DateClickArg) => {
    const selectedDate = info.dateStr;
    navigate(`/leave-system/apply?date=${selectedDate}`);
  };

  // 이벤트 클릭 핸들러 - 연차 상세 정보 표시
  const handleEventClick = (info: EventClickArg) => {
    const event = info.event;
    const props = event.extendedProps;
    
    // 실제 표시되는 기간 계산 (FullCalendar의 end는 exclusive이므로)
    let periodText = '';
    if (event.start) {
      const startDate = event.start.toLocaleDateString();
      if (event.end) {
        // end 날짜에서 하루를 빼서 실제 마지막 날 계산
        const actualEndDate = new Date(event.end);
        actualEndDate.setDate(actualEndDate.getDate() - 1);
        const endDate = actualEndDate.toLocaleDateString();
        periodText = startDate === endDate ? startDate : `${startDate} ~ ${endDate}`;
      } else {
        periodText = startDate;
      }
    }
    
    alert(`
연차 정보:
직원: ${props.employeeName}
휴가 종류: ${props.leaveType}
상태: ${getStatusText(props.status)}
사유: ${props.reason || '없음'}
기간: ${periodText}
    `);
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
          <span className="legend-color sick"></span>
          <span>병가</span>
        </div>
        <div className="legend-item">
          <span className="legend-color half"></span>
          <span>반차</span>
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
        />
      </div>

      <div className="calendar-help">
        <h3>사용 방법</h3>
        <ul>
          <li>날짜를 클릭하면 해당 날짜에 연차를 신청할 수 있습니다.</li>
          <li>연차 이벤트를 클릭하면 상세 정보를 확인할 수 있습니다.</li>
          <li>색상별로 연차 상태를 구분할 수 있습니다.</li>
        </ul>
      </div>
    </div>
  );
};

export default LeaveCalendar; 