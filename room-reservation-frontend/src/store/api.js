// src/store/api.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = 'http://localhost:3000';

// Моковые данные для нереализованных эндпоинтов
const MOCK_ROOMS = [
  {
    id: 1,
    name: "Modern Coworking Space",
    description: "Open collaborative workspace with high-speed internet, comfortable seating, and natural lighting.",
    capacity: 20,
    price_per_hour: 15,
    seller_id: 1,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: "Executive Conference Room",
    description: "Professional conference room with video conferencing technology.",
    capacity: 12,
    price_per_hour: 50,
    seller_id: 1,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    name: "Private Office",
    description: "Quiet private office space ideal for focused work.",
    capacity: 2,
    price_per_hour: 25,
    seller_id: 2,
    is_active: true,
    created_at: new Date().toISOString()
  }
];

const MOCK_BOOKINGS = [
  {
    id: 1,
    user_id: 1,
    apartment_id: 1,
    status: "confirmed",
    time_from: new Date(Date.now() + 86400000).toISOString(),
    time_to: new Date(Date.now() + 172800000).toISOString(),
    created_at: new Date().toISOString()
  }
];

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Apartments', 'Bookings', 'User'],
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
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    
    // ========== ПОМЕЩЕНИЯ ==========
    getCatalog: builder.query({
      async queryFn() {
        console.log('Используем моковые данные для каталога');
        return { data: MOCK_ROOMS };
      },
      providesTags: ['Apartments']
    }),
        
    getApartmentById: builder.query({
      query: (id) => `/apartments/${id}`,
      transformResponse: (response, meta, id) => {
        if (response && response.id) return response;
        return MOCK_ROOMS.find(a => a.id === parseInt(id)) || null;
      },
      providesTags: (result, error, id) => [{ type: 'Apartments', id }]
    }),
    
    getMyApartments: builder.query({
      query: (sellerId) => ({
        url: '/apartments',
        method: 'POST',
        body: {
          seller_id: sellerId,
          limit: 100,
          offset: 0
        }
      }),
      transformResponse: (response, meta, sellerId) => {
        if (Array.isArray(response) && response.length > 0) {
          return response;
        }
        return MOCK_ROOMS.filter(a => a.seller_id === sellerId);
      },
      providesTags: ['Apartments']
    }),
    
    addApartment: builder.mutation({
      query: (apartmentData) => ({
        url: '/apartments',
        method: 'POST',
        body: apartmentData
      }),
      async queryFn(apartmentData) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const newApartment = {
          id: Date.now(),
          ...apartmentData,
          created_at: new Date().toISOString(),
          is_active: true
        };
        return { data: newApartment };
      },
      invalidatesTags: ['Apartments']
    }),
    
    deleteApartment: builder.mutation({
      query: (id) => ({
        url: `/apartments/${id}`,
        method: 'DELETE'
      }),
      async queryFn(id) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { data: { success: true } };
      },
      invalidatesTags: ['Apartments']
    }),
    
    // ========== БРОНИРОВАНИЯ ==========
    getBookingById: builder.query({
      query: (id) => `/booking/${id}`,
      transformResponse: (response) => {
        if (response && response.id) return response;
        return MOCK_BOOKINGS.find(b => b.id === parseInt(id)) || null;
      },
      providesTags: (result, error, id) => [{ type: 'Bookings', id }]
    }),
    
    getAllBookings: builder.query({
      query: (filters = {}) => ({
        url: '/bookings',
        method: 'POST',
        body: {
          status: filters.status,
          seller_id: filters.sellerId,
          min_price: filters.minPrice,
          max_price: filters.maxPrice,
          limit: filters.limit || 100,
          offset: filters.offset || 0
        }
      }),
      transformResponse: (response) => {
        if (Array.isArray(response) && response.length > 0) {
          return response;
        }
        return MOCK_BOOKINGS;
      },
      providesTags: ['Bookings']
    }),
    
    getMyBookings: builder.query({
      query: () => ({
        url: '/bookings',
        method: 'POST',
        body: {
          limit: 100,
          offset: 0
        }
      }),
      transformResponse: (response, meta, userId) => {
        if (Array.isArray(response) && response.length > 0) {
          return response;
        }
        return MOCK_BOOKINGS;
      },
      providesTags: ['Bookings']
    }),
    
    createBooking: builder.mutation({
      query: (bookingData) => ({
        url: '/bookings',
        method: 'POST',
        body: bookingData
      }),
      async queryFn(bookingData) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const newBooking = {
          id: Date.now(),
          ...bookingData,
          status: 'confirmed',
          created_at: new Date().toISOString()
        };
        return { data: newBooking };
      },
      invalidatesTags: ['Bookings', 'Apartments']
    }),
    
    cancelBooking: builder.mutation({
      query: (id) => ({
        url: `/booking/${id}`,
        method: 'DELETE'
      }),
      async queryFn(id) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { data: { success: true } };
      },
      invalidatesTags: ['Bookings']
    }),
  }),
});

export const {
  // Users
  useGetUserByIdQuery,
  useSignUpMutation,
  useSignInMutation,
  useLogoutMutation,
  // Apartments
  useGetCatalogQuery,
  useGetApartmentByIdQuery,
  useGetMyApartmentsQuery,
  useAddApartmentMutation,
  useDeleteApartmentMutation,
  // Bookings
  useGetBookingByIdQuery,
  useGetAllBookingsQuery,
  useGetMyBookingsQuery,
  useCreateBookingMutation,
  useCancelBookingMutation,
} = api;