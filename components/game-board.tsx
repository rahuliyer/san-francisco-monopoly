"use client"

import { BOARD_SPACES, Player, Space } from "@/lib/game-data"
import { BoardSpace } from "./board-space"

interface GameBoardProps {
  players: Player[]
  onSpaceClick?: (space: Space) => void
  propertyOwners: Record<number, number>
  propertyHouses?: Record<number, number>
}

export function GameBoard({ players, onSpaceClick, propertyOwners, propertyHouses }: GameBoardProps) {
  // Split board into sections
  const bottomRow = BOARD_SPACES.slice(0, 11) // GO to Jail (right to left)
  const leftColumn = BOARD_SPACES.slice(11, 20) // Dogpatch to Noe Valley (bottom to top)
  const topRow = BOARD_SPACES.slice(20, 31) // Free Parking to Go To Jail (left to right)
  const rightColumn = BOARD_SPACES.slice(31, 40) // Russian Hill to Sea Cliff (top to bottom)

  const getOwnerColor = (spaceId: number) => {
    const ownerId = propertyOwners[spaceId]
    if (ownerId !== undefined) {
      const owner = players.find((p) => p.id === ownerId)
      return owner?.color
    }
    return undefined
  }

  const getHouseCount = (spaceId: number) => propertyHouses?.[spaceId] ?? 0

  const cellSize = "clamp(30px, 8.5vw, 48px)"
  const cornerSize = "clamp(54px, 15vw, 80px)"

  return (
    <div className="relative inline-block bg-[#e8dcc8] p-2 rounded-lg border-4 border-[#8B6914]">
      {/* Art Deco outer frame */}
      <div className="absolute inset-0 rounded-lg border-2 border-[#d4af37] pointer-events-none" />
      {/* Main board container using CSS Grid */}
      <div
        className="grid border-2 border-[#5c4a1f]"
        style={{
          gridTemplateColumns: `${cornerSize} repeat(9, ${cellSize}) ${cornerSize}`,
          gridTemplateRows: `${cornerSize} repeat(9, ${cellSize}) ${cornerSize}`,
        }}
      >
        {/* Top row */}
        {topRow.map((space, index) => (
          <div
            key={space.id}
            className="col-start-auto row-start-1"
            style={{ gridColumnStart: index + 1 }}
          >
            <BoardSpace
              space={space}
              players={players}
              position="top"
              isCorner={index === 0 || index === 10}
              onClick={() => onSpaceClick?.(space)}
              ownerColor={getOwnerColor(space.id)}
              houseCount={getHouseCount(space.id)}
            />
          </div>
        ))}

        {/* Left column (excluding corners) */}
        {leftColumn.map((space, index) => (
          <div
            key={space.id}
            className="col-start-1"
            style={{ gridRowStart: 9 - index + 1 }}
          >
            <BoardSpace
              space={space}
              players={players}
              position="left"
              onClick={() => onSpaceClick?.(space)}
              ownerColor={getOwnerColor(space.id)}
              houseCount={getHouseCount(space.id)}
            />
          </div>
        ))}

        {/* Right column (excluding corners) */}
        {rightColumn.map((space, index) => (
          <div
            key={space.id}
            className="col-start-11"
            style={{ gridRowStart: index + 2 }}
          >
            <BoardSpace
              space={space}
              players={players}
              position="right"
              onClick={() => onSpaceClick?.(space)}
              ownerColor={getOwnerColor(space.id)}
              houseCount={getHouseCount(space.id)}
            />
          </div>
        ))}

        {/* Bottom row */}
        {bottomRow.map((space, index) => (
          <div
            key={space.id}
            className="row-start-11"
            style={{ gridColumnStart: 11 - index }}
          >
            <BoardSpace
              space={space}
              players={players}
              position="bottom"
              isCorner={index === 0 || index === 10}
              onClick={() => onSpaceClick?.(space)}
              ownerColor={getOwnerColor(space.id)}
              houseCount={getHouseCount(space.id)}
            />
          </div>
        ))}

        {/* Center area - Art Deco styled */}
        <div className="col-span-9 row-span-9 col-start-2 row-start-2 flex flex-col items-center justify-center bg-gradient-to-br from-[#f5e6c8] via-[#e8dcc8] to-[#dccfb8] p-4 relative">
          {/* Decorative corner elements */}
          <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-[#8B6914]" />
          <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-[#8B6914]" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-[#8B6914]" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-[#8B6914]" />

          {/* Art Deco divider line top */}
          <div className="absolute top-6 left-12 right-12 h-0.5 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

          <h1 className="text-center font-serif text-xl font-bold tracking-[0.15em] text-[#2c4a5c] drop-shadow-sm sm:text-2xl md:text-4xl md:tracking-[0.2em]">
            SAN FRANCISCO
          </h1>
          <h2 className="mt-1 text-center font-serif text-lg font-bold tracking-[0.18em] text-[#8B6914] sm:text-xl md:text-3xl md:tracking-[0.3em]">
            MONOPOLY
          </h2>

          {/* Art Deco divider */}
          <div className="flex items-center gap-2 mt-3 mb-2">
            <div className="w-8 h-0.5 bg-[#8B6914]" />
            <div className="w-2 h-2 rotate-45 bg-[#d4af37]" />
            <div className="w-8 h-0.5 bg-[#8B6914]" />
          </div>

          <div className="text-center text-sm text-[#5c4a1f] font-serif italic">
            <p>The City by the Bay Edition</p>
          </div>

          {/* Art Deco divider line bottom */}
          <div className="absolute bottom-6 left-12 right-12 h-0.5 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
        </div>
      </div>
    </div>
  )
}
