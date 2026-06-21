import { useEffect } from 'react';

const BookingModal = ({ isOpen, onClose, booking, onCancel, room }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !booking) return null;

  const formatDateTime = (date) => {
    if (!date) return 'Не указано';
    return new Date(date).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status) => {
    const statusMap = {
      'waiting': '⏳ Ожидает подтверждения',
      'confirmed': '✅ Подтверждено',
      'cancelled': '❌ Отменено',
      'completed': '📌 Завершено',
      'rejected': '🚫 Отклонено'
    };
    return statusMap[status] || status || 'Подтверждено';
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'waiting': '#f59e0b',
      'confirmed': '#10b981',
      'cancelled': '#ef4444',
      'completed': '#3b82f6',
      'rejected': '#ef4444'
    };
    return colorMap[status] || '#3b82f6';
  };

  const canCancel = booking.status === 'waiting' || booking.status === 'confirmed';
  
  const startTime = new Date(booking.time_from);
  const endTime = new Date(booking.time_to);
  const hoursDiff = (endTime - startTime) / 3600000;
  const pricePerHour = room?.price_per_hour || booking.price_per_hour || 0;
  const totalPrice = hoursDiff * pricePerHour;

  const statusColor = getStatusColor(booking.status);
  const statusText = getStatusText(booking.status);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Заголовок */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 1,
          borderRadius: '24px 24px 0 0'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>📋 Детали бронирования</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '4px 8px',
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            ×
          </button>
        </div>
        
        {/* Тело */}
        <div style={{ padding: '24px' }}>
          
          {/* ===== ИЗОБРАЖЕНИЕ ===== */}
          {room?.image_url && (
            <div style={{ 
              marginBottom: '20px', 
              borderRadius: '16px', 
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f1f5f9',
              height: '200px'
            }}>
              <img 
                src={room.image_url} 
                alt={room.name} 
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              />
            </div>
          )}

          {/* ===== ИНФОРМАЦИЯ О ПОМЕЩЕНИИ ===== */}
          <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                🏢 Помещение
              </label>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                color: '#1e293b', 
                marginTop: '4px'
              }}>
                {room?.name || booking.apartment_title || booking.room_title || `Помещение #${booking.apartment_id}`}
              </div>
            </div>

            {/* Характеристики */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '12px', 
              marginTop: '12px'
            }}>
              <span style={{ 
                padding: '6px 14px', 
                background: '#f1f5f9', 
                borderRadius: '20px', 
                fontSize: '13px', 
                color: '#475569'
              }}>
                {room?.capacity || 0} человек
              </span>
              <span style={{ 
                padding: '6px 14px', 
                background: '#f1f5f9', 
                borderRadius: '20px', 
                fontSize: '13px', 
                color: '#475569'
              }}>
                ₽{room?.price_per_hour || 0}/час
              </span>
              {room?.room_type && (
                <span style={{ 
                  padding: '6px 14px', 
                  background: '#dbeafe', 
                  borderRadius: '20px', 
                  fontSize: '13px', 
                  color: '#2563eb'
                }}>
                  {room.room_type}
                </span>
              )}
            </div>

            {/* Описание */}
            {room?.description && (
              <div style={{ 
                marginTop: '12px', 
                padding: '16px', 
                background: '#f8fafc', 
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{ 
                  margin: 0, 
                  fontSize: '14px', 
                  color: '#475569', 
                  lineHeight: '1.7'
                }}>
                  {room.description}
                </p>
              </div>
            )}

            {/* Удобства */}
            {room?.amenities && room.amenities.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <label style={{ 
                  fontSize: '12px', 
                  color: '#64748b', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px', 
                  fontWeight: '600',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Удобства
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {room.amenities.map((amenity, index) => (
                    <span key={index} style={{ 
                      padding: '4px 12px', 
                      background: '#eef2ff', 
                      borderRadius: '16px', 
                      fontSize: '12px', 
                      color: '#2850a7'
                    }}>
                      ✓ {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ===== ВРЕМЯ И СТОИМОСТЬ ===== */}
          <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                Дата и время
              </label>
              <div style={{ fontSize: '16px', color: '#1e293b', marginTop: '4px', fontWeight: '500' }}>
                {formatDateTime(booking.time_from)} — {endTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                Длительность
              </label>
              <div style={{ fontSize: '16px', color: '#1e293b', marginTop: '4px' }}>
                {hoursDiff} {hoursDiff === 1 ? 'час' : hoursDiff < 5 ? 'часа' : 'часов'}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                Стоимость
              </label>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: '800', 
                color: '#2850a7', 
                marginTop: '4px'
              }}>
                ₽{totalPrice.toFixed(0)}
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: '400', 
                  color: '#94a3b8', 
                  marginLeft: '8px'
                }}>
                  (₽{pricePerHour}/час × {hoursDiff} ч.)
                </span>
              </div>
            </div>
          </div>

          {/* ===== СТАТУС ===== */}
          <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                Статус
              </label>
              <div style={{
                display: 'inline-block',
                padding: '8px 20px',
                borderRadius: '30px',
                fontSize: '14px',
                fontWeight: '600',
                background: `${statusColor}15`,
                color: statusColor,
                marginTop: '4px',
                border: `1px solid ${statusColor}30`
              }}>
                {statusText}
              </div>
            </div>

            {booking.status === 'waiting' && (
              <div style={{
                background: '#fef3c7',
                padding: '12px 16px',
                borderRadius: '12px',
                color: '#d97706',
                fontSize: '14px',
                marginTop: '8px',
                borderLeft: '4px solid #d97706'
              }}>
                Бронирование ожидает подтверждения от владельца помещения
              </div>
            )}

            {booking.status === 'confirmed' && (
              <div style={{
                background: '#dcfce7',
                padding: '12px 16px',
                borderRadius: '12px',
                color: '#16a34a',
                fontSize: '14px',
                marginTop: '8px',
                borderLeft: '4px solid #16a34a'
              }}>
                ✅ Бронирование подтверждено! Вы можете прийти в указанное время.
              </div>
            )}
          </div>

          {/* ===== ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ ===== */}
          <div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                ID бронирования
              </label>
              <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                <span style={{ 
                  background: '#f1f5f9', 
                  padding: '4px 12px', 
                  borderRadius: '6px', 
                  fontFamily: 'monospace'
                }}>
                  #{booking.id}
                </span>
              </div>
            </div>

            {booking.created_at && (
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                  Создано
                </label>
                <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                  {new Date(booking.created_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Футер */}
        <div style={{
          display: 'flex',
          gap: '12px',
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          borderRadius: '0 0 24px 24px'
        }}>
          {canCancel && (
            <button 
              onClick={() => onCancel(booking.id)}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#dc2626';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              ❌ Отменить бронирование
            </button>
          )}
          <button 
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: '#e2e8f0',
              color: '#1e293b',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#e2e8f0';
            }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;