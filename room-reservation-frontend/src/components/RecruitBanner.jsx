import { useState, useEffect } from 'react';

const RECRUIT_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Замените на вашу ссылку

export default function RecruitBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Проверяем, был ли уже клик
  useEffect(() => {
    const hasClicked = localStorage.getItem('recruit_banner_clicked');
    if (hasClicked) {
      setIsVisible(false);
    }
  }, []);

  const handleClick = () => {
    localStorage.setItem('recruit_banner_clicked', 'true');
    window.open(RECRUIT_URL, '_blank');
    setIsVisible(false);
  };

  const handleMinimize = (e) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setIsVisible(false);
    localStorage.setItem('recruit_banner_closed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      ...(isMinimized ? {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(40, 80, 167, 0.3)',
      } : {
        width: '200px',
        borderRadius: '16px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
        background: '#ffffff',
        border: '2px solid #2850a7',
      })
    }}
    onClick={isMinimized ? handleClick : undefined}
    onMouseEnter={(e) => {
      if (isMinimized) {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(40, 80, 167, 0.4)';
      }
    }}
    onMouseLeave={(e) => {
      if (isMinimized) {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(40, 80, 167, 0.3)';
      }
    }}
    >
      {/* Кнопка закрытия */}
      <button
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: '#ef4444',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
        }}
      >
        ×
      </button>

      {/* Кнопка сворачивания/разворачивания */}
      <button
        onClick={handleMinimize}
        style={{
          position: 'absolute',
          top: '-8px',
          left: '-8px',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: '#2850a7',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(40, 80, 167, 0.4)'
        }}
      >
        {isMinimized ? '◻' : '◼'}
      </button>

      {isMinimized ? (
        // Свёрнутый вид — только гифка
        <img
          src="https://media.tenor.com/9BxwOO6sNuoAAAAi/cute-cat.gif"
          alt="Милая гифка"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      ) : (
        // Развёрнутый вид
        <div style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{
            width: '100%',
            height: '120px',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '8px'
          }}>
            <img
              src="https://media.tenor.com/9BxwOO6sNuoAAAAi/cute-cat.gif"
              alt="Милая гифка"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
          <div
            onClick={handleClick}
            style={{
              background: 'linear-gradient(135deg, #2850a7 0%, #3b82f6 100%)',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(40, 80, 167, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(40, 80, 167, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 80, 167, 0.3)';
            }}
          >
            🎯 Нажми меня!
          </div>
          <p style={{
            fontSize: '10px',
            color: '#94a3b8',
            margin: '6px 0 0 0',
            textAlign: 'center'
          }}>
            Нажми — будет интересно!
          </p>
        </div>
      )}
    </div>
  );
}