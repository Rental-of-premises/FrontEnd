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

  // Строим карту: apartment_id → главное изображение
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
      <div className="catalog-page">
        {/* ===== HERO ===== */}
        <div className="catalog-hero">
          <h1>Почасовая аренда пространств</h1>
          <p>Найдите идеальное место для встречи, воркшопа или мероприятия в Санкт-Петербурге</p>
        </div>

        {/* ===== ПОИСК ===== */}
        <div className="catalog-search">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Поиск по названию, адресу или метро..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? '▲ Скрыть фильтры' : '▼ Фильтры'}
          </button>
        </div>

        {/* ===== ФИЛЬТРЫ ===== */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>Вместимость (чел.)</label>
              <input
                type="number"
                placeholder="от"
                value={capacityMin}
                onChange={(e) => setCapacityMin(e.target.value)}
                min="1"
              />
            </div>

            <div className="filter-group">
              <label>Макс. цена: {priceValue} ₽/час</label>
              <input
                type="range"
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
                <span>10000 ₽</span>
              </div>
            </div>

            <div className="filter-group">
              <MetroAutocomplete
                value={metroStation}
                onChange={(value) => setMetroStation(value || '')}
                placeholder="Станция метро..."
                label=""
              />
            </div>

            <div className="filter-group filter-amenities">
              <label>Удобства</label>
              <div className="amenities-tags">
                {amenities.map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity.id);
                  return (
                    <button
                      key={amenity.id}
                      type="button"
                      className={`amenity-tag ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleAmenityToggle(amenity.id)}
                    >
                      {amenity.icon && <span className="amenity-icon">{amenity.icon}</span>}
                      {amenity.name}
                    </button>
                  );
                })}
              </div>
              {selectedAmenities.length > 0 && (
                <button className="clear-amenities" onClick={() => setSelectedAmenities([])}>
                  ✕ Сбросить все
                </button>
              )}
            </div>

            <button className="reset-filters" onClick={resetFilters}>
              Сбросить все фильтры
            </button>
          </div>
        )}

        {/* ===== РЕЗУЛЬТАТЫ ===== */}
        <div className="catalog-results">
          <div className="results-header">
            <span className="results-count">Найдено: {filteredRooms.length}</span>
          </div>

          {filteredRooms.length === 0 ? (
            <div className="no-results">
              <span className="no-results-icon">🔍</span>
              <h3>Ничего не найдено</h3>
              <p>Попробуйте изменить параметры поиска</p>
            </div>
          ) : (
            <div className="catalog-grid">
              {filteredRooms.map((room) => {
                const imageUrl = getRoomImage(room);
                const mainAmenities = room.amenities?.slice(0, 4) || [];
                const hasMoreAmenities = (room.amenities?.length || 0) > 4;

                return (
                  <Link to={`/catalog/${room.id}`} key={room.id} className="room-card">
                    <div className="room-card-image">
                      {imageUrl ? (
                        <img src={imageUrl} alt={room.name} loading="lazy" />
                      ) : (
                        <div className="room-card-no-image">📷</div>
                      )}
                      <div className="room-card-price">
                        {room.price_per_hour} ₽<span>/час</span>
                      </div>
                    </div>

                    <div className="room-card-body">
                      <h3 className="room-card-title">{room.name}</h3>
                      
                      <div className="room-card-location">
                        <span className="metro-dot">●</span>
                        <span>ст. м. {room.metro || 'Не указано'}</span>
                      </div>

                      <div className="room-card-description">
                        {room.description?.substring(0, 80) || 'Описание отсутствует'}
                        {room.description?.length > 80 && '...'}
                      </div>

                      <div className="room-card-amenities">
                        {mainAmenities.map((item, idx) => {
                          const name = typeof item === 'string' ? item : item?.name || '';
                          return (
                            <span key={idx} className="amenity-badge">
                              {name}
                            </span>
                          );
                        })}
                        {hasMoreAmenities && (
                          <span className="amenity-badge more">
                            +{room.amenities.length - 4}
                          </span>
                        )}
                      </div>

                      <div className="room-card-footer">
                        <span className="room-capacity">👥 {room.capacity || 0} чел.</span>
                        <span className="room-cta">Подробнее →</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}