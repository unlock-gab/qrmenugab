"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

interface NewOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  table?: { tableNumber: string } | null;
  orderItems: { menuItem: { name: string }; quantity: number }[];
}

interface Toast {
  id: string;
  orders: NewOrder[];
}

// ─── Singleton AudioContext ──────────────────────────────────────────────────
// Browsers block audio until a direct user gesture (click/tap).
// We create one context, keep it, and resume() it after a user click.
let _ctx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!_ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    _ctx = new Ctor();
  }
  return _ctx;
}

function isAudioUnlocked(): boolean {
  return !!_ctx && _ctx.state === "running";
}

async function unlockAudio(): Promise<boolean> {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") await ctx.resume();
    return ctx.state === "running";
  } catch {
    return false;
  }
}

// ─── Ring synthesizer ────────────────────────────────────────────────────────
function playPhoneRing() {
  try {
    const ctx = getAudioContext();
    if (ctx.state !== "running") return; // not unlocked yet — silent

    // iPhone-style: ascending E major chord (E5→G#5→B5→E6) × 3 rings
    const melody = [659, 830, 988, 1319];

    for (let ring = 0; ring < 3; ring++) {
      const ringStart = ring * 1.4;

      // Ascending melody notes
      melody.forEach((freq, noteIdx) => {
        const t0  = ctx.currentTime + ringStart + noteIdx * 0.12;
        const dur = 0.10;

        [freq, freq * 1.005].forEach((f) => {
          const osc  = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.value = f;
          gain.gain.setValueAtTime(0, t0);
          gain.gain.linearRampToValueAtTime(0.55, t0 + 0.015);
          gain.gain.setValueAtTime(0.55, t0 + dur - 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur + 0.08);
          osc.start(t0);
          osc.stop(t0 + dur + 0.12);
        });
      });

      // Double-pulse tail (ring … ring …)
      [ringStart + 0.65, ringStart + 0.85].forEach((ps) => {
        [880, 1100].forEach((f) => {
          const osc  = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.value = f;
          const t0 = ctx.currentTime + ps;
          gain.gain.setValueAtTime(0, t0);
          gain.gain.linearRampToValueAtTime(0.45, t0 + 0.012);
          gain.gain.setValueAtTime(0.45, t0 + 0.10);
          gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
          osc.start(t0);
          osc.stop(t0 + 0.22);
        });
      });
    }
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────

const POLL_INTERVAL = 10_000;
const STORAGE_KEY   = "qrmenu_last_order_check";

export function OrderBuzzer() {
  const [soundOn, setSoundOn]   = useState(false); // true once user unlocks audio
  const [toasts, setToasts]     = useState<Toast[]>([]);
  const [ringing, setRinging]   = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initRef    = useRef(false);

  // ── Unlock audio via user click ──────────────────────────────────────────
  const handleEnableSound = useCallback(async () => {
    const ok = await unlockAudio();
    setSoundOn(ok);
  }, []);

  // ── Dismiss toast ────────────────────────────────────────────────────────
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    setRinging(false);
  }, []);

  // ── Poll for new NEW orders ──────────────────────────────────────────────
  const poll = useCallback(async () => {
    try {
      const since = localStorage.getItem(STORAGE_KEY)
        || new Date(Date.now() - 60_000).toISOString();

      const res = await fetch(
        `/api/orders?status=NEW&since=${encodeURIComponent(since)}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;

      const orders: NewOrder[] = await res.json();
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());

      const newOrders = orders.filter((o) => !seenIdsRef.current.has(o.id));
      newOrders.forEach((o) => seenIdsRef.current.add(o.id));

      if (!initRef.current) { initRef.current = true; return; }

      if (newOrders.length > 0) {
        playPhoneRing();       // silent if not unlocked
        setRinging(true);
        setTimeout(() => setRinging(false), 4_500);

        const toast: Toast = { id: `${Date.now()}`, orders: newOrders };
        setToasts((prev) => [...prev.slice(-3), toast]);
        setTimeout(() => dismissToast(toast.id), 14_000);
      }
    } catch {}
  }, [dismissToast]);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, new Date(Date.now() - 60_000).toISOString());
    }
    // Sync initial sound state in case context was created earlier
    setSoundOn(isAudioUnlocked());
    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [poll]);

  return (
    <>
      {/* ── Sound enable button (fixed, always visible) ────────────────── */}
      {!soundOn && (
        <button
          onClick={handleEnableSound}
          title="Cliquez pour activer les alertes sonores des commandes"
          className="fixed top-[52px] right-3 z-[9998] flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold px-3 py-1.5 rounded-b-xl shadow-lg transition-all animate-pulse"
        >
          🔇 Activer le son
        </button>
      )}

      {/* ── Toast notifications ─────────────────────────────────────────── */}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
          {toasts.map((toast, idx) => (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-start gap-3 bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 max-w-sm w-full border border-violet-500/50"
              style={{ animation: "buzzerSlideUp 0.35s ease-out" }}
            >
              <div className={`mt-0.5 shrink-0 text-2xl ${idx === 0 && ringing ? "buzzer-ring-icon" : ""}`}>
                📞
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white leading-tight">
                  {toast.orders.length === 1
                    ? "🆕 Nouvelle commande !"
                    : `🆕 ${toast.orders.length} nouvelles commandes !`}
                </p>
                {toast.orders.map((order) => (
                  <p key={order.id} className="text-xs text-gray-300 mt-0.5 truncate">
                    <span className="font-mono text-violet-300">#{order.orderNumber}</span>
                    {order.table ? ` · Table ${order.table.tableNumber}` : ""}
                    {" · "}
                    {order.orderItems
                      .slice(0, 2)
                      .map((i) => `${i.quantity}× ${i.menuItem.name}`)
                      .join(", ")}
                    {order.orderItems.length > 2 ? ` +${order.orderItems.length - 2}` : ""}
                  </p>
                ))}
                <div className="flex items-center gap-3 mt-2">
                  <Link
                    href="/merchant/orders"
                    className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition"
                    onClick={() => dismissToast(toast.id)}
                  >
                    Voir les commandes →
                  </Link>
                </div>
              </div>

              <button
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 text-gray-500 hover:text-gray-300 transition text-xl leading-none mt-0.5"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
          ))}

          <style>{`
            @keyframes buzzerSlideUp {
              from { opacity: 0; transform: translateY(20px) scale(0.96); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes buzzerRingShake {
              0%,100% { transform: rotate(0deg);  }
              15%     { transform: rotate(-20deg); }
              30%     { transform: rotate(20deg);  }
              45%     { transform: rotate(-15deg); }
              60%     { transform: rotate(15deg);  }
              75%     { transform: rotate(-8deg);  }
              90%     { transform: rotate(8deg);   }
            }
            .buzzer-ring-icon {
              animation: buzzerRingShake 0.6s ease-in-out infinite;
              display: inline-block;
            }
          `}</style>
        </div>
      )}
    </>
  );
}
