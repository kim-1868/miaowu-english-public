# WordLetter：公共优先的代码所有权与更新流程

> 生效日期：2026-11-07。项目当前仍在同时开发，公共仓库只是前端研发与公开资产源，**尚未接管生产部署**。

## 核心决定

凡是**可以让任意用户在浏览器里读取的 UI 视图、样式和通用交互代码**，默认先在 `kim-1868/miaowu-english-public` 开发、测试、打包并留痕；只有在代码确实涉及受限资产或服务器端权限/数据处理时，才放到 `kim-1868/miaowu-english` 私人仓库。

公共仓库已有 **24 个经过审查的前端文件**，含 2 个页面、浏览器端学习 UI、样式和 SVG。它们来自私人 V1.1 的固定版本快照，并非持续自动镜像。新增的 6 个用户可见文件详见 [迁移清单](PUBLIC_MIGRATION_MANIFEST.md)，来源提交 `0cf00b37ffa029997436fa3c0b2c67e35b114aa4`。

## 默认公共归属

- `public/index.html`：首页结构、书架/阅读/词卡页面布局、公告位置、设备使用教程展示；**仅公开结构**，不自行实现付费权限。
- `public/updates.html`、`public/site-updates.js/css`：公告查看、历史公告、关闭/展开、键盘操作；真实运营发布与查询鉴权仍由私人 API 负责。
- `public/flashcards.js/css`、`public/chapter-words.js`、`public/echo-cloud.js`：学习和复习界面、操作流程、动效与合成数据回归。谁可以读取某个词义、什么状态可写入、计数何时入库由**私人后端**判断。
- `public/onboarding.js/css`、`public/install-guide.js/css`：公开用户引导、手机桌面教程；服务器确认引导状态的接口仍在私人。
- `public/styles.css`、`public/v11-*.css`、`public/flashcards.css`：书架、排版、夜读、交互手感；可以在公共 Actions 跑离线测试和合成 Chromium 多屏宽测试。
- 已审核的一般图标、公开静态资源与安全测试夹具。新增真实图片/书封面必须逐项核对授权、元数据和文件安全后才能公开。
- `scripts/build-public-ui.mjs`、`scripts/plan-public-ui-handoff.mjs`、无密钥 Actions：生成 `wordletter-public-ui-<SHA>` 交付包和 SHA-256 清单，只读报告跨仓库差异。

## 默认私人归属（严禁公开迁移）

- `src/**` 中的实际身份认证、用户/订单、激活权益、词义去重与掌握持久化、数据库读写、付费墙与真实管理权限；
- `content/**` 中的未发布小说、词库源表、审核内容和可售卖完整内容；真实数据库导出、备份、订单/用户测试数据；
- `db/**`、`deploy/**`、`pages-production/**` 的受限业务和实际发布环境配置；
- `public/app.js`（当前包含待拆分的业务流程和私人接口协调；暂不整体公开）、`public/ops*`、`public/editor*`、`public/claim.js`、`public/novel-file-parser.js`、测试用户登录/生成测试兑换码的集成工具；
- Cloudflare 凭据、Pepper、生产 Token、真实账户信息以及任何历史上可能包含上述信息的 Git 提交。

**注意：** 公开客户端可以出现公开 API 路径，但服务器必须自己验证权限，不能因为代码放入公共仓库就把私有权限判断搬过去。

## 新需求不耽误进度的交付方式

1. **先分类、再写代码**。纯 UI 直接创建公共 PR；混合功能拆为“公共浏览器视图与合成合同测试” + “私人接口和数据库读写”两张任务。用户当前正在开发的私人分支不直接覆盖。
2. 公共 PR 自动进行白名单/凭据扫描、Node 22 测试、真实 Chromium 合成 UI 验收；公共 `main` 检查成功后生成**固定 SHA 的公开源码交付包**，不使用私人运行器，也不触发生产。
3. 私人整合必须选定公共的完整 40 位 SHA，验证 manifest 的每文件 SHA-256，再对比私人最新分支。差异只能逐项整合，**不能把公共整个 `index.html`、`app.js` 或 CSS 覆盖到私人站**。
4. 敏感业务测试由私人候选版本 Gate 一次性验收，再进行隔离的预览环境验证；用户明确批准后才允许正式发布。
5. 完成一次更新即同步 `docs/UPDATE_LOG.md` 与私人 `docs/V11_DUAL_REPO_PROGRESS_AND_HANDOFF_20261107.md`，写明“源 SHA、影响文件、测试、部署范围、当前差异、待完成事项”。

## 目前的版本对照（2026-11-07）

| 状态 | 说明 |
| --- | --- |
| 公共交付包 | [PUBLIC-10 PR #17](https://github.com/kim-1868/miaowu-english-public/pull/17) 已合并，24 个公开文件 |
| 公共代码检查 | [合并后 Actions #42386247604](https://github.com/kim-1868/miaowu-english-public/actions/runs/42386247604) 成功 |
| 公共 Chromium 合成测试 | [PR Actions #42386170973](https://github.com/kim-1868/miaowu-english-public/actions/runs/42386170973) 成功 |
| 公共交付包来源 | `0105b212b226a9898e7696cd314b999785826278`，artifact `wordletter-public-ui-0105b212b226a9898e7696cd314b999785826278` |
| 私人 V1.1 对照基线 | `0cf00b37ffa029997436fa3c0b2c67e35b114aa4` |
| 文件差异 | 24 个公开同路径文件：20 个与私人 Git blob 完全一致，4 个需审查（公告 JS、阅读 CSS、响应式 CSS、词卡 CSS） |
| 自动部署 | **未开启**，公共 PR 不会触发私人预览/正式站发布 |
| 需要以后完成 | 4 个差异文件逐项合并、私人真实业务候选 Gate 实际验收、预览环境验证、GitHub Billing 真实消耗复核 |

> 严禁把“公共代码构建成功”当作“用户网站发布成功”。尤其不要对仍在修改的私人开发分支强制合并、重置或大范围替换。
