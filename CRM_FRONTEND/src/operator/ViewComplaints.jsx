import { useEffect, useState } from 'react'
import { listOperatorComplaintsApi } from '../services/complaintService.js'
import { getApiErrorMessage } from '../services/http.js'

const OPENISH = new Set(['OPEN', 'ASSIGNED', 'REOPENED'])

export default function ViewComplaints() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await listOperatorComplaintsApi()
      const all = Array.isArray(data) ? data : []
      setItems(all.filter((c) => OPENISH.has(c.status)))
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div style={{ padding: '18px 0' }}>
      <div className="pageTitleRow">
        <h1>Active complaints</h1>
        <button onClick={load} disabled={loading}>
          Refresh
        </button>
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
          <div className="muted">No active complaints.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Contract</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>SLA</th>
                  <th>Raised</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>
                      #{c.customerId} — {c.customerName}
                    </td>
                    <td>
                      #{c.contractId} — {c.contractType}
                    </td>
                    <td>{c.productType}</td>
                    <td>{c.status}</td>
                    <td>{c.sla}</td>
                    <td className="muted" style={{ fontSize: 13 }}>
                      {c.raisedAt ? String(c.raisedAt).replace('T', ' ') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
