import { Link } from 'react-router-dom'
import { useAuth } from '../contextapi/AuthContext.jsx'

export default function OperatorHome() {
  const { user } = useAuth()

  return (
    <div style={{ padding: '28px 0' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>My dashboard</h1>
        <span className="muted">{user?.username ?? 'operator'}</span>
      </div>

      <div className="grid" style={{ marginTop: 14 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Raise a complaint</h2>
          <p className="muted">Primary task — log a new issue against an active contract.</p>
          <Link className="button" to="/operator/complaints/raise">
            Raise complaint
          </Link>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>My complaints</h2>
          <p className="muted">Track complaints you have raised.</p>
          <Link className="button secondary" to="/operator/complaints/active">
            View complaints
          </Link>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Customer lookup</h2>
          <p className="muted">Search customers (read-only).</p>
          <Link className="button secondary" to="/operator/customers">
            Open lookup
          </Link>
        </div>
      </div>
    </div>
  )
}
