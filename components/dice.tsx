"use client"

import { useState, useEffect, useCallback } from "react"
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

// Dot positioning styles
const dotPositions: Record<string, React.CSSProperties> = {
  "top-left": { top: "15%", left: "15%" },
  "top-right": { top: "15%", right: "15%" },
  "middle-left": { top: "50%", left: "15%", transform: "translateY(-50%)" },
  "middle-right": { top: "50%", right: "15%", transform: "translateY(-50%)" },
  "center": { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
  "bottom-left": { bottom: "15%", left: "15%" },
  "bottom-right": { bottom: "15%", right: "15%" },
}

// Rotation needed to show each face value facing forward
// Standard die: opposite faces sum to 7 (1-6, 2-5, 3-4)
const faceRotations: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },        // front
  2: { x: -90, y: 0 },      // top rotated to front
  3: { x: 0, y: -90 },      // right rotated to front
  4: { x: 0, y: 90 },       // left rotated to front
  5: { x: 90, y: 0 },       // bottom rotated to front
  6: { x: 180, y: 0 },      // back rotated to front
}

const CUBE_SIZE = 56 // 14 * 4 = 56px (h-14 w-14)
const HALF_SIZE = CUBE_SIZE / 2

// Single face component - Art Deco styled with ivory/cream colors
function DiceFace({
  value,
  transform
}: {
  value: number
  transform: string
}) {
  return (
    <div
      className="absolute flex items-center justify-center rounded-lg border-2 border-[#8B6914] bg-gradient-to-br from-[#faf6ee] to-[#e8dcc8]"
      style={{
        width: CUBE_SIZE,
        height: CUBE_SIZE,
        transform,
        backfaceVisibility: "hidden",
        boxShadow: "inset 0 1px 2px rgba(212, 175, 55, 0.3)",
      }}
    >
      {dots[value]?.map((pos, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-[#2c3e50]"
          style={{
            width: 10,
            height: 10,
            ...dotPositions[pos],
          }}
        />
      ))}
    </div>
  )
}

// 3D Die component
function Die3D({ value, rolling, delay = 0 }: { value: number; rolling?: boolean; delay?: number }) {
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 })
  const [isRolling, setIsRolling] = useState(false)
  const [rollId, setRollId] = useState(0)

  // Calculate target rotation for a given value
  const getTargetRotation = useCallback((targetValue: number, addSpins: boolean = false) => {
    const base = faceRotations[targetValue]
    if (addSpins) {
      // Add multiple full rotations for dramatic effect
      const spinsX = (2 + Math.floor(Math.random() * 2)) * 360
      const spinsY = (2 + Math.floor(Math.random() * 2)) * 360
      return {
        x: base.x + spinsX,
        y: base.y + spinsY,
        z: Math.random() * 360,
      }
    }
    return { x: base.x, y: base.y, z: 0 }
  }, [])

  useEffect(() => {
    if (rolling) {
      // Start rolling animation after delay
      const delayTimer = setTimeout(() => {
        setIsRolling(true)
        setRollId(prev => prev + 1)
        
        // Set a random tumbling rotation
        setRotation({
          x: Math.random() * 720 + 360,
          y: Math.random() * 720 + 360,
          z: Math.random() * 360,
        })
      }, delay)

      return () => clearTimeout(delayTimer)
    } else {
      // Stop rolling - animate to final position
      if (isRolling) {
        setIsRolling(false)
        // Smoothly transition to the face showing the correct value
        const target = getTargetRotation(value, true)
        setRotation(target)
        
        // After animation completes, reset to base rotation
        const resetTimer = setTimeout(() => {
          setRotation(getTargetRotation(value, false))
        }, 800)
        
        return () => clearTimeout(resetTimer)
      } else {
        // Initial mount or direct value change without rolling
        setRotation(getTargetRotation(value, false))
      }
    }
  }, [rolling, value, delay, isRolling, getTargetRotation])

  // Continuous tumbling while rolling
  useEffect(() => {
    if (!isRolling) return

    const interval = setInterval(() => {
      setRotation(prev => ({
        x: prev.x + 120 + Math.random() * 60,
        y: prev.y + 120 + Math.random() * 60,
        z: prev.z + 30 + Math.random() * 30,
      }))
    }, 150)

    return () => clearInterval(interval)
  }, [isRolling, rollId])

  return (
    <div
      className="relative"
      style={{
        width: CUBE_SIZE,
        height: CUBE_SIZE,
        perspective: 300,
      }}
    >
      <div
        className="absolute"
        style={{
          width: CUBE_SIZE,
          height: CUBE_SIZE,
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
          transition: isRolling 
            ? "transform 0.15s linear" 
            : "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      >
        {/* Front face - 1 */}
        <DiceFace 
          value={1} 
          transform={`translateZ(${HALF_SIZE}px)`} 
        />
        
        {/* Back face - 6 */}
        <DiceFace 
          value={6} 
          transform={`rotateY(180deg) translateZ(${HALF_SIZE}px)`} 
        />
        
        {/* Top face - 2 */}
        <DiceFace 
          value={2} 
          transform={`rotateX(90deg) translateZ(${HALF_SIZE}px)`} 
        />
        
        {/* Bottom face - 5 */}
        <DiceFace 
          value={5} 
          transform={`rotateX(-90deg) translateZ(${HALF_SIZE}px)`} 
        />
        
        {/* Right face - 3 */}
        <DiceFace 
          value={3} 
          transform={`rotateY(90deg) translateZ(${HALF_SIZE}px)`} 
        />
        
        {/* Left face - 4 */}
        <DiceFace 
          value={4} 
          transform={`rotateY(-90deg) translateZ(${HALF_SIZE}px)`} 
        />
      </div>
      
      {/* Shadow - warm brown tint */}
      <div
        className="absolute rounded-lg bg-[#5c4a1f]/30 blur-sm"
        style={{
          width: CUBE_SIZE - 8,
          height: 8,
          bottom: -12,
          left: 4,
          transform: isRolling ? "scale(1.2)" : "scale(1)",
          opacity: isRolling ? 0.3 : 0.4,
          transition: "all 0.3s ease-out",
        }}
      />
    </div>
  )
}

export function Dice({ values, rolling }: DiceProps) {
  return (
    <div className="flex gap-4 py-2">
      <Die3D value={values[0]} rolling={rolling} delay={0} />
      <Die3D value={values[1]} rolling={rolling} delay={100} />
    </div>
  )
}
