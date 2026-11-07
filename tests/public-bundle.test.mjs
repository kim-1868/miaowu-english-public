import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PUBLIC_UI_PATHS, packagePublicUi } from "../scripts/build-public-ui.mjs";
import { APPROVED_PATHS } from "../scripts/audit-public.mjs";

test("public bundle has precisely 18 audited UI files and no private assets", () => {
  assert.equal(PUBLIC_UI_PATHS.length, 18);
  assert.equal(new Set(PUBLIC_UI_PATHS).size, 18);
  for (const path of PUBLIC_UI_PATHS) {
    assert.ok(APPROVED_PATHS.has(path), "Unapproved asset: " + path);
    assert.match(path, /^public\/[a-z0-9/.-]+$/);
    assert.doesNotMatch(path, /(^|\/)(ops|drafts?|db|novels?|orders?|customers?|vouchers?|activation|secrets?|content|src)(\/|[.-])/i);
  }
});

test("synthetic bundle includes SHA-256 manifest and can be independently validated", () => {
  const outputDir = mkdtempSync(join(tmpdir(), "wordletter-public-ui-"));
  try {
    const SHA = "a".repeat(40);
    const result = packagePublicUi({ outputDir, sourceSha: SHA });
    assert.equal(result.manifest.source_commit_sha, SHA);
    assert.equal(result.manifest.release_scope, "public-ui-only");
    assert.equal(result.manifest.files.length, 18);
    const disk = JSON.parse(readFileSync(join(outputDir, "manifest.json"), "utf8"));
    assert.deepEqual(disk, result.manifest);
    for (const file of disk.files) {
      const buf = readFileSync(join(outputDir, file.path));
      assert.equal(buf.length, file.bytes);
      assert.equal(createHash("sha256").update(buf).digest("hex"), file.sha256);
    }
  } finally { rmSync(outputDir, { recursive: true, force: true }); }
});

test("refuse invalid commit identifiers", () => {
  assert.throws(() => packagePublicUi({ sourceSha: "../private-ref" }), /Invalid source commit SHA/);
});
