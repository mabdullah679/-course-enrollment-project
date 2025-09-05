import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function useDebounceCallback(callback: (...args: any[]) => void, delay: number) {
  const [debounceTimer, setDebounceTimer] = useState<number | null>(null)

  return (...args: any[]) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    
    const timer = setTimeout(() => {
      callback(...args)
    }, delay)
    
    setDebounceTimer(timer)
  }
}