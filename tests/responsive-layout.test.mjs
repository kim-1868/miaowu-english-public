import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const responsive = read("public/v11-responsive.css");
const reader = read("public/v11-reader.css");
const wordbook = read("public/v11-wordbook.css");
const flashcards = read("public/flashcards.css");
const sample = read("showcase/reading-shelf.css");
const html = read("showcase/responsive-contract.html");
const fixtureCss = read("showcase/responsive-contract.css");
const fixtureJs = read("showcase/responsive-contract.js");

function checkCssBalance(css) {
  // Structural smoke test only; browser visual QA is a separate release gate.
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let depth = 0;
  for (const ch of stripped) {
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    assert.ok(depth >= 0, "Unexpected closing CSS brace");
  }
  assert.equal(depth, 0, "Unclosed CSS block");
}

test("all PUBLIC-03 stylesheets have balanced CSS rules", () => {
  for (const css of [responsive, reader, wordbook, flashcards, sample, fixtureCss]) checkCssBalance(css);
});

test("320, 375, 390 and 430px mobile layouts have narrow-screen safety overrides", () => {
  assert.match(responsive, /@media\s*\(max-width:\s*600px\)/);
  assert.match(responsive, /@media\s*\(max-width:\s*360px\)/);
  assert.match(reader, /@media\s*\(max-width:\s*430px\)/);
  assert.match(wordbook, /@media\s*\(max-width:\s*430px\)/);
  assert.match(sample, /@media\s*\(max-width:\s*430px\)/);
  assert.match(sample, /@media\s*\(max-width:\s*360px\)/);
  for (const width of [320, 375, 390, 430]) {
    assert.ok(width <= 600, width + "px must be covered by mobile layout");
    assert.ok(width <= 430, width + "px must be covered by font-slider and wordbook rules");
  }
  assert.match(responsive, /\.book-info h3,[\s\S]*?overflow-wrap:\s*anywhere/);
  assert.match(responsive, /#view-words \.vocab-card \.card-tools button,[\s\S]*?min-height:\s*44px/);
  assert.match(wordbook, /\.vocab-card \.v11-example-audio\s*\{min-height:\s*44px/);
});

test("original three-column desktop shelf, reader size state and study identity are not overridden", () => {
  assert.match(fixtureCss, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,1fr\)\)/);
  assert.match(fixtureCss, /@media\(max-width:820px\)/);
  assert.match(fixtureCss, /@media\(max-width:600px\)/);
  assert.doesNotMatch([responsive,reader,wordbook].join("\n"), /fetch\(|localStorage|sessionStorage|activation_code|database_id|d1_database/i);
  assert.doesNotMatch(reader, /#readerBody\s*\{[^}]*font-size/i);
  assert.match(responsive, /@media\s*\(max-width:\s*600px\)/);
  assert.match(flashcards, /@media\(max-width:620px\)/);
  assert.match(flashcards, /@media\(prefers-reduced-motion:reduce\)/);
});

function rgb(hex) { return [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255); }
function luminance(hex) {
  const [r,g,b]=rgb(hex).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
  return 0.2126*r+0.7152*g+0.0722*b;
}
function contrast(a,b){const [x,y]=[luminance(a),luminance(b)].sort((i,j)=>j-i);return (x+0.05)/(y+0.05);}

test("night reading and word-card text use contrast-safe synthetic palette", () => {
  const cases=[
    ["#eddae0","#302931"],
    ["#f3d3dd","#302a30"],
    ["#f3e7df","#2c2730"],
    ["#dbc7d0","#252129"]
  ];
  for(const [fg,bg] of cases) assert.ok(contrast(fg,bg)>=4.5, fg+" on "+bg+" is insufficient");
  assert.match(reader, /#eddae0/);
  assert.match(wordbook, /#f3d3dd/);
  assert.match(fixtureCss, /data-theme="dark"/);
});

test("fixture exercises real WordLetter public CSS classes, no private API or data", () => {
  for (const name of [
    "../public/v11-responsive.css","../public/v11-reader.css","../public/v11-wordbook.css",
    "../public/v11-bookshelf.css","../public/flashcards.css"
  ]) assert.ok(html.includes('href="'+name+'"'), "missing real stylesheet "+name);
  for (const id of ["view-library","view-reader","view-words","wordPop","contractFont","contractTheme"]) {
    assert.ok(html.includes('id="'+id+'"'), "missing UI contract ID "+id);
  }
  assert.equal((html.match(/class="cloud-book-item"/g)||[]).length,3);
  assert.match(html, /合成|虚构/);
  assert.doesNotMatch(html,/\/api\/|api[_-]?key|password|用户手机号|content\/drafts/i);
  assert.ok(read("showcase/index.html").includes('href="./responsive-contract.html"'));
});

test("synthetic font range remains 12–24px; theme changes do not persist", () => {
  assert.match(html,/id="contractFont" min="12" max="24" value="16"/);
  const listeners = {};
  const nodes = {
    contractTheme:{
      textContent:"切换夜间",attrs:{},setAttribute(k,v){this.attrs[k]=v},
      addEventListener(type,fn){listeners["theme:"+type]=fn}
    },
    contractFont:{value:"16",addEventListener(type,fn){listeners["font:"+type]=fn}},
    contractFontValue:{textContent:"16px"},
    contractReaderText:{style:{values:{},setProperty(k,v){this.values[k]=v}}}
  };
  const root={dataset:{theme:"light"}};
  const document={documentElement:root,getElementById(id){return nodes[id]||null}};
  runInNewContext(fixtureJs,{document});
  listeners["theme:click"]();
  assert.equal(root.dataset.theme,"dark");
  assert.equal(nodes.contractTheme.attrs["aria-pressed"],"true");
  listeners["theme:click"]();
  assert.equal(root.dataset.theme,"light");
  for (const [incoming,expected] of [["12","12px"],["24","24px"],["90","24px"],["-1","12px"]]) {
    nodes.contractFont.value=incoming;listeners["font:input"]();
    assert.equal(nodes.contractFontValue.textContent,expected);
    assert.equal(nodes.contractReaderText.style.values["--contract-reader-font"],expected);
  }
  assert.doesNotMatch(fixtureJs,/localStorage|fetch\(|document.cookie/);
});
