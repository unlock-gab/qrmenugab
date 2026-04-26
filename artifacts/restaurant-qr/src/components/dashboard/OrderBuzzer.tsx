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

// ─── Audio engine ─────────────────────────────────────────────────────────────
// We pre-render a ringtone using OfflineAudioContext (no user gesture needed),
// convert to a Blob URL, then play via HTMLAudioElement.
// HTMLAudioElement.play() is reliable on Safari iOS once unlocked by a tap.

let audioBlobUrl: string | null = null;
let audioEl: HTMLAudioElement | null = null;
let audioReady = false;   // true after user tap unlocks the element

/** Render the iPhone-style ringtone into an AudioBuffer, convert to WAV Blob. */
async function buildAudioBlob(): Promise<string> {
  if (audioBlobUrl) return audioBlobUrl;

  const sampleRate = 44100;
  const totalDur   = 4.2; // 3 rings × 1.4s each
  const offline    = new OfflineAudioContext(1, Math.ceil(sampleRate * totalDur), sampleRate);

  const melody = [659, 830, 988, 1319]; // E5 → G#5 → B5 → E6

  for (let ring = 0; ring < 3; ring++) {
    const ringOffset = ring * 1.4;

    // Ascending melody
    melody.forEach((freq, i) => {
      const t0 = ringOffset + i * 0.12;
      [freq, freq * 1.005].forEach((f) => {
        const osc  = offline.createOscillator();
        const gain = offline.createGain();
        osc.connect(gain);
        gain.connect(offline.destination);
        osc.type = "sine";
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.5, t0 + 0.015);
        gain.gain.setValueAtTime(0.5, t0 + 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.20);
        osc.start(t0);
        osc.stop(t0 + 0.25);
      });
    });

    // Double-pulse tail
    [ringOffset + 0.65, ringOffset + 0.85].forEach((ps) => {
      [880, 1100].forEach((f) => {
        const osc  = offline.createOscillator();
        const gain = offline.createGain();
        osc.connect(gain);
        gain.connect(offline.destination);
        osc.type = "sine";
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0, ps);
        gain.gain.linearRampToValueAtTime(0.4, ps + 0.012);
        gain.gain.setValueAtTime(0.4, ps + 0.10);
        gain.gain.exponentialRampToValueAtTime(0.001, ps + 0.18);
        osc.start(ps);
        osc.stop(ps + 0.22);
      });
    });
  }

  const buffer = await offline.startRendering();
  const wav    = audioBufferToWav(buffer);
  audioBlobUrl = URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
  return audioBlobUrl;
}

/** Encode AudioBuffer → WAV ArrayBuffer */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numCh   = 1;
  const sr      = buffer.sampleRate;
  const samples = buffer.getChannelData(0);
  const bitsPS  = 16;
  const bytePS  = bitsPS / 8;
  const dataLen = samples.length * bytePS;
  const ab      = new ArrayBuffer(44 + dataLen);
  const view    = new DataView(ab);
  const s       = (o: number, v: string) =>
    [...v].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));

  s(0, "RIFF");
  view.setUint32(4,  36 + dataLen, true);
  s(8, "WAVE");
  s(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);            // PCM
  view.setUint16(22, numCh, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * numCh * bytePS, true);
  view.setUint16(32, numCh * bytePS, true);
  view.setUint16(34, bitsPS, true);
  s(36, "data");
  view.setUint32(40, dataLen, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s16 = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s16 < 0 ? s16 * 0x8000 : s16 * 0x7fff, true);
    offset += 2;
  }
  return ab;
}

/** Call once inside a direct user-gesture handler to unlock the audio element. */
async function unlockAudioElement(): Promise<boolean> {
  try {
    const url = await buildAudioBlob();
    if (!audioEl) {
      audioEl = new Audio(url);
      audioEl.volume = 1.0;
    }
    // Play then immediately pause — this "unlocks" the element on Safari iOS
    await audioEl.play();
    audioEl.pause();
    audioEl.currentTime = 0;
    audioReady = true;
    return true;
  } catch {
    return false;
  }
}

function playRing() {
  if (!audioEl || !audioReady) return;
  audioEl.currentTime = 0;
  audioEl.play().catch(() => {});
}

// ─────────────────────────────────────────────────────────────────────────────

const POLL_INTERVAL = 10_000;
const STORAGE_KEY   = "qrmenu_last_order_check";

export function OrderBuzzer() {
  const [soundOn,  setSoundOn]  = useState(false);
  const [building, setBuilding] = useState(false);
  const [toasts,   setToasts]   = useState<Toast[]>([]);
  const [ringing,  setRinging]  = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initRef    = useRef(false);

  // ── Pre-render audio on mount (no gesture needed for OfflineAudioContext) ──
  useEffect(() => {
    buildAudioBlob().catch(() => {});
  }, []);

  // ── Unlock on user click ─────────────────────────────────────────────────
  const handleEnableSound = useCallback(async () => {
    setBuilding(true);
    const ok = await unlockAudioElement();
    setSoundOn(ok);
    setBuilding(false);
  }, []);

  // ── Dismiss toast ────────────────────────────────────────────────────────
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    setRinging(false);
  }, []);

  // ── Poll for new orders ─────────────────────────────────────────────────
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
        playRing();
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
    poll();
    const iv = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(iv);
  }, [poll]);

  return (
    <>
      {/* ── Persistent sound-enable button ──────────────────────────────── */}
      {!soundOn && (
        <button
          onClick={handleEnableSound}
          disabled={building}
          title="Cliquez pour recevoir les alertes sonores des nouvelles commandes"
          className="fixed top-[52px] right-3 z-[9998] flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-70 text-white text-xs font-bold px-3 py-1.5 rounded-b-xl shadow-lg transition-all animate-pulse"
        >
          {building ? "⏳ Chargement…" : "🔇 Activer le son"}
        </button>
      )}

      {/* ── Toasts ──────────────────────────────────────────────────────── */}
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
                <Link
                  href="/merchant/orders"
                  className="inline-block mt-2 text-xs font-semibold text-violet-400 hover:text-violet-300 transition"
                  onClick={() => dismissToast(toast.id)}
                >
                  Voir les commandes →
                </Link>
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
              from { opacity:0; transform:translateY(20px) scale(.96); }
              to   { opacity:1; transform:translateY(0) scale(1); }
            }
            @keyframes buzzerRingShake {
              0%,100%{transform:rotate(0deg);}
              15%{transform:rotate(-20deg);}
              30%{transform:rotate(20deg);}
              45%{transform:rotate(-15deg);}
              60%{transform:rotate(15deg);}
              75%{transform:rotate(-8deg);}
              90%{transform:rotate(8deg);}
            }
            .buzzer-ring-icon{
              animation:buzzerRingShake .6s ease-in-out infinite;
              display:inline-block;
            }
          `}</style>
        </div>
      )}
    </>
  );
}
