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
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="font-semibold text-gray-800">Share "{resource.name}"</h3>
            <p className="text-xs text-gray-400 mt-0.5">Manage who has access</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setTab('users')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors cursor-pointer ${tab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            👤 Share with people
          </button>
          <button
            onClick={() => setTab('link')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors cursor-pointer ${tab === 'link' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            🔗 Public link
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>
          )}

          {/* Users Tab */}
          {tab === 'users' && (
            <div>
              {/* Add user */}
              <div className="flex gap-2 mb-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleShare()}
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none cursor-pointer"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
                <button
                  onClick={handleShare}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 cursor-pointer disabled:opacity-50"
                >
                  Share
                </button>
              </div>

              {/* Current shares */}
              {shares.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">People with access</p>
                  {shares.map((share) => (
                    <div key={share._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold">
                          {share.granteeUserId?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">{share.granteeUserId?.name}</p>
                          <p className="text-xs text-gray-400">{share.granteeUserId?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${share.role === 'editor' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {share.role}
                        </span>
                        <button
                          onClick={() => handleRevoke(share._id)}
                          className="text-xs text-red-500 hover:text-red-700 cursor-pointer px-2 py-1 hover:bg-red-50 rounded-lg"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-3xl mb-2">👤</p>
                  <p className="text-sm">Not shared with anyone yet</p>
                </div>
              )}
            </div>
          )}

          {/* Link Tab */}
          {tab === 'link' && (
            <div>
              {/* Create link form */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Expiry date (optional)</label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Password (optional)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave empty for no password"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={handleCreateLink}
                  disabled={loading}
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 cursor-pointer disabled:opacity-50"
                >
                  🔗 Generate Link
                </button>
              </div>

              {/* Existing links */}
              {links.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Active links</p>
                  {links.map((link) => (
                    <div key={link._id} className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {link.passwordHash && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">🔒 Password</span>}
                          {link.expiresAt && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">⏰ Expires</span>}
                        </div>
                        <button
                          onClick={() => handleDeleteLink(link._id)}
                          className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          readOnly
                          value={`${window.location.origin}/shared/${link.token}`}
                          className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-gray-500 outline-none"
                        />
                        <button
                          onClick={() => handleCopyLink(link.token)}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 cursor-pointer"
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