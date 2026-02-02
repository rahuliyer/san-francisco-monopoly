# Game State & Architectural Improvement Suggestions

**Generated:** Jan 31, 2025  
**Branch:** `feat/architectural-improvements` (new worktree at `../san-francisco-monopoly-arch`)

---

## Executive Summary

The San Francisco Monopoly app has solid foundations in `lib/` (pure functions, typed data) but suffers from a **monolithic page component** (~1,530 lines) that concentrates all game state and logic. This document outlines architectural improvements to increase maintainability, testability, and reduce bug risk.

---

## Current State Analysis

### Strengths

1. **Pure logic in lib/** – `lib/mechanics/cards.ts`, `lib/game-status.ts`, and most of `lib/game-data.ts` are pure, side-effect-free, and unit-testable.
2. **Centralized constants** – `lib/constants.ts` and `GAME_CONSTANTS` avoid magic numbers.
3. **Rent table typing** – `RentTable`, `PropertyRentTiers`, `OwnedProperty` in `game-data.ts` improve type safety.
4. **UI components** – Board, controls, modals, etc. are reasonably decoupled.

### Pain Points

| Issue | Location | Impact |
|-------|----------|--------|
| Monolithic state | `app/page.tsx` | Hard to reason about, difficult to test |
| Massive `handleRoll` | ~lines 320–560 | ~240 lines, nested `setTimeout`s, jail vs normal branching |
| Stale closure risk | `handleRoll` callbacks | Uses `gameState` inside `setTimeout`; can capture stale values |
| Data duplication | `Player.properties` vs `propertyOwners` | Must be synced manually (e.g., trade handler) |
| UI + game logic mixed | Throughout `page.tsx` | Modal state, animation timing, and game rules interleaved |
| Index vs ID usage | Various | `currentPlayerIndex` (index) vs `propertyOwners[spaceId]` (player id); works but brittle |

---

## Recommended Improvements

### 1. Extract Game State into a Custom Hook or Reducer

**Problem:** One large `useState<GameState>` with many fields and many handlers.

**Approach A – `useReducer`:**

- Single `GameState` type.
- Actions like `ROLL_DICE`, `LAND_ON_SPACE`, `BUY_PROPERTY`, `END_TURN`, etc.
- Pure reducer with predictable transitions; easier to test and time-travel debug.

**Approach B – `useGameState` hook:**

- Encapsulate state and handlers in a hook.
- Return `{ gameState, actions }`.
- Page component focuses on layout and wiring; logic lives in the hook.

**Benefits:** Smaller page component, easier unit tests, clearer state flow.

---

### 2. Extract Roll Logic into a Dedicated Module

**Problem:** `handleRoll` is ~240 lines with multiple branches and `setTimeout`s.

**Approach:**

- Create `lib/mechanics/roll.ts` (or `lib/mechanics/dice-roll.ts`):
  - `computeRollResult(dice, players, currentIndex, propertyOwners, …)` → pure object describing:
    - New positions
    - Money changes
    - Jail transitions
    - Doubles count
    - Rent to pay
    - Which modal(s) to show
  - No React, no `setTimeout`, no `setState`; just inputs → outputs.

- In the page/hook:
  - Call `rollDice()` and `computeRollResult(...)`.
  - Apply the result to state.
  - Use `useEffect` or `requestAnimationFrame` for animations; keep game logic pure.

**Benefits:** Roll behavior is unit-testable and debuggable without React.

---

### 3. Separate UI Flow State from Core Game State

**Problem:** `selectedSpace`, `awaitingPropertyDecision`, `awaitingSpecialSpace`, `specialSpace`, `drawnCard`, `viewingPropertiesForPlayer` live next to core game state.

**Approach:**

- Split state:
  - `coreGameState`: players, currentPlayerIndex, propertyOwners, mortgagedProperties, propertyHouses, gameOver, winnerId.
  - `turnState`: hasRolled, consecutiveDoubles, rolling (and possibly derived “current phase”).
  - `uiState`: selectedSpace, openModals, drawnCard, etc.

- Optionally, use separate `useState`/`useReducer` for each slice, or a single reducer with sub-slices.

**Benefits:** Clear separation of concerns; UI bugs are less likely to affect game logic.

---

### 4. Unify Source of Truth for Properties

**Problem:** `Player.properties` (space IDs) and `propertyOwners` (spaceId → ownerId) can drift.

**Approach:**

- Treat `propertyOwners` as the single source of truth.
- Derive `Player.properties` when needed:  
  `properties = Object.entries(propertyOwners).filter(([, id]) => id === player.id).map(([id]) => +id)`.
- Or remove `Player.properties` and pass `propertyOwners` + `playerId` where needed.

**Benefits:** No sync bugs, simpler trade and bankruptcy logic.

---

### 5. Replace Index-Based Current Player with ID-Based

**Problem:** `currentPlayerIndex` and player IDs are conflated; some logic assumes `id === index`.

**Approach:**

- Use `currentPlayerId: number | null` as primary.
- Derive `currentPlayerIndex` when needed for ordering.
- Ensure `getNextActivePlayerIndex` and similar utilities work with IDs or return IDs.

**Benefits:** More robust if player order or IDs change; clearer semantics.

---

### 6. Centralize Animation Timing

**Problem:** `setTimeout` calls and delays are scattered in `handleRoll` and handlers.

**Approach:**

- Define phases: `ROLL_ANIMATING` → `SHOWING_MODAL` → `AWAITING_INPUT` → `TURN_COMPLETE`.
- Use a small state machine or a queue of “delayed actions” (e.g., “after 700ms, show property modal”).
- Wrap in `requestAnimationFrame` or a small `useTransition`-style helper if needed.

**Benefits:** Predictable timing, easier to tweak without hunting through callbacks.

---

### 7. Add Integration Tests for Critical Paths

**Current:** Unit tests for lib; E2E for full flows.

**Gap:** No integration tests for page-level game flows (e.g., roll → land → buy → end turn).

**Approach:**

- Extract a “game engine” (reducer or pure functions) that can be run headlessly.
- Add integration tests that:
  - Seed initial state
  - Dispatch a sequence of actions
  - Assert final state and side effects (e.g., logs, modals)
- Optionally reuse the same engine from `page.tsx` and E2E.

**Benefits:** Catch regressions in core flows without full E2E runs.

---

## Suggested Implementation Order

1. **Quick wins:**  
   - Split UI vs core state (at least conceptually).  
   - Add a small `lib/mechanics/roll.ts` for roll computation (even if initially minimal).

2. **Medium effort:**  
   - Introduce `useReducer` for core game state.  
   - Derive `Player.properties` from `propertyOwners` and remove duplication.

3. **Larger refactors:**  
   - Extract full roll logic into a pure module.  
   - Move to ID-based current player.  
   - Centralize animation/timing.

---

## Reference: Current GameState Shape

```ts
interface GameState {
  // Core
  players: Player[]
  currentPlayerIndex: number
  propertyOwners: Record<number, number>
  mortgagedProperties: Record<number, boolean>
  propertyHouses: Record<number, number>

  // Turn
  diceValues: [number, number]
  hasRolled: boolean
  rolling: boolean
  consecutiveDoubles: number

  // Modals / UI
  selectedSpace: Space | null
  specialSpace: Space | null
  drawnCard: GameCard | null
  awaitingPropertyDecision: boolean
  awaitingSpecialSpace: boolean
  isOwnProperty: boolean
  rentPaid: number | undefined
  viewingPropertiesForPlayer: Player | null

  // Meta
  gameLog: string[]
  gameOver: boolean
  winnerId: number | null
}
```

---

## Stashed Work

If you were working on `feat/rent-table-documented-structure`:

```bash
git checkout feat/rent-table-documented-structure
git stash pop
```

The stash was created before switching to `main` and pulling the latest changes.
