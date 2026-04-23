"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface OptionItem { id: string; name: string; extraPrice: number; isActive: boolean; sortOrder: number; }
interface OptionGroup {
  id: string; name: string; selectionType: string; isRequired: boolean; sortOrder: number;
  options: OptionItem[];
}
interface ItemData { id: string; name: string; optionGroups: OptionGroup[]; }

const EMPTY_GROUP = { name: "", selectionType: "SINGLE", isRequired: false };
const EMPTY_OPTION = { name: "", extraPrice: "" };

export default function OptionsClient({ item }: { item: ItemData }) {
  const [groups, setGroups] = useState<OptionGroup[]>(item.optionGroups);
  const [showForm, setShowForm] = useState(false);
  const [groupForm, setGroupForm] = useState(EMPTY_GROUP);
  const [optionRows, setOptionRows] = useState([{ ...EMPTY_OPTION }]);
  const [saving, setSaving] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [addingOption, setAddingOption] = useState<string | null>(null);
  const [newOption, setNewOption] = useState(EMPTY_OPTION);

  const addOptionRow = () => setOptionRows((r) => [...r, { ...EMPTY_OPTION }]);
  const removeOptionRow = (i: number) => setOptionRows((r) => r.filter((_, idx) => idx !== i));

  const saveGroup = useCallback(async () => {
    if (!groupForm.name.trim() || optionRows.some((o) => !o.name.trim())) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/menu-items/${item.id}/options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: groupForm.name.trim(),
        selectionType: groupForm.selectionType,
        isRequired: groupForm.isRequired,
        sortOrder: groups.length,
        options: optionRows.filter((o) => o.name.trim()).map((o, i) => ({
          name: o.name.trim(),
          extraPrice: parseFloat(o.extraPrice) || 0,
          sortOrder: i,
        })),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(data.error || "فشل الحفظ"); return; }
    setGroups((g) => [...g, data]);
    setShowForm(false);
    setGroupForm(EMPTY_GROUP);
    setOptionRows([{ ...EMPTY_OPTION }]);
    toast.success("تم إضافة مجموعة الخيارات");
  }, [groupForm, optionRows, groups.length, item.id]);

  const deleteGroup = async (groupId: string) => {
    if (!confirm("حذف هذه المجموعة وجميع خياراتها؟")) return;
    const res = await fetch(`/api/menu-items/${item.id}/options?groupId=${groupId}`, { method: "DELETE" });
    if (res.ok) {
      setGroups((g) => g.filter((g) => g.id !== groupId));
      toast.success("تم الحذف");
    } else { toast.error("فشل الحذف"); }
  };

  const addOptionToGroup = async (groupId: string) => {
    if (!newOption.name.trim()) { toast.error("أدخل اسم الخيار"); return; }
    const res = await fetch(`/api/menu-items/${item.id}/options/item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, name: newOption.name.trim(), extraPrice: parseFloat(newOption.extraPrice) || 0 }),
    });
    const data = await res.json();
    if (res.ok) {
      setGroups((g) => g.map((group) => group.id === groupId
        ? { ...group, options: [...group.options, { ...data, extraPrice: Number(data.extraPrice) }] }
        : group
      ));
      setNewOption(EMPTY_OPTION);
      setAddingOption(null);
      toast.success("تم إضافة الخيار");
    } else { toast.error(data.error || "فشل الإضافة"); }
  };

  const deleteOption = async (groupId: string, optionId: string) => {
    const res = await fetch(`/api/menu-items/${item.id}/options/item?optionId=${optionId}`, { method: "DELETE" });
    if (res.ok) {
      setGroups((g) => g.map((group) => group.id === groupId
        ? { ...group, options: group.options.filter((o) => o.id !== optionId) }
        : group
      ));
      toast.success("تم حذف الخيار");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/menu-items" className="text-sm text-gray-400 hover:text-gray-600 transition">← القائمة</Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">خيارات: {item.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{groups.length} مجموعة خيارات</p>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">مجموعة خيارات جديدة</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم المجموعة *</label>
              <input value={groupForm.name} onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="مثال: الحجم، الإضافات، درجة الحرارة" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع الاختيار</label>
                <select value={groupForm.selectionType} onChange={(e) => setGroupForm((f) => ({ ...f, selectionType: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="SINGLE">اختيار واحد</option>
                  <option value="MULTIPLE">اختيار متعدد</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input type="checkbox" id="isRequired" checked={groupForm.isRequired} onChange={(e) => setGroupForm((f) => ({ ...f, isRequired: e.target.checked }))} className="rounded" />
                <label htmlFor="isRequired" className="text-sm font-medium text-gray-700">إلزامي</label>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">الخيارات *</label>
                <button onClick={addOptionRow} className="text-xs text-orange-500 hover:text-orange-700 font-medium">+ إضافة خيار</button>
              </div>
              <div className="space-y-2">
                {optionRows.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={row.name} onChange={(e) => setOptionRows((r) => r.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="اسم الخيار" />
                    <input type="number" step="0.01" min="0" value={row.extraPrice} onChange={(e) => setOptionRows((r) => r.map((x, idx) => idx === i ? { ...x, extraPrice: e.target.value } : x))}
                      className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="+0.00" />
                    {optionRows.length > 1 && (
                      <button onClick={() => removeOptionRow(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={saveGroup} disabled={saving}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
                {saving ? "جاري الحفظ..." : "إضافة المجموعة"}
              </button>
              <button onClick={() => { setShowForm(false); setGroupForm(EMPTY_GROUP); setOptionRows([{ ...EMPTY_OPTION }]); }}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {groups.length === 0 && !showForm ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
          <p className="text-3xl mb-3">✦</p>
          <p className="text-gray-500 font-medium">لا توجد خيارات بعد</p>
          <p className="text-gray-400 text-sm mt-1">أضف مجموعة خيارات مثل الحجم أو الإضافات</p>
          <button onClick={() => setShowForm(true)} className="mt-4 px-5 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition">
            + إضافة مجموعة
          </button>
        </div>
      ) : (
        <>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="mb-4 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition">
              + إضافة مجموعة خيارات
            </button>
          )}
          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{group.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${group.selectionType === "SINGLE" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                      {group.selectionType === "SINGLE" ? "اختيار واحد" : "متعدد"}
                    </span>
                    {group.isRequired && <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">إلزامي</span>}
                    <span className="text-xs text-gray-400">{group.options.length} خيار</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }}
                      className="text-xs px-2 py-1 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition">حذف</button>
                    <span className="text-gray-400 text-sm">{expandedGroup === group.id ? "▲" : "▼"}</span>
                  </div>
                </div>

                {expandedGroup === group.id && (
                  <div className="border-t border-gray-100 px-4 pb-4">
                    <div className="space-y-2 mt-3">
                      {group.options.map((opt) => (
                        <div key={opt.id} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-800">{opt.name}</span>
                          <div className="flex items-center gap-3">
                            {opt.extraPrice > 0 && <span className="text-xs text-emerald-600 font-medium">+{opt.extraPrice.toFixed(2)}</span>}
                            <button onClick={() => deleteOption(group.id, opt.id)} className="text-red-400 hover:text-red-600 text-xs">حذف</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {addingOption === group.id ? (
                      <div className="mt-3 flex gap-2 items-center">
                        <input value={newOption.name} onChange={(e) => setNewOption((n) => ({ ...n, name: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="اسم الخيار" />
                        <input type="number" step="0.01" min="0" value={newOption.extraPrice} onChange={(e) => setNewOption((n) => ({ ...n, extraPrice: e.target.value }))}
                          className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="+0.00" />
                        <button onClick={() => addOptionToGroup(group.id)} className="px-3 py-2 bg-green-500 text-white text-xs rounded-lg font-medium">إضافة</button>
                        <button onClick={() => { setAddingOption(null); setNewOption(EMPTY_OPTION); }} className="text-gray-400 text-xs">إلغاء</button>
                      </div>
                    ) : (
                      <button onClick={() => { setAddingOption(group.id); setNewOption(EMPTY_OPTION); }}
                        className="mt-3 text-xs text-orange-500 hover:text-orange-700 font-medium">+ إضافة خيار</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
