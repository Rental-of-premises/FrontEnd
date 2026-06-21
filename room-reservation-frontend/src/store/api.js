import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = 'https://team3.verstack.ru';

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers) => {
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    localStorage.removeItem('user');
    
    if (!window.location.pathname.includes('/login') && 
        !window.location.pathname.includes('/register') &&
        !window.location.pathname.includes('/confirm-email')) {
      window.location.href = '/login';
    }
  }
  
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Apartments', 'Bookings', 'User', 'Reviews', 'Amenities'],
  endpoints: (builder) => ({
    // ===== ПОЛЬЗОВАТЕЛИ =====
    getUserById: builder.query({
      query: (id) => `/api/users/${id}`,
      providesTags: ['User']
    }),
    
    signUp: builder.mutation({
      query: (userData) => ({
        url: '/api/auth/sign-up',
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
        url: '/api/auth/sign-in',
        method: 'POST',
        body: {
          email: credentials.email,
          password: credentials.password
        },
      }),
    }),
    
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
    
    // ===== ПОМЕЩЕНИЯ =====
    getCatalog: builder.query({
      query: (filters = {}) => ({
        url: '/api/apartments',
        method: 'GET',
        params: {
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
      query: (id) => `/api/apartments/${id}`,
      providesTags: (result, error, id) => [{ type: 'Apartments', id }]
    }),
    
    getMyApartments: builder.query({
      query: () => '/api/account/my-apartments',
      providesTags: ['Apartments']
    }),
    
    addApartment: builder.mutation({
      query: (apartmentData) => ({
        url: '/api/account/new-apartment',
        method: 'POST',
        body: {
          name: apartmentData.name,
          description: apartmentData.description || '',
          capacity: apartmentData.capacity,
          price_per_hour: apartmentData.price_per_hour,
          metro: apartmentData.metro || '',
          address: apartmentData.address || '',
          is_active: true,
          amenities: apartmentData.amenities || []
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
    
    // ===== УДОБСТВА =====
    getAmenities: builder.query({
      query: () => '/api/amenities',
      providesTags: ['Amenities']
    }),
    
    // ===== БРОНИРОВАНИЯ =====
    getBookingById: builder.query({
      query: (id) => `/api/bookings/${id}`,
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
    
    // ===== ОТЗЫВЫ =====
    getReviewsByApartment: builder.query({
      query: (apartmentId) => `/api/apartments/${apartmentId}/reviews?limit=100&offset=0`,
      providesTags: (result, error, apartmentId) => [
        { type: 'Reviews', id: `apartment-${apartmentId}` }
      ],
    }),
    
    createReview: builder.mutation({
      query: ({ apartment_id, comment, stars }) => ({
        url: `/api/apartments/${apartment_id}/new-review`,
        method: 'POST',
        body: { 
          apartment_id: apartment_id,
          stars: stars,
          comment: comment
        },
      }),
      invalidatesTags: (result, error, { apartment_id }) => [
        { type: 'Reviews', id: `apartment-${apartment_id}` },
        { type: 'Apartments' }
      ],
    }),
    
    deleteReview: builder.mutation({
      query: (reviewId) => ({
        url: `/api/account/delete-review/${reviewId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Reviews', 'Apartments'],
    }),
  }),
});

export const {
  useGetUserByIdQuery,
  useSignUpMutation,
  useSignInMutation,
  useLogoutMutation,
  useDeleteAccountMutation,
  useGetCatalogQuery,
  useGetApartmentByIdQuery,
  useGetMyApartmentsQuery,
  useAddApartmentMutation,
  useUpdateApartmentMutation,
  useDeleteApartmentMutation,
  useGetAmenitiesQuery,
  useGetBookingByIdQuery,
  useGetMyBookingsQuery,
  useCreateBookingMutation,
  useCancelBookingMutation,
  useConfirmBookingMutation,
  useRejectBookingMutation,
  useGetSellerBookingsQuery,
  useGetReviewsByApartmentQuery,
  useCreateReviewMutation,
  useDeleteReviewMutation,
} = api;