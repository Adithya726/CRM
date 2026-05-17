import { ChevronUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BACK_TOP_REVEAL_PX, getWindowScrollY, smoothScrollToTop } from '../utils/smoothScroll.js'

/** Fixed “back to top” for any route: show after a small window scroll. */
export default function BackToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(getWindowScrollY() > BACK_TOP_REVEAL_PX)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      className="backToTop"
      onClick={() => smoothScrollToTop()}
      title="Back to top"
      aria-label="Back to top"
    >
      <ChevronUp size={22} strokeWidth={2.25} />
    </button>
  )
}
