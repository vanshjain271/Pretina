import api from './client';

// ── Auth ──────────────────────────────────────────────────────────
export const adminLogin = (data) => api.post('/auth/admin-login', data);
export const getMe = () => api.get('/auth/me');

// ── Products ──────────────────────────────────────────────────────
export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const duplicateProduct = (id) => api.post(`/products/${id}/duplicate`);
export const getLowStockProducts = () => api.get('/products/admin/low-stock');

// ── Categories ────────────────────────────────────────────────────
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// ── Brands ────────────────────────────────────────────────────────
export const getBrands = () => api.get('/brands');
export const createBrand = (data) => api.post('/brands', data);
export const updateBrand = (id, data) => api.put(`/brands/${id}`, data);
export const deleteBrand = (id) => api.delete(`/brands/${id}`);

// ── Orders ────────────────────────────────────────────────────────
export const getOrders = (params) => api.get('/orders', { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const updateOrderStatus = (id, data) => api.patch(`/orders/${id}/status`, data);
export const editOrder = (id, data) => api.put(`/orders/${id}/edit`, data);
export const bulkUpdateOrderStatus = (data) => api.post('/orders/bulk-status', data);
export const updateOrderCourier = (id, data) => api.patch(`/orders/${id}/courier`, data);
export const updateOrderToken = (id, data) => api.patch(`/orders/${id}/token`, data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`);
export const exportOrdersCSV = (params) => api.get('/orders/export', { params, responseType: 'blob' });
export const getAbandonedCarts = (params) => api.get('/orders/abandoned', { params });
export const dismissAbandonedCart = (id) => api.delete(`/orders/abandoned/${id}`);
export const createManualOrder = (data) => api.post('/orders/manual', data);

// ── Invoices ──────────────────────────────────────────────────────
export const getInvoices = (params) => api.get('/invoices', { params });
export const getInvoice = (id) => api.get(`/invoices/${id}`);
export const generateInvoice = (orderId) => api.post(`/invoices/generate/${orderId}`);

// ── Customers ─────────────────────────────────────────────────────
export const getCustomers = (params) => api.get('/users', { params });
export const getCustomer = (id) => api.get(`/users/${id}`);
export const updateCustomer = (id, data) => api.put(`/users/${id}`, data);
export const toggleCustomerStatus = (id) => api.patch(`/users/${id}/toggle`);

// Legacy alias
export const getUsers = (params) => getCustomers(params);

// ── Employees ─────────────────────────────────────────────────────
export const getEmployees = () => api.get('/employees');
export const createEmployee = (data) => api.post('/employees', data);
export const updateEmployee = (id, data) => api.patch(`/employees/${id}`, data);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`);
export const toggleEmployeeStatus = (id) => api.patch(`/employees/${id}/toggle`);

// ── Banners ───────────────────────────────────────────────────────
export const getBanners = () => api.get('/banners/all');
export const createBanner = (data) => api.post('/banners', data);
export const updateBanner = (id, data) => api.put(`/banners/${id}`, data);
export const deleteBanner = (id) => api.delete(`/banners/${id}`);

// ── Alerts ────────────────────────────────────────────────────────
export const getAlerts = () => api.get('/alerts/all');
export const createAlert = (data) => api.post('/alerts', data);
export const updateAlert = (id, data) => api.put(`/alerts/${id}`, data);
export const deleteAlert = (id) => api.delete(`/alerts/${id}`);

// ── Coupons ───────────────────────────────────────────────────────
export const getCoupons = () => api.get('/coupons');
export const createCoupon = (data) => api.post('/coupons', data);
export const updateCoupon = (id, data) => api.put(`/coupons/${id}`, data);
export const deleteCoupon = (id) => api.delete(`/coupons/${id}`);

// ── Settings / Store ──────────────────────────────────────────────
export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.put('/settings', data);

// ── Analytics ─────────────────────────────────────────────────────
export const getDashboardOverview = () => api.get('/analytics/dashboard');
export const getSalesAnalytics = (params) => api.get('/analytics/sales', { params });
export const getUserAnalytics = (params) => api.get('/analytics/users', { params });
export const getAbandonedCartAnalytics = (params) => api.get('/analytics/abandoned-carts', { params });
export const getLowStockAlerts = (params) => api.get('/analytics/low-stock', { params });
export const getProductPerformance = (params) => api.get('/analytics/products', { params });
export const getOrderTrends = (params) => api.get('/analytics/trends', { params });
export const getGeographyAnalytics = (params) => api.get('/analytics/geography', { params });
export const getPeakHoursAnalytics = (params) => api.get('/analytics/peak-hours', { params });
export const getDeadStockAnalytics = (params) => api.get('/analytics/dead-stock', { params });

// ── Reviews ───────────────────────────────────────────────────────
export const getReviews = (params) => api.get('/reviews', { params });
export const deleteReview = (id) => api.delete(`/reviews/${id}`);
export const toggleReviewVisibility = (id) => api.patch(`/reviews/${id}/toggle`);

// ── Blog ──────────────────────────────────────────────────────────
export const getBlogs = (params) => api.get('/blog', { params });
export const getBlog = (id) => api.get(`/blog/${id}`);
export const createBlog = (data) => api.post('/blog', data);
export const updateBlog = (id, data) => api.put(`/blog/${id}`, data);
export const deleteBlog = (id) => api.delete(`/blog/${id}`);

// ── Notifications ─────────────────────────────────────────────────
// NOTE: Route is POST /notifications (not /notifications/send)
export const sendNotification = (data) => api.post('/notifications', data);
export const getNotificationHistory = (params) => api.get('/notifications', { params });

// ── Activity Log ──────────────────────────────────────────────────
export const getActivityLog = (params) => api.get('/invoices/activity-log', { params });

// ── Payments ──────────────────────────────────────────────────────
export const confirmQrPayment = (orderId) => api.post('/payments/qr/confirm', { orderId });

// ── Upload ────────────────────────────────────────────────────────
export const uploadImage = (formData) => api.post('/upload/image', formData);
export const uploadQR = (formData) => api.post('/upload/qr', formData);
