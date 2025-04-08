import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isOrderSubMenuOpen, setIsOrderSubMenuOpen] = useState(false);
    const [isInventorySubMenuOpen, setIsInventorySubMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // 현재 경로가 발주 관리 시스템 내에 있는지 확인
    const isInOrderSystem = location.pathname.startsWith('/order-system');
    // 현재 경로가 재고 관리 시스템 내에 있는지 확인
    const isInInventorySystem = location.pathname.startsWith('/inventory-system');

    // 현재 경로에 따라 하위 메뉴 상태 업데이트
    useEffect(() => {
        setIsOrderSubMenuOpen(isInOrderSystem);
        setIsInventorySubMenuOpen(isInInventorySystem);
    }, [isInOrderSystem, isInInventorySystem]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleOrderSubMenu = () => {
        setIsOrderSubMenuOpen(!isOrderSubMenuOpen);
    };

    const toggleInventorySubMenu = () => {
        setIsInventorySubMenuOpen(!isInventorySubMenuOpen);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-top">
                <div className="navbar-logo">
                    <Link to="/">HanaPlatform ERP</Link>
                </div>
                <button className="navbar-toggle" onClick={toggleMenu}>
                    {isMenuOpen ? '✕' : '☰'}
                </button>
            </div>

            {user && (
                <div className="user-info-small">
                    {user.name} ({user.role})<br />아이디로 로그인하셨습니다.
                </div>
            )}

            <ul className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
                {/* 발주 관리 시스템 메뉴 */}
                <li className="menu-section">
                    <div 
                        className={`section-title ${isInOrderSystem ? 'active-section' : ''}`}
                        onClick={toggleOrderSubMenu}
                        style={{ cursor: 'pointer' }}
                    >
                        발주 관리 시스템
                    </div>
                </li>
                {isOrderSubMenuOpen && (
                    <>
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

                {/* 재고 관리 시스템 메뉴 */}
                <li className="menu-section">
                    <div 
                        className={`section-title ${isInInventorySystem ? 'active-section' : ''}`}
                        onClick={toggleInventorySubMenu}
                        style={{ cursor: 'pointer' }}
                    >
                        재고 관리 시스템
                    </div>
                </li>
                {isInventorySubMenuOpen && (
                    <li>
                        <NavLink
                            to="/inventory-system/list"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            재고 현황
                        </NavLink>
                    </li>
                )}
            </ul>

            {user && (
                <div className="logout-container">
                    <button className="logout-button" onClick={handleLogout}>
                        로그아웃
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;