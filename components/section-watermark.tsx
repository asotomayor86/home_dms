"use client";

import { usePathname } from "next/navigation";

// Texto de la marca de agua + inclinación por sección. Sin imágenes: es texto
// real renderizado con la fuente manuscrita (Caveat). El ángulo (en grados)
// "levanta la parte trasera" del texto y varía entre 10° y 25° según la sección.
function watermarkFor(pathname: string): { text: string; angle: number } {
  if (pathname.startsWith("/login")) return { text: "Hola", angle: 18 };
  if (pathname.startsWith("/change-password")) return { text: "Clave", angle: 14 };
  if (pathname.startsWith("/recipes/seleccion")) return { text: "Menú", angle: 25 };
  if (pathname.startsWith("/recipes")) return { text: "Recetas", angle: 12 };
  if (pathname.startsWith("/admin")) return { text: "Admin", angle: 22 };
  if (pathname.startsWith("/dashboard")) return { text: "Inicio", angle: 16 };
  return { text: "Home", angle: 15 };
}

/**
 * Marca de agua gigante manuscrita con el nombre de la sección. Negra pero muy
 * tenue, fija detrás de todo el contenido (-z-10) y desbordando por el borde
 * inferior izquierdo. No interfiere con el contenido (pointer-events-none) y el
 * propio contenedor recorta el desbordamiento (overflow-hidden).
 */
export function SectionWatermark() {
  const pathname = usePathname();
  const { text, angle } = watermarkFor(pathname);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 flex items-center justify-center overflow-hidden select-none"
    >
      <span
        className="font-handwriting leading-none whitespace-nowrap text-foreground/[0.10]"
        style={{
          fontSize: "clamp(14rem, 44vw, 42rem)",
          // Ángulo negativo = giro antihorario → "levanta" la parte trasera del texto.
          transform: `rotate(-${angle}deg)`,
        }}
      >
        {text}
      </span>
    </div>
  );
}
