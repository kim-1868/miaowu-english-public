import test from 'node:test';
import assert from 'node:assert/strict';
import {applySmartRecall,applySmartBookmark,shouldAdvanceSmartCard,SRS_INTERVALS} from '../public/smart-vocab-feedback.js';
import {createWordbookFirstTip} from '../public/wordbook-first-tip.js';
const storage=()=>{const d=new Map();return {getItem:k=>d.get(k),setItem:(k,v)=>d.set(k,v)};};

test('newly remembered word remains learning rather than magically mastered',()=>{
 const x=applySmartRecall({status:'new',bookmarked:false},'known','2026-11-09');
 assert.equal(x.status,'learning');assert.equal(x.nextReviewDays,1);assert.equal(x.bookmarked,false);
});
test('twenty repeated same-day correct clicks cannot inflate SRS intervals',()=>{
 let x={status:'learning',correctStreak:0};
 for(let n=0;n<20;n++)x=applySmartRecall(x,'known','2026-11-09');
 assert.equal(x.correctStreak,1);assert.equal(x.nextReviewDays,1);
 x=applySmartRecall(x,'known','2026-11-10');
 assert.equal(x.correctStreak,2);assert.equal(x.nextReviewDays,3);
});
test('SRS starts 1/3/7/14/30 and stops growing after 30',()=>{
 let x={correctStreak:0};
 for(let d=1;d<=8;d++)x=applySmartRecall(x,'known','2026-11-'+String(d).padStart(2,'0'));
 assert.deepEqual(SRS_INTERVALS,[1,3,7,14,30]);
 assert.equal(x.nextReviewDays,30);
});
test('forgotten mastered word returns to learning without auto-bookmark',()=>{
 const x=applySmartRecall({status:'mastered',correctStreak:4,bookmarked:false},'forgot','2026-11-09');
 assert.equal(x.status,'learning');assert.equal(x.correctStreak,0);assert.equal(x.bookmarked,false);
});
test('bookmark actions are independent of review progress',()=>{
 const original={status:'learning',correctStreak:3,nextReviewDays:7,bookmarked:false};
 const yes=applySmartBookmark(original,true),no=applySmartBookmark(yes,false);
 assert.equal(yes.bookmarked,true);assert.equal(no.bookmarked,false);
 assert.equal(no.correctStreak,3);assert.equal(no.nextReviewDays,7);
});
test('network failures never advance the learner',()=>{
 assert.equal(shouldAdvanceSmartCard(null),false);
 assert.equal(shouldAdvanceSmartCard({saved:false,wordId:'sample',result:'correct'}),false);
 assert.equal(shouldAdvanceSmartCard({saved:true,wordId:'sample',result:'incorrect'}),true);
});
test('invalid control state is blocked',()=>{
 assert.throws(()=>applySmartRecall({},'maybe','2026-11-09'),/INVALID_RECALL_FEEDBACK/);
 assert.throws(()=>applySmartBookmark({},'yes'),/INVALID_BOOKMARK_STATE/);
});
test('no first-visit hint is shown before smart vocabulary is actually ready',()=>{
 assert.equal(createWordbookFirstTip({storage:storage(),username:'test-a',smartReady:false}).shouldShow(),false);
});
test('first tip only once for each synthetic account',()=>{
 const s=storage(),a=createWordbookFirstTip({storage:s,username:'test-a',smartReady:true});
 const b=createWordbookFirstTip({storage:s,username:'test-b',smartReady:true});
 assert.equal(a.shouldShow(),true);assert.equal(a.dismiss(),true);
 assert.equal(a.shouldShow(),false);assert.equal(b.shouldShow(),true);
});
test('existing three-card welcome has priority',()=>{
 assert.equal(createWordbookFirstTip({storage:storage(),username:'test-a',smartReady:true,onboardingPending:true}).shouldShow(),false);
});
test('storage exceptions do not block learning UI',()=>{
 const blocked={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
 const x=createWordbookFirstTip({storage:blocked,username:'test-a',smartReady:true});
 assert.equal(x.shouldShow(),false);assert.equal(x.dismiss(),false);
});
