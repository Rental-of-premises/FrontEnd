import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

export default function Settings() {
  const { user, logout, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = async () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      await logout();
      navigate('/login');
    }
  };

  const handleDeleteAccount = async () => {
    setError('');
    setIsDeleting(true);
    const result = await deleteAccount();
    
    if (result.success) {
      alert('Аккаунт успешно удалён');
      navigate('/');
    } else {
      setError(result.error || 'Ошибка при удалении аккаунта');
      setShowConfirm(false);
    }
    setIsDeleting(false);
  };

  return (
    <>
      <Navbar />
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '50px 24px',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
        }}>
          
          <div style={{
            background: 'linear-gradient(135deg, #2850a7 0%, #3b82f6 100%)',
            padding: '44px 48px',
            borderRadius: '28px',
            marginBottom: '36px',
            color: '#ffffff',
            boxShadow: '0 25px 50px rgba(40,80,167,.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px'
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '38px', fontWeight: '700', letterSpacing: '-0.03em' }}>Настройки профиля</h1>
              <p style={{ marginTop: '10px', marginBottom: 0, color: '#e0e7ff', fontSize: '16px' }}>Управление аккаунтом</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(12px)', padding: '16px 22px', borderRadius: '16px' }}>
              <div style={{ fontSize: '13px', opacity: '.85' }}>Авторизован как</div>
              <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '4px' }}>{user?.name || 'Пользователь'}</div>
            </div>
          </div>

          <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: '#2850a7', fontWeight: '600', marginBottom: '28px' }}>
            ← Вернуться в личный кабинет
          </Link>

          <div style={{ background: '#ffffff', borderRadius: '28px', padding: '32px', boxShadow: '0 12px 30px rgba(15,23,42,.06)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2850a7 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '30px',
                fontWeight: '700',
                flexShrink: 0
              }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '28px', fontWeight: '700' }}>{user?.name || 'Пользователь'}</h2>
                <p style={{ marginTop: '6px', marginBottom: 0, color: '#64748b', fontSize: '15px' }}>{user?.email || '—'}</p>
              </div>
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '28px', padding: '32px', boxShadow: '0 12px 30px rgba(15,23,42,.06)', marginBottom: '24px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '24px', color: '#0f172a', fontSize: '24px' }}>Информация об аккаунте</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>Имя</div>
                <div style={{ color: '#0f172a', fontSize: '18px', fontWeight: '600' }}>{user?.name || '—'}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>Email</div>
                <div style={{ color: '#0f172a', fontSize: '18px', fontWeight: '600', wordBreak: 'break-word' }}>{user?.email || '—'}</div>
              </div>
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '28px', padding: '32px', boxShadow: '0 12px 30px rgba(15,23,42,.06)', marginBottom: '24px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '12px', color: '#0f172a', fontSize: '24px' }}>Безопасность</h2>
            <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '28px' }}>Завершите текущую сессию и выйдите из аккаунта на этом устройстве.</p>
            <button onClick={handleLogout} style={{ border: 'none', background: 'linear-gradient(135deg, #2850a7 0%, #3b82f6 100%)', color: '#ffffff', padding: '16px 28px', borderRadius: '14px', fontWeight: '600', fontSize: '16px', cursor: 'pointer', transition: 'all .2s ease' }}>
              Выйти из аккаунта
            </button>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '28px', padding: '32px', boxShadow: '0 12px 30px rgba(15,23,42,.06)', border: '1px solid #fee2e2' }}>
            <h2 style={{ marginTop: 0, marginBottom: '12px', color: '#dc2626', fontSize: '24px' }}>Удаление аккаунта</h2>
            <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '28px' }}>Удаление аккаунта приведёт к безвозвратной потере всех данных: ваших помещений, бронирований и истории.</p>
            
            {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
            
            {!showConfirm ? (
              <button onClick={() => setShowConfirm(true)} style={{ border: 'none', background: '#dc2626', color: '#ffffff', padding: '14px 28px', borderRadius: '12px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: 'all .2s ease' }}>
                Удалить аккаунт
              </button>
            ) : (
              <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '16px', border: '1px solid #fecaca' }}>
                <p style={{ color: '#dc2626', fontWeight: '600', marginTop: 0, marginBottom: '16px' }}>Вы уверены? Это действие необратимо.</p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button onClick={handleDeleteAccount} disabled={isDeleting} style={{ border: 'none', background: '#dc2626', color: '#ffffff', padding: '12px 24px', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.6 : 1 }}>
                    {isDeleting ? 'Удаление...' : 'Да, удалить'}
                  </button>
                  <button onClick={() => setShowConfirm(false)} style={{ border: '1px solid #e2e8f0', background: '#ffffff', color: '#64748b', padding: '12px 24px', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}