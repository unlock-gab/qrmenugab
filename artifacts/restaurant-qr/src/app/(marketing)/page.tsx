import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import {
  QrCode, ChefHat, Zap, BarChart3, Smartphone, Users,
  Check, ArrowRight, Bell, MapPin, Search, Star,
  TrendingUp, Clock, Shield,
} from "lucide-react";

export const revalidate = 300;
export const metadata = { title: "QRMenu — Commande QR pour Restaurants & Cafés en Algérie" };

export default async function HomePage() {
  try {
    const session = await getServerSession(authOptions);
    if (session) {
      const role = (session.user as any).role;
      if (role === "PLATFORM_ADMIN") redirect("/admin/dashboard");
      else redirect("/merchant/dashboard");
    }
  } catch {}

  let featuredRestaurants: PublicRestaurant[] = [];
  try {
    featuredRestaurants = await prisma.restaurant.findMany({
      where: { status: "ACTIVE", isPublic: true },
      select: {
        id: true, name: true, slug: true, logoUrl: true,
        coverImageUrl: true, publicDescription: true,
        city: true, restaurantType: true, isFeatured: true,
      },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
      take: 8,
    });
  } catch {}

  return (
    <div>
      <HeroBanner />
      <StatsBar />
      <SearchSection />
      <PopularSection restaurants={featuredRestaurants} />
      <CategoriesSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingTeaser />
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
   HERO BANNER — full-bleed with gradient overlay
───────────────────────────────────────────── */
function HeroBanner() {
  return (
    <section className="relative w-full min-h-[540px] md:min-h-[620px] overflow-hidden bg-gray-950">
      <Image
        src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85"
        alt="Restaurant moderne"
        fill
        className="object-cover opacity-50"
        priority
        sizes="100vw"
      />
      {/* Deep gradient — left focus */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-950/95 via-gray-950/70 to-gray-950/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 via-transparent to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 h-full flex flex-col justify-center py-20 md:py-28">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-semibold px-4 py-2 rounded-full mb-6 w-fit backdrop-blur-sm">
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse-dot" />
          🇩🇿 La solution QR Menu N°1 en Algérie
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.08] mb-6 max-w-2xl">
          Votre Menu<br />
          <span className="gradient-text">Digital & Moderne</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-300 max-w-xl leading-relaxed mb-8">
          Vos clients scannent, commandent et paient depuis leur téléphone.
          Sans application. En quelques secondes.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-4 rounded-full text-base transition-all shadow-2xl shadow-violet-900/50 hover:-translate-y-0.5 active:translate-y-0"
          >
            Démarrer gratuitement — 14 jours
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center justify-center gap-2 glass-dark hover:bg-white/20 text-white font-semibold px-7 py-4 rounded-full text-base transition-all border border-white/20"
          >
            Voir comment ça marche
          </Link>
        </div>

        {/* Social proof */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
              "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
              "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
              "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
            ].map((src, i) => (
              <div key={i} className="relative w-9 h-9 rounded-full border-2 border-gray-900 overflow-hidden">
                <Image src={src} alt="" fill sizes="36px" className="object-cover" />
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-gray-400 text-xs mt-0.5">500+ restaurants nous font confiance</p>
          </div>
        </div>
      </div>

      {/* Floating card — desktop only */}
      <div className="hidden xl:block absolute right-16 top-1/2 -translate-y-1/2 animate-float">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 w-64 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-400/20 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white text-sm font-bold">Nouvelle commande !</p>
              <p className="text-gray-400 text-xs">Table 4 — il y a 2 secondes</p>
            </div>
          </div>
          <div className="space-y-2">
            {["Tagine poulet — ×2", "Salade fraîche — ×1", "Café express — ×3"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                <span className="text-gray-300 text-xs">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-gray-400 text-xs">Total</span>
            <span className="text-white font-bold text-sm">2 450 DA</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   STATS BAR — key numbers
───────────────────────────────────────────── */
function StatsBar() {
  const stats = [
    { value: "500+",  label: "Restaurants actifs",  icon: "🏪" },
    { value: "50 000+", label: "Commandes traitées", icon: "📋" },
    { value: "4.8★",  label: "Note moyenne clients", icon: "⭐" },
    { value: "14 j",  label: "Essai gratuit offert", icon: "🎁" },
  ];
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-5 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.value} className="text-center">
              <div className="text-2xl md:text-3xl font-black text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SEARCH SECTION — find a restaurant
───────────────────────────────────────────── */
function SearchSection() {
  return (
    <div className="bg-gray-50 border-b border-gray-100 py-4 px-5">
      <form
        action="/restaurants"
        method="get"
        className="max-w-2xl mx-auto flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-3 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 shadow-sm transition-all"
      >
        <Search className="w-5 h-5 text-gray-400 shrink-0" />
        <input
          name="q"
          type="text"
          placeholder="Rechercher un restaurant, café..."
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
        />
        <button
          type="submit"
          className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-5 py-2 rounded-full transition-colors shrink-0"
        >
          Rechercher
        </button>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────────
   POPULAR RESTAURANTS — horizontal scroll cards
───────────────────────────────────────────── */
function PopularSection({ restaurants }: { restaurants: PublicRestaurant[] }) {
  if (restaurants.length === 0) return null;
  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-5">
        <div className="flex items-end justify-between mb-7">
          <div>
            <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-1">Ce mois</p>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">Top Établissements</h2>
          </div>
          <Link
            href="/restaurants"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors"
          >
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {restaurants.map((r) => (
            <Link
              key={r.id}
              href={`/restaurants/${r.slug}`}
              className="group shrink-0 w-60 snap-start"
            >
              <div className="relative h-48 rounded-2xl overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-lg transition-shadow duration-300">
                {r.coverImageUrl ? (
                  <Image
                    src={r.coverImageUrl}
                    alt={r.name}
                    fill
                    sizes="240px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-100">
                    <span className="text-5xl opacity-30">🍽️</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-violet-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-violet-100">
                  ★ Populaire
                </div>
                {r.restaurantType && TYPE_LABELS[r.restaurantType] && (
                  <div className="absolute bottom-3 left-3">
                    <span className="text-white text-[11px] font-semibold bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      {TYPE_LABELS[r.restaurantType]}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-3 px-1">
                <h3 className="font-bold text-gray-900 text-sm group-hover:text-violet-600 transition-colors truncate">
                  {r.name}
                </h3>
                {r.city && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />{r.city}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="sm:hidden mt-5 text-center">
          <Link href="/restaurants" className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600">
            Voir tous les établissements <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   CATEGORIES SECTION
───────────────────────────────────────────── */
function CategoriesSection() {
  const categories = [
    { emoji: "☕", label: "Cafétérias",    type: "cafe",     gradient: "from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100" },
    { emoji: "🍽️", label: "Restaurants",  type: "algerian", gradient: "from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100" },
    { emoji: "🍔", label: "Fast-food",    type: "fast_food", gradient: "from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100" },
    { emoji: "🍕", label: "Pizzerias",    type: "pizzeria",  gradient: "from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100" },
    { emoji: "🔥", label: "Grillades",    type: "grills",    gradient: "from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100" },
    { emoji: "🐟", label: "Fruits de mer", type: "seafood",  gradient: "from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100" },
  ];

  return (
    <section className="py-14 bg-gray-50">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-9">
          <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2">Catégories</p>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">Parcourir par type</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.type}
              href={`/restaurants?type=${cat.type}`}
              className={`group flex flex-col items-center gap-3 p-4 bg-gradient-to-br ${cat.gradient} rounded-2xl border border-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
            >
              <div className="text-3xl group-hover:scale-110 transition-transform duration-200">
                {cat.emoji}
              </div>
              <span className="text-xs font-bold text-gray-700 text-center leading-tight">{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   HOW IT WORKS — 3 steps
───────────────────────────────────────────── */
function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Créez votre menu",
      desc: "Ajoutez vos catégories, plats, photos et prix en quelques minutes depuis votre tableau de bord.",
      icon: ChefHat,
      color: "bg-violet-600",
      bg: "bg-violet-50",
    },
    {
      step: "02",
      title: "Générez vos QR codes",
      desc: "Imprimez un QR code par table. Vos clients scannent et voient votre menu immédiatement, sans rien télécharger.",
      icon: QrCode,
      color: "bg-blue-600",
      bg: "bg-blue-50",
    },
    {
      step: "03",
      title: "Recevez les commandes",
      desc: "Les commandes arrivent en temps réel sur votre tableau de bord. Gérez cuisine, service et caisse depuis une seule interface.",
      icon: BarChart3,
      color: "bg-green-600",
      bg: "bg-green-50",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center mb-14">
          <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2">Simple & rapide</p>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
            Opérationnel en moins d&apos;une heure
          </h2>
          <p className="text-gray-500 text-lg max-w-lg mx-auto">
            Pas de technique compliquée. Commencez aujourd&apos;hui.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={s.step} className="relative flex flex-col items-center text-center group">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] right-0 w-[calc(100%-80px)] h-px bg-gradient-to-r from-gray-200 to-gray-100 z-0" />
              )}
              <div className={`relative z-10 w-20 h-20 ${s.bg} rounded-3xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300 shadow-sm`}>
                <s.icon className={`w-9 h-9 ${s.color === "bg-violet-600" ? "text-violet-600" : s.color === "bg-blue-600" ? "text-blue-600" : "text-green-600"}`} />
                <div className={`absolute -top-2 -right-2 w-6 h-6 ${s.color} text-white text-[10px] font-black rounded-full flex items-center justify-center`}>
                  {i + 1}
                </div>
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-violet-600 font-semibold hover:text-violet-700 transition-colors"
          >
            En savoir plus <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   FEATURES SECTION — 6-grid
───────────────────────────────────────────── */
function FeaturesSection() {
  const features = [
    {
      icon: QrCode, title: "Commande QR à table",
      desc: "Vos clients scannent et commandent directement. Aucune application à télécharger.",
      iconBg: "bg-violet-100", iconColor: "text-violet-600",
    },
    {
      icon: BarChart3, title: "Tableau de bord temps réel",
      desc: "Chaque commande visible en direct. Acceptez et gérez depuis une interface claire.",
      iconBg: "bg-blue-100", iconColor: "text-blue-600",
    },
    {
      icon: ChefHat, title: "Gestion du menu",
      desc: "Catégories, photos, prix, disponibilités — tout modifiable en temps réel.",
      iconBg: "bg-emerald-100", iconColor: "text-emerald-600",
    },
    {
      icon: Bell, title: "Alertes instantanées",
      desc: "Signal sonore à chaque nouvelle commande. Ne ratez plus jamais une table.",
      iconBg: "bg-purple-100", iconColor: "text-purple-600",
    },
    {
      icon: Smartphone, title: "Expérience client mobile",
      desc: "Interface optimisée pour tous les téléphones. Belle, rapide et intuitive.",
      iconBg: "bg-amber-100", iconColor: "text-amber-600",
    },
    {
      icon: Users, title: "Gestion du personnel",
      desc: "Serveurs, cuisiniers, caissiers — accès par rôle adapté à chaque poste.",
      iconBg: "bg-rose-100", iconColor: "text-rose-600",
    },
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-bold px-4 py-2 rounded-full mb-4">
            <Zap className="w-3.5 h-3.5" /> Tout ce dont vous avez besoin
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
            Conçu pour les vrais restaurants
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Des cafés aux grands restaurants — chaque fonctionnalité est pensée
            pour gagner du temps et augmenter vos commandes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="group bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-xl hover:shadow-gray-100 hover:-translate-y-1 hover:border-gray-200 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${f.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                <f.icon className={`w-6 h-6 ${f.iconColor}`} />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/features"
            className="inline-flex items-center gap-2 text-violet-600 font-semibold hover:text-violet-700 transition-colors"
          >
            Toutes les fonctionnalités <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   TESTIMONIALS SECTION
───────────────────────────────────────────── */
function TestimonialsSection() {
  const testimonials = [
    {
      name: "Karim B.",
      role: "Propriétaire — Café Atlas, Alger",
      quote: "Depuis qu'on utilise QRMenu, nos clients passent leurs commandes eux-mêmes. On a réduit les erreurs de 80% et le service est deux fois plus rapide.",
      avatar: "K",
      color: "bg-violet-600",
      stars: 5,
    },
    {
      name: "Amira M.",
      role: "Gérante — Restaurant El Baraka, Oran",
      quote: "La mise en place a pris moins d'une heure. Le QR code, le menu, tout était prêt le soir même. Les clients adorent.",
      avatar: "A",
      color: "bg-blue-600",
      stars: 5,
    },
    {
      name: "Yacine T.",
      role: "Directeur — Pizzeria Napoli, Constantine",
      quote: "Le tableau de bord en temps réel est incroyable. Je vois chaque commande, chaque table, depuis mon téléphone. Parfait pour mon équipe.",
      avatar: "Y",
      color: "bg-emerald-600",
      stars: 5,
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-14">
          <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2">Témoignages</p>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
            Ils nous font confiance
          </h2>
          <p className="text-gray-500 text-lg">Des restaurants qui ont déjà transformé leur service.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-gray-50 border border-gray-100 rounded-2xl p-7 hover:shadow-lg hover:border-gray-200 transition-all duration-300">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-5 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${t.color} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   PRICING TEASER — dark bg
───────────────────────────────────────────── */
function PricingTeaser() {
  const plans = [
    {
      name: "Starter", price: "2 900 DA", period: "/mois",
      features: ["10 tables", "50 articles menu", "2 comptes personnel", "Commandes QR illimitées"],
      featured: false,
    },
    {
      name: "Croissance", price: "6 900 DA", period: "/mois",
      features: ["30 tables", "150 articles menu", "5 comptes personnel", "Réservations & rapports"],
      featured: true,
    },
    {
      name: "Pro", price: "14 900 DA", period: "/mois",
      features: ["100 tables", "500 articles menu", "20 comptes personnel", "Accès API & multi-sites"],
      featured: false,
    },
  ];

  return (
    <section className="py-24 bg-gray-950 relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/10 rounded-full blur-3xl" />

      <div className="relative max-w-5xl mx-auto px-5">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-violet-500/20 text-violet-400 text-xs font-semibold px-4 py-2 rounded-full mb-4 border border-violet-500/20">
            <TrendingUp className="w-3.5 h-3.5" /> Tarification transparente
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            Payez selon votre usage
          </h2>
          <p className="text-gray-400 text-xl">Commencez avec 14 jours d&apos;essai gratuit. Sans carte bancaire.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-7 relative transition-transform hover:-translate-y-1 ${
                p.featured
                  ? "bg-violet-600 shadow-2xl shadow-violet-600/30 scale-[1.03]"
                  : "bg-white/5 border border-white/10 hover:border-white/20"
              }`}
            >
              {p.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-400 text-gray-900 text-[11px] font-black px-4 py-1.5 rounded-full shadow-lg">
                  ⭐ Le plus populaire
                </div>
              )}
              <p className={`text-sm font-bold mb-2 ${p.featured ? "text-violet-200" : "text-gray-400"}`}>
                {p.name}
              </p>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-3xl font-black text-white">{p.price}</span>
                <span className={`text-sm mb-1 ${p.featured ? "text-violet-200" : "text-gray-500"}`}>
                  {p.period}
                </span>
              </div>
              <div className={`space-y-3 mb-7 text-sm ${p.featured ? "text-violet-100" : "text-gray-400"}`}>
                {p.features.map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${p.featured ? "bg-white/20" : "bg-white/10"}`}>
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    {f}
                  </div>
                ))}
              </div>
              <Link
                href="/signup"
                className={`block text-center py-3.5 rounded-xl font-bold text-sm transition-all ${
                  p.featured
                    ? "bg-white text-violet-600 hover:bg-violet-50 shadow-lg"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                }`}
              >
                Essai gratuit 14 jours
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-semibold transition-colors"
          >
            Voir les tarifs complets <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-6">
          {[
            { icon: Shield, label: "Paiement sécurisé" },
            { icon: Clock, label: "Résiliable à tout moment" },
            { icon: Zap, label: "Mise en place en 1h" },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-2 text-gray-500 text-sm">
              <b.icon className="w-4 h-4 text-gray-600" />
              {b.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   CTA BANNER — final conversion section
───────────────────────────────────────────── */
function CtaBanner() {
  return (
    <section className="py-24 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/3 translate-y-1/3 blur-xl" />

      <div className="relative max-w-4xl mx-auto px-5 text-center">
        <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/20">
          <QrCode className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-5 leading-tight">
          Prêt à moderniser<br />votre restaurant ?
        </h2>
        <p className="text-lg md:text-xl text-violet-100 mb-10 max-w-xl mx-auto leading-relaxed">
          Rejoignez 500+ restaurants qui servent plus vite, gagnent plus
          et fidélisent leurs clients avec QRMenu.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 bg-white text-violet-600 font-bold px-10 py-4 rounded-full text-lg hover:bg-violet-50 transition-all shadow-2xl hover:-translate-y-0.5 active:translate-y-0"
          >
            Démarrer l&apos;essai gratuit — 14 jours
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 bg-white/15 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-full text-lg hover:bg-white/25 transition-all border border-white/25"
          >
            Demander une démo
          </Link>
        </div>
        <p className="text-violet-200 text-sm mt-7 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Sans carte bancaire</span>
          <span className="w-1 h-1 bg-violet-300 rounded-full" />
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Résiliable à tout moment</span>
          <span className="w-1 h-1 bg-violet-300 rounded-full" />
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Support inclus</span>
        </p>
      </div>
    </section>
  );
}
