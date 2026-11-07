import test from "node:test";
import assert from "node:assert/strict";
import {inspectAnnotationContract} from "../scripts/annotation-contract.mjs";
const fixture=()=>({words:[{id:"demo-word",headword:"hello"}],chapters:[{
  id:"demo-chapter",number:1,paragraphs:[{segments:[
    {text:"虚构例句："}, {wordId:"demo-word",surface:"hello",gloss:"你好"}, {text:"。"}
  ]}]
}]});
test("valid synthetic annotation references",()=>{
  const r=inspectAnnotationContract(fixture());assert.equal(r.ok,true);
  assert.equal(r.mentions,1);assert.deepEqual(r.usedWordIds,["demo-word"]);
});
test("unknown word reference includes exact location",()=>{
  const x=fixture();x.chapters[0].paragraphs[0].segments[1].wordId="unknown";
  assert.deepEqual(inspectAnnotationContract(x).issues.find(y=>y.code==="UNKNOWN_WORD_ID"),{
    code:"UNKNOWN_WORD_ID",location:"chapters[0].paragraphs[0].segments[1]"
  });
});
test("whitespace text is rejected, not silently removed",()=>{
  const x=fixture();x.chapters[0].paragraphs[0].segments[0].text="  ";
  assert.ok(inspectAnnotationContract(x).issues.some(y=>y.code==="EMPTY_TEXT"));
});
test("duplicate identities and chapter numbering are blocked",()=>{
  const x=fixture();x.words.push({...x.words[0]});
  x.chapters.push({...x.chapters[0],id:"second-chapter"});
  const codes=inspectAnnotationContract(x).issues.map(y=>y.code);
  assert.ok(codes.includes("DUPLICATE_WORD_ID"));assert.ok(codes.includes("INVALID_CHAPTER_NUMBER"));
});
test("mixed text/reference and empty gloss are blocked",()=>{
  const x=fixture();const s=x.chapters[0].paragraphs[0].segments[1];s.text="extra";s.gloss=" ";
  const codes=inspectAnnotationContract(x).issues.map(y=>y.code);
  assert.ok(codes.includes("MIXED_SEGMENT"));assert.ok(codes.includes("EMPTY_GLOSS"));
});
test("malformed package fails closed",()=>{
  assert.equal(inspectAnnotationContract(null).ok,false);
  assert.equal(inspectAnnotationContract({chapters:[]}).ok,false);
});
