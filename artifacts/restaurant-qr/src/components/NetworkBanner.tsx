"use client";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useEffect, useState } from "react";

const MESSAGES = {
  offline: { fr: "Hors ligne — Vérifiez votre connexion", ar: "غير متصل — تحقق من الاتصال" },
  slow: { fr: "Connexion faible — Les données peuvent être obsolètes", ar: "اتصال ضعيف — قد تكون البيانات قديمة" },
  reconnecting: { fr: "Reconnexion en cours…", ar: "جاري إعادة الاتصال…" },
};

const COLORS = {
  offline: "bg-red-600",
  slow: "bg-amber-500",
  reconnecting: "bg-blue-600",
};

export function NetworkBanner() {
  const { state } = useNetworkStatus();
  const [lang, setLang] = useState<"fr" | "ar">("fr");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("lang") as "fr" | "ar") : "fr";
    setLang(stored || "fr");
  }, []);

  useEffect(() => {
    if (state !== "online") {
      setVisible(true);
    } else {
      const t = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(t);
    }
  }, [state]);

  if (!visible && state === "online") return null;

  const msg = state !== "online" ? MESSAGES[state as keyof typeof MESSAGES] : null;
  if (!msg) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] px-4 py-2 text-center text-white text-sm font-medium transition-all ${COLORS[state as keyof typeof COLORS] || "bg-gray-700"}`}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <span className="mr-2">{state === "offline" ? "📡" : state === "slow" ? "⚡" : "🔄"}</span>
      {msg[lang]}
    </div>
  );
}
