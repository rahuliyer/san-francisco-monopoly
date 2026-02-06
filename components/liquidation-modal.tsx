"use client"

import { Player, Space, BOARD_SPACES, COLOR_MAP } from "@/lib/game-data"
import { Button } from "@/components/ui/button"
import { GAME_CONSTANTS } from "@/lib/constants"

const { MAX_HOUSES } = GAME_CONSTANTS

interface LiquidationAsset {
  space: Space
  houses: number
  isMortgaged: boolean
  sellHouseValue: number
  mortgageValue: number
}

interface LiquidationModalProps {
  player: Player
  propertyOwners: Record<number, number>
  propertyHouses: Record<number, number>
  mortgagedProperties: Record<number, boolean>
  creditorName: string | null
  onSellHouse: (spaceId: number) => void
  onMortgageProperty: (spaceId: number) => void
  onDeclareBankruptcy: () => void
}

function getPlayerAssets(
  player: Player,
  propertyOwners: Record<number, number>,
  propertyHouses: Record<number, number>,
  mortgagedProperties: Record<number, boolean>
): LiquidationAsset[] {
  const assets: LiquidationAsset[] = []

  Object.entries(propertyOwners).forEach(([spaceId, ownerId]) => {
    if (ownerId !== player.id) return
    const numericId = Number(spaceId)
    const space = BOARD_SPACES[numericId]
    if (!space) return

    const houses = propertyHouses[numericId] ?? 0
    const isMortgaged = mortgagedProperties[numericId] === true
    const sellHouseValue = space.houseCost ? Math.floor(space.houseCost / 2) : 0
    const mortgageValue = space.mortgage ?? 0

    assets.push({ space, houses, isMortgaged, sellHouseValue, mortgageValue })
  })

  return assets
}

function canSellHouseOnProperty(
  spaceId: number,
  propertyOwners: Record<number, number>,
  propertyHouses: Record<number, number>,
  playerId: number
): boolean {
  const space = BOARD_SPACES[spaceId]
  if (!space || space.type !== "property" || !space.colorGroup) return false

  const houses = propertyHouses[spaceId] ?? 0
  if (houses <= 0) return false

  // Must sell evenly: can only sell if this property has the most houses in its group
  const groupSpaces = BOARD_SPACES.filter(
    (s) => s.colorGroup === space.colorGroup && s.type === "property"
  )
  const maxHouseCount = Math.max(
    ...groupSpaces
      .filter((s) => propertyOwners[s.id] === playerId)
      .map((s) => propertyHouses[s.id] ?? 0)
  )

  return houses >= maxHouseCount
}

export function LiquidationModal({
  player,
  propertyOwners,
  propertyHouses,
  mortgagedProperties,
  creditorName,
  onSellHouse,
  onMortgageProperty,
  onDeclareBankruptcy,
}: LiquidationModalProps) {
  const assets = getPlayerAssets(player, propertyOwners, propertyHouses, mortgagedProperties)
  const debt = Math.abs(player.money)
  const hasAnyAction = assets.some(
    (a) =>
      (!a.isMortgaged && a.mortgageValue > 0) ||
      (a.houses > 0 && a.sellHouseValue > 0)
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-gradient-to-b from-[#faf6ee] to-[#f5efe3] shadow-2xl border-2 border-[#c94c4c]">
        {/* Header */}
        <div className="bg-[#c94c4c] px-4 py-3 text-white">
          <h2 className="text-lg font-serif font-bold">Liquidation Required</h2>
          <p className="text-sm opacity-90">
            {player.name} owes ${debt}
            {creditorName ? ` to ${creditorName}` : " to the bank"}
          </p>
        </div>

        <div className="p-4">
          {/* Current balance */}
          <div className="mb-4 rounded border border-[#c94c4c]/30 bg-[#c94c4c]/5 p-3 text-center">
            <p className="text-sm text-[#5c4a1f]">Current Balance</p>
            <p className="text-2xl font-serif font-bold text-[#c94c4c]">
              -${debt}
            </p>
            <p className="mt-1 text-xs text-[#5c4a1f]">
              Sell houses or mortgage properties to raise funds
            </p>
          </div>

          {/* Assets list */}
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {assets.length === 0 && (
              <p className="py-4 text-center text-sm text-[#5c4a1f] italic">
                No properties to liquidate.
              </p>
            )}
            {assets.map((asset) => {
              const colorBarColor = asset.space.colorGroup
                ? COLOR_MAP[asset.space.colorGroup] ?? "#666"
                : "#666"
              const canSellHouse = canSellHouseOnProperty(
                asset.space.id,
                propertyOwners,
                propertyHouses,
                player.id
              )
              const canMortgage = !asset.isMortgaged && asset.houses === 0 && asset.mortgageValue > 0
              const houseLabel =
                asset.houses >= MAX_HOUSES
                  ? "Hotel"
                  : asset.houses > 0
                    ? `${asset.houses} House${asset.houses === 1 ? "" : "s"}`
                    : null

              return (
                <div
                  key={asset.space.id}
                  className="flex items-center gap-3 rounded border border-[#d4af37]/30 bg-[#faf6ee] p-2"
                >
                  <div
                    className="h-10 w-3 flex-shrink-0 rounded"
                    style={{ backgroundColor: colorBarColor }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-serif font-medium text-[#2c3e50]">
                      {asset.space.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#5c4a1f]">
                      {houseLabel && <span>{houseLabel}</span>}
                      {asset.isMortgaged && (
                        <span className="text-[#c94c4c]">Mortgaged</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-1">
                    {canSellHouse && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSellHouse(asset.space.id)}
                        className="border-[#8B6914]/50 text-xs text-[#8B6914] hover:bg-[#d4af37]/10 font-serif"
                      >
                        Sell {asset.houses >= MAX_HOUSES ? "Hotel" : "House"} +${asset.sellHouseValue}
                      </Button>
                    )}
                    {canMortgage && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onMortgageProperty(asset.space.id)}
                        className="border-[#8B6914]/50 text-xs text-[#8B6914] hover:bg-[#d4af37]/10 font-serif"
                      >
                        Mortgage +${asset.mortgageValue}
                      </Button>
                    )}
                    {asset.isMortgaged && (
                      <span className="px-2 text-xs italic text-[#999]">
                        No value
                      </span>
                    )}
                    {!canSellHouse && !canMortgage && !asset.isMortgaged && asset.houses > 0 && (
                      <span className="px-2 text-xs italic text-[#999]">
                        Sell evenly
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Declare bankruptcy */}
          <div className="mt-4 border-t border-[#d4af37]/30 pt-4">
            {!hasAnyAction && assets.length > 0 && (
              <p className="mb-3 text-center text-sm text-[#c94c4c]">
                No more assets to liquidate. You must declare bankruptcy.
              </p>
            )}
            <Button
              onClick={onDeclareBankruptcy}
              variant="outline"
              className="w-full border-[#c94c4c]/50 text-[#c94c4c] hover:bg-[#c94c4c]/10 font-serif"
            >
              Declare Bankruptcy
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
