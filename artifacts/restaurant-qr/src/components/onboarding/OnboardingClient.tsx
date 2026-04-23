"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  restaurant: {
    id: string; name: string; description: string | null; phone: string | null; address: string | null;
    tablesCount: number; categoriesCount: number; menuItemsCount: number;
  };
  categories: Array<{ id: string; name: string }>;
};

const STEPS = ["Welcome", "Restaurant Info", "Tables", "Menu Category", "First Item", "Ready!"];

export function OnboardingClient({ restaurant, categories: initialCategories }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState(initialCategories);

  const [info, setInfo] = useState({
    name: restaurant.name || "",
    description: restaurant.description || "",
    phone: restaurant.phone || "",
    address: restaurant.address || "",
  });
  const [tableCount, setTableCount] = useState(restaurant.tablesCount > 0 ? restaurant.tablesCount : 5);
  const [categoryName, setCategoryName] = useState("");
  const [menuItem, setMenuItem] = useState({ categoryId: "", name: "", description: "", price: "" });

  const post = async (stepName: string, data: unknown) => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: stepName, data }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Something went wrong");
      return false;
    }
    return true;
  };

  const handleRestaurantInfo = async () => {
    const ok = await post("restaurant", info);
    if (ok) setStep(2);
  };

  const handleTables = async () => {
    const ok = await post("tables", { count: tableCount });
    if (ok) setStep(3);
  };

  const handleCategory = async () => {
    if (!categoryName.trim()) { setError("Category name required"); return; }
    const ok = await post("category", { name: categoryName });
    if (ok) {
      const res = await fetch("/api/onboarding");
      const data = await res.json();
      const freshCategories = await fetch("/api/categories").then((r) => r.json()).catch(() => []);
      if (Array.isArray(freshCategories)) setCategories(freshCategories);
      setStep(4);
    }
  };

  const handleMenuItem = async () => {
    if (!menuItem.name || !menuItem.price || !menuItem.categoryId) {
      setError("Fill in all required fields");
      return;
    }
    const ok = await post("menuItem", menuItem);
    if (ok) setStep(5);
  };

  const handleComplete = async () => {
    const ok = await post("complete", {});
    if (ok) router.push("/dashboard");
  };

  const pct = (step / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
            <span className="text-white text-2xl">🍽️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurant Setup</h1>
          <p className="text-gray-500 mt-1 text-sm">Complete setup to start accepting orders</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Step {Math.max(step, 1)} of {STEPS.length - 1}</span>
            <span>{STEPS[step]}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-orange-100/50 border border-orange-100 p-8">
          {step === 0 && (
            <div className="text-center">
              <p className="text-4xl mb-4">👋</p>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Welcome, {info.name}!</h2>
              <p className="text-gray-500 mb-8">Your account has been created. Let's spend 2 minutes setting up your restaurant so you can start accepting QR orders.</p>
              <div className="space-y-3 text-left bg-orange-50 rounded-2xl p-4 mb-8">
                {[{ icon: "ℹ️", label: "Restaurant info" }, { icon: "🪑", label: "Set up tables" }, { icon: "🗂️", label: "Create a menu category" }, { icon: "✦", label: "Add first menu item" }].map((s) => (
                  <div key={s.label} className="flex items-center gap-3 text-sm text-gray-600">
                    <span>{s.icon}</span> {s.label}
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(1)}
                className="w-full bg-gradient-to-r from-orange-400 to-amber-500 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-orange-200 hover:opacity-90 transition-all">
                Start Setup →
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-5">Restaurant Info</h2>
              <div className="space-y-4">
                <Field label="Restaurant Name *" value={info.name} onChange={(v) => setInfo((f) => ({ ...f, name: v }))} placeholder="My Restaurant" />
                <Field label="Description" value={info.description} onChange={(v) => setInfo((f) => ({ ...f, description: v }))} placeholder="Brief description of your restaurant" />
                <Field label="Phone" value={info.phone} onChange={(v) => setInfo((f) => ({ ...f, phone: v }))} placeholder="+1 555-0000" />
                <Field label="Address" value={info.address} onChange={(v) => setInfo((f) => ({ ...f, address: v }))} placeholder="123 Main St" />
              </div>
              {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
              <StepActions onBack={() => setStep(0)} onNext={handleRestaurantInfo} loading={loading} />
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Set Up Tables</h2>
              <p className="text-gray-500 text-sm mb-6">How many tables does your restaurant have?</p>
              <div className="flex items-center justify-center gap-6 mb-8">
                <button onClick={() => setTableCount((n) => Math.max(1, n - 1))} className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-2xl text-xl font-bold text-gray-700 transition-all">−</button>
                <div className="text-center">
                  <span className="text-5xl font-bold text-orange-500">{tableCount}</span>
                  <p className="text-gray-400 text-sm mt-1">tables</p>
                </div>
                <button onClick={() => setTableCount((n) => n + 1)} className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-2xl text-xl font-bold text-gray-700 transition-all">+</button>
              </div>
              <p className="text-xs text-gray-400 text-center mb-6">Each table gets a unique QR code for ordering</p>
              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
              <StepActions onBack={() => setStep(1)} onNext={handleTables} loading={loading} />
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Add a Menu Category</h2>
              <p className="text-gray-500 text-sm mb-6">Start with one category (e.g. Burgers, Drinks, Appetizers)</p>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Category Name *</label>
                <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-orange-400 text-base"
                  placeholder="e.g. Main Dishes" autoFocus />
              </div>
              {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
              <StepActions onBack={() => setStep(2)} onNext={handleCategory} loading={loading} />
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Add Your First Item</h2>
              <p className="text-gray-500 text-sm mb-5">Add one menu item to get started</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Category *</label>
                  <select value={menuItem.categoryId} onChange={(e) => setMenuItem((f) => ({ ...f, categoryId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-orange-400">
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <Field label="Item Name *" value={menuItem.name} onChange={(v) => setMenuItem((f) => ({ ...f, name: v }))} placeholder="Classic Burger" />
                <Field label="Description" value={menuItem.description} onChange={(v) => setMenuItem((f) => ({ ...f, description: v }))} placeholder="Brief description" />
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Price *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input type="number" step="0.01" min="0" value={menuItem.price} onChange={(e) => setMenuItem((f) => ({ ...f, price: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-gray-800 focus:outline-none focus:border-orange-400" placeholder="12.99" />
                  </div>
                </div>
              </div>
              {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
              <StepActions onBack={() => setStep(3)} onNext={handleMenuItem} loading={loading} />
            </div>
          )}

          {step === 5 && (
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">You're All Set!</h2>
              <p className="text-gray-500 mb-8">Your restaurant is ready. Your QR codes will be active and customers can start ordering.</p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-8 text-sm text-emerald-700 text-left space-y-2">
                <p>✅ Restaurant info saved</p>
                <p>✅ {tableCount} tables created with QR codes</p>
                <p>✅ Menu category created</p>
                <p>✅ First menu item added</p>
              </div>
              <button onClick={handleComplete} disabled={loading}
                className="w-full bg-gradient-to-r from-orange-400 to-amber-500 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-orange-200 hover:opacity-90 transition-all disabled:opacity-50">
                {loading ? "Setting up..." : "Go to Dashboard →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1.5">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-orange-400"
        placeholder={placeholder} />
    </div>
  );
}

function StepActions({ onBack, onNext, loading }: { onBack: () => void; onNext: () => void; loading: boolean }) {
  return (
    <div className="flex gap-3 mt-6">
      <button onClick={onBack} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-2xl transition-all">
        Back
      </button>
      <button onClick={onNext} disabled={loading}
        className="flex-1 bg-gradient-to-r from-orange-400 to-amber-500 text-white font-semibold py-3 rounded-2xl shadow-md shadow-orange-200 hover:opacity-90 transition-all disabled:opacity-50">
        {loading ? "Saving..." : "Continue →"}
      </button>
    </div>
  );
}
