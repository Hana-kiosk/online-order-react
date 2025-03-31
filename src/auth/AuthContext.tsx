import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, LoginCredentials, AuthContextType } from '../types/auth';
import authService from '../services/authService';

// 초기 컨텍스트 상태
const initialAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
};

// 컨텍스트 생성
const AuthContext = createContext<AuthContextType>(initialAuthContext);

// AuthProvider props 타입
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider 컴포넌트
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 사용자 정보 로드
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('사용자 정보 로드 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // 로그인 함수
  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      localStorage.setItem('token', response.token);
      setUser(response.user);
    } catch (error) {
      console.error('로그인 처리 오류:', error);
      throw error;
    }
  };

  // 로그아웃 함수
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 컨텍스트 사용을 위한 커스텀 훅
export const useAuth = () => useContext(AuthContext);

export default AuthContext;