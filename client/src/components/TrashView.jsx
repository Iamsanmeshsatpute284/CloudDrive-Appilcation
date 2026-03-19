import { useState, useEffect, useRef } from 'react'
import { getTrashedFiles, restoreFile, permanentDeleteFile } from '../services/fileService'
import { getTrashedFolders, restoreFolder, permanentDeleteFolder } from '../services/folderService'

const getDaysRemaining = (deletedAt) => {
  if (!deletedAt) return 30
  const deleted = new Date(deletedAt)
  const purgeDate = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000)
  const diff = Math.ceil((purgeDate - new Date()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

const getDaysColor = (days) => {
  if (days <= 3) return 'text-red-600 bg-red-50'
  if (days <= 7) return 'text-orange-600 bg-orange-50'
  return 'text-gray-500 bg-gray-100'
}

const formatSize = (bytes) => {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const getFileIcon = (mimeType) => {
  if (mimeType?.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType?.startsWith('video/')) return '🎥'
  return '📎'
}

// 3-dot dropdown menu component
function KebabMenu({ onRestore, onDelete }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={menuRef}>
      {/* 3-dot trigger button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen(prev => !prev)
        }}
        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
        title="More options"
      >
        {/* Vertical 3 dots SVG */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M4.5 12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-lg border border-gray-200 z-30 overflow-hidden">
          {/* Restore option */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              onRestore()
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
              <path fillRule="evenodd" d="M9.53 2.47a.75.75 0 010 1.06L4.81 8.25H15a6.75 6.75 0 010 13.5h-3a.75.75 0 010-1.5h3a5.25 5.25 0 100-10.5H4.81l4.72 4.72a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 011.06 0z" clipRule="evenodd" />
            </svg>
            Restore
          </button>

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* Delete forever option */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              onDelete()
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
              <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
            </svg>
            Delete forever
          </button>
        </div>
      )}
    </div>
  )
}

function TrashView() {
  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => { loadTrash() }, [])

  const loadTrash = async () => {
    setLoading(true)
    try {
      const [filesData, foldersData] = await Promise.all([
        getTrashedFiles(),
        getTrashedFolders()
      ])
      setFiles(filesData)
      setFolders(foldersData)
    } catch (err) {
      setError('Failed to load trash')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (id, type) => {
    try {
      if (type === 'file') await restoreFile(id)
      else await restoreFolder(id)
      await loadTrash()
    } catch (err) {
      setError('Failed to restore')
    }
  }

  const handlePermanentDelete = async () => {
    if (!confirmDelete) return
    try {
      if (confirmDelete.type === 'file') await permanentDeleteFile(confirmDelete.item._id)
      else await permanentDeleteFolder(confirmDelete.item._id)
      setConfirmDelete(null)
      await loadTrash()
    } catch (err) {
      setError('Failed to permanently delete')
    }
  }

  const totalItems = files.length + folders.length

  // Reusable card — clean with 3-dot menu in top right
  const TrashCard = ({ item, type }) => {
    const daysLeft = getDaysRemaining(item.deletedAt)
    const daysColor = getDaysColor(daysLeft)

    return (
      <div className="relative flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">

        {/* 3-dot menu — top right corner */}
        <div className="absolute top-3 right-3 z-10">
          <KebabMenu
            onRestore={() => handleRestore(item._id, type)}
            onDelete={() => setConfirmDelete({ item, type })}
          />
        </div>

        {/* File/Folder info */}
        <div className="flex flex-col items-center gap-2 px-5 pt-8 pb-5">
          <span className="text-5xl">
            {type === 'folder' ? '📁' : getFileIcon(item.mimeType)}
          </span>

          <span className="text-sm font-medium text-gray-700 text-center break-words w-full">
            {item.name}
          </span>

          {type === 'file' && (
            <span className="text-xs text-gray-400">{formatSize(item.sizeBytes)}</span>
          )}
          {type === 'folder' && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Folder</span>
          )}

          {/* Days remaining badge */}
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${daysColor}`}>
            {daysLeft === 0 ? '⚠️ Deletes today!'
              : daysLeft === 1 ? '⚠️ 1 day left'
              : `🕐 ${daysLeft} days left`}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">🗑️ Trash</h2>
        {totalItems > 0 && (
          <span className="text-sm text-gray-400">{totalItems} item{totalItems > 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
        <span className="text-amber-500 text-base mt-0.5">⚠️</span>
        <div>
          <p className="text-sm font-medium text-amber-800">Files and folders auto-delete after 30 days</p>
          <p className="text-xs text-amber-600 mt-0.5">Click the ••• menu on any item to restore or delete forever</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
      )}

      {/* Confirm permanent delete modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Permanently Delete?</h3>
                <p className="text-xs text-gray-400">This cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-2 bg-gray-50 rounded-lg px-3 py-2">
              "{confirmDelete.item.name}" will be permanently deleted.
            </p>

            {confirmDelete.type === 'folder' && (
              <p className="text-xs text-red-500 mb-2 px-1">
                ⚠️ All files inside this folder will also be deleted!
              </p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium cursor-pointer"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
      ) : totalItems === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-gray-200 rounded-2xl">
          <span className="text-6xl mb-4">🗑️</span>
          <p className="text-gray-500 font-medium">Trash is empty</p>
          <p className="text-gray-400 text-sm mt-1">Deleted files and folders appear here</p>
        </div>
      ) : (
        <>
          {folders.length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Folders ({folders.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {folders.map(folder => (
                  <TrashCard key={folder._id} item={folder} type="folder" />
                ))}
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Files ({files.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {files.map(file => (
                  <TrashCard key={file._id} item={file} type="file" />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default TrashView