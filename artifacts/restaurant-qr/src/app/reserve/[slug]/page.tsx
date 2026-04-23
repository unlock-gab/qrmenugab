import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { ReserveClient } from "./ReserveClient";

export default async function ReservePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { id: true, name: true, logoUrl: true, primaryColor: true, status: true },
  });

  if (!restaurant || restaurant.status !== "ACTIVE") notFound();

  return (
    <ReserveClient
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      logoUrl={restaurant.logoUrl}
      primaryColor={restaurant.primaryColor}
    />
  );
}
