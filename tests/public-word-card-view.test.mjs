import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const src=readFileSync(new URL("../public/word-card-view.js",import.meta.url),"utf8");
function mockNode(tag="div"){
  const cls=new Set(),attrs=new Map(),children=[],handlers=new Map();
  return {tag,children,handlers,attrs,connected:true,disabled:false,textContent:"",className:"",
    classList:{add(...xs){for(const x of xs)cls.add(x)},remove(...xs){for(const x of xs)cls.delete(x)},
      contains:x=>cls.has(x)},
    setAttribute:(k,v)=>attrs.set(k,String(v)),getAttribute:k=>attrs.get(k),
    addEventListener:(kind,fn)=>{const list=handlers.get(kind)||[];list.push(fn);handlers.set(kind,list)},
    replaceChildren(...newChildren){children.splice(0,children.length,...newChildren)},
    append(...newChildren){children.push(...newChildren)},
    focus(){this.focusCalls=(this.focusCalls||0)+1},
    click(){for(const fn of handlers.get("click")||[])fn({target:this})},
    set innerHTML(_){throw Error("HTML injection forbidden")}
  };
}
function find(root,predicate){
  if(predicate(root))return root;
  for(const child of root.children||[]){const v=find(child,predicate);if(v)return v;}
  return null;
}
function all(root,predicate){
  const out=[];(function walk(node){if(predicate(node))out.push(node);for(const child of node.children||[])walk(child)})(root);return out;
}
function fixture(){
  const tray=mockNode(),backdrop=mockNode(),html=mockNode();
  const words=["synthetic-a","synthetic-b","synthetic-c"].map(id=>{
    const el=mockNode("button");el.attrs.set("data-cloud-word",id);el.isConnected=true;return el;
  });
  const doc={documentElement:html,createElement:mockNode,
    getElementById:id=>({wordPop:tray,wordBackdrop:backdrop})[id]||null,
    querySelectorAll:sel=>sel==="[data-cloud-word]"?words:[]};
  const calls=[];const scope={};
  runInNewContext(src,{window:scope});
  const view=scope.MiaowuWordCardView.create({document:doc,
    onSpeak:(text,kind)=>calls.push(["speak",text,kind]),
    onBookmark:(id,next)=>calls.push(["bookmark",id,next]),
    onMastery:(id,next)=>calls.push(["mastery",id,next]),
    onNavigate:index=>calls.push(["nav",index]),
    onClose:()=>calls.push(["close"])
  });
  return{view,calls,doc,tray,backdrop,html,words};
}
const sample={headword:"glimmer",phonetic_us:"/ˈɡlɪmər/",part_of_speech:"n.",
  meaning_zh:"微光",example_en:"A glimmer appeared.",example_zh:"一道微光出现。",
  collocations:[{en:"a glimmer of light",zh:"一丝光"}]};
const byId=id=>n=>n.id===id;
const byClass=cls=>n=>(n.className||"").split(" ").includes(cls);

test("no network calls, storage, learning persistence, TTS or unsafe HTML operations",()=>{
  assert.doesNotMatch(src,/fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|\/api\/|speechSynthesis|document\.cookie|innerHTML\s*=/i);
  assert.match(src,/replaceChildren/);
});
test("full read-only card preserves phonetics, meaning, example and collocations as text",()=>{
  const f=fixture();f.view.show({wordId:"synthetic-a",word:sample,position:1,total:3,anchor:f.words[0]});
  assert.equal(f.view.getState().open,true);
  assert.equal(f.tray.getAttribute("aria-modal"),"false");
  assert.equal(find(f.tray,byClass("study-position")).textContent,"1 / 3");
  assert.equal(find(f.tray,byClass("v11-pron-ipa")).textContent,sample.phonetic_us);
  assert.equal(find(f.tray,byClass("meaning")).textContent,"微光");
  assert.equal(find(f.tray,byClass("study-translation")).textContent,sample.example_zh);
  assert.equal(all(f.tray,byClass("study-collocation")).length,1);
  assert.equal(f.backdrop.classList.contains("on"),false);
  assert.equal(f.words[0].classList.contains("study-word-active"),true);
  assert.equal(f.html.classList.contains("study-tray-open"),true);
});
test("loading and missing data disable account-status actions and explain state",()=>{
  const f=fixture();f.view.show({wordId:"synthetic-a",loading:true,position:1,total:3});
  assert.match(find(f.tray,byClass("study-loading")).textContent,/正在读取/);
  assert.equal(find(f.tray,byId("wordSave")).disabled,true);
  assert.equal(find(f.tray,byId("cloudMaster")).disabled,true);
  find(f.tray,byId("wordSave")).click();assert.deepEqual(f.calls,[]);
  f.view.show({wordId:"synthetic-b",missing:true});
  assert.match(find(f.tray,byClass("study-loading")).textContent,/暂无这张词卡/);
  assert.equal(find(f.tray,byId("cloudMaster")).disabled,true);
  assert.equal(find(f.tray,byId("wordExampleSpeak")),null);
});
test("bookmark/master actions only send intent and never optimistically flip labels",()=>{
  const f=fixture();f.view.show({wordId:"synthetic-a",word:sample,position:2,total:3,bookmarked:true,mastered:true});
  const save=find(f.tray,byId("wordSave")),master=find(f.tray,byId("cloudMaster"));
  save.click();master.click();find(f.tray,byId("wordSpeak")).click();
  find(f.tray,byId("wordExampleSpeak")).click();
  assert.deepEqual(f.calls,[["bookmark","synthetic-a",false],["mastery","synthetic-a",false],
    ["speak","glimmer","word"],["speak","A glimmer appeared.","example"]]);
  assert.match(save.textContent,/已加入/);
  assert.match(master.textContent,/继续学习/);
});
test("navigation bounds and previous/next intent use injected callback only",()=>{
  const f=fixture();f.view.show({wordId:"synthetic-a",word:sample,position:1,total:3});
  assert.equal(find(f.tray,byId("studyPrevious")).disabled,true);
  find(f.tray,byId("studyNext")).click();
  f.view.show({wordId:"synthetic-c",word:sample,position:3,total:3});
  assert.equal(find(f.tray,byId("studyNext")).disabled,true);
  find(f.tray,byId("studyPrevious")).click();
  assert.deepEqual(f.calls,[["nav",2],["nav",2]]);
});
test("malicious user-supplied strings are inserted literally, no mark-up rendering",()=>{
  const f=fixture();const title='<img src=x onerror=alert(1)>';
  f.view.show({wordId:"synthetic-a",word:{headword:title,meaning_zh:"<script>bad()</script>",
    example_en:'<svg onload=alert(2)>',collocations:[{en:"<b>unsafe</b>",zh:"说明"}]}});
  assert.equal(find(f.tray,n=>n.tag==="h3").textContent,title);
  assert.equal(find(f.tray,byClass("meaning")).textContent,"<script>bad()</script>");
  assert.equal(find(f.tray,byClass("study-collocation")).textContent,"<b>unsafe</b> · 说明");
  assert.equal(all(f.tray,n=>n.tag==="img").length,0);
});
test("showing another card immediately replaces old handlers and highlights",()=>{
  const f=fixture();f.view.show({wordId:"synthetic-a",word:sample,anchor:f.words[0],position:1,total:3});
  const firstButton=find(f.tray,byId("wordSave"));
  f.view.show({wordId:"synthetic-b",word:{...sample,headword:"explore"},anchor:f.words[1],position:2,total:3});
  assert.equal(f.words[0].classList.contains("study-word-active"),false);
  assert.equal(f.words[1].classList.contains("study-word-active"),true);
  assert.notEqual(firstButton,find(f.tray,byId("wordSave")));
  assert.equal(f.view.getState().wordId,"synthetic-b");
});
test("closing card clears highlights, allows same page reading and restores anchor focus",()=>{
  const f=fixture();f.view.show({wordId:"synthetic-a",word:sample,anchor:f.words[0]});
  find(f.tray,byId("wordClose")).click();
  assert.equal(f.view.getState().open,false);
  assert.equal(f.backdrop.classList.contains("on"),false);
  assert.equal(f.html.classList.contains("study-tray-open"),false);
  assert.equal(f.words[0].classList.contains("study-word-active"),false);
  assert.equal(f.words[0].focusCalls,1);
  assert.deepEqual(f.calls,[["close"]]);
});
test("invalid identities and unexpected word record types are rejected",()=>{
  const f=fixture();
  assert.throws(()=>f.view.show({wordId:""}),/WORDCARD_ID_REQUIRED/);
  assert.throws(()=>f.view.show({wordId:"x",word:[]}),/WORDCARD_DATA_INVALID/);
  assert.throws(()=>f.view.show({wordId:"x",word:null}),/WORDCARD_DATA_INVALID/);
  f.view.show({wordId:"synthetic-c",word:{collocations:Array.from({length:100},()=>({en:"x",zh:"y"}))}});
  assert.equal(all(f.tray,byClass("study-collocation")).length,3);
});
test("synthetic browser showcase uses no credentials or private data requests",()=>{
  const html=readFileSync(new URL("../showcase/word-card-contract.html",import.meta.url),"utf8");
  const demo=readFileSync(new URL("../showcase/word-card-demo.js",import.meta.url),"utf8");
  for(const id of ["wordBackdrop","wordPop","storyText","syntheticWordStatus"]){
    assert.ok(html.includes('id="'+id+'"'),id);
  }
  assert.match(html,/src="\.\.\/public\/word-card-view\.js"/);
  assert.match(demo,/MiaowuWordCardView\.create/);
  assert.match(demo,/synthetic-word-1/);
  assert.doesNotMatch(demo,/fetch\s*\(|localStorage|\/api\/|Bearer |Authorization/i);
});
