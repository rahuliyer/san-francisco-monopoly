# CLAUDE.md

This file provides guidance for Claude Code (claude.ai/code) when working with this codebase.

## Project Overview

San Francisco Monopoly is a browser-based Monopoly game with San Francisco neighborhoods and landmarks. Built with Next.js 16, React 19, and TypeScript, featuring complete game mechanics including property management, house/hotel building, jail systems, trading, and card-based events.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI**: React 19, shadcn/ui (New York style), Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables (oklch color space)
- **Language**: TypeScript 5 (strict mode)
- **Testing**: Jest 30 + React Testing Library (unit), Playwright (e2e)
- **Package Manager**: pnpm v9

## Project Structure

```
app/                    # Next.js App Router pages
  page.tsx              # Main game component (core game logic)
  layout.tsx            # Root layout with metadata
  globals.css           # Global styles & design tokens
components/             # React components
  ui/                   # shadcn/ui base components
  game-board.tsx        # Board rendering
  game-controls.tsx     # Roll dice & controls
  property-card.tsx     # Property detail modal
  trade-modal.tsx       # Trading interface
lib/                    # Core utilities
  game-data.ts          # Game constants, types, board data
  utils.ts              # Helper utilities (cn function)
__tests__/              # Jest unit tests
e2e/                    # Playwright e2e tests
```

## Common Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Build for production
pnpm test             # Run unit tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run with coverage
pnpm test:e2e         # Run Playwright e2e tests
pnpm lint             # Run ESLint
```

## Code Patterns

### Component Structure
```typescript
"use client"  // Client components need this directive

interface ComponentProps {
  prop1: string
  prop2?: number
}

export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Implementation
}
```

### Class Name Utility
```typescript
import { cn } from '@/lib/utils'
className={cn("base-classes", conditional && "conditional-class")}
```

### Game Types
Core types are defined in `lib/game-data.ts`:
- `Space`, `SpaceType`, `ColorGroup` - Board definitions
- `Player`, `PlayerToken` - Player state
- `Card` - Chance/Community Chest cards
- `BOARD_SPACES` - 40-space board array

## Testing Guidelines

1. **Unit tests** go in `__tests__/` mirroring source structure
2. **E2E tests** go in `e2e/` with `.spec.ts` extension
3. All new features require tests
4. Bug fixes require regression tests
5. Tests use React Testing Library patterns - query by role/text, not implementation details

## Pre-PR Checklist

Before implementing a new feature:
1. Always create a new worktree from main (e.g., `git worktree add ../project-feature feat/feature-name -b feat/feature-name`)

Before creating a PR:
1. Rebase against main branch
2. Run `pnpm test` - all tests must pass
3. Run `pnpm build` - build must succeed
4. Fix any issues and repeat until all pass

## Key Files

- `app/page.tsx` - Main game state and logic (~1300 lines)
- `lib/game-data.ts` - All game constants and type definitions
- `components/game-board.tsx` - Board rendering logic
- `components/property-card.tsx` - Property purchase/management UI

## CI/CD

GitHub Actions runs on all PRs:
- `unit-tests.yml` - Jest tests with coverage
- `e2e-tests.yml` - Playwright tests (Chromium)

Both must pass before merging.
