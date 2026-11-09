# PUBLIC-409｜已下架旧书上传入口的公开合成测试

2026-11-09。范围：**只做公开可验证的接口路由契约与合成测试**，不含任何真实书稿、词库、用户信息或生产服务端源码。

## 本批可直接在公共 Actions 执行

- `scripts/novel-upload-route-contract.mjs`：用纯函数模拟「旧书 ID 已存在 → 修订」「已发布 → 原书编辑」「同名不同 ID → 拒绝」「新书 → 新建草稿」。
- `tests/novel-upload-route-contract.test.mjs`：11 项模拟测试，校验旧书不再 POST 新建、必须使用版本指纹、曾发布后下架的重写额外确认、版本冲突不能降级为新建、成功导入也不得自动公开上架。
- `scripts/novel-revision-contract.mjs`、`tests/novel-revision-contract.test.mjs`：先前已迁移的公开合成词卡/章节身份与备份门禁测试。
- 公共 Actions 的 `npm run check` 与 `npm test` 可执行以上校验，无需 Cloudflare、数据库或私有仓库 GitHub Actions 额度。

## 私人部分的实际修复位置

- 私有 PR [#203](https://github.com/kim-1868/miaowu-english/pull/203)：修复运营台真实「确认上传并上架」根据原书 ID 选择版本修订路径、服务端历史快照和词卡保护。
- 公开合成测试只能验证行为模型，**不能**证明私有 PR 的真实代码已成功构建，也不能代替 D1 与运营权限的正式环境测试。
- 正式站尚未部署该修复，用户此时重复使用旧站上传仍会收到 `BOOK_ALREADY_EXISTS_USE_VERSIONED_REVISION`（HTTP 409）。

## 后续正式验收门禁（仅私人环境）

1. 确认真实小说的 book.id、旧章节 ID 与历史词卡兼容，防止学习身份漂移；
2. Cloudflare 生产 D1 必须存在 `ops_live_book_versions` 历史快照表，且可执行只读检查；
3. 受保护的发布方身份验证、审计和当前 Worker/静态文件版本核对通过；
4. 正式部署后验证真实旧书从“已下架”状态进入修订，再审核与上架；版本冲突必须明确拒绝，不能丢失用户进度；
5. 权限不足、数据库迁移缺失、GitHub Actions 账单阻断时停止，不转移生产密钥或私有源码到公共仓库。

本次不执行任何正式数据写入或发布，也不迁移真实三本小说文件。
