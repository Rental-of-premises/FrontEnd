// src/pages/Login.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const result = await login(email, password)
    
    if (result.success) {
      navigate('/catalog')
    } else {
      setError(result.error || 'Ошибка входа')
    }
    
    setLoading(false)
  }

  return (
    <>
      <Navbar />
      <div className="auth-container" style={{ 
        minHeight: 'calc(100vh - 70px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#f8fafc',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div className="auth-card" style={{ 
          background: '#ffffff', 
          padding: '40px', 
          borderRadius: '24px', 
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)', 
          maxWidth: '440px', 
          width: '100%',
          boxSizing: 'border-box',
          border: '1px solid #e2e8f0'
        }}>
          <div className="auth-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 className="auth-title" style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: '#1e293b', 
              margin: '0 0 8px 0',
              letterSpacing: '-0.5px'
            }}>Добро пожаловать!</h1>
            <p className="auth-subtitle" style={{ 
              fontSize: '15px', 
              color: '#64748b', 
              margin: 0 
            }}>Войдите в свой аккаунт</p>
          </div>
          
          {error && (
            <div className="error-message" style={{ 
              background: '#fef2f2', 
              color: '#ef4444', 
              padding: '12px 16px', 
              borderRadius: '12px', 
              marginBottom: '24px', 
              fontSize: '14px',
              border: '1px solid #fee2e2',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@example.com"
                required
                style={{ 
                  width: '100%',
                  padding: '12px 16px', 
                  borderRadius: '12px', 
                  border: '1px solid #cbd5e1', 
                  fontSize: '15px',
                  color: '#334155',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2850a7'
                  e.target.style.boxShadow = '0 0 0 4px rgba(40, 80, 167, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#cbd5e1'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
            
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ 
                  width: '100%',
                  padding: '12px 16px', 
                  borderRadius: '12px', 
                  border: '1px solid #cbd5e1', 
                  fontSize: '15px',
                  color: '#334155',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2850a7'
                  e.target.style.boxShadow = '0 0 0 4px rgba(40, 80, 167, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#cbd5e1'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-btn" 
              disabled={loading}
              style={{ 
                width: '100%',
                background: 'linear-gradient(135deg, #2850a7 0%, #1e3c82 100%)', 
                color: '#ffffff', 
                border: 'none', 
                padding: '14px', 
                borderRadius: '12px', 
                fontSize: '16px', 
                fontWeight: '600', 
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(40, 80, 167, 0.2)',
                transition: 'all 0.2s ease',
                marginTop: '8px',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(40, 80, 167, 0.3)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 80, 167, 0.2)'
              }}
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
          
          <p className="auth-footer" style={{ 
            textAlign: 'center', 
            marginTop: '28px', 
            margin: '28px 0 0 0',
            fontSize: '14px', 
            color: '#64748b' 
          }}>
            Нет аккаунта?{' '}
            <Link to="/register" style={{ 
              color: '#2850a7', 
              textDecoration: 'none', 
              fontWeight: '600',
              transition: 'color 0.2s'
            }}>
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}