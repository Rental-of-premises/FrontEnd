// src/components/BookingModal.jsx
import { useEffect } from 'react';

const BookingModal = ({ isOpen, onClose, booking, onCancel }) => {
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
      'confirmed': 'Подтверждено',
      'cancelled': 'Отменено',
      'completed': 'Завершено'
    };
    return statusMap[status] || status || 'Подтверждено';
  };

  const getStatusClass = (status) => {
    const classMap = {
      'confirmed': 'modal-status-confirmed',
      'cancelled': 'modal-status-cancelled',
      'completed': 'modal-status-completed'
    };
    return classMap[status] || 'modal-status-confirmed';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Детали бронирования</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="modal-field">
            <label>Помещение</label>
            <div className="modal-value">
              {booking.apartment_title || booking.room_title || `Бронирование #${booking.id}`}
            </div>
          </div>
          
          <div className="modal-field">
            <label>Дата и время</label>
            <div className="modal-value">
              {formatDateTime(booking.time_from)} — {new Date(booking.time_to).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
            </div>
          </div>
          
          <div className="modal-field">
            <label>Статус</label>
            <div className={`modal-status ${getStatusClass(booking.status)}`}>
              {getStatusText(booking.status)}
            </div>
          </div>

          {booking.created_at && (
            <div className="modal-field">
              <label>Забронировано</label>
              <div className="modal-value">
                {new Date(booking.created_at).toLocaleDateString('ru-RU')}
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          {booking.status === 'confirmed' && (
            <button 
              className="modal-cancel-btn"
              onClick={() => onCancel(booking.id)}
            >
              Отменить бронирование
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

export default BookingModal;