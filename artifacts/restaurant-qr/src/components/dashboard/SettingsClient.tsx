"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  currency: string;
  soundEnabled: boolean;
};


function ImageUploadField({
  label,
  value,
  onChange,
  aspect,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspect: "square" | "banner";
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImgError = () => {
    setImgError(true);
    onChange(""); // clear broken URL from form
  };

  useEffect(() => { setImgError(false); }, [value]);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      let data: { url?: string; error?: string } = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }
      if (!res.ok) throw new Error(data.error || "Erreur upload");
      if (!data.url) throw new Error("URL manquante dans la réponse");
      onChange(data.url);
      toast.success("Photo téléchargée ✓");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du téléchargement");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [onChange]);

  const isBanner = aspect === "banner";

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
      {value && !imgError ? (
        <div className="relative group">
          <img
            src={value}
            alt={label}
            onError={handleImgError}
            className={`w-full object-cover rounded-xl border border-gray-200 ${isBanner ? "h-36" : "h-28 w-28"}`}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 bg-white text-gray-800 text-xs font-semibold rounded-lg hover:bg-gray-100 transition"
            >
              {uploading ? "..." : "Changer"}
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition"
            >
              Supprimer
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`w-full border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-orange-300 transition flex flex-col items-center justify-center gap-2 text-gray-400 disabled:opacity-50 ${isBanner ? "h-36" : "h-28"}`}
        >
          {uploading ? (
            <span className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span className="text-2xl">{isBanner ? "🖼️" : "🏷️"}</span>
              <span className="text-sm font-medium">Cliquer pour ajouter</span>
              {hint && <span className="text-xs">{hint}</span>}
            </>
          )}
        </button>
      )}
    </div>
  );
}

export function SettingsClient({ restaurant }: { restaurant: Restaurant }) {
  const [form, setForm] = useState({
    name: restaurant.name,
    description: restaurant.description || "",
    phone: restaurant.phone || "",
    address: restaurant.address || "",
    logoUrl: restaurant.logoUrl || "",
    coverImageUrl: restaurant.coverImageUrl || "",
    currency: "DZD",
    soundEnabled: restaurant.soundEnabled,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Le nom du restaurant est requis");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        logoUrl: form.logoUrl || null,
        coverImageUrl: form.coverImageUrl || null,
        currency: form.currency,
        soundEnabled: form.soundEnabled,
      }),
    });
    setSaving(false);
    try {
      const data = await res.json();
      if (res.ok) {
        setSaved(true);
        toast.success("Paramètres enregistrés");
      } else {
        toast.error(data?.error || "Échec de l'enregistrement");
      }
    } catch {
      if (res.ok) {
        setSaved(true);
        toast.success("Paramètres enregistrés");
      } else {
        toast.error("Erreur serveur");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Photos du restaurant</h2>
        <div className="space-y-5">
          <ImageUploadField
            label="Photo de couverture"
            value={form.coverImageUrl}
            onChange={(url) => handleChange("coverImageUrl", url)}
            aspect="banner"
            hint="JPG, PNG ou WebP — recommandé 1200×400"
          />
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <ImageUploadField
                label="Logo / Icône"
                value={form.logoUrl}
                onChange={(url) => handleChange("logoUrl", url)}
                aspect="square"
                hint="Carré recommandé"
              />
            </div>
            {(form.logoUrl || form.coverImageUrl) && (
              <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-500 mb-2 font-medium">Aperçu carte</p>
                <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                  {form.coverImageUrl
                    ? <img src={form.coverImageUrl} alt="cover" className="w-full h-14 object-cover" />
                    : <div className="w-full h-14 bg-gradient-to-br from-orange-100 to-orange-200" />
                  }
                  <div className="px-2 pb-2 -mt-5 flex items-end gap-2">
                    {form.logoUrl
                      ? <img src={form.logoUrl} alt="logo" className="w-10 h-10 rounded-lg object-cover border-2 border-white shadow shrink-0" />
                      : <div className="w-10 h-10 rounded-lg bg-orange-500 border-2 border-white shrink-0" />
                    }
                    <span className="text-xs font-bold text-gray-800 truncate pb-0.5">{form.name || "Votre restaurant"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Informations du restaurant</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du restaurant *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Demo Bistro"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Une courte description de votre restaurant..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+213 555 000 000"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Devise</label>
              <div className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-700 font-semibold">
                DZD — Dinar Algérien
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="123 Rue Principale, Alger"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Notifications</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Notifications sonores</p>
            <p className="text-xs text-gray-500 mt-0.5">Jouer un son à chaque nouvelle commande</p>
          </div>
          <button
            onClick={() => handleChange("soundEnabled", !form.soundEnabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.soundEnabled ? "bg-orange-500" : "bg-gray-200"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${form.soundEnabled ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Informations système</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug du restaurant</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={restaurant.slug}
              readOnly
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-500 font-mono cursor-not-allowed"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(restaurant.slug);
                toast.success("Slug copié !");
              }}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-xl transition"
            >
              Copier
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Le slug ne peut pas être modifié pour préserver les QR codes existants.</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {saved && (
          <span className="text-sm text-green-600 font-medium flex items-center gap-1.5">
            <span>✓</span> Enregistré avec succès
          </span>
        )}
        <div className="ml-auto">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition disabled:opacity-50 shadow-sm"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
