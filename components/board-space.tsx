"use client"

import Image from "next/image"
import type { SpaceType } from "@/lib/game-data"
import { Space, Player, COLOR_MAP } from "@/lib/game-data"
import { cn } from "@/lib/utils"

interface BoardSpaceProps {
  space: Space
  players: Player[]
  position: "bottom" | "left" | "top" | "right"
  isCorner?: boolean
  onClick?: () => void
  ownerColor?: string
}

// Check if this is a special space that should show an image
function isSpecialSpace(type: SpaceType): boolean {
  return ["go", "jail", "free-parking", "go-to-jail", "chance", "community-chest"].includes(type)
}

export function BoardSpace({ space, players, position, isCorner, onClick, ownerColor }: BoardSpaceProps) {
  const playersOnSpace = players.filter((p) => p.position === space.id)
  const colorBarColor = space.colorGroup ? COLOR_MAP[space.colorGroup] : undefined

  const isVertical = position === "left" || position === "right"
  const hasSpecialImage = isSpecialSpace(space.type) && space.image

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex cursor-pointer border border-stone-300 transition-all overflow-hidden",
        isCorner ? "h-20 w-20 items-center justify-center" : isVertical ? "h-12 w-20" : "h-20 w-12",
        ownerColor && "ring-2 ring-inset",
        hasSpecialImage ? "bg-stone-900" : "bg-stone-50 hover:bg-stone-100"
      )}
      style={ownerColor ? { boxShadow: `inset 0 0 0 2px ${ownerColor}` } : undefined}
    >
      {/* Background image for special spaces */}
      {hasSpecialImage && (
        <>
          <Image
            src={space.image || ""}
            alt={space.name}
            fill
            className="object-cover opacity-80 hover:opacity-100 transition-opacity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </>
      )}

      {/* Color bar for properties */}
      {colorBarColor && !isCorner && (
        <div
          className={cn(
            "absolute z-10",
            position === "bottom" && "left-0 top-0 h-4 w-full",
            position === "top" && "bottom-0 left-0 h-4 w-full",
            position === "left" && "right-0 top-0 h-full w-4",
            position === "right" && "left-0 top-0 h-full w-4"
          )}
          style={{ backgroundColor: colorBarColor }}
        />
      )}

      {/* Space content */}
      <div
        className={cn(
          "relative z-10 flex flex-1 flex-col items-center justify-center gap-0.5 p-1",
          position === "bottom" && !hasSpecialImage && "pt-5",
          position === "top" && !hasSpecialImage && "pb-5",
          position === "left" && !hasSpecialImage && "pr-5",
          position === "right" && !hasSpecialImage && "pl-5"
        )}
      >
        {space.type === "property" || space.type === "railroad" || space.type === "utility" ? (
          <>
            <span
              className={cn(
                "text-center font-medium leading-tight text-stone-800",
                isCorner ? "text-[8px]" : "text-[7px]"
              )}
            >
              {space.name}
            </span>
            {space.price && <span className="text-[6px] text-stone-600">${space.price}</span>}
          </>
        ) : hasSpecialImage ? (
          <div className="flex flex-col items-center justify-end h-full pb-1">
            <span 
              className={cn(
                "font-bold text-white drop-shadow-md text-center leading-tight",
                isCorner ? "text-[9px]" : "text-[7px]"
              )}
            >
              {space.name}
            </span>
          </div>
        ) : (
          <span className={cn("font-bold text-stone-700 text-center", isCorner ? "text-[9px]" : "text-[7px]")}>
            {space.name}
          </span>
        )}
      </div>

      {/* Players on this space */}
      {playersOnSpace.length > 0 && (
        <div className="absolute bottom-1 left-1/2 z-20 flex -translate-x-1/2 gap-0.5">
          {playersOnSpace.map((player) => (
            <div
              key={player.id}
              className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] shadow-md border border-white/50"
              style={{ backgroundColor: player.color }}
              title={player.name}
            >
              {player.token}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
