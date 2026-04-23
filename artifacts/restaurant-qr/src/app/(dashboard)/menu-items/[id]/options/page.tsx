import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import OptionsClient from "./OptionsClient";

export default async function ItemOptionsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) redirect("/login");

  const { id } = await params;

  const item = await prisma.menuItem.findFirst({
    where: { id, restaurantId: session.user.restaurantId },
    include: {
      optionGroups: {
        include: { options: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!item) notFound();

  const serialized = {
    id: item.id,
    name: item.name,
    optionGroups: item.optionGroups.map((g) => ({
      id: g.id,
      name: g.name,
      selectionType: g.selectionType as string,
      isRequired: g.isRequired,
      sortOrder: g.sortOrder,
      options: g.options.map((o) => ({
        id: o.id,
        name: o.name,
        extraPrice: Number(o.extraPrice),
        isActive: o.isActive,
        sortOrder: o.sortOrder,
      })),
    })),
  };

  return <OptionsClient item={serialized} />;
}
