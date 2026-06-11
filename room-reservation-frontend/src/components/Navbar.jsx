import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="logo">Office Space</Link>
          <div className="nav-links">
            <Link to="/catalog">Каталог</Link>
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
          <Link to="/catalog">Каталог</Link>
          
          {user ? (
            <>
              <Link to="/dashboard" className="user-name">
                {user.name}
              </Link>
            </>
          ) : (
            <Link to="/login" className="login-btn">Войти</Link>
          )}
        </div>
      </div>
    </nav>
  );
}