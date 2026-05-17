import api from './api.js'

export async function listEngineersApi() {
  const res = await api.get('/admin/engineers')
  return res.data
}

export async function createEngineerApi(payload) {
  const res = await api.post('/admin/engineers', payload)
  return res.data
}

export async function updateEngineerApi(id, payload) {
  const res = await api.put(`/admin/engineers/${id}`, payload)
  return res.data
}

export async function deleteEngineerApi(id) {
  const res = await api.delete(`/admin/engineers/${id}`)
  return res.data
}
