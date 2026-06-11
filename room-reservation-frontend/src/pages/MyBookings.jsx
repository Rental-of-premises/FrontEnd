import { useState, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import '../styles/mybookings.css'

// Мок-данные с разными статусами
const MOCK_BOOKINGS = [
  {
    id: 1,
    workspace: "Modern Coworking Space",
    apartment_id: 5,
    date: new Date().toISOString().split('T')[0],
    startTime: "10:00",
    endTime: "12:00",
    capacity: 20,
    price_per_hour: 15,
    total_price: 30,
    status: "confirmed",
    created_at: "2026-06-01T10:00:00Z"
  },
  {
    id: 2,
    workspace: "Executive Conference Room",
    apartment_id: 8,
    date: new Date().toISOString().split('T')[0],
    startTime: "14:00",
    endTime: "15:00",
    capacity: 12,
    price_per_hour: 50,
    total_price: 50,
    status: "confirmed",
    created_at: "2026-06-01T12:00:00Z"
  },
  {
    id: 3,
    workspace: "Private Office",
    apartment_id: 12,
    date: (() => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow.toISOString().split('T')[0]
    })(),
    startTime: "09:00",
    endTime: "11:00",
    capacity: 2,
    price_per_hour: 25,
    total_price: 50,
    status: "confirmed",
    created_at: "2026-06-02T09:00:00Z"
  },
  {
    id: 4,
    workspace: "Meeting Room Small",
    apartment_id: 15,
    date: (() => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 5)
      return pastDate.toISOString().split('T')[0]
    })(),
    startTime: "15:00",
    endTime: "17:00",
    capacity: 6,
    price_per_hour: 30,
    total_price: 60,
    status: "completed",
    created_at: "2026-05-25T14:00:00Z"
  },
  {
    id: 5,
    workspace: "Large Event Space",
    apartment_id: 20,
    date: (() => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 10)
      return pastDate.toISOString().split('T')[0]
    })(),
    startTime: "11:00",
    endTime: "14:00",
    capacity: 50,
    price_per_hour: 100,
    total_price: 300,
    status: "cancelled",
    created_at: "2026-05-20T11:00:00Z"
  },
  {
    id: 6,
    workspace: "Creative Studio",
    apartment_id: 18,
    date: (() => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 15)
      return pastDate.toISOString().split('T')[0]
    })(),
    startTime: "13:00",
    endTime: "16:00",
    capacity: 15,
    price_per_hour: 35,
    total_price: 105,
    status: "completed",
    created_at: "2026-05-15T13:00:00Z"
  }
]

// Функция для преобразования брони в почасовые слоты
const expandBookingToHourlySlots = (booking) => {
  const slots = []
  const startHour = parseInt(booking.startTime.split(':')[0])
  const endHour = parseInt(booking.endTime.split(':')[0])
  
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push({
      id: `${booking.id}-${hour}`,
      bookingId: booking.id,
      workspace: booking.workspace,
      apartment_id: booking.apartment_id,
      date: booking.date,
      startTime: `${hour}:00`,
      endTime: `${hour + 1}:00`,
      capacity: booking.capacity,
      price_per_hour: booking.price_per_hour,
      status: booking.status,
      created_at: booking.created_at,
      originalBooking: booking
    })
  }
  return slots
}

export default function MyBookings() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [bookings] = useState(MOCK_BOOKINGS)
  const [statusFilter, setStatusFilter] = useState('active')

  // Преобразуем брони в почасовые слоты для активных броней
  const hourlySlots = useMemo(() => {
    const activeBookings = bookings.filter(b => b.status === 'confirmed')
    const slots = []
    activeBookings.forEach(booking => {
      slots.push(...expandBookingToHourlySlots(booking))
    })
    return slots
  }, [bookings])

  const filteredBookings = useMemo(() => {
    if (statusFilter === 'active') {
      return bookings.filter(b => b.status === 'confirmed')
    }
    if (statusFilter === 'history') {
      return bookings.filter(b => b.status === 'completed' || b.status === 'cancelled')
    }
    return bookings
  }, [bookings, statusFilter])

  const activeBookings = useMemo(() => {
    return bookings.filter(b => b.status === 'confirmed')
  }, [bookings])

  const stats = useMemo(() => {
    return {
      active: bookings.filter(b => b.status === 'confirmed').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      total: bookings.length
    }
  }, [bookings])

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

  // Проверка, забронирован ли час (используем почасовые слоты)
  const isHourBooked = (date, hour) => {
    const dateStr = date.toISOString().split('T')[0]
    return hourlySlots.some(slot => slot.date === dateStr && parseInt(slot.startTime.split(':')[0]) === hour)
  }

  // Получение слота для конкретного часа
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

  const handleCancelBooking = (bookingId) => {
    if (window.confirm('Отменить бронирование?')) {
      alert(`Бронирование #${bookingId} отменено`)
      setModalOpen(false)
    }
  }

  const getStatusText = (status) => {
    switch(status) {
      case 'confirmed': return 'Подтверждено'
      case 'completed': return 'Завершено'
      case 'cancelled': return 'Отменено'
      default: return status
    }
  }

  return (
    <>
      <Navbar />
      <div className="mybookings-page">
        <div className="mybookings-header">
          <div>
            <h1 className="mybookings-title">Мои бронирования</h1>
            <p className="mybookings-subtitle">Добро пожаловать, {user?.name || 'Пользователь'}!</p>
          </div>
          <div className="bookings-stats">
            <span className="stats-number active">{stats.active}</span>
            <span className="stats-label">активных</span>
            <span className="stats-number completed">{stats.completed}</span>
            <span className="stats-label">завершено</span>
            <span className="stats-number cancelled">{stats.cancelled}</span>
            <span className="stats-label">отменено</span>
          </div>
        </div>

        <div className="filter-buttons">
          <button 
            className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Активные ({stats.active})
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'history' ? 'active' : ''}`}
            onClick={() => setStatusFilter('history')}
          >
            История ({stats.completed + stats.cancelled})
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Все ({stats.total})
          </button>
        </div>

        {statusFilter === 'active' && (
          <>
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
                            <div className="booking-card">
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
              <div className="legend-item"><div className="legend-free"></div><span className="legend-text">Свободно</span></div>
              <div className="legend-item"><div className="legend-booked"></div><span className="legend-text">Забронировано</span></div>
            </div>
          </>
        )}

        {(statusFilter === 'history' || statusFilter === 'all') && (
          <div className="history-list">
            {filteredBookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"></div>
                <h3 className="empty-title">Нет бронирований в истории</h3>
                <p className="empty-text">После завершения или отмены бронирований они появятся здесь</p>
              </div>
            ) : (
              filteredBookings.map(booking => (
                <div 
                  key={booking.id} 
                  className={`history-card ${booking.status}`}
                  onClick={() => setSelectedBooking(booking)}
                >
                  <div className="history-card-header">
                    <div className="history-status">
                      <span className={`status-badge ${booking.status}`}>
                        {getStatusText(booking.status)}
                      </span>
                      <span className="history-date">{formatFullDate(booking.date)}</span>
                    </div>
                    <div className="history-price">${booking.total_price}</div>
                  </div>
                  <div className="history-card-body">
                    <h3 className="history-workspace">{booking.workspace}</h3>
                    <div className="history-time">
                      {booking.startTime} - {booking.endTime}
                    </div>
                    <div className="history-details">
                      <span>{booking.capacity} чел.</span>
                      <span>${booking.price_per_hour}/час</span>
                    </div>
                  </div>
                  <div className="history-card-footer">
                    <span className="history-created">Забронировано: {new Date(booking.created_at).toLocaleDateString('ru-RU')}</span>
                    {booking.status === 'confirmed' && (
                      <button className="cancel-small-btn" onClick={(e) => { e.stopPropagation(); handleCancelBooking(booking.id); }}>Отменить</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {statusFilter === 'active' && activeBookings.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <h3 className="empty-title">Нет активных бронирований</h3>
            <button onClick={() => window.location.href = '/catalog'} className="go-catalog-btn">Перейти в каталог</button>
          </div>
        )}
      </div>

      {modalOpen && selectedBooking && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Детали бронирования</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-field"><div className="modal-label">Помещение</div><div className="modal-value">{selectedBooking.workspace}</div></div>
              <div className="modal-field"><div className="modal-label">Дата</div><div className="modal-value">{formatFullDate(selectedBooking.date)}</div></div>
              <div className="modal-field"><div className="modal-label">Время</div><div className="modal-value">{selectedBooking.startTime} - {selectedBooking.endTime}</div></div>
              <div className="modal-field"><div className="modal-label">Статус</div><div className="modal-value"><span className={`status-badge ${selectedBooking.status}`}>{getStatusText(selectedBooking.status)}</span></div></div>
            </div>
            <div className="modal-footer">
              {selectedBooking.status === 'confirmed' && <button className="cancel-btn" onClick={() => handleCancelBooking(selectedBooking.id)}>Отменить бронирование</button>}
              <button className="close-btn" onClick={() => setModalOpen(false)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}