"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface Branch {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  status: "ACTIVE" | "INACTIVE";
  isDefault: boolean;
  _count: { tables: number; orders: number };
}

const EMPTY_FORM = { name: "", slug: "", address: "", phone: "" };

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 60);
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then(setBranches)
      .finally(() => setLoading(false));
  }, []);

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: editId ? f.slug : slugify(name) }));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) return;
    setSaving(true);

    const url = editId ? `/api/branches/${editId}` : "/api/branches";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, slug: form.slug, address: form.address || undefined, phone: form.phone || undefined }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      toast.error(data.error || "فشل الحفظ");
    } else {
      if (editId) {
        setBranches((b) => b.map((br) => br.id === editId ? data : br));
        toast.success("تم تحديث الفرع");
      } else {
        setBranches((b) => [...b, data]);
        toast.success("تم إنشاء الفرع");
      }
      setShowForm(false); setEditId(null); setForm(EMPTY_FORM);
    }
  }, [form, editId]);

  const toggleStatus = async (branch: Branch) => {
    if (branch.isDefault) { toast.error("لا يمكن تعطيل الفرع الرئيسي"); return; }
    const newStatus = branch.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await fetch(`/api/branches/${branch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (res.ok) setBranches((b) => b.map((br) => br.id === branch.id ? data : br));
  };

  const deleteBranch = async (id: string) => {
    if (!confirm("حذف هذا الفرع؟ تأكد من إزالة جميع الطاولات أولاً.")) return;
    const res = await fetch(`/api/branches/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      setBranches((b) => b.filter((br) => br.id !== id));
      toast.success("تم حذف الفرع");
    } else {
      toast.error(data.error || "فشل الحذف");
    }
  };

  const startEdit = (b: Branch) => {
    setEditId(b.id); setForm({ name: b.name, slug: b.slug, address: b.address || "", phone: b.phone || "" }); setShowForm(true);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الفروع</h1>
          <p className="text-gray-500 text-sm mt-1">{branches.length} فرع</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition">
          + إضافة فرع
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{editId ? "تعديل الفرع" : "فرع جديد"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الفرع *</label>
                <input required value={form.name} onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="الفرع الرئيسي" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL) *</label>
                <input required value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono"
                  placeholder="main-branch" disabled={editId !== null} />
                {!editId && <p className="text-xs text-gray-400 mt-1">يُستخدم في روابط URL — لا يمكن تعديله لاحقاً</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="شارع الملك فهد، الرياض" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="+966 xx xxxx xxxx" />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
                {saving ? "جاري الحفظ..." : editId ? "تحديث" : "إنشاء الفرع"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
      ) : branches.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
          <p className="text-3xl mb-3">🏪</p>
          <p className="text-gray-500 font-medium">لا توجد فروع</p>
        </div>
      ) : (
        <div className="space-y-3">
          {branches.map((branch) => (
            <div key={branch.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900">{branch.name}</h3>
                    {branch.isDefault && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">رئيسي</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${branch.status === "ACTIVE" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                      {branch.status === "ACTIVE" ? "نشط" : "غير نشط"}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-gray-400 mt-1">/{branch.slug}</p>
                  {branch.address && <p className="text-sm text-gray-500 mt-1">📍 {branch.address}</p>}
                  {branch.phone && <p className="text-sm text-gray-500">📞 {branch.phone}</p>}
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs text-gray-400">🪑 {branch._count.tables} طاولة</span>
                    <span className="text-xs text-gray-400">📋 {branch._count.orders} طلب</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleStatus(branch)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${branch.status === "ACTIVE" ? "bg-gray-50 text-gray-500 hover:bg-gray-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                    {branch.status === "ACTIVE" ? "تعطيل" : "تفعيل"}
                  </button>
                  <button onClick={() => startEdit(branch)}
                    className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition">تعديل</button>
                  {!branch.isDefault && (
                    <button onClick={() => deleteBranch(branch.id)}
                      className="text-xs px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition">حذف</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
