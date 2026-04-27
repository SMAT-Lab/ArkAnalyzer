# ArkUI ViewTree 分析

## 1. 概述

**ViewTree（视图树）** 是 ArkAnalyzer 针对 **ArkUI** 声明式 UI 的过程内分析产物——为每个被 `@Component` 标注的 `struct`（即 [`ArkClass`](../components/ArkClass.md) 中 `ClassCategory.STRUCT`）抽取其 `build()` 方法的 UI 形态，把 `Column { Text(...) Button(...) }` 这样的 DSL 解析成一棵树：

- 每个节点对应一个 ArkUI 组件（容器或叶子）。
- 节点间的父子关系直接对应"块嵌套"或"链式 child"。
- 节点上记录所有属性（`.fontSize(20).onClick(...)` 等链式调用）与状态绑定（`@State`、`@Link`、`@Prop`、`@Provide`/`@Consume`、`@StorageLink` 等）。
- 自定义组件（嵌入另一个 `@Component` 时）记录从父向子的 **状态值传递**（`stateValuesTransfer`）。

> ViewTree 仅在工程显式使用 ArkUI 时才有意义。`scene.inferTypes()` 之后，可通过 `arkClass.getViewTree()` 获取（若该类不是组件返回 `undefined`）。

## 2. 构建原理

构建器位于 [`src/core/graph/builder/ViewTreeBuilder.ts`](../../src/core/graph/builder/ViewTreeBuilder.ts)（约 1400 行）。整体策略：

1. **识别组件类**：扫描所有 `ArkClass`，category 为 `STRUCT` 且类上挂 `@Component` / `@Entry` 装饰器（`ArkBaseModel` 的 decorator 表中查询）。
2. **定位入口方法**：组件类的 `build(): void` 方法（也包含 `@Builder` / `@BuilderParam` 等扩展形式）。
3. **沿 build() 的 CFG 顺序解析**：把 ArkUI DSL 在 IR 层呈现为 `staticinvoke`/`instanceinvoke` 序列与 lambda 块，按以下规则建树：
   - **容器节点**（`Column { ... }` / `Row { ... }`）：`Column.create()` 后跟 lambda 块构成 children；`Column.pop()` 表示该容器闭合。
   - **叶子节点**（`Text('hi')` / `Image(...)`）：仅 `create()` 调用而无 lambda block。
   - **链式属性**：在 `create()` 与 `pop()`（或下一个 `create()`）之间出现的 `.fontSize(...)`/`.onClick(...)` 都被收入该节点 `attributes`。
   - **状态变量绑定**：属性表达式中读到 `this.<ArkField>`（即 [`ArkInstanceFieldRef`](../components/IRBasics.md#42-arkinstancefieldref-实例字段引用)）时，把对应 `ArkField` 加入该节点 `stateValues`，并把节点登记到 `ViewTree.getStateValues()` 反向索引。
   - **自定义子组件**：识别到对另一个 `@Component` 类的实例化（例如 `Child({ x: this.a })`）时，子节点 `signature` 指向子组件 `ClassSignature`，并把 `{ child.x → parent.a }` 写入 `stateValuesTransfer`。
   - **`@Builder` 函数**：以 `MethodSignature` 形式作为子节点；`builder?` 字段指向其方法签名。`@BuilderParam` 占位符通过 `builderParam?` 标记。
4. **回写到 ArkClass**：`arkClass.setViewTree(viewTree)`。

### 2.1 示例：容器 + 叶子 + 状态绑定

```typescript
@Entry
@Component
struct Hello {
    @State count: number = 0;
    build() {
        Column({ space: 10 }) {
            Text(`count = ${this.count}`).fontSize(20)
            Button('Add').onClick(() => { this.count = this.count + 1; })
        }
    }
}
```

构建后的 ViewTree（伪示意）：

```typescript
ViewTree(Hello)
└── Column                                   // 容器节点
     ├── attributes: { space → 10 }
     ├── stateValues: ∅
     ├── Text                                // 叶子节点
     │    ├── attributes: { _: 'count = ...', fontSize → 20 }
     │    ├── stateValues: { Hello.count }    // 引用了 this.count
     └── Button                              // 叶子节点
          ├── attributes: { _: 'Add', onClick → <closure> }
          └── stateValues: { Hello.count }   // onClick 闭包内更新 count

ViewTree.getStateValues() = {
    Hello.count → { Text 节点, Button 节点 }    // 反向索引：状态变量 → 受其影响的节点
}
```

### 2.2 示例：嵌入自定义组件

```typescript
@Component
struct Child {
    @Link msg: string;
    build() { Text(this.msg) }
}

@Entry
@Component
struct Parent {
    @State title: string = 'hi';
    build() { Child({ msg: this.title }) }
}
```

`Parent` 的 ViewTree 中，`Child` 子节点：

- `signature = ClassSignature(@F: Child)`
- `stateValuesTransfer = { Child.msg → Parent.title }`（key 为子组件状态字段，value 为父组件状态字段或 Builder 方法）

## 3. 核心数据结构

### 3.1 ViewTreeNode

```typescript
// src/core/graph/ViewTree.ts
export interface ViewTreeNode {
    name: string;                                                                 // 组件名，如 'Column' / 'Text' / Child 类名
    stmts: Map<string, [Stmt, (Constant | ArkInstanceFieldRef | MethodSignature)[]]>;     // @deprecated, 用 attributes
    attributes: Map<string, [Stmt, (Constant | ArkInstanceFieldRef | MethodSignature)[]]>;// 属性 → [对应Stmt, 使用的值列表]
    stateValues: Set<ArkField>;                                                   // 该节点用到的所有 @State/@Link 字段
    parent: ViewTreeNode | null;                                                  // 父节点；自定义组件根 / 整棵树根为 null
    children: ViewTreeNode[];                                                     // 子节点
    classSignature?: ClassSignature | MethodSignature;                            // @deprecated, 用 signature
    signature?: ClassSignature | MethodSignature;                                 // 自定义子组件 / Builder 的签名
    stateValuesTransfer?: Map<ArkField, ArkField | ArkMethod>;                    // 父→子状态值传递
    builderParam?: ArkField;                                                      // @BuilderParam 占位符
    builder?: MethodSignature;                                                    // @BuilderParam 绑定的 Builder 方法

    walk(selector: (item: ViewTreeNode) => boolean): boolean;
    isBuilder(): boolean;
    isCustomComponent(): boolean;
}
```

| 字段 | 含义 |
|------|------|
| `name` | 组件名，与 ArkUI DSL 中调用的全局函数名相同 |
| `attributes` | 属性表，key 为属性名（`fontSize`、`onClick` 等），value 为该属性对应的 `Stmt` 与其上的"实参列表"（实参可能是 `Constant` / `ArkInstanceFieldRef` / `MethodSignature`） |
| `stateValues` | 该节点在属性表达式或子表达式里直接 / 间接读到的 `@State`/`@Link` 字段集合 |
| `parent` / `children` | 父子链 |
| `signature` | 若为自定义子组件，指向其 `ClassSignature`；若为 `@Builder`，指向 `MethodSignature` |
| `stateValuesTransfer` | 自定义子组件的 prop 传递；key 是子组件字段，value 是父组件字段（或 Builder 方法） |
| `builderParam` / `builder` | `@BuilderParam` 占位符 / 绑定 |
| `walk(selector)` | DFS 遍历自身与所有后代；`selector` 返回 `true` 即提前停止；返回值 = 是否触发过提前停止 |
| `isBuilder()` / `isCustomComponent()` | 节点形态判断 |

### 3.2 ViewTree

```typescript
export interface ViewTree {
    getRoot(): ViewTreeNode | null;                              // 视图树根节点
    getStateValues(): Map<ArkField, Set<ViewTreeNode>>;          // 状态字段 → 受影响节点的反向索引

    // 兼容旧 API（已弃用）
    isClassField(name: string): boolean;
    getClassFieldType(name: string): Decorator | Type | undefined;
}
```

| 方法 | 说明 |
|------|------|
| `getRoot()` | 返回视图树根节点；若该 ArkClass 不是组件或 `build()` 不存在，可能返回 `null` |
| `getStateValues()` | 反向索引：每个状态字段在哪些节点上被使用——便于"修改 `count` 会触发哪些组件刷新"等查询 |

### 3.3 ArkClass / ArkMethod 上的入口

| 方法 | 说明 |
|------|------|
| `arkClass.getViewTree(): ViewTree \| undefined` | 该组件类的视图树 |
| `arkClass.hasViewTree(): boolean` | 是否构建了 ViewTree |
| `arkClass.setViewTree(vt)` | 内部使用 |
| `arkMethod.getViewTree() / setViewTree(vt) / hasViewTree()` | `@Builder` 方法的子树（用于嵌入到父组件） |

## 4. 典型应用场景

### 4.1 UI 反推 / 截图差异定位

通过 `getRoot().walk(...)` 拿到全部节点 + 属性后，可与运行时截图节点匹配，定位某属性在哪个 `.ets` / `.ts` 行被设置（`attributes` 的 `Stmt` 自带 `getOriginPositionInfo()`）。

### 4.2 状态依赖分析

`getStateValues()` 提供了"修改某 `@State` 字段会重渲染哪些子节点"的反向索引——在性能 / 重渲染优化中可定位"过度重渲染"的根因。

### 4.3 跨组件 prop 链路追踪

`stateValuesTransfer` 把父→子的 prop 链显式记录下来。多层组件嵌套时，可通过链式查询拿到一个状态变量从顶层流到叶子的完整链路（结合 [Def-Use Chain](./Def-Use%20Chain.md) 增强精度）。

### 4.4 ArkUI 组件最佳实践 lint

例如：
- `Column` 内嵌套过多节点 → 提示考虑 `LazyForEach`。
- `onClick` 内访问大量 `@State` → 检测潜在性能瓶颈。
- `@Builder` 方法被多次实例化 → 提示提取为子组件。

## 5. 使用示例

```typescript
import {
    Scene, SceneConfig, ClassCategory,
    ArkClass, ViewTreeNode,
} from 'arkanalyzer';

const config = new SceneConfig();
config.buildFromProjectDir('path/to/arkui-app');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes();

for (const arkFile of scene.getFiles()) {
    for (const arkClass of arkFile.getClasses()) {
        if (!arkClass.hasViewTree()) continue;
        const vt = arkClass.getViewTree()!;
        const root = vt.getRoot();
        if (!root) continue;

        console.log(`=== component: ${arkClass.getName()} ===`);

        // 1) 整树遍历
        const indent: WeakMap<ViewTreeNode, number> = new WeakMap();
        indent.set(root, 0);
        root.walk((node) => {
            const depth = indent.get(node) ?? 0;
            const tag = node.isCustomComponent() ? '<custom>'
                      : node.isBuilder()         ? '<builder>'
                      : '';
            console.log(`${'  '.repeat(depth)}- ${node.name} ${tag}`);
            for (const child of node.children) indent.set(child, depth + 1);
            return false;     // 不提前停止
        });

        // 2) 按属性排查
        root.walk((node) => {
            for (const [attr, [stmt, uses]] of node.attributes) {
                console.log(`  ${node.name}.${attr} <- [${uses.join(', ')}] @ ${stmt.getOriginPositionInfo()}`);
            }
            return false;
        });

        // 3) 状态字段 → 节点 反向索引
        for (const [field, nodes] of vt.getStateValues()) {
            console.log(`  state ${field.getName()} -> ${[...nodes].map(n => n.name).join(', ')}`);
        }

        // 4) 自定义子组件的 prop 传递
        root.walk((node) => {
            if (node.isCustomComponent() && node.stateValuesTransfer) {
                for (const [childField, parentField] of node.stateValuesTransfer) {
                    console.log(`  prop: ${childField.getName()} <- ${parentField}`);
                }
            }
            return false;
        });
    }
}
```

> 完整可运行示例可参考：[tests/samples/SceneTest.ts](../../tests/samples/SceneTest.ts) 与 [tests/unit/save/](../../tests/unit/save/) 下的 ArkUI 用例（如 `tests/resources/save/classes.ets`）。
