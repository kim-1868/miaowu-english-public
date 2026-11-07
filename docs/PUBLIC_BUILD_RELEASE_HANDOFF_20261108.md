# PUBLIC-BUILD-01｜公共构建、测试与审核后 GitHub Release

日期：2026-11-08。目标是尽可能将可公开的 WordLetter 前端 UI 构建、合成合同测试、真实 Chromium 浏览器回归放在 miaowu-english-public 的标准 GitHub 托管运行器，减少私人 Actions 的重复构建分钟。真正受控的用户、订单、权益、词卡身份、小说/词库、D1 和 Cloudflare 发布仍在私人仓库。

## 自动构建（默认，不发布 Release）

公共 PR：Public repo lightweight guard 执行公开白名单审计、语法、所有合成 Node 测试、29 文件打包和独立完整性检查；涉及 UI 的 PR 还会通过 Public synthetic UI Chromium screen matrix 测试真浏览器/手机屏宽（仍只用合成数据）。

公共 main：成功后上传 wordletter-public-ui-<完整公共 SHA> Actions Artifact，保留 14 天。Artifact 是短期交付资料，不是 GitHub Release，也不是完整网站或 Cloudflare 上线产物。

独立脚本 scripts/verify-public-ui-release.mjs 核对精确 29 项名单、SHA-256、长度、源公共仓库、完整提交 SHA、不得增加文件/符号链接、不得出现明显敏感密钥特征；不匹配即拒绝打包发布。

## 审核后手动创建公开 Release

在公共 GitHub 仓库 Actions 打开 Public UI reviewed Release (manual only) → Run workflow，选择 main，并输入：

- expected_sha：事先人工核查、公共 CI 成功的完整 40 字符 main 提交 SHA。
- confirmation：准确输入 RELEASE_PUBLIC_UI_ONLY。

构建任务先核对 checkout SHA 与输入完全一致，重新执行安全审计、Node 测试、构建及完整校验。再准备以下三个资产：

1. wordletter-public-ui-<40 字符公共 SHA>.zip：只含 29 个批准的前端文件以及 manifest.json。
2. manifest.json：所有文件的大小、SHA-256、源仓库及源完整 SHA。
3. SHA256SUMS：独立校验 zip 和 manifest。

只有构建任务成功，第二个任务才获得公共仓库的短期 contents: write 权限创建 tag public-ui-<40 字符 SHA> 的 GitHub Release。不存在自动 push 触发、跨仓访问 token 或 Cloudflare 密钥。需要创建第一个 Release 时才实际手动启动工作流；此处的配置提交并不自动公开一个新版本。

## 私人接收范围和边界

- 私人候选先冻结最新完整 SHA，并记录拟引用的公共 Release tag/源 SHA；下载后核对 SHA256SUMS、manifest 中所有 29 文件、同名路径差异。
- 只合并允许公开的 UI 源码。禁止拿私人完整源码交给公共 Actions 来编译再“仅上传构建结果”：运行日志、缓存、容器、产物和 Git 历史都可能泄露付费业务内容。
- 私人仍要执行必要的 Worker 构建、身份与会员/订单/激活、词义去重/学习状态和测试 D1 完整回归，最后的 Cloudflare 预览/正式发布由私人权限控制。公共合成测试不替代敏感业务检验。
- 以 GitHub Billing 页的实际分钟数确认是否节省；私有 Actions 使用无法完全降为零。GitHub 官方指出公开仓库标准 GitHub-hosted runners 免费；大型运行器和 Artifact/存储有单独限制（https://docs.github.com/en/billing/concepts/product-billing/github-actions）。

当前状态：公共 Build/Node/Chromium 流程已存在；本次新增经过 SHA 锁定的公开 Release 工作流与独立验证测试。第一个 GitHub Release 尚未创建，私人仓库也尚未自动拉取 Release；正式/预览/D1 均不改变。
