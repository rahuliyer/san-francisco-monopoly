"use client"

import { Player, BOARD_SPACES } from "@/lib/game-data"
import { PlayerToken3D } from "./player-token-3d"
import { Button } from "@/components/ui/button"
import { Trophy } from "lucide-react"

interface VictoryModalProps {
  winner: Player
  players: Player[]
  propertyOwners: Record<number, number>
  onPlayAgain: () => void
}

export function VictoryModal({
  winner,
  players,
  propertyOwners,
  onPlayAgain,
}: VictoryModalProps) {
  // Count properties owned by winner
  const winnerPropertyCount = Object.values(propertyOwners).filter(
    (ownerId) => ownerId === winner.id
  ).length

  // Get total property value
  const winnerPropertyValue = Object.entries(propertyOwners)
    .filter(([, ownerId]) => ownerId === winner.id)
    .reduce((sum, [spaceId]) => {
      const space = BOARD_SPACES[Number(spaceId)]
      return sum + (space?.price ?? 0)
    }, 0)

  // Calculate final net worth
  const finalNetWorth = winner.money + winnerPropertyValue

  // Sort players by final net worth for standings
  const standings = [...players]
    .map((player) => {
      const propertyValue = Object.entries(propertyOwners)
        .filter(([, ownerId]) => ownerId === player.id)
        .reduce((sum, [spaceId]) => {
          const space = BOARD_SPACES[Number(spaceId)]
          return sum + (space?.price ?? 0)
        }, 0)
      return {
        ...player,
        netWorth: player.money + propertyValue,
      }
    })
    .sort((a, b) => {
      // Winner always first, then by net worth
      if (a.id === winner.id) return -1
      if (b.id === winner.id) return 1
      return b.netWorth - a.netWorth
    })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-gradient-to-br from-[#faf6ee] to-[#f5efe3] shadow-2xl border-2 border-[#d4af37]">
        {/* Decorative header with confetti-like pattern */}
        <div className="relative bg-gradient-to-r from-[#d4af37] via-[#f0d77d] to-[#d4af37] py-6 text-center">
          {/* Trophy icon */}
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Trophy className="h-10 w-10 text-white drop-shadow-lg" />
          </div>

          <h2 className="text-2xl font-serif font-bold text-white drop-shadow-md">
            Victory!
          </h2>
          <p className="text-sm font-serif text-white/90 mt-1">
            The real estate empire has been claimed
          </p>

          {/* Decorative corner accents */}
          <div className="absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-white/40" />
          <div className="absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-white/40" />
        </div>

        {/* Winner display */}
        <div className="px-6 py-5">
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-3 rounded-full bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 p-4">
              <PlayerToken3D
                sprite={winner.token}
                color={winner.color}
                name={winner.name}
                size="lg"
              />
            </div>
            <h3 className="text-2xl font-serif font-bold text-[#2c3e50]">
              {winner.name}
            </h3>
            <p className="text-sm font-serif text-[#8B6914]">
              San Francisco Tycoon
            </p>
          </div>

          {/* Winner stats */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-[#2c6e4f]/10 border border-[#2c6e4f]/20 p-3 text-center">
              <p className="text-lg font-serif font-bold text-[#2c6e4f]">
                ${winner.money.toLocaleString()}
              </p>
              <p className="text-xs text-[#3d8b65]">Cash</p>
            </div>
            <div className="rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 p-3 text-center">
              <p className="text-lg font-serif font-bold text-[#8B6914]">
                {winnerPropertyCount}
              </p>
              <p className="text-xs text-[#a68a2a]">Properties</p>
            </div>
            <div className="rounded-lg bg-[#2c4a5c]/10 border border-[#2c4a5c]/20 p-3 text-center">
              <p className="text-lg font-serif font-bold text-[#2c4a5c]">
                ${finalNetWorth.toLocaleString()}
              </p>
              <p className="text-xs text-[#3d5a6c]">Net Worth</p>
            </div>
          </div>

          {/* Final standings */}
          <div className="mb-6">
            <h4 className="mb-3 text-sm font-serif font-semibold text-[#5c4a1f] uppercase tracking-wider">
              Final Standings
            </h4>
            <div className="space-y-2">
              {standings.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 rounded-lg p-2 ${
                    player.id === winner.id
                      ? "bg-[#d4af37]/15 border border-[#d4af37]/30"
                      : "bg-[#f5efe3] border border-[#c4b897]/30"
                  }`}
                >
                  <span className={`w-6 text-center font-serif font-bold ${
                    index === 0 ? "text-[#d4af37]" : "text-[#5c4a1f]"
                  }`}>
                    {index + 1}.
                  </span>
                  <PlayerToken3D
                    sprite={player.token}
                    color={player.color}
                    name={player.name}
                    size="sm"
                  />
                  <span className={`flex-1 font-serif ${
                    player.isBankrupt ? "text-[#8b3a3a] line-through" : "text-[#2c3e50]"
                  }`}>
                    {player.name}
                  </span>
                  <span className={`font-serif font-medium ${
                    player.isBankrupt ? "text-[#8b3a3a]" : "text-[#5c4a1f]"
                  }`}>
                    {player.isBankrupt ? "Bankrupt" : `$${player.netWorth.toLocaleString()}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Play again button */}
          <Button
            onClick={onPlayAgain}
            className="w-full bg-gradient-to-r from-[#d4af37] to-[#c4a030] hover:from-[#c4a030] hover:to-[#b49028] text-white font-serif shadow-md border border-[#8B6914]"
          >
            Play Again
          </Button>
        </div>
      </div>
    </div>
  )
}
