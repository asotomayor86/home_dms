import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const {
  handlers,
  auth,
  signIn,
  signOut,
  unstable_update: updateSession,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { username, password } = parsed.data;
        const sim = await prisma.sim.findUnique({ where: { username } });
        if (!sim) return null;

        const ok = await verifyPassword(password, sim.passwordHash);
        if (!ok) return null;

        return {
          id: sim.id,
          username: sim.username,
          displayName: sim.displayName,
          avatar: sim.avatar,
          role: sim.globalRole,
          mustChangePassword: sim.mustChangePassword,
        };
      },
    }),
  ],
});
