import api from './api.js'

export async function registerOperatorApi(payload) {
  // Backend expects a User-like object; role/approved are set server-side.
  // Required: username, password. Optional: name, email, phone, department, designation.
  const res = await api.post('/auth/register', payload)
  return res.data
}

export async function loginApi(payload) {
  // Backend expects: { username, password }
  const res = await api.post('/auth/login', payload)
  return res.data
}

