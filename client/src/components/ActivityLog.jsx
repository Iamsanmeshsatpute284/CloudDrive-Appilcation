import { useState, useEffect } from 'react'
import { getActivities } from '../services/activityService'

// Map action to icon and color
const actionConfig = {
  upload:        { icon: '⬆️', label: 'Uploaded',       color: 'text-green-600 bg-green-50' },
  download:      { icon: '⬇️', label: 'Downloaded',     color: 'text-blue-600 bg-blue-50' },
  delete:        { icon: '🗑️', label: 'Deleted',        color: 'text-red-600 bg-red-50' },
  restore:       { icon: '↩️', label: 'Restored',       color: 'text-purple-600 bg-purple-50' },
  rename:        { icon: '✏️', label: 'Renamed',        color: 'text-yellow-600 bg-yellow-50' },
  move:          { icon: '📦', label: 'Moved',          color: 'text-orange-600 bg-orange-50' },
  share:         { icon: '🔗', label: 'Shared',         color: 'text-indigo-600 bg-indigo-50' },
  create_folder: { icon: '📁', label: 'Created folder', color: 'text-teal-600 bg-teal-50' }
}

// Format time ago
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function ActivityLog({ onClose }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      const data = await getActivities()
      setActivities(data)
    } catch (err) {
      console.error('Failed to load activities')
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">📋 Activity Log</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer">✕</button>
        </div>

        {/* Activity list */}
        <div className="overflow-auto flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-400">Loading...</div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map((activity) => {
                const config = actionConfig[activity.action] || { icon: '•', label: activity.action, color: 'text-gray-600 bg-gray-50' }
                return (
                  <div key={activity._id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    {/* Action icon */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 ${config.color}`}>
                      {config.icon}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{config.label}</span>{' '}
                        <span className="text-gray-500 truncate">"{activity.resourceName}"</span>
                      </p>

                      {/* Show rename context */}
                      {activity.context?.oldName && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {activity.context.oldName} → {activity.context.newName}
                        </p>
                      )}

                      {/* Show share context */}
                      {activity.context?.sharedWith && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Shared with {activity.context.sharedWith} as {activity.context.role}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(activity.createdAt)}</p>
                    </div>

                    {/* Resource type badge */}
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {activity.resourceType === 'file' ? '📄' : '📁'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ActivityLog