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
          <div className="error-message" style={{
            background: 'rgba(254, 242, 242, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(254, 226, 226, 0.5)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#0f172a', marginBottom: '12px' }}>Помещение не найдено</h2>
            <p style={{ color: '#475569' }}>Помещение с ID {id} не существует или было удалено.</p>
            <Link to="/catalog">
              <button className="auth-btn" style={{ 
                marginTop: '20px',
                background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(40, 80, 167, 0.25)'
              }}>
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
      <div className="reviews-page" style={{ 
        maxWidth: '900px', 
        margin: '0 auto', 
        padding: '50px 24px', 
        fontFamily: '-apple-system, sans-serif' 
      }}>
        
        <div className="reviews-header" style={{ marginBottom: '40px' }}>
          <Link to={`/catalog/${id}`} className="reviews-back" style={{ 
            display: 'inline-block',
            color: '#e0f2f1',
            background: 'rgba(38, 166, 154, 0.2)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(38, 166, 154, 0.5)',
            padding: '8px 20px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            textDecoration: 'none',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(38, 166, 154, 0.3)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(38, 166, 154, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            ← Назад к помещению
          </Link>
          <h1 className="reviews-title" style={{ 
            fontSize: '32px', 
            color: '#0f172a', 
            margin: '16px 0 0 0',
            fontWeight: '800',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            Отзывы о «{room.name}»
          </h1>
        </div>

        <div className="reviews-room-info" style={{ 
          display: 'flex', 
          gap: '40px', 
          background: 'rgba(235, 248, 245, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          padding: '24px', 
          borderRadius: '20px', 
          marginBottom: '32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <div>
            <div style={{ color: '#64748b', fontSize: '12px', fontWeight: '600' }}>⭐ Рейтинг</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
              {reviews.length > 0 ? getAverageRating() : 'Нет отзывов'}
              {reviews.length > 0 && ` (${reviews.length})`}
            </div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Цена</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{room.price_per_hour} ₽/час</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Вместимость</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{room.capacity} чел.</div>
          </div>
        </div>

        {user && !showForm && (
          <button 
            className="write-review-btn" 
            onClick={() => setShowForm(true)} 
            style={{ 
              background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
              color: '#fff', 
              border: 'none', 
              padding: '12px 24px', 
              borderRadius: '12px', 
              fontWeight: '600', 
              cursor: 'pointer', 
              marginBottom: '30px',
              boxShadow: '0 4px 12px rgba(40, 80, 167, 0.25)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(40, 80, 167, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 80, 167, 0.25)';
            }}
          >
            Оставить отзыв
          </button>
        )}

        {showForm && (
          <div className="review-form-container" style={{ 
            background: 'rgba(235, 248, 245, 0.85)',
            backdropFilter: 'blur(12px)',
            padding: '24px', 
            borderRadius: '20px', 
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            marginBottom: '30px' 
          }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', fontWeight: '700', fontSize: '20px' }}>Ваш отзыв</h3>
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
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    borderRadius: '10px', 
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    fontFamily: 'inherit', 
                    fontSize: '14px', 
                    resize: 'vertical',
                    color: '#1e293b',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#2850a7'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'}
                  required
                />
              </div>

              {reviewError && <div className="error-message" style={{ 
                background: 'rgba(254, 242, 242, 0.9)',
                backdropFilter: 'blur(8px)',
                color: '#dc2626', 
                padding: '12px 16px', 
                borderRadius: '12px', 
                marginBottom: '16px', 
                fontSize: '14px',
                fontWeight: '600',
                border: '1px solid rgba(254, 226, 226, 0.5)' 
              }}>{reviewError}</div>}
              {reviewSuccess && <div className="success-message" style={{ 
                background: 'rgba(220, 252, 231, 0.9)',
                backdropFilter: 'blur(8px)',
                color: '#166534', 
                padding: '12px 16px', 
                borderRadius: '12px', 
                marginBottom: '16px', 
                fontSize: '14px',
                fontWeight: '600',
                border: '1px solid rgba(220, 252, 231, 0.5)' 
              }}>{reviewSuccess}</div>}

              <div className="form-actions" style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="submit" 
                  className="submit-review-btn"
                  disabled={creatingReview}
                  style={{ 
                    flex: 1, 
                    background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
                    color: '#fff', 
                    border: 'none', 
                    padding: '12px', 
                    borderRadius: '10px', 
                    fontWeight: '600', 
                    fontSize: '16px', 
                    cursor: creatingReview ? 'not-allowed' : 'pointer', 
                    opacity: creatingReview ? 0.6 : 1,
                    boxShadow: '0 4px 12px rgba(40, 80, 167, 0.25)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!creatingReview) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(40, 80, 167, 0.35)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 80, 167, 0.25)';
                  }}
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
                  style={{ 
                    flex: 1, 
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(8px)',
                    color: '#475569', 
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    padding: '12px', 
                    borderRadius: '10px', 
                    fontWeight: '600', 
                    fontSize: '16px', 
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="reviews-list" style={{ marginTop: '20px' }}>
          <h2 className="reviews-section-title" style={{ 
            fontSize: '20px', 
            color: '#0f172a', 
            marginBottom: '20px', 
            paddingBottom: '12px', 
            borderBottom: '2px solid rgba(255, 255, 255, 0.3)',
            fontWeight: '700'
          }}>
            Отзывы ({reviews.length})
          </h2>
          
          {reviews.length === 0 ? (
            <div className="empty-state" style={{ 
              textAlign: 'center', 
              padding: '60px', 
              background: 'rgba(235, 248, 245, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <div className="empty-icon" style={{ fontSize: '64px', marginBottom: '20px' }}>💬</div>
              <h3 style={{ color: '#0f172a', marginBottom: '8px', fontWeight: '700' }}>Пока нет отзывов</h3>
              <p style={{ color: '#475569', marginBottom: '24px', fontWeight: '500' }}>Будьте первым, кто оставит отзыв об этом помещении!</p>
            </div>
          ) : (
            reviews.map(review => {
              const avatar = getUserAvatar(review);
              return (
                <div key={review.id} className="review-card" style={{ 
                  background: 'rgba(235, 248, 245, 0.85)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '20px', 
                  padding: '20px', 
                  marginBottom: '16px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}>
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
                            border: '2px solid rgba(255, 255, 255, 0.4)'
                          }}
                        />
                      ) : (
                        <span className="user-avatar" style={{ 
                          width: '36px', 
                          height: '36px', 
                          background: '#2850a7', 
                          color: 'white', 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontWeight: '700', 
                          fontSize: '16px',
                          border: '2px solid rgba(255, 255, 255, 0.4)'
                        }}>
                          {getAvatarLetter(review)}
                        </span>
                      )}
                      <span className="user-name" style={{ fontWeight: '600', color: '#0f172a' }}>
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
                            background: 'rgba(254, 242, 242, 0.7)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(254, 226, 226, 0.5)',
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(254, 226, 226, 0.9)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(254, 242, 242, 0.7)'}
                        >
                          {deletingId === review.id ? '...' : '✕ Удалить'}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="review-comment" style={{ color: '#334155', lineHeight: '1.6', marginBottom: '12px', fontSize: '15px', fontWeight: '500' }}>{review.comment}</p>
                  <div className="review-date" style={{ color: '#64748b', fontSize: '12px', fontWeight: '500' }}>
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