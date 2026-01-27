# San Francisco Monopoly

A modern, browser-based Monopoly-style game inspired by San Francisco neighborhoods. The app runs entirely on the client and lets multiple players roll dice, buy properties, build houses/hotels, trade assets, and handle special spaces like Chance, Community Chest, or Alcatraz (jail).

## Features

- Local multiplayer setup with customizable player names and tokens.
- Interactive board with property ownership, mortgaging, and building rules.
- Chance and Community Chest card effects, taxes, and jail mechanics.
- Trade modal for property and cash exchanges between players.
- Game log to track recent events.

## Tech Stack

- **Next.js 16** with the App Router
- **React 19** for UI
- **Tailwind CSS** for styling
- **Jest** and **Playwright** for testing

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm

### Install

```bash
pnpm install
```

### Run the app

```bash
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `pnpm dev` – start the development server
- `pnpm build` – create a production build
- `pnpm start` – run the production server
- `pnpm lint` – run ESLint
- `pnpm test` – run unit tests
- `pnpm test:e2e` – run Playwright end-to-end tests

## Project Structure

```text
app/            # Next.js app router entrypoints
components/     # UI and game components
lib/            # Game logic, rules, and data
public/         # Static assets
styles/         # Global styles
```

## Deployment

This is a standard Next.js application and can be deployed to platforms like Vercel. Set up the project and follow your hosting provider’s Next.js deployment guide.

## License

This project is provided as-is without warranty. Add a license file if you intend to open-source it.
