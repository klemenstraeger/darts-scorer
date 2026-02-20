# Darts Scorer

Nuxt 4 (Vue 3) TypeScript PWA for scoring darts games, managing tournaments,
tracking statistics, and solo training drills. Offline-capable via service worker.

## Commands

| Task | Command |
|------|---------|
| Dev server | `pnpm dev` |
| Build | `pnpm build` |
| Tests (watch) | `pnpm test` |
| Tests (single run) | `pnpm test:run` |
| Tests (coverage) | `pnpm test:coverage` |
| Type check | `npx nuxi typecheck` |
| Generate migration | `pnpm db:generate` |
| Apply migrations | `pnpm db:migrate` |
| Push schema to DB | `pnpm db:push` |

Node 22+. Use **pnpm** (not npm or yarn).

## Verification Gates

All three must pass before a PR is ready:

1. **Tests** — `pnpm test:run` — all tests pass, zero failures
2. **Type check** — `npx nuxi typecheck` — zero TypeScript errors
3. **Build** — `pnpm build` — production build succeeds

When changing `shared/` or `server/utils/` code, also run `pnpm test:coverage` and
verify no coverage regression (these are the two directories with tracked coverage).

## Architecture

```
shared/                  # Isomorphic — NO Vue/Nuxt/browser imports
  game-engine.ts         # X01 game engine (GameEngine class)
  game-models.ts         # Domain types + pure helpers
  game-events.ts         # Event detection (bust, leg won, game over)
  bot-engine.ts          # AI opponent logic
  checkouts.ts           # Checkout path calculator
  visit-score-validation.ts
  training/              # Training mode engines + models
    training-models.ts
    training-engine.ts
    training-strategy.ts
    modes/               # One engine per training drill

app/
  components/            # Vue SFCs organized by feature
    ui/                  # shadcn-vue primitives (Button, Card, etc.)
    stats/               # Statistics visualization
    spectate/            # Live spectator components
    tournament/          # Tournament bracket, calendar, standings
    training/            # Training UI + mode display components
  composables/           # Business logic as Vue composables (useXxx)
  stores/                # Pinia stores (thin reactive state)
  pages/                 # File-based routing
  lib/utils.ts           # cn() tailwind merge helper

server/
  api/                   # Nitro API routes by resource
  db/schema.ts           # Drizzle ORM schema (single file)
  db/migrations/         # Generated SQL migrations
  utils/                 # Server utilities (auth, db, save-game, etc.)

tests/
  shared/                # Unit tests for shared/ modules
  server/                # Unit tests for server/utils/
  e2e/                   # Integration tests (game-flow, tournament, training)
  helpers/               # Reusable factories and dart constants
```

### Key Rules

1. **`shared/` is isomorphic** — Runs in both browser and Node. Never import from
   Vue, Nuxt, `#imports`, `#app`, or browser/server-only APIs. Only import from other
   `shared/` files or universal npm packages.

2. **Use the `#shared` alias** — In `app/` and `server/` code, import via
   `#shared/game-engine`, `#shared/game-models`, etc. (configured in `nuxt.config.ts`).
   In test files, use relative paths (`../../shared/...`).

3. **Composables own business logic; stores hold reactive state** — Pinia stores are
   thin containers (state + simple mutations + computed getters). All orchestration,
   side effects, persistence, and API calls live in composables.

4. **GameEngine is the single source of truth** — All score mutations go through
   `GameEngine.throw()`, `GameEngine.applyVisitScore()`, or `GameEngine.undoThrow()`.
   Never mutate `GameState` fields directly.

5. **shadcn-vue for UI primitives** — Add new components with
   `npx shadcn-vue@latest add <component>`. They install to `app/components/ui/`.
   Use `cn()` from `~/lib/utils` for conditional class merging.

## Conventions

### TypeScript

- Strict mode. Explicit types for function parameters and return values.
- Prefer `interface` for object shapes, `type` for unions and aliases.
- Use discriminated unions for polymorphic state (see `TrainingModeState`).
- Domain types use `snake_case` fields (e.g., `player_index`, `legs_to_win`) matching
  database columns. TypeScript-only types use `camelCase`.

### Vue Components

- `<script setup lang="ts">` with Composition API. No Options API.
- PascalCase file names and template usage.
- Feature components go in `app/components/<feature>/` subdirectories.
- Extract complex page logic to composables instead of 500-line script blocks.

### Composables

- File naming: `useXxx.ts` (e.g., `useGameState.ts`, `useAudio.ts`).
- Module-level state for singleton composables: declare `ref()`/`reactive()` outside
  the exported function so state is shared across all consumers.
- Guard browser-only code with `import.meta.client`.

### Pinia Stores

- Use `defineStore('name', () => { ... })` setup syntax.
- File in `app/stores/`, named by concept (`game.ts`, `training.ts`).
- Keep stores thin: reactive state + simple mutations + computed getters.

### Server API Routes

- Nitro file-based routing: `server/api/<resource>/<action>.<method>.ts`
- Use `requireAuth(event)` from `server/utils/auth.ts` for authenticated routes.
- Use `db` from `server/utils/db.ts` for database access. Server utils are auto-imported.
- Raw SQL via `db.execute(sql`...`)` for complex queries; Drizzle builder for simple CRUD.

### Styling

- Tailwind CSS 4 utility classes. Custom CSS only in `app/assets/css/main.css`.
- Use `cn()` from `~/lib/utils` to merge conditional class names.
- Light-only theme (no dark mode). Neo-brutalist design with warm off-white background.
- Color tokens via CSS variables (shadcn theme system).

### Database

- Single schema file: `server/db/schema.ts`. All tables use `.enableRLS()`.
- Generate migrations with `pnpm db:generate` after schema changes. Never hand-edit
  generated migration SQL unless adding data migrations.

## Testing

### Structure

- `tests/shared/` — unit tests for `shared/` modules
- `tests/server/` — unit tests for `server/utils/`
- `tests/e2e/` — integration tests for full game/tournament/training flows
- `tests/helpers/` — reusable factories and constants

### Naming

- Test files: `<module>.test.ts` matching the source file name.
- For large modules, split into focused files:
  `game-engine.test.ts`, `game-engine-edge.test.ts`, `game-engine-visit.test.ts`

### Patterns

- Use test helpers from `tests/helpers/darts.ts`:
  - Dart constants: `T20`, `T19`, `D16`, `D25`, `S20`, `S25`, `MISS`, etc.
  - Factories: `create501Game()`, `create301Game()`
  - Utilities: `throwDarts(engine, [...])`, `throwMissTurn(engine)`
- Group tests with `describe()` blocks. Use `// -- Section --` comments for logical groups.
- Test real game scenarios (9-darters, bust conditions, leg/set progression).

### When to Write Tests

- **Always**: Changes to `shared/` or `server/utils/` code.
- **Recommended**: New API endpoints.
- **Not required**: Pure UI/styling changes in Vue components.

Coverage is tracked for `shared/**/*.ts` and `server/utils/**/*.ts` only.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>
```

### Types

| Type | Use |
|------|-----|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code restructuring, no behavior change |
| `chore` | Build, tooling, dependency updates |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `perf` | Performance improvement |
| `style` | Formatting/whitespace, no logic change |

### Scopes

`game` · `training` · `tournament` · `stats` · `spectate` · `ui` · `api` · `db` · `auth` · `pwa`

### Examples

```
feat(training): add shanghai training mode with bonus detection
fix(game): prevent bust when score reaches 1 in double-out mode
refactor(stats): extract shared filter parsing to server utility
test(game): add edge-case tests for multi-leg undo scenarios
chore: update dependencies to latest versions
```

Subject line under 72 characters. Use body for "why" context when non-obvious.

## Pull Requests

### Title

Same conventional commit format: `feat(scope): short description` — under 72 characters.

### Body

```markdown
## Summary
- Bullet points describing what changed and why

## Test plan
- [ ] All existing tests pass (`pnpm test:run`)
- [ ] TypeScript compiles (`npx nuxi typecheck`)
- [ ] Build succeeds (`pnpm build`)
- [ ] <feature-specific manual verification>
```

### Guidelines

- One feature or fix per PR. Keep PRs focused.
- If touching `shared/`, include test additions or updates.
- Reference issues when applicable: `Closes #123`.

## Do's and Don'ts

### Do

- Use `GameEngine` for all game state mutations
- Import shared code via `#shared/` alias in app and server code
- Use relative paths (`../../shared/...`) in test files
- Use `requireAuth(event)` in all authenticated API routes
- Add `.enableRLS()` on every new Drizzle table
- Use `cn()` for conditional Tailwind class merging
- Use discriminated unions for polymorphic types
- Keep composables as the orchestration layer between engine, store, and API
- Guard browser-only code with `import.meta.client`
- Use test helpers from `tests/helpers/darts.ts`

### Don't

- Import Vue, Nuxt, or browser APIs in `shared/`
- Mutate `GameState` properties directly (use GameEngine methods)
- Put business logic or API calls in Pinia stores
- Use `npm` or `yarn` (use `pnpm`)
- Hand-edit generated Drizzle migration SQL
- Add UI primitives manually (use `npx shadcn-vue@latest add`)
- Skip the build verification step (SSR issues only surface during build)
- Use Options API or `defineComponent()` (use `<script setup lang="ts">`)
- Commit `.env` files or secrets
- Add large dependencies without justification (bundle size matters for PWA)

## Common Patterns

### Adding a new API endpoint

1. Create `server/api/<resource>/<action>.<method>.ts`
2. Use `defineEventHandler(async (event) => { ... })`
3. Call `requireAuth(event)` if authenticated
4. Access database via `db` (auto-imported)
5. Return plain objects (Nitro serializes automatically)

### Adding a new training mode

1. Add type to `TrainingMode` union in `shared/training/training-models.ts`
2. Add state interface extending `TrainingStateBase`
3. Add to `TrainingModeState` discriminated union
4. Create engine in `shared/training/modes/<mode>.ts`
5. Register in `shared/training/modes/index.ts`
6. Add display component: `app/components/training/modes/<Mode>Display.vue`
7. Add metadata to `TRAINING_MODES` array in `training-models.ts`
8. Add tests in `tests/shared/training/<mode>.test.ts`

### Adding a shadcn-vue component

```bash
npx shadcn-vue@latest add <component-name>
```

### Database schema change

1. Edit `server/db/schema.ts` (add `.enableRLS()` on new tables)
2. `pnpm db:generate` — create migration
3. `pnpm db:push` (dev) or `pnpm db:migrate` (production)
