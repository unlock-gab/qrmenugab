"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

type Category = { id: string; name: string };
type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: { toNumber: () => number } | number | string;
  imageUrl: string | null;
  isAvailable: boolean;
  sortOrder: number;
  category: { id: string; name: string };
};

type Props = {
  initialItems: MenuItem[];
  categories: Category[];
};

const EMPTY_FORM = {
  categoryId: "",
  name: "",
  description: "",
  price: "",
  imageUrl: "",
};

export function MenuItemsClient({ initialItems, categories }: Props) {
  const [items, setItems] = useState(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.name || !form.price || !form.categoryId) return;
      setLoading(true);

      const payload = {
        categoryId: form.categoryId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: parseFloat(form.price),
        imageUrl: form.imageUrl.trim() || undefined,
      };

      const url = editId ? `/api/menu-items/${editId}` : "/api/menu-items";
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        toast.error(data.error || "Failed to save item");
      } else {
        if (editId) {
          setItems((prev) => prev.map((i) => (i.id === editId ? data : i)));
          toast.success("Item updated");
        } else {
          setItems((prev) => [...prev, data]);
          toast.success("Item created");
        }
        setShowForm(false);
        setEditId(null);
        setForm(EMPTY_FORM);
      }
    },
    [form, editId]
  );

  const toggleAvailable = useCallback(async (id: string, current: boolean) => {
    const res = await fetch(`/api/menu-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !current }),
    });
    const data = await res.json();
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i.id === id ? data : i)));
      toast.success(`Item ${data.isAvailable ? "available" : "unavailable"}`);
    } else {
      toast.error("Failed to update item");
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    if (!confirm("Delete this menu item?")) return;
    const res = await fetch(`/api/menu-items/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Item deleted");
    } else {
      toast.error("Failed to delete item");
    }
  }, []);

  const startEdit = (item: MenuItem) => {
    setEditId(item.id);
    const price =
      typeof item.price === "object" && "toNumber" in item.price
        ? item.price.toNumber().toString()
        : String(item.price);
    setForm({
      categoryId: item.category.id,
      name: item.name,
      description: item.description || "",
      price,
      imageUrl: item.imageUrl || "",
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Items</h1>
          <p className="text-gray-500 text-sm mt-1">{items.length} items</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition"
        >
          Add Item
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editId ? "Edit Item" : "New Menu Item"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Item name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                rows={2}
                placeholder="Item description (optional)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="9.99"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
                {loading ? "Saving..." : editId ? "Update Item" : "Create Item"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-gray-500 font-medium">No menu items yet</p>
          <p className="text-gray-400 text-sm mt-1">Add categories first, then create items</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center text-2xl shrink-0">🍽️</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">{item.category.name}</span>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-500 truncate mt-0.5">{item.description}</p>
                )}
                <p className="text-sm font-semibold text-orange-500 mt-0.5">{formatPrice(item.price)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleAvailable(item.id, item.isAvailable)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                    item.isAvailable ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}>
                  {item.isAvailable ? "Available" : "Unavailable"}
                </button>
                <button onClick={() => startEdit(item)}
                  className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                  Edit
                </button>
                <button onClick={() => deleteItem(item.id)}
                  className="text-xs px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition">
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
