import { toast as hotToast } from 'react-hot-toast'

// Track active toasts by error code to prevent duplicates (max 1 per code/10s)
const activeToastCodes = new Map<string, number>()

// Default debounce time: 10 seconds as per problem statement
const DEFAULT_DEBOUNCE_MS = 10000

interface ToastOptions {
  group?: string
  code?: string // Error code for deduplication
  dedupe?: boolean
  debounceMs?: number
  requestId?: string // For server error correlation
}

export const toast = {
  success: (message: string, options: ToastOptions = {}) => {
    return showToast('success', message, options)
  },
  
  error: (message: string, options: ToastOptions = {}) => {
    return showToast('error', message, options)
  },
  
  info: (message: string, options: ToastOptions = {}) => {
    return showToast('info', message, options)
  },
  
  warning: (message: string, options: ToastOptions = {}) => {
    return showToast('warning', message, options)
  }
}

function showToast(type: 'success' | 'error' | 'info' | 'warning', message: string, options: ToastOptions) {
  const { 
    code,
    dedupe = true, 
    debounceMs = DEFAULT_DEBOUNCE_MS,
    requestId
  } = options
  
  // Create deduplication key based on code (if provided)
  // Future: could use group-based deduplication if needed
  
  // Check if this error code was shown recently (within debounce window)
  if (dedupe && code) {
    const lastShown = activeToastCodes.get(code)
    const now = Date.now()
    
    if (lastShown && (now - lastShown) < debounceMs) {
      // Skip showing duplicate toast within debounce window
      return
    }
    
    // Update last shown timestamp for this code
    activeToastCodes.set(code, now)
    
    // Clean up expired entries periodically
    setTimeout(() => {
      const currentTime = Date.now()
      for (const [key, timestamp] of activeToastCodes.entries()) {
        if (currentTime - timestamp >= debounceMs) {
          activeToastCodes.delete(key)
        }
      }
    }, debounceMs)
  }
  
  // Prepare final message with request ID if needed for server errors
  let finalMessage = message
  if (requestId && (code === 'SERVER_ERROR' || code === 'INTERNAL_SERVER_ERROR' || (code && code.startsWith('5')))) {
    finalMessage = `${message} Ref: ${requestId.substring(0, 8)}`
  }
  
  // Show the toast
  let toastId: string
  switch (type) {
    case 'success':
      toastId = hotToast.success(finalMessage)
      break
    case 'error':
      toastId = hotToast.error(finalMessage)
      break
    case 'info':
      toastId = hotToast(finalMessage, { icon: 'ℹ️' })
      break
    case 'warning':
      toastId = hotToast(finalMessage, { icon: '⚠️' })
      break
  }
  
  return toastId
}

// Group-specific toast functions for common use cases
export const toastGroups = {
  auth: {
    success: (message: string, code?: string) => 
      toast.success(message, { group: 'auth', code }),
    error: (message: string, code?: string, requestId?: string) => 
      toast.error(message, { group: 'auth', code, requestId })
  },
  
  api: {
    success: (message: string, code?: string) => 
      toast.success(message, { group: 'api', code }),
    error: (message: string, code?: string, requestId?: string) => 
      toast.error(message, { group: 'api', code, requestId })
  },
  
  form: {
    success: (message: string, code?: string) => 
      toast.success(message, { group: 'form', code }),
    error: (message: string, code?: string, requestId?: string) => 
      toast.error(message, { group: 'form', code, requestId })
  },
  
  system: {
    info: (message: string, code?: string) => 
      toast.info(message, { group: 'system', code }),
    warning: (message: string, code?: string) => 
      toast.warning(message, { group: 'system', code })
  }
}

// Specialized toast for error codes as per problem statement
export const toastError = (message: string, code: string, requestId?: string) => {
  return toast.error(message, { code, requestId, dedupe: true })
}

// Get stats for QA console
export const getToastStats = () => {
  return {
    activeToastCodes: Array.from(activeToastCodes.keys()),
    totalActive: activeToastCodes.size
  }
}

export default toast
