import { useGetAmenitiesQuery } from '../store/api';

export default function AmenitiesSelector({ selectedIds = [], onChange, label = 'Удобства' }) {
  const { data: amenities = [], isLoading, error } = useGetAmenitiesQuery();

  const handleToggle = (amenityId) => {
    if (selectedIds.includes(amenityId)) {
      onChange(selectedIds.filter(id => id !== amenityId));
    } else {
      onChange([...selectedIds, amenityId]);
    }
  };

  if (isLoading) {
    return <div style={{ color: '#94a3b8', fontSize: '14px' }}>Загрузка удобств...</div>;
  }

  if (error) {
    return <div style={{ color: '#ef4444', fontSize: '14px' }}>Ошибка загрузки удобств</div>;
  }

  if (amenities.length === 0) {
    return <div style={{ color: '#94a3b8', fontSize: '14px' }}>Нет доступных удобств</div>;
  }

  return (
    <div className="form-group">
      <label style={{ 
        display: 'block', 
        fontWeight: '600', 
        color: '#334155', 
        marginBottom: '10px', 
        fontSize: '14px' 
      }}>
        {label}
      </label>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '10px' 
      }}>
        {amenities.map((amenity) => {
          const isSelected = selectedIds.includes(amenity.id);
          return (
            <button
              key={amenity.id}
              type="button"
              onClick={() => handleToggle(amenity.id)}
              style={{
                padding: '8px 18px',
                borderRadius: '20px',
                border: isSelected ? '2px solid #2850a7' : '1px solid #e2e8f0',
                background: isSelected ? '#eef2ff' : '#ffffff',
                color: isSelected ? '#2850a7' : '#475569',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: isSelected ? '600' : '400',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#2850a7';
                  e.currentTarget.style.background = '#f8fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = '#ffffff';
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
    </div>
  );
}