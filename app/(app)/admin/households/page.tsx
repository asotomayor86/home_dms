import { prisma } from "@/lib/prisma";
import { HouseholdsManager } from "@/components/admin/households-manager";

export const dynamic = "force-dynamic";

export default async function HouseholdsPage() {
  const households = await prisma.household.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { memberships: true } } },
  });

  return (
    <HouseholdsManager
      households={households.map((h) => ({
        id: h.id,
        name: h.name,
        members: h._count.memberships,
      }))}
    />
  );
}
