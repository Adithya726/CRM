import api from './api.js'

export async function fetchOperatorsApi() {
  const res = await api.get('/admin/operators')
  return res.data
}

export async function approveOperatorApi(id) {
  const res = await api.put(`/admin/operators/${id}/approve`)
  return res.data
}

