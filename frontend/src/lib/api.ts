import axios from 'axios'
import { extractErrorDetails } from './errorMapping'
import { toastError, toast } from './toast'
import { requestTracker } from './requestTracker'

// Extend axios config to support custom meta fields
declare module 'axios' {
  interface AxiosRequestConfig {
    meta?: {
      successMessage?: string
    }
  }
}

const API_BASE_URL = 'http://localhost:8080'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // fine to keep; JWT is still via Authorization header
})

const generateRequestId = () =>
  'req_' + Math.random().toString(36).slice(2, 11) + '_' + Date.now()

function getAuthToken(): string | null {
  // try sessionStorage first (fresh tab), then fallback to localStorage
  return (
    sessionStorage.getItem('auth_token') ||
    localStorage.getItem('auth_token')
  )
}

// Request interceptor: attach Request-Id and Bearer token
api.interceptors.request.use(
  (config) => {
    config.headers = config.headers ?? {}

    if (!('X-Request-Id' in config.headers)) {
      ;(config.headers as any)['X-Request-Id'] = generateRequestId()
    }

    const token = getAuthToken()
    if (token) {
      ;(config.headers as any).Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: record requests & show friendly errors + 204 success toasts
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      const requestId =
        response.headers['x-request-id'] ||
        (response.config.headers as any)?.['X-Request-Id'] ||
        'unknown'
      requestTracker.addRequest({
        id: requestId as string,
        endpoint: response.config.url || 'unknown',
        method: (response.config.method || 'GET').toUpperCase(),
        status: response.status,
        timestamp: new Date(),
      })
    }

    // Handle 204 success toasts
    if (response.status === 204 && response.config?.meta?.successMessage) {
      const message = response.config.meta.successMessage
      toast.success(message)
    }
    
    return response
  },
  (error) => {
    if (import.meta.env.DEV && error.response) {
      const requestId =
        error.response.headers?.['x-request-id'] ||
        (error.config?.headers as any)?.['X-Request-Id'] ||
        'unknown'
      requestTracker.addRequest({
        id: requestId as string,
        endpoint: error.config?.url || 'unknown',
        method: (error.config?.method || 'GET').toUpperCase(),
        status: error.response.status,
        timestamp: new Date(),
      })
    }

    const details = extractErrorDetails(error)

    const isBrowser = typeof window !== 'undefined'
    const isAuthMe = error.config?.url?.includes('/auth/me')
    const status = error.response?.status
    const onLoginRoute = isBrowser && window.location.pathname.startsWith('/login')
    const hasStoredSession = isBrowser && (
      !!sessionStorage.getItem('user') ||
      !!sessionStorage.getItem('auth_token') ||
      !!localStorage.getItem('auth_token')
    )

    // Only treat as session expiry if user had an active session
    if (isAuthMe && (status === 401 || status === 403) && hasStoredSession) {
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('auth_token')
      localStorage.removeItem('auth_token')
      if (typeof BroadcastChannel !== 'undefined') {
        const ch = new BroadcastChannel('auth')
        ch.postMessage({ type: 'logout', reason: 'session_expired' })
        ch.close()
      }
      if (!onLoginRoute) {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    if (details.shouldShowField && details.field) return Promise.reject(error)
    // Honor explicit suppression header (used during initial auth probe)
    if (error.config?.headers?.['X-Suppress-Error-Toast'] === 'true') return Promise.reject(error)
    // Suppress errors on the login route until the user submits credentials
    if (!hasStoredSession && onLoginRoute) {
      return Promise.reject(error)
    }

    if (details.message) toastError(details.message, details.code, details.requestId)
    return Promise.reject(error)
  }
)
