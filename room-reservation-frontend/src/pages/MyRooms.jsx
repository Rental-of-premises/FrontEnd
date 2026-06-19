// src/pages/MyRooms.jsx
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  useGetMyApartmentsQuery, 
  useDeleteApartmentMutation,
  useGetSellerBookingsQuery,
  useConfirmBookingMutation,
  useRejectBookingMutation
} from '../store/api';
import Navbar from '../components/Navbar';

export default function MyRooms() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' | 'bookings'
  
  // ===== МОИ ПОМЕЩЕНИЯ =====
  const { data: response = {}, isLoading: roomsLoading, error: roomsError, refetch: refetchRooms } = useGetMyApartmentsQuery(undefined, {
    skip: !user,
  });
  
  // ===== БРОНИ МОИХ ПОМЕЩЕНИЙ =====
  const { data: sellerBookings = [], isLoading: bookingsLoading, error: bookingsError, refetch: refetchBookings } = useGetSellerBookingsQuery(undefined, {
    skip: !user,
  });
  
  const [deleteApartment] = useDeleteApartmentMutation();
  const [confirmBooking] = useConfirmBookingMutation();
  const [rejectBooking] = useRejectBookingMutation();
  const [deletingId, setDeletingId] = useState(null);
  const [processingBookingId, setProcessingBookingId] = useState(null);

  // ===== ИЗВЛЕКАЕМ ДАННЫЕ =====
  const roomsData = response?.apartments || [];
  const images = response?.images || [];

  // ===== КАРТА ИЗОБРАЖЕНИЙ =====
  const imageMap = {};
  if (Array.isArray(images)) {
    images.forEach((imageList, index) => {
      if (Array.isArray(imageList) && imageList.length > 0) {
        imageMap[roomsData[index]?.id] = imageList[0]?.image_url;
      }
    });
  }

  // ===== СОРТИРОВКА ПОМЕЩЕНИЙ =====
  const rooms = useMemo(() => {
    const data = Array.isArray(roomsData) ? roomsData : [];
    return [...data].sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });
  }, [roomsData]);

  // ===== ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ИЗОБРАЖЕНИЯ =====
  const getRoomImage = (room) => {
    if (imageMap[room.id]) {
      return imageMap[room.id];
    }
    return 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80';
  };

  // ===== УДАЛЕНИЕ ПОМЕЩЕНИЯ =====
  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить это помещение?')) return;
    
    setDeletingId(id);
    try {
      await deleteApartment(id).unwrap();
      refetchRooms();
    } catch (err) {
      alert('Ошибка при удалении помещения');
    } finally {
      setDeletingId(null);
    }
  };

  // ===== ПОДТВЕРЖДЕНИЕ БРОНИРОВАНИЯ =====
  const handleConfirmBooking = async (bookingId) => {
    if (!window.confirm('Подтвердить бронирование?')) return;
    
    setProcessingBookingId(bookingId);
    try {
      await confirmBooking(bookingId).unwrap();
      alert('✅ Бронирование подтверждено!');
      refetchBookings();
    } catch (err) {
      alert('❌ Ошибка при подтверждении: ' + (err.data?.error || 'Неизвестная ошибка'));
    } finally {
      setProcessingBookingId(null);
    }
  };

  // ===== ОТКЛОНЕНИЕ БРОНИРОВАНИЯ =====
  const handleRejectBooking = async (bookingId) => {
    if (!window.confirm('Отклонить бронирование?')) return;
    
    setProcessingBookingId(bookingId);
    try {
      await rejectBooking(bookingId).unwrap();
      alert('❌ Бронирование отклонено');
      refetchBookings();
    } catch (err) {
      alert('❌ Ошибка при отклонении: ' + (err.data?.error || 'Неизвестная ошибка'));
    } finally {
      setProcessingBookingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Неизвестно';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatFullDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'confirmed': return '✅ Подтверждено'
      case 'waiting': return '⏳ Ожидает подтверждения'
      case 'completed': return '📌 Завершено'
      case 'cancelled': return '❌ Отменено'
      case 'rejected': return '🚫 Отклонено'
      default: return status
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'confirmed': return 'status-badge confirmed'
      case 'waiting': return 'status-badge waiting'
      case 'completed': return 'status-badge completed'
      case 'cancelled': return 'status-badge cancelled'
      case 'rejected': return 'status-badge cancelled'
      default: return 'status-badge'
    }
  };

  // ===== ЗАГРУЗКА =====
  if (roomsLoading || bookingsLoading) {
    return (
      <>
        <Navbar />
        <div className="loader">
          <div className="spinner"></div>
        </div>
      </>
    );
  }

  if (roomsError) {
    return (
      <>
        <Navbar />
        <div className="myrooms-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '50px 24px' }}>
          <div className="error-message" style={{ background: '#fef2f2', color: '#ef4444', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <h3>Ошибка загрузки помещений</h3>
            <p>{roomsError?.data?.error || roomsError?.message || 'Попробуйте позже'}</p>
            <button onClick={() => refetchRooms()} className="auth-btn" style={{ marginTop: '16px' }}>
              Повторить попытку
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="myrooms-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '50px 24px' }}>
          <div className="error-message" style={{ background: '#fef2f2', color: '#ef4444', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <h3>Требуется авторизация</h3>
            <p>Пожалуйста, войдите в аккаунт, чтобы просматривать свои помещения.</p>
            <Link to="/login">
              <button className="auth-btn" style={{ marginTop: '16px' }}>
                Войти
              </button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const waitingBookings = sellerBookings.filter(b => b.status === 'waiting');

  return (
    <>
      <Navbar />
      <div className="myrooms-container" style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '50px 24px', 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
      }}>
        
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
            <h1 style={{ fontSize: '36px', fontWeight: '700', margin: '0 0 10px 0', letterSpacing: '-0.03em' }}>Мои помещения</h1>
            <p style={{ color: '#f0f4ff', fontSize: '16px', margin: 0, opacity: 0.9 }}>Управляйте своими помещениями и бронированиями</p>
          </div>
          <Link to="/create-room" style={{ textDecoration: 'none' }}>
            <button style={{
              background: '#ffffff',
              color: '#2850a7',
              border: 'none',
              padding: '14px 28px',
              borderRadius: '14px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            }}>
              + Добавить помещение
            </button>
          </Link>
        </div>

        {/* ===== ВКЛАДКИ ===== */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '32px',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '16px'
        }}>
          <button
            onClick={() => setActiveTab('rooms')}
            style={{
              padding: '10px 24px',
              background: activeTab === 'rooms' ? '#2850a7' : 'transparent',
              color: activeTab === 'rooms' ? '#ffffff' : '#64748b',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🏠 Мои помещения ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            style={{
              padding: '10px 24px',
              background: activeTab === 'bookings' ? '#2850a7' : 'transparent',
              color: activeTab === 'bookings' ? '#ffffff' : '#64748b',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            📋 Брони моих помещений
            {waitingBookings.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                background: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: '700'
              }}>
                {waitingBookings.length}
              </span>
            )}
          </button>
        </div>

        {/* ===== ВКЛАДКА: МОИ ПОМЕЩЕНИЯ ===== */}
        {activeTab === 'rooms' && (
          <div className="rooms-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
            gap: '32px',
            width: '100%'
          }}>
            {rooms.length === 0 ? (
              <div style={{ 
                gridColumn: '1/-1', 
                textAlign: 'center', 
                padding: '60px 20px', 
                background: '#ffffff', 
                borderRadius: '24px', 
                border: '1px solid #e2e8f0' 
              }}>
                <h3 style={{ fontSize: '20px', color: '#1e293b', margin: '0 0 8px 0', fontWeight: '700' }}>У вас пока нет добавленных помещений</h3>
                <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 24px 0' }}>Создайте свое первое объявление.</p>
                <Link to="/create-room" style={{ textDecoration: 'none' }}>
                  <button style={{ background: '#2850a7', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Добавить помещение</button>
                </Link>
              </div>
            ) : (
              rooms.map(room => (
                <div 
                  key={room.id} 
                  style={{
                    background: '#ffffff',
                    borderRadius: '24px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 20px -2px rgba(148, 163, 184, 0.06)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxSizing: 'border-box',
                    height: '100%'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 30px 40px -10px rgba(40, 80, 167, 0.08)';
                    e.currentTarget.style.borderColor = '#2850a7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(148, 163, 184, 0.06)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <div style={{ position: 'relative', height: '200px', width: '100%', overflow: 'hidden' }}>
                    <img 
                      src={getRoomImage(room)}
                      alt={room.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <span style={{ 
                      position: 'absolute', 
                      top: '12px', 
                      right: '12px', 
                      padding: '4px 14px', 
                      borderRadius: '20px', 
                      fontSize: '12px', 
                      fontWeight: '600',
                      background: room.is_active !== false ? '#dcfce7' : '#fee2e2',
                      color: room.is_active !== false ? '#16a34a' : '#dc2626'
                    }}>
                      {room.is_active !== false ? 'Активно' : 'Неактивно'}
                    </span>
                  </div>

                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '12px' }}>
                      <h3 style={{ 
                        fontSize: '18px', 
                        fontWeight: '700', 
                        color: '#0f172a', 
                        margin: 0, 
                        letterSpacing: '-0.02em',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {room.name}
                      </h3>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: '700', 
                        color: '#2850a7', 
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}>
                        {room.price_per_hour} ₽ <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '400' }}>/час</span>
                      </div>
                    </div>

                    <p style={{ 
                      color: '#475569', 
                      fontSize: '14px', 
                      lineHeight: '1.5', 
                      margin: '0 0 16px 0',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {room.description?.substring(0, 100) || 'Нет описания'}...
                    </p>

                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '8px',
                      marginBottom: '16px'
                    }}>
                      <span style={{ 
                        padding: '4px 12px', 
                        background: '#f1f5f9', 
                        borderRadius: '20px', 
                        fontSize: '13px', 
                        color: '#475569'
                      }}>
                        {room.capacity} чел.
                      </span>
                      {room.metro && (
                        <span style={{ 
                          padding: '4px 12px', 
                          background: '#eef2ff', 
                          borderRadius: '20px', 
                          fontSize: '13px', 
                          color: '#2850a7'
                        }}>
                          {room.metro}
                        </span>
                      )}
                      <span style={{ 
                        padding: '4px 12px', 
                        background: '#f1f5f9', 
                        borderRadius: '20px', 
                        fontSize: '13px', 
                        color: '#475569'
                      }}>
                        {formatDate(room.created_at)}
                      </span>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '6px', 
                      marginBottom: '20px' 
                    }}>
                      {room.amenities?.slice(0, 4).map((item, idx) => (
                        <span key={idx} style={{ 
                          padding: '4px 10px', 
                          fontSize: '11px', 
                          fontWeight: '500', 
                          color: '#4a5568', 
                          background: '#f1f3f5', 
                          borderRadius: '6px' 
                        }}>
                          {item}
                        </span>
                      ))}
                      {room.amenities?.length > 4 && (
                        <span style={{ 
                          padding: '4px 10px', 
                          fontSize: '11px', 
                          fontWeight: '500', 
                          color: '#4a5568', 
                          background: '#f1f3f5', 
                          borderRadius: '6px' 
                        }}>
                          +{room.amenities.length - 4}
                        </span>
                      )}
                      {(!room.amenities || room.amenities.length === 0) && (
                        <>
                          <span style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '500', color: '#4a5568', background: '#f1f3f5', borderRadius: '6px' }}>WiFi</span>
                          <span style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '500', color: '#4a5568', background: '#f1f3f5', borderRadius: '6px' }}>Кондиционер</span>
                        </>
                      )}
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      gap: '12px', 
                      borderTop: '1px solid #f1f5f9', 
                      paddingTop: '16px',
                      marginTop: 'auto'
                    }}>
                      <Link to={`/edit-room/${room.id}`} style={{
                        flex: 1,
                        textDecoration: 'none',
                        background: '#2850a7',
                        color: '#ffffff',
                        fontWeight: '600',
                        fontSize: '14px',
                        padding: '12px',
                        borderRadius: '10px',
                        textAlign: 'center',
                        boxShadow: '0 4px 12px rgba(40, 80, 167, 0.15)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => { 
                        e.currentTarget.style.background = '#1e3d82';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => { 
                        e.currentTarget.style.background = '#2850a7';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}>
                        Редактировать
                      </Link>
                      <button 
                        onClick={() => handleDelete(room.id)}
                        disabled={deletingId === room.id}
                        style={{
                          padding: '12px 20px',
                          background: '#fef2f2',
                          color: '#ef4444',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: '600',
                          fontSize: '14px',
                          cursor: deletingId === room.id ? 'not-allowed' : 'pointer',
                          opacity: deletingId === room.id ? 0.6 : 1,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => { if (!deletingId) e.currentTarget.style.background = '#fee2e2'; }}
                        onMouseLeave={(e) => { if (!deletingId) e.currentTarget.style.background = '#fef2f2'; }}
                      >
                        {deletingId === room.id ? '...' : 'Удалить'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ===== ВКЛАДКА: БРОНИ МОИХ ПОМЕЩЕНИЙ ===== */}
        {activeTab === 'bookings' && (
          <div className="bookings-list">
            {sellerBookings.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px', 
                background: '#ffffff', 
                borderRadius: '24px', 
                border: '1px solid #e2e8f0' 
              }}>
                <h3 style={{ fontSize: '20px', color: '#1e293b', margin: '0 0 8px 0', fontWeight: '700' }}>Нет бронирований</h3>
                <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>Пока никто не бронировал ваши помещения</p>
              </div>
            ) : (
              sellerBookings.map(booking => {
                const hoursDiff = (new Date(booking.time_to) - new Date(booking.time_from)) / 3600000;
                const totalPrice = hoursDiff * (booking.price_per_hour || 0);
                const isWaiting = booking.status === 'waiting';

                return (
                  <div 
                    key={booking.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '20px',
                      padding: '24px',
                      marginBottom: '16px',
                      border: '1px solid #e2e8f0',
                      borderLeft: isWaiting ? '4px solid #f59e0b' : '4px solid #10b981',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>
                          {booking.apartment_title || `Помещение #${booking.apartment_id}`}
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: '#64748b', fontSize: '14px' }}>
                          <span>👤 {booking.user_name || `Пользователь #${booking.user_id}`}</span>
                          <span>📅 {formatFullDate(booking.time_from)}</span>
                          <span>⏱️ {hoursDiff.toFixed(1)} ч.</span>
                          <span>💰 {totalPrice.toFixed(0)} ₽</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className={getStatusBadgeClass(booking.status)}>
                          {getStatusText(booking.status)}
                        </span>
                      </div>
                    </div>

                    {isWaiting && (
                      <div style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        marginTop: '16px', 
                        paddingTop: '16px', 
                        borderTop: '1px solid #f1f5f9' 
                      }}>
                        <button
                          onClick={() => handleConfirmBooking(booking.id)}
                          disabled={processingBookingId === booking.id}
                          style={{
                            padding: '10px 24px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '600',
                            cursor: processingBookingId === booking.id ? 'not-allowed' : 'pointer',
                            opacity: processingBookingId === booking.id ? 0.6 : 1,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (!processingBookingId) e.currentTarget.style.background = '#059669';
                          }}
                          onMouseLeave={(e) => {
                            if (!processingBookingId) e.currentTarget.style.background = '#10b981';
                          }}
                        >
                          ✅ Подтвердить
                        </button>
                        <button
                          onClick={() => handleRejectBooking(booking.id)}
                          disabled={processingBookingId === booking.id}
                          style={{
                            padding: '10px 24px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '600',
                            cursor: processingBookingId === booking.id ? 'not-allowed' : 'pointer',
                            opacity: processingBookingId === booking.id ? 0.6 : 1,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (!processingBookingId) e.currentTarget.style.background = '#dc2626';
                          }}
                          onMouseLeave={(e) => {
                            if (!processingBookingId) e.currentTarget.style.background = '#ef4444';
                          }}
                        >
                          ❌ Отклонить
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </>
  );
}