import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="navbar">
            <div className="navbar-top">
                <div className="navbar-logo">
                    <Link to="/">발주 관리 시스템</Link>
                </div>
                <button className="navbar-toggle" onClick={toggleMenu}>
                    {isMenuOpen ? '✕' : '☰'}
                </button>
            </div>

            <ul className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
                <li>
                    <NavLink
                        to="/list"
                        className={({ isActive }) => isActive ? 'active' : ''}
                    >
                        발주 목록
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to="/form"
                        className={({ isActive }) => isActive ? 'active' : ''}
                    >
                        발주 정보 입력
                    </NavLink>
                </li>

            </ul>
        </nav>
    );
};

export default Navbar;