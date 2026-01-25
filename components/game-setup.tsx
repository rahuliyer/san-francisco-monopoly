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
}

interface GameSetupProps {
  onStartGame: (players: PlayerSetup[]) => void
}

export function GameSetup({ onStartGame }: GameSetupProps) {
  const [playerCount, setPlayerCount] = useState(2)
  const [players, setPlayers] = useState<PlayerSetup[]>([
    { name: "Player 1", tokenIndex: 0 },
    { name: "Player 2", tokenIndex: 1 },
    { name: "Player 3", tokenIndex: 2 },
    { name: "Player 4", tokenIndex: 3 },
  ])

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
    onStartGame(players.slice(0, playerCount))
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-emerald-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-4xl font-bold text-stone-800">SF</h1>
          <h2 className="font-serif text-2xl font-bold tracking-widest text-amber-600">MONOPOLY</h2>
          <p className="mt-2 text-sm text-stone-500">The San Francisco Edition</p>
        </div>

        {/* Player count selector */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-stone-700">Number of Players</label>
          <div className="flex gap-2">
            {[2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => setPlayerCount(count)}
                className={cn(
                  "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                  playerCount === count
                    ? "bg-amber-500 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                )}
              >
                {count} Players
              </button>
            ))}
          </div>
        </div>

        {/* Player setup */}
        <div className="space-y-4">
          {Array.from({ length: playerCount }).map((_, i) => (
            <div key={i} className="rounded-lg border border-stone-200 p-3">
              <Input
                value={players[i].name}
                onChange={(e) => updatePlayerName(i, e.target.value)}
                placeholder={`Player ${i + 1}`}
                className="mb-3"
              />
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
                          ? "ring-2 ring-amber-500 ring-offset-2 bg-amber-50"
                          : "",
                        isTaken ? "cursor-not-allowed opacity-30" : "hover:bg-stone-100"
                      )}
                      title={token.name}
                    >
                      <PlayerToken3D
                        icon={token.icon}
                        color={token.color}
                        name={token.name}
                        size="md"
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={handleStart}
          className="mt-6 w-full bg-emerald-600 py-6 text-lg hover:bg-emerald-700"
        >
          Start Game
        </Button>
      </div>
    </div>
  )
}
