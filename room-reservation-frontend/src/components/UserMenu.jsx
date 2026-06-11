// src/components/UserMenu.jsx
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { user } = useAuth();

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="user-menu-container" ref={menuRef}>
      <button 
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="user-avatar"></span>
        <span className="user-name">{user?.name || 'Пользователь'}</span>
        <span className={`user-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <Link to="/dashboard" className="user-menu-item" onClick={() => setIsOpen(false)}>
            <span className="menu-icon"></span>
            <span>Личный кабинет</span>
          </Link>
          <Link to="/settings" className="user-menu-item" onClick={() => setIsOpen(false)}>
            <span className="menu-icon"></span>
            <span>Настройки профиля</span>
          </Link>
        </div>
      )}
    </div>
  );
}