import { prisma } from "@/lib/prisma";

export type HouseholdOption = { id: string; name: string };

/** Hogares a los que pertenece un sim, ordenados por nombre. */
export async function getSimHouseholds(simId: string): Promise<HouseholdOption[]> {
  const memberships = await prisma.membership.findMany({
    where: { simId },
    include: { household: { select: { id: true, name: true } } },
    orderBy: { household: { name: "asc" } },
  });
  return memberships.map((m) => m.household);
}

/**
 * Resuelve el hogar activo a partir de un query param: el solicitado si el sim
 * pertenece, o el primero de su lista. Devuelve null si no tiene hogares.
 */
export function resolveActiveHousehold(
  households: HouseholdOption[],
  requestedId: string | undefined,
): HouseholdOption | null {
  if (households.length === 0) return null;
  return households.find((h) => h.id === requestedId) ?? households[0];
}
