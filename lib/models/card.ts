// Card model - immutable card state management
// This module provides card types and deterministic deck management for testing.

/** Card effect types */
export type CardEffect =
  | { type: "collect"; amount: number }
  | { type: "pay"; amount: number }
  | { type: "advance"; position: number }
  | { type: "advance-to-go" }
  | { type: "go-to-jail" }
  | { type: "collect-from-players"; amount: number }
  | { type: "pay-to-players"; amount: number }
  | { type: "repairs"; houseAmount: number; hotelAmount: number }
  | { type: "go-back"; spaces: number }
  | { type: "get-out-of-jail-free" }

/** Game card definition */
export interface GameCard {
  readonly id: number
  readonly text: string
  readonly effect: CardEffect
}

/** Card deck with deterministic draw order */
export interface CardDeck {
  readonly cards: readonly GameCard[]
  readonly drawIndex: number
}

/** Result of drawing a card */
export interface CardDrawResult {
  readonly card: GameCard
  readonly newDeck: CardDeck
}

/** Chance cards for the SF Monopoly game */
export const CHANCE_CARDS: readonly GameCard[] = [
  { id: 1, text: "Take the F-Line streetcar to Fisherman's Wharf (GO). Collect $200.", effect: { type: "advance-to-go" } },
  { id: 2, text: "Your Victorian in Sea Cliff appreciated! Advance to Sea Cliff.", effect: { type: "advance", position: 39 } },
  { id: 3, text: "Invited to a billionaire's party in Pacific Heights. Advance there now.", effect: { type: "advance", position: 29 } },
  { id: 4, text: "Pride Parade day! Head to the Castro to celebrate.", effect: { type: "advance", position: 23 } },
  { id: 5, text: "Hop on BART to avoid the traffic. Advance to BART station.", effect: { type: "advance", position: 15 } },
  { id: 6, text: "Tourist wants a Cable Car photo with you. Ride to Cable Car.", effect: { type: "advance", position: 35 } },
  { id: 7, text: "Your app got featured on Product Hunt! Collect $50.", effect: { type: "collect", amount: 50 } },
  { id: 8, text: "Your AI startup got acquired by a tech giant! Collect $150.", effect: { type: "collect", amount: 150 } },
  { id: 9, text: "Caught stealing sourdough starter. Go directly to Alcatraz!", effect: { type: "go-to-jail" } },
  { id: 10, text: "Earthquake retrofit required on all properties: Pay $25 per house, $100 per hotel.", effect: { type: "repairs", houseAmount: 25, hotelAmount: 100 } },
  { id: 11, text: "A friend on the Board of Supervisors pulls some strings. Get Out of Alcatraz Free \u2014 keep this card.", effect: { type: "get-out-of-jail-free" } },
  { id: 12, text: "Uber surge pricing! Walk back 3 spaces instead.", effect: { type: "go-back", spaces: 3 } },
  { id: 13, text: "Completed the Bay to Breakers race! Collect $100.", effect: { type: "collect", amount: 100 } },
  { id: 14, text: "Your Tartine croissant recipe went viral on TikTok! Collect $200.", effect: { type: "collect", amount: 200 } },
  { id: 15, text: "FasTrak toll violation on the Golden Gate Bridge. Pay $50.", effect: { type: "pay", amount: 50 } },
  { id: 16, text: "Fogust is here! Escape to sunny Golden Gate Park.", effect: { type: "advance", position: 20 } },
] as const

/** Community Chest cards for the SF Monopoly game */
export const COMMUNITY_CHEST_CARDS: readonly GameCard[] = [
  { id: 1, text: "Free clam chowder in a bread bowl at Fisherman's Wharf! Advance to GO. Collect $200.", effect: { type: "advance-to-go" } },
  { id: 2, text: "Silicon Valley Bank error in your favor. Collect $200.", effect: { type: "collect", amount: 200 } },
  { id: 3, text: "UCSF Medical Center bill. Pay $50.", effect: { type: "pay", amount: 50 } },
  { id: 4, text: "Sold Dungeness crab at the Wharf. Collect $50.", effect: { type: "collect", amount: 50 } },
  { id: 5, text: "Tried to escape Alcatraz tour early. Go directly to Alcatraz!", effect: { type: "go-to-jail" } },
  { id: 6, text: "Warriors win the NBA Championship! The city celebrates. Collect $100.", effect: { type: "collect", amount: 100 } },
  { id: 7, text: "California state tax refund. Collect $20.", effect: { type: "collect", amount: 20 } },
  { id: 8, text: "Throwing a rooftop party in SOMA! Collect $10 from each player.", effect: { type: "collect-from-players", amount: 10 } },
  { id: 9, text: "Your Dolores Park rental income came through. Collect $100.", effect: { type: "collect", amount: 100 } },
  { id: 10, text: "Slipped on a steep hill in Nob Hill. Hospital fees: Pay $100.", effect: { type: "pay", amount: 100 } },
  { id: 11, text: "SF private school tuition. Pay $50.", effect: { type: "pay", amount: 50 } },
  { id: 12, text: "Consulting gig for a Salesforce Tower tenant. Collect $25.", effect: { type: "collect", amount: 25 } },
  { id: 13, text: "Victorian home maintenance on your Painted Ladies: Pay $40 per house, $115 per hotel.", effect: { type: "repairs", houseAmount: 40, hotelAmount: 115 } },
  { id: 14, text: "Won second place in the Boudin sourdough bake-off. Collect $10.", effect: { type: "collect", amount: 10 } },
  { id: 15, text: "Inherited a rent-controlled apartment in the Mission! Collect $100.", effect: { type: "collect", amount: 100 } },
  { id: 16, text: "The Alcatraz tour guide vouches for you. Get Out of Alcatraz Free \u2014 keep this card.", effect: { type: "get-out-of-jail-free" } },
] as const

/**
 * Creates a deck from an array of cards with optional custom order.
 * @param cards The cards to include in the deck
 * @param order Optional array of indices specifying draw order. If not provided, uses natural order.
 */
export function createDeck(
  cards: readonly GameCard[],
  order?: readonly number[]
): CardDeck {
  if (order) {
    const orderedCards = order.map((index) => cards[index % cards.length])
    return { cards: orderedCards, drawIndex: 0 }
  }
  return { cards, drawIndex: 0 }
}

/**
 * Creates a shuffled deck using Fisher-Yates shuffle.
 * @param cards The cards to shuffle
 * @param random Optional random function (defaults to Math.random)
 */
export function createShuffledDeck(
  cards: readonly GameCard[],
  random: () => number = Math.random
): CardDeck {
  const shuffled = [...cards]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return { cards: shuffled, drawIndex: 0 }
}

/**
 * Creates a deck from a specific order of card IDs.
 * Useful for creating deterministic test scenarios.
 * @param cards The card pool to draw from
 * @param cardIds Array of card IDs in the desired draw order
 */
export function createDeckFromIds(
  cards: readonly GameCard[],
  cardIds: readonly number[]
): CardDeck {
  const orderedCards = cardIds.map((id) => {
    const card = cards.find((c) => c.id === id)
    if (!card) {
      throw new Error(`Card with id ${id} not found`)
    }
    return card
  })
  return { cards: orderedCards, drawIndex: 0 }
}

/**
 * Draws a card from the deck immutably.
 * Wraps around to the beginning when the deck is exhausted.
 */
export function drawCard(deck: CardDeck): CardDrawResult {
  const card = deck.cards[deck.drawIndex]
  const newDrawIndex = (deck.drawIndex + 1) % deck.cards.length
  return {
    card,
    newDeck: { ...deck, drawIndex: newDrawIndex },
  }
}

/**
 * Peeks at the next card without advancing the deck.
 */
export function peekCard(deck: CardDeck): GameCard {
  return deck.cards[deck.drawIndex]
}

/**
 * Resets the deck to the beginning.
 */
export function resetDeck(deck: CardDeck): CardDeck {
  return { ...deck, drawIndex: 0 }
}

/**
 * Gets the number of cards remaining before the deck wraps.
 */
export function cardsRemaining(deck: CardDeck): number {
  return deck.cards.length - deck.drawIndex
}

/**
 * Draws a random Chance card (legacy function for backward compatibility).
 */
export function drawChanceCard(): GameCard {
  const index = Math.floor(Math.random() * CHANCE_CARDS.length)
  return CHANCE_CARDS[index]
}

/**
 * Draws a random Community Chest card (legacy function for backward compatibility).
 */
export function drawCommunityChestCard(): GameCard {
  const index = Math.floor(Math.random() * COMMUNITY_CHEST_CARDS.length)
  return COMMUNITY_CHEST_CARDS[index]
}
