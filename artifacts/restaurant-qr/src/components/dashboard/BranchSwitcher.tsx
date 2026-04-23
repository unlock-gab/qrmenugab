"use client";

import { useState, useEffect, useRef } from "react";

interface Branch { id: string; name: string; slug: string; isDefault: boolean; status: string }

const STORAGE_KEY = "selectedBranchId";

export function getBranchId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setBranchId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(STORAGE_KEY, id);
  else localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("branchChanged"));
}

export function BranchSwitcher({ restaurantId }: { restaurantId: string }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.ok ? r.json() : [])
      .then((data: Branch[]) => {
        setBranches(data.filter((b) => b.status === "ACTIVE"));
        const stored = getBranchId();
        if (stored && data.find((b) => b.id === stored)) {
          setSelectedId(stored);
        } else if (data.length > 0) {
          const def = data.find((b) => b.isDefault) || data[0];
          setSelectedId(def.id);
          setBranchId(def.id);
        }
      });
  }, [restaurantId]);

  useEffect(() => {
    const handler = () => setSelectedId(getBranchId());
    window.addEventListener("branchChanged", handler);
    return () => window.removeEventListener("branchChanged", handler);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = branches.find((b) => b.id === selectedId);
  if (branches.length === 0) return null;

  const select = (id: string) => {
    setSelectedId(id);
    setBranchId(id);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative px-3 pb-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-2.5 py-2 bg-gray-800/60 hover:bg-gray-800 rounded-xl text-left transition group"
      >
        <span className="text-sm shrink-0">🏪</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 leading-tight">Succursale</p>
          <p className="text-xs font-semibold text-gray-200 truncate">{selected?.name || "—"}</p>
        </div>
        <span className={`text-gray-500 text-xs transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="absolute left-3 right-3 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-1.5 space-y-0.5">
            <p className="px-2 py-1 text-xs text-gray-500 font-semibold uppercase tracking-wider">Succursales</p>
            {branches.map((b) => (
              <button key={b.id} onClick={() => select(b.id)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition flex items-center gap-2 ${selectedId === b.id ? "bg-orange-500/20 text-orange-300" : "text-gray-300 hover:bg-gray-700"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${selectedId === b.id ? "bg-orange-400" : "bg-gray-600"}`} />
                <span className="font-medium">{b.name}</span>
                {b.isDefault && <span className="text-gray-500 text-xs ml-auto">Défaut</span>}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-700 p-1.5">
            <a href="/branches" className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition">
              <span>⚙</span> Gérer les succursales
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
