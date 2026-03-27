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
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-gray-800 mb-4 text-lg">
          Rename {itemType === 'file' ? '📄' : '📁'} {itemType}
        </h3>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4 border border-red-200 font-medium">{error}</div>
        )}

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          autoFocus
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6 bg-gray-50"
        />

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleRename}
            disabled={loading || !name.trim() || name === item.name}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Renaming...' : 'Rename'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RenameModal