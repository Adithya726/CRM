import { useEffect, useMemo, useState } from 'react'
import { ChevronsLeft, ChevronsRight, Files, Home, PlusCircle, Users } from 'lucide-react'
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

function MyComplaintsNav({ children, title, collapsed }) {
  const { pathname } = useLocation()
  const active =
    pathname.startsWith('/operator/complaints/active') ||
    pathname.startsWith('/operator/complaints/closed')
  return (
    <Link
      to="/operator/complaints/active"
      title={title}
      className={`sideNavItem ${active ? 'sideNavItemActive' : ''} ${collapsed ? 'sideNavItem--collapsed' : ''}`}
    >
      <span className="sideNavIcon" aria-hidden>
        <Files {...iconProps} />
      </span>
      {!collapsed ? <span className="sideNavItem__label">{children}</span> : null}
    </Link>
  )
}

function breadcrumbFromPath(pathname) {
  const segments = pathname.replace(/\/$/, '').split('/').filter(Boolean)
  if (segments[0] !== 'operator') return [{ label: 'Operator', to: '/operator/dashboard' }]
  const crumbs = [{ label: 'Operator', to: '/operator/dashboard' }]
  const rest = segments.slice(1)
  const labels = {
    dashboard: 'My dashboard',
    complaints: 'Complaints',
    customers: 'Customer lookup',
    raise: 'Raise complaint',
    active: 'Active',
    closed: 'Closed',
    contracts: 'Contracts',
  }
  let acc = '/operator'
  for (const seg of rest) {
    acc += `/${seg}`
    const label = labels[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1)
    crumbs.push({ label, to: acc })
  }
  return crumbs
}

export default function OperatorLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('crm.operatorSidebarCollapsed') === '1')

  useEffect(() => {
    localStorage.setItem('crm.operatorSidebarCollapsed', collapsed ? '1' : '0')
  }, [collapsed])

  const crumbs = useMemo(() => breadcrumbFromPath(pathname), [pathname])
  const pageTitle = crumbs[crumbs.length - 1]?.label ?? 'Operator'

  const onLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className={`appLayout ${collapsed ? 'appLayout--collapsed' : ''}`}>
      <aside className={`sideBar ${collapsed ? 'sideBar--collapsed' : ''}`}>
        <div className="sideBrand">
          <Link to="/operator/dashboard" className="sideBrandLink" title="CRM Operator">
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
            to="/operator/dashboard"
            end
            title="My dashboard"
            collapsed={collapsed}
            icon={<Home {...iconProps} />}
          >
            My dashboard
          </NavItem>
          <NavItem
            to="/operator/complaints/raise"
            title="Raise complaint"
            collapsed={collapsed}
            icon={<PlusCircle {...iconProps} />}
          >
            Raise complaint
          </NavItem>
          <MyComplaintsNav title="My complaints" collapsed={collapsed}>
            My complaints
          </MyComplaintsNav>
          <NavItem
            to="/operator/customers"
            title="Customer lookup (read-only)"
            collapsed={collapsed}
            icon={<Users {...iconProps} />}
          >
            Customer lookup
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
                <span className="roleBadge roleBadge--operator">Operator</span>
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
