// PUBLIC-11-03 · Customer shelf card presentation extracted from the reviewed
// private V1.1 app.js. This is DOM-only. The private caller alone owns rights,
// book selection, cover URLs, bookmarks and progress persistence.
(function (root) {
  "use strict";
  const DEFAULT_DESCRIPTION = "读一本舍不得合上的故事。";
  const coverKinds = ["one", "two", "three"];
  const illustrations = ["❦", "♧", "✥"];

  // Accept only same-origin root-relative assets; never use a URL supplied via
  // an untrusted external host, data URI or javascript URI.
  function validCoverUrl(value) {
    return typeof value === "string" &&
      value.startsWith("/") && !value.startsWith("//") &&
      !value.includes("..") && !value.includes("\\") &&
      /^\/[a-z0-9/_~.%-]+(?:\?[a-z0-9_=&.%-]+)?$/i.test(value);
  }
  function create({ document: doc = root.document } = {}) {
    if (!doc || typeof doc.createElement !== "function") {
      throw Error("SHELF_CARD_DOCUMENT_REQUIRED");
    }
    const node = (tag, className, text) => {
      const el = doc.createElement(tag);
      if (className) el.className = className;
      if (text !== undefined) el.textContent = String(text);
      return el;
    };
    function render({ book, index = 0, category = "", entitled = false,
      hasProgress = false, bookmarked = false, coverUrl = "",
      onOpen, onBookmarkToggle } = {}) {
      if (!book || typeof book.id !== "string" || !book.id ||
          typeof book.title !== "string" || !book.title) {
        throw Error("SHELF_CARD_INVALID_BOOK");
      }
      const position = Number.isFinite(Number(index)) ?
        Math.max(0, Math.floor(Number(index))) : 0;
      const kind = coverKinds[position % coverKinds.length];
      const numeral = String(position + 1).padStart(2, "0");
      const displayTitle = book.title;
      const hasCover = validCoverUrl(coverUrl);
      const saved = Boolean(bookmarked);
      const allowed = Boolean(entitled);
      const item = node("div", "book-item cloud-book-item");
      item.setAttribute("data-public-shelf-card", "");
      const cover = node("div", "book-cover " + kind +
        (hasCover ? " rainy-night-published-cover" : ""));
      cover.setAttribute("aria-label", displayTitle);
      if (hasCover) {
        const img = node("img", "rainy-night-cover-image");
        img.setAttribute("src", coverUrl);
        img.setAttribute("alt", "《" + displayTitle + "》小说封面");
        img.setAttribute("loading", "lazy");
        img.setAttribute("decoding", "async");
        cover.append(img);
      }
      const tags = Array.isArray(book.cover_tags) ? book.cover_tags.slice(0, 8).filter(t =>
        t && typeof t.label === "string" && t.label.length > 0 &&
        typeof t.color === "string" && /^#[0-9a-f]{6}$/i.test(t.color)) : [];
      if (tags.length) {
        const wrapper = node("div", "cover-custom-tags");
        wrapper.setAttribute("aria-label", "小说标签");
        for (const t of tags) {
          const tag = node("span", "cover-custom-tag", t.label);
          tag.style.setProperty("--cover-tag-color", t.color);
          wrapper.append(tag);
        }
        cover.append(wrapper);
      }
      cover.append(node("span", "book-tag", allowed ? "已解锁" : "会员专享"));
      if (!hasCover) {
        cover.append(node("span", "edition", "THE STORY EDITION / " + numeral));
        cover.append(node("span", "illustration", illustrations[position % illustrations.length]));
        cover.append(node("h3", "", displayTitle));
        cover.append(node("span", "edition-bottom", "STORY COLLECTION"));
      }
      const info = node("div", "book-info");
      const line = node("div", "line1");
      const title = node("h3", "", displayTitle);
      title.setAttribute("title", displayTitle);
      line.append(title, node("span", "eyebrow", numeral));
      info.append(line);
      info.append(node("p", "", typeof book.description === "string" && book.description ?
        book.description : DEFAULT_DESCRIPTION));
      const meta = node("div", "book-meta");
      meta.append(node("span", "pill", String(category).toUpperCase()));
      meta.append(node("span", "pill", allowed ? "已拥有阅读权益" : "解锁后阅读"));
      info.append(meta);
      const progress = node("div", "shelf-progress");
      progress.setAttribute("data-live-progress", book.id);
      const summary = node("div", "progress-text");
      summary.append(node("span", "", "正在读取阅读记录"), node("span", "", "—"));
      const track = node("div", "progress-track");
      const fill = node("div", "progress-fill");
      fill.style.setProperty("width", "0%");
      track.append(fill);
      progress.append(summary, track);
      info.append(progress);
      const actions = node("div", "book-actions");
      const read = node("button", "primary", hasProgress ? "继续阅读 →" :
        allowed ? "开始阅读 →" : "查看会员目录 →");
      read.type = "button";
      read.addEventListener("click", () => { if (typeof onOpen === "function") onOpen(book); });
      const save = node("button", "secondary-btn cloud-bookmark-button", saved ? "✓ 已收藏" : "♡ 收藏小说");
      save.type = "button";
      save.setAttribute("data-cloud-bookmark", book.id);
      save.setAttribute("aria-pressed", String(saved));
      save.addEventListener("click", () => {
        if (typeof onBookmarkToggle === "function") onBookmarkToggle(book, !saved);
        // Do not optimistically change the button: private API must confirm.
      });
      actions.append(read, save);
      info.append(actions);
      item.append(cover, info);
      return item;
    }
    return Object.freeze({ render });
  }
  root.MiaowuShelfCard = Object.freeze({ create, validCoverUrl });
})(window);
