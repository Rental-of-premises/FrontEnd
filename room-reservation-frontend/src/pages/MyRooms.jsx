// src/pages/MyRooms.jsx
import { useState, useMemo, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState('rooms');
  const [userNames, setUserNames] = useState({});
  
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

  // ===== ЗАГРУЗКА ИМЕН ПОЛЬЗОВАТЕЛЕЙ =====
  useEffect(() => {
    const fetchUserNames = async () => {
      if (!sellerBookings || sellerBookings.length === 0) return;
      
      const names = {};
      const uniqueUserIds = [...new Set(sellerBookings.map(b => b.user_id).filter(Boolean))];
      
      for (const userId of uniqueUserIds) {
        try {
          const response = await fetch(`https://team3.verstack.ru/api/users/${userId}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          });
          if (response.ok) {
            const userData = await response.json();
            names[userId] = userData.name || `Пользователь #${userId}`;
          } else {
            names[userId] = `Пользователь #${userId}`;
          }
        } catch (err) {
          console.error('Ошибка загрузки пользователя:', err);
          names[userId] = `Пользователь #${userId}`;
        }
      }
      setUserNames(names);
    };
    
    fetchUserNames();
  }, [sellerBookings]);

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

  // ===== СОРТИРОВКА БРОНИРОВАНИЙ: ожидающие сверху =====
  const sortedBookings = useMemo(() => {
    const all = Array.isArray(sellerBookings) ? sellerBookings : [];
    return [...all].sort((a, b) => {
      // Сначала ожидающие
      if (a.status === 'waiting' && b.status !== 'waiting') return -1;
      if (b.status === 'waiting' && a.status !== 'waiting') return 1;
      // Потом по дате (новые сверху)
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [sellerBookings]);

  const waitingBookings = sortedBookings.filter(b => b.status === 'waiting');

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

  // ===== ОСТАЛЬНОЙ КОД (шапка, вкладки и т.д.) =====
  // ... (здесь код, который мы не меняли)

  return (
    <>
      <Navbar />
      <div className="myrooms-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '50px 24px' }}>
        
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
            Мои помещения ({rooms.length})
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
             Брони моих помещений
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
          // ... код для помещений (оставляем как есть)
          <div>Список помещений</div>
        )}

        {/* ===== ВКЛАДКА: БРОНИ МОИХ ПОМЕЩЕНИЙ ===== */}
        {activeTab === 'bookings' && (
          <div className="bookings-list">
            {sortedBookings.length === 0 ? (
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
              sortedBookings.map(booking => {
                const hoursDiff = (new Date(booking.time_to) - new Date(booking.time_from)) / 3600000;
                const totalPrice = hoursDiff * (booking.price_per_hour || 0);
                const isWaiting = booking.status === 'waiting';
                const userName = userNames[booking.user_id] || `Пользователь #${booking.user_id}`;
                const roomName = booking.apartment_title || `Помещение #${booking.apartment_id}`;

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
                          {roomName}
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: '#64748b', fontSize: '14px' }}>
                          <span>👤 <strong>{userName}</strong></span>
                          <span>📅 {formatFullDate(booking.time_from)}</span>
                          <span>⏱️ {hoursDiff.toFixed(1)} ч.</span>
                          <span>💰 <strong>{totalPrice.toFixed(0)} ₽</strong></span>
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