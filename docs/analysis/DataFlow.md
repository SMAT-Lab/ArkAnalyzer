# 数据流分析（过程内）

本文档描述 ArkAnalyzer **当前主线对外导出**的过程内数据流能力：`GenericDataFlow` 通用框架、`MFPDataFlowSolver` 求解器，以及内置的 **到达定值（Reaching Definitions）** 分析。

过程间 IFDS 类扩展常见于社区工具链（例如 HomeFlow）；与本仓库导出 API 不完全一致时，请以 [`src/index.ts`](../../src/index.ts) 为准。

## 1. 通用框架：`DataFlowProblem` 与 `MFPDataFlowSolver`

模块 [`GenericDataFlow.ts`](../../src/core/dataflow/GenericDataFlow.ts) 提供：

| 概念 | 说明 |
|------|------|
| `FlowGraph<Node>` | 数据流图的结点与前驱 / 后继关系 |
| `TransferFunction<Node, V>` | 将每个结点的 **in** 集映射为 **out** 集 |
| `meet` | 汇合多条路径时的交汇运算（例如到达定值用并集） |
| `MFPDataFlowSolver` | 基于不动点迭代求解 **MFP**（最大不动点）近似 |

典型用法：

1. 实现或使用已有的 `DataFlowProblem`（包含流图、传递函数、`meet`、`initIn` / `initOut`、`forward`、`empty`）。
2. 构造 `MFPDataFlowSolver`，按需调用 `calculateMopSolutionForwards`（前向）或 `calculateMopSolutionBackwards`（后向）。
3. 从返回的 `Solution` 中读取每个结点上的 `in` / `out` 映射。

## 2. 内置示例：到达定值（Reaching Definitions）

[`ReachingDef.ts`](../../src/core/dataflow/ReachingDef.ts) 在单个 `ArkMethod` 上，以 CFG 上的 **语句** 为结点，计算每条语句出口处「仍可能未被后续赋值杀死」的定义集合（保守近似）。

从 npm 包引用时：

```typescript
import { ReachingDefProblem, MFPDataFlowSolver } from 'arkanalyzer';

const problem = new ReachingDefProblem(method);
const solver = new MFPDataFlowSolver();
const solution = solver.calculateMopSolutionForwards(problem);

solution.out.forEach((defs, nodeId) => {
  // defs 为 SparseBitVector，可用 count() 等接口检视规模
});
```

完整可运行示例见仓库内 [`tests/samples/ReachingDefTest.ts`](../../tests/samples/ReachingDefTest.ts)。

## 3. 与其它分析的关系

- **必须先执行** `scene.inferTypes()`（与其它静态分析一致），再构造方法级数据流问题。
- **Def-Use Chain**（[`Def-Use Chain.md`](./Def-Use%20Chain.md)）侧重变量定义与使用的链式关系；到达定值则从「定义集合在何处可见」的角度建模，可与自定义检查组合使用。

## 4. 相关入口

- [快速入门](../QuickStart.md) 第 4.5 节「数据流分析（到达定值）」
- API：运行 `npm run gendoc` 后，在 [`api_docs/globals.md`](../api_docs/globals.md) 中检索 `MFPDataFlowSolver`、`ReachingDefProblem`。
