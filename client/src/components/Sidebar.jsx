import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import api from '../services/api'

// Red trash SVG icon — matches the image provided
function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
    </svg>
  )
}

function Sidebar({ view, setView }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState(user?.imageUrl || null)
  const fileInputRef = useRef(null)

  const menuItems = [
    { id: 'myDrive', icon: '📁', label: 'My Drive' },
    { id: 'starred', icon: '⭐', label: 'Starred' },
    { id: 'trash', icon: <TrashIcon />, label: 'Trash', isComponent: true }
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Handle profile photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Only allow images
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)

      const res = await api.post('/auth/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setProfilePhoto(res.data.imageUrl)
    } catch (err) {
      // If API not ready yet, show local preview
      const reader = new FileReader()
      reader.onload = (e) => setProfilePhoto(e.target.result)
      reader.readAsDataURL(file)
    } finally {
      setUploadingPhoto(false)
    }
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-200 h-full flex flex-col justify-between py-4">

      {/* Top — navigation menu */}
      <nav className="flex flex-col gap-1 px-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`
              flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
              transition-colors cursor-pointer w-full text-left
              ${view === item.id
                ? item.id === 'trash'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-indigo-50 text-indigo-600'
                : 'text-gray-600 hover:bg-gray-100'
              }
            `}
          >
            {/* Icon — either emoji or SVG component */}
            <span className={`text-base ${item.id === 'trash' ? 'text-red-500' : ''}`}>
              {item.isComponent ? item.icon : item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom — user profile + logout */}
      <div className="px-3 border-t border-gray-200 pt-4">

        {/* Profile photo + user info */}
        <div className="flex items-center gap-3 px-2 py-2 mb-2">

          {/* Avatar — clickable to upload photo */}
          <div
            className="relative flex-shrink-0 cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
            title="Click to change profile photo"
          >
            {profilePhoto ? (
              // Show uploaded photo
              <img
                src={profilePhoto}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200"
              />
            ) : (
              // Show initial letter avatar
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Camera overlay on hover */}
            <div className="absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs">📷</span>
            </div>

            {/* Loading spinner */}
            {uploadingPhoto && (
              <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          {/* Name + email */}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-gray-800 truncate">
              {user?.name}
            </span>
            <span className="text-xs text-gray-400 truncate">
              {user?.email}
            </span>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <TrashIcon />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar