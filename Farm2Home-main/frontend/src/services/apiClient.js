import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

// Add authorization token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // For FormData, don't set Content-Type - let axios set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    } else {
      // For non-FormData requests, set JSON content type
      config.headers['Content-Type'] = 'application/json'
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or unauthorized
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
