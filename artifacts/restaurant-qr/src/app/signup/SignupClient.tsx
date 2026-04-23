"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  price: number | null;
  displayPrice?: string | null;
  maxTables: number;
  maxMenuItems: number;
  maxStaffUsers: number;
  isFeatured: boolean;
}

interface Props {
  plans: Plan[];
  selectedPlanId?: string;
}

export function SignupClient({ plans, selectedPlanId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const defaultPlanId = selectedPlanId || plans.find((p) => p.isFeatured)?.id || plans[0]?.id || "plan_starter";

  const [form, setForm] = useState({
    ownerName: "",
    email: "",
    password: "",
    restaurantName: "",
    planId: defaultPlanId,
  });

  const fallbackPlans: Plan[] = [
    { id: "plan_starter", name: "Starter", price: 29, displayPrice: "$29", maxTables: 10, maxMenuItems: 50, maxStaffUsers: 2, isFeatured: false },
    { id: "plan_growth", name: "Growth", price: 69, displayPrice: "$69", maxTables: 30, maxMenuItems: 150, maxStaffUsers: 5, isFeatured: true },
    { id: "plan_pro", name: "Professional", price: 149, displayPrice: "$149", maxTables: 100, maxMenuItems: 500, maxStaffUsers: 20, isFeatured: false },
  ];

  const displayPlans = plans.length > 0 ? plans : fallbackPlans;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.ownerName || !form.email || !form.password || !form.restaurantName) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.ok) {
        router.push("/onboarding");
      } else {
        router.push("/merchant/login");
      }
    } catch (err: any) {
      toast.error(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
              step >= s ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400"
            )}>
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
            {s < 2 && <div className={cn("flex-1 h-0.5 w-12 transition-all", step > s ? "bg-orange-400" : "bg-gray-100")} />}
          </div>
        ))}
        <div className="ml-3 text-sm text-gray-500">
          {step === 1 ? "Your account" : "Choose a plan"}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all"
                placeholder="Your full name"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Restaurant Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.restaurantName}
                onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all"
                placeholder="Your restaurant name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all"
                placeholder="Minimum 6 characters"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!form.ownerName || !form.email || !form.password || !form.restaurantName) {
                  toast.error("Please fill in all fields");
                  return;
                }
                if (form.password.length < 6) {
                  toast.error("Password must be at least 6 characters");
                  return;
                }
                setStep(2);
              }}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all mt-2"
            >
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-2">Choose a plan for your 14-day free trial:</p>
            {displayPlans.map((plan) => {
              const price = plan.displayPrice || `$${Number(plan.price)}`;
              return (
                <label
                  key={plan.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all",
                    form.planId === plan.id
                      ? "border-orange-400 bg-orange-50"
                      : "border-gray-100 hover:border-gray-200"
                  )}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan.id}
                    checked={form.planId === plan.id}
                    onChange={() => setForm({ ...form, planId: plan.id })}
                    className="hidden"
                  />
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                    form.planId === plan.id ? "border-orange-500 bg-orange-500" : "border-gray-300"
                  )}>
                    {form.planId === plan.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{plan.name}</span>
                      {plan.isFeatured && <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">Popular</span>}
                    </div>
                    <p className="text-xs text-gray-400">{plan.maxTables} tables · {plan.maxMenuItems} items · {plan.maxStaffUsers} staff</p>
                  </div>
                  <span className="font-black text-gray-900 text-sm shrink-0">{price}<span className="text-gray-400 font-normal">/mo</span></span>
                </label>
              );
            })}

            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
              ✓ 14-day free trial included — no payment needed now
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-all text-sm"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create Account"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
