// Public synthetic-only contract guard: no private manuscripts, wordlists, or credentials.
export function inspectAnnotationContract(pkg) {
  const issues=[],add=(code,location)=>issues.push({code,location});
  if(!pkg||!Array.isArray(pkg.words)||!Array.isArray(pkg.chapters))
    return {ok:false,issues:[{code:"INVALID_PACKAGE",location:"root"}],mentions:0,usedWordIds:[]};
  const ids=new Set(),chapterIds=new Set(),numbers=new Set(),used=new Set();let mentions=0;
  pkg.words.forEach((w,i)=>{const p="words["+i+"]";
    if(!w||typeof w.id!=="string"||!w.id.trim()){add("INVALID_WORD_ID",p);return}
    if(ids.has(w.id))add("DUPLICATE_WORD_ID",p);ids.add(w.id);
  });
  pkg.chapters.forEach((ch,i)=>{
    const at="chapters["+i+"]";
    if(!ch||typeof ch.id!=="string"||!ch.id.trim()){add("INVALID_CHAPTER_ID",at);return}
    if(chapterIds.has(ch.id))add("DUPLICATE_CHAPTER_ID",at);chapterIds.add(ch.id);
    if(!Number.isInteger(ch.number)||numbers.has(ch.number))add("INVALID_CHAPTER_NUMBER",at);
    numbers.add(ch.number);
    if(!Array.isArray(ch.paragraphs)){add("INVALID_PARAGRAPHS",at);return}
    ch.paragraphs.forEach((p,pi)=>{
      const pt=at+".paragraphs["+pi+"]";
      if(!p||!Array.isArray(p.segments)||!p.segments.length){add("INVALID_SEGMENTS",pt);return}
      p.segments.forEach((s,si)=>{
        const st=pt+".segments["+si+"]";
        if(!s||typeof s!=="object"){add("INVALID_SEGMENT",st);return}
        if(Object.hasOwn(s,"wordId")){
          if(Object.hasOwn(s,"text"))add("MIXED_SEGMENT",st);
          if(typeof s.wordId!=="string"||!ids.has(s.wordId))add("UNKNOWN_WORD_ID",st);
          if(typeof s.surface!=="string"||!s.surface.trim())add("EMPTY_SURFACE",st);
          if(typeof s.gloss!=="string"||!s.gloss.trim())add("EMPTY_GLOSS",st);
          if(ids.has(s.wordId))used.add(s.wordId);mentions++;
        }else if(typeof s.text!=="string"||!s.text.trim())add("EMPTY_TEXT",st);
        else if(Object.hasOwn(s,"surface")||Object.hasOwn(s,"gloss"))add("INVALID_TEXT_SEGMENT",st);
      });
    });
  });
  return {ok:issues.length===0,issues,mentions,usedWordIds:[...used].sort()};
}
