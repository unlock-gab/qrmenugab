import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import {
  QrCode, ChefHat, Zap, BarChart3, Smartphone, Users,
  Check, ArrowRight, Bell, MapPin, Search
} from "lucide-react";

export const revalidate = 300;
export const metadata = { title: "QRMenu — Commande QR pour Restaurants & Cafés en Algérie" };

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) {
    const role = (session.user as any).role;
    if (role === "PLATFORM_ADMIN") redirect("/admin/dashboard");
    else redirect("/merchant/dashboard");
  }

  const featuredRestaurants = await prisma.restaurant.findMany({
    where: { status: "ACTIVE", isPublic: true },
    select: {
      id: true, name: true, slug: true, logoUrl: true,
      coverImageUrl: true, publicDescription: true,
      city: true, restaurantType: true, isFeatured: true,
    },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    take: 8,
  });

  return (
    <div>
      {/* Search bar pinned just below fixed navbar */}
      <SearchBar />

      {/* Hero banner — full-width photo */}
      <HeroBanner />

      {/* Featured restaurants */}
      <PopularSection restaurants={featuredRestaurants} />

      {/* Categories */}
      <CategoriesSection />

      {/* Features */}
      <FeaturesSection />

      {/* Pricing teaser */}
      <PricingTeaser />

      {/* Final CTA */}
      <CtaBanner />
    </div>
  );
}

type PublicRestaurant = {
  id: string; name: string; slug: string; logoUrl: string | null;
  coverImageUrl: string | null; publicDescription: string | null;
  city: string | null; restaurantType: string | null; isFeatured: boolean;
};

const TYPE_LABELS: Record<string, string> = {
  algerian: "Cuisine algérienne", fast_food: "Fast-food", pizzeria: "Pizzeria",
  cafe: "Café", grills: "Grillades", seafood: "Fruits de mer", other: "Autre",
};

/* ─────────────────────────────────────────────
   SEARCH BAR — sits just below fixed navbar
───────────────────────────────────────────── */
function SearchBar() {
  return (
    <div className="bg-white border-b border-gray-100 py-3 px-5">
      <form
        action="/restaurants"
        method="get"
        className="max-w-2xl mx-auto flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition-all"
      >
        <Search className="w-5 h-5 text-gray-400 shrink-0" />
        <input
          name="q"
          type="text"
          placeholder="Rechercher un restaurant ou café..."
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
        />
        <button
          type="submit"
          className="w-8 h-8 bg-violet-600 hover:bg-violet-700 rounded-full flex items-center justify-center transition-colors shrink-0"
          aria-label="Rechercher"
        >
          <Search className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HERO BANNER — full-width photo with overlay
───────────────────────────────────────────── */
function HeroBanner() {
  return (
    <section className="relative w-full h-[420px] md:h-[500px] overflow-hidden bg-gray-900">
      <Image
        src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80"
        alt="Restaurant"
        fill
        className="object-cover opacity-70"
        priority
        sizes="100vw"
      />
      {/* gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/40 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 max-w-4xl">
        {/* inline brand badge */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-base">Q</span>
          </div>
          <span className="text-white font-black text-2xl tracking-tight">QRMenu</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
          Menu Digital<br />Moderne
        </h1>

        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold border-2 border-white/70 px-8 py-3.5 rounded-full text-base transition-all backdrop-blur-sm w-fit"
        >
          Créer mon menu
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   POPULAR RESTAURANTS — horizontal scroll cards
   with "Populaire ce mois" badges (TableBeep style)
───────────────────────────────────────────── */
function PopularSection({ restaurants }: { restaurants: PublicRestaurant[] }) {
  const hasRestaurants = restaurants.length > 0;
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-5">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900">Top Établissements du Mois</h2>
          <p className="text-gray-500 text-sm mt-1">Destinations populaires pour les amateurs de café & restaurant</p>
        </div>

        {hasRestaurants ? (
          /* Horizontal scrolling row */
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
            {restaurants.map((r) => (
              <Link
                key={r.id}
                href={`/restaurants/${r.slug}`}
                className="group shrink-0 w-64 snap-start"
              >
                <div className="relative h-52 rounded-2xl overflow-hidden bg-gray-100">
                  {r.coverImageUrl ? (
                    <Image
                      src={r.coverImageUrl}
                      alt={r.name}
                      fill
                      sizes="256px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-100">
                      <span className="text-5xl opacity-30">🍽️</span>
                    </div>
                  )}
                  {/* "Populaire ce mois" badge — always shown like TableBeep */}
                  <div className="absolute top-3 right-3 bg-violet-600/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Populaire ce mois
                  </div>
                </div>
                <div className="mt-3 px-1">
                  <h3 className="font-bold text-gray-900 text-sm group-hover:text-violet-600 transition-colors truncate">
                    {r.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    {r.city && (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />{r.city}
                      </span>
                    )}
                    {r.restaurantType && TYPE_LABELS[r.restaurantType] && (
                      <span className="text-xs text-gray-400">· {TYPE_LABELS[r.restaurantType]}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty state — show placeholder cards */
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="shrink-0 w-64">
                <div className="relative h-52 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-50 to-purple-100">
                  <div className="absolute top-3 right-3 bg-violet-600/90 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Populaire ce mois
                  </div>
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl opacity-20">🍽️</span>
                  </div>
                </div>
                <div className="mt-3 px-1">
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/restaurants"
            className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 text-sm font-semibold transition-colors"
          >
            Voir tous les établissements <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function CategoriesSection() {
  const categories = [
    { emoji: "☕", label: "Cafétérias", type: "cafe" },
    { emoji: "🍽️", label: "Restaurants", type: "algerian" },
    { emoji: "🍔", label: "Fast-food", type: "fast_food" },
    { emoji: "🍕", label: "Pizzerias", type: "pizzeria" },
    { emoji: "🔥", label: "Grillades", type: "grills" },
    { emoji: "🐟", label: "Fruits de mer", type: "seafood" },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-gray-900">Parcourir par catégorie</h2>
          <p className="text-gray-500 mt-1 text-sm">Trouvez le type d&apos;établissement qui vous convient</p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.type}
              href={`/restaurants?type=${cat.type}`}
              className="group flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-violet-50 group-hover:bg-violet-100 rounded-xl flex items-center justify-center text-2xl transition-colors">
                {cat.emoji}
              </div>
              <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    { icon: QrCode, title: "Commande QR à table", desc: "Vos clients scannent le QR code et commandent directement depuis leur téléphone. Aucune application à télécharger.", color: "bg-violet-50 text-violet-600" },
    { icon: BarChart3, title: "Tableau de bord en temps réel", desc: "Voyez chaque commande en direct. Acceptez, préparez et marquez les commandes prêtes depuis une interface claire.", color: "bg-blue-50 text-blue-600" },
    { icon: ChefHat, title: "Gestion du menu", desc: "Créez et organisez votre menu digital avec catégories, photos, prix et disponibilités.", color: "bg-green-50 text-green-600" },
    { icon: Bell, title: "Alertes instantanées", desc: "Recevez un signal sonore dès l'arrivée d'une nouvelle commande. Ne ratez plus jamais une table.", color: "bg-purple-50 text-purple-600" },
    { icon: Smartphone, title: "Expérience mobile client", desc: "Vos clients bénéficient d'une belle expérience de menu, optimisée pour tous les téléphones.", color: "bg-amber-50 text-amber-600" },
    { icon: Users, title: "Gestion du personnel", desc: "Gérez vos serveurs, cuisiniers et caissiers. Accès par rôle, adapté à chaque poste.", color: "bg-rose-50 text-rose-600" },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Zap className="w-3 h-3" /> Tout ce dont vous avez besoin
          </div>
          <h2 className="text-4xl font-black text-gray-900 mb-4">Conçu pour les vrais restaurants</h2>
          <p className="text-xl text-gray-500 max-w-xl mx-auto">Des cafés aux grands restaurants — chaque fonctionnalité est pensée pour gagner du temps et augmenter les commandes.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="group bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-xl hover:shadow-gray-100 hover:-translate-y-1 transition-all duration-300">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${f.color}`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link href="/features" className="inline-flex items-center gap-2 text-violet-600 font-semibold hover:text-violet-700 transition-colors">
            Voir toutes les fonctionnalités <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PricingTeaser() {
  const plans = [
    { name: "Starter", price: "2 900 DA", period: "/mois", tables: "10 tables", items: "50 articles menu", staff: "2 comptes personnel", featured: false },
    { name: "Croissance", price: "6 900 DA", period: "/mois", tables: "30 tables", items: "150 articles menu", staff: "5 comptes personnel", featured: true },
    { name: "Pro", price: "14 900 DA", period: "/mois", tables: "100 tables", items: "500 articles menu", staff: "20 comptes personnel", featured: false },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-gray-950 to-gray-900">
      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-violet-500/20 text-violet-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            Tarification simple
          </div>
          <h2 className="text-4xl font-black text-white mb-4">Payez selon votre usage</h2>
          <p className="text-gray-400 text-xl">Commencez avec 14 jours d&apos;essai gratuit. Sans carte bancaire.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {plans.map((p) => (
            <div key={p.name} className={`rounded-2xl p-7 relative ${p.featured ? "bg-violet-600 shadow-2xl shadow-violet-600/30 scale-105" : "bg-white/5 border border-white/10"}`}>
              {p.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-300 text-violet-900 text-xs font-black px-3 py-1 rounded-full">Le plus populaire</div>}
              <p className={`text-sm font-semibold mb-2 ${p.featured ? "text-violet-100" : "text-gray-400"}`}>{p.name}</p>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-3xl font-black text-white">{p.price}</span>
                <span className={`text-sm mb-1 ${p.featured ? "text-violet-200" : "text-gray-500"}`}>{p.period}</span>
              </div>
              <div className={`space-y-2.5 mb-7 text-sm ${p.featured ? "text-violet-100" : "text-gray-400"}`}>
                {[p.tables, p.items, p.staff].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/signup" className={`block text-center py-3 rounded-xl font-bold text-sm transition-all ${p.featured ? "bg-white text-violet-600 hover:bg-violet-50" : "bg-white/10 text-white hover:bg-white/20"}`}>
                Commencer l&apos;essai gratuit
              </Link>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link href="/pricing" className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-semibold transition-colors">
            Voir les tarifs complets <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="py-24 bg-gradient-to-br from-violet-600 to-purple-700">
      <div className="max-w-4xl mx-auto px-5 text-center">
        <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
          <QrCode className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-4xl lg:text-5xl font-black text-white mb-5">
          Prêt à moderniser votre restaurant ?
        </h2>
        <p className="text-xl text-violet-100 mb-10 max-w-xl mx-auto leading-relaxed">
          Rejoignez des centaines de restaurants qui utilisent déjà QRMenu pour servir plus vite, gagner plus et fidéliser leurs clients.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-white text-violet-600 font-bold px-10 py-4 rounded-full text-lg hover:bg-violet-50 transition-all shadow-xl">
            Démarrer l&apos;essai gratuit — 14 jours
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-full text-lg hover:bg-white/30 transition-all border border-white/30">
            Demander une démo
          </Link>
        </div>
        <p className="text-violet-200 text-sm mt-6">Sans carte bancaire · Résiliable à tout moment · Mise en place en quelques minutes</p>
      </div>
    </section>
  );
}
