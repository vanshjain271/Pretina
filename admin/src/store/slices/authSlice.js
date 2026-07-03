import { createSlice } from '@reduxjs/toolkit';

const storedUser = localStorage.getItem('pretina_admin_user');
const storedToken = localStorage.getItem('pretina_admin_token');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken || null,
    loading: false,
  },
  reducers: {
    setCredentials(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('pretina_admin_token', action.payload.token);
      localStorage.setItem('pretina_admin_user', JSON.stringify(action.payload.user));
    },
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('pretina_admin_token');
      localStorage.removeItem('pretina_admin_user');
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
  },
});

export const { setCredentials, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
