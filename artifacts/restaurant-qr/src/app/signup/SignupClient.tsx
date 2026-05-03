"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { Loader2, Check, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Plan {
  id: string; name: string; price: number | null; displayPrice?: string | null;
  maxTables: number; maxMenuItems: number; maxStaffUsers: number; isFeatured: boolean;
}

interface Props { plans: Plan[]; selectedPlanId?: string; }

export function SignupClient({ plans, selectedPlanId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const defaultPlanId = selectedPlanId || plans.find((p) => p.isFeatured)?.id || plans[0]?.id || "plan_starter";

  const [form, setForm] = useState({
    ownerName: "", email: "", password: "", restaurantName: "", planId: defaultPlanId,
  });

  const fallbackPlans: Plan[] = [
    { id: "plan_starter", name: "Starter", price: 2900, displayPrice: "2 900 DA", maxTables: 10, maxMenuItems: 50, maxStaffUsers: 2, isFeatured: false },
    { id: "plan_growth", name: "Croissance", price: 6900, displayPrice: "6 900 DA", maxTables: 30, maxMenuItems: 150, maxStaffUsers: 5, isFeatured: true },
    { id: "plan_pro", name: "Pro", price: 14900, displayPrice: "14 900 DA", maxTables: 100, maxMenuItems: 500, maxStaffUsers: 20, isFeatured: false },
  ];

  const displayPlans = plans.length > 0 ? plans : fallbackPlans;

  function formatPlanPrice(plan: Plan): string {
    if (plan.displayPrice) return plan.displayPrice;
    if (plan.price) return `${Number(plan.price).toLocaleString("fr-DZ")} DA`;
    return "Gratuit";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.ownerName || !form.email || !form.password || !form.restaurantName) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
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
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'inscription");

      const result = await signIn("credentials", {
        email: form.email, password: form.password, redirect: false,
      });
      if (result?.ok) router.push("/onboarding");
      else router.push("/merchant/login");
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 transition-all";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-7">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-7">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
              step > s ? "bg-violet-600 text-white" :
              step === s ? "bg-violet-600 text-white ring-4 ring-violet-100" :
              "bg-gray-100 text-gray-400"
            )}>
              {step > s ? <Check className="w-3.5 h-3.5" /> : s}
            </div>
            {s < 2 && (
              <div className={cn("h-0.5 w-14 rounded-full transition-all", step > s ? "bg-violet-500" : "bg-gray-100")} />
            )}
          </div>
        ))}
        <span className="ml-2 text-xs font-semibold text-gray-400">
          {step === 1 ? "Votre compte" : "Choisir un forfait"}
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                Nom complet <span className="text-red-400 normal-case">*</span>
              </label>
              <input
                type="text"
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                className={inputClass}
                placeholder="Votre nom complet"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                Nom du restaurant <span className="text-red-400 normal-case">*</span>
              </label>
              <input
                type="text"
                value={form.restaurantName}
                onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                className={inputClass}
                placeholder="Ex: Café Atlas, Pizzeria Napoli..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                Adresse e-mail <span className="text-red-400 normal-case">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
                placeholder="vous@restaurant.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                Mot de passe <span className="text-red-400 normal-case">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={cn(inputClass, "pr-11")}
                  placeholder="Minimum 6 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!form.ownerName || !form.email || !form.password || !form.restaurantName) {
                  toast.error("Veuillez remplir tous les champs");
                  return;
                }
                if (form.password.length < 6) {
                  toast.error("Mot de passe trop court (min. 6 caractères)");
                  return;
                }
                setStep(2);
              }}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 rounded-xl transition-all mt-1 shadow-lg shadow-violet-100 hover:-translate-y-px active:translate-y-0"
            >
              Continuer →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Choisissez votre forfait — 14 jours offerts :
            </p>

            {displayPlans.map((plan) => (
              <label
                key={plan.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all",
                  form.planId === plan.id
                    ? "border-violet-500 bg-violet-50"
                    : "border-gray-100 hover:border-gray-200 bg-white"
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
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                  form.planId === plan.id ? "border-violet-500 bg-violet-500" : "border-gray-300"
                )}>
                  {form.planId === plan.id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">{plan.name}</span>
                    {plan.isFeatured && (
                      <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full">
                        Populaire
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {plan.maxTables} tables · {plan.maxMenuItems} articles · {plan.maxStaffUsers} personnel
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-black text-gray-900 text-sm">{formatPlanPrice(plan)}</span>
                  <span className="text-gray-400 text-xs font-normal">/mois</span>
                </div>
              </label>
            ))}

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              14 jours d&apos;essai offerts — aucun paiement requis maintenant
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-all text-sm"
              >
                ← Retour
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-violet-100"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Création...</>
                  : "Créer mon compte"
                }
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
