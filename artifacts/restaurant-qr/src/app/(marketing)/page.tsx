import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import {
  QrCode, ChefHat, Zap, BarChart3, Smartphone, Users,
  Star, Check, ArrowRight, Bell, Settings, MapPin, Utensils
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
    take: 6,
  });

  return (
    <div className="overflow-hidden">
      <HeroSection />
      <TrustBar />
      {featuredRestaurants.length > 0 && (
        <FeaturedRestaurantsSection restaurants={featuredRestaurants} />
      )}
      <CategoriesSection />
      <FeaturesSection />
      <HowItWorksSection />
      <BenefitsSection />
      <PricingTeaser />
      <TestimonialsSection />
      <FaqTeaser />
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

function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-gray-50 via-white to-orange-50/30 pt-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-[-100px] w-[500px] h-[500px] bg-orange-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-[-50px] left-[-50px] w-[300px] h-[300px] bg-amber-100/30 rounded-full blur-2xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-5 py-20 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3 h-3" />
            Aucun matériel requis — fonctionne sur tous les appareils
          </div>

          <h1 className="text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
            Découvrez les meilleurs
            <span className="block text-orange-500">cafés & restaurants</span>
          </h1>

          <p className="text-xl text-gray-600 leading-relaxed mb-8 max-w-lg">
            Commandez facilement depuis votre table, gérez votre restaurant intelligemment. 
            La plateforme QR pour tous les établissements d&apos;Algérie.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/restaurants" className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all shadow-xl shadow-orange-200 hover:shadow-orange-300 hover:-translate-y-0.5">
              Explorer les établissements
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-8 py-4 rounded-2xl text-lg border border-gray-200 transition-all hover:-translate-y-0.5">
              Gérer mon restaurant
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            {["Sans carte bancaire", "Essai 14 jours gratuit", "Résiliable à tout moment"].map((t) => (
              <div key={t} className="flex items-center gap-2 text-sm text-gray-500">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="relative bg-white rounded-3xl shadow-2xl shadow-gray-200/60 p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-gray-400 font-medium">Tableau de bord Marchand</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Nouvelles commandes", val: "12", color: "bg-orange-50 text-orange-600 border-orange-100" },
                { label: "Chiffre du jour", val: "8 500 DA", color: "bg-green-50 text-green-600 border-green-100" },
                { label: "Tables actives", val: "8/15", color: "bg-blue-50 text-blue-600 border-blue-100" },
                { label: "Temps moy. commande", val: "6 min", color: "bg-purple-50 text-purple-600 border-purple-100" },
              ].map((card) => (
                <div key={card.label} className={`rounded-2xl border p-4 ${card.color}`}>
                  <p className="text-xs font-medium opacity-70">{card.label}</p>
                  <p className="text-2xl font-black mt-1">{card.val}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">Commandes récentes</p>
              {[
                { table: "Table 3", item: "Café, Croissant", status: "NOUVEAU", statusColor: "bg-orange-100 text-orange-700" },
                { table: "Table 7", item: "Burger, Frites, Jus", status: "PRÊT", statusColor: "bg-green-100 text-green-700" },
                { table: "Table 1", item: "Pizza, Salade", status: "EN COURS", statusColor: "bg-blue-100 text-blue-700" },
              ].map((o, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{o.table}</p>
                    <p className="text-xs text-gray-400">{o.item}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${o.statusColor}`}>{o.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute -bottom-6 -left-8 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-52">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">Nouvelle commande !</p>
                <p className="text-xs text-gray-400">Table 5 vient de commander</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const stats = [
    { value: "500+", label: "Restaurants" },
    { value: "2M+", label: "Commandes traitées" },
    { value: "98%", label: "Disponibilité" },
    { value: "4.9★", label: "Note moyenne" },
  ];
  return (
    <div className="bg-gray-950 py-10">
      <div className="max-w-5xl mx-auto px-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-black text-white">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturedRestaurantsSection({ restaurants }: { restaurants: PublicRestaurant[] }) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
              🍽️ Restaurants & cafés partenaires
            </div>
            <h2 className="text-3xl font-black text-gray-900">
              Commandez maintenant
            </h2>
            <p className="text-gray-500 mt-1">Découvrez nos établissements disponibles en ligne</p>
          </div>
          <Link
            href="/restaurants"
            className="hidden md:flex items-center gap-2 text-orange-600 hover:text-orange-700 text-sm font-semibold"
          >
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((r) => (
            <Link
              key={r.id}
              href={`/restaurants/${r.slug}`}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:border-orange-200 transition-all"
            >
              <div className="relative h-40 bg-gradient-to-br from-orange-100 to-amber-50 overflow-hidden">
                {r.coverImageUrl ? (
                  <Image src={r.coverImageUrl} alt={r.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl opacity-25">🍽️</span>
                  </div>
                )}
                {r.isFeatured && (
                  <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">⭐ À la une</div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{r.name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {r.city && <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{r.city}</span>}
                  {r.restaurantType && TYPE_LABELS[r.restaurantType] && (
                    <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                      {TYPE_LABELS[r.restaurantType]}
                    </span>
                  )}
                </div>
                {r.publicDescription && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{r.publicDescription}</p>
                )}
                <p className="text-xs text-orange-600 font-semibold mt-2 group-hover:underline">Voir le menu →</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Link href="/restaurants" className="inline-flex items-center gap-2 text-orange-600 font-semibold text-sm">
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
              className="group flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-orange-50 group-hover:bg-orange-100 rounded-xl flex items-center justify-center text-2xl transition-colors">
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
    { icon: QrCode, title: "Commande QR à table", desc: "Vos clients scannent le QR code et commandent directement depuis leur téléphone. Aucune application à télécharger.", color: "bg-orange-50 text-orange-600" },
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
          <Link href="/features" className="inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors">
            Voir toutes les fonctionnalités <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { num: "01", title: "Inscription en quelques minutes", desc: "Créez votre compte, configurez votre restaurant et uploadez votre menu. Aucune compétence technique requise." },
    { num: "02", title: "Imprimez vos QR codes", desc: "Générez des QR codes uniques pour chaque table. Imprimez ou affichez-les — vos clients sont prêts à scanner." },
    { num: "03", title: "Les clients scannent et commandent", desc: "Vos clients scannent le QR, parcourent le menu et passent commande depuis leur téléphone. Sans attente." },
    { num: "04", title: "Gérez tout en direct", desc: "Les commandes apparaissent instantanément dans votre tableau de bord. Mettez à jour les statuts et suivez vos revenus." },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Check className="w-3 h-3" /> Mise en place en 15 minutes
          </div>
          <h2 className="text-4xl font-black text-gray-900 mb-4">Opérationnel en 4 étapes</h2>
          <p className="text-xl text-gray-500">Pas besoin d&apos;informaticien. Pas de long contrat. Juste un restaurant plus intelligent.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.num} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(100%-8px)] w-full h-0.5 bg-gradient-to-r from-orange-200 to-transparent z-0" />
              )}
              <div className="relative z-10 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="text-4xl font-black text-orange-100 mb-3">{s.num}</div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link href="/how-it-works" className="inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors">
            En savoir plus <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <ChefHat className="w-3 h-3" /> Pour les restaurateurs
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-6">Gérez plus vite, plus intelligemment</h2>
            <div className="space-y-5">
              {[
                "Réduisez les erreurs de commande dues à la communication",
                "Libérez votre personnel pour la qualité de service",
                "Suivez vos revenus et analyses en temps réel",
                "Gérez votre menu instantanément depuis n'importe quel appareil",
                "Développez sans embaucher plus de serveurs",
                "Expérience client professionnelle dès le premier jour",
              ].map((b) => (
                <div key={b} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <p className="text-gray-700">{b}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Smartphone className="w-3 h-3" /> Pour vos clients
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-6">Une expérience mémorable</h2>
            <div className="space-y-5">
              {[
                "Commander instantanément — sans attendre le serveur",
                "Parcourir le menu complet avec photos et descriptions",
                "Ajouter des articles et suivre l'état de la commande",
                "Aucune application à télécharger — scanner et commander",
                "Menu clair et beau sur tous les smartphones",
                "Un service plus rapide pour une meilleure expérience globale",
              ].map((b) => (
                <div key={b} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <p className="text-gray-700">{b}</p>
                </div>
              ))}
            </div>
          </div>
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
          <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            Tarification simple
          </div>
          <h2 className="text-4xl font-black text-white mb-4">Payez selon votre usage</h2>
          <p className="text-gray-400 text-xl">Commencez avec 14 jours d&apos;essai gratuit. Sans carte bancaire.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {plans.map((p) => (
            <div key={p.name} className={`rounded-2xl p-7 relative ${p.featured ? "bg-orange-500 shadow-2xl shadow-orange-500/30 scale-105" : "bg-white/5 border border-white/10"}`}>
              {p.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-black px-3 py-1 rounded-full">Le plus populaire</div>}
              <p className={`text-sm font-semibold mb-2 ${p.featured ? "text-orange-100" : "text-gray-400"}`}>{p.name}</p>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-3xl font-black text-white">{p.price}</span>
                <span className={`text-sm mb-1 ${p.featured ? "text-orange-200" : "text-gray-500"}`}>{p.period}</span>
              </div>
              <div className={`space-y-2.5 mb-7 text-sm ${p.featured ? "text-orange-100" : "text-gray-400"}`}>
                {[p.tables, p.items, p.staff].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/signup" className={`block text-center py-3 rounded-xl font-bold text-sm transition-all ${p.featured ? "bg-white text-orange-600 hover:bg-orange-50" : "bg-white/10 text-white hover:bg-white/20"}`}>
                Commencer l&apos;essai gratuit
              </Link>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link href="/pricing" className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 font-semibold transition-colors">
            Voir les tarifs complets <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    { name: "Karim B.", role: "Propriétaire, Café Atlas, Alger", text: "Nous avons réduit nos erreurs de commande de 80% et nos tables tournent 30% plus vite. Nos clients adorent scanner le QR.", stars: 5 },
    { name: "Fatima Z.", role: "Gérante, Restaurant Baya, Oran", text: "La mise en place a été incroyablement facile. En une après-midi, toutes nos tables avaient des QR codes et nous étions en ligne.", stars: 5 },
    { name: "Mohamed A.", role: "Propriétaire, Pizzeria Le Gourmet, Constantine", text: "Le tableau de bord en direct garde tout sous contrôle pendant les heures de pointe. C'est comme avoir un membre du personnel en plus.", stars: 5 },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Star className="w-3 h-3 fill-amber-500" /> Approuvé par les restaurateurs
          </div>
          <h2 className="text-4xl font-black text-gray-900 mb-4">De vrais résultats, de vrais restaurants</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-gray-50 rounded-2xl p-7 hover:bg-orange-50/30 transition-colors">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-6 text-sm">&ldquo;{t.text}&rdquo;</p>
              <div>
                <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                <p className="text-xs text-gray-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqTeaser() {
  const faqs = [
    { q: "Mes clients doivent-ils télécharger une application ?", a: "Non. Les clients scannent le QR code et le menu s'ouvre directement dans leur navigateur. Zéro friction, zéro téléchargement." },
    { q: "Combien de temps prend la mise en place ?", a: "La plupart des restaurants sont opérationnels en 15 à 30 minutes. Menu, tables et QR codes configurés le même jour." },
    { q: "Puis-je essayer avant de payer ?", a: "Oui. Chaque plan commence avec 14 jours d'essai gratuit. Aucune carte bancaire requise pour démarrer." },
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-3xl mx-auto px-5">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black text-gray-900 mb-4">Questions fréquentes</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="bg-white rounded-2xl p-7 border border-gray-100">
              <p className="font-bold text-gray-900 mb-3">{f.q}</p>
              <p className="text-gray-600 text-sm leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/faq" className="inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors">
            Voir toutes les questions <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="py-24 bg-gradient-to-br from-orange-500 to-amber-500">
      <div className="max-w-4xl mx-auto px-5 text-center">
        <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
          <QrCode className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-4xl lg:text-5xl font-black text-white mb-5">
          Prêt à moderniser votre restaurant ?
        </h2>
        <p className="text-xl text-orange-100 mb-10 max-w-xl mx-auto leading-relaxed">
          Rejoignez des centaines de restaurants qui utilisent déjà QRMenu pour servir plus vite, gagner plus et fidéliser leurs clients.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 font-bold px-10 py-4 rounded-2xl text-lg hover:bg-orange-50 transition-all shadow-xl">
            Démarrer l&apos;essai gratuit — 14 jours
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-2xl text-lg hover:bg-white/30 transition-all border border-white/30">
            Demander une démo
          </Link>
        </div>
        <p className="text-orange-200 text-sm mt-6">Sans carte bancaire · Résiliable à tout moment · Mise en place en quelques minutes</p>
      </div>
    </section>
  );
}
