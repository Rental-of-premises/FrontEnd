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
        background: 'rgba(235, 248, 245, 0.85)',
        backdropFilter: 'blur(12px)',
        padding: '48px 56px', 
        borderRadius: '24px', 
        marginBottom: '48px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ 
          fontSize: '38px', 
          fontWeight: '800', 
          letterSpacing: '-0.03em',
          color: '#0f172a',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          margin: '0 0 12px 0'
        }}>
          Добро пожаловать, {user?.name || 'Пользователь'}!
        </h1>
        <p style={{ 
          color: '#475569', 
          fontSize: '18px', 
          margin: 0,
          fontWeight: '500',
          letterSpacing: '-0.01em'
        }}>
          Управляйте своими бронированиями и помещениями
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
        
        {/* Карточка "Мои бронирования" */}
        <Link to="/my-bookings" style={{ textDecoration: 'none' }}>
          <div style={{ 
            background: 'rgba(235, 248, 245, 0.85)',
            backdropFilter: 'blur(12px)',
            borderRadius: '24px', 
            padding: '40px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
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
            e.currentTarget.style.boxShadow = '0 30px 40px -10px rgba(40, 80, 167, 0.15)'
            e.currentTarget.style.borderColor = '#2850a7'
            const btn = e.currentTarget.querySelector('.card-action-btn');
            if (btn) {
              btn.style.background = 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)';
              btn.style.color = '#ffffff';
              btn.style.boxShadow = '0 4px 12px rgba(40, 80, 167, 0.25)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
            const btn = e.currentTarget.querySelector('.card-action-btn');
            if (btn) {
              btn.style.background = 'rgba(255, 255, 255, 0.7)';
              btn.style.color = '#334155';
              btn.style.boxShadow = 'none';
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
              <p style={{ color: '#475569', fontSize: '16px', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
                Посмотреть все ваши бронирования в календаре
              </p>
            </div>
            <div className="card-action-btn" style={{ 
              marginTop: '40px', 
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(8px)',
              color: '#334155', 
              fontWeight: '600', 
              fontSize: '15px', 
              padding: '14px 24px', 
              borderRadius: '14px', 
              textAlign: 'center',
              transition: 'all 0.2s ease',
              border: '1px solid rgba(255, 255, 255, 0.4)'
            }}>
              Перейти к календарю
            </div>
          </div>
        </Link>

        {/* Карточка "Мои помещения" */}
        <Link to="/my-rooms" style={{ textDecoration: 'none' }}>
          <div style={{ 
            background: 'rgba(235, 248, 245, 0.85)',
            backdropFilter: 'blur(12px)',
            borderRadius: '24px', 
            padding: '40px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
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
            e.currentTarget.style.boxShadow = '0 30px 40px -10px rgba(40, 80, 167, 0.15)'
            e.currentTarget.style.borderColor = '#2850a7'
            const btn = e.currentTarget.querySelector('.card-action-btn');
            if (btn) {
              btn.style.background = 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)';
              btn.style.color = '#ffffff';
              btn.style.boxShadow = '0 4px 12px rgba(40, 80, 167, 0.25)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
            const btn = e.currentTarget.querySelector('.card-action-btn');
            if (btn) {
              btn.style.background = 'rgba(255, 255, 255, 0.7)';
              btn.style.color = '#334155';
              btn.style.boxShadow = 'none';
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
              <p style={{ color: '#475569', fontSize: '16px', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
                Управляйте своими помещениями
              </p>
            </div>
            <div className="card-action-btn" style={{ 
              marginTop: '40px', 
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(8px)',
              color: '#334155', 
              fontWeight: '600', 
              fontSize: '15px', 
              padding: '14px 24px', 
              borderRadius: '14px', 
              textAlign: 'center',
              transition: 'all 0.2s ease',
              border: '1px solid rgba(255, 255, 255, 0.4)'
            }}>
              Управлять
            </div>
          </div>
        </Link>

        {/* Карточка "Новое бронирование" */}
        <Link to="/catalog" style={{ textDecoration: 'none' }}>
          <div style={{ 
            background: 'rgba(235, 248, 245, 0.85)',
            backdropFilter: 'blur(12px)',
            borderRadius: '24px', 
            padding: '40px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
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
            e.currentTarget.style.boxShadow = '0 30px 40px -10px rgba(40, 80, 167, 0.15)'
            e.currentTarget.style.borderColor = '#2850a7'
            const btn = e.currentTarget.querySelector('.card-action-btn');
            if (btn) {
              btn.style.background = 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)';
              btn.style.color = '#ffffff';
              btn.style.boxShadow = '0 4px 12px rgba(40, 80, 167, 0.25)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
            const btn = e.currentTarget.querySelector('.card-action-btn');
            if (btn) {
              btn.style.background = 'rgba(255, 255, 255, 0.7)';
              btn.style.color = '#334155';
              btn.style.boxShadow = 'none';
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
              <p style={{ color: '#475569', fontSize: '16px', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
                Найти и забронировать помещение
              </p>
            </div>
            <div className="card-action-btn" style={{ 
              marginTop: '40px', 
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(8px)',
              color: '#334155', 
              fontWeight: '600', 
              fontSize: '15px', 
              padding: '14px 24px', 
              borderRadius: '14px', 
              textAlign: 'center',
              transition: 'all 0.2s ease',
              border: '1px solid rgba(255, 255, 255, 0.4)'
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