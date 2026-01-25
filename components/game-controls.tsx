"use client"

import { Button } from "@/components/ui/button"
import { Dice } from "./dice"

interface GameControlsProps {
  diceValues: [number, number]
  rolling: boolean
  hasRolled: boolean
  onRoll: () => void
  currentPlayerName: string
}

export function GameControls({
  diceValues,
  rolling,
  hasRolled,
  onRoll,
  currentPlayerName,
}: GameControlsProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-4 shadow-md">
      <p className="text-sm font-medium text-stone-600">
        {currentPlayerName}&apos;s Turn
      </p>

      <Dice values={diceValues} rolling={rolling} />

      {hasRolled && !rolling && (
        <p className="text-lg font-bold text-stone-800">
          Rolled: {diceValues[0] + diceValues[1]}
        </p>
      )}

      <Button
        onClick={onRoll}
        disabled={hasRolled || rolling}
        className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50"
      >
        {rolling ? "Rolling..." : "Roll Dice"}
      </Button>
    </div>
  )
}
