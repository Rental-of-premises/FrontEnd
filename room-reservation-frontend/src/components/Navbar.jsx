import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="navbar">
      <div className="navbar-container">
          Office Space

        
        <div className="nav-links">
          <Link to="/catalog">Каталог</Link>
          
          {user ? (
            <>
              <Link to="/dashboard">Личный кабинет</Link>
              <Link to="/create-room">Post Room</Link>
              <span className="user-name">{user.name}</span>
            </>
          ) : (
            <Link to="/login">Войти</Link>
          )}
        </div>
      </div>
    </nav>
  )
}