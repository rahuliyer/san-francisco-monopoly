"use client"

import { Player, BOARD_SPACES } from "@/lib/game-data"
import { cn } from "@/lib/utils"
import { PlayerToken3D } from "@/components/player-token-3d"

interface PlayerPanelProps {
  player: Player
  isCurrentTurn: boolean
  propertyOwners: Record<number, number>
  onPropertiesClick?: () => void
}

export function PlayerPanel({ player, isCurrentTurn, propertyOwners, onPropertiesClick }: PlayerPanelProps) {
  const ownedProperties = BOARD_SPACES.filter(
    (space) => propertyOwners[space.id] === player.id
  )

  return (
    <div
      className={cn(
        "rounded-lg border-2 bg-white p-4 shadow-md transition-all",
        isCurrentTurn ? "border-amber-400 ring-2 ring-amber-200" : "border-stone-200"
      )}
    >
      <div className="flex items-center gap-3">
        <PlayerToken3D
          icon={player.token}
          color={player.color}
          name={player.name}
          size="md"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-stone-800">{player.name}</h3>
          <p className="text-lg font-bold text-emerald-600">${player.money.toLocaleString()}</p>
        </div>
        {isCurrentTurn && (
          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
            Your Turn
          </span>
        )}
      </div>

      {player.inJail && (
        <div className="mt-2 rounded bg-red-100 px-2 py-1 text-xs text-red-700">
          In Alcatraz ({3 - player.jailTurns} turns left)
        </div>
      )}

      {ownedProperties.length > 0 && (
        <button
          onClick={onPropertiesClick}
          className="mt-3 w-full border-t pt-3 text-left transition-colors hover:bg-stone-50 rounded-b-md -mx-4 px-4 -mb-4 pb-4"
        >
          <p className="mb-2 text-xs font-medium text-stone-500 flex items-center gap-1">
            Properties ({ownedProperties.length})
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </p>
          <div className="flex flex-wrap gap-1">
            {ownedProperties.map((prop) => (
              <div
                key={prop.id}
                className="h-3 w-3 rounded-sm"
                style={{
                  backgroundColor:
                    prop.colorGroup === "railroad"
                      ? "#4A4A4A"
                      : prop.colorGroup === "utility"
                        ? "#D3D3D3"
                        : prop.colorGroup
                          ? {
                              brown: "#8B4513",
                              "light-blue": "#87CEEB",
                              pink: "#FF69B4",
                              orange: "#FFA500",
                              red: "#FF0000",
                              yellow: "#FFD700",
                              green: "#228B22",
                              "dark-blue": "#00008B",
                            }[prop.colorGroup]
                          : "#ccc",
                }}
                title={prop.name}
              />
            ))}
          </div>
        </button>
      )}
    </div>
  )
}
