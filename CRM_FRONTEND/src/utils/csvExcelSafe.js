/**
 * Make date/datetime values open reliably in Excel from CSV.
 * Excel often mis-parses ISO strings or shows ######## for "dates"; a leading
 * apostrophe forces text, and normalized formatting avoids bad serials.
 */

function parseToDate(v) {
  if (v == null || v === '' || v === '-') return null
  if (typeof v === 'number' && Number.isFinite(v)) {
    const d = new Date(v > 1e12 ? v : v * 1000)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const s = String(v).trim()
  if (!s) return null
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) return d
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) {
    return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0))
  }
  return null
}

/** YYYY-MM-DD for contract period fields (UTC calendar day from ISO date or datetime). */
export function excelCsvDateOnlyCell(v) {
  const d = parseToDate(v)
  if (!d) return ''
  const y = d.getUTCFullYear()
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `'${y}-${mo}-${day}`
}

/**
 * Datetime for complaints: space instead of T, strip Z/ms — then force text for Excel.
 */
export function excelCsvDateTimeCell(v) {
  if (v == null || v === '') return ''
  const s = String(v).trim()
  if (!s) return ''
  const d = parseToDate(v)
  if (!d) {
    const fallback = s.replace('T', ' ').replace(/\.\d{1,3}Z?$/i, '').replace(/Z$/i, '')
    return fallback ? `'${fallback}` : ''
  }
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const sec = String(d.getSeconds()).padStart(2, '0')
  return `'${y}-${mo}-${day} ${h}:${min}:${sec}`
}
