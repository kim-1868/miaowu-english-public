// PUBLIC SYNTHETIC CONTRACT. Pure learning feedback; no auth, orders, D1 or real words.
export const SRS_INTERVALS=Object.freeze([1,3,7,14,30]);
export function applySmartRecall(previous={},judgment,studyDay){
  if(!['known','forgot'].includes(judgment))throw Error('INVALID_RECALL_FEEDBACK');
  if(typeof studyDay!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(studyDay))
    throw Error('INVALID_STUDY_DAY');
  const priorStreak=Math.max(0,Math.min(5,Number.isSafeInteger(previous.correctStreak)?previous.correctStreak:0));
  const sameDay=previous.lastCorrectDay===studyDay;
  const streak=judgment==='known'?(sameDay?Math.max(1,priorStreak):Math.min(5,priorStreak+1)):0;
  const nextReviewDays=judgment==='known'?SRS_INTERVALS[Math.max(0,streak-1)]:1;
  const status=judgment==='known'&&previous.status==='mastered'?'mastered':'learning';
  return {
    status,correctStreak:streak,nextReviewDays,
    lastCorrectDay:judgment==='known'?studyDay:previous.lastCorrectDay||null,
    bookmarked:previous.bookmarked===true
  };
}
export function applySmartBookmark(previous={},bookmarked){
  if(typeof bookmarked!=='boolean')throw Error('INVALID_BOOKMARK_STATE');
  return {...previous,bookmarked};
}
export function shouldAdvanceSmartCard(response){
  return response?.saved===true&&response?.wordId!=null&&
    (response?.alreadyApplied===true||response?.result==='correct'||response?.result==='incorrect');
}
