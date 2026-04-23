"use client";

import { useState } from "react";
import { toast } from "sonner";

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  currency: string;
  soundEnabled: boolean;
};

const CURRENCIES = ["USD", "EUR", "GBP", "SAR", "AED", "EGP", "MAD", "TND", "QAR", "KWD", "BHD"];

export function SettingsClient({ restaurant }: { restaurant: Restaurant }) {
  const [form, setForm] = useState({
    name: restaurant.name,
    description: restaurant.description || "",
    phone: restaurant.phone || "",
    address: restaurant.address || "",
    logoUrl: restaurant.logoUrl || "",
    currency: restaurant.currency,
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
      toast.error("Restaurant name is required");
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
        logoUrl: form.logoUrl.trim() || null,
        currency: form.currency,
        soundEnabled: form.soundEnabled,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      toast.success("Settings saved successfully");
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to save settings");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Restaurant Info</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Restaurant Name *</label>
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
              placeholder="A brief description of your restaurant..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => handleChange("currency", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="123 Main Street, City"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo URL</label>
            <input
              type="url"
              value={form.logoUrl}
              onChange={(e) => handleChange("logoUrl", e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            {form.logoUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img src={form.logoUrl} alt="Logo preview" className="w-12 h-12 rounded-xl object-cover border border-gray-200" />
                <p className="text-xs text-gray-400">Logo preview</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Notifications</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Sound notifications</p>
            <p className="text-xs text-gray-500 mt-0.5">Play a sound when new orders arrive</p>
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
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">System Info</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Restaurant Slug</label>
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
                toast.success("Slug copied!");
              }}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-xl transition"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">The slug cannot be changed to preserve existing QR codes.</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {saved && (
          <span className="text-sm text-green-600 font-medium flex items-center gap-1.5">
            <span>✓</span> Saved successfully
          </span>
        )}
        <div className="ml-auto">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition disabled:opacity-50 shadow-sm"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
