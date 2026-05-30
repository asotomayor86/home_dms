import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth-helpers";
import { AppHeader } from "@/components/app-header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  // Salvaguarda extra al middleware: si la contraseña es temporal, fuera de aquí.
  if (session.user.mustChangePassword) redirect("/change-password");

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        displayName={session.user.displayName}
        avatar={session.user.avatar}
        isAdmin={session.user.role === "ADMIN"}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
