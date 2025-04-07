import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import OrderForm from './OrderForm';
import OrderList from './OrderList';
import OrderEdit from './OrderEdit';
import LoginPage from './auth/LoginPage';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/protectedRoute';
import './App.css';
import { useNavigate } from 'react-router-dom';
import InventoryManagement from '../components/inventory/InventoryManagement';

// 플랫폼 메인 홈페이지 컴포넌트
const PlatformHome = () => {
  const navigate = useNavigate();

  return (
    <div className="platform-home-container">
      <h1>하나플랫폼 전산시스템</h1>
      <p>서비스를 선택해주세요</p>
      
      <div className="platform-services">
        <button 
          className="platform-service-button"
          onClick={() => navigate('/order-system')}
        >
          <div className="service-icon">📦</div>
          <div className="service-label">발주 관리 시스템</div>
        </button>
        
        <button 
          className="platform-service-button"
          onClick={() => navigate('/inventory-system')}
        >
          <div className="service-icon">🧮</div>
          <div className="service-label">재고 관리 시스템</div>
        </button>
      </div>
    </div>
  );
};

// 발주 관리 시스템 홈페이지 컴포넌트
const OrderSystemHome = () => {
  const navigate = useNavigate();

  return (
    <div className="platform-home-container">
      <h1>하나플랫폼 발주 관리 시스템</h1>
      <p>아래 버튼을 눌러 원하는 작업을 시작하세요.</p>
      
      <div className="kiosk-buttons">
        <button 
          className="kiosk-button list-button" 
          onClick={() => navigate('/order-system/list')}
        >
          <div className="kiosk-icon">📋</div>
          <div className="kiosk-label">발주 목록 보기</div>
        </button>
        
        <button 
          className="kiosk-button form-button" 
          onClick={() => navigate('/order-system/form')}
        >
          <div className="kiosk-icon">✏️</div>
          <div className="kiosk-label">새 발주 등록</div>
        </button>
      </div>
    </div>
  );
};

// 재고 관리 시스템 홈페이지 컴포넌트
const InventorySystemHome = () => {
  const navigate = useNavigate();

  return (
    <div className="platform-home-container">
      <h1>하나플랫폼 재고 관리 시스템</h1>
      <p>아래 버튼을 눌러 원하는 작업을 시작하세요.</p>
      
      <div className="kiosk-buttons">
        <button 
          className="kiosk-button list-button" 
          onClick={() => navigate('/inventory-system/list')}
        >
          <div className="kiosk-icon">📊</div>
          <div className="kiosk-label">재고 현황 보기</div>
        </button>
      </div>
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
                    <PlatformHome />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          
          {/* 발주 관리 시스템 라우트 */}
          <Route
            path="/order-system"
            element={
              <ProtectedRoute>
                <div className="app-container">
                  <Navbar />
                  <div className="content">
                    <OrderSystemHome />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/order-system/form"
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
            path="/order-system/list"
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
            path="/order-system/edit/:orderId"
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
          
          {/* 재고 관리 시스템 라우트 */}
          <Route
            path="/inventory-system"
            element={
              <ProtectedRoute>
                <div className="app-container">
                  <Navbar />
                  <div className="content">
                    <InventorySystemHome />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/inventory-system/list"
            element={
              <ProtectedRoute>
                <div className="app-container">
                  <Navbar />
                  <div className="content">
                    <InventoryManagement />
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