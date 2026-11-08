import test from "node:test";
import assert from "node:assert/strict";
import {reviewChapterGate,inspectRepairSubmission} from "../scripts/story-review-contract.mjs";
test("saved chapters have separate density and teaching status",()=>{
 assert.equal(reviewChapterGate({saved:true,densityP1:0,densityP2:0}).state,"density-passed-teaching-pending");
 assert.equal(reviewChapterGate({saved:true,densityP1:1}).state,"density-failed");
});
test("a chapter with a P2 sentence distribution flag cannot resume batch generation",()=>{
 const x=reviewChapterGate({saved:true,densityP2:1});
 assert.equal(x.mayContinueGeneration,false);
});
test("passed density still does not imply publication eligibility",()=>{
 const x=reviewChapterGate({saved:true,teachingApproved:true});
 assert.equal(x.state,"teaching-approved");assert.equal(x.publicationEligible,false);
});
test("changed chapter identity and changed word ID sets block candidate replacement",()=>{
 for(const changes of [{identityStable:false},{wordIdsStable:false}]){
  const x=reviewChapterGate({saved:true,...changes});
  assert.equal(x.mayInstallRevisionCandidate,false);
 }
});
test("candidate installation needs matching original SHA and no active model",()=>{
 const sha="a".repeat(64);
 assert.equal(inspectRepairSubmission({preflightSha:sha,actualSha:sha,confirmed:true}).canApply,true);
 assert.equal(inspectRepairSubmission({preflightSha:sha,actualSha:"b".repeat(64),confirmed:true}).canApply,false);
 assert.equal(inspectRepairSubmission({preflightSha:sha,actualSha:sha,modelRunning:true,confirmed:true}).canApply,false);
 assert.equal(inspectRepairSubmission({preflightSha:sha,actualSha:sha}).canApply,false);
});
test("invalid counts never unlock generation",()=>{
 assert.equal(reviewChapterGate({saved:true,densityP1:-1}).mayContinueGeneration,false);
 assert.equal(reviewChapterGate({saved:true,densityP2:NaN}).mayContinueGeneration,false);
});
