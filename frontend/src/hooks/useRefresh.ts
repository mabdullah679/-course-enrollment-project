import { useState, useCallback } from 'react'

export function useRefresh() {
  const [refreshing, setRefreshing] = useState(false)
  
  const refresh = useCallback(async (refreshFn: () => Promise<void>) => {
    if (refreshing) return
    
    setRefreshing(true)
    try {
      await refreshFn()
    } catch (error) {
      console.error('Refresh error:', error)
      throw error
    } finally {
      setRefreshing(false)
    }
  }, [refreshing])
  
  return { refreshing, refresh }
}

export function useDataLoader<T>(
  loadFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { refreshing, refresh } = useRefresh()

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await loadFn()
      setData(result)
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
      console.error('Data loading error:', err)
    } finally {
      setLoading(false)
    }
  }, dependencies)

  const refreshData = useCallback(() => {
    return refresh(loadData)
  }, [refresh, loadData])

  return {
    data,
    loading: loading || refreshing,
    error,
    refreshData,
    setData
  }
}