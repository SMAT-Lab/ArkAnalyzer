# Dummy Main 虚拟入口

## 1. 概述

ArkAnalyzer 在构建调用图（CallGraph）和执行指针分析（PTA）时，需要一个**入口方法**作为分析的起点。ArkTS 应用没有单一的 `main` 函数，而是由系统的 UIAbility 和 Component 生命周期方法驱动执行。为此，ArkAnalyzer 构造了一个虚拟入口方法 `@dummyMain`，模拟应用从启动到销毁的完整生命周期，将所有入口类（UIAbility、Component）的实例化与生命周期方法调用编织到一条可控的执行路径中。

`DummyMainCreater`（[`src/core/common/DummyMainCreater.ts`](../../src/core/common/DummyMainCreater.ts)）负责收集场景中的所有 Ability 和 Component 类，按系统调度时序将它们的生命周期方法分配到 CFG 的不同 BasicBlock 中，最终生成一个完整的 `ArkMethod` 作为全局入口。

---

## 2. CFG 结构

Dummy main 的 CFG 由四个部分组成，模拟应用从创建到销毁的完整过程：

```
┌──────────────────────────────────────────────────────────┐
│ firstBlock（首块）                                        │
│   this = @this                                            │
│   %statInit()              ← 静态初始化                   │
│   new + constructor        ← 类实例化                     │
│   onCreate                 ← Ability 创建阶段方法          │
│   onWindowStageCreate                                     │
│   onSessionCreate                                         │
│   aboutToAppear            ← Component 创建阶段方法        │
│   count = 0                                               │
└────────────────────────┬─────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────┐
│ whileBlock: while(true != false)  ──── (false) ──┐       │
└──────────┬─────────────────────────┬──────────────┤       │
           │ (true)                  │              │       │
           ▼                         │              ▼       │
  ┌────────────────────┐             │   ┌────────────────┐│
  │ if(count===0)      │             │   │ returnBlock    ││
  │  ├─true→ 配对方法组 │             │   │ （尾块）        ││
  │  └─false→ 下一个if │             │   │ 销毁阶段方法    ││
  └────────────────────┘             │   │ return void    ││
           ...                       │   └────────────────┘│
  ┌────────────────────┐             │                      │
  │ if(count===N)      │             │                      │
  │  ├─true→ 独立方法   │             │                      │
  │  └─false→ 回到while┘─────────────┘                      │
  └────────────────────┘                                    │
```

| 块               | 职责                             | 包含的方法                               |
| ---------------- | -------------------------------- | ---------------------------------------- |
| **firstBlock**   | 应用启动阶段的确定性、一次性回调 | 静态初始化、实例化、创建阶段生命周期方法 |
| **whileBlock**   | 永真循环，驱动中间阶段方法       | `while(true != false)`                   |
| **if-invoke 块** | 中间阶段的可重复回调和配对回调   | 配对方法组、独立生命周期方法             |
| **returnBlock**  | 应用销毁阶段的确定性、一次性回调 | 销毁阶段生命周期方法、`return void`      |

### 设计原则

方法被分配到哪个块，取决于两个关键判断：

1. **是否可重复执行**：创建/销毁阶段的一次性方法放入首块/尾块；可被多次触发的方法（如页面重新加载、前后台切换）放入 while 循环。
2. **是否成对交替出现**：运行时交替循环出现的方法对（如页面显示/隐藏）放入同一 BasicBlock，以保持它们之间的数据流连续性。

---

## 3. 生命周期方法分类

所有生命周期方法的分类配置集中在 [`src/utils/entryMethodUtils.ts`](../../src/utils/entryMethodUtils.ts) 中，由三个配置列表驱动：

- `LIFECYCLE_START_METHODS`：首块方法
- `LIFECYCLE_END_METHODS`：尾块方法
- `LIFECYCLE_PAIRED_METHOD_GROUPS`：配对方法组

`DummyMainCreater` 在收集方法时，按"首块 → 尾块 → 配对组 → 其余"的优先级进行分类，**不包含任何方法名硬编码分支**。新增或调整方法分类只需修改配置列表，无需改动 `DummyMainCreater`。

---

## 4. 首块方法（创建阶段）

### 配置

```typescript
export const LIFECYCLE_START_METHODS: string[] = ['onCreate', 'onWindowStageCreate', 'onSessionCreate', 'aboutToAppear'];
```

### 调度时序

```
Ability 启动
  │
  ├─ 1. onCreate(want, launchParam)      // Ability 实例创建后，系统用于初始化的回调
  │
  ├─ 2. onWindowStageCreate(windowStage)  // 窗口创建后触发，调用 loadContent 加载页面
  │    └─ loadContent → 触发 Component 实例化
  │         │
  │         （UIExtensionAbility 场景不触发 onWindowStageCreate，而是触发 onSessionCreate）
  │
  ├─ 2'. onSessionCreate()               // UIExtensionAbility 专用，与 onWindowStageCreate 互斥
  │
  └─ 3. aboutToAppear()                   // Component 实例创建后、build() 前调用
```

### 分类依据

| 方法                  | 不可重复执行 | 说明                                     |
| --------------------- | :----------: | ---------------------------------------- |
| `onCreate`            |      ✅      | Ability 创建后只执行一次                 |
| `onWindowStageCreate` |      ✅      | 窗口创建后只执行一次                     |
| `onSessionCreate`     |      ✅      | 会话创建一次性事件（UIExtensionAbility） |
| `aboutToAppear`       |      ✅      | 组件实例创建后只执行一次                 |

> **注意**：`build`、`onWillApplyTheme`、`onDidBuild` 虽然在组件创建阶段执行，但它们**可被重复触发**（页面重新加载、主题切换等），因此放入 while 循环而非首块。

---

## 5. 尾块方法（销毁阶段）

### 配置

```typescript
export const LIFECYCLE_END_METHODS: string[] = [
    'onWindowStageWillDestroy',
    'aboutToDisappear',
    'onDetached',
    'onWindowStageDestroy',
    'onSessionDestory',
    'onDestroy',
];
```

### 调度时序

```
应用退出
  │
  ├─ 1. onWindowStageWillDestroy()   // 窗口即将销毁，此时组件仍挂在窗口上
  │
  ├─ 2. aboutToDisappear()            // 组件析构销毁（窗口开始销毁后，组件被清理）
  │
  ├─ 3. onDetached()                  // 组件从组件树分离
  │
  ├─ 4. onWindowStageDestroy()        // 窗口已销毁，组件已不在
  │
  ├─ 4'. onSessionDestory()           // 会话销毁（UIExtensionAbility 专用，与 onWindowStageDestroy 互斥）
  │
  └─ 5. onDestroy()                   // Ability 最终销毁
```

### 分类依据

| 方法                       | 不可重复执行 | 说明                                   |
| -------------------------- | :----------: | -------------------------------------- |
| `onWindowStageWillDestroy` |      ✅      | 窗口即将销毁，一次性                   |
| `aboutToDisappear`         |      ✅      | 组件析构，一次性                       |
| `onDetached`               |      ✅      | 组件分离，一次性                       |
| `onWindowStageDestroy`     |      ✅      | 窗口已销毁，一次性                     |
| `onSessionDestory`         |      ✅      | 会话销毁，一次性（UIExtensionAbility） |
| `onDestroy`                |      ✅      | Ability 销毁，一次性                   |

### 顺序说明

组件挂在窗口上，因此销毁顺序为：**窗口开始销毁 → 组件在窗口销毁过程中被清理 → 窗口销毁完成 → Ability 销毁**。`aboutToDisappear` 和 `onDetached` 位于 `onWindowStageWillDestroy` 与 `onWindowStageDestroy` 之间，反映组件在窗口开始销毁后被清理、窗口完全销毁时组件已不在的实际时序。

---

## 6. 配对方法组（中间阶段）

### 配置

```typescript
export const LIFECYCLE_PAIRED_METHOD_GROUPS: string[][] = [
    ['aboutToRecycle', 'aboutToReuse'],
    ['onPageShow', 'onPageHide'],
    ['onWillForeground', 'onForeground', 'onDidForeground', 'onWillBackground', 'onBackground', 'onDidBackground'],
    ['onFormRecycle', 'onFormRecover'],
];
```

### 配对原则

两个方法被放入同一 BasicBlock 的条件：

1. **交替循环出现**：在应用运行过程中反复触发，而非一次性事件。
2. **存在数据流依赖**：前一个方法中获取/修改的资源在后一个方法中释放/恢复，紧邻执行才能建立有效数据流路径。

不满足条件的方法保持各自独立的 if 块。例如 `onSessionCreate`/`onSessionDestory` 虽然语义上对称，但它们是一次性事件（不会交替循环），因此分别放入首块和尾块而非配对。

### 逐组分析

#### 组1：组件复用 — `aboutToRecycle` → `aboutToReuse`

| 属性       | 说明                                                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| 调度场景   | 列表滚动等场景中，可复用组件移出可视区域 → `aboutToRecycle`（加入复用池）；新同类组件需要显示 → `aboutToReuse`（从池取出） |
| 交替性     | ✅ 反复 recycle→reuse 循环                                                                                                 |
| 数据流依赖 | ✅ recycle 时保存状态，reuse 时恢复/重置状态                                                                               |

```
组件移出可视区域                 组件需要重新显示
     │                               │
     ▼                               ▼
aboutToRecycle()  ──→  复用池  ──→  aboutToReuse()
     │                               │
     └───── 反复循环 ────────────────┘
```

#### 组2：页面显示/隐藏 — `onPageShow` → `onPageHide`

| 属性       | 说明                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------- |
| 调度场景   | 路由跳转、应用前后台切换时，页面显示触发 `onPageShow`，隐藏触发 `onPageHide`                |
| 交替性     | ✅ 基本严格交替。`onPageShow` 后最终必有 `onPageHide`；`onPageHide` 后可能再次 `onPageShow` |
| 数据流依赖 | ✅ `onPageShow` 中注册的监听/获取的资源在 `onPageHide` 中取消/释放                          |

```
页面显示                         页面隐藏
   │                               │
   ▼                               ▼
onPageShow()  ─────────────────→ onPageHide()
   │                               │
   └───── 反复循环 ────────────────┘
```

#### 组3：前台/后台切换 — `onWillForeground` → `onForeground` → `onDidForeground` → `onWillBackground` → `onBackground` → `onDidBackground`

| 属性       | 说明                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 调度场景   | 应用进入前台时连续触发 `onWillForeground`→`onForeground`→`onDidForeground`；进入后台时连续触发 `onWillBackground`→`onBackground`→`onDidBackground` |
| 交替性     | ✅ 前台序列与后台序列交替循环                                                                                                                      |
| 数据流依赖 | ✅ `onForeground` 中获取的资源在 `onBackground` 中释放；Will/Did 钩子操作同一份状态                                                                |

```
进入前台                              进入后台
  │                                      │
  ├─ onWillForeground()                  ├─ onWillBackground()
  ├─ onForeground()                      ├─ onBackground()
  └─ onDidForeground()  ──→ ... ──→      └─ onDidBackground()
         │                                        │
         └──────────── 反复循环 ──────────────────┘
```

> 注释依据：`onWillForeground` "在 onForeground **前**被调用"，`onDidForeground` "在 onForeground **后**被调用"。

#### 组4：卡片回收/恢复 — `onFormRecycle` → `onFormRecover`

| 属性       | 说明                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------ |
| 调度场景   | 卡片回收时执行 `onFormRecycle`（返回序列化状态），卡片恢复时执行 `onFormRecover`（接收状态恢复） |
| 交替性     | ✅ 卡片可被多次回收和恢复                                                                        |
| 数据流依赖 | ✅ recycle 时序列化保存状态，recover 时反序列化恢复状态                                          |

```
卡片回收                          卡片恢复
   │                                │
   ▼                                ▼
onFormRecycle()  ──→  序列化状态  ──→  onFormRecover()
   │                                │
   └───── 反复循环 ─────────────────┘
```

### 不配对的方法

以下方法虽然语义上对称，但**不满足交替循环条件**，因此不配对：

| 方法对                                 | 不配对原因                                                       |
| -------------------------------------- | ---------------------------------------------------------------- |
| `onSessionCreate` / `onSessionDestory` | 一次性事件，创建后最终销毁一次，不交替循环。已分别放入首块和尾块 |
| `onBackup` / `onRestore`               | 甚至不在同一应用实例中发生（上一实例备份，下一实例恢复）         |
| `onAddForm` / `onRemoveForm`           | 一次性事件，添加后可能长期存在直到应用销毁                       |

---

## 7. DummyMainCreater 通用化设计

### 配置驱动

`DummyMainCreater` 不为每个方法名编写特殊分支，而是通过三个通用数据结构收集方法：

| 数据结构             | 类型                       | 用途                     |
| -------------------- | -------------------------- | ------------------------ |
| `startMethods`       | `Map<string, ArkMethod[]>` | 首块方法，按方法名分组   |
| `endMethods`         | `Map<string, ArkMethod[]>` | 尾块方法，按方法名分组   |
| `pairedMethodGroups` | `Map<number, ArkMethod[]>` | 配对方法组，按组索引分组 |

分类逻辑由 `classifyMethod()` 统一处理，按优先级检查：首块 → 尾块 → 配对组 → 其余生命周期方法。

### 新增方法的改动

新增或调整方法分类时，**只需修改 `entryMethodUtils.ts` 中的配置列表**，`DummyMainCreater` 无需任何改动：

| 场景         | 需要修改的文件                                            |
| ------------ | --------------------------------------------------------- |
| 新增首块方法 | `entryMethodUtils.ts` 的 `LIFECYCLE_START_METHODS`        |
| 新增尾块方法 | `entryMethodUtils.ts` 的 `LIFECYCLE_END_METHODS`          |
| 新增配对组   | `entryMethodUtils.ts` 的 `LIFECYCLE_PAIRED_METHOD_GROUPS` |

---

## 8. 使用方式

```typescript
import { DummyMainCreater, Scene, SceneConfig } from 'arkanalyze';

// 1. 构建 Scene
let config = new SceneConfig();
config.buildFromProjectDir(projectPath);
let scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes();

// 2. 创建 dummy main
const creater = new DummyMainCreater(scene);
creater.createDummyMain();
const dummyMain = creater.getDummyMain();

// 3. 作为入口构建调用图
// dummyMain 的 CFG 已包含所有生命周期方法的调用路径
```

`DummyMainCreater` 支持以下可选参数：

| 参数                  | 类型         | 说明                                     |
| --------------------- | ------------ | ---------------------------------------- |
| `dummyMethodName`     | `string`     | 自定义方法名，默认 `@dummyMain`          |
| `classScope`          | `ArkClass[]` | 限定只收集指定类的生命周期方法           |
| `extraInstanceAssign` | `boolean`    | 在实例调用后添加额外赋值语句（用于 PTA） |

---

## 9. 相关文件

| 文件                                                                               | 说明                                             |
| ---------------------------------------------------------------------------------- | ------------------------------------------------ |
| [`src/core/common/DummyMainCreater.ts`](../../src/core/common/DummyMainCreater.ts) | Dummy main 创建器，通用化 CFG 构建               |
| [`src/utils/entryMethodUtils.ts`](../../src/utils/entryMethodUtils.ts)             | 生命周期方法名列表与分类配置（首块/尾块/配对组） |
| [`src/core/common/Const.ts`](../../src/core/common/Const.ts)                       | Dummy main 相关常量（文件名、类名、方法名）      |
| [`tests/unit/DummyMain.test.ts`](../../tests/unit/DummyMain.test.ts)               | 单元测试                                         |
| [`docs/analysis/CallGraph.md`](./CallGraph.md)                                     | 调用图分析，dummy main 作为入口的使用方式        |
