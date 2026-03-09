import axios from 'axios'

// All /api/* calls are proxied to http://localhost:5105 by vite.config.js
const api = axios.create({
  baseURL: '/',
})

// Attach JWT token automatically on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('so_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('so_token')
      localStorage.removeItem('so_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
