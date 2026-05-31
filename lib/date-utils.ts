// Utilidades de fecha para el calendario. Trabajamos con días "puros" (sin hora)
// normalizados a medianoche UTC, para que coincidan con columnas @db.Date de Prisma
// sin desfases de zona horaria.

/** Crea una fecha a medianoche UTC a partir de año/mes(0-11)/día. */
export function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day));
}

/** "YYYY-MM-DD" (en UTC) de una fecha. Útil como clave de día. */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Parsea "YYYY-MM-DD" a Date a medianoche UTC. */
export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return utcDate(y, m - 1, d);
}

/**
 * Devuelve las semanas (lunes→domingo) que cubren el mes dado, como matriz de
 * días. Incluye días de relleno del mes anterior/siguiente para completar las
 * semanas. month es 0-11.
 */
export function monthGrid(year: number, month: number): Date[][] {
  const first = utcDate(year, month, 1);
  // getUTCDay: 0=domingo..6=sábado. Queremos que la semana empiece en lunes.
  const offset = (first.getUTCDay() + 6) % 7;
  const start = utcDate(year, month, 1 - offset);

  const weeks: Date[][] = [];
  const cursor = new Date(start);
  // 6 semanas cubren cualquier mes; recortamos las semanas totalmente fuera.
  for (let w = 0; w < 6; w++) {
    const days: Date[] = [];
    for (let d = 0; d < 7; d++) {
      days.push(new Date(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    // Solo añade la semana si algún día pertenece al mes objetivo.
    if (days.some((day) => day.getUTCMonth() === month)) {
      weeks.push(days);
    }
  }
  return weeks;
}

/** Lunes (medianoche UTC) de la semana que contiene `date`. */
export function weekStartMonday(date: Date): Date {
  const offset = (date.getUTCDay() + 6) % 7; // 0 = lunes
  return utcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - offset);
}

/** Los 7 días (lunes→domingo) de la semana que empieza en `monday`. */
export function weekDays(monday: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(utcDate(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + i));
  }
  return days;
}

/** Etiqueta de rango de semana, p. ej. "12 – 18 may 2026". */
export function weekLabel(monday: Date): string {
  const sunday = utcDate(
    monday.getUTCFullYear(),
    monday.getUTCMonth(),
    monday.getUTCDate() + 6,
  );
  const fmt = (d: Date, withYear: boolean) =>
    d.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: withYear ? "numeric" : undefined,
      timeZone: "UTC",
    });
  return `${fmt(monday, false)} – ${fmt(sunday, true)}`;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const WEEKDAY_LABELS_FULL = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
