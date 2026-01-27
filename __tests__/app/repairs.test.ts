import { calculateRepairsCost } from '@/app/page'
import { BOARD_SPACES } from '@/lib/game-data'

describe('calculateRepairsCost', () => {
  it('should total repairs for houses and hotels owned by player', () => {
    const tenderloin = BOARD_SPACES.find((space) => space.name === 'Tenderloin')!
    const bayview = BOARD_SPACES.find((space) => space.name === 'Bayview')!
    const sunset = BOARD_SPACES.find((space) => space.name === 'Sunset District')!
    const caltrain = BOARD_SPACES.find((space) => space.name === 'Caltrain')!

    const propertyOwners = {
      [tenderloin.id]: 0,
      [bayview.id]: 0,
      [sunset.id]: 1,
      [caltrain.id]: 0,
    }
    const propertyHouses = {
      [tenderloin.id]: 2,
      [bayview.id]: 5,
      [sunset.id]: 4,
      [caltrain.id]: 5,
    }

    const result = calculateRepairsCost(0, propertyOwners, propertyHouses, 25, 100)

    expect(result.houseCount).toBe(2)
    expect(result.hotelCount).toBe(1)
    expect(result.total).toBe(150)
  })

  it('should count four houses as houses, not hotels', () => {
    const sunset = BOARD_SPACES.find((space) => space.name === 'Sunset District')!
    const propertyOwners = { [sunset.id]: 1 }
    const propertyHouses = { [sunset.id]: 4 }

    const result = calculateRepairsCost(1, propertyOwners, propertyHouses, 25, 100)

    expect(result.houseCount).toBe(4)
    expect(result.hotelCount).toBe(0)
    expect(result.total).toBe(100)
  })

  it('should return zero when player has no houses or hotels', () => {
    const tenderloin = BOARD_SPACES.find((space) => space.name === 'Tenderloin')!
    const propertyOwners = { [tenderloin.id]: 0 }
    const propertyHouses = { [tenderloin.id]: 0 }

    const result = calculateRepairsCost(0, propertyOwners, propertyHouses, 25, 100)

    expect(result.houseCount).toBe(0)
    expect(result.hotelCount).toBe(0)
    expect(result.total).toBe(0)
  })
})
