// Public synthetic-only provider scheduling contract; not a private model adapter.
export const PROVIDERS=Object.freeze(["codex","claude","gemini"]);
export function inspectProviderPlan({provider,chapters,saved=[],attempted=[],maxCalls=1,maxMinutes=8}={}){
 const issues=[];
 const add=code=>issues.push(code);
 if(!PROVIDERS.includes(provider))add("UNKNOWN_PROVIDER");
 if(!Number.isInteger(chapters)||chapters<1||chapters>60)add("INVALID_CHAPTERS");
 if(!Number.isInteger(maxCalls)||maxCalls<1||maxCalls>8)add("INVALID_CALL_CAP");
 if(!Number.isInteger(maxMinutes)||maxMinutes<1||maxMinutes>20)add("INVALID_TIME_CAP");
 if(!Array.isArray(saved)||!saved.every(Number.isInteger)||new Set(saved).size!==saved.length)add("INVALID_SAVED_CHAPTERS");
 if(!Array.isArray(attempted)||!attempted.every(Number.isInteger))add("INVALID_ATTEMPTS");
 if(issues.length)return {ok:false,issues,queue:[],estimatedMaxMinutes:null};
 const done=[...saved].sort((a,b)=>a-b);
 if(done.some((n,i)=>n!==i+1)||done.some(n=>n>chapters))add("BROKEN_CHAPTER_CHAIN");
 const queue=issues.length?[]:Array.from({length:Math.min(maxCalls,chapters-done.length)},(_,i)=>done.length+i+1);
 const blocked=queue.filter(n=>attempted.includes(n));
 if(blocked.length)add("CHAPTER_ALREADY_ATTEMPTED");
 return {ok:issues.length===0,issues,queue,blocked,estimatedMaxMinutes:maxCalls*maxMinutes,
  publicationEligible:false,modelCalled:false};
}
