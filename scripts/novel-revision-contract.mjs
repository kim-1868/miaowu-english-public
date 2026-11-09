// PUBLIC synthetic-only novel revision acceptance contract.
// No server handlers, credentials, database access, book manuscripts or production IDs.
// The private repository owns authentication, D1 transactions and publishing.
const invariant=(condition,code)=>{if(!condition)throw Error(code);};
const stringId=v=>typeof v==="string"&&/^[a-z][a-z0-9_-]{2,79}$/.test(v);
const normalized=w=>({
  headword:w.headword,meaningZh:w.meaningZh,phoneticUk:w.phoneticUk||"",
  phoneticUs:w.phoneticUs||"",partOfSpeech:w.partOfSpeech||"",
  exampleEn:w.exampleEn||"",exampleZh:w.exampleZh||"",
  collocations:JSON.stringify(w.collocations||[])
});
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const wordRefs=chapter=>new Set((chapter.paragraphs||[]).flatMap(p=>(p.segments||[]).filter(s=>s.wordId).map(s=>s.wordId)));
export function inspectSyntheticNovelRevision({previous,next,history,confirmWithdrawnRewrite=false,confirmAnchorRemoval=false}){
 invariant(previous&&next&&history,"INVALID_SYNTHETIC_INPUT");
 invariant(stringId(previous.book?.id)&&previous.book.id===next.book?.id,"BOOK_ID_CHANGED");
 invariant(previous.book.title===next.book?.title&&previous.book.category===next.book?.category,"BOOK_METADATA_CHANGED");
 invariant(["draft","published"].includes(previous.book.status),"INVALID_PREVIOUS_STATUS");
 invariant(Array.isArray(previous.chapters)&&Array.isArray(next.chapters)&&next.chapters.length>=previous.chapters.length,"CHAPTER_REMOVED");
 const originalChapterIds=new Set(),nextChapterIds=new Set();
 for(let i=0;i<previous.chapters.length;i++){
   const a=previous.chapters[i],b=next.chapters[i];
   invariant(a.number===i+1&&b?.number===i+1&&stringId(a.id)&&a.id===b.id,"CHAPTER_ID_OR_ORDER_CHANGED");
   invariant(!originalChapterIds.has(a.id),"DUPLICATE_CHAPTER");
   originalChapterIds.add(a.id);
 }
 for(const [i,ch] of next.chapters.entries()){
   invariant(stringId(ch.id)&&ch.number===i+1&&!nextChapterIds.has(ch.id),"CHAPTER_ID_OR_ORDER_CHANGED");
   nextChapterIds.add(ch.id);
 }
 const withdrawn=previous.book.status==="draft"&&history.everPublished===true&&history.withdrawn===true;
 invariant(!(previous.book.status==="draft"&&history.everPublished&&!withdrawn),"UNVERIFIED_PUBLICATION_HISTORY");
 const reflow=withdrawn&&confirmWithdrawnRewrite===true;
 if(withdrawn&&!reflow)throw Error("WITHDRAWN_REWRITE_CONFIRMATION_REQUIRED");
 invariant(!withdrawn||history.backupSnapshotAvailable===true,"VERSION_BACKUP_REQUIRED");
 const originalWords=new Map((previous.words||[]).map(w=>[w.id,w]));
 const newWords=new Map((next.words||[]).map(w=>[w.id,w]));
 invariant(originalWords.size===(previous.words||[]).length&&newWords.size===(next.words||[]).length,"DUPLICATE_WORD_ID");
 const historicalWords=new Set([...(history.historicalWordIds||[]),...originalWords.keys()]);
 for(const wordId of historicalWords){
   const before=originalWords.get(wordId),after=newWords.get(wordId);
   if(before&&after)invariant(equal(normalized(before),normalized(after)),"HISTORICAL_WORD_CARD_CHANGED");
 }
 let removed=0;
 for(let i=0;i<previous.chapters.length;i++){
   const before=previous.chapters[i],after=next.chapters[i];
   if(!reflow){
     invariant(before.paragraphs.length===after.paragraphs.length,"PARAGRAPH_SHAPE_CHANGED");
     for(let j=0;j<before.paragraphs.length;j++){
       const oldIds=(before.paragraphs[j].segments||[]).filter(s=>s.wordId).map(s=>s.wordId);
       const newIds=(after.paragraphs[j].segments||[]).filter(s=>s.wordId).map(s=>s.wordId);
       let cursor=0;
       for(const id of oldIds){cursor=newIds.indexOf(id,cursor);invariant(cursor>=0,"ORIGINAL_STUDY_ANCHOR_REMOVED");cursor++;}
     }
   }
   const nextRefs=wordRefs(after);
   for(const id of wordRefs(before))if(!nextRefs.has(id))removed++;
 }
 if(previous.book.status==="published"&&removed&&!confirmAnchorRemoval)throw Error("ANCHOR_REMOVAL_CONFIRMATION_REQUIRED");
 for(const ch of next.chapters)for(const id of wordRefs(ch))invariant(newWords.has(id),"MISSING_WORD_CARD");
 // This is only a safety model, not a confirmation to publish.
 return Object.freeze({bookId:previous.book.id,withdrawn,removedAnchors:removed,
   chapters:next.chapters.length,requiresPrivateReview:true,canPublish:false,
   backupRequired:withdrawn||previous.book.status==="published"});
}
