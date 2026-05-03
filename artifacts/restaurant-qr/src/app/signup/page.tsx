import { SignupClient } from "./SignupClient";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QrCode, Check, Star, ArrowRight } from "lucide-react";

export const metadata = { title: "Créer un compte — QRMenu" };

async function getPublicPlans() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    });
    return plans.map((p) => ({
      id: p.id, name: p.name, description: p.description,
      price: p.price ? Number(p.price) : null,
      displayPrice: p.displayPrice, billingInterval: p.billingInterval,
      maxTables: p.maxTables, maxMenuItems: p.maxMenuItems, maxStaffUsers: p.maxStaffUsers,
      isFeatured: p.isFeatured, sortOrder: p.sortOrder,
    }));
  } catch {
    return [];
  }
}

const FEATURES = [
  "Menu digital QR — sans application",
  "Commandes en temps réel",
  "Gestion tables, cuisine & caisse",
  "Alertes sonores pour chaque commande",
  "Réservations & gestion du personnel",
  "Support inclus, mise en place en 1h",
];

const TESTIMONIAL = {
  quote: "Opérationnel en moins d'une heure. Nos clients adorent commander depuis leur téléphone.",
  name: "Karim B.",
  role: "Propriétaire — Café Atlas, Alger",
  rating: 5,
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (session) {
    const role = (session.user as any).role;
    if (role === "PLATFORM_ADMIN") redirect("/admin/dashboard");
    else redirect("/merchant/dashboard");
  }

  const plans = await getPublicPlans();
  const params = await searchParams;
  const selectedPlanId = params?.plan;

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL — brand + features ────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 p-12 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/3 translate-y-1/3" />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-white text-2xl tracking-tight">QRMenu</span>
        </Link>

        {/* Center content */}
        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 text-white/90 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            14 jours gratuits · Sans carte bancaire
          </div>
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-5">
            Modernisez votre restaurant avec le QR Code
          </h1>
          <p className="text-violet-200 text-lg leading-relaxed mb-10">
            Rejoignez 500+ restaurants en Algérie qui digitalisent leur menu et leurs commandes.
          </p>

          {/* Feature list */}
          <div className="space-y-3.5">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-violet-100 text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial card */}
        <div className="relative z-10">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: TESTIMONIAL.rating }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-white text-sm leading-relaxed italic mb-4">
              &ldquo;{TESTIMONIAL.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {TESTIMONIAL.name[0]}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{TESTIMONIAL.name}</p>
                <p className="text-violet-300 text-xs">{TESTIMONIAL.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — signup form ────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50">
        {/* Mobile logo */}
        <Link href="/" className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-gray-900 text-xl">QRMenu</span>
        </Link>

        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h2 className="text-2xl font-black text-gray-900 mb-1">
              Créez votre espace restaurant
            </h2>
            <p className="text-gray-500 text-sm">
              Opérationnel en moins d&apos;une heure · 14 jours offerts
            </p>
          </div>

          <SignupClient plans={plans} selectedPlanId={selectedPlanId} />

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{" "}
            <Link href="/merchant/login" className="text-violet-600 font-bold hover:text-violet-700 transition-colors">
              Se connecter <ArrowRight className="inline w-3.5 h-3.5" />
            </Link>
          </p>

          <p className="text-center text-xs text-gray-400 mt-4">
            En créant un compte, vous acceptez nos{" "}
            <Link href="/legal" className="underline hover:text-gray-600">conditions d&apos;utilisation</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
