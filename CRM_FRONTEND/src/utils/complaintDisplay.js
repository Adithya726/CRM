/** Format API datetime for tables/modals */
export function formatComplaintDateTime(v) {
  if (v == null || v === '') return '—'
  return String(v).replace('T', ' ')
}

/**
 * Engineer assignment timeline from API (`engineerAssignments`) or legacy fields.
 * @param {object} c complaint DTO
 */
/** Same label shape for every row: "Name (phone)" */
export function formatEngineerAssignmentLabel(a) {
  const name = (a.engineerUsername && String(a.engineerUsername).trim()) || '—'
  const raw = a.engineerPhone != null && a.engineerPhone !== '' ? String(a.engineerPhone).trim() : ''
  const phone = raw || '—'
  return `${name} (${phone})`
}

export function getComplaintEngineerAssignments(c) {
  if (Array.isArray(c.engineerAssignments) && c.engineerAssignments.length > 0) {
    return c.engineerAssignments
  }
  const out = []
  if (c.previousEngineerUsername && c.previousAssignedAt) {
    out.push({
      engineerUsername: c.previousEngineerUsername,
      engineerPhone: c.previousEngineerPhone ?? null,
      assignedAt: c.previousAssignedAt,
    })
  }
  if (c.engineerUsername && c.assignedAt) {
    out.push({
      engineerId: c.engineerId,
      engineerUsername: c.engineerUsername,
      engineerPhone: c.engineerPhone,
      assignedAt: c.assignedAt,
    })
  }
  return out
}
