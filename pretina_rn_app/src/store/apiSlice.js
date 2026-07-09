import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Platform } from 'react-native';

// For Android Emulator, 10.0.2.2 points to host's localhost
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001/api/v1' : 'http://localhost:5001/api/v1';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  endpoints: (builder) => ({
    getBanners: builder.query({
      query: (placement = 'home') => `/banners?placement=${placement}`,
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
    getSettings: builder.query({
      query: () => '/settings',
    }),
  }),
});

export const {
  useGetBannersQuery,
  useGetCategoriesQuery,
  useGetBrandsQuery,
  useGetHomepageProductsQuery,
  useGetSettingsQuery,
} = apiSlice;
