import api from './api'

export const getActivities = async () => {
  const res = await api.get('/activities')
  return res.data.activities
}