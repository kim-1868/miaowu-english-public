# 妙屋英语 WordLetter · 公共开发仓库

> **公共前端研发与测试工作区（2026-11-07）**。本仓库不包含完整正式网站，不负责真实登录、兑换或付费阅读。正式站运行在私人核心仓库管理的 Cloudflare Pages / Workers / D1 上。

## 本次已落地

- 当前交付包有 **26 个白名单审核的公开前端文件**：24 个来自固定私人 V1.1 快照，另有 2 个在公共仓库独立拆分的纯 UI 组件；不复制私人 Git 历史。
- 网站公告及历史记录、手机桌面安装教程保留了原 V1.1 公共端 JS，并且通过了合成数据下的交互测试。
- 新建 `showcase/index.html`：使用真实组件 + 合成公告展示效果，绝不访问生产 D1、用户订单、小说或词库。
- `npm run check` 包含精确文件白名单、常见密钥特征与 JS 语法检查，`npm test` 用 Node 22 内置测试验证基本行为。
- GitHub Actions `Public repo lightweight guard` 在公共仓库的标准托管运行器执行检查，使用只读权限，不执行云端部署。

## 本地查看 UI 演示

需要 Node.js 22+，无外部依赖：

```bash
npm run check
npm test
npm run dev
```

浏览器打开 `http://127.0.0.1:4173/` 查看公告、关闭与历史交互，以及 iPhone / Android 添加到桌面的教程。所有演示内容均为人工合成；演示页面**不是**面向付费用户的生产网站。

## 安全边界和开发默认规则

允许：可公开网站页面样式、图标、通用组件、非敏感 UI 交互、合成模拟数据、公开离线测试。

禁止：小说原稿、内部词库与审核包、用户/订单/激活码、D1 数据备份、运营管理权限实现、Cloudflare Token/私钥、私人仓库的任何 Git 历史。每一类新增文件都须先审查并加入 `scripts/audit-public.mjs` 的白名单。

**公共开发优先，私人整合验收。** 日常 UI 改动优先在本仓库提交并跑公共 Actions；需要真正上线时，按固定提交版本审阅后才同步至私人生产快照，再运行敏感业务/数据库/付费墙验收，最终由私人部署链控制正式发布。

详细文件清单与迁移阶段：**[PUBLIC_MIGRATION_MANIFEST.md](docs/PUBLIC_MIGRATION_MANIFEST.md)**。

**并行开发与接下来任务**：详见 [PARALLEL_DEVELOPMENT_AND_ROADMAP_20261107.md](docs/PARALLEL_DEVELOPMENT_AND_ROADMAP_20261107.md)。项目已建立 [公共 UI 演示任务 #1](https://github.com/kim-1868/miaowu-english-public/issues/1)、[公告回归任务 #2](https://github.com/kim-1868/miaowu-english-public/issues/2)、[响应式样式任务 #3](https://github.com/kim-1868/miaowu-english-public/issues/3)。

**当前网站并行开发保护**：这个仓库只保存已审查的基线，绝不自动覆盖私人网站正在更改的页面、业务或部署配置；对齐版本必须先核对双方提交 SHA 与文件差异。

## 尚未切换的事项

生产站仍使用私人仓库内的当前前端快照。该公共仓库尚未作为生产发布时的直接代码来源，未经集成验收不可直接替换私人网站。私人仓库的 GitHub Actions 仍有 2,000 分钟月度配额；公共标准托管运行器的免费规则不适用于私人运行。 

## 每轮更新留痕

每次提交都会把改动范围、公共 Actions 验证、是否已部署以及与私人站点的集成状态写入 [公共开发更新日志](docs/UPDATE_LOG.md)。公共端只有离线/合成测试，不代表已发布到用户网站。

## PUBLIC-03 移动端样式独立验证

可通过 `npm run dev` 打开 `/showcase/responsive-contract.html` 查看使用真实公共 CSS 选择器的合成书架、词卡和阅读器，切换夜间模式与 12–24px 字号。该演示只做样式/交互检验，不会保存学习状态，不影响线上用户。

## 公共更新构建与交付（PUBLIC-06）

公开前端的 26 个已审核 UI 文件可用 `npm run build:public-ui` 构建为 `dist-public-ui/`，其中 `manifest.json` 包含各文件 SHA-256 校验值与源提交 SHA。公共 `main` 通过 GitHub Actions 后自动上传名为 `wordletter-public-ui-<完整 SHA>` 的构建产物，保留 14 天。构建不需要私人仓库访问、Cloudflare Token 或 D1 权限。

**注意**：构建产物不是完整网站，也不自动推送至私人仓库或生产环境。私人发布流程须对固定 SHA 做逐文件审阅与校验，并在私人环境验证业务/权益和上线门禁；严禁把私人资料复制到公共仓库。

## 公开界面真实浏览器 QA（PUBLIC-08）

对公共 UI 的 PR，公共 `Public synthetic UI Chromium screen matrix` 工作流使用 Playwright 在 `ubuntu-24.04` 检查多种手机/电脑宽度、夜间色彩、按钮触控和阅读字号，保存 **仅合成数据** 的截图供人工检查。测试脚本 `scripts/verify-public-ui-browser.mjs` 只访问本地预览；不代表私人登录、付费权益、D1 或真实设备已验收。

## 公共前端交付与私人版本差异预检（PUBLIC-09）

公共仓库现提供**只读**离线工具 `scripts/plan-public-ui-handoff.mjs`。由授权人在本地取得公共 Actions 的 `wordletter-public-ui-<SHA>` 交付包、已审核的公共完整 SHA、当前私人代码 checkout 后执行：

```bash
node scripts/plan-public-ui-handoff.mjs /path/to/unpacked-public-artifact /path/to/private-checkout <40位已审核的公共完整SHA>
```

它检查 manifest、18 个精确白名单文件、字节大小、逐文件 SHA-256 与额外文件/符号链接，并输出 `identical` / `review_required` / `missing`；**绝不写私人文件或自动部署**。需要人工比较标记差异的文件，再走私人 Gate 和受控预览。输入的完整 SHA 需要从已审阅 PR/Actions 独立核对，**manifest 自述的 SHA 不构成签名或可信发布证明**。

## PUBLIC-10：公开页面与浏览器学习 UI 的源代码归属

新增 `public/index.html`、`public/updates.html`、`public/flashcards.js`、`public/chapter-words.js`、`public/echo-cloud.js`、`public/onboarding.js`，来源固定私人 V1.1 提交 `0cf00b37ffa029997436fa3c0b2c67e35b114aa4`，不复制 Git 历史。它们用于公共仓库的 UI 开发、构建和离线接口检查。

**非常重要**：首页仍引用私人环境提供的 `/app.js` 等模块，公共交付包不包含这些文件；完整网站的账号、权限和 D1 后端仍在私人仓库。公共版本是固定快照，不会自动同步用户在私人网站进行的后续修改。进入生产前必须审阅完整提交 SHA、24 文件 SHA-256 清单、公共/私人差异并完成私人权限回归，严禁直接部署此交付包。

## 公共优先开发：后续统一执行规范

公开页面、浏览器 UI、日夜样式、通用学习交互等以后**默认在本公共仓库先开发、测试和打包**；私人仓库继续保护用户/订单/激活、小说词库、真实业务权限及发布操作。请按照 [公共前端所有权与双仓库交接规则](docs/PUBLIC_FRONTEND_OWNERSHIP_20261107.md) 选择代码位置，避免同时开发时互相覆盖。

## PUBLIC-11 · 阅读器展示逻辑逐步拆分（第一批）

从私人 `public/app.js` 已审阅的日夜模式和字号展示规则中抽出 `public/reader-preferences.js`，提供 `MiaowuReaderPreferences.create({document,storage}).mount()`。它只处理 DOM、12–24px/默认 18px 以及浏览器本地显示偏好，**不包含登录、付费判断、学习记录或 D1**。详见 [合成阅读控制演示](showcase/reader-controls-contract.html)；本组件**尚未加载到私人运行网站**，需要私人 `app.js` 后续受控拆分并确认双重监听不发生。

## PUBLIC-11 第二批：书架分页纯 UI 组件

从原 `app.js` 拆分 `public/shelf-pagination.js`，用 `MiaowuShelfPagination.create({document}).render({container,meta,currentPage,onPageChange})` 构建无后端权限的分页导航。按原文案提供上一页/下一页、页码省略号与 aria-current 语义。 [查看纯合成书架分页演示](showcase/shelf-pagination-contract.html)。**本次未接入私人网站**：真实 `/api/books`、分类权限与滚动行为依然由私人端负责。

## PUBLIC-11 当前交付快照（2026-11-07）

[公共 PR #19](https://github.com/kim-1868/miaowu-english-public/pull/19) 阅读控制与 [公共 PR #20](https://github.com/kim-1868/miaowu-english-public/pull/20) 书架分页均已完成 Node + Chromium 验收。当前 SHA-256 交付包是 `wordletter-public-ui-bc3de0fe82c275204d26c5a2ffa1f4800e7ac6a3`，包含 26 个文件（Artifact ID `13580371015`）。与私人 V1.1 固定参考版本对比：20 个 Git blob SHA 相同、4 个公共改动需合并、2 个新增公共组件等待私人集成。**没有修改预览或正式网站。**
