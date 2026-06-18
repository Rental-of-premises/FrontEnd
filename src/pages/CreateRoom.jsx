// src/pages/CreateRoom.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAddApartmentMutation } from '../store/api'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'

export default function CreateRoom() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [addApartment] = useAddApartmentMutation()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    capacity: 1,
    price_per_hour: 500,
    image_file: null,
    metro: '',
    address: '',
    amenities: []
  })
  
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [amenityInput, setAmenityInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Пожалуйста, выберите изображение')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Изображение не должно превышать 5MB')
        return
      }
      
      setFormData(prev => ({ ...prev, image_file: file }))
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const handleAddAmenity = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()]
      }))
      setAmenityInput('')
    }
  }

  const handleRemoveAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }))
  }

  // Сохраняем изображение как Data URL
  const saveImageAsDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target.result)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.title) {
      setError('Название обязательно')
      setLoading(false)
      return
    }

    if (!formData.image_file) {
      setError('Пожалуйста, выберите изображение')
      setLoading(false)
      return
    }

    if (!formData.metro) {
      setError('Укажите станцию метро')
      setLoading(false)
      return
    }

    if (!formData.address) {
      setError('Укажите адрес')
      setLoading(false)
      return
    }

    try {
      setUploading(true)
      const imageDataUrl = await saveImageAsDataUrl(formData.image_file)
      setUploading(false)
      
      const payload = {
        title: formData.title,
        description: formData.description || '',
        capacity: Number(formData.capacity),
        price_per_hour: Number(formData.price_per_hour),
        image_url: imageDataUrl,
        metro: formData.metro,
        address: formData.address,
        amenities: formData.amenities
      }
      
      await addApartment(payload).unwrap()
      navigate('/my-rooms')
    } catch (err) {
      setError(err.data?.error || err.message || 'Ошибка при добавлении помещения')
    } finally {
      setLoading(false)
    }
  }

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
                        setFormData(prev => ({ ...prev, image_file: null }))
                        setImagePreview(null)
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              <small className="form-hint">Поддерживаются JPG, PNG, GIF. Максимум 5MB</small>
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
                {uploading ? 'Сохранение изображения...' : loading ? 'Публикация...' : 'Опубликовать'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}