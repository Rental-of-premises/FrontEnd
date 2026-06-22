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
    <div className="editroom-page" style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '50px 24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: 'transparent'  // Вместо белого фона
    }}>
      <div className="editroom-container">
        <Link to="/my-rooms" className="editroom-back" style={{
          display: 'inline-block',
          color: '#ffffff',
          background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          padding: '10px 24px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '600',
          textDecoration: 'none',
          marginBottom: '24px',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 12px rgba(40, 80, 167, 0.3)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(40, 80, 167, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 80, 167, 0.3)';
        }}>
          ← Назад к моим помещениям
        </Link>

        <div style={{ marginBottom: '32px' }}>
          <h1 className="editroom-title" style={{ 
            fontSize: '32px', 
            fontWeight: '800', 
            color: '#0f172a',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            marginBottom: '8px'
          }}>
            Редактировать помещение
          </h1>
          <p className="editroom-subtitle" style={{ 
            color: '#f1f5f9',  // Светло-серый, почти белый
            fontSize: '15px',
            fontWeight: '500',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'  // Тень для контраста
          }}>
            Измените параметры или описание вашего рабочего пространства
          </p>
        </div>

        <form onSubmit={handleSubmit} className="editroom-form" style={{
          background: 'rgba(235, 248, 245, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          maxWidth: '800px'
        }}>
          {errorMsg && <div className="error-message" style={{
            background: 'rgba(254, 242, 242, 0.9)',
            backdropFilter: 'blur(8px)',
            color: '#dc2626',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(254, 226, 226, 0.5)',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: '600'
          }}>{errorMsg}</div>}
          {successMsg && <div className="success-message" style={{
            background: 'rgba(220, 252, 231, 0.9)',
            backdropFilter: 'blur(8px)',
            color: '#166534',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(220, 252, 231, 0.5)',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: '600'
          }}>{successMsg}</div>}

          <div className="form-group">
            <label style={{ color: '#334155', fontWeight: '600', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Название помещения</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '10px',
                fontSize: '15px',
                color: '#1e293b',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#2850a7'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'}
            />
          </div>

          <div className="form-group">
            <label style={{ color: '#334155', fontWeight: '600', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Описание</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '10px',
                fontSize: '15px',
                color: '#1e293b',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#2850a7'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'}
            />
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label style={{ color: '#334155', fontWeight: '600', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Вместимость (чел.)</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min="1"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '10px',
                  fontSize: '15px',
                  color: '#1e293b',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#2850a7'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'}
              />
            </div>
            <div className="form-group">
              <label style={{ color: '#334155', fontWeight: '600', fontSize: '14px', display: 'block', marginBottom: '8px' }}>₽ Цена за час</label>
              <input
                type="number"
                name="price_per_hour"
                value={formData.price_per_hour}
                onChange={handleChange}
                min="50"
                step="50"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '10px',
                  fontSize: '15px',
                  color: '#1e293b',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#2850a7'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'}
              />
            </div>
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
              <label style={{ color: '#334155', fontWeight: '600', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Адрес</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '10px',
                  fontSize: '15px',
                  color: '#1e293b',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#2850a7'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'}
              />
            </div>
          </div>

          <AmenitiesSelector
            selectedIds={formData.amenities}
            onChange={handleAmenitiesChange}
            label="Удобства (выберите из списка)"
          />

          <div className="form-group">
            <label style={{ color: '#334155', fontWeight: '600', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Текущие изображения</label>
            {formData.existing_images.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Нет изображений</p>
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
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        background: 'rgba(241, 245, 249, 0.7)',
                        backdropFilter: 'blur(8px)'
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
                        background: 'rgba(239,68,68,0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.9)'}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <small className="form-hint" style={{ color: '#64748b', fontSize: '13px', marginTop: '8px', display: 'block' }}>
              Нажмите × чтобы удалить изображение (изменения сохранятся после нажатия "Сохранить")
            </small>
          </div>

          <div className="form-group">
            <label style={{ color: '#334155', fontWeight: '600', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
              Добавить новые изображения (макс. {MAX_FILES})
            </label>
            <div className="image-upload-area">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
                id="image-upload"
                multiple
                style={{ display: 'none' }}
              />
              <label htmlFor="image-upload" className="file-input-label" style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: formData.new_image_files.length > 0 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                  : 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
                color: '#ffffff',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(40, 80, 167, 0.25)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(40, 80, 167, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 80, 167, 0.25)';
              }}>
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
                          borderRadius: '10px',
                          border: '1px solid rgba(255, 255, 255, 0.4)',
                          background: 'rgba(241, 245, 249, 0.7)',
                          backdropFilter: 'blur(8px)'
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
                          background: 'rgba(0,0,0,0.7)',
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
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.85)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <small className="form-hint" style={{ color: '#64748b', fontSize: '13px', marginTop: '8px', display: 'block' }}>
              Максимум {MAX_FILES} файлов, каждый до 10MB
            </small>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              color: '#334155',
              fontWeight: '500',
              cursor: 'pointer',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(8px)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  accentColor: '#2850a7'
                }}
              />
              Помещение активно и доступно для общего бронирования
            </label>
          </div>

          <div className="form-actions" style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
            <Link to="/my-rooms" className="cancel-btn-form" style={{
              flex: 1,
              padding: '14px',
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#475569',
              cursor: 'pointer',
              textDecoration: 'none',
              textAlign: 'center',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              Отмена
            </Link>
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={updating || uploading}
              style={{
                flex: 2,
                padding: '14px',
                background: (updating || uploading) 
                  ? '#94a3b8' 
                  : 'linear-gradient(135deg, #2850a7 0%, #1e3d82 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: (updating || uploading) 
                  ? 'not-allowed' 
                  : 'pointer',
                transition: 'all 0.2s',
                opacity: (updating || uploading) ? 0.7 : 1,
                boxShadow: !updating && !uploading 
                  ? '0 6px 16px rgba(40, 80, 167, 0.35)' 
                  : 'none',
                letterSpacing: '0.3px'
              }}
              onMouseEnter={(e) => {
                if (!updating && !uploading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(40, 80, 167, 0.45)';
                }
              }}
              onMouseLeave={(e) => {
                if (!updating && !uploading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(40, 80, 167, 0.35)';
                }
              }}
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