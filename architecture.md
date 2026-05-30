# Arquitectura — HOME DMS

Documento de contexto para sesiones futuras. Mantener actualizado cuando cambie la
estructura, el modelo de datos o las decisiones de diseño.

## Visión general

App web de gestión doméstica familiar para un grupo cerrado de hogares (≈6-7). El
**incremento 1** implementa solo la **gestión de usuarios**: autenticación, cambio de
contraseña forzado y panel de administración (hogares, sims y pertenencias). Los módulos
funcionales (gastos, compras, inventario, comidas) se añadirán en incrementos posteriores.

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
│   └── seed.ts               # Crea el administrador inicial (configurable por env)
├── app/
│   ├── layout.tsx            # Layout raíz (fuentes, Toaster)
│   ├── page.tsx              # "/" → redirige a /dashboard
│   ├── login/                # Login público (página + formulario cliente)
│   ├── change-password/      # Cambio de contraseña forzado/voluntario
│   ├── api/auth/[...nextauth]/route.ts   # Handlers de Auth.js
│   └── (app)/                # Grupo protegido (requiere sesión)
│       ├── layout.tsx        # Cabecera + guard de sesión y mustChangePassword
│       ├── dashboard/        # Dashboard del sim (saludo + sus hogares)
│       └── admin/            # Solo ADMIN
│           ├── layout.tsx    # Guard requireAdmin + subnav
│           ├── page.tsx      # Resumen (contadores)
│           ├── households/   # CRUD de hogares
│           └── sims/         # CRUD de usuarios, contraseñas y pertenencias
├── components/
│   ├── app-header.tsx        # Cabecera con navegación + logout
│   ├── admin/                # households-manager.tsx, sims-manager.tsx (componentes cliente)
│   └── ui/                   # Componentes shadcn/ui
├── lib/
│   ├── prisma.ts             # Singleton de PrismaClient
│   ├── password.ts           # generateTempPassword / hash / verify
│   ├── auth-helpers.ts       # requireSession / requireAdmin
│   └── actions/              # Server actions: auth, households, sims, memberships
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
| `DATABASE_URL`       | Conexión Postgres con pooling (en Vercel = `POSTGRES_PRISMA_URL`) |
| `DIRECT_URL`         | Conexión directa para migraciones (= `POSTGRES_URL_NON_POOLING`) |
| `AUTH_SECRET`        | Secreto de Auth.js para firmar el JWT                          |
| `SEED_ADMIN_*`       | Credenciales del admin inicial (opcional; ver `prisma/seed.ts`)|
