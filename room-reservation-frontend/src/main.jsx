// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';  // ← добавляем этот импорт
import { store } from './store';         // ← добавляем этот импорт
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>      {/* ← оборачиваем App в Provider */}
      <App />
    </Provider>
  </StrictMode>,
);