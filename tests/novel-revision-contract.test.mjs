import test from "node:test";
import assert from "node:assert/strict";
import {inspectSyntheticNovelRevision as inspect} from "../scripts/novel-revision-contract.mjs";
const card=(id)=>({id,headword:"sample",meaningZh:"虚构释义",phoneticUk:"/s/",phoneticUs:"/s/",partOfSpeech:"n.",exampleEn:"A synthetic sample.",exampleZh:"合成例句",collocations:[]});
const chapter=(id,ref)=>({id,number:1,paragraphs:[{segments:[{wordId:ref,surface:"sample"}]}]});
function data(){
 const id="synthetic_book_001",chapterId="synthetic_ch_001",wordId="synthetic_word_001";
 return {previous:{book:{id,title:"合成小说",category:"cet4",status:"draft"},
     chapters:[chapter(chapterId,wordId)],words:[card(wordId)]},
   next:{book:{id,title:"合成小说",category:"cet4"},
     chapters:[chapter(chapterId,wordId)],words:[card(wordId)]},
   history:{everPublished:true,withdrawn:true,backupSnapshotAvailable:true,historicalWordIds:[wordId]}};
}
test("previously published then withdrawn requires independent rewrite authorization",()=>{
 const p=data();
 assert.throws(()=>inspect(p),/WITHDRAWN_REWRITE_CONFIRMATION_REQUIRED/);
 assert.equal(inspect({...p,confirmWithdrawnRewrite:true}).canPublish,false);
});
test("reflow may replace paragraphs but cannot change the book or chapter identity",()=>{
 const p=data();p.next.chapters[0].paragraphs.unshift({segments:[{text:"合成开篇。"}]});
 assert.equal(inspect({...p,confirmWithdrawnRewrite:true}).chapters,1);
 p.next.chapters[0].id="another_ch_001";
 assert.throws(()=>inspect({...p,confirmWithdrawnRewrite:true}),/CHAPTER_ID_OR_ORDER_CHANGED/);
});
test("retiring obsolete annotations does not delete learning cards or approve publishing",()=>{
 const p=data();p.next.chapters[0].paragraphs=[{segments:[{text:"旧目标词已不在新版正文。"}]}];
 const o=inspect({...p,confirmWithdrawnRewrite:true});
 assert.equal(o.removedAnchors,1);assert.equal(o.backupRequired,true);
 assert.equal(o.requiresPrivateReview,true);assert.equal(o.canPublish,false);
 assert.equal(p.previous.words.length,1);
});
test("historical cards cannot silently change meaning or examples",()=>{
 const p=data();p.next.words[0].meaningZh="另一释义";
 assert.throws(()=>inspect({...p,confirmWithdrawnRewrite:true}),/HISTORICAL_WORD_CARD_CHANGED/);
 p.next.words[0].meaningZh=p.previous.words[0].meaningZh;
 p.next.words[0].exampleEn="New fake example.";
 assert.throws(()=>inspect({...p,confirmWithdrawnRewrite:true}),/HISTORICAL_WORD_CARD_CHANGED/);
});
test("history without a confirmed withdrawal cannot bypass publication checks",()=>{
 const p=data();p.history.withdrawn=false;
 assert.throws(()=>inspect({...p,confirmWithdrawnRewrite:true}),/UNVERIFIED_PUBLICATION_HISTORY/);
});
test("the archived previous version must be available before replacing withdrawn books",()=>{
 const p=data();p.history.backupSnapshotAvailable=false;
 assert.throws(()=>inspect({...p,confirmWithdrawnRewrite:true}),/VERSION_BACKUP_REQUIRED/);
});
test("published book requires second confirmation before discarding an old study anchor",()=>{
 const p=data();p.previous.book.status="published";p.history.withdrawn=false;
 p.next.chapters[0].paragraphs=[{segments:[{text:"new synthetic paragraph"}]}];
 assert.throws(()=>inspect(p),/ORIGINAL_STUDY_ANCHOR_REMOVED/);
 // Published books retain their strict per-paragraph anchor requirement in this public safety model.
});
test("unpublished draft with no history keeps original annotations",()=>{
 const p=data();p.history.everPublished=false;p.history.withdrawn=false;
 p.next.chapters[0].paragraphs=[{segments:[{text:"new text"}]}];
 assert.throws(()=>inspect(p),/ORIGINAL_STUDY_ANCHOR_REMOVED/);
});
test("reject missing referenced word cards and newly introduced broken identities",()=>{
 const p=data();p.next.chapters[0].paragraphs[0].segments.push({wordId:"missing_card_001",surface:"new"});
 assert.throws(()=>inspect({...p,confirmWithdrawnRewrite:true}),/MISSING_WORD_CARD/);
});
test("synthetic contract has no Cloudflare, production database or remote network dependency",()=>{
 const p=data();const v=inspect({...p,confirmWithdrawnRewrite:true});
 assert.equal(v.bookId,"synthetic_book_001");assert.equal(v.canPublish,false);
});
