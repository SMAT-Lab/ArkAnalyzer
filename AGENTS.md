# AGENTS.md

面向 AI 编程助手的仓库级指导。人同样适用。

## 项目简介

ArkAnalyzer 是一个基于 TypeScript 的静态分析框架，支持 ArkTS/TypeScript 与 C++ 源码的代码模型构建、IR 生成与类型推导。核心概念：Scene（场景）→ ArkFile/ArkClass/ArkMethod/ArkField（模型）→ 三地址码 IR → 类型推导（多轮迭代）。

## 常用命令

| 任务 | 命令 |
|---|---|
| 类型检查 | `npx tsc --noEmit` |
| TS 单测（不含 C++ 侧） | `npx vitest run --exclude tests/unit/cppCore` |
| 全量测试 | `npm run testonce` |
| 构建 | `npm run build` |
| 格式化 | `npm run format` |
| 格式检查 | `npm run format:check` |
| 生成文档 | `npm run gendoc` |

说明：

- C++ 侧测试（`tests/unit/cppCore`）需要本机配置 LLVM/Clang 环境，未配置时跳过。
- 修改 `src/` 下代码后，至少运行 `npx tsc --noEmit` 与受影响模块的定向测试，再跑全量。
- 基线：全量回归应保持仅存既有环境问题（ModuleBuilder symlink EPERM），不引入新失败。

## 目录结构

- `src/` — 源码。`core/`（模型与推导核心）、`frontend/`（TS/C++ 前端构建）、`save/`（IR/源码打印）、`utils/`（工具）、`cli/`（命令行入口）。
- `tests/unit/` — 单元测试；`tests/resources/` — 测试输入资源与期望文件。
- `openspec/` — 设计文档与变更管理（proposal/design/spec/tasks）。
- `packages/` — 子包（C++ AST parser）。

## 代码风格

遵循 `.prettierrc`：4 空格缩进、单引号、分号、printWidth 160、尾逗号 es5。提交前运行 `npm run format:check`。

命名约定：

- 类名/接口名：`ArkXxx`（模型类）、`XxxBuilder`（构建器）、`XxxInference`（推导器）。
- 文件名与类名一致（如 `ArkClass.ts` 导出 `ArkClass`）。
- 签名相关基础设施在 `src/core/common/`（SignatureCanonicalizerRegistry 及相关）。

## 注释规范（强制）

- 除非用户明确要求，否则**禁止添加任何代码注释**。
- 代码本身应通过命名和结构实现自注释，不写"// 初始化变量"这类废话。
- 禁止将任务编号、迭代版本号、设计文档引用写入代码注释。这些信息属于提交信息和文档，不属于代码。
- 只在以下情况允许写注释：代码存在**非显而易见的逻辑**（如算法意图、边界条件、反直觉的 workaround），且无法通过重构消除歧义。

## 测试约定

- 测试框架：vitest。一个测试文件对应一个被测模块，命名为 `Xxx.test.ts`。
- 测试资源放 `tests/resources/`，期望 IR/输出以常量形式写在 `XxxExpect.ts` 或测试文件内。
- 修复 bug 时应附上能复现该 bug 的最小用例（资源 + 断言），防止回归。
- 全局单例（`SignatureCanonicalizerRegistry`）在多 Scene 测试间需要手动 `dispose()`，参见 `tests/unit/common.ts` 的 `buildScene` 模式。

## 其他约束

- 公共 API 变更需保持向后兼容；废弃接口标 `@deprecated` 并说明替代方案。
- 不要主动提交代码，除非用户明确要求。
