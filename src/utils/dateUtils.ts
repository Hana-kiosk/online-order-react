// 시간대 안전한 날짜 포맷팅 유틸리티

/**
 * 로컬 시간대 기준으로 날짜를 YYYY-MM-DD 형식의 문자열로 변환
 * UTC 변환 없이 로컬 날짜를 정확히 반환
 */
export const formatLocalDate = (date: Date | string | null): string => {
  if (!date) return '';
  
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * 한국 시간대(KST) 기준으로 날짜를 YYYY-MM-DD 형식의 문자열로 변환
 * 서버가 다른 시간대에 있어도 항상 한국 시간 기준으로 처리
 */
export const formatKSTDate = (date: Date | string | null): string => {
  if (!date) return '';
  
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  
  // 한국 시간대(Asia/Seoul)로 변환
  const kstOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  
  const kstDateString = d.toLocaleDateString('ko-KR', kstOptions);
  // 한국 날짜 형식 "2024. 8. 15."을 "2024-08-15"로 변환
  const [year, month, day] = kstDateString.replace(/\./g, '').trim().split(' ');
  
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * 현재 한국 시간 기준 날짜를 반환
 */
export const getCurrentKSTDate = (): string => {
  const now = new Date();
  return formatKSTDate(now);
};

/**
 * 한국 시간대 기준으로 Date 객체를 생성
 */
export const createKSTDate = (dateString: string): Date => {
  // YYYY-MM-DD 형식의 문자열을 한국 시간대 기준으로 파싱
  const [year, month, day] = dateString.split('-').map(Number);
  
  // 한국 시간대에서의 정확한 날짜 생성
  const kstDate = new Date();
  kstDate.setFullYear(year, month - 1, day);
  kstDate.setHours(12, 0, 0, 0); // 정오로 설정하여 시간대 변환 오류 방지
  
  return kstDate;
};

/**
 * 날짜 범위를 한국어 형식으로 포맷팅
 * 예: "2024년 8월 15일" 또는 "2024년 8월 15일 ~ 16일"
 */
export const formatDateRange = (startDate: Date | string | null, endDate: Date | string | null): string => {
  if (!startDate) return '';
  
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate ? (endDate instanceof Date ? endDate : new Date(endDate)) : null;
  
  if (isNaN(start.getTime())) return '';
  
  const startFormatted = formatKSTDate(start);
  const [startYear, startMonth, startDay] = startFormatted.split('-');
  
  if (!end || isNaN(end.getTime()) || formatKSTDate(start) === formatKSTDate(end)) {
    return `${startYear}년 ${parseInt(startMonth)}월 ${parseInt(startDay)}일`;
  }
  
  const endFormatted = formatKSTDate(end);
  const [endYear, endMonth, endDay] = endFormatted.split('-');
  
  if (startYear === endYear && startMonth === endMonth) {
    return `${startYear}년 ${parseInt(startMonth)}월 ${parseInt(startDay)}일 ~ ${parseInt(endDay)}일`;
  } else if (startYear === endYear) {
    return `${startYear}년 ${parseInt(startMonth)}월 ${parseInt(startDay)}일 ~ ${parseInt(endMonth)}월 ${parseInt(endDay)}일`;
  } else {
    return `${startYear}년 ${parseInt(startMonth)}월 ${parseInt(startDay)}일 ~ ${endYear}년 ${parseInt(endMonth)}월 ${parseInt(endDay)}일`;
  }
};

/**
 * 간단한 날짜 포맷팅 (YYYY.MM.DD)
 */
export const formatDateDot = (date: Date | string | null): string => {
  if (!date) return '';
  
  const kstDate = formatKSTDate(date);
  if (!kstDate) return '';
  
  return kstDate.replace(/-/g, '.');
};

/**
 * 두 날짜가 같은 날인지 한국 시간대 기준으로 비교
 */
export const isSameKSTDate = (date1: Date | string, date2: Date | string): boolean => {
  return formatKSTDate(date1) === formatKSTDate(date2);
};

/**
 * 주말 및 공휴일을 제외한 업무일 수 계산 (한국 시간대 기준)
 */
export const calculateBusinessDaysKST = (
  startDate: Date | string,
  endDate: Date | string,
  holidays: Set<string> = new Set()
): number => {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  let count = 0;
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    const dateString = formatKSTDate(currentDate);
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidays.has(dateString);
    
    // 평일이면서 공휴일이 아닌 경우에만 카운트
    if (!isWeekend && !isHoliday) {
      count++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
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