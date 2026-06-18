// src/pages/MyRooms.jsx
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGetMyApartmentsQuery, useDeleteApartmentMutation } from '../store/api';
import Navbar from '../components/Navbar';

export default function MyRooms() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useGetMyApartmentsQuery();
  const rooms = data?.apartments || [];
  const [deleteApartment] = useDeleteApartmentMutation();
  const [deletingId, setDeletingId] = useState(null);

  // Сортируем помещения от новых к старым по created_at
  const rooms = useMemo(() => {
    const data = Array.isArray(roomsData) ? roomsData : [];
    return [...data].sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });
  }, [roomsData]);

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить это помещение?')) return;
    
    setDeletingId(id);
    try {
      await deleteApartment(id).unwrap();
      refetch();
    } catch (err) {
      alert('Ошибка при удалении помещения');
    } finally {
      setDeletingId(null);
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
        <div className="myrooms-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '50px 24px' }}>
          <div className="error-message" style={{ background: '#fef2f2', color: '#ef4444', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <h3>Ошибка загрузки помещений</h3>
            <p>{error?.data?.error || error?.message || 'Попробуйте позже'}</p>
            <button onClick={() => refetch()} className="auth-btn" style={{ marginTop: '16px' }}>
              Повторить попытку
            </button>
          </div>
        </div>
      </>
    );
  }

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
            <p style={{ color: '#f0f4ff', fontSize: '16px', margin: 0, opacity: 0.9 }}>Просматривайте и редактируйте ваши рабочие зоны</p>
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

        {/* ===== ГРИД КАРТОЧЕК (как в каталоге) ===== */}
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
                {/* Изображение */}
                <div style={{ position: 'relative', height: '200px', width: '100%', overflow: 'hidden' }}>
                  <img 
                    src={room.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80'} 
                    alt={room.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
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

                {/* Контент */}
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

                  {/* Характеристики (как в каталоге) */}
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

                  {/* Удобства */}
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

                  {/* Кнопки действий */}
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
      </div>
    </>
  );
}