import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OWNER = "unlock-gab";
const REPO = "qrmenugab";
const BRANCH = "main";
const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN!;

if (!TOKEN) {
  console.error("❌ GITHUB_PERSONAL_ACCESS_TOKEN not set");
  process.exit(1);
}

const ROOT = path.resolve(__dirname, "../../");

const IGNORE_DIRS = new Set([
  "node_modules", ".next", ".git", "dist", "build", ".turbo",
  "__pycache__", ".cache", ".local",
]);

const IGNORE_FILES = new Set([
  "pnpm-lock.yaml",
]);

async function apiCall(endpoint: string, method = "GET", body?: unknown) {
  const res = await fetch(`https://api.github.com${endpoint}`, {
    method,
    headers: {
      Authorization: `token ${TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${method} ${endpoint} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<any>;
}

async function getHead() {
  console.log("Fetching current HEAD...");
  const ref = await apiCall(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
  const sha = ref.object.sha;
  console.log("HEAD:", sha);
  return sha;
}

async function getBaseTree(commitSha: string) {
  const commit = await apiCall(`/repos/${OWNER}/${REPO}/git/commits/${commitSha}`);
  return commit.tree.sha;
}

function collectFiles(dir: string, baseDir: string, results: string[] = []) {
  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry)) continue;
    if (entry.startsWith(".") && entry !== ".gitignore" && entry !== ".dockerignore") continue;
    const full = path.join(dir, entry);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(full);
    } catch {
      continue;
    }
    const relPath = path.relative(baseDir, full);
    if (stat.isDirectory()) {
      collectFiles(full, baseDir, results);
    } else {
      if (IGNORE_FILES.has(entry)) continue;
      results.push(relPath);
    }
  }
  return results;
}

async function createBlob(content: string, encoding: "utf-8" | "base64") {
  const blob = await apiCall(`/repos/${OWNER}/${REPO}/git/blobs`, "POST", {
    content,
    encoding,
  });
  return blob.sha as string;
}

async function main() {
  const headSha = await getHead();
  const baseTreeSha = await getBaseTree(headSha);

  console.log("Collecting files...");
  const files = collectFiles(ROOT, ROOT);
  console.log(`${files.length} files found`);

  console.log("Creating blobs...");
  const treeItems: { path: string; mode: string; type: string; sha: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    const fullPath = path.join(ROOT, filePath);
    const raw = fs.readFileSync(fullPath);

    // Detect binary
    let isBinary = false;
    for (let j = 0; j < Math.min(raw.length, 512); j++) {
      if (raw[j] === 0) { isBinary = true; break; }
    }

    let blobSha: string;
    if (isBinary) {
      blobSha = await createBlob(raw.toString("base64"), "base64");
    } else {
      blobSha = await createBlob(raw.toString("utf8"), "utf-8");
    }

    treeItems.push({ path: filePath, mode: "100644", type: "blob", sha: blobSha });

    if ((i + 1) % 50 === 0) {
      console.log(`  ${i + 1}/${files.length} blobs created...`);
    }
  }

  console.log("Creating tree...");
  const tree = await apiCall(`/repos/${OWNER}/${REPO}/git/trees`, "POST", {
    base_tree: baseTreeSha,
    tree: treeItems,
  });

  console.log("Creating commit...");
  const commit = await apiCall(`/repos/${OWNER}/${REPO}/git/commits`, "POST", {
    message: `fix: resolve git conflict markers in package.json and pnpm-workspace.yaml`,
    tree: tree.sha,
    parents: [headSha],
  });

  console.log("Updating branch...");
  await apiCall(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, "PATCH", {
    sha: commit.sha,
    force: true,
  });

  console.log(`✅ Pushed! Commit: ${commit.sha}`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
