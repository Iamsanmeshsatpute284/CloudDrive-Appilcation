import { useState, useEffect } from 'react'
import { getFolderById } from '../services/folderService'

function Breadcrumb({ currentFolder, setCurrentFolder }) {
  const [path, setPath] = useState([])

  useEffect(() => {
    buildPath()
  }, [currentFolder])

  const buildPath = async () => {
    if (!currentFolder) {
      setPath([])
      return
    }

    try {
      const pathItems = []
      let folderId = currentFolder

      while (folderId) {
        const folder = await getFolderById(folderId)
        pathItems.unshift(folder)
        folderId = folder.parent
      }

      setPath(pathItems)
    } catch (error) {
      console.error('Failed to build path', error)
    }
  }

  if (!currentFolder) return null

  return (
    <div className="flex items-center gap-2 text-sm mb-6 flex-wrap bg-white px-4 py-3 rounded-lg border border-gray-200">
      <button
        onClick={() => setCurrentFolder(null)}
        className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer transition-colors"
      >
        My Drive
      </button>

      {path.map((folder, index) => (
        <span key={folder._id} className="flex items-center gap-2">
          <span className="text-gray-400 font-light">/</span>
          {index === path.length - 1 ? (
            <span className="text-gray-700 font-semibold">{folder.name}</span>
          ) : (
            <button
              onClick={() => setCurrentFolder(folder._id)}
              className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium transition-colors"
            >
              {folder.name}
            </button>
          )}
        </span>
      ))}
    </div>
  )
}

export default Breadcrumb