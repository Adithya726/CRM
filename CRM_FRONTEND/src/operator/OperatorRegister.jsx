import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerOperatorApi } from '../services/authService.js'
import { getApiErrorMessage } from '../services/http.js'

export default function OperatorRegister() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const onChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await registerOperatorApi(form)
      setDone(true)
      setTimeout(() => navigate('/login?role=OPERATOR', { replace: true }), 700)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '28px 0' }}>
      <h1 style={{ margin: 0, fontSize: 24 }}>Operator registration</h1>
      <p className="muted" style={{ marginTop: 8 }}>
        After registering, an Admin must approve your account before you can login.
      </p>

      <form onSubmit={onSubmit} className="card" style={{ marginTop: 14, maxWidth: 720 }}>
        <div className="grid-2">
          <div>
            <label className="label">Username *</label>
            <input value={form.username} onChange={onChange('username')} required />
          </div>
          <div>
            <label className="label">Password *</label>
            <input type="password" value={form.password} onChange={onChange('password')} required />
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: 10 }}>
          <div>
            <label className="label">Name</label>
            <input value={form.name} onChange={onChange('name')} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={form.email} onChange={onChange('email')} />
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: 10 }}>
          <div>
            <label className="label">Phone</label>
            <input value={form.phone} onChange={onChange('phone')} />
          </div>
          <div>
            <label className="label">Department</label>
            <input value={form.department} onChange={onChange('department')} />
          </div>
        </div>

        <label className="label" style={{ marginTop: 10 }}>
          Designation
        </label>
        <input value={form.designation} onChange={onChange('designation')} />

        {error ? (
          <div className="error" style={{ marginTop: 12 }}>
            {error}
          </div>
        ) : null}

        {done ? (
          <div className="success" style={{ marginTop: 12 }}>
            Registered. Waiting for admin approval…
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button disabled={loading} type="submit">
            {loading ? 'Submitting…' : 'Register'}
          </button>
          <Link className="button secondary" to="/login?role=OPERATOR">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  )
}

