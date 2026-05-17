import { BrowserRouter, HashRouter } from 'react-router-dom'

const isElectron = import.meta.env.VITE_ELECTRON === 'true'

export default function AppRouter({ children }) {
  const Router = isElectron ? HashRouter : BrowserRouter
  return <Router>{children}</Router>
}
