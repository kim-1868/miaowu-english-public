import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PUBLIC_UI_PATHS } from "../scripts/build-public-ui.mjs";

const src=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const imported=[
  "public/index.html","public/updates.html","public/flashcards.js",
  "public/chapter-words.js","public/echo-cloud.js","public/onboarding.js"
];

test("six newly public browser files have an explicit reviewed release entry",()=>{
 for(const p of imported) assert.ok(PUBLIC_UI_PATHS.includes(p),p);
 assert.equal(PUBLIC_UI_PATHS.length,27);
});

test("homepage HTML is presentation shell; authentication code is not copied",()=>{
 const html=src("public/index.html");
 assert.match(html, /id="view-library"/);
 assert.match(html, /id="view-reader"/);
 assert.match(html, /id="view-words"/);
 assert.match(html, /id="siteUpdateDialog"/);
 assert.match(html, /src="\/app\.js/);
 assert.doesNotMatch(html, /<script(?![^>]+src=)/i);
 assert.doesNotMatch(html, /<script[^>]+src="\/(?:ops|editor|claim)\b/i);
});

test("public updates page owns no actual announcement publishing privilege",()=>{
 const html=src("public/updates.html");
 for(const id of ["siteUpdateHistory","siteUpdateHistoryStatus","siteUpdateMore"]) {
   assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.match(html, /src="\/site-updates\.js/);
 assert.doesNotMatch(html, /<script(?![^>]+src=)/i);
});

test("learning UI uses server-backed adapters/endpoints without embedded private credentials",()=>{
 const contracts=[
  ["public/flashcards.js",/window\.MiaowuFlashcards/],
  ["public/chapter-words.js",/window\.MiaowuChapterWords/],
  ["public/echo-cloud.js",/window\.MiaowuCloudEcho/],
  ["public/onboarding.js",/window\.MiaowuOnboarding/]
 ];
 for(const [path,api] of contracts){
   const code=src(path);
   assert.match(code,api,path);
   assert.doesNotMatch(code,/-----BEGIN .*PRIVATE KEY-----|github_pat_[a-z0-9_]{40,}/i);
   assert.doesNotMatch(code,/\beval\s*\(|\bnew Function\s*\(/);
 }
 assert.match(src("public/onboarding.js"),/\/api\/me\/onboarding/);
 assert.match(src("public/flashcards.js"),/\/api\/me\/flashcards/);
});
