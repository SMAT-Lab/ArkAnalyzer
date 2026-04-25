---
name: arkanalyzer-dev
description: 在 ArkAnalyzer 仓库中开发 ArkTS 分析代码时的构建/测试命令、编程规范、Git 与设计文档约定。触及时提及：ArkAnalyzer、HomeCheck、ArkTS、Scene/Cfg/IR。
---

# /arkanalyzer-dev

## Quick Commands

Run all commands in **project root**.

| 目的 | 命令 | 备注 |
|------|------|------|
| 全量构建 | `npm run build` | `tsc` |
| 增量类型检查 | `npx tsc --noEmit --pretty src/<path>` | 单文件，比全量构建快 |
| 全量测试 | `npm test` 或 `npm run testonce` | 脚本已包含先 build |
| 单文件测试 | `npx vitest run tests/unit/<path>` | 不构建，直接跑 |
| 性能测试 | `npm run perf:arkts` | |
| 文档生成 | `npm run gendoc` | 输出见 `docs/api_docs/` |
| 构建 C++ 前端 | `npm run build:cpp` | 仅改 `src/frontend/cppFrontend` 时需执行 |
| 打包 | `npm pack` | 触发 prepack（build + prod tsc），产出 `.tgz` |
| 格式化 | `npm run format` | prettier --write src/ tests/ |
| 单文件格式化 | `npx prettier --write <file-path>` | 例如 `npx prettier --write src/save/GraphPrinter.ts` |

---

## Stack

- **运行时** — Node ≥ 18，TypeScript ≥ 5.0
- **ohos-typescript** — 特定 fork（`bundledDependencies`），改动语法/类型相关逻辑时需兼顾 ArkTS 与 OH TS fork 的差异
- **构建** — `npm run build` = `tsc`，配 `tsconfig.json` / `tsconfig.prod.json`
- **测试** — Vitest，`npm test` 脚本含先 build

---

## Project-Specific Rules

### 版权头
- **新建** `.ts` 文件顶部须包含 Apache License 2.0 完整段落，以 `Copyright (c) … Huawei Device Co., Ltd.` 起头
- 年份与同 PR 相邻新文件或仓库惯例一致
- 模板参考：`src/callgraph/algorithm/AbstractAnalysis.ts` 第 1–14 行

### 代码语言
- 代码中的标识符、注释、JSDoc、string 字面量等**必须使用英文**；专业术语或品牌名（如 ArkUI、Ability）按官方写法保留大小写
- 中文仅允许出现在 `docs/` 文档、commit message 以及 PR 描述中

### 行宽
- 每物理行 **≤ 160 字符**（代码、注释、字符串字面量）
- 超长则换行、拆字符串、拆链式调用或提取变量
- 单函数体建议 ≤ 50 行，超则拆

### ArkTS / OH TS fork 差异
- 改动语法、类型系统或解析逻辑时，确认不影响 ArkTS 编译
- 参照 `ohos-typescript` 中与标准 TS 的差异实现

### 文档同步
- 行为或 CLI/配置变更 → 同步 `docs/`（README、QuickStart 等）
- API/类型对外变化 → 执行 `npm run gendoc` 并提交产物

---

## ✅ Boundaries

| 层级 | 行为 |
|------|------|
| ✅ **始终做** | 改代码前 `npm run build` 通过；改完后跑单文件测试或全量 `npm run testonce`；行宽 ≤ 160；新文件加 Copyright 头 |
| ⚠️ **先问我** | 安装/升级依赖（`npm i <pkg>`）、删除文件、修改 CI 配置、全量重写现有模块、删除你认为的死代码或注释掉的实现 |
| 🚫 **绝不做** | 提交 `docs/developer/` 设计文档到远端（除非用户明确要求）；向无写权限的上游分支强推（应推送到个人 fork 后提 PR）；夹带无关的多条杂乱 commit 到 PR |

---

## Hot Path Awareness

Pass 遍历、CFG/图构建、指针分析/调用图等大规模路径：
- 注意算法阶数与内层重复遍历；能增量/缓存则写明不变量
- **避免在循环中重复做完整 Scene 扫描或可避免的 AST 全树遍历**
- 昂贵计算若引入惰性/缓存，在代码旁简要说明命中条件与失效条件
- 热路径避免 `console.log` 拼接大对象（stdio + 字符串化成本高），使用 Logger 并控制级别

---

## 卡住时

不确定模块选型或 API 用法时，先读 [reference-architecture.md](reference-architecture.md) 了解模块边界，再在 `docs/` 中搜索相关术语。

---

## Workflow

### 新特性

1. **理解需求** — 明确模块（core / pass / callgraph / save 等）；查阅 `docs/` 术语
2. **测试先行** — 先写失败 UT；需要时在 `tests/resources/` 增加输入
3. **实现** — 最小化改动，风格与相邻代码一致
4. **验证** — `npm run build` / `npx tsc --noEmit --pretty` 通过 → `npm run testonce` 全绿；若影响 HomeCheck 看下方兼容性验证
5. **文档** — 同步 `docs/`；运行 `npm run gendoc`
6. **设计文档** — 按模板编写（见 References）
`[ ] 需求边界 [ ] UT先行 [ ] 实现 [ ] testonce全绿 [ ] HomeCheck验证 [ ] 文档同步 [ ] 设计文档 [ ] Git规范`

### Bug 修复

1. **测试先行** — 最小复现写成失败用例，未修复前稳定失败
2. **修复根因** — 避免无关重构
3. **验证** — `npm run testonce`，必要时加回归用例
4. **设计文档** — 同上
`[ ] UT先行 [ ] 修复 [ ] testonce全绿 [ ] 设计文档 [ ] Git规范`

---

## HomeCheck 兼容性验证

仅在可能改变对外 API/IR 行为或 PR 审阅要求时执行。

| 步骤 | 操作 |
|------|------|
| 1. 打包 | 本项目根目录 `npm pack` → 生成 `arkanalyzer-<version>.tgz` |
| 2. 克隆 HomeCheck | `git clone https://gitcode.com/openharmony-sig/homecheck.git` |
| 3. 安装 | `cd homecheck && npm i && npm i <tgz 路径>` |
| 4. 测试 | `npm run test` — **全部用例须通过** |

---

## Git 规范

- `git commit -s` — 必须加 `--signoff`，满足 DCO
- **一特性 / 一 Bug = 一个 commit** — 推送前 rebase 压缩为单个 commit
- **从 fork 提 PR** — 在 fork 仓库建分支，`git push <fork-remote> <branch>`，再从 fork 分支向上游提 PR
- fork 远程命名自定（`myfork`、`fork` 等），与 `git remote -v` 一致即可

---

## References

- [reference-architecture.md](reference-architecture.md) — 架构与模块地图
- **设计文档** — 每个特性或 Bug 修复须有一份独立 `.md`，按 [design-doc-template.md](design-doc-template.md) 结构编写。**默认不提交**，仅当用户明确要求时才 `git add`。
  保存路径：`docs/developer/<issue-or-topic>.md`
