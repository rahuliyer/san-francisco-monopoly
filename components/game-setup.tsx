"use client"

import { useState } from "react"
import { PLAYER_TOKENS } from "@/lib/game-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { PlayerToken3D } from "@/components/player-token-3d"

interface PlayerSetup {
  name: string
  tokenIndex: number
  isComputer?: boolean
}

interface GameSetupProps {
  onStartGame: (players: PlayerSetup[]) => void
}

export function GameSetup({ onStartGame }: GameSetupProps) {
  const [playerCount, setPlayerCount] = useState(2)
  // Number of human-controlled seats; the remaining seats up to playerCount are
  // filled with computer players. Defaults to all-human.
  const [humanCount, setHumanCount] = useState(2)
  const [players, setPlayers] = useState<PlayerSetup[]>([
    { name: "Player 1", tokenIndex: 0 },
    { name: "Player 2", tokenIndex: 1 },
    { name: "Player 3", tokenIndex: 2 },
    { name: "Player 4", tokenIndex: 3 },
  ])

  const changePlayerCount = (count: number) => {
    setPlayerCount(count)
    // Changing the table size resets to all-human; the player can then choose
    // how many seats the computer should take via the Human Players selector.
    setHumanCount(count)
  }

  const updatePlayerName = (index: number, name: string) => {
    const newPlayers = [...players]
    newPlayers[index].name = name
    setPlayers(newPlayers)
  }

  const updatePlayerToken = (playerIndex: number, tokenIndex: number) => {
    // Check if token is already taken
    const isTaken = players.some(
      (p, i) => i !== playerIndex && i < playerCount && p.tokenIndex === tokenIndex
    )
    if (isTaken) return

    const newPlayers = [...players]
    newPlayers[playerIndex].tokenIndex = tokenIndex
    setPlayers(newPlayers)
  }

  const handleStart = () => {
    const seats = players.slice(0, playerCount).map((player, i) => {
      const isComputer = i >= humanCount
      return {
        name: isComputer ? `Computer ${i + 1}` : player.name,
        tokenIndex: player.tokenIndex,
        isComputer,
      }
    })
    onStartGame(seats)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#f5e6c8] via-[#e8dcc8] to-[#dccfb8] p-4 vintage-paper">
      <div className="w-full max-w-md rounded-lg bg-gradient-to-br from-[#faf6ee] to-[#f5efe3] p-6 shadow-xl border-2 border-[#8B6914] golden-glow">
        {/* Art Deco header */}
        <div className="mb-6 text-center relative">
          <div className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
          <h1 className="font-serif text-4xl font-bold tracking-[0.2em] text-[#2c4a5c] mt-4">SAN FRANCISCO</h1>
          <h2 className="font-serif text-2xl font-bold tracking-[0.3em] text-[#8B6914]">MONOPOLY</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-6 h-0.5 bg-[#8B6914]" />
            <div className="w-1.5 h-1.5 rotate-45 bg-[#d4af37]" />
            <div className="w-6 h-0.5 bg-[#8B6914]" />
          </div>
          <p className="mt-2 text-sm font-serif italic text-[#5c4a1f]">The City by the Bay Edition</p>
        </div>

        {/* Player count selector */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-serif font-medium text-[#5c4a1f]">Number of Players</label>
          <div className="flex gap-2">
            {[2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => changePlayerCount(count)}
                className={cn(
                  "flex-1 rounded-md py-2 text-sm font-serif font-medium transition-colors border",
                  playerCount === count
                    ? "bg-gradient-to-r from-[#d4af37] to-[#c4a030] text-white border-[#8B6914]"
                    : "bg-[#faf6ee] text-[#5c4a1f] hover:bg-[#f5efe3] border-[#d4af37]/30"
                )}
              >
                {count} Players
              </button>
            ))}
          </div>
        </div>

        {/* Human vs computer selector */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-serif font-medium text-[#5c4a1f]">Human Players</label>
          <div className="flex gap-2">
            {Array.from({ length: playerCount }).map((_, i) => {
              const count = i + 1
              return (
                <button
                  key={count}
                  onClick={() => setHumanCount(count)}
                  className={cn(
                    "flex-1 rounded-md py-2 text-sm font-serif font-medium transition-colors border",
                    humanCount === count
                      ? "bg-gradient-to-r from-[#2c6e4f] to-[#245a40] text-white border-[#2c6e4f]"
                      : "bg-[#faf6ee] text-[#5c4a1f] hover:bg-[#f5efe3] border-[#2c6e4f]/30"
                  )}
                >
                  {count}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs font-serif italic text-[#5c4a1f]">
            {playerCount - humanCount === 0
              ? "All players are human."
              : `The remaining ${playerCount - humanCount} ${playerCount - humanCount === 1 ? "seat" : "seats"} will be played by the computer.`}
          </p>
        </div>

        {/* Player setup */}
        <div className="space-y-4">
          {Array.from({ length: playerCount }).map((_, i) => {
            const isComputer = i >= humanCount
            return (
            <div key={i} className="rounded-lg border border-[#d4af37]/30 p-3 bg-[#faf6ee]">
              {isComputer ? (
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-serif font-medium text-[#2c3e50]">{`Computer ${i + 1}`}</span>
                  <span className="rounded-full bg-[#2c6e4f]/10 px-2 py-0.5 text-xs font-serif font-medium text-[#2c6e4f] border border-[#2c6e4f]/30">
                    Computer
                  </span>
                </div>
              ) : (
                <Input
                  value={players[i].name}
                  onChange={(e) => updatePlayerName(i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  className="mb-3 border-[#d4af37]/30 bg-white font-serif"
                />
              )}
              <div className="flex gap-3">
                {PLAYER_TOKENS.map((token, tokenIndex) => {
                  const isTaken =
                    players.some((p, pi) => pi !== i && pi < playerCount && p.tokenIndex === tokenIndex)
                  return (
                    <button
                      key={tokenIndex}
                      onClick={() => updatePlayerToken(i, tokenIndex)}
                      disabled={isTaken}
                      className={cn(
                        "p-1 rounded-lg transition-all",
                        players[i].tokenIndex === tokenIndex
                          ? "ring-2 ring-[#d4af37] ring-offset-2 bg-[#d4af37]/10"
                          : "",
                        isTaken ? "cursor-not-allowed opacity-30" : "hover:bg-[#f5efe3]"
                      )}
                      title={token.name}
                    >
                      <PlayerToken3D
                        sprite={token.sprite}
                        color={token.color}
                        name={token.name}
                        size="md"
                      />
                    </button>
                  )
                })}
              </div>
            </div>
            )
          })}
        </div>

        <Button
          onClick={handleStart}
          className="mt-6 w-full bg-gradient-to-r from-[#d4af37] to-[#c4a030] hover:from-[#c4a030] hover:to-[#b49028] py-6 text-lg font-serif font-bold tracking-[0.1em] border border-[#8B6914]"
        >
          START GAME
        </Button>
      </div>
    </div>
  )
}
