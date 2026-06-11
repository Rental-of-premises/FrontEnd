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
          background: '#2850a7', 
          padding: '30px', 
          borderRadius: '16px', 
          marginBottom: '30px',
          color: 'white'
        }}>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Добро пожаловать, {user?.name || 'Пользователь'}!</h1>
          <p style={{ color: '#cbd5e0' }}>Управляйте своими бронированиями и помещениями</p>
        </div>

        {/* Карточки-ссылки */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          {/* Карточка "Мои бронирования" */}
          <Link to="/my-bookings" style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: '#2850a7', 
              borderRadius: '16px', 
              padding: '24px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}>
              <div>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
                <h2 style={{ color: 'white', marginBottom: '8px' }}>Мои бронирования</h2>
                <p style={{ color: '#cbd5e0' }}>Посмотреть все ваши бронирования в календаре</p>
              </div>
              <div style={{ marginTop: '24px', color: '#ffffff', fontWeight: '500' }}>Перейти →</div>
            </div>
          </Link>

          {/* Карточка "Мои помещения" */}
          <Link to="/my-rooms" style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: '#2850a7', 
              borderRadius: '16px', 
              padding: '24px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}>
              <div>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
                <h2 style={{ color: 'white', marginBottom: '8px' }}>Мои помещения</h2>
                <p style={{ color: '#cbd5e0' }}>Управляйте своими помещениями</p>
              </div>
              <div style={{ marginTop: '24px', color: '#ffffff', fontWeight: '500' }}>Скоро →</div>
            </div>
          </Link>

          {/* Карточка "Новое бронирование" */}
          <Link to="/catalog" style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: '#2850a7', 
              borderRadius: '16px', 
              padding: '24px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}>
              <div>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
                <h2 style={{ color: 'white', marginBottom: '8px' }}>Новое бронирование</h2>
                <p style={{ color: '#cbd5e0' }}>Найти и забронировать помещение</p>
              </div>
              <div style={{ marginTop: '24px', color: '#ffffff', fontWeight: '500' }}>Перейти →</div>
            </div>
          </Link>
        </div>
      </div>
    </>
  )
}