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
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          {status === 'loading' && (
            <>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
              <h1 className="auth-title">Подтверждение email</h1>
              <p className="auth-subtitle">Пожалуйста, подождите...</p>
              <div className="loader" style={{ minHeight: '60px' }}>
                <div className="spinner"></div>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
              <h1 className="auth-title" style={{ color: '#16a34a' }}>Email подтверждён!</h1>
              <p className="auth-subtitle">{message}</p>
              <Link to="/login">
                <button className="auth-btn" style={{ marginTop: '24px' }}>
                  Войти в аккаунт
                </button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
              <h1 className="auth-title" style={{ color: '#dc2626' }}>Ошибка подтверждения</h1>
              <p className="auth-subtitle" style={{ color: '#dc2626' }}>{message}</p>
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Link to="/login">
                  <button className="auth-btn">Войти</button>
                </Link>
                <Link to="/register">
                  <button className="auth-btn" style={{ background: '#6b7280' }}>Зарегистрироваться</button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}