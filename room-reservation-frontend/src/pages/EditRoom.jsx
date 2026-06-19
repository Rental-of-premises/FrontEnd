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
  
  const { data: roomData, isLoading, error } = useGetApartmentByIdQuery(id);
  // ===== ИЗВЛЕКАЕМ apartment ИЗ ОТВЕТА =====
  const room = roomData?.apartment || null;
  
  const [updateApartment, { isLoading: updating }] = useUpdateApartmentMutation();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 1,
    price_per_hour: 500,
    is_active: true,
    image_file: null,
    image_preview: '',
    metro: '',
    address: '',
    amenities: []
  });
  const [uploading, setUploading] = useState(false);
  const [amenityInput, setAmenityInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ===== ЗАПОЛНЯЕМ ФОРМУ ДАННЫМИ ИЗ room =====
  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || '',
        description: room.description || '',
        capacity: room.capacity || 1,
        price_per_hour: room.price_per_hour || 500,
        is_active: room.is_active !== undefined ? room.is_active : true,
        image_file: null,
        image_preview: room.image_url || '',
        metro: room.metro || '',
        address: room.address || '',
        amenities: room.amenities || []
      });
    }
  }, [room]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Пожалуйста, выберите изображение');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Изображение не должно превышать 5MB');
        return;
      }
      
      setFormData(prev => ({ ...prev, image_file: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image_preview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveImageAsDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // ===== Собираем только измененные поля =====
    const updates = {};
    
    if (formData.name !== room.name) updates.name = formData.name;
    if (formData.description !== room.description) updates.description = formData.description || '';
    if (formData.capacity !== room.capacity) updates.capacity = Number(formData.capacity);
    if (formData.price_per_hour !== room.price_per_hour) updates.price_per_hour = Number(formData.price_per_hour);
    if (formData.is_active !== room.is_active) updates.is_active = formData.is_active;
    if (formData.metro !== room.metro) updates.metro = formData.metro;
    if (formData.address !== room.address) updates.address = formData.address;
    
    // Проверяем изображение
    if (formData.image_file) {
      try {
        setUploading(true);
        const imageUrl = await saveImageAsDataUrl(formData.image_file);
        updates.image_url = imageUrl;
        setUploading(false);
      } catch (err) {
        setErrorMsg('Ошибка при загрузке изображения');
        return;
      }
    } else if (formData.image_preview && formData.image_preview !== room.image_url) {
      updates.image_url = formData.image_preview;
    }
    
    // Проверяем удобства
    if (JSON.stringify(formData.amenities) !== JSON.stringify(room.amenities || [])) {
      updates.amenities = formData.amenities;
    }

    // Если ничего не изменилось
    if (Object.keys(updates).length === 0) {
      setSuccessMsg('Никаких изменений не было внесено');
      setTimeout(() => setSuccessMsg(''), 2000);
      return;
    }

    try {
      await updateApartment({
        id: parseInt(id),
        ...updates
      }).unwrap();
      
      setSuccessMsg('Помещение успешно обновлено!');
      setTimeout(() => navigate('/my-rooms'), 1500);
    } catch (err) {
      setErrorMsg(err.data?.error || 'Ошибка при обновлении помещения');
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
        background: '#f8fafc', 
        minHeight: 'calc(100vh - 70px)', 
        padding: '40px 20px',
        boxSizing: 'border-box'
      }}>
        <div className="editroom-container" style={{ maxWidth: '720px', margin: '0 auto' }}>
          
          <Link to="/my-rooms" className="editroom-back" style={{ 
            color: '#2850a7', 
            textDecoration: 'none', 
            fontWeight: '600', 
            fontSize: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            marginBottom: '24px',
            transition: 'color 0.2s'
          }}>
            ← Назад к моим помещениям
          </Link>

          <div style={{ marginBottom: '32px' }}>
            <h1 className="editroom-title" style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
              Редактировать помещение
            </h1>
            <p className="editroom-subtitle" style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>
              Измените только те поля, которые нужно обновить
            </p>
          </div>

          <form onSubmit={handleSubmit} className="editroom-form" style={{ 
            background: '#ffffff', 
            padding: '40px', 
            borderRadius: '24px', 
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            boxSizing: 'border-box'
          }}>
            
            {errorMsg && <div className="error-message" style={{ background: '#fef2f2', color: '#ef4444', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', border: '1px solid #fee2e2' }}>{errorMsg}</div>}
            {successMsg && <div className="success-message" style={{ background: '#f0fdf4', color: '#16a34a', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', border: '1px solid #dcfce7' }}>{successMsg}</div>}

            {/* ===== НАЗВАНИЕ ===== */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Название помещения</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={room.name || 'Введите название'}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                onFocus={(e) => { e.target.style.borderColor = '#2850a7'; e.target.style.boxShadow = '0 0 0 4px rgba(40, 80, 167, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* ===== ОПИСАНИЕ ===== */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Описание</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder={room.description || 'Введите описание'}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
                onFocus={(e) => { e.target.style.borderColor = '#2850a7'; e.target.style.boxShadow = '0 0 0 4px rgba(40, 80, 167, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* ===== ВМЕСТИМОСТЬ И ЦЕНА ===== */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Вместимость (чел.)</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  placeholder={room.capacity?.toString() || '1'}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => { e.target.style.borderColor = '#2850a7'; e.target.style.boxShadow = '0 0 0 4px rgba(40, 80, 167, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>₽ Цена за час</label>
                <input
                  type="number"
                  name="price_per_hour"
                  value={formData.price_per_hour}
                  onChange={handleChange}
                  min="100"
                  step="100"
                  placeholder={room.price_per_hour?.toString() || '500'}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => { e.target.style.borderColor = '#2850a7'; e.target.style.boxShadow = '0 0 0 4px rgba(40, 80, 167, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* ===== МЕТРО И АДРЕС ===== */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>🚇 Метро</label>
                <input
                  type="text"
                  name="metro"
                  value={formData.metro}
                  onChange={handleChange}
                  placeholder={room.metro || 'Введите станцию метро'}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => { e.target.style.borderColor = '#2850a7'; e.target.style.boxShadow = '0 0 0 4px rgba(40, 80, 167, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Адрес</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder={room.address || 'Введите адрес'}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => { e.target.style.borderColor = '#2850a7'; e.target.style.boxShadow = '0 0 0 4px rgba(40, 80, 167, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* ===== ИЗОБРАЖЕНИЕ ===== */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Изображение помещения</label>
              <div className="image-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="file-input-label" style={{ display: 'inline-block', padding: '12px 24px', background: '#2850a7', color: 'white', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', transition: 'background 0.2s', width: 'fit-content', fontWeight: '500' }}>
                  {formData.image_file ? 'Изменить изображение' : 'Выберите изображение'}
                </label>
                
                {formData.image_preview && (
                  <div className="image-preview" style={{ position: 'relative', width: '100%', maxWidth: '300px', marginTop: '12px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <img src={formData.image_preview} alt="Preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    <button 
                      type="button" 
                      className="remove-image-btn"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, image_file: null, image_preview: '' }))
                      }}
                      style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', background: 'rgba(0, 0, 0, 0.6)', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              <small className="form-hint" style={{ display: 'block', marginTop: '8px', fontSize: '12px', color: '#718096' }}>Поддерживаются JPG, PNG, GIF. Максимум 5MB</small>
            </div>

            {/* ===== УДОБСТВА ===== */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Удобства</label>
              <div className="amenities-input-group" style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  placeholder="Добавить удобство (WiFi, ТВ, ...)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                />
                <button 
                  type="button" 
                  onClick={handleAddAmenity} 
                  className="add-amenity-btn"
                  style={{ padding: '12px 20px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  + Добавить
                </button>
              </div>
              
              {formData.amenities.length > 0 && (
                <div className="amenities-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                  {formData.amenities.map(amenity => (
                    <span key={amenity} className="amenity-tag-remove" style={{ background: '#eff6ff', color: '#1e40af', padding: '6px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid #bfdbfe' }}>
                      {amenity}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveAmenity(amenity)}
                        style={{ border: 'none', background: 'transparent', color: '#1e40af', cursor: 'pointer', fontSize: '16px', padding: 0, fontWeight: '700' }}
                      >×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ===== АКТИВНОСТЬ ===== */}
            <div className="form-group checkbox-group" style={{ marginTop: '8px' }}>
              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#334155', cursor: 'pointer', fontWeight: '500' }}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2850a7' }}
                />
                Помещение активно и доступно для общего бронирования
              </label>
            </div>

            {/* ===== КНОПКИ ===== */}
            <div className="form-actions" style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
              <Link to="/my-rooms" className="cancel-btn-form" style={{ 
                flex: 1, 
                padding: '14px', 
                background: '#ffffff', 
                border: '1px solid #cbd5e1', 
                borderRadius: '12px', 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#64748b', 
                cursor: 'pointer', 
                textAlign: 'center', 
                textDecoration: 'none',
                display: 'block',
                boxSizing: 'border-box',
                transition: 'all 0.2s'
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
                  background: 'linear-gradient(135deg, #2850a7 0%, #1e3c82 100%)', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: 'white', 
                  cursor: updating || uploading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(40, 80, 167, 0.2)',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s',
                  opacity: updating || uploading ? 0.6 : 1
                }}
              >
                {uploading ? 'Сохранение изображения...' : updating ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}