import api from './api.js'

// Backend endpoints:
// Admin:
//   GET    /admin/contracts
//   POST   /admin/contracts
//   PUT    /admin/contracts/{id}
//   DELETE /admin/contracts/{id}
//   GET    /admin/contracts/customer/{customerId}
// Operator (read-only):
//   GET    /operator/contracts
//   GET    /operator/contracts/{id}
//   GET    /operator/contracts/customer/{customerId}

export async function listAdminContractsApi() {
  const res = await api.get('/admin/contracts')
  return res.data
}

export async function createContractApi(payload) {
  const res = await api.post('/admin/contracts', payload)
  return res.data
}

export async function updateContractApi(id, payload) {
  const res = await api.put(`/admin/contracts/${id}`, payload)
  return res.data
}

export async function deleteContractApi(id, closeRemark = '') {
  const res = await api.delete(`/admin/contracts/${id}`, { params: { closeRemark } })
  return res.data
}

export async function listAdminContractsByCustomerApi(customerId) {
  const res = await api.get(`/admin/contracts/customer/${customerId}`)
  return res.data
}

export async function listAdminActiveContractsByCustomerApi(customerId) {
  const res = await api.get(`/admin/contracts/customer/${customerId}/active`)
  return res.data
}

export async function listOperatorContractsApi() {
  const res = await api.get('/operator/contracts')
  return res.data
}

export async function getOperatorContractByIdApi(id) {
  const res = await api.get(`/operator/contracts/${id}`)
  return res.data
}

export async function listOperatorContractsByCustomerApi(customerId) {
  const res = await api.get(`/operator/contracts/customer/${customerId}`)
  return res.data
}

export async function listOperatorActiveContractsByCustomerApi(customerId) {
  const res = await api.get(`/operator/contracts/customer/${customerId}/active`)
  return res.data
}

