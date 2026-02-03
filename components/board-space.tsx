"use client"

import Image from "next/image"
import type { SpaceType } from "@/lib/game-data"
import { Space, Player, COLOR_MAP } from "@/lib/game-data"
import { cn } from "@/lib/utils"
import { PlayerToken3D } from "@/components/player-token-3d"

interface BoardSpaceProps {
  space: Space
  players: Player[]
  position: "bottom" | "left" | "top" | "right"
  isCorner?: boolean
  onClick?: () => void
  ownerColor?: string
  houseCount?: number
}

// Check if this is a special space that should show an image
function isSpecialSpace(type: SpaceType): boolean {
  return ["go", "jail", "free-parking", "go-to-jail", "chance", "community-chest"].includes(type)
}

export function BoardSpace({ space, players, position, isCorner, onClick, ownerColor, houseCount }: BoardSpaceProps) {
  const playersOnSpace = players.filter((p) => p.position === space.id)
  const colorBarColor = space.colorGroup ? COLOR_MAP[space.colorGroup] : undefined
  const resolvedHouseCount = Math.max(0, houseCount ?? 0)

  const isVertical = position === "left" || position === "right"
  const hasSpecialImage = isSpecialSpace(space.type) && space.image

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex cursor-pointer border border-[#8B6914]/50 transition-all overflow-hidden",
        isCorner ? "h-20 w-20 items-center justify-center" : isVertical ? "h-12 w-20" : "h-20 w-12",
        ownerColor && "ring-2 ring-inset",
        hasSpecialImage ? "bg-[#2c3e50]" : "bg-[#f5f0e6] hover:bg-[#eee8d8]"
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

      {/* Houses/Hotel marker */}
      {space.type === "property" && resolvedHouseCount > 0 && (
        <div className="pointer-events-none absolute right-1 top-1 z-20 flex flex-wrap gap-0.5">
          {resolvedHouseCount >= 5 ? (
            <span className="h-2 w-2 rounded-sm border border-white/80 bg-red-600 shadow-sm" />
          ) : (
            Array.from({ length: resolvedHouseCount }).map((_, index) => (
              <span
                key={`house-${space.id}-${index}`}
                className="h-1.5 w-1.5 rounded-sm border border-white/80 bg-emerald-600 shadow-sm"
              />
            ))
          )}
        </div>
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
                "text-center font-serif font-semibold leading-tight text-[#2c3e50]",
                isCorner ? "text-[8px]" : "text-[7px]"
              )}
            >
              {space.name}
            </span>
            {space.price && <span className="text-[6px] text-[#5c4a1f] font-medium">${space.price}</span>}
          </>
        ) : hasSpecialImage ? (
          <div className="flex flex-col items-center justify-end h-full pb-1">
            <span
              className={cn(
                "font-serif font-bold text-white drop-shadow-md text-center leading-tight",
                isCorner ? "text-[9px]" : "text-[7px]"
              )}
            >
              {space.name}
            </span>
          </div>
        ) : (
          <span className={cn("font-serif font-bold text-[#2c3e50] text-center", isCorner ? "text-[9px]" : "text-[7px]")}>
            {space.name}
          </span>
        )}
      </div>

      {/* Players on this space */}
      {playersOnSpace.length > 0 && (
        <div className="absolute bottom-1 left-1/2 z-20 flex -translate-x-1/2 gap-0.5">
          {playersOnSpace.map((player) => (
            <PlayerToken3D
              key={player.id}
              sprite={player.token}
              color={player.color}
              name={player.name}
              size="xs"
            />
          ))}
        </div>
      )}
    </div>
  )
}
