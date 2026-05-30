"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Mapea la ruta a una "sección" de color de fondo. */
function sectionFor(pathname: string): string {
  if (pathname.startsWith("/login") || pathname.startsWith("/change-password")) {
    return "auth";
  }
  if (pathname.startsWith("/recipes")) return "recipes";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  return "dashboard";
}

/**
 * Fija data-page en <body> según la ruta actual, para que el fondo de la
 * sección (definido en globals.css) cambie con cada página. No renderiza nada.
 */
export function PageBackground() {
  const pathname = usePathname();

  useEffect(() => {
    document.body.dataset.page = sectionFor(pathname);
  }, [pathname]);

  return null;
}
