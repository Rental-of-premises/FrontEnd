import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
          <p>Добро пожаловать, <strong>{user?.name || 'Пользователь'}</strong>!</p>
          <p>Здесь будут ваши бронирования и помещения для сдачи.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px' }}>
            <h2>Мои бронирования</h2>
            <p style={{ color: '#666' }}>Скоро здесь появится список...</p>
          </div>
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px' }}>
            <h2>Мои помещения</h2>
            <p style={{ color: '#666' }}>Скоро здесь появится список...</p>
          </div>
        </div>
      </div>
    </>
  )
}