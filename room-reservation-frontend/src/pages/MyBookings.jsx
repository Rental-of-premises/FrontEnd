// src/pages/MyBookings.jsx
import { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useGetMyBookingsQuery, useCancelBookingMutation } from '../store/api';
import BookingModal from '../components/BookingModal';
import Navbar from '../components/Navbar';
import '../styles/mybookings.css';

export default function MyBookings() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // API хуки (работают с вашим бэкендом)
  const { data: bookings = [], isLoading, error, refetch } = useGetMyBookingsQuery();
  const [cancelBooking] = useCancelBookingMutation();

  // Получаем дни недели
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentDate]);

  // Часы для отображения (8:00 - 22:00)
  const hours = useMemo(() => {
    const h = [];
    for (let i = 8; i <= 22; i++) {
      h.push(`${i}:00`);
    }
    return h;
  }, []);

  // Получение броней на конкретный день и час
  const getBookingsForSlot = (date, hour) => {
    const dateStr = date.toISOString().split('T')[0];
    const [hourNum] = hour.split(':').map(Number);
    
    return bookings.filter(booking => {
      if (!booking.time_from) return false;
      const bookingDate = new Date(booking.time_from).toISOString().split('T')[0];
      const bookingHour = new Date(booking.time_from).getHours();
      return bookingDate === dateStr && bookingHour === hourNum;
    });
  };

  // Навигация по неделям
  const goToPrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Форматирование даты
  const formatDate = (date) => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      weekday: 'short'
    });
  };

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setModalOpen(true);
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Вы уверены, что хотите отменить это бронирование?')) {
      try {
        await cancelBooking(bookingId).unwrap();
        refetch(); // Обновляем список бронирований
        setModalOpen(false);
      } catch (err) {
        console.error('Ошибка отмены:', err);
        alert('Не удалось отменить бронирование');
      }
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

  if (error) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="error-message">
            Ошибка загрузки бронирований: {error.message || 'Попробуйте позже'}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="mybookings-page">
        <div className="mybookings-header">
          <div>
            <h1 className="mybookings-title">Мои бронирования</h1>
            <p className="mybookings-subtitle">
              Добро пожаловать, {user?.name || 'Пользователь'}!
            </p>
          </div>
          <div className="bookings-stats">
            <span className="stats-number">{bookings.length}</span>
            <span className="stats-label">броней</span>
          </div>
        </div>

        <div className="nav-buttons">
          <button onClick={goToPrevWeek} className="nav-btn">← Предыдущая</button>
          <button onClick={goToToday} className="nav-btn today-btn">Сегодня</button>
          <button onClick={goToNextWeek} className="nav-btn">Следующая →</button>
        </div>

        <div className="calendar-wrapper">
          <div className="calendar-table">
            <div className="calendar-header-row">
              <div className="time-header">Время</div>
              {weekDays.map((day, idx) => (
                <div key={idx} className="day-header">
                  <div className="weekday">{formatDate(day)}</div>
                  <div className="day-number">{day.getDate()}</div>
                </div>
              ))}
            </div>

            {hours.map((hour, hourIdx) => (
              <div key={hourIdx} className="calendar-row">
                <div className="time-cell">{hour}</div>
                {weekDays.map((day, dayIdx) => {
                  const bookingsForSlot = getBookingsForSlot(day, hour);
                  const hasBooking = bookingsForSlot.length > 0;
                  
                  return (
                    <div 
                      key={dayIdx} 
                      className={`calendar-cell ${hasBooking ? 'calendar-cell-booked' : 'calendar-cell-free'}`}
                    >
                      {hasBooking && bookingsForSlot.map(booking => (
                        <div
                          key={booking.id}
                          className="booking-card"
                          onClick={() => handleBookingClick(booking)}
                        >
                          <div className="booking-title">
                            {booking.apartment_title || booking.room_title || `Бронь #${booking.id}`}
                          </div>
                          <div className="booking-time">
                            {new Date(booking.time_from).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - 
                            {new Date(booking.time_to).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {bookings.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3 className="empty-title">Нет бронирований</h3>
            <p className="empty-text">Перейдите в каталог, чтобы забронировать помещение</p>
            <button onClick={() => window.location.href = '/catalog'} className="go-catalog-btn">
              Перейти в каталог
            </button>
          </div>
        )}
      </div>

      <BookingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        booking={selectedBooking}
        onCancel={handleCancelBooking}
      />
    </>
  );
}