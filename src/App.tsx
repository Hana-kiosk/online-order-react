import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import OrderForm from './OrderForm';
import OrderList from './OrderList';
import OrderEdit from './OrderEdit';
import LoginPage from './auth/LoginPage';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/protectedRoute';
import './App.css';

// 홈 페이지 컴포넌트에 네비게이션 버튼 포함
const Home = () => {
  return (
    <div className="home-container">
      <h1>발주 관리 시스템에 오신 것을 환영합니다</h1>
      <p>왼쪽 메뉴에서 원하는 기능을 선택하세요.</p>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* 보호된 라우트 */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div className="app-container">
                  <Navbar />
                  <div className="content">
                    <Home />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/form"
            element={
              <ProtectedRoute>
                <div className="app-container">
                  <Navbar />
                  <div className="content">
                    <OrderForm />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/list"
            element={
              <ProtectedRoute>
                <div className="app-container">
                  <Navbar />
                  <div className="content">
                    <OrderList />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/edit/:orderId"
            element={
              <ProtectedRoute>
                <div className="app-container">
                  <Navbar />
                  <div className="content">
                    <OrderEdit />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          
          {/* 알 수 없는 경로는 홈으로 리다이렉트 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;