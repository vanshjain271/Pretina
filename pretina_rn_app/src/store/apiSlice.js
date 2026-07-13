import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Platform } from 'react-native';

import auth from '@react-native-firebase/auth';
import { API_BASE_URL } from '../config';
const BASE_URL = API_BASE_URL;

export const apiSlice = createApi({
  reducerPath: 'api',
  tagTypes: ['Profile'],
  baseQuery: fetchBaseQuery({ 
    baseUrl: BASE_URL,
    prepareHeaders: async (headers) => {
      const user = auth().currentUser;
      if (user) {
        try {
          const token = await user.getIdToken();
          headers.set('authorization', `Bearer ${token}`);
        } catch (e) {
          console.warn("Could not get Firebase token", e);
        }
      }
      return headers;
    }
  }),
  endpoints: (builder) => ({
    getBanners: builder.query({
      query: (placement = '') => `/banners${placement ? `?placement=${placement}` : ''}`,
    }),
    getCategories: builder.query({
      query: () => '/categories',
    }),
    getBrands: builder.query({
      query: () => '/brands',
    }),
    getHomepageProducts: builder.query({
      query: () => '/products/homepage',
    }),
    getProductById: builder.query({
      query: (id) => `/products/${id}`,
    }),
    getSettings: builder.query({
      query: () => '/settings',
    }),
    getMyProfile: builder.query({
      query: () => '/users/me',
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: '/users/me',
        method: 'PUT',
        body: profileData,
      }),
      invalidatesTags: ['Profile'],
    }),
    addAddress: builder.mutation({
      query: (addressData) => ({
        url: '/users/me/addresses',
        method: 'POST',
        body: addressData,
      }),
    }),
    syncCart: builder.mutation({
      query: (items) => ({
        url: '/cart/sync',
        method: 'PUT',
        body: { items },
      }),
    }),
    clearCartAPI: builder.mutation({
      query: () => ({
        url: '/cart',
        method: 'DELETE',
      }),
    }),
    addToCartAPI: builder.mutation({
      query: (item) => ({
        url: '/cart/items',
        method: 'POST',
        body: item,
      }),
    }),
    cancelOrder: builder.mutation({
      query: (id) => ({
        url: `/orders/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['Order'],
    }),
    registerFcmToken: builder.mutation({
      query: (data) => ({
        url: '/notifications/fcm-token',
        method: 'POST',
        body: data, // { token: '...', device: '...' }
      }),
    }),
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: '/orders',
        method: 'POST',
        body: orderData,
      }),
    }),
    getMyOrders: builder.query({
      query: () => '/orders/my',
    }),
    getOrderById: builder.query({
      query: (id) => `/orders/${id}`,
      providesTags: ['Order'],
    }),
    createRazorpayOrder: builder.mutation({
      query: (payload) => ({
        url: '/payments/razorpay/create-order',
        method: 'POST',
        body: payload,
      }),
    }),
    verifyRazorpayPayment: builder.mutation({
      query: (verificationData) => ({
        url: '/payments/razorpay/verify',
        method: 'POST',
        body: verificationData,
      }),
    }),
    getNotifications: builder.query({
      query: () => '/notifications',
    }),
  }),
});

export const {
  useGetBannersQuery,
  useGetCategoriesQuery,
  useGetBrandsQuery,
  useGetHomepageProductsQuery,
  useGetProductByIdQuery,
  useGetSettingsQuery,
  useGetMyProfileQuery,
  useUpdateProfileMutation,
  useAddAddressMutation,
  useSyncCartMutation,
  useClearCartAPIMutation,
  useAddToCartAPIMutation,
  useCreateOrderMutation,
  useGetMyOrdersQuery,
  useGetOrderByIdQuery,
  useCancelOrderMutation,
  useRegisterFcmTokenMutation,
  useCreateRazorpayOrderMutation,
  useVerifyRazorpayPaymentMutation,
  useGetNotificationsQuery,
} = apiSlice;
