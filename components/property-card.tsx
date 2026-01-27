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
  onBuildHotel
}: PropertyCardProps) {
  const colorBarColor = space.colorGroup ? COLOR_MAP[space.colorGroup] : "#666"
  const resolvedUnmortgageCost =
    unmortgageCost ?? (space.mortgage !== undefined ? Math.ceil(space.mortgage * 1.1) : undefined)
  const showMortgageActions =
    (canMortgage && onMortgage) ||
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-xs overflow-hidden rounded-lg bg-white shadow-2xl">
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
          <span className="text-xs font-medium uppercase tracking-wider opacity-80">Title Deed</span>
          <h2 className="text-balance text-center text-lg font-bold">{space.name}</h2>
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
            <p className="mb-3 text-center text-lg font-bold text-stone-800">Price: ${space.price}</p>
          )}

          {space.rent && space.type === "property" && (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-600">Rent</span>
                <span className="font-medium">${space.rent[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">With 1 House</span>
                <span className="font-medium">${space.rent[1]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">With 2 Houses</span>
                <span className="font-medium">${space.rent[2]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">With 3 Houses</span>
                <span className="font-medium">${space.rent[3]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">With 4 Houses</span>
                <span className="font-medium">${space.rent[4]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">With Hotel</span>
                <span className="font-medium">${space.rent[5]}</span>
              </div>
              <div className="mt-2 border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-stone-600">House Cost</span>
                  <span className="font-medium">${space.houseCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Mortgage Value</span>
                  <span className="font-medium">${space.mortgage}</span>
                </div>
              </div>
            </div>
          )}

          {space.rent && space.type === "railroad" && (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-600">Rent with 1 Railroad</span>
                <span className="font-medium">${space.rent[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Rent with 2 Railroads</span>
                <span className="font-medium">${space.rent[1]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Rent with 3 Railroads</span>
                <span className="font-medium">${space.rent[2]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Rent with 4 Railroads</span>
                <span className="font-medium">${space.rent[3]}</span>
              </div>
            </div>
          )}

          {space.type === "utility" && (
            <div className="text-sm text-stone-600">
              <p className="mb-2">If one Utility is owned, rent is 4x the dice roll.</p>
              <p>If both Utilities are owned, rent is 10x the dice roll.</p>
            </div>
          )}

          {space.mortgage !== undefined && space.type !== "property" && (
            <div className="mt-3 border-t pt-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-600">Mortgage Value</span>
                <span className="font-medium">${space.mortgage}</span>
              </div>
            </div>
          )}

          {space.type === "property" && (
            <div className="mt-3 rounded border border-stone-200 bg-stone-50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Buildings</span>
                <span className="font-medium text-stone-800">{buildingStatus}</span>
              </div>
              {showBuildButton && (
                <div className="mt-2 space-y-2">
                  <Button
                    onClick={buildAction}
                    disabled={buildButtonDisabled || !buildAction}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {buildButtonLabel} (${space.houseCost})
                  </Button>
                  {buildMessage && (
                    <p className="text-xs text-stone-500">{buildMessage}</p>
                  )}
                </div>
              )}
              {!showBuildButton && buildMessage && (
                <p className="mt-2 text-xs text-stone-500">{buildMessage}</p>
              )}
            </div>
          )}

          {/* Show when player lands on their own property */}
          {isOwnProperty && owner && (
            <div className="mt-3 rounded bg-emerald-100 p-3 text-center">
              <div className="mb-2 flex items-center justify-center gap-2">
                <PlayerToken3D
                  icon={owner.token}
                  color={owner.color}
                  name={owner.name}
                  size="sm"
                />
              </div>
              <p className="text-sm font-medium text-emerald-700">
                You own this property!
              </p>
              <p className="mt-1 text-xs text-emerald-600">
                No rent is due. Enjoy your stay!
              </p>
            </div>
          )}

          {/* Show when player lands on another player's property and paid rent */}
          {rentPaid !== undefined && owner && !isOwnProperty && (
            <div className="mt-3 rounded bg-red-100 p-3 text-center">
              <div className="mb-2 flex items-center justify-center gap-2">
                <PlayerToken3D
                  icon={owner.token}
                  color={owner.color}
                  name={owner.name}
                  size="sm"
                />
              </div>
              <p className="text-sm font-medium text-red-700">
                Property owned by {owner.name}
              </p>
              <p className="mt-1 text-lg font-bold text-red-600">
                Rent Paid: ${rentPaid}
              </p>
            </div>
          )}

          {/* Show owner info when just viewing a property (not landing scenarios) */}
          {owner && !isOwnProperty && rentPaid === undefined && (
            <div className="mt-3 flex items-center gap-2 rounded bg-stone-100 p-2">
              <PlayerToken3D
                icon={owner.token}
                color={owner.color}
                name={owner.name}
                size="sm"
              />
              <span className="text-sm text-stone-600">Owned by {owner.name}</span>
            </div>
          )}

          {isMortgaged && (
            <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-center">
              <p className="text-sm font-medium text-amber-700">Mortgaged to the bank</p>
              <p className="mt-1 text-xs text-amber-600">No rent is due while mortgaged.</p>
            </div>
          )}

          {showMortgageActions && (
            <div className="mt-4 space-y-2">
              {canMortgage && onMortgage && (
                <Button
                  onClick={onMortgage}
                  variant="outline"
                  className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  Mortgage for ${space.mortgage}
                </Button>
              )}
              {canUnmortgage && onUnmortgage && resolvedUnmortgageCost !== undefined && (
                <Button
                  onClick={onUnmortgage}
                  disabled={!canAffordUnmortgage}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                >
                  Lift Mortgage for ${resolvedUnmortgageCost}
                </Button>
              )}
            </div>
          )}

          {/* Buy and Pass buttons for unowned properties */}
          {canBuy && onBuy && (
            <div className="mt-4 flex gap-2">
              <Button onClick={onPass} variant="outline" className="flex-1">
                Pass
              </Button>
              <Button onClick={onBuy} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                Buy for ${space.price}
              </Button>
            </div>
          )}

          {/* Continue button for owned property scenarios */}
          {showContinueButton && (
            <Button onClick={onClose} className="mt-4 w-full bg-stone-600 hover:bg-stone-700">
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
