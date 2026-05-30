import Link from "next/link";

import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppHeader({
  displayName,
  avatar,
  isAdmin,
}: {
  displayName: string;
  avatar: string | null;
  isAdmin: boolean;
}) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <nav className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-base font-semibold uppercase tracking-[0.2em]"
          >
            HOME DMS
          </Link>
          <Link
            href="/dashboard"
            className="eyebrow text-muted-foreground transition-colors hover:text-foreground"
          >
            Inicio
          </Link>
          <Link
            href="/recipes"
            className="eyebrow text-muted-foreground transition-colors hover:text-foreground"
          >
            Recetas
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="eyebrow text-muted-foreground transition-colors hover:text-foreground"
            >
              Administración
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              {avatar && <AvatarImage src={avatar} alt={displayName} />}
              <AvatarFallback className="text-xs">{initials(displayName)}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm sm:inline">{displayName}</span>
          </div>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              Salir
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
