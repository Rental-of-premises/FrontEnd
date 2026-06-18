// src/components/BookingDetailsModal.jsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const BookingDetailsModal = ({ isOpen, onClose, booking, onCancel, room }) => {
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

  const getStatusClass = (status) => {
    const classMap = {
      'waiting': 'modal-status-waiting',
      'confirmed': 'modal-status-confirmed',
      'cancelled': 'modal-status-cancelled',
      'completed': 'modal-status-completed',
      'rejected': 'modal-status-rejected'
    };
    return classMap[status] || 'modal-status-confirmed';
  };

  const canCancel = booking.status === 'waiting' || booking.status === 'confirmed';
  const startTime = new Date(booking.time_from);
  const endTime = new Date(booking.time_to);
  const hoursDiff = (endTime - startTime) / 3600000;
  const totalPrice = hoursDiff * (room?.price_per_hour || booking.price_per_hour || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content booking-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Детали бронирования</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {/* Информация о помещении */}
          <div className="modal-section">
            <div className="modal-field">
              <label>🏢 Помещение</label>
              <div className="modal-value modal-room-name">
                {room?.name || booking.apartment_title || `Помещение #${booking.apartment_id}`}
              </div>
            </div>

            {room && (
              <div className="modal-room-details">
                <div className="modal-room-specs">
                  <span className="spec-tag">👥 {room.capacity || 0} чел.</span>
                  <span className="spec-tag">💰 ${room.price_per_hour || 0}/час</span>
                  {room.description && (
                    <p className="modal-room-description">{room.description}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Время бронирования */}
          <div className="modal-section">
            <div className="modal-field">
              <label>📅 Дата и время</label>
              <div className="modal-value">
                {formatDateTime(booking.time_from)} — {endTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            
            <div className="modal-field">
              <label>⏱️ Длительность</label>
              <div className="modal-value">
                {hoursDiff} {hoursDiff === 1 ? 'час' : hoursDiff < 5 ? 'часа' : 'часов'}
              </div>
            </div>

            <div className="modal-field">
              <label>💰 Стоимость</label>
              <div className="modal-value modal-price">
                ${totalPrice.toFixed(0)}
                <span className="modal-price-hint">(${room?.price_per_hour || booking.price_per_hour || 0}/час × {hoursDiff} ч.)</span>
              </div>
            </div>
          </div>

          {/* Статус */}
          <div className="modal-section">
            <div className="modal-field">
              <label>📊 Статус</label>
              <div className={`modal-status ${getStatusClass(booking.status)}`}>
                {getStatusText(booking.status)}
              </div>
            </div>

            {booking.status === 'waiting' && (
              <div className="modal-waiting-hint">
                ⏳ Бронирование ожидает подтверждения от владельца помещения
              </div>
            )}

            {booking.status === 'confirmed' && (
              <div className="modal-confirmed-hint">
                ✅ Бронирование подтверждено! Вы можете прийти в указанное время.
              </div>
            )}
          </div>

          {/* Дополнительная информация */}
          <div className="modal-section">
            <div className="modal-field">
              <label>🆔 ID бронирования</label>
              <div className="modal-value modal-id">#{booking.id}</div>
            </div>

            {booking.created_at && (
              <div className="modal-field">
                <label>📝 Создано</label>
                <div className="modal-value modal-created">
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

          {/* Ссылка на помещение в каталоге */}
          {room && (
            <div className="modal-section modal-link-section">
              <Link to={`/catalog/${room.id}`} className="modal-room-link" onClick={onClose}>
                📖 Посмотреть помещение в каталоге
              </Link>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          {canCancel && (
            <button 
              className="modal-cancel-btn"
              onClick={() => onCancel(booking.id)}
            >
              ❌ Отменить бронирование
            </button>
          )}
          <button className="modal-close-btn" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;