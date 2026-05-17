import api from './api.js'

/** POST /api/complaints — unified raise (Admin + Operator) */
export async function raiseComplaintApi(payload) {
  const res = await api.post('/complaints', payload)
  return res.data
}

export async function listOperatorComplaintsApi() {
  const res = await api.get('/operator/complaints')
  return res.data
}

export async function listAdminOpenComplaintsApi() {
  const res = await api.get('/admin/complaints/open')
  return res.data
}

export async function listAdminClosedComplaintsApi() {
  const res = await api.get('/admin/complaints/closed')
  return res.data
}

export async function assignComplaintEngineerApi(complaintId, engineerId) {
  const res = await api.put(`/admin/complaints/${complaintId}/assign/${engineerId}`)
  return res.data
}

export async function closeComplaintApi(complaintId, payload) {
  const res = await api.put(`/admin/complaints/${complaintId}/close`, payload)
  return res.data
}

export async function reopenComplaintApi(complaintId) {
  const res = await api.put(`/admin/complaints/${complaintId}/reopen`)
  return res.data
}
