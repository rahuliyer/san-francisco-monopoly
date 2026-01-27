import {
  BOARD_SPACES,
  COLOR_MAP,
  PLAYER_TOKENS,
  STARTING_MONEY,
  createPlayer,
  rollDice,
  getSpacesByColorGroup,
  calculateRent,
  type Space,
  type Player,
  type ColorGroup,
  type SpaceType,
} from '@/lib/game-data'

describe('game-data constants', () => {
  describe('BOARD_SPACES', () => {
    it('should have exactly 40 spaces', () => {
      expect(BOARD_SPACES).toHaveLength(40)
    })

    it('should have sequential IDs from 0 to 39', () => {
      BOARD_SPACES.forEach((space, index) => {
        expect(space.id).toBe(index)
      })
    })

    it('should have GO at position 0', () => {
      expect(BOARD_SPACES[0].type).toBe('go')
      expect(BOARD_SPACES[0].name).toBe("Fisherman's Wharf")
    })

    it('should have Jail at position 10', () => {
      expect(BOARD_SPACES[10].type).toBe('jail')
      expect(BOARD_SPACES[10].name).toBe('Alcatraz')
    })

    it('should have Free Parking at position 20', () => {
      expect(BOARD_SPACES[20].type).toBe('free-parking')
      expect(BOARD_SPACES[20].name).toBe('Golden Gate Park')
    })

    it('should have Go To Jail at position 30', () => {
      expect(BOARD_SPACES[30].type).toBe('go-to-jail')
      expect(BOARD_SPACES[30].name).toBe('Go To Alcatraz')
    })

    it('should have 4 railroads', () => {
      const railroads = BOARD_SPACES.filter(space => space.type === 'railroad')
      expect(railroads).toHaveLength(4)
      expect(railroads.map(r => r.name)).toEqual([
        'Caltrain',
        'BART',
        'Muni',
        'Cable Car',
      ])
    })

    it('should have 2 utilities', () => {
      const utilities = BOARD_SPACES.filter(space => space.type === 'utility')
      expect(utilities).toHaveLength(2)
      expect(utilities.map(u => u.name)).toEqual(['PG&E', 'SF Water'])
    })

    it('should have 2 tax spaces', () => {
      const taxes = BOARD_SPACES.filter(space => space.type === 'tax')
      expect(taxes).toHaveLength(2)
    })

    it('should have 3 chance spaces', () => {
      const chance = BOARD_SPACES.filter(space => space.type === 'chance')
      expect(chance).toHaveLength(3)
    })

    it('should have 3 community chest spaces', () => {
      const communityChest = BOARD_SPACES.filter(space => space.type === 'community-chest')
      expect(communityChest).toHaveLength(3)
    })

    it('should have 22 properties', () => {
      const properties = BOARD_SPACES.filter(space => space.type === 'property')
      expect(properties).toHaveLength(22)
    })

    it('should have correct number of properties per color group', () => {
      const colorGroupCounts: Record<string, number> = {}
      BOARD_SPACES
        .filter(space => space.type === 'property')
        .forEach(space => {
          if (space.colorGroup) {
            colorGroupCounts[space.colorGroup] = (colorGroupCounts[space.colorGroup] || 0) + 1
          }
        })

      expect(colorGroupCounts['brown']).toBe(2)
      expect(colorGroupCounts['light-blue']).toBe(3)
      expect(colorGroupCounts['pink']).toBe(3)
      expect(colorGroupCounts['orange']).toBe(3)
      expect(colorGroupCounts['red']).toBe(3)
      expect(colorGroupCounts['yellow']).toBe(3)
      expect(colorGroupCounts['green']).toBe(3)
      expect(colorGroupCounts['dark-blue']).toBe(2)
    })

    it('should have valid rent arrays for properties', () => {
      const properties = BOARD_SPACES.filter(space => space.type === 'property')
      properties.forEach(property => {
        expect(property.rent).toBeDefined()
        expect(property.rent).toHaveLength(6) // Base rent + 1-4 houses + hotel
        property.rent!.forEach(rentValue => {
          expect(typeof rentValue).toBe('number')
          expect(rentValue).toBeGreaterThan(0)
        })
      })
    })

    it('should have valid rent arrays for railroads', () => {
      const railroads = BOARD_SPACES.filter(space => space.type === 'railroad')
      railroads.forEach(railroad => {
        expect(railroad.rent).toBeDefined()
        expect(railroad.rent).toHaveLength(4) // 1-4 railroads owned
        expect(railroad.rent).toEqual([25, 50, 100, 200])
      })
    })

    it('should have price and mortgage for purchasable properties', () => {
      const purchasable = BOARD_SPACES.filter(
        space => space.type === 'property' || space.type === 'railroad' || space.type === 'utility'
      )
      purchasable.forEach(space => {
        expect(space.price).toBeDefined()
        expect(space.price).toBeGreaterThan(0)
        expect(space.mortgage).toBeDefined()
        expect(space.mortgage).toBeGreaterThan(0)
        expect(space.mortgage).toBeLessThan(space.price!)
      })
    })

    it('should have house costs for properties only', () => {
      const properties = BOARD_SPACES.filter(space => space.type === 'property')
      properties.forEach(property => {
        expect(property.houseCost).toBeDefined()
        expect(property.houseCost).toBeGreaterThan(0)
      })

      const nonProperties = BOARD_SPACES.filter(
        space => space.type !== 'property'
      )
      nonProperties.forEach(space => {
        expect(space.houseCost).toBeUndefined()
      })
    })
  })

  describe('COLOR_MAP', () => {
    it('should have all color groups mapped', () => {
      expect(Object.keys(COLOR_MAP)).toHaveLength(10)
    })

    it('should have valid hex color codes', () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/
      Object.values(COLOR_MAP).forEach(color => {
        expect(color).toMatch(hexColorRegex)
      })
    })

    it('should contain all property color groups', () => {
      const expectedColors = [
        'brown', 'light-blue', 'pink', 'orange',
        'red', 'yellow', 'green', 'dark-blue',
        'railroad', 'utility'
      ]
      expectedColors.forEach(color => {
        expect(COLOR_MAP[color]).toBeDefined()
      })
    })
  })

  describe('PLAYER_TOKENS', () => {
    it('should have exactly 4 tokens', () => {
      expect(PLAYER_TOKENS).toHaveLength(4)
    })

    it('should have unique names', () => {
      const names = PLAYER_TOKENS.map(t => t.name)
      expect(new Set(names).size).toBe(names.length)
    })

    it('should have unique icons', () => {
      const icons = PLAYER_TOKENS.map(t => t.icon)
      expect(new Set(icons).size).toBe(icons.length)
    })

    it('should have unique colors', () => {
      const colors = PLAYER_TOKENS.map(t => t.color)
      expect(new Set(colors).size).toBe(colors.length)
    })

    it('should have valid hex color codes', () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/
      PLAYER_TOKENS.forEach(token => {
        expect(token.color).toMatch(hexColorRegex)
      })
    })
  })

  describe('STARTING_MONEY', () => {
    it('should be 1500', () => {
      expect(STARTING_MONEY).toBe(1500)
    })
  })
})

describe('createPlayer', () => {
  it('should create a player with correct default values', () => {
    const player = createPlayer(0, 'Alice', 0)

    expect(player.id).toBe(0)
    expect(player.name).toBe('Alice')
    expect(player.money).toBe(STARTING_MONEY)
    expect(player.position).toBe(0)
    expect(player.properties).toEqual([])
    expect(player.inJail).toBe(false)
    expect(player.jailTurns).toBe(0)
  })

  it('should use the correct token based on tokenIndex', () => {
    PLAYER_TOKENS.forEach((token, index) => {
      const player = createPlayer(index, `Player ${index}`, index)
      expect(player.color).toBe(token.color)
      expect(player.token).toBe(token.icon)
    })
  })

  it('should create multiple unique players', () => {
    const player1 = createPlayer(0, 'Alice', 0)
    const player2 = createPlayer(1, 'Bob', 1)
    const player3 = createPlayer(2, 'Charlie', 2)

    expect(player1.id).not.toBe(player2.id)
    expect(player2.id).not.toBe(player3.id)
    expect(player1.token).not.toBe(player2.token)
    expect(player2.token).not.toBe(player3.token)
  })

  it('should allow different IDs with same token', () => {
    const player1 = createPlayer(0, 'Alice', 0)
    const player2 = createPlayer(1, 'Bob', 0)

    expect(player1.id).not.toBe(player2.id)
    expect(player1.token).toBe(player2.token)
    expect(player1.color).toBe(player2.color)
  })
})

describe('rollDice', () => {
  it('should return an array of two numbers', () => {
    const result = rollDice()
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(2)
  })

  it('should return values between 1 and 6', () => {
    // Run multiple times to test randomness
    for (let i = 0; i < 100; i++) {
      const [die1, die2] = rollDice()
      expect(die1).toBeGreaterThanOrEqual(1)
      expect(die1).toBeLessThanOrEqual(6)
      expect(die2).toBeGreaterThanOrEqual(1)
      expect(die2).toBeLessThanOrEqual(6)
    }
  })

  it('should return integers', () => {
    for (let i = 0; i < 50; i++) {
      const [die1, die2] = rollDice()
      expect(Number.isInteger(die1)).toBe(true)
      expect(Number.isInteger(die2)).toBe(true)
    }
  })

  it('should produce varying results', () => {
    const results = new Set<string>()
    for (let i = 0; i < 100; i++) {
      const [die1, die2] = rollDice()
      results.add(`${die1},${die2}`)
    }
    // With 100 rolls, we should get multiple different combinations
    expect(results.size).toBeGreaterThan(10)
  })

  it('should use test override when provided', () => {
    const globalRef = globalThis as { __TEST_DICE_ROLLS__?: [number, number][] }
    globalRef.__TEST_DICE_ROLLS__ = [[6, 1]]

    const result = rollDice()

    expect(result).toEqual([6, 1])
    expect(globalRef.__TEST_DICE_ROLLS__).toHaveLength(0)
    delete globalRef.__TEST_DICE_ROLLS__
  })
})

describe('getSpacesByColorGroup', () => {
  it('should return all brown properties', () => {
    const brownSpaces = getSpacesByColorGroup('brown')
    expect(brownSpaces).toHaveLength(2)
    expect(brownSpaces.every(s => s.colorGroup === 'brown')).toBe(true)
    expect(brownSpaces.map(s => s.name)).toEqual(['Tenderloin', 'Bayview'])
  })

  it('should return all light-blue properties', () => {
    const lightBlueSpaces = getSpacesByColorGroup('light-blue')
    expect(lightBlueSpaces).toHaveLength(3)
    expect(lightBlueSpaces.every(s => s.colorGroup === 'light-blue')).toBe(true)
  })

  it('should return all pink properties', () => {
    const pinkSpaces = getSpacesByColorGroup('pink')
    expect(pinkSpaces).toHaveLength(3)
    expect(pinkSpaces.every(s => s.colorGroup === 'pink')).toBe(true)
  })

  it('should return all orange properties', () => {
    const orangeSpaces = getSpacesByColorGroup('orange')
    expect(orangeSpaces).toHaveLength(3)
    expect(orangeSpaces.every(s => s.colorGroup === 'orange')).toBe(true)
  })

  it('should return all red properties', () => {
    const redSpaces = getSpacesByColorGroup('red')
    expect(redSpaces).toHaveLength(3)
    expect(redSpaces.every(s => s.colorGroup === 'red')).toBe(true)
  })

  it('should return all yellow properties', () => {
    const yellowSpaces = getSpacesByColorGroup('yellow')
    expect(yellowSpaces).toHaveLength(3)
    expect(yellowSpaces.every(s => s.colorGroup === 'yellow')).toBe(true)
  })

  it('should return all green properties', () => {
    const greenSpaces = getSpacesByColorGroup('green')
    expect(greenSpaces).toHaveLength(3)
    expect(greenSpaces.every(s => s.colorGroup === 'green')).toBe(true)
  })

  it('should return all dark-blue properties', () => {
    const darkBlueSpaces = getSpacesByColorGroup('dark-blue')
    expect(darkBlueSpaces).toHaveLength(2)
    expect(darkBlueSpaces.every(s => s.colorGroup === 'dark-blue')).toBe(true)
  })

  it('should return all railroads', () => {
    const railroads = getSpacesByColorGroup('railroad')
    expect(railroads).toHaveLength(4)
    expect(railroads.every(s => s.type === 'railroad')).toBe(true)
  })

  it('should return all utilities', () => {
    const utilities = getSpacesByColorGroup('utility')
    expect(utilities).toHaveLength(2)
    expect(utilities.every(s => s.type === 'utility')).toBe(true)
  })

  it('should return empty array for null color group', () => {
    const nullSpaces = getSpacesByColorGroup(null)
    // There are several spaces with null colorGroup (GO, Jail, etc.)
    expect(nullSpaces.length).toBeGreaterThan(0)
    expect(nullSpaces.every(s => s.colorGroup === null)).toBe(true)
  })
})

describe('calculateRent', () => {
  // Get sample spaces for testing
  const brownProperty = BOARD_SPACES.find(s => s.name === 'Tenderloin')!
  const railroad = BOARD_SPACES.find(s => s.name === 'Caltrain')!
  const utility = BOARD_SPACES.find(s => s.name === 'PG&E')!
  const goSpace = BOARD_SPACES.find(s => s.type === 'go')!

  describe('for properties', () => {
    it('should return base rent with 0 houses', () => {
      const rent = calculateRent(brownProperty, 0, false)
      expect(rent).toBe(brownProperty.rent![0])
    })

    it('should return double base rent when owning all properties in group with 0 houses', () => {
      const rent = calculateRent(brownProperty, 0, true)
      expect(rent).toBe(brownProperty.rent![0] * 2)
    })

    it('should return rent based on number of houses', () => {
      for (let houses = 1; houses <= 5; houses++) {
        const rent = calculateRent(brownProperty, houses, false)
        expect(rent).toBe(brownProperty.rent![houses])
      }
    })

    it('should not double rent when owning monopoly with houses', () => {
      for (let houses = 1; houses <= 5; houses++) {
        const rentWithMonopoly = calculateRent(brownProperty, houses, true)
        const rentWithoutMonopoly = calculateRent(brownProperty, houses, false)
        // With houses, monopoly bonus doesn't apply (doubling only applies to base rent)
        expect(rentWithMonopoly).toBe(rentWithoutMonopoly)
      }
    })
  })

  describe('for railroads', () => {
    it('should return correct rent based on number of railroads owned', () => {
      expect(calculateRent(railroad, 0, false)).toBe(25)  // 1 railroad
      expect(calculateRent(railroad, 1, false)).toBe(50)  // 2 railroads
      expect(calculateRent(railroad, 2, false)).toBe(100) // 3 railroads
      expect(calculateRent(railroad, 3, false)).toBe(200) // 4 railroads
    })

    it('should default to 25 for invalid railroad count', () => {
      expect(calculateRent(railroad, 5, false)).toBe(25)
    })
  })

  describe('for utilities and special spaces', () => {
    it('should return 0 for utilities', () => {
      // Utilities have no rent array - rent is calculated based on dice roll
      expect(calculateRent(utility, 0, false)).toBe(0)
    })

    it('should return 0 for spaces without rent', () => {
      expect(calculateRent(goSpace, 0, false)).toBe(0)
    })
  })
})

describe('Space type definitions', () => {
  it('should cover all space types on the board', () => {
    const allTypes = new Set(BOARD_SPACES.map(s => s.type))
    const expectedTypes: SpaceType[] = [
      'property', 'railroad', 'utility', 'tax',
      'chance', 'community-chest', 'go', 'jail',
      'free-parking', 'go-to-jail'
    ]
    expectedTypes.forEach(type => {
      expect(allTypes.has(type)).toBe(true)
    })
  })
})

describe('board layout', () => {
  it('should have corners at correct positions', () => {
    expect(BOARD_SPACES[0].type).toBe('go')
    expect(BOARD_SPACES[10].type).toBe('jail')
    expect(BOARD_SPACES[20].type).toBe('free-parking')
    expect(BOARD_SPACES[30].type).toBe('go-to-jail')
  })

  it('should have properties grouped by increasing price within color groups', () => {
    const colorGroups = ['brown', 'light-blue', 'pink', 'orange', 'red', 'yellow', 'green', 'dark-blue']
    colorGroups.forEach(color => {
      const properties = BOARD_SPACES.filter(
        s => s.type === 'property' && s.colorGroup === color
      )
      // Within a color group, the first properties should be cheaper or equal
      for (let i = 1; i < properties.length; i++) {
        expect(properties[i].price).toBeGreaterThanOrEqual(properties[i - 1].price!)
      }
    })
  })
})
