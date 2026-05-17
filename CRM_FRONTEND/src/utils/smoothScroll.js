/** Show the back-to-top control after scrolling down slightly (avoids flicker at scrollY 0). */
export const BACK_TOP_REVEAL_PX = 8

export function getWindowScrollY() {
  return (
    window.scrollY ??
    window.pageYOffset ??
    document.documentElement.scrollTop ??
    document.body.scrollTop ??
    0
  )
}

/** Eased scroll to top (~1s default). More controllable than native `behavior: 'smooth'`. */
export function smoothScrollToTop(durationMs = 1100) {
  const startY = getWindowScrollY()
  if (startY <= 0) return

  const start = performance.now()
  const easeOutCubic = (t) => 1 - (1 - t) ** 3

  function tick(now) {
    const elapsed = now - start
    const t = Math.min(1, elapsed / durationMs)
    const y = Math.round(startY * (1 - easeOutCubic(t)))
    window.scrollTo(0, y)
    if (t < 1) requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}
