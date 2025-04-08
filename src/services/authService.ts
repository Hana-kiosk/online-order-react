import axios from 'axios';
import { LoginCredentials, LoginResponse, User } from '../types/auth';

// API 클라이언트 생성 (기존 API_URL 재사용)
// const API_URL = 'https://port-0-online-order-flask-m47pn82w3295ead8.sel4.cloudtype.app/api';
const API_URL = 'http://localhost:5000/api';

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

export const authService = {
  // 로그인 함수
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('로그인 오류:', error);
      throw error;
    }
  },

  // 현재 사용자 정보 가져오기
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('사용자 정보 가져오기 오류:', error);
      // 토큰이 만료되었거나 유효하지 않은 경우
      localStorage.removeItem('token');
      return null;
    }
  },

  // 로그아웃 함수
  logout(): void {
    localStorage.removeItem('token');
  }
};

export default authService;