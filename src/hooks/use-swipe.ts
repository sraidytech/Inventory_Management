import { useEffect, RefObject } from "react"

interface SwipeProps {
  ref: RefObject<HTMLElement | null>
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
}

export const useSwipe = ({
  ref,
  onSwipeLeft,
  onSwipeRight,
  threshold = 50
}: SwipeProps) => {
  useEffect(() => {
    const element = ref.current
    if (!element) return

    let startX: number
    let startY: number

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!startX || !startY) return

      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      
      const diffX = startX - currentX
      const diffY = startY - currentY

      // Check if horizontal swipe is more significant than vertical
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > threshold) {
          if (diffX > 0 && onSwipeLeft) {
            onSwipeLeft()
          } else if (diffX < 0 && onSwipeRight) {
            onSwipeRight()
          }
          startX = 0
          startY = 0
        }
      }
    }

    element.addEventListener("touchstart", handleTouchStart)
    element.addEventListener("touchmove", handleTouchMove)

    return () => {
      element.removeEventListener("touchstart", handleTouchStart)
      element.removeEventListener("touchmove", handleTouchMove)
    }
  }, [ref, onSwipeLeft, onSwipeRight, threshold])
}
