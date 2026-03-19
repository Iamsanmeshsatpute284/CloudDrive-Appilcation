import api from './api'

export const getFiles = async (folderId = null) => {
  const params = folderId ? { folderId } : {}
  const res = await api.get('/files', { params })
  return res.data.files
}

export const uploadFile = async (file, folderId = null, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  if (folderId) formData.append('folderId', folderId)
  const res = await api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      if (onProgress) onProgress(percent)
    }
  })
  return res.data.file
}

export const renameFile = async (id, name) => {
  const res = await api.patch(`/files/${id}`, { name })
  return res.data.file
}

export const deleteFile = async (id) => {
  const res = await api.delete(`/files/${id}`)
  return res.data
}

export const getTrashedFiles = async () => {
  const res = await api.get('/files/trash')
  return res.data.files
}

export const restoreFile = async (id) => {
  const res = await api.patch(`/files/restore/${id}`)
  return res.data
}

export const toggleStar = async (id) => {
  const res = await api.patch(`/files/star/${id}`)
  return res.data.file
}

export const getStarredFiles = async () => {
  const res = await api.get('/files/starred')
  return res.data.files
}

export const downloadFile = async (id, fileName) => {
  const response = await api.get(`/files/download/${id}`, {
    responseType: 'blob'
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export const searchFiles = async (q) => {
  const res = await api.get('/files/search', { params: { q } })
  return res.data
}

// Permanently delete a file from trash
export const permanentDeleteFile = async (id) => {
  const res = await api.delete(`/files/permanent/${id}`)
  return res.data
}