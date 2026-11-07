import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync, copyFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { packagePublicUi, PUBLIC_UI_PATHS } from "../scripts/build-public-ui.mjs";
import { verifyPublicBundle, comparePublicUi } from "../scripts/plan-public-ui-handoff.mjs";

const SHA="1".repeat(40);
function fixture(fn) {
  const root=mkdtempSync(join(tmpdir(),"wl-handoff-test-"));
  const bundle=join(root,"bundle");
  const target=join(root,"private-local");
  mkdirSync(target);
  try {
    packagePublicUi({outputDir:bundle,sourceSha:SHA});
    for (const path of PUBLIC_UI_PATHS) {
      const dest=join(target,path);
      mkdirSync(dirname(dest),{recursive:true});
      copyFileSync(join(bundle,path),dest);
    }
    fn({root,bundle,target});
  } finally { rmSync(root,{recursive:true,force:true}); }
}

test("valid 28-file artifact and identical private checkout => only read-only status",()=>{
  fixture(({bundle,target})=>{
    const before=readFileSync(join(target,PUBLIC_UI_PATHS[0]));
    assert.equal(verifyPublicBundle(bundle,SHA).files.length,28);
    const report=comparePublicUi(bundle,target,SHA);
    assert.deepEqual(report.counts,{identical:28,missing:0,review_required:0});
    assert.equal(report.decision,"READ_ONLY_REVIEW_NOT_MERGED_NOT_DEPLOYED");
    assert.deepEqual(readFileSync(join(target,PUBLIC_UI_PATHS[0])),before);
  });
});

test("mismatched private file is reported, never overwritten",()=>{
  fixture(({bundle,target})=>{
    const changed=join(target,PUBLIC_UI_PATHS[0]);
    writeFileSync(changed,"PRIVATE CUSTOM UI - KEEP THIS CHANGE");
    const report=comparePublicUi(bundle,target,SHA);
    assert.equal(report.counts.identical,27);
    assert.equal(report.counts.review_required,1);
    assert.equal(readFileSync(changed,"utf8"),"PRIVATE CUSTOM UI - KEEP THIS CHANGE");
  });
});

test("missing target files are review-only, never auto-created",()=>{
  fixture(({bundle,target})=>{
    const deleted=join(target,PUBLIC_UI_PATHS[1]);
    rmSync(deleted);
    const report=comparePublicUi(bundle,target,SHA);
    assert.equal(report.counts.missing,1);
    assert.equal(report.counts.identical,27);
    assert.throws(()=>readFileSync(deleted));
  });
});

test("bundle tampering fails closed, even with plausible manifest",()=>{
  fixture(({bundle,target})=>{
    writeFileSync(join(bundle,PUBLIC_UI_PATHS[0]),"TAMPERED PUBLIC ASSET");
    assert.throws(()=>comparePublicUi(bundle,target,SHA),/hash mismatch/);
  });
});

test("cannot use self-declared SHA without separately chosen reviewed source commit",()=>{
  fixture(({bundle})=>{
    assert.throws(()=>verifyPublicBundle(bundle,"2".repeat(40)),/provenance/);
    assert.throws(()=>verifyPublicBundle(bundle,"../main"),/40-char/);
  });
});

test("manifest traversal or extra files are always rejected",()=>{
  fixture(({bundle})=>{
    const manifest=join(bundle,"manifest.json");
    const json=JSON.parse(readFileSync(manifest,"utf8"));
    json.files[0].path="../not-public.txt";
    writeFileSync(manifest,JSON.stringify(json));
    assert.throws(()=>verifyPublicBundle(bundle,SHA),/exactly the 28 approved/);
  });
  fixture(({bundle})=>{
    writeFileSync(join(bundle,"unreviewed.txt"),"unexpected extra");
    assert.throws(()=>verifyPublicBundle(bundle,SHA),/Unexpected file/);
  });
});

test("symlinks in delivery or checkout are forbidden",()=>{
  fixture(({bundle,target})=>{
    const asset=join(target,PUBLIC_UI_PATHS[0]);
    rmSync(asset);
    symlinkSync(join(bundle,PUBLIC_UI_PATHS[0]),asset);
    assert.throws(()=>comparePublicUi(bundle,target,SHA),/Unexpected target type/);
  });
});
