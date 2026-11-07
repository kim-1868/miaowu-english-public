// Public, synthetic-only QA contract. Never handles real manuscripts, wordlists or D1.
import { inspectAnnotationContract } from "./annotation-contract.mjs";

export const STORY_GRADES = Object.freeze(["gk","cet4","cet6","postgrad","ielts"]);
const gradeSet = new Set(STORY_GRADES);
const keyOf = (entry) => typeof entry?.studyKey === "string"
  ? entry.studyKey.trim().normalize("NFKC").toLowerCase() : "";

export function inspectStoryBatchContract(batch) {
  const issues = [], add = (code, location) => issues.push({code, location});
  if (!batch || !Array.isArray(batch.books) || !batch.books.length)
    return {ok:false, issues:[{code:"INVALID_BATCH",location:"root"}],books:0,plannedChapters:0,completedChapters:0};
  const ids = new Set(), newByGrade = new Map();
  let plannedChapters=0, completedChapters=0;
  for (const [i, book] of batch.books.entries()) {
    const at="books["+i+"]";
    if (!book || typeof book!=="object") {add("INVALID_BOOK",at);continue}
    if (typeof book.id!=="string" || !/^[a-z][a-z0-9_-]{2,79}$/.test(book.id))
      add("INVALID_BOOK_ID",at);
    else if(ids.has(book.id)) add("DUPLICATE_BOOK_ID",at);
    ids.add(book.id);
    if (!gradeSet.has(book.grade)) add("INVALID_GRADE",at);
    if (!Number.isInteger(book.plannedChapters) || book.plannedChapters<1 || book.plannedChapters>60)
      add("INVALID_PLANNED_CHAPTERS",at);
    else plannedChapters += book.plannedChapters;
    if (!Array.isArray(book.completedChapterNumbers)) {
      add("INVALID_COMPLETED_CHAPTERS",at);
    } else {
      const seenChapters = new Set();
      for (const [j, n] of book.completedChapterNumbers.entries()) {
        if (!Number.isInteger(n) || n<1 || n>book.plannedChapters || seenChapters.has(n))
          add("INVALID_COMPLETED_CHAPTER_NUMBER",at+".completedChapterNumbers["+j+"]");
        else seenChapters.add(n);
      }
      completedChapters += seenChapters.size;
    }
    if (!Array.isArray(book.newSenses) || !Array.isArray(book.reuseSenses)) {
      add("INVALID_SENSE_LISTS",at); continue;
    }
    const currentNew = new Set(), currentReuse = new Set();
    for (const [field, entries, target] of [
      ["newSenses",book.newSenses,currentNew],["reuseSenses",book.reuseSenses,currentReuse]
    ]) for (const [j, entry] of entries.entries()) {
      const key=keyOf(entry),where=at+"."+field+"["+j+"]";
      if (!key) {add("INVALID_STUDY_KEY",where);continue}
      if (target.has(key)) add("DUPLICATE_SENSE_IN_BOOK",where);
      target.add(key);
    }
    for (const key of currentNew) if(currentReuse.has(key))
      add("NEW_REUSE_OVERLAP",at);
    if (gradeSet.has(book.grade)) {
      const reserved=newByGrade.get(book.grade)||new Set();
      for (const key of currentNew) {
        if (reserved.has(key)) add("SAME_GRADE_NEW_SENSE_COLLISION",at);
        reserved.add(key);
      }
      newByGrade.set(book.grade,reserved);
    }
    // Public CI has no access to private editorial approvals, rights or entitlements.
    if (book.published === true || book.publicationEligible === true)
      add("PRIVATE_PUBLICATION_GATE_REQUIRED",at);
  }
  return {ok:issues.length===0,issues,books:batch.books.length,plannedChapters,completedChapters};
}

// This validates a synthetic chapter's *structure and arithmetic*, not English naturalness.
// The real importer and editorial sign-off remain private.
export function inspectSyntheticChapter(pkg, minAverage=3) {
  const basic=inspectAnnotationContract(pkg);
  const issues=[...basic.issues];
  if(!basic.ok) return {ok:false,issues,mentions:basic.mentions,activeParagraphs:0,average:0};
  const count=pkg.chapters.reduce((a,ch)=>a+ch.paragraphs.filter(p=>
    p.segments.some(s=>Object.hasOwn(s,"wordId"))).length,0);
  const average=count?basic.mentions/count:0;
  if(!Number.isFinite(minAverage)||minAverage<0||average<minAverage)
    issues.push({code:"SYNTHETIC_DENSITY_BELOW_TARGET",location:"chapters"});
  return {ok:issues.length===0,issues,mentions:basic.mentions,activeParagraphs:count,average};
}
