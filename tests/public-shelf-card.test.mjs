import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const script=readFileSync(new URL("../public/shelf-card.js",import.meta.url),"utf8");
const mock=tag=>{
  const attrs=new Map(),children=[],listeners=new Map(),styles=new Map();
  return {tag,className:"",type:"",textContent:"",children,attrs,styles,listeners,
    style:{setProperty:(key,value)=>styles.set(key,value)},
    setAttribute:(key,value)=>attrs.set(key,String(value)),
    getAttribute:key=>attrs.get(key),
    addEventListener:(key,fn)=>listeners.set(key,fn),
    append(...items){children.push(...items);},
    click(){listeners.get("click")?.({target:this,currentTarget:this});},
    set innerHTML(_){throw Error("HTML injection not allowed in public card renderer");}
  };
};
function fixture(){
  const window={};
  runInNewContext(script,{window});
  return {window,api:window.MiaowuShelfCard.create({document:{createElement:mock}})};
}
function find(root,pred){
  if(pred(root))return root;
  for(const child of root.children||[]){
    const found=find(child,pred);if(found)return found;
  }
  return null;
}
function all(root,pred){
  const out=[];
  (function visit(n){if(pred(n))out.push(n);for(const c of n.children||[])visit(c);})(root);
  return out;
}
const classNamed=name=>node=>(node.className||"").split(" ").includes(name);
const sample={id:"synthetic-a",title:"月光邮局",description:"一封迟到的信",
  cover_tags:[{label:"治愈",color:"#bc7888"},{label:"短篇",color:"#AABBCC"}]};

test("public shelf card renderer never contacts private API or stores learning state",()=>{
 assert.doesNotMatch(script,/fetch\s*\(|XMLHttpRequest|\/api\/|localStorage|sessionStorage|document\.cookie|import\s*\(/);
 assert.doesNotMatch(script,/innerHTML\s*=/);
 assert.match(script,/window\);/);
});

test("card class names, tags, button labels and pending progress match existing app presentation",()=>{
 const {api}=fixture();
 const card=api.render({book:sample,index:0,category:"cet4",entitled:true,
   hasProgress:true,bookmarked:true});
 assert.equal(card.className,"book-item cloud-book-item");
 assert.equal(find(card,classNamed("book-cover")).getAttribute("aria-label"),"月光邮局");
 assert.equal(find(card,classNamed("book-tag")).textContent,"已解锁");
 assert.equal(find(card,classNamed("pill")).textContent,"CET4");
 assert.equal(find(card,classNamed("shelf-progress")).getAttribute("data-live-progress"),"synthetic-a");
 assert.equal(find(card,classNamed("progress-fill")).styles.get("width"),"0%");
 assert.equal(find(card,classNamed("primary")).textContent,"继续阅读 →");
 const saved=find(card,classNamed("cloud-bookmark-button"));
 assert.equal(saved.textContent,"✓ 已收藏");
 assert.equal(saved.getAttribute("aria-pressed"),"true");
 const tags=all(card,classNamed("cover-custom-tag"));
 assert.equal(tags.length,2);
 assert.equal(tags[0].styles.get("--cover-tag-color"),"#bc7888");
});

test("a locked card displays catalog intent without granting permissions",()=>{
 const {api}=fixture();const card=api.render({book:sample,category:"cet4"});
 assert.equal(find(card,classNamed("book-tag")).textContent,"会员专享");
 assert.equal(find(card,classNamed("primary")).textContent,"查看会员目录 →");
 const pills=all(card,classNamed("pill")).map(p=>p.textContent);
 assert.ok(pills.includes("解锁后阅读"));
 assert.equal(find(card,classNamed("cloud-bookmark-button")).getAttribute("aria-pressed"),"false");
});

test("caller alone owns reading and bookmarking; UI never optimistically flips status",()=>{
 const {api}=fixture(),calls=[];
 const card=api.render({book:sample,entitled:true,bookmarked:false,
  onOpen:book=>calls.push(["read",book.id]),
  onBookmarkToggle:(book,next)=>calls.push(["bookmark",book.id,next])});
 find(card,classNamed("primary")).click();
 const button=find(card,classNamed("cloud-bookmark-button"));
 button.click();
 assert.deepEqual(calls,[["read","synthetic-a"],["bookmark","synthetic-a",true]]);
 assert.equal(button.getAttribute("aria-pressed"),"false");
 assert.equal(button.textContent,"♡ 收藏小说");
});

test("untrusted book title and tag render as plain text; invalid colors and covers excluded",()=>{
 const {api}=fixture();
 const title='<img src=x onerror=alert(1)>';
 const book={id:'" data-malice="1',title,description:'<script>bad()</script>',
   cover_tags:[{label:'<svg onload=alert(1)>',color:"#abcdef"},
               {label:"invalid",color:"red"},
               {label:"bad",color:"var(--a)"}]};
 const card=api.render({book,coverUrl:"javascript:alert(1)"});
 assert.equal(find(card,n=>n.tag==="h3").textContent,title);
 assert.equal(find(card,classNamed("shelf-progress")).getAttribute("data-live-progress"),book.id);
 assert.equal(find(card,n=>n.tag==="p").textContent,book.description);
 assert.equal(all(card,n=>n.tag==="img").length,0);
 const tags=all(card,classNamed("cover-custom-tag"));
 assert.equal(tags.length,1);
 assert.equal(tags[0].textContent,"<svg onload=alert(1)>");
});

test("valid same-origin cover image is rendered without external URI support",()=>{
 const {window,api}=fixture();
 assert.equal(window.MiaowuShelfCard.validCoverUrl("/api/covers/book-1?v=cover-d1-1234"),true);
 for(const unsafe of ["//evil.example/a.png","https://evil.example/a.png","data:image/png;base64,AAAA",
   "javascript:alert(1)","/../private.txt","/img\\bad.png"]){
   assert.equal(window.MiaowuShelfCard.validCoverUrl(unsafe),false,unsafe);
 }
 const card=api.render({book:sample,coverUrl:"/shelf-cet4.svg",index:2});
 const image=find(card,n=>n.tag==="img");
 assert.equal(image.getAttribute("src"),"/shelf-cet4.svg");
 assert.equal(image.getAttribute("loading"),"lazy");
 assert.equal(find(card,classNamed("illustration")),null);
});

test("invalid records are rejected and optional fields stay bounded",()=>{
 const {api}=fixture();
 assert.throws(()=>api.render({}),/INVALID_BOOK/);
 assert.throws(()=>api.render({book:{id:"",title:"x"}}),/INVALID_BOOK/);
 assert.throws(()=>api.render({book:{id:"x",title:4}}),/INVALID_BOOK/);
 const longTags=Array.from({length:300},(_,i)=>({label:"tag"+i,color:"#ffffff"}));
 const card=api.render({book:{id:"x",title:"安全",cover_tags:longTags},index:Infinity});
 assert.equal(all(card,classNamed("cover-custom-tag")).length,8);
 assert.equal(find(card,classNamed("eyebrow")).textContent,"01");
});

test("browser showcase uses only synthetic fixtures and the exported public renderer",()=>{
 const html=readFileSync(new URL("../showcase/shelf-card-contract.html",import.meta.url),"utf8");
 const demo=readFileSync(new URL("../showcase/shelf-card-demo.js",import.meta.url),"utf8");
 assert.match(html,/src="\.\.\/public\/shelf-card\.js"/);
 assert.match(html,/id="syntheticCardGrid"/);
 assert.match(demo,/MiaowuShelfCard\.create/);
 assert.match(demo,/synthetic-book-a/);
 assert.doesNotMatch(demo,/fetch\s*\(|localStorage|\/api\/|password|activation|order_id/i);
});
