# 调用图（CallGraph）

## 1. 概述

**调用图（Call Graph）** 描述方法之间的调用关系：节点是 [`ArkMethod`](../components/ArkMethod.md)，有向边 `caller → callee` 表示 `caller` 内的某条调用语句可能调用 `callee`。一旦构建完成，过程间的可达性、影响域、入口枚举、栈回溯等问题就能在 O(图大小) 内完成查询。

ArkAnalyzer 提供两种调用图算法：

- **CHA（Class Hierarchy Analysis）**：保守算法，基于"接收者声明类型 + 类层次结构"枚举所有可能的虚函数目标。优点快、覆盖全，缺点可能高估。
- **RTA（Rapid Type Analysis）**：在 CHA 基础上裁剪——只保留**实际被 `new` 实例化过的类**。精度高于 CHA，速度仍是线性。

> 两种算法的入口由 [`CallGraphBuilder`](../../src/callgraph/model/builder/CallGraphBuilder.ts) 提供；运行前必须先 `scene.inferTypes()`，否则虚函数解析无法识别接收者类型。

## 2. 分析流程

### 2.1 Class Hierarchy Analysis（CHA）

CHA 的核心规则：
1. 对每条调用语句 `c.m(args)`，从 `c` 的声明类型 `T` 出发；
2. 把目标定为：`T` 自身（若实现了 `m`），加上 `T` 的所有子类（含传递子类）覆盖了 `m` 的版本。
3. 对静态调用（`staticinvoke`）和构造调用（`new T()`），目标唯一。

CHA 不需要"哪个对象真的存在过"这种信息，因此非常快——但保守。例如：

```typescript
abstract class Shape { abstract area(): number; }
class Circle extends Shape { area() { return 3.14; } }
class Square extends Shape { area() { return 1; } }
function f(s: Shape) { return s.area(); }      // CHA: 把 Circle.area 与 Square.area 都算入
```

### 2.2 Rapid Type Analysis（RTA）

RTA 在 CHA 边界外加一道过滤：只把"曾经在可达代码中真正 `new` 过的类"算作可能接收者。

```typescript
new Circle();           // 触达
f(s);                   // s.area() → RTA 仅保留 Circle.area
```

RTA 的工作集就是"已实例化类集合"，每发现一处 `ArkNewExpr` 就把对应类加入工作集，并把已构建的调用图重新审视一遍——直到工作集稳定。

### 2.3 端到端示例

```typescript
import {
    Scene, SceneConfig,
    DEFAULT_ARK_CLASS_NAME,
    CallGraph, CallGraphBuilder, MethodSignature,
} from 'arkanalyzer';

// 1) 构建 Scene + 推导
const config = new SceneConfig();
config.buildFromProjectDir('tests/resources/callgraph/cha_rta_test');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes();

// 2) 选 entry：取 main.ts 默认类下的 main()
const entryPoints: MethodSignature[] = scene
    .getFiles()
    .filter(f => f.getName() === 'main.ts')
    .flatMap(f => f.getClasses())
    .filter(c => c.getName() === DEFAULT_ARK_CLASS_NAME)
    .flatMap(c => c.getMethods())
    .filter(m => m.getName() === 'main')
    .map(m => m.getSignature());

// 3) 构建调用图
const cg = new CallGraph(scene);
const builder = new CallGraphBuilder(cg, scene);
builder.buildClassHierarchyCallGraph(entryPoints, /*displayGenerated*/ false);
// 或： builder.buildRapidTypeCallGraph(entryPoints, false);

// 4) 统计与导出
console.log(cg.getStat());
console.log('entries:', cg.getEntries().length);
cg.dump('out/cg.dot');                     // GraphViz DOT
cg.dump2Json('out/cg.json');               // JSON
```

可视化：

```shell
dot -Tpng -o out/cg.png out/cg.dot
# 或者 SVG
dot -Tsvg -o out/cg.svg out/cg.dot
```

`runDir()` / `run4Project()` 两种入口的完整代码在 [tests/samples/CallGraphTest.ts](../../tests/samples/CallGraphTest.ts)。

也可以用命令行：

```shell
npx arkanalyzer cg ./myapp -a rta -f dot -o out/cg.dot
npx arkanalyzer cg ./myapp -a cha -f json
npx arkanalyzer cg ./myapp -e "@dummyMain" -r MyClass.myMethod --direction backward -f text
```

> CLI 选项见 [README.md](../../README.md) 与 [skills/arkanalyzer/skills/cg.md](../../skills/arkanalyzer/skills/cg.md)。

## 3. 核心数据结构

### 3.1 CallGraph

```typescript
// src/callgraph/model/CallGraph.ts
export class CallGraph extends BaseExplicitGraph {
    private scene: Scene;
    private csManager: CallSiteManager;
    private stmtToCallSitemap: Map<Stmt, CallSite[]>;
    private stmtToDynCallSitemap: Map<Stmt, DynCallSite>;
    private methodToCGNodeMap: Map<string, NodeID>;       // 签名字符串 -> CGNode
    private callPairToEdgeMap: Map<string, CallGraphEdge>;
    private methodToCallSiteMap: Map<FuncID, Set<CallSite>>;
    private entries!: NodeID[];
    private cgStat?: CGStat;
    private dummyMainMethodID: FuncID | undefined;
}
```

| 字段 | 含义 |
|------|------|
| `scene` | 反向引用所属 [`Scene`](../components/Scene.md) |
| `csManager` | 全局 CallSite 管理器（含 `CallSite` / `DynCallSite`） |
| `stmtToCallSitemap` | 调用 Stmt → 该位置上所有 CallSite |
| `methodToCGNodeMap` | 方法签名字符串 → 节点 ID |
| `callPairToEdgeMap` | `srcID-dstID` → `CallGraphEdge` |
| `entries` | 入口方法节点 ID 列表 |
| `dummyMainMethodID` | 全局虚拟入口（由 `DummyMainCreater` 注入） |

常用接口：

| 方法 | 说明 |
|------|------|
| `getEntries(): FuncID[]` | 入口节点列表 |
| `setEntries(n: NodeID[])` | 设置入口（builder 内部调用） |
| `getCallPairEdges(): Map<string, CallGraphEdge>` | 全部边（按 srcID-dstID 索引） |
| `getCallEdgeByPair(srcID, dstID): CallGraphEdge \| undefined` | 单条边查询 |
| `getMethodByFuncID(funcID): MethodSignature \| null` | 节点 ID 反查方法 |
| `detectReachable(fromID, dstID): boolean` | 简单 BFS 可达性查询 |
| `dump(name, entry?)` | 导出 DOT 文本（GraphViz） |
| `dump2Json(name)` | 导出 JSON |
| `getStat(): string` / `printStat() / startStat() / endStat()` | 调用图统计 |
| `getDummyMainFuncID(): FuncID \| undefined` / `setDummyMainFuncID(id)` | 虚拟入口 |
| `isUnknownMethod(id): boolean` | 是否为兜底"未知"方法节点 |

### 3.2 CallGraphNode

```typescript
export enum CallGraphNodeKind {
    real,        // 项目内有 body 的方法
    vitual,      // 虚函数目标（多 callee 时按声明类型摆放）
    intrinsic,   // ArkAnalyzer 自动生成的方法（如 %instInit / %statInit）
    constructor, // 构造器
    blank,       // 没有 body 的占位（接口/abstract/declare）
}

export class CallGraphNode extends BaseNode {
    private method: Method;
    private ifSdkMethod: boolean = false;
    public getMethod(): Method;
    public isSdkMethod(): boolean / setSdkMethod(b);
    public get isBlankMethod(): boolean;     // kind === blank
    public getDotAttr(): string;             // 'shape=box'
    public getDotLabel(): string;            // 'ID: <n>\n<methodSig>'
}
```

### 3.3 CallGraphEdge

```typescript
export class CallGraphEdge extends BaseEdge {
    private flags: number;     // bitmask: DIRECT | SPECIAL | INDIRECT

    public addDirectCallSite(stmt: Stmt);    // 普通静态/直接调用
    public addSpecialCallSite(stmt: Stmt);   // 构造调用、super 调用等
    public addInDirectCallSite(stmt: Stmt);  // 虚函数 / 函数指针调用
    public hasDirectCall() / hasIndirectCall() / hasSpecialCall(): boolean;
    public getDotAttr(): string;             // 红=indirect, 黄=special, 黑=direct
}
```

边以"是否含直接 / 间接 / 特殊调用 stmt"为标志位，DOT 输出时着色——便于一眼看清虚函数。

### 3.4 CallGraphBuilder

```typescript
// src/callgraph/model/builder/CallGraphBuilder.ts
export class CallGraphBuilder {
    constructor(cg: CallGraph, scene: Scene);

    public buildDirectCallGraphForScene(): void;                                          // 仅静态边
    public buildDirectCallGraph(methods: ArkMethod[]): void;                              // 自定义子集
    public buildCGNodes(methods: ArkMethod[]): void;

    public buildClassHierarchyCallGraph(entries: MethodSignature[], displayGenerated?: boolean): void;
    public buildCHA4WholeProject(displayGenerated?: boolean): void;                       // 全工程 CHA
    public buildRapidTypeCallGraph(entries: MethodSignature[], displayGenerated?: boolean): void;
    public buildRTA4WholeProject(displayGenerated?: boolean): void;                       // 全工程 RTA
}
```

| 方法 | 用途 |
|------|------|
| `buildDirectCallGraphForScene` / `buildDirectCallGraph(methods)` | 不做虚函数解析，只连接静态调用 |
| `buildClassHierarchyCallGraph(entries)` / `buildCHA4WholeProject` | CHA |
| `buildRapidTypeCallGraph(entries)` / `buildRTA4WholeProject` | RTA |
| `displayGeneratedMethod` | 是否在节点中包含 `%instInit` / `%statInit` 等 IR 自动生成的方法（默认隐藏，便于阅读） |

### 3.5 CallSite / DynCallSite

```typescript
// src/callgraph/model/CallSite.ts
export class CallSite implements ICallSite {
    public id: CallSiteID;
    public callStmt: Stmt;
    public args: Value[] | undefined;
    public calleeFuncID: FuncID;       // 已解析到的目标
    public callerFuncID: FuncID;
}

export class DynCallSite implements ICallSite {
    public id: CallSiteID;
    public callStmt: Stmt;
    public args: Value[] | undefined;
    public protentialCalleeFuncID: FuncID | undefined;  // 仍待解析（CHA 阶段产生的占位）
    public callerFuncID: FuncID;
}

export class CallSiteManager {
    public newCallSite(s, a, ce, cr): CallSite;
    // ... id <-> callsite 双向索引；维护 dyn → static 的解析映射
}
```

CHA 在第一遍构建时把虚函数调用记为 `DynCallSite`；RTA / 后续解析阶段把它转成确切的 `CallSite`。

## 4. 典型应用场景

### 4.1 入口可达性分析

```typescript
const reachable = cg.getEntries()
    .map(id => cg.getMethodByFuncID(id)?.toString())
    .join('\n');
```

或者反向：用 `cg.detectReachable(from, to)` 判断"从入口能否走到某 sink 方法"。

### 4.2 反向影响域（哪些函数会调到 X）

通过 CLI：

```shell
npx arkanalyzer cg ./myapp -r 'MyClass.myMethod' --direction backward -f text
```

API：基于 `getCallPairEdges()` 反向遍历，或自行包装一遍 BFS。

### 4.3 死代码 / 未被调用方法

构建完整 CHA 后，所有 `methodsMap` 中存在但**没有进入 `methodToCGNodeMap`** 的方法即不可达，常见于库内部辅助函数被 tree-shaking 后的剩余。

### 4.4 与 IFDS / 数据流协同

[`IFDS`](./IFDS.md) 在过程间求解时，需要 caller→callee 的 summary 边；CallGraph 提供这一边集合。可以先用 CHA 取一个保守的过程间图，再用 IFDS 在其上做精确流分析。

### 4.5 与 ViewTree / ArkUI 协同

ArkUI 的 `@Builder` / `@Component` 触发的 `build()` 间接调用通常以 closure / 函数指针形式存在；调用图把这些边显式地补回，便于追踪 UI 事件链。详见 [ViewTree.md](./ViewTree.md)。

## 5. 使用示例

完整可运行示例可参考 [tests/samples/CallGraphTest.ts](../../tests/samples/CallGraphTest.ts)。下面给一个最小可跑版本（与上文 §2.3 端到端示例呼应）：

```typescript
import {
    Scene, SceneConfig,
    DEFAULT_ARK_CLASS_NAME,
    CallGraph, CallGraphBuilder,
} from 'arkanalyzer';

const cfg = new SceneConfig();
cfg.buildFromProjectDir('tests/resources/callgraph/cha_rta_test');

const scene = new Scene();
scene.buildSceneFromProjectDir(cfg);
scene.inferTypes();

const entries = scene
    .getFiles()
    .filter(f => f.getName() === 'main.ts')
    .flatMap(f => f.getClasses())
    .filter(c => c.getName() === DEFAULT_ARK_CLASS_NAME)
    .flatMap(c => c.getMethods())
    .filter(m => m.getName() === 'main')
    .map(m => m.getSignature());

const cg = new CallGraph(scene, /*enableStat*/ true);
const builder = new CallGraphBuilder(cg, scene);
builder.buildRapidTypeCallGraph(entries);

cg.startStat();
cg.endStat();
console.log(cg.getStat());
cg.dump('out/cg.dot');
console.log('entries:', cg.getEntries().length);
console.log('edges:  ', cg.getCallPairEdges().size);
```

> 完整可运行示例可参考：[tests/samples/CallGraphTest.ts](../../tests/samples/CallGraphTest.ts)、[tests/samples/PointerAnalysisTest.ts](../../tests/samples/PointerAnalysisTest.ts)（更精确的指针分析增强 CG）。
