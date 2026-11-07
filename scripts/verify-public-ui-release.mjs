// Verify the exact public-only UI bundle before creating a GitHub Release.
// This script never reads private repos or any Cloudflare credentials.
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { PUBLIC_UI_PATHS } from "./build-public-ui.mjs";
import { APPROVED_PATHS, suspiciousContent } from "./audit-public.mjs";

const SOURCE_SHA = /^[a-f0-9]{40}$/i;
const FILE_SHA = /^[a-f0-9]{64}$/i;
const digest = bytes => createHash("sha256").update(bytes).digest("hex");

export function verifyPublicUiRelease({ directory, expectedSha } = {}) {
  if (typeof expectedSha !== "string" || !SOURCE_SHA.test(expectedSha))
    throw Error("PUBLIC_RELEASE_EXPECTED_SHA_REQUIRED");
  if (typeof directory !== "string" || !directory)
    throw Error("PUBLIC_RELEASE_DIR_REQUIRED");
  const root = resolve(directory);
  const stat = lstatSync(root);
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw Error("PUBLIC_RELEASE_INVALID_ROOT");
  const manifestPath = join(root, "manifest.json");
  const manifestStat = lstatSync(manifestPath);
  if (!manifestStat.isFile() || manifestStat.isSymbolicLink())
    throw Error("PUBLIC_RELEASE_MANIFEST_INVALID");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.format !== "wordletter-public-ui/v1" ||
      manifest.release_scope !== "public-ui-only" ||
      manifest.source_repository !== "kim-1868/miaowu-english-public" ||
      manifest.source_commit_sha !== expectedSha)
    throw Error("PUBLIC_RELEASE_SOURCE_OR_SCOPE_MISMATCH");
  if (!Array.isArray(manifest.files) ||
      manifest.files.length !== PUBLIC_UI_PATHS.length)
    throw Error("PUBLIC_RELEASE_FILE_COUNT_MISMATCH");
  const approved = new Set(PUBLIC_UI_PATHS), actual = new Set();
  const walk = dir => {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const absolute = join(dir, item.name);
      const st = lstatSync(absolute);
      if (st.isSymbolicLink()) throw Error("PUBLIC_RELEASE_SYMLINK_FORBIDDEN");
      if (st.isDirectory()) walk(absolute);
      else if (st.isFile()) {
        const name = relative(root, absolute).split(sep).join("/");
        if (actual.has(name)) throw Error("PUBLIC_RELEASE_DUPLICATE_PATH");
        actual.add(name);
      } else throw Error("PUBLIC_RELEASE_NONREGULAR_PATH");
    }
  };
  walk(root);
  if (actual.size !== approved.size + 1 || !actual.has("manifest.json"))
    throw Error("PUBLIC_RELEASE_UNEXPECTED_FILE_OR_MISSING_ASSET");
  for (const path of approved) {
    if (!actual.has(path)) throw Error("PUBLIC_RELEASE_MISSING_ASSET");
  }
  const seen = new Set();
  for (const entry of manifest.files) {
    const path = entry?.path;
    if (typeof path !== "string" || !approved.has(path) ||
        !APPROVED_PATHS.has(path) || seen.has(path))
      throw Error("PUBLIC_RELEASE_UNAPPROVED_OR_DUPLICATE_ASSET");
    seen.add(path);
    if (!Number.isSafeInteger(entry.bytes) || entry.bytes < 0 ||
        typeof entry.sha256 !== "string" || !FILE_SHA.test(entry.sha256))
      throw Error("PUBLIC_RELEASE_INVALID_MANIFEST_ENTRY");
    const absolute = resolve(root, path);
    if (!absolute.startsWith(root + sep)) throw Error("PUBLIC_RELEASE_PATH_ESCAPE");
    const bytes = readFileSync(absolute);
    if (bytes.byteLength !== entry.bytes || digest(bytes) !== entry.sha256)
      throw Error("PUBLIC_RELEASE_DIGEST_MISMATCH");
    const content = bytes.toString("utf8");
    if (content.includes("\0") || suspiciousContent(content))
      throw Error("PUBLIC_RELEASE_SAFETY_SCAN_FAILED");
  }
  if (seen.size !== approved.size) throw Error("PUBLIC_RELEASE_MANIFEST_INCOMPLETE");
  return Object.freeze({ sourceSha: expectedSha, files: seen.size, scope: manifest.release_scope });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = verifyPublicUiRelease({
      directory: process.argv[2] || "./dist-public-ui",
      expectedSha: process.argv[3] || process.env.GITHUB_SHA
    });
    console.log("PUBLIC_RELEASE_BUNDLE_VERIFIED " + result.files + " files " + result.sourceSha);
  } catch (error) {
    console.error("PUBLIC_RELEASE_VERIFY_FAIL:", error.message);
    process.exitCode = 1;
  }
}
