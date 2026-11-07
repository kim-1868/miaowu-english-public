import test from "node:test";
import assert from "node:assert/strict";
import { allowedPath, suspiciousContent, verifyTrackedPaths } from "../scripts/audit-public.mjs";

test("approved public UI paths and CI are permitted", () => {
  for (const path of ["public/install-guide.js", "public/site-updates.css", "showcase/index.html", ".github/workflows/public-guard.yml"]) {
    assert.equal(allowedPath(path), true, path);
  }
});

test("private and unexpected paths fail closed", () => {
  for (const path of ["db/production.sql", "content/drafts/paid-novel.txt", "private/secrets.json", "src/worker.js", ".env", ".github/workflows/unsafe.yml", "../secret.txt"]) {
    assert.equal(allowedPath(path), false, path);
  }
  assert.deepEqual(verifyTrackedPaths(["README.md", "content/drafts/paid-novel.txt"]), { ok: false, rejected: ["content/drafts/paid-novel.txt"] });
});

test("common credential formats are flagged without storing live tokens", () => {
  assert.equal(suspiciousContent("gh" + "p_" + "A".repeat(36)), true);
  assert.equal(suspiciousContent("github_pat_" + "x".repeat(48)), true);
  assert.equal(suspiciousContent("sk-" + "z".repeat(40)), true);
  assert.equal(suspiciousContent("-----BEGIN " + "PRIVATE KEY-----"), true);
  assert.equal(suspiciousContent("CLOUDFLARE_" + "API_TOKEN=" + "f".repeat(32)), true);
  assert.equal(suspiciousContent("public UI has announcement, reading, review and demo data"), false);
});
