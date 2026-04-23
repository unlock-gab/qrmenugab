"use client";

import { useEffect, useState } from "react";

type Plan = { id: string; name: string; description: string | null; price: number | null; maxTables: number; maxMenuItems: number; maxStaffUsers: number };
type Subscription = { status: string; startDate: string; endDate: string | null; trialEndsAt: string | null; plan: Plan };
type Usage = { tables: { current: number; max: number }; menuItems: { current: number; max: number }; staff: { current: number; max: number } };

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-600 border-emerald-200",
  TRIAL: "bg-amber-50 text-amber-600 border-amber-200",
  EXPIRED: "bg-red-50 text-red-500 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
};

function UsageBar({ label, current, max }: { label: string; current: number; max: number }) {
  const pct = Math.min((current / max) * 100, 100);
  const color = pct >= 90 ? "bg-red-400" : pct >= 70 ? "bg-amber-400" : "bg-orange-400";
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-800">{current} / {max}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function SubscriptionClient() {
  const [data, setData] = useState<{ subscription: Subscription | null; usage: Usage } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/merchant/subscription").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;
  if (!data) return <div className="p-8 text-center text-red-400">Failed to load</div>;

  const { subscription, usage } = data;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Subscription & Plan</h1>
        <p className="text-gray-500 mt-1">Your current plan, limits, and usage</p>
      </div>

      {subscription ? (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{subscription.plan.name}</h2>
                <p className="text-gray-500 mt-0.5">{subscription.plan.description}</p>
              </div>
              <div className="text-right">
                {subscription.plan.price ? (
                  <p className="text-2xl font-bold text-orange-500">${subscription.plan.price}<span className="text-sm text-gray-400 font-normal">/mo</span></p>
                ) : (
                  <p className="text-xl font-bold text-emerald-500">Free</p>
                )}
                <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[subscription.status] || ""}`}>
                  {subscription.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              {[
                { label: "Tables", value: subscription.plan.maxTables },
                { label: "Menu Items", value: subscription.plan.maxMenuItems },
                { label: "Staff Accounts", value: subscription.plan.maxStaffUsers },
              ].map((l) => (
                <div key={l.label} className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{l.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{l.label}</p>
                </div>
              ))}
            </div>

            {subscription.trialEndsAt && subscription.status === "TRIAL" && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                Trial ends: {new Date(subscription.trialEndsAt).toLocaleDateString()}
              </div>
            )}
            {subscription.endDate && subscription.status !== "TRIAL" && (
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-500">
                Renewal date: {new Date(subscription.endDate).toLocaleDateString()}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-5">Current Usage</h2>
            <div className="space-y-5">
              <UsageBar label="Tables" current={usage.tables.current} max={usage.tables.max} />
              <UsageBar label="Menu Items" current={usage.menuItems.current} max={usage.menuItems.max} />
              <UsageBar label="Staff Accounts" current={usage.staff.current} max={usage.staff.max} />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-gray-700 font-semibold text-lg">No active subscription</p>
          <p className="text-gray-400 mt-2">Contact platform support to get a plan assigned</p>
        </div>
      )}
    </div>
  );
}
