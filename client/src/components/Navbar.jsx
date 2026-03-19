import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="flex items-center px-6 h-16 bg-white border-b border-gray-200 shadow-sm">
      {/* Logo only */}
      <div className="flex items-center gap-2 text-xl">
        ☁️
        <span className="font-bold text-indigo-600 text-lg">Cloud Drive</span>
      </div>
    </nav>
  )
}

export default Navbar