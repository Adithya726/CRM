import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loginApi } from '../services/authService.js'

const AuthContext = createContext(null)

function readUserFromStorage() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readUserFromStorage())

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
    else localStorage.removeItem('user')
  }, [user])

  const login = async ({ username, password }) => {
    const data = await loginApi({ username, password })
    // Backend returns the User object directly.
    const u = data?.user ?? data
    if (!u) throw new Error('Invalid login response')
    setUser(u)
    return u
  }

  const logout = () => setUser(null)

  const value = useMemo(() => ({ user, setUser, login, logout }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

