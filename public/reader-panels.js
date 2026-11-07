// PUBLIC-11-04: reader toolbar panels + glossary visibility only.
// This is a public UI controller. It does not decide chapter rights,
// fetch chapter words, start TTS, persist learning, or save reader progress.
(function(root) {
  "use strict";
  function create({document: doc = root.document, initialGlossVisible = true,
    onGlossChange = null} = {}) {
    if (!doc || typeof doc.getElementById !== "function") throw Error("READER_PANELS_DOCUMENT_REQUIRED");
    const el = id => doc.getElementById(id);
    const layout = el("readerLayout");
    if (!layout || !layout.classList) throw Error("READER_LAYOUT_REQUIRED");
    const keys = {chapter:"chapter-drawer-open", vocab:"vocab-drawer-open"};
    const triggers = {chapter:"mobileChapterOpen", vocab:"mobileVocabOpen"};
    const closers = {chapter:"mobileChapterClose", vocab:"mobileVocabClose"};
    const bound = [];
    let mounted = false, current = null, lastTrigger = null;
    let glossVisible = Boolean(initialGlossVisible);
    const listen = (target,type,handler) => {
      if (target && typeof target.addEventListener === "function") {
        target.addEventListener(type,handler);
        bound.push([target,type,handler]);
      }
    };
    const snapshot = () => Object.freeze({drawer:current,glossVisible});
    function syncDrawers() {
      layout.classList.toggle(keys.chapter,current==="chapter");
      layout.classList.toggle(keys.vocab,current==="vocab");
      for (const type of Object.keys(triggers)) {
        const button=el(triggers[type]);
        if (button) button.setAttribute("aria-expanded",String(current===type));
      }
      const overlay=el("readerDrawerOverlay");
      if (overlay) overlay.setAttribute("aria-hidden",String(!current));
    }
    function closeDrawers({restoreFocus=false}={}) {
      const focusBack=lastTrigger;
      current=null;
      lastTrigger=null;
      syncDrawers();
      if (restoreFocus && focusBack && typeof focusBack.focus==="function") focusBack.focus();
      return snapshot();
    }
    function openDrawer(type) {
      if (!(type in keys)) throw Error("READER_DRAWER_UNKNOWN");
      const trigger=el(triggers[type]);
      if (current===type) return closeDrawers({restoreFocus:true});
      current=type;
      lastTrigger=trigger;
      syncDrawers();
      const close=el(closers[type]);
      if (close && typeof close.focus==="function") close.focus();
      return snapshot();
    }
    function setGlossVisible(visible, {announce=false}={}) {
      glossVisible=Boolean(visible);
      el("storyText")?.classList?.toggle("no-gloss",!glossVisible);
      for (const id of ["toggleGloss","sideToggleGloss"]) {
        const button=el(id);
        button?.classList?.toggle("pressed",!glossVisible);
        if (button) {
          button.setAttribute("aria-pressed",String(!glossVisible));
          button.setAttribute("aria-label",glossVisible?"隐藏释义":"显示释义");
          button.setAttribute("title",glossVisible?"隐藏释义":"显示释义");
        }
      }
      if (announce && typeof onGlossChange==="function") {
        onGlossChange({visible:glossVisible,
          message:glossVisible?"已显示释义":"已隐藏释义，可以尝试回忆"});
      }
      return snapshot();
    }
    const toggleGloss = () => setGlossVisible(!glossVisible,{announce:true});
    function mount() {
      if (mounted) return snapshot();
      mounted=true;
      for (const type of Object.keys(triggers)) {
        listen(el(triggers[type]),"click",()=>openDrawer(type));
        listen(el(closers[type]),"click",()=>closeDrawers({restoreFocus:true}));
      }
      listen(el("readerDrawerOverlay"),"click",()=>closeDrawers({restoreFocus:true}));
      for (const id of ["toggleGloss","sideToggleGloss"]) listen(el(id),"click",toggleGloss);
      listen(doc,"keydown",event=>{
        if (event?.key==="Escape" && current) {
          event.preventDefault?.();
          closeDrawers({restoreFocus:true});
        }
      });
      syncDrawers();
      setGlossVisible(glossVisible);
      return snapshot();
    }
    function unmount() {
      for (const [target,type,handler] of bound) target.removeEventListener?.(type,handler);
      bound.length=0;
      mounted=false;
      // Remove public drawer state when this controller is detached.
      closeDrawers();
    }
    return Object.freeze({mount,unmount,openDrawer,closeDrawers,
      setGlossVisible,toggleGloss,getState:snapshot});
  }
  root.MiaowuReaderPanels = Object.freeze({create});
})(window);
