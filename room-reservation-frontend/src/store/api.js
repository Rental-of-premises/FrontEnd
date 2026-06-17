// src/store/api.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = 'http://localhost:8080';

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
    // ========== ПОЛЬЗОВАТЕЛИ ==========
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
    
    logout: builder.mutation({
      query: () => ({
        url: '/api/auth/logout',  // ← ДОБАВЛЕН /api
        method: 'POST',
      }),
    }),
    
    deleteAccount: builder.mutation({
      query: () => ({
        url: '/api/auth/delete',  // ← ДОБАВЛЕН /api
        method: 'DELETE',
      }),
    }),
    
    // ========== ПОМЕЩЕНИЯ ==========
    getCatalog: builder.query({
      query: (filters = {}) => ({
        url: '/api/apartments',
        method: 'POST',
        body: {
          is_active: true,
          limit: 100,
          offset: 0,
          ...filters
        },
      }),
      providesTags: ['Apartments']
    }),
    
    getApartmentById: builder.query({
      query: (id) => `/api/apartments/${id}`,
      providesTags: (result, error, id) => [{ type: 'Apartments', id }]
    }),
    
    getMyApartments: builder.query({
      query: () => '/api/account/my-apartments',  // ← ДОБАВЛЕН /api
      providesTags: ['Apartments']
    }),
    
    addApartment: builder.mutation({
      query: (apartmentData) => ({
        url: '/api/account/new-apartment',  // ← ДОБАВЛЕН /api
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
        url: `/api/account/apartments/${id}/edit`,  // ← ДОБАВЛЕН /api
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Apartments']
    }),
    
    deleteApartment: builder.mutation({
      query: (id) => ({
        url: `/api/account/apartments/${id}/delete`,  // ← ДОБАВЛЕН /api
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
      query: () => '/api/account/my-bookings',  // ← ДОБАВЛЕН /api
      providesTags: ['Bookings']
    }),
    
    createBooking: builder.mutation({
      query: (bookingData) => ({
        url: '/api/account/new-booking',  // ← ДОБАВЛЕН /api
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
        url: `/api/account/my-bookings/${id}/cancel`,  // ← ДОБАВЛЕН /api
        method: 'PATCH',
      }),
      invalidatesTags: ['Bookings']
    }),
    
    confirmBooking: builder.mutation({
      query: (id) => ({
        url: `/api/account/bookings/${id}/confirm`,  // ← ДОБАВЛЕН /api
        method: 'PATCH',
      }),
      invalidatesTags: ['Bookings']
    }),
    
    rejectBooking: builder.mutation({
      query: (id) => ({
        url: `/api/account/bookings/${id}/reject`,  // ← ДОБАВЛЕН /api
        method: 'PATCH',
      }),
      invalidatesTags: ['Bookings']
    }),
    
    getSellerBookings: builder.query({
      query: () => '/api/account/bookings',  // ← ДОБАВЛЕН /api
      providesTags: ['Bookings']
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
} = api;