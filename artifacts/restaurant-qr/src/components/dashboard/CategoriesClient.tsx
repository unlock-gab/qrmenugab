"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

type Category = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  _count: { menuItems: number };
};

type Props = {
  initialCategories: Category[];
};

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
      toast.error("Failed to create category");
    } else {
      setCategories((prev) => [...prev, { ...data, _count: { menuItems: 0 } }]);
      setNewName("");
      toast.success("Category created");
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
      toast.error("Failed to update category");
    } else {
      setCategories((prev) =>
        prev.map((c) => (c.id === editId ? { ...data, _count: c._count } : c))
      );
      setEditId(null);
      toast.success("Category updated");
    }
  }, [editId, editName]);

  const toggleActive = useCallback(async (id: string, current: boolean) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error("Failed to update category");
    } else {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...data, _count: c._count } : c))
      );
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to delete category");
    } else {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted");
    }
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm mt-1">{categories.length} categories</p>
        </div>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="Category name..."
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 w-48"
          />
          <button
            onClick={create}
            disabled={loading || !newName.trim()}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
          >
            {loading ? "..." : "Add"}
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 font-medium">No categories yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first category above</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-lg shrink-0">
                📋
              </div>
              <div className="flex-1 min-w-0">
                {editId === cat.id ? (
                  <div className="flex gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 w-48"
                      autoFocus
                    />
                    <button onClick={saveEdit} className="text-xs px-3 py-1.5 bg-orange-500 text-white rounded-lg">Save</button>
                    <button onClick={() => setEditId(null)} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg">Cancel</button>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-400">{cat._count.menuItems} item{cat._count.menuItems !== 1 ? "s" : ""}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(cat.id, cat.isActive)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                    cat.isActive
                      ? "bg-green-50 text-green-600 hover:bg-green-100"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {cat.isActive ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => { setEditId(cat.id); setEditName(cat.name); }}
                  className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="text-xs px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
