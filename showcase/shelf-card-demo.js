// Synthetic-only UI adapter. No private data, tokens, fetch, or state persistence.
(() => {
  "use strict";
  const grid=document.getElementById("syntheticCardGrid");
  const status=document.getElementById("syntheticCardStatus");
  const view=window.MiaowuShelfCard.create({document});
  const books=[
    {id:"synthetic-book-a",title:"月光邮局",description:"一封迟到的信开启了另一段旅程。",cover_tags:[{label:"治愈",color:"#bc7888"},{label:"短篇",color:"#a89067"}]},
    {id:"synthetic-book-b",title:"雾港来信",description:"在安静的海港寻找被遗忘的线索。",cover_tags:[{label:"悬疑",color:"#657f97"}]},
    {id:"synthetic-book-c",title:"山间灯火",description:"每一条回家的路，都有一盏灯等候。",cover_tags:[{label:"温暖",color:"#a88554"}]}
  ];
  books.forEach((book,index)=>{
    grid.append(view.render({book,index,category:"cet4",entitled:index!==2,
      hasProgress:index===0,bookmarked:index===1,
      onOpen:b=>{status.textContent="演示：点击了《"+b.title+"》；没有真实章节查询。";},
      onBookmarkToggle:(b,next)=>{status.textContent="演示：《"+b.title+"》收藏意图="+String(next)+"；未保存到服务器。";}
    }));
  });
})();
