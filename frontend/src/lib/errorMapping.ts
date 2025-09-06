/**
 * Error code mapping utility for friendly toast messages
 * Maps backend error codes to user-friendly messages according to toast policy
 */

export interface ErrorCodeMapping {
  [key: string]: string
}

// Standard error code to friendly message mapping
export const ERROR_CODE_MESSAGES: ErrorCodeMapping = {
  // Validation errors
  'VALIDATION_ERROR': 'Please fix the highlighted fields.',
  
  // Resource conflicts
  'DUPLICATE_RESOURCE': 'Already exists.',
  'ALREADY_ENROLLED': "You're already enrolled.",
  
  // Not found errors
  'NOT_FOUND': 'Item no longer exists.',
  
  // Enrollment specific
  'ENROLLMENT_WINDOW_CLOSED': 'Enrollment window is closed.',
  
  // Permission errors
  'PERMISSION_DENIED': "You don't have permission to do that.",
  'UNAUTHORIZED': "You don't have permission to do that.",
  'FORBIDDEN': "You don't have permission to do that.",
  
  // Server errors (5xx fallback)
  'SERVER_ERROR': 'Something went wrong. Try again.',
  'INTERNAL_SERVER_ERROR': 'Something went wrong. Try again.',
  
  // Fallback for unknown codes
  'UNKNOWN_ERROR': 'Something went wrong. Try again.',
}

/**
 * Maps an error code to a friendly message
 * @param code - The error code from the backend
 * @param defaultMessage - Optional default message if code not found
 * @returns Friendly user message
 */
export function getErrorMessage(code: string, defaultMessage?: string): string {
  const message = ERROR_CODE_MESSAGES[code]
  if (message) {
    return message
  }
  
  // If no mapping found, use default or generic message
  return defaultMessage || ERROR_CODE_MESSAGES.UNKNOWN_ERROR
}

/**
 * Creates a complete error message with optional request ID for 5xx errors
 * @param code - The error code
 * @param requestId - Optional request ID for server errors
 * @param defaultMessage - Optional default message
 * @returns Complete error message with ref if needed
 */
export function getCompleteErrorMessage(
  code: string, 
  requestId?: string, 
  defaultMessage?: string
): string {
  const baseMessage = getErrorMessage(code, defaultMessage)
  
  // Include request ID reference only for server errors (5xx)
  if (requestId && (code === 'SERVER_ERROR' || code === 'INTERNAL_SERVER_ERROR' || code.startsWith('5'))) {
    return `${baseMessage} Ref: ${requestId.substring(0, 8)}`
  }
  
  return baseMessage
}

/**
 * Checks if an error should show inline field validation
 * @param code - The error code
 * @returns true if this error type should show field-level validation
 */
export function shouldShowFieldValidation(code: string): boolean {
  return code === 'VALIDATION_ERROR'
}

/**
 * Extracts error details from a backend response
 * @param error - The error response from axios
 * @returns Structured error information
 */
export function extractErrorDetails(error: any): {
  code: string
  message: string
  field?: string
  requestId?: string
  shouldShowField: boolean
} {
  // Handle different error response structures
  const errorData = error.response?.data || error
  
  // New standardized error format: {code, field?, message, requestId?}
  if (errorData.code) {
    return {
      code: errorData.code,
      message: getCompleteErrorMessage(errorData.code, errorData.requestId, errorData.message),
      field: errorData.field,
      requestId: errorData.requestId,
      shouldShowField: shouldShowFieldValidation(errorData.code)
    }
  }
  
  // Legacy ApiResponse format: {success, message, errorCode}
  if (errorData.errorCode) {
    return {
      code: errorData.errorCode,
      message: getCompleteErrorMessage(errorData.errorCode, undefined, errorData.message),
      shouldShowField: shouldShowFieldValidation(errorData.errorCode)
    }
  }
  
  // Validation errors with errors object
  if (errorData.errors && typeof errorData.errors === 'object') {
    return {
      code: 'VALIDATION_ERROR',
      message: getErrorMessage('VALIDATION_ERROR'),
      shouldShowField: true
    }
  }
  
  // HTTP status code fallback
  const status = error.response?.status
  if (status) {
    if (status === 401) {
      return {
        code: 'PERMISSION_DENIED',
        message: getErrorMessage('PERMISSION_DENIED'),
        shouldShowField: false
      }
    } else if (status === 403) {
      return {
        code: 'PERMISSION_DENIED',
        message: getErrorMessage('PERMISSION_DENIED'),
        shouldShowField: false
      }
    } else if (status === 404) {
      return {
        code: 'NOT_FOUND',
        message: getErrorMessage('NOT_FOUND'),
        shouldShowField: false
      }
    } else if (status >= 500) {
      return {
        code: 'SERVER_ERROR',
        message: getCompleteErrorMessage('SERVER_ERROR', errorData.requestId),
        requestId: errorData.requestId,
        shouldShowField: false
      }
    }
  }
  
  // Final fallback
  return {
    code: 'UNKNOWN_ERROR',
    message: errorData.message || getErrorMessage('UNKNOWN_ERROR'),
    shouldShowField: false
  }
}