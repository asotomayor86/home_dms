# HOME DMS

App web de **gestión doméstica familiar** (gastos, compras, inventario y planificación
de comidas) para un grupo restringido de hogares.

> **Incremento 1 — Gestión de usuarios.** Esta versión cubre únicamente: autenticación
> por usuario, cambio de contraseña forzado, y un panel de administración con CRUD de
> hogares, CRUD de usuarios (sims), asignación a hogares y regeneración de contraseñas.
> Los módulos de gastos/compras/inventario/comidas llegarán en incrementos futuros.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (base Radix)
- **Prisma ORM** (v6) + **PostgreSQL** (Vercel Postgres / Neon)
- **Auth.js (NextAuth v5)** con proveedor *credentials* (login por **usuario**, sin email)
- Hash de contraseñas con **bcrypt** (`bcryptjs`)

Consulta [architecture.md](architecture.md) para el detalle de la arquitectura y las
decisiones de diseño, y [backlog.md](backlog.md) para el estado de las tareas.

## Puesta en marcha (local)

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Crea tu fichero `.env` a partir del ejemplo y rellénalo:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` / `DIRECT_URL`: cadena(s) de conexión PostgreSQL. En local puedes
     poner el mismo valor en ambas.
   - `AUTH_SECRET`: genera uno con `npx auth secret` (o `openssl rand -base64 32`).
   - `SEED_ADMIN_*`: usuario/contraseña/nombre del administrador inicial (opcional;
     si no, se usan las constantes de `prisma/seed.ts`).

3. Aplica el esquema a la base de datos y crea el administrador inicial:

   ```bash
   npm run db:migrate      # crea las tablas (prisma migrate dev)
   npm run db:seed         # crea tu cuenta ADMIN
   ```

4. Arranca el entorno de desarrollo:

   ```bash
   npm run dev
   ```

   Abre <http://localhost:3000> e inicia sesión con el usuario/contraseña del seed.

## Scripts útiles

| Script               | Acción                                              |
| -------------------- | --------------------------------------------------- |
| `npm run dev`        | Servidor de desarrollo                              |
| `npm run build`      | `prisma generate` + build de producción             |
| `npm run db:migrate` | Migración en desarrollo (`prisma migrate dev`)      |
| `npm run db:deploy`  | Aplica migraciones en producción (`migrate deploy`) |
| `npm run db:seed`    | Ejecuta `prisma/seed.ts` (admin inicial)            |
| `npm run db:studio`  | Abre Prisma Studio                                  |

## Despliegue en Vercel + Vercel Postgres

1. **Sube el repo a GitHub** e impórtalo en Vercel (New Project → Import).
2. **Crea la base de datos**: en el proyecto de Vercel → pestaña **Storage** →
   *Create Database* → **Postgres** (Neon). Al vincularla, Vercel inyecta variables como
   `POSTGRES_PRISMA_URL` y `POSTGRES_URL_NON_POOLING`.
3. **Configura las variables de entorno** del proyecto (Settings → Environment Variables):
   - `DATABASE_URL`  = valor de `POSTGRES_PRISMA_URL`  (con pooling)
   - `DIRECT_URL`    = valor de `POSTGRES_URL_NON_POOLING`  (directa, para migraciones)
   - `AUTH_SECRET`   = un secreto aleatorio (`npx auth secret`)
   - *(opcional)* `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_DISPLAYNAME`
4. **Aplica las migraciones** contra la base de datos de Vercel. Lo más cómodo es hacerlo
   desde tu máquina apuntando a la BD de producción (usa la cadena *non-pooling* en
   `DIRECT_URL`):

   ```bash
   npm run db:deploy
   npm run db:seed
   ```

   > Puedes obtener las cadenas con `vercel env pull .env.production.local` (CLI de Vercel)
   > y cargarlas antes de ejecutar los comandos.
5. **Despliega**: cada push a la rama principal genera un despliegue. El `build` ejecuta
   `prisma generate` automáticamente.

### Notas

- El login es **solo por nombre de usuario** (no hay email en ninguna parte).
- Los usuarios creados por un admin reciben una **contraseña temporal** y se les obliga a
  cambiarla en el primer acceso (`mustChangePassword`).
- La regeneración de contraseña **muestra la nueva clave en claro una sola vez** para que
  el admin la copie y la comparta manualmente (p. ej. por WhatsApp). No se envía por
  ningún canal automático.
