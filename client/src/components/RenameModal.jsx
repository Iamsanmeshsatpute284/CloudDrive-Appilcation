import { useState } from 'react'

function RenameModal({ item, itemType, onRename, onClose }) {
  const [name, setName] = useState(item.name)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRename = async () => {
    if (!name.trim() || name === item.name) return
    setLoading(true)
    setError('')
    try {
      await onRename(item._id, name.trim())
      onClose()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Rename failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-gray-800 mb-4">
          Rename {itemType === 'file' ? '📄' : '📁'} {itemType}
        </h3>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-3">{error}</div>
        )}

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          autoFocus
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
        />

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleRename}
            disabled={loading || !name.trim() || name === item.name}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Renaming...' : 'Rename'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RenameModal