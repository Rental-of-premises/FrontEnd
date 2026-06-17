// src/pages/Register.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }
    
    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }
    
    setLoading(true)
    
    const result = await register(email, password, name)
    
    if (result.success) {
      navigate('/catalog')
    } else {
      setError(result.error || 'Ошибка регистрации')
    }
    
    setLoading(false)
  }

  return (
    <>
      <Navbar />
      <div className="auth-container" style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '40px 24px',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div className="auth-card" style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '440px',
          borderRadius: '24px',
          padding: '40px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 40px -15px rgba(148, 163, 184, 0.12)',
          boxSizing: 'border-box'
        }}>
          <div className="auth-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 className="auth-title" style={{ fontSize: '30px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Создать аккаунт</h1>
            <p className="auth-subtitle" style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>Присоединяйтесь к нашей платформе</p>
          </div>
          
          {error && (
            <div className="error-message" style={{
              background: '#fef2f2',
              color: '#ef4444',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '24px',
              border: '1px solid #fee2e2',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Имя</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Как вас зовут?"
                required
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '15px',
                  color: '#1e293b',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#2850a7';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(40, 80, 167, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@example.com"
                required
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '15px',
                  color: '#1e293b',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#2850a7';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(40, 80, 167, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Не менее 6 символов"
                required
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '15px',
                  color: '#1e293b',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#2850a7';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(40, 80, 167, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Подтвердите пароль</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                required
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '15px',
                  color: '#1e293b',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#2850a7';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(40, 80, 167, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-btn" 
              disabled={loading}
              style={{
                background: '#2850a7',
                color: '#ffffff',
                border: 'none',
                padding: '14px',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(40, 80, 167, 0.15)',
                transition: 'all 0.2s ease',
                marginTop: '10px'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#1e3d82';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#2850a7';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>
          
          <p className="auth-footer" style={{ 
            textAlign: 'center', 
            marginTop: '28px', 
            fontSize: '14px', 
            color: '#64748b',
            margin: '28px 0 0 0'
          }}>
            Уже есть аккаунт?{' '}
            <Link to="/login" style={{ 
              color: '#2850a7', 
              fontWeight: '600', 
              textDecoration: 'none',
              transition: 'color 0.2s ease'
            }}>
              Войти
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}