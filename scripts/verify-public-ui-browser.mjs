// Public synthetic UI only. Actual private account/reading workflows are not loaded.
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const out = join(root, "ui-qa-screenshots");
const url = "http://127.0.0.1:4173/showcase/responsive-contract.html";
const widths = [320, 375, 390, 430, 768, 1024, 1440];

function luminance(rgb) {
  const channels = (rgb.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
  if (channels.length !== 3) throw Error("Unexpected computed color: " + rgb);
  const linear = channels.map(x => {
    const n = x / 255;
    return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  });
  return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
}
function contrast(fg, bg) {
  const [a,b] = [luminance(fg), luminance(bg)].sort((x,y) => y - x);
  return (a + .05) / (b + .05);
}
async function waitForServer() {
  for (let n=0; n<60; n++) {
    try { const response = await fetch(url); if(response.ok) return; } catch {}
    await new Promise(r=>setTimeout(r,250));
  }
  throw Error("Local synthetic UI server was not ready");
}

const server = spawn(process.execPath, ["scripts/serve.mjs"], {
  cwd: root, env: { ...process.env, PORT:"4173" }, stdio:["ignore","pipe","pipe"]
});
server.stderr.on("data", chunk => process.stderr.write(chunk));
let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  mkdirSync(out, { recursive:true });
  for (const width of widths) {
    const page = await browser.newPage({viewport:{width,height:960},deviceScaleFactor:1});
    const errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.route("**/*",route=>{
      if(route.request().url().startsWith("http://127.0.0.1:4173/")) route.continue();
      else route.abort();
    });
    const response=await page.goto(url,{waitUntil:"networkidle"});
    assert.equal(response.status(),200,"local fixture failed "+width);
    const layout=await page.evaluate(()=>{
      const grid=document.querySelector(".home-shelf-layout .book-grid");
      const cols=getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length;
      return {width:innerWidth,docWidth:document.documentElement.scrollWidth,cols};
    });
    assert.ok(layout.docWidth<=width+1,"Horizontal overflow at "+width+": "+JSON.stringify(layout));
    assert.equal(layout.cols,width<=600?1:width<=820?2:3,"Unexpected shelf columns at "+width);
    if(width<=430){
      for(const selector of [
        "#view-library .home-shelf-layout .cloud-book-item .book-actions button",
        "#view-words .vocab-card .card-tools button",
        "#wordPop .v11-example-heading button"
      ]){
        const heights=await page.locator(selector).evaluateAll(elements=>elements.map(e=>Math.round(e.getBoundingClientRect().height)));
        assert.ok(heights.length>0,"Missing phone button "+selector);
        for(const height of heights)assert.ok(height>=44,"Touch target too small "+width+" "+selector+" "+height);
      }
    }
    await page.locator("#contractFont").evaluate(element=>{
      element.value="24";element.dispatchEvent(new Event("input",{bubbles:true}));
    });
    assert.equal(await page.locator("#contractFontValue").textContent(),"24px");
    assert.equal(await page.locator("#contractReaderText").evaluate(element=>getComputedStyle(element).fontSize),"24px");
    await page.locator("#contractFont").evaluate(element=>{
      element.value="12";element.dispatchEvent(new Event("input",{bubbles:true}));
    });
    assert.equal(await page.locator("#contractReaderText").evaluate(element=>getComputedStyle(element).fontSize),"12px");
    if([320,390,1440].includes(width)){
      await page.screenshot({path:join(out,width+"-day.png"),fullPage:true});
    }
    await page.locator("#contractTheme").click();
    assert.equal(await page.locator("html").getAttribute("data-theme"),"dark");
    const night=await page.locator("#view-reader .contract-reader-paper").evaluate(element=>{
      const c=getComputedStyle(element);
      return { foreground:c.color,background:c.backgroundColor };
    });
    assert.ok(contrast(night.foreground,night.background)>=4.5,
      "Insufficient night contrast "+width+" "+JSON.stringify(night));
    assert.deepEqual(errors,[],"Browser runtime errors at "+width);
    if([390,1440].includes(width)){
      await page.screenshot({path:join(out,width+"-night.png"),fullPage:true});
    }
    console.log("PUBLIC_BROWSER_OK",width,layout.cols,"columns; no overflow; 12-24px; dark contrast");
    await page.close();
  }
  // PUBLIC-11: exercise the extracted DOM controls at common mobile and desktop sizes.
  for (const width of [320, 390, 1440]) {
    const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
    const pageErrors=[];
    page.on("pageerror",e=>pageErrors.push(e.message));
    await page.route("**/*",route=>{
      if(route.request().url().startsWith("http://127.0.0.1:4173/"))route.continue();
      else route.abort();
    });
    const uri="http://127.0.0.1:4173/showcase/reader-controls-contract.html";
    const response=await page.goto(uri,{waitUntil:"networkidle"});
    assert.equal(response.status(),200);
    assert.ok(await page.locator("#readerFontSlider").isVisible());
    assert.equal(await page.locator("#readerFontValue").textContent(),"18px");
    await page.locator("#biggerFont").click();
    assert.equal(await page.locator("#readerFontValue").textContent(),"19px");
    await page.locator("#readerFontSlider").evaluate(el=>{
      el.value="24";el.dispatchEvent(new Event("input",{bubbles:true}));
    });
    assert.equal(await page.locator("#storyText").evaluate(el=>getComputedStyle(el).fontSize),"24px");
    assert.equal(await page.locator("#biggerFont").isDisabled(),true);
    await page.locator("#globalThemeToggle").click();
    assert.equal(await page.locator("html").getAttribute("data-theme"),"dark");
    assert.equal(await page.locator("#toggleNight").getAttribute("aria-pressed"),"true");
    const layout=await page.evaluate(()=>document.documentElement.scrollWidth);
    assert.ok(layout<=width+1,"PUBLIC-11 horizontal overflow "+width+" -> "+layout);
    if(width===390)await page.screenshot({path:join(out,"reader-controls-390-night.png"),fullPage:true});
    assert.deepEqual(pageErrors,[]);
    console.log("PUBLIC_READER_CONTROLS_OK",width,"px");
    await page.close();
  }
  // PUBLIC-11-02: run independent pure shelf pagination interactions.
  for(const width of [320,390,1440]){
    const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
    const errors=[];page.on("pageerror",e=>errors.push(e.message));
    await page.route("**/*",route=>{
      if(route.request().url().startsWith("http://127.0.0.1:4173/"))route.continue();
      else route.abort();
    });
    const response=await page.goto("http://127.0.0.1:4173/showcase/shelf-pagination-contract.html",{waitUntil:"networkidle"});
    assert.equal(response.status(),200);
    assert.equal(await page.locator("#syntheticPage").textContent(),"当前第 1 页");
    assert.equal(await page.locator(".shelf-pagination").getAttribute("aria-label"),"小说书架分页");
    await page.getByRole("button",{name:"下一页小说"}).click();
    assert.equal(await page.locator("#syntheticPage").textContent(),"当前第 2 页");
    assert.equal(await page.locator(".shelf-page-button[aria-current='page']").textContent(),"2");
    const w=await page.evaluate(()=>document.documentElement.scrollWidth);
    assert.ok(w<=width+1,"PUBLIC-11-02 horizontal overflow "+width+" -> "+w);
    if(width===390)await page.screenshot({path:join(out,"shelf-pagination-390.png"),fullPage:true});
    assert.deepEqual(errors,[],"Public shelf page runtime errors at "+width);
    await page.close();
  }
  // PUBLIC-11-03: real Chromium smoke test of safe DOM-based shelf cards.
  for(const width of [320,390,1440]){
    const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
    const errors=[];page.on("pageerror",e=>errors.push(e.message));
    await page.route("**/*",route=>{
      if(route.request().url().startsWith("http://127.0.0.1:4173/"))route.continue();
      else route.abort();
    });
    const res=await page.goto("http://127.0.0.1:4173/showcase/shelf-card-contract.html",{waitUntil:"networkidle"});
    assert.equal(res.status(),200);
    assert.equal(await page.locator(".cloud-book-item").count(),3);
    assert.equal(await page.locator(".cloud-book-item .cover-custom-tag").count(),4);
    assert.equal(await page.locator(".cloud-book-item").nth(2).locator(".book-tag").textContent(),"会员专享");
    await page.locator(".cloud-book-item").first().locator(".book-actions .primary").click();
    assert.match(await page.locator("#syntheticCardStatus").textContent(),/月光邮局/);
    await page.locator(".cloud-book-item").nth(1).locator(".cloud-bookmark-button").click();
    assert.match(await page.locator("#syntheticCardStatus").textContent(),/雾港来信/);
    assert.equal(await page.locator(".cloud-book-item").nth(1).locator(".cloud-bookmark-button").getAttribute("aria-pressed"),"true");
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth);
    assert.ok(overflow<=width+1,"PUBLIC-11-03 horizontal overflow "+width+" -> "+overflow);
    if(width===390)await page.screenshot({path:join(out,"shelf-card-390.png"),fullPage:true});
    assert.deepEqual(errors,[],"Shelf card browser errors at "+width);
    console.log("PUBLIC_SHELF_CARD_OK",width,"px");
    await page.close();
  }
  // PUBLIC-11-04: synthetic reader toolbar drawers/gloss controls (no private API).
  for(const width of [320,390,1440]){
    const page=await browser.newPage({viewport:{width,height:920},deviceScaleFactor:1});
    const errors=[];page.on("pageerror",e=>errors.push(e.message));
    await page.route("**/*",route=>{
      if(route.request().url().startsWith("http://127.0.0.1:4173/"))route.continue();
      else route.abort();
    });
    const res=await page.goto("http://127.0.0.1:4173/showcase/reader-panels-contract.html",{waitUntil:"networkidle"});
    assert.equal(res.status(),200);
    const chapter=page.locator("#mobileChapterOpen"),vocab=page.locator("#mobileVocabOpen");
    await chapter.click();
    assert.equal(await page.locator("#readerLayout").evaluate(el=>el.classList.contains("chapter-drawer-open")),true);
    assert.equal(await chapter.getAttribute("aria-expanded"),"true");
    if(width<=980) await page.locator("#mobileChapterClose").click();
    else await chapter.click(); // Desktop drawers have no visible mobile close button.
    assert.equal(await chapter.getAttribute("aria-expanded"),"false");
    await vocab.click();
    assert.equal(await vocab.getAttribute("aria-expanded"),"true");
    await page.keyboard.press("Escape");
    assert.equal(await vocab.getAttribute("aria-expanded"),"false");
    await page.locator("#toggleGloss").click();
    assert.equal(await page.locator("#storyText").evaluate(el=>el.classList.contains("no-gloss")),true);
    assert.equal(await page.locator("#sideToggleGloss").getAttribute("aria-pressed"),"true");
    assert.match(await page.locator("#readerPanelsStatus").textContent(),/已隐藏释义/);
    const scrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
    assert.ok(scrollWidth<=width+1,"PUBLIC-11-04 horizontal overflow "+width+": "+scrollWidth);
    if(width===390)await page.screenshot({path:join(out,"reader-panels-390.png"),fullPage:true});
    assert.deepEqual(errors,[],"Public reader toolbar errors at "+width);
    console.log("PUBLIC_READER_PANELS_OK",width,"px");
    await page.close();
  }
  console.log("PUBLIC_BROWSER_MATRIX_OK "+widths.length+" viewports, synthetic-only");
} finally {
  if(browser)await browser.close();
  server.kill("SIGTERM");
}
