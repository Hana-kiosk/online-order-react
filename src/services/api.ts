import axios from 'axios';

// 플라스크 서버 주소
// dev용
const API_URL = 'https://port-0-online-order-flask-free-m47pn82w3295ead8.sel4.cloudtype.app/api';
// 배포용
// const API_URL = 'https://port-0-online-order-flask-m47pn82w3295ead8.sel4.cloudtype.app/api';
// 로컬용
// const API_URL = 'http://localhost:5000/api';

// API 클라이언트 생성
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 인증 토큰 처리를 위한 인터셉터 설정
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 인증 오류 처리를 위한 응답 인터셉터 설정
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // 401 Unauthorized 오류 발생 시 로컬 스토리지에서 토큰 제거 후 로그인 페이지로 리다이렉트
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 발주 데이터 타입 정의
export interface OrderData {
  id?: string;
  orderDate: Date | null;
  itemCode: string;
  colorName: string;
  orderQuantity: number;
  expectedArrivalStartDate: Date | null;
  expectedArrivalEndDate: Date | null;
  arrivalDate: Date | null;
  arrivalQuantity: number | null;
  specialNote: string;
  remarks: string;
  status?: '대기' | '입고완료' | '부분입고' | '지연';
}

// 서버 응답 데이터 타입 정의
export interface ServerOrder {
  id: string;
  order_date: string;
  item_code: string;
  color_name: string;
  order_quantity: number;
  expected_arrival_start_date: string;
  expected_arrival_end_date: string;
  arrival_date: string | null;
  arrival_quantity: number | null;
  special_note: string;
  remarks: string;
  status: '대기' | '입고완료' | '부분입고' | '지연';
  created_at: string;
  updated_at: string;
}

// 서버 응답 데이터를 클라이언트 데이터로 변환
const convertServerToClient = (serverOrder: ServerOrder): OrderData => {
  return {
    id: serverOrder.id,
    orderDate: serverOrder.order_date ? new Date(serverOrder.order_date) : null,
    itemCode: serverOrder.item_code,
    colorName: serverOrder.color_name,
    orderQuantity: serverOrder.order_quantity,
    expectedArrivalStartDate: serverOrder.expected_arrival_start_date ? new Date(serverOrder.expected_arrival_start_date) : null,
    expectedArrivalEndDate: serverOrder.expected_arrival_end_date ? new Date(serverOrder.expected_arrival_end_date) : null,
    arrivalDate: serverOrder.arrival_date ? new Date(serverOrder.arrival_date) : null,
    arrivalQuantity: serverOrder.arrival_quantity,
    specialNote: serverOrder.special_note,
    remarks: serverOrder.remarks,
    status: serverOrder.status
  };
};

// 클라이언트 데이터를 서버 데이터로 변환
const convertClientToServer = (clientOrder: OrderData) => {
  // 날짜 변환 헬퍼 함수
  const formatDate = (date: Date | null): string | null => {
    if (!date) return null;
    // 타임존 문제를 해결하기 위해 날짜를 로컬 시간으로 처리
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 서버에서 기대하는 필드 이름으로 변환
  return {
    order_date: formatDate(clientOrder.orderDate),
    item_code: clientOrder.itemCode,
    color_name: clientOrder.colorName,
    order_quantity: clientOrder.orderQuantity,
    expected_arrival_start_date: formatDate(clientOrder.expectedArrivalStartDate),
    expected_arrival_end_date: formatDate(clientOrder.expectedArrivalEndDate),
    arrival_date: formatDate(clientOrder.arrivalDate),
    arrival_quantity: clientOrder.arrivalQuantity,
    special_note: clientOrder.specialNote,
    remarks: clientOrder.remarks,
    status: clientOrder.status
  };
};

// API 함수들
export const orderApi = {
  // 모든 발주 목록 조회
  async getOrders(year?: string, month?: string, search?: string) {
    try {
      const params: Record<string, string> = {};
      if (year) params.year = year;
      if (month) params.month = month;
      if (search) params.search = search;
      
      const response = await apiClient.get('/orders', { params });
      return response.data.map(convertServerToClient);
    } catch (error) {
      console.error('발주 목록 조회 오류:', error);
      throw error;
    }
  },
  
  // 특정 발주 조회
  async getOrder(id: string) {
    try {
      const response = await apiClient.get(`/orders/${id}`);
      return convertServerToClient(response.data);
    } catch (error) {
      console.error('발주 정보 조회 오류:', error);
      throw error;
    }
  },
  
  // 발주 생성
  async createOrder(orderData: OrderData) {
    try {
      console.log('발주 생성 요청 데이터:', orderData);
      const serverData = convertClientToServer(orderData);
      console.log('서버로 전송되는 데이터:', serverData);
      const response = await apiClient.post('/orders', serverData);
      return response.data;
    } catch (error) {
      console.error('발주 생성 오류:', error);
      throw error;
    }
  },
  
  // 발주 수정
  async updateOrder(id: string, orderData: OrderData) {
    try {
      const response = await apiClient.put(`/orders/${id}`, convertClientToServer(orderData));
      return response.data;
    } catch (error) {
      console.error('발주 수정 오류:', error);
      throw error;
    }
  },
  
  // 발주 삭제
  async deleteOrder(id: string) {
    try {
      const response = await apiClient.delete(`/orders/${id}`);
      return response.data;
    } catch (error) {
      console.error('발주 삭제 오류:', error);
      throw error;
    }
  }
};

// 재고 데이터 타입 정의
export interface InventoryItem {
  id: number;
  item_name: string;
  color: string | null;
  stock: number;
  safety_stock: number;
  unit: string;
  location: string | null;
  updated_at: string;
  visible: number; // 0: 삭제됨, 1: 활성 상태
}

// 재고 API 함수들
export const inventoryApi = {
  // 모든 재고 목록 조회
  async getInventory() {
    try {
      const response = await apiClient.get('/inventory');
      return response.data;
    } catch (error) {
      console.error('재고 목록 조회 오류:', error);
      throw error;
    }
  },

  // 재고 추가
  async addInventory(itemData: InventoryItem) {
    try {
      const response = await apiClient.post('/inventory', itemData);
      return response.data;
    } catch (error) {
      console.error('재고 추가 오류:', error);
      throw error;
    }
  },

  // 재고 수정
  async updateInventory(id: number, itemData: Partial<InventoryItem>) {
    try {
      const response = await apiClient.put(`/inventory/${id}`, itemData);
      return response.data;
    } catch (error) {
      console.error('재고 수정 오류:', error);
      throw error;
    }
  },

  // 재고 삭제
  async deleteInventory(id: number) {
    try {
      const response = await apiClient.delete(`/inventory/${id}`);
      return response.data;
    } catch (error) {
      console.error('재고 삭제 오류:', error);
      throw error;
    }
  },

  // 재고 로그 조회
  async getInventoryLogs(id: number) {
    try {
      const response = await apiClient.get(`/inventory/${id}/logs`);
      return response.data;
    } catch (error) {
      console.error('재고 로그 조회 오류:', error);
      throw error;
    }
  },

  // 재고 복구
  async restoreInventory(id: number) {
    try {
      const response = await apiClient.put(`/inventory/${id}/restore`);
      return response.data;
    } catch (error) {
      console.error('재고 복구 오류:', error);
      throw error;
    }
  }
};

// 연차 데이터 타입 정의
export interface LeaveData {
  id?: string;
  userid: string;
  name: string;
  leaveType: string;
  startDate: Date | null;
  endDate: Date | null;
  reason: string;
  status?: 'pending' | 'approved' | 'rejected';
  appliedAt?: string;
  reviewedAt?: string | undefined;
  reviewedBy?: string | undefined;
}

// 서버 연차 응답 데이터 타입 정의
export interface ServerLeave {
  id: string;
  userid: string;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string | null;
  approved_at: string | null;
  approver_name: string | null;
}

// 서버 응답 데이터를 클라이언트 데이터로 변환 (연차)
const convertServerLeaveToClient = (serverLeave: ServerLeave): LeaveData => {
  return {
    id: serverLeave.id,
    userid: serverLeave.userid,
    name: serverLeave.employee_name,
    leaveType: serverLeave.leave_type,
    startDate: serverLeave.start_date ? new Date(serverLeave.start_date) : null,
    endDate: serverLeave.end_date ? new Date(serverLeave.end_date) : null,
    reason: serverLeave.reason,
    status: serverLeave.status,
    appliedAt: serverLeave.created_at,
    reviewedAt: serverLeave.approved_at || undefined,
    reviewedBy: serverLeave.approver_name || undefined
  };
};

// 클라이언트 데이터를 서버 데이터로 변환 (연차)
const convertClientLeaveToServer = (clientLeave: LeaveData) => {
  // 날짜 변환 헬퍼 함수
  const formatDate = (date: Date | null): string | null => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    userid: clientLeave.userid,
    employee_name: clientLeave.name,
    leave_type: clientLeave.leaveType,
    start_date: formatDate(clientLeave.startDate),
    end_date: formatDate(clientLeave.endDate),
    reason: clientLeave.reason
  };
};

// 연차 API 함수들
export const leaveApi = {
  // 연차 신청
  async applyLeave(leaveData: LeaveData) {
    try {
      console.log('연차 신청 요청 데이터:', leaveData);
      const serverData = convertClientLeaveToServer(leaveData);
      console.log('서버로 전송되는 데이터:', serverData);
      const response = await apiClient.post('/leave/apply', serverData);
      return response.data;
    } catch (error) {
      console.error('연차 신청 오류:', error);
      throw error;
    }
  },

  // 연차 목록 조회
  async getLeaveList(userid?: string) {
    try {
      const params: Record<string, string> = {};
      if (userid) params.userid = userid;
      
      const response = await apiClient.get('/leave/list', { params });
      return response.data.map(convertServerLeaveToClient);
    } catch (error) {
      console.error('연차 목록 조회 오류:', error);
      throw error;
    }
  },

  // 연차 상태 업데이트 (관리자용)
  async updateLeaveStatus(leaveId: string, status: 'approved' | 'rejected') {
    try {
      const response = await apiClient.put(`/leave/${leaveId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('연차 상태 업데이트 오류:', error);
      throw error;
    }
  },

  // 특정 연차 정보 조회
  async getLeave(leaveId: string) {
    try {
      const response = await apiClient.get(`/leave/${leaveId}`);
      return convertServerLeaveToClient(response.data);
    } catch (error) {
      console.error('연차 정보 조회 오류:', error);
      throw error;
    }
  }
};