import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  useGetApartmentByIdQuery,
  useGetReviewsByApartmentQuery,
  useCreateReviewMutation,
  useDeleteReviewMutation
} from '../store/api';
import Navbar from '../components/Navbar';
import '../styles/reviews.css';

const API_URL = 'https://team3.verstack.ru';

export default function Reviews() {
  const { id } = useParams();
  const { user } = useAuth();
  
  const { data: room, isLoading: roomLoading, error: roomError } = useGetApartmentByIdQuery(id);
  
  const { 
    data: reviews = [], 
    isLoading: reviewsLoading,
    refetch: refetchReviews
  } = useGetReviewsByApartmentQuery(id, {
    skip: !id,
  });

  const [createReview, { isLoading: creatingReview }] = useCreateReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();

  const [showForm, setShowForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  
  const [userNames, setUserNames] = useState({});
  const [userAvatars, setUserAvatars] = useState({});

  useEffect(() => {
    if (reviews && reviews.length > 0) {
      const fetchUserData = async () => {
        const names = {};
        const avatars = {};
        for (const review of reviews) {
          if (review.user_id && !names[review.user_id]) {
            try {
              const response = await fetch(`${API_URL}/api/users/${review.user_id}`, {
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json'
                }
              });
              if (response.ok) {
                const data = await response.json();
                const userData = data.user || data;
                names[review.user_id] = userData.name || `Пользователь #${review.user_id}`;
                if (data.avatar) {
                  avatars[review.user_id] = data.avatar.image_data;
                }
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
        setUserAvatars(avatars);
      };
      fetchUserData();
    }
  }, [reviews]);

  const handleRatingClick = (rating) => {
    setReviewData(prev => ({ ...prev, rating }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');
    setShowForm(false);

    if (!reviewData.comment.trim()) {
      setReviewError('Напишите текст отзыва');
      setShowForm(true);
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
      setShowForm(true);
    }
  };

  const handleDeleteReview = async (review) => {
    const reviewId = typeof review === 'object' ? review.id : review;
    
    if (!window.confirm('Вы уверены, что хотите удалить этот отзыв?')) return;
    
    setDeletingId(reviewId);
    try {
      await deleteReview(reviewId).unwrap();
      refetchReviews();
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert(err.data?.error || 'Ошибка при удалении отзыва');
    } finally {
      setDeletingId(null);
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
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isAuthor = (review) => {
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

  const getAvatarLetter = (review) => {
    const name = getUserDisplayName(review);
    if (name && name !== `Пользователь #${review.user_id}`) {
      return name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.stars || 0), 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (roomLoading || reviewsLoading) {
    return (
      <>
        <Navbar />
        <div className="loader"><div className="spinner"></div></div>
      </>
    );
  }

  if (roomError || !room) {
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

        {user && !showForm && (
          <button 
            className="write-review-btn" 
            onClick={() => setShowForm(true)} 
            style={{ background: '#2850a7', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', marginBottom: '30px' }}
          >
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
                  disabled={creatingReview}
                  style={{ flex: 1, background: '#2850a7', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '16px', cursor: creatingReview ? 'not-allowed' : 'pointer', opacity: creatingReview ? 0.6 : 1 }}
                >
                  {creatingReview ? 'Отправка...' : 'Опубликовать отзыв'}
                </button>
                <button 
                  type="button" 
                  className="cancel-review-btn"
                  onClick={() => {
                    setShowForm(false);
                    setReviewError('');
                  }}
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
              <div className="empty-icon" style={{ fontSize: '64px', marginBottom: '20px' }}>💬</div>
              <h3 style={{ color: '#1e293b', marginBottom: '8px' }}>Пока нет отзывов</h3>
              <p style={{ color: '#64748b', marginBottom: '24px' }}>Будьте первым, кто оставит отзыв об этом помещении!</p>
            </div>
          ) : (
            reviews.map(review => {
              const avatar = getUserAvatar(review);
              return (
                <div key={review.id} className="review-card" style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <div className="review-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div className="review-user" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {avatar ? (
                        <img 
                          src={avatar} 
                          alt={getUserDisplayName(review)} 
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1px solid #e2e8f0'
                          }}
                        />
                      ) : (
                        <span className="user-avatar" style={{ width: '36px', height: '36px', background: '#2850a7', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '16px' }}>
                          {getAvatarLetter(review)}
                        </span>
                      )}
                      <span className="user-name" style={{ fontWeight: '600', color: '#1e293b' }}>
                        {getUserDisplayName(review)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="review-rating">
                        {renderStars(review.stars || 0)}
                      </div>
                      {isAuthor(review) && (
                        <button
                          onClick={() => handleDeleteReview(review)}
                          disabled={deletingId === review.id}
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
                          {deletingId === review.id ? '...' : '✕ Удалить'}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="review-comment" style={{ color: '#334155', lineHeight: '1.6', marginBottom: '12px', fontSize: '15px' }}>{review.comment}</p>
                  <div className="review-date" style={{ color: '#94a3b8', fontSize: '12px' }}>
                    {formatDate(review.created_at)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}