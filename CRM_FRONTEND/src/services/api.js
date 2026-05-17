// src/services/api.js
import axios from 'axios'

function resolveBaseURL() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
    return 'http://127.0.0.1:5771/api'
  }
  return '/api'
}

const api = axios.create({
  baseURL: resolveBaseURL(),
})

export default api

