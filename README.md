# Personal Finance App — README Draft

## 📌 Overview

Aplicación mobile-first para gestión de finanzas personales enfocada en:

- simplicidad
- privacidad
- velocidad de uso
- funcionamiento offline
- portabilidad de datos
- compatibilidad futura con herramientas de IA

El objetivo principal no es crear una plataforma financiera compleja o empresarial, sino una herramienta sencilla que permita a cualquier persona registrar ingresos, gastos y transferencias de forma rápida y consistente.

---

# 🎯 Filosofía del Proyecto

La aplicación se basa en los siguientes principios:

## ✅ Local-first

Toda la información pertenece al usuario y se almacena localmente en el dispositivo.

La aplicación funciona completamente offline.

---

## ✅ Simplicidad

Registrar movimientos financieros debe tomar pocos segundos.

Se evita:

- sobrecarga de categorías
- configuraciones complejas
- dashboards innecesarios
- procesos contables avanzados

---

## ✅ Privacidad

No se requiere:

- cuenta
- backend
- sincronización obligatoria
- conexión bancaria

---

## ✅ Portabilidad

Los datos pueden exportarse fácilmente en formatos abiertos (`JSON`).

---

## ✅ AI-Friendly

La estructura de datos será:

- abierta
- documentada
- estable
- fácilmente consumible por agentes de IA

Esto permitirá futuras integraciones con:

- asistentes personales
- análisis automáticos
- reportes inteligentes
- clasificación automática
- herramientas CLI y agentes locales

---

# 📱 Alcance del Producto

## MVP Inicial

La primera versión del producto incluirá:

### Gestión de cuentas

- Crear cuentas
- Editar cuentas
- Desactivar cuentas

Tipos iniciales:

- Efectivo (`cash`)
- Débito (`debit`)
- Crédito (`credit`)

---

### Registro de movimientos

Tipos soportados:

- Gastos
- Ingresos
- Transferencias

Cada movimiento incluirá:

- monto
- fecha
- cuenta
- categoría
- descripción opcional

---

### Categorías simples

Categorías iniciales por defecto:

#### Gastos

- Comida
- Transporte
- Salud
- Educación
- Vivienda
- Automóvil
- Deportes
- Entretenimiento
- Mascotas
- Regalos
- Ropa

#### Ingresos

- Salario
- Depósitos
- Ahorros

El usuario podrá crear nuevas categorías.

---

### Dashboard principal

Visualización rápida de:

- balance total
- ingresos del mes
- gastos del mes
- distribución de gastos por categoría
- últimos movimientos

---

### Exportación e importación

La aplicación permitirá:

- exportar datos
- importar backups
- mover información entre dispositivos

Formato inicial:

- JSON

---

### Dark Mode

Soporte de tema oscuro desde el MVP.

---

# ❌ Fuera del MVP

No se desarrollará inicialmente:

- sincronización en nube
- multiusuario
- autenticación
- conexión bancaria
- suscripciones
- IA integrada
- OCR
- presupuestos avanzados
- inversiones
- reportes contables
- notificaciones inteligentes

---

# 🏗️ Arquitectura General

La aplicación utilizará una arquitectura:

# Local-first + Offline-first

---

## Runtime Database

Para operación rápida de la aplicación se utilizará:

- IndexedDB
- Dexie.js

Esto permite:

- persistencia local
- consultas rápidas
- funcionamiento offline
- experiencia fluida en móvil

---

## Export Layer

La aplicación podrá exportar snapshots estructurados en JSON.

La exportación estará segmentada por períodos mensuales para evitar archivos gigantes.

Ejemplo:

```
workspace/│├── manifest.json├── accounts.json├── categories.json│└── records/    ├── 2026-01.json    ├── 2026-02.json    └── 2026-03.json
```

---

# 🤖 Estrategia AI-Friendly

La aplicación será diseñada desde el inicio para facilitar análisis por agentes externos.

Objetivos:

- formato legible
- estructura estable
- datos abiertos
- fácil parsing
- consumo incremental

Ejemplo:

- agentes CLI
- análisis automáticos
- embeddings
- reportes IA
- automatizaciones

---

# 🛠️ Tecnologías

## Frontend

- SvelteKit
- Tailwind CSS
- Skeleton UI

---

## Persistencia

- IndexedDB
- Dexie.js

---

## Deployment

Aplicación:

- PWA (Progressive Web App)

Compatible con:

- Android
- iPhone
- Desktop browsers

---

# 📂 Estructura Inicial del Proyecto

```
src/│├── lib/│   ├── components/│   ├── stores/│   ├── services/│   ├── db/│   ├── models/│   ├── exporters/│   └── utils/│├── routes/│   ├── +layout.svelte│   ├── +page.svelte│   ││   ├── dashboard/│   ├── accounts/│   ├── records/│   ├── analytics/│   └── settings/
```

---

# 🔄 Flujos Iniciales

## Crear Workspace

```
flowchart TD    A[Usuario abre app] --> B[Crear workspace]    B --> C[Guardar metadata]    C --> D[Crear categorías por defecto]    D --> E[Inicializar IndexedDB]    E --> F[Entrar al dashboard]
```

---

## Registrar Movimiento

```
flowchart TD    A[Usuario pulsa botón agregar] --> B[Selecciona tipo]    B --> C[Completa formulario]    C --> D[Validar datos]    D --> E[Guardar en IndexedDB]    E --> F[Actualizar dashboard]
```

---

## Exportar Datos

```
flowchart TD    A[Usuario exporta workspace] --> B[Leer datos IndexedDB]    B --> C[Segmentar por períodos]    C --> D[Construir JSON]    D --> E[Descargar backup]
```

---

# 🎯 Objetivo del MVP

El objetivo inicial es validar:

## ✅ Hábito de uso

¿Las personas realmente registran sus movimientos constantemente?

---

## ✅ Velocidad de registro

¿La experiencia es suficientemente rápida y agradable?

---

## ✅ Valor percibido

¿Los usuarios consideran útil una herramienta:

- privada
- simple
- offline
- local-first?

---

# 🚀 Visión Futura

Posibles evoluciones futuras:

- sincronización opcional
- integración IA
- insights automáticos
- análisis predictivo
- importación bancaria
- presupuestos avanzados
- widgets móviles
- empaquetado nativo (Capacitor)

---

# 📌 Estado Actual

Proyecto en etapa inicial de diseño y construcción del MVP.