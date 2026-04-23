"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { t, getLang, setLang, type Locale } from "@/lib/i18n";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") || "/customer/orders";
  const [lang, setLangState] = useState<Locale>("fr");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { setLangState(getLang()); }, []);
  const switchLang = () => { const n: Locale = lang === "fr" ? "ar" : "fr"; setLang(n); setLangState(n); };
  const tr = (key: Parameters<typeof t>[0]) => t(key, lang);
  const isRTL = lang === "ar";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/customer/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { toast.error(data.error || (isRTL ? "فشل تسجيل الدخول" : "Échec de la connexion")); return; }
    toast.success(isRTL ? `مرحباً ${data.name}!` : `Bienvenue, ${data.name} !`);
    router.push(redirect);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-orange-50 to-white" dir={isRTL ? "rtl" : "ltr"}>
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-4">
          <button onClick={switchLang} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition font-bold">
            {lang === "fr" ? "عر" : "FR"}
          </button>
        </div>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🍽️</div>
          <h1 className="text-2xl font-bold text-gray-900">{tr("customerLogin")}</h1>
          <p className="text-gray-500 text-sm mt-1">{tr("customerLoginSub")}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tr("email")}</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="votre@email.com" autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tr("password")}</label>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="••••••" autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition disabled:opacity-50">
              {loading ? tr("signingIn") : tr("signIn")}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            {tr("noAccount")}{" "}
            <Link href="/customer/register" className="text-orange-500 font-medium hover:underline">{tr("createAccount")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
