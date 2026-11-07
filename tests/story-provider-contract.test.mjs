import test from "node:test";
import assert from "node:assert/strict";
import {PROVIDERS,inspectProviderPlan} from "../scripts/story-provider-contract.mjs";
test("only three explicit adapters exist",()=>assert.deepEqual(PROVIDERS,["codex","claude","gemini"]));
test("a four-chapter task resumes at exactly next unwritten chapter",()=>{
 const r=inspectProviderPlan({provider:"codex",chapters:8,saved:[1,2,3,4],maxCalls:3});
 assert.deepEqual(r.queue,[5,6,7]);assert.equal(r.modelCalled,false);
});
test("all done never schedules model",()=>{
 assert.deepEqual(inspectProviderPlan({provider:"claude",chapters:3,saved:[1,2,3]}).queue,[]);
});
test("gap cannot silently rewrite or skip",()=>{
 const r=inspectProviderPlan({provider:"gemini",chapters:8,saved:[1,3]});
 assert.equal(r.ok,false);assert.ok(r.issues.includes("BROKEN_CHAPTER_CHAIN"));assert.deepEqual(r.queue,[]);
});
test("cross-provider attempted chapter remains blocked",()=>{
 const r=inspectProviderPlan({provider:"gemini",chapters:8,saved:[1],attempted:[2],maxCalls:1});
 assert.equal(r.ok,false);assert.deepEqual(r.blocked,[2]);
});
test("unsupported model or unsafe caps fail closed",()=>{
 for(const config of [{provider:"bash",chapters:8},{provider:"codex",chapters:8,maxCalls:9},{provider:"codex",chapters:8,maxMinutes:21}]){
  const r=inspectProviderPlan(config);assert.equal(r.ok,false);assert.deepEqual(r.queue,[]);
 }
});
test("duplicate chapter progress cannot inflate completion",()=>{
 const r=inspectProviderPlan({provider:"codex",chapters:3,saved:[1,1]});
 assert.equal(r.ok,false);assert.ok(r.issues.includes("INVALID_SAVED_CHAPTERS"));
});
test("false publication and model flags for synthetic tests",()=>{
 const r=inspectProviderPlan({provider:"claude",chapters:8,saved:[1],maxCalls:2,maxMinutes:4});
 assert.equal(r.publicationEligible,false);assert.equal(r.modelCalled,false);assert.equal(r.estimatedMaxMinutes,8);
});
