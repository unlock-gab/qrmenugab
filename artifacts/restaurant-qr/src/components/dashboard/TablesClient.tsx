"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { Table } from "@prisma/client";

type Props = {
  initialTables: Table[];
  restaurantSlug: string;
};

export function TablesClient({ initialTables, restaurantSlug }: Props) {
  const [tables, setTables] = useState(initialTables);
  const [newNumber, setNewNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editNumber, setEditNumber] = useState("");

  const createTable = useCallback(async () => {
    if (!newNumber.trim()) return;
    setLoading(true);
    const res = await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableNumber: newNumber.trim() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error || "Failed to create table");
    } else {
      setTables((prev) => [...prev, data]);
      setNewNumber("");
      toast.success("Table created");
    }
  }, [newNumber]);

  const toggleActive = useCallback(async (id: string, current: boolean) => {
    const res = await fetch(`/api/tables/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error("Failed to update table");
    } else {
      setTables((prev) => prev.map((t) => (t.id === id ? data : t)));
      toast.success(`Table ${data.isActive ? "activated" : "deactivated"}`);
    }
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editId || !editNumber.trim()) return;
    const res = await fetch(`/api/tables/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableNumber: editNumber.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to update table");
    } else {
      setTables((prev) => prev.map((t) => (t.id === editId ? data : t)));
      setEditId(null);
      toast.success("Table updated");
    }
  }, [editId, editNumber]);

  const deleteTable = useCallback(async (id: string) => {
    if (!confirm("Delete this table?")) return;
    const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete table");
    } else {
      setTables((prev) => prev.filter((t) => t.id !== id));
      toast.success("Table deleted");
    }
  }, []);

  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/menu/${restaurantSlug}/`
      : `/menu/${restaurantSlug}/`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tables</h1>
          <p className="text-gray-500 text-sm mt-1">
            {tables.length} table{tables.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createTable()}
            placeholder="Table number..."
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 w-40"
          />
          <button
            onClick={createTable}
            disabled={loading || !newNumber.trim()}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
          >
            {loading ? "..." : "Add Table"}
          </button>
        </div>
      </div>

      {tables.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">🪑</p>
          <p className="text-gray-500 font-medium">No tables yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first table above</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {tables.map((table) => (
            <div
              key={table.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-lg font-bold text-orange-500 shrink-0">
                {table.tableNumber}
              </div>

              <div className="flex-1 min-w-0">
                {editId === table.id ? (
                  <div className="flex gap-2">
                    <input
                      value={editNumber}
                      onChange={(e) => setEditNumber(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 w-32"
                      autoFocus
                    />
                    <button
                      onClick={saveEdit}
                      className="text-xs px-3 py-1.5 bg-orange-500 text-white rounded-lg"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-gray-900">Table {table.tableNumber}</p>
                    <p className="text-xs text-gray-400 font-mono truncate">
                      Token: {table.qrToken.substring(0, 16)}...
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`${baseUrl}${table.qrToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition"
                >
                  View Menu
                </a>

                <button
                  onClick={() => toggleActive(table.id, table.isActive)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                    table.isActive
                      ? "bg-green-50 text-green-600 hover:bg-green-100"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {table.isActive ? "Active" : "Inactive"}
                </button>

                <button
                  onClick={() => {
                    setEditId(table.id);
                    setEditNumber(table.tableNumber);
                  }}
                  className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteTable(table.id)}
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
