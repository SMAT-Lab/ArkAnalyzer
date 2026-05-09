# 控制流图（CFG）

## 1. 概述

**控制流图（Control Flow Graph，CFG）** 是 ArkAnalyzer 在方法体（[ArkBody](./ArkBody.md)）层面组织 ArkIR 的核心结构。它把方法体内的所有 [Stmt](./Stmt.md) 划分成若干 **基本块（[BasicBlock](#3-核心数据结构)）**，并通过有向边显式表达基本块间的控制流转移关系。CFG 同时是 [Def-Use Chain](../analysis/Def-Use%20Chain.md)、[CallGraph](../analysis/CallGraph.md)、[IFDS](../analysis/IFDS.md) 等多种静态分析的输入。

ArkAnalyzer 中每个 `ArkMethod` 经过 IR 转换后都会生成一个唯一的 `Cfg`，可通过 `arkMethod.getBody()?.getCfg()` 获取。CFG 中的边分两类：

- **常规控制流边（successor / predecessor）**：顺序执行、分支跳转、循环回边等。
- **异常控制流边（exceptionalSuccessor / exceptionalPredecessor）**：`try` 块到 `catch` 块的边，仅在 `try/catch/finally` 结构中出现。

## 2. ArkIR

CFG 的文本形式以 `label<id>:` 标签开头标识每个基本块，块内顺序列出 Stmt，块尾常以 `goto`、`if … goto labelT labelF`、`return`、`throw` 中之一结尾。下面以五种典型控制结构展示其 ArkIR 形态。

### 2.1 顺序执行

最简单的"直筒"流程：所有 Stmt 串成一个块，仅起始块至结束块一条边。

```typescript
// 源码
function add(a: number, b: number): number {
    let c = a + b;
    return c;
}
```

```typescript
// ArkIR
label0:
    this = this: @F: C
    a = parameter0: number
    b = parameter1: number
    c = a + b
    return c
```

### 2.2 条件分支（if / else）

`ArkIfStmt` 结尾的块固定有 2 个常规后继：true 分支与 false 分支。

```typescript
// 源码
function abs(x: number): number {
    if (x < 0) {
        return -x;
    }
    return x;
}
```

```typescript
// ArkIR
label0:
    this = this: @F: C
    x = parameter0: number
    if x < 0 goto label1 label2

label1:
    %0 = -x
    return %0

label2:
    return x
```

### 2.3 循环结构（for / while / do-while）

ArkAnalyzer 把所有循环统一改写为 **"条件块 + 体块 + 回边"** 形式。`for` 的初始化块直接前置在条件块的前驱里，递增表达式在体块尾部插入并跳回条件块。

```typescript
// 源码 — 摘自 tests/resources/cfg/for/test.ts
function f(): number {
    let i = 0;
    for (i = 0; i < 10; i++) {
        if (i < 5) {
            i += 2;
        }
    }
    return i;
}
```

```typescript
// ArkIR
label0:
    this = this: @F: %dflt
    i = 0
    i = 0
    goto label1

label1:                           // 条件块
    if i < 10 goto label2 label3

label2:                           // 循环体
    if i < 5 goto label4 label5

label4:
    i = i + 2
    goto label5

label5:                           // 递增并回边到条件块
    i = i + 1
    goto label1

label3:                           // 出口
    return i
```

> 实现细节见 §4.2。`while` / `do-while` 没有初始化与递增块；`for-of` / `for-in` 由 `LoopBuilder.findIteratorIdx` 识别迭代器协议后改写为标准条件循环。

### 2.4 Switch 语句

ArkAnalyzer 把 `switch` 拆解为一串顺次相连的相等比较 `ArkIfStmt`，每个 `case` 对应一个判断块；fall-through（无 `break`）通过将相邻 case 体串接实现，`default` 对应最末块的 false 分支。

```typescript
// 源码 — 摘自 tests/resources/cfg/switch/SwitchSample.ts
function case1(): void {
    let a = 0;
    let b = 1;
    switch (a) {
        case 2:
            b = 2;
        case 3:
            b = 3;
            break;
        default:
            b = 10;
    }
}
```

```typescript
// ArkIR（简化标签）
label0:
    this = this: @F: %dflt
    a = 0
    b = 1
    if a == 2 goto label1 label5     // 第一个 case 判断

label1:                              // case 2 体（fall-through，无 break）
    b = 2
    goto label2

label5:
    if a == 3 goto label2 label3     // 第二个 case 判断

label2:                              // case 3 体（带 break）
    b = 3
    goto label4

label3:                              // default
    b = 10
    goto label4

label4:
    return
```

### 2.5 异常处理（try / catch / finally）

`try` 块及内嵌块通过 **异常后继边** 指向 `catch` 块；`catch` 块以 `caughtexception` 引用接收异常对象（即 [`ArkCaughtExceptionRef`](./IRBasics.md#43-arkcaughtexceptionref-异常引用)）。`finally` 中的语句被复制到所有可能的后继路径。

```typescript
// 源码 — 摘自 tests/resources/cfg/tryCatch/TryCatchSample.ts
function case1(): void {
    let i = 0;
    try {
        if (i !== 0) {
            let y = 10 / i;
        }
    } catch (e) {
        console.log('i === 0');
    }
}
```

```typescript
// ArkIR（基于 TRY_CATCH_EXPECT_CASE1 的金标，见 tests/resources/cfg/tryCatch/TryCatchExpect.ts）
block 0:                             // 入口
    this = this: @F: %dflt
    i = 0
    succes:[1]

block 1:                             // try 区域内
    if i !== 0
    succes:[2, 4]
    exceptionalSucces:[3]            // 异常时跳到 catch

block 2:
    y = 10 / i
    succes:[4]
    exceptionalSucces:[3]

block 3:                             // catch 块
    e = caughtexception: unknown
    instanceinvoke console.<@%unk/%unk: .log()>('i === 0')
    succes:[4]
    exceptionalPreds:[1, 2]

block 4:
    return
```

> 异常边由 `Trap` 数据结构汇总，每个 `Trap` 记录一对 `tryBlocks → catchBlocks`，存放在 `ArkBody.traps` 中。详见 §4.4。

## 3. 核心数据结构

### 3.1 Cfg

`Cfg` 是方法级别的 CFG 容器，持有所有基本块和起始信息。

```typescript
// src/core/graph/Cfg.ts
export class Cfg {
    private blocks: Set<BasicBlock>;            // 全部基本块
    private stmtToBlock: Map<Stmt, BasicBlock>; // Stmt → 所属块的反向索引
    private startingStmt!: Stmt;                // 入口 Stmt（其所属块即起始块）
    private defUseChains: DefUseChain[];        // Def-Use 链（懒构建）
    private declaringMethod!: ArkMethod;        // 所属方法
}
```

| 字段 | 说明 |
|------|------|
| `blocks` | 所有 `BasicBlock` 的集合，迭代顺序与构建顺序一致 |
| `stmtToBlock` | `Stmt → BasicBlock` 反向索引；`insert*/remove` 时同步维护 |
| `startingStmt` | CFG 入口 Stmt，所在块即唯一的"起始块" |
| `defUseChains` | `buildDefUseChain()` 后填充；详见 [Def-Use Chain](../analysis/Def-Use%20Chain.md) |
| `declaringMethod` | 反向指向 `ArkMethod`，便于分析时回查 |

### 3.2 BasicBlock

`BasicBlock` 是 CFG 的节点，内部为线性 Stmt 序列；其末尾 Stmt 决定后继边数。

```typescript
// src/core/graph/BasicBlock.ts
export class BasicBlock {
    private id: number = -1;                              // 唯一编号
    private stmts: Stmt[] = [];                           // 块内 Stmt（线性）
    private predecessorBlocks: BasicBlock[] = [];         // 常规前驱
    private successorBlocks: BasicBlock[] = [];           // 常规后继（顺序敏感）
    private exceptionalSuccessorBlocks?: BasicBlock[];    // 异常后继（catch 块）
    private exceptionalPredecessorBlocks?: BasicBlock[];  // 异常前驱（仅 catch 块）
}
```

| 字段 | 说明 |
|------|------|
| `id` | 块编号；CFG 文本里 `label<id>:` 即此值 |
| `stmts` | 块内 Stmt **线性数组**，最后一条决定后继数（`Stmt.getExpectedSuccessorCount()`） |
| `successorBlocks` | 顺序敏感：`ArkIfStmt` 块的 `[0]` 是 true 后继、`[1]` 是 false 后继；switch 后继顺序按 case 判等顺序 |
| `exceptionalSuccessorBlocks` | 仅在 try 块出现，指向 catch 块 |
| `exceptionalPredecessorBlocks` | 仅在 catch 块出现，反向指向所有 try 内块 |

`BasicBlock.validate()` 强制约束："分支 / return / throw 这类终结 Stmt 必须出现在块尾且至多一条"，违反则报 `BB_MORE_THAN_ONE_BRANCH_RET_STMT` 或 `BB_BRANCH_RET_STMT_NOT_AT_END`。

## 4. CFG 构建过程

`CfgBuilder` 是 IR 构建管线最后一环，主流程位于 [src/core/graph/builder/CfgBuilder.ts](../../src/core/graph/builder/CfgBuilder.ts)（核心方法 `buildCfgBuilder` / `buildCfg` / `buildNormalCfg`）。整体分为 **5 步**：

1. **`buildCfgBuilder`**：先把方法 AST 转为 `BlockBuilder` 链表（仅控制流骨架，Stmt 仍是源码级抽象）。
2. **`buildNormalCfg`**：把 `BlockBuilder` 翻译成真正的 `BasicBlock`，并把每条源码级 Stmt 通过 `ArkIRTransformer` 展开成多条三地址 Stmt 填入。
3. **特殊结构改写**：依次调用 `LoopBuilder` / `ConditionBuilder` / `SwitchBuilder` / `TrapBuilder` 重整块边界与边。
4. **`linkBasicBlocks`**：补齐所有常规边、`label` 编号。
5. **`validate`**：检查可达性与 BasicBlock 形态合法。

下面四个子节聚焦核心改写逻辑。

### 4.1 BasicBlock 划分规则

划分以"控制流终结 Stmt"为锚点。一个块最多以一条 **终结 Stmt（`ArkIfStmt` / `ArkReturnStmt` / `ArkReturnVoidStmt` / `ArkThrowStmt`）** 结尾，其余位置只能放赋值、调用、别名定义这类"直筒"语句。具体规则：

- 顺序语句一直追加到当前块尾。
- 遇到 `if`、`for`、`while`、`switch`、`try` 等控制结构 → 在结构前后切换块。
- 遇到 `break` / `continue` / `return` / `throw` → 终结当前块，新建后继块。
- 任何块 `getStmts().length === 0` 时被视为 dummy 块，最终在 `removeUnnecessaryBlocks` 中清理。

> 划分主体在 `CfgBuilder.buildBlocks` / `buildNormalCfg`，并由 `BasicBlock.validate()` 在最终 `Cfg` 构建后再次校验形态。

### 4.2 循环转换

[`LoopBuilder.rebuildBlocksInLoop`](../../src/core/graph/builder/LoopBuilder.ts) 把 `for` / `for-in` / `for-of` 等带"初始化、条件、递增"三段式循环统一改写为：

```typescript
preheader → condition → body → increment → condition (回边)
                              \
                               → exit
```

关键步骤：
- `findIteratorIdx`：在条件块内定位 `iteratorNextStmtIdx`（`for-of/for-in` 的 `iter.next()` 调用）或 `dummyInitializerStmtIdx`（普通 `for` 占位符）。
- 把条件块前的初始化语句下沉到 `preheader`。
- 把条件块后的递增/取值语句移到 `increment` 块或回边块。
- 处理空循环体特殊情况（`emptyLoopBody`），让条件块回边到自身。

效果：所有循环在 CFG 上看都是"一个条件块 + 一个或多个体块 + 至少一条回边"，下游分析无需区分 for/while/do-while。

### 4.3 条件分支

[`ConditionBuilder.rebuildBlocksContainConditionalOperator`](../../src/core/graph/builder/ConditionBuilder.ts) 处理 **三元运算符 `?:` 与短路 `&&` / `||`** 这类"在表达式内部嵌入控制流"的情形。`ArkIRTransformer` 会先把它们翻译成带 `DummyStmt`（`DUMMY_CONDITIONAL_OPERATOR_END_STMT`）的占位序列；该 builder 再据此把占位序列拆成多块、连边。

主流程：
1. 倒序扫描每个块，找到第一个 `DUMMY_CONDITIONAL_OPERATOR_END_STMT`。
2. 调用 `generateBlocksInConditionalOperatorGroup` 切出 top + bottom 子块。
3. 若占位之后还有别的 Stmt，再切一个"continuation"块。
4. 用 `linkPredecessorsOfBasicBlock` 把原块的所有前驱迁移到 top 块、把所有后继迁移到 bottom 块。

ArkUI 构建器场景（`isArkUIBuilder=true`）则简化处理：直接 `deleteDummyConditionalOperatorStmt`，不切块，因为 ViewTree 不需要这种细粒度边。

### 4.4 异常处理

[`TrapBuilder.buildTraps`](../../src/core/graph/builder/TrapBuilder.ts) 负责扫描 `try / catch / finally` 结构、生成 [`Trap`](../../src/core/base/Trap.ts) 列表、插入异常边。

```typescript
// src/core/base/Trap.ts
export class Trap {
    private readonly tryBlocks: BasicBlock[];
    private readonly catchBlocks: BasicBlock[];
}
```

每个 `Trap` 记录"哪些 try 内的块在异常时会跳转到哪些 catch 块"。同一 `try` 可能因控制流分裂出多个 `Trap`（例如 try 内嵌 if 分裂）。

构建步骤（针对每个 `try`）：
1. **prepareHeadBlock** —— 在 try 体起始处准备入口。
2. **processTryBlock** —— BFS 遍历 try 体内所有 `BasicBlock`，并对每个块调用 `addExceptionalSuccessorBlock(catchBlock)`、对应 catch 块调用 `addExceptionalPredecessorBlock`。
3. **processCatchBlock** —— catch 块入口加上 `e = caughtexception: <type>`（即 `ArkAssignStmt`，右值为 `ArkCaughtExceptionRef`）。
4. **finally 处理** —— 把 finally 块语句复制（深克隆）到 try 正常出口、catch 正常出口、re-throw 路径三条线上。
5. **buildSingleTraps** —— 整理出每段连续 `tryBlocks` 与目标 `catchBlocks` 形成 `Trap`，写入 `ArkBody.traps`。

最终下游分析既能通过 `successorBlocks` 看到正常控制流，也能通过 `exceptionalSuccessorBlocks` 看到异常路径，二者并行存在。

## 5. 主要接口

### Cfg

| 方法 | 说明 |
|------|------|
| `getBlocks(): Set<BasicBlock>` | 返回全部基本块 |
| `getStmts(): Stmt[]` | 按块顺序展平所有 Stmt |
| `getStartingStmt() / setStartingStmt(s)` | 入口 Stmt |
| `getStartingBlock(): BasicBlock \| undefined` | 起始块（即 `startingStmt` 所在块） |
| `getDeclaringMethod() / setDeclaringMethod(m)` | 反向引用所属 `ArkMethod` |
| `addBlock(b)` | 新建块时同步更新 `stmtToBlock` |
| `insertAfter(toInsert, point) / insertBefore(toInsert, point)` | 在指定 Stmt 前/后插入 Stmt（IR 优化常用） |
| `remove(stmt)` | 从所属块中删除 Stmt |
| `getStmtToBlock(): Map<Stmt, BasicBlock>` | 暴露反向索引 |
| `buildDefUseChain(): DefUseChain[]` | 构建并缓存方法内 Def-Use 链 |
| `getDefUseChains()` | 返回已缓存的 Def-Use 链 |
| `getUnreachableBlocks(): Set<BasicBlock>` | 从起始块 BFS，返回不可达块 |
| `validate(): ArkError` | 检查 CFG 是否合法（起始块存在、无不可达块） |

### BasicBlock

| 方法 | 说明 |
|------|------|
| `getId() / setId(id)` | 块编号 |
| `getStmts(): Stmt[]` | 块内 Stmt 列表 |
| `addStmt(stmt) / addHead(stmts) / addTail(stmts)` | 末尾追加 / 头部批量插入 / 尾部批量插入 |
| `insertBefore(toInsert, point) / insertAfter(toInsert, point)` | 块内任意位置插入 |
| `remove(stmt) / removeHead() / removeTail()` | 删除 Stmt |
| `getHead(): Stmt \| null` / `getTail()` | 首/尾 Stmt |
| `getSuccessors(): BasicBlock[]` / `getPredecessors()` | 常规后继 / 前驱 |
| `addSuccessorBlock(b) / addPredecessorBlock(b)` | 增加边 |
| `removeSuccessorBlock(b) / removePredecessorBlock(b)` | 删除边 |
| `getExceptionalSuccessorBlocks() / getExceptionalPredecessorBlocks()` | 异常后继 / 前驱（可能为 `undefined`） |
| `addExceptionalSuccessorBlock(b) / addExceptionalPredecessorBlock(b)` | 增加异常边 |
| `validate(): ArkError` | 校验块尾终结 Stmt 唯一且位置正确 |

## 6. 使用示例

下面演示如何拿到 `Cfg`、遍历每个 `BasicBlock`、打印块内 Stmt 与前后继，并展示异常边——参照 [tests/samples/CfgTest.ts](../../tests/samples/CfgTest.ts) 的 `printBlocks` 写法。

```typescript
// 摘自 tests/samples/CfgTest.ts
import { Scene, SceneConfig, BasicBlock, DEFAULT_ARK_METHOD_NAME } from 'arkanalyzer';

const config = new SceneConfig();
config.buildFromProjectDir('tests/resources/cfg/tryCatch');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes();

for (const arkFile of scene.getFiles()) {
    for (const arkClass of arkFile.getClasses()) {
        for (const arkMethod of arkClass.getMethods()) {
            if (arkMethod.getName() === DEFAULT_ARK_METHOD_NAME) {
                continue;
            }
            const cfg = arkMethod.getBody()?.getCfg();
            if (!cfg) {
                continue;
            }
            console.log(`=== ${arkMethod.getName()} ===`);
            const blocks = [...cfg.getBlocks()];
            for (const block of blocks) {
                console.log(`block ${block.getId()}`);
                for (const stmt of block.getStmts()) {
                    console.log(`  ${stmt.toString()}`);
                }
                const succ = block.getSuccessors().map(b => b.getId()).join(', ');
                const pred = block.getPredecessors().map(b => b.getId()).join(', ');
                console.log(`  succ: [${succ}]  pred: [${pred}]`);
                const exSucc = block.getExceptionalSuccessorBlocks();
                if (exSucc) {
                    console.log(`  exSucc: [${exSucc.map(b => b.getId()).join(', ')}]`);
                }
            }
        }
    }
}
```

> 完整可运行示例可参考：[tests/samples/CfgTest.ts](../../tests/samples/CfgTest.ts) 与 [tests/samples/CfgBuilderTest.ts](../../tests/samples/CfgBuilderTest.ts)。
> 想直接以文本形式查看 CFG，可使用命令行：`npx arkanalyzer ir <project> -f text -o ./out`，输出文件每个方法都会以 `label<id>:` 形式打印基本块。
