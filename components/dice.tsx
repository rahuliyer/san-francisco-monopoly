"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface DiceProps {
  values: [number, number]
  rolling?: boolean
}

// Dot patterns for each die face value
const dots: Record<number, string[]> = {
  1: ["center"],
  2: ["top-right", "bottom-left"],
  3: ["top-right", "center", "bottom-left"],
  4: ["top-left", "top-right", "bottom-left", "bottom-right"],
  5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
  6: ["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"],
}

// Dot positioning classes
const dotPositions: Record<string, string> = {
  "top-left": "top-[15%] left-[15%]",
  "top-right": "top-[15%] right-[15%]",
  "middle-left": "top-1/2 -translate-y-1/2 left-[15%]",
  "middle-right": "top-1/2 -translate-y-1/2 right-[15%]",
  "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  "bottom-left": "bottom-[15%] left-[15%]",
  "bottom-right": "bottom-[15%] right-[15%]",
}

// 3D rotation values to show each face (rotateX, rotateY)
const faceRotations: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },       // front face
  2: { x: -90, y: 0 },     // top face
  3: { x: 0, y: 90 },      // right face
  4: { x: 0, y: -90 },     // left face
  5: { x: 90, y: 0 },      // bottom face
  6: { x: 0, y: 180 },     // back face
}

// Single face component for rendering dots
function DiceFace({ value, facePosition }: { value: number; facePosition: string }) {
  return (
    <div
      className={cn(
        "absolute h-14 w-14 rounded-lg bg-white border-2 border-stone-300",
        "flex items-center justify-center backface-hidden",
        facePosition
      )}
      style={{
        backfaceVisibility: "hidden",
      }}
    >
      {dots[value]?.map((pos, i) => (
        <div
          key={i}
          className={cn(
            "absolute h-2.5 w-2.5 rounded-full bg-stone-800",
            dotPositions[pos]
          )}
        />
      ))}
    </div>
  )
}

// 3D Die component
function Die3D({ value, rolling, delay = 0 }: { value: number; rolling?: boolean; delay?: number }) {
  const [currentRotation, setCurrentRotation] = useState({ x: 0, y: 0 })
  const [isAnimating, setIsAnimating] = useState(false)
  const animationRef = useRef<number | null>(null)
  const rollStartTimeRef = useRef<number>(0)

  useEffect(() => {
    if (rolling) {
      setIsAnimating(true)
      rollStartTimeRef.current = Date.now() + delay

      const animate = () => {
        const elapsed = Date.now() - rollStartTimeRef.current
        if (elapsed < 0) {
          // Still waiting for delay
          animationRef.current = requestAnimationFrame(animate)
          return
        }

        // Random tumbling rotation during roll
        const speed = 15
        setCurrentRotation(prev => ({
          x: prev.x + speed + Math.random() * 10,
          y: prev.y + speed + Math.random() * 10,
        }))

        animationRef.current = requestAnimationFrame(animate)
      }

      animationRef.current = requestAnimationFrame(animate)

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    } else {
      // Snap to final position showing the correct value
      setIsAnimating(false)
      const targetRotation = faceRotations[value]
      // Add full rotations for dramatic effect when stopping
      setCurrentRotation({
        x: targetRotation.x,
        y: targetRotation.y,
      })
    }
  }, [rolling, value, delay])

  return (
    <div
      className="relative h-14 w-14"
      style={{
        perspective: "200px",
      }}
    >
      <div
        className={cn(
          "relative h-14 w-14 transform-gpu",
          !isAnimating && "transition-transform duration-300 ease-out"
        )}
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${currentRotation.x}deg) rotateY(${currentRotation.y}deg)`,
        }}
      >
        {/* Front face - shows 1 */}
        <DiceFace value={1} facePosition="transform-gpu translate-z-[28px]" />
        
        {/* Back face - shows 6 */}
        <DiceFace value={6} facePosition="transform-gpu -translate-z-[28px] rotate-y-180" />
        
        {/* Top face - shows 2 */}
        <DiceFace value={2} facePosition="transform-gpu -translate-y-[28px] rotate-x-90 origin-bottom" />
        
        {/* Bottom face - shows 5 */}
        <DiceFace value={5} facePosition="transform-gpu translate-y-[28px] -rotate-x-90 origin-top" />
        
        {/* Right face - shows 3 */}
        <DiceFace value={3} facePosition="transform-gpu translate-x-[28px] rotate-y-90 origin-left" />
        
        {/* Left face - shows 4 */}
        <DiceFace value={4} facePosition="transform-gpu -translate-x-[28px] -rotate-y-90 origin-right" />
      </div>
    </div>
  )
}

export function Dice({ values, rolling }: DiceProps) {
  return (
    <div className="flex gap-4">
      <style jsx global>{`
        .translate-z-\\[28px\\] {
          transform: translateZ(28px);
        }
        .-translate-z-\\[28px\\] {
          transform: translateZ(-28px) rotateY(180deg);
        }
        .-translate-y-\\[28px\\].rotate-x-90 {
          transform: translateY(-28px) rotateX(90deg);
        }
        .translate-y-\\[28px\\].-rotate-x-90 {
          transform: translateY(28px) rotateX(-90deg);
        }
        .translate-x-\\[28px\\].rotate-y-90 {
          transform: translateX(28px) rotateY(90deg);
        }
        .-translate-x-\\[28px\\].-rotate-y-90 {
          transform: translateX(-28px) rotateY(-90deg);
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>
      <Die3D value={values[0]} rolling={rolling} delay={0} />
      <Die3D value={values[1]} rolling={rolling} delay={50} />
    </div>
  )
}
