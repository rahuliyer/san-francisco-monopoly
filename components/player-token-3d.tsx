"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"

interface PlayerToken3DProps {
  sprite: string
  color: string
  name?: string
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

const sizeConfig = {
  xs: { container: "h-6 w-6", pixels: 24 },
  sm: { container: "h-8 w-8", pixels: 32 },
  md: { container: "h-12 w-12", pixels: 48 },
  lg: { container: "h-16 w-16", pixels: 64 },
}

export function PlayerToken3D({ sprite, color, name, size = "md", className }: PlayerToken3DProps) {
  const config = sizeConfig[size]

  return (
    <div
      className={cn(
        "relative group transform-gpu transition-transform duration-200",
        "hover:scale-110 hover:-translate-y-0.5",
        config.container,
        className
      )}
      title={name}
    >
      {/* Drop shadow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-2 rounded-full blur-sm opacity-30"
        style={{ backgroundColor: color }}
      />

      {/* Token sprite */}
      <Image
        src={sprite}
        alt={name || "Player token"}
        width={config.pixels}
        height={config.pixels}
        className="relative z-10 object-contain drop-shadow-lg"
        style={{
          filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
        }}
      />
    </div>
  )
}
