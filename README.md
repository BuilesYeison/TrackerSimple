# trackersimple

App de finanzas personales simple, privada y local-first. Tus datos son tuyos — sin cuentas, sin servidores, sin rastreadores.

Exporta tu historial financiero en JSON abierto y pásaselo a cualquier IA para que lo analice por vos.

---

## Por qué trackersimple

- **Local-first** — todos los datos viven en SQLite, dentro de tu dispositivo
- **Offline-first** — cero conectividad requerida, funciona en el metro, en un avión, donde sea
- **Privacidad total** — sin registro, sin backend, sin analytics, sin permisos de red
- **Dueño de tus datos** — exportación JSON abierta, legible, sin checksums ni formatos propietarios
- **AI-friendly** — el backup es un JSON plano que cualquier LLM puede leer y analizar
- **Sync automático local** — configurá una carpeta vía SAF (Android) y cada cambio se sincroniza automáticamente; con una app como Dropsync se sube a la nube sin intervención manual

---

## Plataformas

| Plataforma | Estado |
| ---------- | ------ |
| Android    | Funcional |
| iOS        | Planificado — el stack es multiplataforma, falta desarrollar el plugin SAF para iOS |

---

## Features

| Feature                                                        | Estado |
| -------------------------------------------------------------- | ------ |
| Onboarding (moneda + primera cuenta + sync setup)              | ✅      |
| CRUD de cuentas (efectivo, débito, crédito)                    | ✅      |
| Registro rápido (gastos, ingresos, transferencias)             | ✅      |
| Dashboard con balance, resumen mensual, top categorías         | ✅      |
| Listado de registros agrupados por día, filtros por tipo y mes | ✅      |
| Analytics: flujo de caja, balance acumulado, gastos por categoría | ✅   |
| Exportación / importación JSON con confirmación                | ✅      |
| Sincronización automática vía SAF + carpeta local              | ✅      |
| Categorías personalizables por tipo                            | ✅      |
| Dark mode monocromático con acentos verde/rojo/morado          | ✅      |

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

## Getting started

```sh
npm install
npm run build:sync
npm run android
```

Para desarrollo de UI (sin SQLite):

```sh
npm run dev -- --host
```

Debuggear WebView en Android: conectar dispositivo vía USB, abrir `chrome://inspect`.

---

## Arquitectura (Clean Architecture)

```
src/lib/
  domain/             → entidades puras + interfaces de repositorio
  application/        → servicios / casos de uso
  infrastructure/     → SQLite, repositorios concretos, plugin SAF
  presentation/       → componentes Svelte + stores
```

**Regla**: la UI nunca importa de `infrastructure/`. Todo pasa por servicios en `application/` vía el composition root `workspace.ts`.

---

## Diseño

Sistema monocromático oscuro con tokens Tailwind v4 en `src/app.css`:

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

## Formato de backup

```json
{
  "version": "1.0",
  "exportedAt": "2026-06-05T...",
  "accounts": [...],
  "categories": [...],
  "settings": {...},
  "records": { "2026-01": [...], "2026-05": [...] }
}
```

Exportación vía diálogo nativo del sistema. Importación siempre con confirmación previa.

---

## Licencia

MIT — ver [LICENSE](./LICENSE).
