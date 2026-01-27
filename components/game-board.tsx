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
  const bottomRow = BOARD_SPACES.slice(0, 11).reverse() // GO to Jail (right to left)
  const leftColumn = BOARD_SPACES.slice(11, 20) // Dogpatch to Noe Valley (bottom to top)
  const topRow = BOARD_SPACES.slice(20, 31) // Free Parking to Go To Jail (left to right)
  const rightColumn = BOARD_SPACES.slice(31, 40).reverse() // Sea Cliff to Russian Hill (top to bottom)

  const getOwnerColor = (spaceId: number) => {
    const ownerId = propertyOwners[spaceId]
    if (ownerId !== undefined) {
      const owner = players.find((p) => p.id === ownerId)
      return owner?.color
    }
    return undefined
  }

  const getHouseCount = (spaceId: number) => propertyHouses?.[spaceId] ?? 0

  return (
    <div className="relative inline-block bg-emerald-100 p-1">
      {/* Main board container using CSS Grid */}
      <div className="grid grid-cols-[80px_repeat(9,48px)_80px] grid-rows-[80px_repeat(9,48px)_80px]">
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

        {/* Center area */}
        <div className="col-span-9 row-span-9 col-start-2 row-start-2 flex flex-col items-center justify-center bg-emerald-100 p-4">
          <h1 className="text-center font-serif text-4xl font-bold tracking-tight text-stone-800">
            SF
          </h1>
          <h2 className="text-center font-serif text-2xl font-bold tracking-widest text-amber-600">
            MONOPOLY
          </h2>
          <div className="mt-4 text-center text-xs text-stone-600">
            <p>The San Francisco Edition</p>
          </div>
        </div>
      </div>
    </div>
  )
}
