import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { codeSwitchPosRisk } from "../src/editorial-code-switch-lint.js";
import { REVIEW_STEPS_DAYS, learningDayKey, scheduleFirstActiveLearning,
  scheduleRecallFeedback, dueToday } from "../src/spaced-review.js";
import { parseNovelTextFile, suggestStoryTags } from "../public/novel-file-parser.js";
import { APPROVED_PATHS } from "../scripts/audit-public.mjs";

// Fictional fixtures ONLY; no reference-vocab, unpublished manuscript, D1 or customers.
const cards=[
  {id:"word-glimmer",headword:"glimmer",meaningZh:"微光",phoneticUk:"/ˈɡlɪmə/",
   phoneticUs:"/ˈɡlɪmər/",partOfSpeech:"n.",exampleEn:"A glimmer crossed the water.",
   exampleZh:"水面闪过一丝微光。"},
  {id:"word-map",headword:"map",meaningZh:"地图",phoneticUk:"/mæp/",
   phoneticUs:"/mæp/",partOfSpeech:"n.",exampleEn:"The map was under the lantern.",
   exampleZh:"地图放在灯笼下面。"},
  {id:"word-bridge",headword:"bridge",meaningZh:"桥",phoneticUk:"/brɪdʒ/",
   phoneticUs:"/brɪdʒ/",partOfSpeech:"n.",exampleEn:"The bridge crossed the stream.",
   exampleZh:"这座桥跨过小溪。"}
];
const opts={bookId:"synthetic-harbor",title:"虚构港口短篇",description:"虚构场景，仅供自动化测试",
  category:"cet4",previewChapters:0,words:cards};
const story=[
  "## 第一章 纸船",
  "她看见 glimmer 和 map，又经过 bridge。",
  "",
  "## 第二章 灯塔",
  "在 bridge 下，她找到 [[map|地图]] 和 glimmer。"
].join("\n");

test("three reviewed pure engines are audited, byte-identical to frozen private source snapshot",()=>{
  const expected={
    "public/novel-file-parser.js":"ad3fa8f20bcd67448b62c495d6af68a5c87b9e17",
    "src/editorial-code-switch-lint.js":"82dee63309f23a01aef739df33235d994ad3ef7d",
    "src/spaced-review.js":"f05dab3a98c145cf7e99c0d8f0af5b173ff0502c"
  };
  for(const [path,sha] of Object.entries(expected)){
    assert.ok(APPROVED_PATHS.has(path),path);
    const data=readFileSync(new URL("../"+path,import.meta.url));
    const digest=createHash("sha1").update("blob "+data.length+"\0").update(data).digest("hex");
    assert.equal(digest,sha,path+" differs from source snapshot (review before updating)");
    const content=data.toString("utf8");
    assert.doesNotMatch(content,/fetch\s*\(|XMLHttpRequest|document\.cookie|\/api\/|DB\.prepare|CLOUDFLARE_API_TOKEN/i);
    assert.doesNotMatch(content,/from\s+["']\.\.\/content\/|from\s+["']\.\.\/db\//);
  }
});

test("public parser converts two fictional Markdown chapters into paid-only typed segments",()=>{
  const {package:bundle,report}=parseNovelTextFile(story,opts);
  assert.equal(bundle.version,1);
  assert.equal(bundle.book.id,"synthetic-harbor");
  assert.equal(report.chapters,2);
  assert.equal(report.wordCards,3);
  assert.equal(report.anchors,6);
  assert.equal(report.allWordCardsComplete,true);
  assert.ok(bundle.chapters.every(ch=>ch.preview===false));
  assert.ok(bundle.chapters.some(ch=>ch.paragraphs.some(
    paragraph=>paragraph.segments.some(seg=>seg.wordId==="word-map"))));
});
test("unresolved explicit teaching words fail without inventing a vocabulary card",()=>{
  assert.throws(
    ()=>parseNovelTextFile("## 第一章\n她看见 [[unknown|未知]] 和 glimmer。",opts),
    e=>e.message==="EXPLICIT_WORD_CARD_UNRESOLVED" &&
       e.details?.[0]?.reason==="NO_MATCHING_WORD_CARD");
});
test("parser never grants access or marks all chapters preview",()=>{
  assert.throws(
    ()=>parseNovelTextFile("## 第一章\n她看见 glimmer。",{...opts,previewChapters:1}),
    /REQUIRES_AT_LEAST_ONE_PAID_CHAPTER/);
  assert.throws(
    ()=>parseNovelTextFile("## 第一章\n没有目标词。",{...opts,words:[]}),
    /NO_LEARNING_VOCABULARY_MATCHED/);
});
test("suggested story tags require strong fictional title/synopsis signals, not body alone",()=>{
  const tags=suggestStoryTags({title:"一桩失踪案",description:"悬疑调查故事",
    body:"他们只是合租在一起。"});
  assert.ok(tags.some(x=>x.label==="悬疑"));
  assert.ok(!tags.some(x=>x.label==="合租日常"));
  assert.ok(tags.every(x=>/^#[0-9a-f]{6}$/i.test(x.color)));
});
test("code-switch risk flags are review hints and never silently rewrite prose",()=>{
  assert.deepEqual(codeSwitchPosRisk({partOfSpeech:"v.",before:"每一次 ",after:" 物资的记录"}),[
    "CODE_SWITCH_VERB_AFTER_NOMINAL_CLASSIFIER"]);
  assert.deepEqual(codeSwitchPosRisk({partOfSpeech:"adj.",before:"一条 ",after:" 的记录"}),[
    "CODE_SWITCH_ADJECTIVE_LINKER_REVIEW"]);
  assert.deepEqual(codeSwitchPosRisk({partOfSpeech:"n.",before:"重要的 ",after:" 记录"}),[]);
});
test("spaced repetition uses reviewed 1/3/7/14/30 days and fixed China learning day",()=>{
  assert.deepEqual(REVIEW_STEPS_DAYS,[1,3,7,14,30]);
  assert.equal(learningDayKey("2026-11-08T15:59:59Z"),"2026-11-08");
  assert.equal(learningDayKey("2026-11-08T16:00:00Z"),"2026-11-09");
  const start=new Date("2026-11-08T06:00:00Z");
  const first=scheduleFirstActiveLearning({},start);
  assert.equal(first.dueAt,"2026-11-09T06:00:00.000Z");
  assert.equal(dueToday(first,start),false);
  const after=scheduleRecallFeedback(first,"correct",new Date(first.dueAt));
  assert.equal(after.stageIndex,1);
  assert.equal(after.dueAt,"2026-11-12T06:00:00.000Z");
});
test("same-day double success cannot postpone a sense; incorrect cannot unmaster it",()=>{
  const t=new Date("2026-11-09T07:00:00Z");
  const due={stageIndex:1,dueAt:"2026-11-09T05:00:00Z",mastered:false};
  const a=scheduleRecallFeedback(due,"correct",t);
  const b=scheduleRecallFeedback(a,"correct",new Date("2026-11-09T09:00:00Z"));
  assert.equal(b.dueAt,a.dueAt);
  const finished=scheduleRecallFeedback({mastered:true,stageIndex:4,dueAt:null},
    "incorrect",t);
  assert.equal(finished.mastered,true);
  assert.equal(finished.dueAt,null);
});
