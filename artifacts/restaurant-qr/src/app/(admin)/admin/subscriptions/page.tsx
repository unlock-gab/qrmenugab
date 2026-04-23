import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Calendar, TrendingUp } from "lucide-react";

export const metadata = { title: "Abonnements — Admin" };

const statusColors: Record<string, string> = {
  TRIAL: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  EXPIRED: "bg-red-500/10 text-red-400 border-red-500/20",
  CANCELLED: "bg-slate-600/50 text-slate-400 border-slate-600",
};

const STATUS_FR: Record<string, string> = {
  TRIAL: "Essai", ACTIVE: "Actif", EXPIRED: "Expiré", CANCELLED: "Annulé",
};

export default async function AdminSubscriptionsPage() {
  // Load counts and recent subscriptions in parallel — avoid loading everything at once
  const [counts, subscriptions] = await Promise.all([
    prisma.restaurantSubscription.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.restaurantSubscription.findMany({
      include: {
        restaurant: { select: { id: true, name: true, slug: true, status: true } },
        plan: { select: { name: true, price: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const countMap = Object.fromEntries(
    counts.map((c) => [c.status, c._count._all])
  );
  const countTrials = countMap.TRIAL ?? 0;
  const countActive = countMap.ACTIVE ?? 0;
  const countExpired = countMap.EXPIRED ?? 0;
  const countCancelled = countMap.CANCELLED ?? 0;

  const totalMRR = subscriptions
    .filter((s) => s.status === "ACTIVE")
    .reduce((sum, s) => sum + Number(s.plan.price || 0), 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Abonnements</h1>
        <p className="text-slate-400 mt-1">Tous les abonnements restaurants et essais en cours</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Essai", count: countTrials, color: "from-amber-500/20 to-amber-600/10 border-amber-500/20", text: "text-amber-400" },
          { label: "Actif (Payé)", count: countActive, color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20", text: "text-emerald-400" },
          { label: "Expiré", count: countExpired, color: "from-red-500/20 to-red-600/10 border-red-500/20", text: "text-red-400" },
          { label: "Annulé", count: countCancelled, color: "from-slate-700/50 to-slate-800/50 border-slate-700", text: "text-slate-400" },
        ].map((s) => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} border rounded-2xl p-5`}>
            <p className={`text-3xl font-black ${s.text}`}>{s.count}</p>
            <p className="text-slate-400 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 mb-8 flex items-center gap-4">
        <div className="w-11 h-11 bg-emerald-500/10 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-slate-400 text-xs">Revenus récurrents mensuels (plans actifs)</p>
          <p className="text-2xl font-black text-white">
            {totalMRR.toLocaleString("fr-DZ")} DA
            <span className="text-slate-500 text-sm font-normal"> /mois</span>
          </p>
        </div>
      </div>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Restaurant</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Forfait</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Statut</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Fin d&apos;essai</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Début</th>
              <th className="py-3.5 px-5" />
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="border-b border-slate-800/50 hover:bg-slate-700/20 transition-colors">
                <td className="py-4 px-5">
                  <p className="text-white font-semibold text-sm">{sub.restaurant.name}</p>
                  <p className="text-slate-500 text-xs">{sub.restaurant.slug}</p>
                </td>
                <td className="py-4 px-5">
                  <p className="text-slate-300 text-sm font-medium">{sub.plan.name}</p>
                  <p className="text-slate-500 text-xs">{Number(sub.plan.price || 0).toLocaleString("fr-DZ")} DA/mois</p>
                </td>
                <td className="py-4 px-5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusColors[sub.status] || ""}`}>
                    {STATUS_FR[sub.status] || sub.status}
                  </span>
                </td>
                <td className="py-4 px-5 text-sm text-slate-400">
                  {sub.trialEndsAt ? (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(sub.trialEndsAt).toLocaleDateString("fr-DZ")}
                    </span>
                  ) : "—"}
                </td>
                <td className="py-4 px-5 text-sm text-slate-400">
                  {new Date(sub.startDate).toLocaleDateString("fr-DZ")}
                </td>
                <td className="py-4 px-5 text-right">
                  <Link href={`/admin/restaurants/${sub.restaurantId}`} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                    Voir →
                  </Link>
                </td>
              </tr>
            ))}
            {subscriptions.length === 0 && (
              <tr><td colSpan={6} className="py-16 text-center text-slate-500">Aucun abonnement</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
