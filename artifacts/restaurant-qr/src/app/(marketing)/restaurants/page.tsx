import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Restaurants — QRMenu",
  description: "Découvrez tous nos restaurants partenaires en Algérie",
};

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

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; type?: string; q?: string }>;
}) {
  const params = await searchParams;
  const { city, type, q } = params;

  const where: Record<string, unknown> = {
    status: "ACTIVE",
    isPublic: true,
  };
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (type) where.restaurantType = type;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { publicDescription: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }

  const restaurants = await prisma.restaurant.findMany({
    where,
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
      _count: { select: { menuItems: true } },
    },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
  });

  const cities = await prisma.restaurant.groupBy({
    by: ["city"],
    where: { status: "ACTIVE", isPublic: true, city: { not: null } },
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto px-5 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gray-900 mb-3">
            Nos Restaurants Partenaires
          </h1>
          <p className="text-gray-500 text-lg">
            Commandez en ligne depuis vos restaurants préférés
          </p>
        </div>

        {/* Search + Filters */}
        <form method="get" className="flex flex-wrap gap-3 mb-8 justify-center">
          <input
            name="q"
            defaultValue={q}
            placeholder="Rechercher un restaurant..."
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <select
            name="city"
            defaultValue={city}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">Toutes les villes</option>
            {cities.map((c) =>
              c.city ? (
                <option key={c.city} value={c.city}>
                  {c.city}
                </option>
              ) : null
            )}
          </select>
          <select
            name="type"
            defaultValue={type}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">Tous les types</option>
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-all"
          >
            Rechercher
          </button>
          {(q || city || type) && (
            <Link
              href="/restaurants"
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-xl transition-all"
            >
              Effacer
            </Link>
          )}
        </form>

        {/* Results */}
        {restaurants.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-xl font-semibold text-gray-500 mb-2">Aucun restaurant trouvé</p>
            <p className="text-sm">Essayez d&apos;autres critères de recherche</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((r) => (
              <Link
                key={r.id}
                href={`/restaurants/${r.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:border-orange-200 transition-all"
              >
                <div className="relative h-44 bg-gradient-to-br from-orange-100 to-amber-50 overflow-hidden">
                  {r.coverImageUrl ? (
                    <img
                      src={r.coverImageUrl}
                      alt={r.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl opacity-30">🍽️</span>
                    </div>
                  )}
                  {r.isFeatured && (
                    <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      ⭐ À la une
                    </div>
                  )}
                  {r.logoUrl && (
                    <div className="absolute bottom-3 left-3 w-12 h-12 bg-white rounded-xl shadow-md overflow-hidden border-2 border-white">
                      <img src={r.logoUrl} alt={`Logo ${r.name}`} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-orange-600 transition-colors">
                    {r.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {r.city && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        📍 {r.city}
                      </span>
                    )}
                    {r.restaurantType && TYPE_LABELS[r.restaurantType] && (
                      <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                        {TYPE_LABELS[r.restaurantType]}
                      </span>
                    )}
                  </div>
                  {r.publicDescription && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{r.publicDescription}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{r._count.menuItems} articles</span>
                    <span className="text-xs text-orange-600 font-semibold group-hover:underline">
                      Voir le menu →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
