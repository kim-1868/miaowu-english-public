// Public repository allowlist: deny all unexpected files by default.
// This is a defensive check, NOT a replacement for human content/history review.
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const APPROVED_PATHS = new Set([
  ".github/workflows/public-guard.yml",
  ".gitignore",
  "README.md",
  "package.json",
  "showcase/index.html",
  "showcase/showcase.css",
  "showcase/demo-api.js",
  "public/install-guide.js",
  "public/install-guide.css",
  "public/site-updates.js",
  "public/site-updates.css",
  "public/v11-reader.css",
  "public/v11-bookshelf.css",
  "public/v11-wordbook.css",
  "public/v11-responsive.css",
  "public/flashcards.css",
  "public/styles.css",
  "public/cat-bookmark-clip.svg",
  "public/shelf-cet4.svg",
  "public/shelf-cet6.svg",
  "public/shelf-ielts.svg",
  "public/shelf-postgrad.svg",
  "public/live-reader.css",
  "public/onboarding.css",
  "public/claim.css",
  "scripts/audit-public.mjs",
  "scripts/serve.mjs",
  "tests/public-ui.test.mjs",
  "tests/boundary.test.mjs",
  "docs/PUBLIC_MIGRATION_MANIFEST.md"
]);

export function allowedPath(path) {
  return typeof path === "string" && APPROVED_PATHS.has(path) &&
    !path.includes("..") && !path.includes("\\") && !path.startsWith("/");
}

export function suspiciousContent(content) {
  const patterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /github_pat_[A-Za-z0-9_]{40,}/,
    /gh[pousr]_[A-Za-z0-9]{30,}/,
    /sk-[A-Za-z0-9_-]{28,}/,
    /(?:CLOUDFLARE_API_TOKEN|DATABASE_URL|GITHUB_TOKEN)\s*[=:]\s*["']?[A-Za-z0-9._/-]{20,}/i
  ];
  return patterns.some((rule) => rule.test(content));
}

export function verifyTrackedPaths(tracked) {
  const rejected = tracked.filter((p) => !allowedPath(p));
  return { ok: rejected.length === 0, rejected };
}

export function auditRepository() {
  const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
  const check = verifyTrackedPaths(tracked);
  if (!check.ok) throw new Error("Unapproved public paths: " + check.rejected.join(", "));
  for (const path of tracked) {
    const info = lstatSync(path);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error("Non-regular file forbidden: " + path);
    const content = readFileSync(path, "utf8");
    if (suspiciousContent(content)) throw new Error("Potential credential pattern found in " + path);
    if (content.includes("\0")) throw new Error("Binary or NUL-containing file rejected: " + path);
    if (info.size > 500_000) throw new Error("File unexpectedly large; review required: " + path);
  }
  console.log("Public safety allowlist PASS: " + tracked.length + " reviewed tracked paths.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { auditRepository(); }
  catch (err) { console.error("PUBLIC_BOUNDARY_FAIL:", err.message); process.exitCode = 1; }
}
