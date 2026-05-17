import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contextapi/AuthContext.jsx'
import { getApiErrorMessage } from '../services/http.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const roleParam = (searchParams.get('role') || 'OPERATOR').toUpperCase()
  const role = roleParam === 'ADMIN' ? 'ADMIN' : 'OPERATOR'

  const [username, setUsername] = useState(role === 'ADMIN' ? 'admin' : '')
  const [password, setPassword] = useState(role === 'ADMIN' ? 'admin' : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const setRole = (next) => {
    setSearchParams(next === 'ADMIN' ? { role: 'ADMIN' } : { role: 'OPERATOR' }, { replace: true })
    setError(null)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const u = await login({ username, password })
      if (role === 'ADMIN' && u?.role !== 'ADMIN') throw new Error('Not an admin account')
      if (role === 'OPERATOR' && u?.role !== 'OPERATOR') throw new Error('Not an operator account')
      navigate(role === 'ADMIN' ? '/admin/dashboard' : '/operator/dashboard', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '28px 0' }}>
      <h1 style={{ margin: 0, fontSize: 24 }}>Sign in</h1>
      <p className="muted" style={{ marginTop: 8 }}>
        {role === 'OPERATOR' ? (
          <>
            New operator? <Link to="/register">Register</Link> (requires admin approval).
          </>
        ) : (
          <>Administrator access to management and oversight.</>
        )}
      </p>

      <div className="segmented" style={{ marginTop: 14 }}>
        <button
          type="button"
          className={`segBtn ${role === 'ADMIN' ? 'segBtnActive' : ''}`}
          onClick={() => setRole('ADMIN')}
        >
          Admin
        </button>
        <button
          type="button"
          className={`segBtn ${role === 'OPERATOR' ? 'segBtnActive' : ''}`}
          onClick={() => setRole('OPERATOR')}
        >
          Operator
        </button>
      </div>

      <form onSubmit={onSubmit} className="card" style={{ marginTop: 14, maxWidth: 520 }}>
        <label className="label">Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />

        <label className="label" style={{ marginTop: 10 }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error ? (
          <div className="error" style={{ marginTop: 12 }}>
            {error}
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button disabled={loading} type="submit">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <Link className="button secondary" to="/">
            Home
          </Link>
        </div>
      </form>
    </div>
  )
}
