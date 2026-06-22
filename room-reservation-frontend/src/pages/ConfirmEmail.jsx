import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'

const API_URL = 'https://team3.verstack.ru';

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Токен не указан')
      return
    }

    const confirmEmail = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/confirm-email?token=${token}`, {
          method: 'GET',
          credentials: 'include'
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message || 'Email успешно подтверждён! Теперь вы можете войти.')
        } else {
          setStatus('error')
          setMessage(data.error || 'Ошибка при подтверждении email')
        }
      } catch (err) {
        setStatus('error')
        setMessage('Ошибка соединения с сервером')
      }
    }

    confirmEmail()
  }, [token])

  return (
    <>
      <Navbar />
      <div className="auth-container" style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        padding: '40px 24px',
        boxSizing: 'border-box'
      }}>
        <div className="auth-card" style={{ 
          textAlign: 'center',
          background: 'rgba(235, 248, 245, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '28px',
          padding: '48px 40px',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
          boxSizing: 'border-box'
        }}>
          {status === 'loading' && (
            <>
              <div style={{ 
                fontSize: '56px', 
                marginBottom: '20px',
                animation: 'pulse 2s ease-in-out infinite'
              }}>⏳</div>
              <h1 className="auth-title" style={{ 
                color: '#0f172a',
                fontSize: '28px',
                fontWeight: '800',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                margin: '0 0 8px 0'
              }}>Подтверждение email</h1>
              <p className="auth-subtitle" style={{ 
                color: '#475569',
                fontSize: '15px',
                fontWeight: '500',
                margin: 0
              }}>Пожалуйста, подождите...</p>
              <div className="loader" style={{ minHeight: '60px', marginTop: '20px' }}>
                <div className="spinner"></div>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{ 
                fontSize: '64px', 
                marginBottom: '20px'
              }}>✅</div>
              <h1 className="auth-title" style={{ 
                color: '#16a34a',
                fontSize: '28px',
                fontWeight: '800',
                textShadow: '0 2px 4px rgba(22, 163, 74, 0.2)',
                margin: '0 0 12px 0'
              }}>Email подтверждён!</h1>
              <p className="auth-subtitle" style={{ 
                color: '#334155',
                fontSize: '15px',
                fontWeight: '500',
                lineHeight: '1.6',
                margin: '0 0 24px 0'
              }}>{message}</p>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <button className="auth-btn" style={{ 
                  marginTop: '0',
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(40, 80, 167, 0.35)',
                  transition: 'all 0.2s',
                  letterSpacing: '0.3px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(40, 80, 167, 0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(40, 80, 167, 0.35)';
                }}>
                  Войти в аккаунт
                </button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ 
                fontSize: '64px', 
                marginBottom: '20px'
              }}>❌</div>
              <h1 className="auth-title" style={{ 
                color: '#dc2626',
                fontSize: '28px',
                fontWeight: '800',
                textShadow: '0 2px 4px rgba(220, 38, 38, 0.2)',
                margin: '0 0 12px 0'
              }}>Ошибка подтверждения</h1>
              <p className="auth-subtitle" style={{ 
                color: '#475569',
                fontSize: '15px',
                fontWeight: '500',
                lineHeight: '1.6',
                margin: '0 0 24px 0',
                background: 'rgba(254, 242, 242, 0.7)',
                backdropFilter: 'blur(8px)',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(254, 226, 226, 0.5)'
              }}>{message}</p>
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Link to="/login" style={{ textDecoration: 'none', flex: 1 }}>
                  <button className="auth-btn" style={{ 
                    width: '100%',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 6px 16px rgba(40, 80, 167, 0.35)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(40, 80, 167, 0.45)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(40, 80, 167, 0.35)';
                  }}>
                    Войти
                  </button>
                </Link>
                <Link to="/register" style={{ textDecoration: 'none', flex: 1 }}>
                  <button className="auth-btn" style={{ 
                    width: '100%',
                    padding: '14px',
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(8px)',
                    color: '#475569',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}>
                    Зарегистрироваться
                  </button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}