"use client";

import { usePathname } from "next/navigation";

// Texto de la marca de agua según la sección. Sin imágenes: es texto real
// renderizado con la fuente manuscrita (Caveat).
function watermarkFor(pathname: string): string {
  if (pathname.startsWith("/login")) return "Hola";
  if (pathname.startsWith("/change-password")) return "Clave";
  if (pathname.startsWith("/recipes/seleccion")) return "Menú";
  if (pathname.startsWith("/recipes")) return "Recetas";
  if (pathname.startsWith("/admin")) return "Admin";
  if (pathname.startsWith("/dashboard")) return "Inicio";
  return "Home";
}

/**
 * Marca de agua gigante manuscrita con el nombre de la sección. Negra pero muy
 * tenue, fija detrás de todo el contenido (-z-10) y desbordando por el borde
 * inferior izquierdo. No interfiere con el contenido (pointer-events-none) y el
 * propio contenedor recorta el desbordamiento (overflow-hidden).
 */
export function SectionWatermark() {
  const pathname = usePathname();
  const text = watermarkFor(pathname);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
    >
      <span
        className="absolute -bottom-[0.28em] -left-[0.06em] font-handwriting leading-none whitespace-nowrap text-foreground/[0.055]"
        style={{ fontSize: "clamp(11rem, 34vw, 30rem)" }}
      >
        {text}
      </span>
    </div>
  );
}
