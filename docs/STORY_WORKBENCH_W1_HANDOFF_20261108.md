# 妙屋英语 · 小说工厂工作台 W1（公共可交互版）

**状态：W1 公共合成演示，非 AI 生产服务。** 预览地址（需要在仓库本地用 `npm run dev` 启动）：`/showcase/story-workbench.html`。

## 已实现的可操作内容
- 创建批次：等级（高中/四级/六级/考研/雅思）、原创题材、项目名、每批1–12本、每本1–30章、目标10–250词目、可选简短大纲。
- 合成任务队列、状态过滤、单本章节进度、总体统计、单任务详细属性。
- 状态机：计划 → 模拟开始 → 每次模拟完成一章 → 待审核 → 审核通过 → 可导出演示元数据；运行中可暂停，模拟失败可恢复；审核不通过退回最后一章。
- 任务内存快照隔离、防重复章节推进、防未经审核导出；操作记录仅保留内存，本页刷新重置。
- 下载的是 `notForPublication:true` 的合成任务摘要 **而非** 可导入出版台的小说 JSON。
- 阅读页面和首页的真实用户流程均未改变。公共演示不要输入私人小说、真实词库或凭证。

## 必须认清 W1 未完成的能力
- 不调用 AI / Codex、模型 API，不写出真实正文，不执行后台持续调度。
- 不连接真实 `factory.py`、私有词库、真实章节、审核表、网站 D1、出版权限和在线进度。
- 不将公共 W1 页面作为正式网站部署或运营后台一部分；这是安全隔离的内部工作台演示壳。

## W2 私人引擎接口建议（只定义抽象契约）
要求私人服务（或本机进程适配器）实现以下接口，正式设计时根据已有 `factory.py` 参数/进程能力冻结：
1. `createBatch({requestId,grade,genre,title,count,chapters,targetWords,outline})` → `{batchId,bookIds,revision}`
2. `getBatch(batchId)` → `{status,revision,books:[{bookId,status,completedChapters,totalChapters,lastError}]}`
3. `startTask({bookId,revision,requestId})` / `pauseTask` / `resumeTask` → `{status,revision}`
4. `reviewTask({bookId,revision,chapterNo,decision,note})` → `{reviewState,revision}`
5. `exportTask({bookId,revision})` → 私人可读取的 V42 JSON 成品或审核阻断原因，**只在完全审核通过后允许**。

后端约束：合法状态转换、幂等 `requestId`、章号严格单调且每章落盘成功后才更新进度、重复任务可检测，失败可恢复且不重复消耗模型额度；每批/每章有预算上限、超限停机；持久化卷与模型凭据仅私人环境可用。

## W3 与内容批次
用户确定新版 V1.1 **等待四级内容完成后统一正式发布**。旧三本四级完整稿原样保留，不迁移公共仓库；四本新四级总计32章，当前只写1章，剩31章。六级、考研新书后置。W3 必须证明一整本8章能真实连续生成、保存、审核与失败续跑，再切换该四级批次至工作台。

## 验收要求
- 公共 `npm run check`、`npm test`，以及 Chromium 320/390/1440px 的创建/暂停/恢复/失败/进度/审核/导出操作。
- 同时验证文件白名单和不含任何真实小说、词表、用户/权限/密钥。
- W1 验收成功不等于 W2/W3/W4 已经完成，也不代表运营台、正式网站已部署。
