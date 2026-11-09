// Public offline novel-package checker. No network, credentials or real content stored.
// Can compare a candidate with an owner-supplied historical export locally.
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
const MAX_BYTES=2_000_000, MAX_JSON=1_500_000;
const ID=/^[a-z][a-z0-9_-]{2,79}$/;
const safe=(s)=>typeof s==="string"&&s.trim().length>0;
const cards=x=>new Map((x.words||[]).map(w=>[w.id,w]));
const idData=(p)=>({id:p.book?.id,title:p.book?.title,category:p.book?.category});
function anchorSet(ch){return new Set((ch.paragraphs||[]).flatMap(p=>(p.segments||[]).filter(s=>s.wordId).map(s=>s.wordId)));}
const signature=w=>[w?.headword,w?.meaningZh,w?.partOfSpeech||""].join("\u241f").toLocaleLowerCase();
export function inspectNovelPackage(input,{original=null,bytes=0}={}){
 const errors=[],warnings=[],stats={};
 const fail=(code,detail)=>errors.push({code,detail});
 const warn=(code,detail)=>warnings.push({code,detail});
 if(bytes>MAX_BYTES)fail("FILE_SIZE_EXCEEDS_2MB",String(bytes));
 if(!input||typeof input!=="object"||input.version!==1||!input.book
   ||!Array.isArray(input.words)||!Array.isArray(input.chapters)){
   return {ok:false,errors:[...errors,{code:"INVALID_NOVEL_PACKAGE",detail:"version/book/chapters/words"}],warnings,stats};
 }
 const pkg=input;
 const b=pkg.book,ws=pkg.words,chs=pkg.chapters;
 stats.bookId=b.id;stats.title=b.title;stats.category=b.category;stats.chapters=chs.length;
 stats.words=ws.length;stats.anchors=0;stats.paragraphs=0;stats.minimumAnchorsPerParagraph=null;
 if(!ID.test(b.id||"")||!safe(b.title)||!safe(b.category))fail("BOOK_IDENTITY_INVALID",String(b.id));
 if(chs.length<1||chs.length>60)fail("CHAPTER_COUNT_INVALID",String(chs.length));
 if(ws.length<1||ws.length>1500)fail("WORD_CARD_COUNT_INVALID",String(ws.length));
 if(Buffer.byteLength(JSON.stringify(pkg),"utf8")>MAX_JSON)fail("PACKAGE_BODY_TOO_LARGE","package JSON > 1.5MB");
 const wordMap=cards(pkg);
 if(wordMap.size!==ws.length)fail("DUPLICATE_WORD_ID","candidate contains duplicate word ids");
 const wordSigs=new Map();
 for(const w of ws){
   if(!ID.test(w.id||""))fail("INVALID_WORD_ID",String(w.id));
   for(const field of ["headword","meaningZh","phoneticUk","phoneticUs","exampleEn","exampleZh"])
     if(!safe(w[field]))fail("MISSING_WORD_CARD_FIELD",w.id+":"+field);
   const sig=signature(w);
   if(wordSigs.has(sig)&&wordSigs.get(sig)!==w.id)
     warn("DUPLICATE_WORD_SENSE_DIFFERENT_ID",w.id+" vs "+wordSigs.get(sig));
   wordSigs.set(sig,w.id);
 }
 const chapterIds=new Set();
 for(const [i,ch] of chs.entries()){
   if(!ID.test(ch.id||"")||chapterIds.has(ch.id)||ch.number!==i+1)
     fail("CHAPTER_ID_OR_SEQUENCE_INVALID",String(ch.id));
   chapterIds.add(ch.id);
   if(!Array.isArray(ch.paragraphs)||ch.paragraphs.length<1){
     fail("CHAPTER_PARAGRAPHS_MISSING",String(ch.id));continue;
   }
   for(const [pi,p] of ch.paragraphs.entries()){
     if(!Array.isArray(p.segments)||p.segments.length===0){
       fail("EMPTY_PARAGRAPH",ch.id+"#"+pi);continue;
     }
     stats.paragraphs++;
     let count=0;
     for(const seg of p.segments){
       if(seg.wordId){
         count++;stats.anchors++;
         if(!wordMap.has(seg.wordId))fail("ANNOTATION_WORD_NOT_FOUND",ch.id+"#"+pi+":"+seg.wordId);
         if(!safe(seg.surface))fail("ANNOTATION_SURFACE_MISSING",ch.id+"#"+pi);
       }else if(typeof seg.text!=="string")fail("SEGMENT_TEXT_INVALID",ch.id+"#"+pi);
     }
     stats.minimumAnchorsPerParagraph=stats.minimumAnchorsPerParagraph==null
       ?count:Math.min(stats.minimumAnchorsPerParagraph,count);
     if(count===0)warn("PARAGRAPH_HAS_NO_ENGLISH_TARGETS",ch.id+"#"+pi);
   }
 }
 stats.meanAnchorsPerParagraph=stats.paragraphs?Number((stats.anchors/stats.paragraphs).toFixed(2)):0;
 if(stats.anchors===0)fail("NO_STUDY_ANNOTATIONS","No learning target annotations");
 if(stats.words>500)warn("REVISION_WORD_LIMIT_EXCEEDED",String(stats.words));
 if(chs.length>0&&original){
   if(original.version!==1||!original.book||!Array.isArray(original.chapters)||!Array.isArray(original.words)){
     fail("INVALID_ORIGINAL_EXPORT","Missing historical book package");
   }else{
     if(b.id!==original.book.id||b.category!==original.book.category||b.title!==original.book.title)
       fail("ORIGINAL_BOOK_IDENTITY_CHANGED","book ID/title/category must match");
     if(chs.length!==original.chapters.length)
       fail("EXISTING_CHAPTER_SET_CHANGED","current draft revision requires same number of chapters");
     for(let i=0;i<Math.min(chs.length,original.chapters.length);i++){
       const old=original.chapters[i],next=chs[i];
       if(old.id!==next.id||old.number!==next.number)
         fail("EXISTING_CHAPTER_ID_CHANGED",old.id+" to "+next.id);
     }
     const oldById=cards(original),oldSigs=new Map(original.words.map(w=>[signature(w),w.id]));
     for(const w of ws){
       const old=oldById.get(w.id);
       if(old&&JSON.stringify(old)!==JSON.stringify(w))
         warn("EXISTING_WORD_CARD_REVIEW_REQUIRED",w.id);
       const oldId=oldSigs.get(signature(w));
       if(oldId&&oldId!==w.id)
         fail("SAME_SENSE_NEW_WORD_ID",w.id+" replaces "+oldId);
     }
     let retired=0;
     for(let i=0;i<Math.min(chs.length,original.chapters.length);i++){
       const present=anchorSet(chs[i]);
       for(const id of anchorSet(original.chapters[i]))if(!present.has(id))retired++;
     }
     stats.retiredHistoricalWordAnchors=retired;
     if(retired>0)warn("HISTORICAL_ANNOTATIONS_REMOVED_REQUIRES_APPROVAL",String(retired));
   }
 }
 return {ok:errors.length===0,errors,warnings,stats,
   note:"Local package checks only. Publisher, D1 backup and server version compatibility require private authenticated review."};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const filepath=process.argv[2];
 if(!filepath){console.error("Usage: node scripts/inspect-novel-package.mjs <candidate.json> [original-export.json]");process.exit(2)}
 try{
   const data=readFileSync(filepath);
   const pkg=JSON.parse(data.toString("utf8"));
   const before=process.argv[3]?JSON.parse(readFileSync(process.argv[3],"utf8")):null;
   const result=inspectNovelPackage(pkg.package??pkg,{original:before?(before.package??before):null,bytes:data.byteLength});
   console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;
 }catch(e){console.error("PACKAGE_INSPECTION_FAILED:",e.message);process.exitCode=1}
}
