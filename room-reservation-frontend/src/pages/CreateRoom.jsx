// src/pages/CreateRoom.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAddApartmentMutation } from '../store/api';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

export default function CreateRoom() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addApartment] = useAddApartmentMutation();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    capacity: 1,
    price_per_hour: 500,
    image_file: null,        // Для загрузки на бэкенд (>5MB)
    image_base64: null,      // Для хранения на фронтенде (≤5MB)
    metro: '',
    address: '',
    amenities: []
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [amenityInput, setAmenityInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLargeImage, setIsLargeImage] = useState(false);
  const [fileSize, setFileSize] = useState('');

  const MAX_CLIENT_STORAGE = 5 * 1024 * 1024; // 5 MB

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Валидация типа файла
    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите изображение');
      return;
    }

    // Валидация размера (максимум 20MB для бэкенда)
    if (file.size > 20 * 1024 * 1024) {
      setError('Изображение не должно превышать 20MB');
      return;
    }

    // Проверяем размер
    const isLarge = file.size > MAX_CLIENT_STORAGE;
    setIsLargeImage(isLarge);
    setFileSize((file.size / 1024 / 1024).toFixed(2) + ' MB');

    // Создаем превью
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      
      // Обновляем состояние в зависимости от размера
      if (isLarge) {
        // >5MB - будем загружать на бэкенд
        setFormData(prev => ({
          ...prev,
          image_file: file,
          image_base64: null
        }));
        console.log('📤 Большое изображение (>5MB) будет загружено на бэкенд');
      } else {
        // ≤5MB - храним на фронтенде в base64
        setFormData(prev => ({
          ...prev,
          image_file: null,
          image_base64: reader.result
        }));
        console.log('💾 Маленькое изображение (≤5MB) сохранено на фронтенде');
      }
    };
    
    reader.readAsDataURL(file);
    setError('');
  };

  const handleAddAmenity = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()]
      }));
      setAmenityInput('');
    }
  };

  const handleRemoveAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  // Загрузка изображения на бэкенд с прогрессом
  const uploadImageToBackend = (apartmentId, file) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('images', file);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.response);
            resolve(data);
          } catch (err) {
            reject(new Error('Ошибка парсинга ответа'));
          }
        } else {
          reject(new Error(`Ошибка загрузки: ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => reject(new Error('Ошибка сети'));
      
      xhr.open('POST', `http://localhost:8080/api/account/apartments/${apartmentId}/upload-images`);
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Валидация
    if (!formData.title.trim()) {
      setError('Название обязательно');
      setLoading(false);
      return;
    }

    if (!formData.image_base64 && !formData.image_file) {
      setError('Пожалуйста, выберите изображение');
      setLoading(false);
      return;
    }

    if (!formData.metro.trim()) {
      setError('Укажите станцию метро');
      setLoading(false);
      return;
    }

    if (!formData.address.trim()) {
      setError('Укажите адрес');
      setLoading(false);
      return;
    }

    try {
      // Шаг 1: Создаем помещение
      const payload = {
        title: formData.title,
        description: formData.description || '',
        capacity: Number(formData.capacity),
        price_per_hour: Number(formData.price_per_hour),
        metro: formData.metro,
        address: formData.address,
        amenities: formData.amenities,
        is_active: true
      };

      // Если изображение ≤5MB - отправляем в base64
      if (formData.image_base64) {
        payload.image_url = formData.image_base64;
      }

      const result = await addApartment(payload).unwrap();
      const apartmentId = result.id;

      // Шаг 2: Если изображение >5MB - загружаем отдельно
      if (formData.image_file) {
        setUploading(true);
        setUploadProgress(0);
        await uploadImageToBackend(apartmentId, formData.image_file);
        setUploading(false);
      }

      navigate('/my-rooms');
    } catch (err) {
      setError(err.data?.error || err.message || 'Ошибка при создании помещения');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="create-room-container">
          <h1 className="page-title">Опубликовать помещение</h1>
          
          <form onSubmit={handleSubmit} className="create-room-form">
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label>Название *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Например: Modern Coworking Space"
                required
              />
            </div>

            <div className="form-group">
              <label>Описание</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Опишите помещение, его особенности и для чего оно лучше всего подходит..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Вместимость (человек)</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  max="200"
                />
              </div>

              <div className="form-group">
                <label>Цена за час (₽)</label>
                <input
                  type="number"
                  name="price_per_hour"
                  value={formData.price_per_hour}
                  onChange={handleChange}
                  min="100"
                  step="100"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Метро *</label>
                <input
                  type="text"
                  name="metro"
                  value={formData.metro}
                  onChange={handleChange}
                  placeholder="Например: Маяковская"
                  required
                />
              </div>

              <div className="form-group">
                <label>Адрес *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Например: ул. Тверская, д. 15"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Изображение помещения *</label>
              <div className="image-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="file-input-label">
                  {imagePreview ? 'Изменить изображение' : 'Выберите изображение'}
                </label>
                
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button 
                      type="button" 
                      className="remove-image-btn"
                      onClick={() => {
                        setFormData(prev => ({ 
                          ...prev, 
                          image_file: null, 
                          image_base64: null 
                        }));
                        setImagePreview(null);
                        setIsLargeImage(false);
                        setFileSize('');
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}

                {imagePreview && (
                  <div style={{ marginTop: '8px', fontSize: '14px', color: '#64748b' }}>
                    <span>Размер файла: {fileSize}</span>
                    {isLargeImage ? (
                      <span style={{ color: '#f59e0b', marginLeft: '12px' }}>
                        ⚡ Будет загружен на сервер
                      </span>
                    ) : (
                      <span style={{ color: '#10b981', marginLeft: '12px' }}>
                        ✅ Хранится локально (≤5MB)
                      </span>
                    )}
                  </div>
                )}

                {uploading && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      background: '#e2e8f0', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${uploadProgress}%`, 
                        height: '100%', 
                        background: '#2850a7',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '14px', color: '#64748b' }}>
                      Загрузка: {uploadProgress}%
                    </div>
                  </div>
                )}
              </div>
              <small className="form-hint">
                Поддерживаются JPG, PNG, GIF, WEBP. 
                {isLargeImage ? ' Файл >5MB будет загружен на сервер' : ' Файлы ≤5MB хранятся локально'}
              </small>
            </div>

            <div className="form-group">
              <label>Удобства</label>
              <div className="amenities-input-group">
                <input
                  type="text"
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  placeholder="Добавить удобство (WiFi, Кофе, ...)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
                />
                <button type="button" onClick={handleAddAmenity} className="add-amenity-btn">
                  + Добавить
                </button>
              </div>
              
              {formData.amenities.length > 0 && (
                <div className="amenities-tags">
                  {formData.amenities.map(amenity => (
                    <span key={amenity} className="amenity-tag-remove">
                      {amenity}
                      <button type="button" onClick={() => handleRemoveAmenity(amenity)}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/dashboard')} className="cancel-btn-form">
                Отмена
              </button>
              <button 
                type="submit" 
                className="submit-btn" 
                disabled={loading || uploading}
              >
                {uploading ? `Загрузка изображения ${uploadProgress}%` : 
                 loading ? 'Публикация...' : 'Опубликовать'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}