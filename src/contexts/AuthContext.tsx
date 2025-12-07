import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '@/shared/api/auth'
import { useNavigate } from 'react-router-dom'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role?: {
    id: string
    name: string
  }
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refetchUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setIsLoading(false)
        return
      }

      const userData = await authService.authMe()
      setUser(userData)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password)
    localStorage.setItem('token', data.token)
    localStorage.setItem('refreshToken', data.refreshToken)
    setUser({
      id: data.user.id,
      email: data.user.email,
      firstName: data.user.firstName,
      lastName: data.user.lastName,
      role: {
        id: data.user.role?.id || "",
        name: data.user.role?.name || 'user',
      },
    })
    navigate('/routing')
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      setUser(null)
      navigate('/')
    }
  }

  const refetchUser = async () => {
    await fetchUser()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refetchUser
      }}
    >
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