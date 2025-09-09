import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, UserRole } from '../types/api'
import { authApi } from '../services/api'
import { apiRequest } from '../services/api'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  refreshUser: () => Promise<void>
  broadcastRoleChange: () => void
  hasRole: (role: UserRole) => boolean
  isApproved: () => boolean
  isActive: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export { AuthContext }

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false) // Prevent parallel refreshes

  // BroadcastChannel for role change propagation
  useEffect(() => {
    const channel = new BroadcastChannel('auth')
    
    channel.addEventListener('message', (event) => {
      if (event.data.type === 'roleChanged') {
        // Refetch user data when role changes
        refreshUser()
      } else if (event.data.type === 'logout') {
        // Handle logout from other tabs
        setUser(null)
        sessionStorage.removeItem('user')
      }
    })

    return () => {
      channel.close()
    }
  }, [])

  const refreshUser = async () => {
    // Prevent parallel requests
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      const response = await apiRequest('/api/v1/auth/me', { 
        method: 'GET',
        headers: { 'X-Suppress-Error-Toast': 'true' }
      })
      if (response.success && response.data) {
        setUser(response.data)
        sessionStorage.setItem('user', JSON.stringify(response.data))
      }
    } catch (error: any) {
      console.error('Failed to refresh user:', error)
      // Only logout if this was a session expiry (401 on /auth/me)
      if (error.response?.status === 401) {
        logout()
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      
      // Check for stored user data on mount (cookie auth is handled automatically)
      const storedUser = sessionStorage.getItem('user')
      
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        
        // Verify session is still valid by fetching current user (single call)
        await refreshUser()
      } else {
        // Try to get current user in case we have a valid cookie (single call)
        await refreshUser()
      }
      
      setIsLoading(false)
    }
    
    initAuth()
  }, []) // Remove refreshUser dependency to prevent loops
// inside your AuthContext where you already call authApi.login(...)
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const res = await authApi.login({ email, password })
      if (res.success && res.data) {
        // Backend uses cookie-based sessions; response.data.user contains the user
        const { user: newUser } = res.data as any
        setUser(newUser)
        sessionStorage.setItem('user', JSON.stringify(newUser))
        return
      }
      throw new Error(res.message || 'Login failed')
    } catch (err) {
      throw err
    }
  }

  const logout = async () => {
    try { await authApi.logout() } catch {}
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('auth_token')
    localStorage.removeItem('auth_token')
    setUser(null)
  }


  const broadcastRoleChange = () => {
    const channel = new BroadcastChannel('auth')
    channel.postMessage({ type: 'roleChanged' })
    channel.close()
  }

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role
  }

  const isApproved = (): boolean => {
    return user?.approved === true
  }

  const isActive = (): boolean => {
    return user?.active === true
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      refreshUser, 
      broadcastRoleChange,
      hasRole,
      isApproved,
      isActive
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
