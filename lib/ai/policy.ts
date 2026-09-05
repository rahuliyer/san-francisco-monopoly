// Computer player policy - pure decision logic for AI seats.
//
// The policy is intentionally UI-agnostic: it takes a small snapshot of the
// current turn ("view") and returns the single next move the AI should make.
// The app maps each move onto the same handlers a human would trigger, so
// humans and computers share one code path through the game engine.

/** Cash a computer player tries to keep on hand after buying a property. */
export const AI_CASH_RESERVE = 100

/** Snapshot of the state a computer player needs to pick its next move. */
export interface AiTurnView {
  /** Whether the current seat is computer-controlled. */
  isComputer: boolean
  gameOver: boolean
  /** Dice animation in progress (wait for it to settle). */
  rolling: boolean
  hasRolled: boolean
  inJail: boolean
  jailFreeCards: number
  /** A special-space / drawn-card modal is awaiting acknowledgement. */
  awaitingSpecialSpace: boolean
  /** A property title-deed modal is open. */
  propertyModalOpen: boolean
  /** The open property is unowned and affordable (a Buy decision is offered). */
  canBuy: boolean
  /** Price of the property currently under a buy decision, if any. */
  buyPrice: number | null
  /** Current player's cash on hand. */
  money: number
}

/** The next move for a computer player, mapped by the app to a click handler. */
export type AiMove =
  | "roll"
  | "useJailCard"
  | "buy"
  | "pass"
  | "closeProperty"
  | "closeSpecial"
  | "wait"

/**
 * Decides whether the AI should buy an unowned property it landed on.
 * Buys when it can keep at least AI_CASH_RESERVE in reserve afterwards.
 */
export function shouldBuyProperty(money: number, price: number): boolean {
  return money - price >= AI_CASH_RESERVE
}

/**
 * Returns the single next move for a computer player given the current turn view.
 * Returns "wait" when it is not the AI's turn or when an animation/timer is in flight.
 */
export function decideAiMove(view: AiTurnView): AiMove {
  if (!view.isComputer || view.gameOver || view.rolling) {
    return "wait"
  }

  // Resolve any open modal first so the turn can progress.
  if (view.propertyModalOpen) {
    if (view.canBuy && view.buyPrice !== null) {
      return shouldBuyProperty(view.money, view.buyPrice) ? "buy" : "pass"
    }
    // Owned property, rent notice, or unaffordable: just acknowledge.
    return "closeProperty"
  }

  if (view.awaitingSpecialSpace) {
    return "closeSpecial"
  }

  // In jail before rolling: use a card if held, otherwise roll for doubles
  // (the roll handler auto-pays the fine on the final jail turn).
  if (view.inJail && !view.hasRolled) {
    return view.jailFreeCards > 0 ? "useJailCard" : "roll"
  }

  if (!view.hasRolled) {
    return "roll"
  }

  // Turn resolution (end-turn / roll-again after doubles) is driven by the
  // existing action-complete timers, so nothing to do here.
  return "wait"
}

/** A property a liquidating player owns, with what can be done to raise cash. */
export interface LiquidationAsset {
  spaceId: number
  houseCount: number
  /** House/hotel can be sold now (respects even-selling within the color group). */
  canSellHouse: boolean
  /** Property can be mortgaged now (has a mortgage value, unmortgaged, no houses). */
  canMortgage: boolean
}

/** The next liquidation action for a computer player that owes more than its cash. */
export type AiLiquidationMove =
  | { kind: "sellHouse"; spaceId: number }
  | { kind: "mortgage"; spaceId: number }
  | { kind: "bankrupt" }

/**
 * Chooses how a computer player raises funds while in forced liquidation.
 * Sells buildings first (mortgaging requires zero houses), then mortgages,
 * and finally declares bankruptcy when nothing is left to liquidate.
 */
export function decideAiLiquidationMove(assets: LiquidationAsset[]): AiLiquidationMove {
  const sellable = assets.filter((a) => a.canSellHouse)
  if (sellable.length > 0) {
    // Sell from the property with the most houses so even-selling stays valid.
    const target = sellable.reduce((best, a) => (a.houseCount > best.houseCount ? a : best))
    return { kind: "sellHouse", spaceId: target.spaceId }
  }

  const mortgageable = assets.filter((a) => a.canMortgage)
  if (mortgageable.length > 0) {
    return { kind: "mortgage", spaceId: mortgageable[0].spaceId }
  }

  return { kind: "bankrupt" }
}
