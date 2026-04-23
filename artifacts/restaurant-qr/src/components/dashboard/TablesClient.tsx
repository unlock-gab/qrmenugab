"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";

type Table = {
  id: string;
  tableNumber: string;
  qrToken: string;
  isActive: boolean;
};

type Props = {
  initialTables: Table[];
  restaurantSlug: string;
};

function useQRCode(url: string) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      color: { dark: "#1a1a1a", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then(setDataUrl).catch(() => null);
  }, [url]);

  return dataUrl;
}

function TableCard({
  table,
  restaurantSlug,
  onToggle,
  onEdit,
  onDelete,
}: {
  table: Table;
  restaurantSlug: string;
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (table: Table) => void;
  onDelete: (id: string) => void;
}) {
  const [showQR, setShowQR] = useState(false);
  const menuUrl = typeof window !== "undefined"
    ? `${window.location.origin}/menu/${restaurantSlug}/${table.qrToken}`
    : `https://your-domain.com/menu/${restaurantSlug}/${table.qrToken}`;
  const qrDataUrl = useQRCode(showQR ? menuUrl : "");

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `table-${table.tableNumber}-qr.png`;
    link.click();
    toast.success("QR code downloaded!");
  };

  const handlePrint = () => {
    if (!qrDataUrl) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Table ${table.tableNumber} QR Code</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: white; }
            .card { text-align: center; padding: 40px; border: 2px solid #f97316; border-radius: 16px; width: 300px; }
            img { width: 200px; height: 200px; }
            h2 { font-size: 24px; color: #111; margin: 16px 0 4px; }
            p { color: #666; font-size: 14px; margin: 0; }
            .badge { margin-top: 12px; display: inline-block; background: #fff7ed; border: 1px solid #fed7aa; color: #ea580c; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
            @media print { @page { size: A4; margin: 1cm; } }
          </style>
        </head>
        <body>
          <div class="card">
            <img src="${qrDataUrl}" alt="QR Code" />
            <h2>Table ${table.tableNumber}</h2>
            <p>Scan to view menu & order</p>
            <div class="badge">Scan Me</div>
          </div>
          <script>window.onload = () => window.print();<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm transition-all ${table.isActive ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
      <div className="p-4 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
          table.isActive ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"
        }`}>
          {table.tableNumber}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 text-sm">Table {table.tableNumber}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              table.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              {table.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">
            {table.qrToken.substring(0, 20)}...
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowQR((v) => !v)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              showQR ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {showQR ? "Hide QR" : "Show QR"}
          </button>
          <button
            onClick={() => onToggle(table.id, table.isActive)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
          >
            {table.isActive ? "Disable" : "Enable"}
          </button>
          <button
            onClick={() => onEdit(table)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(table.id)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
          >
            Delete
          </button>
        </div>
      </div>

      {showQR && (
        <div className="border-t border-gray-100 p-5 flex flex-col sm:flex-row items-center gap-5 bg-gray-50 rounded-b-2xl">
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm shrink-0">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`QR for table ${table.tableNumber}`} className="w-40 h-40" />
            ) : (
              <div className="w-40 h-40 flex items-center justify-center text-gray-400 text-sm">
                Generating...
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 mb-1">Table {table.tableNumber} QR Code</p>
            <p className="text-xs text-gray-500 mb-4 break-all font-mono bg-white border border-gray-200 rounded-lg px-3 py-2">
              {menuUrl}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDownload}
                disabled={!qrDataUrl}
                className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
              >
                ↓ Download PNG
              </button>
              <button
                onClick={handlePrint}
                disabled={!qrDataUrl}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
              >
                🖨 Print
              </button>
              <a
                href={menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition"
              >
                ↗ Open Menu
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TablesClient({ initialTables, restaurantSlug }: Props) {
  const [tables, setTables] = useState(initialTables);
  const [newNumber, setNewNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
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

  const toggleActive = useCallback(async (id: string, currentActive: boolean) => {
    const res = await fetch(`/api/tables/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !currentActive }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error("Failed to update table");
    } else {
      setTables((prev) => prev.map((t) => (t.id === id ? data : t)));
      toast.success(`Table ${data.isActive ? "enabled" : "disabled"}`);
    }
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingTable || !editNumber.trim()) return;
    const res = await fetch(`/api/tables/${editingTable.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableNumber: editNumber.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to update table");
    } else {
      setTables((prev) => prev.map((t) => (t.id === editingTable.id ? data : t)));
      setEditingTable(null);
      toast.success("Table updated");
    }
  }, [editingTable, editNumber]);

  const deleteTable = useCallback(async (id: string) => {
    if (!confirm("Delete this table? This cannot be undone.")) return;
    const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete table");
    } else {
      setTables((prev) => prev.filter((t) => t.id !== id));
      toast.success("Table deleted");
    }
  }, []);

  const activeCount = tables.filter((t) => t.isActive).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tables</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {tables.length} total &bull; {activeCount} active
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
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition disabled:opacity-50"
          >
            {loading ? "..." : "+ Add Table"}
          </button>
        </div>
      </div>

      {tables.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-5xl mb-3">⊞</p>
          <p className="text-gray-500 font-medium text-lg">No tables yet</p>
          <p className="text-gray-400 text-sm mt-1">Add a table number above to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              restaurantSlug={restaurantSlug}
              onToggle={toggleActive}
              onEdit={(t) => { setEditingTable(t); setEditNumber(t.tableNumber); }}
              onDelete={deleteTable}
            />
          ))}
        </div>
      )}

      {editingTable && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Table {editingTable.tableNumber}</h2>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New table number</label>
            <input
              value={editNumber}
              onChange={(e) => setEditNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveEdit()}
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition"
              >
                Save
              </button>
              <button
                onClick={() => setEditingTable(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
