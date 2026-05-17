export const THEME_KEY = 'crm.theme'

export function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

export function applyTheme(theme) {
  const t = theme === 'dark' ? 'dark' : 'light'
  document.documentElement.dataset.theme = t
  if (document.body) {
    document.body.classList.remove('light', 'dark')
    document.body.classList.add(t)
  }
  try {
    localStorage.setItem(THEME_KEY, t)
  } catch {
    // ignore
  }
  return t
}

export function toggleTheme() {
  const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  return current === 'dark' ? 'light' : 'dark'
}

