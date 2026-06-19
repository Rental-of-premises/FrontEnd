// src/pages/EditRoom.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGetApartmentByIdQuery, useUpdateApartmentMutation } from '../store/api';
import Navbar from '../components/Navbar';
import '../styles/editroom.css';

export default function EditRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  console.log('🔍 ID из URL:', id);
  
  const { data: roomData, isLoading, error, refetch } = useGetApartmentByIdQuery(id);
  const room = roomData?.apartment || null;
  const existingImages = roomData?.images || [];
  
  const [updateApartment, { isLoading: updating }] = useUpdateApartmentMutation();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 1,
    price_per_hour: 500,
    is_active: true,
    image_file: null,
    image_base64: null,
    image_preview: '',
    existing_image_url: '',
    metro: '',
    address: '',
    amenities: []
  });
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [amenityInput, setAmenityInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLargeImage, setIsLargeImage] = useState(false);
  const [fileSize, setFileSize] = useState('');
  const [imageChanged, setImageChanged] = useState(false);

  const MAX_CLIENT_STORAGE = 5 * 1024 * 1024;
  const API_URL = 'http://localhost:8080';

  // Заполняем форму данными
  useEffect(() => {
    if (room) {
      console.log('📦 Загружено помещение:', room);
      
      let imageUrl = '';
      if (existingImages && existingImages.length > 0) {
        imageUrl = existingImages[0].image_url;
      } else if (room.image_url) {
        imageUrl = room.image_url;
      }
      
      setFormData({
        name: room.name || '',
        description: room.description || '',
        capacity: room.capacity || 1,
        price_per_hour: room.price_per_hour || 500,
        is_active: room.is_active !== undefined ? room.is_active : true,
        image_file: null,
        image_base64: null,
        image_preview: imageUrl,
        existing_image_url: imageUrl,
        metro: room.metro || '',
        address: room.address || '',
        amenities: room.amenities || []
      });
      setImageChanged(false);
    }
  }, [room, existingImages]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.log('⚠️ Файл не выбран');
      return;
    }

    console.log('📸 Выбран файл:', file.name, file.size, 'bytes');

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Пожалуйста, выберите изображение');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('Изображение не должно превышать 20MB');
      return;
    }

    const isLarge = file.size > MAX_CLIENT_STORAGE;
    setIsLargeImage(isLarge);
    setFileSize((file.size / 1024 / 1024).toFixed(2) + ' MB');
    setImageChanged(true); // <- УСТАНАВЛИВАЕМ ФЛАГ

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      console.log('📸 Base64 готов, длина:', base64.length);
      setFormData(prev => ({
        ...prev,
        image_file: isLarge ? file : null,
        image_base64: isLarge ? null : base64,
        image_preview: base64,
        existing_image_url: ''
      }));
      setErrorMsg('');
    };
    reader.onerror = (err) => {
      console.error('❌ Ошибка чтения файла:', err);
      setErrorMsg('Ошибка чтения файла');
    };
    reader.readAsDataURL(file);
  };

  // Загрузка изображения на бэкенд
  const uploadImage = async (apartmentId, imageData) => {
    console.log('📤 Загружаем изображение для помещения:', apartmentId);
    
    let file;
    if (imageData instanceof File) {
      file = imageData;
      console.log('📤 Это File object, размер:', file.size);
    } else if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
      console.log('📤 Конвертируем base64 в File...');
      const response = await fetch(imageData);
      const blob = await response.blob();
      file = new File([blob], 'image.png', { type: blob.type });
      console.log('📤 Создан File, размер:', file.size);
    } else {
      throw new Error('Неверный формат изображения');
    }

    const formData = new FormData();
    formData.append('images', file);

    return new Promise((resolve, reject) => {
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
            console.log('✅ Изображение загружено:', data);
            resolve(data);
          } catch (err) {
            reject(new Error('Ошибка парсинга ответа'));
          }
        } else {
          reject(new Error(`Ошибка загрузки: ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => reject(new Error('Ошибка сети'));
      
      const url = `${API_URL}/api/account/apartments/${apartmentId}/upload-images`;
      console.log('📤 URL загрузки:', url);
      xhr.open('POST', url);
      xhr.withCredentials = true;
      xhr.send(formData);
    });
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

  const restoreOriginalImage = () => {
    setFormData(prev => ({
      ...prev,
      image_file: null,
      image_base64: null,
      image_preview: prev.existing_image_url || '',
      existing_image_url: prev.existing_image_url || ''
    }));
    setImageChanged(false);
    setIsLargeImage(false);
    setFileSize('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Проверка: существует ли помещение
    if (!room) {
      setErrorMsg('Помещение не найдено');
      return;
    }

    // Проверка: правильный ли ID
    if (parseInt(id) !== room.id) {
      setErrorMsg(`Ошибка: ID не совпадает. URL: ${id}, Данные: ${room.id}`);
      return;
    }

    console.log('🔄 Начинаем сохранение...');
    console.log('🖼️ imageChanged:', imageChanged);
    console.log('📸 formData.image_file:', formData.image_file);
    console.log('📸 formData.image_base64:', formData.image_base64 ? 'есть (длина ' + formData.image_base64.length + ')' : 'нет');

    try {
      // ========== ОБРАБОТКА ИЗОБРАЖЕНИЯ ==========
      // ЗАГРУЖАЕМ ИЗОБРАЖЕНИЕ ВСЕГДА, если оно есть
      const imageToUpload = formData.image_file || formData.image_base64;
      
      if (imageToUpload) {
        console.log('🖼️ Загружаем изображение...');
        setUploading(true);
        setUploadProgress(0);
        
        const result = await uploadImage(parseInt(id), imageToUpload);
        console.log('✅ Изображение загружено:', result);
        setUploading(false);
        
        // После загрузки изображения очищаем formData, чтобы не загружать повторно
        setFormData(prev => ({
          ...prev,
          image_file: null,
          image_base64: null
        }));
        setImageChanged(false);
      } else {
        console.log('🖼️ Нет нового изображения для загрузки');
      }

      // ========== ОБНОВЛЕНИЕ ДАННЫХ ПОМЕЩЕНИЯ ==========
      const updates = {};
      
      if (formData.name !== room.name) {
        updates.name = String(formData.name).trim();
      }
      
      if (formData.description !== room.description) {
        updates.description = String(formData.description || '').trim() || null;
      }
      
      if (Number(formData.capacity) !== Number(room.capacity)) {
        updates.capacity = Number(formData.capacity);
      }
      
      if (Number(formData.price_per_hour) !== Number(room.price_per_hour)) {
        updates.price_per_hour = Number(formData.price_per_hour);
      }
      
      if (Boolean(formData.is_active) !== Boolean(room.is_active)) {
        updates.is_active = Boolean(formData.is_active);
      }
      
      if (formData.metro !== room.metro) {
        updates.metro = String(formData.metro || '').trim() || null;
      }
      
      if (formData.address !== room.address) {
        updates.address = String(formData.address || '').trim() || null;
      }
      
      const currentAmenities = Array.isArray(formData.amenities) ? formData.amenities : [];
      const originalAmenities = Array.isArray(room.amenities) ? room.amenities : [];
      
      if (JSON.stringify(currentAmenities) !== JSON.stringify(originalAmenities)) {
        updates.amenities = currentAmenities;
      }

      console.log('📤 Обновление данных помещения:', updates);

      if (Object.keys(updates).length > 0) {
        console.log('📤 Отправляем обновление данных:', updates);
        const result = await updateApartment({
          id: parseInt(id),
          ...updates
        }).unwrap();
        console.log('✅ Данные обновлены:', result);
      } else if (!imageToUpload) {
        setSuccessMsg('Никаких изменений не было внесено');
        setTimeout(() => setSuccessMsg(''), 2000);
        return;
      }

      setSuccessMsg('Помещение успешно обновлено!');
      setTimeout(() => navigate('/my-rooms'), 1500);
      
    } catch (err) {
      console.error('❌ Ошибка обновления:', err);
      
      let errorMessage = 'Ошибка при обновлении помещения';
      
      if (err?.data?.error) {
        errorMessage = err.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      if (err?.data?.details) {
        errorMessage += '\n' + JSON.stringify(err.data.details, null, 2);
      }
      
      setErrorMsg(errorMessage);
      setUploading(false);
    }
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
            <Link to="/my-rooms">
              <button className="auth-btn" style={{ marginTop: '20px' }}>
                Вернуться к моим помещениям
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
      <div className="editroom-page">
        <div className="editroom-container">
          <Link to="/my-rooms" className="editroom-back">
            ← Назад к моим помещениям
          </Link>

          <div style={{ marginBottom: '32px' }}>
            <h1 className="editroom-title">Редактировать помещение</h1>
            <p className="editroom-subtitle">
              Измените параметры или описание вашего рабочего пространства
            </p>
          </div>

          <form onSubmit={handleSubmit} className="editroom-form">
            {errorMsg && (
              <div className="error-message" style={{ 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {errorMsg}
              </div>
            )}
            {successMsg && <div className="success-message">{successMsg}</div>}

            {/* Название */}
            <div className="form-group">
              <label>Название помещения</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Описание */}
            <div className="form-group">
              <label>Описание</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
              />
            </div>

            {/* Вместимость и цена */}
            <div className="form-row">
              <div className="form-group">
                <label>Вместимость (чел.)</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>₽ Цена за час</label>
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

            {/* Метро и адрес */}
            <div className="form-row">
              <div className="form-group">
                <label>🚇 Метро</label>
                <input
                  type="text"
                  name="metro"
                  value={formData.metro}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Адрес</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Изображение */}
            <div className="form-group">
              <label>Изображение помещения</label>
              <div className="image-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="file-input-label">
                  Выберите изображение
                </label>
                
                {formData.image_preview && (
                  <div className="image-preview">
                    <img 
                      src={formData.image_preview.startsWith('data:') ? formData.image_preview : `${API_URL}${formData.image_preview}`} 
                      alt="Preview"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x200?text=Нет+изображения';
                      }}
                    />
                    <button 
                      type="button" 
                      className="remove-image-btn"
                      onClick={restoreOriginalImage}
                    >
                      ✕
                    </button>
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
                Поддерживаются JPG, PNG, GIF, WEBP. Максимум 20MB
              </small>
            </div>

            {/* Удобства */}
            <div className="form-group">
              <label>Удобства</label>
              <div className="amenities-input-group">
                <input
                  type="text"
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  placeholder="Добавить удобство (WiFi, ТВ, ...)"
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

            {/* Активность */}
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                Помещение активно и доступно для общего бронирования
              </label>
            </div>

            {/* Кнопки */}
            <div className="form-actions">
              <Link to="/my-rooms" className="cancel-btn-form">
                Отмена
              </Link>
              <button 
                type="submit" 
                className="submit-btn" 
                disabled={updating || uploading}
              >
                {uploading ? `Загрузка изображения ${uploadProgress}%` : 
                 updating ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}