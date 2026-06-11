// src/pages/Settings.jsx
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
      <div className="settings-container">
        <div className="settings-card">
          <Link to="/dashboard" className="settings-back">← Вернуться в личный кабинет</Link>
          
          <h1 className="settings-title">Настройки профиля</h1>
          <p className="settings-subtitle">Управление аккаунтом</p>
          
          <div className="settings-section">
            <h2>Информация об аккаунте</h2>
            <div className="settings-field">
              <label>Имя</label>
              <div className="settings-value">{user?.name || '—'}</div>
            </div>
            <div className="settings-field">
              <label>Email</label>
              <div className="settings-value">{user?.email || '—'}</div>
            </div>
          </div>

          <div className="settings-section">
            <h2>Аккаунт</h2>
            <button className="logout-btn-settings" onClick={handleLogout}>
              Выйти из аккаунта
            </button>
          </div>

          <div className="settings-section danger-zone">
            <p className="danger-description">
              Удаление аккаунта приведёт к безвозвратной потере всех данных:
              ваших помещений, бронирований и истории.
            </p>
            
            {error && <div className="error-message">{error}</div>}
            
            {!showConfirm ? (
              <button 
                className="delete-account-btn"
                onClick={() => setShowConfirm(true)}
              >
                Удалить аккаунт
              </button>
            ) : (
              <div className="confirm-delete">
                <p className="confirm-text">
                  Вы уверены? Это действие необратимо.
                </p>
                <div className="confirm-buttons">
                  <button 
                    className="confirm-yes"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Удаление...' : 'Да, удалить'}
                  </button>
                  <button 
                    className="confirm-no"
                    onClick={() => setShowConfirm(false)}
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