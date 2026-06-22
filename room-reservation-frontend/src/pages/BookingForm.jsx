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
          
          const year = startDate.getFullYear();
          const month = String(startDate.getMonth() + 1).padStart(2, '0');
          const day = String(startDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
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

  const getLocalDateStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isHourBooked = (date, hour) => {
    const dateStr = getLocalDateStr(date);
    return existingBookings.some(b => b.date === dateStr && b.hour === hour);
  };

  const isHourSelected = (date, hour) => {
    const dateStr = getLocalDateStr(date);
    return selectedSlots.some(s => s.date === dateStr && s.hour === hour);
  };

  const handleSlotClick = (date, hour) => {
    const dateStr = getLocalDateStr(date);
    
    const now = new Date();
    const selectedDate = new Date(date);
    selectedDate.setHours(hour, 0, 0, 0);
    
    const nowRounded = new Date(now);
    nowRounded.setMilliseconds(0);
    nowRounded.setSeconds(0);
    
    const isToday = date.toDateString() === now.toDateString();
    if (isToday && selectedDate.getTime() < nowRounded.getTime()) {
      setBookingError(`Нельзя забронировать прошедшее время (${hour}:00 уже прошло)`);
      setTimeout(() => setBookingError(''), 3000);
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
    for (const [dateStr, hoursList] of Object.entries(grouped)) {
      hoursList.sort((a, b) => a - b);
      let start = hoursList[0];
      let end = hoursList[0];
      
      for (let i = 1; i <= hoursList.length; i++) {
        if (i < hoursList.length && hoursList[i] === end + 1) {
          end = hoursList[i];
        } else {
          const [year, month, day] = dateStr.split('-').map(Number);
          const dateObj = new Date(year, month - 1, day);
          
          const startHourStr = String(start).padStart(2, '0');
          const endHourStr = String(end + 1).padStart(2, '0');
          
          intervals.push({
            date: dateStr,
            startHour: start,
            endHour: end + 1,
            startTime: `${startHourStr}:00`,
            endTime: `${endHourStr}:00`,
            displayDate: dateObj.toLocaleDateString('ru-RU', { 
              day: 'numeric', 
              month: 'short',
              year: 'numeric'
            })
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
        const [year, month, day] = interval.date.split('-').map(Number);
        const [startHour, startMinute] = interval.startTime.split(':').map(Number);
        const [endHour, endMinute] = interval.endTime.split(':').map(Number);
        
        const startDateTime = new Date(year, month - 1, day, startHour, startMinute, 0);
        const endDateTime = new Date(year, month - 1, day, endHour, endMinute, 0);
        
        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
          setBookingError('Ошибка: неверный формат даты');
          return;
        }
        
        const nowRounded = new Date(now);
        nowRounded.setMilliseconds(0);
        nowRounded.setSeconds(0);
        
        if (startDateTime.getTime() < nowRounded.getTime()) {
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
          <div className="error-message" style={{
            background: 'rgba(254, 242, 242, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(254, 226, 226, 0.5)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#0f172a', marginBottom: '12px' }}>Помещение не найдено</h2>
            <p style={{ color: '#475569' }}>Помещение с ID {id} не существует или было удалено.</p>
            <Link to="/catalog">
              <button className="auth-btn" style={{ 
                marginTop: '20px',
                background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(40, 80, 167, 0.25)'
              }}>
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
      <div className="bookingform-page" style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '50px 24px',
        background: 'transparent'
      }}>
        
        <Link to={`/catalog/${id}`} className="bookingform-back" style={{ 
          display: 'inline-block',
          color: '#ffffff',
          background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
          border: '2px solid #ffffff',
          padding: '10px 24px',
          borderRadius: '12px',
          fontSize: '15px',
          fontWeight: '600',
          textDecoration: 'none',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        }}>
          ← Назад к помещению
        </Link>

        <div style={{
          background: 'rgba(235, 248, 245, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '24px',
          padding: '32px 40px',
          marginBottom: '32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 className="bookingform-title" style={{ 
            fontSize: '32px',
            fontWeight: '800',
            color: '#0f172a',
            margin: '0 0 12px 0',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            Бронирование: {room.name}
          </h1>
          <p className="bookingform-subtitle" style={{ 
            fontSize: '16px',
            color: '#475569',
            fontWeight: '500',
            margin: 0
          }}>
            {room.price_per_hour} ₽/час | {room.capacity} человек
          </p>
        </div>

        <div className="calendar-nav" style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '24px' 
        }}>
          <button 
            onClick={goToPrevWeek} 
            className="nav-btn"
            style={{
              padding: '10px 20px',
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '10px',
              color: '#475569',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            ← Предыдущая
          </button>
          <button 
            onClick={goToToday} 
            className="nav-btn today-btn"
            style={{
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
              border: '2px solid #ffffff',
              borderRadius: '12px',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s',
              letterSpacing: '0.3px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            }}
          >
            Сегодня
          </button>
          <button 
            onClick={goToNextWeek} 
            className="nav-btn"
            style={{
              padding: '10px 20px',
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '10px',
              color: '#475569',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Следующая →
          </button>
        </div>

        <div className="calendar-wrapper" style={{
          background: 'rgba(235, 248, 245, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'auto',
          marginBottom: '20px'
        }}>
          <div className="calendar-table">
            <div className="calendar-header-row" style={{
              display: 'grid',
              gridTemplateColumns: '80px repeat(7, 1fr)',
              gap: '1px',
              background: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '8px'
            }}>
              <div className="time-header" style={{
                background: 'rgba(255, 255, 255, 0.6)',
                padding: '12px',
                fontWeight: '600',
                color: '#475569',
                textAlign: 'center'
              }}>Время</div>
              {weekDays.map((day, idx) => (
                <div key={idx} className={`day-header ${isToday(day) ? 'day-header-today' : ''}`} style={{
                  background: isToday(day) ? 'rgba(40, 80, 167, 0.15)' : 'rgba(255, 255, 255, 0.6)',
                  padding: '12px',
                  textAlign: 'center',
                  borderLeft: isToday(day) ? '2px solid #2850a7' : 'none'
                }}>
                  <div className="weekday" style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{formatWeekDay(day)}</div>
                  <div className="day-number" style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{formatDate(day)}</div>
                </div>
              ))}
            </div>

            {hours.map((hour) => (
              <div key={hour} className="calendar-row" style={{
                display: 'grid',
                gridTemplateColumns: '80px repeat(7, 1fr)',
                gap: '1px',
                background: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '1px'
              }}>
                <div className="time-cell" style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  padding: '12px',
                  fontWeight: '600',
                  color: '#475569',
                  textAlign: 'center',
                  fontSize: '14px'
                }}>{hour}:00</div>
                {weekDays.map((day, dayIdx) => {
                  const booked = isHourBooked(day, hour);
                  const selected = isHourSelected(day, hour);
                  
                  const now = new Date();
                  const nowRounded = new Date(now);
                  nowRounded.setMilliseconds(0);
                  nowRounded.setSeconds(0);
                  
                  const selectedDate = new Date(day);
                  selectedDate.setHours(hour, 0, 0, 0);
                  const isPast = selectedDate.getTime() < nowRounded.getTime() && isToday(day);
                  
                  let cellStyle = {
                    padding: '12px',
                    minHeight: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    fontSize: '18px',
                    cursor: 'pointer'
                  };
                  
                  if (booked || isPast) {
                    cellStyle = {
                      ...cellStyle,
                      background: 'rgba(148, 163, 184, 0.3)',
                      cursor: 'not-allowed'
                    };
                  } else if (selected) {
                    cellStyle = {
                      ...cellStyle,
                      background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
                      color: 'white',
                      boxShadow: 'inset 0 0 0 2px rgba(255, 255, 255, 0.3)'
                    };
                  } else {
                    cellStyle = {
                      ...cellStyle,
                      background: 'rgba(255, 255, 255, 0.4)'
                    };
                  }
                  
                  return (
                    <div
                      key={dayIdx}
                      className="calendar-cell"
                      onClick={() => !booked && !isPast && handleSlotClick(day, hour)}
                      style={cellStyle}
                      onMouseEnter={(e) => {
                        if (!booked && !isPast && !selected) {
                          e.currentTarget.style.background = 'rgba(40, 80, 167, 0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!booked && !isPast && !selected) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
                        }
                      }}
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

        <div className="legend" style={{
          display: 'flex',
          gap: '24px',
          marginBottom: '32px',
          padding: '16px 20px',
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          flexWrap: 'wrap'
        }}>
          <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="legend-available" style={{ 
              width: '20px', 
              height: '20px', 
              background: 'rgba(255, 255, 255, 0.4)',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.4)'
            }}></div>
            <span style={{ color: '#475569', fontWeight: '500' }}>Доступно</span>
          </div>
          <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="legend-selected" style={{ 
              width: '20px', 
              height: '20px', 
              background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
              borderRadius: '4px'
            }}></div>
            <span style={{ color: '#475569', fontWeight: '500' }}>Выбрано</span>
          </div>
          <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="legend-booked" style={{ 
              width: '20px', 
              height: '20px', 
              background: 'rgba(148, 163, 184, 0.3)',
              borderRadius: '4px',
              border: '1px solid rgba(148, 163, 184, 0.4)'
            }}></div>
            <span style={{ color: '#475569', fontWeight: '500' }}>Занято</span>
          </div>
        </div>

        <div className="bookingform-selected" style={{
          background: 'rgba(235, 248, 245, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ 
            fontSize: '20px',
            fontWeight: '700',
            color: '#0f172a',
            marginTop: 0,
            marginBottom: '20px'
          }}>
            Выбранные часы: {selectedSlots.length}
          </h3>
          
          {selectedSlots.length > 0 && (
            <div className="selected-list" style={{ marginBottom: '20px' }}>
              {intervals.map((interval, idx) => {
                const hoursCount = interval.endHour - interval.startHour;
                const price = getIntervalPrice(interval);
                return (
                  <div key={idx} className="selected-interval" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '10px',
                    marginBottom: '8px',
                    color: '#334155',
                    fontWeight: '500',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <span>{interval.displayDate}</span>
                    <span>{interval.startTime} - {interval.endTime}</span>
                    <span>{hoursCount} ч × {room.price_per_hour} ₽ = <strong style={{ color: '#2850a7' }}>{price} ₽</strong></span>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="selected-total" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            background: 'rgba(40, 80, 167, 0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(40, 80, 167, 0.2)',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '18px',
            fontWeight: '700',
            color: '#0f172a'
          }}>
            <span>Итого:</span>
            <span style={{ color: '#2850a7' }}>{totalPrice} ₽</span>
          </div>
          
          <button 
            className="submit-booking-btn" 
            onClick={handleSubmitBooking}
            disabled={bookingLoading || selectedSlots.length === 0}
            style={{
              width: '100%',
              padding: '16px',
              background: (bookingLoading || selectedSlots.length === 0)
                ? '#94a3b8'
                : 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: (bookingLoading || selectedSlots.length === 0) ? 'not-allowed' : 'pointer',
              boxShadow: (!bookingLoading && selectedSlots.length > 0) 
                ? '0 6px 16px rgba(40, 80, 167, 0.35)' 
                : 'none',
              transition: 'all 0.2s',
              letterSpacing: '0.3px'
            }}
            onMouseEnter={(e) => {
              if (!bookingLoading && selectedSlots.length > 0) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(40, 80, 167, 0.45)';
              }
            }}
            onMouseLeave={(e) => {
              if (!bookingLoading && selectedSlots.length > 0) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(40, 80, 167, 0.35)';
              }
            }}
          >
            {bookingLoading ? 'Бронирование...' : `Забронировать (${selectedSlots.length} час)`}
          </button>
          
          {bookingError && (
            <div className="error-message" style={{
              background: 'rgba(254, 242, 242, 0.9)',
              backdropFilter: 'blur(8px)',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '12px',
              marginTop: '16px',
              fontSize: '14px',
              fontWeight: '600',
              border: '1px solid rgba(254, 226, 226, 0.5)'
            }}>
              {bookingError}
            </div>
          )}
          {bookingSuccess && (
            <div className="success-message" style={{
              background: 'rgba(220, 252, 231, 0.9)',
              backdropFilter: 'blur(8px)',
              color: '#166534',
              padding: '12px 16px',
              borderRadius: '12px',
              marginTop: '16px',
              fontSize: '14px',
              fontWeight: '600',
              border: '1px solid rgba(220, 252, 231, 0.5)'
            }}>
              {bookingSuccess}
            </div>
          )}
        </div>
      </div>
    </>
  );
}