import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await prisma.restaurant.findFirst({
    where: { slug, isPublic: true, status: "ACTIVE" },
    select: { name: true, publicDescription: true },
  });
  if (!restaurant) return { title: "Restaurant introuvable" };
  return {
    title: `${restaurant.name} — QRMenu`,
    description: restaurant.publicDescription ?? `Découvrez le menu de ${restaurant.name}`,
  };
}

const TYPE_LABELS: Record<string, string> = {
  algerian: "Cuisine algérienne",
  fast_food: "Fast-food",
  pizzeria: "Pizzeria",
  cafe: "Café",
  grills: "Grillades",
  seafood: "Fruits de mer",
  other: "Autre",
};

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findFirst({
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
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          slug: true,
        },
      },
    },
  });

  if (!restaurant) notFound();

  const hasMenu = restaurant.categories.some((c) => c.menuItems.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Hero cover */}
      <div className="relative h-56 md:h-72 bg-gradient-to-br from-orange-100 to-amber-50 overflow-hidden">
        {restaurant.coverImageUrl ? (
          <img
            src={restaurant.coverImageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl opacity-20">🍽️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-5 -mt-12 pb-16 relative">
        {/* Restaurant info card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex items-start gap-4">
            {restaurant.logoUrl ? (
              <img
                src={restaurant.logoUrl}
                alt={`Logo ${restaurant.name}`}
                className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md shrink-0"
              />
            ) : (
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-2xl">🍽️</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
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
                </div>
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
                  📞 <a href={`tel:${restaurant.phone}`} className="hover:text-orange-600">{restaurant.phone}</a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Branches */}
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

        {/* Menu */}
        {hasMenu ? (
          <div className="space-y-8">
            <h2 className="text-xl font-black text-gray-900">Notre Menu</h2>
            {restaurant.categories
              .filter((cat) => cat.menuItems.length > 0)
              .map((cat) => (
                <div key={cat.id}>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                    {cat.name}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {cat.menuItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-3 hover:border-orange-200 transition-all"
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-20 h-20 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-2xl">🍽️</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                          )}
                          <p className="text-orange-600 font-bold text-sm mt-1">
                            {item.price.toFixed(0)} Da
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📋</div>
            <p className="font-semibold text-gray-500">Menu bientôt disponible</p>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/restaurants" className="text-sm text-orange-600 hover:text-orange-700 font-semibold">
            ← Voir tous les restaurants
          </Link>
        </div>
      </div>
    </div>
  );
}
