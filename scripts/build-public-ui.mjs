// Build a PUBLIC-ONLY delivery bundle. Never call private GitHub or Cloudflare APIs.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync, lstatSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { APPROVED_PATHS, suspiciousContent } from "./audit-public.mjs";

export const PUBLIC_UI_PATHS = Object.freeze([
  "public/install-guide.js", "public/install-guide.css",
  "public/site-updates.js", "public/site-updates.css",
  "public/v11-reader.css", "public/v11-bookshelf.css",
  "public/v11-wordbook.css", "public/v11-responsive.css",
  "public/flashcards.css", "public/live-reader.css",
  "public/onboarding.css", "public/claim.css", "public/styles.css",
  "public/cat-bookmark-clip.svg", "public/shelf-cet4.svg",
  "public/shelf-cet6.svg", "public/shelf-ielts.svg",
  "public/shelf-postgrad.svg",
  "public/index.html",
  "public/updates.html",
  "public/flashcards.js",
  "public/chapter-words.js",
  "public/echo-cloud.js",
  "public/onboarding.js",
  "public/reader-preferences.js",
  "public/shelf-pagination.js",
  "public/shelf-card.js"
]);

const ROOT = resolve(fileURLToPath(new URL("../", import.meta.url)));
const hash = bytes => createHash("sha256").update(bytes).digest("hex");

export function packagePublicUi({ outputDir = join(ROOT, "dist-public-ui"), sourceSha = process.env.GITHUB_SHA || null } = {}) {
  if (sourceSha !== null && !/^[a-f0-9]{40}$/i.test(sourceSha)) {
    throw Error("Invalid source commit SHA");
  }
  const distinct = new Set(PUBLIC_UI_PATHS);
  if (distinct.size !== PUBLIC_UI_PATHS.length || distinct.size !== 27) throw Error("Unexpected UI delivery manifest");
  const target = resolve(outputDir);
  if (target !== resolve(ROOT, "dist-public-ui") && !target.startsWith(resolve(tmpdir()) + sep)) {
    throw Error("Unsafe output location");
  }
  const entries = [];
  for (const path of PUBLIC_UI_PATHS) {
    if (!APPROVED_PATHS.has(path) || !path.startsWith("public/") ||
        path.includes("..") || path.includes("\\") || !/^[a-z0-9/.-]+$/.test(path)) {
      throw Error("Public delivery path not approved: " + path);
    }
    const src = resolve(ROOT, path);
    if (!src.startsWith(ROOT + sep)) throw Error("Path escapes repository: " + path);
    const st = lstatSync(src);
    if (!st.isFile() || st.isSymbolicLink() || st.size > 500000) throw Error("Invalid public asset: " + path);
    const bytes = readFileSync(src);
    const content = bytes.toString("utf8");
    if (content.includes("\0") || suspiciousContent(content)) throw Error("Asset failed public safety scan: " + path);
    entries.push({ path, bytes: bytes.length, sha256: hash(bytes), content: bytes });
  }
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  for (const item of entries) {
    const name = resolve(target, item.path);
    if (!name.startsWith(target + sep)) throw Error("Unsafe destination path");
    mkdirSync(dirname(name), { recursive: true });
    writeFileSync(name, item.content, { flag: "wx", mode: 0o644 });
  }
  const manifest = {
    format: "wordletter-public-ui/v1",
    release_scope: "public-ui-only",
    source_repository: "kim-1868/miaowu-english-public",
    source_commit_sha: sourceSha,
    files: entries.map(({ path, bytes, sha256 }) => ({ path, bytes, sha256 }))
  };
  writeFileSync(join(target, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", { flag: "wx", mode: 0o644 });
  for (const f of manifest.files) {
    if (hash(readFileSync(join(target, f.path))) !== f.sha256) throw Error("Artifact integrity failed: " + f.path);
  }
  return { outputDir: target, manifest };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { outputDir, manifest } = packagePublicUi();
  console.log("PUBLIC_UI_BUNDLE_OK " + manifest.files.length + " files; commit=" + (manifest.source_commit_sha || "local"));
  console.log("ARTIFACT_DIR " + outputDir);
}
