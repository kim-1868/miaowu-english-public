// Read-only public UI bundle verifier and local integration-drift report.
// Works offline, never copies files to private checkout and never opens a network connection.
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { resolve, join, sep, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PUBLIC_UI_PATHS } from "./build-public-ui.mjs";

export const EXPECTED_FORMAT = "wordletter-public-ui/v1";
export const EXPECTED_SOURCE = "kim-1868/miaowu-english-public";
const SHA40 = /^[a-f0-9]{40}$/i;
const SHA256 = /^[a-f0-9]{64}$/;
const digest = buffer => createHash("sha256").update(buffer).digest("hex");
const privatePath = path => path.startsWith("public/") && /^[a-z0-9/.-]+$/.test(path) &&
  !path.includes("..") && !path.includes("\\");
const safeUnder = (root, candidate) => candidate.startsWith(root + sep);

function regular(path) {
  const st = lstatSync(path);
  if (!st.isFile() || st.isSymbolicLink() || st.size > 500_000) {
    throw Error("Unsafe or unexpectedly large file: " + path);
  }
  return st;
}
function collect(dir, root, found) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, item.name);
    if (!safeUnder(root, path)) throw Error("Unexpected bundle path");
    if (item.isSymbolicLink()) throw Error("Public bundle must not contain symlinks");
    if (item.isDirectory()) collect(path, root, found);
    else if (item.isFile()) found.push(relative(root, path).split(sep).join("/"));
    else throw Error("Public bundle contains unsupported file type");
  }
}

export function verifyPublicBundle(bundleDir, expectedSourceSha) {
  if (!SHA40.test(String(expectedSourceSha || ""))) {
    throw Error("An independently reviewed full 40-char public commit SHA is required");
  }
  const root = realpathSync(resolve(bundleDir));
  const manifestPath = join(root, "manifest.json");
  regular(manifestPath);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (!manifest || manifest.format !== EXPECTED_FORMAT ||
      manifest.release_scope !== "public-ui-only" ||
      manifest.source_repository !== EXPECTED_SOURCE ||
      manifest.source_commit_sha !== expectedSourceSha ||
      !Array.isArray(manifest.files)) {
    throw Error("Unexpected public bundle provenance or manifest format");
  }
  const expected = [...PUBLIC_UI_PATHS].sort();
  const actual = manifest.files.map(f => f?.path).sort();
  if (actual.length !== expected.length || actual.some((p,i) => p !== expected[i])) {
    throw Error("Delivery must contain exactly the 27 approved public UI paths");
  }
  const results=[];
  for (const f of manifest.files) {
    if (!privatePath(f.path) || !SHA256.test(f.sha256) ||
        !Number.isSafeInteger(f.bytes) || f.bytes < 0 || f.bytes > 500_000) {
      throw Error("Malformed file manifest entry");
    }
    const path = resolve(root, f.path);
    if (!safeUnder(root, path)) throw Error("Bundle path escapes reviewed directory");
    regular(path);
    if (!safeUnder(root, realpathSync(path))) throw Error("Bundle file resolves outside root");
    const bytes = readFileSync(path);
    if (bytes.length !== f.bytes || digest(bytes) !== f.sha256) {
      throw Error("Public bundle hash mismatch: " + f.path);
    }
    results.push({ path: f.path, sha256: f.sha256, bytes: f.bytes });
  }
  const present=[];
  collect(root, root, present);
  present.sort();
  const listed=["manifest.json", ...expected].sort();
  if (present.length !== listed.length || present.some((p,i) => p !== listed[i])) {
    throw Error("Unexpected file in public delivery bundle");
  }
  return { sourceCommitSha: expectedSourceSha, files: results };
}

export function comparePublicUi(bundleDir, targetCheckoutDir, expectedSourceSha) {
  const verified=verifyPublicBundle(bundleDir, expectedSourceSha);
  const root=realpathSync(resolve(targetCheckoutDir));
  const statuses=[];
  for (const f of verified.files) {
    const file=resolve(root, f.path);
    if (!safeUnder(root,file)) throw Error("Target path escapes checkout");
    let st;
    try { st=lstatSync(file); }
    catch(e) { if(e.code === "ENOENT") {statuses.push({path:f.path,status:"missing"});continue;} throw e; }
    if (!st.isFile() || st.isSymbolicLink()) throw Error("Unexpected target type: " + f.path);
    if (!safeUnder(root,realpathSync(file))) throw Error("Target resolves outside checkout");
    const local=readFileSync(file);
    statuses.push({path:f.path,status:digest(local)===f.sha256?"identical":"review_required"});
  }
  const counts={ identical:0, missing:0, review_required:0 };
  for (const f of statuses) counts[f.status]++;
  return { publicCommit:verified.sourceCommitSha, counts, files:statuses,
    decision:"READ_ONLY_REVIEW_NOT_MERGED_NOT_DEPLOYED" };
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2);
  if(args.length!==3) {
    console.error("Usage: node scripts/plan-public-ui-handoff.mjs <bundle-dir> <local-private-checkout> <reviewed-public-40hex-SHA>");
    process.exitCode=64;
  } else {
    try {
      const report=comparePublicUi(args[0],args[1],args[2]);
      console.log(JSON.stringify(report,null,2));
      if (report.counts.missing || report.counts.review_required) process.exitCode=2;
    } catch (e) {
      console.error("PUBLIC_HANDOFF_REJECTED: "+e.message);
      process.exitCode=1;
    }
  }
}
