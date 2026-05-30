import type { NextAuthConfig } from "next-auth";

// Configuración compartida y "edge-safe": NO importa Prisma ni bcrypt, por lo
// que puede ejecutarse también en el middleware (runtime edge). El proveedor
// Credentials (que sí usa Prisma/bcrypt) se añade en auth.ts.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    // Propaga los datos del sim al token en el login y permite refrescarlos
    // (p. ej. tras cambiar la contraseña) vía session.update().
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.username = user.username;
        token.displayName = user.displayName;
        token.avatar = user.avatar;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
      }
      if (trigger === "update" && session?.user) {
        if (typeof session.user.mustChangePassword === "boolean") {
          token.mustChangePassword = session.user.mustChangePassword;
        }
        if (typeof session.user.displayName === "string") {
          token.displayName = session.user.displayName;
        }
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.displayName = token.displayName;
      session.user.avatar = token.avatar;
      session.user.role = token.role;
      session.user.mustChangePassword = token.mustChangePassword;
      return session;
    },
  },
} satisfies NextAuthConfig;
