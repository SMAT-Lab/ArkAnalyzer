# Agent Skills（本仓库）

本目录存放面向编码 Agent 的 **Skill**。

| 子目录 | Skill 名（YAML `name`） | 说明 |
|--------|-------------------------|------|
| `arkanalyzer-dev/` | `arkanalyzer-dev` | ArkAnalyzer 本仓开发导读：目录、门禁、特性/Bug 流程、测试与文档 |

- **Cursor**：通过 **Rules / Skills** 加载后，可用 `@` 引用 skill；本仓库内 `.cursor/skills/` 与 `skills/` 应对齐（符号链接或复制）。  
- **Codex CLI**：可复制到 **`$CODEX_HOME/skills/arkanalyzer-dev/`**。  


---

## 如何触发 Skills

| 方式 | 说明 |
|------|------|
| **显式 @** | 在对话里选择 **`@arkanalyzer-dev`**，再写任务描述，命中率最高。 |
| **@ 文件** | 使用 **`@skills/arkanalyzer-dev/SKILL.md`**把全文衬在上下文里。 |
| **关键词** | 见下文样例：出现 ArkAnalyzer、Scene/Cfg、`npm test`/`testonce`、设计文档、HomeCheck 等时，模型更容易匹配并读取 skill。 |
| **项目规则** | 在 `.cursor/rules` 或 `AGENTS.md` 中写「改 `src/` 时先遵循 `arkanalyzer-dev`」，可减少漏读。 |

---

## 提示词样例（按场景）

以下为 **`arkanalyzer-dev`** 的典型触发说法，可直接复制改写；必要时句首加 **`@arkanalyzer-dev`**。

### 通用 / 首次接触仓库

- 按 ArkAnalyzer 仓库规范，说明 `src/core` 和 `callgraph` 各自负责什么，改 IR 要先看哪里？
- 要给 ArkAnalyzer 提 PR，本地门禁要跑哪些命令？`npm test` 和 `testonce` 区别是什么？

### 新特性

- 在 ArkAnalyzer 里加一个 **Pass/数据流** 能力：先按 skill 里的**特性流程**写测试和 `docs/developer/` 设计文档再改代码。

### Bug 修复

- 按 **Bug 修复推荐流程** 修复 ArkAnalyzer 中影响性能/内存泄漏的 bug

### 性能 / 内存 / 运行时

- 修好 ArkAnalyzer 里 **长驻进程内存涨** 的问题：注意 `Scene.dispose()`、模块级 `Map`、不要在 `buildAllMethodBody` 回调里误清 `moduleMap`。

### 文档与 API

- 公开 API 变了，请更新 docs

### HomeCheck / 上游兼容

- ArkAnalyzer 改完了，执行 **HomeCheck 兼容性验证**

### Git / 贡献流程

- 按Git贡献规范提交并推送新增特性代码

---

## 扩展更多 Skill 时

若今后在本目录增加子目录（如 `xxx/SKILL.md`），请在本 README 的表格中登记 **`name` 与说明**，并在此处补充对应的 **@ 名** 与 **提示词样例**，便于贡献者一致触发。
