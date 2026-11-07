import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source=readFileSync(new URL("../public/reader-panels.js",import.meta.url),"utf8");
function fakeNode() {
  const attrs=new Map(),classes=new Set(),handlers=new Map();
  return {attrs,classes,handlers,focusCount:0,
    classList:{toggle:(key,on)=>{if(on)classes.add(key);else classes.delete(key);}},
    addEventListener(type,fn){const set=handlers.get(type)||new Set();set.add(fn);handlers.set(type,set);},
    removeEventListener(type,fn){handlers.get(type)?.delete(fn);},
    setAttribute(key,val){attrs.set(key,String(val));},
    getAttribute(key){return attrs.get(key);},
    focus(){this.focusCount++;},
    fire(type,extra={}){
      for(const fn of handlers.get(type)||[])fn({target:this,preventDefault(){},...extra});
    }
  };
}
function fixture(initialGlossVisible=true) {
  const ids=["readerLayout","mobileChapterOpen","mobileVocabOpen","mobileChapterClose",
    "mobileVocabClose","readerDrawerOverlay","toggleGloss","sideToggleGloss","storyText"];
  const nodes=new Map(ids.map(id=>[id,fakeNode()]));
  const doc=fakeNode();
  doc.getElementById=id=>nodes.get(id)||null;
  const root={};
  runInNewContext(source,{window:root});
  const calls=[];
  const control=root.MiaowuReaderPanels.create({
    document:doc,initialGlossVisible,
    onGlossChange:event=>calls.push({...event})
  });
  return {nodes,doc,calls,root,control,get:id=>nodes.get(id)};
}
test("public reader panels are view-only and cannot read rights, call APIs or save progress",()=>{
  assert.match(source,/MiaowuReaderPanels/);
  assert.doesNotMatch(source,/fetch\s*\(|XMLHttpRequest|\/api\/|localStorage|sessionStorage|document\.cookie|speechSynthesis|innerHTML\s*=/i);
});
test("initial mount is idempotent; both drawers start closed and aria-expanded false",()=>{
  const f=fixture();f.control.mount();f.control.mount();
  assert.equal(f.get("mobileChapterOpen").getAttribute("aria-expanded"),"false");
  assert.equal(f.get("mobileVocabOpen").getAttribute("aria-expanded"),"false");
  assert.equal(f.get("readerDrawerOverlay").getAttribute("aria-hidden"),"true");
  assert.equal(f.get("mobileChapterOpen").handlers.get("click").size,1);
  assert.equal(f.control.getState().drawer,null);
});
test("chapter/vocab drawers are mutually exclusive, close restores focus and ARIA",()=>{
  const f=fixture();f.control.mount();
  f.get("mobileChapterOpen").fire("click");
  assert.equal(f.control.getState().drawer,"chapter");
  assert.ok(f.get("readerLayout").classes.has("chapter-drawer-open"));
  assert.equal(f.get("mobileChapterOpen").getAttribute("aria-expanded"),"true");
  assert.equal(f.get("mobileChapterClose").focusCount,1);
  f.get("mobileVocabOpen").fire("click");
  assert.equal(f.control.getState().drawer,"vocab");
  assert.ok(!f.get("readerLayout").classes.has("chapter-drawer-open"));
  assert.ok(f.get("readerLayout").classes.has("vocab-drawer-open"));
  assert.equal(f.get("mobileChapterOpen").getAttribute("aria-expanded"),"false");
  assert.equal(f.get("mobileVocabOpen").getAttribute("aria-expanded"),"true");
  f.get("mobileVocabClose").fire("click");
  assert.equal(f.control.getState().drawer,null);
  assert.equal(f.get("readerDrawerOverlay").getAttribute("aria-hidden"),"true");
  assert.equal(f.get("mobileVocabOpen").getAttribute("aria-expanded"),"false");
  assert.equal(f.get("mobileVocabOpen").focusCount,1);
});
test("backdrop and Escape close active drawer and restore trigger focus",()=>{
  const f=fixture();f.control.mount();
  f.get("mobileChapterOpen").fire("click");
  f.get("readerDrawerOverlay").fire("click");
  assert.equal(f.get("mobileChapterOpen").focusCount,1);
  f.get("mobileVocabOpen").fire("click");
  let prevented=0;
  f.doc.fire("keydown",{key:"Escape",preventDefault(){prevented++;}});
  assert.equal(prevented,1);
  assert.equal(f.control.getState().drawer,null);
  assert.equal(f.get("mobileVocabOpen").focusCount,1);
  f.doc.fire("keydown",{key:"Escape",preventDefault(){prevented++;}});
  assert.equal(prevented,1);
});
test("gloss visibility synchronizes two buttons and notifies caller only for a click",()=>{
  const f=fixture(false);f.control.mount();
  assert.equal(f.control.getState().glossVisible,false);
  assert.ok(f.get("storyText").classes.has("no-gloss"));
  assert.equal(f.get("toggleGloss").getAttribute("aria-pressed"),"true");
  assert.equal(f.calls.length,0);
  f.get("sideToggleGloss").fire("click");
  assert.equal(f.control.getState().glossVisible,true);
  assert.ok(!f.get("storyText").classes.has("no-gloss"));
  assert.equal(f.get("toggleGloss").getAttribute("aria-label"),"隐藏释义");
  assert.equal(f.get("sideToggleGloss").getAttribute("aria-pressed"),"false");
  assert.equal(f.calls.length,1);
  assert.equal(f.calls[0].visible,true);
  f.get("toggleGloss").fire("click");
  assert.equal(f.calls.length,2);
  assert.equal(f.calls[1].message,"已隐藏释义，可以尝试回忆");
  f.control.setGlossVisible(true);
  assert.equal(f.calls.length,2);
});
test("unmount clears all handlers and the drawer classes; remount is safe",()=>{
  const f=fixture();f.control.mount();
  f.get("mobileChapterOpen").fire("click");
  f.control.unmount();
  assert.equal(f.control.getState().drawer,null);
  assert.equal(f.get("mobileChapterOpen").handlers.get("click").size,0);
  f.get("mobileChapterOpen").fire("click");
  assert.equal(f.control.getState().drawer,null);
  f.control.mount();
  f.get("mobileChapterOpen").fire("click");
  assert.equal(f.control.getState().drawer,"chapter");
  assert.throws(()=>f.control.openDrawer("billing"),/READER_DRAWER_UNKNOWN/);
});
test("synthetic contract uses public script and no live user data",()=>{
  const html=readFileSync(new URL("../showcase/reader-panels-contract.html",import.meta.url),"utf8");
  const demo=readFileSync(new URL("../showcase/reader-panels-demo.js",import.meta.url),"utf8");
  for(const id of ["readerLayout","mobileChapterOpen","mobileVocabOpen","readerDrawerOverlay",
    "mobileChapterClose","mobileVocabClose","storyText","toggleGloss","sideToggleGloss"]){
    assert.ok(html.includes('id="'+id+'"'),id);
  }
  assert.match(html,/src="\.\.\/public\/reader-panels\.js"/);
  assert.match(demo,/MiaowuReaderPanels\.create/);
  assert.doesNotMatch(demo,/fetch\s*\(|localStorage|sessionStorage|\/api\//);
});
