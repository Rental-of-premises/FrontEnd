// src/pages/RoomDetails.jsx
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  useGetApartmentByIdQuery, 
  useCreateBookingMutation,
  useGetReviewsByApartmentQuery,
  useCreateReviewMutation,
  useDeleteReviewMutation,
  useGetUserByIdQuery  // ← ДОБАВЛЯЕМ
} from '../store/api';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

export default function RoomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: room, isLoading, error } = useGetApartmentByIdQuery(id);
  const [createBooking, { isLoading: bookingLoading }] = useCreateBookingMutation();
  
  // ===== РЕАЛЬНЫЕ ОТЗЫВЫ С БЭКЕНДА =====
  const { 
    data: reviewsData = [], 
    isLoading: reviewsLoading,
    refetch: refetchReviews
  } = useGetReviewsByApartmentQuery(id, {
    skip: !id,
  });

  const [createReview, { isLoading: creatingReview }] = useCreateReviewMutation();
  const [deleteReview, { isLoading: deletingReview }] = useDeleteReviewMutation();

  // ===== СОСТОЯНИЯ =====
  const [showReviews, setShowReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  
  // ===== СОСТОЯНИЕ ДЛЯ ИМЕН ПОЛЬЗОВАТЕЛЕЙ =====
  const [userNames, setUserNames] = useState({});

  // Проверяем параметр showReviews в URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('showReviews') === 'true') {
      setShowReviews(true);
    }
  }, []);

  // ===== ЗАГРУЖАЕМ ИМЕНА ПОЛЬЗОВАТЕЛЕЙ ДЛЯ ВСЕХ ОТЗЫВОВ =====
  useEffect(() => {
    if (reviewsData && reviewsData.length > 0) {
      const fetchUserNames = async () => {
        const names = {};
        for (const review of reviewsData) {
          if (review.user_id && !names[review.user_id]) {
            try {
              // Получаем пользователя по ID
              const response = await fetch(`https://team3.verstack.ru/api/users/${review.user_id}`, {
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json'
                }
              });
              if (response.ok) {
                const userData = await response.json();
                names[review.user_id] = userData.name || `Пользователь #${review.user_id}`;
              } else {
                names[review.user_id] = `Пользователь #${review.user_id}`;
              }
            } catch (err) {
              console.error('Ошибка загрузки пользователя:', err);
              names[review.user_id] = `Пользователь #${review.user_id}`;
            }
          }
        }
        setUserNames(names);
      };
      fetchUserNames();
    }
  }, [reviewsData]);

  const handleBooking = () => {
    navigate(`/booking/${id}`);
  };

  // ===== ОБРАБОТЧИКИ ОТЗЫВОВ =====
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

  // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
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
    if (!reviewsData || reviewsData.length === 0) return 0;
    const sum = reviewsData.reduce((acc, r) => acc + (r.stars || 0), 0);
    return (sum / reviewsData.length).toFixed(1);
  };

  const isReviewAuthor = (review) => {
    return user && review.user_id && review.user_id === user.id;
  };

  // ===== ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ИМЕНИ ПОЛЬЗОВАТЕЛЯ =====
  const getUserDisplayName = (review) => {
    if (!review || !review.user_id) return 'Неизвестный пользователь';
    return userNames[review.user_id] || `Пользователь #${review.user_id}`;
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
          <Link to="/catalog">← Назад к каталогу</Link>
        </div>

        <div className="room-details-grid">
          <div className="room-details-info">
            <img 
              src={room.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'} 
              alt={room.name} 
              className="room-details-image"
            />
            <h1 className="room-details-title">{room.name}</h1>
            <p className="room-details-description">{room.description || 'Описание отсутствует'}</p>
            
            <div className="room-details-specs">
              <div className="spec-item">
                <span className="spec-icon"></span>
                <span className="spec-label">Вместимость:</span>
                <span className="spec-value">{room.capacity || 0} человек</span>
              </div>
              <div className="spec-item">
                <span className="spec-icon"></span>
                <span className="spec-label">Метро:</span>
                <span className="spec-value">{room.metro || 'Не указано'}</span>
              </div>
              <div className="spec-item">
                <span className="spec-icon"></span>
                <span className="spec-label">Цена:</span>
                <span className="spec-value">{room.price_per_hour || 0} ₽/час</span>
              </div>
            </div>

            <div className="room-details-amenities">
              <h3>Удобства</h3>
              <div className="amenities-list">
                {room.amenities?.map((item, idx) => (
                  <span key={idx} className="amenity-tag">✓ {item}</span>
                ))}
                {(!room.amenities || room.amenities.length === 0) && (
                  <>
                    <span className="amenity-tag">✓ WiFi</span>
                    <span className="amenity-tag">✓ Кондиционер</span>
                    <span className="amenity-tag">✓ Рабочее место</span>
                  </>
                )}
              </div>
            </div>

            {/* ===== КНОПКА ОТЗЫВОВ ===== */}
            <button 
              className="reviews-main-btn"
              onClick={() => setShowReviews(!showReviews)}
            >
              {showReviews ? 'Скрыть отзывы' : 'Отзывы'} 
              {reviewsData && reviewsData.length > 0 && ` (${reviewsData.length})`}
              {reviewsData && reviewsData.length > 0 && ` ⭐ ${getAverageRating()}`}
            </button>

            {showReviews && (
              <div className="reviews-modal">
                <div className="reviews-modal-content">
                  <div className="reviews-modal-header">
                    <h3>Отзывы о помещении</h3>
                    <button className="reviews-modal-close" onClick={() => setShowReviews(false)}>×</button>
                  </div>

                  <div className="reviews-modal-body">
                    {/* Кнопка "Оставить отзыв" */}
                    {user && !showReviewForm && (
                      <button 
                        className="write-review-btn-modal"
                        onClick={() => setShowReviewForm(true)}
                      >
                        Оставить отзыв
                      </button>
                    )}

                    {/* Форма отзыва */}
                    {showReviewForm && (
                      <div className="review-form-modal">
                        <h4>Ваш отзыв</h4>
                        <form onSubmit={handleSubmitReview}>
                          <div className="form-group">
                            <label>Оценка</label>
                            {renderStars(reviewData.rating, true)}
                          </div>
                          <div className="form-group">
                            <label>Комментарий</label>
                            <textarea
                              value={reviewData.comment}
                              onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                              placeholder="Расскажите о своих впечатлениях..."
                              rows="3"
                              required
                            />
                          </div>
                          {reviewError && <div className="error-message" style={{ marginBottom: '12px' }}>{reviewError}</div>}
                          {reviewSuccess && <div className="success-message" style={{ marginBottom: '12px' }}>{reviewSuccess}</div>}
                          <div className="review-form-actions">
                            <button 
                              type="submit" 
                              disabled={creatingReview} 
                              className="submit-review-modal-btn"
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
                            >
                              Отмена
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Список отзывов */}
                    {reviewsLoading ? (
                      <div className="loader"><div className="spinner" style={{ width: '30px', height: '30px' }}></div></div>
                    ) : !reviewsData || reviewsData.length === 0 ? (
                      <div className="empty-reviews">Пока нет отзывов. Будьте первым!</div>
                    ) : (
                      reviewsData.map(review => (
                        <div key={review.id} className="review-item-modal">
                          <div className="review-item-header">
                            <span className="review-user-name">
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
                          <p className="review-item-comment">{review.comment}</p>
                          <span className="review-item-date">{formatReviewDate(review.created_at)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="room-details-booking">
            <div className="booking-card-sticky">
              <h2>Забронировать</h2>
              <div className="booking-price-preview">
                <span className="price-label">Стоимость:</span>
                <span className="price-value">{room.price_per_hour} ₽/час</span>
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