import axios from 'axios'
import { extractErrorDetails } from './errorMapping'
import { toastError } from './toast'
import { requestTracker } from './requestTracker'

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
  (response) => {
    // Track successful requests (dev only)
    if (import.meta.env.DEV) {
      const requestId = response.headers['x-request-id'] || response.config.headers['X-Request-Id'] || 'unknown'
      requestTracker.addRequest({
        id: requestId as string,
        endpoint: response.config.url || 'unknown',
        method: (response.config.method || 'GET').toUpperCase(),
        status: response.status,
        timestamp: new Date()
      })
    }
    return response
  },
  (error) => {
    // Track failed requests (dev only)
    if (import.meta.env.DEV && error.response) {
      const requestId = error.response.headers['x-request-id'] || error.config?.headers['X-Request-Id'] || 'unknown'
      requestTracker.addRequest({
        id: requestId as string,
        endpoint: error.config?.url || 'unknown',
        method: (error.config?.method || 'GET').toUpperCase(),
        status: error.response.status,
        timestamp: new Date()
      })
    }

    // Extract structured error details
    const errorDetails = extractErrorDetails(error)
    
    // Handle 401 on /auth/me specifically - clear session and redirect
    // Do NOT auto-logout on 403 or other 401s as they may be authorization issues
    if (error.response?.status === 401 && error.config?.url?.includes('/auth/me')) {
      sessionStorage.removeItem('user')
      // Broadcast auth state change to other tabs
      if (typeof BroadcastChannel !== 'undefined') {
        const authChannel = new BroadcastChannel('auth')
        authChannel.postMessage({ type: 'logout', reason: 'session_expired' })
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
    
    // Don't show toasts if error suppression is requested (e.g., initial auth checks)
    if (error.config?.headers?.['X-Suppress-Error-Toast'] === 'true') {
      return Promise.reject(error)
    }
    
    // Show friendly toast for other errors using error code-based deduplication
    if (errorDetails.message) {
      toastError(errorDetails.message, errorDetails.code, errorDetails.requestId)
    }
    
    return Promise.reject(error)
  }
)
