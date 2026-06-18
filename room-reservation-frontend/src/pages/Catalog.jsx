// src/pages/Catalog.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGetCatalogQuery } from '../store/api';
import Navbar from '../components/Navbar';

export default function Catalog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [capacityMin, setCapacityMin] = useState('');
  const [priceMax, setPriceMax] = useState(10000);
  const [priceValue, setPriceValue] = useState(10000);
  const [metroStation, setMetroStation] = useState('');
  
  const [filters, setFilters] = useState({
    is_active: true,
    limit: 100,
    offset: 0
  });
  
  const { data: rooms = [], isLoading, isError, error, refetch } = useGetCatalogQuery(filters);

  useEffect(() => {
    const newFilters = {
      is_active: true,
      limit: 100,
      offset: 0
    };
    
    if (priceMax < 10000) {
      newFilters.max_price = priceMax;
    }
    
    setFilters(newFilters);
  }, [priceMax, capacityMin]);

  const resetFilters = () => {
    setSearchTerm('');
    setCapacityMin('');
    setPriceMax(10000);
    setPriceValue(10000);
    setMetroStation('');
    setFilters({ is_active: true, limit: 100, offset: 0 });
    refetch();
  };

  // ===== ИСПРАВЛЕННАЯ ФИЛЬТРАЦИЯ =====
  const safeRooms = Array.isArray(rooms) ? rooms : [];

  const filteredRooms = safeRooms.filter(room => {
    const matchesSearch = searchTerm === '' ||
      room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.metro?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCapacity = capacityMin === '' || (room.capacity || 0) >= parseInt(capacityMin);
    const matchesPrice = (room.price_per_hour || 0) <= priceMax;
    const matchesMetro = metroStation === '' || room.metro?.toLowerCase().includes(metroStation.toLowerCase());

    return matchesSearch && matchesCapacity && matchesPrice && matchesMetro;
  });

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
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Поиск по названию, адресу или метро..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                background: showFilters ? '#1e3d7c' : '#2850a7',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
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
              color: '#64748b',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}>
              Найдено пространств: {filteredRooms.length}
            </div>
          </div>

          {showFilters && (
            <div className="filters-panel">
              <div className="filter-group">
                <label>Минимальная вместимость (чел.)</label>
                <input
                  type="number"
                  className="filter-input"
                  placeholder="Например, 10"
                  value={capacityMin}
                  onChange={(e) => setCapacityMin(e.target.value)}
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
                <label>Станция метро</label>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Например, Технологический институт"
                  value={metroStation}
                  onChange={(e) => setMetroStation(e.target.value)}
                />
              </div>

              <div className="filter-group" style={{ justifyContent: 'flex-end' }}>
                <button className="reset-filters-btn" onClick={resetFilters}>
                  Сбросить фильтры
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid">
          {filteredRooms.map((room) => (
            <div key={room.id} className="room-card">
              <div className="room-image-wrapper">
                <img
                  src={room.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80'}
                  alt={room.name}
                  className="room-image"
                />
              </div>
              
              <div className="room-content">
                <h3 className="room-title">{room.name}</h3>
                
                <div className="room-location" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', alignItems: 'flex-start' }}>
                  {room.metro && (
                    <span className="metro-badge" style={{ background: '#eef2ff', color: '#2850a7', fontWeight: '600', padding: '4px 10px', borderRadius: '12px', fontSize: '13px' }}>
                      ст. м. {room.metro}
                    </span>
                  )}
                  <span style={{ fontSize: '13px', color: '#718096', paddingLeft: '4px' }}>
                    {room.address || 'Адрес не указан'}
                  </span>
                </div>
                
                <p className="room-description">{room.description?.substring(0, 100) || 'Нет описания'}...</p>
                
                <div className="room-info" style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px', marginBottom: '12px' }}>
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
                  {room.amenities?.map((item, idx) => (
                    <span key={idx} className="amenity" style={{ 
                      padding: '4px 10px', 
                      fontSize: '11px', 
                      fontWeight: '500', 
                      color: '#4a5568', 
                      background: '#f1f3f5', 
                      borderRadius: '6px',
                      whiteSpace: 'nowrap',
                      display: 'inline-block'
                    }}>
                      {item}
                    </span>
                  ))}
                  {(!room.amenities || room.amenities.length === 0) && (
                    <>
                      <span className="amenity" style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '500', color: '#4a5568', background: '#f1f3f5', borderRadius: '6px', whiteSpace: 'nowrap', display: 'inline-block' }}>WiFi</span>
                      <span className="amenity" style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '500', color: '#4a5568', background: '#f1f3f5', borderRadius: '6px', whiteSpace: 'nowrap', display: 'inline-block' }}>Кондиционер</span>
                    </>
                  )}
                </div>
                
                <div className="room-footer" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                  
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
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Подробнее о пространстве →
                      </button>
                    </Link>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredRooms.length === 0 && (
          <div className="no-results">
            Ничего не найдено. Попробуйте изменить параметры поиска.
          </div>
        )}
      </div>
    </>
  );
}