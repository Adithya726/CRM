/** @param {string|undefined|null} iso */
export function toMonthKey(iso) {
  if (iso == null || iso === '') return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** @param {number} n */
export function rollingMonthKeys(n = 12) {
  const out = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    out.push(`${y}-${m}`)
  }
  return out
}

/** @param {string} key y-m */
export function monthLabelShort(key) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  const mo = d.toLocaleString(undefined, { month: 'short' })
  return `${mo} ’${String(y).slice(-2)}`
}

/**
 * @param {object[]} items
 * @param {string} dateField
 * @param {string[]} keys
 */
export function bucketByMonth(items, dateField, keys) {
  const map = Object.fromEntries(keys.map((k) => [k, 0]))
  for (const item of items) {
    const k = toMonthKey(item[dateField])
    if (k != null && Object.prototype.hasOwnProperty.call(map, k)) map[k] += 1
  }
  return keys.map((k) => ({ key: k, label: monthLabelShort(k), count: map[k] }))
}

/**
 * @param {object[]} contracts
 * @param {string[]} keys
 */
export function bucketContractsByPeriodFrom(contracts, keys) {
  const map = Object.fromEntries(keys.map((k) => [k, 0]))
  for (const c of contracts) {
    const k = toMonthKey(c.periodFrom)
    if (k != null && Object.prototype.hasOwnProperty.call(map, k)) map[k] += 1
  }
  return keys.map((k) => ({ key: k, label: monthLabelShort(k), count: map[k] }))
}

/** @param {number[]} series */
export function trendVsPriorMonth(series) {
  if (!series || series.length < 2) return null
  const a = series[series.length - 2]
  const b = series[series.length - 1]
  if (a === 0 && b === 0) return null
  if (a === 0) return b > 0 ? 100 : null
  return Math.round(((b - a) / a) * 1000) / 10
}

/** @param {number|null} pct */
export function formatTrendLabel(pct) {
  if (pct == null) return null
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct}% vs prior month`
}
