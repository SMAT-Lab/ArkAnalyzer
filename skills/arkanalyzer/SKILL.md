---
name: arkanalyzer
description: >-
  ArkAnalyzer 是面向 ArkTS 语言的静态程序分析框架；本 skill 面向 Agent 快速路由，提供 CLI 与 API 两种能力入口。
  简单任务优先走 CLI（cg/ir），复杂任务通过生成并执行 API 代码完成。
  建议触发词：ArkTS、静态分析、调用图、可达性、IR、cg、ir、Scene、CallGraphBuilder（详细参数与策略见二层子 skill）。
---

# ArkAnalyzer Skill（快速上手）

## 1) 先做路由决策

- **调用关系 / 可达性问题**（如“函数 A 会不会调到 B”）→ 用 `cg`
- **导出 IR / JSON / DOT 产物** → 用 `ir`
- **多步骤自定义分析**（先构建 Scene、再多轮分析）→ 用 API（由模型生成并执行代码）

## 2) 最小可执行模板

```bash
# 查看命令
npx arkanalyzer --help
npx arkanalyzer cg --help
npx arkanalyzer ir --help

# 调用图 / 可达性
npx arkanalyzer cg <input> -a rta -f json

# IR 导出
npx arkanalyzer ir <input> -f text -o ./out
```

> `<input>` 为工程根目录（ArkTS/TS 项目）。

## 3) 能力速查（CLI）

| 命令 | 用途 | 常用示例 |
|------|------|----------|
| `arkanalyzer cg <input> [options]` | 调用图构建、可达性分析、调用边导出 | `arkanalyzer cg ./myapp -a rta -f json` |
| `arkanalyzer ir <input> [options]` | 导出中间表示（IR），支持 text / json / dot | `arkanalyzer ir ./myapp -f text -o ./out` |

## 4) API 能力（复杂任务）

- 当 CLI 不足以表达目标时，模型可通过**构建并执行代码**完成：
  - `Scene` / `SceneConfig`：构建分析场景
  - `CallGraph` / `CallGraphBuilder`：构建与遍历调用图
- 典型模式：`构建 Scene -> 选算法构图 -> 过滤/查询 -> 输出结果`

## 5) 二层子 skill（详细参数与策略）

- `skills/arkanalyzer/skills/cg.md`
  - `cg` 参数、方法引用规则、输出格式语义、典型查询流程
- `skills/arkanalyzer/skills/ir.md`
  - `ir` 参数、输出目录约定、格式选择、stdout JSON 摘要

## 6) 使用约束（避免误用）

- 先尝试 CLI，只有在“需要编排流程/组合分析”时再走 API。
- `cg` 仅支持 `cha` 与 `rta` 两种算法。
- `--ohos-sdk-home` 未设置时，回退读取环境变量 `OHOS_SDK_HOME`。
