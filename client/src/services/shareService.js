import api from './api'

export const createShare = async (resourceType, resourceId, granteeEmail, role = 'viewer') => {
  const res = await api.post('/shares', { resourceType, resourceId, granteeEmail, role })
  return res.data
}

export const getShares = async (resourceType, resourceId) => {
  const res = await api.get(`/shares/${resourceType}/${resourceId}`)
  return res.data.shares
}

export const deleteShare = async (id) => {
  const res = await api.delete(`/shares/${id}`)
  return res.data
}

export const createLinkShare = async (resourceType, resourceId, expiresAt = null, password = null) => {
  const res = await api.post('/shares/links', { resourceType, resourceId, expiresAt, password })
  return res.data
}

export const getLinks = async (resourceType, resourceId) => {
  const res = await api.get(`/shares/links/${resourceType}/${resourceId}`)
  return res.data.links
}

export const deleteLinkShare = async (id) => {
  const res = await api.delete(`/shares/links/${id}`)
  return res.data
}