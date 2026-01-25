"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface DiceProps {
  values: [number, number]
  rolling?: boolean
}

const dots: Record<number, string[]> = {
  1: ["center"],
  2: ["top-right", "bottom-left"],
  3: ["top-right", "center", "bottom-left"],
  4: ["top-left", "top-right", "bottom-left", "bottom-right"],
  5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
  6: ["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"],
}

const dotPositions: Record<string, string> = {
  "top-left": "top-1.5 left-1.5",
  "top-right": "top-1.5 right-1.5",
  "middle-left": "top-1/2 -translate-y-1/2 left-1.5",
  "middle-right": "top-1/2 -translate-y-1/2 right-1.5",
  "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  "bottom-left": "bottom-1.5 left-1.5",
  "bottom-right": "bottom-1.5 right-1.5",
}

function DieFace({ value, rolling, delay = 0 }: { value: number; rolling?: boolean; delay?: number }) {
  const [displayValue, setDisplayValue] = useState(value)
  
  useEffect(() => {
    if (rolling) {
      // Cycle through random values while rolling
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1)
      }, 80)
      
      return () => clearInterval(interval)
    } else {
      setDisplayValue(value)
    }
  }, [rolling, value])

  return (
    <div
      className={cn(
        "relative h-14 w-14 rounded-lg bg-white shadow-lg transition-all duration-100",
        "border-2 border-stone-200",
        rolling && "dice-rolling"
      )}
      style={{
        animationDelay: rolling ? `${delay}ms` : "0ms",
      }}
    >
      {dots[displayValue]?.map((pos, i) => (
        <div
          key={i}
          className={cn(
            "absolute h-2.5 w-2.5 rounded-full bg-stone-800 transition-all duration-75",
            dotPositions[pos]
          )}
        />
      ))}
    </div>
  )
}

export function Dice({ values, rolling }: DiceProps) {
  return (
    <div className="flex gap-3">
      <style jsx global>{`
        @keyframes diceRoll {
          0% {
            transform: rotate(0deg) scale(1);
          }
          10% {
            transform: rotate(-15deg) scale(1.1);
          }
          20% {
            transform: rotate(15deg) scale(1.05);
          }
          30% {
            transform: rotate(-10deg) scale(1.1);
          }
          40% {
            transform: rotate(10deg) scale(1.05);
          }
          50% {
            transform: rotate(-5deg) scale(1.08);
          }
          60% {
            transform: rotate(5deg) scale(1.05);
          }
          70% {
            transform: rotate(-3deg) scale(1.06);
          }
          80% {
            transform: rotate(3deg) scale(1.03);
          }
          90% {
            transform: rotate(-1deg) scale(1.01);
          }
          100% {
            transform: rotate(0deg) scale(1);
          }
        }
        
        .dice-rolling {
          animation: diceRoll 0.4s ease-in-out infinite;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
        }
      `}</style>
      <DieFace value={values[0]} rolling={rolling} delay={0} />
      <DieFace value={values[1]} rolling={rolling} delay={50} />
    </div>
  )
}
