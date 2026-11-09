import test from "node:test";
import assert from "node:assert/strict";
import {inspectNovelPackage} from "../scripts/inspect-novel-package.mjs";
const word=(id="synthetic_card_001")=>({id,headword:"sample",meaningZh:"样本",phoneticUk:"/s/",
 phoneticUs:"/s/",partOfSpeech:"n.",exampleEn:"A sample sentence.",exampleZh:"示例句子",collocations:[]});
const pkg=()=>({version:1,book:{id:"synthetic_book_001",title:"仅供测试",category:"cet4"},
 words:[word()],chapters:[{id:"synthetic_ch_001",number:1,title:"第一章",preview:true,
 paragraphs:[{segments:[{text:"中文"}, {wordId:"synthetic_card_001",surface:"sample"}]}]}]});
test("clean fictitious package passes offline checks and stays unpublished",()=>{
 const r=inspectNovelPackage(pkg(),{bytes:2000});
 assert.equal(r.ok,true);assert.equal(r.stats.anchors,1);assert.equal(r.stats.chapters,1);
 assert.match(r.note,/private authenticated review/);
});
test("reject missing Chinese meaning and both phonetics or examples",()=>{
 const p=pkg();p.words[0].phoneticUs="";
 p.words[0].exampleZh="";p.words[0].meaningZh="";
 const r=inspectNovelPackage(p);
 assert.equal(r.ok,false);assert.equal(r.errors.filter(x=>x.code==="MISSING_WORD_CARD_FIELD").length,3);
});
test("reject annotation referencing a missing card",()=>{
 const p=pkg();p.chapters[0].paragraphs[0].segments[1].wordId="synthetic_missing_001";
 assert.ok(inspectNovelPackage(p).errors.some(x=>x.code==="ANNOTATION_WORD_NOT_FOUND"));
});
test("warn about long Chinese-only paragraphs without treating it as complete teaching approval",()=>{
 const p=pkg();p.chapters[0].paragraphs.push({segments:[{text:"只有中文的内容。"}]});
 const r=inspectNovelPackage(p);assert.equal(r.ok,true);
 assert.ok(r.warnings.some(x=>x.code==="PARAGRAPH_HAS_NO_ENGLISH_TARGETS"));
});
test("do not allow chapter identity drift in a replacement",()=>{
 const p=pkg(),n=pkg();n.chapters[0].id="synthetic_other_001";
 const r=inspectNovelPackage(n,{original:p});
 assert.ok(r.errors.some(x=>x.code==="EXISTING_CHAPTER_ID_CHANGED"));
});
test("do not allow same old word sense to acquire a different new ID",()=>{
 const p=pkg(),n=pkg();
 n.words[0].id="synthetic_card_002";n.chapters[0].paragraphs[0].segments[1].wordId="synthetic_card_002";
 const r=inspectNovelPackage(n,{original:p});
 assert.ok(r.errors.some(x=>x.code==="SAME_SENSE_NEW_WORD_ID"));
});
test("historical anchors can disappear only with additional publisher review",()=>{
 const p=pkg(),n=pkg();
 n.chapters[0].paragraphs[0].segments=[{text:"新的中文内容"}];
 const r=inspectNovelPackage(n,{original:p});
 assert.ok(r.warnings.some(x=>x.code==="HISTORICAL_ANNOTATIONS_REMOVED_REQUIRES_APPROVAL"));
 assert.equal(r.stats.retiredHistoricalWordAnchors,1);
});
test("prevent more than 2MB file and flag backend historical revision word cap",()=>{
 const p=pkg();
 const bigger=inspectNovelPackage(p,{bytes:2_000_001});
 assert.equal(bigger.ok,false);
 for(let i=1;i<501;i++)p.words.push(word("synthetic_card_"+String(i).padStart(3,"0")));
 const r=inspectNovelPackage(p);assert.ok(r.warnings.some(x=>x.code==="REVISION_WORD_LIMIT_EXCEEDED"));
});
test("the catalog may not silently reclassify a book",()=>{
 const p=pkg(),n=pkg();n.book.category="cet6";
 assert.ok(inspectNovelPackage(n,{original:p}).errors.some(x=>x.code==="ORIGINAL_BOOK_IDENTITY_CHANGED"));
});
