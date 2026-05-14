# Stmt

## 1. 概述

本文档介绍 ArkIR 中**语句（`Stmt`）**的组织方式与各类 stmt 的形态。Stmt 是 CFG 基本块（[BasicBlock](./CFG.md#3-核心数据结构)）的最小填充单元，也是 ArkIR 三地址码的"指令"层。Stmt 内部引用的"值"（`Local` / `Constant` / `Ref` / `Expr`）参见 [IR 基础元素](./IRBasics.md)。

ArkAnalyzer 中 `Stmt` 有两种形态：

- **三地址码 Stmt**：进入 CFG 的标准语句，每条最多一次赋值或分支。这类 Stmt 的 `getCfg()` 返回所属 CFG 引用。
- **源码级 Stmt**：仅在 IR 转换中间过程作为占位载体出现，不直接参与 CFG 与分析；其 `getCfg()` 返回 `null`。

本文重点介绍三地址码 Stmt。

## 2. stmt

ArkIR 共有 7 种具体 Stmt 子类型，全部继承自抽象类 `Stmt`（[src/core/base/Stmt.ts](../../src/core/base/Stmt.ts)）：

```typescript
Stmt
├── ArkAssignStmt              // 赋值语句
├── ArkInvokeStmt              // 方法调用语句（无返回值或返回值未被使用）
├── ArkIfStmt                  // 条件分支语句
├── ArkReturnStmt              // 带返回值的 return
├── ArkReturnVoidStmt          // 无返回值的 return
├── ArkThrowStmt               // 抛出异常
└── ArkAliasTypeDefineStmt     // 类型别名定义
```

### 2.0 抽象基类 Stmt 的关键能力

| 方法 | 说明 |
|------|------|
| `getDef(): Value \| null` | 获取该 Stmt 的"定义"——即三地址码中赋值号左侧的值；若无返回 `null` |
| `getUses(): Value[]` | 获取所有被本 Stmt 使用的值（含递归展开） |
| `getDefAndUses(): Value[]` | def + uses 的并集 |
| `getInvokeExpr(): AbstractInvokeExpr \| undefined` | 若 Stmt 中含调用表达式，返回之 |
| `getExprs(): AbstractExpr[]` | 收集所有表达式（如 `BinopExpr`、`InvokeExpr`） |
| `getFieldRef() / getArrayRef()` | 取首个字段引用 / 数组引用 |
| `getCfg(): Cfg` | 返回所在 CFG（仅三地址码 Stmt 有值） |
| `isBranch(): boolean` | 是否为分支（仅 `ArkIfStmt` 为 `true`） |
| `getExpectedSuccessorCount(): number` | 期望后继块数：`ArkIfStmt`=2、`ArkReturn(Void)Stmt`=0、其余=1 |
| `getOriginFullPosition(): FullPosition \| undefined` | 获取源码完整位置（含起始/结束行列） |
| `setOriginFullPosition(position: FullPosition)` | 设置源码完整位置 |
| `getOperandOriginalPositions(): FullPosition[] \| undefined` | 获取所有操作数的源码位置数组 |
| `setOperandOriginalPositions(positions: FullPosition[])` | 设置所有操作数的源码位置数组 |
| `getOperandOriginalPosition(index): FullPosition \| undefined` | 获取指定操作数的源码位置 |
| `replaceUse(old, new) / replaceDef(old, new)` | 替换 use/def，常用于 IR 优化与脱糖 |
| `toString()` | 返回该 Stmt 的 ArkIR 文本形式 |
| `getOriginPositionInfo(): LineColPosition` | ⚠️ **废弃于 1.0.91**，建议使用 `getOriginFullPosition()` 获取完整的源码位置信息 |
| `setOriginPositionInfo(position: LineColPosition)` | ⚠️ **废弃于 1.0.91**，建议使用 `setOriginFullPosition()` 设置完整的源码位置信息 |

> **位置信息说明**：`originFullPosition`（`FullPosition`）存储完整的源码位置（起始/结束行列），而废弃的 `getOriginPositionInfo()` 返回的 `LineColPosition` 仅包含起始行列。所有位置相关废弃接口已统一迁移至 `FullPosition` 版本，提供更完整的源码位置信息（起始/结束行列）。`operandOriginalPositions` 数组记录各操作数在源码中的位置，用于精确定位分析。

### 2.1 ArkAssignStmt - 赋值语句

最常见的 Stmt，承载几乎所有的"产值"操作（创建对象、调用结果、读字段、运算等）。

```typescript
// src/core/base/Stmt.ts
export class ArkAssignStmt extends Stmt {
    private leftOp: Value;       // 左操作数：Local / ArkArrayRef / ArkInstance(Static)FieldRef
    private rightOp: Value;      // 右操作数：任意 Value
}
```

主要接口：

| 方法 | 说明 |
|------|------|
| `getLeftOp() / setLeftOp(v)` | 左值（`getDef()` 即返回此值） |
| `getRightOp() / setRightOp(v)` | 右值 |
| `toString()` | 形如 `lhs = rhs` |

示例：

```typescript
// 源码
let myPerson = new Person(10);
let newAge = myPerson.age + i;
```

```typescript
// ArkIR（摘自 tests/resources/save/basic.ts）
%0 = new @save/basic.ts: Person                                    // ArkAssignStmt
%0 = instanceinvoke %0.<@save/basic.ts: Person.constructor(number)>(10)  // ArkAssignStmt（构造调用结果回写）
myPerson = %0                                                      // ArkAssignStmt
%1 = myPerson.<@save/basic.ts: Person.age>                         // ArkAssignStmt（字段读）
newAge = %1 + i                                                    // ArkAssignStmt（二元运算）
```

> 数组/字段写：`%0[0] = 1`、`obj.<@F: C.x> = 5` 也是 `ArkAssignStmt`，左值分别是 `ArkArrayRef`、`ArkInstanceFieldRef`。

### 2.2 ArkInvokeStmt - 方法调用语句

仅当调用结果未被使用时，调用本身作为一条独立 Stmt：

```typescript
export class ArkInvokeStmt extends Stmt {
    private invokeExpr: AbstractInvokeExpr;     // 调用表达式
}
```

主要接口：`getInvokeExpr() / replaceInvokeExpr(e)` / `toString()`（直接输出 invokeExpr 的 IR 文本）。

示例：

```typescript
logger.info(newAge);
```

```typescript
instanceinvoke logger.<@%unk/%unk: .info()>(newAge)
```

> 若返回值被使用，则会被包装在 `ArkAssignStmt` 中：`%2 = staticinvoke <@F: Math.abs(number)>(x)`。

### 2.3 ArkIfStmt - 条件分支

```typescript
export class ArkIfStmt extends Stmt {
    private conditionExpr: ArkConditionExpr;     // 必为返回 boolean 的关系表达式
}
```

主要接口：

| 方法 | 说明 |
|------|------|
| `getConditionExpr() / setConditionExpr(e)` | 条件表达式 |
| `isBranch()` | 恒为 `true` |
| `getExpectedSuccessorCount()` | 恒为 `2` —— true 后继与 false 后继 |
| `toString()` | 形如 `if op1 < op2`；CFG 文本里会进一步带上 `goto labelT labelF` 后缀 |

示例：

```typescript
if i < 10 goto label2 label3
```

`label2` 是条件为真时的后继块，`label3` 是条件为假时的后继块。

### 2.4 ArkReturnStmt - 带返回值的 return

```typescript
export class ArkReturnStmt extends Stmt {
    private op: Value;
}
```

主要接口：`getOp()` / `setReturnValue(v)` / `getExpectedSuccessorCount()` 恒 `0` / `toString()` 形如 `return op`。

示例：

```typescript
return sum
```

### 2.5 ArkReturnVoidStmt - 无返回值 return

无操作数；输出固定为 `return`，`getExpectedSuccessorCount()` 恒 `0`。

### 2.6 ArkThrowStmt - 抛出异常

```typescript
export class ArkThrowStmt extends Stmt {
    private op: Value;       // 被抛出的对象
}
```

主要接口：`getOp() / setOp(v)`，`toString()` 形如 `throw op`。后继块为 `try/catch` 关联的异常处理块（详见 [CFG - 异常处理](./CFG.md#44-异常处理)）。

### 2.7 ArkAliasTypeDefineStmt - 类型别名定义

```typescript
export class ArkAliasTypeDefineStmt extends Stmt {
    private aliasType: AliasType;
    private aliasTypeExpr: AliasTypeExpr;     // 见 IRBasics § 5.5
}
```

主要接口：

| 方法 | 说明 |
|------|------|
| `getAliasType()` | 别名类型 |
| `getAliasTypeExpr()` | 右侧表达式（[`AliasTypeExpr`](./IRBasics.md#55-特殊表达式)） |
| `getAliasName()` | 别名名称 |
| `toString()` | 形如 `type T = U`；带 `declare` / `export` 修饰符时会自动前缀输出 |

示例：

```typescript
// 源码
type A = string;
type B = import('./abc').TypeB;
let c = 123;
declare type C = typeof c;
```

```typescript
// ArkIR
type A = string
type B = import('./abc').TypeB
declare type C = typeof c
```

## 3. stmt 和各 IR 基础元素的关系

下表概括各 Stmt 中"携带的值"的类型限制——这是把 `Stmt` 与 [IR 基础元素](./IRBasics.md) 对接的核心规则：

| Stmt 类型 | def（`getDef()`） | uses（含递归） |
|-----------|------------------|---------------|
| `ArkAssignStmt` | `leftOp`：`Local` / `ArkArrayRef` / `ArkInstanceFieldRef` / `ArkStaticFieldRef` | `rightOp` 及其 `getUses()`，左值若为 `ArrayRef`/`FieldRef` 也会包含其 base/index |
| `ArkInvokeStmt` | `null` | `invokeExpr` 自身 + 各实参（含 base，对实例调用） |
| `ArkIfStmt` | `null` | `conditionExpr` + 其两个操作数（含递归） |
| `ArkReturnStmt` | `null` | `op` + 其 `getUses()` |
| `ArkReturnVoidStmt` | `null` | `[]` |
| `ArkThrowStmt` | `null` | `op` + 其 `getUses()` |
| `ArkAliasTypeDefineStmt` | `null` | `aliasTypeExpr` 内涉及的 `Local` / 类型表达式 |

> Tips：
> - `Stmt.getDef()` 只在 `ArkAssignStmt` 不为 `null`，是 [Def-Use Chain](../analysis/Def-Use%20Chain.md) 构建时识别"定义点"的核心钩子。
> - `Stmt.getInvokeExpr()` 同时覆盖 `ArkInvokeStmt` 与"右值是 invokeExpr 的 ArkAssignStmt"两种情形——[CallGraph](../analysis/CallGraph.md) 即基于此抓取每个调用点。

## 4. 使用示例

```typescript
// 摘自 tests/samples/CfgTest.ts 的扩展
import {
    Scene, SceneConfig, DEFAULT_ARK_METHOD_NAME,
    ArkAssignStmt, ArkInvokeStmt, ArkIfStmt,
    ArkReturnStmt, ArkReturnVoidStmt, ArkThrowStmt,
    ArkAliasTypeDefineStmt,
} from 'arkanalyzer';

const config = new SceneConfig();
config.buildFromProjectDir('tests/resources/save');
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
            for (const block of cfg.getBlocks()) {
                for (const stmt of block.getStmts()) {
                    if (stmt instanceof ArkAssignStmt) {
                        console.log(`assign: ${stmt.getLeftOp()} <- ${stmt.getRightOp()}`);
                    } else if (stmt instanceof ArkInvokeStmt) {
                        console.log(`invoke: ${stmt.getInvokeExpr()}`);
                    } else if (stmt instanceof ArkIfStmt) {
                        console.log(`if:     ${stmt.getConditionExpr()}`);
                    } else if (stmt instanceof ArkReturnStmt) {
                        console.log(`return: ${stmt.getOp()}`);
                    } else if (stmt instanceof ArkReturnVoidStmt) {
                        console.log(`return (void)`);
                    } else if (stmt instanceof ArkThrowStmt) {
                        console.log(`throw:  ${stmt.getOp()}`);
                    } else if (stmt instanceof ArkAliasTypeDefineStmt) {
                        console.log(`alias:  ${stmt}`);
                    }
                }
            }
        }
    }
}
```

> 完整可运行示例可参考：[tests/samples/CfgTest.ts](../../tests/samples/CfgTest.ts)、[tests/samples/CfgBuilderTest.ts](../../tests/samples/CfgBuilderTest.ts)。
