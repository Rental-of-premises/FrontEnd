// src/pages/Dashboard.jsx
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Dashboard() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      await logout()
    }
  }

  return (
    <>
      <Navbar />
      <div className="dashboard-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Приветствие */}
        <div style={{ 
          background: 'linear-gradient(135deg, #0f1a2e, #1a2a3e)', 
          padding: '30px', 
          borderRadius: '16px', 
          marginBottom: '30px',
          color: 'white'
        }}>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Добро пожаловать, {user?.name || 'Пользователь'}!</h1>
          <p style={{ color: '#8899bb' }}>Управляйте своими бронированиями и помещениями</p>
        </div>

        {/* Карточки-ссылки */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          {/* Карточка "Мои бронирования" - ведет на календарь */}
          <Link to="/my-bookings" style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: '#0f1a2e', 
              borderRadius: '16px', 
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              height: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
              <h2 style={{ color: 'white', marginBottom: '8px' }}>Мои бронирования</h2>
              <p style={{ color: '#8899bb' }}>Посмотреть все ваши бронирования в календаре</p>
              <div style={{ marginTop: '16px', color: '#2ecc71' }}>Перейти →</div>
            </div>
          </Link>

          {/* Карточка "Мои помещения" */}
          <Link to="/my-rooms" style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: '#0f1a2e', 
              borderRadius: '16px', 
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              height: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
              <h2 style={{ color: 'white', marginBottom: '8px' }}>Мои помещения</h2>
              <p style={{ color: '#8899bb' }}>Управляйте своими помещениями</p>
              <div style={{ marginTop: '16px', color: '#2ecc71' }}>Скоро →</div>
            </div>
          </Link>

          {/* Карточка "Новое бронирование" */}
          <Link to="/catalog" style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: '#0f1a2e', 
              borderRadius: '16px', 
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              height: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>➕</div>
              <h2 style={{ color: 'white', marginBottom: '8px' }}>Новое бронирование</h2>
              <p style={{ color: '#8899bb' }}>Найти и забронировать помещение</p>
              <div style={{ marginTop: '16px', color: '#2ecc71' }}>Перейти →</div>
            </div>
          </Link>
        </div>

        {/* Кнопка выхода внизу страницы */}
        <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <button 
            onClick={handleLogout}
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: 'white',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </>
  )
}