# 数据流分析（IFDS）

## 1. 概述

**IFDS（Interprocedural, Finite, Distributive, Subset）** 是 Reps、Horwitz、Sagiv 在 1995 年提出的一个**过程间数据流分析框架**：只要待解的问题满足 4 个性质——过程间（Interprocedural）、有限（Finite）格、可分配（Distributive）、子集（Subset）——就能用统一的 worklist 算法在 **O(N · D³)** 时间内精确求解（N 是 Stmt 数，D 是数据 fact 数量）。

ArkAnalyzer 的 IFDS 实现在 [src/core/dataflow/](../../src/core/dataflow/) 下，提供：

- 抽象基类 [`DataflowProblem<D>`](../../src/core/dataflow/DataflowProblem.ts)：用户继承并实现 4 个 **流函数**（FlowFunction）即可完成自定义分析。
- 求解器 [`DataflowSolver<D>`](../../src/core/dataflow/DataflowSolver.ts)：基于 PathEdge worklist，调用 4 类流函数完成求解。
- 现成 checker：[`UndefinedVariableChecker`](../../src/core/dataflow/UndefinedVariable.ts) 等。

> 运行 IFDS 前必须先 `scene.inferTypes()`：流函数中通常需要按 `Local` / `ArkAssignStmt` / `ArkInvokeStmt` 等类型识别 IR 形态，类型推导给出的 `MethodSignature` 也是过程间走向的基础。

## 2. 算法流程

IFDS 把每个 Stmt + 一个 fact `d` 抽象成 "图节点 `(stmt, d)`"，再用 4 类流函数定义节点间的"流可达"边集，最终求解 **PathEdge 集合** —— 即"从入口 `(s_main, 0)` 出发能流到的所有 `(stmt, d)`"。

求解器流程（简化）：

```text
worklist  := { PathEdge((entry, 0), (entry, 0)) }
while worklist != ∅:
  edge := pop()
  let (s_p, d_p) = edge.start
  let (s,   d)   = edge.end
  switch s:
    case 调用:                         // call → callee_entry
        for callee in callees(s):
            FF_call = getCallFlowFunction(s, callee)
            for d' in FF_call(d):
                propagate( (callee_entry, d') )
        FF_call2ret = getCallToReturnFlowFunction(s, return_site)
        for d' in FF_call2ret(d):
            propagate( (return_site, d') )
    case exit:                         // 把方法出口 fact 拼回 caller 的 return site
        for callerEdge connected to s:
            FF_exit2ret = getExitToReturnFlowFunction(s, return_site, call_stmt)
            for d' in FF_exit2ret(d):
                propagate( (return_site, d') )
    default:                           // 普通顺序边
        for tgt in succ(s):
            FF_normal = getNormalFlowFunction(s, tgt)
            for d' in FF_normal(d):
                propagate( (tgt, d') )
```

`propagate` 把新发现的 `(tgt, d')` 与"当前方法入口 + zero fact"配成新 PathEdge 加入 worklist；已经存在的不重复入队，因此终止条件是 PathEdge 集合稳定。

### 2.1 自定义示例：可能除零检查

下面是 [tests/samples/IFDStest.ts](../../tests/samples/IFDStest.ts) 中的 `PossibleDivZeroChecker`：fact 类型为 `Local`，意为"该 Local 当前可能是 0"。

```typescript
// 源码（被分析的工程）
function compute(a: number, b: number): number {
    let x = 0;
    let y = a;
    return y / x;       // <- 除零！x 一直是 0
}
```

**关键流函数实现**（节选自示例）：

```typescript
// Normal flow：在直筒语句中追踪"哪个 Local 可能为 0"
getNormalFlowFunction(srcStmt, tgtStmt): FlowFunction<Local> {
    return {
        getDataFacts(d: Local): Set<Local> {
            const ret = new Set<Local>();
            if (srcStmt === entryPoint && d === zeroValue) {
                // 入口：把每个参数 Local 都加入 fact 集
                for (const para of [...method.getCfg()!.getBlocks()][0]
                                       .getStmts().slice(0, paramCount)) {
                    if (para.getDef() instanceof Local) ret.add(para.getDef());
                }
                ret.add(zeroValue);
                return ret;
            }
            if (srcStmt.getDef() !== d) ret.add(d);             // 标识函数

            if (srcStmt instanceof ArkAssignStmt) {
                const lhs = srcStmt.getLeftOp() as Local;
                const rhs = srcStmt.getRightOp();
                if (d === zeroValue && isLiteralZero(rhs))      ret.add(lhs); // x = 0
                else if (rhs === d)                             ret.add(lhs); // x = d
                else if (rhs instanceof AbstractBinopExpr
                         && rhs.getOperator() === '/') {
                    const divisor = rhs.getOp2();
                    if (divisor === d || isLiteralZero(divisor)) {
                        // ⚠️ 报警：除数可能为 0
                        console.log(`!!! ${srcStmt} at ${srcStmt.getOriginPositionInfo()}`);
                    }
                }
            }
            return ret;
        }
    };
}
```

求解：

```typescript
const problem = new PossibleDivZeroChecker(
    [...method.getCfg()!.getBlocks()][0].getStmts()[method.getParameters().length],
    method
);
class S extends DataflowSolver<Local> {
    constructor(p, scene) { super(p, scene); }
}
new S(problem, scene).solve();
```

控制台会输出：

```text
divison instruction with zero divisor is detected!
y / x
{ line: ..., column: ... }
```

完整代码见 [tests/samples/IFDStest.ts](../../tests/samples/IFDStest.ts)。

## 3. 核心数据结构

### 3.1 DataflowProblem&lt;D&gt;

```typescript
// src/core/dataflow/DataflowProblem.ts
export abstract class DataflowProblem<D> {
    abstract getNormalFlowFunction(srcStmt: Stmt, tgtStmt: Stmt): FlowFunction<D>;
    abstract getCallFlowFunction(srcStmt: Stmt, method: ArkMethod): FlowFunction<D>;
    abstract getExitToReturnFlowFunction(srcStmt: Stmt, tgtStmt: Stmt, callStmt: Stmt): FlowFunction<D>;
    abstract getCallToReturnFlowFunction(srcStmt: Stmt, tgtStmt: Stmt): FlowFunction<D>;

    abstract createZeroValue(): D;
    abstract getEntryPoint(): Stmt;
    abstract getEntryMethod(): ArkMethod;
    abstract factEqual(d1: D, d2: D): boolean;
}

export interface FlowFunction<D> {
    getDataFacts(d: D): Set<D>;
}
```

| 抽象方法 | 何时被调用 | 直观语义 |
|---------|-----------|---------|
| `getNormalFlowFunction(s, t)` | 普通顺序边 `s → t` | 在直筒语句上传播 fact |
| `getCallFlowFunction(s, callee)` | `s` 是调用语句、跨入 `callee` 入口时 | 把实参 fact 映射到形参 fact |
| `getExitToReturnFlowFunction(exit, retSite, callStmt)` | 被调方法的 exit 退出后，回到调用点的 retSite | 把返回值 fact 映射到调用左值 fact |
| `getCallToReturnFlowFunction(s, retSite)` | 调用语句的"被忽略"边（绕过 callee） | 透传到调用后的 retSite |
| `createZeroValue()` | 求解器初始化 | 提供 `0` fact，用于触发"任意位置传播任意 fact"的种子 |
| `getEntryPoint()` / `getEntryMethod()` | 求解器初始化 | 入口 |
| `factEqual(d1, d2)` | 加入 worklist 时去重 | 等值判断 |

### 3.2 DataflowSolver&lt;D&gt;

```typescript
// src/core/dataflow/DataflowSolver.ts
export abstract class DataflowSolver<D> {
    constructor(problem: DataflowProblem<D>, scene: Scene);
    public  solve(): void;
    public  getPathEdgeSet(): Set<PathEdge<D>>;
}
```

| 方法 | 说明 |
|------|------|
| `solve()` | 启动求解；内部维护 worklist + PathEdge 集合 |
| `getPathEdgeSet()` | 求解结束后取 `PathEdge` 全集，可遍历得到所有"在某 Stmt 上 fact 成立"的事实 |

求解器把过程间调用通过 [`Scene`](../components/Scene.md) + [`CallGraph`](./CallGraph.md) 解析；因此调用前后的"哪些 callee 在该位置可能被调"实际就是 CG 给出的边集。

### 3.3 PathEdge / PathEdgePoint

```typescript
// src/core/dataflow/Edge.ts
export class PathEdgePoint<D> {
    public node: Stmt;
    public fact: D;
}

export class PathEdge<D> {
    public edgeStart: PathEdgePoint<D>;     // 当前过程入口处的种子
    public edgeEnd:   PathEdgePoint<D>;     // 已传播到的位置
}
```

每条 `PathEdge` 表达"某方法入口的 fact `d_p` 一路传播到 `(stmt, d)`"。最终结果就是这一集合。

### 3.4 现成 checker：UndefinedVariableChecker

[`UndefinedVariableChecker`](../../src/core/dataflow/UndefinedVariable.ts) 演示了"未初始化变量检测"的端到端实现：fact 类型为 `Value`，`createZeroValue()` 返回一个特殊哨兵 Value，`getNormalFlowFunction` 在 `ArkAssignStmt` 处把"已定义"的 fact 移除等等。可作为编写其他 checker 的最小模板。

## 4. 典型应用场景

### 4.1 安全 / Taint

把 fact 设为 `Local`（或更细粒度的 `Value`），从所有 source 处把 fact 注入；流函数沿 `lhs = rhs` 把 taint 从右值传到左值；遇到 sink（如 `eval(x)` / `exec(query)`）就报告。

### 4.2 空指针 / 未初始化

如示例所示，专门追踪 `null`、`undefined`、`zero` 这类哨兵值。

### 4.3 常量传播 / 区间分析

把 fact 设为 `(Local, 区间)`，流函数按 IR 算术规则更新区间。注意此时 `factEqual` 必须实现区间相等，否则会无限传播。

### 4.4 Resource Leak / 状态机

把 fact 设为 `(Local, State)`：`new` 把状态置为 OPEN，`close()` 调用置为 CLOSED；exit 时仍为 OPEN 即报泄漏。

### 4.5 与其他分析互补

- **CallGraph**：IFDS 求解的过程间边由 [CallGraph](./CallGraph.md) 提供——CG 越精确，IFDS 越准。
- **Def-Use Chain**：很多简单分析（如简单 taint）可以用 [Def-Use Chain](./Def-Use%20Chain.md) 直接编写而无需走 IFDS；但当存在过程间、字段读写、条件分支时，IFDS 的精确性优于纯 chain 反向回溯。

## 5. 使用示例

最小骨架（pseudo）：

```typescript
import {
    Scene, SceneConfig, ModelUtils,
    DataflowProblem, DataflowSolver, FlowFunction,
    Local, Value, ArkAssignStmt, Stmt, ArkMethod,
} from 'arkanalyzer';

class MyChecker extends DataflowProblem<Value> {
    private zero = new Local('@@zero');
    constructor(private entry: Stmt, private method: ArkMethod) { super(); }

    createZeroValue() { return this.zero; }
    getEntryPoint()   { return this.entry; }
    getEntryMethod()  { return this.method; }
    factEqual(a, b)   { return a === b; }

    getNormalFlowFunction(s, t): FlowFunction<Value> {
        return { getDataFacts: (d) => {
            const out = new Set<Value>();
            // …按 IR 形态决定怎样从 s 的 in-set 推出 t 的 in-set …
            out.add(d);
            return out;
        }};
    }
    getCallFlowFunction(s, m): FlowFunction<Value>          { return { getDataFacts: (d) => new Set([d]) }; }
    getExitToReturnFlowFunction(s, t, cs): FlowFunction<Value> { return { getDataFacts: (d) => new Set([d]) }; }
    getCallToReturnFlowFunction(s, t): FlowFunction<Value>   { return { getDataFacts: (d) => new Set([d]) }; }
}

class MySolver extends DataflowSolver<Value> {
    constructor(p, scene) { super(p, scene); }
}

const config = new SceneConfig();
config.buildFromProjectDir('tests/resources/ifds/Div0');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes();

const dflt = scene.getFiles()[0].getDefaultClass().getDefaultArkMethod()!;
const main = ModelUtils.getMethodWithName('main', dflt)!;
const entryStmt = [...main.getCfg()!.getBlocks()][0].getStmts()[main.getParameters().length];

const solver = new MySolver(new MyChecker(entryStmt, main), scene);
solver.solve();

// 反向取结果
for (const edge of solver.getPathEdgeSet()) {
    console.log(`fact ${edge.edgeEnd.fact} reaches ${edge.edgeEnd.node}`);
}
```

> 完整可运行示例：[tests/samples/IFDStest.ts](../../tests/samples/IFDStest.ts)（PossibleDivZeroChecker）、[tests/samples/UndefinedVariableTest.ts](../../tests/samples/UndefinedVariableTest.ts)、[tests/samples/ReachingDefTest.ts](../../tests/samples/ReachingDefTest.ts)（基于 `MFPDataFlowSolver` 的另一种通用框架）。
