import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGetApartmentByIdQuery, useCreateBookingMutation } from '../store/api';
import Navbar from '../components/Navbar';
import '../styles/bookingform.css';

const API_URL = 'https://team3.verstack.ru';

export default function BookingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: roomData, isLoading, error: roomError } = useGetApartmentByIdQuery(id);
  const room = roomData?.apartment || null;
  const [createBooking, { isLoading: bookingLoading }] = useCreateBookingMutation();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [existingBookings, setExistingBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const loadExistingBookings = async () => {
    if (!id) return;
    
    setLoadingBookings(true);
    try {
      const response = await fetch(`${API_URL}/api/apartments/${id}/calendar`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const bookings = data.map(b => {
          const startDate = new Date(b.time_from);
          const endDate = new Date(b.time_to);
          const dateStr = startDate.toISOString().split('T')[0];
          const startHour = startDate.getHours();
          const endHour = endDate.getHours();
          
          const slots = [];
          for (let hour = startHour; hour < endHour; hour++) {
            slots.push({
              date: dateStr,
              hour: hour,
              bookingId: b.id,
              status: b.status
            });
          }
          return slots;
        }).flat();
        
        setExistingBookings(bookings);
      } else {
        setExistingBookings([]);
      }
    } catch (err) {
      console.error('Ошибка загрузки бронирований:', err);
      setExistingBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    loadExistingBookings();
  }, [id]);

  useEffect(() => {
    if (bookingSuccess) {
      loadExistingBookings();
    }
  }, [bookingSuccess]);

  const weekDays = useMemo(() => {
    const startDate = new Date(currentDate);
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
    const now = new Date();
    
    const selectedDate = new Date(date);
    selectedDate.setHours(hour, 0, 0, 0);
    
    if (selectedDate < now) {
      setBookingError('Нельзя забронировать прошедшее время');
      setTimeout(() => setBookingError(''), 2000);
      return;
    }
    
    if (isHourBooked(date, hour)) {
      setBookingError('Это время уже забронировано');
      setTimeout(() => setBookingError(''), 2000);
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
          const dateObj = new Date(date);
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          const formattedDate = `${year}-${month}-${day}`;
          
          const startHourStr = String(start).padStart(2, '0');
          const endHourStr = String(end + 1).padStart(2, '0');
          
          intervals.push({
            date: formattedDate,
            startHour: start,
            endHour: end + 1,
            startTime: `${startHourStr}:00`,
            endTime: `${endHourStr}:00`
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
    if (!room) return 0;
    let totalHours = 0;
    const intervals = getBookingIntervals();
    intervals.forEach(interval => {
      totalHours += interval.endHour - interval.startHour;
    });
    return totalHours * room.price_per_hour;
  };

  const getIntervalPrice = (interval) => {
    if (!room) return 0;
    const hours = interval.endHour - interval.startHour;
    return hours * room.price_per_hour;
  };

  const handleSubmitBooking = async () => {
    if (selectedSlots.length === 0) {
      setBookingError('Выберите хотя бы один час');
      return;
    }

    if (!user) {
      setBookingError('Пожалуйста, войдите в аккаунт');
      return;
    }

    setBookingError('');
    setBookingSuccess('');

    try {
      const intervals = getBookingIntervals();
      const now = new Date();
      
      for (const interval of intervals) {
        const startDateTime = new Date(`${interval.date}T${interval.startTime}:00`);
        const endDateTime = new Date(`${interval.date}T${interval.endTime}:00`);
        
        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
          setBookingError('Ошибка: неверный формат даты');
          return;
        }
        
        if (startDateTime < now) {
          setBookingError(`Время ${interval.startTime} уже прошло. Выберите будущее время.`);
          return;
        }
        
        await createBooking({
          apartment_id: parseInt(id),
          time_from: startDateTime.toISOString(),
          time_to: endDateTime.toISOString()
        }).unwrap();
      }
      
      setBookingSuccess(`Бронирование создано! ${selectedSlots.length} час(ов). Ожидает подтверждения владельца.`);
      setSelectedSlots([]);
      
      setTimeout(() => navigate('/my-bookings'), 3000);
    } catch (err) {
      let errorMessage = 'Ошибка при создании бронирования';
      
      if (err?.data?.error) {
        errorMessage = err.data.error;
      } else if (err?.data?.message) {
        errorMessage = err.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setBookingError(errorMessage);
    }
  };

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

  if (isLoading || loadingBookings) {
    return (
      <>
        <Navbar />
        <div className="loader">
          <div className="spinner"></div>
        </div>
      </>
    );
  }

  if (roomError || !room) {
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

  const totalPrice = calculateTotalPrice();
  const intervals = getBookingIntervals();

  return (
    <>
      <Navbar />
      <div className="bookingform-page">
        <Link to={`/catalog/${id}`} className="bookingform-back">← Назад к помещению</Link>
        <h1 className="bookingform-title">Бронирование: {room.name}</h1>
        <p className="bookingform-subtitle">{room.price_per_hour} ₽/час | {room.capacity} человек</p>

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
                  const now = new Date();
                  const selectedDate = new Date(day);
                  selectedDate.setHours(hour, 0, 0, 0);
                  const isPast = selectedDate < now;
                  
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
              {intervals.map((interval, idx) => {
                const hoursCount = interval.endHour - interval.startHour;
                const price = getIntervalPrice(interval);
                return (
                  <div key={idx} className="selected-interval">
                    <span>{new Date(interval.date).toLocaleDateString('ru-RU', { 
                      day: 'numeric', 
                      month: 'short',
                      year: 'numeric'
                    })}</span>
                    <span>{interval.startTime} - {interval.endTime}</span>
                    <span>{hoursCount} ч × {room.price_per_hour} ₽ = <strong>{price} ₽</strong></span>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="selected-total">
            <span>Итого:</span>
            <span>{totalPrice} ₽</span>
          </div>
          
          <button 
            className="submit-booking-btn" 
            onClick={handleSubmitBooking}
            disabled={bookingLoading || selectedSlots.length === 0}
          >
            {bookingLoading ? 'Бронирование...' : `Забронировать (${selectedSlots.length} час)`}
          </button>
          
          {bookingError && <div className="error-message">{bookingError}</div>}
          {bookingSuccess && <div className="success-message">{bookingSuccess}</div>}
        </div>
      </div>
    </>
  );
}