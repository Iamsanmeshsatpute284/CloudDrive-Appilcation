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
    <div className="flex items-center gap-1 text-sm mb-4 flex-wrap">
      <button
        onClick={() => setCurrentFolder(null)}
        className="text-indigo-600 hover:underline font-medium cursor-pointer"
      >
        My Drive
      </button>

      {path.map((folder, index) => (
        <span key={folder._id} className="flex items-center gap-1">
          <span className="text-gray-400">›</span>
          {index === path.length - 1 ? (
            <span className="text-gray-700 font-medium">{folder.name}</span>
          ) : (
            <button
              onClick={() => setCurrentFolder(folder._id)}
              className="text-indigo-600 hover:underline cursor-pointer"
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