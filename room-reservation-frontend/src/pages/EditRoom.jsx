import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGetApartmentByIdQuery, useUpdateApartmentMutation } from '../store/api';
import Navbar from '../components/Navbar';
import MetroAutocomplete from '../components/MetroAutocomplete';
import AmenitiesSelector from '../components/AmenitiesSelector';
import '../styles/editroom.css';

const API_URL = 'https://team3.verstack.ru';

export default function EditRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
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
    new_image_files: [],
    new_image_previews: [],
    existing_images: [],
    metro: '',
    address: '',
    amenities: [],
  });
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [imagesToDelete, setImagesToDelete] = useState([]);

  const MAX_FILES = 3;

  useEffect(() => {
    if (room) {
      const amenityIds = room.amenities?.map(a => a.id) || [];
      
      setFormData({
        name: room.name || '',
        description: room.description || '',
        capacity: room.capacity || 1,
        price_per_hour: room.price_per_hour || 500,
        is_active: room.is_active !== undefined ? room.is_active : true,
        new_image_files: [],
        new_image_previews: [],
        existing_images: existingImages.map(img => img.image_data) || [],
        metro: room.metro || '',
        address: room.address || '',
        amenities: amenityIds,
      });
    }
  }, [room, existingImages]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAmenitiesChange = (selectedIds) => {
    setFormData(prev => ({ ...prev, amenities: selectedIds }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (formData.new_image_previews.length + files.length > MAX_FILES) {
      setErrorMsg(`Максимум ${MAX_FILES} изображений`);
      return;
    }

    const validFiles = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg(`Файл "${file.name}" не является изображением`);
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        setErrorMsg(`Файл "${file.name}" больше 20MB`);
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
        new_image_files: [...prev.new_image_files, ...results.map(r => r.file)],
        new_image_previews: [...prev.new_image_previews, ...results.map(r => r.preview)]
      }));
      setErrorMsg('');
    });
  };

  const removeNewImage = (index) => {
    setFormData(prev => ({
      ...prev,
      new_image_files: prev.new_image_files.filter((_, i) => i !== index),
      new_image_previews: prev.new_image_previews.filter((_, i) => i !== index)
    }));
  };

  const markExistingImageForDeletion = (index) => {
    const urlToDelete = formData.existing_images[index];
    const imgToDelete = existingImages.find(img => img.image_data === urlToDelete);
    if (imgToDelete) {
      setImagesToDelete(prev => [...prev, imgToDelete.id]);
    }
    setFormData(prev => ({
      ...prev,
      existing_images: prev.existing_images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!room) {
      setErrorMsg('Помещение не найдено');
      return;
    }

    try {
      const updates = {};
      if (formData.name !== room.name) updates.name = String(formData.name).trim();
      if (formData.description !== room.description) updates.description = String(formData.description || '').trim() || null;
      if (Number(formData.capacity) !== Number(room.capacity)) updates.capacity = Number(formData.capacity);
      if (Number(formData.price_per_hour) !== Number(room.price_per_hour)) updates.price_per_hour = Number(formData.price_per_hour);
      if (Boolean(formData.is_active) !== Boolean(room.is_active)) updates.is_active = Boolean(formData.is_active);
      if (formData.metro !== room.metro) updates.metro = String(formData.metro || '').trim() || null;
      if (formData.address !== room.address) updates.address = String(formData.address || '').trim() || null;
      
      const currentAmenityIds = room.amenities?.map(a => a.id) || [];
      if (JSON.stringify(formData.amenities) !== JSON.stringify(currentAmenityIds)) {
        updates.amenities = formData.amenities;
      }

      if (Object.keys(updates).length > 0) {
        await updateApartment({
          id: parseInt(id),
          ...updates
        }).unwrap();
      }

      if (imagesToDelete.length > 0) {
        const formDataUpdate = new FormData();
        formDataUpdate.append('delete_images', imagesToDelete.join(','));
        
        for (const file of formData.new_image_files) {
          formDataUpdate.append('images', file);
        }

        setUploading(true);
        const response = await fetch(`${API_URL}/api/account/apartments/${id}/update-images`, {
          method: 'PATCH',
          credentials: 'include',
          body: formDataUpdate
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Ошибка обновления изображений: ${response.status} ${errorText}`);
        }
        setUploading(false);
      } else if (formData.new_image_files.length > 0) {
        const formDataUpload = new FormData();
        for (const file of formData.new_image_files) {
          formDataUpload.append('images', file);
        }

        setUploading(true);
        const uploadResponse = await fetch(`${API_URL}/api/account/apartments/${id}/upload-images`, {
          method: 'POST',
          credentials: 'include',
          body: formDataUpload
        });

        if (!uploadResponse.ok) {
          throw new Error('Ошибка загрузки изображений');
        }
        setUploading(false);
      }

      setSuccessMsg('Помещение успешно обновлено!');
      setImagesToDelete([]);
      refetch();
      setTimeout(() => navigate('/my-rooms'), 1500);
      
    } catch (err) {
      console.error('Ошибка обновления:', err);
      setErrorMsg(err.data?.error || err.message || 'Ошибка при обновлении помещения');
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
            {errorMsg && <div className="error-message">{errorMsg}</div>}
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
                  label="Метро *"
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

            <AmenitiesSelector
              selectedIds={formData.amenities}
              onChange={handleAmenitiesChange}
              label="Удобства (выберите из списка)"
            />

            <div className="form-group">
              <label>Текущие изображения</label>
              {formData.existing_images.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>Нет изображений</p>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                  gap: '10px',
                  marginTop: '8px'
                }}>
                  {formData.existing_images.map((url, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <img 
                        src={url}
                        alt={`Изображение ${index + 1}`} 
                        style={{ 
                          width: '100%', 
                          height: '100px', 
                          objectFit: 'contain',
                          maxWidth: '100%',
                          maxHeight: '100%',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          background: '#f1f5f9'
                        }} 
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/120x100?text=Ошибка';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => markExistingImageForDeletion(index)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '24px',
                          height: '24px',
                          background: 'rgba(239,68,68,0.8)',
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
              <small className="form-hint">
                Нажмите × чтобы удалить изображение (изменения сохранятся после нажатия "Сохранить")
              </small>
            </div>

            <div className="form-group">
              <label>Добавить новые изображения (макс. {MAX_FILES})</label>
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
                  {formData.new_image_files.length > 0 
                    ? `Выбрано ${formData.new_image_files.length} файлов` 
                    : 'Выберите изображения'}
                </label>
                
                {formData.new_image_previews.length > 0 && (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                    gap: '10px',
                    marginTop: '12px'
                  }}>
                    {formData.new_image_previews.map((preview, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <img 
                          src={preview} 
                          alt={`Новое ${index + 1}`} 
                          style={{ 
                            width: '100%', 
                            height: '100px', 
                            objectFit: 'contain',
                            maxWidth: '100%',
                            maxHeight: '100%',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: '#f1f5f9'
                          }} 
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
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
                Максимум {MAX_FILES} файлов, каждый до 10MB
              </small>
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
                {uploading ? `Загрузка ${uploadProgress}%` : 
                 updating ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}