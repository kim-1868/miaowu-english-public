import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { PUBLIC_UI_PATHS } from "../scripts/build-public-ui.mjs";
import { APPROVED_PATHS } from "../scripts/audit-public.mjs";

const components=[
  ["reader-preferences.js","MiaowuReaderPreferences"],
  ["shelf-pagination.js","MiaowuShelfPagination"],
  ["shelf-card.js","MiaowuShelfCard"],
  ["reader-panels.js","MiaowuReaderPanels"],
  ["word-card-view.js","MiaowuWordCardView"]
];
test("five PUBLIC-11 modules are explicitly allowlisted and shipped separately",()=>{
  assert.equal(components.length,5);
  for(const [file] of components){
    const path="public/"+file;
    assert.ok(APPROVED_PATHS.has(path),path);
    assert.ok(PUBLIC_UI_PATHS.includes(path),path);
  }
  assert.equal(PUBLIC_UI_PATHS.length,29);
});
test("all five modules are inert when imported; only expose explicit create adapters",()=>{
  for(const [file,exposed] of components){
    const source=readFileSync(new URL("../public/"+file,import.meta.url),"utf8");
    const window={};
    runInNewContext(source,{window}, {timeout:200});
    assert.equal(typeof window[exposed]?.create,"function",file+" should require explicit create()");
    assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|\/api\/|document\.cookie|\bnew\s+WebSocket\b/i,
      file+" should not own private network/data calls");
  }
});
test("real public index does not auto-load the extracted controllers over private app.js",()=>{
  const html=readFileSync(new URL("../public/index.html",import.meta.url),"utf8");
  assert.match(html,/src="\/app\.js/);
  for(const [file] of components){
    assert.ok(!html.includes('src="/'+file+'"'),"public homepage must not double-load "+file);
    assert.ok(!html.includes('src="./'+file+'"'),"public homepage must not double-load "+file);
  }
});
test("no contract module embeds real novel or customer material",()=>{
  const guide=readFileSync(new URL("../docs/PUBLIC11_COMPONENT_INTEGRATION_GATE_20261108.md",import.meta.url),"utf8");
  for(const [file,exposed] of components){
    assert.ok(guide.includes(file),file+" requires private integration instructions");
    assert.ok(guide.includes(exposed),exposed+" must appear in handoff");
  }
  assert.match(guide,/私人真正接线 0\/5/);
  assert.match(guide,/用户.*明确批准/);
});
