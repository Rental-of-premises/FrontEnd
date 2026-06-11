// src/pages/RoomDetails.jsx
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGetApartmentByIdQuery, useCreateBookingMutation } from '../store/api';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

export default function RoomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: room, isLoading, error } = useGetApartmentByIdQuery(id);
  const [createBooking, { isLoading: bookingLoading }] = useCreateBookingMutation();
  
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  // Рассчёт стоимости
  const calculatePrice = () => {
    if (!room) return 0;
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    const hours = endHour - startHour;
    return hours * room.price_per_hour;
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess('');

    if (!user) {
      setBookingError('Пожалуйста, войдите в аккаунт, чтобы забронировать');
      return;
    }

    if (!bookingDate) {
      setBookingError('Выберите дату');
      return;
    }

    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    
    if (endHour <= startHour) {
      setBookingError('Время окончания должно быть позже времени начала');
      return;
    }

    const startDateTime = new Date(`${bookingDate}T${startTime}:00`);
    const endDateTime = new Date(`${bookingDate}T${endTime}:00`);

    try {
      const bookingData = {
        apartment_id: parseInt(id),
        time_from: startDateTime.toISOString(),
        time_to: endDateTime.toISOString(),
        total_price: calculatePrice()
      };
      
      await createBooking(bookingData).unwrap();
      setBookingSuccess('Бронирование успешно создано!');
      setShowBookingForm(false);
      
      setTimeout(() => {
        navigate('/my-bookings');
      }, 2000);
    } catch (err) {
      console.error('Booking error:', err);
      setBookingError(err.data?.message || 'Ошибка при создании бронирования');
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="loader">
          <div className="spinner"></div>
        </div>
      </>
    );
  }

  if (error || !room) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="error-message">
            <h2>Помещение не найдено</h2>
            <p>Помещение с ID {id} не существует или было удалено.</p>
            <Link to="/catalog">
              <button className="auth-btn" style={{ marginTop: '20px' }}>
                Вернуться к каталогу
              </button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="room-details-container">
        <div className="room-details-back">
          <Link to="/catalog">← Назад к каталогу</Link>
        </div>

        <div className="room-details-grid">
          {/* Левая колонка - информация о помещении */}
          <div className="room-details-info">
            <img 
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800" 
              alt={room.name} 
              className="room-details-image"
            />
            <h1 className="room-details-title">{room.name}</h1>
            <p className="room-details-description">{room.description || 'Описание отсутствует'}</p>
            
            <div className="room-details-specs">
              <div className="spec-item">
                <span className="spec-icon">👥</span>
                <span className="spec-label">Вместимость:</span>
                <span className="spec-value">{room.capacity || 0} человек</span>
              </div>
              <div className="spec-item">
                <span className="spec-icon">🏷️</span>
                <span className="spec-label">Тип:</span>
                <span className="spec-value">Помещение</span>
              </div>
              <div className="spec-item">
                <span className="spec-icon">💰</span>
                <span className="spec-label">Цена:</span>
                <span className="spec-value">${room.price_per_hour || 0}/час</span>
              </div>
            </div>

            <div className="room-details-amenities">
              <h3>Удобства</h3>
              <div className="amenities-list">
                <span className="amenity-tag">✓ WiFi</span>
                <span className="amenity-tag">✓ Кондиционер</span>
                <span className="amenity-tag">✓ Рабочее место</span>
              </div>
            </div>
          </div>

          {/* Правая колонка - форма бронирования */}
          <div className="room-details-booking">
            <div className="booking-card-sticky">
              <h2>Забронировать</h2>
              <div className="booking-price-preview">
                <span className="price-label">Стоимость:</span>
                <span className="price-value">${room.price_per_hour}/час</span>
              </div>

              {!showBookingForm ? (
                
                <Link to={`/booking/${room.id}`} style={{ textDecoration: 'none' }}>
                    <button className="booking-primary-btn">
                        Забронировать сейчас
                  </button>
                </Link>
              ) : (
                <form onSubmit={handleBooking} className="booking-form">
                  {bookingError && <div className="error-message">{bookingError}</div>}
                  {bookingSuccess && <div className="success-message">{bookingSuccess}</div>}
                  
                  <div className="form-group">
                    <label>Дата</label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Начало</label>
                      <select value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                        <option>09:00</option><option>10:00</option><option>11:00</option>
                        <option>12:00</option><option>13:00</option><option>14:00</option>
                        <option>15:00</option><option>16:00</option><option>17:00</option>
                        <option>18:00</option><option>19:00</option><option>20:00</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Конец</label>
                      <select value={endTime} onChange={(e) => setEndTime(e.target.value)}>
                        <option>10:00</option><option>11:00</option><option>12:00</option>
                        <option>13:00</option><option>14:00</option><option>15:00</option>
                        <option>16:00</option><option>17:00</option><option>18:00</option>
                        <option>19:00</option><option>20:00</option><option>21:00</option>
                      </select>
                    </div>
                  </div>

                  <div className="booking-total">
                    <span>Итого:</span>
                    <span>${calculatePrice()}</span>
                  </div>

                  <div className="booking-form-actions">
                    <button 
                      type="submit" 
                      className="booking-submit-btn"
                      disabled={bookingLoading}
                    >
                      {bookingLoading ? 'Бронирование...' : 'Подтвердить бронирование'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowBookingForm(false)}
                      className="booking-cancel-btn"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}