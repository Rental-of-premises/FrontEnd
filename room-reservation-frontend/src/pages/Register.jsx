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
        background: 'transparent',
        padding: '40px 24px',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div className="auth-card" style={{
          background: 'rgba(235, 248, 245, 0.95)',
          backdropFilter: 'blur(16px)',
          width: '100%',
          maxWidth: '440px',
          borderRadius: '28px',
          padding: '48px 40px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
          boxSizing: 'border-box'
        }}>
          <div className="auth-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 className="auth-title" style={{ 
              fontSize: '32px', 
              fontWeight: '800', 
              color: '#0f172a', 
              margin: '0 0 8px 0', 
              letterSpacing: '-0.02em',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>Создать аккаунт</h1>
            <p className="auth-subtitle" style={{ 
              color: '#475569', 
              fontSize: '15px', 
              margin: 0,
              fontWeight: '500'
            }}>Присоединяйтесь к нашей платформе</p>
          </div>
          
          {error && (
            <div className="error-message" style={{
              background: 'rgba(254, 242, 242, 0.9)',
              backdropFilter: 'blur(8px)',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '24px',
              border: '1px solid rgba(254, 226, 226, 0.5)',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Имя</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Как вас зовут?"
                required
                style={{
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
                  e.currentTarget.style.borderColor = '#2850a7';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(40, 80, 167, 0.15)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                }}
              />
            </div>
            
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@example.com"
                required
                style={{
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
                  e.currentTarget.style.borderColor = '#2850a7';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(40, 80, 167, 0.15)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                }}
              />
            </div>
            
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Не менее 6 символов"
                required
                style={{
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
                  e.currentTarget.style.borderColor = '#2850a7';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(40, 80, 167, 0.15)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                }}
              />
            </div>
            
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Подтвердите пароль</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                required
                style={{
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
                  e.currentTarget.style.borderColor = '#2850a7';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(40, 80, 167, 0.15)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                }}
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-btn" 
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '14px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 6px 16px rgba(40, 80, 167, 0.35)',
                transition: 'all 0.2s ease',
                marginTop: '10px',
                letterSpacing: '0.3px'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(40, 80, 167, 0.45)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(40, 80, 167, 0.35)';
              }}
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>
          
          <p className="auth-footer" style={{ 
            textAlign: 'center', 
            marginTop: '28px', 
            fontSize: '14px', 
            color: '#475569',
            margin: '28px 0 0 0',
            fontWeight: '500'
          }}>
            Уже есть аккаунт?{' '}
            <Link to="/login" style={{ 
              color: '#2850a7', 
              fontWeight: '700', 
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              borderBottom: '2px solid rgba(40, 80, 167, 0.3)',
              paddingBottom: '2px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#1e3d7c';
              e.currentTarget.style.borderBottomColor = '#2850a7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#2850a7';
              e.currentTarget.style.borderBottomColor = 'rgba(40, 80, 167, 0.3)';
            }}>
              Войти
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}