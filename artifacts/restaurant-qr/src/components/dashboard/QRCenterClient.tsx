"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { Download, Printer, QrCode, ExternalLink, RefreshCw } from "lucide-react";

type Table = {
  id: string;
  tableNumber: string;
  qrToken: string;
  isActive: boolean;
  branchId: string | null;
  branchName: string | null;
};

type Props = {
  tables: Table[];
  restaurantSlug: string;
  restaurantName: string;
  logoUrl: string | null;
};

function useQRCode(url: string) {
  const [dataUrl, setDataUrl] = useState<string>("");
  useEffect(() => {
    if (!url) { setDataUrl(""); return; }
    QRCode.toDataURL(url, {
      width: 320, margin: 2,
      color: { dark: "#1a1a1a", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then(setDataUrl).catch(() => setDataUrl(""));
  }, [url]);
  return dataUrl;
}

function getMenuUrl(origin: string, slug: string, token: string) {
  return `${origin}/menu/${slug}/${token}`;
}

function QRCard({
  table, restaurantSlug, restaurantName, logoUrl,
}: {
  table: Table; restaurantSlug: string; restaurantName: string; logoUrl: string | null;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://ai.gab-digital.com";
  const menuUrl = getMenuUrl(origin, restaurantSlug, table.qrToken);
  const qrDataUrl = useQRCode(menuUrl);

  const handleDownload = useCallback(() => {
    if (!qrDataUrl) { toast.error("QR en cours de génération…"); return; }
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `qr-table-${table.tableNumber}.png`;
    link.click();
    toast.success(`QR Table ${table.tableNumber} téléchargé`);
  }, [qrDataUrl, table.tableNumber]);

  const handlePrint = useCallback(() => {
    if (!qrDataUrl) { toast.error("QR en cours de génération…"); return; }
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(buildPrintHtml([{ table, qrDataUrl, menuUrl, restaurantName, logoUrl }]));
    win.document.close();
    win.onload = () => win.print();
  }, [qrDataUrl, table, menuUrl, restaurantName, logoUrl]);

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${!table.isActive ? "opacity-50" : ""}`}>
      <div className="p-4 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${table.isActive ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"}`}>
            {table.tableNumber}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Table {table.tableNumber}</p>
            {table.branchName && <p className="text-xs text-gray-400">{table.branchName}</p>}
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${table.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
          {table.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="p-4 flex flex-col items-center">
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm mb-3">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR Table ${table.tableNumber}`} className="w-36 h-36" />
          ) : (
            <div className="w-36 h-36 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-gray-300 animate-spin" />
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 font-medium mb-3 text-center">Scannez pour voir le menu</p>

        <div className="flex gap-2 w-full">
          <button
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Télécharger
          </button>
          <button
            onClick={handlePrint}
            disabled={!qrDataUrl}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition disabled:opacity-40"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimer
          </button>
        </div>

        <a
          href={menuUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition"
        >
          <ExternalLink className="w-3 h-3" />
          Voir le menu
        </a>
      </div>
    </div>
  );
}

function buildPrintHtml(
  items: Array<{ table: Table; qrDataUrl: string; menuUrl: string; restaurantName: string; logoUrl: string | null }>
) {
  const cards = items
    .map(({ table, qrDataUrl, restaurantName }) => `
      <div class="card">
        <div class="restaurant-name">${restaurantName}</div>
        <img class="qr" src="${qrDataUrl}" alt="QR" />
        <div class="table-num">Table ${table.tableNumber}</div>
        <div class="instruction">Scannez pour voir le menu</div>
        <div class="sub">Commander facilement depuis votre téléphone</div>
      </div>
    `)
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>QR Codes — ${items[0]?.restaurantName || ""}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: system-ui, sans-serif; background: white; }
      .grid { display: flex; flex-wrap: wrap; gap: 16px; padding: 20px; justify-content: flex-start; }
      .card {
        width: 200px; border: 2px solid #f97316; border-radius: 16px;
        padding: 20px 16px; text-align: center; page-break-inside: avoid;
        display: flex; flex-direction: column; align-items: center;
      }
      .restaurant-name { font-size: 11px; font-weight: 700; color: #ea580c; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
      .qr { width: 140px; height: 140px; border-radius: 8px; }
      .table-num { font-size: 22px; font-weight: 900; color: #111; margin: 10px 0 4px; }
      .instruction { font-size: 11px; font-weight: 600; color: #374151; }
      .sub { font-size: 9px; color: #9ca3af; margin-top: 4px; }
      @media print {
        @page { size: A4; margin: 1cm; }
        body { margin: 0; }
      }
    </style></head>
    <body><div class="grid">${cards}</div>
    <script>window.onload = () => window.print();<\/script></body></html>`;
}

export function QRCenterClient({ tables, restaurantSlug, restaurantName, logoUrl }: Props) {
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [printingAll, setPrintingAll] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://ai.gab-digital.com";

  // Get unique branches
  const branches = Array.from(
    new Map(
      tables.filter((t) => t.branchId && t.branchName)
        .map((t) => [t.branchId, t.branchName])
    ).entries()
  );

  // Filter tables
  const filtered = tables.filter((t) => {
    const matchBranch = branchFilter === "all" || t.branchId === branchFilter;
    const matchSearch = !search || t.tableNumber.toLowerCase().includes(search.toLowerCase());
    return matchBranch && matchSearch;
  });

  const activeTables = tables.filter((t) => t.isActive);

  // Generate all QR codes
  useEffect(() => {
    const generate = async () => {
      const entries: Record<string, string> = {};
      await Promise.all(
        tables.map(async (t) => {
          const url = getMenuUrl(origin, restaurantSlug, t.qrToken);
          try {
            const dataUrl = await QRCode.toDataURL(url, {
              width: 320, margin: 2,
              color: { dark: "#1a1a1a", light: "#ffffff" },
              errorCorrectionLevel: "M",
            });
            entries[t.id] = dataUrl;
          } catch {}
        })
      );
      setQrDataUrls(entries);
    };
    generate();
  }, [tables, origin, restaurantSlug]);

  const handlePrintAll = useCallback(() => {
    const ready = filtered.filter((t) => qrDataUrls[t.id]);
    if (ready.length === 0) { toast.error("Les QR codes ne sont pas encore prêts"); return; }
    setPrintingAll(true);
    try {
      const items = ready.map((t) => ({
        table: t,
        qrDataUrl: qrDataUrls[t.id],
        menuUrl: getMenuUrl(origin, restaurantSlug, t.qrToken),
        restaurantName,
        logoUrl,
      }));
      const win = window.open("", "_blank");
      if (!win) { toast.error("Activez les pop-ups pour imprimer"); return; }
      win.document.write(buildPrintHtml(items));
      win.document.close();
      win.onload = () => win.print();
      toast.success(`${ready.length} QR codes envoyés à l'imprimante`);
    } finally {
      setPrintingAll(false);
    }
  }, [filtered, qrDataUrls, origin, restaurantSlug, restaurantName, logoUrl]);

  const handleDownloadAll = useCallback(async () => {
    const ready = filtered.filter((t) => qrDataUrls[t.id]);
    if (ready.length === 0) { toast.error("Les QR codes ne sont pas encore prêts"); return; }
    setDownloadingAll(true);
    try {
      for (const t of ready) {
        const link = document.createElement("a");
        link.href = qrDataUrls[t.id];
        link.download = `qr-table-${t.tableNumber}.png`;
        link.click();
        await new Promise((r) => setTimeout(r, 200));
      }
      toast.success(`${ready.length} QR codes téléchargés`);
    } finally {
      setDownloadingAll(false);
    }
  }, [filtered, qrDataUrls]);

  if (tables.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
        <QrCode className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-500 font-semibold text-lg mb-2">Aucune table configurée</p>
        <p className="text-gray-400 text-sm mb-6">Commencez par ajouter vos tables pour générer vos QR codes</p>
        <a
          href="/merchant/tables"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition"
        >
          Gérer les tables →
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Centre QR</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {activeTables.length} table{activeTables.length > 1 ? "s" : ""} active{activeTables.length > 1 ? "s" : ""} · {tables.length} au total
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handlePrintAll}
            disabled={printingAll || Object.keys(qrDataUrls).length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl transition disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            {printingAll ? "Impression…" : "Imprimer tout"}
          </button>
          <button
            onClick={handleDownloadAll}
            disabled={downloadingAll || Object.keys(qrDataUrls).length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloadingAll ? "Téléchargement…" : "Télécharger tout"}
          </button>
        </div>
      </div>

      {/* Info tip */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3">
        <QrCode className="w-5 h-5 text-orange-500 shrink-0" />
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Conseil :</span> Imprimez les QR codes et placez-les sur les tables. Vos clients scannent et commandent directement depuis leur téléphone.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une table…"
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 w-48"
        />
        {branches.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setBranchFilter("all")}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${branchFilter === "all" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Toutes les succursales
            </button>
            {branches.map(([id, name]) => (
              <button
                key={id}
                onClick={() => setBranchFilter(id!)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${branchFilter === id ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* QR Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-400">Aucune table trouvée</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((table) => (
            <QRCard
              key={table.id}
              table={table}
              restaurantSlug={restaurantSlug}
              restaurantName={restaurantName}
              logoUrl={logoUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
