# E2E Game Store Injection

The game uses an injectable **game store** (`IGameStore`) so e2e tests can control dice (and optionally full state) without relying only on global dice overrides.

## Current behavior

- **Default:** The app creates a store in `GameStoreProvider` that uses `rollDice` from `lib/game-data.ts`. That function still reads `globalThis.__TEST_DICE_ROLLS__`, so existing e2e tests that set `__TEST_DICE_ROLLS__` via `page.addInitScript()` keep working unchanged.
- **Injection:** If `window.__GAME_STORE__` is set before the app mounts, the provider uses that store instead of creating its own. E2e can assign a store with a custom `diceRoller` (and optionally custom initial state) for full control.

## Option 1: Existing dice override (no code changes)

Continue using `__TEST_DICE_ROLLS__` in e2e. The default store’s dice roller is `rollDice` from `game-data`, which consumes that array:

```ts
await page.addInitScript((sequence: [number, number][]) => {
  (globalThis as { __TEST_DICE_ROLLS__?: [number, number][] }).__TEST_DICE_ROLLS__ = sequence
}, [[3, 3], [1, 2]])
```

## Option 2: Inject a full store (advanced)

To control the store implementation (e.g. custom `diceRoller` or seeded state), the app must expose the store factory in the browser (e.g. only in dev or behind a flag). Then e2e can do:

1. Before navigating (e.g. in `addInitScript`), set `window.__GAME_STORE__` to an `IGameStore` instance.
2. That instance must implement:
   - `getState(): GameState`
   - `setState(updater: (prev: GameState) => GameState): void`
   - `subscribe(listener: (state: GameState) => void): () => void`
   - `getDiceRoller(): () => [number, number]`

Example (if the app exposed `window.__createGameStore` and `window.__createInitialGameState`):

```ts
await page.addInitScript(() => {
  const rolls: [number, number][] = [[3, 3], [1, 2]]
  window.__GAME_STORE__ = window.__createGameStore(
    window.__createInitialGameState(),
    { diceRoller: () => rolls.shift() ?? [1, 1] }
  )
})
```

Without exposing the factory, e2e can still rely on Option 1 (`__TEST_DICE_ROLLS__`).

## Unit tests

App tests that render the full game (`MonopolyGame`) must wrap it in `GameStoreProvider`:

```tsx
import { GameStoreProvider } from "@/components/game-store-context"
import MonopolyGame from "@/app/page"

render(
  <GameStoreProvider>
    <MonopolyGame />
  </GameStoreProvider>
)
```

See `__tests__/app/escape-closes-dialogs.test.tsx` and `__tests__/app/doubles-rule.test.tsx`.
