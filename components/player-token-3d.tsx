"use client"

import { cn } from "@/lib/utils"

interface PlayerToken3DProps {
  icon: string
  color: string
  name?: string
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  xs: "h-4 w-4 text-[8px]",
  sm: "h-6 w-6 text-xs",
  md: "h-10 w-10 text-lg",
  lg: "h-14 w-14 text-2xl",
}

export function PlayerToken3D({ icon, color, name, size = "md", className }: PlayerToken3DProps) {
  // Calculate lighter and darker shades for 3D effect
  const lightenColor = (hex: string, percent: number): string => {
    const num = parseInt(hex.replace("#", ""), 16)
    const r = Math.min(255, (num >> 16) + Math.round(255 * percent))
    const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(255 * percent))
    const b = Math.min(255, (num & 0x0000ff) + Math.round(255 * percent))
    return `rgb(${r}, ${g}, ${b})`
  }

  const darkenColor = (hex: string, percent: number): string => {
    const num = parseInt(hex.replace("#", ""), 16)
    const r = Math.max(0, (num >> 16) - Math.round(255 * percent))
    const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * percent))
    const b = Math.max(0, (num & 0x0000ff) - Math.round(255 * percent))
    return `rgb(${r}, ${g}, ${b})`
  }

  const lightColor = lightenColor(color, 0.3)
  const darkColor = darkenColor(color, 0.3)
  const shadowColor = darkenColor(color, 0.5)

  return (
    <div
      className={cn("relative group", className)}
      title={name}
      style={{ perspective: "100px" }}
    >
      {/* Base shadow on the ground */}
      <div
        className={cn(
          "absolute rounded-full blur-sm opacity-40",
          sizeClasses[size]
        )}
        style={{
          backgroundColor: shadowColor,
          transform: "translateY(15%) scaleY(0.3)",
          zIndex: 0,
        }}
      />

      {/* Main token body - cylindrical base */}
      <div
        className={cn(
          "relative rounded-full flex items-center justify-center overflow-hidden",
          "transform-gpu transition-transform duration-200",
          "group-hover:scale-105 group-hover:-translate-y-0.5",
          sizeClasses[size]
        )}
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 100%, ${darkColor} 0%, transparent 50%),
            radial-gradient(ellipse 80% 50% at 50% 0%, ${lightColor} 0%, transparent 50%),
            linear-gradient(180deg, ${lightColor} 0%, ${color} 30%, ${darkColor} 100%)
          `,
          boxShadow: `
            inset 0 2px 4px 0 rgba(255, 255, 255, 0.4),
            inset 0 -2px 4px 0 rgba(0, 0, 0, 0.3),
            0 4px 6px -1px rgba(0, 0, 0, 0.3),
            0 2px 4px -1px rgba(0, 0, 0, 0.2)
          `,
          border: `1px solid ${darkColor}`,
          transformStyle: "preserve-3d",
          transform: "rotateX(15deg)",
        }}
      >
        {/* Top highlight ring */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.5) 0%, transparent 40%),
              radial-gradient(circle at 70% 80%, rgba(0, 0, 0, 0.2) 0%, transparent 40%)
            `,
          }}
        />

        {/* Metallic rim effect */}
        <div
          className="absolute inset-[2px] rounded-full pointer-events-none"
          style={{
            boxShadow: `
              inset 0 1px 2px 0 rgba(255, 255, 255, 0.5),
              inset 0 -1px 2px 0 rgba(0, 0, 0, 0.2)
            `,
          }}
        />

        {/* Icon with shadow for depth */}
        <span
          className="relative z-10 drop-shadow-md"
          style={{
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
            filter: "drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2))",
          }}
        >
          {icon}
        </span>
      </div>

      {/* 3D edge/thickness ring */}
      <div
        className={cn(
          "absolute top-0 left-0 rounded-full",
          sizeClasses[size]
        )}
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${darkColor} 80%, ${shadowColor} 100%)`,
          transform: "translateY(2px)",
          zIndex: -1,
          opacity: 0.7,
        }}
      />
    </div>
  )
}
