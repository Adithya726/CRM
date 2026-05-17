import api from './api.js'

// Backend endpoints:
// Admin:
//   GET    /admin/customers
//   POST   /admin/customers
//   PUT    /admin/customers/{id}
//   DELETE /admin/customers/{id}
// Operator (read-only):
//   GET    /operator/customers
//   GET    /operator/customers/{id}

export async function listAdminCustomersApi() {
  const res = await api.get('/admin/customers')
  return res.data
}

export async function createCustomerApi(payload) {
  const res = await api.post('/admin/customers', payload)
  return res.data
}

export async function updateCustomerApi(id, payload) {
  const res = await api.put(`/admin/customers/${id}`, payload)
  return res.data
}

export async function deleteCustomerApi(id) {
  const res = await api.delete(`/admin/customers/${id}`)
  return res.data
}

export async function listOperatorCustomersApi() {
  const res = await api.get('/operator/customers')
  return res.data
}

export async function getOperatorCustomerByIdApi(id) {
  const res = await api.get(`/operator/customers/${id}`)
  return res.data
}

export async function searchOperatorCustomersApi(q) {
  const res = await api.get('/operator/customers/search', { params: { q } })
  return res.data
}

