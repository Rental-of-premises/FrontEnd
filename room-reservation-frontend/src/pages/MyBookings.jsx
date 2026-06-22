import { useState, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import { useGetMyBookingsQuery, useCancelBookingMutation, useGetCatalogQuery } from '../store/api'
import Navbar from '../components/Navbar'
import '../styles/mybookings.css'

const API_URL = 'https://team3.verstack.ru';

export default function MyBookings() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('active')
  
  const { data: allBookings = [], isLoading: bookingsLoading, error, refetch } = useGetMyBookingsQuery(undefined, {
    skip: !user,
  })
  
  const { data: catalogResponse = {}, isLoading: roomsLoading } = useGetCatalogQuery({ limit: 1000, offset: 0 })
  const [cancelBooking] = useCancelBookingMutation()

  const allRooms = catalogResponse?.apartments || []

  const roomsMap = useMemo(() => {
    const map = {}
    const safeRooms = Array.isArray(allRooms) ? allRooms : []
    safeRooms.forEach(room => {
      map[room.id] = room
    })
    return map
  }, [allRooms])

  const enrichedBookings = useMemo(() => {
    const now = new Date()
    const safeBookings = Array.isArray(allBookings) ? allBookings : []
    
    return safeBookings.map(booking => {
      const room = roomsMap[booking.apartment_id]
      const timeTo = new Date(booking.time_to)
      
      let displayStatus = booking.status
      if (booking.status === 'confirmed' && timeTo < now) {
        displayStatus = 'completed'
      }
      
      return {
        ...booking,
        apartment_title: room?.name || `Помещение #${booking.apartment_id}`,
        price_per_hour: room?.price_per_hour || 0,
        capacity: room?.capacity || 0,
        displayStatus: displayStatus,
        room_id: room?.id || booking.apartment_id
      }
    })
  }, [allBookings, roomsMap])

  const sortedByDate = useMemo(() => {
    const safeBookings = Array.isArray(enrichedBookings) ? enrichedBookings : []
    return [...safeBookings].sort((a, b) => {
      const dateA = new Date(a.time_from || a.created_at || 0)
      const dateB = new Date(b.time_from || b.created_at || 0)
      return dateB - dateA
    })
  }, [enrichedBookings])

  const stats = useMemo(() => {
    const all = Array.isArray(sortedByDate) ? sortedByDate : []
    return {
      active: all.filter(b => b.displayStatus === 'confirmed').length,
      waiting: all.filter(b => b.displayStatus === 'waiting').length,
      completed: all.filter(b => b.displayStatus === 'completed').length,
      cancelled: all.filter(b => b.displayStatus === 'cancelled' || b.displayStatus === 'rejected').length,
      total: all.length
    }
  }, [sortedByDate])

  const filteredBookings = useMemo(() => {
    const all = Array.isArray(sortedByDate) ? sortedByDate : []
    if (statusFilter === 'active') {
      return all.filter(b => b.displayStatus === 'confirmed')
    }
    if (statusFilter === 'waiting') {
      return all.filter(b => b.displayStatus === 'waiting')
    }
    if (statusFilter === 'history') {
      return all.filter(b => b.displayStatus === 'completed' || b.displayStatus === 'cancelled' || b.displayStatus === 'rejected')
    }
    return all
  }, [sortedByDate, statusFilter])

  const hourlySlots = useMemo(() => {
    const all = Array.isArray(sortedByDate) ? sortedByDate : []
    const activeBookings = all.filter(b => b.displayStatus === 'confirmed')
    const slots = []
    
    if (Array.isArray(activeBookings)) {
      activeBookings.forEach(booking => {
        try {
          const startDate = new Date(booking.time_from)
          const endDate = new Date(booking.time_to)
          const startHour = startDate.getHours()
          const endHour = endDate.getHours()
          const dateStr = startDate.toISOString().split('T')[0]
          
          for (let hour = startHour; hour < endHour; hour++) {
            slots.push({
              id: `${booking.id}-${hour}`,
              bookingId: booking.id,
              workspace: booking.apartment_title || `Помещение #${booking.apartment_id}`,
              apartment_id: booking.apartment_id,
              date: dateStr,
              startTime: `${hour}:00`,
              endTime: `${hour + 1}:00`,
              capacity: booking.capacity || 0,
              price_per_hour: booking.price_per_hour || 0,
              status: booking.status,
              displayStatus: booking.displayStatus,
              created_at: booking.created_at,
              originalBooking: booking
            })
          }
        } catch (err) {
          console.warn('Ошибка при создании слота для брони:', booking.id, err)
        }
      })
    }
    
    return slots
  }, [sortedByDate])

  const weekDays = useMemo(() => {
    const startDate = new Date(currentDate)
    const day = currentDate.getDay()
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1)
    startDate.setDate(diff)
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      days.push(date)
    }
    return days
  }, [currentDate])

  const hours = useMemo(() => {
    const h = []
    for (let i = 8; i <= 22; i++) h.push(i)
    return h
  }, [])

  const getSlotForHour = (date, hour) => {
    const dateStr = date.toISOString().split('T')[0]
    return hourlySlots.find(slot => slot.date === dateStr && parseInt(slot.startTime.split(':')[0]) === hour)
  }

  const goToPrevWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }

  const formatWeekDay = (date) => {
    return date.toLocaleDateString('ru-RU', { weekday: 'short' })
  }

  const formatFullDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const handleSlotClick = (slot) => {
    if (slot && slot.originalBooking) {
      setSelectedBooking(slot.originalBooking)
      setModalOpen(true)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Вы уверены, что хотите отменить это бронирование?')) {
      try {
        await cancelBooking(bookingId).unwrap()
        refetch()
        setModalOpen(false)
      } catch (err) {
        alert('Ошибка при отмене бронирования: ' + (err.data?.error || 'Неизвестная ошибка'))
      }
    }
  }

  const getStatusText = (status) => {
    switch(status) {
      case 'confirmed': return 'Подтверждено'
      case 'waiting': return 'Ожидает подтверждения'
      case 'completed': return 'Завершено'
      case 'cancelled': return 'Отменено'
      case 'rejected': return 'Отклонено'
      default: return status
    }
  }

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'confirmed': return 'status-badge confirmed'
      case 'waiting': return 'status-badge waiting'
      case 'completed': return 'status-badge completed'
      case 'cancelled': return 'status-badge cancelled'
      case 'rejected': return 'status-badge cancelled'
      default: return 'status-badge'
    }
  }

  const getHistoryCardClass = (status) => {
    switch(status) {
      case 'waiting': return 'history-waiting'
      case 'completed': return 'history-completed'
      case 'cancelled': return 'history-cancelled'
      case 'rejected': return 'history-cancelled'
      default: return ''
    }
  }

  const getBadgeStyles = (status) => {
    const base = { padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }
    if (status === 'confirmed') return { ...base, background: '#e0f2fe', color: '#0369a1' }
    if (status === 'waiting') return { ...base, background: '#fef3c7', color: '#b45309' }
    if (status === 'completed') return { ...base, background: '#dcfce7', color: '#15803d' }
    return { ...base, background: '#ffeeee', color: '#bc2222' }
  }

  if (!user) {
  return (
    <>
      <Navbar />
      <div className="mybookings-page">
        <div className="error-message" style={{ 
          background: 'rgba(254, 242, 242, 0.9)',
          backdropFilter: 'blur(12px)',
          color: '#dc2626',
          padding: '16px',
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto',
          border: '1px solid rgba(254, 226, 226, 0.5)'
        }}>
          <h3>Требуется авторизация</h3>
          <p>Пожалуйста, войдите в аккаунт, чтобы просматривать свои бронирования.</p>
          <Link to="/login">
            <button className="auth-btn" style={{ 
              marginTop: '16px',
              background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(40, 80, 167, 0.3)'
            }}>
              Войти
            </button>
          </Link>
        </div>
      </div>
    </>
  )
}

if (bookingsLoading || roomsLoading) {
  return (
    <>
      <Navbar />
      <div className="loader">
        <div className="spinner"></div>
      </div>
    </>
  )
}

if (error) {
  return (
    <>
      <Navbar />
      <div className="mybookings-page">
        <div className="error-message" style={{ 
          background: 'rgba(254, 242, 242, 0.9)',
          backdropFilter: 'blur(12px)',
          color: '#dc2626',
          padding: '16px',
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto',
          border: '1px solid rgba(254, 226, 226, 0.5)'
        }}>
          <h3>Ошибка загрузки бронирований</h3>
          <p>{error?.data?.error || error?.message || 'Попробуйте позже'}</p>
          <button onClick={() => refetch()} className="auth-btn" style={{ 
            marginTop: '16px',
            background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '10px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Повторить попытку
          </button>
        </div>
      </div>
    </>
  )
}

const hasAnyBookings = sortedByDate.length > 0

return (
  <>
    <Navbar />
    <div className="mybookings-page" style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '50px 24px', 
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      background: 'transparent'
    }}>
      
      <div style={{ 
        background: 'rgba(235, 248, 245, 0.85)',
        backdropFilter: 'blur(12px)',
        padding: '44px 48px', 
        borderRadius: '24px', 
        marginBottom: '40px',
        color: '#0f172a',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: '800', 
            margin: '0 0 10px 0', 
            letterSpacing: '-0.03em',
            color: '#0f172a',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>Мои бронирования</h1>
          <p style={{ 
            color: '#475569', 
            fontSize: '16px', 
            margin: 0, 
            fontWeight: '500'
          }}>Добро пожаловать, {user?.name || 'Пользователь'}!</p>
        </div>
        {hasAnyBookings && (
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            background: 'rgba(255,255,255,0.6)',
            padding: '16px 24px', 
            borderRadius: '16px', 
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{stats.active}</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>активных</div>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.4)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{stats.waiting}</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>ожидают</div>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.4)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{stats.completed}</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>завершено</div>
            </div>
          </div>
        )}
      </div>

      {!hasAnyBookings ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'rgba(235, 248, 245, 0.85)',
          backdropFilter: 'blur(12px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            fontSize: '72px',
            fontWeight: '700',
            color: '#2850a7',
            transform: 'rotate(90deg)',
            display: 'inline-block',
            marginBottom: '20px',
            opacity: 0.85,
            animation: 'float 3s ease-in-out infinite',
            letterSpacing: '-4px',
            fontFamily: 'monospace'
          }}>
            :(
          </div>
          
          <h2 style={{ 
            fontSize: '28px', 
            color: '#0f172a', 
            marginBottom: '12px', 
            fontWeight: '700',
            letterSpacing: '-0.02em'
          }}>
            У вас пока нет бронирований
          </h2>
          
          <p style={{ 
            color: '#475569', 
            fontSize: '16px', 
            marginBottom: '32px',
            lineHeight: '1.6',
            fontWeight: '500'
          }}>
            Найдите подходящее помещение в каталоге и забронируйте его
          </p>
          
          <Link to="/catalog" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '14px 40px',
              background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 6px 16px rgba(40, 80, 167, 0.35)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(40, 80, 167, 0.45)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(40, 80, 167, 0.35)'
            }}>
              Перейти в каталог
            </button>
          </Link>
        </div>
      ) : (
        <>
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginBottom: '32px', 
            borderBottom: '1px solid rgba(255, 255, 255, 0.3)', 
            paddingBottom: '16px' 
          }}>
            {['active', 'waiting', 'history'].map((type) => {
              const labels = { 
                active: `Активные (${stats.active})`, 
                waiting: `Ожидают (${stats.waiting})`, 
                history: `История (${stats.completed + stats.cancelled})` 
              }
              const active = statusFilter === type
              return (
                <button
                  key={type}
                  onClick={() => setStatusFilter(type)}
                  style={{
                    padding: '10px 20px',
                    background: active ? 'rgba(235, 248, 245, 0.95)' : 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(8px)',
                    color: active ? '#0f172a' : '#475569',
                    border: active ? '2px solid #2850a7' : '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: active ? '0 4px 12px rgba(40, 80, 167, 0.15)' : 'none'
                  }}
                >
                  {labels[type]}
                </button>
              )
            })}
          </div>

          {statusFilter === 'active' && (
            <>
              <div className="nav-buttons" style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
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
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(40, 80, 167, 0.25)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(40, 80, 167, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 80, 167, 0.25)';
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
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                overflow: 'auto'
              }}>
                <div className="calendar-table">
                  <div className="calendar-header-row" style={{
                    display: 'grid',
                    gridTemplateColumns: '80px repeat(7, 1fr)',
                    gap: '1px',
                    background: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '10px',
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
                        background: isToday(day) ? 'rgba(40, 80, 167, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                        padding: '12px',
                        textAlign: 'center'
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
                        const slot = getSlotForHour(day, hour)
                        const booked = !!slot
                        return (
                          <div
                            key={dayIdx}
                            className={`calendar-cell ${booked ? 'calendar-cell-booked' : 'calendar-cell-free'}`}
                            onClick={() => booked && slot && handleSlotClick(slot)}
                            style={{
                              background: booked ? 'rgba(40, 80, 167, 0.1)' : 'rgba(255, 255, 255, 0.4)',
                              padding: '8px',
                              minHeight: '60px',
                              cursor: booked ? 'pointer' : 'default',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (booked) e.currentTarget.style.background = 'rgba(40, 80, 167, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                              if (booked) e.currentTarget.style.background = 'rgba(40, 80, 167, 0.1)';
                            }}
                          >
                            {booked && slot && (
                              <div className="booking-card" style={{ 
                                background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
                                borderRadius: '8px',
                                padding: '8px',
                                color: 'white',
                                boxShadow: '0 2px 8px rgba(40, 80, 167, 0.2)'
                              }}>
                                <div className="booking-title" style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>{slot.workspace}</div>
                                <div className="booking-time" style={{ fontSize: '11px', opacity: 0.9 }}>{slot.startTime} - {slot.endTime}</div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="legend" style={{
                display: 'flex',
                gap: '24px',
                marginTop: '20px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(8px)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="legend-free" style={{ width: '20px', height: '20px', background: 'rgba(255, 255, 255, 0.4)', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.4)' }}></div>
                  <span style={{ color: '#475569', fontWeight: '500' }}>Свободно</span>
                </div>
                <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="legend-booked" style={{ width: '20px', height: '20px', background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)', borderRadius: '4px' }}></div>
                  <span style={{ color: '#475569', fontWeight: '500' }}>Подтверждено</span>
                </div>
              </div>
            </>
          )}

          {statusFilter === 'waiting' && (
            <div className="history-list">
              {filteredBookings.length === 0 ? (
                <div className="empty-state" style={{
                  background: 'rgba(235, 248, 245, 0.85)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '16px',
                  padding: '60px 20px',
                  textAlign: 'center'
                }}>
                  <h3 className="empty-title" style={{ color: '#0f172a', fontWeight: '700', marginBottom: '8px' }}>Нет бронирований, ожидающих подтверждения</h3>
                  <p className="empty-text" style={{ color: '#475569', fontWeight: '500' }}>Когда вы создадите новое бронирование, оно появится здесь</p>
                </div>
              ) : (
                filteredBookings.map(booking => {
                  const hoursDiff = (new Date(booking.time_to) - new Date(booking.time_from)) / 3600000
                  const totalPrice = hoursDiff * (booking.price_per_hour || 0)
                  
                  return (
                    <div 
                      key={booking.id} 
                      className={`history-card ${getHistoryCardClass(booking.displayStatus)}`}
                      onClick={() => {
                        setSelectedBooking(booking)
                        setModalOpen(true)
                      }}
                      style={{ 
                        borderRadius: '20px', 
                        padding: '30px',
                        background: 'rgba(235, 248, 245, 0.85)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        marginBottom: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      <div className="history-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div className="history-status" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span className={getStatusBadgeClass(booking.displayStatus)} style={{
                            padding: '6px 16px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: 'rgba(254, 243, 199, 0.9)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            color: '#92400e',
                            display: 'inline-block'
                          }}>
                            {getStatusText(booking.displayStatus)}
                          </span>
                          <span className="history-date" style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>{formatFullDate(booking.time_from)}</span>
                        </div>
                        <div className="history-price" style={{ fontSize: '22px', fontWeight: '700', color: '#2850a7' }}>₽{totalPrice.toFixed(0)}</div>
                      </div>
                      <div className="history-card-body">
                        <h3 className="history-workspace" style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>{booking.apartment_title}</h3>
                        <div className="history-time" style={{ color: '#475569', fontSize: '15px', fontWeight: '500', marginBottom: '12px' }}>
                          {new Date(booking.time_from).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - 
                          {new Date(booking.time_to).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="history-details" style={{ display: 'flex', gap: '16px', color: '#64748b', fontSize: '14px' }}>
                          <span>{booking.capacity || 0} чел.</span>
                          <span>₽{booking.price_per_hour || 0}/час</span>
                        </div>
                      </div>
                      <div className="history-card-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.3)', paddingTop: '16px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="history-created" style={{ color: '#64748b', fontSize: '13px' }}>Создано: {new Date(booking.created_at).toLocaleDateString('ru-RU')}</span>
                        <button 
                          className="cancel-small-btn" 
                          onClick={(e) => { e.stopPropagation(); handleCancelBooking(booking.id); }}
                          style={{ 
                            padding: '10px 20px', 
                            background: 'rgba(254, 242, 242, 0.9)',
                            backdropFilter: 'blur(8px)',
                            color: '#dc2626', 
                            border: '1px solid rgba(254, 226, 226, 0.5)', 
                            borderRadius: '10px', 
                            fontWeight: '600', 
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(254, 226, 226, 0.9)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(254, 242, 242, 0.9)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          Отменить
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {statusFilter === 'history' && (
            <div className="history-list">
              {filteredBookings.length === 0 ? (
                <div className="empty-state" style={{
                  background: 'rgba(235, 248, 245, 0.85)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '16px',
                  padding: '60px 20px',
                  textAlign: 'center'
                }}>
                  <h3 className="empty-title" style={{ color: '#0f172a', fontWeight: '700', marginBottom: '8px' }}>Нет бронирований в истории</h3>
                  <p className="empty-text" style={{ color: '#475569', fontWeight: '500' }}>После завершения или отмены бронирований они появятся здесь</p>
                </div>
              ) : (
                filteredBookings.map(booking => {
                  const hoursDiff = (new Date(booking.time_to) - new Date(booking.time_from)) / 3600000
                  const totalPrice = hoursDiff * (booking.price_per_hour || 0)
                  
                  return (
                    <div 
                      key={booking.id} 
                      className={`history-card ${getHistoryCardClass(booking.displayStatus)}`}
                      onClick={() => {
                        setSelectedBooking(booking)
                        setModalOpen(true)
                      }}
                      style={{ 
                        borderRadius: '20px', 
                        padding: '30px',
                        background: 'rgba(235, 248, 245, 0.85)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        marginBottom: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      <div className="history-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div className="history-status" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span className={getStatusBadgeClass(booking.displayStatus)} style={{
                            padding: '6px 16px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: booking.displayStatus === 'completed' ? 'rgba(220, 252, 231, 0.9)' : 'rgba(226, 232, 240, 0.9)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            color: booking.displayStatus === 'completed' ? '#166534' : '#475569',
                            display: 'inline-block'
                          }}>
                            {getStatusText(booking.displayStatus)}
                          </span>
                          <span className="history-date" style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>{formatFullDate(booking.time_from)}</span>
                        </div>
                        <div className="history-price" style={{ fontSize: '22px', fontWeight: '700', color: '#2850a7' }}>₽{totalPrice.toFixed(0)}</div>
                      </div>
                      <div className="history-card-body">
                        <h3 className="history-workspace" style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>{booking.apartment_title}</h3>
                        <div className="history-time" style={{ color: '#475569', fontSize: '15px', fontWeight: '500', marginBottom: '12px' }}>
                          {new Date(booking.time_from).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - 
                          {new Date(booking.time_to).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="history-details" style={{ display: 'flex', gap: '16px', color: '#64748b', fontSize: '14px' }}>
                          <span>{booking.capacity || 0} чел.</span>
                          <span>₽{booking.price_per_hour || 0}/час</span>
                        </div>
                      </div>
                      <div className="history-card-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.3)', paddingTop: '16px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="history-created" style={{ color: '#64748b', fontSize: '13px' }}>Забронировано: {new Date(booking.created_at).toLocaleDateString('ru-RU')}</span>
                        <div className="history-actions">
                          {booking.displayStatus === 'completed' && (
                            <Link to={`/catalog/${booking.room_id}?showReviews=true`} className="review-link" style={{ textDecoration: 'none' }}>
                              <button style={{ 
                                padding: '10px 20px', 
                                background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
                                color: '#ffffff', 
                                border: 'none', 
                                borderRadius: '10px', 
                                fontWeight: '600', 
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(40, 80, 167, 0.25)',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(40, 80, 167, 0.35)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 80, 167, 0.25)';
                              }}>
                                Оставить отзыв
                              </button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </>
      )}
    </div>

    {modalOpen && selectedBooking && (
      <div onClick={() => setModalOpen(false)} style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        background: 'rgba(15, 23, 42, 0.6)', 
        backdropFilter: 'blur(8px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 1000, 
        padding: '20px', 
        boxSizing: 'border-box' 
      }}>
        <div onClick={(e) => e.stopPropagation()} style={{ 
          background: 'rgba(235, 248, 245, 0.95)',
          backdropFilter: 'blur(12px)',
          width: '100%', 
          maxWidth: '520px', 
          borderRadius: '24px', 
          padding: '36px', 
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxSizing: 'border-box' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Детали бронирования</h2>
            <button onClick={() => setModalOpen(false)} style={{ 
              border: 'none', 
              background: 'rgba(255, 255, 255, 0.6)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '20px', 
              color: '#475569', 
              cursor: 'pointer', 
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
            }}>×</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Помещение</div>
              <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: '600' }}>{selectedBooking.apartment_title || 'Неизвестно'}</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Дата</div>
              <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: '500' }}>{formatFullDate(selectedBooking.time_from)}</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Время</div>
              <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: '500' }}>
                {new Date(selectedBooking.time_from).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - 
                {new Date(selectedBooking.time_to).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Статус</div>
              <div style={{ marginTop: '4px' }}>
                <span style={getBadgeStyles(selectedBooking.displayStatus || selectedBooking.status)}>
                  {getStatusText(selectedBooking.displayStatus || selectedBooking.status)}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {(selectedBooking.status === 'confirmed' || selectedBooking.status === 'waiting') && (
              <button 
                onClick={() => handleCancelBooking(selectedBooking.id)}
                style={{ 
                  flex: 1, 
                  padding: '14px', 
                  background: 'rgba(254, 242, 242, 0.9)',
                  backdropFilter: 'blur(8px)',
                  color: '#dc2626', 
                  border: '1px solid rgba(254, 226, 226, 0.5)', 
                  borderRadius: '12px', 
                  fontWeight: '600', 
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(254, 226, 226, 0.9)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(254, 242, 242, 0.9)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Отменить бронь
              </button>
            )}
            <button 
              onClick={() => setModalOpen(false)} 
              style={{ 
                flex: 1, 
                padding: '14px', 
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(8px)',
                color: '#475569', 
                border: '1px solid rgba(255, 255, 255, 0.4)', 
                borderRadius: '12px', 
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
              Закрыть
            </button>
          </div>
        </div>
      </div>
    )}
  </>
)
}