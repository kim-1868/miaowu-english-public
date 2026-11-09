# PUBLIC-NOVEL-REVISION · 已下架小说更新：公共优先执行交接（2026-11-09）

## 目标和实际迁移范围

由于私有仓库 Actions 运行器被 GitHub 账单或预算问题阻断，后续**可公开的构建、审稿工具通用测试、界面回归、浏览器模拟和 SHA 校验**先在此公共仓库执行，避免每次研发提交都启动私有 CI。

本批新增纯合成测试：`scripts/novel-revision-contract.mjs` + `tests/novel-revision-contract.test.mjs`。数据只使用虚构书名、ID、音标与例句，不读取真实书稿，也不访问用户数据库。公共的 `npm run check`、`npm test`、`npm run build:public-ui` 以及 public Actions 可以验证纯契约与已有 UI，并输出公共构建产物。

## 三本已下架小说的 409 问题：不得把公共测试当作正式修复

- 私人候选代码位置：[private PR #203](https://github.com/kim-1868/miaowu-english/pull/203)（基于 2026-11-09 较新的 Favorites+Wordbook 正式版）。
- 公共层仅验证：原书/章节 ID 保持稳定；旧词卡不被重写；先确认下架历史，移除旧标注须明确确认；旧版本快照必须可保存；任何修订都不能自动变成已售卖状态；必须经私人审核发布。
- 私人层必须保留：`src/ops-draft-revision.js`、`src/ops-live-edit.js`、`src/ops-console.js`、`public/ops-console.js`、权限/审计/D1/迁移、生产部署，以及小说真实 JSON 内容。它们**不得拷入公共仓库**。
- 之前的 GitHub Actions 生产发布尝试由于 D1 只读预检失败而停止；后续工作流启动前又出现付款/消费额度限制，暂未部署。公共仓库通过测试不能消除这两个阻碍。

## 后续工作默认路径

1. 公共仓库：开发纯 UI、合成词卡、可公开的通用校验器和契约测试；以 PR 触发 `Public repo lightweight guard`，构建公共静态资源和浏览器 QA。
2. 公共仓库：使用公开 Actions 的结果和产物 SHA 作为交付证据；审核前不合并、不发布与生产相关的文件。
3. 私人仓库：在当前正式版源 SHA 上仅整合审阅后的修复；保留严格的生产 D1 只读检查、词卡差异检查、用户学习记录和审核/上线权限门禁。
4. 生产站：只有实际 Cloudflare 预检通过、私有部署权限恢复、与三本原书兼容性确认后才能发布。失败必须中止且保留原站，不能通过关闭检查达成上线。
5. 小规模私有集成运行原则：公共回归已通过后再手动跑一次私有集成/发布检查，避免每次公共小修改都触发私有 Actions。

## 不可迁移的内容与安全线

真实小说、可售卖 JSON/封面、非公开词库、数据库表记录/备份、授权凭据、OPS 权限实现、订单/激活码、Cloudflare Token、私有 Git 历史及完整正式网站后端代码不进入本仓库。公共测试不会上传任何私人产物、向生产写入或自动触发私有部署。公共构建成功只代表纯合成契约通过。

## 交付和核验

- 此批工作分支：`feature/public-novel-revision-ci-20261109`。
- 新增文件：`scripts/novel-revision-contract.mjs`、`tests/novel-revision-contract.test.mjs`、本文件；并更新 `scripts/audit-public.mjs`、`package.json` 和开发日志。
- 源/目标 SHA、公共 PR、Actions 结论由最终提交记录确定。
- 正式站发布状态：**未部署**。三本小说：**未实际替换**。
