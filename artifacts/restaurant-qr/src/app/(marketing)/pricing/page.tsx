import Link from "next/link";
import { Check, Zap, ArrowRight, Star, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Tarifs — QRMenu" };

async function getPlans() {
  try {
    return await prisma.subscriptionPlan.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    });
  } catch {
    return [];
  }
}

const planFeatures: Record<string, string[]> = {
  Starter: [
    "Jusqu'à 10 tables",
    "Jusqu'à 50 articles au menu",
    "2 comptes staff",
    "Génération & impression QR",
    "Tableau de bord commandes",
    "Notifications en temps réel",
    "Menu mobile client",
    "Personnalisation basique",
  ],
  Growth: [
    "Jusqu'à 30 tables",
    "Jusqu'à 150 articles au menu",
    "5 comptes staff",
    "Génération & impression QR",
    "Tableau de bord commandes",
    "Notifications en temps réel",
    "Menu mobile client",
    "Logo & couleurs personnalisés",
    "Support prioritaire",
  ],
  Professional: [
    "Jusqu'à 100 tables",
    "Jusqu'à 500 articles au menu",
    "20 comptes staff",
    "Génération & impression QR",
    "Tableau de bord commandes",
    "Notifications en temps réel",
    "Menu mobile client",
    "Logo & couleurs personnalisés",
    "Support prioritaire",
    "Gestionnaire de compte dédié",
    "Intégrations sur demande",
  ],
};

const planColors: Record<string, { border: string; badge: string; badgeBg: string; btn: string; highlight: boolean }> = {
  Starter: {
    border: "border-gray-200",
    badge: "", badgeBg: "",
    btn: "bg-gray-900 hover:bg-gray-800 text-white",
    highlight: false,
  },
  Growth: {
    border: "border-orange-300 ring-2 ring-orange-400/30",
    badge: "text-amber-900", badgeBg: "bg-amber-400",
    btn: "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200",
    highlight: true,
  },
  Professional: {
    border: "border-gray-200",
    badge: "", badgeBg: "",
    btn: "bg-gray-900 hover:bg-gray-800 text-white",
    highlight: false,
  },
};

const fallbackPlans = [
  { id: "plan_starter", name: "Starter", price: 2900, displayPrice: "2 900 DA", billingInterval: "mois", maxTables: 10, maxMenuItems: 50, maxStaffUsers: 2, isFeatured: false },
  { id: "plan_growth", name: "Growth", price: 6900, displayPrice: "6 900 DA", billingInterval: "mois", maxTables: 30, maxMenuItems: 150, maxStaffUsers: 5, isFeatured: true },
  { id: "plan_pro", name: "Professional", price: 14900, displayPrice: "14 900 DA", billingInterval: "mois", maxTables: 100, maxMenuItems: 500, maxStaffUsers: 20, isFeatured: false },
];

export default async function PricingPage() {
  const dbPlans = await getPlans();
  const displayPlans = dbPlans.length > 0 ? dbPlans : fallbackPlans;

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-50 to-white py-20">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3 h-3" /> Tarification simple et transparente
          </div>
          <h1 className="text-5xl font-black text-gray-900 mb-5 leading-tight">
            Choisissez l'offre adaptée<br />à votre établissement
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Démarrez avec un essai gratuit de 14 jours sur n'importe quelle offre. Aucune carte bancaire requise.
          </p>
        </div>
      </div>

      {/* Plans */}
      <div className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {displayPlans.map((plan) => {
              const name = plan.name;
              const style = planColors[name] || planColors.Starter;
              const features = planFeatures[name] || [];
              const price = plan.displayPrice || `${Number(plan.price).toLocaleString("fr-DZ")} DA`;

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-3xl border p-8 flex flex-col ${style.border} ${style.highlight ? "shadow-xl" : "shadow-sm"}`}
                >
                  {plan.isFeatured && (
                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-black px-5 py-1.5 rounded-full ${style.badgeBg} ${style.badge} whitespace-nowrap`}>
                      ⭐ Le plus populaire
                    </div>
                  )}

                  <div className="mb-6">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{name}</p>
                    <div className="flex items-end gap-1 mb-2">
                      <span className="text-4xl font-black text-gray-900">{price}</span>
                      <span className="text-gray-400 mb-1.5 text-sm">/{plan.billingInterval || "mois"}</span>
                    </div>
                    <p className="text-gray-500 text-sm">
                      {plan.maxTables} tables · {plan.maxMenuItems} articles · {plan.maxStaffUsers} staff
                    </p>
                  </div>

                  <div className="flex-1 space-y-3 mb-8">
                    {features.map((f) => (
                      <div key={f} className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-gray-700 text-sm">{f}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Link
                      href={`/signup?plan=${plan.id}`}
                      className={`block text-center py-3.5 rounded-2xl font-bold text-sm transition-all ${style.btn}`}
                    >
                      Commencer l'essai gratuit
                    </Link>
                    <Link
                      href="/demander-une-demo"
                      className="block text-center py-2.5 rounded-2xl text-xs font-semibold text-gray-500 hover:text-orange-600 transition-all"
                    >
                      Demander une démo →
                    </Link>
                  </div>
                  <p className="text-center text-xs text-gray-400 mt-2">14 jours gratuits, annulez à tout moment</p>
                </div>
              );
            })}
          </div>

          {/* Comparison table */}
          <div className="bg-gray-50 rounded-3xl p-8 mb-14">
            <h2 className="text-2xl font-black text-gray-900 text-center mb-8">Comparer les offres</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-gray-500 font-semibold">Fonctionnalité</th>
                    {displayPlans.map((p) => (
                      <th key={p.id} className="text-center py-3 font-black text-gray-900">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Tables maximum", vals: displayPlans.map((p) => String(p.maxTables)) },
                    { label: "Articles au menu", vals: displayPlans.map((p) => String(p.maxMenuItems)) },
                    { label: "Comptes staff", vals: displayPlans.map((p) => String(p.maxStaffUsers)) },
                    { label: "Génération QR codes", vals: ["✓", "✓", "✓"] },
                    { label: "Tableau de bord", vals: ["✓", "✓", "✓"] },
                    { label: "Notifications temps réel", vals: ["✓", "✓", "✓"] },
                    { label: "Menu mobile client", vals: ["✓", "✓", "✓"] },
                    { label: "Logo & couleurs", vals: ["Basique", "Complet", "Complet"] },
                    { label: "Support prioritaire", vals: ["—", "✓", "✓"] },
                    { label: "Gestionnaire dédié", vals: ["—", "—", "✓"] },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-gray-100 hover:bg-white/60 transition-colors">
                      <td className="py-3.5 text-gray-700 font-medium">{row.label}</td>
                      {row.vals.map((v, i) => (
                        <td
                          key={i}
                          className={`text-center py-3.5 font-semibold ${v === "✓" ? "text-green-600" : v === "—" ? "text-gray-300" : "text-gray-900"}`}
                        >
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Enterprise CTA */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-5 mb-12 flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
              <p className="text-amber-800 text-sm font-medium">
                Vous gérez une chaîne ou une franchise ?{" "}
                <Link href="/demander-une-demo" className="font-black underline">Contactez-nous</Link>{" "}
                — nous proposons des offres sur mesure.
              </p>
            </div>
            <Link
              href="/demander-une-demo"
              className="shrink-0 flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
            >
              <MessageCircle className="w-4 h-4" /> Demander une démo
            </Link>
          </div>

          {/* Guarantees */}
          <div className="grid md:grid-cols-3 gap-6 mb-14">
            {[
              { icon: "🆓", title: "14 jours d'essai gratuit", desc: "Testez n'importe quelle offre sans engagement. Aucune carte bancaire nécessaire." },
              { icon: "💰", title: "Pas de frais cachés", desc: "Le prix affiché est le prix payé. Aucun frais de mise en place, aucune surprise." },
              { icon: "🔓", title: "Sans engagement", desc: "Pas satisfait ? Annulez en un clic. Nous ne croyons pas aux contrats imposés." },
            ].map((g) => (
              <div key={g.title} className="text-center p-6 bg-gray-50 rounded-2xl">
                <p className="text-3xl mb-3">{g.icon}</p>
                <h3 className="font-bold text-gray-900 mb-2 text-sm">{g.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-black text-gray-900 text-center mb-8">Questions fréquentes</h2>
            <div className="space-y-4">
              {[
                {
                  q: "Est-ce que je dois fournir une carte bancaire pour l'essai ?",
                  a: "Non, aucune carte bancaire n'est requise. Vous pouvez tester librement pendant 14 jours.",
                },
                {
                  q: "Puis-je changer d'offre à tout moment ?",
                  a: "Oui, vous pouvez upgrader ou downgrader votre offre à tout moment depuis votre espace client.",
                },
                {
                  q: "Comment les QR codes sont-ils générés ?",
                  a: "Chaque table reçoit un QR code unique généré automatiquement. Vous pouvez les imprimer ou les télécharger en PNG.",
                },
                {
                  q: "Le système fonctionne-t-il en arabe ?",
                  a: "Oui, l'interface client supporte le français et l'arabe avec un affichage RTL correct.",
                },
              ].map((faq) => (
                <div key={faq.q} className="bg-gray-50 rounded-2xl p-5">
                  <p className="font-bold text-gray-900 mb-2 text-sm">{faq.q}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-20 bg-gradient-to-br from-orange-500 to-amber-500">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-4xl font-black text-white mb-4">Prêt à transformer votre restaurant ?</h2>
          <p className="text-orange-100 text-xl mb-10">Démarrez gratuitement. Vos premières commandes QR peuvent arriver dans l'heure.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 font-bold px-10 py-4 rounded-2xl text-lg hover:bg-orange-50 transition-all shadow-xl"
            >
              Essai gratuit <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/demander-une-demo"
              className="inline-flex items-center justify-center gap-2 bg-orange-600/30 hover:bg-orange-600/50 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all border border-white/30"
            >
              <MessageCircle className="w-5 h-5" /> Demander une démo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
