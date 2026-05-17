import { useEffect, useState } from 'react'
import { listOperatorContractsApi } from '../services/contractService.js'
import { getApiErrorMessage } from '../services/http.js'

export default function ViewContracts() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await listOperatorContractsApi()
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
        <h1 style={{ margin: 0, fontSize: 24 }}>Contracts (view)</h1>
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
          <div className="muted">No contracts.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>PO #</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id}>
                    <td className="muted" style={{ fontSize: 13 }}>
                      {c.customerDisplayId ?? '—'}
                    </td>
                    <td>{c.customerName ?? '—'}</td>
                    <td>{c.contractType}</td>
                    <td>{c.periodFrom ?? '-'}</td>
                    <td>{c.periodTo ?? '-'}</td>
                    <td>{c.poNumber ?? '-'}</td>
                    <td>{c.totalPoValue ?? '-'}</td>
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

