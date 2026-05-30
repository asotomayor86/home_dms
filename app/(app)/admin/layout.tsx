import Link from "next/link";

import { requireAdmin } from "@/lib/auth-helpers";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Administración</h1>
        <nav className="mt-2 flex gap-4 text-sm">
          <Link href="/admin/households" className="text-muted-foreground hover:text-foreground">
            Hogares
          </Link>
          <Link href="/admin/sims" className="text-muted-foreground hover:text-foreground">
            Usuarios
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
