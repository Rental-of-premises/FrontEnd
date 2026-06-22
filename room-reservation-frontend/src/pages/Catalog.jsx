import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGetCatalogQuery, useGetAmenitiesQuery } from '../store/api';
import Navbar from '../components/Navbar';
import MetroAutocomplete from '../components/MetroAutocomplete';
import { getFullImageUrl, getMainImage } from '../utils/imageUtils';

export default function Catalog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [capacityMin, setCapacityMin] = useState('');
  const [priceMax, setPriceMax] = useState(10000);
  const [priceValue, setPriceValue] = useState(10000);
  const [metroStation, setMetroStation] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  
  const [filters, setFilters] = useState({
    is_active: true,
    limit: 100,
    offset: 0
  });
  
  const { data, isLoading, isError, error, refetch } = useGetCatalogQuery(filters);
  const { data: amenities = [], isLoading: amenitiesLoading } = useGetAmenitiesQuery();
  
  const rooms = data?.apartments || [];
  const imagesData = data?.images || [];

  const imageMap = {};
  if (Array.isArray(imagesData)) {
    imagesData.forEach((imageList, index) => {
      if (Array.isArray(imageList) && imageList.length > 0) {
        const room = rooms[index];
        if (room) {
          imageMap[room.id] = getMainImage(imageList);
        }
      }
    });
  }

  const getRoomImage = (room) => {
    if (imageMap[room.id]) {
      return imageMap[room.id];
    }
    if (room.image_data) {
      return getFullImageUrl(room.image_data);
    }
    return null;
  };

  useEffect(() => {
    const newFilters = {
      is_active: true,
      limit: 100,
      offset: 0
    };
    
    if (priceMax < 10000) {
      newFilters.max_price = priceMax;
    }
    
    if (selectedAmenities.length > 0) {
      newFilters.amenities = selectedAmenities;
    }
    
    setFilters(newFilters);
  }, [priceMax, selectedAmenities]);

  const resetFilters = () => {
    setSearchTerm('');
    setCapacityMin('');
    setPriceMax(10000);
    setPriceValue(10000);
    setMetroStation('');
    setSelectedAmenities([]);
    setFilters({ is_active: true, limit: 100, offset: 0 });
    refetch();
  };

  const handleAmenityToggle = (amenityId) => {
    setSelectedAmenities(prev => {
      if (prev.includes(amenityId)) {
        return prev.filter(id => id !== amenityId);
      } else {
        return [...prev, amenityId];
      }
    });
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = searchTerm === '' ||
      room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.metro?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCapacity = capacityMin === '' || (room.capacity || 0) >= parseInt(capacityMin);
    const matchesPrice = (room.price_per_hour || 0) <= priceMax;
    const matchesMetro = metroStation === '' || room.metro?.toLowerCase().includes(metroStation.toLowerCase());
    
    let matchesAmenities = true;
    if (selectedAmenities.length > 0) {
      const roomAmenityIds = room.amenities?.map(a => a.id) || [];
      matchesAmenities = selectedAmenities.every(id => roomAmenityIds.includes(id));
    }

    return matchesSearch && matchesCapacity && matchesPrice && matchesMetro && matchesAmenities;
  });

  if (isLoading || amenitiesLoading) {
    return (
      <>
        <Navbar />
        <div className="loader">
          <div className="spinner"></div>
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="error-message">
            <h3>Ошибка загрузки помещений</h3>
            <p>{error?.data?.error || error?.message || 'Попробуйте позже'}</p>
            <button onClick={() => refetch()} className="auth-btn" style={{ marginTop: '16px' }}>
              Повторить попытку
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="hero">
          <h1>Почасовая аренда пространств</h1>
          <p>Найдите идеальное место для вашей лекции, воркшопа или встречи в Санкт-Петербурге</p>
        </div>

        <div className="search-section">
          <div className="search-bar" style={{
            background: 'rgba(230, 245, 240, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span className="search-icon"></span>
            <input
              type="text"
              placeholder="Поиск по названию, адресу или метро..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                flex: 1,
                fontSize: '15px',
                color: '#1e293b'
              }}
            />
          </div>

          <div className="filters-row" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '24px',
            width: '100%'
          }}>
            <button 
              className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '10px 24px',
                background: showFilters ? 'rgba(30, 61, 124, 0.9)' : 'rgba(40, 80, 167, 0.9)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {showFilters ? '▲ Скрыть фильтры' : '▼ Расширенные фильтры'}
            </button>
            
            <div className="spaces-count" style={{ 
              fontSize: '14px', 
              color: '#ffffff',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              Найдено пространств: {filteredRooms.length}
            </div>
          </div>

          {showFilters && (
           <div className="filters-panel" style={{
            background: 'rgba(225, 245, 240, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
              <div className="filter-group">
                <label>Минимальная вместимость (чел.)</label>
                <input
                  type="number"
                  className="filter-input"
                  placeholder="Например, 10"
                  value={capacityMin}
                  onChange={(e) => setCapacityMin(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div className="filter-group">
                <label>Макс. цена: {priceValue} ₽/час</label>
                <input
                  type="range"
                  className="price-slider"
                  min="0"
                  max="10000"
                  step="50"
                  value={priceValue}
                  onChange={(e) => {
                    setPriceValue(Number(e.target.value));
                    setPriceMax(Number(e.target.value));
                  }}
                />
                <div className="price-labels">
                  <span>0 ₽</span>
                  <span>2500 ₽</span>
                  <span>5000 ₽</span>
                  <span>7500 ₽</span>
                  <span>10000 ₽</span>
                </div>
              </div>

              <div className="filter-group">
                <MetroAutocomplete
                  value={metroStation}
                  onChange={(value) => setMetroStation(value || '')}
                  placeholder="Начните вводить название станции..."
                  label="🚇 Станция метро"
                />
              </div>

              <div className="filter-group" style={{ gridColumn: '1 / -1' }}>
                <label>Удобства</label>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px',
                  marginTop: '4px'
                }}>
                  {amenities.map((amenity) => {
                    const isSelected = selectedAmenities.includes(amenity.id);
                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => handleAmenityToggle(amenity.id)}
                        style={{
                          padding: '6px 16px',
                          borderRadius: '20px',
                          border: isSelected ? '2px solid #2850a7' : '1px solid rgba(255, 255, 255, 0.4)',
                          background: isSelected ? 'rgba(238, 242, 255, 0.9)' : 'rgba(255, 255, 255, 0.75)',
                          color: isSelected ? '#2850a7' : '#475569',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: isSelected ? '600' : '400',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          backdropFilter: 'blur(8px)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#2850a7';
                            e.currentTarget.style.background = 'rgba(248, 250, 252, 0.9)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.75)';
                          }
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>
                          {amenity.icon || '✓'}
                        </span>
                        {amenity.name}
                      </button>
                    );
                  })}
                </div>
                {selectedAmenities.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedAmenities([])}
                    style={{
                      marginTop: '8px',
                      padding: '4px 12px',
                      background: 'rgba(241, 245, 249, 0.8)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    Сбросить удобства
                  </button>
                )}
              </div>

              <div className="filter-group" style={{ justifyContent: 'flex-end' }}>
                <button 
                  className="reset-filters-btn" 
                  onClick={resetFilters}
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    color: '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Сбросить все фильтры
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid">
          {filteredRooms.map((room) => {
            const imageUrl = getRoomImage(room);
            const mainAmenities = room.amenities?.slice(0, 4) || [];
            const hasMoreAmenities = (room.amenities?.length || 0) > 4;

            return (
              <div key={room.id} className="room-card" style={{
                background: 'rgba(235, 248, 245, 0.75)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease'
              }}>
                <div className="room-image-wrapper" style={{
                  width: '100%',
                  height: '200px',
                  overflow: 'hidden',
                  background: 'rgba(241, 245, 249, 0.5)',
                  position: 'relative'
                }}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={room.name}
                      className="room-image"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      fontSize: '48px',
                      color: '#cbd5e1'
                    }}>
                      📷
                    </div>
                  )}
                </div>
                
                <div className="room-content" style={{ padding: '20px' }}>
                  <h3 className="room-title">{room.name}</h3>
                  
                  <div className="room-location" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '4px', 
                    marginBottom: '12px', 
                    alignItems: 'flex-start' 
                  }}>
                    {room.metro && (
                      <span style={{ 
                        fontWeight: '600', 
                        fontSize: '14px', 
                        color: '#2850a7' 
                      }}>
                        ст. м. {room.metro}
                      </span>
                    )}
                    <span style={{ fontSize: '13px', color: '#718096' }}>
                      {room.address || 'Адрес не указан'}
                    </span>
                  </div>
                  
                  <p className="room-description">
                    {room.description?.substring(0, 100) || 'Нет описания'}
                    {room.description?.length > 100 && '...'}
                  </p>
                  
                  <div className="room-info" style={{ 
                    borderTop: '1px dashed rgba(255, 255, 255, 0.4)', 
                    paddingTop: '12px', 
                    marginBottom: '12px' 
                  }}>
                    <div className="capacity">
                      <span>Вместимость:</span>
                      <strong>{room.capacity || 0} чел.</strong>
                    </div>
                  </div>
                  
                  <div className="amenities" style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '6px', 
                    marginBottom: '16px',
                    minHeight: '32px',
                    alignItems: 'center'
                  }}>
                    {mainAmenities.map((item, idx) => {
                      const amenityName = typeof item === 'string' ? item : item?.name || '';
                      return (
                        <span key={idx} className="amenity" style={{ 
                          padding: '4px 10px', 
                          fontSize: '11px', 
                          fontWeight: '500', 
                          color: '#4a5568', 
                          background: 'rgba(241, 243, 245, 0.8)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '6px',
                          whiteSpace: 'nowrap',
                          display: 'inline-block'
                        }}>
                          {amenityName}
                        </span>
                      );
                    })}
                    {hasMoreAmenities && (
                      <span className="amenity" style={{ 
                        padding: '4px 10px', 
                        fontSize: '11px', 
                        fontWeight: '500', 
                        color: '#4a5568', 
                        background: 'rgba(226, 232, 240, 0.8)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '6px',
                        whiteSpace: 'nowrap',
                        display: 'inline-block'
                      }}>
                        +{room.amenities.length - 4}
                      </span>
                    )}
                  </div>
                  
                  <div className="room-footer" style={{ 
                    marginTop: 'auto', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '14px', 
                    borderTop: '1px solid rgba(255, 255, 255, 0.3)', 
                    paddingTop: '14px' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Стоимость:</span>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#2850a7', letterSpacing: '-0.5px' }}>
                        {room.price_per_hour || 0} <span style={{ fontSize: '15px', fontWeight: '600', color: '#64748b' }}>₽ / час</span>
                      </div>
                    </div>

                    <div className="book-btn-wrapper">
                      <Link to={`/catalog/${room.id}`} style={{ textDecoration: 'none' }}>
                        <button 
                          className="book-btn" 
                          style={{ 
                            width: '100%', 
                            padding: '14px', 
                            fontSize: '15px', 
                            fontWeight: '700', 
                            letterSpacing: '0.3px',
                            background: 'linear-gradient(135deg, #2850a7 0%, #1e3d7c 100%)',
                            boxShadow: '0 4px 10px rgba(40, 80, 167, 0.2)',
                            borderRadius: '10px',
                            transition: 'all 0.2s ease',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          Подробнее о пространстве →
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredRooms.length === 0 && (
          <div className="no-results" style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            color: '#475569',
            fontSize: '16px'
          }}>
            Ничего не найдено. Попробуйте изменить параметры поиска.
          </div>
        )}
      </div>
    </>
  );
}