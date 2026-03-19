import axios from 'axios'

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',  // your backend URL
  withCredentials: true,                  // send cookies with every request
})

export default api