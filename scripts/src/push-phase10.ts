import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN!;
const OWNER = "unlock-gab";
const REPO = "qrmenugab";
const BRANCH = "main";
const BASE = "/home/runner/workspace/artifacts/restaurant-qr";
const API = "https://api.github.com";

const headers = {
  Authorization: `token ${TOKEN}`,
  Accept: "application/vnd.github.v3+json",
  "Content-Type": "application/json",
  "User-Agent": "replit-agent",
};

async function api(path: string, method = "GET", body?: unknown) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

function getAllFiles(dir: string, ignore = ["node_modules", ".next", ".git"]): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (ignore.includes(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) results.push(...getAllFiles(full, ignore));
    else results.push(full);
  }
  return results;
}

async function main() {
  console.log("Fetching current HEAD...");
  const ref = await api(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
  const latestSha = ref.object.sha;
  console.log(`HEAD: ${latestSha}`);

  const baseTree = await api(`/repos/${OWNER}/${REPO}/git/commits/${latestSha}`);
  const baseTreeSha = baseTree.tree.sha;

  console.log("Collecting files...");
  const files = getAllFiles(BASE);
  console.log(`${files.length} files found`);

  const treeItems: Array<{ path: string; mode: string; type: string; content: string }> = [];

  for (const file of files) {
    const relPath = relative(BASE, file);
    let content: string;
    try {
      content = readFileSync(file, "utf-8");
    } catch {
      content = readFileSync(file).toString("base64");
    }
    treeItems.push({ path: relPath, mode: "100644", type: "blob", content });
  }

  console.log("Creating tree...");
  const newTree = await api(`/repos/${OWNER}/${REPO}/git/trees`, "POST", {
    base_tree: baseTreeSha,
    tree: treeItems,
  });

  console.log("Creating commit...");
  const commit = await api(`/repos/${OWNER}/${REPO}/git/commits`, "POST", {
    message: `feat: Phase 10 — reservations FR, service workspace, operational tables, table detail, dashboard++

- ReserveClient: Full French rewrite with time slots, guest counter, professional UX
- /merchant/reservations: Full French professional UI — stats, date grouping, status filters, manual booking modal
- /merchant/service: New dedicated service requests workspace (FR) with urgency coloring, group by type, auto-refresh 8s
- /merchant/tables: Upgraded to operational workspace showing live status (LIBRE/OCCUPÉE/SERVICE/ADDITION) with color-coded cards
- /merchant/tables/[id]: New table detail page with order management, waiter requests, advance order status
- /merchant/waiter: Full French rewrite with service request alerts, clean table cards
- Dashboard: Added pendingReservations + activeWaiterRequests counters with alert cards and Service shortcut
- /api/dashboard/stats: Added pendingReservations, todayReservations, activeWaiterRequests fields
- /api/tables/operational: New endpoint for operational table data with orders + requests
- /api/tables/[id]/orders: New endpoint for table orders
- /api/tables/[id]/requests: New endpoint for table waiter requests
- Sidebar: Added Service (🔔) link to OWNER_OPS_NAV and WAITER_NAV
- MenuPageClient: French-first (FR/AR toggle) — Serveur, Voir le panier, Votre commande, Ajouter au panier, etc.`,
    tree: newTree.sha,
    parents: [latestSha],
  });

  console.log("Updating branch...");
  await api(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, "PATCH", {
    sha: commit.sha,
    force: false,
  });

  console.log(`✅ Phase 10 pushed! Commit: ${commit.sha}`);
}

main().catch((err) => { console.error(err.message); process.exit(1); });
