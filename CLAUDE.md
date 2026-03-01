
# Path of Idle

## Stack

Vue 3 · TypeScript · Vite · Pinia

**Dev:** `bun run dev` · **Build:** `bun run build` · **Typecheck:** `bun run typecheck`

## Architecture

```
src/engine/   — pure TS, no Vue imports (stat calculation, combat, loot, XP)
src/stores/   — Pinia bridge between engine and UI (characters, inventory, mapRuns)
src/components/ — Vue UI only, reads from stores and engine
src/types/    — all shared interfaces, re-exported from index.ts
src/data/     — static game data (maps, items, skill definitions)
```

## Central game mechanics — single source of truth

Three functions implement the core game mechanics. **Never reimplement or duplicate their logic elsewhere.** Any UI that needs to show stats or calculations to the player must call these functions directly.

- **`simulateCombat`** (`src/engine/combatSimulator.ts`) — the authoritative combat simulation. Returns all combat results including survival ratio, damage figures, clear speed, and every buffed stat value needed for display (health, defense, resistances, EHP). All passive aura buffs are applied inside this function.

- **`computeAverageSurvivability`** (`src/engine/combatSimulator.ts`) — the authoritative survivability calculation. Returns `SurvivabilityResult` with EHP and all buffed defensive stats. Called by `simulateCombat`; also usable standalone when map context is not available (e.g. character sheet, item comparison).

- **`computeRunDurationMs`** (`src/stores/mapRuns.ts`) — the authoritative map run duration calculation. Combines movement speed and clear speed multiplier into a final duration. Used by both `startRun` (to set the actual run timer) and the dispatch UI (to preview duration).

When displaying any stat that feeds into these calculations, retrieve the value from their return types — do not recompute it with inline formulas.

---

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";

// import .css files directly and it works
import './index.css';

import { createRoot } from "react-dom/client";

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.md`.
