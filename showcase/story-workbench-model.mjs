// Public STORY-W1: deterministic, in-memory synthetic task state machine.
// No API requests, actual manuscripts, passwords, D1, file system writes or model calls.
export const GRADES=Object.freeze({cet4:"四级",cet6:"六级",postgrad:"考研",ielts:"雅思",gk:"高中"});
export const STATES=Object.freeze({planned:"待启动",running:"生成中（模拟）",paused:"已暂停",failed:"运行失败（模拟）",review:"待人工审核",ready:"允许导出（演示）"});
const valid=(value,max)=>typeof value==="string"&&value.trim().length>0&&value.trim().length<=max;
const clone=value=>JSON.parse(JSON.stringify(value));
const freezeSnapshot=rows=>clone(rows);
export function createWorkbench(){
  const books=new Map(),events=[];
  let serial=0;
  function ensure(id){const item=books.get(id);if(!item)throw Error("TASK_NOT_FOUND");return item}
  function note(item,verb){events.unshift({bookId:item.id,title:item.title,verb,seq:events.length+1});if(events.length>80)events.length=80}
  function addBatch(config){
    if(!config||!GRADES[config.grade])throw Error("INVALID_GRADE");
    const count=Number(config.count),chapters=Number(config.chapters),words=Number(config.words);
    if(!Number.isInteger(count)||count<1||count>12)throw Error("INVALID_COUNT");
    if(!Number.isInteger(chapters)||chapters<1||chapters>30)throw Error("INVALID_CHAPTERS");
    if(!Number.isInteger(words)||words<10||words>250)throw Error("INVALID_WORDS");
    if(!valid(config.title,60)||!valid(config.genre,40))throw Error("MISSING_TITLE_OR_GENRE");
    if(config.outline!=null&&(typeof config.outline!=="string"||config.outline.length>400))throw Error("INVALID_OUTLINE");
    const created=[];
    for(let i=0;i<count;i++){
      const id="demo-task-"+String(++serial).padStart(3,"0");
      const title=count===1?config.title.trim():config.title.trim()+" · "+(i+1);
      const item={id,title,grade:config.grade,genre:config.genre.trim(),chapters,
        targetWords:words,outline:(config.outline||"").trim(),done:0,
        status:"planned",revision:1,reviewed:false,warning:"",testOnly:true};
      books.set(id,item);note(item,"建立演示任务");created.push(clone(item));
    }
    return created;
  }
  function start(id){
    const item=ensure(id);
    if(!["planned","paused","failed"].includes(item.status))throw Error("INVALID_TRANSITION");
    item.status="running";item.warning="";item.revision++;note(item,"模拟生产已开始");return clone(item);
  }
  function pause(id){
    const item=ensure(id);if(item.status!=="running")throw Error("INVALID_TRANSITION");
    item.status="paused";item.revision++;note(item,"暂停任务");return clone(item);
  }
  function fail(id){
    const item=ensure(id);if(item.status!=="running")throw Error("INVALID_TRANSITION");
    item.status="failed";item.warning="模拟失败：可恢复，不会丢失已完成章数";
    item.revision++;note(item,"模拟一次故障");return clone(item);
  }
  function completeOne(id){
    const item=ensure(id);if(item.status!=="running"||item.done>=item.chapters)throw Error("INVALID_TRANSITION");
    item.done++;item.revision++;
    if(item.done===item.chapters){item.status="review";note(item,"所有章节模拟完成，等待审核")}
    else note(item,"模拟完成第 "+item.done+" 章");
    return clone(item);
  }
  function review(id,approved){
    const item=ensure(id);if(item.status!=="review"||typeof approved!=="boolean")throw Error("INVALID_TRANSITION");
    if(approved){item.status="ready";item.reviewed=true;note(item,"演示审核通过")}
    else{item.status="paused";item.reviewed=false;item.warning="审核未通过：需修订后重新审核";
      item.done=Math.max(0,item.done-1);note(item,"演示驳回，回退最后一章");}
    item.revision++;return clone(item);
  }
  function exportPreview(id){
    const item=ensure(id);
    if(item.status!=="ready"||item.done!==item.chapters||!item.reviewed)throw Error("NOT_REVIEWED");
    // This is NOT an importable novel and contains no actual chapter/word content.
    return {kind:"wordletter-public-synthetic-workbench-preview",previewOnly:true,
      notForPublication:true,id:item.id,grade:item.grade,title:item.title,
      completedChapters:item.done,targetWords:item.targetWords,revision:item.revision,
      message:"仅演示工作台任务状态；不包含正文、词卡或可上架内容。"};
  }
  function summary(){
    const list=[...books.values()],chapters=list.reduce((n,b)=>n+b.chapters,0),
      done=list.reduce((n,b)=>n+b.done,0);
    return {books:list.length,chapters,done,pending:chapters-done,
      running:list.filter(b=>b.status==="running").length,
      review:list.filter(b=>b.status==="review").length,
      ready:list.filter(b=>b.status==="ready").length};
  }
  return {
    addBatch,start,pause,fail,completeOne,review,exportPreview,summary,
    get:id=>clone(ensure(id)),list:()=>freezeSnapshot([...books.values()]),
    history:()=>freezeSnapshot(events)
  };
}
