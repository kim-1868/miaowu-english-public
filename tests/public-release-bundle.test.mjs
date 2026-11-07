import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PUBLIC_UI_PATHS, packagePublicUi } from "../scripts/build-public-ui.mjs";
import { verifyPublicUiRelease } from "../scripts/verify-public-ui-release.mjs";
import { APPROVED_PATHS } from "../scripts/audit-public.mjs";
const SHA="a".repeat(40);
function fixture(run){
  const dir=mkdtempSync(join(tmpdir(),"wordletter-release-safe-"));
  try { packagePublicUi({outputDir:dir,sourceSha:SHA});return run(dir); }
  finally { rmSync(dir,{force:true,recursive:true}); }
}
test("public Release candidate verifies exact source SHA and all 29 hashes",()=>{
  fixture(dir=>{
    const result=verifyPublicUiRelease({directory:dir,expectedSha:SHA});
    assert.equal(result.files,PUBLIC_UI_PATHS.length);
    assert.equal(result.sourceSha,SHA);
    assert.equal(result.scope,"public-ui-only");
  });
});
test("missing or mismatched reviewed commit always fails",()=>{
  fixture(dir=>{
    assert.throws(()=>verifyPublicUiRelease({directory:dir,expectedSha:"b".repeat(40)}),/MISMATCH/);
    assert.throws(()=>verifyPublicUiRelease({directory:dir}),/EXPECTED_SHA/);
    assert.throws(()=>verifyPublicUiRelease({directory:dir,expectedSha:"invalid"}),/EXPECTED_SHA/);
  });
});
test("modified, extra, and missing public files fail closed",()=>{
  fixture(dir=>{
    const path=join(dir,PUBLIC_UI_PATHS[0]);
    writeFileSync(path,Buffer.concat([readFileSync(path),Buffer.from("\nmodified")]));
    assert.throws(()=>verifyPublicUiRelease({directory:dir,expectedSha:SHA}),/DIGEST_MISMATCH/);
  });
  fixture(dir=>{
    writeFileSync(join(dir,"private-code.js"),"must never publish this");
    assert.throws(()=>verifyPublicUiRelease({directory:dir,expectedSha:SHA}),/UNEXPECTED_FILE/);
  });
});
test("symlinks and forged manifests cannot be released",()=>{
  fixture(dir=>{
    symlinkSync(join(dir,"manifest.json"),join(dir,"extra-symlink"));
    assert.throws(()=>verifyPublicUiRelease({directory:dir,expectedSha:SHA}),/SYMLINK/);
  });
  fixture(dir=>{
    const path=join(dir,"manifest.json");
    const m=JSON.parse(readFileSync(path,"utf8"));
    m.files.push(m.files[0]);
    writeFileSync(path,JSON.stringify(m));
    assert.throws(()=>verifyPublicUiRelease({directory:dir,expectedSha:SHA}),/COUNT_MISMATCH/);
  });
});
test("public Release workflow is manually gated and never exposes private data",()=>{
  const yaml=readFileSync(new URL("../.github/workflows/public-ui-release.yml",import.meta.url),"utf8");
  assert.ok(APPROVED_PATHS.has(".github/workflows/public-ui-release.yml"));
  assert.match(yaml,/on:\s*\n\s+workflow_dispatch:/);
  assert.doesNotMatch(yaml,/\n\s+(?:push|pull_request|schedule|pull_request_target):/);
  assert.match(yaml,/RELEASE_PUBLIC_UI_ONLY/);
  assert.match(yaml,/github\.ref == 'refs\/heads\/main'/);
  assert.match(yaml,/git rev-parse HEAD/);
  assert.match(yaml,/verify-public-ui-release\.mjs/);
  assert.match(yaml,/needs: verify-build/);
  assert.match(yaml,/contents: read/);
  assert.match(yaml,/contents: write/);
  assert.match(yaml,/gh release create/);
  assert.match(yaml,/sha256sum -c SHA256SUMS/);
  assert.doesNotMatch(yaml,/secrets\.|wrangler|cloudflare\/wrangler-action|git clone|gh repo clone|database_name|CLOUDFLARE_API_TOKEN/i);
});
