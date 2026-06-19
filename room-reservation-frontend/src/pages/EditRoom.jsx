// src/pages/EditRoom.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGetApartmentByIdQuery, useUpdateApartmentMutation } from '../store/api';
import Navbar from '../components/Navbar';
import MetroAutocomplete from '../components/MetroAutocomplete';
import '../styles/editroom.css';

export default function EditRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: roomData, isLoading, error } = useGetApartmentByIdQuery(id);
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

  useEffect(() => {
    if (room) {
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
    if (!file) return;

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
    setImageChanged(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setFormData(prev => ({
        ...prev,
        image_file: isLarge ? file : null,
        image_base64: isLarge ? null : base64,
        image_preview: base64,
        existing_image_url: ''
      }));
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

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
      
      xhr.open('POST', `${API_URL}/api/account/apartments/${apartmentId}/upload-images`);
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  };

  const uploadBase64Image = async (apartmentId, base64Data) => {
    const response = await fetch(base64Data);
    const blob = await response.blob();
    
    const formData = new FormData();
    formData.append('images', blob, 'image.png');
    
    const uploadResponse = await fetch(`${API_URL}/api/account/apartments/${apartmentId}/upload-images`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.error || 'Ошибка загрузки изображения');
    }
    
    return await uploadResponse.json();
  };

  const deleteOldImages = async (apartmentId) => {
    const response = await fetch(`${API_URL}/api/account/apartments/${apartmentId}/delete-images`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!response.ok && response.status !== 404) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка удаления старого изображения');
    }
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

    if (!room) {
      setErrorMsg('Помещение не найдено');
      return;
    }

    if (parseInt(id) !== room.id) {
      setErrorMsg(`Ошибка: ID не совпадает. URL: ${id}, Данные: ${room.id}`);
      return;
    }

    try {
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

      if (imageChanged) {
        console.log('🖼️ Изображение изменено, загружаем новое...');
        
        if (formData.image_file) {
          console.log('📤 Загружаем большое изображение...');
          setUploading(true);
          setUploadProgress(0);
          await uploadImageToBackend(parseInt(id), formData.image_file);
          setUploading(false);
        } else if (formData.image_base64) {
          console.log('📤 Загружаем маленькое изображение (base64)...');
          setUploading(true);
          await uploadBase64Image(parseInt(id), formData.image_base64);
          setUploading(false);
        }
        
        console.log('✅ Изображение обновлено!');
      }

      if (Object.keys(updates).length > 0) {
        console.log('📤 Отправляем обновление данных:', updates);
        const result = await updateApartment({
          id: parseInt(id),
          ...updates
        }).unwrap();
        console.log('✅ Данные обновлены:', result);
      } else if (!imageChanged) {
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

            <div className="form-group">
              <label>Описание</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
              />
            </div>

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

            <div className="form-row">
              <div className="form-group">
                <MetroAutocomplete
                  value={formData.metro || ''}
                  onChange={(value) => setFormData(prev => ({ ...prev, metro: value }))}
                  placeholder="Начните вводить название станции..."
                  required={true}
                  label="🚇 Метро *"
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
                  {imageChanged ? 'Изменить изображение' : 'Выберите новое изображение'}
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
                    {imageChanged && (
                      <button 
                        type="button" 
                        className="remove-image-btn"
                        onClick={restoreOriginalImage}
                      >
                        ↺
                      </button>
                    )}
                  </div>
                )}

                {!imageChanged && formData.existing_image_url && (
                  <div style={{ marginTop: '8px', fontSize: '14px', color: '#10b981' }}>
                    ✅ Текущее изображение сохранено
                    <button 
                      type="button"
                      onClick={() => {
                        setImageChanged(true);
                        setFormData(prev => ({
                          ...prev,
                          image_preview: '',
                          existing_image_url: ''
                        }));
                      }}
                      style={{ 
                        marginLeft: '12px', 
                        color: '#ef4444', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        fontSize: '14px',
                        textDecoration: 'underline'
                      }}
                    >
                      Удалить изображение
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