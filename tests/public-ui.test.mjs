import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const file = (name) => readFileSync(new URL("../" + name, import.meta.url), "utf8");
const markup = file("showcase/index.html");

test("public demo has required controls and no real backend assets", () => {
  const ids = [
    "siteUpdateBanner", "siteUpdateTitle", "siteUpdateMeta", "siteUpdateDetail",
    "siteUpdateDismiss", "siteUpdateDialog", "siteUpdateDialogClose",
    "siteUpdateTabLatest", "siteUpdateTabHistory", "siteUpdatePanelLatest",
    "siteUpdatePanelHistory", "siteUpdateHistoryMore", "siteUpdateCompactList",
    "installGuideDialog", "openInstallGuide", "installGuideClose",
    "installGuideIphoneTab", "installGuideAndroidTab", "installGuideIphone", "installGuideAndroid"
  ];
  for (const id of ids) assert.match(markup, new RegExp('id="' + id + '"'), id);
  assert.doesNotMatch(markup, /src="\/app\.js|src="\/ops|content\/drafts|CLOUDFLARE_/);
  assert.match(markup, /合成数据/);
});

function element(id, document) {
  const attributes = new Map();
  const listeners = new Map();
  return {
    id, hidden: false, open: false, isConnected: true, textContent: "",
    tabIndex: 0, listeners, children: [],
    setAttribute(name, value) { attributes.set(name, String(value)); },
    getAttribute(name) { return attributes.get(name); },
    removeAttribute(name) { attributes.delete(name); },
    addEventListener(name, fn) { listeners.set(name, fn); },
    focus() { document.activeElement = this; },
    showModal() { this.open = true; },
    close() { this.open = false; listeners.get("close")?.(); },
    append(...nodes) { this.children.push(...nodes); },
    replaceChildren(...nodes) { this.children = [...nodes]; },
    querySelectorAll() { return []; }
  };
}

test("migrated install tutorial opens, switches devices, and restores focus", () => {
  const ids = ["installGuideDialog", "openInstallGuide", "installGuideClose", "installGuideIphoneTab", "installGuideAndroidTab", "installGuideIphone", "installGuideAndroid"];
  const doc = { activeElement: null };
  const els = Object.fromEntries(ids.map((id) => [id, element(id, doc)]));
  doc.getElementById = (id) => els[id] ?? null;
  const previous = { isConnected: true, focused: false, focus() { this.focused = true; } };
  doc.activeElement = previous;
  const window = {};
  runInNewContext(file("public/install-guide.js"), { document: doc, window, console });
  els.openInstallGuide.listeners.get("click")();
  assert.equal(els.installGuideDialog.open, true);
  assert.equal(els.installGuideIphoneTab.getAttribute("aria-selected"), "true");
  els.installGuideAndroidTab.listeners.get("click")();
  assert.equal(els.installGuideAndroidTab.getAttribute("aria-selected"), "true");
  assert.equal(els.installGuideIphone.hidden, true);
  assert.equal(els.installGuideAndroid.hidden, false);
  let prevented = false;
  els.installGuideAndroidTab.listeners.get("keydown")({ key: "ArrowLeft", preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(els.installGuideIphone.hidden, false);
  els.installGuideClose.listeners.get("click")();
  assert.equal(els.installGuideDialog.open, false);
  assert.equal(previous.focused, true);
  assert.equal(typeof window.MiaowuInstallGuide.open, "function");
});

test("migrated announcements show synthetic update, allow dismissal, and show a newer notice", async () => {
  const ids = [
    "siteUpdateBanner", "siteUpdateTitle", "siteUpdateMeta", "siteUpdateDetail",
    "siteUpdateDismiss", "siteUpdateDialog", "siteUpdateDialogClose", "siteUpdateTabLatest",
    "siteUpdateTabHistory", "siteUpdatePanelLatest", "siteUpdatePanelHistory",
    "siteUpdateDialogDate", "siteUpdateDialogHeadline", "siteUpdateDialogBody",
    "siteUpdateCompactList", "siteUpdateHistoryMore", "siteUpdateHistoryInlineStatus"
  ];
  const doc = { readyState: "complete", hidden: false, addEventListener() {}, documentElement: { setAttribute() {} } };
  const els = Object.fromEntries(ids.map((id) => [id, element(id, doc)]));
  doc.getElementById = (id) => els[id] ?? null;
  const local = new Map();
  let latest = { id: "demo-1", category: "feature", title: "演示公告 1", body: "纯测试数据", publishedAt: "2026-11-07T08:00:00Z" };
  const handlers = {};
  const env = {
    document: doc, console,
    Intl, Date, URL, URLSearchParams, Promise, String, Object, Array, Number, Set,
    location: { search: "", href: "https://example.invalid/", hash: "" },
    localStorage: { getItem(k) { return local.get(k) ?? null; }, setItem(k, v) { local.set(k, v); } },
    window: { addEventListener(name, fn) { handlers[name] = fn; } },
    fetch: async (path) => {
      assert.equal(path, "/api/updates/latest");
      return { ok: true, json: async () => ({ latest, previewOnly: false }) };
    }
  };
  runInNewContext(file("public/site-updates.js"), env);
  await new Promise((r) => setImmediate(r));
  assert.equal(els.siteUpdateBanner.hidden, false);
  assert.equal(els.siteUpdateTitle.textContent, "演示公告 1");
  els.siteUpdateDetail.onclick();
  assert.equal(els.siteUpdateDialog.open, true);
  assert.equal(els.siteUpdateDialogBody.textContent, "纯测试数据");
  els.siteUpdateDialogClose.listeners.get("click")();
  els.siteUpdateDismiss.onclick();
  assert.equal(els.siteUpdateBanner.hidden, true);
  await handlers.pageshow();
  await new Promise((r) => setImmediate(r));
  assert.equal(els.siteUpdateBanner.hidden, true);
  latest = { ...latest, id: "demo-2", title: "演示公告 2" };
  handlers.pageshow();
  await new Promise((r) => setImmediate(r));
  assert.equal(els.siteUpdateBanner.hidden, false);
  assert.equal(els.siteUpdateTitle.textContent, "演示公告 2");
});

test("announcement renderer uses plain text, not HTML injection", () => {
  const source = file("public/site-updates.js");
  assert.match(source, /\.textContent\s*=/);
  assert.doesNotMatch(source, /\.innerHTML\s*=/);
});
