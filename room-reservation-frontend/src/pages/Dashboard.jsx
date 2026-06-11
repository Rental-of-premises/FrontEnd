// src/pages/Dashboard.jsx
import { useAuth } from '../hooks/useAuth'
import { useGetMyBookingsQuery, useGetMyApartmentsQuery, useCancelBookingMutation, useDeleteApartmentMutation } from '../store/api'
import Navbar from '../components/Navbar'
import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { data: bookings = [], refetch: refetchBookings } = useGetMyBookingsQuery()
  const { data: apartments = [], refetch: refetchApartments } = useGetMyApartmentsQuery(user?.id)
  const [cancelBooking] = useCancelBookingMutation()
  const [deleteApartment] = useDeleteApartmentMutation()

  const stats = {
    postedRooms: apartments?.length || 0,
    bookings: bookings?.length || 0
  }

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Отменить бронирование?')) {
      await cancelBooking(bookingId)
      refetchBookings()
    }
  }

  const handleDeleteApartment = async (apartmentId) => {
    if (window.confirm('Удалить помещение?')) {
      await deleteApartment(apartmentId)
      refetchApartments()
    }
  }

  const handleLogout = async () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      await logout()
    }
  }

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <h1 className="page-title">Личный кабинет</h1>
        <p className="page-subtitle">
          Добро пожаловать, {user?.name || 'Пользователь'}!
        </p>
        
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.postedRooms}</div>
            <div className="stat-label">Мои помещения</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.bookings}</div>
            <div className="stat-label">Бронирований</div>
          </div>
        </div>
        
        <div className="dashboard-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="section-title">Мои помещения</h2>
            <Link to="/create-room">
              <button className="add-btn">+ Добавить помещение</button>
            </Link>
          </div>
          {apartments?.length === 0 ? (
            <div className="empty-state">У вас пока нет помещений для сдачи</div>
          ) : (
            apartments?.map(apt => (
              <div key={apt.id} className="space-item">
                <div className="space-info">
                  <h4>{apt.name || apt.title}</h4>
                  <div className="space-price">${apt.price_per_hour}/час</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="delete-btn" 
                    onClick={() => handleDeleteApartment(apt.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="dashboard-section">
          <h2 className="section-title">Мои бронирования</h2>
          {bookings?.length === 0 ? (
            <div className="empty-state">У вас пока нет бронирований</div>
          ) : (
            bookings?.map(booking => (
              <div key={booking.id} className="booking-item">
                <div className="booking-info">
                  <h4>{booking.room_title || booking.apartment_title || `Бронирование #${booking.id}`}</h4>
                  <div className="booking-date">
                    {booking.time_from && new Date(booking.time_from).toLocaleString()} - {booking.time_to && new Date(booking.time_to).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span className={`status-${booking.status}`}>
                    {booking.status === 'confirmed' ? 'подтверждено' : booking.status}
                  </span>
                  <button 
                    className="cancel-btn" 
                    onClick={() => handleCancelBooking(booking.id)}
                  >
                    Отменить
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Кнопка выхода внизу страницы */}
        <div className="logout-section">
          <button onClick={handleLogout} className="dashboard-logout-btn">
          Выйти из аккаунта
          </button>
        </div>
      </div>
    </>
  )
}