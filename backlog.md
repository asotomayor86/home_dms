# Backlog — HOME DMS

Historial de tareas del proyecto. Estado: **Pendiente** / **Hecha**.

## Incremento 1 — Gestión de usuarios

| Tarea                                                                 | Estado | Fecha alta | Fecha realización |
| --------------------------------------------------------------------- | ------ | ---------- | ----------------- |
| Scaffold Next.js (App Router, TypeScript, Tailwind)                   | Hecha  | 2026-05-30 | 2026-05-30        |
| Integrar shadcn/ui (base Radix) y componentes base                   | Hecha  | 2026-05-30 | 2026-05-30        |
| Configurar Prisma + modelo de datos (Sim, Household, Membership)     | Hecha  | 2026-05-30 | 2026-05-30        |
| Singleton de PrismaClient (`lib/prisma.ts`)                          | Hecha  | 2026-05-30 | 2026-05-30        |
| Utilidades de contraseña (generar temporal, hash, verify)            | Hecha  | 2026-05-30 | 2026-05-30        |
| Configurar Auth.js v5 (credentials, JWT, callbacks, config edge-safe)| Hecha  | 2026-05-30 | 2026-05-30        |
| Augmentación de tipos de sesión/JWT                                  | Hecha  | 2026-05-30 | 2026-05-30        |
| Middleware: guard de rutas + flujo mustChangePassword                | Hecha  | 2026-05-30 | 2026-05-30        |
| Página de login (por usuario, sin email)                             | Hecha  | 2026-05-30 | 2026-05-30        |
| Flujo de cambio de contraseña forzado                                | Hecha  | 2026-05-30 | 2026-05-30        |
| Layout protegido + cabecera con logout                               | Hecha  | 2026-05-30 | 2026-05-30        |
| Dashboard del sim (saludo + lista de sus hogares)                    | Hecha  | 2026-05-30 | 2026-05-30        |
| Panel admin: CRUD de hogares                                         | Hecha  | 2026-05-30 | 2026-05-30        |
| Panel admin: CRUD de sims con contraseña temporal                    | Hecha  | 2026-05-30 | 2026-05-30        |
| Panel admin: asignar/desasignar sims a hogares (memberships)         | Hecha  | 2026-05-30 | 2026-05-30        |
| Panel admin: regenerar contraseña (mostrar en claro una vez)         | Hecha  | 2026-05-30 | 2026-05-30        |
| Salvaguardas (no borrar la propia cuenta / último admin)             | Hecha  | 2026-05-30 | 2026-05-30        |
| Script de seed del administrador inicial                             | Hecha  | 2026-05-30 | 2026-05-30        |
| `.env.example`, `.gitignore` y scripts npm de Prisma                 | Hecha  | 2026-05-30 | 2026-05-30        |
| README con instrucciones de despliegue en Vercel + Postgres          | Hecha  | 2026-05-30 | 2026-05-30        |
| `architecture.md` y `backlog.md`                                     | Hecha  | 2026-05-30 | 2026-05-30        |
| Inicializar git                                                      | Hecha  | 2026-05-30 | 2026-05-30        |
| Push a GitHub (asotomayor86/home_dms)                                | Hecha  | 2026-05-30 | 2026-05-30        |
| Migración inicial Prisma + deploy a Vercel/Neon                      | Hecha  | 2026-05-30 | 2026-05-30        |
| Build aplica migrate deploy + db seed (admin inicial)                | Hecha  | 2026-05-30 | 2026-05-30        |

## Incremento 2 — Catálogo de recetas

| Tarea                                                                 | Estado | Fecha alta | Fecha realización |
| --------------------------------------------------------------------- | ------ | ---------- | ----------------- |
| Modelo Prisma: Recipe, Ingredient, RecipeIngredient, HouseholdRecipe  | Hecha  | 2026-05-30 | 2026-05-30        |
| Enums Unit e IngredientCategory                                       | Hecha  | 2026-05-30 | 2026-05-30        |
| Migración de recetas (offline diff) + cliente regenerado             | Hecha  | 2026-05-30 | 2026-05-30        |
| Seed: catálogo de ingredientes + 12 recetas españolas con pasos       | Hecha  | 2026-05-30 | 2026-05-30        |
| Validación zod compartida (recipe.ts) + enums/labels                 | Hecha  | 2026-05-30 | 2026-05-30        |
| Helper de autorización canManageRecipe                               | Hecha  | 2026-05-30 | 2026-05-30        |
| Server actions de recetas (crear/editar/borrar/activar)              | Hecha  | 2026-05-30 | 2026-05-30        |
| Server actions de ingredientes (listar/crear)                        | Hecha  | 2026-05-30 | 2026-05-30        |
| Server actions de selección por hogar (HouseholdRecipe)              | Hecha  | 2026-05-30 | 2026-05-30        |
| Combobox de ingredientes con creación al vuelo                       | Hecha  | 2026-05-30 | 2026-05-30        |
| Formulario de receta (filas dinámicas de ingredientes y pasos)       | Hecha  | 2026-05-30 | 2026-05-30        |
| Listado /recipes con buscador + enlace en cabecera                   | Hecha  | 2026-05-30 | 2026-05-30        |
| Detalle /recipes/[id] con acciones según permisos                    | Hecha  | 2026-05-30 | 2026-05-30        |
| Crear/editar receta (/new, /[id]/edit)                               | Hecha  | 2026-05-30 | 2026-05-30        |
| "Mi menú" /recipes/seleccion con selector de hogar                   | Hecha  | 2026-05-30 | 2026-05-30        |
| Actualizar architecture.md y backlog.md                              | Hecha  | 2026-05-30 | 2026-05-30        |

## Próximos incrementos (pendientes de planificar)

| Tarea                                                       | Estado    | Fecha alta | Fecha realización |
| ----------------------------------------------------------- | --------- | ---------- | ----------------- |
| Generación automática de plan mensual de comidas/cenas por hogar | Pendiente | 2026-05-30 |                   |
| Cesta de la compra (agregación + escalado por hogar)       | Pendiente | 2026-05-30 |                   |
| Edición de perfil del sim (nombre visible, avatar)         | Pendiente | 2026-05-30 |                   |
| Módulo de gastos                                            | Pendiente | 2026-05-30 |                   |
| Módulo de compras                                          | Pendiente | 2026-05-30 |                   |
| Módulo de inventario                                       | Pendiente | 2026-05-30 |                   |
