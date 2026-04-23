"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function MerchantLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      toast.error("Email ou mot de passe incorrect");
    } else {
      router.push("/merchant/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="w-full max-w-md px-6">
      <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-10 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-3xl font-black text-white">Q</span>
            </div>
            <span className="text-white text-xl font-black tracking-tight">QRMenu</span>
          </Link>
          <p className="text-orange-100 mt-2 text-sm">Espace Marchand</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Connexion</h2>
          <p className="text-gray-500 text-sm mb-6">Accédez à votre tableau de bord</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Adresse e-mail
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                placeholder="vous@restaurant.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <input
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 rounded-xl text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-orange-200"
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore de compte ?{" "}
            <Link href="/signup" className="text-orange-600 font-semibold hover:text-orange-700">
              Essai gratuit
            </Link>
          </p>

          <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
            <p className="text-xs text-orange-700 font-medium mb-1">Compte démo</p>
            <p className="text-xs text-orange-600">Email: demo@restaurant.com</p>
            <p className="text-xs text-orange-600">Mot de passe: demo123</p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        <Link href="/" className="hover:text-gray-600 transition-colors">← Retour à l&apos;accueil</Link>
      </p>
    </div>
  );
}
