# AGENTS.md - Media Manager Project Guide

> This file is the single source of truth for repository conventions. Read it before changing code.
> If a change must intentionally deviate from this guide, explain the reason in the PR description.

---

## 1. Project Overview

Media Manager is a local-first media management application with:

1. SHA-256 exact deduplication.
2. Perceptual near-duplicate detection using dHash and pHash.
3. Optional AI-generated titles and descriptions using `deepseek-flash`.
4. Prisma metadata management backed by embedded PGlite.
5. Optional EXIF extraction.
6. A Docker-inspired client/server architecture.
7. A responsive Google Photos-inspired web UI built with React, Vite, and MUI.

The CLI client communicates with a local REST API server over HTTP. The server owns the database,
filesystem scanning, AI calls, EXIF extraction, and deduplication. The client must not access the
database directly.

Docker is not required. "Docker-inspired" means a thin client and a local daemon-like server connected
through a documented API.

---

## 2. Hard Constraints

| Area | Requirement |
| :--- | :--- |
| Runtime | Node.js 26 or newer |
| Package manager | pnpm |
| TypeScript execution | `tsx`; `tsc` is type-check only |
| Module system | ESM with `"type": "module"` |
| ORM | Prisma with a Driver Adapter |
| Database | Embedded PGlite |
| Client framework | Commander.js |
| Server transport | Node.js built-in HTTP and REST/JSON |
| Web UI | React Compiler, Vite, Redux Toolkit, React Router, MUI default themes; no CSS files |
| Perceptual hashing | `duplicate-image-detector` |
| AI description model | `deepseek-flash` through an OpenAI-compatible API |
| EXIF | Optional `exifr` module |

Required prohibitions:

- Do not introduce an external database server, Docker requirement, or additional infrastructure.
- Do not run TypeScript with `ts-node`.
- Do not implement face recognition in the current phase.
- Do not import server database modules into the client.
- Do not persist application data or Redux state in browser storage. Server data comes from the local API.
- Do not add CSS files or custom stylesheets to the web UI. Use MUI components, themes, and system props.
- Importing the vendor MapLibre stylesheet for map controls and popups is allowed; do not add custom CSS.
- Every hand-written TypeScript or TSX file must contain fewer than 150 lines.
- Do not use Chinese text for logs, comments, CLI help, API errors, prompts, or repository documentation.
- Do not hardcode API keys or absolute machine-specific paths.

AI descriptions require network access and are optional. If the API key is missing or the request
fails, store `null` and continue processing.

---

## 3. Directory Structure

The structure is intentionally split into client, server, shared contracts, and generated code.

```
media-manager/
├── AGENTS.md
├── .env.example
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json
├── prisma.config.ts
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── client/
│   │   ├── index.ts
│   │   ├── cli.ts
│   │   ├── api-client.ts
│   │   ├── types.ts
│   │   └── commands/
│   │       ├── status.ts
│   │       ├── scan.ts
│   │       └── dedupe.ts
│   ├── server/
│   │   ├── index.ts
│   │   ├── api.ts
│   │   ├── jobs.ts
│   │   ├── media-rename.ts
│   │   ├── scanner.ts
│   │   ├── types.ts
│   │   ├── ai/
│   │   │   └── describe.ts
│   │   ├── db/
│   │   │   ├── migrate.ts
│   │   │   ├── prisma.ts
│   │   │   └── media-repo.ts
│   │   ├── dedupe/
│   │   │   └── hasher.ts
│   │   ├── exif/
│   │   │   └── extract.ts
│   │   └── pipeline/
│   │       └── process-image.ts
│   ├── shared/
│   │   └── api-types.ts
│   └── generated/prisma/
├── media-manager-webui/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── app/
│       ├── components/
│       ├── features/
│       ├── hooks/
│       ├── layout/
│       ├── pages/
│       ├── App.tsx
│       ├── api.ts
│       ├── main.tsx
│       ├── routes.tsx
│       └── theme.ts
└── data/
```

Rules:

- `src/client/index.ts` only loads environment configuration and starts the client program.
- `src/client/cli.ts` only creates the Commander program and registers client commands.
- Client commands communicate only through `src/client/api-client.ts`.
- `src/server/index.ts` only starts and stops the REST server.
- `src/server/api.ts` owns routing, validation, authentication, and HTTP serialization.
- The web UI communicates only through the REST API and must not import server modules.
- React Router owns page navigation; route pages fetch fresh data into Redux on entry.
- Redux Toolkit is the only global web state store. Do not add browser persistence middleware.
- React Compiler must be enabled through `reactCompilerPreset()` in the Vite Babel pipeline.
- The web UI uses MUI's default light/dark color schemes and must remain CSS-file free.
- Photo grids use a Justified layout: aspect ratios fill each row, rows have uniform height, and the
  last row may leave trailing space.
- Justified ordering uses seeded bounded simulated annealing; layout decoding remains deterministic.
- Photo images fade in after loading with MUI transitions.
- Library scrolling is progressive: render additional items near the bottom and fetch image blobs only when tiles approach the viewport.
- Media API pages contain up to 500 items. The frontend renders loaded pages in 80-item lazy chunks and requests the next cursor near the end.
- Capture-time cursors must remain stable across pages and must not overlap.
- The web UI retains and displays only the newest 500 scan activity lines.
- The app shell uses a fixed viewport height. The header and navigation remain fixed while route content scrolls.
- The left navigation must use default MUI `Paper`, `List`, and `ListItemButton` styling without custom `sx`.
- Theme mode supports System, Light, and Dark; System follows the OS preference.
- Settings use nested routes and a second navigation rail for Server connection and Scan defaults.
- Settings rows place the label/description and its control on the same horizontal row, with the section action aligned to the section title.
- Scan jobs are addressable at `/scan/:jobId`; that route restores and polls the job after a page refresh.
- The Scan page fetches `GET /api/scans` and lists all jobs currently retained by the server.
- Scan jobs are persisted in PGlite and support Stop and Retry actions from the web UI.
- `/map` uses MapLibre GL JS and the OpenFreeMap Liberty style to cluster EXIF GPS locations.
- The map page automatically loads additional 500-item media cursor pages until complete.
- `src/server/db/prisma.ts` is the only module allowed to create a `PrismaClient`.
- Database operations must be exposed through `src/server/db/media-repo.ts`.
- Requests and responses shared across client/server must be defined in `src/shared/api-types.ts`.
- Prisma generated files are not edited manually.

---

## 4. Client/Server Architecture

### 4.1 REST API

The default server address is `127.0.0.1:4318`. The client reads `MEDIA_MANAGER_API_URL`.

Required endpoints:

- `GET /api/health`: unauthenticated health check.
- `POST /api/scans`: create an asynchronous scan job and return HTTP 202.
- `GET /api/scans`: list current in-memory scan job summaries.
- `POST /api/scans/:id/stop`: stop a queued or running scan.
- `POST /api/scans/:id/retry`: create a new queued job from a finished job's request.
- `GET /api/scans/:id`: return job status, events, errors, and final summary.
- `GET /api/duplicates?threshold=0.9`: return near-duplicate candidate pairs.
- `POST /api/duplicates/decisions`: keep both or remove one selected path.
- `GET /api/media?limit=500&cursor=...`: capture-time pagination ordered by `capturedAt DESC, fileHash DESC`.
- `GET /api/media?favorite=true`: list favorite media.
- `GET /api/media?albumId=:albumId`: list media in an album.
- `GET /api/media/:fileHash`: return one media record.
- `GET /api/media/:fileHash/content`: stream the original image for preview.
- `PATCH /api/media/:fileHash`: rename the local file and update favorite, category, or tags.
- `GET /api/albums`: list albums with cover and item counts.
- `POST /api/albums`: create an album.
- `GET /api/albums/:id`: return one album.
- `DELETE /api/albums/:id`: delete an album without deleting its photos.
- `POST /api/albums/:id/media/:fileHash`: add a photo to an album.
- `DELETE /api/albums/:id/media/:fileHash`: remove a photo from an album.
- `GET /api/settings`: return server-persisted scan defaults.
- `PUT /api/settings`: persist scan defaults.

All non-health endpoints must require a Bearer token when `MEDIA_MANAGER_API_TOKEN` is configured.
Errors must use the JSON API error shape declared in `src/shared/api-types.ts`.

Long scans must use the job API. Do not hold a scan behind a single long-running HTTP request.
The active queue is intentionally sequential, while job records and final events persist in PGlite.
Jobs left queued or running during a server restart are marked failed and can be retried.
Files within one scan may use bounded concurrency. The default is 4 and the maximum is 20.
Concurrency must be configurable from both the CLI and the web UI.
The server must allow configured localhost web origins for browser access.

### 4.2 Server Responsibilities

The server owns:

- Filesystem traversal and image format validation.
- SHA-256 and perceptual hash computation.
- Tag, category, favorite, and album persistence.
- PGlite reads and writes.
- AI description requests and fallback behavior.
- Safe local file rename operations with rollback on database failure.
- EXIF extraction and fallback behavior.
- Scan job lifecycle and API response serialization.

The client owns:

- Command-line parsing and validation.
- Calling the REST API.
- Polling scan jobs.
- Rendering progress and final results.

The client must never import `src/server/**`.

The web UI owns:

- Google Photos-inspired library browsing and image previews.
- Favorites and album browsing.
- Duplicate pair review.
- Scan job creation and progress display.
- A dedicated Settings page with defaults persisted by the local server.
- Server-persisted scan defaults and in-memory-only API connection details.
- Light/dark theme selection.

---

## 5. Deduplication Rules

- `fileHash` is the SHA-256 primary key and the first deduplication gate.
- Media pagination and month grouping use `capturedAt`, populated from EXIF and falling back to scan time.
- Every exact-duplicate path is stored in `MediaPath` and returned with the media item; do not discard paths.
- Exact duplicate lookup must happen before perceptual hash computation.
- Perceptual hashes are stored in nullable `dhash64` and `phash64` PGlite columns.
- Perceptual hashes are never primary or unique keys.
- PGlite does not provide a native Hamming-distance index. Load hashes and compare them in application code.
- Near-duplicate matches are review candidates only. Never delete files automatically.
- Near-duplicate review is capped at 49 unresolved pairs per response; users resolve the batch and re-evaluate for the next set.
- Duplicate search must stop after a bounded candidate window instead of evaluating the entire collection before responding.
- A resolved near-duplicate pair must be stored as `keep-both` or `removed` and excluded from future results.
- Removing one near-duplicate requires explicit confirmation and deletes only the selected `MediaPath`.
- The create path must handle a `P2002` race by treating the existing row as an exact duplicate.
- File renames must stay within the original directory, preserve the extension, reject path traversal,
  reject existing targets, and update the database only after the filesystem rename succeeds.

---

## 6. PGlite and Prisma

- Prisma 7 Driver Adapters are built in; do not enable the obsolete `driverAdapters` preview flag.
- `prisma-pglite` creates a new PGlite database and applies the schema on first access.
- `DATABASE_DIR` controls the PGlite directory. The default is the project-level `data/`.
- `PrismaClient` and the PGlite adapter must be lazy singletons.
- Prisma and the PGlite adapter must be explicitly version-pinned.
- Close both Prisma and the underlying PGlite instance during server shutdown.
- Run `prisma generate` after every schema change.
- Use `pnpm db:migrate <name>` to create a migration for schema changes.
- Generated migrations do not automatically update an existing development PGlite database.

---

## 7. AI and EXIF Behavior

AI rules:

- Use the OpenAI-compatible SDK with `https://api.deepseek.com`.
- The default model is `deepseek-flash`.
- The default description prompt is Chinese and requests a concise description around 30 characters.
- The web UI and CLI may override the description prompt for each scan; `DESCRIPTION_PROMPT` provides the server fallback.
- AI must return both a concise title and a description. Malformed output may fall back to a raw description.
- Read the API key, base URL, and model from environment variables.
- Send images as base64 data URLs with the actual MIME type.
- Use a timeout and at most one retry.
- Empty descriptions are stored as `null`.
- Empty titles are stored as `null`.
- Missing configuration, oversized images, and request failures must degrade to `null`.

EXIF rules:

- No EXIF data returns `null`.
- Parse failures log a warning and return `null`.
- EXIF failures must not stop the media pipeline.
- Real file I/O errors must propagate.
- The database `exif` field is nullable.

---

## 8. Language and Style

- All comments, logs, errors, CLI descriptions, API messages, prompts, and documentation must be English.
- Use ESM import paths with `.js` extensions.
- Keep TypeScript strict. Avoid `any`; if unavoidable, document the reason.
- Use `await` for asynchronous I/O. Do not use bare `.then()` chains.
- File names use kebab-case.
- Keep every hand-written TypeScript/TSX file under 150 lines by extracting modules.
- Functions and variables use camelCase.
- Types and interfaces use PascalCase.
- Constants use SCREAMING_SNAKE_CASE.
- Use `console.log`, `console.warn`, and `console.error`; do not add a logging framework yet.
- Client and server command handlers must catch errors and set `process.exitCode = 1` on failure.

---

## 9. Commands

```bash
# Install
pnpm install

# Start the REST server in watch mode
pnpm dev

# Start the REST server once
pnpm server

# Run the client
pnpm client status
pnpm client scan ./photos --skip-ai
pnpm client dedupe --threshold 0.9

# Run the web UI on http://127.0.0.1:5173
pnpm webui

# Build the web UI
pnpm webui:build

# Address a non-default server
pnpm client --api-url http://127.0.0.1:4319 status

# Prisma
pnpm exec prisma generate
pnpm db:migrate <migration-name>

# Type checking
pnpm exec tsc --noEmit
```

---

## 10. Required Verification

Before completing a change, verify:

- The client can reach `GET /api/health`.
- `POST /api/scans` returns a job and the client polls it to completion.
- A repeated scan reports exact duplicates without recomputing perceptual hashes.
- Near-duplicate candidates are reported and no files are deleted.
- Missing DeepSeek configuration still allows media to be stored with a null description.
- Missing DeepSeek configuration still allows media to be stored with a null title.
- Missing EXIF still allows media to be stored with null metadata.
- The REST API enforces the configured Bearer token.
- AI title generation and local file rename are verified.
- Exact duplicate paths accumulate under one media item.
- Keep-both decisions suppress future duplicate reports.
- Removing one near-duplicate deletes only the selected file and remains suppressed.
- The web UI renders the library, opens image details, shows duplicates, and starts scan jobs through REST.
- The web UI can update tags, category, favorites, and album membership through REST.
- `/scan/:jobId` restores a running or completed job after refresh and preserves the Scan navigation state.
- Scan job history survives server restarts, and Stop/Retry are verified in the web UI.
- MapLibre loads its worker through Vite's `?url` import and displays clustered photo locations.
- React Router navigation works for `/photos`, `/favorites`, `/albums`, `/duplicates`, `/map`, `/scan`, and `/settings`.
- Redux state is fetched from the server and application data is absent from browser storage.
- Tags, categories, favorites, and album membership survive page reloads and server restarts.
- Server settings survive a server restart.
- The web UI has no CSS files and uses MUI's light/dark color schemes.
- Desktop and mobile layouts are checked for clipping and horizontal overflow.
- `pnpm exec tsc --noEmit` passes.
- Prisma schema validation and generation pass.
- No client code imports the server database or core processing modules.
- No hand-written TypeScript/TSX file is 150 lines or longer.
- All committed logs, comments, errors, prompts, and documentation are English.
