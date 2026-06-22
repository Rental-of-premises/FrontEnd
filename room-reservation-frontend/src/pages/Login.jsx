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
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div className="auth-card" style={{ 
        background: 'rgba(235, 248, 245, 0.95)',
        backdropFilter: 'blur(16px)',
        padding: '48px 40px', 
        borderRadius: '28px', 
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)', 
        maxWidth: '440px', 
        width: '100%',
        boxSizing: 'border-box',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <div className="auth-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 className="auth-title" style={{ 
            fontSize: '32px', 
            fontWeight: '800', 
            color: '#0f172a', 
            margin: '0 0 8px 0',
            letterSpacing: '-0.5px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>Добро пожаловать!</h1>
          <p className="auth-subtitle" style={{ 
            fontSize: '15px', 
            color: '#475569',
            fontWeight: '500',
            margin: 0 
          }}>Войдите в свой аккаунт</p>
        </div>
        
        {error && (
          <div className="error-message" style={{ 
            background: 'rgba(254, 242, 242, 0.9)',
            backdropFilter: 'blur(8px)',
            color: '#dc2626', 
            padding: '12px 16px', 
            borderRadius: '12px', 
            marginBottom: '24px', 
            fontSize: '14px',
            border: '1px solid rgba(254, 226, 226, 0.5)',
            fontWeight: '600'
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
                padding: '14px 18px', 
                borderRadius: '12px', 
                border: '1px solid rgba(255, 255, 255, 0.4)',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                fontSize: '15px',
                color: '#1e293b',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2850a7'
                e.target.style.boxShadow = '0 0 0 4px rgba(40, 80, 167, 0.15)'
                e.target.style.background = 'rgba(255, 255, 255, 1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)'
                e.target.style.boxShadow = 'none'
                e.target.style.background = 'rgba(255, 255, 255, 0.9)'
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
                padding: '14px 18px', 
                borderRadius: '12px', 
                border: '1px solid rgba(255, 255, 255, 0.4)',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                fontSize: '15px',
                color: '#1e293b',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2850a7'
                e.target.style.boxShadow = '0 0 0 4px rgba(40, 80, 167, 0.15)'
                e.target.style.background = 'rgba(255, 255, 255, 1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)'
                e.target.style.boxShadow = 'none'
                e.target.style.background = 'rgba(255, 255, 255, 0.9)'
              }}
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-btn" 
            disabled={loading}
            style={{ 
              width: '100%',
              background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)', 
              color: '#ffffff', 
              border: 'none', 
              padding: '14px', 
              borderRadius: '12px', 
              fontSize: '16px', 
              fontWeight: '700', 
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 6px 16px rgba(40, 80, 167, 0.35)',
              transition: 'all 0.2s ease',
              marginTop: '8px',
              boxSizing: 'border-box',
              letterSpacing: '0.3px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(40, 80, 167, 0.45)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(40, 80, 167, 0.35)'
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
          color: '#475569',
          fontWeight: '500'
        }}>
          Нет аккаунта?{' '}
          <Link to="/register" style={{ 
            color: '#2850a7', 
            textDecoration: 'none', 
            fontWeight: '700',
            transition: 'all 0.2s',
            borderBottom: '2px solid rgba(40, 80, 167, 0.3)',
            paddingBottom: '2px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#1e3d7c'
            e.currentTarget.style.borderBottomColor = '#2850a7'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#2850a7'
            e.currentTarget.style.borderBottomColor = 'rgba(40, 80, 167, 0.3)'
          }}>
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  </>
)
}