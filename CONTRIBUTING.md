# Contributing

Gracias por interesarte en trackersimple.

## Prerrequisitos

- Node.js >= 20
- Android Studio (para compilar y ejecutar en Android)
- Dispositivo Android con **depuración USB** activada en Opciones de desarrollador
- (Opcional) Xcode para iOS — aún no funcional, ver sección iOS más abajo

## Configuración inicial

```sh
git clone <repo>
cd trackersimple
npm install
```

## Build y ejecución

```sh
# Build web + sync con Capacitor
npm run build:sync

# Ejecutar en dispositivo Android conectado
npx cap run android

# O abrir en Android Studio
npm run android
```

Para iterar rápido en la UI (sin SQLite, sin funcionalidad nativa):

```sh
npm run dev -- --host
```

## Conectar y debuggear dispositivo Android

1. Conectar el celular vía USB
2. Verificar que aparece:

```sh
adb devices
# List of devices attached
# R5CT1234ABCD    device
```

Si no aparece, revisar que la depuración USB esté activada en el dispositivo y aceptar el diálogo de confirmación RSA.

3. Abrir `chrome://inspect` en Chrome/Chromium para inspeccionar la WebView

## Estructura del proyecto

```
src/lib/
  domain/entities/         ← Account, Record, Category, AppSettings
  domain/repositories/     ← interfaces (IAccountRepository, etc.)
  application/services/    ← AccountService, RecordService, AnalyticsService, etc.
  infrastructure/db/       ← conexión SQLite, schema, migraciones
  infrastructure/repos/    ← SqliteAccountRepository, etc.
  presentation/stores/     ← workspace.ts (composition root)
  presentation/components/ ← componentes Svelte reusables
  utils/                   ← helpers (date-format, lookup-helpers, etc.)
  plugins/                 ← wrappers TypeScript para plugins nativos
android/app/src/main/java/ ← plugin Java SAF (SafPlugin + SafHandler)
```

## Reglas del proyecto

- **Clean Architecture**: dominio no conoce infraestructura. UI no importa de `infrastructure/`.
- **Svelte 5 runes**: `$state`, `$derived`, `$props`. Nada de `export let` ni stores legacy.
- **SQLite** vía `@capacitor-community/sqlite`. `executeSet()` para batch writes, nunca transacciones manuales.
- **Diseño**: tokens semánticos de Tailwind v4 definidos en `src/app.css`. Nunca colores raw (`bg-[#141414]`).
- **Íconos**: solo `@lucide/svelte`. Cero emojis.
- **Lint**: Biome (`npx biome check --apply .`).
- **Tests**: Vitest (`npm test`).

## Flujo de contribución

1. Hacer fork del repo
2. Crear branch: `feat/mi-feature` o `fix/mi-fix`
3. Hacer cambios siguiendo las convenciones del proyecto
4. Correr lint: `npx biome check --apply .`
5. Correr tests: `npm test`
6. Verificar build: `npm run build`
7. Hacer PR con descripción clara del cambio

## iOS

El stack está listo para iOS (SvelteKit + Capacitor + SQLite funcionan en iOS), pero el plugin SAF (`android/app/src/main/java/com/trackersimple/app/SafPlugin.java`) necesita un equivalente en Swift. Hasta que eso esté implementado, la sincronización automática no funciona en iOS.

Si querés ayudar con el port a iOS, el punto de entrada es `ios/App/App/` y la API SAF de iOS se llama `UIDocumentPickerViewController`.

## Reportes

Ejecutar tool para análisis de proyecto y generación de reporte.

- `reports/audit-mvp.md` — auditoría completa
- `reports/audit-progress.md` — tracking de resolución
