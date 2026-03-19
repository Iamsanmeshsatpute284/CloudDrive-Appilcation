import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// This component blocks access to pages if user is not logged in
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>  // still checking auth

  if (!user) return <Navigate to="/login" />  // not logged in → redirect

  return children  // logged in → show the page
}

export default ProtectedRoute