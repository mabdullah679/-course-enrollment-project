import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '../types/api'
import { authApi } from '../services/api'
import { apiRequest } from '../services/api'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  refreshUser: () => Promise<void>
  broadcastRoleChange: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export { AuthContext }

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // BroadcastChannel for role change propagation
  useEffect(() => {
    const channel = new BroadcastChannel('auth')
    
    channel.addEventListener('message', (event) => {
      if (event.data.type === 'roleChanged') {
        // Refetch user data when role changes
        refreshUser()
      }
    })

    return () => {
      channel.close()
    }
  }, [])

  const refreshUser = async () => {
    try {
      const response = await apiRequest('/api/v1/auth/me')
      if (response.success && response.data) {
        setUser(response.data)
        sessionStorage.setItem('user', JSON.stringify(response.data))
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
      // If refresh fails, logout
      logout()
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
        
        // Verify session is still valid by fetching current user
        try {
          await refreshUser()
        } catch (error) {
          // Session is invalid, clear stored data
          logout()
        }
      } else {
        // Try to get current user in case we have a valid cookie
        try {
          await refreshUser()
        } catch (error) {
          // No valid session
          console.log('No valid session found')
        }
      }
      
      setIsLoading(false)
    }
    
    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password })
      if (response.success && response.data) {
        const { user: newUser } = response.data
        setUser(newUser)
        sessionStorage.setItem('user', JSON.stringify(newUser))
      }
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error)
    } finally {
      setUser(null)
      sessionStorage.removeItem('user')
    }
  }

  const broadcastRoleChange = () => {
    const channel = new BroadcastChannel('auth')
    channel.postMessage({ type: 'roleChanged' })
    channel.close()
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, refreshUser, broadcastRoleChange }}>
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
