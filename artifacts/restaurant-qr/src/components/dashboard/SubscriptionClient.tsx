"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Calendar, AlertTriangle, ArrowUpRight, Check, Clock } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  displayPrice?: string | null;
  maxTables: number;
  maxMenuItems: number;
  maxStaffUsers: number;
};
type Subscription = {
  status: string;
  startDate: string;
  endDate: string | null;
  trialEndsAt: string | null;
  plan: Plan;
};
type Usage = {
  tables: { current: number; max: number };
  menuItems: { current: number; max: number };
  staff: { current: number; max: number };
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: "Active", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  TRIAL: { label: "Free Trial", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  EXPIRED: { label: "Expired", color: "text-red-600", bg: "bg-red-50 border-red-200" },
  CANCELLED: { label: "Cancelled", color: "text-gray-500", bg: "bg-gray-100 border-gray-200" },
};

function UsageBar({ label, current, max }: { label: string; current: number; max: number }) {
  const pct = Math.min((current / max) * 100, 100);
  const color = pct >= 90 ? "bg-red-400" : pct >= 70 ? "bg-amber-400" : "bg-orange-400";
  const textColor = pct >= 90 ? "text-red-600" : pct >= 70 ? "text-amber-600" : "text-gray-700";
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-600 font-medium">{label}</span>
        <span className={`text-sm font-bold ${textColor}`}>
          {current} <span className="text-gray-400 font-normal">/ {max}</span>
        </span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {pct >= 90 && (
        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Approaching limit — consider upgrading
        </p>
      )}
    </div>
  );
}

function TrialBanner({ trialEndsAt }: { trialEndsAt: string }) {
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
  const urgent = daysLeft <= 3;
  return (
    <div className={`rounded-2xl border p-5 flex items-center justify-between gap-4 ${urgent ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${urgent ? "bg-red-100" : "bg-amber-100"}`}>
          <Clock className={`w-5 h-5 ${urgent ? "text-red-600" : "text-amber-600"}`} />
        </div>
        <div>
          <p className={`font-bold text-sm ${urgent ? "text-red-800" : "text-amber-800"}`}>
            {daysLeft === 0 ? "Your trial ends today!" : `Trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
          </p>
          <p className={`text-xs mt-0.5 ${urgent ? "text-red-600" : "text-amber-600"}`}>
            Upgrade now to continue without interruption.
          </p>
        </div>
      </div>
      <Link
        href="/pricing"
        className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all ${urgent ? "bg-red-600 text-white hover:bg-red-700" : "bg-amber-500 text-white hover:bg-amber-600"}`}
      >
        Upgrade <ArrowUpRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

export function SubscriptionClient() {
  const [data, setData] = useState<{ subscription: Subscription | null; usage: Usage } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/merchant/subscription").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded-xl w-48" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
          <div className="h-32 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-red-400">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
        Failed to load subscription data
      </div>
    );
  }

  const { subscription, usage } = data;
  const statusInfo = statusConfig[subscription?.status || ""] || statusConfig.CANCELLED;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Subscription & Billing</h1>
        <p className="text-gray-500 mt-1">Your current plan, usage, and billing details</p>
      </div>

      {!subscription ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-10 text-center">
          <p className="text-gray-500 mb-4">No active subscription found</p>
          <Link href="/pricing" className="inline-flex items-center gap-2 bg-orange-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-600 transition-all">
            View Plans <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {subscription.status === "TRIAL" && subscription.trialEndsAt && (
            <TrialBanner trialEndsAt={subscription.trialEndsAt} />
          )}
          {subscription.status === "EXPIRED" && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <p className="font-bold text-red-800 text-sm">Subscription expired</p>
                  <p className="text-xs text-red-600">Your plan has expired. Renew to restore full access.</p>
                </div>
              </div>
              <Link href="/pricing" className="shrink-0 bg-red-600 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-red-700 transition-all">
                Renew Plan
              </Link>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-black text-gray-900">{subscription.plan.name}</h2>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.bg} ${statusInfo.color}`}>
                      {subscription.status === "TRIAL" && <Clock className="w-3 h-3" />}
                      {subscription.status === "ACTIVE" && <Check className="w-3 h-3" />}
                      {statusInfo.label}
                    </span>
                  </div>
                  {subscription.plan.description && (
                    <p className="text-gray-500 text-sm">{subscription.plan.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-3xl font-black text-gray-900">
                    {subscription.plan.displayPrice || (subscription.plan.price ? `$${subscription.plan.price}` : "Free")}
                    <span className="text-sm text-gray-400 font-normal">/mo</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50/50">
              {[
                { label: "Tables", max: subscription.plan.maxTables, icon: "🪑" },
                { label: "Menu Items", max: subscription.plan.maxMenuItems, icon: "🍽️" },
                { label: "Staff Users", max: subscription.plan.maxStaffUsers, icon: "👥" },
              ].map((item) => (
                <div key={item.label} className="px-6 py-4 text-center">
                  <p className="text-lg">{item.icon}</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">{item.max}</p>
                  <p className="text-xs text-gray-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900">Current Usage</h3>
            </div>
            <div className="space-y-6">
              <UsageBar label="Tables" current={usage.tables.current} max={usage.tables.max} />
              <UsageBar label="Menu Items" current={usage.menuItems.current} max={usage.menuItems.max} />
              <UsageBar label="Staff Users" current={usage.staff.current} max={usage.staff.max} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-gray-900">Billing Details</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: "Plan", value: subscription.plan.name, highlight: false },
                { label: "Billing Status", value: statusInfo.label, highlight: true, color: statusInfo.color },
                { label: "Start Date", value: new Date(subscription.startDate).toLocaleDateString(), highlight: false },
                ...(subscription.trialEndsAt
                  ? [{ label: "Trial Ends", value: new Date(subscription.trialEndsAt).toLocaleDateString(), highlight: true, color: "text-amber-600" }]
                  : []),
                ...(subscription.endDate
                  ? [{ label: "Renewal Date", value: new Date(subscription.endDate).toLocaleDateString(), highlight: false }]
                  : []),
              ].map((row) => (
                <div key={row.label} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{row.label}</span>
                  <span className={`text-sm font-semibold ${row.highlight ? (row as any).color : "text-gray-900"}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-black text-gray-900 mb-1">Need more capacity?</p>
                <p className="text-gray-600 text-sm">Compare our plans and find the right fit as your restaurant grows.</p>
              </div>
              <Link
                href="/pricing"
                className="shrink-0 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-orange-200"
              >
                View Plans <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
