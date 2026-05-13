# ArkBody

## 1. 概述

**`ArkBody`** 是 ArkAnalyzer 中"方法体"的容器：把一个方法编译成 ArkIR 后，所有的局部变量、控制流图、类型别名、异常表都汇聚到 `ArkBody` 之中。一个 [`ArkMethod`](./ArkMethod.md) 仅当其拥有具体实现（即非 `abstract`、非 declare 接口签名）时才会持有 `ArkBody`，其余情况 `arkMethod.getBody()` 返回 `undefined`。

可以把 `ArkBody` 视作 ArkIR 的"方法级根结点"——下游分析（[Def-Use Chain](../analysis/Def-Use%20Chain.md) / [CallGraph](../analysis/CallGraph.md) / [IFDS](../analysis/IFDS.md) 等）几乎都从某个 `ArkBody` 出发。

## 2. ArkIR 视角

`ArkBody` 本身没有独立的文本形式——它通过其内部 `Cfg` 的所有 BasicBlock 与 Stmt 间接呈现 ArkIR。下面把"源码 → ArkBody 持有的内容"对应起来：

```typescript
// 源码
function add(a: number, b: number): number {
    let c = a + b;
    return c;
}
```

```typescript
// ArkBody 视角的 IR
locals       : { this, a, b, c }                       // Map<string, Local>
cfg          :
    label0:
        this = this: @F: %dflt
        a = parameter0: number
        b = parameter1: number
        c = a + b
        return c
aliasTypeMap : (空)
traps        : (空)
usedGlobals  : (空)
```

带 `try/catch` 的方法体里，`traps` 字段记录哪些 BasicBlock 在异常时跳到哪些 catch 块（详见 [CFG §4.4](./CFG.md#44-异常处理)）：

```typescript
function f(): void {
    try { riskyCall(); } catch (e) { console.log(e); }
}
```

```typescript
ArkBody.traps = [
    Trap {
        tryBlocks   : [block#1 (riskyCall())]
        catchBlocks : [block#2 (e = caughtexception, console.log(e))]
    }
]
```

带 `type T = …` 的方法体则会在 `aliasTypeMap` 与 `cfg` 中各保留一份信息：

```typescript
function g(): void {
    type StrFn = (s: string) => void;
    let f: StrFn = (s) => console.log(s);
}
```

```typescript
aliasTypeMap = {
    'StrFn' -> [AliasType('StrFn'), ArkAliasTypeDefineStmt('type StrFn = ...')]
}
cfg          = label0: type StrFn = ...; f = %AM0$g; return
```

## 3. 核心数据结构

```typescript
// src/core/model/ArkBody.ts
export class ArkBody {
    private locals: Map<string, Local>;                                     // 局部变量表
    private usedGlobals?: Map<string, Value>;                               // 体内引用的全局
    private cfg: Cfg;                                                       // 控制流图
    private aliasTypeMap?: Map<string, [AliasType, ArkAliasTypeDefineStmt]>;// 类型别名表
    private traps?: Trap[];                                                 // 异常表
}
```

| 字段 | 含义 |
|------|------|
| `locals` | 方法体内所有 `Local`（包含 `this`、参数、临时 `%N`、用户命名局部）按 **名字 → Local** 索引；详见 §5 |
| `usedGlobals` | 体内访问到的全局变量，键为名字，值为 `Value`（可能是 `Local` 或 `GlobalRef`）。在跨文件的全局引用解析后才填充 |
| `cfg` | 唯一的 [`Cfg`](./CFG.md) 实例；通过 `cfg.getDeclaringMethod()` 反向回查 `ArkMethod` |
| `aliasTypeMap` | 函数内部 `type T = …` 声明产生的 `AliasType` + 其定义 Stmt（[`ArkAliasTypeDefineStmt`](./Stmt.md#27-arkaliastypedefinestmt---类型别名定义)） |
| `traps` | 一组 `Trap`，由 [`TrapBuilder`](../../src/core/graph/builder/TrapBuilder.ts) 在 CFG 构建期生成，记录 try/catch 关联 |

> 对应的 IR 转换流程入口在 [`BodyBuilder`](../../src/core/model/builder/BodyBuilder.ts)：先扫描源码 AST 收集 locals 与 alias，再调用 [`CfgBuilder`](../../src/core/graph/builder/CfgBuilder.ts) 产出 `cfg` 与 `traps`，最后封装成 `new ArkBody(locals, cfg, aliasTypeMap, traps)` 挂到 `ArkMethod.body` 上。

## 4. 主要接口

| 方法 | 说明 |
|------|------|
| `getLocals(): Map<string, Local>` | 返回方法体内全部 `Local` 的"名 → Local"映射 |
| `setLocals(locals: Set<Local>)` | 重写 locals 表（IR 优化、SSA 重写时使用） |
| `addLocal(name: string, local: Local)` | 单条插入 / 覆盖 |
| `getUsedGlobals(): Map<string, Value> \| undefined` | 该方法体内使用到的全局，懒填充 |
| `setUsedGlobals(globals: Map<string, Value>)` | 由全局引用解析阶段写入 |
| `getCfg(): Cfg` | 唯一控制流图 |
| `setCfg(cfg: Cfg)` | 替换 `Cfg`（很少使用，仅 IR 重写时） |
| `getAliasTypeMap(): Map<string, [AliasType, ArkAliasTypeDefineStmt]> \| undefined` | 类型别名映射 |
| `getAliasTypeByName(name: string): AliasType \| null` | 按名查别名 |
| `getTraps(): Trap[] \| undefined` | 该方法体的所有 `Trap` |
| `getExportLocalByName(name: string): Local \| null` | 在 locals 中按名查找，并就地补齐 `LocalSignature`，常用于跨文件 import/export 解析 |

## 5. Local - 局部变量

`ArkBody.locals` 是 ArkIR 中"局部值容器"：所有出现在方法体内的命名值都放在这里——既包括用户写的 `let x = …`，也包括 IR 转换器为子表达式分配的临时 `%0`、`%1`，以及形参 `parameter0` 经赋值后保存的命名 Local 与隐式的 `this`。

四类常见 Local：

| 分类 | 名字模式 | 来源 |
|------|----------|------|
| 用户命名 | 与源码同名（`x` / `myPerson`） | `let` / `const` / `var` 声明 |
| 临时变量 | `%0` / `%1` … | 表达式分解、嵌套调用回写等 IR 转换产物 |
| 参数 | 与形参同名 | `xxx = parameter0: T` 之后被命名 |
| `this` | `this` | 实例方法/构造器的接收者 |

详细 API、`Local` 类的字段、与 `Stmt` 之间的 def-use 关系参见 [IRBasics § 2 Local](./IRBasics.md#2-local---局部变量)。

> Tips：在 `Cfg` 上做反向分析时，"取某个 Local 的所有 def Stmt"等价于 `local.getDeclaringStmt()`，"取所有 use 点"等价于 `local.getUsedStmts()`——这两个方法是 [Def-Use Chain](../analysis/Def-Use%20Chain.md) 的底层支撑。

## 6. 使用示例

下例演示如何从一个 `ArkMethod` 拿到 `ArkBody`，并展示其全部要素（locals、cfg、traps、aliases）。

```typescript
import { Scene, SceneConfig, DEFAULT_ARK_METHOD_NAME } from 'arkanalyzer';

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
            const body = arkMethod.getBody();
            if (!body) {
                console.log(`${arkMethod.getName()}: <abstract / declare>`);
                continue;
            }
            console.log(`=== ${arkMethod.getName()} ===`);

            // 1. locals
            console.log('locals:');
            for (const [name, local] of body.getLocals()) {
                console.log(`  ${name}: ${local.getType()}`);
            }

            // 2. cfg
            const cfg = body.getCfg();
            console.log(`cfg blocks: ${cfg.getBlocks().size}, stmts: ${cfg.getStmts().length}`);

            // 3. traps
            const traps = body.getTraps();
            if (traps && traps.length > 0) {
                console.log(`traps: ${traps.length}`);
                traps.forEach((t, i) => {
                    console.log(
                        `  trap[${i}] try=[${t.getTryBlocks().map(b => b.getId()).join(',')}]`
                        + ` catch=[${t.getCatchBlocks().map(b => b.getId()).join(',')}]`
                    );
                });
            }

            // 4. alias types
            const aliasMap = body.getAliasTypeMap();
            if (aliasMap && aliasMap.size > 0) {
                console.log('aliases:');
                for (const [name, [type, stmt]] of aliasMap) {
                    console.log(`  ${name} = ${type}    // ${stmt.toString()}`);
                }
            }
        }
    }
}
```

> 完整可运行示例可参考：[tests/samples/CfgTest.ts](../../tests/samples/CfgTest.ts) —— 把 `body.getCfg().getBlocks()` 替换成上面的 4 段输出即可。
