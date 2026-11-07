// PUBLIC-11: pure reader presentation controls split from private app.js.
// This module deliberately does not initialize itself or decide reading rights.
// A private integration can call create().mount() after reviewing concurrent changes.
(function (root) {
  "use strict";
  const MIN_FONT = 12, MAX_FONT = 24, DEFAULT_FONT = 18;
  const fontKey = "miaowu_reader_font", themeKey = "miaowu_theme";
  const clamp = value => Math.max(MIN_FONT, Math.min(MAX_FONT, Math.round(value)));
  const storageRead = (store, key) => {
    try { return store && typeof store.getItem === "function" ? store.getItem(key) : null; }
    catch { return null; }
  };
  const storageWrite = (store, method, key, value) => {
    try { if (store && typeof store[method] === "function") store[method](key, value); }
    catch { /* Private browsing or blocked storage: visual controls still work. */ }
  };

  function create(options = {}) {
    const doc = options.document || root.document;
    if (!doc || typeof doc.getElementById !== "function") throw Error("READER_DOCUMENT_REQUIRED");
    let store = options.storage;
    if (store === undefined) { try { store = root.localStorage; } catch { store = null; } }
    const initialSize = Number(storageRead(store, fontKey));
    let fontSize = Number.isFinite(initialSize) && initialSize > 0 ? clamp(initialSize) : DEFAULT_FONT;
    let night = storageRead(store, themeKey) === "dark";
    let mounted = false;
    const handlers = [];
    const byId = id => doc.getElementById(id);
    const listen = (node, type, callback) => {
      if (node && typeof node.addEventListener === "function") {
        node.addEventListener(type, callback);
        handlers.push([node, type, callback]);
      }
    };
    const state = () => Object.freeze({ night, fontSize });

    function applyTheme() {
      doc.documentElement?.setAttribute("data-theme", night ? "dark" : "light");
      doc.querySelector('meta[name="theme-color"]')?.setAttribute("content", night ? "#211f25" : "#f8f3ec");
      const globalToggle = byId("globalThemeToggle");
      if (globalToggle) {
        const indicator = globalToggle.querySelector(".theme-indicator");
        const label = globalToggle.querySelector(".theme-label");
        if (indicator) indicator.textContent = night ? "☀" : "☾";
        if (label) label.textContent = night ? "日间" : "夜间";
        globalToggle.setAttribute("aria-label", night ? "切换到日间模式" : "切换到夜间模式");
        globalToggle.setAttribute("aria-pressed", String(night));
      }
      const readerToggle = byId("toggleNight");
      if (readerToggle) {
        readerToggle.textContent = night ? "☀ 日间" : "☾ 夜间";
        readerToggle.classList?.toggle("pressed", night);
        readerToggle.setAttribute("aria-pressed", String(night));
      }
      byId("readerLayout")?.classList?.toggle("night", night);
      storageWrite(store, "setItem", themeKey, night ? "dark" : "light");
      return state();
    }
    function applyFont() {
      const content = byId("storyText");
      content?.style?.setProperty("line-height", "2.15");
      content?.style?.setProperty("font-size", fontSize + "px");
      byId("chapterTitle")?.style?.setProperty("font-size", Math.round(fontSize * 1.75) + "px");
      const slider = byId("readerFontSlider"), label = byId("readerFontValue");
      if (slider) slider.value = String(fontSize);
      if (label) label.textContent = fontSize + "px";
      const smaller = byId("smallerFont"), bigger = byId("biggerFont");
      if (smaller) smaller.disabled = fontSize <= MIN_FONT;
      if (bigger) bigger.disabled = fontSize >= MAX_FONT;
      byId("readerLayout")?.removeAttribute("data-reader-tone");
      storageWrite(store, "setItem", fontKey, String(fontSize));
      storageWrite(store, "removeItem", "miaowu_reader_tone");
      storageWrite(store, "removeItem", "miaowu_reader_line");
      return state();
    }
    const setTheme = value => { night = Boolean(value); return applyTheme(); };
    const toggleTheme = () => setTheme(!night);
    const setFontSize = value => {
      const next = Number(value);
      if (Number.isFinite(next)) fontSize = clamp(next);
      return applyFont();
    };
    const stepFont = delta => setFontSize(fontSize + (Number.isFinite(Number(delta)) ? Number(delta) : 0));
    function mount() {
      if (mounted) return state();
      mounted = true;
      listen(byId("globalThemeToggle"), "click", toggleTheme);
      listen(byId("toggleNight"), "click", toggleTheme);
      listen(byId("smallerFont"), "click", () => stepFont(-1));
      listen(byId("biggerFont"), "click", () => stepFont(1));
      listen(byId("readerFontSlider"), "input", event => setFontSize(event?.target?.value));
      applyTheme();
      return applyFont();
    }
    function unmount() {
      for (const [element, type, callback] of handlers) element.removeEventListener?.(type, callback);
      handlers.length = 0;
      mounted = false;
    }
    return Object.freeze({ mount, unmount, applyTheme, applyFont, setTheme, toggleTheme,
      setFontSize, stepFont, getState: state });
  }
  root.MiaowuReaderPreferences = Object.freeze({ create, MIN_FONT, MAX_FONT, DEFAULT_FONT });
})(window);
