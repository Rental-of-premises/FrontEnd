// src/store/api.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Создаем API сервис
export const api = createApi({
  // Уникальное имя для Redux
  reducerPath: 'api',
  
  // Базовый URL для всех запросов
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:8080',
    // Автоматически добавляем токен к каждому запросу
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),

  
  // Определяем все эндпоинты (ручки API)
  endpoints: (builder) => ({
    // === QUERY (получение данных) ===
    
    // Получить каталог комнат (доступно без авторизации)
    getCatalog: builder.query({
      query: () => '/catalog',
    }),
    
    // Получить конкретную комнату по ID
    getRoomById: builder.query({
      query: (roomId) => `/catalog/${roomId}`,
    }),
    
    // Получить мои бронирования (требует авторизации)
    getMyOrders: builder.query({
      query: () => '/account/my-orders',
    }),
    
    // Получить мои помещения (требует авторизации)
    getMySpaces: builder.query({
      query: () => '/account/my-spaces',
    }),
    
    // === MUTATION (изменение данных) ===
    
    // Вход в аккаунт
    signIn: builder.mutation({
      query: (credentials) => ({
        url: '/auth/sign-in',
        method: 'POST',
        body: credentials,
      }),
    }),
    
    // Регистрация
    signUp: builder.mutation({
      query: (userData) => ({
        url: '/auth/sign-up',
        method: 'POST',
        body: userData,
      }),
    }),
    
    // Создать бронирование
    createBooking: builder.mutation({
      query: (bookingData) => ({
        url: '/account/new-order',
        method: 'POST',
        body: bookingData,
      }),
    }),
    
    // Добавить новое помещение
    addSpace: builder.mutation({
      query: (spaceData) => ({
        url: '/account/new-space',
        method: 'POST',
        body: spaceData,
      }),
    }),
    
    // Удалить помещение
    deleteSpace: builder.mutation({
      query: (spaceId) => ({
        url: `/account/my-spaces/${spaceId}/delete`,
        method: 'DELETE',
      }),
    }),
    
    // Отменить бронирование
    cancelBooking: builder.mutation({
      query: (bookingId) => ({
        url: `/account/my-orders/${bookingId}/delete`,
        method: 'DELETE',
      }),
    }),
  }),
});

// Автоматически сгенерированные хуки для использования в компонентах
export const {
  useGetCatalogQuery,
  useGetRoomByIdQuery,
  useGetMyOrdersQuery,
  useGetMySpacesQuery,
  useSignInMutation,
  useSignUpMutation,
  useCreateBookingMutation,
  useAddSpaceMutation,
  useDeleteSpaceMutation,
  useCancelBookingMutation,
} = api;