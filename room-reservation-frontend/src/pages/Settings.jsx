import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

const API_URL = 'https://team3.verstack.ru';

export default function Settings() {
  const { user, logout, deleteAccount, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  // ===== СОСТОЯНИЯ ДЛЯ ИМЕНИ =====
  const [newName, setNewName] = useState(user?.name || '');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');

  // ===== СОСТОЯНИЯ ДЛЯ АВАТАРКИ =====
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);

  // ===== СОСТОЯНИЯ ДЛЯ УДАЛЕНИЯ =====
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  // ===== ЗАГРУЗКА ТЕКУЩЕЙ АВАТАРКИ =====
  useEffect(() => {
    if (user?.id) {
      fetch(`${API_URL}/api/users/${user.id}`, {
        credentials: 'include'
      })
        .then(r => r.json())
        .then(data => {
          if (data.avatar) {
            setAvatarUrl(data.avatar.image_data);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  // ===== ОБНОВЛЕНИЕ ПОЛЯ ИМЕНИ ПРИ СМЕНЕ ПОЛЬЗОВАТЕЛЯ =====
  useEffect(() => {
    if (user?.name) {
      setNewName(user.name);
    }
  }, [user]);

  // ===== ИЗМЕНЕНИЕ ИМЕНИ =====
  const handleChangeName = async () => {
    const trimmedName = newName.trim();
    
    if (!trimmedName) {
      setNameError('Имя не может быть пустым');
      return;
    }
    
    if (trimmedName === user?.name) {
      setNameError('Имя не изменилось');
      return;
    }

    setNameError('');
    setNameSuccess('');
    setNameLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/account/settings/profile/change-name`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName })
      });
      
      if (response.ok) {
        const data = await response.json();
        setNameSuccess('✅ Имя успешно обновлено!');
        
        // Обновляем пользователя в localStorage
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        savedUser.name = data.name || trimmedName;
        localStorage.setItem('user', JSON.stringify(savedUser));
        
        // Обновляем состояние
        await refreshUser();
        setNewName(trimmedName);
      } else {
        const errorData = await response.json();
        setNameError(errorData.error || 'Ошибка обновления имени');
      }
    } catch (err) {
      setNameError('❌ Ошибка соединения с сервером');
    } finally {
      setNameLoading(false);
    }
  };

  // ===== ЗАГРУЗКА АВАТАРКИ =====
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setAvatarError('Файл должен быть изображением');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAvatarError('Файл не должен превышать 10MB');
      return;
    }
    
    setAvatarError('');
    setAvatarSuccess('');
    setAvatarLoading(true);
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const response = await fetch(`${API_URL}/api/account/settings/profile/change-avatar`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvatarSuccess('✅ Аватарка успешно обновлена!');
        setAvatarUrl(data.image);
        await refreshUser();
      } else {
        const errorData = await response.json();
        setAvatarError(errorData.error || 'Ошибка загрузки аватарки');
      }
    } catch (err) {
      setAvatarError('❌ Ошибка соединения с сервером');
    } finally {
      setAvatarLoading(false);
      e.target.value = '';
    }
  };

  // ===== ВЫХОД =====
  const handleLogout = async () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      await logout();
      navigate('/login');
    }
  };

  // ===== УДАЛЕНИЕ АККАУНТА =====
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
          
          {/* ===== ЗАГОЛОВОК ===== */}
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
              <h1 style={{ margin: 0, fontSize: '38px', fontWeight: '700', letterSpacing: '-0.03em' }}>
                Настройки профиля
              </h1>
              <p style={{ marginTop: '10px', marginBottom: 0, color: '#e0e7ff', fontSize: '16px' }}>
                Управление аккаунтом
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(12px)', padding: '16px 22px', borderRadius: '16px' }}>
              <div style={{ fontSize: '13px', opacity: '.85' }}>Авторизован как</div>
              <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '4px' }}>
                {user?.name || 'Пользователь'}
              </div>
            </div>
          </div>

          <Link to="/dashboard" style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            textDecoration: 'none', 
            color: '#2850a7', 
            fontWeight: '600', 
            marginBottom: '28px' 
          }}>
            ← Вернуться в личный кабинет
          </Link>

          {/* ===== АВАТАРКА ===== */}
          <div style={{
            background: '#ffffff',
            borderRadius: '28px',
            padding: '32px',
            boxShadow: '0 12px 30px rgba(15,23,42,.06)',
            marginBottom: '24px'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '24px', color: '#0f172a', fontSize: '24px' }}>
              Фото профиля
            </h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#f1f5f9',
                border: '2px solid #e2e8f0',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img 
                  src={avatarUrl || `https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=2850a7&color=fff&size=120`}
                  alt="Аватар"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    display: 'block'
                  }}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=2850a7&color=fff&size=120`;
                  }}
                />
              </div>
              
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                  id="avatar-upload"
                />
                <label 
                  htmlFor="avatar-upload"
                  style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    background: '#2850a7',
                    color: '#ffffff',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#1e3d82'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#2850a7'}
                >
                  Загрузить фото
                </label>
                {avatarLoading && <span style={{ marginLeft: '12px', color: '#64748b' }}>⏳ Загрузка...</span>}
                {avatarError && <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>❌ {avatarError}</div>}
                {avatarSuccess && <div style={{ color: '#16a34a', fontSize: '14px', marginTop: '8px' }}>✅ {avatarSuccess}</div>}
                <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '8px' }}>
                  Поддерживаются JPG, PNG, WEBP, GIF. Максимум 10MB.
                </p>
              </div>
            </div>
          </div>

          {/* ===== ИНФОРМАЦИЯ ОБ АККАУНТЕ ===== */}
          <div style={{
            background: '#ffffff',
            borderRadius: '28px',
            padding: '32px',
            boxShadow: '0 12px 30px rgba(15,23,42,.06)',
            marginBottom: '24px'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '24px', color: '#0f172a', fontSize: '24px' }}>
              Информация об аккаунте
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* ===== ИЗМЕНЕНИЕ ИМЕНИ ===== */}
              <div style={{ paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>Имя</div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      setNameError('');
                      setNameSuccess('');
                    }}
                    placeholder="Введите имя"
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '16px',
                      flex: 1,
                      minWidth: '200px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: '#ffffff'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2850a7'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    disabled={nameLoading}
                  />
                  <button
                    onClick={handleChangeName}
                    disabled={nameLoading || newName.trim() === user?.name || !newName.trim()}
                    style={{
                      padding: '10px 24px',
                      background: (nameLoading || newName.trim() === user?.name || !newName.trim()) 
                        ? '#94a3b8' 
                        : '#2850a7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '600',
                      cursor: (nameLoading || newName.trim() === user?.name || !newName.trim()) 
                        ? 'not-allowed' 
                        : 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {nameLoading ? '⏳ Сохранение...' : 'Сохранить'}
                  </button>
                </div>
                {nameError && <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>❌ {nameError}</div>}
                {nameSuccess && <div style={{ color: '#16a34a', fontSize: '14px', marginTop: '8px' }}>✅ {nameSuccess}</div>}
              </div>

              {/* ===== EMAIL ===== */}
              <div>
                <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>Email</div>
                <div style={{ color: '#0f172a', fontSize: '18px', fontWeight: '600', wordBreak: 'break-word' }}>
                  {user?.email || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* ===== БЕЗОПАСНОСТЬ ===== */}
          <div style={{
            background: '#ffffff',
            borderRadius: '28px',
            padding: '32px',
            boxShadow: '0 12px 30px rgba(15,23,42,.06)',
            marginBottom: '24px'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '12px', color: '#0f172a', fontSize: '24px' }}>
              Безопасность
            </h2>
            <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '28px' }}>
              Завершите текущую сессию и выйдите из аккаунта на этом устройстве.
            </p>
            <button 
              onClick={handleLogout} 
              style={{ 
                border: 'none', 
                background: 'linear-gradient(135deg, #2850a7 0%, #3b82f6 100%)', 
                color: '#ffffff', 
                padding: '16px 28px', 
                borderRadius: '14px', 
                fontWeight: '600', 
                fontSize: '16px', 
                cursor: 'pointer', 
                transition: 'all .2s ease' 
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Выйти из аккаунта
            </button>
          </div>

          {/* ===== УДАЛЕНИЕ АККАУНТА ===== */}
          <div style={{
            background: '#ffffff',
            borderRadius: '28px',
            padding: '32px',
            boxShadow: '0 12px 30px rgba(15,23,42,.06)',
            border: '1px solid #fee2e2'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '12px', color: '#dc2626', fontSize: '24px' }}>
              Удаление аккаунта
            </h2>
            <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '28px' }}>
              Удаление аккаунта приведёт к безвозвратной потере всех данных: ваших помещений, бронирований и истории.
            </p>
            
            {error && (
              <div style={{ 
                background: '#fee2e2', 
                color: '#dc2626', 
                padding: '12px 16px', 
                borderRadius: '10px', 
                marginBottom: '16px', 
                fontSize: '14px' 
              }}>
                ❌ {error}
              </div>
            )}
            
            {!showConfirm ? (
              <button 
                onClick={() => setShowConfirm(true)} 
                style={{ 
                  border: 'none', 
                  background: '#dc2626', 
                  color: '#ffffff', 
                  padding: '14px 28px', 
                  borderRadius: '12px', 
                  fontWeight: '600', 
                  fontSize: '15px', 
                  cursor: 'pointer', 
                  transition: 'all .2s ease' 
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
              >
                Удалить аккаунт
              </button>
            ) : (
              <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '16px', border: '1px solid #fecaca' }}>
                <p style={{ color: '#dc2626', fontWeight: '600', marginTop: 0, marginBottom: '16px' }}>
                  ⚠️ Вы уверены? Это действие необратимо.
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={handleDeleteAccount} 
                    disabled={isDeleting} 
                    style={{ 
                      border: 'none', 
                      background: '#dc2626', 
                      color: '#ffffff', 
                      padding: '12px 24px', 
                      borderRadius: '10px', 
                      fontWeight: '600', 
                      fontSize: '14px', 
                      cursor: isDeleting ? 'not-allowed' : 'pointer', 
                      opacity: isDeleting ? 0.6 : 1 
                    }}
                  >
                    {isDeleting ? '⏳ Удаление...' : 'Да, удалить'}
                  </button>
                  <button 
                    onClick={() => setShowConfirm(false)} 
                    style={{ 
                      border: '1px solid #e2e8f0', 
                      background: '#ffffff', 
                      color: '#64748b', 
                      padding: '12px 24px', 
                      borderRadius: '10px', 
                      fontWeight: '600', 
                      fontSize: '14px', 
                      cursor: 'pointer' 
                    }}
                  >
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