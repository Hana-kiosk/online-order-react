import { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import './Navbar.css';

// Navbar.css에 추가할 스타일:
/*
.user-info {
    padding: 15px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin-top: 20px;
}

.username {
    color: #fff;
    font-weight: 500;
    display: block;
    opacity: 0.9;
}

.logout-button {
    background: none;
    border: none;
    color: #fff;
    padding: 12px 20px;
    text-align: left;
    width: 100%;
    cursor: pointer;
    transition: all 0.3s;
    border-radius: 0;
    font-size: 1rem;
    display: flex;
    align-items: center;
}

.logout-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #f44336;
}
*/

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // 현재 경로가 발주 관리 시스템 내에 있는지 확인
    const isInOrderSystem = location.pathname.startsWith('/order-system');
    // 메인 페이지에 있는지 확인
    const isInMainPage = location.pathname === '/';

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-top">
                <div className="navbar-logo">
                    <Link to="/">하나플랫폼 물류시스템</Link>
                </div>
                <button className="navbar-toggle" onClick={toggleMenu}>
                    {isMenuOpen ? '✕' : '☰'}
                </button>
            </div>

            <ul className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
                {/* 메인 페이지에 있을 때는 발주 관리 시스템 메뉴만 표시 */}
                {isInMainPage && (
                    <li className="menu-section main-page">
                        <Link to="/order-system" className="section-title">발주 관리 시스템</Link>
                    </li>
                )}
                
                {/* 발주 관리 시스템 내부에 있을 때는 하위 메뉴 포함 표시 */}
                {isInOrderSystem && (
                    <>
                        <li className="menu-section">
                            <Link to="/order-system" className="section-title">발주 관리 시스템</Link>
                        </li>
                        <li>
                            <NavLink
                                to="/order-system/list"
                                className={({ isActive }) => isActive ? 'active' : ''}
                            >
                                발주 목록
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/order-system/form"
                                className={({ isActive }) => isActive ? 'active' : ''}
                            >
                                발주 정보 입력
                            </NavLink>
                        </li>
                    </>
                )}
                {user && (
                    <>
                        <li className="user-info">
                            <span className="username">{user.name} ({user.role})</span>
                        </li>
                        <li>
                            <button className="logout-button" onClick={handleLogout}>
                                로그아웃
                            </button>
                        </li>
                    </>
                )}
            </ul>
        </nav>
    );
};

export default Navbar;