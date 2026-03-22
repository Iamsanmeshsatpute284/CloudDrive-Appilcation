import { useState, useEffect, useRef } from 'react'
import { getRecentFiles, deleteFile, toggleStar, downloadFile, renameFile } from '../services/fileService'
import FilePreviewModal from './FilePreviewModal'
import ShareModal from './ShareModal'
import RenameModal from './RenameModal'

const BACKEND_URL = 'http://localhost:5000'

const getFileIcon = (mimeType) => {
  if (mimeType?.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType?.startsWith('video/')) return '🎥'
  return '📎'
}

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return new Date(date).toLocaleDateString()
}

// ─── Thumbnail Component ───
// Shows actual image preview if thumbnail exists
// Falls back to emoji if no thumbnail or image fails to load
function FileThumb({ file, size = 'sm' }) {
  const [imgError, setImgError] = useState(false)
  const thumbnailUrl = file.thumbnailKey
    ? `${BACKEND_URL}/thumbnails/${file.thumbnailKey}`
    : null

  const sizeClass = size === 'sm'
    ? 'w-10 h-10'    // small — for list view
    : 'w-20 h-20'    // large — for grid view

  const iconSize = size === 'sm' ? 'text-2xl' : 'text-5xl'

  if (thumbnailUrl && !imgError) {
    return (
      <img
        src={thumbnailUrl}
        alt={file.name}
        onError={() => setImgError(true)}
        className={`${sizeClass} object-cover rounded-lg border border-gray-100 flex-shrink-0`}
      />
    )
  }

  // Fallback emoji
  return <span className={`${iconSize} flex-shrink-0`}>{getFileIcon(file.mimeType)}</span>
}

// ─── 3-dot Menu ───
function KebabMenu({ options }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(p => !p) }}
        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M4.5 12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-lg border border-gray-200 z-30 overflow-hidden">
          {options.map((opt, i) => (
            <div key={i}>
              {opt.divider
                ? <div className="h-px bg-gray-100" />
                : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpen(false); opt.onClick() }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer transition-colors
                      ${opt.danger ? 'text-red-600 hover:bg-red-50'
                      : opt.color === 'green' ? 'text-green-600 hover:bg-green-50'
                      : opt.color === 'yellow' ? 'text-yellow-600 hover:bg-yellow-50'
                      : opt.color === 'blue' ? 'text-blue-600 hover:bg-blue-50'
                      : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <span>{opt.icon}</span>{opt.label}
                  </button>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RecentView() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [previewFile, setPreviewFile] = useState(null)
  const [shareItem, setShareItem] = useState(null)
  const [renameItem, setRenameItem] = useState(null)

  useEffect(() => { loadRecent() }, [])

  const loadRecent = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getRecentFiles()
      setFiles(data)
    } catch (err) {
      setError('Failed to load recent files')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Fixed star — updates local state immediately for instant feedback
  // then reloads from server to get accurate data
  const handleToggleStar = async (e, file) => {
    e.stopPropagation()
    try {
      // Optimistic update — flip star immediately in UI
      setFiles(prev => prev.map(f =>
        f._id === file._id ? { ...f, isStarred: !f.isStarred } : f
      ))
      // Call API
      await toggleStar(file._id)
      // Reload to confirm
      await loadRecent()
    } catch (err) {
      setError('Failed to star file')
      await loadRecent() // revert on error
    }
  }

  const handleDelete = async (id) => {
    try { await deleteFile(id); await loadRecent() }
    catch (err) { setError('Failed to delete') }
  }

  const handleDownload = async (id, name) => {
    try { await downloadFile(id, name) }
    catch (err) { setError('Download failed') }
  }

  const handleRename = async (id, name) => {
    await renameFile(id, name)
    await loadRecent()
  }

  return (
    <div>
      {/* Modals */}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
      {shareItem && (
        <ShareModal resource={shareItem} resourceType="file" onClose={() => setShareItem(null)} />
      )}
      {renameItem && (
        <RenameModal
          item={renameItem}
          itemType="file"
          onRename={handleRename}
          onClose={() => setRenameItem(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">🕐 Recent</h2>
          <p className="text-sm text-gray-400 mt-0.5">Your last 20 uploaded files</p>
        </div>
        {files.length > 0 && (
          <span className="text-sm text-gray-400">{files.length} files</span>
        )}
      </div>

      {/* Thumbnail explanation banner */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 bg-indigo-50 px-4 py-2 rounded-lg">
        <span>📸</span>
        <span>Image files show <strong className="text-indigo-600">real thumbnails</strong> — auto-generated when you upload</span>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-gray-200 rounded-2xl">
          <span className="text-6xl mb-4">🕐</span>
          <p className="text-gray-500 font-medium">No recent files</p>
          <p className="text-gray-400 text-sm mt-1">Files you upload will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <div className="col-span-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</div>
            <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Size</div>
            <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</div>
            <div className="col-span-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Uploaded</div>
          </div>

          {/* File rows */}
          {files.map((file, index) => (
            <div
              key={file._id}
              onClick={() => setPreviewFile(file)}
              className={`
                grid grid-cols-12 gap-4 px-4 py-3 items-center cursor-pointer
                hover:bg-indigo-50 transition-colors
                ${index !== files.length - 1 ? 'border-b border-gray-100' : ''}
              `}
            >
              {/* Name + thumbnail */}
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                {/* Thumbnail or emoji */}
                <FileThumb file={file} size="sm" />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                  {/* Show thumbnail indicator */}
                  {file.thumbnailKey && (
                    <span className="text-xs text-indigo-400">📸 has thumbnail</span>
                  )}
                  {file.isStarred && !file.thumbnailKey && (
                    <span className="text-xs text-yellow-500">⭐ starred</span>
                  )}
                </div>
              </div>

              {/* Size */}
              <div className="col-span-2 text-sm text-gray-400">
                {formatSize(file.sizeBytes)}
              </div>

              {/* Type badge */}
              <div className="col-span-2">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {file.mimeType?.split('/')[1]?.toUpperCase()?.slice(0, 6) || 'FILE'}
                </span>
              </div>

              {/* Time + star + 3-dot */}
              <div className="col-span-3 flex items-center justify-between gap-2">
                <span className="text-sm text-gray-400 flex-shrink-0">
                  {timeAgo(file.createdAt)}
                </span>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {/* Quick star button */}
                  <button
                    onClick={(e) => handleToggleStar(e, file)}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-yellow-50 cursor-pointer text-sm"
                    title={file.isStarred ? 'Unstar' : 'Star'}
                  >
                    {file.isStarred ? '⭐' : '☆'}
                  </button>

                  {/* 3-dot menu */}
                  <KebabMenu options={[
                    { icon: '👁️', label: 'Preview', onClick: () => setPreviewFile(file) },
                    { icon: '✏️', label: 'Rename', onClick: () => setRenameItem(file) },
                    { icon: '🔗', label: 'Share', color: 'green', onClick: () => setShareItem(file) },
                    { icon: file.isStarred ? '⭐' : '☆', label: file.isStarred ? 'Unstar' : 'Star', color: 'yellow', onClick: () => handleToggleStar({ stopPropagation: () => {} }, file) },
                    { icon: '⬇️', label: 'Download', color: 'blue', onClick: () => handleDownload(file._id, file.name) },
                    { divider: true },
                    { icon: '🗑️', label: 'Delete', danger: true, onClick: () => handleDelete(file._id) }
                  ]} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RecentView