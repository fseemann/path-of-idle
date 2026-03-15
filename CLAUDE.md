
# Path of Idle

## Stack

Vue 3 · TypeScript · Vite · Pinia

**Dev:** `bun run dev` · **Build:** `bun run build` · **Typecheck:** `bun run typecheck` · **Test:** `bun run test`

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
  - **`simulateCombat`** also calls **`computeRunDurationMs`** internally and includes `speedFactor` and `durationMs` in its return value. Callers never need to call `computeRunDurationMs` directly — a single `simulateCombat` call provides all data needed for both running a map and displaying a preview to the player.

When displaying any stat that feeds into these calculations, retrieve the value from their return types — do not recompute it with inline formulas.

## Code Intelligence

Prefer LSP over Grep/Read for code navigation — it's faster, precise, and avoids reading entire files:
- `workspaceSymbol` to find where something is defined
- `findReferences` to see all usages across the codebase
- `goToDefinition` / `goToImplementation` to jump to source
- `hover` for type info without reading the file

Use Grep only when LSP isn't available or for text/pattern searches (comments, strings, config).

After writing or editing code, check LSP diagnostics and fix errors before proceeding.

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
