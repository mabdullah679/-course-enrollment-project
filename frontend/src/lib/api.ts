import axios from 'axios'
import { extractErrorDetails } from './errorMapping'
import { toast } from './toast'

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

// Response interceptor for error handling with friendly toast messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract structured error details
    const errorDetails = extractErrorDetails(error)
    
    // Handle 401 specially - clear session and redirect
    if (error.response?.status === 401) {
      sessionStorage.removeItem('user')
      // Broadcast auth state change to other tabs
      if (typeof BroadcastChannel !== 'undefined') {
        const authChannel = new BroadcastChannel('auth')
        authChannel.postMessage({ type: 'logout', reason: 'unauthorized' })
        authChannel.close()
      }
      window.location.href = '/login'
      return Promise.reject(error)
    }
    
    // Don't show toasts for validation errors with field details 
    // (those should be handled by form components)
    if (errorDetails.shouldShowField && errorDetails.field) {
      // Let the component handle field-specific validation display
      return Promise.reject(error)
    }
    
    // Show friendly toast for other errors
    if (errorDetails.message) {
      toast.error(errorDetails.message)
    }
    
    return Promise.reject(error)
  }
)
