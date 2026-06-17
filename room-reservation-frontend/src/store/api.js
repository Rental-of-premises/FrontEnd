// src/store/api.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// ===== УНИВЕРСАЛЬНАЯ НАСТРОЙКА BASE_URL =====
// Работает и локально, и на сервере
const getBaseUrl = () => {
  // Если мы на деплое (не localhost)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '';  // ← относительный путь, запросы на тот же домен
  }
  // Локальная разработка
  return 'http://localhost:8080';
};

const BASE_URL = getBaseUrl();

console.log('🌍 Окружение:', window.location.hostname);
console.log('🔗 BASE_URL:', BASE_URL || '(относительный)');

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: BASE_URL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Apartments', 'Bookings', 'User', 'Reviews'],
  endpoints: (builder) => ({
    // ========== ПОЛЬЗОВАТЕЛИ (публичные — БЕЗ /api) ==========
    getUserById: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: ['User']
    }),
    
    signUp: builder.mutation({
      query: (userData) => ({
        url: '/auth/sign-up',
        method: 'POST',
        body: {
          email: userData.email,
          password: userData.password,
          name: userData.name
        },
      }),
    }),
    
    signIn: builder.mutation({
      query: (credentials) => ({
        url: '/auth/sign-in',
        method: 'POST',
        body: {
          email: credentials.email,
          password: credentials.password
        },
      }),
    }),
    
    // ========== ПОЛЬЗОВАТЕЛИ (защищённые — С /api) ==========
    logout: builder.mutation({
      query: () => ({
        url: '/api/auth/logout',
        method: 'POST',
      }),
    }),
    
    deleteAccount: builder.mutation({
      query: () => ({
        url: '/api/auth/delete',
        method: 'DELETE',
      }),
    }),
    
    // ========== ПОМЕЩЕНИЯ (публичные — БЕЗ /api) ==========
    getCatalog: builder.query({
      query: (filters = {}) => ({
        url: '/apartments',
        method: 'POST',
        body: {
          is_active: true,
          limit: 100,
          offset: 0,
          ...(filters.min_price !== undefined && { min_price: filters.min_price }),
          ...(filters.max_price !== undefined && { max_price: filters.max_price }),
          ...(filters.seller_id !== undefined && { seller_id: filters.seller_id }),
          ...(filters.is_active !== undefined && { is_active: filters.is_active }),
          ...(filters.limit !== undefined && { limit: filters.limit }),
          ...(filters.offset !== undefined && { offset: filters.offset })
        },
      }),
      providesTags: ['Apartments']
    }),
    
    getApartmentById: builder.query({
      query: (id) => `/apartments/${id}`,
      providesTags: (result, error, id) => [{ type: 'Apartments', id }]
    }),
    
    // ========== ПОМЕЩЕНИЯ (защищённые — С /api) ==========
    getMyApartments: builder.query({
      query: () => '/api/account/my-apartments',
      providesTags: ['Apartments']
    }),
    
    addApartment: builder.mutation({
      query: (apartmentData) => ({
        url: '/api/account/new-apartment',
        method: 'POST',
        body: {
          name: apartmentData.title,
          description: apartmentData.description,
          capacity: apartmentData.capacity,
          price_per_hour: apartmentData.price_per_hour,
          image_url: apartmentData.image_url,
          metro: apartmentData.metro,
          address: apartmentData.address,
          amenities: apartmentData.amenities,
          is_active: true
        },
      }),
      invalidatesTags: ['Apartments']
    }),
    
    updateApartment: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/api/account/apartments/${id}/edit`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Apartments']
    }),
    
    deleteApartment: builder.mutation({
      query: (id) => ({
        url: `/api/account/apartments/${id}/delete`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Apartments']
    }),
    
    // ========== БРОНИРОВАНИЯ ==========
    getBookingById: builder.query({
      query: (id) => `/bookings/${id}`,
      providesTags: (result, error, id) => [{ type: 'Bookings', id }]
    }),
    
    getMyBookings: builder.query({
      query: () => '/api/account/my-bookings?statusFilter=all',
      providesTags: ['Bookings']
    }),
    
    createBooking: builder.mutation({
      query: (bookingData) => ({
        url: '/api/account/new-booking',
        method: 'POST',
        body: {
          apartment_id: bookingData.apartment_id,
          time_from: bookingData.time_from,
          time_to: bookingData.time_to
        },
      }),
      invalidatesTags: ['Bookings', 'Apartments']
    }),
    
    cancelBooking: builder.mutation({
      query: (id) => ({
        url: `/api/account/my-bookings/${id}/cancel`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Bookings']
    }),
    
    confirmBooking: builder.mutation({
      query: (id) => ({
        url: `/api/account/bookings/${id}/confirm`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Bookings']
    }),
    
    rejectBooking: builder.mutation({
      query: (id) => ({
        url: `/api/account/bookings/${id}/reject`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Bookings']
    }),
    
    getSellerBookings: builder.query({
      query: () => '/api/account/bookings?statusFilter=all',
      providesTags: ['Bookings']
    }),
    
    // ========== ОТЗЫВЫ ==========
    getReviewsByApartment: builder.query({
      query: (apartmentId) => `/reviews/apartment/${apartmentId}`,
      providesTags: ['Reviews']
    }),
    
    getReviewById: builder.query({
      query: (reviewId) => `/reviews/${reviewId}`,
      providesTags: (result, error, id) => [{ type: 'Reviews', id }]
    }),
    
    createReview: builder.mutation({
      query: (data) => ({
        url: '/api/account/reviews',
        method: 'POST',
        body: {
          apartment_id: data.apartment_id,
          comment: data.comment,
          stars: data.stars
        },
      }),
      invalidatesTags: ['Reviews']
    }),
    
    deleteReview: builder.mutation({
      query: (id) => ({
        url: `/api/account/reviews/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Reviews']
    }),
  }),
});

export const {
  // Users
  useGetUserByIdQuery,
  useSignUpMutation,
  useSignInMutation,
  useLogoutMutation,
  useDeleteAccountMutation,
  // Apartments
  useGetCatalogQuery,
  useGetApartmentByIdQuery,
  useGetMyApartmentsQuery,
  useAddApartmentMutation,
  useUpdateApartmentMutation,
  useDeleteApartmentMutation,
  // Bookings
  useGetBookingByIdQuery,
  useGetMyBookingsQuery,
  useCreateBookingMutation,
  useCancelBookingMutation,
  useConfirmBookingMutation,
  useRejectBookingMutation,
  useGetSellerBookingsQuery,
  // Reviews
  useGetReviewsByApartmentQuery,
  useGetReviewByIdQuery,
  useCreateReviewMutation,
  useDeleteReviewMutation,
} = api;