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

## Incremento 3 — Calendario de menús por hogar

| Tarea                                                                 | Estado | Fecha alta | Fecha realización |
| --------------------------------------------------------------------- | ------ | ---------- | ----------------- |
| Modelo PlannedMeal + enum MealSlot (relaciones inversas)              | Hecha  | 2026-05-31 | 2026-05-31        |
| Migración del planner (offline diff) + cliente                       | Hecha  | 2026-05-31 | 2026-05-31        |
| Server actions del planner (set/clear/getMonthPlan)                  | Hecha  | 2026-05-31 | 2026-05-31        |
| Utilidades de fecha (monthGrid lunes→domingo, UTC)                   | Hecha  | 2026-05-31 | 2026-05-31        |
| Estrella de disponibilidad (RecipeStarButton, reutiliza HouseholdRecipe) | Hecha | 2026-05-31 | 2026-05-31        |
| Selector de hogar reutilizable + helpers de hogares                  | Hecha  | 2026-05-31 | 2026-05-31        |
| Estrellas en listado y detalle de recetas                            | Hecha  | 2026-05-31 | 2026-05-31        |
| Calendario /calendario (cuadrícula mensual compacta + toolbar)       | Hecha  | 2026-05-31 | 2026-05-31        |
| Filtros (hueco y texto) y navegación de mes + Hoy                    | Hecha  | 2026-05-31 | 2026-05-31        |
| Diálogo de asignación (pool con estrella, apto por hueco)            | Hecha  | 2026-05-31 | 2026-05-31        |
| Enlace "Calendario" en cabecera                                      | Hecha  | 2026-05-31 | 2026-05-31        |
| Corazones rojos en lugar de estrellas (disponibilidad)               | Hecha  | 2026-05-31 | 2026-05-31        |
| Generación automática del menú mensual (estrategia aleatoria, enchufable) | Hecha | 2026-05-31 | 2026-05-31        |
| Diálogo de generación (rellenar vacíos / regenerar; respeta filtro)  | Hecha  | 2026-05-31 | 2026-05-31        |
| Nutrición por ración en recetas (7 campos) + migración + seed         | Hecha  | 2026-05-31 | 2026-05-31        |
| Nutrición en formulario y detalle de receta                          | Hecha  | 2026-05-31 | 2026-05-31        |
| Modos de calendario: Visualizar (ver receta) y Generar (asignar)     | Hecha  | 2026-05-31 | 2026-05-31        |
| Flujo de generación en 2 pasos (algoritmo → modo)                    | Hecha  | 2026-05-31 | 2026-05-31        |
| Totales nutricionales semanales por ración en el calendario          | Hecha  | 2026-05-31 | 2026-05-31        |
| Desplegable de filtro de hueco más ancho                             | Hecha  | 2026-05-31 | 2026-05-31        |
| Calendario semanal vertical (lunes arriba → domingo abajo)           | Hecha  | 2026-05-31 | 2026-05-31        |
| Generación de menú semanal (en vez de mensual)                       | Hecha  | 2026-05-31 | 2026-05-31        |
| Resumen nutricional de la semana debajo del calendario               | Hecha  | 2026-05-31 | 2026-05-31        |
| Toolbar: modo en línea fija, filtro de hueco en mayúsculas           | Hecha  | 2026-05-31 | 2026-05-31        |
| Overlay de receta sobre el calendario (cierre rápido)                | Hecha  | 2026-05-31 | 2026-05-31        |
| Nutrición en el ingrediente (por 100g + gramos/unidad) + migración    | Hecha  | 2026-05-31 | 2026-05-31        |
| Cálculo de nutrición de receta desde ingredientes (override opcional) | Hecha  | 2026-05-31 | 2026-05-31        |
| Integración Open Food Facts (búsqueda + autocompletar ingrediente)    | Hecha  | 2026-05-31 | 2026-05-31        |
| Seed: valores nutricionales de los ~48 ingredientes                  | Hecha  | 2026-05-31 | 2026-05-31        |
| Form receta: preview calculado en vivo + override plegable           | Hecha  | 2026-05-31 | 2026-05-31        |
| Sección /ingredientes: tabla con nutrición y factores de conversión   | Hecha  | 2026-05-31 | 2026-05-31        |
| Etiqueta de factor de conversión según unidad (gramos por diente…)    | Hecha  | 2026-05-31 | 2026-05-31        |
| Fuentes nutricionales multi-fuente (registro enchufable)             | Hecha  | 2026-05-31 | 2026-05-31        |
| Fuentes: Open Food Facts, BEDCA, Mercadona, USDA (pestañas)          | Hecha  | 2026-05-31 | 2026-05-31        |
| Trazabilidad de origen (sourceId + sourceRef) + migración            | Hecha  | 2026-05-31 | 2026-05-31        |
| Activar USDA (requiere USDA_API_KEY en Vercel)                       | Pendiente | 2026-05-31 |                   |
| Actualizar architecture.md y backlog.md                              | Hecha  | 2026-05-31 | 2026-05-31        |

## Próximos incrementos (pendientes de planificar)

| Tarea                                                       | Estado    | Fecha alta | Fecha realización |
| ----------------------------------------------------------- | --------- | ---------- | ----------------- |
| Más algoritmos de generación de menú (evitar repeticiones, equilibrio…) | Pendiente | 2026-05-31 |                   |
| Cesta de la compra (agregación + escalado por hogar)       | Pendiente | 2026-05-30 |                   |
| Edición de perfil del sim (nombre visible, avatar)         | Pendiente | 2026-05-30 |                   |
| Módulo de gastos                                            | Pendiente | 2026-05-30 |                   |
| Módulo de compras                                          | Pendiente | 2026-05-30 |                   |
| Módulo de inventario                                       | Pendiente | 2026-05-30 |                   |
