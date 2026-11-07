// W1 public browser smoke test. All content is synthetic and in-memory.
import {spawn} from "node:child_process";
import {readFileSync,mkdirSync} from "node:fs";
import {join,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";
import {chromium} from "playwright";

const root=resolve(fileURLToPath(new URL("../",import.meta.url)));
const port=4176,url="http://127.0.0.1:"+port+"/showcase/story-workbench.html";
const server=spawn(process.execPath,["scripts/serve.mjs"],{
  cwd:root,env:{...process.env,PORT:String(port)},stdio:["ignore","pipe","pipe"]
});
server.stderr.on("data",d=>process.stderr.write(d));
const output=join(root,"ui-qa-screenshots");
async function ready(){
  for(let i=0;i<60;i++){
    try{const r=await fetch(url);if(r.ok)return}catch{}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  throw Error("W1 local server did not start");
}
let browser;
try{
  await ready();browser=await chromium.launch({headless:true});
  mkdirSync(output,{recursive:true});
  for(const width of [320,390,1440]){
    const page=await browser.newPage({viewport:{width,height:930},acceptDownloads:true});
    const errors=[];page.on("pageerror",e=>errors.push(e.message));
    await page.route("**/*",route=>{
      if(route.request().url().startsWith("http://127.0.0.1:"+port+"/"))route.continue();
      else route.abort();
    });
    const response=await page.goto(url,{waitUntil:"networkidle"});
    assert.equal(response.status(),200);
    assert.equal(await page.locator("#taskList .task").count(),2);
    await page.locator("#taskTitle").fill("虚构任务");
    await page.locator("#taskCount").fill("1");
    await page.locator("#taskChapters").fill("2");
    await page.locator("#taskWords").fill("40");
    await page.locator("#createBatchBtn").click();
    assert.equal(await page.locator("#taskList .task").count(),3);
    assert.equal((await page.locator("#statBooks").textContent()).trim(),"3");
    const q=id=>page.locator('#taskList button[data-action][data-id="'+id+'"]');
    await q("demo-task-003").filter({hasText:"开始模拟"}).click();
    await q("demo-task-003").filter({hasText:"暂停"}).click();
    assert.equal(await q("demo-task-003").filter({hasText:"＋ 模拟完成一章"}).count(),0);
    await q("demo-task-003").filter({hasText:"恢复模拟"}).click();
    await q("demo-task-003").filter({hasText:"模拟失败"}).click();
    await q("demo-task-003").filter({hasText:"恢复模拟"}).click();
    await q("demo-task-003").filter({hasText:"＋ 模拟完成一章"}).click();
    await q("demo-task-003").filter({hasText:"＋ 模拟完成一章"}).click();
    assert.equal(await page.locator("#statReview").textContent(),"1");
    await q("demo-task-003").filter({hasText:"进入审核"}).click();
    await page.locator('#taskDetail button[data-action="accept"]').click();
    const dl=page.waitForEvent("download");
    await q("demo-task-003").filter({hasText:"导出演示 JSON"}).click();
    const download=await dl;
    const file=JSON.parse(readFileSync(await download.path(),"utf8"));
    assert.equal(file.previewOnly,true);
    assert.equal(file.notForPublication,true);
    assert.equal(file.chapters,undefined);
    assert.equal(file.words,undefined);
    assert.equal(file.completedChapters,2);
    const scroll=await page.evaluate(()=>document.documentElement.scrollWidth);
    assert.ok(scroll<=width+1,"W1 horizontal overflow at "+width+": "+scroll);
    if(width===390||width===1440)await page.screenshot({path:join(output,"story-workbench-"+width+".png"),fullPage:true});
    assert.deepEqual(errors,[],"W1 page errors "+width);
    console.log("STORY_WORKBENCH_BROWSER_OK",width,"create/pause/fail/resume/review/export; no overflow");
    await page.close();
  }
}finally{
  if(browser)await browser.close();
  server.kill();
}
