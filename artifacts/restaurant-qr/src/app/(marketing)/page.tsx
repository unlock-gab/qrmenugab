import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  QrCode, ChefHat, Zap, BarChart3, Smartphone, Users,
  Star, Check, ArrowRight, Wifi, Bell, Settings
} from "lucide-react";

export const metadata = { title: "QRMenu — Commande QR pour Restaurants en Algérie" };

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

function FeaturedRestaurantsSection({ restaurants }: { restaurants: PublicRestaurant[] }) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
              🍽️ Restaurants partenaires
            </div>
            <h2 className="text-3xl font-black text-gray-900">
              Commandez maintenant
            </h2>
            <p className="text-gray-500 mt-1">Découvrez nos restaurants disponibles en ligne</p>
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
                  <img src={r.coverImageUrl} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
                  {r.city && <span className="text-xs text-gray-500">📍 {r.city}</span>}
                  {r.restaurantType && TYPE_LABELS[r.restaurantType] && (
                    <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                      {TYPE_LABELS[r.restaurantType]}
                    </span>
                  )}
                </div>
                {r.publicDescription && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{r.publicDescription}</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Link
            href="/restaurants"
            className="inline-flex items-center gap-2 text-orange-600 font-semibold text-sm"
          >
            Voir tous les restaurants <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

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
            No hardware needed — works on any device
          </div>

          <h1 className="text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
            Smart QR Ordering
            <span className="block text-orange-500">for Modern Restaurants</span>
          </h1>

          <p className="text-xl text-gray-600 leading-relaxed mb-8 max-w-lg">
            Replace slow manual ordering with instant QR-powered table ordering. Your customers scan, order, and enjoy — while you manage everything live from your dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all shadow-xl shadow-orange-200 hover:shadow-orange-300 hover:-translate-y-0.5">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/how-it-works" className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-8 py-4 rounded-2xl text-lg border border-gray-200 transition-all hover:-translate-y-0.5">
              See How It Works
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-6">
            {["No credit card required", "14-day free trial", "Cancel anytime"].map((t) => (
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
              <span className="ml-3 text-xs text-gray-400 font-medium">Merchant Dashboard</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "New Orders", val: "12", color: "bg-orange-50 text-orange-600 border-orange-100" },
                { label: "Revenue Today", val: "$847", color: "bg-green-50 text-green-600 border-green-100" },
                { label: "Active Tables", val: "8/15", color: "bg-blue-50 text-blue-600 border-blue-100" },
                { label: "Avg. Order Time", val: "6 min", color: "bg-purple-50 text-purple-600 border-purple-100" },
              ].map((card) => (
                <div key={card.label} className={`rounded-2xl border p-4 ${card.color}`}>
                  <p className="text-xs font-medium opacity-70">{card.label}</p>
                  <p className="text-2xl font-black mt-1">{card.val}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">Recent Orders</p>
              {[
                { table: "Table 3", item: "Cappuccino, Croissant", status: "NEW", statusColor: "bg-orange-100 text-orange-700" },
                { table: "Table 7", item: "Burger, Fries, Lemonade", status: "READY", statusColor: "bg-green-100 text-green-700" },
                { table: "Table 1", item: "Pasta, Tiramisu", status: "PREPARING", statusColor: "bg-blue-100 text-blue-700" },
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
                <p className="text-xs font-semibold text-gray-800">New Order!</p>
                <p className="text-xs text-gray-400">Table 5 just ordered</p>
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
    { value: "2M+", label: "Orders Processed" },
    { value: "98%", label: "Uptime SLA" },
    { value: "4.9★", label: "Average Rating" },
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

function FeaturesSection() {
  const features = [
    { icon: QrCode, title: "QR Table Ordering", desc: "Customers scan a QR code at their table and order directly from their phone. No app download needed.", color: "bg-orange-50 text-orange-600" },
    { icon: BarChart3, title: "Live Order Dashboard", desc: "See every order in real-time. Accept, prepare, and mark orders ready from one clean interface.", color: "bg-blue-50 text-blue-600" },
    { icon: ChefHat, title: "Menu Management", desc: "Create and organize your digital menu with categories, photos, prices, and availability toggles.", color: "bg-green-50 text-green-600" },
    { icon: Bell, title: "Instant Notifications", desc: "Hear a sound and see new orders instantly. Never miss a table again with live audio alerts.", color: "bg-purple-50 text-purple-600" },
    { icon: Smartphone, title: "Mobile-First Customer UX", desc: "Your customers get a beautiful, fast menu experience optimized for every phone and screen size.", color: "bg-amber-50 text-amber-600" },
    { icon: Settings, title: "Restaurant Branding", desc: "Add your logo, colors, and identity. Your QR menu looks and feels like your brand.", color: "bg-rose-50 text-rose-600" },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Zap className="w-3 h-3" /> Everything you need
          </div>
          <h2 className="text-4xl font-black text-gray-900 mb-4">Built for real restaurants</h2>
          <p className="text-xl text-gray-500 max-w-xl mx-auto">From small cafés to busy multi-table restaurants — every feature is designed to save time and increase orders.</p>
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
            View all features <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { num: "01", title: "Sign up in minutes", desc: "Create your account, set up your restaurant profile, and upload your menu. No technical skills needed." },
    { num: "02", title: "Print your QR codes", desc: "Generate unique QR codes for each table. Print or display them — your customers are ready to scan." },
    { num: "03", title: "Customers scan & order", desc: "Guests scan the QR, browse your menu, and place their order directly from their phone. No waiting for staff." },
    { num: "04", title: "You manage everything live", desc: "See orders appear instantly in your dashboard. Update status, manage tables, and track revenue in real time." },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Check className="w-3 h-3" /> Setup takes 15 minutes
          </div>
          <h2 className="text-4xl font-black text-gray-900 mb-4">Up and running in 4 steps</h2>
          <p className="text-xl text-gray-500">No IT department needed. No long contracts. Just a smarter restaurant.</p>
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
            Learn more <ArrowRight className="w-4 h-4" />
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
              <ChefHat className="w-3 h-3" /> For restaurant owners
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-6">Run a faster, smarter operation</h2>
            <div className="space-y-5">
              {[
                "Reduce order errors from miscommunication",
                "Free up staff to focus on service quality",
                "See real-time revenue and order analytics",
                "Manage your menu instantly from any device",
                "Grow without hiring more waiting staff",
                "Professional customer experience from day one",
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
              <Smartphone className="w-3 h-3" /> For your customers
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-6">A dining experience they&apos;ll remember</h2>
            <div className="space-y-5">
              {[
                "Order instantly — no waiting for staff attention",
                "Browse the full menu with photos and descriptions",
                "Easily add items and track their order status",
                "No app download required — just scan and order",
                "Clear, beautiful menu on any smartphone",
                "Faster service means a better overall experience",
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
    { name: "Starter", price: "$29", period: "/month", tables: "10 tables", items: "50 menu items", staff: "2 staff users", featured: false },
    { name: "Growth", price: "$69", period: "/month", tables: "30 tables", items: "150 menu items", staff: "5 staff users", featured: true },
    { name: "Professional", price: "$149", period: "/month", tables: "100 tables", items: "500 menu items", staff: "20 staff users", featured: false },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-gray-950 to-gray-900">
      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            Simple pricing
          </div>
          <h2 className="text-4xl font-black text-white mb-4">Pay for what you use</h2>
          <p className="text-gray-400 text-xl">Start with a 14-day free trial. No credit card required.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {plans.map((p) => (
            <div key={p.name} className={`rounded-2xl p-7 relative ${p.featured ? "bg-orange-500 shadow-2xl shadow-orange-500/30 scale-105" : "bg-white/5 border border-white/10"}`}>
              {p.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-black px-3 py-1 rounded-full">Most Popular</div>}
              <p className={`text-sm font-semibold mb-2 ${p.featured ? "text-orange-100" : "text-gray-400"}`}>{p.name}</p>
              <div className="flex items-end gap-1 mb-6">
                <span className={`text-4xl font-black ${p.featured ? "text-white" : "text-white"}`}>{p.price}</span>
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
                Start Free Trial
              </Link>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link href="/pricing" className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 font-semibold transition-colors">
            See full pricing details <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    { name: "Sarah K.", role: "Owner, The Corner Café", text: "We cut our order errors by 80% and tables turn over 30% faster. Our customers love scanning the QR.", stars: 5 },
    { name: "Mohammed A.", role: "Manager, Spice Garden Restaurant", text: "Setup was incredibly easy. Within one afternoon, all our tables had QR codes and we were live.", stars: 5 },
    { name: "Lena V.", role: "Owner, Bistro Verde", text: "The live dashboard keeps everything under control during rush hours. It's like having an extra staff member.", stars: 5 },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Star className="w-3 h-3 fill-amber-500" /> Loved by restaurant owners
          </div>
          <h2 className="text-4xl font-black text-gray-900 mb-4">Real results, real restaurants</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-gray-50 rounded-2xl p-7 hover:bg-orange-50/30 transition-colors">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-6 text-sm">"{t.text}"</p>
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
    { q: "Do my customers need to download an app?", a: "No. Customers scan the QR code and the menu opens directly in their browser. Zero friction, zero downloads." },
    { q: "How long does setup take?", a: "Most restaurants are fully live within 15-30 minutes. You can add your menu, set up tables, and print QR codes the same day." },
    { q: "Can I try it before paying?", a: "Yes. Every plan starts with a 14-day free trial. No credit card required to get started." },
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-3xl mx-auto px-5">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black text-gray-900 mb-4">Common questions</h2>
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
            View all FAQs <ArrowRight className="w-4 h-4" />
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
          Ready to modernize your restaurant?
        </h2>
        <p className="text-xl text-orange-100 mb-10 max-w-xl mx-auto leading-relaxed">
          Join hundreds of restaurants already using QRMenu to serve faster, earn more, and delight their customers.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 font-bold px-10 py-4 rounded-2xl text-lg hover:bg-orange-50 transition-all shadow-xl">
            Start Free Trial — 14 Days
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-2xl text-lg hover:bg-white/30 transition-all border border-white/30">
            Request a Demo
          </Link>
        </div>
        <p className="text-orange-200 text-sm mt-6">No credit card required · Cancel anytime · Setup in minutes</p>
      </div>
    </section>
  );
}
