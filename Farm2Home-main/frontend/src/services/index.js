import apiClient from './apiClient'

export const authService = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  refreshToken: (refreshToken) =>
    apiClient.post('/auth/refresh-token', { refreshToken }),
  forgotPassword: (email) =>
    apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (resetToken, newPassword) =>
    apiClient.post('/auth/reset-password', { resetToken, newPassword }),
}

export const productService = {
  getAllProducts: (params) => apiClient.get('/products', { params }),
  getProductById: (id) => apiClient.get(`/products/${id}`),
  createProduct: (data) => apiClient.post('/products', data),
  updateProduct: (id, data) => apiClient.put(`/products/${id}`, data),
  deleteProduct: (id) => apiClient.delete(`/products/${id}`),
  searchProducts: (query, params) =>
    apiClient.get('/products/search', { params: { search: query, ...params } }),
  getFeaturedProducts: () => apiClient.get('/products/featured'),
  getProductsByCategory: (category, params) =>
    apiClient.get(`/products/category/${category}`, { params }),
  getProductsByFarmer: (farmerId, params) =>
    apiClient.get('/products', { params: { farmerId, ...params } }),
}

export const auctionService = {
  getAllAuctions: (params) => apiClient.get('/auctions', { params }),
  getAuctionById: (id) => apiClient.get(`/auctions/${id}`),
  createAuction: (data) => apiClient.post('/auctions', data),
  placeBid: (auctionId, bidAmount) =>
    apiClient.post(`/auctions/${auctionId}/bid`, { auctionId, bidAmount }),
  getMyAuctions: (params) => apiClient.get('/auctions/mine', { params }),
  updateAuction: (id, data) => apiClient.put(`/auctions/${id}`, data),
  deleteAuction: (id) => apiClient.delete(`/auctions/${id}`),
  endAuction: (id) => apiClient.post(`/auctions/${id}/end`),
}

export const cartService = {
  getCart: () => apiClient.get('/cart'),
  addToCart: (data) => apiClient.post('/cart/add', data),
  updateCartItem: (productId, data) =>
    apiClient.put(`/cart/update/${productId}`, data),
  removeFromCart: (productId) =>
    apiClient.delete(`/cart/remove/${productId}`),
  clearCart: () => apiClient.delete('/cart/clear'),
}

export const orderService = {
  createOrder: (data) => apiClient.post('/orders', data),
  getAllOrders: (params) => apiClient.get('/orders', { params }),
  getOrderById: (id) => apiClient.get(`/orders/${id}`),
  updateOrderStatus: (id, status) =>
    apiClient.put(`/orders/${id}/status`, { status }),
  cancelOrder: (id) => apiClient.delete(`/orders/${id}/cancel`),
}

export const userService = {
  getUserProfile: () => apiClient.get('/users/profile'),
  updateUserProfile: (data) => apiClient.put('/users/profile', data),
  changePassword: (data) => apiClient.put('/users/password', data),
  getDashboard: () => apiClient.get('/users/dashboard'),
  // Admin: list users
  listUsers: (params) => apiClient.get('/users', { params }),
  // Admin: update user role
  updateUserRole: (id, data) => apiClient.put(`/users/${id}/role`, data)
}

export const reviewService = {
  createReview: (data) => apiClient.post('/reviews', data),
  getProductReviews: (productId, params) =>
    apiClient.get(`/reviews/product/${productId}`, { params }),
  updateReview: (id, data) => apiClient.put(`/reviews/${id}`, data),
  deleteReview: (id) => apiClient.delete(`/reviews/${id}`),
}

export const notificationService = {
  getNotifications: (params) => apiClient.get('/notifications', { params }),
  markAsRead: (id) => apiClient.put(`/notifications/${id}/read`),
  deleteNotification: (id) => apiClient.delete(`/notifications/${id}`),
  clearAllNotifications: () => apiClient.delete('/notifications'),
}

export const walletService = {
  getWallet: () => apiClient.get('/wallet'),
  getBalance: () => apiClient.get('/wallet/balance'),
  requestFunds: (data) => apiClient.post('/wallet/request', data),
  listRequests: (params) => apiClient.get('/wallet/requests', { params }), // admin
  approveRequest: (id) => apiClient.put(`/wallet/requests/${id}/approve`),
  rejectRequest: (id, reason) => apiClient.put(`/wallet/requests/${id}/reject`, { reason })
}

export const adminService = {
  getDashboard: () => apiClient.get('/admin/dashboard')
}

// Settlement Service - Auction Settlement
export const escrowService = {
  // Buyer endpoints
  getMyAuctionOrders: () => apiClient.get('/escrow/my-orders'),
  confirmDelivery: (orderId) => apiClient.post(`/escrow/confirm-delivery/${orderId}`),
  
  // Farmer endpoints
  getFarmerOrders: () => apiClient.get('/escrow/farmer-orders'),
  
  // Admin endpoints
  getEscrowSummary: () => apiClient.get('/escrow/summary'),
  getEscrowOrders: (params) => apiClient.get('/escrow/orders', { params }),
  getEscrowOrderDetails: (orderId) => apiClient.get(`/escrow/orders/${orderId}`),
  releasePayment: (orderId) => apiClient.post(`/escrow/release-payment/${orderId}`),
  refundOrder: (orderId, reason) => apiClient.post(`/escrow/refund/${orderId}`, { reason }),
  retrySettlement: (auctionId) => apiClient.post(`/escrow/retry-settlement/${auctionId}`),
  processAutoConfirmations: () => apiClient.post('/escrow/process-auto-confirmations')
}

// Backwards-compatible alias (use `settlementService` in new UI code)
export const settlementService = escrowService


