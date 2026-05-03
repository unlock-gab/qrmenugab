import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { cache } from "react";
import { RestaurantMenuClient } from "@/components/marketing/RestaurantMenuClient";
import { MapPin, Phone, Star, ChevronLeft, ExternalLink } from "lucide-react";

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

const TYPE_EMOJI: Record<string, string> = {
  algerian: "🍽️", fast_food: "🍔", pizzeria: "🍕",
  cafe: "☕", grills: "🔥", seafood: "🐟", other: "🍴",
};

const getRestaurant = cache(async (slug: string) =>
  prisma.restaurant.findFirst({
    where: { slug, isPublic: true, status: "ACTIVE" },
    select: {
      id: true, name: true, slug: true, logoUrl: true,
      coverImageUrl: true, publicDescription: true,
      city: true, restaurantType: true, isFeatured: true,
      phone: true, address: true,
      categories: {
        select: {
          id: true, name: true, imageUrl: true,
          menuItems: {
            where: { isAvailable: true },
            select: { id: true, name: true, description: true, price: true, imageUrl: true },
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
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

export default async function RestaurantDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);
  if (!restaurant) notFound();

  const typeLabel  = restaurant.restaurantType ? TYPE_LABELS[restaurant.restaurantType]  : null;
  const typeEmoji  = restaurant.restaurantType ? TYPE_EMOJI[restaurant.restaurantType]   : "🍴";
  const totalItems = restaurant.categories.reduce((s, c) => s + c.menuItems.length, 0);

  return (
    <div className="min-h-screen bg-gray-50 pt-16">

      {/* ── Cover image ─────────────────────── */}
      <div className="relative h-60 md:h-80 bg-gray-900 overflow-hidden">
        {restaurant.coverImageUrl ? (
          <Image
            src={restaurant.coverImageUrl}
            alt={restaurant.name}
            fill priority sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50">
            <span className="text-8xl opacity-20">{typeEmoji}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Back button */}
        <Link
          href="/restaurants"
          className="absolute top-5 left-5 flex items-center gap-2 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white text-sm font-semibold px-3 py-2 rounded-full transition-all border border-white/20"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour
        </Link>

        {/* Title overlay on cover */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
          <div className="flex items-end gap-4 max-w-4xl mx-auto">
            {/* Logo */}
            <div className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-white">
              {restaurant.logoUrl ? (
                <Image src={restaurant.logoUrl} alt={`Logo ${restaurant.name}`} width={80} height={80} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full bg-orange-50 flex items-center justify-center">
                  <span className="text-2xl">{typeEmoji}</span>
                </div>
              )}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">{restaurant.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {typeLabel && (
                  <span className="text-xs bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full font-semibold border border-white/20">
                    {typeEmoji} {typeLabel}
                  </span>
                )}
                {restaurant.isFeatured && (
                  <span className="text-xs bg-amber-400/90 text-amber-900 px-2.5 py-1 rounded-full font-bold">
                    ⭐ À la une
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────── */}
      <div className="max-w-4xl mx-auto px-5 pt-5 pb-16">

        {/* Info card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 space-y-3">
              {restaurant.publicDescription && (
                <p className="text-gray-600 text-sm leading-relaxed">{restaurant.publicDescription}</p>
              )}

              <div className="flex flex-wrap gap-4">
                {restaurant.city && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                    {restaurant.city}
                    {restaurant.address && ` — ${restaurant.address}`}
                  </div>
                )}
                {restaurant.phone && (
                  <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors">
                    <Phone className="w-4 h-4 shrink-0" />
                    {restaurant.phone}
                  </a>
                )}
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex gap-3 shrink-0">
              <div className="text-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <p className="text-xl font-black text-gray-900">{restaurant.categories.length}</p>
                <p className="text-xs text-gray-500 mt-0.5">Catégories</p>
              </div>
              <div className="text-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <p className="text-xl font-black text-gray-900">{totalItems}</p>
                <p className="text-xs text-gray-500 mt-0.5">Articles</p>
              </div>
              <div className="text-center bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
                <div className="flex items-center justify-center gap-0.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <p className="text-xl font-black text-gray-900">4.8</p>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Note</p>
              </div>
            </div>
          </div>
        </div>

        {/* Branches */}
        {restaurant.branches.length > 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-gray-400" />
              Nos établissements
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {restaurant.branches.map((branch) => (
                <div key={branch.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                  <p className="font-bold text-sm text-gray-900">{branch.name}</p>
                  {branch.address && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{branch.address}
                    </p>
                  )}
                  {branch.phone && (
                    <a href={`tel:${branch.phone}`} className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />{branch.phone}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu */}
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

        {/* Footer nav */}
        <div className="mt-10 text-center">
          <Link
            href="/restaurants"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 font-semibold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voir tous les restaurants
          </Link>
        </div>
      </div>
    </div>
  );
}
