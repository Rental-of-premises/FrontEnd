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
                verticalAlign: 'middle'
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
              fontWeight: '700'
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          )}
        </span>
        <span className="user-name">{user?.name || 'Пользователь'}</span>
        <span className={`user-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <Link to="/dashboard" className="user-menu-item" onClick={() => setIsOpen(false)}>
            <span className="menu-icon">📊</span>
            <span>Личный кабинет</span>
          </Link>
          <Link to="/settings" className="user-menu-item" onClick={() => setIsOpen(false)}>
            <span className="menu-icon">⚙️</span>
            <span>Настройки профиля</span>
          </Link>
          <hr className="user-menu-divider" />
          <button 
            className="user-menu-item" 
            onClick={handleLogout}
            style={{ color: '#ef4444' }}
          >
            <span className="menu-icon">🚪</span>
            <span>Выйти</span>
          </button>
        </div>
      )}
    </div>
  );
}