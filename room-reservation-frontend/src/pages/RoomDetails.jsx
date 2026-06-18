// src/pages/RoomDetails.jsx
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useGetApartmentByIdQuery, useCreateBookingMutation } from '../store/api';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

export default function RoomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: room, isLoading, error } = useGetApartmentByIdQuery(id);
  const [createBooking, { isLoading: bookingLoading }] = useCreateBookingMutation();
  
  // Состояния для отзывов
  const [showReviews, setShowReviews] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Проверяем параметр showReviews в URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('showReviews') === 'true') {
      setShowReviews(true);
    }
  }, []);

  // Загрузка отзывов
  useEffect(() => {
    if (showReviews) {
      setReviewsLoading(true);
      // TODO: Заменить на реальный API запрос
      setTimeout(() => {
        setReviews([
          {
            id: 1,
            user_name: "Анна С.",
            rating: 5,
            comment: "Отличное место! Очень комфортно работать, быстрый интернет, удобные кресла. Обязательно приду ещё!",
            created_at: "2026-06-10T14:30:00Z"
          },
          {
            id: 2,
            user_name: "Михаил К.",
            rating: 4,
            comment: "Хороший коворкинг, но иногда шумновато. В остальном всё супер!",
            created_at: "2026-06-08T11:20:00Z"
          },
          {
            id: 3,
            user_name: "Елена В.",
            rating: 5,
            comment: "Идеальное место для проведения встреч. Рекомендую!",
            created_at: "2026-06-05T09:15:00Z"
          }
        ]);
        setCanReview(true);
        setReviewsLoading(false);
      }, 500);
    }
  }, [showReviews, id]);

  const handleBooking = () => {
    navigate(`/booking/${id}`);
  };

  // Обработчики отзывов
  const handleRatingClick = (rating) => {
    setReviewData(prev => ({ ...prev, rating }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');
    setSubmittingReview(true);

    if (!reviewData.comment.trim()) {
      setReviewError('Напишите текст отзыва');
      setSubmittingReview(false);
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newReview = {
        id: reviews.length + 1,
        user_name: user?.name || 'Пользователь',
        rating: reviewData.rating,
        comment: reviewData.comment,
        created_at: new Date().toISOString()
      };
      setReviews([newReview, ...reviews]);
      setReviewSuccess('Отзыв успешно опубликован! Спасибо!');
      setReviewData({ rating: 5, comment: '' });
      setShowReviewForm(false);
      setTimeout(() => setReviewSuccess(''), 3000);
    } catch (err) {
      setReviewError('Ошибка при отправке отзыва');
    } finally {
      setSubmittingReview(false);
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
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
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

            <button 
              className="reviews-main-btn"
              onClick={() => setShowReviews(!showReviews)}
            >
              {showReviews ? 'Скрыть отзывы' : 'Отзывы'} {reviews.length > 0 && `(${reviews.length})`}
              {reviews.length > 0 && ` ⭐ ${getAverageRating()}`}
            </button>

            {showReviews && (
              <div className="reviews-modal">
                <div className="reviews-modal-content">
                  <div className="reviews-modal-header">
                    <h3>Отзывы о помещении</h3>
                    <button className="reviews-modal-close" onClick={() => setShowReviews(false)}>×</button>
                  </div>

                  <div className="reviews-modal-body">
                    {canReview && !showReviewForm && (
                      <button 
                        className="write-review-btn-modal"
                        onClick={() => setShowReviewForm(true)}
                      >
                        Оставить отзыв
                      </button>
                    )}

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
                          {reviewError && <div className="error-message">{reviewError}</div>}
                          {reviewSuccess && <div className="success-message">{reviewSuccess}</div>}
                          <div className="review-form-actions">
                            <button type="submit" disabled={submittingReview} className="submit-review-modal-btn">
                              {submittingReview ? 'Отправка...' : 'Опубликовать'}
                            </button>
                            <button type="button" onClick={() => setShowReviewForm(false)} className="cancel-review-modal-btn">
                              Отмена
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {reviewsLoading ? (
                      <div className="loader"><div className="spinner"></div></div>
                    ) : reviews.length === 0 ? (
                      <div className="empty-reviews">Пока нет отзывов</div>
                    ) : (
                      reviews.map(review => (
                        <div key={review.id} className="review-item-modal">
                          <div className="review-item-header">
                            <span className="review-user-name">{review.user_name}</span>
                            <div>{renderStars(review.rating)}</div>
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