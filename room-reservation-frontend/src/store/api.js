// src/store/api.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = 'http://localhost:3000';

// Моковые данные для каталога
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
    
    // ========== БРОНИРОВАНИЯ (МОКОВЫЕ) ==========
    getBookingById: builder.query({
      async queryFn(id) {
        const today = new Date();
        const mockBooking = {
          id: parseInt(id),
          apartment_title: "Test Workspace",
          room_title: "Test Workspace",
          time_from: new Date(today.setHours(10, 0, 0, 0)).toISOString(),
          time_to: new Date(today.setHours(12, 0, 0, 0)).toISOString(),
          status: "confirmed",
          created_at: new Date().toISOString()
        };
        return { data: mockBooking };
      },
      providesTags: (result, error, id) => [{ type: 'Bookings', id }]
    }),
    
    getAllBookings: builder.query({
      async queryFn() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(today);
        dayAfter.setDate(dayAfter.getDate() + 2);
        
        const mockBookings = [
          {
            id: 1,
            apartment_title: "Modern Coworking Space",
            room_title: "Modern Coworking Space",
            time_from: new Date(today.setHours(10, 0, 0, 0)).toISOString(),
            time_to: new Date(today.setHours(12, 0, 0, 0)).toISOString(),
            status: "confirmed",
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            apartment_title: "Executive Conference Room",
            room_title: "Executive Conference Room",
            time_from: new Date(tomorrow.setHours(14, 0, 0, 0)).toISOString(),
            time_to: new Date(tomorrow.setHours(16, 0, 0, 0)).toISOString(),
            status: "confirmed",
            created_at: new Date().toISOString()
          }
        ];
        return { data: mockBookings };
      },
      providesTags: ['Bookings']
    }),
    
    getMyBookings: builder.query({
      async queryFn() {
        console.log('Используем моковые данные для бронирований');
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(today);
        dayAfter.setDate(dayAfter.getDate() + 2);
        
        const MOCK_BOOKINGS = [
          {
            id: 1,
            apartment_title: "Modern Coworking Space",
            room_title: "Modern Coworking Space",
            time_from: new Date(today.setHours(10, 0, 0, 0)).toISOString(),
            time_to: new Date(today.setHours(12, 0, 0, 0)).toISOString(),
            status: "confirmed",
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            apartment_title: "Executive Conference Room",
            room_title: "Executive Conference Room",
            time_from: new Date(tomorrow.setHours(14, 0, 0, 0)).toISOString(),
            time_to: new Date(tomorrow.setHours(16, 0, 0, 0)).toISOString(),
            status: "confirmed",
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            apartment_title: "Private Office",
            room_title: "Private Office",
            time_from: new Date(dayAfter.setHours(9, 0, 0, 0)).toISOString(),
            time_to: new Date(dayAfter.setHours(11, 0, 0, 0)).toISOString(),
            status: "confirmed",
            created_at: new Date().toISOString()
          }
        ];
        
        return { data: MOCK_BOOKINGS };
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
      async queryFn(id) {
        console.log(`Моковая отмена бронирования #${id}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { data: { success: true, id } };
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