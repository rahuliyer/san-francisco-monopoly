"use client"

import Image from "next/image"
import { Space, COLOR_MAP, Player } from "@/lib/game-data"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { PlayerToken3D } from "@/components/player-token-3d"

interface PropertyCardProps {
  space: Space
  owner?: Player
  onClose: () => void
  onBuy?: () => void
  onPass?: () => void
  canBuy?: boolean
  onMortgage?: () => void
  onUnmortgage?: () => void
  canMortgage?: boolean
  mortgageMessage?: string
  canUnmortgage?: boolean
  canAffordUnmortgage?: boolean
  isMortgaged?: boolean
  unmortgageCost?: number
  isOwnProperty?: boolean
  rentPaid?: number
  currentPlayerName?: string
  houseCount?: number
  canManageHouses?: boolean
  canBuildHouse?: boolean
  canBuildHotel?: boolean
  buildMessage?: string
  onBuildHouse?: () => void
  onBuildHotel?: () => void
  canSellHouse?: boolean
  sellHousePrice?: number
  onSellHouse?: () => void
}

export function PropertyCard({ 
  space, 
  owner, 
  onClose, 
  onBuy, 
  onPass,
  canBuy,
  onMortgage,
  onUnmortgage,
  canMortgage = false,
  mortgageMessage,
  canUnmortgage = false,
  canAffordUnmortgage = true,
  isMortgaged = false,
  unmortgageCost,
  isOwnProperty,
  rentPaid,
  currentPlayerName,
  houseCount,
  canManageHouses,
  canBuildHouse,
  canBuildHotel,
  buildMessage,
  onBuildHouse,
  onBuildHotel,
  canSellHouse = false,
  sellHousePrice,
  onSellHouse
}: PropertyCardProps) {
  const colorBarColor = space.colorGroup ? COLOR_MAP[space.colorGroup] : "#666"
  const resolvedUnmortgageCost =
    unmortgageCost ?? (space.mortgage !== undefined ? Math.ceil(space.mortgage * 1.1) : undefined)
  const showMortgageActions =
    ((canMortgage || mortgageMessage) && onMortgage) ||
    (canUnmortgage && onUnmortgage && resolvedUnmortgageCost !== undefined)
  const showContinueButton =
    isOwnProperty || rentPaid !== undefined || (isMortgaged && owner !== undefined)
  const resolvedHouseCount = Math.max(0, houseCount ?? 0)
  const buildingStatus =
    resolvedHouseCount >= 5
      ? "Hotel"
      : resolvedHouseCount > 0
        ? `${resolvedHouseCount} House${resolvedHouseCount === 1 ? "" : "s"}`
        : "None"
  const showBuildButton = canManageHouses && space.type === "property" && !!space.houseCost && resolvedHouseCount < 5
  const buildButtonLabel = resolvedHouseCount >= 4 ? "Build Hotel" : "Build House"
  const buildButtonDisabled = resolvedHouseCount >= 4 ? !canBuildHotel : !canBuildHouse
  const buildAction = resolvedHouseCount >= 4 ? onBuildHotel ?? onBuildHouse : onBuildHouse
  const showSellButton =
    canManageHouses && space.type === "property" && !!space.houseCost && resolvedHouseCount > 0
  const sellButtonLabel = resolvedHouseCount >= 5 ? "Sell Hotel" : "Sell House"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-xs overflow-hidden rounded-lg bg-gradient-to-b from-[#faf6ee] to-[#f5efe3] shadow-2xl border-2 border-[#8B6914]">
        {/* Hero image */}
        {space.image && (
          <div className="relative h-32 w-full">
            <Image
              src={space.image || "/placeholder.svg"}
              alt={`${space.name} neighborhood`}
              fill
              className="object-cover"
            />
            <div 
              className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
            />
          </div>
        )}
        
        {/* Color header */}
        <div
          className="flex flex-col items-center justify-center py-3 text-white"
          style={{ backgroundColor: colorBarColor }}
        >
          <span className="text-xs font-serif font-medium uppercase tracking-[0.2em] opacity-80">Title Deed</span>
          <h2 className="text-balance text-center text-lg font-serif font-bold">{space.name}</h2>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-full bg-white/20 p-1 text-white transition-colors hover:bg-white/40"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Card content */}
        <div className="p-4">
          {space.price && (
            <p className="mb-3 text-center text-lg font-serif font-bold text-[#2c3e50]">Price: ${space.price}</p>
          )}

          {space.rent && space.type === "property" && (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#5c4a1f]">Rent</span>
                <span className="font-medium text-[#2c3e50]">${space.rent[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5c4a1f]">With 1 House</span>
                <span className="font-medium text-[#2c3e50]">${space.rent[1]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5c4a1f]">With 2 Houses</span>
                <span className="font-medium text-[#2c3e50]">${space.rent[2]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5c4a1f]">With 3 Houses</span>
                <span className="font-medium text-[#2c3e50]">${space.rent[3]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5c4a1f]">With 4 Houses</span>
                <span className="font-medium text-[#2c3e50]">${space.rent[4]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5c4a1f]">With Hotel</span>
                <span className="font-medium text-[#2c3e50]">${space.rent[5]}</span>
              </div>
              <div className="mt-2 border-t border-[#d4af37]/30 pt-2">
                <div className="flex justify-between">
                  <span className="text-[#5c4a1f]">House Cost</span>
                  <span className="font-medium text-[#2c3e50]">${space.houseCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5c4a1f]">Mortgage Value</span>
                  <span className="font-medium text-[#2c3e50]">${space.mortgage}</span>
                </div>
              </div>
            </div>
          )}

          {space.rent && space.type === "railroad" && (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#5c4a1f]">Rent with 1 Railroad</span>
                <span className="font-medium text-[#2c3e50]">${space.rent[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5c4a1f]">Rent with 2 Railroads</span>
                <span className="font-medium text-[#2c3e50]">${space.rent[1]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5c4a1f]">Rent with 3 Railroads</span>
                <span className="font-medium text-[#2c3e50]">${space.rent[2]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5c4a1f]">Rent with 4 Railroads</span>
                <span className="font-medium text-[#2c3e50]">${space.rent[3]}</span>
              </div>
            </div>
          )}

          {space.type === "utility" && (
            <div className="text-sm text-[#5c4a1f]">
              <p className="mb-2">If one Utility is owned, rent is 4x the dice roll.</p>
              <p>If both Utilities are owned, rent is 10x the dice roll.</p>
            </div>
          )}

          {space.mortgage !== undefined && space.type !== "property" && (
            <div className="mt-3 border-t border-[#d4af37]/30 pt-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#5c4a1f]">Mortgage Value</span>
                <span className="font-medium text-[#2c3e50]">${space.mortgage}</span>
              </div>
            </div>
          )}

          {space.type === "property" && (
            <div className="mt-3 rounded border border-[#d4af37]/30 bg-[#f5efe3] p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#5c4a1f]">Buildings</span>
                <span className="font-medium text-[#2c3e50]">{buildingStatus}</span>
              </div>
              {showBuildButton && (
                <div className="mt-2 space-y-2">
                  <Button
                    onClick={buildAction}
                    disabled={buildButtonDisabled || !buildAction}
                    className="w-full bg-[#2c6e4f] hover:bg-[#245a40] disabled:opacity-50 font-serif"
                  >
                    {buildButtonLabel} (${space.houseCost})
                  </Button>
                  {buildMessage && (
                    <p className="text-xs text-[#8B6914]">{buildMessage}</p>
                  )}
                </div>
              )}
              {!showBuildButton && buildMessage && (
                <p className="mt-2 text-xs text-[#8B6914]">{buildMessage}</p>
              )}
              {showSellButton && (
                <div className="mt-2">
                  <Button
                    onClick={onSellHouse}
                    disabled={!canSellHouse || !onSellHouse}
                    variant="outline"
                    className="w-full border-[#c94c4c]/50 text-[#8b3a3a] hover:bg-[#c94c4c]/10 disabled:opacity-50 font-serif"
                  >
                    {sellButtonLabel}
                    {sellHousePrice !== undefined ? ` (+$${sellHousePrice})` : ""}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Show when player lands on their own property */}
          {isOwnProperty && owner && (
            <div className="mt-3 rounded bg-[#2c6e4f]/10 border border-[#2c6e4f]/30 p-3 text-center">
              <div className="mb-2 flex items-center justify-center gap-2">
                <PlayerToken3D
                  sprite={owner.token}
                  color={owner.color}
                  name={owner.name}
                  size="sm"
                />
              </div>
              <p className="text-sm font-medium text-[#2c6e4f]">
                You own this property!
              </p>
              <p className="mt-1 text-xs text-[#3d8b65]">
                No rent is due. Enjoy your stay!
              </p>
            </div>
          )}

          {/* Show when player lands on another player's property and paid rent */}
          {rentPaid !== undefined && owner && !isOwnProperty && (
            <div className="mt-3 rounded bg-[#c94c4c]/10 border border-[#c94c4c]/30 p-3 text-center">
              <div className="mb-2 flex items-center justify-center gap-2">
                <PlayerToken3D
                  sprite={owner.token}
                  color={owner.color}
                  name={owner.name}
                  size="sm"
                />
              </div>
              <p className="text-sm font-medium text-[#8b3a3a]">
                Property owned by {owner.name}
              </p>
              <p className="mt-1 text-lg font-bold text-[#c94c4c]">
                Rent Paid: ${rentPaid}
              </p>
            </div>
          )}

          {/* Show owner info when just viewing a property (not landing scenarios) */}
          {owner && !isOwnProperty && rentPaid === undefined && (
            <div className="mt-3 flex items-center gap-2 rounded bg-[#f5efe3] border border-[#d4af37]/30 p-2">
              <PlayerToken3D
                sprite={owner.token}
                color={owner.color}
                name={owner.name}
                size="sm"
              />
              <span className="text-sm text-[#5c4a1f]">Owned by {owner.name}</span>
            </div>
          )}

          {isMortgaged && (
            <div className="mt-3 rounded border border-[#d4af37]/50 bg-[#d4af37]/10 p-3 text-center">
              <p className="text-sm font-medium text-[#8B6914]">Mortgaged to the bank</p>
              <p className="mt-1 text-xs text-[#a07d0c]">No rent is due while mortgaged.</p>
            </div>
          )}

          {showMortgageActions && (
            <div className="mt-4 space-y-2">
              {(canMortgage || mortgageMessage) && onMortgage && (
                <Button
                  onClick={onMortgage}
                  disabled={!canMortgage}
                  variant="outline"
                  className="w-full border-[#d4af37]/50 text-[#8B6914] hover:bg-[#d4af37]/10 disabled:opacity-50 font-serif"
                >
                  Mortgage for ${space.mortgage}
                </Button>
              )}
              {mortgageMessage && (
                <p className="text-xs text-[#8B6914]">{mortgageMessage}</p>
              )}
              {canUnmortgage && onUnmortgage && resolvedUnmortgageCost !== undefined && (
                <Button
                  onClick={onUnmortgage}
                  disabled={!canAffordUnmortgage}
                  className="w-full bg-[#2c6e4f] hover:bg-[#245a40] disabled:opacity-50 font-serif"
                >
                  Lift Mortgage for ${resolvedUnmortgageCost}
                </Button>
              )}
            </div>
          )}

          {/* Buy and Pass buttons for unowned properties */}
          {canBuy && onBuy && (
            <div className="mt-4 flex gap-2">
              <Button onClick={onPass} variant="outline" className="flex-1 border-[#8B6914]/50 text-[#5c4a1f] hover:bg-[#f5efe3] font-serif">
                Pass
              </Button>
              <Button onClick={onBuy} className="flex-1 bg-gradient-to-r from-[#d4af37] to-[#c4a030] hover:from-[#c4a030] hover:to-[#b49028] text-white font-serif border border-[#8B6914]">
                Buy for ${space.price}
              </Button>
            </div>
          )}

          {/* Continue button for owned property scenarios */}
          {showContinueButton && (
            <Button onClick={onClose} className="mt-4 w-full bg-[#2c4a5c] hover:bg-[#243d4a] font-serif">
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
