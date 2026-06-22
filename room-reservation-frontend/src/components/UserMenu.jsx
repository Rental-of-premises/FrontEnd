import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const API_URL = 'https://team3.verstack.ru';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetch(`${API_URL}/api/users/${user.id}`, {
        credentials: 'include'
      })
        .then(r => r.json())
        .then(data => {
          if (data.avatar) {
            setAvatarUrl(data.avatar.image_data);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className="user-menu-container" ref={menuRef}>
      <button 
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Меню пользователя"
      >
        <span className="user-avatar">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={user?.name || 'User'} 
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                objectFit: 'cover',
                verticalAlign: 'middle',
                border: '2px solid rgba(255, 255, 255, 0.4)'
              }} 
            />
          ) : (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#2850a7',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '700',
              border: '2px solid rgba(255, 255, 255, 0.4)'
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          )}
        </span>
        <span className="user-name">{user?.name || 'Пользователь'}</span>
        <span className={`user-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="user-menu-dropdown" style={{
          background: 'rgba(235, 248, 245, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
          minWidth: '200px'
        }}>
          <Link 
            to="/dashboard" 
            className="user-menu-item" 
            onClick={() => setIsOpen(false)}
            style={{
              padding: '14px 20px',
              color: '#0f172a',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'background 0.2s',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span className="menu-icon"></span>
            <span>Личный кабинет</span>
          </Link>
          <Link 
            to="/settings" 
            className="user-menu-item" 
            onClick={() => setIsOpen(false)}
            style={{
              padding: '14px 20px',
              color: '#0f172a',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'background 0.2s',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span className="menu-icon"></span>
            <span>Настройки профиля</span>
          </Link>
          <hr className="user-menu-divider" style={{
            border: 'none',
            borderTop: '1px solid rgba(255, 255, 255, 0.3)',
            margin: '0'
          }} />
          <button 
            className="user-menu-item" 
            onClick={handleLogout}
            style={{ 
              color: '#ef4444',
              padding: '14px 20px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              textAlign: 'left',
              background: 'transparent',
              border: 'none'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(254, 226, 226, 0.5)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span className="menu-icon"></span>
            <span>Выйти</span>
          </button>
        </div>
      )}
    </div>
  );
}