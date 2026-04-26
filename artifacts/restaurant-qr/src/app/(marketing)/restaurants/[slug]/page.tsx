import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { cache } from "react";
import { RestaurantMenuClient } from "@/components/marketing/RestaurantMenuClient";

export const revalidate = 60;

const TYPE_LABELS: Record<string, string> = {
  algerian: "Cuisine algérienne",
  fast_food: "Fast-food",
  pizzeria: "Pizzeria",
  cafe: "Café",
  grills: "Grillades",
  seafood: "Fruits de mer",
  other: "Autre",
};

// cache() deduplicates DB calls between generateMetadata and the page — one hit per request
const getRestaurant = cache(async (slug: string) =>
  prisma.restaurant.findFirst({
    where: { slug, isPublic: true, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      coverImageUrl: true,
      publicDescription: true,
      city: true,
      restaurantType: true,
      isFeatured: true,
      phone: true,
      address: true,
      categories: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          menuItems: {
            where: { isAvailable: true },
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              imageUrl: true,
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      branches: {
        where: { status: "ACTIVE" },
        select: { id: true, name: true, address: true, phone: true, slug: true },
      },
    },
  })
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);
  if (!restaurant) return { title: "Restaurant introuvable" };
  return {
    title: `${restaurant.name} — QRMenu`,
    description: restaurant.publicDescription ?? `Découvrez le menu de ${restaurant.name}`,
    openGraph: {
      title: `${restaurant.name} — QRMenu`,
      description: restaurant.publicDescription ?? `Découvrez le menu de ${restaurant.name}`,
      images: restaurant.coverImageUrl ? [{ url: restaurant.coverImageUrl }] : [],
    },
  };
}

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);
  if (!restaurant) notFound();

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="relative h-56 md:h-72 bg-gradient-to-br from-orange-100 to-amber-50 overflow-hidden">
        {restaurant.coverImageUrl ? (
          <Image
            src={restaurant.coverImageUrl}
            alt={restaurant.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl opacity-20">🍽️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-5 -mt-12 pb-16 relative">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex items-start gap-4">
            {restaurant.logoUrl ? (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md shrink-0">
                <Image
                  src={restaurant.logoUrl}
                  alt={`Logo ${restaurant.name}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-2xl">🍽️</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-gray-900">{restaurant.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {restaurant.city && (
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    📍 {restaurant.city}
                  </span>
                )}
                {restaurant.restaurantType && TYPE_LABELS[restaurant.restaurantType] && (
                  <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                    {TYPE_LABELS[restaurant.restaurantType]}
                  </span>
                )}
                {restaurant.isFeatured && (
                  <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                    ⭐ À la une
                  </span>
                )}
              </div>
              {restaurant.publicDescription && (
                <p className="text-gray-600 text-sm mt-3 leading-relaxed">
                  {restaurant.publicDescription}
                </p>
              )}
              {restaurant.address && (
                <p className="text-xs text-gray-400 mt-2">📍 {restaurant.address}</p>
              )}
              {restaurant.phone && (
                <p className="text-xs text-gray-400 mt-1">
                  📞{" "}
                  <a href={`tel:${restaurant.phone}`} className="hover:text-orange-600">
                    {restaurant.phone}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        {restaurant.branches.length > 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <h2 className="font-bold text-gray-900 mb-3">Nos établissements</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {restaurant.branches.map((branch) => (
                <div key={branch.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="font-semibold text-sm text-gray-900">{branch.name}</p>
                  {branch.address && <p className="text-xs text-gray-500 mt-0.5">📍 {branch.address}</p>}
                  {branch.phone && <p className="text-xs text-gray-500">📞 {branch.phone}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <RestaurantMenuClient
          categories={restaurant.categories.map((cat) => ({
            ...cat,
            imageUrl: cat.imageUrl ?? null,
            menuItems: cat.menuItems.map((item) => ({
              ...item,
              price: Number(item.price),
            })),
          }))}
        />

        <div className="mt-10 text-center">
          <Link href="/restaurants" className="text-sm text-orange-600 hover:text-orange-700 font-semibold">
            ← Voir tous les restaurants
          </Link>
        </div>
      </div>
    </div>
  );
}
