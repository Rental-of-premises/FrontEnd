import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAddApartmentMutation } from '../store/api';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import MetroAutocomplete from '../components/MetroAutocomplete';

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
  });
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const MAX_FILES = 10;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (formData.image_previews.length + files.length > MAX_FILES) {
      setError(`Максимум ${MAX_FILES} изображений`);
      return;
    }

    const validFiles = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError(`Файл "${file.name}" не является изображением`);
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError(`Файл "${file.name}" больше 20MB`);
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name) {
      setError('Название обязательно');
      setLoading(false);
      return;
    }

    if (formData.image_files.length === 0) {
      setError('Выберите хотя бы одно изображение');
      setLoading(false);
      return;
    }

    if (!formData.metro) {
      setError('Укажите станцию метро');
      setLoading(false);
      return;
    }

    if (!formData.address) {
      setError('Укажите адрес');
      setLoading(false);
      return;
    }

    try {
      setUploading(true);
      
      const payload = {
        name: formData.name,
        description: formData.description || '',
        capacity: Number(formData.capacity),
        price_per_hour: Number(formData.price_per_hour),
        metro: formData.metro,
        address: formData.address,
        is_active: true,
        amenities: []
      };
      
      const result = await addApartment(payload).unwrap();
      const apartmentId = result.id;

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
        throw new Error('Ошибка загрузки изображений');
      }

      navigate('/my-rooms');
    } catch (err) {
      setError(err.data?.error || err.message || 'Ошибка при добавлении помещения');
    } finally {
      setLoading(false);
      setUploading(false);
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
                name="name"
                value={formData.name}
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
                placeholder="Опишите помещение..."
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
                <MetroAutocomplete
                  value={formData.metro}
                  onChange={(value) => setFormData(prev => ({ ...prev, metro: value }))}
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
                />
              </div>
            </div>

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
                <label htmlFor="image-upload" className="file-input-label">
                  {formData.image_files.length > 0 
                    ? `Выбрано ${formData.image_files.length} файлов` 
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
                      <div key={index} style={{ position: 'relative' }}>
                        <img 
                          src={preview} 
                          alt={`Превью ${index + 1}`} 
                          style={{ 
                            width: '100%', 
                            height: '100px', 
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
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
                            background: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <small className="form-hint">
                Максимум {MAX_FILES} файлов, каждый до 20MB. Поддерживаются JPG, PNG, WEBP.
              </small>
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
                {uploading ? 'Загрузка...' : loading ? 'Публикация...' : 'Опубликовать'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}