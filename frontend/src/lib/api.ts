import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080'

// Generate a unique request ID
const generateRequestId = () => crypto.randomUUID()

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Essential for HttpOnly cookies
})

// Request interceptor to add X-Request-Id
api.interceptors.request.use(
  (config) => {
    if (!config.headers['X-Request-Id']) {
      config.headers['X-Request-Id'] = generateRequestId()
    }
    return config
  },
  (error) => Promise.reject(error)
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
