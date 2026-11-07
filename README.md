# 妙屋英语 WordLetter · 公共开发仓库

> **公共前端研发与测试工作区（2026-11-07）**。本仓库不包含完整正式网站，不负责真实登录、兑换或付费阅读。正式站运行在私人核心仓库管理的 Cloudflare Pages / Workers / D1 上。

## 本次已落地

- 已在不复制私人 Git 历史的前提下，独立迁入 **18 个经审核的真实网站公共样式、交互脚本与小型 SVG 素材**。
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
