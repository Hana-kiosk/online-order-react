import { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // 현재 경로가 발주 관리 시스템 내에 있는지 확인
    const isInOrderSystem = location.pathname.startsWith('/order-system');
    // 현재 경로가 재고 관리 시스템 내에 있는지 확인
    const isInInventorySystem = location.pathname.startsWith('/inventory-system');
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
                    <Link to="/">하나플랫폼<br />전산시스템</Link>
                </div>
                <button className="navbar-toggle" onClick={toggleMenu}>
                    {isMenuOpen ? '✕' : '☰'}
                </button>
            </div>

            <ul className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
                {/* 메인 페이지에 있을 때는 발주 관리 시스템과 재고 관리 시스템 메뉴 표시 */}
                {isInMainPage && (
                    <>
                        <li className="menu-section main-page">
                            <Link to="/order-system" className="section-title">발주 관리 시스템</Link>
                        </li>
                        <li className="menu-section main-page">
                            <Link to="/inventory-system" className="section-title">재고 관리 시스템</Link>
                        </li>
                    </>
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

                {/* 재고 관리 시스템 내부에 있을 때는 하위 메뉴 포함 표시 */}
                {isInInventorySystem && (
                    <>
                        <li className="menu-section">
                            <Link to="/inventory-system" className="section-title">재고 관리 시스템</Link>
                        </li>
                        <li>
                            <NavLink
                                to="/inventory-system/list"
                                className={({ isActive }) => isActive ? 'active' : ''}
                            >
                                재고 현황
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