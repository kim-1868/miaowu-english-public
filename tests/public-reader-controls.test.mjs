import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const src = readFileSync(new URL("../public/reader-preferences.js",import.meta.url),"utf8");

function fakeNode() {
  const handlers=new Map(),attrs=new Map(),styles=new Map(),classes=new Set();
  return {
    textContent:"",value:"",disabled:false,
    handlers,attrs,styles,classes,
    addEventListener(type,fn) {const s=handlers.get(type)||new Set();s.add(fn);handlers.set(type,s);},
    removeEventListener(type,fn) {handlers.get(type)?.delete(fn);},
    fire(type,event={}) {for(const h of handlers.get(type)||[])h({target:this,...event});},
    setAttribute(key,value){attrs.set(key,String(value));},
    getAttribute(key){return attrs.get(key);},
    removeAttribute(key){attrs.delete(key);},
    style:{setProperty(key,value){styles.set(key,value);}},
    classList:{toggle(key,on){if(on)classes.add(key);else classes.delete(key);}},
    querySelector(selector){return this.children?.[selector]||null}
  };
}
function fixture(values={},blocked=false) {
  const ids=["globalThemeToggle","toggleNight","readerLayout","storyText","chapterTitle",
    "readerFontSlider","readerFontValue","smallerFont","biggerFont"];
  const map=new Map(ids.map(key=>[key,fakeNode()]));
  const meta=fakeNode(),html=fakeNode();
  const global=map.get("globalThemeToggle");
  const indicator=fakeNode(),label=fakeNode();
  global.children={".theme-indicator":indicator,".theme-label":label};
  const storageMap=new Map(Object.entries(values));
  const storage={
    getItem(key){if(blocked)throw Error("blocked");return storageMap.get(key)||null;},
    setItem(key,value){if(blocked)throw Error("blocked");storageMap.set(key,String(value));},
    removeItem(key){if(blocked)throw Error("blocked");storageMap.delete(key);}
  };
  const doc={
    documentElement:html,
    getElementById(id){return map.get(id)||null;},
    querySelector(q){return q==='meta[name="theme-color"]'?meta:null}
  };
  const root={};
  runInNewContext(src,{window:root});
  return { doc,storage,root,map,meta,html,storageMap,indicator,label };
}

test("extracted public controls default to existing 18px, 12–24px and day mode",()=>{
 const f=fixture();const ui=f.root.MiaowuReaderPreferences.create({document:f.doc,storage:f.storage});
 assert.equal(ui.getState().fontSize,18);
 assert.equal(ui.getState().night,false);
 ui.mount();
 assert.equal(f.map.get("storyText").styles.get("font-size"),"18px");
 assert.equal(f.map.get("storyText").styles.get("line-height"),"2.15");
 assert.equal(f.map.get("chapterTitle").styles.get("font-size"),"32px");
 assert.equal(f.html.getAttribute("data-theme"),"light");
 assert.equal(f.map.get("readerFontValue").textContent,"18px");
 assert.equal(f.storageMap.get("miaowu_reader_font"),"18");
 assert.equal(f.meta.getAttribute("content"),"#f8f3ec");
});

test("reader slider and A± controls clamp and disable at correct bounds",()=>{
 const f=fixture({"miaowu_reader_font":"23"});
 const ui=f.root.MiaowuReaderPreferences.create({document:f.doc,storage:f.storage});
 ui.mount();
 f.map.get("biggerFont").fire("click");
 assert.equal(ui.getState().fontSize,24);
 assert.equal(f.map.get("biggerFont").disabled,true);
 assert.equal(f.map.get("chapterTitle").styles.get("font-size"),"42px");
 f.map.get("readerFontSlider").value="12";
 f.map.get("readerFontSlider").fire("input");
 assert.equal(ui.getState().fontSize,12);
 assert.equal(f.map.get("smallerFont").disabled,true);
 f.map.get("smallerFont").fire("click");
 assert.equal(ui.getState().fontSize,12);
 assert.equal(ui.setFontSize(999).fontSize,24);
 assert.equal(ui.setFontSize(-42).fontSize,12);
 assert.equal(ui.setFontSize("not a number").fontSize,12);
});

test("global and reader day/night controls stay synchronized and accessible",()=>{
 const f=fixture({"miaowu_theme":"dark","miaowu_reader_font":"17"});
 const ui=f.root.MiaowuReaderPreferences.create({document:f.doc,storage:f.storage});
 ui.mount();
 assert.equal(f.indicator.textContent,"☀");
 assert.equal(f.label.textContent,"日间");
 assert.equal(f.map.get("toggleNight").getAttribute("aria-pressed"),"true");
 assert.ok(f.map.get("readerLayout").classes.has("night"));
 assert.equal(f.meta.getAttribute("content"),"#211f25");
 f.map.get("globalThemeToggle").fire("click");
 assert.equal(ui.getState().night,false);
 assert.equal(f.map.get("toggleNight").textContent,"☾ 夜间");
 assert.equal(f.map.get("globalThemeToggle").getAttribute("aria-label"),"切换到夜间模式");
 f.map.get("toggleNight").fire("click");
 assert.equal(ui.getState().night,true);
 assert.equal(f.storageMap.get("miaowu_theme"),"dark");
});

test("blocked browser storage never breaks UI and never changes learning data",()=>{
 const f=fixture({},true);
 const ui=f.root.MiaowuReaderPreferences.create({document:f.doc,storage:f.storage});
 ui.mount();
 f.map.get("toggleNight").fire("click");
 f.map.get("readerFontSlider").value="21";
 f.map.get("readerFontSlider").fire("input");
 assert.equal(ui.getState().night,true);
 assert.equal(ui.getState().fontSize,21);
 assert.equal(f.map.get("storyText").styles.get("font-size"),"21px");
 assert.equal(f.storageMap.size,0);
});

test("mount is idempotent, unmount restores listeners and no API/data exists",()=>{
 const f=fixture({"miaowu_reader_tone":"legacy","miaowu_reader_line":"legacy"});
 const ui=f.root.MiaowuReaderPreferences.create({document:f.doc,storage:f.storage});
 ui.mount();ui.mount();
 assert.equal(f.map.get("toggleNight").handlers.get("click").size,1);
 f.map.get("toggleNight").fire("click");
 assert.equal(ui.getState().night,true);
 ui.unmount();f.map.get("toggleNight").fire("click");
 assert.equal(ui.getState().night,true);
 ui.mount();f.map.get("toggleNight").fire("click");
 assert.equal(ui.getState().night,false);
 assert.equal(f.storageMap.has("miaowu_reader_tone"),false);
 assert.equal(f.storageMap.has("miaowu_reader_line"),false);
 assert.doesNotMatch(src,/fetch\(|XMLHttpRequest|\/api\/|document\.cookie|activation[_-]?code|order[_-]?id/i);
});

test("standalone synthetic page uses the exact extracted UI controls",()=>{
 const html=readFileSync(new URL("../showcase/reader-controls-contract.html",import.meta.url),"utf8");
 const sample=readFileSync(new URL("../showcase/reader-controls-demo.js",import.meta.url),"utf8");
 for(const id of ["globalThemeToggle","toggleNight","readerLayout","readerFontSlider",
   "readerFontValue","smallerFont","biggerFont","storyText","chapterTitle"]) {
   assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.match(html,/src="\.\.\/public\/reader-preferences\.js"/);
 assert.match(sample,/MiaowuReaderPreferences\.create/);
 assert.doesNotMatch(html,/<script(?![^>]+src=)/);
 assert.doesNotMatch(sample,/fetch\(|localStorage|document\.cookie/);
});
