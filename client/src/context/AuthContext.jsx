import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

// Step 1: Create the context
const AuthContext = createContext()

// Step 2: Create the Provider component
// This wraps your whole app and makes auth data available everywhere
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)        // current logged in user
  const [loading, setLoading] = useState(true)  // checking if user is logged in

  // Step 3: On app load, check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get('/auth/me')
        setUser(res.data.user)
      } catch (error) {
        setUser(null)  // not logged in
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  // Step 4: Login function
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    setUser(res.data.user)
    return res.data
  }

  // Step 5: Register function
  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password })
    setUser(res.data.user)
    return res.data
  }

  // Step 6: Logout function
  const logout = async () => {
    await api.post('/auth/logout')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Step 7: Custom hook to use auth anywhere in the app
export function useAuth() {
  return useContext(AuthContext)
}