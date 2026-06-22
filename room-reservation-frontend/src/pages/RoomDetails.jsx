import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  useGetApartmentByIdQuery, 
  useCreateBookingMutation,
  useGetReviewsByApartmentQuery,
  useCreateReviewMutation,
  useDeleteReviewMutation
} from '../store/api';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import ImageCarousel from '../components/ImageCarousel';

const API_URL = 'https://team3.verstack.ru';

export default function RoomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: roomData, isLoading, error } = useGetApartmentByIdQuery(id);
  const room = roomData?.apartment || null;
  const images = roomData?.images || [];
  const imageUrls = images.map(img => img.image_data);
  
  const [createBooking, { isLoading: bookingLoading }] = useCreateBookingMutation();
  
  const { 
    data: reviewsData = [], 
    isLoading: reviewsLoading,
    refetch: refetchReviews
  } = useGetReviewsByApartmentQuery(id, {
    skip: !id,
  });

  const [createReview, { isLoading: creatingReview }] = useCreateReviewMutation();
  const [deleteReview, { isLoading: deletingReview }] = useDeleteReviewMutation();

  const [showReviews, setShowReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  
  const [userNames, setUserNames] = useState({});
  const [userAvatars, setUserAvatars] = useState({});
  const [sellerData, setSellerData] = useState(null);
  const [sellerAvatar, setSellerAvatar] = useState(null);
  const [loadingSeller, setLoadingSeller] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('showReviews') === 'true') {
      setShowReviews(true);
    }
  }, []);

  // ========== ЗАГРУЗКА ВЛАДЕЛЬЦА ==========
  useEffect(() => {
    if (room && room.seller_id) {
      const fetchSeller = async () => {
        setLoadingSeller(true);
        try {
          const response = await fetch(`${API_URL}/api/users/${room.seller_id}`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          if (response.ok) {
            const data = await response.json();
            const userData = data.user || data;
            setSellerData(userData);
            if (data.avatar) {
              setSellerAvatar(data.avatar.image_data);
            }
          }
        } catch (err) {
          console.error('Ошибка загрузки владельца:', err);
        } finally {
          setLoadingSeller(false);
        }
      };
      fetchSeller();
    }
  }, [room]);

  // ========== ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЕЙ ДЛЯ ОТЗЫВОВ ==========
  useEffect(() => {
    const safeReviews = Array.isArray(reviewsData) ? reviewsData : [];
    if (safeReviews.length > 0) {
      const fetchUserData = async () => {
        const names = {};
        const avatars = {};
        const uniqueUserIds = [...new Set(safeReviews.map(r => r.user_id).filter(Boolean))];
        
        const promises = uniqueUserIds.map(async (userId) => {
          try {
            const response = await fetch(`${API_URL}/api/users/${userId}`, {
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            if (response.ok) {
              const data = await response.json();
              const userData = data.user || data;
              names[userId] = userData.name || `Пользователь #${userId}`;
              if (data.avatar) {
                avatars[userId] = data.avatar.image_data;
              }
            } else {
              names[userId] = `Пользователь #${userId}`;
            }
          } catch (err) {
            console.error('Ошибка загрузки пользователя:', err);
            names[userId] = `Пользователь #${userId}`;
          }
        });
        
        await Promise.all(promises);
        setUserNames(names);
        setUserAvatars(avatars);
      };
      fetchUserData();
    }
  }, [reviewsData]);

  const handleBooking = () => {
    navigate(`/booking/${id}`);
  };

  const handleRatingClick = (rating) => {
    setReviewData(prev => ({ ...prev, rating }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');
    setShowReviewForm(false);

    if (!reviewData.comment.trim()) {
      setReviewError('Напишите текст отзыва');
      setShowReviewForm(true);
      return;
    }

    try {
      await createReview({
        apartment_id: parseInt(id),
        comment: reviewData.comment,
        stars: reviewData.rating
      }).unwrap();
      
      setReviewSuccess('Отзыв успешно опубликован! Спасибо!');
      setReviewData({ rating: 5, comment: '' });
      refetchReviews();
      
      setTimeout(() => setReviewSuccess(''), 3000);
    } catch (err) {
      setReviewError(err.data?.error || 'Ошибка при отправке отзыва');
      setShowReviewForm(true);
    }
  };

  const handleDeleteReview = async (review) => {
    const reviewId = typeof review === 'object' ? review.id : review;
    
    if (!window.confirm('Вы уверены, что хотите удалить этот отзыв?')) return;
    
    setDeletingReviewId(reviewId);
    try {
      await deleteReview(reviewId).unwrap();
      refetchReviews();
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert(err.data?.error || 'Ошибка при удалении отзыва');
    } finally {
      setDeletingReviewId(null);
    }
  };

  const renderStars = (rating, interactive = false) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star ${star <= rating ? 'active' : ''} ${interactive ? 'interactive' : ''}`}
            onClick={() => interactive && handleRatingClick(star)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const formatReviewDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getAverageRating = () => {
    const safeReviews = Array.isArray(reviewsData) ? reviewsData : [];
    if (safeReviews.length === 0) return 0;
    const sum = safeReviews.reduce((acc, r) => acc + (r.stars || 0), 0);
    return (sum / safeReviews.length).toFixed(1);
  };

  const isReviewAuthor = (review) => {
    return user && review.user_id && review.user_id === user.id;
  };

  const getUserDisplayName = (review) => {
    if (!review || !review.user_id) return 'Неизвестный пользователь';
    return userNames[review.user_id] || `Пользователь #${review.user_id}`;
  };

  const getUserAvatar = (review) => {
    if (!review || !review.user_id) return null;
    return userAvatars[review.user_id] || null;
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

  if (error || !room) {
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
  return (
    <>
      <Navbar />
      <div className="room-details-container">
        <div className="room-details-back">
        <Link to="/catalog" style={{
          display: 'inline-block',
          color: '#e0f2f1',
          background: 'rgba(38, 166, 154, 0.2)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(38, 166, 154, 0.5)',
          padding: '8px 20px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '500',
          textDecoration: 'none',
          transition: 'all 0.2s ease'
        }}>
          ← Назад к каталогу
        </Link>
      </div>

        <div className="room-details-grid">
          <div className="room-details-info">
            <ImageCarousel images={imageUrls} alt={room?.name || 'Помещение'} />
            
           <h1 className="room-details-title" style={{ 
            color: '#0f172a', 
            fontWeight: '800',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            marginBottom: '16px'
          }}>
            {room.name}
          </h1>
            <p className="room-details-description" style={{ 
            color: '#0f172a',
            lineHeight: '1.6',
            fontSize: '16px',
            fontWeight: '500',
            background: 'rgba(235, 248, 245, 0.85)',
            backdropFilter: 'blur(12px)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
            {room.description || 'Описание отсутствует'}
            </p>
                      
            <div className="room-details-specs" style={{
              background: 'rgba(235, 248, 245, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              marginBottom: '24px'
            }}>
              <div className="spec-item">
                <span className="spec-icon">👥</span>
                <span className="spec-label" style={{ color: '#475569', fontWeight: '600' }}>Вместимость:</span>
                <span className="spec-value" style={{ color: '#0f172a', fontWeight: '700' }}>{room.capacity || 0} человек</span>
              </div>
              <div className="spec-item">
                <span className="spec-icon">🚇</span>
                <span className="spec-label" style={{ color: '#475569', fontWeight: '600' }}>Метро:</span>
                <span className="spec-value" style={{ color: '#0f172a', fontWeight: '700' }}>{room.metro || 'Не указано'}</span>
              </div>
              <div className="spec-item">
                <span className="spec-icon">💰</span>
                <span className="spec-label" style={{ color: '#475569', fontWeight: '600' }}>Цена:</span>
                <span className="spec-value" style={{ color: '#0f172a', fontWeight: '700' }}>{room.price_per_hour || 0} ₽/час</span>
              </div>
              
              <div className="spec-item">
                <span className="spec-icon">👤</span>
                <span className="spec-label" style={{ color: '#475569', fontWeight: '600' }}>Владелец:</span>
                <span className="spec-value" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {loadingSeller ? (
                    'Загрузка...'
                  ) : sellerData ? (
                    <>
                      {sellerAvatar ? (
                        <img 
                          src={sellerAvatar} 
                          alt={sellerData.name} 
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid rgba(255, 255, 255, 0.4)'
                          }}
                        />
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#2850a7',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: '700'
                        }}>
                          {sellerData.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      )}
                      <span style={{ color: '#0f172a', fontWeight: '600' }}>
                        {sellerData.name || `Пользователь #${room.seller_id}`}
                        <span style={{ 
                          display: 'block', 
                          fontSize: '12px', 
                          color: '#475569',
                          fontWeight: '400'
                        }}>
                          📧 {sellerData.email || 'Email не указан'}
                        </span>
                      </span>
                    </>
                  ) : (
                    `Владелец #${room.seller_id}`
                  )}
                </span>
              </div>
            </div>

            <div className="room-details-amenities">
              <h3 style={{ 
                color: '#0f172a', 
                fontWeight: '700',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                marginBottom: '16px'
              }}>
                Удобства
              </h3>
              <div className="amenities-list">
                {room.amenities && room.amenities.length > 0 ? (
                  room.amenities.map((item, idx) => {
                    const amenityName = typeof item === 'string' ? item : item?.name || 'Неизвестно';
                    return (
                      <span key={idx} className="amenity-tag" style={{
                        background: 'rgba(255, 255, 255, 0.75)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        color: '#1e293b',
                        fontWeight: '500'
                      }}>
                        ✓ {amenityName}
                      </span>
                    );
                  })
                ) : (
                  <span style={{ color: '#475569', fontWeight: '500' }}>Нет удобств</span>
                )}
              </div>
            </div>

            <button 
              className="reviews-main-btn"
              onClick={() => setShowReviews(!showReviews)}
            >
              {showReviews ? 'Скрыть отзывы' : 'Отзывы'} 
              {Array.isArray(reviewsData) && reviewsData.length > 0 && ` (${reviewsData.length})`}
              {Array.isArray(reviewsData) && reviewsData.length > 0 && ` ⭐ ${getAverageRating()}`}
            </button>

            {showReviews && (
              <div className="reviews-modal">
                <div className="reviews-modal-content" style={{
                  background: 'rgba(235, 248, 245, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
                }}>
                  <div className="reviews-modal-header">
                    <h3 style={{ color: '#0f172a', fontWeight: '700' }}>Отзывы о помещении</h3>
                    <button className="reviews-modal-close" onClick={() => setShowReviews(false)}>×</button>
                  </div>

                  <div className="reviews-modal-body">
                    {user && !showReviewForm && (
                      <button 
                        className="write-review-btn-modal"
                        onClick={() => setShowReviewForm(true)}
                      >
                        Оставить отзыв
                      </button>
                    )}

                  {showReviewForm && (
                    <div className="review-form-modal" style={{
                      background: 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '20px'
                    }}>
                      <h4 style={{ color: '#0f172a', fontWeight: '700', marginTop: 0, marginBottom: '16px' }}>Ваш отзыв</h4>
                      <form onSubmit={handleSubmitReview}>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                          <label style={{ color: '#475569', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Оценка</label>
                          {renderStars(reviewData.rating, true)}
                        </div>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                          <label style={{ color: '#475569', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Комментарий</label>
                          <textarea
                            value={reviewData.comment}
                            onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                            placeholder="Расскажите о своих впечатлениях..."
                            rows="3"
                            required
                            style={{
                              width: '100%',
                              background: 'rgba(255, 255, 255, 0.9)',
                              border: '1px solid rgba(255, 255, 255, 0.4)',
                              borderRadius: '8px',
                              padding: '10px 14px',
                              color: '#1e293b',
                              fontSize: '14px',
                              resize: 'vertical',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                        {reviewError && <div className="error-message" style={{ marginBottom: '12px', color: '#ef4444', fontWeight: '500' }}>{reviewError}</div>}
                        {reviewSuccess && <div className="success-message" style={{ marginBottom: '12px', color: '#10b981', fontWeight: '500' }}>{reviewSuccess}</div>}
                        <div className="review-form-actions" style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                          <button 
                            type="submit" 
                            disabled={creatingReview} 
                            className="submit-review-modal-btn"
                            style={{
                              flex: 1,
                              padding: '10px 16px',
                              background: '#2850a7',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: '600',
                              fontSize: '14px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#1e3d7c'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#2850a7'}
                          >
                            {creatingReview ? 'Отправка...' : 'Опубликовать'}
                          </button>
                          <button 
                            type="button" 
                            onClick={() => {
                              setShowReviewForm(false);
                              setReviewError('');
                            }} 
                            className="cancel-review-modal-btn"
                            style={{
                              flex: 1,
                              padding: '10px 16px',
                              background: 'rgba(255, 255, 255, 0.7)',
                              color: '#475569',
                              border: '1px solid rgba(255, 255, 255, 0.4)',
                              borderRadius: '8px',
                              fontWeight: '600',
                              fontSize: '14px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)'}
                          >
                            Отмена
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                    {reviewsLoading ? (
                      <div className="loader"><div className="spinner" style={{ width: '30px', height: '30px' }}></div></div>
                    ) : !reviewsData || reviewsData.length === 0 ? (
                      <div className="empty-reviews" style={{ color: '#475569', fontWeight: '500' }}>Пока нет отзывов. Будьте первым!</div>
                    ) : (
                      reviewsData.map(review => {
                        const avatar = getUserAvatar(review);
                        return (
                          <div key={review.id} className="review-item-modal" style={{
                            background: 'rgba(255, 255, 255, 0.6)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '12px'
                          }}>
                            <div className="review-item-header">
                              <span className="review-user-name" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a', fontWeight: '600' }}>
                                {avatar ? (
                                  <img 
                                    src={avatar} 
                                    alt={getUserDisplayName(review)} 
                                    style={{
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '50%',
                                      objectFit: 'cover',
                                      border: '1px solid rgba(255, 255, 255, 0.4)'
                                    }}
                                  />
                                ) : (
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    background: '#2850a7',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    fontWeight: '700'
                                  }}>
                                    {getUserDisplayName(review)?.charAt(0)?.toUpperCase() || 'U'}
                                  </span>
                                )}
                                {getUserDisplayName(review)}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {renderStars(review.stars || 0)}
                                {isReviewAuthor(review) && (
                                  <button
                                    onClick={() => handleDeleteReview(review)}
                                    disabled={deletingReviewId === review.id}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#ef4444',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                  >
                                    {deletingReviewId === review.id ? '...' : '✕'}
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="review-item-comment" style={{ color: '#334155', lineHeight: '1.5' }}>{review.comment}</p>
                            <span className="review-item-date" style={{ color: '#64748b', fontSize: '12px' }}>{formatReviewDate(review.created_at)}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="room-details-booking">
            <div className="booking-card-sticky" style={{
              background: 'rgba(235, 248, 245, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{ color: '#0f172a', fontWeight: '700' }}>Забронировать</h2>
              
              {sellerData && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <div style={{ fontSize: '13px', color: '#475569', marginBottom: '4px', fontWeight: '600' }}>
                    📞 Контакт владельца
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {sellerAvatar ? (
                      <img 
                        src={sellerAvatar} 
                        alt={sellerData.name} 
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid rgba(255, 255, 255, 0.4)'
                        }}
                      />
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#2850a7',
                        color: '#ffffff',
                        fontSize: '16px',
                        fontWeight: '700'
                      }}>
                        {sellerData.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                        {sellerData.name || `Владелец #${room.seller_id}`}
                      </div>
                      <div style={{ fontSize: '14px', color: '#1e293b', wordBreak: 'break-all' }}>
                        ✉️ {sellerData.email || 'Email не указан'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="booking-price-preview">
                <span className="price-label" style={{ color: '#475569', fontWeight: '600' }}>Стоимость:</span>
                <span className="price-value" style={{ fontWeight: '800', color: '#2850a7', fontSize: '24px' }}>{room.price_per_hour} ₽/час</span>
              </div>

              <button 
                className="booking-primary-btn"
                onClick={handleBooking}
              >
                Забронировать сейчас
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}