// SF Monopoly Game Data

import { GAME_CONSTANTS } from "@/lib/constants"

export type SpaceType = 'property' | 'railroad' | 'utility' | 'tax' | 'chance' | 'community-chest' | 'go' | 'jail' | 'free-parking' | 'go-to-jail'

export type ColorGroup = 'brown' | 'light-blue' | 'pink' | 'orange' | 'red' | 'yellow' | 'green' | 'dark-blue' | 'railroad' | 'utility' | null

export interface Space {
  id: number
  name: string
  type: SpaceType
  colorGroup: ColorGroup
  price?: number
  rent?: number[]
  houseCost?: number
  mortgage?: number
  image?: string
}

export interface Player {
  id: number
  name: string
  color: string
  token: string
  money: number
  position: number
  properties: number[]
  inJail: boolean
  jailTurns: number
  isBankrupt: boolean
}

export const COLOR_MAP: Record<string, string> = {
  'brown': '#8B4513',
  'light-blue': '#87CEEB',
  'pink': '#FF69B4',
  'orange': '#FFA500',
  'red': '#FF0000',
  'yellow': '#FFD700',
  'green': '#228B22',
  'dark-blue': '#00008B',
  'railroad': '#4A4A4A',
  'utility': '#D3D3D3',
}

export const BOARD_SPACES: Space[] = [
  // Bottom row (right to left)
  { id: 0, name: 'Fisherman\'s Wharf', type: 'go', colorGroup: null, image: '/images/go-fishermans-wharf.jpg' },
  { id: 1, name: 'Tenderloin', type: 'property', colorGroup: 'brown', price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50, mortgage: 30, image: '/images/tenderloin.jpg' },
  { id: 2, name: 'Community Chest', type: 'community-chest', colorGroup: null, image: '/images/community-chest.jpg' },
  { id: 3, name: 'Bayview', type: 'property', colorGroup: 'brown', price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50, mortgage: 30, image: '/images/bayview.jpg' },
  { id: 4, name: 'Income Tax', type: 'tax', colorGroup: null },
  { id: 5, name: 'Caltrain', type: 'railroad', colorGroup: 'railroad', price: 200, rent: [25, 50, 100, 200], mortgage: 100, image: '/images/caltrain.jpg' },
  { id: 6, name: 'Sunset District', type: 'property', colorGroup: 'light-blue', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgage: 50, image: '/images/sunset-district.jpg' },
  { id: 7, name: 'Chance', type: 'chance', colorGroup: null, image: '/images/chance.jpg' },
  { id: 8, name: 'Richmond District', type: 'property', colorGroup: 'light-blue', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgage: 50, image: '/images/richmond-district.jpg' },
  { id: 9, name: 'Outer Mission', type: 'property', colorGroup: 'light-blue', price: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50, mortgage: 60, image: '/images/outer-mission.jpg' },
  
  // Left column (bottom to top)
  { id: 10, name: 'Alcatraz', type: 'jail', colorGroup: null, image: '/images/jail-alcatraz.jpg' },
  { id: 11, name: 'Dogpatch', type: 'property', colorGroup: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgage: 70, image: '/images/dogpatch.jpg' },
  { id: 12, name: 'PG&E', type: 'utility', colorGroup: 'utility', price: 150, mortgage: 75, image: '/images/pge.jpg' },
  { id: 13, name: 'Potrero Hill', type: 'property', colorGroup: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgage: 70, image: '/images/potrero-hill.jpg' },
  { id: 14, name: 'Bernal Heights', type: 'property', colorGroup: 'pink', price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, mortgage: 80, image: '/images/bernal-heights.jpg' },
  { id: 15, name: 'BART', type: 'railroad', colorGroup: 'railroad', price: 200, rent: [25, 50, 100, 200], mortgage: 100, image: '/images/bart.jpg' },
  { id: 16, name: 'Hayes Valley', type: 'property', colorGroup: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgage: 90, image: '/images/hayes-valley.jpg' },
  { id: 17, name: 'Community Chest', type: 'community-chest', colorGroup: null, image: '/images/community-chest.jpg' },
  { id: 18, name: 'Cole Valley', type: 'property', colorGroup: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgage: 90, image: '/images/cole-valley.jpg' },
  { id: 19, name: 'Noe Valley', type: 'property', colorGroup: 'orange', price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100, mortgage: 100, image: '/images/noe-valley.jpg' },
  
  // Top row (left to right)
  { id: 20, name: 'Golden Gate Park', type: 'free-parking', colorGroup: null, image: '/images/free-parking-ggp.jpg' },
  { id: 21, name: 'Mission District', type: 'property', colorGroup: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgage: 110, image: '/images/mission-district.jpg' },
  { id: 22, name: 'Chance', type: 'chance', colorGroup: null, image: '/images/chance.jpg' },
  { id: 23, name: 'Castro', type: 'property', colorGroup: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgage: 110, image: '/images/castro.jpg' },
  { id: 24, name: 'SoMa', type: 'property', colorGroup: 'red', price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, mortgage: 120, image: '/images/soma.jpg' },
  { id: 25, name: 'Muni', type: 'railroad', colorGroup: 'railroad', price: 200, rent: [25, 50, 100, 200], mortgage: 100, image: '/images/muni.jpg' },
  { id: 26, name: 'Marina', type: 'property', colorGroup: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgage: 130, image: '/images/marina.jpg' },
  { id: 27, name: 'Cow Hollow', type: 'property', colorGroup: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgage: 130, image: '/images/cow-hollow.jpg' },
  { id: 28, name: 'SF Water', type: 'utility', colorGroup: 'utility', price: 150, mortgage: 75, image: '/images/sf-water.jpg' },
  { id: 29, name: 'Pacific Heights', type: 'property', colorGroup: 'yellow', price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, mortgage: 140, image: '/images/pacific-heights.jpg' },
  
  // Right column (top to bottom)
  { id: 30, name: 'Go To Alcatraz', type: 'go-to-jail', colorGroup: null, image: '/images/go-to-jail.jpg' },
  { id: 31, name: 'Russian Hill', type: 'property', colorGroup: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgage: 150, image: '/images/russian-hill.jpg' },
  { id: 32, name: 'Nob Hill', type: 'property', colorGroup: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgage: 150, image: '/images/nob-hill.jpg' },
  { id: 33, name: 'Community Chest', type: 'community-chest', colorGroup: null, image: '/images/community-chest.jpg' },
  { id: 34, name: 'Telegraph Hill', type: 'property', colorGroup: 'green', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, mortgage: 160, image: '/images/telegraph-hill.jpg' },
  { id: 35, name: 'Cable Car', type: 'railroad', colorGroup: 'railroad', price: 200, rent: [25, 50, 100, 200], mortgage: 100, image: '/images/cable-car.jpg' },
  { id: 36, name: 'Chance', type: 'chance', colorGroup: null, image: '/images/chance.jpg' },
  { id: 37, name: 'Presidio Heights', type: 'property', colorGroup: 'dark-blue', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, mortgage: 175, image: '/images/presidio-heights.jpg' },
  { id: 38, name: 'Luxury Tax', type: 'tax', colorGroup: null },
  { id: 39, name: 'Sea Cliff', type: 'property', colorGroup: 'dark-blue', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, mortgage: 200, image: '/images/sea-cliff.jpg' },
]

export const PLAYER_TOKENS = [
  { name: 'Cable Car', icon: '🚃', color: '#C4451A' },
  { name: 'Crab', icon: '🦀', color: '#2563EB' },
  { name: 'Victorian House', icon: '🏠', color: '#16A34A' },
  { name: 'Golden Gate', icon: '🌉', color: '#9333EA' },
]

// Re-export for backwards compatibility
export const STARTING_MONEY = GAME_CONSTANTS.STARTING_MONEY

export function createPlayer(id: number, name: string, tokenIndex: number): Player {
  const token = PLAYER_TOKENS[tokenIndex]
  return {
    id,
    name,
    color: token.color,
    token: token.icon,
    money: GAME_CONSTANTS.STARTING_MONEY,
    position: 0,
    properties: [],
    inJail: false,
    jailTurns: 0,
    isBankrupt: false,
  }
}

export function rollDice(): [number, number] {
  const override = (globalThis as { __TEST_DICE_ROLLS__?: [number, number][] })
    .__TEST_DICE_ROLLS__
  if (Array.isArray(override) && override.length > 0) {
    const [first, second] = override.shift() ?? []
    const safeFirst = typeof first === "number" ? Math.min(Math.max(first, 1), 6) : 1
    const safeSecond = typeof second === "number" ? Math.min(Math.max(second, 1), 6) : 1
    return [safeFirst, safeSecond]
  }
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ]
}

export function getSpacesByColorGroup(colorGroup: ColorGroup): Space[] {
  return BOARD_SPACES.filter(space => space.colorGroup === colorGroup)
}

export function calculateRent(space: Space, houses: number, ownsAllInGroup: boolean): number {
  if (!space.rent) return 0
  if (space.type === 'railroad') {
    return space.rent[houses] || 25
  }
  if (houses === 0 && ownsAllInGroup) {
    return space.rent[0] * 2
  }
  return space.rent[houses] || space.rent[0]
}

// Card types for Chance and Community Chest
export type CardEffect = 
  | { type: 'collect'; amount: number }
  | { type: 'pay'; amount: number }
  | { type: 'advance'; position: number }
  | { type: 'advance-to-go' }
  | { type: 'go-to-jail' }
  | { type: 'collect-from-players'; amount: number }
  | { type: 'pay-to-players'; amount: number }
  | { type: 'repairs'; houseAmount: number; hotelAmount: number }
  | { type: 'go-back'; spaces: number }

export interface GameCard {
  id: number
  text: string
  effect: CardEffect
}

export const CHANCE_CARDS: GameCard[] = [
  { id: 1, text: "Take the F-Line streetcar to Fisherman's Wharf (GO). Collect $200.", effect: { type: 'advance-to-go' } },
  { id: 2, text: "Your Victorian in Sea Cliff appreciated! Advance to Sea Cliff.", effect: { type: 'advance', position: 39 } },
  { id: 3, text: "Invited to a billionaire's party in Pacific Heights. Advance there now.", effect: { type: 'advance', position: 29 } },
  { id: 4, text: "Pride Parade day! Head to the Castro to celebrate.", effect: { type: 'advance', position: 23 } },
  { id: 5, text: "Hop on BART to avoid the traffic. Advance to BART station.", effect: { type: 'advance', position: 15 } },
  { id: 6, text: "Tourist wants a Cable Car photo with you. Ride to Cable Car.", effect: { type: 'advance', position: 35 } },
  { id: 7, text: "Your app got featured on Product Hunt! Collect $50.", effect: { type: 'collect', amount: 50 } },
  { id: 8, text: "Your AI startup got acquired by a tech giant! Collect $150.", effect: { type: 'collect', amount: 150 } },
  { id: 9, text: "Caught stealing sourdough starter. Go directly to Alcatraz!", effect: { type: 'go-to-jail' } },
  { id: 10, text: "Earthquake retrofit required on all properties: Pay $25 per house, $100 per hotel.", effect: { type: 'repairs', houseAmount: 25, hotelAmount: 100 } },
  { id: 11, text: "SFMTA parking ticket on your Painted Lady. Pay $15.", effect: { type: 'pay', amount: 15 } },
  { id: 12, text: "Uber surge pricing! Walk back 3 spaces instead.", effect: { type: 'go-back', spaces: 3 } },
  { id: 13, text: "Completed the Bay to Breakers race! Collect $100.", effect: { type: 'collect', amount: 100 } },
  { id: 14, text: "Your Tartine croissant recipe went viral on TikTok! Collect $200.", effect: { type: 'collect', amount: 200 } },
  { id: 15, text: "FasTrak toll violation on the Golden Gate Bridge. Pay $50.", effect: { type: 'pay', amount: 50 } },
  { id: 16, text: "Fogust is here! Escape to sunny Golden Gate Park.", effect: { type: 'advance', position: 20 } },
]

export const COMMUNITY_CHEST_CARDS: GameCard[] = [
  { id: 1, text: "Free clam chowder in a bread bowl at Fisherman's Wharf! Advance to GO. Collect $200.", effect: { type: 'advance-to-go' } },
  { id: 2, text: "Silicon Valley Bank error in your favor. Collect $200.", effect: { type: 'collect', amount: 200 } },
  { id: 3, text: "UCSF Medical Center bill. Pay $50.", effect: { type: 'pay', amount: 50 } },
  { id: 4, text: "Sold Dungeness crab at the Wharf. Collect $50.", effect: { type: 'collect', amount: 50 } },
  { id: 5, text: "Tried to escape Alcatraz tour early. Go directly to Alcatraz!", effect: { type: 'go-to-jail' } },
  { id: 6, text: "Warriors win the NBA Championship! The city celebrates. Collect $100.", effect: { type: 'collect', amount: 100 } },
  { id: 7, text: "California state tax refund. Collect $20.", effect: { type: 'collect', amount: 20 } },
  { id: 8, text: "Throwing a rooftop party in SOMA! Collect $10 from each player.", effect: { type: 'collect-from-players', amount: 10 } },
  { id: 9, text: "Your Dolores Park rental income came through. Collect $100.", effect: { type: 'collect', amount: 100 } },
  { id: 10, text: "Slipped on a steep hill in Nob Hill. Hospital fees: Pay $100.", effect: { type: 'pay', amount: 100 } },
  { id: 11, text: "SF private school tuition. Pay $50.", effect: { type: 'pay', amount: 50 } },
  { id: 12, text: "Consulting gig for a Salesforce Tower tenant. Collect $25.", effect: { type: 'collect', amount: 25 } },
  { id: 13, text: "Victorian home maintenance on your Painted Ladies: Pay $40 per house, $115 per hotel.", effect: { type: 'repairs', houseAmount: 40, hotelAmount: 115 } },
  { id: 14, text: "Won second place in the Boudin sourdough bake-off. Collect $10.", effect: { type: 'collect', amount: 10 } },
  { id: 15, text: "Inherited a rent-controlled apartment in the Mission! Collect $100.", effect: { type: 'collect', amount: 100 } },
  { id: 16, text: "Lost your Clipper card. Buy a new MUNI pass: Pay $50.", effect: { type: 'pay', amount: 50 } },
]

export function drawChanceCard(): GameCard {
  const index = Math.floor(Math.random() * CHANCE_CARDS.length)
  return CHANCE_CARDS[index]
}

export function drawCommunityChestCard(): GameCard {
  const index = Math.floor(Math.random() * COMMUNITY_CHEST_CARDS.length)
  return COMMUNITY_CHEST_CARDS[index]
}
