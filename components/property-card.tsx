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
  canBuy?: boolean
}

export function PropertyCard({ space, owner, onClose, onBuy, canBuy }: PropertyCardProps) {
  const colorBarColor = space.colorGroup ? COLOR_MAP[space.colorGroup] : "#666"

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

          {owner && (
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

          {canBuy && onBuy && (
            <Button onClick={onBuy} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700">
              Buy for ${space.price}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
