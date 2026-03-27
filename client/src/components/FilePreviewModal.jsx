function FilePreviewModal({ file, onClose }) {
  if (!file) return null

  const baseUrl = 'http://localhost:5000/uploads/'

  const renderPreview = () => {
    const { mimeType, storageKey, name } = file

    // Image preview
    if (mimeType?.startsWith('image/')) {
      return (
        <img
          src={baseUrl + storageKey}
          alt={name}
          className="max-w-full max-h-[70vh] object-contain rounded-lg"
        />
      )
    }

    // PDF preview
    if (mimeType === 'application/pdf') {
      return (
        <iframe
          src={baseUrl + storageKey}
          title={name}
          className="w-full h-[70vh] rounded-lg border-0"
        />
      )
    }

    // Text preview
    if (mimeType === 'text/plain') {
      return (
        <iframe
          src={baseUrl + storageKey}
          title={name}
          className="w-full h-[70vh] rounded-lg border border-gray-200"
        />
      )
    }

    // Video preview
    if (mimeType?.startsWith('video/')) {
      return (
        <video
          src={baseUrl + storageKey}
          controls
          className="max-w-full max-h-[70vh] rounded-lg"
        />
      )
    }

    // Unsupported file type
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
        <span className="text-6xl mb-4">📎</span>
        <p className="text-gray-500 font-medium">Preview not available</p>
        <p className="text-sm text-gray-400 mt-1">
          This file type cannot be previewed
        </p>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal box */}
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {file.mimeType?.startsWith('image/') ? '🖼️' :
               file.mimeType === 'application/pdf' ? '📄' :
               file.mimeType?.startsWith('video/') ? '🎥' : '📎'}
            </span>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">{file.name}</h3>
              <p className="text-xs text-gray-500 font-medium">{file.mimeType}</p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-600 hover:text-gray-800 cursor-pointer text-xl transition-all duration-200 font-light"
          >
            ✕
          </button>
        </div>

        {/* Preview area */}
        <div className="p-6 overflow-auto bg-white">
          {renderPreview()}
        </div>
      </div>
    </div>
  )
}

export default FilePreviewModal