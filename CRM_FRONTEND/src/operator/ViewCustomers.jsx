import { useEffect, useState } from 'react'
import { listOperatorCustomersApi } from '../services/customerService.js'
import { getApiErrorMessage } from '../services/http.js'

function displayPhoneWithout91(phone) {
  const raw = String(phone || '').trim()
  if (!raw) return '—'
  return raw.startsWith('+91') ? raw.slice(3) : raw
}

export default function ViewCustomers() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await listOperatorCustomersApi()
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

  return (
    <div style={{ padding: '28px 0' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>View Customers</h1>
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
          <div className="muted">No customers.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th className="customerHeadCell">UCID</th>
                  <th className="customerHeadCell">Customer Name</th>
                  <th className="customerHeadCell">Contact Name</th>
                  <th className="customerHeadCell">Phone#</th>
                  <th className="customerHeadCell">Email</th>
                  <th className="customerHeadCell">Location</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontSize: 13, fontWeight: 700 }}>
                      {c.displayId ?? '—'}
                    </td>
                    <td>
                      <span className="tableLinkName">{c.name}</span>
                    </td>
                    <td>{c.organization ?? '-'}</td>
                    <td>{displayPhoneWithout91(c.phone)}</td>
                    <td>{c.email}</td>
                    <td>{c.location ?? '-'}</td>
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

