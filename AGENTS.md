# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds Next.js App Router entrypoints; `app/page.tsx` contains the core game logic.
- `components/` contains UI and game components; `components/ui/` is the shadcn/ui base layer.
- `lib/` stores game data, types, and shared utilities (`lib/game-data.ts`, `lib/utils.ts`).
- `__tests__/` contains Jest unit tests; `e2e/` contains Playwright specs.
- `public/` and `styles/` are for static assets and global styling.

## Build, Test, and Development Commands
- `pnpm install` installs dependencies (pnpm v9 recommended).
- `pnpm dev` starts the dev server at `http://localhost:3000`.
- `pnpm build` produces a production build; `pnpm start` serves it.
- `pnpm lint` runs ESLint across the repo.
- `pnpm test`, `pnpm test:watch`, `pnpm test:coverage` run Jest in standard, watch, and coverage modes.
- `pnpm test:e2e` and `pnpm test:e2e:ui` run Playwright in headless and UI mode.

## Coding Style & Naming Conventions
- TypeScript 5 in strict mode; prefer typed props and explicit interfaces.
- Use App Router conventions and `@/` imports for root-based paths.
- Follow existing formatting (2-space indentation in TS/TSX files); run `pnpm lint` before PRs.
- Tailwind CSS v4 is the primary styling system; prefer utility classes over bespoke CSS.

## Testing Guidelines
- Unit tests live in `__tests__/` and mirror source structure.
- E2E tests live in `e2e/` and use `.spec.ts`.
- Jest collects coverage from `lib/` and `components/`.
- For UI tests, prefer React Testing Library queries by role/text.

## Commit & Pull Request Guidelines
- Always create a new worktree from main before implementing a new feature (e.g., `git worktree add ../project-feature feat/feature-name -b feat/feature-name`).
- Recent commits are short, imperative, sentence-case (e.g., "Fix flaky mortgage e2e test").
- Keep commits focused; avoid mixing refactors with behavior changes.
- PRs should include a clear description, test results (`pnpm test`, `pnpm build`), and screenshots for UI changes.
- CI runs Jest and Playwright on PRs; both must pass before merging.

## Configuration Notes
- Playwright expects a local server at `http://localhost:3000`; it will reuse an existing dev server outside CI.
- Key configuration files: `jest.config.ts`, `playwright.config.ts`, `tsconfig.json`, `next.config.mjs`.

## Custom Skills

### /verify - CI Verification
Runs the full verification suite and reports results. Invoke with `/verify` to execute:
1. Production build (`pnpm build`)
2. Unit tests (`pnpm test`)
3. E2E tests (`pnpm test:e2e`)

Returns a summary table with pass/fail status for each check.

## Subagent Patterns

### Running Verification as a Background Task
Use the Task tool with the Bash subagent to run verification in the background:

```
Task(subagent_type="Bash", prompt="Run pnpm build && pnpm test && pnpm test:e2e and report results", run_in_background=true)
```

### Parallel Test Execution
For faster feedback, run unit and e2e tests in parallel after a successful build:

```
1. Run: pnpm build
2. If build passes, launch in parallel:
   - Task(subagent_type="Bash", prompt="Run pnpm test")
   - Task(subagent_type="Bash", prompt="Run pnpm test:e2e")
```
