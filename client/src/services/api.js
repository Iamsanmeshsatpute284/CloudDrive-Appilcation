import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    // Prevent browser from caching API responses
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
})

export default api