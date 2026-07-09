import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './apiSlice';

// We will add our slices here (auth, cart, etc.)
export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    // auth: authReducer,
    // cart: cartReducer,
    app: (state = { initialized: true }) => state,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});
