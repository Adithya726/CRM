import { formatEngineerAssignmentLabel, getComplaintEngineerAssignments } from './complaintDisplay.js'
import { excelCsvDateTimeCell } from './csvExcelSafe.js'

/** Trigger a file download in the browser. */
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

function complaintToExportRow(c) {
  const assignments = getComplaintEngineerAssignments(c)
  const assignStr =
    assignments.length === 0 ? '' : assignments.map((a) => `${formatEngineerAssignmentLabel(a)} @ ${a.assignedAt ?? ''}`).join('; ')
  return {
    id: c.id,
    customerDisplayId: c.customerDisplayId,
    customerName: c.customerName,
    contractType: c.contractType,
    productType: c.productType,
    sla: c.sla,
    status: c.status,
    description: c.description,
    raisedAt: excelCsvDateTimeCell(c.raisedAt),
    assignedAt: excelCsvDateTimeCell(c.assignedAt),
    closedAt: excelCsvDateTimeCell(c.closedAt),
    sparesUsed: c.sparesUsed,
    spareDetails: c.spareDetails,
    spareCost: c.spareCost,
    resolutionProofImage: c.resolutionProofImage,
    engineerAssignments: assignStr,
  }
}

function rowsToCsv(rows) {
  if (!rows.length) return ''
  const keys = Object.keys(complaintToExportRow(rows[0]))
  const header = keys.map((k) => stringifyCell(k)).join(',')
  const lines = rows.map((c) =>
    keys.map((k) => stringifyCell(complaintToExportRow(c)[k])).join(','),
  )
  return `\ufeff${header}\r\n${lines.join('\r\n')}\r\n`
}

/** One complaint → CSV file (Excel). */
export function exportComplaintAsExcelCsv(c) {
  const csv = rowsToCsv([c])
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, `complaint-${c.id}-export.csv`)
}

/** Table / filtered list → one CSV file (Excel). */
export function exportComplaintsListAsExcelCsv(rows, filenameBase = 'closed-complaints') {
  if (!Array.isArray(rows) || rows.length === 0) return
  const csv = rowsToCsv(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  downloadBlob(blob, `${filenameBase}-${stamp}.csv`)
}
