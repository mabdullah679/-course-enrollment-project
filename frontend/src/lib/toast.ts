import { toast as hotToast } from 'react-hot-toast'

// Track active toasts to prevent duplicates
const activeToasts = new Set<string>()

// Debounce timeout for each toast type
const toastTimeouts = new Map<string, number>()

interface ToastOptions {
  group?: string
  dedupe?: boolean
  debounceMs?: number
}

export const toast = {
  success: (message: string, options: ToastOptions = {}) => {
    showToast('success', message, options)
  },
  
  error: (message: string, options: ToastOptions = {}) => {
    showToast('error', message, options)
  },
  
  info: (message: string, options: ToastOptions = {}) => {
    showToast('info', message, options)
  },
  
  warning: (message: string, options: ToastOptions = {}) => {
    showToast('warning', message, options)
  }
}

function showToast(type: 'success' | 'error' | 'info' | 'warning', message: string, options: ToastOptions) {
  const { group = 'default', dedupe = true, debounceMs = 1000 } = options
  
  // Create a unique key for this toast
  const toastKey = `${group}-${type}-${message}`
  
  // If deduplication is enabled and this toast is already active, skip it
  if (dedupe && activeToasts.has(toastKey)) {
    return
  }
  
  // Clear any existing timeout for this toast key
  const existingTimeout = toastTimeouts.get(toastKey)
  if (existingTimeout) {
    clearTimeout(existingTimeout)
  }
  
  // Add to active toasts
  activeToasts.add(toastKey)
  
  // Show the toast
  let toastId: string
  switch (type) {
    case 'success':
      toastId = hotToast.success(message)
      break
    case 'error':
      toastId = hotToast.error(message)
      break
    case 'info':
      toastId = hotToast(message, { icon: 'ℹ️' })
      break
    case 'warning':
      toastId = hotToast(message, { icon: '⚠️' })
      break
  }
  
  // Set timeout to remove from active toasts
  const timeout = setTimeout(() => {
    activeToasts.delete(toastKey)
    toastTimeouts.delete(toastKey)
  }, debounceMs)
  
  toastTimeouts.set(toastKey, timeout)
  
  return toastId
}

// Group-specific toast functions for common use cases
export const toastGroups = {
  auth: {
    success: (message: string) => toast.success(message, { group: 'auth' }),
    error: (message: string) => toast.error(message, { group: 'auth' })
  },
  
  api: {
    success: (message: string) => toast.success(message, { group: 'api' }),
    error: (message: string) => toast.error(message, { group: 'api' })
  },
  
  form: {
    success: (message: string) => toast.success(message, { group: 'form' }),
    error: (message: string) => toast.error(message, { group: 'form' })
  },
  
  system: {
    info: (message: string) => toast.info(message, { group: 'system' }),
    warning: (message: string) => toast.warning(message, { group: 'system' })
  }
}

export default toast
