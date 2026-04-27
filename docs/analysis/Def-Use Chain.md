# 定义-使用链（Def-Use Chain）

## 1. 概述

**定义-使用链（Def-Use Chain）** 是把"某个值在哪条 Stmt 被定义（def）、又在哪些 Stmt 被使用（use）"显式连成边的反向辅助索引。它是几乎所有数据流分析的基础结构：

- 反向数据流（如未初始化变量、空指针检查）从 use 反查 def。
- 前向数据流（如常量传播、taint 传播）从 def 反查所有 use。
- 死代码识别 / 变量重命名 / 值替换：以 use-set 为最小变更单位。

ArkAnalyzer 在 [CFG](../components/CFG.md) 上以 **per-method、按 use 反向回溯** 的方式构建 Def-Use Chain，结果以 [`DefUseChain`](../../src/core/base/DefUseChain.ts) 三元组形式存放在 `Cfg.defUseChains` 字段中。建链是**懒构建**的——只有显式调用 `cfg.buildDefUseChain()` 才会触发。

> 调用 `Cfg.buildDefUseChain()` 之前应先确保 `scene.inferTypes()` 已完成；类型推导后 `Local` 与 `Ref` 的命名才稳定（参见 [TypeInference.md](./TypeInference.md)）。

## 2. 分析流程

### 2.1 构建原理

每条 Def-Use 链是一个三元组：

```typescript
class DefUseChain {
    value: Value;     // 被引用的值（多数情况下是 Local；也可以是某些 Ref 的派生）
    def:   Stmt;      // 该值最近一次的定义点
    use:   Stmt;      // 当前的使用点
}
```

构建算法位于 [`Cfg.buildDefUseChain`](../../src/core/graph/Cfg.ts)，整体只有一个外层循环：

```text
for each block:
  for each stmt (按块内顺序):
    for each value in stmt.getUses():
       handleDefUseForValue(value, block, stmt, idx)
```

`handleDefUseForValue` 的回溯过程：

1. **块内倒序扫描**：从 `stmt` 起向上找到第一个 `Stmt.getDef()` 与当前 use 同名的语句，命中则记一条 `DefUseChain` 即可结束。
2. **跨块 BFS 回溯**：若块内没有 def，则把所有前驱块入队，倒序扫每个前驱块；每条路径上**最近的 def** 命中即停。
3. **多 def 合并**：当 BFS 走过分支时，会从多条路径分别命中各自的 def——它们会**并列**出现在 `defUseChains` 数组中（每条 def 都会与同一个 use 配出一条独立链）。这是把"多 def 合并"的一种保守表达，等价于不显式构造 SSA `φ` 节点。

### 2.2 示例：分支下的多 def 合并

```typescript
// 源码
function f(c: boolean) {
    let x: number;
    if (c) { x = 1; } else { x = 2; }
    return x;
}
```

```typescript
// ArkIR（简化）
label0:
    this = this: @F: %dflt
    c = parameter0: boolean
    if c == true goto label1 label2

label1:
    x = 1                  // def#1
    goto label3

label2:
    x = 2                  // def#2
    goto label3

label3:
    return x               // use
```

`buildDefUseChain()` 后，`defUseChains` 会包含：

```text
{ value: x, def: x = 1, use: return x }
{ value: x, def: x = 2, use: return x }
```

两条链分别对应分支两侧的最近 def——并不构造单独的 `φ` 节点。下游分析需要意识到：在多前驱场景下，**同一个 (value, use)** 可对应**多个 def**。

### 2.3 示例：循环下的回边

```typescript
// 源码
function f(): number {
    let s = 0, i = 0;
    while (i < 10) { s = s + i; i = i + 1; }
    return s;
}
```

`s = s + i` 既是 def 又是 use；`buildDefUseChain` 在回边上能找到 **本块内** 的 def，也能从 **循环条件块** 的前驱回溯到初始化块的 `s = 0`：

```text
{ value: s, def: s = 0,        use: s = s + i }   // 第一次进入循环
{ value: s, def: s = s + i,    use: s = s + i }   // 回边
{ value: s, def: s = 0,        use: return s }    // 循环根本不进入时
{ value: s, def: s = s + i,    use: return s }    // 循环至少进入一次
```

### 2.4 与 SSA 的关系

ArkAnalyzer 当前**不**显式构造 SSA：每个 `Local` 仍可能被多次赋值，多 def 时由 `defUseChains` 里多条独立链来表达"汇合"。如需 SSA：

- 用 `Local.getDeclaringStmt()` 取**唯一首次** def（仅当 IR 转换器为该 Local 仅赋值一次时有意义；通常临时 `%N` 满足此条件，命名 Local 不一定）。
- 用 `Local.getUsedStmts()` 取所有 use（与 `defUseChains` 中以该 Local 为 `value` 的链等价但没有 def 信息）。

## 3. 核心数据结构

### `DefUseChain`

```typescript
// src/core/base/DefUseChain.ts
export class DefUseChain {
    value: Value;     // Local（或派生引用）
    def:   Stmt;      // 定义点
    use:   Stmt;      // 使用点
}
```

仅 3 个公共字段，无方法。语义靠周边 API 给出。

### Cfg 上的入口

```typescript
// src/core/graph/Cfg.ts
class Cfg {
    private defUseChains: DefUseChain[] = [];
    public buildDefUseChain(): void;          // 构建（懒）
    public getDefUseChains(): DefUseChain[];  // 取已构建结果
}
```

### Local 上的反向索引（不依赖 buildDefUseChain）

```typescript
// src/core/base/Local.ts
class Local {
    private declaringStmt: Stmt | null;       // 首次 def
    private usedStmts: Stmt[];                // 所有 use
    public getDeclaringStmt();
    public getUsedStmts();
    public addUsedStmt(stmt: Stmt);
}
```

> Local 上 `usedStmts` 是 IR 转换期就直接维护的，构建 CFG 后即可用；与 `cfg.buildDefUseChain()` 维护的 chain 数据是**互补**关系。

### Stmt 侧的钩子

| 方法 | 说明 |
|------|------|
| `Stmt.getDef(): Value \| null` | 仅 `ArkAssignStmt` 非 null（参见 [Stmt §3](../components/Stmt.md#3-stmt-和各-ir-基础元素的关系)） |
| `Stmt.getUses(): Value[]` | 该 Stmt 内所有"读"出现，含递归展开（如 BinopExpr 的左右操作数、调用的实参、Ref 的 base / index 等） |

## 4. 典型应用场景

### 4.1 未初始化变量检测

按 use 反向回溯，若 BFS 走完所有前驱仍未命中 def，则报告"在 use 处可能未初始化"。`Cfg.getUnreachableBlocks()` 还可帮助过滤死代码内的误报。

### 4.2 Taint 传播 / 常量传播

把所有 def 标 taint，再沿 chain 把标记前向传到对应 use；遇到 sink 即报告。常量传播则相反——把 def 处的字面量沿 chain 复制到 use 上。`taint` 与 `常量传播` 都是 [IFDS](./IFDS.md) 的特例，但实现上可直接基于 def-use chain 编写。

### 4.3 死代码 / 不可达赋值

某条 `ArkAssignStmt` 的 `lhs` 没有任何 chain 把它当 def 引用 → 表示后续无人使用，可安全删除（须额外排除"对外部对象的副作用"，例如字段 / 数组写）。

### 4.4 与 CallGraph 协同

调用点的实参 use 链回到 def 后，可用其类型 / 字面量去精化 CallGraph 的可达目标——这通常是 [RTA](./CallGraph.md#22-rapid-type-analysisrta) 之上的 enhancement。

### 4.5 重命名 / 重写

替换某个 Local 时，先取它的所有 chain，分别 `replaceUse(old, new)` 在每个 use Stmt 上即可；`replaceDef` 反之。

## 5. 使用示例

### 5.1 标准用法

```typescript
import { Scene, SceneConfig, DEFAULT_ARK_METHOD_NAME } from 'arkanalyzer';

const config = new SceneConfig();
config.buildFromProjectDir('tests/resources/defUseChain');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes();

for (const arkFile of scene.getFiles()) {
    for (const arkClass of arkFile.getClasses()) {
        for (const arkMethod of arkClass.getMethods()) {
            if (arkMethod.getName() === DEFAULT_ARK_METHOD_NAME) continue;
            const cfg = arkMethod.getBody()?.getCfg();
            if (!cfg) continue;

            cfg.buildDefUseChain();        // 触发构建
            for (const ch of cfg.getDefUseChains()) {
                console.log(
                    `value: ${ch.value}, def: ${ch.def}, use: ${ch.use}`
                );
            }
        }
    }
}
```

### 5.2 Local 视角

```typescript
import { Local } from 'arkanalyzer';

const cfg = scene.getMethods()[0].getCfg()!;
for (const stmt of cfg.getStmts()) {
    const def = stmt.getDef();
    if (def instanceof Local) {
        const uses = def.getUsedStmts();
        console.log(`def ${def.getName()} @ ${stmt}  -> ${uses.length} uses`);
    }
}
```

### 5.3 反向：从 use 找 def

```typescript
function findDefsForUseStmt(cfg, useStmt) {
    cfg.buildDefUseChain();
    return cfg.getDefUseChains()
        .filter(c => c.use === useStmt)
        .map(c => c.def);
}
```

> 完整可运行示例可参考：[tests/samples/DefUseChainTest.ts](../../tests/samples/DefUseChainTest.ts)。
