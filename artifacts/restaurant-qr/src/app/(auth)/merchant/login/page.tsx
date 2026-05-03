"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2, Eye, EyeOff, QrCode, Check, ArrowRight } from "lucide-react";

const FEATURES = [
  "Commandes QR en temps réel",
  "Gestion cuisine, service & caisse",
  "Menu digital sans application",
  "Alertes sonores & notifications",
];

export default function MerchantLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      toast.error("Email ou mot de passe incorrect");
    } else {
      router.push("/merchant/dashboard");
      router.refresh();
    }
  }

  const inputClass = "w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition-all";

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL — brand ───────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/3 translate-y-1/3" />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center border border-white/30">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-white text-2xl tracking-tight">QRMenu</span>
        </Link>

        {/* Center */}
        <div className="relative z-10">
          <p className="text-orange-100 text-sm font-semibold uppercase tracking-widest mb-3">Espace Marchand</p>
          <h1 className="text-4xl font-black text-white leading-tight mb-5">
            Bienvenue dans votre tableau de bord
          </h1>
          <p className="text-orange-100 text-lg leading-relaxed mb-8">
            Gérez vos commandes, tables, menu et personnel depuis une seule interface.
          </p>
          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-white/25 rounded-full flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-orange-100 text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm">K</div>
              <div>
                <p className="text-white text-sm font-semibold">Karim B.</p>
                <p className="text-orange-200 text-xs">Café Atlas, Alger</p>
              </div>
            </div>
            <p className="text-white/90 text-sm italic">
              &ldquo;Les commandes arrivent directement en cuisine. Zéro erreur depuis qu&apos;on utilise QRMenu.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ───────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50">
        {/* Mobile logo */}
        <Link href="/" className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-gray-900 text-xl">QRMenu</span>
        </Link>

        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h2 className="text-2xl font-black text-gray-900 mb-1">Connexion</h2>
            <p className="text-gray-500 text-sm">Accédez à votre tableau de bord</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                  Adresse e-mail
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className={inputClass}
                  placeholder="vous@restaurant.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className={`${inputClass} pr-11`}
                    placeholder="••••••••"
                    autoComplete="current-password"
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
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-100 hover:-translate-y-px active:translate-y-0"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Connexion...</>
                  : "Se connecter"
                }
              </button>
            </form>

            {/* Demo account */}
            <div className="mt-5 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs font-bold text-amber-700 mb-1.5">Compte démo</p>
              <p className="text-xs text-amber-600 font-mono">demo@restaurant.com</p>
              <p className="text-xs text-amber-600 font-mono">demo123</p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore de compte ?{" "}
            <Link href="/signup" className="text-orange-600 font-bold hover:text-orange-700 transition-colors">
              Essai gratuit 14 jours <ArrowRight className="inline w-3.5 h-3.5" />
            </Link>
          </p>

          <p className="text-center text-xs text-gray-400 mt-3">
            <Link href="/" className="hover:text-gray-600 transition-colors">← Retour à l&apos;accueil</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
