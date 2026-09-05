import {
  decideAiMove,
  decideAiLiquidationMove,
  shouldBuyProperty,
  AI_CASH_RESERVE,
  type AiTurnView,
  type LiquidationAsset,
} from "@/lib/ai/policy"

function view(overrides: Partial<AiTurnView> = {}): AiTurnView {
  return {
    isComputer: true,
    gameOver: false,
    rolling: false,
    hasRolled: false,
    inJail: false,
    jailFreeCards: 0,
    awaitingSpecialSpace: false,
    propertyModalOpen: false,
    canBuy: false,
    buyPrice: null,
    money: 1500,
    ...overrides,
  }
}

describe("AI policy", () => {
  describe("decideAiMove gating", () => {
    it("waits when the seat is not a computer", () => {
      expect(decideAiMove(view({ isComputer: false }))).toBe("wait")
    })

    it("waits when the game is over", () => {
      expect(decideAiMove(view({ gameOver: true }))).toBe("wait")
    })

    it("waits while the dice are rolling", () => {
      expect(decideAiMove(view({ rolling: true }))).toBe("wait")
    })
  })

  describe("turn loop", () => {
    it("rolls when it has not rolled yet", () => {
      expect(decideAiMove(view({ hasRolled: false }))).toBe("roll")
    })

    it("waits after rolling with no modal (turn auto-advances)", () => {
      expect(decideAiMove(view({ hasRolled: true }))).toBe("wait")
    })
  })

  describe("jail", () => {
    it("uses a Get Out of Jail Free card when held", () => {
      expect(decideAiMove(view({ inJail: true, jailFreeCards: 1 }))).toBe("useJailCard")
    })

    it("rolls for doubles when jailed with no card", () => {
      expect(decideAiMove(view({ inJail: true, jailFreeCards: 0 }))).toBe("roll")
    })
  })

  describe("property decisions", () => {
    it("buys when it can keep the cash reserve", () => {
      const move = decideAiMove(
        view({ hasRolled: true, propertyModalOpen: true, canBuy: true, buyPrice: 100, money: 1500 })
      )
      expect(move).toBe("buy")
    })

    it("passes when buying would drop below the reserve", () => {
      const move = decideAiMove(
        view({ hasRolled: true, propertyModalOpen: true, canBuy: true, buyPrice: 200, money: 250 })
      )
      expect(move).toBe("pass")
    })

    it("acknowledges an owned/rent/unaffordable property modal", () => {
      const move = decideAiMove(
        view({ hasRolled: true, propertyModalOpen: true, canBuy: false })
      )
      expect(move).toBe("closeProperty")
    })

    it("acknowledges a special-space modal", () => {
      expect(decideAiMove(view({ hasRolled: true, awaitingSpecialSpace: true }))).toBe("closeSpecial")
    })

    it("resolves an open property modal before anything else", () => {
      // Even mid-jail, an open modal is handled first.
      const move = decideAiMove(
        view({ inJail: true, jailFreeCards: 1, propertyModalOpen: true, canBuy: false })
      )
      expect(move).toBe("closeProperty")
    })
  })

  describe("decideAiLiquidationMove", () => {
    const asset = (o: Partial<LiquidationAsset> = {}): LiquidationAsset => ({
      spaceId: 1,
      houseCount: 0,
      canSellHouse: false,
      canMortgage: false,
      ...o,
    })

    it("sells houses before mortgaging", () => {
      const move = decideAiLiquidationMove([
        asset({ spaceId: 1, canMortgage: true }),
        asset({ spaceId: 6, houseCount: 2, canSellHouse: true }),
      ])
      expect(move).toEqual({ kind: "sellHouse", spaceId: 6 })
    })

    it("sells from the property with the most houses (keeps even-selling valid)", () => {
      const move = decideAiLiquidationMove([
        asset({ spaceId: 6, houseCount: 1, canSellHouse: true }),
        asset({ spaceId: 8, houseCount: 3, canSellHouse: true }),
      ])
      expect(move).toEqual({ kind: "sellHouse", spaceId: 8 })
    })

    it("mortgages when there are no houses to sell", () => {
      const move = decideAiLiquidationMove([
        asset({ spaceId: 5 }),
        asset({ spaceId: 3, canMortgage: true }),
      ])
      expect(move).toEqual({ kind: "mortgage", spaceId: 3 })
    })

    it("declares bankruptcy when nothing can be liquidated", () => {
      expect(decideAiLiquidationMove([asset(), asset({ spaceId: 9 })])).toEqual({ kind: "bankrupt" })
      expect(decideAiLiquidationMove([])).toEqual({ kind: "bankrupt" })
    })
  })

  describe("shouldBuyProperty", () => {
    it("buys when leaving at least the reserve", () => {
      expect(shouldBuyProperty(AI_CASH_RESERVE + 60, 60)).toBe(true)
    })

    it("does not buy when it would dip below the reserve", () => {
      expect(shouldBuyProperty(AI_CASH_RESERVE + 59, 60)).toBe(false)
    })
  })
})
