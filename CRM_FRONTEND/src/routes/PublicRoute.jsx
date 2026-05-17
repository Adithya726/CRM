import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contextapi/AuthContext.jsx'

/** If already authenticated, skip login/register and go to the right home. */
export default function PublicRoute() {
  const { user } = useAuth()

  if (user) {
    const target = user.role === 'ADMIN' ? '/admin/dashboard' : '/operator/dashboard'
    return <Navigate to={target} replace />
  }

  return <Outlet />
}
