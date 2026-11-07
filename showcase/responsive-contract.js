// No API and no persistence: switch a synthetic theme and text size only.
(() => {
 "use strict";
 const button = document.getElementById("contractTheme");
 const input = document.getElementById("contractFont");
 const output = document.getElementById("contractFontValue");
 const article = document.getElementById("contractReaderText");
 if(!button||!input||!output||!article) return;
 button.addEventListener("click", () => {
   const dark = document.documentElement.dataset.theme !== "dark";
   document.documentElement.dataset.theme = dark ? "dark" : "light";
   button.setAttribute("aria-pressed", String(dark));
   button.textContent = dark ? "切换日间" : "切换夜间";
 });
 input.addEventListener("input", () => {
   const value = Math.min(24,Math.max(12,Number(input.value)||16));
   output.textContent = value+"px";
   article.style.setProperty("--contract-reader-font",value+"px");
 });
})();
