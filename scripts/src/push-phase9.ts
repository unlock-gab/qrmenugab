import { execSync } from "child_process";
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
    message: "feat: Phase 9 — onboarding wizard FR, QR center, pricing DA, demo page, admin onboarding column\n\n- OnboardingClient rewritten in French with city/type/logo fields and step saving\n- QRCenterClient: print all, download all, branch filter\n- /merchant/qr-center page\n- /pricing rebuilt in French with DZD prices\n- /demander-une-demo + DemoForm component\n- /api/demo route saving to Lead model\n- Sidebar: QR Center link added\n- Admin restaurants: onboarding column\n- Admin leads: businessType field\n- Prisma: onboardingStep on Restaurant, businessType on Lead\n- Migration 20250503000000_phase9",
    tree: newTree.sha,
    parents: [latestSha],
  });

  console.log("Updating branch...");
  await api(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, "PATCH", {
    sha: commit.sha,
    force: false,
  });

  console.log(`✅ Pushed! Commit: ${commit.sha}`);
}

main().catch((err) => { console.error(err.message); process.exit(1); });
