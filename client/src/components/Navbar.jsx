import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function Navbar() {
  const { user } = useAuth()

  return (
    <nav className="flex items-center justify-between px-8 h-16 bg-white border-b border-gray-200 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
          ☁️
        </div>
        <span className="font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent text-lg">
          Cloud Drive
        </span>
      </div>

      {/* User info */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </nav>
  )
}

export default Navbar