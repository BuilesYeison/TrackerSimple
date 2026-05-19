# AGENTS.md — PersonalFinAppV2

## Stack

- **Framework:** SvelteKit (scaffolded via `npx sv create`)
- **UI:** Tailwind CSS + Skeleton UI v4
- **DB:** Dexie.js (IndexedDB, local-first)
- **Testing:** Vitest (unit)
- **Linting/Formatting:** Biome
- **Adapter:** `@sveltejs/adapter-static` (PWA, fallback: index.html)

## Architecture (Clean)

```
src/lib/
├── domain/           # Pure entities, repository interfaces
│   ├── entities/     #   Account, Record, Category (plain TS)
│   └── repositories/ #   IAccountRepository, IRecordRepository
├── application/      # Use cases (depend on interfaces, not infra)
│   └── services/     #   CreateAccount, RegisterTransaction, etc.
├── infrastructure/   # Concrete implementations
│   ├── db/           #   Dexie schema, migrations
│   └── repositories/ #   DexieAccountRepository, etc.
├── presentation/     # Adapters between UI and application
│   ├── stores/       #   Svelte stores (runes)
│   └── components/   #   Reusable Svelte components
└── utils/            # Helpers (formatting, dates, etc.)
```

## Commands

```sh
npm run dev            # dev server
npm run dev -- --host  # expose on network (mobile testing via chrome://inspect)
npm run build          # production build → ./build/
npx vitest run         # tests (single run)
npx biome check .      # lint
npx biome check --apply .  # auto-fix
npx biome format .     # format check
```

## Svelte 5 runes mode

`$state()`, `$derived()`, `$effect()` — enabled project-wide via `compilerOptions.runes` in svelte.config.js. No legacy `export let` or `$:` reactive statements.

## Skeleton UI v4 setup

- Skeleton CSS is imported in `src/routes/layout.css` via `@import '@skeletonlabs/skeleton'`.
- Active theme set via `data-theme="cerberus"` on `<html>` in `src/app.html`.
- Tailwind v4 — no `tailwind.config.js` or `postcss.config.js`. Config via CSS `@theme` directives.

## Key principles

- **Local-first:** all data stays in IndexedDB, no backend.
- **Offline-first:** zero connectivity required.
- **Privacy:** no accounts, no auth, no bank connections.
- **Simplicity:** fast transaction recording (< few secs).
- **Portability:** JSON export/import, monthly segments.
- **No cloud sync, multi-user, AI, OCR, budgets, or investments in MVP.**

## Entry points

- `src/routes/+layout.svelte` — root layout (Skeleton theme applied)
- `src/routes/+page.svelte` — landing page
- `src/lib/infrastructure/db/` — Dexie schema & migrations
- `src/lib/application/services/` — business logic / use cases
