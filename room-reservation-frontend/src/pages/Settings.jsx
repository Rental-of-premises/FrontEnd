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
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '50px 24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        
        {/* ===== ЗАГОЛОВОК ===== */}
        <div style={{
          background: 'rgba(235, 248, 245, 0.85)',
          backdropFilter: 'blur(12px)',
          padding: '44px 48px',
          borderRadius: '28px',
          marginBottom: '36px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '38px', 
              fontWeight: '800', 
              letterSpacing: '-0.03em',
              color: '#0f172a',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              Настройки профиля
            </h1>
            <p style={{ marginTop: '10px', marginBottom: 0, color: '#475569', fontSize: '16px', fontWeight: '500' }}>
              Управление аккаунтом
            </p>
          </div>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(8px)',
            padding: '16px 22px', 
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.4)'
          }}>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Авторизован как</div>
            <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '4px', color: '#0f172a' }}>
              {user?.name || 'Пользователь'}
            </div>
          </div>
        </div>

        <Link to="/dashboard" style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          textDecoration: 'none', 
          color: '#e0f2f1',
          background: 'rgba(38, 166, 154, 0.2)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(38, 166, 154, 0.5)',
          padding: '8px 20px',
          borderRadius: '20px',
          fontWeight: '600',
          marginBottom: '28px',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(38, 166, 154, 0.3)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(38, 166, 154, 0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          ← Вернуться в личный кабинет
        </Link>

        {/* ===== АВАТАРКА ===== */}
        <div style={{
          background: 'rgba(235, 248, 245, 0.85)',
          backdropFilter: 'blur(12px)',
          borderRadius: '28px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            marginTop: 0, 
            marginBottom: '24px', 
            color: '#0f172a', 
            fontSize: '24px',
            fontWeight: '700'
          }}>
            Фото профиля
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'rgba(241, 245, 249, 0.7)',
              backdropFilter: 'blur(8px)',
              border: '2px solid rgba(255, 255, 255, 0.4)',
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
                  background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
                  color: '#ffffff',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(40, 80, 167, 0.25)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(40, 80, 167, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 80, 167, 0.25)';
                }}
              >
                Загрузить фото
              </label>
              {avatarLoading && <span style={{ marginLeft: '12px', color: '#475569', fontWeight: '500' }}>⏳ Загрузка...</span>}
              {avatarError && <div style={{ color: '#dc2626', fontSize: '14px', marginTop: '8px', fontWeight: '600' }}>❌ {avatarError}</div>}
              {avatarSuccess && <div style={{ color: '#16a34a', fontSize: '14px', marginTop: '8px', fontWeight: '600' }}>✅ {avatarSuccess}</div>}
              <p style={{ color: '#64748b', fontSize: '12px', marginTop: '8px', fontWeight: '500' }}>
                Поддерживаются JPG, PNG. Максимум 10MB.
              </p>
            </div>
          </div>
        </div>

        {/* ===== ИНФОРМАЦИЯ ОБ АККАУНТЕ ===== */}
        <div style={{
          background: 'rgba(235, 248, 245, 0.85)',
          backdropFilter: 'blur(12px)',
          borderRadius: '28px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            marginTop: 0, 
            marginBottom: '24px', 
            color: '#0f172a', 
            fontSize: '24px',
            fontWeight: '700'
          }}>
            Информация об аккаунте
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* ===== ИЗМЕНЕНИЕ ИМЕНИ ===== */}
            <div style={{ paddingBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.3)' }}>
              <div style={{ color: '#475569', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>Имя</div>
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
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    fontSize: '16px',
                    flex: 1,
                    minWidth: '200px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    color: '#1e293b'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2850a7'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)'}
                  disabled={nameLoading}
                />
                <button
                  onClick={handleChangeName}
                  disabled={nameLoading || newName.trim() === user?.name || !newName.trim()}
                  style={{
                    padding: '10px 24px',
                    background: (nameLoading || newName.trim() === user?.name || !newName.trim()) 
                      ? '#94a3b8' 
                      : 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: (nameLoading || newName.trim() === user?.name || !newName.trim()) 
                      ? 'not-allowed' 
                      : 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    boxShadow: (!nameLoading && newName.trim() !== user?.name && newName.trim()) 
                      ? '0 4px 12px rgba(40, 80, 167, 0.25)' 
                      : 'none'
                  }}
                >
                  {nameLoading ? '⏳ Сохранение...' : 'Сохранить'}
                </button>
              </div>
              {nameError && <div style={{ color: '#dc2626', fontSize: '14px', marginTop: '8px', fontWeight: '600' }}>❌ {nameError}</div>}
              {nameSuccess && <div style={{ color: '#16a34a', fontSize: '14px', marginTop: '8px', fontWeight: '600' }}>✅ {nameSuccess}</div>}
            </div>

            {/* ===== EMAIL ===== */}
            <div>
              <div style={{ color: '#475569', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>Email</div>
              <div style={{ 
                color: '#0f172a', 
                fontSize: '18px', 
                fontWeight: '700', 
                wordBreak: 'break-word',
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(8px)',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                {user?.email || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* ===== БЕЗОПАСНОСТЬ ===== */}
        <div style={{
          background: 'rgba(235, 248, 245, 0.85)',
          backdropFilter: 'blur(12px)',
          borderRadius: '28px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            marginTop: 0, 
            marginBottom: '12px', 
            color: '#0f172a', 
            fontSize: '24px',
            fontWeight: '700'
          }}>
            Безопасность
          </h2>
          <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '28px', fontWeight: '500' }}>
            Завершите текущую сессию и выйдите из аккаунта на этом устройстве.
          </p>
          <button 
            onClick={handleLogout} 
            style={{ 
              border: 'none', 
              background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)', 
              color: '#ffffff', 
              padding: '16px 28px', 
              borderRadius: '14px', 
              fontWeight: '600', 
              fontSize: '16px', 
              cursor: 'pointer', 
              transition: 'all .2s ease',
              boxShadow: '0 4px 12px rgba(40, 80, 167, 0.25)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(40, 80, 167, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 80, 167, 0.25)';
            }}
          >
            Выйти из аккаунта
          </button>
        </div>

        {/* ===== УДАЛЕНИЕ АККАУНТА ===== */}
        <div style={{
          background: 'rgba(235, 248, 245, 0.85)',
          backdropFilter: 'blur(12px)',
          borderRadius: '28px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ 
            marginTop: 0, 
            marginBottom: '12px', 
            color: '#dc2626', 
            fontSize: '24px',
            fontWeight: '700',
            textShadow: '0 2px 4px rgba(220, 38, 38, 0.1)'
          }}>
            Удаление аккаунта
          </h2>
          <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '28px', fontWeight: '500' }}>
            Удаление аккаунта приведёт к безвозвратной потере всех данных: ваших помещений, бронирований и истории.
          </p>
          
          {error && (
            <div style={{ 
              background: 'rgba(254, 226, 226, 0.9)',
              backdropFilter: 'blur(8px)',
              color: '#dc2626', 
              padding: '12px 16px', 
              borderRadius: '10px', 
              marginBottom: '16px', 
              fontSize: '14px',
              fontWeight: '600',
              border: '1px solid rgba(254, 226, 226, 0.5)'
            }}>
              ❌ {error}
            </div>
          )}
          
          {!showConfirm ? (
            <button 
              onClick={() => setShowConfirm(true)} 
              style={{ 
                border: 'none', 
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', 
                color: '#ffffff', 
                padding: '14px 28px', 
                borderRadius: '12px', 
                fontWeight: '600', 
                fontSize: '15px', 
                cursor: 'pointer', 
                transition: 'all .2s ease',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.25)';
              }}
            >
              Удалить аккаунт
            </button>
          ) : (
            <div style={{ 
              background: 'rgba(254, 242, 242, 0.9)',
              backdropFilter: 'blur(8px)',
              padding: '20px', 
              borderRadius: '16px', 
              border: '1px solid rgba(254, 226, 226, 0.5)'
            }}>
              <p style={{ color: '#dc2626', fontWeight: '600', marginTop: 0, marginBottom: '16px' }}>
                ⚠️ Вы уверены? Это действие необратимо.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button 
                  onClick={handleDeleteAccount} 
                  disabled={isDeleting} 
                  style={{ 
                    border: 'none', 
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', 
                    color: '#ffffff', 
                    padding: '12px 24px', 
                    borderRadius: '10px', 
                    fontWeight: '600', 
                    fontSize: '14px', 
                    cursor: isDeleting ? 'not-allowed' : 'pointer', 
                    opacity: isDeleting ? 0.6 : 1,
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
                  }}
                >
                  {isDeleting ? '⏳ Удаление...' : 'Да, удалить'}
                </button>
                <button 
                  onClick={() => setShowConfirm(false)} 
                  style={{ 
                    border: '1px solid rgba(255, 255, 255, 0.4)', 
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(8px)',
                    color: '#475569', 
                    padding: '12px 24px', 
                    borderRadius: '10px', 
                    fontWeight: '600', 
                    fontSize: '14px', 
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