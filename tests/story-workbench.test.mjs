import test from "node:test";
import assert from "node:assert/strict";
import {createWorkbench,GRADES,STATES} from "../showcase/story-workbench-model.mjs";
const sample=()=>({title:"一场虚构的邮局冒险",genre:"都市奇遇",grade:"cet4",count:2,chapters:3,words:40,outline:"虚构测试文本"});
test("all five English levels supported, no private contents",()=>{
  assert.deepEqual(Object.keys(GRADES).sort(),["cet4","cet6","gk","ielts","postgrad"].sort());
  assert.equal(Object.keys(STATES).length,6);
});
test("batch creation returns unique IDs and correct overall progress",()=>{
  const w=createWorkbench(),rows=w.addBatch(sample());
  assert.equal(rows.length,2);assert.notEqual(rows[0].id,rows[1].id);
  assert.deepEqual(w.summary(),{books:2,chapters:6,done:0,pending:6,running:0,review:0,ready:0});
});
test("task cannot advance before start, after pause or after failure",()=>{
  const w=createWorkbench(),id=w.addBatch(sample())[0].id;
  assert.throws(()=>w.completeOne(id),/INVALID_TRANSITION/);
  w.start(id);w.completeOne(id);w.pause(id);
  assert.throws(()=>w.completeOne(id),/INVALID_TRANSITION/);
  w.start(id);w.fail(id);
  assert.throws(()=>w.completeOne(id),/INVALID_TRANSITION/);
  assert.equal(w.get(id).done,1);
  w.start(id);assert.equal(w.get(id).done,1);
});
test("chapter completion is monotonic and cannot overrun the plan",()=>{
  const w=createWorkbench(),id=w.addBatch({...sample(),count:1,chapters:2})[0].id;
  w.start(id);w.completeOne(id);w.completeOne(id);
  assert.equal(w.get(id).status,"review");
  assert.throws(()=>w.completeOne(id),/INVALID_TRANSITION/);
  assert.deepEqual([w.summary().done,w.summary().review],[2,1]);
});
test("publication-gated synthetic export cannot happen before explicit review",()=>{
  const w=createWorkbench(),id=w.addBatch({...sample(),count:1,chapters:1})[0].id;
  assert.throws(()=>w.exportPreview(id),/NOT_REVIEWED/);
  w.start(id);w.completeOne(id);
  assert.throws(()=>w.exportPreview(id),/NOT_REVIEWED/);
  w.review(id,true);
  const data=w.exportPreview(id);
  assert.equal(data.previewOnly,true);assert.equal(data.notForPublication,true);
  assert.equal(data.completedChapters,1);
  assert.equal(data.chapters,undefined);assert.equal(data.words,undefined);
});
test("failed review returns last chapter for correction, not an auto approval",()=>{
  const w=createWorkbench(),id=w.addBatch({...sample(),count:1,chapters:2})[0].id;
  w.start(id);w.completeOne(id);w.completeOne(id);w.review(id,false);
  assert.equal(w.get(id).status,"paused");assert.equal(w.get(id).done,1);
  assert.throws(()=>w.exportPreview(id),/NOT_REVIEWED/);
  w.start(id);w.completeOne(id);w.review(id,true);
  assert.equal(w.summary().ready,1);
});
test("snapshot and task references cannot mutate internal state",()=>{
  const w=createWorkbench(),row=w.addBatch(sample())[0],list=w.list();
  row.done=800;list[0].title="tampered";list[0].done=99;
  assert.equal(w.get(row.id).done,0);
  assert.notEqual(w.get(row.id).title,"tampered");
  w.history()[0].verb="mutated";
  assert.notEqual(w.history()[0].verb,"mutated");
});
test("invalid grade, count, chapter, words and genre fail closed",()=>{
  const bads=[
    {grade:"unknown"},{count:0},{count:13},{chapters:0},{chapters:31},
    {words:9},{words:251},{title:""},{genre:""},{outline:"a".repeat(401)}
  ];
  for(const bad of bads){
    const w=createWorkbench();
    assert.throws(()=>w.addBatch({...sample(),...bad}));
    assert.equal(w.summary().books,0);
  }
});
test("synthetic engine contains no HTTP, persistence or model-call capabilities",()=>{
  const w=createWorkbench();
  assert.equal("fetch" in w,false);assert.equal("save" in w,false);assert.equal("aiGenerate" in w,false);
});
test("UI is explicitly marked public synthetic and does not auto-call a private endpoint",async()=>{
  const {readFileSync}=await import("node:fs");
  const {resolve}=await import("node:path");
  const source=readFileSync(resolve("showcase/story-workbench-demo.mjs"),"utf8");
  const html=readFileSync(resolve("showcase/story-workbench.html"),"utf8");
  assert.match(html,/不连接模型/);assert.match(html,/不是真实小说生产服务/);
  assert.doesNotMatch(source,/fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|WebSocket|workers\.dev/);
  assert.doesNotMatch(html,/https?:\/\//);
});
