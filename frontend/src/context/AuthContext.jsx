import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loginWithGoogle, getCurrentUser } from '../api/authApi'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  // Fetch current user profile on mount / token change
  useEffect(() => {
    if (token) {
      getCurrentUser()
        .then((res) => setUser(res.data))
        .catch(() => {
          // Token invalid or expired
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const handleGoogleLogin = useCallback(async (googleCredential) => {
    const res = await loginWithGoogle(googleCredential)
    const { token: jwt, user: userData } = res.data
    localStorage.setItem('token', jwt)
    setToken(jwt)
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  const isAdmin      = user?.role === 'ADMIN'
  const isTechnician = user?.role === 'TECHNICIAN'
  const isLoggedIn   = !!user

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isLoggedIn, isAdmin, isTechnician,
      handleGoogleLogin, logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
