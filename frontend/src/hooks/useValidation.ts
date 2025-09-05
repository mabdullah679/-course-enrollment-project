import { useState, useCallback } from 'react'

export interface ValidationRule<T> {
  test: (value: T) => boolean
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function useValidation<T>(rules: ValidationRule<T>[]) {
  const [errors, setErrors] = useState<string[]>([])
  
  const validate = useCallback((value: T): ValidationResult => {
    const validationErrors: string[] = []
    
    for (const rule of rules) {
      if (!rule.test(value)) {
        validationErrors.push(rule.message)
      }
    }
    
    setErrors(validationErrors)
    
    return {
      isValid: validationErrors.length === 0,
      errors: validationErrors
    }
  }, [rules])
  
  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])
  
  return {
    errors,
    validate,
    clearErrors,
    hasErrors: errors.length > 0
  }
}

// Common validation rules
export const validationRules = {
  required: <T>(message = 'This field is required'): ValidationRule<T> => ({
    test: (value: T) => {
      if (typeof value === 'string') {
        return value.trim().length > 0
      }
      return value != null && value !== undefined
    },
    message
  }),
  
  minLength: (min: number, message?: string): ValidationRule<string> => ({
    test: (value: string) => value.length >= min,
    message: message || `Must be at least ${min} characters`
  }),
  
  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    test: (value: string) => value.length <= max,
    message: message || `Must be no more than ${max} characters`
  }),
  
  email: (message = 'Must be a valid email address'): ValidationRule<string> => ({
    test: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    },
    message
  }),
  
  numeric: (message = 'Must be a number'): ValidationRule<string> => ({
    test: (value: string) => !isNaN(Number(value)),
    message
  }),
  
  range: (min: number, max: number, message?: string): ValidationRule<number> => ({
    test: (value: number) => value >= min && value <= max,
    message: message || `Must be between ${min} and ${max}`
  })
}