import api from './client';

// Auth
export const adminLogin = (data) => api.post('/auth/admin-login', data);
export const getMe = () => api.get('/auth/me');

// Products
export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Categories
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Brands
export const getBrands = () => api.get('/brands');
export const createBrand = (data) => api.post('/brands', data);
export const updateBrand = (id, data) => api.put(`/brands/${id}`, data);
export const deleteBrand = (id) => api.delete(`/brands/${id}`);

// Orders
export const getOrders = (params) => api.get('/orders', { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const updateOrderStatus = (id, data) => api.patch(`/orders/${id}/status`, data);

// Banners
export const getBanners = () => api.get('/banners/all');
export const createBanner = (data) => api.post('/banners', data);
export const updateBanner = (id, data) => api.put(`/banners/${id}`, data);
export const deleteBanner = (id) => api.delete(`/banners/${id}`);

// Alerts
export const getAlerts = () => api.get('/alerts/all');
export const createAlert = (data) => api.post('/alerts', data);
export const updateAlert = (id, data) => api.put(`/alerts/${id}`, data);
export const deleteAlert = (id) => api.delete(`/alerts/${id}`);

// Coupons
export const getCoupons = () => api.get('/coupons');
export const createCoupon = (data) => api.post('/coupons', data);
export const updateCoupon = (id, data) => api.put(`/coupons/${id}`, data);
export const deleteCoupon = (id) => api.delete(`/coupons/${id}`);

// Users
export const getUsers = (params) => api.get('/users', { params });

// Settings
export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.put('/settings', data);

// Payments
export const confirmQrPayment = (orderId) => api.post('/payments/qr/confirm', { orderId });

// Upload
export const uploadImage = (formData) => api.post('/upload/image', formData);
export const uploadQR = (formData) => api.post('/upload/qr', formData);
