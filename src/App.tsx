import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import OrderForm from './OrderForm';
import OrderList from './OrderList';
import OrderEdit from './OrderEdit';
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
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/form" element={<OrderForm />} />
            <Route path="/list" element={<OrderList />} />
            <Route path="/edit/:orderId" element={<OrderEdit />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;