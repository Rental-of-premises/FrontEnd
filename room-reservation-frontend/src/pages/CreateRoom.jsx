import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAddApartmentMutation } from '../store/api';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import MetroAutocomplete from '../components/MetroAutocomplete';
import AmenitiesSelector from '../components/AmenitiesSelector';

const API_URL = 'https://team3.verstack.ru';

export default function CreateRoom() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addApartment] = useAddApartmentMutation();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 1,
    price_per_hour: 500,
    image_files: [],
    image_previews: [],
    metro: '',
    address: '',
    amenities: [],
  });
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const MAX_FILES = 3;

  //ВАЛИДАЦИЯ
  const validateForm = () => {
    // Проверяем все обязательные поля
    if (!formData.name.trim()) {
      setError('❌ Название помещения обязательно');
      return false;
    }
    if (!formData.metro.trim()) {
      setError('❌ Укажите станцию метро');
      return false;
    }
    if (!formData.address.trim()) {
      setError('❌ Укажите адрес');
      return false;
    }
    if (formData.image_files.length === 0) {
      setError('❌ Добавьте хотя бы одно изображение');
      return false;
    }
    if (formData.price_per_hour < 0) {
      setError('❌ Цена должна быть не менее 0 ₽/час');
      return false;
    }
    if (formData.capacity < 1) {
      setError('❌ Вместимость должна быть не менее 1 человека');
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleAmenitiesChange = (selectedIds) => {
    setFormData(prev => ({ ...prev, amenities: selectedIds }));
    if (error) setError('');
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (formData.image_previews.length + files.length > MAX_FILES) {
      setError(`❌ Максимум ${MAX_FILES} изображений`);
      return;
    }

    const validFiles = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError(`❌ Файл "${file.name}" не является изображением`);
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError(`❌ Файл "${file.name}" больше 20MB`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    const readers = validFiles.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ file, preview: reader.result });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((results) => {
      setFormData(prev => ({
        ...prev,
        image_files: [...prev.image_files, ...results.map(r => r.file)],
        image_previews: [...prev.image_previews, ...results.map(r => r.preview)]
      }));
      setError('');
    });
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      image_files: prev.image_files.filter((_, i) => i !== index),
      image_previews: prev.image_previews.filter((_, i) => i !== index)
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    //ВАЛИДАЦИЯ ПЕРЕД ОТПРАВКОЙ
    if (!validateForm()) {
      setLoading(false);
      document.querySelector('.error-message')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    try {
      setUploading(true);
      
      // Создаём помещение
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        capacity: Number(formData.capacity),
        price_per_hour: Number(formData.price_per_hour),
        metro: formData.metro.trim(),
        address: formData.address.trim(),
        is_active: true,
        amenities: formData.amenities
      };
      
      const result = await addApartment(payload).unwrap();
      const apartmentId = result.id;

      // Загружаем изображения
      const formDataUpload = new FormData();
      for (const file of formData.image_files) {
        formDataUpload.append('images', file);
      }

      const uploadResponse = await fetch(`${API_URL}/api/account/apartments/${apartmentId}/upload-images`, {
        method: 'POST',
        credentials: 'include',
        body: formDataUpload
      });

      if (!uploadResponse.ok) {
        try {
          await fetch(`${API_URL}/api/account/apartments/${apartmentId}/delete`, {
            method: 'DELETE',
            credentials: 'include'
          });
        } catch (e) {
          console.warn('Не удалось удалить помещение после ошибки загрузки:', e);
        }
        const errorText = await uploadResponse.text();
        throw new Error(`Ошибка загрузки изображений: ${uploadResponse.status} ${errorText}`);
      }

      navigate('/my-rooms');
      
    } catch (err) {
      console.error('Ошибка создания:', err);
      setError(err.data?.error || err.message || '❌ Ошибка при добавлении помещения');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  //ПРОВЕРКА
  const isFormValid = 
    formData.name.trim() !== '' &&
    formData.metro.trim() !== '' &&
    formData.address.trim() !== '' &&
    formData.image_files.length > 0 &&
    formData.price_per_hour >= 0 &&
    formData.capacity >= 1;

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="create-room-container">
          <h1 className="page-title">Опубликовать помещение</h1>
          
          <form onSubmit={handleSubmit} className="create-room-form">
            {error && (
              <div className="error-message" style={{
                background: '#fef2f2',
                color: '#ef4444',
                padding: '16px 20px',
                borderRadius: '12px',
                border: '1px solid #fee2e2',
                marginBottom: '20px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {error}
              </div>
            )}
            
            <div className="form-group">
              <label>Название *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Например: Modern Coworking Space"
                required
                style={{
                  borderColor: !formData.name.trim() && error ? '#ef4444' : undefined
                }}
              />
            </div>

            <div className="form-group">
              <label>Описание</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Опишите помещение..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Вместимость (человек) *</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  max="200"
                  required
                  style={{
                    borderColor: formData.capacity < 1 && error ? '#ef4444' : undefined
                  }}
                />
              </div>

              <div className="form-group">
                <label>Цена за час (₽) *</label>
                <input
                  type="number"
                  name="price_per_hour"
                  value={formData.price_per_hour}
                  onChange={handleChange}
                  min="50"
                  step="50"
                  required
                  style={{
                    borderColor: formData.price_per_hour < 0 && error ? '#ef4444' : undefined
                  }}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <MetroAutocomplete
                  value={formData.metro}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, metro: value }));
                    if (error) setError('');
                  }}
                  placeholder="Начните вводить название станции..."
                  required={true}
                  label="Метро *"
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
                  style={{
                    borderColor: !formData.address.trim() && error ? '#ef4444' : undefined
                  }}
                />
              </div>
            </div>

            <AmenitiesSelector
              selectedIds={formData.amenities}
              onChange={handleAmenitiesChange}
              label="Удобства (выберите из списка)"
            />

            <div className="form-group">
              <label>Изображения помещения * (макс. {MAX_FILES})</label>
              <div className="image-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                  id="image-upload"
                  multiple
                />
                <label 
                  htmlFor="image-upload" 
                  className="file-input-label"
                  style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    background: formData.image_files.length > 0 ? '#10b981' : '#2850a7',
                    color: '#ffffff',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                >
                  {formData.image_files.length > 0 
                    ? `✅ Выбрано ${formData.image_files.length} файлов` 
                    : 'Выберите изображения'}
                </label>
                
                {formData.image_previews.length > 0 && (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                    gap: '10px',
                    marginTop: '12px'
                  }}>
                    {formData.image_previews.map((preview, index) => (
                      <div key={index} style={{ 
                        position: 'relative',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0',
                        background: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100px'
                      }}>
                        <img 
                          src={preview} 
                          alt={`Превью ${index + 1}`} 
                          style={{ 
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            maxWidth: '100%',
                            maxHeight: '100%'
                          }} 
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '24px',
                            height: '24px',
                            background: 'rgba(239,68,68,0.85)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.85)'}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <small className="form-hint">
                Максимум {MAX_FILES} файлов, каждый до 10MB. Поддерживаются JPG, PNG.
              </small>
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
              <button 
                type="button" 
                onClick={() => navigate('/dashboard')} 
                className="cancel-btn-form"
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Отмена
              </button>
              
              <button 
                type="submit" 
                className="submit-btn" 
                disabled={!isFormValid || loading || uploading}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: (!isFormValid || loading || uploading) 
                    ? '#94a3b8' 
                    : 'linear-gradient(135deg, #2850a7 0%, #1e3d82 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: (!isFormValid || loading || uploading) 
                    ? 'not-allowed' 
                    : 'pointer',
                  transition: 'all 0.2s',
                  opacity: (!isFormValid || loading || uploading) ? 0.7 : 1,
                  boxShadow: isFormValid && !loading && !uploading 
                    ? '0 4px 12px rgba(40, 80, 167, 0.3)' 
                    : 'none'
                }}
              >
                {uploading 
                  ? '⏳ Загрузка изображений...' 
                  : loading 
                    ? '⏳ Публикация...' 
                    : !formData.image_files.length 
                      ? 'Добавьте изображения' 
                      : !formData.name.trim() || !formData.metro.trim() || !formData.address.trim()
                        ? 'Заполните все поля'
                        : 'Опубликовать'}
              </button>
            </div>

            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
              color: '#64748b'
            }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ 
                  color: formData.name.trim() ? '#10b981' : '#94a3b8'
                }}>{formData.name.trim() ? '✅' : '⬜'} Название</span>
                <span style={{ 
                  color: formData.metro.trim() ? '#10b981' : '#94a3b8'
                }}>{formData.metro.trim() ? '✅' : '⬜'} Метро</span>
                <span style={{ 
                  color: formData.address.trim() ? '#10b981' : '#94a3b8'
                }}>{formData.address.trim() ? '✅' : '⬜'} Адрес</span>
                <span style={{ 
                  color: formData.image_files.length > 0 ? '#10b981' : '#94a3b8'
                }}>{formData.image_files.length > 0 ? '✅' : '⬜'} Изображения</span>
                <span style={{ 
                  color: formData.price_per_hour >= 0 ? '#10b981' : '#94a3b8'
                }}>{formData.price_per_hour >= 0 ? '✅' : '⬜'} Цена ≥ 0</span>
                <span style={{ 
                  color: formData.capacity >= 1 ? '#10b981' : '#94a3b8'
                }}>{formData.capacity >= 1 ? '✅' : '⬜'} Вместимость ≥ 1</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}