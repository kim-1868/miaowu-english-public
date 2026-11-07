// PUBLIC-11-04 synthetic-only controller adapter. No private API or storage.
(() => {
  "use strict";
  const status=document.getElementById("readerPanelsStatus");
  if (!window.MiaowuReaderPanels) throw Error("PUBLIC_READER_PANELS_NOT_LOADED");
  window.readerPanelsDemo=window.MiaowuReaderPanels.create({
    document,
    initialGlossVisible:true,
    onGlossChange:({message})=>{status.textContent="本地演示："+message+"（未保存）。";}
  });
  window.readerPanelsDemo.mount();
})();
