import { contractPeriodStatus } from './contractPeriodStatus.js'
import { excelCsvDateOnlyCell } from './csvExcelSafe.js'

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function stringifyCell(v) {
  if (v == null || v === '') return ''
  const s = String(v).replace(/"/g, '""').replace(/\r?\n/g, ' ')
  return `"${s}"`
}

function customerToExportRow(c) {
  return {
    UCID: c.displayId ?? '',
    'Customer Name': c.name ?? '',
    'Contact Name': c.organization ?? '',
    'Phone#': c.phone ?? '',
    Email: c.email ?? '',
    Address: c.address ?? '',
    Location: c.location ?? '',
    Building: c.building ?? '',
    Site: c.site ?? '',
  }
}

function contractToExportRow(c) {
  const st = contractPeriodStatus(c)
  return {
    id: c.id,
    customerDisplayId: c.customerDisplayId,
    customerName: c.customerName,
    contractType: c.contractType,
    sla: c.sla ?? '',
    periodFrom: excelCsvDateOnlyCell(c.periodFrom),
    periodTo: excelCsvDateOnlyCell(c.periodTo),
    status: st.label,
    poNumber: c.poNumber ?? '',
    totalPoValue: c.totalPoValue ?? '',
  }
}

function rowsToCsv(rows, rowMapper) {
  if (!rows.length) return ''
  const keys = Object.keys(rowMapper(rows[0]))
  const header = keys.map((k) => stringifyCell(k)).join(',')
  const lines = rows.map((row) => {
    const obj = rowMapper(row)
    return keys.map((k) => stringifyCell(obj[k])).join(',')
  })
  return `\ufeff${header}\r\n${lines.join('\r\n')}\r\n`
}

/** Filtered / full customer list → UTF-8 CSV with BOM (Excel). */
export function exportCustomersListAsExcelCsv(rows, filenameBase = 'customers') {
  if (!Array.isArray(rows) || rows.length === 0) return
  const csv = rowsToCsv(rows, customerToExportRow)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  downloadBlob(blob, `${filenameBase}-${stamp}.csv`)
}

/** Filtered / full contract list → UTF-8 CSV with BOM (Excel). */
export function exportContractsListAsExcelCsv(rows, filenameBase = 'contracts') {
  if (!Array.isArray(rows) || rows.length === 0) return
  const csv = rowsToCsv(rows, contractToExportRow)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  downloadBlob(blob, `${filenameBase}-${stamp}.csv`)
}
