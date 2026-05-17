import { useEffect, useState } from 'react'
import { approveOperatorApi, fetchOperatorsApi } from '../services/adminService.js'
import { getApiErrorMessage } from '../services/http.js'

export default function ManageOperators() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await fetchOperatorsApi()
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

  const onApprove = async (id) => {
    setError(null)
    try {
      await approveOperatorApi(id)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  return (
    <div style={{ padding: '28px 0' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Operators</h1>
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
          <div className="muted">No operators found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Approved</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.username}</td>
                    <td>{u.name ?? '-'}</td>
                    <td>{u.email ?? '-'}</td>
                    <td>{u.phone ?? '-'}</td>
                    <td>{u.approved ? 'Yes' : 'No'}</td>
                    <td style={{ textAlign: 'right' }}>
                      {!u.approved ? (
                        <button onClick={() => onApprove(u.id)}>Approve</button>
                      ) : (
                        <span className="muted">Approved</span>
                      )}
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

