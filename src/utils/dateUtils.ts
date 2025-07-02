// 시간대 안전한 날짜 포맷팅 유틸리티

/**
 * Date 객체를 로컬 시간 기준 YYYY-MM-DD 형식 문자열로 변환
 */
export const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Date 객체를 한국 형식(YYYY-MM-DD)으로 포맷팅
 * null이나 undefined인 경우 '-' 반환
 */
export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '-';
    
    return formatLocalDate(dateObj);
  } catch {
    return '-';
  }
};

/**
 * Date 객체를 한국 형식 날짜와 시간(YYYY-MM-DD HH:MM:SS)으로 포맷팅
 */
export const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '-';
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch {
    return '-';
  }
};

/**
 * 날짜 범위를 포맷팅 (시작일~종료일 또는 단일일)
 */
export const formatDateRange = (startDate: Date | string | null, endDate: Date | string | null): string => {
  if (!startDate || !endDate) return '-';
  
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  if (start === end) {
    return start;
  }
  return `${start} ~ ${end}`;
}; 