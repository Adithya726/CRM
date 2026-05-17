import { NavLink, Outlet } from 'react-router-dom'

export default function AdminComplaintsLayout() {
  return (
    <div style={{ padding: '18px 0 0' }}>
      <div className="complaintSubNav">
        <NavLink className={({ isActive }) => `complaintTab ${isActive ? 'complaintTabActive' : ''}`} to="/admin/complaints/raise" end>
          Raise
        </NavLink>
        <NavLink className={({ isActive }) => `complaintTab ${isActive ? 'complaintTabActive' : ''}`} to="/admin/complaints/active" end>
          Active
        </NavLink>
        <NavLink className={({ isActive }) => `complaintTab ${isActive ? 'complaintTabActive' : ''}`} to="/admin/complaints/closed" end>
          Closed
        </NavLink>
      </div>
      <Outlet />
    </div>
  )
}
