import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Essential for HttpOnly cookies
})

// Generate a unique request ID
const generateRequestId = () => {
  return 'req_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
}

// Request interceptor to add X-Request-Id header
api.interceptors.request.use(
  (config) => {
    // Add X-Request-Id header if not already present
    if (!config.headers['X-Request-Id']) {
      config.headers['X-Request-Id'] = generateRequestId()
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored user data and redirect to login
      sessionStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
