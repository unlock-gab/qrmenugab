"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

type Category = {
  id: string;
  name: string;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  _count: { menuItems: number };
};

type Props = {
  initialCategories: Category[];
};

function CategoryImage({ cat, onUploaded }: { cat: Category; onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      const patchRes = await fetch(`/api/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: data.url }),
      });
      if (patchRes.ok) {
        onUploaded(data.url);
        toast.success("Photo mise à jour");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="relative group cursor-pointer shrink-0" onClick={() => inputRef.current?.click()}>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
      {cat.imageUrl ? (
        <img src={cat.imageUrl} alt={cat.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-100" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-violet-50 border-2 border-dashed border-violet-200 flex items-center justify-center text-xl">
          🍽️
        </div>
      )}
      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
        {uploading
          ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : <span className="text-white text-xs font-bold">📷</span>
        }
      </div>
    </div>
  );
}

export function CategoriesClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const create = useCallback(async () => {
    if (!newName.trim()) return;
    setLoading(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error("Échec de la création");
    } else {
      setCategories((prev) => [...prev, { ...data, _count: { menuItems: 0 } }]);
      setNewName("");
      toast.success("Catégorie créée");
    }
  }, [newName]);

  const saveEdit = useCallback(async () => {
    if (!editId || !editName.trim()) return;
    const res = await fetch(`/api/categories/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error("Échec de la mise à jour");
    } else {
      setCategories((prev) => prev.map((c) => (c.id === editId ? { ...data, _count: c._count } : c)));
      setEditId(null);
      toast.success("Catégorie mise à jour");
    }
  }, [editId, editName]);

  const toggleActive = useCallback(async (id: string, current: boolean) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    const data = await res.json();
    if (res.ok) {
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...data, _count: c._count } : c)));
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Échec de la suppression");
    } else {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Catégorie supprimée");
    }
  }, []);

  const handleImageUploaded = useCallback((id: string, url: string) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, imageUrl: url } : c)));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
          <p className="text-gray-500 text-sm mt-1">{categories.length} catégorie{categories.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="Nom de catégorie..."
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 w-48"
          />
          <button
            onClick={create}
            disabled={loading || !newName.trim()}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
          >
            {loading ? "..." : "Ajouter"}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-4">💡 Cliquez sur l&apos;icône de la catégorie pour ajouter une photo circulaire visible dans le menu client.</p>

      {categories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 font-medium">Aucune catégorie</p>
          <p className="text-gray-400 text-sm mt-1">Ajoutez votre première catégorie ci-dessus</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
              <CategoryImage cat={cat} onUploaded={(url) => handleImageUploaded(cat.id, url)} />
              <div className="flex-1 min-w-0">
                {editId === cat.id ? (
                  <div className="flex gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 w-48"
                      autoFocus
                    />
                    <button onClick={saveEdit} className="text-xs px-3 py-1.5 bg-violet-600 text-white rounded-lg">Sauver</button>
                    <button onClick={() => setEditId(null)} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg">Annuler</button>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-400">{cat._count.menuItems} article{cat._count.menuItems !== 1 ? "s" : ""}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(cat.id, cat.isActive)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                    cat.isActive ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {cat.isActive ? "Actif" : "Inactif"}
                </button>
                <button
                  onClick={() => { setEditId(cat.id); setEditName(cat.name); }}
                  className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Renommer
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="text-xs px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
