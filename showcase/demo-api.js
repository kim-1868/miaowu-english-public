// Strictly synthetic data for public component demo; no real API or credentials.
(() => {
  "use strict";
  const latest = {
    id: "demo-20261107-001",
    category: "feature",
    title: "公告功能演示：欢迎来到妙屋英语",
    summary: "这是一条合成示例，不代表实际发布内容。",
    body: "公告可查看详情、关闭，并通过历史更新查看之前的消息。本演示不读取生产数据库。",
    publishedAt: "2026-11-07T08:00:00Z"
  };
  const previous = {
    id: "demo-20261101-001",
    category: "other",
    title: "演示记录：阅读体验优化",
    summary: "仅供查看布局效果。",
    body: "这是用于公共仓库自动测试和 UI 预览的虚构公告。",
    publishedAt: "2026-11-01T08:00:00Z"
  };
  const updates = [latest, previous];
  const syntheticResponse = (payload) => Promise.resolve({ ok: true, json: async () => payload });
  window.fetch = (input) => {
    const path = String(input);
    if (path === "/api/updates/latest") return syntheticResponse({ latest, previewOnly: false });
    if (path.startsWith("/api/updates?page=")) {
      const page = Number(new URLSearchParams(path.split("?")[1]).get("page")) || 1;
      return syntheticResponse({ updates: page === 1 ? updates : [], hasMore: false, total: updates.length });
    }
    return Promise.reject(new Error("Public demo has no backend: " + path));
  };
})();
