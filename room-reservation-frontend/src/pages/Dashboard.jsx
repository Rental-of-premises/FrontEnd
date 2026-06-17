// src/pages/Dashboard.jsx
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <>
      <Navbar />
      <div className="dashboard-container" style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '50px 24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}>
        
        <div style={{ 
          background: '#2850a7', 
          padding: '48px 56px', 
          borderRadius: '24px', 
          marginBottom: '48px',
          color: '#ffffff',
          boxShadow: '0 20px 40px -15px rgba(40, 80, 167, 0.25)'
        }}>
          <h1 style={{ 
            fontSize: '38px', 
            fontWeight: '700', 
            marginBottom: '12px', 
            letterSpacing: '-0.03em',
            color: '#ffffff',
            margin: '0 0 12px 0'
          }}>
            Добро пожаловать, {user?.name || 'Пользователь'}!
          </h1>
          <p style={{ 
            color: '#f0f4ff', 
            fontSize: '18px', 
            margin: 0,
            fontWeight: '400',
            letterSpacing: '-0.01em',
            opacity: 0.9
          }}>
            Управляйте своими бронированиями и помещениями
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          
          {/* Карточка "Мои бронирования" */}
          <Link to="/my-bookings" style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: '#ffffff', 
              borderRadius: '24px', 
              padding: '40px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px -2px rgba(148, 163, 184, 0.06)',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)'
              e.currentTarget.style.boxShadow = '0 30px 40px -10px rgba(40, 80, 167, 0.12)'
              e.currentTarget.style.borderColor = '#2850a7'
              const btn = e.currentTarget.querySelector('.card-action-btn');
              if (btn) {
                btn.style.background = '#2850a7';
                btn.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(148, 163, 184, 0.06)'
              e.currentTarget.style.borderColor = '#e2e8f0'
              const btn = e.currentTarget.querySelector('.card-action-btn');
              if (btn) {
                btn.style.background = '#f1f5f9';
                btn.style.color = '#1e293b';
              }
            }}>
              <div>
                <h2 style={{ 
                  color: '#0f172a', 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  marginBottom: '14px', 
                  marginTop: 0,
                  letterSpacing: '-0.02em'
                }}>
                  Мои бронирования
                </h2>
                <p style={{ color: '#475569', fontSize: '16px', lineHeight: '1.6', margin: 0 }}>
                  Посмотреть все ваши бронирования в календаре
                </p>
              </div>
              <div className="card-action-btn" style={{ 
                marginTop: '40px', 
                background: '#f1f5f9', 
                color: '#1e293b', 
                fontWeight: '600', 
                fontSize: '15px', 
                padding: '14px 24px', 
                borderRadius: '14px', 
                textAlign: 'center',
                transition: 'all 0.2s ease',
                border: '1px solid transparent'
              }}>
                Перейти к календарю
              </div>
            </div>
          </Link>

          {/* Карточка "Мои помещения" */}
          <Link to="/my-rooms" style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: '#ffffff', 
              borderRadius: '24px', 
              padding: '40px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px -2px rgba(148, 163, 184, 0.06)',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)'
              e.currentTarget.style.boxShadow = '0 30px 40px -10px rgba(40, 80, 167, 0.12)'
              e.currentTarget.style.borderColor = '#2850a7'
              const btn = e.currentTarget.querySelector('.card-action-btn');
              if (btn) {
                btn.style.background = '#2850a7';
                btn.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(148, 163, 184, 0.06)'
              e.currentTarget.style.borderColor = '#e2e8f0'
              const btn = e.currentTarget.querySelector('.card-action-btn');
              if (btn) {
                btn.style.background = '#f1f5f9';
                btn.style.color = '#1e293b';
              }
            }}>
              <div>
                <h2 style={{ 
                  color: '#0f172a', 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  marginBottom: '14px', 
                  marginTop: 0,
                  letterSpacing: '-0.02em'
                }}>
                  Мои помещения
                </h2>
                <p style={{ color: '#475569', fontSize: '16px', lineHeight: '1.6', margin: 0 }}>
                  Управляйте своими помещениями
                </p>
              </div>
              <div className="card-action-btn" style={{ 
                marginTop: '40px', 
                background: '#f1f5f9', 
                color: '#1e293b', 
                fontWeight: '600', 
                fontSize: '15px', 
                padding: '14px 24px', 
                borderRadius: '14px', 
                textAlign: 'center',
                transition: 'all 0.2s ease',
                border: '1px solid transparent'
              }}>
                Управлять
              </div>
            </div>
          </Link>

          {/* Карточка "Новое бронирование" */}
          <Link to="/catalog" style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: '#ffffff', 
              borderRadius: '24px', 
              padding: '40px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px -2px rgba(148, 163, 184, 0.06)',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)'
              e.currentTarget.style.boxShadow = '0 30px 40px -10px rgba(40, 80, 167, 0.12)'
              e.currentTarget.style.borderColor = '#2850a7'
              const btn = e.currentTarget.querySelector('.card-action-btn');
              if (btn) {
                btn.style.background = '#2850a7';
                btn.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(148, 163, 184, 0.06)'
              e.currentTarget.style.borderColor = '#e2e8f0'
              const btn = e.currentTarget.querySelector('.card-action-btn');
              if (btn) {
                btn.style.background = '#f1f5f9';
                btn.style.color = '#1e293b';
              }
            }}>
              <div>
                <h2 style={{ 
                  color: '#0f172a', 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  marginBottom: '14px', 
                  marginTop: 0,
                  letterSpacing: '-0.02em'
                }}>
                  Новое бронирование
                </h2>
                <p style={{ color: '#475569', fontSize: '16px', lineHeight: '1.6', margin: 0 }}>
                  Найти и забронировать помещение
                </p>
              </div>
              <div className="card-action-btn" style={{ 
                marginTop: '40px', 
                background: '#f1f5f9', 
                color: '#1e293b', 
                fontWeight: '600', 
                fontSize: '15px', 
                padding: '14px 24px', 
                borderRadius: '14px', 
                textAlign: 'center',
                transition: 'all 0.2s ease',
                border: '1px solid transparent'
              }}>
                Открыть каталог
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  )
}