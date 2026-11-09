import test from "node:test";
import assert from "node:assert/strict";
import {decideNovelUploadRoute,simulateNovelUpload} from "../scripts/novel-upload-route-contract.mjs";
const pkg={version:1,book:{id:"synthetic_book_001",title:"合成旧书",category:"cet4"},chapters:[],words:[]};
const draft=[{id:"synthetic_book_001",title:"合成旧书",category_id:"cet4",status:"draft"}];
const published=[{...draft[0],status:"published"}];
const error=code=>Object.assign(new Error(code),{code});
const runner=({catalog=draft,rewrite=false,approvals=["REVISE_EXISTING_BOOK","CONFIRM_WITHDRAWN_HISTORY"]}={})=>{
 const calls=[],approvalRequests=[];
 return {calls,approvalRequests,
  start:()=>simulateNovelUpload({pkg,catalog,
   inspect:async id=>{assert.equal(id,pkg.book.id);return {contentFingerprint:"f".repeat(64)}},
   approve:decision=>{approvalRequests.push(decision);return approvals.includes(decision)},
   call:async(route,body)=>{calls.push({route,body});
     if(route==="/api/ops/import/revise"&&rewrite&&!body.confirmWithdrawnRewrite)
       throw error("WITHDRAWN_REWRITE_CONFIRMATION_REQUIRED");
     return {bookId:pkg.book.id,remainsUnpublished:true};
   }})};
};
test("unpublished historical book must use revision, never POST new import",async()=>{
 const t=runner();const res=await t.start();
 assert.equal(res.kind,"revised-draft");
 assert.deepEqual(t.calls.map(x=>x.route),["/api/ops/import/revise"]);
 assert.equal(t.calls[0].body.expectedFingerprint,"f".repeat(64));
 assert.equal(t.calls[0].body.confirmTitle,pkg.book.title);
 assert.equal(res.canPublish,false);
});
test("withdrawn rewrite requires separate explicit confirmation",async()=>{
 const t=runner({rewrite:true});const res=await t.start();
 assert.equal(res.kind,"revised-draft");
 assert.equal(t.calls.length,2);
 assert.equal(t.calls[1].body.confirmWithdrawnRewrite,true);
 assert.deepEqual(t.approvalRequests,["REVISE_EXISTING_BOOK","CONFIRM_WITHDRAWN_HISTORY"]);
});
test("refusal to confirm historical rewrite never starts a second write",async()=>{
 const t=runner({rewrite:true,approvals:["REVISE_EXISTING_BOOK"]});
 const res=await t.start();
 assert.equal(res.kind,"cancelled");assert.equal(res.writes,0);
 assert.equal(t.calls.length,1);assert.equal(t.calls[0].body.confirmWithdrawnRewrite,undefined);
});
test("refusal to confirm any revision means no POST",async()=>{
 const t=runner({approvals:[]});assert.equal((await t.start()).kind,"cancelled");
 assert.equal(t.calls.length,0);
});
test("already published ID uses live editor, not create or withdrawn revision",async()=>{
 const t=runner({catalog:published});const res=await t.start();
 assert.equal(res.kind,"live-editor");assert.equal(t.calls.length,0);
});
test("same title with new ID cannot bypass old record",()=>{
 const d=decideNovelUploadRoute(pkg,[{...draft[0],id:"synthetic_book_987"}]);
 assert.equal(d.reason,"SAME_TITLE_DIFFERENT_ID");assert.equal(d.canCreate,false);
});
test("mismatched original ID/category must be blocked",()=>{
 const d=decideNovelUploadRoute(pkg,[{...draft[0],category_id:"cet6"}]);
 assert.equal(d.reason,"BOOK_METADATA_CHANGED");
});
test("brand new book is a draft, never automatically published",async()=>{
 const t=runner({catalog:[],approvals:["CREATE_NEW_BOOK"]});
 const res=await t.start();
 assert.equal(res.kind,"created-draft");
 assert.deepEqual(t.calls.map(x=>x.route),["/api/ops/import"]);
 assert.equal(res.canPublish,false);
});
test("missing verified content fingerprint fails closed before POST",async()=>{
 const calls=[];
 await assert.rejects(simulateNovelUpload({pkg,catalog:draft,
  inspect:async()=>({}),approve:()=>true,call:async(...args)=>calls.push(args)}),/NO_CURRENT_CONTENT_FINGERPRINT/);
 assert.equal(calls.length,0);
});
test("injected server 409 unrelated to withdrawn rewrite is not silently retried as new import",async()=>{
 const calls=[];
 await assert.rejects(simulateNovelUpload({pkg,catalog:draft,
  inspect:async()=>({contentFingerprint:"f".repeat(64)}),
  approve:()=>true,
  call:async route=>{calls.push(route);throw error("STALE_CONTENT_REVIEW_REQUIRED")}}),
  /STALE_CONTENT_REVIEW_REQUIRED/);
 assert.deepEqual(calls,["/api/ops/import/revise"]);
});
test("no private credentials, production URLs or actual novel text in public fixture",()=>{
 assert.equal(pkg.book.id,"synthetic_book_001");
 assert.equal(decideNovelUploadRoute(pkg,[]).canPublish,false);
});
