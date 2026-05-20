# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm install` — install dependencies.
- `npm run dev` — run Vite frontend and Express backend together.
- `npm run dev:client` — run only the Vite frontend.
- `npm run dev:server` — run only the Express backend with watch mode.
- `npm test` — run all Vitest tests.
- `npm test -- server/api.test.js` — run a single test file.
- `npm run build` — build the frontend.
- `npm start` — start the Express backend.

## Architecture

This repository contains a Vue 3 single-page frontend and an Express.js backend. The frontend lives in `src/` and calls backend endpoints under `/api`; Vite proxies `/api` to `http://localhost:3001` during development.

The backend lives in `server/`. `server/index.js` defines the Express app and REST routes. `server/storage.js` owns all reads and writes to `data/data.json`; frontend code should not read or write the JSON file directly.

Weights are stored and displayed in grams because DouX is a young duck. Keep the UI responsive: mobile uses a single-column touch-friendly layout, while desktop uses a wider dashboard layout.

Set `DUCKX_ADMIN_PASSWORD` in the server environment to require the `X-Admin-Password` header for create, update, and delete routes. Do not commit real admin passwords.
