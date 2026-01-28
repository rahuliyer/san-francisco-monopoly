"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { BOARD_SPACES, COLOR_MAP, Player, Space } from "@/lib/game-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlayerToken3D } from "@/components/player-token-3d"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export interface TradePayload {
  partnerId: number
  offerPropertyIds: number[]
  requestPropertyIds: number[]
  offerCash: number
  requestCash: number
}

interface TradeModalProps {
  currentPlayer: Player
  players: Player[]
  propertyOwners: Record<number, number>
  onSubmit: (trade: TradePayload) => void
  onClose: () => void
}

const isTradeableSpace = (space: Space) =>
  space.type === "property" || space.type === "railroad" || space.type === "utility"

const parseCashInput = (value: string) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return 0
  return Math.floor(parsed)
}

export function TradeModal({
  currentPlayer,
  players,
  propertyOwners,
  onSubmit,
  onClose,
}: TradeModalProps) {
  const otherPlayers = useMemo(
    () => players.filter((player) => player.id !== currentPlayer.id),
    [players, currentPlayer.id]
  )
  const [partnerId, setPartnerId] = useState<number>(otherPlayers[0]?.id ?? -1)
  const [offerCashInput, setOfferCashInput] = useState("")
  const [requestCashInput, setRequestCashInput] = useState("")
  const [offerPropertyIds, setOfferPropertyIds] = useState<number[]>([])
  const [requestPropertyIds, setRequestPropertyIds] = useState<number[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (otherPlayers.length === 0) {
      setPartnerId(-1)
      return
    }
    if (!otherPlayers.some((player) => player.id === partnerId)) {
      setPartnerId(otherPlayers[0].id)
    }
  }, [otherPlayers, partnerId])

  useEffect(() => {
    setOfferPropertyIds([])
    setRequestPropertyIds([])
    setErrorMessage(null)
  }, [partnerId])

  const partner = players.find((player) => player.id === partnerId)

  const currentPlayerProperties = useMemo(
    () =>
      BOARD_SPACES.filter(
        (space) => isTradeableSpace(space) && propertyOwners[space.id] === currentPlayer.id
      ),
    [propertyOwners, currentPlayer.id]
  )

  const partnerProperties = useMemo(
    () =>
      BOARD_SPACES.filter(
        (space) => isTradeableSpace(space) && propertyOwners[space.id] === partnerId
      ),
    [propertyOwners, partnerId]
  )

  const offeredCash = parseCashInput(offerCashInput)
  const requestedCash = parseCashInput(requestCashInput)
  const isEmptyTrade =
    offerPropertyIds.length === 0 &&
    requestPropertyIds.length === 0 &&
    offeredCash === 0 &&
    requestedCash === 0
  const exceedsCash =
    offeredCash > currentPlayer.money || (partner ? requestedCash > partner.money : false)

  const handleCashChange =
    (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value
      if (nextValue === "") {
        setter("")
        return
      }
      const parsed = Number(nextValue)
      if (!Number.isFinite(parsed) || parsed < 0) {
        return
      }
      setter(String(Math.floor(parsed)))
    }

  const toggleProperty = (
    propertyId: number,
    selectedIds: number[],
    setSelected: (value: number[]) => void
  ) => {
    if (selectedIds.includes(propertyId)) {
      setSelected(selectedIds.filter((id) => id !== propertyId))
    } else {
      setSelected([...selectedIds, propertyId])
    }
  }

  const handleSubmit = () => {
    if (!partner) {
      setErrorMessage("Select a trade partner to continue.")
      return
    }
    if (isEmptyTrade) {
      setErrorMessage("Add at least one property or cash amount to trade.")
      return
    }
    if (offeredCash > currentPlayer.money) {
      setErrorMessage("You do not have enough cash for this trade.")
      return
    }
    if (requestedCash > partner.money) {
      setErrorMessage(`${partner.name} does not have enough cash for this trade.`)
      return
    }

    onSubmit({
      partnerId,
      offerPropertyIds,
      requestPropertyIds,
      offerCash: offeredCash,
      requestCash: requestedCash,
    })
  }

  const renderPropertyList = (
    properties: Space[],
    selectedIds: number[],
    setSelected: (value: number[]) => void,
    emptyText: string,
    idPrefix: string
  ) => {
    if (properties.length === 0) {
      return <p className="text-sm text-[#5c4a1f] font-serif italic">{emptyText}</p>
    }

    return (
      <div className="space-y-2">
        {properties.map((space) => {
          const color = space.colorGroup ? COLOR_MAP[space.colorGroup] : "#CBD5F5"
          const isSelected = selectedIds.includes(space.id)
          const checkboxId = `${idPrefix}-${space.id}`
          return (
            <label
              key={space.id}
              htmlFor={checkboxId}
              className={cn(
                "flex items-center gap-2 rounded-md border px-2 py-1.5 text-left text-sm transition-colors",
                isSelected ? "border-[#d4af37] bg-[#d4af37]/10" : "border-[#d4af37]/30 hover:bg-[#f5efe3]"
              )}
            >
              <input
                id={checkboxId}
                type="checkbox"
                className="h-4 w-4 accent-[#d4af37]"
                checked={isSelected}
                onChange={() => toggleProperty(space.id, selectedIds, setSelected)}
              />
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
              <span className="font-serif font-medium text-[#2c3e50]">{space.name}</span>
              {space.price !== undefined && (
                <span className="ml-auto text-xs text-[#5c4a1f]">${space.price}</span>
              )}
            </label>
          )
        })}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl rounded-lg bg-gradient-to-br from-[#faf6ee] to-[#f5efe3] p-6 shadow-xl border-2 border-[#8B6914]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#2c3e50]">Make a Trade</h2>
            <p className="text-sm text-[#5c4a1f]">
              Swap properties, cash, or a mix to negotiate the best deal.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close trade"
            className="rounded-full p-2 text-[#5c4a1f] hover:bg-[#d4af37]/10 hover:text-[#2c3e50]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <label htmlFor="trade-partner" className="text-sm font-serif font-medium text-[#5c4a1f]">
            Trade partner
          </label>
          <select
            id="trade-partner"
            value={partnerId}
            onChange={(event) => setPartnerId(Number(event.target.value))}
            className="mt-1 w-full rounded-md border border-[#d4af37]/30 bg-[#faf6ee] px-3 py-2 text-sm font-serif text-[#2c3e50]"
            disabled={otherPlayers.length === 0}
          >
            {otherPlayers.length === 0 ? (
              <option value={-1}>No other players available</option>
            ) : (
              otherPlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} (${player.money.toLocaleString()})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <section className="rounded-lg border border-[#d4af37]/30 p-4 bg-[#faf6ee]">
            <div className="mb-3 flex items-center gap-2">
              <PlayerToken3D
                icon={currentPlayer.token}
                color={currentPlayer.color}
                name={currentPlayer.name}
                size="sm"
              />
              <div>
                <p className="text-xs uppercase text-[#8B6914] font-serif">You give</p>
                <p className="font-serif font-semibold text-[#2c3e50]">{currentPlayer.name}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-serif font-semibold text-[#8B6914]">Properties</p>
                {renderPropertyList(
                  currentPlayerProperties,
                  offerPropertyIds,
                  setOfferPropertyIds,
                  "No properties to offer.",
                  "offer-property"
                )}
              </div>

              <div>
                <label htmlFor="offer-cash" className="text-xs font-serif font-semibold text-[#8B6914]">
                  Cash you give
                </label>
                <Input
                  id="offer-cash"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={offerCashInput}
                  onChange={handleCashChange(setOfferCashInput)}
                  placeholder="0"
                  className="border-[#d4af37]/30 bg-white font-serif"
                />
                <p className="mt-1 text-xs text-[#5c4a1f]">
                  Available: ${currentPlayer.money.toLocaleString()}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-[#d4af37]/30 p-4 bg-[#faf6ee]">
            <div className="mb-3 flex items-center gap-2">
              {partner ? (
                <>
                  <PlayerToken3D
                    icon={partner.token}
                    color={partner.color}
                    name={partner.name}
                    size="sm"
                  />
                  <div>
                    <p className="text-xs uppercase text-[#8B6914] font-serif">You receive</p>
                    <p className="font-serif font-semibold text-[#2c3e50]">{partner.name}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#5c4a1f] font-serif italic">Select a partner to view assets.</p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-serif font-semibold text-[#8B6914]">Properties</p>
                {renderPropertyList(
                  partnerProperties,
                  requestPropertyIds,
                  setRequestPropertyIds,
                  "No properties available.",
                  "request-property"
                )}
              </div>

              <div>
                <label htmlFor="request-cash" className="text-xs font-serif font-semibold text-[#8B6914]">
                  Cash you receive
                </label>
                <Input
                  id="request-cash"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={requestCashInput}
                  onChange={handleCashChange(setRequestCashInput)}
                  placeholder="0"
                  className="border-[#d4af37]/30 bg-white font-serif"
                />
                <p className="mt-1 text-xs text-[#5c4a1f]">
                  Available: ${partner ? partner.money.toLocaleString() : "0"}
                </p>
              </div>
            </div>
          </section>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-md bg-[#c94c4c]/10 border border-[#c94c4c]/30 px-3 py-2 text-sm text-[#8b3a3a]">
            {errorMessage}
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="border-[#8B6914]/50 text-[#5c4a1f] hover:bg-[#f5efe3] font-serif">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!partner || isEmptyTrade || exceedsCash}
            className="bg-gradient-to-r from-[#d4af37] to-[#c4a030] hover:from-[#c4a030] hover:to-[#b49028] font-serif border border-[#8B6914]"
          >
            Complete Trade
          </Button>
        </div>
      </div>
    </div>
  )
}
