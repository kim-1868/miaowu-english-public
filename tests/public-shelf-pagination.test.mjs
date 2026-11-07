import test from "node:test";
import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { readFileSync } from "node:fs";

const js=readFileSync(new URL("../public/shelf-pagination.js",import.meta.url),"utf8");
function makeNode(tag="div"){
 const attrs=new Map(),handlers=new Map();
 const node={
   tag,className:"",textContent:"",disabled:false,children:[],parent:null,attrs,handlers,
   setAttribute(key,value){attrs.set(key,String(value));},
   getAttribute(key){return attrs.get(key);},
   addEventListener(type,callback){handlers.set(type,callback);},
   fire(type){handlers.get(type)?.({target:node});},
   append(...xs){for(const child of xs){child.parent=node;node.children.push(child);}},
   remove(){if(node.parent){node.parent.children=node.parent.children.filter(x=>x!==node);node.parent=null;}},
   querySelector(selector){
     if(selector!==":scope > .shelf-pagination")return null;
     return node.children.find(x=>x.className==="shelf-pagination")||null;
   }
 };
 return node;
}
function fixture(){
 const root={};
 runInNewContext(js,{window:root});
 return{controller:root.MiaowuShelfPagination.create({document:{createElement:makeNode}}),root};
}
const elements=nav=>nav.children[1].children;
const buttons=nav=>elements(nav).filter(x=>x.tag==="button");
const click=(nav,label)=>{const b=buttons(nav).find(x=>x.textContent===label);if(!b)throw Error("Missing button "+label);b.fire("click");return b};

test("private-free renderer has no network, account or persistent learning state",()=>{
 assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|\/api\/|localStorage|sessionStorage|document\.cookie|database/i);
 assert.match(js,/MiaowuShelfPagination/);
});

test("single page renders nothing; 16 pages shows current and gap markers",()=>{
 const {controller}=fixture();
 assert.equal(controller.build({meta:{totalPages:1,total:4},currentPage:1}),null);
 const nav=controller.build({meta:{totalPages:16,total:144},currentPage:8,pageSize:9});
 assert.equal(nav.tag,"nav");
 assert.equal(nav.getAttribute("aria-label"),"小说书架分页");
 assert.equal(nav.children[0].textContent,"共 144 本 · 每页 9 本");
 const page=buttons(nav).find(x=>x.textContent==="8");
 assert.equal(page.getAttribute("aria-current"),"page");
 assert.equal(page.disabled,true);
 assert.deepEqual(buttons(nav).map(x=>x.textContent),["上一页","1","7","8","9","16","下一页"]);
 assert.equal(elements(nav).filter(x=>x.className==="shelf-page-ellipsis").length,2);
});

test("previous, next and page-number navigation uses only caller callback",()=>{
 const {controller}=fixture();const calls=[];
 const nav=controller.build({meta:{totalPages:8,total:72},currentPage:3,onPageChange:p=>calls.push(p)});
 click(nav,"上一页");click(nav,"下一页");click(nav,"1");click(nav,"3");
 assert.deepEqual(calls,[2,4,1]);
 const nav1=controller.build({meta:{totalPages:8,total:72},currentPage:1,onPageChange:p=>calls.push(p)});
 assert.equal(click(nav1,"上一页").disabled,true);
 const nav8=controller.build({meta:{totalPages:8,total:72},currentPage:8,onPageChange:p=>calls.push(p)});
 assert.equal(click(nav8,"下一页").disabled,true);
});

test("hostile labels stay in textContent and render replaces existing nav",()=>{
 const {controller}=fixture(),container=makeNode("section");
 const first=controller.render({container,meta:{totalPages:3,total:27},currentPage:1});
 assert.equal(container.children.length,1);
 assert.equal(first.getAttribute("aria-label"),"小说书架分页");
 const next=controller.render({container,meta:{totalPages:3,total:27},currentPage:2});
 assert.notEqual(first,next);
 assert.equal(container.children.length,1);
 assert.equal(buttons(next).find(b=>b.textContent==="2").getAttribute("aria-current"),"page");
 controller.render({container,meta:{totalPages:1,total:4}});
 assert.equal(container.children.length,0);
});

test("invalid/huge pagination metadata cannot create a large DOM",()=>{
 const {controller}=fixture();
 assert.equal(controller.build({meta:{totalPages:Infinity,total:Infinity}}),null);
 const nav=controller.build({meta:{totalPages:999999999,total:999999999},currentPage:999999998});
 assert.ok(elements(nav).length<=10);
 assert.ok(buttons(nav).length<=7);
});

test("public synthetic shelf preview uses the exported adapter",()=>{
 const html=readFileSync(new URL("../showcase/shelf-pagination-contract.html",import.meta.url),"utf8");
 const demo=readFileSync(new URL("../showcase/shelf-pagination-demo.js",import.meta.url),"utf8");
 for(const id of ["bookGrid","selectedCategoryTitle","syntheticPage"])assert.ok(html.includes('id="'+id+'"'));
 assert.match(html,/src="\.\.\/public\/shelf-pagination\.js"/);
 assert.match(demo,/MiaowuShelfPagination\?\.create/);
 assert.match(demo,/onPageChange\(next\)/);
 assert.doesNotMatch(demo,/fetch\(|localStorage|sessionStorage|\/api\//i);
});
