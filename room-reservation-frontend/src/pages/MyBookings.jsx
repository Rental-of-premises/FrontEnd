// src/pages/MyBookings.jsx
import { useState, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import { useGetMyBookingsQuery, useCancelBookingMutation, useGetCatalogQuery } from '../store/api'
import Navbar from '../components/Navbar'
import '../styles/mybookings.css'

export default function MyBookings() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('active')
  
  // ===== РЕАЛЬНЫЙ API =====
  const { data: allBookings = [], isLoading: bookingsLoading, error, refetch } = useGetMyBookingsQuery()
  const { data: allRooms = [], isLoading: roomsLoading } = useGetCatalogQuery({ limit: 1000, offset: 0 })
  const [cancelBooking] = useCancelBookingMutation()

  // Создаём карту помещений с преобразованием ID в число
  const roomsMap = useMemo(() => {
    const map = {}
    allRooms.forEach(room => {
      map[Number(room.id)] = room
    })
    return map
  }, [allRooms])

  // Обогащаем бронирования данными о помещениях
  const enrichedBookings = useMemo(() => {
    const now = new Date()
    
    return allBookings.map(booking => {
      const room = roomsMap[Number(booking.apartment_id)]
      const timeTo = new Date(booking.time_to)
      
      let displayStatus = booking.status
      if (booking.status === 'confirmed' && timeTo < now) {
        displayStatus = 'completed'
      }
      
      // Форматируем дату и время для совместимости с мок-структурой
      const startDate = new Date(booking.time_from)
      const endDate = new Date(booking.time_to)
      const dateStr = startDate.toISOString().split('T')[0]
      const startTime = startDate.toTimeString().slice(0, 5)
      const endTime = endDate.toTimeString().slice(0, 5)
      const hoursDiff = (endDate - startDate) / 3600000
      const totalPrice = hoursDiff * (room?.price_per_hour || booking.price_per_hour || 0)
      
      return {
        ...booking,
        apartment_title: room?.name || `Помещение #${booking.apartment_id}`,
        price_per_hour: room?.price_per_hour || 0,
        capacity: room?.capacity || 0,
        displayStatus: displayStatus,
        room_id: room?.id || booking.apartment_id,
        // Для совместимости с мок-структурой
        workspace: room?.name || `Помещение #${booking.apartment_id}`,
        date: dateStr,
        startTime: startTime,
        endTime: endTime,
        total_price: Math.round(totalPrice)
      }
    })
  }, [allBookings, roomsMap])

  // ===== СТАТИСТИКА =====
  const stats = useMemo(() => {
    const all = enrichedBookings || []
    return {
      active: all.filter(b => b.displayStatus === 'confirmed').length,
      waiting: all.filter(b => b.displayStatus === 'waiting').length,
      completed: all.filter(b => b.displayStatus === 'completed').length,
      cancelled: all.filter(b => b.displayStatus === 'cancelled' || b.displayStatus === 'rejected').length,
      total: all.length
    }
  }, [enrichedBookings])

  // ===== ФИЛЬТРАЦИЯ =====
  const filteredBookings = useMemo(() => {
    const all = enrichedBookings || []
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
  }, [enrichedBookings, statusFilter])

  // ===== ПРЕОБРАЗОВАНИЕ В ПОЧАСОВЫЕ СЛОТЫ =====
  const hourlySlots = useMemo(() => {
    const all = enrichedBookings || []
    const activeBookings = all.filter(b => b.displayStatus === 'confirmed')
    const slots = []
    activeBookings.forEach(booking => {
      const startDate = new Date(booking.time_from)
      const endDate = new Date(booking.time_to)
      const startHour = startDate.getHours()
      const endHour = endDate.getHours()
      const dateStr = startDate.toISOString().split('T')[0]
      
      for (let hour = startHour; hour < endHour; hour++) {
        slots.push({
          id: `${booking.id}-${hour}`,
          bookingId: booking.id,
          workspace: booking.workspace,
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
    })
    return slots
  }, [enrichedBookings])

  // ===== КАЛЕНДАРЬ =====
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
      case 'rejected': return 'status-badge rejected'
      default: return 'status-badge'
    }
  }

  const getHistoryCardClass = (status) => {
    switch(status) {
      case 'waiting': return 'history-waiting'
      case 'completed': return 'history-completed'
      case 'cancelled': return 'history-cancelled'
      case 'rejected': return 'history-rejected'
      default: return ''
    }
  }

  const getBadgeStyles = (status) => {
    const base = { padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }
    if (status === 'confirmed') return { ...base, background: '#e0f2fe', color: '#0369a1' }
    if (status === 'waiting') return { ...base, background: '#fef3c7', color: '#b45309' }
    if (status === 'completed') return { ...base, background: '#dcfce7', color: '#15803d' }
    if (status === 'rejected') return { ...base, background: '#fee2e2', color: '#dc2626' }
    return { ...base, background: '#ffeeee', color: '#bc2222' }
  }

  // ===== ЗАГРУЗКА =====
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
          <div className="error-message">
            <h3>Ошибка загрузки бронирований</h3>
            <p>{error?.data?.error || error?.message || 'Попробуйте позже'}</p>
            <button onClick={() => refetch()} className="auth-btn" style={{ marginTop: '16px' }}>
              Повторить попытку
            </button>
          </div>
        </div>
      </>
    )
  }

  const hasAnyBookings = enrichedBookings.length > 0

  return (
    <>
      <Navbar />
      <div className="mybookings-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '50px 24px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
        
        {/* Шапка */}
        <div style={{ 
          background: '#2850a7', 
          padding: '44px 48px', 
          borderRadius: '24px', 
          marginBottom: '40px',
          color: '#ffffff',
          boxShadow: '0 20px 40px -15px rgba(40, 80, 167, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: '700', margin: '0 0 10px 0', letterSpacing: '-0.03em' }}>Мои бронирования</h1>
            <p style={{ color: '#f0f4ff', fontSize: '16px', margin: 0, opacity: 0.9 }}>Добро пожаловать, {user?.name || 'Пользователь'}!</p>
          </div>
          {hasAnyBookings && (
            <div style={{ display: 'flex', gap: '20px', background: 'rgba(255,255,255,0.1)', padding: '16px 24px', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: '20px', fontWeight: '700' }}>{stats.active}</div><div style={{ fontSize: '12px', opacity: 0.8 }}>активных</div></div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: '20px', fontWeight: '700' }}>{stats.waiting}</div><div style={{ fontSize: '12px', opacity: 0.8 }}>ожидают</div></div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: '20px', fontWeight: '700' }}>{stats.completed}</div><div style={{ fontSize: '12px', opacity: 0.8 }}>завершено</div></div>
            </div>
          )}
        </div>

        {/* ========== ПУСТОЕ СОСТОЯНИЕ ========== */}
        {!hasAnyBookings ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: '#ffffff',
            borderRadius: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            position: 'relative',
            overflow: 'hidden'
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
              color: '#1e293b', 
              marginBottom: '12px', 
              fontWeight: '700',
              letterSpacing: '-0.02em'
            }}>
              У вас пока нет бронирований
            </h2>
            
            <p style={{ 
              color: '#64748b', 
              fontSize: '16px', 
              marginBottom: '32px',
              lineHeight: '1.6'
            }}>
              Найдите подходящее помещение в каталоге и забронируйте его
            </p>
            
            <Link to="/catalog" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '14px 40px',
                background: '#2850a7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(40, 80, 167, 0.2)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1e3d82'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(40, 80, 167, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2850a7'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 80, 167, 0.2)'
              }}>
                Перейти в каталог
              </button>
            </Link>

            <div style={{
              position: 'absolute',
              bottom: '-40px',
              right: '-40px',
              width: '200px',
              height: '200px',
              background: 'rgba(40, 80, 167, 0.03)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              top: '-60px',
              left: '-60px',
              width: '150px',
              height: '150px',
              background: 'rgba(40, 80, 167, 0.02)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />
          </div>
        ) : (
          <>
            {/* ========== ФИЛЬТРЫ ========== */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
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
                      background: active ? '#2850a7' : 'transparent',
                      color: active ? '#ffffff' : '#64748b',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '600',
                      fontSize: '15px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {labels[type]}
                  </button>
                )
              })}
            </div>

            {/* ========== АКТИВНЫЕ (Календарь) ========== */}
            {statusFilter === 'active' && (
              <>
                <div className="nav-buttons" style={{ marginBottom: '24px' }}>
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
                          const slot = getSlotForHour(day, hour)
                          const booked = !!slot
                          return (
                            <div
                              key={dayIdx}
                              className={`calendar-cell ${booked ? 'calendar-cell-booked' : 'calendar-cell-free'}`}
                              onClick={() => booked && slot && handleSlotClick(slot)}
                            >
                              {booked && slot && (
                                <div className="booking-card" style={{ background: '#2850a7' }}>
                                  <div className="booking-title">{slot.workspace}</div>
                                  <div className="booking-time">{slot.startTime} - {slot.endTime}</div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="legend">
                  <div className="legend-item"><div className="legend-free"></div><span>Свободно</span></div>
                  <div className="legend-item"><div className="legend-booked" style={{ background: '#2850a7' }}></div><span>Подтверждено</span></div>
                </div>
              </>
            )}

            {/* ========== ОЖИДАЮТ ========== */}
            {statusFilter === 'waiting' && (
              <div className="history-list">
                {filteredBookings.length === 0 ? (
                  <div className="empty-state">
                    <h3 className="empty-title">Нет бронирований, ожидающих подтверждения</h3>
                    <p className="empty-text">Когда вы создадите новое бронирование, оно появится здесь</p>
                  </div>
                ) : (
                  filteredBookings.map(booking => {
                    const hoursDiff = (new Date(booking.time_to) - new Date(booking.time_from)) / 3600000
                    const totalPrice = hoursDiff * (booking.price_per_hour || 0)
                    
                    return (
                      <div 
                        key={booking.id} 
                        className={`history-card ${getHistoryCardClass(booking.displayStatus)}`}
                        onClick={() => { setSelectedBooking(booking); setModalOpen(true); }}
                        style={{ borderRadius: '20px', padding: '30px' }}
                      >
                        <div className="history-card-header">
                          <div className="history-status">
                            <span className={getStatusBadgeClass(booking.displayStatus)}>
                              {getStatusText(booking.displayStatus)}
                            </span>
                            <span className="history-date">{formatFullDate(booking.time_from)}</span>
                          </div>
                          <div className="history-price" style={{ fontSize: '22px', fontWeight: '700' }}>{Math.round(totalPrice)} ₽</div>
                        </div>
                        <div className="history-card-body">
                          <h3 className="history-workspace" style={{ fontSize: '22px', fontWeight: '700' }}>{booking.workspace}</h3>
                          <div className="history-time">
                            Время: {booking.startTime} - {booking.endTime}
                          </div>
                          <div className="history-details">
                            <span>Вместимость: {booking.capacity || 0} чел.</span>
                            <span>Тариф: {booking.price_per_hour || 0} ₽/час</span>
                          </div>
                        </div>
                        <div className="history-card-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                          <span className="history-created">Создано: {new Date(booking.created_at).toLocaleDateString('ru-RU')}</span>
                          <button 
                            className="cancel-small-btn" 
                            onClick={(e) => { e.stopPropagation(); handleCancelBooking(booking.id); }}
                            style={{ padding: '10px 20px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}
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

            {/* ========== ИСТОРИЯ ========== */}
            {statusFilter === 'history' && (
              <div className="history-list">
                {filteredBookings.length === 0 ? (
                  <div className="empty-state">
                    <h3 className="empty-title">Нет бронирований в истории</h3>
                    <p className="empty-text">После завершения или отмены бронирований они появятся здесь</p>
                  </div>
                ) : (
                  filteredBookings.map(booking => {
                    const hoursDiff = (new Date(booking.time_to) - new Date(booking.time_from)) / 3600000
                    const totalPrice = hoursDiff * (booking.price_per_hour || 0)
                    
                    return (
                      <div 
                        key={booking.id} 
                        className={`history-card ${getHistoryCardClass(booking.displayStatus)}`}
                        onClick={() => { setSelectedBooking(booking); setModalOpen(true); }}
                        style={{ borderRadius: '20px', padding: '30px' }}
                      >
                        <div className="history-card-header">
                          <div className="history-status">
                            <span className={getStatusBadgeClass(booking.displayStatus)}>
                              {getStatusText(booking.displayStatus)}
                            </span>
                            <span className="history-date">{formatFullDate(booking.time_from)}</span>
                          </div>
                          <div className="history-price" style={{ fontSize: '22px', fontWeight: '700' }}>{Math.round(totalPrice)} ₽</div>
                        </div>
                        <div className="history-card-body">
                          <h3 className="history-workspace" style={{ fontSize: '22px', fontWeight: '700' }}>{booking.workspace}</h3>
                          <div className="history-time">
                            Время: {booking.startTime} - {booking.endTime}
                          </div>
                          <div className="history-details">
                            <span>Вместимость: {booking.capacity || 0} чел.</span>
                            <span>Тариф: {booking.price_per_hour || 0} ₽/час</span>
                          </div>
                        </div>
                        <div className="history-card-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                          <span className="history-created">Забронировано: {new Date(booking.created_at).toLocaleDateString('ru-RU')}</span>
                          <div className="history-actions">
                            {booking.displayStatus === 'completed' && (
                              <Link to={`/catalog/${booking.apartment_id}?showReviews=true`} onClick={(e) => e.stopPropagation()} style={{ textDecoration: 'none' }}>
                                <button style={{ padding: '10px 20px', background: '#2850a7', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
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

      {/* ========== МОДАЛЬНОЕ ОКНО ========== */}
      {modalOpen && selectedBooking && (
        <div onClick={() => setModalOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#ffffff', width: '100%', maxWidth: '520px', borderRadius: '24px', padding: '36px', boxShadow: '0 24px 48px rgba(0,0,0,0.15)', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Детали бронирования</h2>
              <button onClick={() => setModalOpen(false)} style={{ border: 'none', background: 'transparent', fontSize: '28px', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>×</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              <div><div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Помещение</div><div style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600' }}>{selectedBooking.workspace}</div></div>
              <div><div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Дата</div><div style={{ fontSize: '16px', color: '#1e293b', fontWeight: '500' }}>{formatFullDate(selectedBooking.time_from)}</div></div>
              <div><div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Время аренды</div><div style={{ fontSize: '16px', color: '#1e293b', fontWeight: '500' }}>{selectedBooking.startTime} - {selectedBooking.endTime}</div></div>
              <div><div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Статус</div><div style={{ marginTop: '4px' }}><span style={getBadgeStyles(selectedBooking.displayStatus || selectedBooking.status)}>{getStatusText(selectedBooking.displayStatus || selectedBooking.status)}</span></div></div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {(selectedBooking.status === 'confirmed' || selectedBooking.status === 'waiting') && (
                <button 
                  onClick={() => handleCancelBooking(selectedBooking.id)}
                  style={{ flex: 1, padding: '14px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Отменить бронь
                </button>
              )}
              <button onClick={() => setModalOpen(false)} style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}