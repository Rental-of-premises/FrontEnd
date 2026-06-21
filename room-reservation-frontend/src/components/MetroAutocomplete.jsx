import { useState, useRef, useEffect } from 'react';
import { sortedMetroStations } from '../data/metroStations';

export default function MetroAutocomplete({ 
  value, 
  onChange, 
  placeholder = 'Введите станцию метро...',
  required = false,
  className = '',
  label = '🚇 Метро'
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || '');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filterStations = (query) => {
    if (!query || query.trim() === '') {
      return [];
    }
    const lowerQuery = query.toLowerCase().trim();
    return sortedMetroStations
      .filter(station => station.toLowerCase().includes(lowerQuery))
      .slice(0, 20);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);
    
    const filtered = filterStations(newValue);
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    
    onChange(newValue || '');
  };

  const handleSelectStation = (station) => {
    setInputValue(station);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onChange(station);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    }
    else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectStation(suggestions[selectedIndex]);
    }
    else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const highlightMatch = (text, query) => {
    if (!query || !query.trim()) return text;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase().trim();
    const index = lowerText.indexOf(lowerQuery);
    if (index === -1) return text;
    
    return (
      <>
        {text.slice(0, index)}
        <strong style={{ color: '#2850a7' }}>{text.slice(index, index + lowerQuery.length)}</strong>
        {text.slice(index + lowerQuery.length)}
      </>
    );
  };

  return (
    <div className="form-group" style={{ position: 'relative' }} ref={wrapperRef}>
      <label style={{ 
        display: 'block', 
        fontWeight: '600', 
        color: '#334155', 
        marginBottom: '8px', 
        fontSize: '14px' 
      }}>
        {label}
      </label>
      
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (inputValue && inputValue.trim()) {
            const filtered = filterStations(inputValue);
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
          }
        }}
        placeholder={placeholder}
        required={required}
        className={className}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid #cbd5e1',
          fontSize: '15px',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'all 0.2s',
          background: '#ffffff'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#2850a7';
          e.target.style.boxShadow = '0 0 0 4px rgba(40, 80, 167, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#cbd5e1';
          e.target.style.boxShadow = 'none';
        }}
        autoComplete="off"
      />

      {/* Список подсказок */}
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 1000,
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '12px',
          marginTop: '4px',
          maxHeight: '200px',
          overflowY: 'auto',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          padding: '4px 0'
        }}>
          {suggestions.map((station, index) => (
            <div
              key={station}
              onClick={() => handleSelectStation(station)}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                backgroundColor: selectedIndex === index ? '#eef2ff' : 'transparent',
                transition: 'background 0.15s',
                fontSize: '14px',
                color: '#1e293b'
              }}
            >
              {highlightMatch(station, inputValue)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}