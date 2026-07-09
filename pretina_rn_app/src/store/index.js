import { configureStore } from '@reduxjs/toolkit';

// We will add our slices here (auth, cart, etc.)
export const store = configureStore({
  reducer: {
    // auth: authReducer,
    // cart: cartReducer,
  },
});
