// src/pages/Reviews.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGetApartmentByIdQuery } from '../store/api';
import Navbar from '../components/Navbar';
import '../styles/reviews.css';

export default function Reviews() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: room, isLoading, error } = useGetApartmentByIdQuery(id);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    if (!room) return;
    
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
      setLoading(false);
    }, 500);
  }, [room]);

  const handleRatingClick = (rating) => {
    setReviewData(prev => ({ ...prev, rating }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');
    setSubmitting(true);

    if (!reviewData.comment.trim()) {
      setReviewError('Напишите текст отзыва');
      setSubmitting(false);
      return;
    }

    try {
      // TODO: Заменить на реальный API запрос
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
      setShowForm(false);
      
      setTimeout(() => setReviewSuccess(''), 3000);
    } catch (err) {
      setReviewError('Ошибка при отправке отзыва');
    } finally {
      setSubmitting(false);
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

  const formatDate = (dateString) => {
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

  if (isLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="loader"><div className="spinner"></div></div>
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
      <div className="reviews-page" style={{ maxWidth: '900px', margin: '0 auto', padding: '50px 24px', fontFamily: '-apple-system, sans-serif' }}>
        <div className="reviews-header" style={{ marginBottom: '40px' }}>
          <Link to={`/catalog/${id}`} className="reviews-back" style={{ color: '#2850a7', textDecoration: 'none', fontWeight: '600' }}>
            ← Назад к помещению
          </Link>
          <h1 className="reviews-title" style={{ fontSize: '32px', color: '#0f172a', margin: '16px 0 0 0' }}>
            Отзывы о «{room.name}»
          </h1>
        </div>

        <div className="reviews-room-info" style={{ display: 'flex', gap: '40px', background: '#f8fafc', padding: '24px', borderRadius: '20px', marginBottom: '32px' }}>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '12px' }}>⭐ Рейтинг</div>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>
              {reviews.length > 0 ? getAverageRating() : 'Нет отзывов'}
              {reviews.length > 0 && ` (${reviews.length})`}
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '12px' }}>Цена</div>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>{room.price_per_hour} ₽/час</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '12px' }}>Вместимость</div>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>{room.capacity} чел.</div>
          </div>
        </div>

        {canReview && !showForm && (
          <button className="write-review-btn" onClick={() => setShowForm(true)} style={{ background: '#2850a7', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', marginBottom: '30px' }}>
            Оставить отзыв
          </button>
        )}

        {showForm && (
          <div className="review-form-container" style={{ background: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
            <h3 style={{ marginTop: 0, color: '#1e293b' }}>Ваш отзыв</h3>
            <form onSubmit={handleSubmitReview} className="review-form">
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '600', color: '#334155', marginBottom: '8px', fontSize: '14px' }}>Оценка</label>
                {renderStars(reviewData.rating, true)}
              </div>
              
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '600', color: '#334155', marginBottom: '8px', fontSize: '14px' }}>Ваш отзыв</label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Расскажите о своих впечатлениях..."
                  rows="4"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '14px', resize: 'vertical' }}
                  required
                />
              </div>

              {reviewError && <div className="error-message" style={{ background: '#fef2f2', color: '#ef4444', padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', fontSize: '14px', border: '1px solid #fee2e2' }}>{reviewError}</div>}
              {reviewSuccess && <div className="success-message" style={{ background: '#f0fdf4', color: '#16a34a', padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', fontSize: '14px', border: '1px solid #dcfce7' }}>{reviewSuccess}</div>}

              <div className="form-actions" style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="submit" 
                  className="submit-review-btn"
                  disabled={submitting}
                  style={{ flex: 1, background: '#2850a7', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '16px', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? 'Отправка...' : 'Опубликовать отзыв'}
                </button>
                <button 
                  type="button" 
                  className="cancel-review-btn"
                  onClick={() => setShowForm(false)}
                  style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '16px', cursor: 'pointer' }}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="reviews-list" style={{ marginTop: '20px' }}>
          <h2 className="reviews-section-title" style={{ fontSize: '20px', color: '#1e293b', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #e2e8f0' }}>
            Отзывы ({reviews.length})
          </h2>
          
          {reviews.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px' }}>
              <div className="empty-icon" style={{ fontSize: '64px', marginBottom: '20px' }}></div>
              <h3 style={{ color: '#1e293b', marginBottom: '8px' }}>Пока нет отзывов</h3>
              <p style={{ color: '#64748b', marginBottom: '24px' }}>Будьте первым, кто оставит отзыв об этом помещении!</p>
            </div>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="review-card" style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <div className="review-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div className="review-user" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="user-avatar" style={{ width: '36px', height: '36px', background: '#2850a7', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '16px' }}>
                      {review.user_name.charAt(0).toUpperCase()}
                    </span>
                    <span className="user-name" style={{ fontWeight: '600', color: '#1e293b' }}>{review.user_name}</span>
                  </div>
                  <div className="review-rating">
                    {renderStars(review.rating)}
                  </div>
                </div>
                <p className="review-comment" style={{ color: '#334155', lineHeight: '1.6', marginBottom: '12px', fontSize: '15px' }}>{review.comment}</p>
                <div className="review-date" style={{ color: '#94a3b8', fontSize: '12px' }}>
                  {formatDate(review.created_at)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}