// src/services/api.js
import axios from 'axios'

const api = axios.create({
  // In dev, Vite proxy will forward /api → http://localhost:5771
  // In prod, set VITE_API_BASE_URL (e.g. http://localhost:5771/api)
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
})

export default api

