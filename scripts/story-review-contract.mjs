// W3.1 PUBLIC SYNTHETIC CONTRACT. No real manuscript, D1, secrets or model calls.
export const REVIEW_STATES=Object.freeze(["not-generated","density-failed","density-passed-teaching-pending","teaching-approved"]);
export function reviewChapterGate({saved=false,densityP1=0,densityP2=0,teachingApproved=false,identityStable=true,wordIdsStable=true}={}){
 const flags=[];
 if(!saved)flags.push("NOT_SAVED");
 if(!Number.isInteger(densityP1)||densityP1<0||!Number.isInteger(densityP2)||densityP2<0)flags.push("INVALID_DENSITY_COUNTS");
 if(!identityStable)flags.push("CHAPTER_IDENTITY_CHANGED");
 if(!wordIdsStable)flags.push("WORD_IDS_CHANGED");
 const densityPassed=saved&&densityP1===0&&densityP2===0&&flags.length===0;
 const state=!saved?"not-generated":!densityPassed?"density-failed":teachingApproved?"teaching-approved":"density-passed-teaching-pending";
 return {state,densityPassed,
  mayContinueGeneration:densityPassed,
  mayInstallRevisionCandidate:densityPassed&&!teachingApproved,
  publicationEligible:false, // private entitlement, source and editorial sign-off are ALWAYS needed
  flags};
}
export function inspectRepairSubmission({preflightSha,actualSha,modelRunning=false,confirmed=false}={}){
 const issues=[];
 if(!preflightSha||!actualSha||preflightSha!==actualSha)issues.push("SOURCE_CHANGED_RECHECK");
 if(modelRunning)issues.push("MODEL_JOB_ACTIVE");
 if(!confirmed)issues.push("HUMAN_CONFIRMATION_REQUIRED");
 return {canApply:issues.length===0,issues,publicationEligible:false};
}
