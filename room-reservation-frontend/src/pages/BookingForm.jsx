import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import '../styles/bookingform.css';

export default function BookingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Мок-данные
  const room = { id: parseInt(id), name: "Modern Coworking Space", price_per_hour: 15, capacity: 20 };
  const existingBookings = [];

  // ВАЖНО: пересчитываем дни при изменении currentDate
  const weekDays = useMemo(() => {
    const startDate = new Date(currentDate);
    // Находим понедельник недели
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
    startDate.setDate(diff);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentDate]);

  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

  const isHourBooked = (date, hour) => {
    const dateStr = date.toISOString().split('T')[0];
    return existingBookings.some(b => b.date === dateStr && b.hour === hour);
  };

  const isHourSelected = (date, hour) => {
    const dateStr = date.toISOString().split('T')[0];
    return selectedSlots.some(s => s.date === dateStr && s.hour === hour);
  };

  const handleSlotClick = (date, hour) => {
    const dateStr = date.toISOString().split('T')[0];
    const isPast = date < new Date() || (date.toDateString() === new Date().toDateString() && hour < new Date().getHours());
    
    if (isHourBooked(date, hour)) {
      setError('Это время уже забронировано');
      setTimeout(() => setError(''), 2000);
      return;
    }
    if (isPast) {
      setError('Нельзя забронировать прошедшее время');
      setTimeout(() => setError(''), 2000);
      return;
    }
    
    if (isHourSelected(date, hour)) {
      setSelectedSlots(selectedSlots.filter(s => !(s.date === dateStr && s.hour === hour)));
    } else {
      setSelectedSlots([...selectedSlots, { date: dateStr, hour, time: `${hour}:00` }]);
    }
  };

  const getBookingIntervals = () => {
    const grouped = {};
    selectedSlots.forEach(slot => {
      if (!grouped[slot.date]) grouped[slot.date] = [];
      grouped[slot.date].push(slot.hour);
    });
    
    const intervals = [];
    for (const [date, hoursList] of Object.entries(grouped)) {
      hoursList.sort((a, b) => a - b);
      let start = hoursList[0];
      let end = hoursList[0];
      for (let i = 1; i <= hoursList.length; i++) {
        if (i < hoursList.length && hoursList[i] === end + 1) {
          end = hoursList[i];
        } else {
          intervals.push({
            date,
            startHour: start,
            endHour: end + 1,
            startTime: `${start}:00`,
            endTime: `${end + 1}:00`
          });
          if (i < hoursList.length) {
            start = hoursList[i];
            end = start;
          }
        }
      }
    }
    return intervals;
  };

  const calculateTotalPrice = () => {
    let totalHours = 0;
    getBookingIntervals().forEach(interval => {
      totalHours += interval.endHour - interval.startHour;
    });
    return totalHours * room.price_per_hour;
  };

  const handleSubmitBooking = () => {
    if (selectedSlots.length === 0) {
      setError('Выберите хотя бы один час');
      return;
    }
    setSuccess(`Бронирование создано! ${selectedSlots.length} час(ов).`);
    setSelectedSlots([]);
    setTimeout(() => navigate('/my-bookings'), 2000);
  };

  // Функции навигации - вызывают setCurrentDate, что триггерит useMemo
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

  const formatDate = (date) => {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const formatWeekDay = (date) => {
    return date.toLocaleDateString('ru-RU', { weekday: 'short' });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Для отладки - можно посмотреть в консоли
  console.log('Текущая неделя:', weekDays.map(d => d.toLocaleDateString()));

  return (
    <>
      <Navbar />
      <div className="bookingform-page">
        <Link to={`/catalog/${id}`} className="bookingform-back">← Назад к помещению</Link>
        <h1 className="bookingform-title">Бронирование: {room.name}</h1>
        <p className="bookingform-subtitle">{room.price_per_hour} ₽/час |{room.capacity} человек</p>

        <div className="calendar-nav">
          <button onClick={goToPrevWeek} className="nav-btn">← Предыдущая</button>
          <button onClick={goToToday} className="nav-btn today-btn">Сегодня</button>
          <button onClick={goToNextWeek} className="nav-btn">Следующая →</button>
        </div>

        <div className="calendar-wrapper">
          <div className="calendar-table">
            <div className="calendar-header-row">
              <div className="time-header">Время</div>
              {weekDays.map((day, idx) => (
                <div key={idx} className={`day-header ${isToday(day) ? 'day-header-today' : ''}`}>
                  <div className="weekday">{formatWeekDay(day)}</div>
                  <div className="day-number">{formatDate(day)}</div>
                </div>
              ))}
            </div>

            {hours.map((hour) => (
              <div key={hour} className="calendar-row">
                <div className="time-cell">{hour}:00</div>
                {weekDays.map((day, dayIdx) => {
                  const booked = isHourBooked(day, hour);
                  const selected = isHourSelected(day, hour);
                  const isPast = day < new Date() || (day.toDateString() === new Date().toDateString() && hour < new Date().getHours());
                  
                  let cellClass = 'calendar-cell';
                  if (booked || isPast) cellClass += ' booked';
                  else if (selected) cellClass += ' selected';
                  else cellClass += ' available';
                  
                  return (
                    <div
                      key={dayIdx}
                      className={cellClass}
                      onClick={() => !booked && !isPast && handleSlotClick(day, hour)}
                    >
                      {selected && <span className="selected-check">✓</span>}
                      {(booked || isPast) && <span className="booked-lock">🔒</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="legend">
          <div className="legend-item"><div className="legend-available"></div><span>Доступно</span></div>
          <div className="legend-item"><div className="legend-selected"></div><span>Выбрано</span></div>
          <div className="legend-item"><div className="legend-booked"></div><span>Занято</span></div>
        </div>

        <div className="bookingform-selected">
          <h3>Выбранные часы: {selectedSlots.length}</h3>
          {selectedSlots.length > 0 && (
            <div className="selected-list">
              {getBookingIntervals().map((interval, idx) => (
                <div key={idx} className="selected-interval">
                  <span>{new Date(interval.date).toLocaleDateString('ru-RU')}</span>
                  <span>{interval.startTime.slice(0,5)} - {interval.endTime.slice(0,5)}</span>
                  <span>{room.price_per_hour * (interval.endHour - interval.startHour)} ₽</span>
                </div>
              ))}
            </div>
          )}
          <div className="selected-total"><span>Итого:</span><span>{calculateTotalPrice()} ₽</span></div>
          <button className="submit-booking-btn" onClick={handleSubmitBooking}>Забронировать ({selectedSlots.length} час)</button>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </div>
      </div>
    </>
  );
}