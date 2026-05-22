# 调用图（CallGraph）

## 1. 概述

**调用图（Call Graph）** 描述方法之间的调用关系：节点是 [`ArkMethod`](../components/ArkMethod.md)，有向边 `caller → callee` 表示 `caller` 内的某条调用语句可能调用 `callee`。一旦构建完成，过程间的可达性、影响域、入口枚举、栈回溯等问题就能在 O(图大小) 内完成查询。

ArkAnalyzer 提供两种调用图算法：

- **CHA（Class Hierarchy Analysis）**：保守算法，基于"接收者声明类型 + 类层次结构"枚举所有可能的虚函数目标。速度快、覆盖全，但可能将实际运行时不会发生的调用也纳入图中。
- **RTA（Rapid Type Analysis）**：在 CHA 基础上裁剪——只保留**在可达代码中真正被 `new` 实例化过的类**对应的虚函数目标。精度高于 CHA，速度仍是线性。

> 两种算法的入口均由 [`CallGraphBuilder`](../../src/callgraph/model/builder/CallGraphBuilder.ts) 提供。运行前必须先调用 `scene.inferTypes()`，否则虚函数解析无法识别接收者类型。

---

## 2. 核心数据结构

### 2.1 CallGraph

```typescript
// src/callgraph/model/CallGraph.ts
export class CallGraph extends BaseExplicitGraph {
    private scene: Scene;
    private csManager: CallSiteManager;
    private stmtToCallSitemap: Map<Stmt, CallSite[]>;
    private stmtToDynCallSitemap: Map<Stmt, DynCallSite>;
    private methodToCGNodeMap: Map<string, NodeID>;       // 签名字符串 → 节点 ID
    private callPairToEdgeMap: Map<string, CallGraphEdge>; // "srcID-dstID" → 边
    private methodToCallSiteMap: Map<FuncID, Set<CallSite>>;
    private entries!: NodeID[];
    private cgStat?: CGStat;
    private dummyMainMethodID: FuncID | undefined;
}
```

| 字段 | 含义 |
|------|------|
| `scene` | 反向引用所属 [`Scene`](../components/Scene.md) |
| `csManager` | 全局 CallSite 管理器（统一分配 `CallSite` / `DynCallSite` 的 ID） |
| `stmtToCallSitemap` | 调用 Stmt → 该调用点上所有已解析的 `CallSite` |
| `methodToCGNodeMap` | 方法签名字符串 → 节点 ID（用于快速查找节点） |
| `callPairToEdgeMap` | `"srcID-dstID"` → `CallGraphEdge`（每对 caller/callee 最多一条边） |
| `entries` | 入口方法的节点 ID 列表 |
| `dummyMainMethodID` | 全局虚拟入口（由 `DummyMainCreater` 注入时设置） |

常用接口：

| 方法 | 说明 |
|------|------|
| `getEntries(): FuncID[]` | 返回入口节点 ID 列表 |
| `setEntries(n: NodeID[])` | 设置入口（由 builder 内部调用，通常不需要手动调用） |
| `getCallPairEdges(): Map<string, CallGraphEdge>` | 返回全部调用边（以 `"srcID-dstID"` 为键） |
| `getCallEdgeByPair(srcID, dstID): CallGraphEdge \| undefined` | 查询两个节点间是否存在调用边 |
| `getMethodByFuncID(id): MethodSignature \| null` | 由节点 ID 反查方法签名 |
| `getArkMethodByFuncID(id): ArkMethod \| null` | 由节点 ID 反查 `ArkMethod` 对象 |
| `getCallSiteByStmt(stmt): CallSite[]` | 查询某条调用语句对应的所有已解析 CallSite |
| `getCallSitesByMethod(func): Set<CallSite>` | 查询某个方法作为 callee 时的所有 CallSite |
| `getInvokeStmtByMethod(func): Stmt[]` | 查询调用某个方法的所有调用语句 |
| `detectReachable(fromID, dstID): boolean` | BFS 判断从 `fromID` 出发是否能到达 `dstID` |
| `isUnknownMethod(id): boolean` | 节点是否来自"未知文件"（通常是未能解析的外部符号） |
| `dump(name, entry?)` | 导出 GraphViz DOT 格式 |
| `dump2Json(name)` | 导出 JSON 格式 |
| `startStat() / endStat() / getStat() / printStat()` | 统计调用图规模（需在构建图**完成后**调用 `startStat/endStat`） |
| `getDummyMainFuncID() / setDummyMainFuncID(id)` | 读写虚拟入口节点 ID |

### 2.2 CallGraphNode

```typescript
export enum CallGraphNodeKind {
    real,        // 项目内有 body 的普通方法
    vitual,      // 按声明类型创建的占位节点（基类型不明确时懒创建）
    intrinsic,   // ArkAnalyzer 自动生成的方法（如 %instInit / %statInit）
    constructor, // 构造函数
    blank,       // 无 body 的占位（接口方法 / abstract / declare）
}

export class CallGraphNode extends BaseNode {
    private method: Method;
    private ifSdkMethod: boolean = false;
    public getMethod(): Method;              // 返回该节点对应的方法签名
    public isSdkMethod(): boolean;           // 是否来自 SDK
    public setSdkMethod(v: boolean): void;
    public get isBlankMethod(): boolean;     // kind === blank
    public getDotAttr(): string;             // DOT 输出属性（'shape=box'）
    public getDotLabel(): string;            // DOT 节点标签（'ID: <n>\n<方法签名>'）
}
```

### 2.3 CallGraphEdge

```typescript
export class CallGraphEdge extends BaseEdge {
    // 每对 (caller, callee) 只有一条边，通过 flags 标记该边上出现过哪些调用类型
    public addDirectCallSite(stmt: Stmt);    // 标记存在直接（静态）调用
    public addSpecialCallSite(stmt: Stmt);   // 标记存在特殊调用（构造、super）
    public addInDirectCallSite(stmt: Stmt);  // 标记存在间接调用（虚函数、函数指针）
    public hasDirectCall(): boolean;
    public hasIndirectCall(): boolean;
    public hasSpecialCall(): boolean;
    public getDotAttr(): string;  // 着色规则：红=间接调用, 黄=特殊调用, 黑=直接调用
}
```

同一对 caller/callee 之间只存一条边，但边上的 flags 会记录该边上出现过哪种类型的调用。DOT 输出时按调用类型着色，便于直观区分虚函数调用和直接调用。

### 2.4 CallGraphBuilder

```typescript
// src/callgraph/model/builder/CallGraphBuilder.ts
export class CallGraphBuilder {
    constructor(cg: CallGraph, scene: Scene);

    // 仅构建直接（静态）调用边，不做虚函数解析
    public buildDirectCallGraphForScene(): void;
    public buildDirectCallGraph(methods: ArkMethod[]): void;
    public buildCGNodes(methods: ArkMethod[]): void;

    // CHA
    public buildClassHierarchyCallGraph(entries: MethodSignature[], displayGeneratedMethod?: boolean): void;
    public buildCHA4WholeProject(displayGeneratedMethod?: boolean): void;

    // RTA
    public buildRapidTypeCallGraph(entries: MethodSignature[], displayGeneratedMethod?: boolean): void;
    public buildRTA4WholeProject(displayGeneratedMethod?: boolean): void;
}
```

| 方法 | 用途 |
|------|------|
| `buildDirectCallGraphForScene()` / `buildDirectCallGraph(methods)` | 只处理静态调用（`staticinvoke`） |
| `buildClassHierarchyCallGraph(entries)` / `buildCHA4WholeProject()` | CHA 算法；前者从指定入口出发，后者分析全工程所有方法 |
| `buildRapidTypeCallGraph(entries)` / `buildRTA4WholeProject()` | RTA 算法；前者从指定入口出发，后者分析全工程所有方法 |
| `displayGeneratedMethod`（第二个参数） | 是否将 `%instInit` / `%statInit` 等 IR 自动生成的方法纳入图中，默认 `false`（隐藏，使图更易读） |

### 2.5 CallSite / DynCallSite

```typescript
// src/callgraph/model/CallSite.ts

// 已完成解析的调用点：callee 已确定
export class CallSite implements ICallSite {
    public id: CallSiteID;
    public callStmt: Stmt;          // 对应的调用语句
    public args: Value[] | undefined;
    public calleeFuncID: FuncID;    // 已解析到的目标方法节点 ID
    public callerFuncID: FuncID;    // 调用方方法节点 ID
}

// 尚未解析的调用点：callee 仍为候选（由 buildDirectCallGraph 阶段产生）
export class DynCallSite implements ICallSite {
    public id: CallSiteID;
    public callStmt: Stmt;
    public args: Value[] | undefined;
    public protentialCalleeFuncID: FuncID | undefined;  // 静态分析阶段推断的候选 callee
    public callerFuncID: FuncID;
}

export class CallSiteManager {
    // 创建一个已解析的 CallSite
    public newCallSite(s: Stmt, a: Value[] | undefined, ce: FuncID, cr: FuncID): CallSite;
    // 创建一个待解析的 DynCallSite
    public newDynCallSite(s: Stmt, a: Value[] | undefined, ptcCallee: FuncID | undefined, caller: FuncID): DynCallSite;
    // 将 DynCallSite 升级为确定 callee 的 CallSite
    public cloneCallSiteFromDyn(dynCallSite: DynCallSite, calleeFuncID: FuncID): CallSite;
    public getCallSiteById(id: CallSiteID): ICallSite | undefined;
}
```

`DynCallSite` 在 `buildDirectCallGraph` 阶段产生：遇到虚函数调用时，由于 callee 尚未确定，先记录为 `DynCallSite`。CHA / RTA 在后续解析阶段通过 `cloneCallSiteFromDyn` 将其升级为具有确定 callee 的 `CallSite`。

---

## 3. 典型应用场景

### 3.1 查询哪些方法从入口可达

```typescript
// 列出所有入口方法的签名
const entrySignatures = cg.getEntries()
    .map(id => cg.getMethodByFuncID(id)?.toString())
    .join('\n');
console.log(entrySignatures);

// 判断从某入口能否到达某个 sink 方法
const fromID = cg.getEntries()[0];
const sinkID = cg.getCallGraphNodeByMethod(sinkMethodSignature).getID();
const reachable = cg.detectReachable(fromID, sinkID);
```

### 3.2 查找调用了某个方法的所有调用点

```typescript
// 获取所有调用了 targetMethod 的 CallSite
const callSites = cg.getCallSitesByMethod(targetMethodSignature);
callSites.forEach(cs => {
    const caller = cg.getMethodByFuncID(cs.callerFuncID);
    console.log(`${caller?.toString()} 在语句 ${cs.callStmt} 处调用了目标方法`);
});

// 或者只取调用语句
const invokeStmts = cg.getInvokeStmtByMethod(targetMethodSignature);
```

### 3.3 死代码检测

构建全工程调用图后，没有入边且不是 entry 的 `real` 类节点即为从未被调用的方法：

```typescript
for (const node of cg.getNodesIter()) {
    const cgNode = node as CallGraphNode;
    if (
        cgNode.getKind() === CallGraphNodeKind.real &&
        !cgNode.hasIncomingEdges() &&
        !cg.getEntries().includes(cgNode.getID())
    ) {
        console.log('未被调用：', cgNode.getMethod().toString());
    }
}
```

---

## 4. 使用示例

完整可运行示例见 [tests/samples/CallGraphTest.ts](../../tests/samples/CallGraphTest.ts) 和 [tests/samples/PointerAnalysisTest.ts](../../tests/samples/PointerAnalysisTest.ts)（更精确的指针分析增强 CG）。下面是一个最小可运行版本：

```typescript
import {
    Scene, SceneConfig,
    DEFAULT_ARK_CLASS_NAME,
    CallGraph, CallGraphBuilder,
} from 'arkanalyzer';

// 1. 构建 Scene 并推导类型
const cfg = new SceneConfig();
cfg.buildFromProjectDir('tests/resources/callgraph/cha_rta_test');
const scene = new Scene();
scene.buildSceneFromProjectDir(cfg);
scene.inferTypes();  // 必须在构建调用图前调用

// 2. 选定入口方法
const entries = scene
    .getFiles()
    .filter(f => f.getName() === 'main.ts')
    .flatMap(f => f.getClasses())
    .filter(c => c.getName() === DEFAULT_ARK_CLASS_NAME)
    .flatMap(c => c.getMethods())
    .filter(m => m.getName() === 'main')
    .map(m => m.getSignature());

// 3. 构建调用图（传入 true 开启统计）
const cg = new CallGraph(scene, true);
const builder = new CallGraphBuilder(cg, scene);
builder.buildRapidTypeCallGraph(entries);

// 4. 打印统计（startStat/endStat 必须在图构建完成后调用）
cg.startStat();
cg.endStat();
console.log(cg.getStat());
console.log('entries:', cg.getEntries().length);
console.log('edges:  ', cg.getCallPairEdges().size);

// 5. 导出为 GraphViz DOT 或 JSON
cg.dump('out/cg.dot');
cg.dump2Json('out/cg.json');
```
