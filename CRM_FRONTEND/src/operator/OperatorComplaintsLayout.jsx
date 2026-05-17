import { NavLink, Outlet } from 'react-router-dom'

export default function OperatorComplaintsLayout() {
  return (
    <div style={{ padding: '18px 0 0' }}>
      <div className="complaintSubNav">
        <NavLink
          className={({ isActive }) => `complaintTab ${isActive ? 'complaintTabActive' : ''}`}
          to="/operator/complaints/active"
          end
        >
          Active
        </NavLink>
        <NavLink
          className={({ isActive }) => `complaintTab ${isActive ? 'complaintTabActive' : ''}`}
          to="/operator/complaints/closed"
          end
        >
          Closed
        </NavLink>
      </div>
      <Outlet />
    </div>
  )
}
