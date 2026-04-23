import Link from "next/link";
import { Check, Zap, ArrowRight, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Pricing — QRMenu" };

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
    "Up to 10 tables",
    "Up to 50 menu items",
    "2 staff accounts",
    "QR code generation & printing",
    "Live order dashboard",
    "Real-time notifications",
    "Mobile customer menu",
    "Basic branding",
  ],
  Growth: [
    "Up to 30 tables",
    "Up to 150 menu items",
    "5 staff accounts",
    "QR code generation & printing",
    "Live order dashboard",
    "Real-time notifications",
    "Mobile customer menu",
    "Full branding + logo",
    "Priority support",
  ],
  Professional: [
    "Up to 100 tables",
    "Up to 500 menu items",
    "20 staff accounts",
    "QR code generation & printing",
    "Live order dashboard",
    "Real-time notifications",
    "Mobile customer menu",
    "Full branding + logo",
    "Priority support",
    "Dedicated account manager",
    "Custom integrations on request",
  ],
};

const planColors: Record<string, { border: string; badge: string; btn: string; gradient: string }> = {
  Starter: {
    border: "border-gray-200",
    badge: "",
    btn: "bg-gray-900 hover:bg-gray-800 text-white",
    gradient: "",
  },
  Growth: {
    border: "border-orange-300 ring-2 ring-orange-400/30",
    badge: "bg-amber-400 text-amber-900",
    btn: "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200",
    gradient: "",
  },
  Professional: {
    border: "border-gray-200",
    badge: "",
    btn: "bg-gray-900 hover:bg-gray-800 text-white",
    gradient: "",
  },
};

export default async function PricingPage() {
  const plans = await getPlans();

  const fallbackPlans = [
    { id: "plan_starter", name: "Starter", price: 29, displayPrice: "$29", billingInterval: "month", maxTables: 10, maxMenuItems: 50, maxStaffUsers: 2, isFeatured: false },
    { id: "plan_growth", name: "Growth", price: 69, displayPrice: "$69", billingInterval: "month", maxTables: 30, maxMenuItems: 150, maxStaffUsers: 5, isFeatured: true },
    { id: "plan_pro", name: "Professional", price: 149, displayPrice: "$149", billingInterval: "month", maxTables: 100, maxMenuItems: 500, maxStaffUsers: 20, isFeatured: false },
  ];

  const displayPlans = plans.length > 0 ? plans : fallbackPlans;

  return (
    <div>
      <div className="bg-gradient-to-br from-gray-50 to-white py-24">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3 h-3" /> Simple, transparent pricing
          </div>
          <h1 className="text-5xl font-black text-gray-900 mb-5">Pay for what you need</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Start with a free 14-day trial on any plan. No credit card required. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {displayPlans.map((plan) => {
              const name = plan.name;
              const style = planColors[name] || planColors.Starter;
              const features = planFeatures[name] || [];
              const price = plan.displayPrice || `$${Number(plan.price)}`;

              return (
                <div key={plan.id} className={`relative bg-white rounded-3xl border p-8 flex flex-col ${style.border}`}>
                  {plan.isFeatured && (
                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-black px-4 py-1.5 rounded-full ${style.badge}`}>
                      Most Popular
                    </div>
                  )}

                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{name}</p>
                    <div className="flex items-end gap-1 mb-3">
                      <span className="text-5xl font-black text-gray-900">{price}</span>
                      <span className="text-gray-400 mb-2">/{plan.billingInterval || "month"}</span>
                    </div>
                    <p className="text-gray-500 text-sm">
                      {plan.maxTables} tables · {plan.maxMenuItems} items · {plan.maxStaffUsers} staff
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

                  <Link
                    href={`/signup?plan=${plan.id}`}
                    className={`block text-center py-3.5 rounded-2xl font-bold text-sm transition-all ${style.btn}`}
                  >
                    Start Free Trial
                  </Link>
                  <p className="text-center text-xs text-gray-400 mt-3">14-day free trial, cancel anytime</p>
                </div>
              );
            })}
          </div>

          <div className="bg-gray-50 rounded-3xl p-10 mb-16">
            <h2 className="text-2xl font-black text-gray-900 text-center mb-8">Compare plans</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-gray-500 font-semibold">Feature</th>
                    {displayPlans.map((p) => (
                      <th key={p.id} className="text-center py-3 font-black text-gray-900">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Max Tables", vals: displayPlans.map((p) => String(p.maxTables)) },
                    { label: "Max Menu Items", vals: displayPlans.map((p) => String(p.maxMenuItems)) },
                    { label: "Max Staff Users", vals: displayPlans.map((p) => String(p.maxStaffUsers)) },
                    { label: "QR Code Generation", vals: ["✓", "✓", "✓"] },
                    { label: "Live Order Dashboard", vals: ["✓", "✓", "✓"] },
                    { label: "Real-Time Notifications", vals: ["✓", "✓", "✓"] },
                    { label: "Mobile Customer Menu", vals: ["✓", "✓", "✓"] },
                    { label: "Brand Colors + Logo", vals: ["Basic", "Full", "Full"] },
                    { label: "Priority Support", vals: ["—", "✓", "✓"] },
                    { label: "Dedicated Account Manager", vals: ["—", "—", "✓"] },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-gray-100 hover:bg-white/60 transition-colors">
                      <td className="py-3.5 text-gray-700 font-medium">{row.label}</td>
                      {row.vals.map((v, i) => (
                        <td key={i} className={`text-center py-3.5 font-semibold ${v === "✓" ? "text-green-600" : v === "—" ? "text-gray-300" : "text-gray-900"}`}>
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 mb-8">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
              <p className="text-amber-800 text-sm font-medium">
                Need a custom plan for a chain or franchise? <Link href="/contact" className="font-bold underline">Contact us</Link> — we have enterprise options.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Free 14-day trial", desc: "Try any plan completely free. No credit card needed to get started." },
              { title: "No hidden fees", desc: "The price you see is what you pay. No setup fees, no surprise charges." },
              { title: "Cancel anytime", desc: "Not happy? Cancel in one click. We don't believe in lock-in contracts." },
            ].map((g) => (
              <div key={g.title} className="text-center p-6">
                <h3 className="font-bold text-gray-900 mb-2">{g.title}</h3>
                <p className="text-gray-500 text-sm">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-20 bg-gradient-to-br from-orange-500 to-amber-500">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-4xl font-black text-white mb-5">Ready to transform your restaurant?</h2>
          <p className="text-orange-100 text-xl mb-8">Start free today. Your first orders could come in within the hour.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold px-10 py-4 rounded-2xl text-lg hover:bg-orange-50 transition-all shadow-xl">
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
