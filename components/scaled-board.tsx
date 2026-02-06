"use client"

import { useRef, useEffect, useState, type ReactNode } from "react"

interface ScaledBoardProps {
  children: ReactNode
  /** Native width/height of the board content in px */
  nativeSize?: number
  className?: string
}

/**
 * Wraps the game board and scales it down to fit the available container space.
 * Uses ResizeObserver to dynamically compute the scale factor.
 */
export function ScaledBoard({ children, nativeSize = 750, className }: ScaledBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateScale = () => {
      const parent = container.parentElement
      if (!parent) return

      const availableWidth = parent.clientWidth
      const availableHeight = parent.clientHeight

      // Scale to fit the smaller dimension, capped at 1 (no upscaling)
      const newScale = Math.min(1, availableWidth / nativeSize, availableHeight / nativeSize)
      setScale(newScale)
    }

    if (typeof ResizeObserver === "undefined") {
      updateScale()
      return
    }

    const observer = new ResizeObserver(updateScale)
    if (container.parentElement) {
      observer.observe(container.parentElement)
    }
    updateScale()

    return () => observer.disconnect()
  }, [nativeSize])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: nativeSize * scale,
        height: nativeSize * scale,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: nativeSize,
          height: nativeSize,
        }}
      >
        {children}
      </div>
    </div>
  )
}
