"use client"

import Image from "next/image"
import { Space, GameCard } from "@/lib/game-data"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface SpecialSpaceCardProps {
  space: Space
  onClose: () => void
  drawnCard?: GameCard | null
  message?: string
}

// Color schemes for different space types
const SPACE_COLORS: Record<string, string> = {
  "chance": "#FF6B35",
  "community-chest": "#4ECDC4",
  "go": "#2ECC71",
  "jail": "#95A5A6",
  "free-parking": "#E74C3C",
  "go-to-jail": "#8E44AD",
  "tax": "#34495E",
}

// Labels for different space types
const SPACE_LABELS: Record<string, string> = {
  "chance": "Chance",
  "community-chest": "Community Chest",
  "go": "GO!",
  "jail": "Just Visiting",
  "free-parking": "Free Parking",
  "go-to-jail": "Go To Jail",
  "tax": "Tax",
}

// Default messages for different space types
const DEFAULT_MESSAGES: Record<string, string> = {
  "chance": "Draw a Chance card and follow the instructions.",
  "community-chest": "Draw a Community Chest card and follow the instructions.",
  "go": "Collect $200 as you pass GO!",
  "jail": "You're just visiting. No penalty!",
  "free-parking": "Take a break and enjoy the view of Golden Gate Park!",
  "go-to-jail": "Go directly to Alcatraz. Do not pass GO. Do not collect $200.",
  "tax": "Pay your taxes to the city of San Francisco.",
}

// Get effect description for a card
function getCardEffectDescription(card: GameCard): string {
  const effect = card.effect
  switch (effect.type) {
    case 'collect':
      return `+$${effect.amount}`
    case 'pay':
      return `-$${effect.amount}`
    case 'advance-to-go':
      return '+$200'
    case 'advance':
      return 'Move to new location'
    case 'go-to-jail':
      return 'Go to Alcatraz!'
    case 'go-back':
      return `Go back ${effect.spaces} spaces`
    case 'collect-from-players':
      return `+$${effect.amount} from each player`
    case 'pay-to-players':
      return `-$${effect.amount} to each player`
    case 'repairs':
      return `Pay $${effect.houseAmount}/house, $${effect.hotelAmount}/hotel`
    default:
      return ''
  }
}

export function SpecialSpaceCard({ space, onClose, drawnCard, message }: SpecialSpaceCardProps) {
  const backgroundColor = SPACE_COLORS[space.type] || "#666"
  const label = SPACE_LABELS[space.type] || space.type
  
  // For Chance and Community Chest, show the drawn card text
  const displayMessage = (space.type === "chance" || space.type === "community-chest") && drawnCard
    ? drawnCard.text
    : (message || DEFAULT_MESSAGES[space.type] || "")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-xs overflow-hidden rounded-lg bg-white shadow-2xl">
        {/* Hero image */}
        {space.image && (
          <div className="relative h-32 w-full">
            <Image
              src={space.image}
              alt={space.name}
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
          style={{ backgroundColor }}
        >
          <span className="text-xs font-medium uppercase tracking-wider opacity-80">{label}</span>
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
          <p className="text-center text-sm text-stone-600">{displayMessage}</p>

          {/* Chance/Community Chest card effect */}
          {(space.type === "chance" || space.type === "community-chest") && drawnCard && (
            <div 
              className="mt-3 rounded p-3 text-center"
              style={{ backgroundColor: `${backgroundColor}20` }}
            >
              <p className="text-lg font-bold" style={{ color: backgroundColor }}>
                {getCardEffectDescription(drawnCard)}
              </p>
            </div>
          )}

          {/* Tax specific content */}
          {space.type === "tax" && (
            <div className="mt-3 rounded bg-stone-100 p-3 text-center">
              <p className="text-lg font-bold text-stone-800">
                {space.name === "Income Tax" ? "$200" : "$100"}
              </p>
              <p className="text-xs text-stone-500">Amount paid</p>
            </div>
          )}

          {/* Go specific content */}
          {space.type === "go" && (
            <div className="mt-3 rounded bg-emerald-100 p-3 text-center">
              <p className="text-lg font-bold text-emerald-700">+$200</p>
              <p className="text-xs text-emerald-600">Collected</p>
            </div>
          )}

          {/* Go to Jail specific content */}
          {space.type === "go-to-jail" && (
            <div className="mt-3 rounded bg-purple-100 p-3 text-center">
              <p className="text-2xl">🔒</p>
              <p className="text-xs text-purple-600">Sent to Alcatraz</p>
            </div>
          )}

          <Button 
            onClick={onClose} 
            className="mt-4 w-full"
            style={{ backgroundColor }}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
