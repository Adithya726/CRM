import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { applyTheme, getPreferredTheme, toggleTheme } from '../utils/theme.js'

function maxCircleRadius(x, y) {
  const w = window.innerWidth
  const h = window.innerHeight
  const dx = Math.max(x, w - x)
  const dy = Math.max(y, h - y)
  return Math.hypot(dx, dy)
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'))

  useEffect(() => {
    if (!document.documentElement.dataset.theme) {
      const t = applyTheme(getPreferredTheme())
      setTheme(t)
    }
  }, [])

  const onToggle = async (e) => {
    const next = toggleTheme()
    const x = e?.clientX ?? window.innerWidth - 48
    const y = e?.clientY ?? 24

    const startViewTransition = document.startViewTransition?.bind(document)
    if (typeof startViewTransition === 'function') {
      try {
        const r = maxCircleRadius(x, y)
        const vt = startViewTransition(() => {
          const t = applyTheme(next)
          setTheme(t)
        })

        await vt.ready

        const keyframes = [
          { clipPath: `circle(0px at ${x}px ${y}px)` },
          { clipPath: `circle(${r}px at ${x}px ${y}px)` },
        ]

        document.documentElement.animate(keyframes, {
          duration: 2000,
          easing: 'cubic-bezier(0.19, 1, 0.22, 1)',
          pseudoElement: '::view-transition-new(root)',
        })

        document.documentElement.animate([...keyframes].reverse(), {
          duration: 2000,
          easing: 'cubic-bezier(0.19, 1, 0.22, 1)',
          pseudoElement: '::view-transition-old(root)',
        })

        return
      } catch {
        // fall through to normal switch
      }
    }

    // Fallback: no circle, just switch.
    const t = applyTheme(next)
    setTheme(t)
  }

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="themeToggleBtn"
      onClick={onToggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
    </button>
  )
}

