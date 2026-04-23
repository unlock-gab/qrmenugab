"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { t, getLang, setLang, type Locale } from "@/lib/i18n";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [lang, setLangState] = useState<Locale>("fr");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => { setLangState(getLang()); }, []);
  const switchLang = () => { const n: Locale = lang === "fr" ? "ar" : "fr"; setLang(n); setLangState(n); };
  const tr = (key: Parameters<typeof t>[0]) => t(key, lang);
  const isRTL = lang === "ar";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error(tr("passwordMismatch")); return; }
    setLoading(true);
    const res = await fetch("/api/customer/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone || undefined, password: form.password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { toast.error(data.error || (isRTL ? "فشل التسجيل" : "Échec de l'inscription")); return; }
    toast.success(tr("registerSuccess"));
    router.push("/customer/orders");
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
          <h1 className="text-2xl font-bold text-gray-900">{tr("register")}</h1>
          <p className="text-gray-500 text-sm mt-1">{tr("registerSub")}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            {[
              { key: "name", label: tr("fullName"), type: "text", placeholder: "Mohammed Ahmed", auto: "name" },
              { key: "email", label: tr("email"), type: "email", placeholder: "votre@email.com", auto: "email" },
              { key: "phone", label: tr("phoneOptional"), type: "tel", placeholder: "+213 6xx xxx xxx", auto: "tel" },
              { key: "password", label: tr("password"), type: "password", placeholder: "••••••", auto: "new-password" },
              { key: "confirm", label: tr("confirmPassword"), type: "password", placeholder: "••••••", auto: "new-password" },
            ].map(({ key, label, type, placeholder, auto }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input required={key !== "phone"} type={type}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder={placeholder} autoComplete={auto} />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition disabled:opacity-50 mt-2">
              {loading ? tr("creating") : tr("createAccount")}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            {tr("hasAccount")}{" "}
            <Link href="/customer/login" className="text-orange-500 font-medium hover:underline">{tr("signIn")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
