# Media Manager

A local-first media manager for scanning, deduplicating, browsing, and organizing photo libraries.

## Features

- SHA-256 exact duplicate detection with accumulated paths.
- Perceptual near-duplicate review using dHash and pHash.
- Justified, lazily loaded photo library with capture-time pagination.
- Favorites, tags, categories, and multi-photo albums.
- MapLibre map view for EXIF GPS locations.
- Persistent asynchronous scan jobs with stop and retry controls.
- Optional AI titles and descriptions through DeepSeek.
- Embedded PGlite storage with Prisma.
- React, Redux Toolkit, React Router, React Compiler, Vite, and MUI.

## Requirements

- Node.js 26 or newer
- pnpm 12

## Setup

```bash
pnpm install
cp .env.example .env
pnpm server
```

In another terminal:

```bash
pnpm webui
```

Open `http://127.0.0.1:5173`.

The REST server listens on `http://127.0.0.1:4318` by default. Local application data is stored in
`data/` and is intentionally excluded from Git.

## Commands

```bash
pnpm dev
pnpm server
pnpm client status
pnpm client scan ./photos --skip-ai
pnpm webui
pnpm webui:build
pnpm typecheck
pnpm exec prisma generate
pnpm db:migrate <name>
```

See [AGENTS.md](AGENTS.md) for the full architecture, API, conventions, and verification checklist.
