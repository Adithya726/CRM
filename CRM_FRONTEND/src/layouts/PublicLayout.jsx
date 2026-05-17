import { Outlet } from 'react-router-dom'
import BackToTopButton from '../components/BackToTopButton.jsx'

/**
 * Login, register, and marketing landing — no app sidebar.
 */
export default function PublicLayout() {
  return (
    <div className="publicLayout">
      <div className="publicLayoutInner">
        <Outlet />
      </div>
      <BackToTopButton />
    </div>
  )
}
