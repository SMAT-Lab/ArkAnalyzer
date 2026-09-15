## Context

ArkAnalyzer 当前架构以 `Scene` 为中心容器，前端解析（`FrontendBuilder` → `ArktsFrontend`）将源码转换为 `ArkFile` / `ArkClass` / `ArkMethod` 模型，再由 `CallGraphBuilder`（CHA/RTA）和指针分析（PAG）构建调用图。类型推导由 `TypeInference`、`IRInference`、`ModelInference`、`ValueInference` 等模块完成。

现有性能基础设施包括：

- **Canonicalizer<T>**（`src/utils/Canonicalizer.ts`）：已完整实现 3 种策略（objectIdentity / numberWithEquality / stringIdentity），支持 TypedArray 哈希表和 Symbol 属性标记，内部维护 `list: T[]` 数组，`get(id)` 直接返回 `list[id]`——ID→对象的映射已内置。原仅用于 `ArkModule → ModuleID`。
- **IntMap / PackedSparseMap**（`src/utils/`）：SoA 数据结构已实现但仅局部使用。
- **模块级缓存**：`ModuleCache` + `MemoryMonitor`（`src/frontend/common/`）已支持模块 load/unload 复用和基于 heapUsed 的 LRU 驱逐。
- **性能测试框架**：`tests/samples/perf/` 提供多轮基准测试和 RSS 峰值对比。

**签名现状分析**：

- 4 类签名已有 `toMapKey()`（FileSignature、ClassSignature、MethodSignature、NamespaceSignature），FieldSignature 缺失。
- 签名创建点分散（88+33 处 `new`），同一逻辑签名存在多个实例。
- 代码中 6 处使用 `===` 引用比较签名（TypeInference:1101、IRInference:146,154、ModelUtils:674,677、TypeInference:1149,1155），多实例时存在潜在缺陷。
- 类型推导中频繁重建签名（IRInference 中 12+ 处 `new MethodSignature` / `new AliasClassSignature` / `new FieldSignature`），重建后不经去重直接使用。
- Builder 阶段 extends/implements 目标的签名不明确（文件来源未知），需推导阶段修正。

**关键约束**：

1. ArkAnalyzer 作为其他项目的依赖项发布，所有对外 API 必须保持向后兼容。
2. 类型推导阶段签名的修正（`setClassSignature` 等）会改变签名值，不能简单地在 builder 阶段一次性 ID 化。
3. 项目依赖极简（`commander`、`log4js`），不能引入重量级依赖。
4. ArkBody 内部结构（CFG、locals、stmts）复杂且与 IR 指令系统深度耦合，本轮不 ID 化。
5. **当前设计假设 ArkAnalyzer 运行时只有 1 个 Scene 实例**。`SignatureCanonicalizerRegistry` 作为全局单例，所有 canonicalizer 和模型存储在单例中。如果未来需要适配多个 Scene 实例，只需：Registry 从全局单例改为 per-Scene 实例（`Registry.forScene(scene)` 获取）；`dispose()` 时清空当前 Scene 对应的 Registry。这两个改动都很小，不影响核心设计。

## Goals / Non-Goals

**Goals:**

1. 5 类签名 + MethodSubSignature 实现 ID 化，`===` 比较缺陷通过 `toMapKey()` 值比较修复。
2. Scene 内部 Map key 从 `string` 改为 `number`，并通过 `SignatureModelCanonicalizer` 内置的 `models` 数组替代独立的 `Map<number, Model>`，降低内存开销。
3. 模型间关系引用新增 ID 字段（ID 优先 + 对象引用回退），为序列化奠定基础。
4. 类型推导阶段的签名回写通过 setter 清除 ID 缓存确保一致性；`===` 比较改为 `toMapKey()` 值比较。
5. `SignatureCanonicalizerRegistry` 全局单例提供所有 canonicalizer 的统一访问入口，消除模型上的 `scene` 引用和懒加载逻辑。
6. **推导阶段尽量不新增正式 ID**（非强制约束）：优先通过 `getExistingId(realSig)` 查找已有正式 ID；仅在必须创建新正式 ID 时（如 AliasClassSignature 等推导中动态产生且 builder 阶段无法预注册的签名），才通过 `getId(sig)` 新建。
7. 签名对象单实例化：模型签名 setter 自动调用 `intern()`，确保 `===` 引用比较更安全。
8. 所有改动对外部 API 透明，现有单测全部通过。

**Non-Goals:**

1. 不改变 ArkIR 的语义和 IR 指令集。
2. 不改变 CLI 接口（`cg`、`ir` 子命令的参数和输出格式）。
3. 不重构前端解析器本身的解析逻辑（AST → IR 的转换规则不变）。
4. 不 ID 化 ArkBody 内部结构（locals、stmts、CFG）。
5. 不 ID 化 LocalSignature 和 AliasTypeSignature（使用场景较少，后续按需扩展）。
6. 不实现签名使用表（Signature Usage Table）— 作为后续独立变更，当前仅预留架构扩展点。
7. 不实现 Scene 序列化/反序列化 — ID 化为其奠定基础，但序列化本身不在本轮范围。
8. 不修改 `ArkModule.filesMap` 和 `ModuleScene.moduleFileMap`（模块级 Map，与 Scene 级不同）。
9. 不适配多个 Scene 实例（当前假设单 Scene；未来适配改动很小）。

## Decisions

### D1: SignatureCanonicalizerRegistry — 全局单例 Registry

**决策**：所有 canonicalizer 集中在 `SignatureCanonicalizerRegistry` 全局单例中，不放在 Scene 上。任何代码通过 `SignatureCanonicalizerRegistry.getInstance()` 或静态快捷方法直接访问，无需通过 Scene。

**设计参考**：HomeFlow 项目的 `CFGManager` 单例模式——canonicalizer 作为公共字段，通过 `getInstance()` 或静态方法 `getStmtCanonicalizer()` 全局访问。

**Registry 结构**：

```
SignatureCanonicalizerRegistry (全局单例)
├── fileSigCanonicalizer: SignatureModelCanonicalizer<FileSignature, ArkFile>
├── classSigCanonicalizer: SignatureModelCanonicalizer<ClassSignature, ArkClass>
├── namespaceSigCanonicalizer: SignatureModelCanonicalizer<NamespaceSignature, ArkNamespace>
├── fieldSigCanonicalizer: SignatureModelCanonicalizer<FieldSignature, ArkField>
├── methodSigCanonicalizer: SignatureModelCanonicalizer<MethodSignature, ArkMethod>  (n:1，impl + declare 槽位)
├── customComponentMap: Map<string, ClassSignature>  (保留，与 ID 体系无关)
├── sdkGlobalMap: Map<string, ArkExport[]>  (SDK 全局符号多值表，round9 新增)
├── firstProjectFileSigID: number  (project/SDK 文件 ID 边界，见 markProjectFileBoundary)
├── tempClassSigCanonicalizer: TempSignatureCanonicalizer<ClassSignature>
├── tempMethodSigCanonicalizer: TempSignatureCanonicalizer<MethodSignature>
├── tempFieldSigCanonicalizer: TempSignatureCanonicalizer<FieldSignature>
│
├── static getInstance(): SignatureCanonicalizerRegistry
├── static dispose(): void
├── getFileId(sig): number
├── getClassById(id): ArkClass | undefined
├── ... (其他实例快捷方法)
```

> **实现勘误（round8 后最终状态）**：① 无 tempFile/tempNamespace 空间——两者实测永久为空（FileSignature 是身份根、从不被 temp 持有；namespace 不明确场景走 SigID 重载），已删除；② `methodsMap` 已删除——methodSigCanonicalizer 升级为 `SignatureModelCanonicalizer`，模型存其内置 `models` 数组（即 S1）；③ ID 查询/注册族（`getFileId` / `getArkClassById` 等）为**实例**方法（`@internal`），经 `getInstance()` 调用，另有 `registerClass` / `removeFile` 等 register/remove 静态方法；④ `sdkGlobalMap` 从 Scene 迁入并多值化（同名多实体，entry[0] 兼容旧单值语义）；⑤ 新增 `markProjectFileBoundary()` / `isProjectFileID()` / `isSdkFileID()`——project/SDK 文件按 FileSigID 区间切分，取代逐文件 `projectFile` 过滤。

**理由**：

- 消除模型上的 `scene` 引用——所有 ID 查询通过 Registry 全局访问，不需要模型持有 Scene 引用
- 消除 Scene 上的 `internXxxSig()`/`getXxxById()` 辅助方法——直接通过 Registry 调用（当前代码保留为委托，待删除）
- 消除 Scene 上的 `filesMap`/`classesMap`/`namespacesMap`/`sdkArkFilesMap`——canonicalizer 的 `models` 数组替代
- 消除 `setScene()` 级联传播——不需要
- 消除懒加载逻辑——Builder 阶段直接设置 ID
- 与 HomeFlow 项目设计模式一致

**生命周期**：`Scene.dispose()` 和 `Scene.clear()` 调用 `SignatureCanonicalizerRegistry.dispose()` 清空单例。重新使用时 `getInstance()` 自动重建并初始化 DEFAULT 签名（ID=0）。

**替代方案（已否决）**：

- _canonicalizer 放在 Scene 上 + 模型持有 scene 引用 + 懒加载_：session1 采用此方案。问题：每个模型增加 8 字节 scene 引用；`setScene()` 级联传播复杂；懒加载在 setter 修正签名后需要重计算，逻辑复杂。Registry 全局单例方案更简洁。
- _单 canonicalizer + 不明确签名不 ID 化_：与"内部 ID 传递"Requirement 矛盾——所有关系引用都改为 ID，不明确签名也必须有 ID。
- _单 canonicalizer + ID 空洞_：不明确签名获得正式 ID 但无对应 ArkClass，破坏 1:1 不变式，序列化时产生空洞。

### D2: SignatureModelCanonicalizer — 签名+模型统一存储

**决策**：扩展 `SignatureCanonicalizer` 为 `SignatureModelCanonicalizer<S, M>`，新增 `models: (M | undefined)[]` 数组，ID→签名和 ID→模型共用同一 ID 空间。

```
SignatureModelCanonicalizer<S extends Canonicalizable, M>
├── 继承 SignatureCanonicalizer 的所有方法（getId/getExistingId/get/intern/size/clear）
├── models: (M | undefined)[]              // ID → 模型，undefined = 未注册或已删除
├── setModel(id, model): void              // 注册模型
├── getModel(id): M | undefined            // ID → 模型，O(1) 数组索引
├── removeModel(id): void                  // 移除模型（设为 undefined，保留 ID）
├── getModels(): M[]                       // 所有已注册模型（过滤 undefined）
```

**适用范围**：

| canonicalizer 类型                | 签名 ↔ 模型关系 | 使用 SignatureModelCanonicalizer                               |
| --------------------------------- | --------------- | -------------------------------------------------------------- |
| FileSignature ↔ ArkFile           | 1:1             | ✅                                                             |
| ClassSignature ↔ ArkClass         | 1:1             | ✅                                                             |
| NamespaceSignature ↔ ArkNamespace | 1:1             | ✅                                                             |
| FieldSignature ↔ ArkField         | 1:1             | ✅                                                             |
| MethodSignature ↔ ArkMethod       | n:1             | ❌ 用 `SignatureCanonicalizer`（无 models）+ 独立 `methodsMap` |

**理由**：`Canonicalizer<T>` 内部已维护 `list: T[]`（ID→对象），HomeFlow 直接用 `get(id)` 获取对象。ArkAnalyzer 的签名和模型是不同对象（`FileSignature` ≠ `ArkFile`），需要额外的 `models` 数组存 ID→模型映射。将两者统一在同一个 canonicalizer 中管理，消除独立 Map。

### D3: 签名与模型共用 ID

**决策**：

| 签名类型                             | 与模型共用 ID | 关系 | 说明                                                       |
| ------------------------------------ | ------------- | ---- | ---------------------------------------------------------- |
| FileSignature ↔ ArkFile              | ✅            | 1:1  | ID >= 1，`Registry.fileSigCanonicalizer.getModel(id)`      |
| ClassSignature ↔ ArkClass            | ✅            | 1:1  | ID >= 1，`Registry.classSigCanonicalizer.getModel(id)`     |
| NamespaceSignature ↔ ArkNamespace    | ✅            | 1:1  | ID >= 1，`Registry.namespaceSigCanonicalizer.getModel(id)` |
| FieldSignature ↔ ArkField            | ✅            | 1:1  | ID >= 1，`Registry.fieldSigCanonicalizer.getModel(id)`     |
| MethodSignature ↔ ArkMethod          | ❌            | n:1  | methodSigCanonicalizer 内置 models（impl + declare 槽位注册，S1 已删除独立 methodsMap） |
| MethodSubSignature ↔ MethodSignature | 共用          | 1:1  | 不设独立 canonicalizer，随 MethodSignature 一起单实例化    |

- ID 0 固定给 DEFAULT 签名，不对应任何模型（`models[0]` = `undefined`）
- 临时 ID 不与任何模型共用

**理由**：1:1 共用使得"签名 ID"和"模型数组索引"统一，查询为 O(1) 数组索引，无需额外 Map。MethodSignature 因重载 n:1 无法共用，但 `toMapKey()` 已包含完整身份信息（classSig + methodName + paramTypes + staticFlag），可独立索引。

**DEFAULT 签名的 lazy getter**：`FieldSignature.DEFAULT` 和 `MethodSignature.DEFAULT` 引用 `UnknownType.getInstance()`（来自 `Type.ts`），而 `Type.ts` import `ArkSignature.ts`，形成循环依赖。如果用 `static readonly` 在模块加载时初始化，`UnknownType` 可能尚未定义。因此这两个 DEFAULT 属性使用 lazy getter pattern（`private static _default?` + `public static get DEFAULT()`），在首次访问时才创建实例，避免循环依赖问题。`FileSignature.DEFAULT`、`ClassSignature.DEFAULT`、`NamespaceSignature.DEFAULT` 无此问题（不引用 `Type.ts`），保持 `static readonly`。

**签名→ID 转换不放在签名类上**：原设计计划在签名类上新增 `toMapKeyId(): number` 方法，但签名类无法访问 Scene 上的 canonicalizer（`ArkSignature.ts` ↔ `Type.ts` 循环依赖，且签名类不应依赖 Scene）。改为在 Registry 上提供统一 ID 转换（`Registry.getInstance().fileSigCanonicalizer.getId(sig)` 等）。

### D4: toMapKey 设计原则 — 排除可变字段

**决策**：`toMapKey()` 仅包含身份标识字段，排除推导中可变的字段。

| 签名类型               | toMapKey 包含                                            | 排除（可变字段） | 排除理由                                       |
| ---------------------- | -------------------------------------------------------- | ---------------- | ---------------------------------------------- |
| FileSignature          | hashcode(projectName+fileName) + basename                | —                | —                                              |
| NamespaceSignature     | 上层 toMapKey + namespaceName                            | —                | —                                              |
| ClassSignature         | 上层 toMapKey + className                                | —                | `setClassName` 极少使用（仅 C++ 前端特殊场景） |
| MethodSignature        | classSig.toMapKey + methodName + paramTypes + staticFlag | **returnType**   | `setReturnType()` 推导中频繁调用               |
| FieldSignature（新增） | declaringSig.toMapKey + fieldName + staticFlag           | **type**         | `setType()` 推导中调用                         |

**FieldSignature.toMapKey() 实现**：

```typescript
public toMapKey(): string {
    let tmpSig = this.fieldName;
    if (this.isStatic()) {
        tmpSig = '[static]' + tmpSig;
    }
    return this.getDeclaringSignature().toMapKey() + '.' + tmpSig;
}
```

与 `toString()` 的唯一区别：递归调用 `toMapKey()` 而非 `toString()`。

**AliasClassSignature 处理**：继承 `toMapKey()` 不覆盖，但 `getClassName()` 被 override 返回 `aliasName`，因此 `toMapKey()` 自然不同——正确行为，无需额外处理。

**toMapKey 与 canonicalizer 去重的关系**：当前 `SignatureCanonicalizer` 采用 hash + equals 三层架构做值语义去重（见 D8），`toMapKey()` 不再作为 canonicalizer 的去重依据。但 `toMapKey()` 仍用于代码中的值比较（如 `TypeInference.isSameType()` 的 `toMapKey()` 值比较）和调试输出。

### D5: 模型间关系引用 — ID 优先，对象引用回退

**决策**：模型间关系引用采用 **ID 优先 + 对象引用回退** 的双存储策略。`getDeclaringArkFile()` / `getDeclaringArkClass()` / `getDefaultClass()` / `getOuterMethod()` 优先通过 ID 从 Registry 查询模型对象，对象引用作为回退（过渡期保留）。**不在 ArkClass/ArkMethod/ArkNamespace/ArkField 上存储 scene 引用**——ID 查询通过 `SignatureCanonicalizerRegistry` 全局单例完成。

**演进路线**：
1. **阶段 1（已完成）**：ID 字段作为辅助存储，懒加载通过 Registry
2. **阶段 2（已完成）**：Builder 阶段显式设置 ID（ArkMethod/ArkField），`getDeclaringArkFile()` 等改为 ID 优先
3. **阶段 3（未来）**：ID 为主存储，对象引用逐步取消

**双存储字段对照**：

| 模型         | 对象引用（回退）              | ID 字段（主存储）               | getter 实现                          | ID 设置时机  |
| ------------ | ----------------------------- | ------------------------------- | ------------------------------------ | ------------ |
| ArkFile      | `defaultClass: ArkClass`      | `defaultClassID: number = -1`   | `getDefaultClass()` ID 优先          | 懒加载       |
| ArkClass     | `declaringArkFile: ArkFile`   | `declaringFileID: number = -1`  | `getDeclaringArkFile()` ID 优先      | Builder 阶段 |
| ArkMethod    | `declaringArkClass: ArkClass` | `declaringClassID: number = -1` | `getDeclaringArkClass()` ID 优先     | Builder 阶段 |
| ArkMethod    | `outerMethod: ArkMethod?`     | `outerMethodSigID: number = -1` | `getOuterMethod()` ID 优先           | Builder 阶段 |
| ArkNamespace | `declaringArkFile: ArkFile`   | `declaringFileID: number = -1`  | `getDeclaringArkFile()` ID 优先      | Builder 阶段 |
| ArkField     | `declaringClass: ArkClass`    | `declaringClassID: number = -1` | `getDeclaringArkClass()` ID 优先     | Builder 阶段 |

**ID 优先 getter 模式**：
```typescript
// 以 ArkClass.getDeclaringArkFile() 为例
public getDeclaringArkFile(): ArkFile {
    if (this.declaringArkFile) {
        return this.declaringArkFile;  // 对象引用回退
    }
    if (this.declaringFileID !== -1) {
        return SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.getModel(this.declaringFileID)!;
    }
    return undefined as unknown as ArkFile;
}
```

**Builder 阶段 ID 设置**：所有模型在 Builder 阶段通过 `setDeclaringFileID(Registry.getInstance().fileSigCanonicalizer.getId(arkFile.getFileSignature()))` 或 `setDeclaringClassID(Registry.getInstance().classSigCanonicalizer.getId(cls.getSignature()))` 显式设置 ID。`getId(sig)` 在签名首次出现时分配递增整数 ID，后续 `setFile()` 中 `internFileSig(sig)` 返回同一个 ID，`setModel(id, file)` 设置 model。ID 全程一致。

**ID 分配顺序与 `getFiles()` 顺序**：Builder 阶段 `getId(arkFile.getFileSignature())` 在 `buildDefaultArkClassFromArkFile` 中调用，先于 `setFile()`。这使得 `getFiles()` 返回的文件顺序从"依赖排序（被依赖者在前）"变为"解析顺序（当前文件在前）"。这是正确的行为——`getDependencyFilesDeeply` 的语义就是"先解析当前文件，再递归解析依赖文件"。

**Type/Signature 层双字段**：

| 持有者          | 字段                                     | `@internal` getter                                       |
| --------------- | ---------------------------------------- | -------------------------------------------------------- |
| ClassType       | classSigID + tempSigID                   | `getClassSigID()` / `getTempSigID()` / `setTempSigID()`  |
| FunctionType    | methodSigID + tempSigID                  | `getMethodSigID()` / `getTempSigID()` / `setTempSigID()` |
| LexicalEnvType  | methodSigID                              | `getMethodSigID()`                                       |
| EnumValueType   | fieldSigID                               | `getFieldSigID()`                                        |
| MethodSignature | declaringClassSigID + declaringTempSigID | `getDeclaringClassSigID()` / `getDeclaringTempSigID()`   |
| FieldSignature  | declaringSigID + declaringTempSigID      | `getDeclaringSigID()` / `getDeclaringTempSigID()`        |

`LexicalEnvType` 和 `EnumValueType` 不设 tempSigID（不明确签名场景较少）。

**setter 清除缓存**：`setClassSignature(realSig)` 等 setter 更新对象引用后清除 ID 缓存（`sigID = -1` + `tempSigID = undefined`），下次需要 ID 时由调用方通过 Registry 重新获取并设置。

**ArkFile.projectFile 标记**：ArkFile 新增 `projectFile: boolean = false` 字段，`setFile()` 时设为 `true`（本项目文件），`addSdkArkFile()` 时设为 `false`（非本项目文件）。`getFiles()` 过滤 `isProjectFile()`，`getSdkArkFiles()` 过滤 `!isProjectFile()`。

**ArkFile.scene 引用保留**：ArkFile 作为顶层模型，天然属于某个 Scene。保留 `scene: Scene` 引用，使 `getDeclaringArkFile().getScene()` 链式访问仍然可用（65 处调用点无需修改）。`ArkFile.setScene()` 恢复为仅 `this.scene = scene`（无级联传播）。未来消除 ArkClass/ArkMethod 等对 ArkFile 的直接对象引用时，不影响 Scene 访问。

**ArkClass.heritageClasses 和 extendedClasses**：当前保持对象引用形式（`heritageClassWithInfo.baseClass: ArkClass` 和 `Map<string, ArkClass>`），未来迁移到 ID 时改为 `baseClassID: number` 和 `Map<string, number>`。本轮不修改（heritage 在推导阶段惰性填充，时序复杂）。

**ArkBody 不强制 ID 传递**：`locals`、`usedGlobals`、`cfg`、`aliasTypeMap` 等保持对象形式。

### D6: Scene 公开 API — 委托 Registry

**决策**：Scene 公开 API 保留（向后兼容），内部委托 `SignatureCanonicalizerRegistry`。

```typescript
// Scene.getFile() — 委托 Registry
public getFile(fileSignature: FileSignature): ArkFile | null {
    const reg = SignatureCanonicalizerRegistry.getInstance();
    const id = reg.fileSigCanonicalizer.getExistingId(fileSignature);
    if (id === -1) return null;
    return reg.fileSigCanonicalizer.getModel(id) ?? null;
}

// Scene.getFiles() — 过滤 project 文件
public getFiles(): ArkFile[] {
    return SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.getModels()
        .filter(f => f.isProjectFile());
}

// Scene.getClass() — 委托 Registry
public getClass(classSignature: ClassSignature): ArkClass | null {
    const reg = SignatureCanonicalizerRegistry.getInstance();
    const id = reg.classSigCanonicalizer.getExistingId(classSignature);
    if (id === -1) return null;
    return reg.classSigCanonicalizer.getModel(id) ?? null;
}
```

**已消除的内容**：

| 消除项                                                            | 替代方案                                                 |
| ----------------------------------------------------------------- | -------------------------------------------------------- |
| Scene 的 `filesMap`/`classesMap`/`namespacesMap`/`sdkArkFilesMap` | `Registry.xxxCanonicalizer.getModels()` / `getModel(id)` |
| Scene 的 10 个 canonicalizer 字段                                 | Registry 持有                                            |
| Scene 的 `internDefaults()` / `clearSignatureCanonicalizers()`    | Registry 构造函数 / `Registry.dispose()`                 |
| `getClassesMap(refresh)`                                          | 删除——ID 稳定，无需 refresh                              |
| 模型上的 `scene?: Scene` 字段和 `setScene()` 级联传播             | Registry 全局访问                                        |

**已删除的内容**（tasks §13 在后续轮次完成，proposal 中原列为"待删除"）：

| 已删除项                                            | 删除后替代方案                                 |
| --------------------------------------------------- | ---------------------------------------------- |
| Scene 的 `internFileSig()`/`internClassSig()` 等方法 | 调用方直接使用 `Registry.getInstance().xxxCanonicalizer.getId(sig)` |
| Scene 的 `getFileById()`/`getClassById()` 等方法    | 调用方直接使用 `Registry.getInstance().xxxCanonicalizer.getModel(id)` |

**已删除的内容（原"待重新探索"项）**：

| 已删除项                  | 删除时状态                                                 | 最终替代方案                                     |
| ------------------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| `getMethodsMap(refresh)`  | 曾回退保留（inferTypes 需 refresh 重建），后续轮次彻底删除   | methodSigCanonicalizer 为唯一事实源，ID 稳定无需 refresh；`getMethods()` 平面遍历收集 |

**实施历史**：`getMethodsMap(refresh)` 在 session2 中尝试删除，发现 `inferTypes()` 仍需 refresh 重建 methodsMap（类型推导过程中新增的方法需要被 methodsMap 包含），已回退保留。待重新探索是否能消除 refresh 依赖（可能需要推导中增量注册方法到 methodsMap）。

**保留的内容**：

| 保留项                                            | 原因                                 |
| ------------------------------------------------- | ------------------------------------ |
| `methodsMap: Map<number, ArkMethod>`              | n:1 关系，移到 Registry              |
| `customComponentMap: Map<string, ClassSignature>` | name→signature 查找表，移到 Registry |
| Scene 公开 API                                    | 向后兼容                             |

### D7: 类型推导阶段的签名处理

**决策**：推导中所有签名操作（重建、回写、比较、查找）均经过 canonicalizer，且尽量不新增正式 ID。`===` 比较风险点改为 `toMapKey()` 值比较；setter 清除 ID 缓存。

**设计约束（非强制）**：Builder 阶段所有 ArkFile/ArkClass/ArkMethod/ArkField/ArkNamespace 模型创建后，其签名已注册到正式 canonicalizer 获得正式 ID。推导阶段优先通过 `getExistingId(realSig)` 查找已有正式 ID 并替换临时 ID 引用，仅在必须创建新正式 ID 时（如 `AliasClassSignature` 等推导中动态产生且 builder 阶段无法预注册的签名）才通过 `getId(sig)` 新建。

> **⚠ 实现状态标注**：此设计约束**已实现**。懒加载 getter（`getClassSigID()` 等）已改为先 `getExistingId` 查找已有正式 ID，仅当查找失败时 `getId` 新建。临时 ID 的 `register()`/`release()` 已在 ArkSignatureBuilder 和 setter 中接入（方案B）。详见 tasks 14.x（已完成）。

**推导中的三类操作**：

| 操作                       | 说明                                                                                                                                 | 是否新建正式 ID             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| setter 清除 ID 缓存        | `setClassSignature(realSig)` 等 setter 更新对象引用 + 清除 `sigID = -1` + `tempSigID = undefined`，下次需要 ID 时由调用方通过 Registry 重新获取 | ❌ 否（常态）               |
| 更新正式 ID 对应对象的字段 | 如 `ArkClass.heritageClasses["F"].baseClassID` 从 undefined 填充为真实 ClassID；`FieldSignature.setType()` 更新可变字段（不影响 ID） | ❌ 否（模型 ID 不变）       |
| 懒加载重计算时 fallback    | 调用方通过 `Registry.getInstance().classSigCanonicalizer.getId(sig)`，若签名已存在则返回已有 ID，否则新建                             | ✅ 是（少数场景，记录日志） |

**6 类修正入口点**（回写触发临时→正式迁移）：

| 修正方法                                    | 调用点                                                                    | 迁移的签名类型                           |
| ------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------- |
| `ClassType.setClassSignature()`             | ValueInference:502, Expr:444, CxxValueInference:117, CxxTypeInference:568 | ClassSignature                           |
| `expr.setMethodSignature()`                 | IRInference:173,494,590, CxxIRInference:530,594                           | MethodSignature                          |
| `ref.setFieldSignature()`                   | IRInference:282,722,896, CxxIRInference:321,798, CxxValueInference:42     | FieldSignature                           |
| `TypeInference.setType()` on FieldSignature | TypeInference:134,137, CxxTypeInference:135,138                           | FieldSignature（type 变化不影响 ID）     |
| `MethodSubSignature.setReturnType()`        | 推导中多处                                                                | 不影响 ID（returnType 不在 toMapKey 中） |
| `ArkClass.getHeritageClass()` 回填          | ArkClass:328-334                                                          | ClassSignature（heritage 解析）          |

**`===` 比较安全性**（混合方案实际修复方式）：

| 现有 `===` 比较点                                                | 比较对象                      | 修复方式                                                  |
| ---------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------- |
| TypeInference:1101 `getClassSignature() === getClassSignature()` | ClassSignature                | ✅ 改为 `toMapKey()` 值比较                               |
| IRInference:146,154 `fileSig === FileSignature.DEFAULT`          | FileSignature                 | ✅ 改为 `toMapKey()` 值比较                               |
| ModelUtils:674 `getClassSignature() === getDeclaringSignature()` | ClassSignature                | ✅ 改为 `toMapKey()` 值比较                               |
| ModelUtils:677 `getFieldSignature() === getFieldSignature()`     | FieldSignature                | ✅ 改为 `toMapKey()` 值比较                               |
| TypeInference:1149,1155 `childClass === fatherClass`             | ArkClass                      | ✅ 安全（`scene.getClass()` 返回同一 Map 实例）           |
| ArkSignature:459 `getReturnType() === getReturnType()`           | Type（MethodSubSignature 内） | ✅ 安全（MethodSubSignature 随 MethodSignature 单实例化） |

混合方案中 `===` 比较风险点的修复方式是改为 `toMapKey()` 值比较（不依赖 intern 单实例化），确保相同值的签名即使不是同一对象引用也能正确比较。ArkClass 和 MethodSubSignature 的 `===` 比较在混合方案下天然安全（Map 查询返回同一实例 / MethodSignature 持有同一 MethodSubSignature）。

**`AliasClassSignature` 处理**：与原始 `ClassSignature` 因 `toMapKey()` 不同（`getClassName()` 返回 aliasName vs 原始类名），被正式 canonicalizer 分配不同 ID（正确行为）。

**`MethodSubSignature` 处理**：随 `MethodSignature` 的 `intern()` 一起获得单实例化，`methodSubSignatureCompare` 中的 `returnType === returnType` 比较因 MethodSubSignature 单实例化而安全。

**推导阶段不影响 ArkBody 内部结构**：推导过程访问 `ArkBody` 的 `locals`、`usedGlobals`、`cfg`、`aliasTypeMap` 等内部结构时，ArkBody 内部结构保持对象形式不变，ID 化和 intern 仅作用于 ArkBody 外部的签名和模型层引用。

### D8: hash + equals 三层去重架构

**决策**：`SignatureCanonicalizer` 采用 hash + equals 三层架构做值语义去重，替代原 toMapKey 字符串去重方案。

**三层架构**：

1. **Layer 1 — `getHashCode()`**：5 个签名类添加 `getHashCode()` — 构造时用 `hashString32`（MurmurHash3）+ `hashCombineU32`（boost-style combine）计算 32 位 hash 并缓存到 `readonly` 字段
2. **Layer 2 — `Canonicalizer<S>` + `numberWithEquality` 策略**：`SignatureCanonicalizer` 内部委托 `Canonicalizer<S>`，keyExtractor 返回 `sig.getHashCode()`，equalityComparer 为 `sig.equals()`。全 TypedArray 哈希表 + 开放寻址 + 拉链碰撞处理
3. **Layer 3 — `equals()`**：5 个签名类添加 `equals()` — 逐字段语义比较，从快到慢短路（字符串→嵌套签名 equals）

**`toMapKey()` 保留**：用于现有代码中的值比较（如 `TypeInference.isSameType()`）和调试。`SignatureCanonicalizer` 不再调用 `toMapKey()`。

**`Canonicalizable` 接口**：`SignatureCanonicalizer<S extends Canonicalizable>` 要求签名类实现 `getHashCode(): number` 和 `equals(other: this): boolean`。

**`HashUtils.ts`**：新建 `src/utils/HashUtils.ts`，提供：
- `hashString32(raw)`：MurmurHash3 风格字符串哈希，含完整 finalization mixing，处理 UTF-16 代理对
- `hashCombineU32(seed, value)`：boost 风格 hash combine
- `hashCombineOptionalU32` / `hashCombineOptionalString`：处理 undefined 值

**`MethodSignature.equals()` 修复**：equals 改为比较 `methodSubSignature.toString()`（包含方法名+参数类型+静态标志），与 `toMapKey()` 语义一致。

**理由**：toMapKey 字符串去重方案中，万级签名 → 万级 toMapKey 字符串常驻 `list` 中，每个 ~50-100 字节 → ~500 KB-1 MB。`toMapKey()` 每次拼接产生临时字符串 → GC 压力。hash + equals 方案消除字符串存储和拼接开销，全 TypedArray 哈希表性能更优。

### D9: 签名 setter 自动 intern

**决策**：在模型的签名 setter 中自动调用 `canonicalizer.intern()`，确保签名对象单实例化。

**涉及的 setter**：

| setter                                      | intern 调用                                      |
| ------------------------------------------- | ------------------------------------------------ |
| `ArkFile.setFileSignature(fileSignature)`   | `fileSigCanonicalizer.intern(fileSignature)`    |
| `ArkClass.setSignature(classSig)`           | `classSigCanonicalizer.intern(classSig)`         |
| `ArkMethod.setImplementationSignature(sig)` | `methodSigCanonicalizer.intern(sig)`             |
| `ArkField.setSignature(fieldSig)`           | `fieldSigCanonicalizer.intern(fieldSig)`         |
| `ArkNamespace.setSignature(namespaceSig)`   | `namespaceSigCanonicalizer.intern(namespaceSig)` |

**不 intern 的 setter**：

| setter                                | 原因                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------ |
| `ArkMethod.setDeclareSignatures(sig)` | overload 方法有多个声明签名，参数相同返回类型不同的会被误判为相同                          |
| `ArkClass.setDeclareSignature(sig)`   | 声明签名是声明阶段的原始签名，可能与实现签名不同                                          |

**理由**：100+ 处 `new MethodSignature(...)` 创建大量值相同但引用不同的签名实例，每个签名实例 ~100-200 字节，数万实例 → 数 MB。在 setter 中自动 intern 比在 80+ 处 `new` 调用点逐个改更简洁。intern 返回 canonical 实例，`===` 比较更安全。

### D10: 实施顺序

**已完成阶段**：

1. **SignatureCanonicalizer + SignatureModelCanonicalizer + Registry 基础设施**（D1-D2-D8）— 新建 5 个文件 ✅ 已完成
2. **FieldSignature.toMapKey() + DEFAULT + MethodSignature.DEFAULT + 5 类签名 getHashCode/equals**（D4-D8）— ✅ 已完成
3. **ArkFile 新增 projectFile 字段**（D5）— ✅ 已完成
4. **Scene 改造**（D6）— 删除 Map/canonicalizer，委托 Registry ✅ 已完成
5. **移除模型/Type/Signature 的 scene 字段**（D5）— ✅ 已完成
6. **Builder 设置 ID + ID 优先 getter**（D5）— ✅ 已完成
7. **DependenciesSort 改造** — 移除 scene 参数 ✅ 已完成
8. **签名 setter 自动 intern**（D9）— ✅ 已完成
9. **类型推导 `===` 修复**（D7）— 4 处改为 `toMapKey()` 值比较 ✅ 已完成
10. **全量测试验证** — ✅ 已完成（1235/1236 通过）

**待实施阶段**：

11. **临时 ID 与迁移机制接入生产代码** — ✅ 已完成（tasks 14.x，方案B）
    - 5 个签名类新增 `isUnclear()` 方法；ClassType/FunctionType/EnumValueType/LexicalEnvType 删除签名引用改纯 sigID；ArkSignatureBuilder 移除 register（Type 构造函数统一处理）；推导后完整性检查
    - 已知限制：引用计数不精确（size() 为下界），详见 R10
12. **Scene internXxxSig/getXxxById 委托方法删除** — ✅ 已完成（tasks 13.x）
13. **getMethodsMap(refresh) 删除可能性重新探索** — ⏳ 待重新探索（tasks 4.25）
14. **SoA 数据结构替代** — 部分完成（tasks 15.x）
    - S1: `methodsMap` → SignatureModelCanonicalizer（~720 KB）✅ 已完成
    - S7（部分）: ClassType/FunctionType/EnumValueType/LexicalEnvType 删除签名引用改纯 sigID ✅ 已完成
    - S7（回退）: AbstractInvokeExpr/AbstractFieldRef 因 R11（returnType/type 可变字段冲突）无法改造 ❌
    - S8: 模型签名引用改 ID — 不建议实施（收益 ~12 KB + R11 障碍）
    - S9: 签名内嵌引用改 ID — 不建议实施（收益 ~40-80 KB + 改动量大）
15. **heritageClasses 迁移到 ID** — ⏳ 待实施（tasks 16.1）
16. **Signature Usage Table** — ⏳ 后续独立变更（tasks 16.2，依赖已完成）
17. **性能基准测试 + 文档更新** — 部分完成（tasks 12.4-12.5 待实施, 12.7 待实施, 17.x 已完成）
18. **五大模型 sigID 缓存** — ✅ 已完成（D13）— 消除 ~37 处 getSignature() + getId() 两步查询

### D11: API 兼容性设计约束（强制）

**决策**：所有改造必须保持对外 API 向后兼容。ArkAnalyzer 作为其他项目的依赖项发布，外部代码直接使用 `new ClassType(sig)` / `new FunctionType(sig)` / `new ArkInstanceInvokeExpr(sig, ...)` 等构造函数，改变这些构造函数的参数类型（如从签名对象改为 number）是**破坏性变更**，不允许直接实施。

**受约束的 API 表面**：

| API 类别 | 示例 | 约束 |
|----------|------|------|
| 公开类的构造函数 | `new ClassType(classSignature)` / `new FunctionType(methodSignature)` / `new ArkInstanceInvokeExpr(base, methodSignature, args)` / `new ArkInstanceFieldRef(base, fieldSignature)` / `new EnumValueType(fieldSignature)` / `new LexicalEnvType(nestedMethod)` | 参数类型不可破坏性变更 |
| 公开方法签名 | `getClassSignature(): ClassSignature` / `getMethodSignature(): MethodSignature` / `getFieldSignature(): FieldSignature` / `setClassSignature(sig)` / `setMethodSignature(sig)` / `setFieldSignature(sig)` | 返回类型和参数类型不可破坏性变更 |
| 公开字段 | `Builtin.OBJECT_CLASS_TYPE` 等静态字段 | 访问方式（字段 vs getter）变更需评估外部影响 |
| `toMapKey()` / `toString()` | 所有签名类 | 返回类型和行为不可变更 |
| Scene 公开 API | `getFile()` / `getClass()` / `getMethod()` / `getFiles()` / `getClasses()` / `getMethods()` 等 | 方法签名和行为不可变更 |

**D2-D4（删除签名引用改纯 ID）的兼容策略**：

删除 Type/Expr/Ref 中的签名对象引用字段、改为纯 sigID 存储时，必须保持构造函数和 getter 的外部签名不变。具体策略：

1. **构造函数兼容**：保留接收签名对象的构造函数签名，内部通过 `isUnclear()` 判断走向。例如：
   ```typescript
   // 保留外部签名不变
   constructor(classSignature: ClassSignature, realGenericTypes?: Type[]) {
       super();
       if (classSignature.isUnclear()) {
           this.classSigID = -1;
           this.tempSigID = Registry.getInstance().tempClassSigCanonicalizer.register(classSignature);
       } else {
           this.classSigID = Registry.getInstance().classSigCanonicalizer.getId(classSignature);
           this.tempSigID = undefined;
       }
       this.realGenericTypes = realGenericTypes;
   }
   ```

2. **getter 兼容**：返回类型保持为签名对象，内部双路查询（正式/临时 canonicalizer）：
   ```typescript
   public getClassSignature(): ClassSignature {
       const reg = Registry.getInstance();
       if (this.classSigID >= 0) {
           return reg.classSigCanonicalizer.get(this.classSigID)!;
       }
       if (this.tempSigID !== undefined) {
           return reg.tempClassSigCanonicalizer.get(this.tempSigID)!;
       }
       throw new Error('ClassType has no signature');
   }
   ```

3. **setter 兼容**（仅 ClassType 有 setter）：参数类型保持为签名对象，内部 release 旧 tempSigID + isUnclear() 判断新签名走向。

4. **Builtin 静态字段兼容**：改为 lazy getter（不缓存），每次访问创建新 ClassType（构造函数中 getId 注册到当前 Registry）。对外透明（`Builtin.OBJECT_CLASS_TYPE` 语法不变）。

5. **属性 getter 兼容**：已改造的 4 个 Type 类删除了签名对象引用字段（如 `classSignature`、`methodSignature`、`signature`、`nestedMethodSignature`），但下游代码可能直接通过字段名访问（如 `type.classSignature`、`type.methodSignature`）。为此新增 TypeScript 属性访问器（`public get classSignature()`、`public get methodSignature()`、`public get signature()`、`public get nestedMethodSignature()`），内部委托给对应的 `getXxxSignature()` / `getNestedMethod()` 方法。这样 `type.classSignature` 和 `type.getClassSignature()` 两种访问方式都能正常工作。

   | 类 | 新增属性 getter | 委托给 |
   |---|---|---|
   | ClassType | `get classSignature()` | `getClassSignature()` |
   | FunctionType | `get methodSignature()` | `getMethodSignature()` |
   | EnumValueType | `get signature()` | `getFieldSignature()` |
   | LexicalEnvType | `get nestedMethodSignature()` | `getNestedMethod()` |

   AbstractInvokeExpr / AbstractFieldRef 不需要新增属性 getter（保留了 `methodSignature` / `fieldSignature` 字段引用）。

**每次修改代码时的检查清单**：

- [ ] 构造函数参数类型是否变更？（如从 `ClassSignature` 改为 `number`）→ 不允许直接变更，需保留旧签名
- [ ] getter 返回类型是否变更？（如从 `ClassSignature` 改为 `number`）→ 不允许直接变更
- [ ] setter 参数类型是否变更？→ 不允许直接变更
- [ ] 公开字段是否被删除或改为 getter？→ 评估外部影响，getter 方式通常兼容
- [ ] 新增的 `@internal` 方法是否标注了内部用途？→ 必须标注
- [ ] `toString()` / `toMapKey()` 输出是否变更？→ 不允许变更

**理由**：D2-D4 的目标是删除内部存储中的签名对象引用（节省 ~8 字节/对象的指针开销），不是改变外部 API。内部存储改为 sigID，但构造函数和 getter 保持接收/返回签名对象，转换在边界处完成。

**D2 改造范围限制**：由于 R11（returnType/type 可变字段冲突），D2 仅对 ClassType/FunctionType/EnumValueType/LexicalEnvType 完成了签名引用删除。AbstractInvokeExpr/AbstractFieldRef 保留签名对象引用 + sigID 懒加载辅助缓存。

### D12: isUnclear() 接口设计

**决策**：5 个签名类各新增 `@internal isUnclear(): boolean` 方法，判断签名是否为不明确签名（需要走临时 canonicalizer）。

> **⚠ 实现状态更新（工作项 P/R 后最终形态）**：本节描述的是最初设计。isUnclear 的路由判据经工作项 P（模式 B' 统一路由）和后续简化（工作项 R：直接字段检查）已演进为以下最终形态——不再依赖 registry 查找或声明链遍历，全部为 O(1) 字段读：
>
> | 签名类 | 最终实现 | 语义 |
> |--------|---------|------|
> | FileSignature | `return false` | 身份根，永不 unclear |
> | ClassSignature | `declaringFileSigID === 0 && className !== '%unk'` | 纯字段检查（' %unk' 名 + FileSigID 0 即 DEFAULT） |
> | NamespaceSignature | `declaringFileSigID === 0 && namespaceName !== '%unk'` | 同上 |
> | MethodSignature | `declaringClassSigID === -1` | 模式 B' 不变式：formal ID ≥ 0 即 resolved |
> | FieldSignature | `declaringClassSigID === -1 \|\| declaringNamespaceSigID === -1` | 同上 |
>
> `isDefault()` 方法已删除（其 registry lookup 被字段值比较取代）。构造器增加了 SigID + temp ID 的 number 重载（MethodSignature 第 3 参数 / FieldSignature 第 6 参数），使 temp 构造不再依赖 deprecated 对象重载。以下原文保留作为设计历史记录。

**判断标准**（最初设计，已演进）：签名的 `declaringFileSignature` 是否为 `FileSignature.DEFAULT`（沿着声明链追溯到文件层）。DEFAULT 单例及其直接组合返回 `false`（走正式 canonicalizer ID 0）。

| 签名类 | `isUnclear()` 实现 | 语义 |
|--------|-------------------|------|
| FileSignature | `return false;` | 文件签名自身不可能不明确 |
| ClassSignature | `this !== DEFAULT && declaringFileSignature === FileSignature.DEFAULT` | 文件来源未知 |
| NamespaceSignature | `this !== DEFAULT && declaringFileSignature === FileSignature.DEFAULT` | 文件来源未知 |
| MethodSignature | `this !== DEFAULT && declaringClassSignature !== ClassSignature.DEFAULT && declaringClassSignature.getDeclaringFileSignature() === FileSignature.DEFAULT` | 声明类的文件来源未知 |
| FieldSignature | `this !== DEFAULT && declaringSignature !== ClassSignature.DEFAULT && declaringSignature.getDeclaringFileSignature() === FileSignature.DEFAULT` | 声明方的文件来源未知 |

**设计要点**：
- `isUnclear()` 是签名自身的属性，不依赖外部状态（canonicalizer 查询）
- 不委托其他签名的 `isUnclear()`，而是直接检查 `getDeclaringFileSignature() === FileSignature.DEFAULT`
- DEFAULT 单例返回 `false`（走正式 ID 0），DEFAULT 的直接组合（如 `MethodSignature(ClassSignature.DEFAULT, ...)`）也返回 `false`
- `AliasClassSignature` 继承 `ClassSignature.isUnclear()`——其 `declaringFileSignature` 来自真实 Interface 文件（非 DEFAULT），返回 `false`

### D13: 五大模型 sigID 缓存 — 消除 getSignature() + getId() 两步查询

**决策**：ArkClass/ArkMethod/ArkField/ArkFile/ArkNamespace 五大模型新增自身 sigID 字段 + getter，在签名 setter 中同步缓存，消除 ~37 处"先获取签名实例再转 ID"的冗余查询。

**背景**：五大模型的签名 setter（`setSignature` / `setImplementationSignature` / `setFileSignature`）内部已调用 `intern(sig)` 注册签名到 canonicalizer。`intern` 内部调用 `getId` 返回 ID，但不返回 ID 给调用方。外部需要 sigID 时必须 `getSignature()` + `getId(sig)` 两步查询。

**改造方案**：将 setter 中的 `intern(sig)` 拆为 `getId(sig)` + `get(id)`，同步缓存 sigID：

```typescript
// 改造前
public setSignature(classSig: ClassSignature): void {
    this.classSignature = Registry.getInstance().classSigCanonicalizer.intern(classSig);
}

// 改造后
public setSignature(classSig: ClassSignature): void {
    const reg = Registry.getInstance();
    const id = reg.classSigCanonicalizer.getId(classSig);
    this.classSigID = id;                                    // 缓存 sigID
    this.classSignature = reg.classSigCanonicalizer.get(id)!; // 等价于 intern
}

public getClassSigID(): number {
    return this.classSigID;
}
```

**各模型新增**：

| 模型 | 新增字段 | setter 中设置 | getter |
|------|---------|-------------|--------|
| ArkClass | `classSigID: number = -1` | `setSignature` | `getClassSigID()` |
| ArkMethod | `methodSigID: number = -1` | `setImplementationSignature` | `getMethodSigID()` |
| ArkField | `fieldSigID: number = -1` | `setSignature` | `getFieldSigID()` |
| ArkFile | `fileSigID: number = -1` | `setFileSignature` | `getFileSigID()` |
| ArkNamespace | `namespaceSigID: number = -1` | `setSignature` | `getNamespaceSigID()` |

**懒加载优化**：5 个模型的 `getDeclaringXxxID()` 懒加载也改为直接用被引用模型的 `getXxxSigID()`，消除懒加载中的两步查询：

```typescript
// 改造前
this.declaringFileID = Registry.getInstance().fileSigCanonicalizer.getId(this.declaringArkFile.getFileSignature());

// 改造后
this.declaringFileID = this.declaringArkFile.getFileSigID();
```

**调用点替换**（~37 处）：

| 文件 | 替换数 | 模式 |
|------|--------|------|
| Scene.ts | ~19 处 | `getId(xxx.getSignature())` → `xxx.getXxxSigID()` |
| Builder 文件（8 个） | ~16 处 | 同上 |
| DependenciesSort.ts | 1 处 | 同上 |
| ArkModule.ts | 1 处 | 同上 |
| 模型懒加载（5 处） | 5 处 | 同上 |

**收益**：每次查询从 2 步（`getSignature()` + `getId()`）减为 1 步（`getXxxSigID()` 直接返回缓存值）。热点路径（`disposeModule` 循环、`sortByDependency` 循环）受益最大。

**清理**：8 个 Builder 文件 + DependenciesSort.ts + ArkModule.ts 移除不再使用的 Registry import。

**注意**：declare 签名 setter（`setDeclareSignatures` / `setDeclareSignature`）不调用 `intern`，不设置 sigID。declare 签名的 sigID 需要时仍需 `getSignature()` + `getId()` 查询，但这不是热点路径。

### R1: 全局单例的生命周期管理

**风险**：`SignatureCanonicalizerRegistry` 作为全局单例，如果不正确 dispose，会残留上一轮分析的数据。

**缓解**：

- `Scene.dispose()` 和 `Scene.clear()` 调用 `Registry.dispose()` 清空单例
- `Registry.getInstance()` 在单例被 dispose 后自动重建并初始化 DEFAULT 签名
- 当前假设单 Scene，不存在并发 Scene 的问题

### R2: 模型 ID 字段的内存开销

**风险**：每个模型和 Type 对象新增 ID 字段（4-8 字节/对象）。万级 Type 对象可能增加数十 MB 内存。

**缓解**：

- `tempSigID` 为可选字段（`undefined` 时不占用实际内存，V8 优化）
- 推导完成后 `tempSigID` 全部为 `undefined`，仅 `sigID` 占用 4 字节
- 模型层 ID 字段初始为 -1（V8 对小整数有优化），Builder 阶段填充后为正整数
- 无 scene 引用（8 字节/对象），比之前的混合方案更省
- 相比消除的重复签名字符串（数百 MB）和 Map per-entry 开销，净内存收益为正

### R3: setter 清除缓存后 ID 暂时为 -1

**风险**：`setClassSignature()` 清除 `classSigID = -1` 后，在重新设置 ID 之前，如果有代码读取 `getClassSigID()` 会得到 -1。

**缓解**：

- 混合方案中对象引用（主存储）始终有效，ID 是辅助存储
- 调用方在需要 ID 时通过 `Registry.getInstance().classSigCanonicalizer.getId(sig)` 重新获取并设置
- `toMapKey()` 值比较不依赖 ID，`===` 比较风险已修复

### R4: 向后兼容性

**风险**：Scene 内部存储变更可能破坏外部依赖。

**缓解**：

- `toMapKey()` 保持返回 `string` 类型不变
- 签名类上不新增 `toMapKeyId()` 方法（因签名类无法访问 Scene 上的 canonicalizer，存在循环依赖）；改为在 Registry 上统一提供 ID 转换
- Scene 公开 API 签名和行为不变，内部委托 Registry
- 在 CHANGELOG 中标注内部行为变更

### R5: `MethodSignature.DEFAULT` 和 `FieldSignature.DEFAULT` 的 lazy getter 延迟初始化

**风险**：`MethodSignature.DEFAULT` 和 `FieldSignature.DEFAULT` 使用 lazy getter（`private static _default?` + `public static get DEFAULT()`），首次访问时才创建实例。如果多个线程并发访问，可能创建多个实例。

**缓解**：

- ArkAnalyzer 是单线程应用（Node.js 单线程），不存在并发问题
- lazy getter 在模块加载时不会触发循环依赖，`UnknownType.getInstance()` 在首次访问时已确保初始化完成

### R6: 混合方案中对象引用与 ID 可能不一致

**风险**：混合方案中对象引用（`declaringArkClass`）和 ID 字段（`declaringClassID`）同时存在。如果对象引用被更新但 ID 字段未同步更新（或反之），可能导致两者不一致。

**缓解**：

- ID 优先 getter 模式：优先检查对象引用，如果有则直接返回；否则通过 ID 查询
- 如果对象引用在 ID 设置后被替换（如推导修正），两者可能不一致，但对象引用优先确保返回正确值
- 未来迁移到 ID-only 后此风险自然消除
- `clearAllReferences()` 方法中同时清理 ID 字段和对象引用

### R7: 迁移时遗漏使用点

**风险**：`setClassSignature()` 等回写方法触发迁移时，如果某个持有旧 `tempSigID` 的位置未被更新，会导致引用悬空。

**缓解**：

- 迁移入口点明确（6 类 `setXxxSignature` 方法），所有迁移通过这些方法触发
- 推导后完整性检查（`tempCanonicalizer.size() == 0`）能发现未迁移的签名（完整方案启用 register/release 后可用）
- 未来引入签名使用表（Signature Usage Table）可自动追踪所有使用点

### R8: FieldSignature.toMapKey 的分隔符歧义

**风险**：`declaringSignature.toMapKey() + '.' + fieldName` 中，如果 `toMapKey()` 以数字结尾且 `fieldName` 以数字开头，可能产生歧义。

**缓解**：

- `FileSignature.toMapKey()` 以 `path.basename` 结尾（通常含 `.ts`/`.ets` 扩展名），天然分隔
- `ClassSignature.toMapKey()` 以 `className` 结尾（标识符，不以数字开头）
- 实际歧义概率极低，且 canonicalizer 用字符串精确匹配（非前缀匹配）

### R9: 类型推导改造范围大

**风险**：类型推导相关文件多（TypeInference、IRInference、ModelInference、ValueInference、Expr、Ref、Type 等），改动面广，可能引入回归。

**缓解**：

- 分阶段实施：先完成基础设施（canonicalizer + 双字段），再逐步改造推导代码
- 每个阶段运行全量 vitest 单测验证
- 增量改造：先修复最关键的 6 处 `===` 比较点，验证正确后再扩展到所有重建签名
- 混合方案下 setter 自动清除 ID 缓存，推导中签名重建无需显式 intern

### R10: 临时 ID 引用计数不精确（size() 为下界）

> **⚠ 实现状态更新（round20/B 轮）**：本节描述的 refcount 方案（一版）已退役。TempSignatureCanonicalizer 经历了三版演进：**一版（refcount）**——`Map<id, sig>` + 引用计数，即本节描述的 register/release/refCounts 机制；**二版（弱表）**——`Map<id, WeakRef>` + FinalizationRegistry 自动清理，因 GC 驱动的清理时序不确定（KeepDuringJob 窗口）与 WeakRef/FR 的 GC 开销退役；**三版（索引表，当前实现）**——`slots: (S | undefined)[]` 强持有 + 单调 nextId 永不复用 + 显式 `retire`/`retireWithReplacement`（迁移置空 + temp→formal 替换记录）。三版下统计**同步即精确**（三数自洽 totalRegistered = liveCount + retiredCount），`getExistingTempId` 走实例自带 symbol 属性而非 objectIdentity 查询。引用计数不精确问题（下界语义）随一版机制整体退役；slot 强持有下"推导中间垃圾"钉活到 Registry.dispose，是知情权衡（见 TempSignatureCanonicalizer.ts 头注释）。下方原文保留作为一版设计的历史记录。

**风险**：方案B仅在 ArkSignatureBuilder 工厂方法中调用 `register()`（按签名对象调用 1 次），但同一个不明确签名对象可能被传播给多个 Type/Expr/Ref 持有（7 个已知共享场景）。`register()` 次数（1 次）少于实际持有者数量（2~N 个），导致引用计数偏低。每个持有者的 setter 各调用 1 次 `release()`，第一次 release 后 refcount 归 0 并从 `refCounts` 删除，后续 release 为 no-op（安全，不出负数）。

**已知共享场景**（7 处）：

| # | 文件 | 行号 | 共享模式 | 共享的 Type |
|---|------|------|---------|-----------|
| 1 | core/ArkValueTransformer.ts | 448 | 变量复用 | ClassType + MethodSignature |
| 2 | core/ArkValueTransformer.ts | 1206 | 变量复用 | ClassType + MethodSignature |
| 3 | core/ArkValueTransformer.ts | 526 | Map 缓存 | N × ArkStaticInvokeExpr |
| 4 | cpp/ArkValueTransformer.ts | 272 | 循环复用 | N × FieldSignature |
| 5 | cpp/ArkValueTransformer.ts | 1120 | 变量复用 | ClassType + MethodSignature |
| 6 | cpp/ArkValueTransformer.ts | 1277 | getType() 传播 | FieldSignature + ClassType |
| 7 | cpp/ArkValueTransformer.ts | 2242 | 条件复用 | ClassType + MethodSignature |

**影响评估**：

| 影响项 | 严重性 | 说明 |
|--------|--------|------|
| 功能正确性 | ✅ 不受影响 | setter 独立替换各自的对象引用；懒查询 `getExistingTempId(sig)` 走 canonicalizer（条目保留），不依赖 refCounts |
| 第二次 release | ✅ 安全 no-op | refCounts 中已删除 → `release()` 对不存在的 ID 是 no-op（当前实现已处理） |
| 完整性检查 `size()` | ⚠️ 不精确（下界） | 第一个 release 后 size 减至 0，但其他持有者可能仍持有旧签名 → size() 漏报；`size()` 返回的是"至少有 N 个未迁移"的下界，非精确值 |

**缓解**：

- 完整性检查策略为"仅警告"——size() 作为下界足够有用（"至少有 N 个未迁移"比"可能有未迁移"更有价值）
- `getExistingTempId(sig)` 不依赖 refCounts，通过 canonicalizer 的 objectIdentity 查询，条目在 dispose 前永久保留
- 后续可考虑：在 Type/Expr/Ref 构造函数中检查签名是否不明确并额外 register（方案A），或在使用点额外 register（方案B-传播点），使 refcount 精确
- 引入 Signature Usage Table 后可完全替代引用计数，精确追踪每个使用点

**实施状态更新**：ArkSignatureBuilder 的 register 调用已移除，改为 Type 构造函数中通过 `isUnclear()` 统一判断并 register。引用计数不精确问题仍然存在（7 个共享场景中 Type 构造函数 register 1 次但实际有 2~N 个持有者）。

### R11: returnType/type 可变字段与 canonicalizer 去重冲突

**风险**：`MethodSignature.hashCode/equals` 不包含 `returnType`（可变字段），`FieldSignature.hashCode/equals` 不包含 `type`（可变字段）。canonicalizer 把可变字段不同的签名视为同一个。删除签名引用改纯 sigID 后，getter 返回 canonical 实例（可能丢失可变字段差异），导致推导中 `setReturnType`/`setType` 修改的是 canonical 实例，影响所有持有同一 canonical 实例的对象。

**影响**：AbstractInvokeExpr（有 `setMethodSignature` + 推导中 `setReturnType`）和 AbstractFieldRef（有 `setFieldSignature` + 推导中 `setType`）无法删除签名引用改纯 sigID。D2 改造仅完成 ClassType/FunctionType/EnumValueType/LexicalEnvType（无可变字段修改场景）。

**缓解**：
- AbstractInvokeExpr/AbstractFieldRef 保留签名对象引用为主存储，sigID/tempSigID 作为懒加载辅助缓存
- 构造时 `sigID = -1`，`getMethodSigID()` 懒加载（getExistingId 优先 + getId fallback）
- `setMethodSignature()`/`setFieldSignature()` 重置 sigID 为 -1，下次懒加载重算
- 未来如需解决：修改 hashCode/equals 包含可变字段（破坏 toMapKey 语义），或改为 per-Scene Registry + 不可变签名设计

### R12: Builtin lazy getter + Registry 生命周期

**风险**：Builtin ClassType lazy getter 不缓存，每次创建新 ClassType（构造函数中 getId 注册到当前 Registry）。测试中多次创建 Scene 时需手动 `SignatureCanonicalizerRegistry.dispose()`。尝试在 Scene 构造函数中自动 dispose 失败——全局单例 Registry 被多个 Scene 共享，dispose 会破坏共存 Scene 的 sigID。

**缓解**：
- 测试文件的 `buildScene` 函数中手动调用 `SignatureCanonicalizerRegistry.dispose()`（`common.ts` 和 `Cfg.test.ts` 已添加）
- Builtin lazy getter 不缓存——每次访问创建新 ClassType，sigID 指向当前 Registry
- 未来彻底解决需将 Registry 从全局单例改为 per-Scene 实例

## 未来扩展点

### Signature Usage Table（签名使用表）

基于 ID 化架构，可建立 `sigID → [使用点列表]` 的反向引用表（类似 LLVM `Value::use_list`）：

- **多轮推导优化**：推导后检查 `tempCanonicalizer.size() > 0`，从使用表直接跳转到未解析签名的使用点（stmt 级别），避免全量重新推导
- **签名变更通知**：签名迁移时批量更新所有使用点的 ID
- **def-use 分析**：根据 FileSignature 直接找到该文件的所有使用处

#### 引用计数是使用表的简化版

当前方案中的 `TempSignatureCanonicalizer` 引用计数（`register`/`release`/`refCounts`）是使用表的轻量级前身。两者的演进对应关系：

| 引用计数（当前）                    | 使用表（未来）                                   | 演进关系                       |
| ----------------------------------- | ------------------------------------------------ | ------------------------------ |
| `register(sig)` → refcount++        | `addUsage(sig, point)` → 使用点列表追加          | 从"只计数"变为"记录具体使用点" |
| `release(tempSigID)` → refcount--   | `removeUsage(tempSigID, point)` → 使用点列表移除 | 从"减计数"变为"移除具体使用点" |
| `refCounts.size` → 未解析数量       | `tempUsageTable.entries()` → 未解析的具体使用点  | 从"知道数量"变为"知道位置"     |
| 迁移：逐个 release + 逐个替换 sigID | 迁移：批量遍历使用点列表 + 批量替换 sigID        | 从"逐个迁移"变为"批量迁移"     |

#### 临时使用表 → 正式使用表的迁移

当 tempSigID 迁移为 formalSigID 时，使用表条目也需要迁移：

```
迁移前:
  tempUsageTable[tempSigID=3] = [
    { holder: typeA, holderField: 'classSigID', stmtID: 101, methodSigID: 10 },
    { holder: typeB, holderField: 'classSigID', stmtID: 205, methodSigID: 15 },
  ]

迁移时:
  1. 批量更新所有使用点的 sigID: typeA.sigID = 12, typeB.sigID = 12
  2. 将使用点从临时表迁移到正式表:
     formalUsageTable[formalSigID=12].push(...tempUsageTable[3])
  3. 清空临时表条目: tempUsageTable.delete(3)
```

#### 演进后的额外能力

| 能力         | 引用计数无法做到 | 使用表可做到                                                   |
| ------------ | ---------------- | -------------------------------------------------------------- |
| 批量迁移     | ❌ 逐个 release  | ✅ 遍历使用点列表一次性更新所有 sigID                          |
| 多轮推导跳转 | ❌ 只知道数量    | ✅ 从 `tempUsageTable` 直接获取未解析的 stmtID，跳转到对应语句 |
| def-use 分析 | ❌ 无使用点信息  | ✅ `formalUsageTable[formalSigID]` 直接返回所有使用处          |
| 签名变更通知 | ❌ 无使用点      | ✅ 签名迁移时批量通知所有使用点更新                            |

#### 兼容性

当前引用计数设计为使用表预留了完美的扩展点，演进时无需修改接口：

- `TempSignatureCanonicalizer` 的 `register`/`release` 接口不变——使用表内部实现 `register` 时额外记录使用点，`release` 时额外移除使用点
- 迁移入口不变——仍是 6 类 `setXxxSignature()` 方法，使用表方案中调用"批量迁移"而非"逐个 release"
- 完整性检查接口不变——`size()` 语义从 `refCounts.size` 变为 `tempUsageTable` 条目数，但调用方式不变
- spec 的行为要求不变——spec 描述的是"迁移后所有引用更新"，无论逐个还是批量

**预留的架构支撑**：

- 签名 ID 稳定（正式 ID 不变，临时 ID 引用语义唯一）
- 迁移触发点明确（6 类 `setXxxSignature` 方法）
- `TempSignatureCanonicalizer` 的 `register`/`release` 接口兼容使用表扩展

使用表作为后续独立变更，当前不实现。

### Scene 列式序列化

ID 化后 Scene 可序列化为列式格式（String Table + Signature Table + Model Tables + Relations），TypedArray 直接写入 buffer，O(N) 线性反序列化。当前变更为其奠定基础但不实现。

### 多 Scene 实例适配

Registry 从全局单例改为 per-Scene 实例（`Registry.forScene(scene)` 获取），`dispose()` 时清空当前 Scene 对应的 Registry。改动很小。

### SoA 数据结构替代（待进一步分析）

以下改进项已识别但尚未实施，需逐一分析可行性和收益：

#### S1: `registry.methodsMap: Map<number, ArkMethod>` → SignatureModelCanonicalizer（已实施）

- **原方案**：`Map<number, ArkMethod>` → `(ArkMethod | undefined)[]` 独立数组
- **实际实施**：`methodSigCanonicalizer` 从 `SignatureCanonicalizer` 升级为 `SignatureModelCanonicalizer<MethodSignature, ArkMethod>`，删除独立的 `methodsMap` 字段，模型存储在 canonicalizer 内置的 `models` 数组中
- **收益**：Map per-entry ~80 字节 → 数组 per-entry 8 字节，万级方法节省 ~720 KB
- **改动**：`SignatureModelCanonicalizer` 新增 `clearModels()` 方法；`Registry` 改类型 + 删字段；`Scene.ts` 7 处 + `ArkMethod.ts` 1 处改为 `getModel/setModel/removeModel/clearModels`
- **架构收益**：5 个正式 canonicalizer 全部统一为 `SignatureModelCanonicalizer`，Registry 字段从 2 个减少为 1 个
- **状态**：✅ 已实施。1235/1236 测试通过

#### S3: 基于 HomeFlow Fact ID 设计的 hash + equals 去重（已实施）

- **当前**：`SignatureCanonicalizer` 内部用 `Canonicalizer<S>` + `numberWithEquality` 策略做 hash + equals 去重
- **状态**：✅ 已实施。详见 D8。1235/1236 测试通过

#### S6: 签名对象单实例化（intern）（已实施）

- **当前**：模型签名 setter 自动调用 `canonicalizer.intern()`
- **状态**：✅ 已实施。详见 D9。1235/1236 测试通过

#### S7: Type/Expr/Ref 中签名引用改为 ID

- **当前**：`ClassType.classSignature`、`FunctionType.methodSignature`、`AbstractInvokeExpr.methodSignature`、`AbstractFieldRef.fieldSignature` 等直接持有签名对象引用
- **问题**：每个 Type/Expr/Ref 持有 ~8 字节签名指针，万级 IR 对象 → 数百 KB
- **替换**：用 `sigID: number` 替代签名对象引用。需要签名时通过 Registry 获取 canonical 实例
- **可行性**：部分已有 `sigID` 字段（ClassType/FunctionType 等），只需删除对象引用回退
- **改动量**：~10 个类，每个改 1 个字段 + getter/setter
- **风险**：中。需确保 Registry 中 canonical 实例可用
- **状态**：待分析

#### S8: 模型签名引用改为 ID

- **当前**：`ArkClass.classSignature`、`ArkMethod.implSignature`、`ArkField.fieldSignature`、`ArkNamespace.namespaceSignature`、`ArkFile.fileSignature` 直接持有签名对象
- **问题**：每个模型持有 ~8 字节签名指针，万级模型 → 数百 KB
- **替换**：用 `sigID: number` 替代签名对象引用
- **可行性**：需确保 Registry 中 canonical 实例可用
- **改动量**：~6 个模型文件
- **风险**：中。与 S6（intern）配合实施
- **状态**：待分析

#### S9: 签名对象内嵌签名引用改为 ID

- **当前**：`ClassSignature` 持有 `declaringFileSignature: FileSignature` + `declaringNamespaceSignature: NamespaceSignature`；`MethodSignature` 持有 `declaringClassSignature: ClassSignature`；`FieldSignature` 持有 `declaringSignature: BaseSignature`
- **问题**：每个签名对象持有 1-2 个其他签名对象的引用（~8-16 字节），签名对象嵌套形成树状引用图
- **替换**：用 `declaringSigID: number` 替代对象引用
- **可行性**：部分已有 ID 字段（`MethodSignature.declaringClassSigID`、`FieldSignature.declaringSigID`），仍是双存储
- **改动量**：~5 个签名类
- **风险**：中。需确保 Registry 中 canonical 实例可用
- **状态**：待分析

#### S10: ArkFile.namespaces Map → Int32Array + canonicalizer model（已实施）

- **原方案**：`ArkFile.namespaces: Map<string, ArkNamespace>` 存储 namespace name → ArkNamespace 对象引用
- **实际实施**：
  - 删除 `namespaces: Map<string, ArkNamespace>` 字段
  - 新增 `topNamespaceSigIDs?: Int32Array`（懒初始化，无 namespace 时不分配）+ `topNamespaceCount: number`
  - namespace 对象通过 `SignatureCanonicalizerRegistry.namespaceSigCanonicalizer.getModel(id)` 获取
  - 新增 ID 查询接口：`getTopNamespaceSigIDs()` / `getTopNamespaceCount()` / `hasTopNamespaceWithID(id)` / `getTopNamespaceByID(id)`
  - `getNamespace(sig)` 改为 `getExistingId(sig)` + `hasTopNamespaceWithID(id)` + `getModel(id)` — O(1) hash + O(n) array scan
  - `getNamespaceWithName(name)` 改为遍历 sigID 数组 + `getModel(id)` + `getName()` 比较 — O(n)，n≤10
  - `getNamespaces()` 改为遍历 sigID 数组 + `getModel(id)` 收集到数组
  - `addNamespace(ns)` 合并检查改为 `getNamespace(sig)`（sigID 查找），合并分支不追加 sigID
  - `removeNamespace(ns)` 改为 `hasTopNamespaceWithID(id)` + `removeTopNamespaceSigID(id)` + `Registry.removeNamespace(ns)`
  - `clearAllReferences()` 中 `topNamespaceSigIDs = undefined`（GC 回收）
  - `ensureTopNamespaceCapacity()` 懒初始化：首次 `addNamespace` 时创建 `Int32Array(8)`，超出时 2x 扩容

- **Registry register/remove 方法迁移**：
  - Scene 上的 `registerClass` / `registerNamespace` / `registerCustomComponent` / `unregisterCustomComponent` / `addToMethodsMap` / `removeMethod` / `removeClass` / `removeNamespace` / `removeFile` 共 9 个方法迁移到 `SignatureCanonicalizerRegistry` 作为静态方法
  - `addToMethodsMap` 改名为 `registerMethod`（与其他 register 方法对称）
  - 新增 `removeClassModel`（仅移除 canonicalizer model，不触达 customComponentMap）供 `disposeModule` 使用
  - `disposeModule` 内部 canonicalizer 操作改为 Registry 静态方法，class 用 `removeClassModel`（保留 customComponentMap 条目）
  - Scene 上删除 9 个方法，13 处调用点改为直接调 `SignatureCanonicalizerRegistry.registerXxx()` / `removeXxx()`

- **Scene.getNamespace 简化**：
  - 删除 isProject 条件 + fast path + 递归 fallback + 延迟回填
  - 改为 `getExistingId(sig)` + `getModel(id)` — 纯 ID 查询，无副作用

- **ModelUtils.getAllNamespacesInFile 废弃**：
  - 标记 `@deprecated`，委托给 `ArkFile.getAllNamespacesUnderThisFile()`
  - 4 处内部调用改为直接调 `ArkFile.getAllNamespacesUnderThisFile()`

- **收益**：
  - ArkFile 无 namespace 时：节省 Map 空对象 ~64 bytes + Int32Array(8) 32 bytes = ~96 bytes/文件
  - ArkFile 有 namespace 时：Map per-entry ~70-90 bytes → Int32Array 4 bytes/entry
  - photos 项目 1,779 文件（80% 无 namespace）：~170 KB → ~11 KB，节省 ~159 KB
  - 嵌套 namespace 构建时注册到 canonicalizer，`Scene.getNamespace(sig)` 的 ID fast path 对嵌套 namespace 首次即命中

- **已知限制**：
  - `getNamespaceWithName(name)` 从 O(1) Map.get 变为 O(n) 遍历（n≤10，可接受）
  - `addNamespace` 合并分支不更新 `originFullPositions`（与 Map 模式行为一致，positions 由 `mergeNameSpaces` 统一处理）

- **状态**：✅ 已实施。1235/1236 测试通过

### SoA 替代总体收益估算

| 改进项 | 内存收益 | 状态 |
|--------|---------|--------|
| S1: methodsMap → SignatureModelCanonicalizer | ~720 KB | ✅ 已完成 |
| S3: hash + equals 去重 | ~500 KB-1 MB | ✅ 已完成 |
| S6: 签名对象单实例化 | ~数 MB | ✅ 已完成 |
| S7（部分）: ClassType/FunctionType/EnumValueType/LexicalEnvType 签名引用改 ID | ~数十 KB | ✅ 已完成 |
| S7（回退）: AbstractInvokeExpr/AbstractFieldRef | — | ❌ R11 阻碍 |
| S8: 模型签名引用改 ID | ~12 KB | ❌ 不建议（收益极小 + R11） |
| S9: 签名内嵌签名引用改 ID | ~40-80 KB | ❌ 不建议（改动量大） |
| S10: ArkFile.namespaces Map → Int32Array + canonicalizer model | ~159 KB | ✅ 已完成 |
| **已完成总收益** | **~数 MB + ~879 KB** | — |
