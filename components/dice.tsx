"use client"

import { cn } from "@/lib/utils"

interface DiceProps {
  values: [number, number]
  rolling?: boolean
}

function DieFace({ value, rolling }: { value: number; rolling?: boolean }) {
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

  return (
    <div
      className={cn(
        "relative h-14 w-14 rounded-lg bg-white shadow-lg",
        rolling && "animate-bounce"
      )}
    >
      {dots[value]?.map((pos, i) => (
        <div
          key={i}
          className={cn("absolute h-2.5 w-2.5 rounded-full bg-stone-800", dotPositions[pos])}
        />
      ))}
    </div>
  )
}

export function Dice({ values, rolling }: DiceProps) {
  return (
    <div className="flex gap-3">
      <DieFace value={values[0]} rolling={rolling} />
      <DieFace value={values[1]} rolling={rolling} />
    </div>
  )
}
