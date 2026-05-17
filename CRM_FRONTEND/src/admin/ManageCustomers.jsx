import {
  Building2,
  Check,
  Mail,
  MapPin,
  Phone,
  User,
  UserCircle,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createCustomerApi,
  deleteCustomerApi,
  listAdminCustomersApi,
  updateCustomerApi,
} from '../services/customerService.js'
import { getApiErrorMessage } from '../services/http.js'
import { exportCustomersListAsExcelCsv } from '../utils/customerContractExport.js'
import * as XLSX from 'xlsx'

const PAGE_SIZE = 10
const iconSize = 18
const iconStroke = 1.65

function splitPhone(phone) {
  if (!phone || typeof phone !== 'string') return { prefix: '+91', local: '' }
  const trimmed = phone.trim()
  const plusDigits = trimmed.match(/^\+(\d+)$/)
  if (plusDigits) {
    const allDigits = plusDigits[1]
    if (allDigits.length > 10) {
      const local = allDigits.slice(-10)
      const countryDigits = allDigits.slice(0, -10)
      return { prefix: `+${countryDigits}`, local }
    }
    return { prefix: '+91', local: allDigits.slice(0, 10) }
  }
  const m = trimmed.match(/^(\+\d{1,4})[\s-]*(\d*)$/)
  if (m) return { prefix: m[1], local: (m[2] || '').replace(/\D/g, '').slice(0, 10) }
  const digits = trimmed.replace(/\D/g, '')
  return { prefix: '+91', local: digits.slice(0, 10) }
}

function normPhone(p) {
  return String(p || '')
    .replace(/\s/g, '')
    .toLowerCase()
}

function normEmail(e) {
  return String(e || '')
    .trim()
    .toLowerCase()
}

function displayPhoneWithout91(phone) {
  const raw = String(phone || '').trim()
  if (!raw) return '—'
  return raw.startsWith('+91') ? raw.slice(3) : raw
}

function alphaOnly(value) {
  return value.replace(/[^a-zA-Z\s]/g, '')
}

function parseCsvLine(line) {
  const out = []
  let curr = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        curr += '"'
        i += 1
      } else if (ch === '"') {
        inQuotes = false
      } else {
        curr += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      out.push(curr.trim())
      curr = ''
    } else {
      curr += ch
    }
  }
  out.push(curr.trim())
  return out
}

function parseCsv(text) {
  const lines = String(text || '')
    .replace(/\uFEFF/g, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) return []
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase())
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line)
    const row = {}
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? ''
    })
    return row
  })
}

function rowsFromSheetJson(jsonRows) {
  if (!Array.isArray(jsonRows)) return []
  return jsonRows.map((r) => {
    const row = {}
    Object.entries(r || {}).forEach(([k, v]) => {
      row[String(k).trim().toLowerCase()] = String(v ?? '').trim()
    })
    return row
  })
}

function pickImportField(row, keys) {
  for (const key of keys) {
    const value = row[key]
    if (value != null && String(value).trim() !== '') return String(value).trim()
  }
  return ''
}

const emptyForm = {
  name: '',
  organization: '',
  address: '',
  location: '',
  building: '',
  site: '',
  email: '',
}

export default function ManageCustomers() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [phonePrefix, setPhonePrefix] = useState('+91')
  const [phoneLocal, setPhoneLocal] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [tab, setTab] = useState('add')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [detailCustomer, setDetailCustomer] = useState(null)
  const [notice, setNotice] = useState(null)
  const importRef = useRef(null)

  const fullPhone = `${phonePrefix}${phoneLocal}`

  const editingHeaderLabel = useMemo(() => {
    if (!editingId) return ''
    const row = items.find((i) => i.id === editingId)
    return row?.displayId ? String(row.displayId) : String(editingId)
  }, [editingId, items])

  const validationHints = useMemo(() => {
    const p = normPhone(fullPhone)
    const e = normEmail(form.email)
    let phoneDup = ''
    let emailDup = ''
    if (phoneLocal.length === 10) {
      if (items.some((i) => i.id !== editingId && normPhone(i.phone) === p)) {
        phoneDup = 'This phone number is already registered.'
      }
    }
    if (e) {
      if (items.some((i) => i.id !== editingId && normEmail(i.email) === e)) {
        emailDup = 'This email is already registered.'
      }
    }
    const phoneLen =
      phoneLocal.length > 0 && phoneLocal.length !== 10
        ? 'Enter exactly 10 digits after the country code (e.g. +91).'
        : ''
    return {
      phone: phoneDup || phoneLen,
      email: emailDup,
    }
  }, [fullPhone, phoneLocal.length, form.email, items, editingId])

  const canSubmit = useMemo(() => {
    const phoneOk = phoneLocal.length === 10
    return (
      form.name.trim() &&
      form.organization.trim() &&
      form.address.trim() &&
      form.location.trim() &&
      form.building.trim() &&
      form.site.trim() &&
      phoneOk &&
      form.email.trim() &&
      !validationHints.phone &&
      !validationHints.email
    )
  }, [form, phoneLocal.length, validationHints])

  const showNotice = (type, message) => {
    setNotice({ type, message })
    window.setTimeout(() => {
      setNotice(null)
    }, 1800)
  }

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await listAdminCustomersApi()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((c) => c.name && String(c.name).toLowerCase().includes(q))
  }, [items, search])

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
    if (page > maxPage) setPage(maxPage)
  }, [filteredItems.length, page])

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredItems.slice(start, start + PAGE_SIZE)
  }, [filteredItems, page])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))

  const onChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))
  const onAlphaChange = (k) => (e) => setForm((p) => ({ ...p, [k]: alphaOnly(e.target.value) }))

  const onPhoneLocalChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 10)
    setPhoneLocal(v)
  }

  const onEdit = (c) => {
    setTab('add')
    setEditingId(c.id)
    const { prefix, local } = splitPhone(c.phone)
    setPhonePrefix(prefix || '+91')
    setPhoneLocal(local)
    setForm({
      name: c.name ?? '',
      organization: c.organization ?? '',
      address: c.address ?? '',
      location: c.location ?? '',
      building: c.building ?? '',
      site: c.site ?? '',
      email: c.email ?? '',
    })
  }

  const onCancel = () => {
    setEditingId(null)
    setForm(emptyForm)
    setPhonePrefix('+91')
    setPhoneLocal('')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!canSubmit) {
      alert('Please fill all mandatory fields.')
      return
    }
    try {
      const payload = {
        ...form,
        phone: fullPhone,
      }
      if (editingId) {
        await updateCustomerApi(editingId, payload)
        showNotice('success', 'Customer updated successfully')
      } else {
        await createCustomerApi(payload)
        showNotice('success', 'Customer added successfully')
      }
      onCancel()
      setTab('view')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  const onDelete = async (id) => {
    setError(null)
    if (!confirm('Delete this customer?')) return
    try {
      await deleteCustomerApi(id)
      setDetailCustomer(null)
      await load()
      showNotice('danger', 'Customer deleted successfully')
    } catch (err) {
      const msg = getApiErrorMessage(err)
      if (/active contracts/i.test(msg)) {
        setError('Cannot delete this customer while contracts are active. Close contracts first.')
        return
      }
      if (/foreign key|contracts|cannot delete or update a parent row/i.test(msg)) {
        setError('Cannot delete this customer because contracts exist. Delete related contracts first.')
        return
      }
      setError(msg)
    }
  }

  const onExport = () => {
    exportCustomersListAsExcelCsv(filteredItems)
    showNotice('success', 'Exported successfully')
  }

  const onImportClick = () => {
    if (importRef.current) importRef.current.click()
  }

  const onImportFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      let rows = []
      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text()
        rows = parseCsv(text)
      } else {
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const jsonRows = XLSX.utils.sheet_to_json(ws, { defval: '' })
        rows = rowsFromSheetJson(jsonRows)
      }
      if (!rows.length) {
        showNotice('danger', 'Import failed')
        return
      }
      const row = rows[0]
      const name = pickImportField(row, ['customer name', 'name'])
      const organization = pickImportField(row, ['contact name', 'contactname', 'organization'])
      const address = pickImportField(row, ['address'])
      const location = pickImportField(row, ['location'])
      const building = pickImportField(row, ['building'])
      const site = pickImportField(row, ['site'])
      const email = pickImportField(row, ['email'])
      const phoneRaw = pickImportField(row, ['phone#', 'phone'])
      const normalizedPhone = phoneRaw.startsWith('+') ? phoneRaw : `+91${phoneRaw.replace(/\D/g, '')}`
      const payload = {
        name,
        organization,
        address,
        location,
        building,
        site,
        email,
        phone: normalizedPhone,
      }
      if (!Object.values(payload).some((v) => String(v || '').trim())) {
        showNotice('danger', 'Import failed')
        return
      }
      const { prefix, local } = splitPhone(payload.phone)
      setEditingId(null)
      setForm({
        name: alphaOnly(payload.name),
        organization: alphaOnly(payload.organization),
        address: payload.address,
        location: alphaOnly(payload.location),
        building: alphaOnly(payload.building),
        site: alphaOnly(payload.site),
        email: payload.email,
      })
      setPhonePrefix(prefix || '+91')
      setPhoneLocal(local)
      setTab('add')
      showNotice('success', 'Imported successfully')
    } catch (err) {
      setError(getApiErrorMessage(err))
      showNotice('danger', 'Import failed')
    }
  }

  return (
    <div style={{ padding: '20px 0 48px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div className="customerTabs" role="tablist" aria-label="Customers">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'add'}
            className={`customerTab ${tab === 'add' ? 'customerTabActive' : ''}`}
            onClick={() => {
              setTab('add')
              onCancel()
            }}
          >
            Add Customer
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'view'}
            className={`customerTab ${tab === 'view' ? 'customerTabActive' : ''}`}
            onClick={() => {
              setTab('view')
              onCancel()
            }}
          >
            View Customers
          </button>
        </div>
      </div>

      {error ? (
        <div className="error" style={{ marginBottom: 14 }}>
          {error}
        </div>
      ) : null}

      <div className="customersTabStage">
        <div key={tab} className={`customersTabPane customersTabPane--${tab}`}>
          {tab === 'add' ? (
            <div className="customersAddShell">
              <form onSubmit={onSubmit} className="card customersFormCard">
              <div className="cardHeader">
                <h2 style={{ margin: 0 }}>
                  {editingId ? `Edit customer ${editingHeaderLabel}` : 'Add Customer'}
                </h2>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="button" className="success" onClick={onImportClick}>
                    Import
                  </button>
                  <input ref={importRef} type="file" accept=".csv,.xlsx,.xls" onChange={onImportFile} style={{ display: 'none' }} />
                </div>
              </div>

              <label className="label">Customer Name *</label>
              <div className="inputIconRow">
                <span className="inputIconRow__icon" aria-hidden>
                  <User size={iconSize} strokeWidth={iconStroke} />
                </span>
                <input value={form.name} onChange={onAlphaChange('name')} required placeholder="Full name" />
              </div>

              <label className="label" style={{ marginTop: 12 }}>
                Phone# *
              </label>
              <div className="inputIconRow">
                <span className="inputIconRow__icon" aria-hidden>
                  <Phone size={iconSize} strokeWidth={iconStroke} />
                </span>
                <div className="phoneSplit">
                  <input
                    className="phoneSplit__prefix"
                    value={phonePrefix}
                    onChange={(e) => setPhonePrefix(e.target.value)}
                    title="Country code — tap to edit"
                    placeholder="+91"
                    aria-label="Country code"
                  />
                  <input
                    className="phoneSplit__number"
                    value={phoneLocal}
                    onChange={onPhoneLocalChange}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10 digits"
                    aria-label="Mobile number (10 digits)"
                  />
                </div>
              </div>
              {validationHints.phone ? <div className="fieldError">{validationHints.phone}</div> : null}

              <label className="label" style={{ marginTop: 12 }}>
                Email *
              </label>
              <div className="inputIconRow">
                <span className="inputIconRow__icon" aria-hidden>
                  <Mail size={iconSize} strokeWidth={iconStroke} />
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={onChange('email')}
                  required
                  placeholder="email@example.com"
                />
              </div>
              {validationHints.email ? <div className="fieldError">{validationHints.email}</div> : null}

              <label className="label" style={{ marginTop: 12 }}>
                Contact Name *
              </label>
              <div className="inputIconRow">
                <span className="inputIconRow__icon" aria-hidden>
                  <UserCircle size={iconSize} strokeWidth={iconStroke} />
                </span>
                <input
                  value={form.organization}
                  onChange={onAlphaChange('organization')}
                  required
                  placeholder="Primary contact person"
                />
              </div>

              <label className="label" style={{ marginTop: 12 }}>
                Address *
              </label>
              <div className="inputIconRow inputIconRow--top">
                <span className="inputIconRow__icon" aria-hidden>
                  <MapPin size={iconSize} strokeWidth={iconStroke} />
                </span>
                <textarea value={form.address} onChange={onChange('address')} rows={3} required placeholder="Street, area…" />
              </div>

              <div className="grid-2" style={{ marginTop: 12 }}>
                <div>
                  <label className="label">Location *</label>
                  <div className="inputIconRow">
                    <span className="inputIconRow__icon" aria-hidden>
                      <MapPin size={iconSize} strokeWidth={iconStroke} />
                    </span>
                    <input value={form.location} onChange={onAlphaChange('location')} required placeholder="City / region" />
                  </div>
                </div>
                <div>
                  <label className="label">Building *</label>
                  <div className="inputIconRow">
                    <span className="inputIconRow__icon" aria-hidden>
                      <Building2 size={iconSize} strokeWidth={iconStroke} />
                    </span>
                    <input value={form.building} onChange={onAlphaChange('building')} required placeholder="Building / wing" />
                  </div>
                </div>
              </div>

              <label className="label" style={{ marginTop: 12 }}>
                Site *
              </label>
              <div className="inputIconRow">
                <span className="inputIconRow__icon" aria-hidden>
                  <Building2 size={iconSize} strokeWidth={iconStroke} />
                </span>
                <input value={form.site} onChange={onAlphaChange('site')} required placeholder="Site code or name" />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                <button type="submit" className="primary" disabled={!canSubmit}>
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button type="button" className="secondary" onClick={onCancel}>
                  {editingId ? 'Cancel' : 'Reset'}
                </button>
              </div>
              </form>
            </div>
          ) : (
            <div className="customersViewShell">
              <div className="pageTitleRow">
                <h1>View Customers</h1>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button type="button" onClick={load} disabled={loading}>
                    Refresh
                  </button>
                  {!loading && filteredItems.length > 0 ? (
                    <button type="button" className="success" onClick={onExport}>
                      Export
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="card">
                <div className="closedComplaintsToolbar">
                  <span className="muted" style={{ fontSize: 13 }}>
                    {filteredItems.length} of {items.length}
                  </span>
                  <input
                    type="search"
                    className="closedComplaintsSearch"
                    placeholder="Search by name…"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    aria-label="Search customers by name"
                  />
                </div>

            {loading ? (
              <div className="muted">Loading…</div>
            ) : filteredItems.length === 0 ? (
              <div className="muted">{items.length === 0 ? 'No customers yet.' : 'No names match your search.'}</div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th className="customerHeadCell">UCID</th>
                        <th className="customerHeadCell">Customer Name</th>
                        <th className="customerHeadCell">Contact Name</th>
                        <th className="customerHeadCell">Phone#</th>
                        <th className="customerHeadCell">Email</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((c) => (
                        <tr key={c.id}>
                          <td style={{ fontSize: 13, fontWeight: 700 }}>
                            {c.displayId ?? '—'}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="customerNameLink"
                              onClick={() => setDetailCustomer(c)}
                            >
                              {c.name}
                            </button>
                          </td>
                          <td>{c.organization ?? '-'}</td>
                          <td>{displayPhoneWithout91(c.phone)}</td>
                          <td>{c.email}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <button type="button" className="success" onClick={() => onEdit(c)}>
                                Update
                              </button>
                              <button type="button" className="danger" onClick={() => onDelete(c.id)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 ? (
                  <div className="paginationBar">
                    <button
                      type="button"
                      className="secondary"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <span className="muted" style={{ fontSize: 13 }}>
                      Page {page} of {totalPages}
                    </span>
                    <button
                      type="button"
                      className="secondary"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </>
            )}
              </div>
            </div>
          )}
        </div>
      </div>

      {detailCustomer ? (
        <div
          className="modalBackdrop"
          onMouseDown={() => setDetailCustomer(null)}
          role="presentation"
        >
          <div
            className="modal customerDetailModal"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-detail-title"
          >
            <h2 id="customer-detail-title" style={{ marginTop: 0 }}>
              {detailCustomer.name}
            </h2>
            <dl className="customerDetailList">
              <dt>UCID</dt>
              <dd>{detailCustomer.displayId ?? '—'}</dd>
              <dt>Phone#</dt>
              <dd>{displayPhoneWithout91(detailCustomer.phone)}</dd>
              <dt>Email</dt>
              <dd>{detailCustomer.email ?? '—'}</dd>
              <dt>Contact Name</dt>
              <dd>{detailCustomer.organization ?? '—'}</dd>
              <dt>Address</dt>
              <dd>{detailCustomer.address ?? '—'}</dd>
              <dt>Location</dt>
              <dd>{detailCustomer.location ?? '—'}</dd>
              <dt>Building</dt>
              <dd>{detailCustomer.building ?? '—'}</dd>
              <dt>Site</dt>
              <dd>{detailCustomer.site ?? '—'}</dd>
            </dl>
            <div className="customerDetailActions">
              <button
                type="button"
                className="success"
                onClick={() => {
                  onEdit(detailCustomer)
                  setDetailCustomer(null)
                }}
              >
                Update
              </button>
              <button type="button" className="danger" onClick={() => setDetailCustomer(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {notice ? (
        <div className="noticeOverlay" role="status" aria-live="polite">
          <div className={`noticeBox noticeBox--${notice.type}`}>
            <span className="noticeTick" aria-hidden>
              <Check size={20} strokeWidth={3} />
            </span>
            <span>{notice.message}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
