import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contextapi/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import PublicLayout from './layouts/PublicLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import OperatorLayout from './layouts/OperatorLayout.jsx'
import PublicRoute from './routes/PublicRoute.jsx'

import MainPage from './main/MainPage.jsx'
import LoginPage from './pages/LoginPage.jsx'

import AdminHome from './admin/AdminHome.jsx'
import ManageCustomers from './admin/ManageCustomers.jsx'
import ManageContracts from './admin/ManageContracts.jsx'
import ManageOperators from './admin/ManageOperators.jsx'
import ManageComplaints from './admin/ManageComplaints.jsx'
import ManageEngineers from './admin/ManageEngineers.jsx'
import AdminClosedComplaints from './admin/AdminClosedComplaints.jsx'
import AdminComplaintsLayout from './admin/AdminComplaintsLayout.jsx'

import OperatorRegister from './operator/OperatorRegister.jsx'
import OperatorHome from './operator/OperatorHome.jsx'
import ViewCustomers from './operator/ViewCustomers.jsx'
import ViewContracts from './operator/ViewContracts.jsx'
import RaiseComplaint from './components/RaiseComplaint.jsx'
import ViewComplaints from './operator/ViewComplaints.jsx'
import ClosedComplaints from './operator/ClosedComplaints.jsx'
import OperatorComplaintsLayout from './operator/OperatorComplaintsLayout.jsx'

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/operator/dashboard'} replace />
}

export default function App() {
  return (
    <div className="appRootShell">
      <div className="appContentLayer">
      <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<MainPage />} />
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<OperatorRegister />} />
        </Route>
      </Route>

      <Route path="/admin/login" element={<Navigate to="/login?role=ADMIN" replace />} />
      <Route path="/operator/login" element={<Navigate to="/login?role=OPERATOR" replace />} />
      <Route path="/operator/register" element={<Navigate to="/register" replace />} />

      <Route path="/app" element={<RoleRedirect />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminHome />} />
        <Route path="customers" element={<ManageCustomers />} />
        <Route path="contracts" element={<ManageContracts />} />
        <Route path="complaints" element={<AdminComplaintsLayout />}>
          <Route index element={<Navigate to="active" replace />} />
          <Route path="raise" element={<RaiseComplaint redirectTo="/admin/complaints/active" />} />
          <Route path="active" element={<ManageComplaints />} />
          <Route path="closed" element={<AdminClosedComplaints />} />
        </Route>
        <Route path="raise-complaint" element={<Navigate to="/admin/complaints/raise" replace />} />
        <Route path="engineers" element={<ManageEngineers />} />
        <Route path="operators" element={<ManageOperators />} />
      </Route>

      <Route
        path="/operator"
        element={
          <ProtectedRoute role="OPERATOR">
            <OperatorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<OperatorHome />} />
        <Route path="complaints/raise" element={<RaiseComplaint redirectTo="/operator/complaints/active" />} />
        <Route path="complaints" element={<OperatorComplaintsLayout />}>
          <Route index element={<Navigate to="active" replace />} />
          <Route path="active" element={<ViewComplaints />} />
          <Route path="closed" element={<ClosedComplaints />} />
        </Route>
        <Route path="customers" element={<ViewCustomers />} />
        <Route path="contracts" element={<ViewContracts />} />
      </Route>

      <Route path="/operator/raise-complaint" element={<Navigate to="/operator/complaints/raise" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
      </div>
    </div>
  )
}
