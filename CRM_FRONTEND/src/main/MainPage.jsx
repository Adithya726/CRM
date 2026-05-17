import { Link } from 'react-router-dom'
import { useAuth } from '../contextapi/AuthContext.jsx'

export default function MainPage() {
  const { user } = useAuth()

  return (
    <div style={{ padding: '28px 0' }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: 26 }}>CRM</h1>
        <span className="muted">Admin + Operator portal</span>
      </div>

      <div style={{ marginTop: 18 }} className="card">
        {!user ? (
          <>
            <h2 style={{ marginTop: 0 }}>Get started</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link className="button" to="/login">
                Sign in
              </Link>
              <Link className="button secondary" to="/register">
                Operator register
              </Link>
            </div>
            <p className="muted" style={{ marginBottom: 0, marginTop: 12 }}>
              Operators must be approved by an Admin before they can login.
            </p>
          </>
        ) : (
          <>
            <h2 style={{ marginTop: 0 }}>Continue</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              Logged in as <b>{user.username ?? user.email ?? 'user'}</b> ({user.role})
            </p>
            <Link
              className="button"
              to={user.role === 'ADMIN' ? '/admin/dashboard' : '/operator/dashboard'}
            >
              Go to dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

