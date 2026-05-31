# Arquitectura — HOME DMS

Documento de contexto para sesiones futuras. Mantener actualizado cuando cambie la
estructura, el modelo de datos o las decisiones de diseño.

## Visión general

App web de gestión doméstica familiar para un grupo cerrado de hogares (≈6-7).

- **Incremento 1** — **gestión de usuarios**: autenticación, cambio de contraseña forzado y
  panel de administración (hogares, sims y pertenencias).
- **Incremento 2** — **catálogo de recetas**: recetas con ingredientes (catálogo maestro
  normalizado) y pasos, gestionables por cualquier usuario, y selección de recetas por
  hogar (`HouseholdRecipe`) como base para la futura generación de plan mensual y cesta.
- **Incremento 3** — **calendario de menús por hogar**: cuadrícula mensual (lunes→domingo)
  con asignación manual de comida/cena por día (`PlannedMeal`), y **estrellas** que marcan
  qué recetas están disponibles para el hogar (el "pool" reutiliza `HouseholdRecipe`).

Los módulos de generación automática del draft mensual, cesta de la compra, gastos e
inventario llegarán en incrementos posteriores.

## Stack

| Capa            | Tecnología                                              |
| --------------- | ------------------------------------------------------- |
| Framework       | Next.js (App Router) + TypeScript                       |
| UI              | Tailwind CSS v4 + shadcn/ui (base Radix), sonner (toasts)|
| Autenticación   | Auth.js / NextAuth v5 (proveedor *credentials*, sesión JWT) |
| ORM / BD        | Prisma 6 + PostgreSQL (Vercel Postgres / Neon)          |
| Hash contraseñas| bcryptjs                                                |
| Validación      | zod                                                     |
| Despliegue      | Vercel                                                  |

## Estructura de carpetas

```
home_dms/
├── prisma/
│   ├── schema.prisma         # Modelos Sim, Household, Membership + enum GlobalRole
│   ├── seed.ts               # Siembra admin + catálogo de ingredientes + recetas (idempotente)
│   ├── recipes-data.ts       # Datos del seed de recetas (INGREDIENTS, RECIPES)
│   └── migrations/           # Migraciones SQL (init, recipes)
├── app/
│   ├── layout.tsx            # Layout raíz (fuentes, Toaster)
│   ├── page.tsx              # "/" → redirige a /dashboard
│   ├── login/                # Login público (página + formulario cliente)
│   ├── change-password/      # Cambio de contraseña forzado/voluntario
│   ├── api/auth/[...nextauth]/route.ts   # Handlers de Auth.js
│   └── (app)/                # Grupo protegido (requiere sesión)
│       ├── layout.tsx        # Cabecera + guard de sesión y mustChangePassword
│       ├── dashboard/        # Dashboard del sim (saludo + sus hogares)
│       ├── recipes/          # Catálogo de recetas (todos los usuarios)
│       │   ├── page.tsx      # Listado + buscador
│       │   ├── new/          # Crear receta
│       │   ├── [id]/         # Detalle (+ /edit)
│       │   └── seleccion/    # "Mi menú": selección de recetas por hogar
│       └── admin/            # Solo ADMIN
│           ├── layout.tsx    # Guard requireAdmin + subnav
│           ├── page.tsx      # Resumen (contadores)
│           ├── households/   # CRUD de hogares
│           └── sims/         # CRUD de usuarios, contraseñas y pertenencias
├── components/
│   ├── app-header.tsx        # Cabecera con navegación + logout
│   ├── admin/                # households-manager.tsx, sims-manager.tsx (componentes cliente)
│   ├── recipes/              # recipe-form, recipe-list, ingredient-combobox, etc.
│   └── ui/                   # Componentes shadcn/ui
├── lib/
│   ├── prisma.ts             # Singleton de PrismaClient
│   ├── password.ts           # generateTempPassword / hash / verify
│   ├── auth-helpers.ts       # requireSession / requireAdmin / canManageRecipe
│   ├── validation/recipe.ts  # Schemas zod + enums/labels de recetas (Unit, categorías)
│   └── actions/              # Server actions: auth, households, sims, memberships,
│                             #   recipes, ingredients, household-recipes
├── types/next-auth.d.ts      # Augmentación de tipos de sesión/JWT
├── auth.config.ts            # Config Auth.js "edge-safe" (sin Prisma/bcrypt) + callbacks
├── auth.ts                   # Instancia NextAuth con proveedor credentials
├── proxy.ts                  # (antes middleware) Guard de rutas y flujo mustChangePassword
├── .env.example              # Plantilla de variables de entorno
├── architecture.md           # (este documento)
└── backlog.md                # Estado de tareas
```

## Modelo de datos

```
Sim                                  Household
─────────────────────────            ──────────────────
id            String  (cuid, PK)      id         String (cuid, PK)
username      String  (único)         name       String
passwordHash  String                  createdAt  DateTime
displayName   String
avatar        String? (opcional)      Membership  (N:M Sim↔Household)
globalRole    GlobalRole (ADMIN|USER) ──────────────────
mustChangePassword Boolean (def. true) simId       String (FK→Sim, cascade)
createdAt     DateTime                 householdId String (FK→Household, cascade)
                                       joinedAt    DateTime
                                       PK compuesta (simId, householdId)
```

- **GlobalRole**: rol *global* de la persona en la app (`ADMIN` o `USER`). No existe rol
  por hogar.
- **Membership**: tabla puente N:M sin atributos de rol; su clave primaria compuesta
  `(simId, householdId)` garantiza que un sim no se duplique en un hogar. Borrado en
  cascada al eliminar el sim o el hogar.

### Modelo de recetas (incremento 2)

```
Recipe                                   Ingredient (catálogo maestro)
──────────────────────────────          ──────────────────────────────
id            String (cuid, PK)          id          String (cuid, PK)
name          String                     name        String (único)
description   String?                    category    IngredientCategory
steps         String[]  (pasos)          defaultUnit Unit
imageUrl      String?
servings      Int (raciones base)        RecipeIngredient (N:M Recipe↔Ingredient)
prepMinutes   Int?                       ──────────────────────────────
suitableForLunch  Boolean                recipeId     FK→Recipe (cascade)
suitableForDinner Boolean                ingredientId FK→Ingredient (cascade)
isActive      Boolean (def. true)        quantity     Float (para `servings` base)
createdById   String? (FK→Sim, SetNull)  unit         Unit
createdAt     DateTime                    note         String?
                                          PK compuesta (recipeId, ingredientId)
HouseholdRecipe (N:M Household↔Recipe)
──────────────────────────────
householdId FK→Household (cascade)
recipeId    FK→Recipe (cascade)
addedAt     DateTime
PK compuesta (householdId, recipeId)
```

- **Unit / IngredientCategory**: enums. `AL_GUSTO` marca cantidades que no escalan en la
  futura cesta. `category` agrupará la cesta por secciones del súper.
- **RecipeIngredient**: cantidades referidas a `Recipe.servings`; la cesta se escalará por
  el nº de miembros del hogar (`miembros / servings`).
- **HouseholdRecipe**: qué recetas ha activado cada hogar para entrar en su plan.

### Modelo de calendario (incremento 3)

```
PlannedMeal
──────────────────────────────
id          String (cuid, PK)
householdId FK→Household (cascade)
date        Date (@db.Date, día puro sin hora)
slot        MealSlot (LUNCH | DINNER)
recipeId    FK→Recipe (cascade)
createdById FK→Sim? (SetNull)
createdAt   DateTime
@@unique([householdId, date, slot])   ← 1 receta por hueco/día/hogar
@@index([householdId, date])
```

- **PlannedMeal**: una receta asignada a un hueco (comida/cena) de un día concreto de un
  hogar. La clave única garantiza el formato compacto de "2 líneas por día".
- **Estrella = `HouseholdRecipe`**: no hay modelo nuevo; la estrella en una receta es el
  toggle que crea/borra el registro hogar↔receta. El pool del calendario (y del futuro
  draft) son las recetas con estrella del hogar, filtradas por aptitud del hueco.

## Decisiones de diseño

- **Multi-hogar vía Membership, sin roles de hogar.** Un sim puede pertenecer a varios
  hogares. La pertenencia es una relación pura (sin permisos por hogar); la única
  distinción de permisos es el `globalRole`. Esto deja la puerta abierta a compartir
  datos entre miembros de un mismo hogar en incrementos futuros.

- **Autenticación por *username* (sin email).** Requisito de producto: no se recoge email
  en ninguna parte. El proveedor *credentials* de Auth.js valida `username` + contraseña
  contra el hash almacenado.

- **Sesión JWT + datos en el token.** Se usa estrategia `jwt` (sin tabla de sesiones). El
  `globalRole` y `mustChangePassword` viajan en el token para que el middleware pueda
  tomar decisiones sin consultar la BD en cada request. Tras cambiar la contraseña, el
  token se refresca con `unstable_update` para limpiar `mustChangePassword`.

- **Config Auth "edge-safe" partida.** `auth.config.ts` no importa Prisma ni bcrypt, de
  modo que puede ejecutarse en el middleware (runtime edge). El proveedor *credentials*
  (que sí necesita Prisma/bcrypt, runtime Node) vive en `auth.ts`.

- **Flujo `mustChangePassword`.** Los sims creados por un admin nacen con contraseña
  temporal y `mustChangePassword = true`. El middleware redirige cualquier ruta a
  `/change-password` hasta que el sim define una contraseña propia; entonces pasa a
  `false`. El layout protegido aplica la misma salvaguarda en servidor.

- **Contraseñas temporales legibles y compartidas a mano.** `generateTempPassword` usa un
  alfabeto sin caracteres ambiguos. Tanto al crear un sim como al regenerar su contraseña,
  la clave en claro se muestra **una sola vez** en un diálogo con botón de copiar; el admin
  la comparte manualmente (p. ej. WhatsApp). Nunca se persiste ni se envía automáticamente.

### Decisiones del incremento 2 (recetas)

- **Catálogo de recetas global + selección por hogar.** Todas las recetas son visibles para
  todos; un hogar solo las usará en su plan si las activa vía `HouseholdRecipe`. Mismo
  patrón N:M que `Membership`.

- **Ingredientes normalizados (catálogo maestro), no texto libre.** Permite que la futura
  cesta sume cantidades del mismo ingrediente entre recetas y las agrupe por sección. En el
  formulario, el ingrediente se elige con un *combobox* que busca en el catálogo y permite
  **crear uno nuevo al vuelo** (con categoría y unidad por defecto).

- **Cualquier usuario crea recetas; editar/borrar solo el creador o un admin.** `Recipe`
  lleva `createdById` (FK→Sim con `onDelete: SetNull`, para que la receta sobreviva al
  borrado de su autor). Autorización centralizada en `canManageRecipe(user, recipe)`.

- **Pasos como `String[]`** (array nativo de Postgres), no entidad aparte: pasos numerados y
  reordenables en el formulario, sin el coste de una tabla extra. Migrar a entidad
  `RecipeStep` (foto/tiempo por paso) sería sencillo si se necesitara.

- **"Plato único vs primero+segundo" NO es de la receta.** La receta es siempre un plato;
  esa elección será una característica del *plan* (incremento futuro).

- **Escalado por raciones diferido.** Se persiste `servings` + cantidades por ración, pero
  el cálculo de la cesta (`cantidad × miembros / servings`) se implementará con el módulo de
  cesta. `AL_GUSTO` no escalará.

- **Edición de receta = reemplazo de ingredientes.** `updateRecipe` borra los
  `RecipeIngredient` y los recrea en una transacción (más simple y robusto que un diff).

- **Selección por hogar con selector de hogar activo.** Como un sim puede pertenecer a
  varios hogares, `/recipes/seleccion` lleva un selector (limitado a sus hogares) vía query
  param `?household=`. Es el primer punto donde la UI necesita "contexto de hogar"; el plan
  y la cesta probablemente eleven esto a un selector global.

### Decisiones del incremento 3 (calendario)

- **Estrella = disponibilidad de hogar, reutiliza `HouseholdRecipe`.** La estrella en una
  receta (listado y detalle) es el mismo toggle que "Mi menú"; ambas vistas operan sobre la
  misma tabla. La estrella necesita un hogar de contexto → selector de hogar también en
  `/recipes` (`HouseholdSwitcher`, query `?household=`). Helpers en `lib/households.ts`
  (`getSimHouseholds`, `resolveActiveHousehold`) e `isMemberOf` en `auth-helpers`.

- **Una receta por hueco/día/hogar.** `PlannedMeal` con `@@unique([householdId, date,
  slot])`; `setPlannedMeal` hace *upsert*. Esto fuerza el calendario compacto (máx. 2 líneas
  por día: comida y cena). El "primer+segundo plato" queda fuera de este calendario.

- **Pool validado en servidor.** `setPlannedMeal` exige que la receta esté en el pool del
  hogar (estrella) **y** sea apta para el hueco (`suitableForLunch`/`Dinner`); el diálogo
  cliente ya filtra, pero la server action revalida (no confía en el cliente).

- **Fechas como día puro (UTC).** `PlannedMeal.date` es `@db.Date`; en código se manejan
  fechas a medianoche UTC (`lib/date-utils.ts`: `utcDate`, `dayKey`, `monthGrid` lunes→
  domingo) para evitar desfases de zona horaria al decidir "qué día es".

- **Vista semanal vertical.** El calendario es **semanal** (lunes arriba → domingo abajo),
  no mensual: cabe mejor a lo ancho y deja sitio al detalle. Navegación por semanas vía
  `/calendario?household=&week=YYYY-MM-DD` (el lunes ancla); la toolbar reescribe el param y
  el servidor recarga (`getWeekPlan`). Filtros (hueco y texto) y modo son estado de cliente.
  El **resumen nutricional de la semana** (por ración) aparece debajo de los días.

- **Overlay de receta en el calendario.** En modo Visualizar, al hacer clic en una comida se
  abre `RecipeOverlay` (capa fija sobre el calendario, cierre con botón/fondo/Esc) que carga
  la receta completa on-demand (`getRecipeView`), sin salir del calendario.

- **Generador de menú enchufable.** `lib/planner-strategies.ts` define un registro de
  estrategias `(ctx) => Assignment[]` (hoy solo `random`); `generateWeekPlan` arma los
  huecos de la semana según el ámbito (comida/cena, tomado del filtro de la toolbar), aplica
  la estrategia y persiste en una transacción. `mode`: `fill` (solo huecos vacíos) o
  `replace` (borra el ámbito de la semana y reasigna). El diálogo pregunta primero el
  algoritmo y luego el modo. Añadir algoritmos futuros = registrar otra estrategia. La marca de disponibilidad se muestra como **corazón rojo**
  (componente `RecipeStarButton`, sobre `HouseholdRecipe`). El flujo de generación pregunta
  primero el **algoritmo** (paso 1) y luego el **modo** (paso 2).

- **Dos modos de calendario.** `Visualizar` (por defecto): clic en una comida abre un diálogo
  de solo lectura con la receta y su nutrición. `Generar`: clic abre el selector de receta
  (asignar/editar) y muestra el botón "Generar menú". Es estado de cliente.

- **Nutrición por ración en `Recipe`.** 7 campos opcionales (`calories, protein, carbs, fat,
  fiber, sugar, salt`), todos por ración. El calendario suma por semana (`lib/nutrition.ts`)
  los valores **por ración** de las comidas visibles y los muestra en una columna "Semana"
  al final de cada fila. El seed mantiene estimaciones para las 12 recetas base (idempotente:
  *update* de la nutrición si la receta ya existe).

- **Mutaciones vía Server Actions.** Las operaciones de admin son *server actions*
  (`lib/actions/*`) protegidas con `requireAdmin`, que validan con zod y revalidan las
  rutas afectadas (`revalidatePath`). La UI cliente usa `useTransition` + toasts.

- **Prisma 6 (no 7).** Se fija Prisma 6 deliberadamente: Prisma 7 exige *driver adapters*
  y `prisma.config.ts`, añadiendo complejidad innecesaria para este proyecto. Con v6 la
  conexión se declara en el `schema.prisma` (`url` + `directUrl`).

- **Salvaguardas de integridad.** No se permite eliminar la propia cuenta ni al último
  administrador (en `deleteSim`).

## Variables de entorno

| Variable             | Uso                                                            |
| -------------------- | -------------------------------------------------------------- |
| `POSTGRES_PRISMA_URL`      | Conexión Postgres con pooling (la inyecta Neon en Vercel) |
| `POSTGRES_URL_NON_POOLING` | Conexión directa para migraciones (la inyecta Neon)       |
| `AUTH_SECRET`              | Secreto de Auth.js para firmar el JWT                     |
| `SEED_ADMIN_*`             | Credenciales del admin inicial (opcional; ver `prisma/seed.ts`)|

### Despliegue: migración y seed en el build

Las variables de BD que crea la integración Neon ↔ Vercel son *Encrypted* y **no se pueden
descargar** (`vercel env pull` las devuelve vacías). Por eso el `build` aplica la migración
y el seed dentro del propio entorno de Vercel:
`prisma generate && prisma migrate deploy && prisma db seed && next build`. El seed es
*create-only* (no pisa la contraseña del admin si ya existe), de modo que es idempotente
entre despliegues. Las páginas que tocan la BD son `force-dynamic`, así que el build no
necesita la BD para `next build` (solo lo necesitan `migrate deploy`/`db seed`).
