import { useEffect, useMemo, useState } from 'react'
import { listOperatorComplaintsApi, reopenComplaintApi } from '../services/complaintService.js'
import { exportComplaintAsExcelCsv, exportComplaintsListAsExcelCsv } from '../utils/complaintExport.js'
import { getApiErrorMessage } from '../services/http.js'
import {
  formatComplaintDateTime,
  formatEngineerAssignmentLabel,
  getComplaintEngineerAssignments,
} from '../utils/complaintDisplay.js'

function readUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function ClosedComplaints() {
  const user = useMemo(() => readUser(), [])
  const isAdmin = user?.role === 'ADMIN'

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selected, setSelected] = useState(null)
  const [reopenLoading, setReopenLoading] = useState(false)
  const [search, setSearch] = useState('')

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await listOperatorComplaintsApi()
      const all = Array.isArray(data) ? data : []
      setItems(all.filter((c) => c.status === 'CLOSED'))
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onReopen = async () => {
    if (!selected) return
    setReopenLoading(true)
    setError(null)
    try {
      await reopenComplaintApi(selected.id)
      setSelected(null)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setReopenLoading(false)
    }
  }

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((c) => {
      const parts = [
        c.customerDisplayId,
        c.customerName,
        c.contractType,
        c.productType,
        c.sla,
        c.id != null ? String(c.id) : '',
        formatComplaintDateTime(c.closedAt),
      ]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase())
      return parts.some((p) => p.includes(q))
    })
  }, [items, search])

  return (
    <div style={{ padding: '18px 0' }}>
      <div className="pageTitleRow">
        <h1>Closed complaints</h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={load} disabled={loading}>
            Refresh
          </button>
          {!loading && filteredItems.length > 0 ? (
            <button type="button" className="success" onClick={() => exportComplaintsListAsExcelCsv(filteredItems)}>
              Export
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="error" style={{ marginTop: 12 }}>
          {error}
        </div>
      ) : null}

      <div className="card" style={{ marginTop: 14 }}>
        {loading ? (
          <div className="muted">Loading…</div>
        ) : items.length === 0 ? (
          <div className="muted">No closed complaints.</div>
        ) : (
          <>
            <div className="closedComplaintsToolbar">
              <span className="muted" style={{ fontSize: 13 }}>
                {filteredItems.length} of {items.length}
              </span>
              <input
                type="search"
                className="closedComplaintsSearch"
                placeholder="Search customer, contract, product…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Filter closed complaints"
              />
            </div>
            {filteredItems.length === 0 ? (
              <div className="muted" style={{ padding: 16 }}>
                No rows match your search.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer</th>
                      <th>Contract</th>
                      <th>Product</th>
                      <th>SLA</th>
                      <th>Closed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((c) => (
                      <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(c)}>
                        <td className="muted" style={{ fontSize: 13 }}>
                          {c.customerDisplayId ?? '—'}
                        </td>
                        <td>
                          <span className="tableLinkName">{c.customerName}</span>
                        </td>
                        <td>{c.contractType}</td>
                        <td>{c.productType}</td>
                        <td>{c.sla}</td>
                        <td className="muted" style={{ fontSize: 13 }}>
                          {formatComplaintDateTime(c.closedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {selected ? (
        <div className="modalBackdrop" onMouseDown={() => setSelected(null)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2>Complaint {selected.id}</h2>
              <div className="modalHeaderActions">
                <button className="danger" type="button" onClick={() => setSelected(null)}>
                  Close
                </button>
                <button
                  className="success"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    exportComplaintAsExcelCsv(selected)
                  }}
                >
                  Export
                </button>
              </div>
            </div>

            <div className="grid-2">
              <div className="card subtle" style={{ padding: 12 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Customer
                </div>
                <div style={{ fontWeight: 800 }}>
                  {selected.customerDisplayId ? `${selected.customerDisplayId} · ` : ''}
                  {selected.customerName}
                </div>
              </div>
              <div className="card subtle" style={{ padding: 12 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Contract
                </div>
                <div style={{ fontWeight: 800 }}>{selected.contractType}</div>
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: 12 }}>
              <div className="card subtle" style={{ padding: 12 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Product / Status / SLA
                </div>
                <div style={{ fontWeight: 750 }}>
                  {selected.productType} • {selected.status} • {selected.sla}
                </div>
              </div>
              <div className="card subtle" style={{ padding: 12 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Engineers assigned
                </div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>
                  Total: {getComplaintEngineerAssignments(selected).length}
                </div>
                {getComplaintEngineerAssignments(selected).length === 0 ? (
                  <div className="muted">—</div>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 18, fontWeight: 650 }}>
                    {getComplaintEngineerAssignments(selected).map((a, i) => (
                      <li key={i} style={{ marginBottom: 6 }}>
                        {formatEngineerAssignmentLabel(a)}
                        <span className="muted" style={{ fontWeight: 500 }}>
                          {' '}
                          — {formatComplaintDateTime(a.assignedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="card subtle" style={{ marginTop: 12, padding: 12 }}>
              <div className="muted" style={{ fontSize: 12 }}>
                Description
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{selected.description}</div>
            </div>

            <div className="grid-2" style={{ marginTop: 12 }}>
              <div className="card subtle" style={{ padding: 12 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Raised
                </div>
                <div>{formatComplaintDateTime(selected.raisedAt)}</div>
              </div>
              <div className="card subtle" style={{ padding: 12 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Assigned
                </div>
                <div>{formatComplaintDateTime(selected.assignedAt)}</div>
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: 12 }}>
              <div className="card subtle" style={{ padding: 12 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Closed
                </div>
                <div>{formatComplaintDateTime(selected.closedAt)}</div>
              </div>
              <div className="card subtle" style={{ padding: 12 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Spares
                </div>
                <div style={{ fontWeight: 650 }}>
                  {selected.sparesUsed ? `YES — ${selected.spareDetails ?? ''} (${selected.spareCost ?? ''})` : 'NO'}
                </div>
              </div>
            </div>

            {selected.resolutionProofImage ? (
              <div className="card subtle" style={{ marginTop: 12, padding: 12 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Proof
                </div>
                <div style={{ wordBreak: 'break-all' }}>{selected.resolutionProofImage}</div>
                {/^https?:\/\//i.test(selected.resolutionProofImage) ? (
                  <div style={{ marginTop: 10 }}>
                    <img
                      src={selected.resolutionProofImage}
                      alt="Resolution proof"
                      style={{ maxWidth: '100%', borderRadius: 12, border: '1px solid var(--border)' }}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {isAdmin ? (
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
                <button className="primary" type="button" disabled={reopenLoading} onClick={onReopen}>
                  {reopenLoading ? 'Reopening…' : 'Reopen complaint'}
                </button>
              </div>
            ) : (
              <div className="muted" style={{ marginTop: 12, fontSize: 13 }}>
                Reopen is available to Admin users.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
