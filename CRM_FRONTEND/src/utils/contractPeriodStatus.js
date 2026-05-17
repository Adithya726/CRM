export function parseIsoDateOnly(s) {
  if (s == null || s === '') return null
  const str = typeof s === 'string' ? s : String(s)
  const m = str.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

export function startOfToday() {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}

/** Active / Upcoming / Closed from period; NCAMC with no dates → no period. */
export function contractPeriodStatus(c) {
  const from = parseIsoDateOnly(c.periodFrom)
  const to = parseIsoDateOnly(c.periodTo)
  const today = startOfToday()
  if (!from && !to) {
    return { label: '—', tone: 'neutral' }
  }
  if (from && !to) {
    if (today < from) return { label: 'Upcoming', tone: 'soon' }
    return { label: 'Active', tone: 'active' }
  }
  if (!from && to) {
    if (today > to) return { label: 'Closed', tone: 'closed' }
    return { label: 'Active', tone: 'active' }
  }
  if (today < from) return { label: 'Upcoming', tone: 'soon' }
  if (today > to) return { label: 'Closed', tone: 'closed' }
  return { label: 'Active', tone: 'active' }
}
