import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// This component blocks access to pages if user is not logged in
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full animate-spin" style={{ clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 0 100%, 0 50%)' }}></div>
            <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center">
              <span className="text-2xl">☁️</span>
            </div>
          </div>
          <p className="text-gray-600 font-semibold">Loading Cloud Drive...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" />  // not logged in → redirect

  return children  // logged in → show the page
}

export default ProtectedRoute