import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import api from '../services/api'

function Sidebar({ view, setView }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState(user?.imageUrl || null)
  const fileInputRef = useRef(null)

  const menuItems = [
    { id: 'myDrive',  icon: '📁', label: 'My Drive' },
    { id: 'recent',   icon: '🕐', label: 'Recent' },
    { id: 'starred',  icon: '⭐', label: 'Starred' },
    { id: 'trash',    icon: '🗑️', label: 'Trash' }
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return }
    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const res = await api.post('/auth/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setProfilePhoto(res.data.imageUrl)
    } catch (err) {
      const reader = new FileReader()
      reader.onload = (e) => setProfilePhoto(e.target.result)
      reader.readAsDataURL(file)
    } finally {
      setUploadingPhoto(false)
    }
  }

  return (
    <aside className="w-56 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 h-full flex flex-col justify-between py-6">

      {/* Navigation */}
      <nav className="flex flex-col gap-2 px-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
              transition-all duration-200 cursor-pointer w-full text-left
              ${view === item.id
                ? item.id === 'trash'
                  ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-600 shadow-sm border border-red-200'
                  : 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 shadow-sm border border-blue-200'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }
            `}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom — profile + logout */}
      <div className="px-4 border-t border-gray-200 pt-4">
        <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-gray-100 rounded-lg">
          <div
            className="relative flex-shrink-0 cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
            title="Click to change profile photo"
          >
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-300 shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-md">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-white text-sm">📷</span>
            </div>
            {uploadingPhoto && (
              <div className="absolute inset-0 rounded-full bg-black bg-opacity-60 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-gray-800 truncate">{user?.name}</span>
            <span className="text-xs text-gray-500 truncate">{user?.email}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:shadow-sm transition-all duration-200 cursor-pointer border border-transparent hover:border-red-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar