import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ──────────────────────────────────────────────────────────────────────────
// CONFIGURA AQUÍ tu cuenta de administrador inicial.
// Se toman de variables de entorno si existen; si no, de estas constantes.
// ⚠️  CAMBIA la contraseña antes de usar en producción.
// ──────────────────────────────────────────────────────────────────────────
const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "cambia-esto-1234";
const ADMIN_DISPLAY_NAME = process.env.SEED_ADMIN_DISPLAYNAME ?? "Administrador";

async function main() {
  // Create-only: si el admin ya existe NO se toca (así un deploy posterior nunca
  // pisa una contraseña que el admin haya cambiado desde la app).
  const existing = await prisma.sim.findUnique({
    where: { username: ADMIN_USERNAME },
  });

  if (existing) {
    console.log(`• Admin "${existing.username}" ya existe; no se modifica.`);
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await prisma.sim.create({
    data: {
      username: ADMIN_USERNAME,
      passwordHash,
      displayName: ADMIN_DISPLAY_NAME,
      globalRole: "ADMIN",
      // El admin define su propia contraseña vía env/constante, no se fuerza el cambio.
      mustChangePassword: false,
    },
  });

  console.log(`✔ Admin creado: ${admin.username} (rol ${admin.globalRole})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
