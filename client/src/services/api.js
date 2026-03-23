import axios from 'axios'

const api = axios.create({
  baseURL: 'https://clouddrive-appilcation.onrender.com/api',
  withCredentials: true,
  headers: {
    // Prevent browser from caching API responses
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
})

export default api