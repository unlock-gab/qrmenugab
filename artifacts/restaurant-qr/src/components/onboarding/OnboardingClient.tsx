"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Props = {
  restaurant: {
    id: string;
    name: string;
    description: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    restaurantType: string | null;
    logoUrl: string | null;
    tablesCount: number;
    categoriesCount: number;
    menuItemsCount: number;
    onboardingStep: number;
  };
  categories: Array<{ id: string; name: string }>;
};

const STEPS = [
  { id: 0, label: "Bienvenue", icon: "👋" },
  { id: 1, label: "Votre restaurant", icon: "🏪" },
  { id: 2, label: "Tables", icon: "⊞" },
  { id: 3, label: "Catégorie", icon: "≡" },
  { id: 4, label: "Menu", icon: "✦" },
  { id: 5, label: "Terminé !", icon: "🎉" },
];

const RESTAURANT_TYPES = [
  "Restaurant",
  "Café",
  "Fast-food",
  "Pizzeria",
  "Boulangerie",
  "Pâtisserie",
  "Snack",
  "Grill",
  "Pizzeria",
  "Sushi",
  "Autre",
];

const CATEGORY_SUGGESTIONS = [
  "Plats principaux", "Boissons", "Desserts", "Entrées",
  "Fast-food", "Sandwichs", "Salades", "Café", "Petit-déjeuner",
];

export function OnboardingClient({ restaurant, categories: initialCategories }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(Math.min(restaurant.onboardingStep, 5));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState(initialCategories);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const [info, setInfo] = useState({
    name: restaurant.name || "",
    description: restaurant.description || "",
    phone: restaurant.phone || "",
    address: restaurant.address || "",
    city: restaurant.city || "",
    restaurantType: restaurant.restaurantType || "",
    logoUrl: restaurant.logoUrl || "",
  });
  const [tableCount, setTableCount] = useState(
    restaurant.tablesCount > 0 ? restaurant.tablesCount : 5
  );
  const [categoryName, setCategoryName] = useState("");
  const [menuItem, setMenuItem] = useState({
    categoryId: "",
    name: "",
    description: "",
    price: "",
  });

  const post = async (stepName: string, data: unknown, targetStep?: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: stepName, data, targetStep }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Une erreur s'est produite");
        return false;
      }
      return true;
    } catch {
      setError("Erreur de connexion");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadLogo = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      let data: { url?: string; error?: string } = {};
      try { data = await res.json(); } catch {}
      if (!res.ok) throw new Error(data.error || "Erreur upload");
      if (!data.url) throw new Error("URL manquante");
      setInfo((f) => ({ ...f, logoUrl: data.url! }));
      toast.success("Logo téléchargé ✓");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du téléchargement");
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }, []);

  const goToStep = (n: number) => { setError(""); setStep(n); };

  const handleRestaurantInfo = async () => {
    if (!info.name.trim()) { setError("Le nom du restaurant est requis"); return; }
    const ok = await post("restaurant", {
      name: info.name.trim(),
      description: info.description.trim() || null,
      phone: info.phone.trim() || null,
      address: info.address.trim() || null,
      city: info.city.trim() || null,
      restaurantType: info.restaurantType || null,
      logoUrl: info.logoUrl || null,
    }, 2);
    if (ok) goToStep(2);
  };

  const handleTables = async () => {
    const ok = await post("tables", { count: tableCount }, 3);
    if (ok) goToStep(3);
  };

  const handleCategory = async () => {
    if (!categoryName.trim()) { setError("Le nom de la catégorie est requis"); return; }
    const ok = await post("category", { name: categoryName.trim() }, 4);
    if (ok) {
      const fresh = await fetch("/api/categories").then((r) => r.json()).catch(() => []);
      if (Array.isArray(fresh)) setCategories(fresh);
      goToStep(4);
    }
  };

  const handleMenuItem = async () => {
    if (!menuItem.name || !menuItem.price || !menuItem.categoryId) {
      setError("Remplissez tous les champs obligatoires");
      return;
    }
    const ok = await post("menuItem", menuItem, 5);
    if (ok) goToStep(5);
  };

  const handleComplete = async () => {
    const ok = await post("complete", {});
    if (ok) router.push("/merchant/dashboard");
  };

  const totalSteps = STEPS.length - 1;
  const pct = step === 0 ? 0 : (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-200">
            <span className="text-white text-2xl">🍽️</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Configuration du restaurant</h1>
          <p className="text-gray-500 mt-1 text-sm">Quelques minutes suffisent pour démarrer</p>
        </div>

        {/* Progress */}
        {step > 0 && step < 5 && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span className="font-medium">{STEPS[step]?.label}</span>
              <span>Étape {step} sur {totalSteps - 1}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {STEPS.slice(1, 5).map((s, i) => (
                <div key={s.id} className={`flex items-center gap-1 text-xs ${i + 1 <= step ? "text-orange-500 font-semibold" : "text-gray-400"}`}>
                  <span>{s.icon}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl shadow-orange-100/50 border border-orange-100 p-8">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <p className="text-5xl mb-4">👋</p>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Bienvenue, {info.name} !</h2>
              <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                Votre compte est créé. Configurons votre restaurant en quelques étapes simples pour commencer à recevoir des commandes QR.
              </p>
              <div className="space-y-2.5 text-left bg-orange-50 rounded-2xl p-4 mb-8">
                {[
                  { icon: "🏪", label: "Informations de votre restaurant" },
                  { icon: "⊞", label: "Configuration des tables" },
                  { icon: "≡", label: "Création d'une catégorie menu" },
                  { icon: "✦", label: "Ajout du premier article" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-base">{s.icon}</span>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => goToStep(1)}
                className="w-full bg-gradient-to-r from-orange-400 to-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-200 hover:opacity-90 transition-all text-base"
              >
                Commencer la configuration →
              </button>
            </div>
          )}

          {/* Step 1: Restaurant info */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-black text-gray-900 mb-1">Votre restaurant</h2>
              <p className="text-gray-500 text-sm mb-5">Ces informations apparaîtront sur votre page publique</p>

              {/* Logo upload */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Logo du restaurant</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0 overflow-hidden bg-gray-50">
                    {info.logoUrl ? (
                      <img src={info.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span className="text-2xl">🏪</span>
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={logoUploading}
                      className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                    >
                      {logoUploading ? "Téléchargement…" : "Choisir un logo"}
                    </button>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG — max 5 Mo</p>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Field label="Nom du restaurant *" value={info.name} onChange={(v) => setInfo((f) => ({ ...f, name: v }))} placeholder="Mon Restaurant" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville</label>
                    <input
                      value={info.city}
                      onChange={(e) => setInfo((f) => ({ ...f, city: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-orange-400 text-sm"
                      placeholder="Alger"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Type d'établissement</label>
                    <select
                      value={info.restaurantType}
                      onChange={(e) => setInfo((f) => ({ ...f, restaurantType: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-orange-400 text-sm"
                    >
                      <option value="">Choisir…</option>
                      {RESTAURANT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <Field label="Téléphone" value={info.phone} onChange={(v) => setInfo((f) => ({ ...f, phone: v }))} placeholder="+213 5XX XXX XXX" />
                <Field label="Adresse" value={info.address} onChange={(v) => setInfo((f) => ({ ...f, address: v }))} placeholder="123 Rue Principale" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description courte</label>
                  <textarea
                    value={info.description}
                    onChange={(e) => setInfo((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-orange-400 text-sm resize-none"
                    placeholder="Une brève description de votre restaurant…"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm mt-3 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
              <StepActions onBack={() => goToStep(0)} onNext={handleRestaurantInfo} loading={loading} />
            </div>
          )}

          {/* Step 2: Tables */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-black text-gray-900 mb-1">Configuration des tables</h2>
              <p className="text-gray-500 text-sm mb-6">Combien de tables a votre restaurant ?</p>

              <div className="flex items-center justify-center gap-8 mb-6">
                <button
                  onClick={() => setTableCount((n) => Math.max(1, n - 1))}
                  className="w-14 h-14 bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-bold text-gray-700 transition-all active:scale-95"
                >
                  −
                </button>
                <div className="text-center">
                  <span className="text-6xl font-black text-orange-500">{tableCount}</span>
                  <p className="text-gray-400 text-sm mt-1">tables</p>
                </div>
                <button
                  onClick={() => setTableCount((n) => n + 1)}
                  className="w-14 h-14 bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-bold text-gray-700 transition-all active:scale-95"
                >
                  +
                </button>
              </div>

              <div className="bg-orange-50 rounded-2xl p-4 mb-5 text-sm text-gray-600 flex items-start gap-3">
                <span className="text-xl shrink-0 mt-0.5">📱</span>
                <div>
                  <p className="font-semibold text-gray-800 mb-0.5">Chaque table reçoit un QR code unique</p>
                  <p className="text-gray-500">Vos clients scannent le QR et passent leur commande directement depuis leur téléphone.</p>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm mb-3 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
              <StepActions onBack={() => goToStep(1)} onNext={handleTables} loading={loading} />
            </div>
          )}

          {/* Step 3: Category */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-black text-gray-900 mb-1">Première catégorie</h2>
              <p className="text-gray-500 text-sm mb-5">Créez votre première catégorie de menu (ex: Plats, Boissons…)</p>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom de la catégorie *</label>
                <input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-orange-400 text-base"
                  placeholder="ex: Plats principaux"
                  autoFocus
                />
              </div>

              <div className="mb-5">
                <p className="text-xs text-gray-500 mb-2 font-medium">Suggestions :</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setCategoryName(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        categoryName === s
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-red-500 text-sm mb-3 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
              <StepActions onBack={() => goToStep(2)} onNext={handleCategory} loading={loading} />
            </div>
          )}

          {/* Step 4: First menu item */}
          {step === 4 && (
            <div>
              <h2 className="text-lg font-black text-gray-900 mb-1">Premier article du menu</h2>
              <p className="text-gray-500 text-sm mb-5">Ajoutez un premier article pour commencer</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Catégorie *</label>
                  <select
                    value={menuItem.categoryId}
                    onChange={(e) => setMenuItem((f) => ({ ...f, categoryId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-orange-400"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <Field
                  label="Nom de l'article *"
                  value={menuItem.name}
                  onChange={(v) => setMenuItem((f) => ({ ...f, name: v }))}
                  placeholder="ex: Burger classique"
                />
                <Field
                  label="Description (optionnel)"
                  value={menuItem.description}
                  onChange={(v) => setMenuItem((f) => ({ ...f, description: v }))}
                  placeholder="Une brève description…"
                />
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prix *</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={menuItem.price}
                      onChange={(e) => setMenuItem((f) => ({ ...f, price: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl pl-4 pr-14 py-2.5 text-gray-800 focus:outline-none focus:border-orange-400"
                      placeholder="1200"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">DA</span>
                  </div>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm mt-3 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
              <StepActions onBack={() => goToStep(3)} onNext={handleMenuItem} loading={loading} />
            </div>
          )}

          {/* Step 5: Done */}
          {step === 5 && (
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Vous êtes prêt !</h2>
              <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                Votre restaurant est configuré. Vos QR codes sont actifs — les clients peuvent déjà commander.
              </p>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-8 text-left space-y-2.5">
                {[
                  `✅ Informations du restaurant enregistrées`,
                  `✅ ${tableCount} tables créées avec QR codes`,
                  `✅ Catégorie de menu créée`,
                  `✅ Premier article ajouté`,
                ].map((line) => (
                  <p key={line} className="text-sm text-emerald-700 font-medium">{line}</p>
                ))}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-400 to-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-200 hover:opacity-90 transition-all disabled:opacity-50 text-base"
                >
                  {loading ? "Finalisation…" : "Accéder au tableau de bord →"}
                </button>
                <p className="text-xs text-gray-400">
                  Vous pourrez télécharger vos QR codes depuis le menu "Centre QR" du tableau de bord.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-orange-400 text-sm"
        placeholder={placeholder}
      />
    </div>
  );
}

function StepActions({
  onBack, onNext, loading,
}: {
  onBack: () => void; onNext: () => void; loading: boolean;
}) {
  return (
    <div className="flex gap-3 mt-6">
      <button
        onClick={onBack}
        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-2xl transition-all"
      >
        Retour
      </button>
      <button
        onClick={onNext}
        disabled={loading}
        className="flex-1 bg-gradient-to-r from-orange-400 to-amber-500 text-white font-bold py-3 rounded-2xl shadow-md shadow-orange-200 hover:opacity-90 transition-all disabled:opacity-50"
      >
        {loading ? "Enregistrement…" : "Continuer →"}
      </button>
    </div>
  );
}
