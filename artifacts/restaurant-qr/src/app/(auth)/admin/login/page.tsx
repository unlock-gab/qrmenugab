"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminLoginPage() {
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
      toast.error("Identifiants invalides");
    } else {
      router.push("/admin/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="w-full max-w-md px-6">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-10 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
              <span className="text-3xl font-black text-white">Q</span>
            </div>
            <span className="text-white text-xl font-black tracking-tight">QRMenu</span>
          </Link>
          <p className="text-slate-300 mt-2 text-xs font-semibold tracking-widest uppercase">Administration Plateforme</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Connexion Admin</h2>
          <p className="text-gray-500 text-sm mb-6">Accès réservé aux administrateurs</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition"
                placeholder="admin@plateforme.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <input
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion..." : "Accéder au panneau"}
            </button>
          </form>

          <p className="text-center mt-6">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">← Retour à l&apos;accueil</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
