import {createWorkbench,GRADES,STATES} from "./story-workbench-model.mjs";
// Interactive W1 showcase. Buttons simulate state transitions only.
// No fetch, localStorage, model, D1, Worker, private novel or upload.
const engine=createWorkbench();
const $=id=>document.getElementById(id);
const list=$("taskList"),detail=$("taskDetail"),history=$("historyList"),notice=$("toast");
let selected=null;
let toastHandle;
const node=(tag,cls,content)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=String(content);return el;};
function notify(message){
  notice.textContent=message;notice.classList.add("visible");
  clearTimeout(toastHandle);toastHandle=setTimeout(()=>notice.classList.remove("visible"),3200);
}
function button(label,action,id,cls=""){
  const el=node("button","small "+cls,label);el.type="button";el.dataset.action=action;
  if(id)el.dataset.id=id;return el;
}
function act(id,action){
  try{
    if(action==="select")selected=id;
    else if(action==="start")engine.start(id);
    else if(action==="pause")engine.pause(id);
    else if(action==="complete")engine.completeOne(id);
    else if(action==="fail")engine.fail(id);
    else if(action==="accept")engine.review(id,true);
    else if(action==="reject")engine.review(id,false);
    else if(action==="export"){
      const data=engine.exportPreview(id);
      const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob);
      const link=document.createElement("a");link.href=url;link.download=id+"-synthetic-preview.json";
      link.style.display="none";document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);
      notify("已导出演示状态 JSON（非正式出版文件）");
    }
    if(action!=="select"&&action!=="export")selected=id;
    render();
  }catch(error){
    notify("操作未完成："+({INVALID_TRANSITION:"当前状态不允许该操作",NOT_REVIEWED:"尚未审核通过",TASK_NOT_FOUND:"未找到任务"}[error.message]||error.message));
  }
}
function showStats(){
  const s=engine.summary();
  $("statBooks").textContent=s.books;
  $("statChapters").replaceChildren(document.createTextNode(String(s.done)),node("small",""," / "+s.chapters));
  $("statRunning").textContent=s.running;
  $("statReview").textContent=s.review;
}
function makeTask(item){
  const art=node("article","task"+(selected===item.id?" selected":""));
  const head=node("div","task-head");
  const title=button(item.title,"select",item.id);
  title.className="task-title";title.setAttribute("aria-label","查看任务 "+item.title);
  const status=node("span","status "+item.status,STATES[item.status]);
  head.append(title,status);art.append(head);
  art.append(node("p","task-meta",GRADES[item.grade]+" · "+item.genre+" · "+item.targetWords+" 个候选词目"));
  const progress=node("div","progress-line");
  progress.append(node("span","",item.done+" / "+item.chapters+" 章"),node("span","",Math.floor(item.done/item.chapters*100)+"%"));
  art.append(progress);
  const bar=node("div","bar");bar.setAttribute("role","progressbar");bar.setAttribute("aria-label",item.title+" 章节进度");
  bar.setAttribute("aria-valuemin","0");bar.setAttribute("aria-valuemax",String(item.chapters));
  bar.setAttribute("aria-valuenow",String(item.done));
  const fill=node("span","");fill.style.width=item.done/item.chapters*100+"%";bar.append(fill);art.append(bar);
  const actions=node("div","task-actions");
  if(["planned","paused","failed"].includes(item.status))actions.append(button(item.status==="planned"?"开始模拟":"恢复模拟","start",item.id,"strong"));
  if(item.status==="running"){
    actions.append(button("＋ 模拟完成一章","complete",item.id,"strong"));
    actions.append(button("暂停","pause",item.id));
    actions.append(button("模拟失败","fail",item.id,"danger"));
  }
  if(item.status==="review")actions.append(button("进入审核","select",item.id,"strong"));
  if(item.status==="ready")actions.append(button("导出演示 JSON","export",item.id,"strong"));
  art.append(actions);return art;
}
function showTasks(){
  const filter=$("statusFilter").value;
  const items=engine.list().filter(item=>filter==="all"||filter===item.status);
  list.replaceChildren(...items.map(makeTask));
  $("emptyTasks").hidden=items.length!==0;
}
function showDetail(){
  detail.replaceChildren();
  if(!selected){detail.append(node("p","placeholder","请先在生产队列中选择任务。"));return}
  const item=engine.get(selected);
  const grid=node("dl","detail-grid");
  const data=[["内部编号",item.id],["英语等级",GRADES[item.grade]],["章节进度",item.done+" / "+item.chapters],
    ["词目目标",item.targetWords],["模拟版本",item.revision],["审核状态",item.reviewed?"演示已通过":"未审核"]];
  for(const [label,value] of data){const cell=node("div");cell.append(node("dt","",label),node("dd","",value));grid.append(cell)}
  detail.append(node("h3","",item.title),grid);
  if(item.warning)detail.append(node("p","detail-note",item.warning));
  if(item.outline)detail.append(node("p","detail-note","演示说明："+item.outline));
  const actions=node("div","detail-actions");
  if(item.status==="review"){
    actions.append(button("审核通过（演示）","accept",item.id,"strong"));
    actions.append(button("退回最后一章（演示）","reject",item.id));
  }else if(item.status==="ready"){
    actions.append(button("导出审核状态 JSON","export",item.id,"strong"));
  }else actions.append(node("p","hint","完成全部章节后，系统将显示模拟审核按钮。"));
  detail.append(actions);
  detail.append(node("p","detail-note","W1 是界面和任务状态模拟：不含实际正文、词卡审核、AI 调用或出版权限。"));
}
function showHistory(){
  const rows=engine.history().slice(0,12);
  history.replaceChildren(...rows.map(item=>{
    const li=node("li");li.append(node("b","",item.title),document.createTextNode(" · "+item.verb));return li;
  }));
}
function render(){showStats();showTasks();showDetail();showHistory()}
$("taskForm").addEventListener("submit",event=>{
  event.preventDefault();
  const form=event.currentTarget;
  if(!form.reportValidity())return;
  const data=Object.fromEntries(new FormData(form));
  try{
    const created=engine.addBatch(data);
    selected=created[0].id;
    $("statusFilter").value="all";
    notify("已建立 "+created.length+" 条合成演示任务，不会触发 AI 创作");
    render();
    $("tasks").scrollIntoView({behavior:"smooth",block:"start"});
  }catch(error){notify("创建失败："+error.message)}
});
$("statusFilter").addEventListener("change",showTasks);
document.addEventListener("click",event=>{
  const target=event.target.closest?.("button[data-action]");
  if(!target)return;
  act(target.dataset.id,target.dataset.action);
});
// Entirely invented fixture for the UI; not taken from the customer's nine books.
engine.addBatch({title:"星河邮局来信",grade:"cet4",genre:"温馨奇遇",chapters:5,words:40,count:1});
engine.addBatch({title:"纸船的回声",grade:"cet6",genre:"轻悬疑",chapters:6,words:45,count:1});
render();
