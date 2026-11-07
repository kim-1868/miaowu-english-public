// Synthetic public preview deliberately uses in-memory storage only.
(() => {
  "use strict";
  const memory = new Map();
  const storage = {
    getItem(key) { return memory.get(key) || null; },
    setItem(key, value) { memory.set(key, value); },
    removeItem(key) { memory.delete(key); }
  };
  if (!window.MiaowuReaderPreferences) throw Error("PUBLIC_READER_COMPONENT_MISSING");
  window.MiaowuReaderPreferences.create({ document, storage }).mount();
})();
