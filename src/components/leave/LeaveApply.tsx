import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAuth } from '../../auth/AuthContext';
import { leaveApi, LeaveData } from '../../services/api';
import './LeaveApply.css';

interface LeaveFormData {
  employeeName: string;
  leaveType: string;
  startDate: Date | null;
  endDate: Date | null;
  reason: string;
}

const LeaveApply: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const preselectedDate = searchParams.get('date');

  const [formData, setFormData] = useState<LeaveFormData>({
    employeeName: user?.name || '',
    leaveType: '연차',
    startDate: null,
    endDate: null,
    reason: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // user 정보가 로드되면 직원명 설정
  useEffect(() => {
    if (user?.name) {
      setFormData(prev => ({
        ...prev,
        employeeName: user.name
      }));
    }
  }, [user]);

  // URL에서 날짜가 전달된 경우 초기값 설정
  useEffect(() => {
    if (preselectedDate) {
      const date = new Date(preselectedDate);
      setFormData(prev => ({
        ...prev,
        startDate: date,
        endDate: date
      }));
    }
  }, [preselectedDate]);

  // URL 쿼리 파라미터에서 날짜 가져오기
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const dateParam = urlParams.get('date');
    
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const selectedDate = new Date(dateParam);
      if (!isNaN(selectedDate.getTime())) {
        setFormData(prev => ({
          ...prev,
          startDate: selectedDate,
          endDate: selectedDate
        }));
      }
    }
  }, [location.search]);

  // 입력 필드 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 에러 메시지 클리어
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 시작일 변경 핸들러
  const handleStartDateChange = (date: Date | null) => {
    setFormData(prev => ({ 
      ...prev, 
      startDate: date,
      // 종료일도 같이 설정 (기본값)
      endDate: prev.endDate || date
    }));
    
    if (errors.startDate) {
      setErrors(prev => ({ ...prev, startDate: '' }));
    }
  };

  // 종료일 변경 핸들러
  const handleEndDateChange = (date: Date | null) => {
    setFormData(prev => ({ ...prev, endDate: date }));
    
    if (errors.endDate) {
      setErrors(prev => ({ ...prev, endDate: '' }));
    }
  };

  // 휴가 종류 변경 핸들러
  const handleLeaveTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const leaveType = e.target.value;
    setFormData(prev => ({
      ...prev,
      leaveType,
      // 연차 선택 시 사유 필드 초기화
      reason: leaveType === '연가' ? '' : prev.reason
    }));
  };

  // 폼 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeName.trim()) {
      newErrors.employeeName = '직원명을 입력해주세요.';
    }

    if (!formData.startDate) {
      newErrors.startDate = '시작일을 선택해주세요.';
    }

    if (!formData.endDate) {
      newErrors.endDate = '종료일을 선택해주세요.';
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = '종료일은 시작일보다 늦어야 합니다.';
    }

    // 연차가 아닌 경우에만 신청 사유 필수
    if (formData.leaveType !== '연차' && !formData.reason.trim()) {
      newErrors.reason = '신청 사유를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // API 요청 데이터 준비
      const leaveRequestData: LeaveData = {
        userid: user?.id.toString() || '',
        name: user?.name || '',
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason
      };

      console.log('연차 신청 데이터:', leaveRequestData);
      
      // 연차 신청 API 호출
      const result = await leaveApi.applyLeave(leaveRequestData);
      
      console.log('연차 신청 결과:', result);
      alert('연차 신청이 완료되었습니다!');
      navigate('/leave-system/list');
    } catch (error: unknown) {
      console.error('연차 신청 중 오류 발생:', error);
      
      // 에러 메시지 처리
      let errorMessage = '연차 신청 중 오류가 발생했습니다.';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
      }
      
      alert(errorMessage + ' 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 폼 초기화
  const handleReset = () => {
    setFormData({
      employeeName: user?.name || '',
      leaveType: '연차',
      startDate: preselectedDate ? new Date(preselectedDate) : null,
      endDate: preselectedDate ? new Date(preselectedDate) : null,
      reason: ''
    });
    setErrors({});
  };

  // 날짜 계산 (휴가 일수)
  const calculateLeaveDays = (): number => {
    if (!formData.startDate || !formData.endDate) return 0;
    
    const timeDiff = formData.endDate.getTime() - formData.startDate.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    
    return dayDiff;
  };

  return (
    <div className="leave-apply-container">
      <div className="leave-apply-header">
        <h1>연차 신청</h1>
        <p>연차 신청서를 작성해주세요. 모든 필수 항목을 입력해야 합니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="leave-apply-form">
        {/* 직원 정보 */}
        <div className="form-section">
          <h3>직원 정보</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="employeeName">직원명 <span className="required">*</span></label>
              <input
                type="text"
                id="employeeName"
                name="employeeName"
                value={formData.employeeName}
                readOnly
                className="read-only"
              />
              {errors.employeeName && <span className="error-message">{errors.employeeName}</span>}
            </div>
          </div>
        </div>

        {/* 휴가 정보 */}
        <div className="form-section">
          <h3>휴가 정보</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="leaveType">휴가 종류 <span className="required">*</span></label>
              <select
                id="leaveType"
                name="leaveType"
                value={formData.leaveType}
                onChange={handleLeaveTypeChange}
              >
                <option value="연차">연차</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="startDate">시작일 <span className="required">*</span></label>
              <DatePicker
                selected={formData.startDate}
                onChange={handleStartDateChange}
                dateFormat="yyyy-MM-dd"
                placeholderText="YYYY-MM-DD"
                className={`date-picker ${errors.startDate ? 'error' : ''}`}
                minDate={new Date()}
              />
              {errors.startDate && <span className="error-message">{errors.startDate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="endDate">
                종료일 <span className="required">*</span>
              </label>
              <DatePicker
                selected={formData.endDate}
                onChange={handleEndDateChange}
                dateFormat="yyyy-MM-dd"
                placeholderText="YYYY-MM-DD"
                className={`date-picker ${errors.endDate ? 'error' : ''}`}
                minDate={formData.startDate || new Date()}
              />
              {errors.endDate && <span className="error-message">{errors.endDate}</span>}
            </div>
          </div>

          {/* 휴가 일수 표시 */}
          {formData.startDate && formData.endDate && (
            <div className="leave-days-info">
              <strong>총 휴가 일수: {calculateLeaveDays()}일</strong>
            </div>
          )}
        </div>

        {/* 신청 사유 */}
        <div className="form-section">
          <h3>신청 사유</h3>
          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="reason">
                신청 사유 
                {formData.leaveType !== '연차' && <span className="required">*</span>}
              </label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                rows={3}
                placeholder={
                  formData.leaveType === '연차' 
                    ? "연차 사유를 입력해주세요. (선택사항)" 
                    : "신청 사유를 입력해주세요."
                }
                className={errors.reason ? 'error' : ''}
              />
              {errors.reason && <span className="error-message">{errors.reason}</span>}
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/leave-system')}
            disabled={isSubmitting}
          >
            취소
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleReset}
            disabled={isSubmitting}
          >
            초기화
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? '신청 중...' : '연차 신청'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveApply; 