// src/components/Navbar.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import UserMenu from './UserMenu';

export default function Navbar() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="logo">Office Space</Link>
          <div className="nav-links">
            <div className="skeleton-text">Загрузка...</div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo">Office Space</Link>
        
        <div className="nav-links">
          {user ? (
            <UserMenu />
          ) : (
            <Link to="/login" className="login-btn">Войти</Link>
          )}
        </div>
      </div>
    </nav>
  );
}