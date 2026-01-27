"use client"

import { Button } from "@/components/ui/button"
import { Dice } from "./dice"

interface GameControlsProps {
  diceValues: [number, number]
  rolling: boolean
  hasRolled: boolean
  onRoll: () => void
  currentPlayerName: string
  isInJail?: boolean
  jailTurns?: number
  onPayJailFee?: () => void
  canAffordJailFee?: boolean
  onTrade?: () => void
  tradeDisabled?: boolean
}

export function GameControls({
  diceValues,
  rolling,
  hasRolled,
  onRoll,
  currentPlayerName,
  isInJail = false,
  jailTurns = 0,
  onPayJailFee,
  canAffordJailFee = true,
  onTrade,
  tradeDisabled = false,
}: GameControlsProps) {
  const isLastJailTurn = isInJail && jailTurns >= 2

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-4 shadow-md">
      <p className="text-sm font-medium text-stone-600">
        {currentPlayerName}&apos;s Turn
      </p>

      {isInJail && (
        <div className="w-full rounded-lg bg-red-50 border border-red-200 p-3 text-center">
          <p className="text-sm font-semibold text-red-700">🔒 In Alcatraz</p>
          <p className="text-xs text-red-600 mt-1">
            {isLastJailTurn 
              ? "Final turn - must pay $50 or roll doubles!" 
              : `Turn ${jailTurns + 1} of 3 - Roll doubles to escape!`}
          </p>
        </div>
      )}

      <Dice values={diceValues} rolling={rolling} />

      {hasRolled && !rolling && (
        <div className="text-center">
          <p className="text-lg font-bold text-stone-800">
            Rolled: {diceValues[0] + diceValues[1]}
          </p>
          {isInJail && diceValues[0] === diceValues[1] && (
            <p className="text-sm font-medium text-green-600 mt-1">
              Doubles! You&apos;re free!
            </p>
          )}
          {isInJail && diceValues[0] !== diceValues[1] && !isLastJailTurn && (
            <p className="text-sm font-medium text-red-600 mt-1">
              No doubles - still in Alcatraz
            </p>
          )}
        </div>
      )}

      <div className="flex w-full flex-col gap-2">
        {isInJail && !hasRolled ? (
          <>
            <Button
              onClick={onRoll}
              disabled={rolling}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 w-full"
            >
              {rolling ? "Rolling..." : "Roll for Doubles"}
            </Button>
            {onPayJailFee && (
              <Button
                onClick={onPayJailFee}
                disabled={!canAffordJailFee || rolling || hasRolled}
                variant="outline"
                className="w-full border-red-300 text-red-700 hover:bg-red-50"
              >
                Pay $50 to Leave
              </Button>
            )}
          </>
        ) : (
          <Button
            onClick={onRoll}
            disabled={hasRolled || rolling}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50"
          >
            {rolling ? "Rolling..." : "Roll Dice"}
          </Button>
        )}

        {onTrade && (
          <Button
            onClick={onTrade}
            disabled={tradeDisabled}
            variant="outline"
            className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            Trade
          </Button>
        )}
      </div>
    </div>
  )
}
