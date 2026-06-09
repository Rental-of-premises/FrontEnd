// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';

// Создаем хранилище Redux
export const store = configureStore({
  reducer: {
    // Добавляем reducer от API
    [api.reducerPath]: api.reducer,
  },
  // Добавляем middleware от API (для кеширования и обновления данных)
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});