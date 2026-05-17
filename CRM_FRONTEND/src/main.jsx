import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppRouter from './components/AppRouter.jsx'
import BackendGate from './components/BackendGate.jsx'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contextapi/AuthContext.jsx'
import { applyTheme, getPreferredTheme } from './utils/theme.js'

// Apply theme before first paint (reduces flash).
applyTheme(getPreferredTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRouter>
      <BackendGate>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BackendGate>
    </AppRouter>
  </StrictMode>,
)
