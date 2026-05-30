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
   *Create Database* → **Postgres** (Neon). Al vincularla, Vercel inyecta automáticamente
   `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, etc. (como variables *Encrypted*).
   El `schema.prisma` ya usa esos nombres, así que **no hay que configurar nada de la BD a
   mano**.
3. **Configura el resto de variables** (Settings → Environment Variables):
   - `AUTH_SECRET`   = un secreto aleatorio (`npx auth secret`)
   - *(opcional, para el admin inicial)* `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`,
     `SEED_ADMIN_DISPLAYNAME`
4. **Migración y seed automáticos en el build.** El script `build` ejecuta
   `prisma generate && prisma migrate deploy && prisma db seed && next build`. Es decir:
   en cada despliegue se aplican las migraciones pendientes y se asegura el admin inicial
   (el seed es *create-only*: si el admin ya existe, no lo toca).
5. **Despliega**: cada push a la rama principal genera un despliegue.

   > Nota: las variables de la BD que crea Neon son *Encrypted* y no se pueden descargar
   > con `vercel env pull` (vienen vacías). Por eso la migración se ejecuta **dentro del
   > build de Vercel** (donde sí están disponibles), en lugar de desde tu máquina.

### Notas

- El login es **solo por nombre de usuario** (no hay email en ninguna parte).
- Los usuarios creados por un admin reciben una **contraseña temporal** y se les obliga a
  cambiarla en el primer acceso (`mustChangePassword`).
- La regeneración de contraseña **muestra la nueva clave en claro una sola vez** para que
  el admin la copie y la comparta manualmente (p. ej. por WhatsApp). No se envía por
  ningún canal automático.
