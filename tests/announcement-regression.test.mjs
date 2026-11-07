import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../public/site-updates.js", import.meta.url), "utf8");
const tick = async () => { await new Promise((resolve) => setImmediate(resolve)); };

function createNode(id = "", registry) {
  const events = new Map();
  const attrs = new Map();
  const node = {
    id, events, attrs, children: [], hidden: false, disabled: false, open: false,
    textContent: "", tabIndex: 0, className: "",
    addEventListener(type, handler) { events.set(type, handler); },
    setAttribute(k, v) { attrs.set(k, String(v)); },
    getAttribute(k) { return attrs.get(k); },
    removeAttribute(k) { attrs.delete(k); },
    focus() { registry.focused = this; },
    showModal() { this.open = true; },
    close() { this.open = false; events.get("close")?.(); },
    append(...nodes) { this.children.push(...nodes); },
    replaceChildren(...nodes) { this.children = [...nodes]; },
    querySelectorAll(selector) {
      const cls = selector.replace(/^\./, "");
      const nodes = [];
      const walk = (parent) => {
        for (const child of parent.children) {
          if (child.className?.split(/\s+/).includes(cls)) nodes.push(child);
          walk(child);
        }
      };
      walk(this);
      return nodes;
    }
  };
  return node;
}

function fixture({ archive = false, latest, pages = {} } = {}) {
  const ids = [
    "siteUpdateBanner", "siteUpdateTitle", "siteUpdateMeta", "siteUpdateDetail",
    "siteUpdateDismiss", "siteUpdateDialog", "siteUpdateDialogClose",
    "siteUpdateTabLatest", "siteUpdateTabHistory", "siteUpdatePanelLatest",
    "siteUpdatePanelHistory", "siteUpdateDialogDate", "siteUpdateDialogHeadline",
    "siteUpdateDialogBody", "siteUpdateCompactList", "siteUpdateHistoryMore",
    "siteUpdateHistoryInlineStatus"
  ];
  if (archive) ids.push("siteUpdateHistory", "siteUpdateHistoryStatus", "siteUpdateMore");
  const state = { focused: null, requests: [], storage: new Map(), handlers: {}, nodes: {} };
  for (const id of ids) state.nodes[id] = createNode(id, state);
  const document = {
    readyState: "complete", hidden: false, documentElement: { setAttribute() {} },
    getElementById(id) { return state.nodes[id] || null; },
    createElement(tag) { return createNode(tag, state); },
    addEventListener(type, fn) { state.handlers["document:" + type] = fn; }
  };
  let newest = latest || {
    id: "demo-current", title: "演示公告", category: "feature",
    body: "<script>alert(1)</script>", publishedAt: "2026-11-07T09:00:00Z"
  };
  const context = {
    document, console, Date, Intl, URL, URLSearchParams, Promise, Set,
    localStorage: {
      getItem(k) { return state.storage.get(k) || null; },
      setItem(k, v) { state.storage.set(k, v); },
      removeItem(k) { state.storage.delete(k); }
    },
    location: { search: "", href: "https://example.invalid", hash: "" },
    history: { state: null, replaceState() {} },
    window: { addEventListener(type, fn) { state.handlers[type] = fn; } },
    fetch: async (path) => {
      state.requests.push(path);
      if (path === "/api/updates/latest") {
        return { ok: true, json: async () => ({ latest: newest, previewOnly: false }) };
      }
      const p = Number(new URLSearchParams(path.split("?")[1]).get("page"));
      const handler = pages[p];
      if (typeof handler === "function") return handler();
      if (!handler) throw Error("Unexpected synthetic page: " + p);
      return { ok: true, json: async () => handler };
    }
  };
  state.setLatest = (val) => { newest = val; };
  state.dispatch = (id, type, ev = {}) => state.nodes[id].events.get(type)?.(ev);
  runInNewContext(source, context);
  return state;
}

test("latest notice is text-only; dismiss survives refresh, but a changed ID reappears", async () => {
  const f = fixture();
  await tick();
  assert.equal(f.nodes.siteUpdateTitle.textContent, "演示公告");
  f.nodes.siteUpdateDetail.onclick();
  assert.equal(f.nodes.siteUpdateDialogBody.textContent, "<script>alert(1)</script>");
  f.nodes.siteUpdateDismiss.onclick();
  assert.equal(f.nodes.siteUpdateBanner.hidden, true);
  f.handlers.pageshow();
  await tick();
  assert.equal(f.nodes.siteUpdateBanner.hidden, true);
  f.setLatest({ id: "demo-new", title: "演示公告更新", category: "feature", body: "新公告", publishedAt: "2026-11-08T09:00:00Z" });
  f.handlers.pageshow();
  await tick();
  assert.equal(f.nodes.siteUpdateTitle.textContent, "演示公告更新");
  assert.equal(f.nodes.siteUpdateBanner.hidden, false);
});

test("history tabs are keyboard operable, and same-page duplicates are discarded", async () => {
  const row = (id) => ({ id, title: "演示历史 " + id, body: "普通文本", publishedAt: "2026-11-07T09:00:00Z" });
  const f = fixture({ pages: {
    1: { updates: [row("a"), row("a"), row("b"), row("c"), row("d"), row("e")], hasMore: false }
  } });
  await tick();
  f.nodes.siteUpdateDetail.onclick();
  let prevented = false;
  f.dispatch("siteUpdateTabLatest", "keydown", { key: "ArrowRight", preventDefault() { prevented = true; } });
  await tick();
  assert.equal(prevented, true);
  assert.equal(f.nodes.siteUpdateTabHistory.getAttribute("aria-selected"), "true");
  assert.equal(f.nodes.siteUpdateTabHistory.tabIndex, 0);
  assert.equal(f.nodes.siteUpdateTabLatest.tabIndex, -1);
  assert.equal(f.focused, f.nodes.siteUpdateTabHistory);
  assert.equal(f.nodes.siteUpdateCompactList.children.length, 5);
  const first = f.nodes.siteUpdateCompactList.children[0];
  assert.equal(first.children[0].getAttribute("aria-expanded"), "false");
  first.children[0].events.get("click")();
  assert.equal(first.children[0].getAttribute("aria-expanded"), "true");
  assert.equal(first.children[1].hidden, false);
  f.dispatch("siteUpdateTabHistory", "keydown", { key: "Home", preventDefault() {} });
  assert.equal(f.nodes.siteUpdatePanelLatest.hidden, false);
});

test("compact history safely retries failed page and keeps fetched records", async () => {
  const row = (id) => ({ id, title: "合成更新 " + id, body: "短公告", publishedAt: "2026-11-07T09:00:00Z" });
  let attempts = 0;
  const f = fixture({ pages: {
    1: { updates: [row("a"), row("b"), row("c")], hasMore: true },
    2: () => {
      attempts++;
      if (attempts === 1) return Promise.resolve({ ok: false });
      return Promise.resolve({ ok: true, json: async () => ({ updates: [row("d"), row("e")], hasMore: false }) });
    }
  } });
  await tick();
  f.nodes.siteUpdateDetail.onclick();
  f.dispatch("siteUpdateTabHistory", "click");
  await tick();
  assert.equal(f.nodes.siteUpdateCompactList.children.length, 3);
  assert.equal(f.nodes.siteUpdateHistoryMore.hidden, false);
  assert.match(f.nodes.siteUpdateHistoryInlineStatus.textContent, /暂时无法读取/);
  f.dispatch("siteUpdateHistoryMore", "click");
  await tick();
  assert.equal(attempts, 2);
  assert.equal(f.nodes.siteUpdateCompactList.children.length, 5);
  assert.equal(f.nodes.siteUpdateHistoryMore.hidden, true);
  assert.equal(f.requests.filter((r) => r === "/api/updates?page=1").length, 1);
});

test("archive errors expose a retry action without discarding current page", async () => {
  let calls = 0;
  const f = fixture({ archive: true, pages: {
    1: () => {
      calls++;
      if (calls === 1) return Promise.resolve({ ok: false });
      return Promise.resolve({ ok: true, json: async () => ({
        updates: [{ id: "fake-1", title: "<em>文字</em>", body: "<b>仅文本</b>", category: "other", publishedAt: "2026-11-07T09:00:00Z" }],
        hasMore: false, total: 1
      }) });
    }
  } });
  await tick();
  assert.equal(f.nodes.siteUpdateMore.hidden, false);
  assert.equal(f.nodes.siteUpdateMore.textContent, "重试加载");
  f.dispatch("siteUpdateMore", "click");
  await tick();
  assert.equal(calls, 2);
  assert.equal(f.nodes.siteUpdateHistory.children.length, 1);
  assert.equal(f.nodes.siteUpdateHistory.children[0].children[2].textContent, "<em>文字</em>");
  assert.equal(f.nodes.siteUpdateHistory.children[0].children[3].textContent, "<b>仅文本</b>");
  assert.equal(f.nodes.siteUpdateMore.hidden, true);
});

test("late response for an older latest query never replaces a newer notice", async () => {
  const resolvers = [];
  const f = fixture();
  // use a separate vm context to mock response order, without network access
  const ids = ["siteUpdateBanner", "siteUpdateTitle", "siteUpdateMeta", "siteUpdateDetail", "siteUpdateDismiss"];
  const nodes = Object.fromEntries(ids.map(id => [id, createNode(id, {})]));
  const handlers = {};
  const ctx = {
    document: { readyState: "complete", getElementById(id) { return nodes[id] || null; }, addEventListener() {} },
    window: { addEventListener(name, handler) { handlers[name] = handler; } },
    localStorage: { getItem() { return ""; } }, URL, URLSearchParams, Intl, Date, Promise, Set,
    location: { search: "", href: "https://example.invalid" },
    fetch: (path) => new Promise(resolve => { assert.equal(path, "/api/updates/latest"); resolvers.push(resolve); })
  };
  runInNewContext(source, ctx);
  handlers.pageshow();
  assert.equal(resolvers.length, 2);
  const newer = { id: "new", title: "较新公告", category: "feature", publishedAt: "2026-11-07T09:00:00Z" };
  const older = { id: "old", title: "较旧公告", category: "feature", publishedAt: "2026-11-06T09:00:00Z" };
  resolvers[1]({ ok: true, json: async () => ({ latest: newer }) });
  await tick();
  resolvers[0]({ ok: true, json: async () => ({ latest: older }) });
  await tick();
  assert.equal(nodes.siteUpdateTitle.textContent, "较新公告");
  assert.equal(nodes.siteUpdateBanner.hidden, false);
});
