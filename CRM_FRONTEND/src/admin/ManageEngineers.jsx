import { Phone, User } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createEngineerApi, deleteEngineerApi, listEngineersApi, updateEngineerApi } from '../services/engineerService.js'
import { getApiErrorMessage } from '../services/http.js'

const empty = { username: '', phone: '' }
const iconSize = 18
const iconStroke = 1.65

export default function ManageEngineers() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)

  const canSubmit = useMemo(() => form.username.trim() && form.phone.trim(), [form])

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await listEngineersApi()
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

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const payload = { username: form.username.trim(), phone: form.phone.trim() }
      if (editingId) await updateEngineerApi(editingId, payload)
      else await createEngineerApi(payload)
      setEditingId(null)
      setForm(empty)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  const onEdit = (e) => {
    setEditingId(e.id)
    setForm({ username: e.username ?? '', phone: e.phone ?? '' })
  }

  const onCancel = () => {
    setEditingId(null)
    setForm(empty)
  }

  const onDelete = async (id) => {
    if (!confirm('Delete engineer?')) return
    setError(null)
    try {
      await deleteEngineerApi(id)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  return (
    <div style={{ padding: '18px 0' }}>
      <div className="pageTitleRow">
        <h1>Engineers</h1>
        <button onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {error ? (
        <div className="error" style={{ marginTop: 12 }}>
          {error}
        </div>
      ) : null}

      <div className="pageGrid" style={{ marginTop: 14 }}>
        <form className="card" onSubmit={onSubmit}>
          <div className="cardHeader">
            <h2>{editingId ? `Edit engineer #${editingId}` : 'Add engineer'}</h2>
          </div>

          <label className="label">Username *</label>
          <div className="inputIconRow">
            <span className="inputIconRow__icon" aria-hidden>
              <User size={iconSize} strokeWidth={iconStroke} />
            </span>
            <input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} required />
          </div>

          <label className="label" style={{ marginTop: 10 }}>
            Phone *
          </label>
          <div className="inputIconRow">
            <span className="inputIconRow__icon" aria-hidden>
              <Phone size={iconSize} strokeWidth={iconStroke} />
            </span>
            <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} required />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <button className="primary" type="submit" disabled={!canSubmit}>
              {editingId ? 'Update' : 'Create'}
            </button>
            <button className="secondary" type="button" onClick={onCancel}>
              {editingId ? 'Cancel' : 'Reset'}
            </button>
          </div>
        </form>

        <div className="card">
          <div className="cardHeader">
            <h2>All engineers</h2>
            <span className="muted" style={{ fontSize: 13 }}>
              {items.length} total
            </span>
          </div>

          {loading ? (
            <div className="muted">Loading…</div>
          ) : items.length === 0 ? (
            <div className="muted">No engineers yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Phone</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((e) => (
                    <tr key={e.id}>
                      <td>{e.id}</td>
                      <td>{e.username}</td>
                      <td>{e.phone}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button className="success" type="button" onClick={() => onEdit(e)}>
                            Update
                          </button>
                          <button className="danger" type="button" onClick={() => onDelete(e.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
