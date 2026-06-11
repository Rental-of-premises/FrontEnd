import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetCatalogQuery } from '../store/api';
import Navbar from '../components/Navbar';

export default function Catalog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Types');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [capacityMin, setCapacityMin] = useState('');
  const [priceMax, setPriceMax] = useState(100);
  const [priceValue, setPriceValue] = useState(100);

  const { data: rooms = [], isLoading, isError, error } = useGetCatalogQuery();

  const resetFilters = () => {
    setSearchTerm('');
    setActiveFilter('All Types');
    setCapacityMin('');
    setPriceMax(100);
    setPriceValue(100);
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = searchTerm === '' ||
      room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = activeFilter === 'All Types';
    const matchesCapacity = capacityMin === '' || (room.capacity || 0) >= parseInt(capacityMin);
    const matchesPrice = (room.price_per_hour || 0) <= priceMax;
    
    return matchesSearch && matchesType && matchesCapacity && matchesPrice;
  });

  const filters = ['All Types', 'Coworking', 'Conference', 'Private', 'Studio', 'Meeting', 'Event'];

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
            Ошибка загрузки комнат: {error?.message || 'Попробуйте позже'}
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
          <h1>Find Your Perfect Workspace</h1>
          <p>Browse and book office spaces, meeting rooms, and coworking areas</p>
        </div>

        <div className="search-section">
          <div className="search-bar">
            <span className="search-icon"></span>
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filters-row">
            <div className="filters">
              {filters.map(filter => (
                <button
                  key={filter}
                  className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            
            <button 
              className={`more-filters-btn ${showMoreFilters ? 'active' : ''}`}
              onClick={() => setShowMoreFilters(!showMoreFilters)}
            >
              {showMoreFilters ? 'Less Filters' : 'More Filters'}
            </button>
          </div>

          {showMoreFilters && (
            <div className="more-filters-panel">
              <div className="filter-group">
                <label>Minimum Capacity (people)</label>
                <input
                  type="number"
                  className="capacity-input"
                  placeholder="Any"
                  value={capacityMin}
                  onChange={(e) => setCapacityMin(e.target.value)}
                  min="1"
                />
              </div>

              <div className="filter-group">
                <label>Max Price per Hour: ${priceValue}</label>
                <input
                  type="range"
                  className="price-slider"
                  min="0"
                  max="100"
                  value={priceMax}
                  onChange={(e) => {
                    setPriceMax(parseInt(e.target.value));
                    setPriceValue(parseInt(e.target.value));
                  }}
                />
                <div className="price-labels">
                  <span>$0</span>
                  <span>$25</span>
                  <span>$50</span>
                  <span>$75</span>
                  <span>$100+</span>
                </div>
              </div>

              <button className="reset-filters-btn" onClick={resetFilters}>
                Reset All Filters
              </button>
            </div>
          )}

          <div className="spaces-count">
            {filteredRooms.length} spaces available
          </div>
        </div>

        <div className="grid">
          {filteredRooms.map(room => (
            <div key={room.id} className="room-card">
              <img 
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=600" 
                alt={room.name} 
                className="room-image" 
              />
              
              <div className="room-content">
                <h3 className="room-title">{room.name}</h3>
                <p className="room-type">Помещение</p>
                <p className="room-description">
                  {room.description?.substring(0, 100) || "Нет описания"}...
                </p>
                
                <div className="room-info">
                  <span className="capacity">{room.capacity || 0} people</span>
                  <span className="price">${room.price_per_hour || 0}<small>/hr</small></span>
                </div>
                
                <div className="amenities">
                  <span className="amenity">WiFi</span>
                  <span className="amenity">Coffee</span>
                </div>
                
                <div className="posted-by">
                  Posted by Владелец #{room.seller_id} on {room.created_at ? new Date(room.created_at).toLocaleDateString() : 'Unknown'}
                </div>
                <div className="book-btn-wrapper">
                   <Link to={`/catalog/${room.id}`}>
                    <button className="book-btn">
                      Подробнее
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredRooms.length === 0 && (
          <div className="no-results">
            Nothing found. Try changing filters or search.
          </div>
        )}
      </div>
    </>
  );
}