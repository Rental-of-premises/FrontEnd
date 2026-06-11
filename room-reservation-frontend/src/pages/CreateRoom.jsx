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
    room_type: 'Coworking',
    capacity: 1,
    price_per_hour: 10,
    image_url: '',
    amenities: []
  })
  
  const [amenityInput, setAmenityInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const roomTypes = ['Coworking', 'Conference', 'Private', 'Studio', 'Meeting', 'Event']

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.title) {
      setError('Название обязательно')
      setLoading(false)
      return
    }

    if (!formData.image_url) {
      setError('URL изображения обязателен')
      setLoading(false)
      return
    }

    try {
      const newRoom = {
        ...formData,
        posted_by: user?.name || 'Пользователь',
        posted_date: new Date().toLocaleDateString()
      }
      
      await addApartment(newRoom).unwrap()
      navigate('/dashboard')
    } catch (err) {
      setError('Ошибка при добавлении помещения')
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
                <label>Тип помещения</label>
                <select name="room_type" value={formData.room_type} onChange={handleChange}>
                  {roomTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

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
                <label>Цена за час ($)</label>
                <input
                  type="number"
                  name="price_per_hour"
                  value={formData.price_per_hour}
                  onChange={handleChange}
                  min="1"
                  step="5"
                />
              </div>
            </div>

            <div className="form-group">
              <label>URL изображения</label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="form-group">
              <label>Удобства</label>
              <div className="amenities-input-group">
                <input
                  type="text"
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  placeholder="Добавить удобство (WiFi, Coffee, ...)"
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
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Публикация...' : 'Опубликовать'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}