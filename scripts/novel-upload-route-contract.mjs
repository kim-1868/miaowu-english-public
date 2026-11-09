// Public synthetic-only publisher routing model. No network, D1, OPS or secrets.
// The private server is authoritative for history, permissions and version locking.
export function decideNovelUploadRoute(pkg,catalog){
 if(!pkg?.book||!Array.isArray(catalog))throw Error("INVALID_SYNTHETIC_INPUT");
 const {id,title,category}=pkg.book;
 if(typeof id!=="string"||typeof title!=="string"||typeof category!=="string")
   throw Error("INVALID_PACKAGE_IDENTITY");
 const identical=catalog.filter(x=>x.id===id);
 if(identical.length>1)throw Error("DUPLICATE_CATALOG_ID");
 if(identical.length){
   const existing=identical[0];
   if(existing.title!==title||existing.category_id!==category)
     return {kind:"blocked",reason:"BOOK_METADATA_CHANGED",canCreate:false,canPublish:false};
   if(existing.status==="draft")
     return {kind:"revise",method:"POST",route:"/api/ops/import/revise",
       requireVersion:true,requireTitleConfirmation:true,
       requireHistoryConfirmation:true,canCreate:false,canPublish:false};
   if(existing.status==="published")
     return {kind:"live-editor",reason:"BOOK_ALREADY_PUBLISHED",
       canCreate:false,canPublish:false};
   return {kind:"blocked",reason:"UNKNOWN_BOOK_STATUS",canCreate:false,canPublish:false};
 }
 if(catalog.some(x=>x.title===title&&x.category_id===category))
   return {kind:"blocked",reason:"SAME_TITLE_DIFFERENT_ID",
     canCreate:false,canPublish:false};
 return {kind:"create",method:"POST",route:"/api/ops/import",
   requireVersion:false,canCreate:true,canPublish:false};
}

export async function simulateNovelUpload({pkg,catalog,inspect,call,approve}){
 // This is a deterministic test harness, not a production API client.
 if(typeof inspect!=="function"||typeof call!=="function"||typeof approve!=="function")
   throw Error("INJECTED_SYNTHETIC_DEPENDENCIES_REQUIRED");
 const decision=decideNovelUploadRoute(pkg,catalog);
 if(decision.kind==="blocked"||decision.kind==="live-editor")
   return {kind:decision.kind,error:decision.reason,writes:0};
 if(decision.kind==="create"){
   if(!approve("CREATE_NEW_BOOK"))return {kind:"cancelled",writes:0};
   const data=await call("/api/ops/import",{package:pkg});
   return {kind:"created-draft",bookId:data.bookId,canPublish:false,writes:1};
 }
 const existing=catalog.find(x=>x.id===pkg.book.id);
 const readiness=await inspect(existing.id);
 if(!readiness?.contentFingerprint)throw Error("NO_CURRENT_CONTENT_FINGERPRINT");
 if(!approve("REVISE_EXISTING_BOOK"))return {kind:"cancelled",writes:0};
 const payload={package:pkg,confirmTitle:existing.title,
   expectedFingerprint:readiness.contentFingerprint,
   requestId:"synthetic_revision_request_0001"};
 try{
   const res=await call("/api/ops/import/revise",payload);
   return {kind:"revised-draft",result:res,writes:1,canPublish:false};
 }catch(e){
   if(e?.code!=="WITHDRAWN_REWRITE_CONFIRMATION_REQUIRED")throw e;
   if(!approve("CONFIRM_WITHDRAWN_HISTORY"))return {kind:"cancelled",writes:0};
   const res=await call("/api/ops/import/revise",
     {...payload,confirmWithdrawnRewrite:true});
   return {kind:"revised-draft",result:res,writes:1,canPublish:false};
 }
}
