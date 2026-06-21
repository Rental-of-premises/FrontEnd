import { useState, useEffect } from 'react';

const RECRUIT_URL = 'https://youtu.be/dQw4w9WgXcQ?si=RHezddyowa-u14TP';
const BANNER_HIDE_KEY = 'recruit_banner_hidden_until';

export default function RecruitBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Проверяем, скрыт ли баннер
    const hiddenUntil = localStorage.getItem(BANNER_HIDE_KEY);
    if (hiddenUntil) {
      const hideTime = parseInt(hiddenUntil, 10);
      if (Date.now() < hideTime) {
        setIsVisible(false);
        // Проверяем каждую минуту, не прошёл ли час
        const interval = setInterval(() => {
          const current = localStorage.getItem(BANNER_HIDE_KEY);
          if (current && Date.now() > parseInt(current, 10)) {
            localStorage.removeItem(BANNER_HIDE_KEY);
            setIsVisible(true);
            clearInterval(interval);
          }
        }, 60000); // проверка раз в минуту
        return () => clearInterval(interval);
      } else {
        localStorage.removeItem(BANNER_HIDE_KEY);
      }
    }
  }, []);

  const handleClick = () => {
    window.open(RECRUIT_URL, '_blank');
  };

  const handleMinimize = (e) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    // Скрываем на 1 час
    const oneHourLater = Date.now() + 60 * 60 * 1000;
    localStorage.setItem(BANNER_HIDE_KEY, String(oneHourLater));
    setIsVisible(false);
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
    >
      {/* Кнопка закрытия — скрывает на час */}
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

      {/* Кнопка сворачивания */}
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
        <img
          src="https://giffun.ru/wp-content/uploads/2022/08/bongo-cat-typing.gif"
          alt="Милая гифка с котом"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      ) : (
        <div style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{
            width: '100%',
            height: '120px',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '8px'
          }}>
            <img
              src="https://giffun.ru/wp-content/uploads/2022/08/bongo-cat-typing.gif"
              alt="Милая гифка с котом"
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
              background: 'linear-gradient(135deg, #ff6b6b, #ff4757)',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(255, 71, 87, 0.3)',
              animation: 'pulse 2s infinite'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 71, 87, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 71, 87, 0.3)';
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