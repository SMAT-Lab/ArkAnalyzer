---
name: arkanalyzer-dev
description: >-
  指导在 ArkAnalyzer（OpenHarmony 程序分析 SIG）仓库中开展开发：架构与目录、测试与构建门禁、
  编程规范（Copyright、行宽≤160）、Clean Code/可维护性、性能（含 Node/TS 运行时）、文档与注释、
  Git（commit -s、单 commit、fork 推送）、特性/Bug 设计文档（独立 Markdown）与 Vitest 流程。
  在贡献底座代码、HomeCheck 兼容性验证、代码整洁、性能热点、写文档或提及 ArkAnalyzer、HomeCheck、ArkTS、Scene/Cfg/IR、ohos-typescript 时使用。
---

# ArkAnalyzer 仓库开发与 Agent 导读

## 本 Skill 的价值与应用场景


| 价值      | 说明                                                                      |
| ------- | ----------------------------------------------------------------------- |
| 降低冷启动成本 | Agent 先读本 Skill 再改代码，减少对「目录在哪、怎么测、构建顺序」的往返追问。                           |
| 统一工作流   | 特性与 Bug 均推荐「测试先行 → 改实现 → `npm test` 通过」，减少漏测与回归。                        |


**典型场景**：首次改 `src/core` IR/图/数据流；修 Bug 补 UT；PR 前本地跑通构建与 Vitest。

---

## 本仓库结构（约束）

本仓库为 **ArkAnalyzer** 单库（根目录即工程根，勿与上层多仓工作区混淆）。


| 路径             | 说明                                                                                    |
| -------------- | ------------------------------------------------------------------------------------- |
| `src/`         | 源码（IR、CFG、数据流、Pass、调用图、打印等），详见 [reference-architecture.md](reference-architecture.md) |
| `tests/`       | 测试：`unit/`、`samples/`、`resources/`（样例与资源按场景分子目录）                                      |
| `docs/`        | 快速入门、上库说明、API 文档入口等                                                                   |
| `skills/`      | 本仓库内 Agent Skill 源文件（`arkanalyzer-dev/` 等）                                            |
| `package.json` | `npm run build` → `tsc`；`npm test` / `testonce` → **先 build 再 Vitest**                |


**操作约定**：一切命令在**本仓库根目录**执行；TypeScript / `ohos-typescript` 行为以本库 `tsconfig` 与依赖为准。

**SIG 生态（可选）**：**HomeCheck** 等常为独立仓库；若同时开发规则/门禁，在对应仓库根目录执行其 `npm test`，不必假定与本库同路径。联调时再关注其对 `arkanalyzer` 包的版本依赖。

---

## 基础门禁与编程规范（概要）

1. **语言与工具链**
  - 使用本仓库锁定的 TypeScript 与 **ohos-typescript**（`package.json` / `bundledDependencies`）。  
  - 改动语法/类型相关逻辑时，需兼顾 ArkTS 与 OH TS fork 的差异。
2. **本地门禁**
  - **构建**：`npm run build`（PR 前建议无报错）。  
  - **测试**：`npm test` 或 `npm run testonce`（脚本已包含先 build）。  
  - **文档**：公开 API 或行为变更时运行或更新 `npm run gendoc`（输出见 `docs/api_docs`）及 `docs/` 正文。
3. **测试与资源**
  - 新增自验证：测试放 `tests/`，样例与资源放 `tests/resources/`，按场景建子目录（见仓库 `README.md`）。
4. **关联项目（HomeCheck 等）**
   - ArkTS 规则集与 `ruleSet.json` 一般在 **[HomeCheck](https://gitcode.com/openharmony-sig/homecheck.git)** 仓库；本库若不贡献规则可不改 HomeCheck。  
   - **若改动可能影响 HomeCheck 所依赖的 `arkanalyzer` API 或行为**，除本仓 UT 外，建议按下文 [HomeCheck 兼容性验证](#homecheck-兼容性验证) 跑通对端测试。

### 编程规范（必选）

5. **文件 Copyright 头**  
   - **新建**源代码文件（如 `.ts`）须在**文件最顶部**包含与仓库 `src/` 一致的 **Apache License 2.0** 版权与许可头（`/* ... */` 多行注释）。  
   - 以 `Copyright (c) … Huawei Device Co., Ltd.` 起头，含 `Licensed under the Apache License, Version 2.0` 至 `limitations under the License.` 的完整段落；**年份**与同 PR、相邻新文件或仓库惯例一致。  
   - 模板示例：`src/callgraph/algorithm/AbstractAnalysis.ts` 第 1–14 行（可从同级已有文件复制后改年份）。

6. **行宽 ≤ 160**  
   - 任意提交中的每一物理行（代码、注释、字符串字面量）长度**不超过 160 字符**；超长则换行、拆字符串、拆链式调用或提取变量/常量。  
   - Agent 生成或修改代码时默认按 **160 列**折行。

### Clean Code 与可维护性（强烈建议）

7. **结构与职责**  
   - 函数/类**职责单一**；PASS、builder、solver 等长流程拆成可测的小步骤。  
   - **控制流**：优先早退与卫语句，避免过深嵌套（难以覆盖与审查）。  
   - **命名**：与领域一致（Scene、Stmt、Cfg、MethodSignature 等），避免模糊缩写；布尔语义清晰（如 `isX` / `hasX`）。

8. **类型与接口**  
   - **公开 API/导出符号**须有明确类型；少用 `any`；必要时用 `unknown` 收窄。  
   - 可选参数、可空返回值在注释或类型中体现契约，避免调用方猜行为。

9. **重复与噪音**  
   - **复制粘贴逻辑**抽到临近的 helper，或统一到已有工具（如 `src/core/common`、`utils`）。  
   - 删除**死代码**、大段注释掉的实现；若需保留意图，用短注释 + Issue/PR link，勿长期堆积。

10. **错误与日志**  
   - 不吞异常；与仓库一致使用 **Logger**（见邻近模块 `LOG_MODULE_TYPE` 等用法），关键路径带**可检索**的上下文（模块、阶段）。  
   - `console.log` 仅作临时调试，提交前移除或改为 logger 适当级别。

### 性能与资源（强烈建议）

11. **热点路径**  
   - **Pass 遍历、CFG/图构建、指针分析/调用图**等大规模路径：注意算法阶数与内层重复遍历；能增量/缓存则写明不变量再改。  
   - 避免在循环中重复做**完整 Scene 扫描或可避免的 AST 全树遍历**；先 profile 或对照现有同类实现。

12. **空间与集合**  
   - 大 `Set`/`Map`/数组：**评估峰值**与生命周期；临时大结构用毕释放引用（便于 GC）。  
   - 字符串拼接密集处考虑 `StringBuilder` 式缓冲或数组 `join`（与其它文件风格一致）。

13. **懒计算与可读性的平衡**  
   - 昂贵计算：若引入惰性/缓存，在**代码旁简要说明**命中条件与失效条件，避免隐式全局状态导致难测 Bug。

**Node.js / TypeScript 运行时（与 11–13 并列关注）**

- **事件循环与主线程**：分析管线多为 **CPU 密集**，但仍避免在热路径使用 **同步 I/O**（如 `*Sync` 读写在循环内）及长时间阻塞主线程；大文件或批量 I/O 优先异步、分块或流式。  
- **JSON 与序列化**：高频路径避免对巨大对象反复 **`JSON.stringify` / `JSON.parse`**；可缓存、惰性生成或分段输出，减少中间大字符串峰值。  
- **模块与依赖**：依赖放在**文件顶层**静态 `import`；勿在**热循环**里动态 `require`/`import()` 或重复拼路径、读包元数据。  
- **内存与闭包**：监听、定时器、Promise 链、闭包勿**长生命周期持有** `Scene`、整图、巨型数组的引用；缓存用 `Map` 时写明上限或淘汰；可选用 **`WeakMap`/`WeakSet`** 表达「随键对象 GC」的依附关系（适用时再引入）。  
- **诊断手段**：回 regress 或争议优化时，使用 **`node --cpu-prof`、`--heap-prof`、采样或项目既有 bench**，对比前后数据；避免无测量的「微优化」。  
- **日志与观测**：热路径避免 **`console.log` 拼接大对象**（stdio 与字符串化成本高）；使用既有 **Logger** 并控制级别与体量。

### 文档与说明（强烈建议）

14. **面向使用者的文档**  
   - 行为或 CLI/配置变更：同步 **`docs/`**（QuickStart、HowTo、README 中相关段）。  
   - **API/类型**对外可见变化：运行并提交 **`npm run gendoc`** 产物（若仓库要求纳入版本管理），或说明为何不更新。

15. **代码内文档**  
   - **非显而易见**的不变量、算法前提、与 TS/ArkTS 怪异交互：用简短 **`/** ... */`** 或行注说明「为什么」，避免复述代码。  
   - 复杂分支或魔数：命名常量或注释**业务含义**。

16. **设计文档与 PR 一致**  
   - 与下文「**设计文档（独立 Markdown）**」约定一致：方案、测试方案、PR 描述随最终实现更新，避免文档与代码分叉。

---

## HomeCheck 兼容性验证

用于确认 **本仓库打包后的 `arkanalyzer`** 与上游 **[HomeCheck](https://gitcode.com/openharmony-sig/homecheck.git)** 仍兼容（规则引擎、UT 全绿）。**建议在** 可能改变对外 API/IR 行为、或 PR 审阅明确要求时执行。

| 步骤 | 操作 |
|------|------|
| 1. ArkAnalyzer 打包 | 在 **本仓库根目录** 执行 `npm pack`。会触发 `prepack`（`npm run build` + `tsc -p ./tsconfig.prod.json`），生成 `arkanalyzer-<version>.tgz`。 |
| 2. 克隆 HomeCheck | 在独立目录执行：`git clone https://gitcode.com/openharmony-sig/homecheck.git`，进入 `homecheck` 目录。 |
| 3. 安装依赖并指向本地包 | `npm i`，再执行 `npm i <arkanalyzer-tgz 的路径>`（相对/绝对路径均可，例如 `npm i ../arkanalyzer/arkanalyzer-1.0.86.tgz`）。后者会用 tarball **覆盖/安装** `package.json` 中的 `arkanalyzer` 依赖为本次构建产物。 |
| 4. 运行 HomeCheck 测试 | 在 **clone 出的 `homecheck` 根目录** 执行 `npm run test`，**全部用例须通过**。 |

**说明**：

- 若仅需验证兼容性，可使用临时克隆目录，不必提交 HomeCheck 仓库变更。  
- `npm i <tgz>` 后若锁文件变化，以 HomeCheck 侧约定为准（通常兼容性自检可不提交 lock）。  
- 设计文档的 **自测点** 可注明：已执行 HomeCheck `npm run test` 及通过情况。

---

## 新增特性推荐流程

1. **理解需求**
  - 明确模块：`core`、`pass`、`callgraph`、`save` 等；查阅 `docs/` 中术语（Scene、Cfg 等）。
2. **编写 UT（测试先行）**
  - 先写失败用例或最小样例；需要时在 `tests/resources/` 增加输入。
3. **新增特性（实现代码）**
  - 在测试 RED 后实现行为；最小化改动，风格与相邻代码一致。
4. **运行 UT**
  - 根目录：`npm test`（或 `npm run testonce` CI 友好输出）。
5. **更新文档**
  - `gendoc` / `docs/`；若影响使用者，更新 README 或 QuickStart。
6. **设计文档**
  - 按下文「**设计文档**」一节编写**一份**完整文档（可与 PR 同步迭代）。

**清单**  
`[ ] 需求边界  [ ] 编写 UT（测试先行）  [ ] 新增特性  [ ] npm test 全绿  [ ] （若影响 HomeCheck）兼容性验证  [ ] 文档同步  [ ] 设计文档已完成  [ ] Git 贡献规范（见下）`

---

## Bug 修复推荐流程

1. **编写 UT（测试先行）**
  - 先最小复现：最小输入，明确期望 vs 实际；再写成失败用例，**未修复前须稳定失败**。
2. **修复源码** — 针对根因，避免无关重构。
3. **运行 UT** — `npm test`，必要时加回归用例。
4. **设计文档** — 同上，每个 Bug 修复一份独立 MD。

**清单**  
`[ ] 编写 UT（测试先行）  [ ] 修复  [ ] npm test 全绿  [ ] 设计文档已完成  [ ] Git 贡献规范（见下）`

---

## 设计文档

**适用范围**：每一个**特性**或 **Bug 修复**须有一份**独立**的 `.md` **设计文档**，记录需求、方案、测试与 PR 素材（可与设计迭代同步更新，至 PR 合入前定稿）。

**存放建议**：`docs/developer/` 下，文件名与特性简称、Issue 编号或分支名一致，例如  
`docs/developer/<issue-or-topic>.md`（团队有固定目录时从其约定）。

**必备章节**（按顺序）：

| 章节 | 内容要求 |
|------|----------|
| **需求 / Bug 描述** | 背景、目标或非目标、复现条件（Bug）、期望行为 vs 实际 |
| **设计方案** | 选型理由、关键抽象与模块、接口/数据流、风险与兼容性 |
| **测试方案** | UT/集成/样例路径、覆盖点、如何验证回归 |
| **Commit 描述** | 建议的 commit message（subject；必要时含 body 要点），与提交一致 |
| **PR 描述** | 拆分为下列子节，可直接粘贴或略改后用于 PR 表单 |

**PR 描述**子节须包含：

1. **内容说明** — 本次交付对用户/维护者的意义，一句话与展开均可。  
2. **变更点** — 文件/模块级列表，行为或 API 变化注明 breaking 与否。  
3. **自测点** — 本地已执行的命令与结果（如 `npm run testonce`）、关键断言或截图说明。  
4. **测试关注点** — 供审阅者或 QA 重点验证的场景、边界、关联模块。

**模板**（复制后填空）：

```markdown
# <特性或 Bug 标题>

## 1. 需求 / Bug 描述

## 2. 设计方案

## 3. 测试方案

## 4. Commit 描述
<!-- 须与实际 git commit -s 一致；一特性/一 Bug 仅一条提交。示例：feat(callgraph): ... / fix(core): ... -->

## 5. PR 描述

### 1 内容说明

### 2 变更点

### 3 自测点

### 4 测试关注点
```

Agent 在特性或 Bug 流程收尾时**生成或更新**该设计文档，避免仅有代码而无可追溯说明。

---

## Git 贡献规范

1. **`git commit` 必须使用 `-s`**  
   - 提交时加 **`-s`**（`--signoff`），在提交说明末尾附加 `Signed-off-by:` 行，以满足 **DCO** 等贡献约定。  
   - 示例：`git commit -s -m "feat(callgraph): ..."`。

2. **一特性 / 一 Bug 对应一个 commit**  
   - 本地开发可有多次暂存提交；**推送到远端或发起 PR 前**，须整理为**单个** commit（例如 `git rebase -i` 交互压缩，或 `git reset --soft` 至目标基线后一次 `commit -s`）。  
   - **禁止**同一 PR 夹带无关的多条杂乱历史（除非维护者明确要求拆分，以项目指南为准）。

3. **在开发者 fork 上建分支并 push**  
   - 从**社区上游**（如 `openharmony-sig/arkanalyzer`）**Fork** 到个人/企业命名空间后，在 **fork 仓库** 侧创建功能分支（勿直接向无写权限的上游分支强推）。  
   - 推送目标为 **fork 的远程**及该分支，例如：`git push <fork-remote> <branch>`，再在 GitCode 上从 fork 分支向上游提 PR。

4. **Fork 远程地址**  
   - 若本地仅有 `origin` 且指向**上游**、无法 push，可由维护者/Agent **提示贡献者**配置 fork：  
     - `git remote add myfork git@gitcode.com:<你的用户名>/arkanalyzer.git`（HTTPS 同理）  
     - `git fetch myfork`  
     - 在本地分支上 `git push -u myfork <branch>`。  
   - **命名可自定**（`myfork`、`fork` 等），与 `git remote -v` 一致即可。

---

## 跨 Agent 安装提示

- **本仓库**：Skill 源文件在 `skills/arkanalyzer-dev/`；
- **全局 Cursor**：将 `arkanalyzer-dev` 整目录复制到 `~/.cursor/skills/`。  
- **Codex CLI**：将 `arkanalyzer-dev` 复制到 **`$CODEX_HOME/skills/`** 下，保持 `SKILL.md` 在子目录中。  
  未设置 `CODEX_HOME` 时，以本机 Codex 文档或内置 **skill-installer** 所述默认路径为准。  
- **其他 Agent**：支持「按目录加载 `SKILL.md`」的工具，将本目录加入其 skills 搜索路径即可。

---

## 延伸阅读

- [reference-architecture.md](reference-architecture.md)

