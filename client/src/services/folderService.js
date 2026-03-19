import api from './api'

export const getFolders = async (parentId = null) => {
  const params = parentId ? { parentId } : {}
  const res = await api.get('/folders', { params })
  return res.data.folders
}

export const createFolder = async (name, parentId = null) => {
  const res = await api.post('/folders', { name, parentId })
  return res.data.folder
}

export const renameFolder = async (id, name) => {
  const res = await api.patch(`/folders/${id}`, { name })
  return res.data.folder
}

export const moveFolder = async (id, parentId) => {
  const res = await api.patch(`/folders/move/${id}`, { parentId })
  return res.data.folder
}

export const deleteFolder = async (id) => {
  const res = await api.delete(`/folders/${id}`)
  return res.data
}

export const getFolderById = async (id) => {
  const res = await api.get(`/folders/${id}`)
  return res.data.folder
}

export const getTrashedFolders = async () => {
  const res = await api.get('/folders/trash')
  return res.data.folders
}

export const restoreFolder = async (id) => {
  const res = await api.patch(`/folders/restore/${id}`)
  return res.data
}

export const permanentDeleteFolder = async (id) => {
  const res = await api.delete(`/folders/permanent/${id}`)
  return res.data
}