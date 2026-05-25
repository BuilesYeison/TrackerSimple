# AGENTS.md — TrackerSimple

## Stack

- **Framework:** SvelteKit (`@sveltejs/adapter-static`, SPA fallback: `index.html`)
- **Runtime:** Capacitor (Android + iOS native)
- **Storage:** `@capacitor-community/sqlite` (SQLite), NOT IndexedDB/Dexie
- **UI:** Tailwind CSS v4 + shadcn-svelte (AlertDialog, Calendar, Popover, Sonner)
- **Icons:** `@lucide/svelte` ONLY — zero emojis, ASCII arrows OK (→, —, ×, ÷)
- **Lint/Format:** Biome (tabs, single quotes)
- **Testing:** Vitest (unit only)
- **Backup:** JSON plain-text (no ZIP), SHA-256 checksum via `crypto.subtle.digest`

## Commands

```sh
npm run dev              # dev server (UI only — no SQLite, use for component dev)
npm run dev -- --host    # expose on network (chrome://inspect mobile testing)
npm run build            # production build → ./build/
npm run build:sync       # build + npx cap sync (for native deployment)
npm run android          # build:sync + open Android Studio
npm run ios              # build:sync + open Xcode
npx biome check --apply . # lint + auto-fix
npx cap run android     # Ejecutar en android
```

**IMPORTANT:** This is NOT a PWA. `npm run dev` works for UI iteration but **SQLite requires Capacitor native**. To test full functionality, use `npm run build:sync && npm run android` and debug via `chrome://inspect`.

## Design system (Tailwind v4 `@theme`)

All colors are defined as design tokens in `src/app.css` via `@theme {}`. Never use raw hex (`bg-[#141414]`). Always use semantic tokens:

| Token                       | Usage                                          | Color               |
| --------------------------- | ---------------------------------------------- | ------------------- |
| `background`                | `bg-background`                                | `#0a0a0a`           |
| `surface`                   | `bg-surface`                                   | `#111`              |
| `surface-raised`            | `bg-surface-raised`, `hover:bg-surface-raised` | `#141414`           |
| `border`                    | `border-border`, `divide-border`               | `#141414`           |
| `foreground`                | `text-foreground`                              | `#fafafa`           |
| `muted`                     | `text-muted`                                   | `#777777`           |
| `income`                    | `text-income`, `bg-income`                     | `#4ade80`           |
| `expense`                   | `text-expense`, `bg-expense`                   | `#f87171`           |
| `transfer`                  | `text-transfer`, `bg-transfer`                 | `#a78bfa`           |
| `cash` / `debit` / `credit` | `bg-cash`, `bg-debit`, `bg-credit`             | grey / blue / amber |

**Dark mode only** — no light mode toggle. `class="dark"` on `<html>`.

## Architecture (Clean Architecture)

```
src/lib/
├── domain/              # Pure entities + repository interfaces (NO deps on infra)
│   ├── entities/        #   Account, Record, Category, AppSettings
│   └── repositories/    #   IAccountRepository, IRecordRepository, etc.
├── application/         # Use cases / services (depend on interfaces only)
│   └── services/        #   AccountService, RecordService, ExportService, etc.
├── infrastructure/      # Concrete implementations
│   ├── db/              #   sqlite.ts (connection manager), sqlite-helpers.ts
│   └── repositories/    #   SqliteAccountRepository, SqliteRecordRepository, etc.
├── presentation/
│   ├── stores/          #   workspace.ts (composition root)
│   └── components/      #   Svelte components
├── utils/               #   helpers (balance, analytics-calc, import-backup, etc.)
└── components/ui/       #   shadcn-svelte components (calendar, button, etc.)
```

**Rules:**
- Domain knows nothing about infrastructure
- Services depend on repository interfaces, not implementations
- UI (routes) imports services from `workspace.ts`, NEVER from `infrastructure/`
- Settings page was audited and fixed: uses `ExportService`/`ImportService`, not raw `getDB()`
- `workspace.ts` is the composition root exporting all singleton services

## SQLite — critical facts

- `initDatabase()` creates/retrieves connection and runs schema migrations via `PRAGMA user_version`
- `getDB()` returns the singleton `SQLiteDBConnection` — only call in infrastructure layer
- **`executeSet(statements[])`** for batch writes (atomic, no manual transactions). DO NOT use `beginTransaction()`/`commitTransaction()` — it causes "Already in transaction" errors on Android.
- Schema: 4 tables (`accounts`, `categories`, `records`, `settings`). `TARGET_VERSION = 2`.
- Dates stored as ISO strings in TEXT columns. `mapRow()` converts to `Date` on read.
- `SqliteRow` type (not `any`) for raw row parameters.
- Shared helpers in `sqlite-helpers.ts`: `toISO()`, `SqliteRow`.

## Backup system

- **Export:** `ExportService.createBackup()` → returns JSON string with SHA-256 checksum
- **Import:** `ImportService.importFromFile(file)` → validates checksum, then `executeSet()`
- Backup format: flat JSON object with `version`, `exportedAt`, `accounts`, `categories`, `settings`, `records` (monthly segments), `checksum`
- **Import confirmation:** Always show `AlertDialog` before calling `importService.importFromFile()` (implemented in both settings and onboarding)
- Import is wrapped in `executeSet()` which is atomic — no manual transaction management

## Svelte 5 runes ONLY

`$state()`, `$derived()`, `$derived.by()`, `$props()`, `$effect()`. Never `export let`, `$:`, or legacy store syntax.

## Gotchas

- **`checkingOnboarding` in `+layout.svelte`:** Set `$state(true)` initially. ONLY set to `false` AFTER the redirect check passes. Setting it before `goto("/onboarding")` causes the layout to render before navigation completes.
- **No emojis:** Every icon is from `@lucide/svelte`. Only ASCII special chars allowed (→, —, ×, ÷, −). Emojis were audited and removed.
- **`typeof crypto`:** Use `typeof crypto === 'object' && typeof crypto.randomUUID === 'function'` — NOT `typeof crypto !== undefined` (bug fixed in audit).
- **`SqliteAppSettingsRepository.save()`:** Uses `INSERT OR REPLACE` — not read-modify-write (race condition fixed in audit).
- **Account delete:** Has `AlertDialog` confirmation (audit fix). Same for RecordItem delete.
- **Dir.** `@capacitor-community/sqlite` definitions are at `dist/esm/definitions` for types like `SQLiteDBConnection`, `capSQLiteSet`.

## Reports

- `reports/audit-mvp.md` — full security/data/reliability audit (42 findings, 6 CRITICAL)
- `reports/audit-progress.md` — tracking checklist (36/42 resolved, ~94/100 release readiness)
