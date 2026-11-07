import test from "node:test";
import assert from "node:assert/strict";
import {inspectStoryBatchContract,inspectSyntheticChapter} from "../scripts/story-batch-contract.mjs";

// Entirely invented examples, not derived from any user-owned book or wordlist.
const entry = studyKey => ({studyKey});
const batch=()=>({books:[
 {id:"storybook_alpha",grade:"cet4",plannedChapters:8,completedChapterNumbers:[1],
  newSenses:[entry("alpha|n|first")],reuseSenses:[entry("beta|v|try")]},
 {id:"storybook_beta",grade:"cet4",plannedChapters:8,completedChapterNumbers:[],
  newSenses:[entry("gamma|n|third")],reuseSenses:[entry("alpha|n|first")]},
 {id:"storybook_gamma",grade:"cet6",plannedChapters:8,completedChapterNumbers:[1,2],
  newSenses:[entry("alpha|n|first")],reuseSenses:[]}
]});
const segment=()=>({wordId:"fictional_word",surface:"invented",gloss:"虚构"});
const draft=()=>({words:[{id:"fictional_word",headword:"invented"}],chapters:[{
 id:"fictional_chapter",number:1,paragraphs:[{segments:[
 {text:"虚构起句 "},segment(),{text:" 中间 "},segment(),{text:" 后段 "},segment(),{text:" 结束。"}
 ]}]
}]});
test("synthetic three-book plan reports only completed chapters",()=>{
 const r=inspectStoryBatchContract(batch());
 assert.equal(r.ok,true);assert.equal(r.books,3);
 assert.equal(r.plannedChapters,24);assert.equal(r.completedChapters,3);
});
test("same-grade new sense reservation conflicts fail closed",()=>{
 const x=batch();x.books[1].newSenses=[entry("ALPHA|N|FIRST")];
 assert.ok(inspectStoryBatchContract(x).issues.some(z=>z.code==="SAME_GRADE_NEW_SENSE_COLLISION"));
});
test("cross-grade identical sense is not a reservation conflict",()=>{
 assert.equal(inspectStoryBatchContract(batch()).ok,true);
});
test("separate senses of the same headword remain separate",()=>{
 const x=batch();x.books[1].newSenses=[entry("alpha|v|start")];
 assert.equal(inspectStoryBatchContract(x).ok,true);
});
test("repeated chapter number cannot inflate progress after resume",()=>{
 const x=batch();x.books[0].completedChapterNumbers=[1,1,9];
 const r=inspectStoryBatchContract(x);
 assert.equal(r.completedChapters,1);
 assert.equal(r.issues.filter(z=>z.code==="INVALID_COMPLETED_CHAPTER_NUMBER").length,2);
});
test("unfinished or unapproved claims cannot be certified in public",()=>{
 const x=batch();x.books[0].publicationEligible=true;x.books[2].published=true;
 assert.equal(inspectStoryBatchContract(x).issues.filter(z=>z.code==="PRIVATE_PUBLICATION_GATE_REQUIRED").length,2);
});
test("within-book reservation overlap is rejected",()=>{
 const x=batch();x.books[0].reuseSenses=[entry("alpha|n|first")];
 assert.ok(inspectStoryBatchContract(x).issues.some(z=>z.code==="NEW_REUSE_OVERLAP"));
});
test("invalid category, malformed study key and duplicate book id fail closed",()=>{
 const x=batch();x.books[1].grade="unknown";x.books[1].id="storybook_alpha";
 x.books[1].newSenses=[{}];
 const codes=inspectStoryBatchContract(x).issues.map(z=>z.code);
 for(const code of ["INVALID_GRADE","DUPLICATE_BOOK_ID","INVALID_STUDY_KEY"]) assert.ok(codes.includes(code));
});
test("synthetic three-mention paragraph passes structural arithmetic",()=>{
 const x=inspectSyntheticChapter(draft());
 assert.equal(x.ok,true);assert.equal(x.mentions,3);
 assert.equal(x.activeParagraphs,1);assert.equal(x.average,3);
});
test("missing annotation reference is rejected even at high density",()=>{
 const x=draft();x.chapters[0].paragraphs[0].segments[1].wordId="missing";
 assert.ok(inspectSyntheticChapter(x).issues.some(z=>z.code==="UNKNOWN_WORD_ID"));
});
test("too few mentions triggers density warning, not publication approval",()=>{
 const x=draft();x.chapters[0].paragraphs[0].segments=x.chapters[0].paragraphs[0].segments.slice(0,4);
 const r=inspectSyntheticChapter(x);
 assert.equal(r.ok,false);
 assert.ok(r.issues.some(z=>z.code==="SYNTHETIC_DENSITY_BELOW_TARGET"));
});
test("empty and non-array batches are rejected",()=>{
 for(const x of [null,{}, {books:[]}]) assert.equal(inspectStoryBatchContract(x).ok,false);
});
