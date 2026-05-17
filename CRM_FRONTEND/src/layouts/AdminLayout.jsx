import { useEffect, useMemo, useState } from 'react'
import { Box, ChevronsLeft, ChevronsRight, Files, Home, User, Users, Zap } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contextapi/AuthContext.jsx'
import BackToTopButton from '../components/BackToTopButton.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'

const iconProps = { size: 20, strokeWidth: 1.65 }

function NavItem({ to, children, end, title, collapsed, icon }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={title}
      className={({ isActive }) => `sideNavItem ${isActive ? 'sideNavItemActive' : ''} ${collapsed ? 'sideNavItem--collapsed' : ''}`}
    >
      <span className="sideNavIcon" aria-hidden>
        {icon}
      </span>
      {!collapsed ? <span className="sideNavItem__label">{children}</span> : null}
    </NavLink>
  )
}

function ComplaintsNavItem({ collapsed }) {
  const { pathname } = useLocation()
  const active = pathname.startsWith('/admin/complaints')
  return (
    <Link
      to="/admin/complaints/active"
      title="Complaints"
      className={`sideNavItem ${active ? 'sideNavItemActive' : ''} ${collapsed ? 'sideNavItem--collapsed' : ''}`}
    >
      <span className="sideNavIcon" aria-hidden>
        <Zap {...iconProps} />
      </span>
      {!collapsed ? <span className="sideNavItem__label">Complaints</span> : null}
    </Link>
  )
}

function breadcrumbFromPath(pathname) {
  const segments = pathname.replace(/\/$/, '').split('/').filter(Boolean)
  if (segments[0] !== 'admin') return [{ label: 'Admin', to: '/admin/dashboard' }]
  const crumbs = [{ label: 'Admin', to: '/admin/dashboard' }]
  const rest = segments.slice(1)
  const labels = {
    dashboard: 'Dashboard',
    customers: 'Customers',
    contracts: 'Contracts',
    complaints: 'Complaints',
    engineers: 'Engineers',
    operators: 'Operators',
    raise: 'Raise',
    active: 'Active',
    closed: 'Closed',
  }
  let acc = '/admin'
  for (const seg of rest) {
    acc += `/${seg}`
    const label = labels[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1)
    crumbs.push({ label, to: acc })
  }
  return crumbs
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('crm.adminSidebarCollapsed') === '1')

  useEffect(() => {
    localStorage.setItem('crm.adminSidebarCollapsed', collapsed ? '1' : '0')
  }, [collapsed])

  const crumbs = useMemo(() => breadcrumbFromPath(pathname), [pathname])
  const pageTitle = crumbs[crumbs.length - 1]?.label ?? 'Admin'

  const onLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className={`appLayout ${collapsed ? 'appLayout--collapsed' : ''}`}>
      <aside className={`sideBar ${collapsed ? 'sideBar--collapsed' : ''}`}>
        <div className="sideBrand">
          <Link to="/admin/dashboard" className="sideBrandLink" title="CRM Admin">
            {collapsed ? (
              <span className="sideBrandMark" aria-hidden>
                C
              </span>
            ) : (
              <>
                <span className="sideBrandLogo" aria-hidden />
                CRM
              </>
            )}
          </Link>
        </div>

        <div className="sideSectionLabel">{collapsed ? '·' : 'Menu'}</div>
        <nav className="sideNav">
          <NavItem
            to="/admin/dashboard"
            end
            title="Dashboard"
            collapsed={collapsed}
            icon={<Home {...iconProps} />}
          >
            Dashboard
          </NavItem>
          <NavItem
            to="/admin/customers"
            title="Customers"
            collapsed={collapsed}
            icon={<Users {...iconProps} />}
          >
            Customers
          </NavItem>
          <NavItem
            to="/admin/contracts"
            title="Contracts"
            collapsed={collapsed}
            icon={<Files {...iconProps} />}
          >
            Contracts
          </NavItem>
          <ComplaintsNavItem collapsed={collapsed} />
          <NavItem
            to="/admin/engineers"
            title="Engineers"
            collapsed={collapsed}
            icon={<Box {...iconProps} />}
          >
            Engineers
          </NavItem>
          <NavItem
            to="/admin/operators"
            title="Operators"
            collapsed={collapsed}
            icon={<User {...iconProps} />}
          >
            Operators
          </NavItem>
        </nav>

        <button
          type="button"
          className="sideCollapseBtn"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight size={18} strokeWidth={1.65} /> : <ChevronsLeft size={18} strokeWidth={1.65} />}
        </button>
      </aside>

      <main className="mainPane">
        <header className="topBar">
          <div className="topBarInner">
            <div className="topBarLead">
              <div className="topBarTitle">{pageTitle}</div>
              <nav className="topBarCrumbs" aria-label="Breadcrumb">
                {crumbs.map((c, i) => (
                  <span key={c.to} className="topBarCrumb">
                    {i > 0 ? <span className="topBarCrumbSep">/</span> : null}
                    {i === crumbs.length - 1 ? (
                      <span className="topBarCrumbCurrent">{c.label}</span>
                    ) : (
                      <Link to={c.to}>{c.label}</Link>
                    )}
                  </span>
                ))}
              </nav>
            </div>
            <div className="topBarActions">
              <ThemeToggle />
              <div className="topBarUser">
                <span className="topBarUserName">{user?.name ?? user?.username ?? 'User'}</span>
                <span className="roleBadge roleBadge--admin">Admin</span>
                <button className="secondary" type="button" onClick={onLogout}>
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="content">
          <Outlet />
        </div>
      </main>
      <BackToTopButton />
    </div>
  )
}
