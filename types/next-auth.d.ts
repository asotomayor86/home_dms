import type { GlobalRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      displayName: string;
      avatar: string | null;
      role: GlobalRole;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    username: string;
    displayName: string;
    avatar: string | null;
    role: GlobalRole;
    mustChangePassword: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
    role: GlobalRole;
    mustChangePassword: boolean;
  }
}
