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
  gameOver?: boolean
  winnerName?: string
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
  gameOver = false,
  winnerName,
}: GameControlsProps) {
  const isLastJailTurn = isInJail && jailTurns >= 2

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg bg-gradient-to-br from-[#faf6ee] to-[#f5efe3] p-4 shadow-md border-2 border-[#c4b897]">
      <p className="text-sm font-serif font-medium text-[#5c4a1f]">
        {gameOver ? "Game Over" : `${currentPlayerName}'s Turn`}
      </p>

      {gameOver && (
        <div className="w-full rounded-lg bg-[#2c6e4f]/10 border border-[#2c6e4f]/30 p-3 text-center">
          <p className="text-sm font-serif font-semibold text-[#2c6e4f]">
            {winnerName ? `${winnerName} wins!` : "Final results"}
          </p>
        </div>
      )}

      {isInJail && (
        <div className="w-full rounded-lg bg-[#c94c4c]/10 border border-[#c94c4c]/30 p-3 text-center">
          <p className="text-sm font-serif font-semibold text-[#8b3a3a]">In Alcatraz</p>
          <p className="text-xs text-[#a04848] mt-1">
            {isLastJailTurn
              ? "Final turn - must pay $50 or roll doubles!"
              : `Turn ${jailTurns + 1} of 3 - Roll doubles to escape!`}
          </p>
        </div>
      )}

      <Dice values={diceValues} rolling={rolling} />

      {hasRolled && !rolling && (
        <div className="text-center">
          <p className="text-lg font-serif font-bold text-[#2c3e50]">
            Rolled: {diceValues[0] + diceValues[1]}
          </p>
          {isInJail && diceValues[0] === diceValues[1] && (
            <p className="text-sm font-medium text-[#2c6e4f] mt-1">
              Doubles! You&apos;re free!
            </p>
          )}
          {isInJail && diceValues[0] !== diceValues[1] && !isLastJailTurn && (
            <p className="text-sm font-medium text-[#8b3a3a] mt-1">
              No doubles - still in Alcatraz
            </p>
          )}
        </div>
      )}

      {!gameOver && (
        <div className="flex w-full flex-col gap-2">
          {isInJail && !hasRolled ? (
            <>
              <Button
                onClick={onRoll}
                disabled={rolling}
                className="bg-gradient-to-r from-[#d4af37] to-[#c4a030] hover:from-[#c4a030] hover:to-[#b49028] text-white font-serif shadow-md disabled:opacity-50 w-full border border-[#8B6914]"
              >
                {rolling ? "Rolling..." : "Roll for Doubles"}
              </Button>
              {onPayJailFee && (
                <Button
                  onClick={onPayJailFee}
                  disabled={!canAffordJailFee || rolling || hasRolled}
                  variant="outline"
                  className="w-full border-[#c94c4c]/50 text-[#8b3a3a] hover:bg-[#c94c4c]/10 font-serif"
                >
                  Pay $50 to Leave
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={onRoll}
              disabled={hasRolled || rolling}
              className="bg-gradient-to-r from-[#d4af37] to-[#c4a030] hover:from-[#c4a030] hover:to-[#b49028] text-white font-serif shadow-md disabled:opacity-50 border border-[#8B6914]"
            >
              {rolling ? "Rolling..." : "Roll Dice"}
            </Button>
          )}

          {onTrade && (
            <Button
              onClick={onTrade}
              disabled={tradeDisabled}
              variant="outline"
              className="w-full border-[#2c6e4f]/50 text-[#2c6e4f] hover:bg-[#2c6e4f]/10 font-serif"
            >
              Trade
            </Button>
          )}
        </div>
      )}

      {gameOver && (
        <p className="text-xs text-[#5c4a1f] font-serif">Start a new game to play again.</p>
      )}
    </div>
  )
}
