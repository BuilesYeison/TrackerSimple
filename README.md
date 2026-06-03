# trackersimple

App mobile-first de finanzas personales. Local-first, offline-first, sin servidor, sin cuentas.

---

## Stack

| Capa      | Tecnología                             |
| --------- | -------------------------------------- |
| Framework | SvelteKit (`@sveltejs/adapter-static`) |
| Runtime   | Capacitor (Android + iOS)              |
| Storage   | `@capacitor-community/sqlite` (SQLite) |
| UI        | Tailwind CSS v4 + shadcn-svelte        |
| Íconos    | `@lucide/svelte`                       |
| Lint      | Biome                                  |
| Test      | Vitest                                 |

---

## Filosofía

- **Local-first** — todos los datos se guardan en el dispositivo vía SQLite
- **Offline-first** — cero conectividad requerida
- **Privacidad total** — sin cuentas, sin backend, sin tracking
- **Portabilidad** — exportación JSON abierta
- **AI-friendly** — formato legible, estructura estable, fácil de consumir por agentes externos

---

## Features (MVP)

| Feature                                                           | Estado |
| ----------------------------------------------------------------- | ------ |
| Onboarding (moneda + primera cuenta)                              | ✅      |
| CRUD de cuentas (efectivo, débito, crédito)                       | ✅      |
| Registro rápido (gastos, ingresos, transferencias)                | ✅      |
| Dashboard con balance, resumen mensual, top categorías            | ✅      |
| Listado de registros agrupados por día, filtros por tipo y mes    | ✅      |
| Analytics: flujo de caja, balance acumulado, gastos por categoría | ✅      |
| Exportación JSON                                              | ✅      |
| Importación con validación y confirmación                         | ✅      |
| Dark mode monocromático (#0a0a0a) con acentos verde/rojo/morado   | ✅      |
| Aviso de backup (>7 días sin exportar)                            | ✅      |

---

## Getting started

```sh
npm install
npm run build:sync
npm run android       # o: npm run ios
```

Para desarrollo de UI (sin SQLite):
```sh
npm run dev -- --host
```

Debuggear en dispositivo Android: conectar vía USB, abrir `chrome://inspect`.

---

## Arquitectura (Clean Architecture)

```
domain/entities/        ← Account, Record, Category, AppSettings (puro TS)
domain/repositories/    ← interfaces (IAccountRepository, etc.)
application/services/   ← AccountService, RecordService, ExportService, etc.
infrastructure/db/      ← SQLite connection manager + schema + migrations
infrastructure/repos/   ← implementaciones concretas (SqliteAccountRepository, etc.)
presentation/stores/    ← workspace.ts (composition root)
presentation/components/← Svelte components reusables
```

**Regla**: UI nunca importa de `infrastructure/`. Todo pasa por servicios en `application/`.

---

## Diseño

Sistema monocromático oscuro con tokens Tailwind v4 definidos en `src/app.css`:

| Token                             | Color                 | Uso                |
| --------------------------------- | --------------------- | ------------------ |
| `background`                      | `#0a0a0a`             | Fondo principal    |
| `surface`                         | `#111`                | Cards, elevación 1 |
| `surface-raised`                  | `#141414`             | Hover, elevación 2 |
| `foreground`                      | `#fafafa`             | Texto principal    |
| `muted`                           | `#777`                | Texto secundario   |
| `income` / `expense` / `transfer` | verde / rojo / morado | Acentos            |

Solo dark mode. Sin toggle claro/oscuro.

---

## Backup

**Exportar:** `ExportService.createBackup()` genera un JSON. Se comparte vía el diálogo nativo del sistema (Drive, Dropbox, WhatsApp).

**Importar:** `ImportService.importFromFile()` siempre muestra confirmación `AlertDialog`.

**Formato:**
```json
{
  "version": "1.0",
  "exportedAt": "2026-05-24T...",
  "accounts": [...],
  "categories": [...],
  "settings": {...},
  "records": { "2026-01": [...], "2026-05": [...] }
}
```

---

## Reports

- `reports/audit-mvp.md` — auditoría completa de seguridad, datos y confiabilidad (42 findings)
- `reports/audit-progress.md` — tracking de resolución (36/42 done)

---

## Fuera del MVP

Sincronización cloud, multiusuario, auth, conexión bancaria, OCR, presupuestos, inversiones, notificaciones.
