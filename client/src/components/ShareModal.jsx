import { useState, useEffect } from 'react'
import { createShare, getShares, deleteShare, createLinkShare, getLinks, deleteLinkShare } from '../services/shareService'

function ShareModal({ resource, resourceType, onClose }) {
  const [shares, setShares] = useState([])
  const [links, setLinks] = useState([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('viewer')
  const [expiresAt, setExpiresAt] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState('users') // users | link

  useEffect(() => {
    loadShareData()
  }, [])

  const loadShareData = async () => {
    try {
      const [sharesData, linksData] = await Promise.all([
        getShares(resourceType, resource._id),
        getLinks(resourceType, resource._id)
      ])
      setShares(sharesData)
      setLinks(linksData)
    } catch (err) {
      console.error('Failed to load share data')
    }
  }

  const handleShare = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      await createShare(resourceType, resource._id, email, role)
      setEmail('')
      await loadShareData()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to share')
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (id) => {
    try {
      await deleteShare(id)
      await loadShareData()
    } catch (err) {
      setError('Failed to revoke access')
    }
  }

  const handleCreateLink = async () => {
    setLoading(true)
    setError('')
    try {
      await createLinkShare(
        resourceType,
        resource._id,
        expiresAt || null,
        password || null
      )
      setPassword('')
      setExpiresAt('')
      await loadShareData()
    } catch (err) {
      setError('Failed to create link')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = (token) => {
    const url = `${window.location.origin}/shared/${token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDeleteLink = async (id) => {
    try {
      await deleteLinkShare(id)
      await loadShareData()
    } catch (err) {
      setError('Failed to delete link')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">Share "{resource.name}"</h3>
            <p className="text-xs text-gray-500 mt-1 font-medium">Manage who has access</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-600 cursor-pointer text-xl transition-all">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 bg-gray-50">
          <button
            onClick={() => setTab('users')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${tab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            👤 Share with people
          </button>
          <button
            onClick={() => setTab('link')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${tab === 'link' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            🔗 Public link
          </button>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4 border border-red-200 font-medium">⚠️ {error}</div>
          )}

          {/* Users Tab */}
          {tab === 'users' && (
            <div>
              {/* Add user */}
              <div className="flex gap-3 mb-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  onKeyDown={(e) => e.key === 'Enter' && handleShare()}
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 bg-gray-50 font-medium"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
                <button
                  onClick={handleShare}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Share
                </button>
              </div>

              {/* Current shares */}
              {shares.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">People with access</p>
                  {shares.map((share) => (
                    <div key={share._id} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-100 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                          {share.granteeUserId?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{share.granteeUserId?.name}</p>
                          <p className="text-xs text-gray-500">{share.granteeUserId?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${share.role === 'editor' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                          {share.role}
                        </span>
                        <button
                          onClick={() => handleRevoke(share._id)}
                          className="text-xs text-red-600 hover:text-red-700 cursor-pointer px-3 py-1 hover:bg-red-50 rounded-lg transition-colors font-medium border border-transparent hover:border-red-200"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-4xl mb-2">👤</p>
                  <p className="text-sm font-medium text-gray-600">Not shared with anyone yet</p>
                </div>
              )}
            </div>
          )}

          {/* Link Tab */}
          {tab === 'link' && (
            <div>
              {/* Create link form */}
              <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">Expiry date (optional)</label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">Password (optional)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave empty for no password"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                </div>
                <button
                  onClick={handleCreateLink}
                  disabled={loading}
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  🔗 Generate Link
                </button>
              </div>

              {/* Existing links */}
              {links.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">Active links</p>
                  {links.map((link) => (
                    <div key={link._id} className="p-3 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-100 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {link.passwordHash && <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-semibold border border-yellow-200">🔒 Password</span>}
                          {link.expiresAt && <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-semibold border border-orange-200">⏰ Expires</span>}
                        </div>
                        <button
                          onClick={() => handleDeleteLink(link._id)}
                          className="text-xs text-red-600 hover:text-red-700 cursor-pointer px-3 py-1 hover:bg-red-50 rounded-lg transition-colors font-medium border border-transparent hover:border-red-200"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <input
                          readOnly
                          value={`${window.location.origin}/shared/${link.token}`}
                          className="flex-1 text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-600 outline-none font-mono"
                        />
                        <button
                          onClick={() => handleCopyLink(link.token)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs rounded-lg hover:from-blue-700 hover:to-blue-600 cursor-pointer font-semibold transition-all"
                        >
                          {copied ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ShareModal