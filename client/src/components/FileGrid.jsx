import { useState, useEffect, useCallback, useRef } from 'react'
import { getFolders, createFolder, deleteFolder, renameFolder as renameFolderAPI } from '../services/folderService'
import {
  getFiles,
  uploadFile,
  deleteFile,
  renameFile as renameFileAPI,
  toggleStar,
  getStarredFiles,
  downloadFile,
  searchFiles
} from '../services/fileService'
import Breadcrumb from './Breadcrumb'
import FilePreviewModal from './FilePreviewModal'
import ShareModal from './ShareModal'
import RenameModal from './RenameModal'
import ActivityLog from './ActivityLog'

const BACKEND_URL = 'http://localhost:5000'

const getThumbnailUrl = (file) => {
  if (file.thumbnailKey) return `${BACKEND_URL}/thumbnails/${file.thumbnailKey}`
  return null
}

const getFileIcon = (mimeType) => {
  if (mimeType?.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType?.startsWith('video/')) return '🎥'
  return '📎'
}

function FileThumb({ file }) {
  const thumbnailUrl = getThumbnailUrl(file)
  const [imgError, setImgError] = useState(false)
  if (thumbnailUrl && !imgError) {
    return (
      <img
        src={thumbnailUrl}
        alt={file.name}
        onError={() => setImgError(true)}
        className="w-24 h-24 object-cover rounded-xl border border-gray-100 shadow-sm mt-2"
      />
    )
  }
  return <span className="text-6xl mt-2">{getFileIcon(file.mimeType)}</span>
}

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
        onClick={(e) => { e.stopPropagation(); setOpen(prev => !prev) }}
        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M4.5 12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-lg border border-gray-200 z-30 overflow-hidden">
          {options.map((opt, i) => (
            <div key={i}>
              {opt.divider ? (
                <div className="h-px bg-gray-100" />
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setOpen(false); opt.onClick() }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors cursor-pointer
                    ${opt.danger ? 'text-red-600 hover:bg-red-50'
                    : opt.color === 'green' ? 'text-green-600 hover:bg-green-50'
                    : opt.color === 'yellow' ? 'text-yellow-600 hover:bg-yellow-50'
                    : opt.color === 'blue' ? 'text-blue-600 hover:bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="text-base">{opt.icon}</span>
                  {opt.label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FileGrid({ currentFolder, setCurrentFolder, view }) {
  const [folders, setFolders] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadingFiles, setUploadingFiles] = useState([])
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)

  const [previewFile, setPreviewFile] = useState(null)
  const [shareItem, setShareItem] = useState(null)
  const [shareItemType, setShareItemType] = useState(null)
  const [renameItem, setRenameItem] = useState(null)
  const [renameItemType, setRenameItemType] = useState(null)
  const [showActivity, setShowActivity] = useState(false)

  useEffect(() => { loadContents() }, [currentFolder, view])

  const loadContents = async () => {
    setLoading(true)
    setError('')
    setFolders([])
    setFiles([])
    setSearchQuery('')
    setIsSearching(false)
    try {
      if (view === 'myDrive') {
        const [foldersData, filesData] = await Promise.all([
          getFolders(currentFolder),
          getFiles(currentFolder)
        ])
        setFolders(foldersData)
        setFiles(filesData)
      } else if (view === 'starred') {
        const filesData = await getStarredFiles()
        setFiles(filesData)
      }
    } catch (err) {
      setError('Failed to load contents')
    } finally {
      setLoading(false)
    }
  }

  // ── Drag & Drop ──
  const handleDragEnter = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    setDragCounter(prev => prev + 1)
    if (e.dataTransfer.items?.length > 0) setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    setDragCounter(prev => { const n = prev - 1; if (n === 0) setIsDragging(false); return n })
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop = useCallback(async (e) => {
    e.preventDefault(); e.stopPropagation()
    setIsDragging(false); setDragCounter(0)
    if (view !== 'myDrive') return
    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length === 0) return
    await uploadMultiple(droppedFiles)
  }, [view, currentFolder])

  const uploadMultiple = async (fileList) => {
    setUploadingFiles(fileList.map(f => ({ name: f.name, progress: 0 })))
    setError('')
    for (let i = 0; i < fileList.length; i++) {
      try {
        await uploadFile(fileList[i], currentFolder, (progress) => {
          setUploadingFiles(prev => prev.map((f, idx) => idx === i ? { ...f, progress } : f))
        })
      } catch (err) {
        setError(`Failed to upload ${fileList[i].name}`)
      }
    }
    setUploadingFiles([])
    await loadContents()
  }

  const handleUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files)
    if (selectedFiles.length === 0) return
    await uploadMultiple(selectedFiles)
    e.target.value = ''
  }

  const handleSearch = async (e) => {
    const q = e.target.value
    setSearchQuery(q)
    if (!q.trim()) { setIsSearching(false); loadContents(); return }
    setIsSearching(true)
    try {
      const { searchFiles: searchFn } = await import('../services/fileService')
      const results = await searchFn(q)
      setFolders(results.folders)
      setFiles(results.files)
    } catch (err) { setError('Search failed') }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      await createFolder(newFolderName.trim(), currentFolder)
      setNewFolderName(''); setShowNewFolder(false)
      await loadContents()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create folder')
    }
  }

  // ── File actions ──
  const handleDeleteFolder = async (id) => {
    try { await deleteFolder(id); await loadContents() }
    catch (err) { setError('Failed to delete folder') }
  }

  const handleDeleteFile = async (id) => {
    try { await deleteFile(id); await loadContents() }
    catch (err) { setError('Failed to delete file') }
  }

  const handleToggleStar = async (fileId) => {
    try {
      await toggleStar(fileId)
      await loadContents()
    } catch (err) {
      setError('Failed to star file')
      console.error('Star error:', err)
    }
  }

  const handleDownload = async (id, name) => {
    try { await downloadFile(id, name) }
    catch (err) { setError('Download failed') }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div
      className="relative min-h-full"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && view === 'myDrive' && (
        <div className="fixed inset-0 z-40 bg-indigo-500 bg-opacity-20 border-4 border-dashed border-indigo-500 rounded-2xl flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl px-12 py-10 flex flex-col items-center gap-4">
            <span className="text-7xl animate-bounce">📂</span>
            <p className="text-2xl font-bold text-indigo-600">Drop files to upload</p>
            <p className="text-gray-400 text-sm">Release to start uploading</p>
          </div>
        </div>
      )}

      {/* Modals */}
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
      {shareItem && <ShareModal resource={shareItem} resourceType={shareItemType} onClose={() => setShareItem(null)} />}
      {renameItem && (
        <RenameModal
          item={renameItem}
          itemType={renameItemType}
          onRename={async (id, name) => {
            if (renameItemType === 'file') await renameFileAPI(id, name)
            else await renameFolderAPI(id, name)
            await loadContents()
          }}
          onClose={() => setRenameItem(null)}
        />
      )}
      {showActivity && <ActivityLog onClose={() => setShowActivity(false)} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {view === 'myDrive' && !isSearching && '📁 My Drive'}
          {view === 'starred' && '⭐ Starred'}
          {isSearching && `🔍 Results for "${searchQuery}"`}
        </h2>
        <div className="flex gap-3">
          <button onClick={() => setShowActivity(true)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 hover:shadow-md transition-all cursor-pointer font-medium">
            📋 Activity
          </button>
          {view === 'myDrive' && (
            <>
              <button onClick={() => setShowNewFolder(true)} className="flex items-center gap-2 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 hover:shadow-md transition-all cursor-pointer">
                📁 New Folder
              </button>
              <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-600 hover:shadow-lg transition-all cursor-pointer">
                ↑ Upload File
                <input type="file" onChange={handleUpload} className="hidden" multiple />
              </label>
            </>
          )}
        </div>
      </div>

      {/* Drag hint */}
      {view === 'myDrive' && (
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-4 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 rounded-lg border border-blue-200">
          <span>💡</span>
          <span>You can <strong className="text-blue-600 font-semibold">drag & drop files</strong> anywhere to upload. Images show real thumbnails!</span>
        </div>
      )}

      {/* Search */}
      {view === 'myDrive' && (
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search files and folders..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
          />
        </div>
      )}

      {/* Breadcrumb */}
      {view === 'myDrive' && !isSearching && (
        <Breadcrumb currentFolder={currentFolder} setCurrentFolder={setCurrentFolder} />
      )}

      {/* Upload progress */}
      {uploadingFiles.length > 0 && (
        <div className="mb-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-5 space-y-4 shadow-sm">
          <p className="text-sm font-semibold text-blue-900">
            📤 Uploading {uploadingFiles.length} file{uploadingFiles.length > 1 ? 's' : ''}...
          </p>
          {uploadingFiles.map((f, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs text-blue-700 mb-2">
                <span className="truncate max-w-xs font-medium">{f.name}</span>
                <span className="font-semibold">{f.progress}%</span>
              </div>
              <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300" style={{ width: `${f.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New folder input */}
      {showNewFolder && view === 'myDrive' && (
        <div className="flex gap-3 items-center mb-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            className="flex-1 border border-blue-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
          <button onClick={handleCreateFolder} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-600 cursor-pointer transition-all shadow-md">Create</button>
          <button onClick={() => setShowNewFolder(false)} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-100 cursor-pointer font-medium transition-all">Cancel</button>
        </div>
      )}

      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4 border border-red-200 font-medium shadow-sm">❌ {error}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
      ) : (
        <>
          {/* Folders */}
          {folders.length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Folders</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {folders.map((folder) => (
                  <div
                    key={folder._id}
                    onClick={() => setCurrentFolder(folder._id)}
                    className="relative flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-gray-200 cursor-pointer hover:shadow-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                  >
                    <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                      <KebabMenu options={[
                        { icon: '✏️', label: 'Rename', onClick: () => { setRenameItem(folder); setRenameItemType('folder') } },
                        { icon: '🔗', label: 'Share', color: 'green', onClick: () => { setShareItem(folder); setShareItemType('folder') } },
                        { divider: true },
                        { icon: '🗑️', label: 'Delete', danger: true, onClick: () => handleDeleteFolder(folder._id) }
                      ]} />
                    </div>
                    <span className="text-4xl mt-3">📁</span>
                    <span className="text-xs font-medium text-gray-700 text-center break-words w-full">{folder.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {files.length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Files</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {files.map((file) => (
                  <div
                    key={file._id}
                    onClick={() => setPreviewFile(file)}
                    className="relative flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 min-h-[180px] cursor-pointer"
                  >
                    <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                      <KebabMenu options={[
                        { icon: '👁️', label: 'Preview', onClick: () => setPreviewFile(file) },
                        { icon: '✏️', label: 'Rename', onClick: () => { setRenameItem(file); setRenameItemType('file') } },
                        { icon: '🔗', label: 'Share', color: 'green', onClick: () => { setShareItem(file); setShareItemType('file') } },
                        {
                          icon: file.isStarred ? '⭐' : '☆',
                          label: file.isStarred ? 'Unstar' : 'Star',
                          color: 'yellow',
                          onClick: () => handleToggleStar(file._id)
                        },
                        { icon: '⬇️', label: 'Download', color: 'blue', onClick: () => handleDownload(file._id, file.name) },
                        { divider: true },
                        { icon: '🗑️', label: 'Delete', danger: true, onClick: () => handleDeleteFile(file._id) }
                      ]} />
                    </div>

                    <FileThumb file={file} />
                    <span className="text-sm font-semibold text-gray-700 text-center break-words w-full px-2">{file.name}</span>
                    <span className="text-xs text-gray-400">{formatSize(file.sizeBytes)}</span>

                    {file.isStarred && (
                      <span className="absolute bottom-2 left-3 text-sm">⭐</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {folders.length === 0 && files.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-gray-200 rounded-2xl">
              <span className="text-6xl mb-4">{view === 'starred' ? '⭐' : isSearching ? '🔍' : '📂'}</span>
              <p className="text-gray-500 font-medium">
                {view === 'starred' && 'No starred files yet'}
                {view === 'myDrive' && !isSearching && 'Drop files here or click Upload'}
                {isSearching && `No results for "${searchQuery}"`}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {view === 'starred' && 'Click ⋯ on any file → Star'}
                {view === 'myDrive' && !isSearching && 'Drag & drop files anywhere on this page'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default FileGrid