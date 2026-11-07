// PUBLIC-11-05: read-only word-card view from the private app.js display contract.
// No glossary fetch, sentence generation, identity dedup, mastery persistence or TTS.
(function (root) {
  "use strict";
  function create({document:doc=root.document, onSpeak, onBookmark, onMastery,
    onNavigate, onClose}={}) {
    if(!doc || typeof doc.createElement!=="function")throw Error("WORDCARD_DOCUMENT_REQUIRED");
    const tray=doc.getElementById("wordPop"), backdrop=doc.getElementById("wordBackdrop");
    if(!tray||!backdrop)throw Error("WORDCARD_HOST_REQUIRED");
    const newNode=(tag,cls,content)=>{
      const el=doc.createElement(tag);
      if(cls)el.className=cls;
      if(content!==undefined)el.textContent=String(content);
      return el;
    };
    const button=(id,label,fn,disabled=false,ariaLabel)=>{
      const el=newNode("button","",label);
      el.id=id;el.type="button";el.disabled=disabled;
      if(ariaLabel)el.setAttribute("aria-label",ariaLabel);
      if(typeof fn==="function")el.addEventListener("click",()=>{if(!el.disabled)fn();});
      return el;
    };
    let activeId=null, lastAnchor=null;
    const getState=()=>Object.freeze({open:tray.classList.contains("on"),wordId:activeId});
    function clearHighlights(){
      for(const el of doc.querySelectorAll?.("[data-cloud-word]")||[]) {
        el.classList?.remove("study-word-active");
      }
    }
    function hide({restoreFocus=false}={}){
      const anchor=lastAnchor;
      activeId=null;lastAnchor=null;
      tray.classList.remove("on");
      backdrop.classList.remove("on");
      doc.documentElement?.classList?.remove("study-tray-open");
      clearHighlights();
      if(restoreFocus && anchor?.isConnected && typeof anchor.focus==="function")anchor.focus();
      if(typeof onClose==="function")onClose();
      return getState();
    }
    function show({wordId,word,position=1,total=1,loading=false,missing=false,
      bookmarked=false,mastered=false,anchor=null}={}){
      if(typeof wordId!=="string"||!wordId.trim())throw Error("WORDCARD_ID_REQUIRED");
      if(word!==undefined && (word===null||typeof word!=="object"||Array.isArray(word))) {
        throw Error("WORDCARD_DATA_INVALID");
      }
      const data=word||{};
      const title=typeof data.headword==="string"&&data.headword.trim() ?
        data.headword:"单词学习";
      const validIndex=Number.isSafeInteger(position)&&position>=1?position:1;
      const validTotal=Number.isSafeInteger(total)&&total>=1?total:1;
      const idx=Math.min(validIndex,validTotal);
      const busy=Boolean(loading),absent=Boolean(missing);
      const controlsDisabled=busy||absent;
      activeId=wordId;
      lastAnchor=anchor?.isConnected?anchor:null;
      const block=newNode("div","study-card-view");
      const close=button("wordClose","×",()=>hide({restoreFocus:true}),false,"收起词卡");
      close.className="modal-close";
      block.append(close);
      const nav=newNode("div","study-navigation");
      nav.append(newNode("span","eyebrow","MIAOWU · LEARN A WORD"),
        newNode("span","study-position",idx+" / "+validTotal));
      block.append(nav,newNode("h3","",title));
      const pron=newNode("div","pron v11-word-pron");
      pron.append(newNode("span","v11-pron-ipa",
        typeof data.phonetic_us==="string"?data.phonetic_us:
        typeof data.phonetic_uk==="string"?data.phonetic_uk:""),
        button("wordSmallSpeak","♫",()=>onSpeak?.(title,"word"),false,"播放单词发音"),
        newNode("span","v11-pron-part",typeof data.part_of_speech==="string"?data.part_of_speech:""));
      pron.children[1].className="word-voice-inline";
      block.append(pron);
      block.append(newNode("div","meaning",typeof data.meaning_zh==="string"&&data.meaning_zh.trim()?
        data.meaning_zh:busy?"词义加载中…":"暂无释义"));
      if(busy||absent){
        const note=newNode("p","study-loading",busy?"正在读取这张词卡的学习资料…":
          "暂无这张词卡的完整资料，请换一个单词学习。");
        note.setAttribute("role","status");block.append(note);
      }else{
        if(typeof data.example_en==="string"&&data.example_en.trim()){
          const example=newNode("div","word-extra");
          const heading=newNode("div","v11-example-heading");
          heading.append(newNode("strong","","例句"),
            button("wordExampleSpeak","♫ 朗读例句",()=>onSpeak?.(data.example_en,"example"),
              false,"朗读完整例句"));
          example.append(heading,newNode("p","",data.example_en));
          if(typeof data.example_zh==="string"&&data.example_zh.trim()){
            example.append(newNode("span","study-translation",data.example_zh));
          }
          block.append(example);
        }
        const pairs=Array.isArray(data.collocations)?data.collocations.filter(
          x=>x&&typeof x.en==="string"&&x.en.trim()&&
          typeof x.zh==="string"&&x.zh.trim()).slice(0,3):[];
        if(pairs.length){
          const colloc=newNode("div","word-extra");
          colloc.append(newNode("strong","","常用搭配"));
          for(const pair of pairs)colloc.append(newNode("p","study-collocation",pair.en+" · "+pair.zh));
          block.append(colloc);
        }
      }
      const switcher=newNode("div","study-switch");
      switcher.append(button("studyPrevious","← 上一个词",()=>onNavigate?.(idx-1),idx<=1),
        button("studyNext","下一个词 →",()=>onNavigate?.(idx+1),idx>=validTotal));
      block.append(switcher);
      const actions=newNode("div","word-actions");
      actions.append(
        button("wordSpeak","♫ 听发音",()=>onSpeak?.(title,"word")),
        button("wordSave",bookmarked?"✓ 已加入 · 移出生词本":"♡ 添加生词本",
          ()=>onBookmark?.(wordId,!bookmarked),controlsDisabled),
        button("cloudMaster",mastered?"↻ 继续学习":"✓ 标记已掌握",
          ()=>onMastery?.(wordId,!mastered),controlsDisabled)
      );
      block.append(actions);
      tray.replaceChildren(block);
      tray.setAttribute("role","dialog");
      tray.setAttribute("aria-modal","false"); // Non-blocking: user can select another word.
      tray.setAttribute("aria-label","单词学习面板");
      tray.classList.add("on");
      backdrop.classList.remove("on"); // Never obscure the reading page on mobile.
      doc.documentElement?.classList?.add("study-tray-open");
      clearHighlights();
      for(const wordEl of doc.querySelectorAll?.("[data-cloud-word]")||[]){
        if(wordEl.getAttribute?.("data-cloud-word")===wordId)
          wordEl.classList?.add("study-word-active");
      }
      return getState();
    }
    // Explicit API only. Loading another card replaces old handlers and content.
    return Object.freeze({show,hide,getState});
  }
  root.MiaowuWordCardView=Object.freeze({create});
})(window);
