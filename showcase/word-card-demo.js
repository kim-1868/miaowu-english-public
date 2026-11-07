// PUBLIC-11-05 uses three fictional fixture cards and no real APIs.
(() => {
  "use strict";
  const status=document.getElementById("syntheticWordStatus");
  const words=[
    {id:"synthetic-word-1",headword:"glimmer",phonetic_us:"/ˈɡlɪmər/",part_of_speech:"n.",
      meaning_zh:"微光",example_en:"A glimmer appeared beyond the hill.",
      example_zh:"山那边出现了一丝微光。",collocations:[{en:"a glimmer of light",zh:"一丝光亮"}]},
    {id:"synthetic-word-2",headword:"explore",phonetic_us:"/ɪkˈsplɔːr/",part_of_speech:"v.",
      meaning_zh:"探索",example_en:"They explore the quiet path.",
      example_zh:"他们探索那条安静的小路。",collocations:[{en:"explore an idea",zh:"探讨一个想法"}]},
    {id:"synthetic-word-3",headword:"lantern",phonetic_us:"/ˈlæntərn/",part_of_speech:"n.",
      meaning_zh:"灯笼",example_en:"The lantern glowed in the window.",
      example_zh:"灯笼在窗边发着光。",collocations:[{en:"paper lantern",zh:"纸灯笼"}]}
  ];
  const view=window.MiaowuWordCardView.create({document,
    onSpeak:(text,kind)=>{status.textContent="模拟"+(kind==="example"?"例句":"单词")+"发音："+text+"（未调用语音或网络）。";},
    onBookmark:(id,next)=>{status.textContent="模拟收藏意图："+id+" → "+next+"；未写入数据库。";},
    onMastery:(id,next)=>{status.textContent="模拟掌握意图："+id+" → "+next+"；未保存。";},
    onNavigate:index=>open(index-1),
    onClose:()=>{status.textContent="已关闭演示词卡。";}
  });
  function open(index){
    const word=words[index];
    if(!word)return;
    const anchor=document.querySelector('[data-cloud-word="'+word.id+'"]');
    view.show({wordId:word.id,word,position:index+1,total:words.length,
      bookmarked:index===1,mastered:index===2,anchor});
    status.textContent="合成词卡："+word.headword+"。";
  }
  document.querySelectorAll("[data-cloud-word]").forEach((button,index)=>{
    button.addEventListener("click",()=>open(index));
  });
})();
