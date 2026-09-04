---
slug: 'high-performance-architecture-refactor'
createdAt: '2026-08-14T03:28:38.534Z'
---

## Why

ArkAnalyzer 在分析大型 HarmonyOS / ArkTS 工程（如 scene_board_ext，含数千文件、数万方法）时面临内存和性能瓶颈：

1. **签名字符串重复存储**：`Scene` 中的 `filesMap`、`classesMap`、`methodsMap` 等使用字符串 key（`FileSignature.toMapKey()` 等），相同签名字符串在不同 Map 中重复分配。在万级方法的工程中，签名字符串占用可达数百 MB。

2. **签名对象多实例化**：同一逻辑签名（如 `FileSignature`、`FieldSignature`）在代码各处被 `new` 多次创建（88+33 处构造点），不同实例间用 `===` 引用比较会产生误判。现有代码中 `TypeInference.isSameType()`（`TypeInference.ts:1101`）、`IRInference.needInfer()`（`IRInference.ts:146,154`）、`ModelUtils`（`ModelUtils.ts:674,677` — 含 FieldSignature 直接 `===` 比较）等 6 处使用 `===` 引用比较签名，存在潜在缺陷。

3. **模型间通过对象指针传递**：`ArkFile.defaultClass: ArkClass`、`ArkClass.declaringArkFile: ArkFile` 等关系引用持有对象指针，无法高效序列化，且内存开销高于整数 ID 引用。

4. **类型推导阶段签名使用密集且复杂**：`TypeInference`、`IRInference` 等推导模块在运行时大量重建签名（`new MethodSignature`、`new AliasClassSignature`、`new FieldSignature` 等 12+ 处）、回写签名（`setClassSignature()`、`setFieldSignature()`）、通过签名查找模型（`scene.getClass(sig)`），这些操作未经过统一去重，是 `===` 引用比较缺陷的高发区。`FieldSignature` 在 `DVFGBuilder` 中直接作为 Map key 依赖引用相等性，也存在风险。

5. **Builder 阶段不明确签名无法简单 ID 化**：`class A extends F` 中 F 的 `ClassSignature` 在 builder 阶段文件来源未知，只有类型推导阶段才能解析为正确的签名。如果不明确签名与正式签名共用同一 ID 空间，会产生"空洞"破坏签名 ID ↔ 模型 1:1 的不变式。

这些瓶颈导致大型工程的内存峰值过高、类型推导中存在隐含的正确性风险，限制了 ArkAnalyzer 在 CI 流水线和大规模工程分析中的适用性。同时，ID 化设计为未来的 Scene 列式序列化与反序列化奠定基础。

## What Changes

本变更引入 `SignatureCanonicalizerRegistry` 全局单例，集中管理所有 canonicalizer 和模型存储，涵盖七个方面：

### 1. SignatureCanonicalizerRegistry 全局单例

新建 `SignatureCanonicalizerRegistry` 全局单例类，集中管理：

- 5 个正式 `SignatureModelCanonicalizer`（File/Class/Namespace/Field 签名 + 模型统一存储）
- 1 个正式 `SignatureCanonicalizer`（MethodSignature，无模型，n:1）
- 5 个临时 `TempSignatureCanonicalizer`（引用语义 + 引用计数）
- `methodsMap: Map<number, ArkMethod>`（保留，n:1 关系）
- `customComponentMap: Map<string, ClassSignature>`（保留，与 ID 体系无关）

任何代码通过 `SignatureCanonicalizerRegistry.getInstance()` 或静态快捷方法直接访问，无需通过 Scene。`Scene.dispose()` / `Scene.clear()` 调用 `Registry.dispose()` 清空单例。当前设计假设运行时只有 1 个 Scene 实例；未来适配多 Scene 时，Registry 从全局单例改为 per-Scene 实例（`Registry.forScene(scene)` 获取），改动很小。

### 2. SignatureModelCanonicalizer — 签名+模型统一存储

扩展 `SignatureCanonicalizer<S>` 为 `SignatureModelCanonicalizer<S, M>`，新增 `models: (M | undefined)[]` 数组。ID→签名和 ID→模型共用同一 ID 空间，消除独立的 `Map<number, Model>`。提供 `setModel(id, model)` / `getModel(id)` / `removeModel(id)` / `getModels()` 方法。

### 3. toMapKey 设计原则 + FieldSignature.toMapKey()

`toMapKey()` 仅包含身份标识字段，排除推导中可变的字段（`returnType`、`type`）。`FieldSignature` 新增 `toMapKey()` 方法。`FieldSignature.DEFAULT` 和 `MethodSignature.DEFAULT` 使用 lazy getter 避免循环依赖。

**toMapKey 设计原则**：

1. **包含身份标识字段**：`toMapKey()` 返回值唯一确定签名身份，两个签名 `toMapKey()` 相同当且仅当身份相同
2. **排除可变字段**：推导中会通过 setter 修改的字段（如 `MethodSubSignature.returnType`、`FieldSignature.type`）不包含在 `toMapKey()` 中，避免推导中 ID 变化破坏引用一致性
3. **递归调用上层 toMapKey**：复合签名递归调用上层签名的 `toMapKey()` 而非 `toString()`，避免可读性修饰进入 Map key
4. **与 toString 分离**：`toMapKey()` 紧凑、仅身份字段；`toString()` 可读、可包含更完整信息

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

- 包含：`declaringSignature.toMapKey()` + `fieldName` + `staticFlag`
- 不包含：`type`（可变字段，`setType()` 在推导中调用）
- 与 `toString()` 的区别：递归调用 `toMapKey()` 而非 `toString()`

### 4. 签名与模型共用 ID

- `FileSignature` ↔ `ArkFile` 共用 FileID（1:1，ID >= 1）
- `ClassSignature` ↔ `ArkClass` 共用 ClassID（1:1，ID >= 1）
- `NamespaceSignature` ↔ `ArkNamespace` 共用 NamespaceID（1:1，ID >= 1）
- `FieldSignature` ↔ `ArkField` 共用 FieldID（1:1，ID >= 1）
- `MethodSignature` 拥有独立的 MethodSigID，不与 `ArkMethod` 共用（因重载 n:1 关系）
- `MethodSubSignature` 与 `MethodSignature` 1:1 绑定，共用同一 MethodSigID，不设独立 canonicalizer，不需要 `toMapKey()`；`setReturnType()` 等修改不影响 ID
- ID 0 保留给 DEFAULT 签名，不对应任何模型
- 临时 ID 不与任何模型共用，不破坏正式 ID ↔ 模型的 1:1 不变式

模型存储在 `SignatureModelCanonicalizer` 的 `models` 数组中以 ID 为索引，消除独立的 `Map<number, Model>`。

### 5. 模型间关系引用 — ID 优先，对象引用回退

模型保留对象引用作为主存储（向后兼容），新增 ID 字段作为辅助存储。**不在 ArkClass/ArkMethod/ArkNamespace/ArkField 上存储 scene 引用**——ID 查询通过 Registry 全局访问。ID 在 Builder 阶段通过 Registry 显式设置，无需懒加载。`ArkFile` 保留 `scene: Scene` 引用（顶层模型天然属于某个 Scene，65 处 `getDeclaringArkFile().getScene()` 链式调用无需修改），并新增 `projectFile: boolean` 字段区分 project/SDK 文件。

`getDeclaringArkFile()` / `getDeclaringArkClass()` / `getDefaultClass()` / `getOuterMethod()` 改为 **ID 优先 + 对象引用回退**：优先通过 ID 从 Registry 查询模型对象，对象引用作为回退（过渡期保留）。`ArkFile.setDefaultClassID()` 保持懒加载（defaultClass 在 buildDefaultArkClassFromArkFile 中创建，时序较早）。

Type/Signature 层新增 `sigID` + `tempSigID` 双字段，setter 清除 ID 缓存，下次需要 ID 时由调用方通过 Registry 重新获取。

### 6. Scene 改造 — 委托 Registry

Scene 删除 `filesMap`/`classesMap`/`namespacesMap`/`sdkArkFilesMap` 和 10 个 canonicalizer 字段。公开 API 保留（向后兼容），内部委托 Registry。

**待删除项**（代码当前保留为委托，设计目标为删除）：
- Scene 的 `internFileSig()`/`internClassSig()`/`internMethodSig()`/`internNamespaceSig()`/`internFieldSig()` 辅助方法 — 当前保留为委托 Registry 的快捷方法，待删除（调用方直接使用 Registry）
- Scene 的 `getFileById()`/`getClassById()`/`getMethodById()`/`getNamespaceById()` 方法 — 当前保留为委托 Registry 的快捷方法，待删除（调用方直接使用 Registry）

**待重新探索项**：
- `getMethodsMap(refresh)` — 设计目标为删除（ID 稳定，无需 refresh），实施中尝试删除后发现 `inferTypes()` 仍需 refresh 重建 methodsMap，已回退保留。待重新探索是否能消除 refresh 依赖

### 7. 类型推导 `===` 修复 + 签名 setter 自动 intern

4 处 `===` 比较改为 `toMapKey()` 值比较（`TypeInference.isSameType`、`IRInference.needInfer`、`ModelUtils:674,677`）。2 处天然安全（`isSubType` 的 ArkClass 比较、`methodSubSignatureCompare` 的 Type 比较）。

签名 setter 自动 intern：`ArkClass.setSignature()`、`ArkMethod.setImplementationSignature()`、`ArkField.setSignature()`、`ArkNamespace.setSignature()`、`ArkFile.setFileSignature()` 在 setter 中自动调用 `canonicalizer.intern()`，确保签名对象单实例化。`ArkMethod.setDeclareSignatures()` 不调用 intern（overload 方法有多个声明签名，参数相同返回类型不同的会被误判为相同）。

## Non-Goals

1. 不改变 ArkIR 的语义和 IR 指令集。
2. 不改变 CLI 接口（`cg`、`ir` 子命令的参数和输出格式）。
3. 不重构前端解析器本身的解析逻辑（AST → IR 的转换规则不变）。
4. 不 ID 化 ArkBody 内部结构（locals、stmts、CFG）。
5. 不 ID 化 LocalSignature 和 AliasTypeSignature（使用场景较少，后续按需扩展）。
6. 不实现签名使用表（Signature Usage Table）— 作为后续独立变更，当前仅预留架构扩展点。
7. 不实现 Scene 序列化/反序列化 — ID 化为其奠定基础，但序列化本身不在本轮范围。
8. 不修改 `ArkModule.filesMap` 和 `ModuleScene.moduleFileMap`（模块级 Map，与 Scene 级不同）。
9. 不适配多个 Scene 实例（当前假设单 Scene；未来适配改动很小）。

## Capabilities

### New Capabilities

- `performance-architecture`: ArkAnalyzer 高性能架构改造，涵盖 Registry 全局单例、SignatureModelCanonicalizer 签名+模型统一存储、签名单实例化与模型 ID 化（5 类签名 + MethodSubSignature）、模型间关系引用 ID 优先、Scene 委托 Registry、类型推导 `===` 修复与签名 setter 自动 intern。

### Modified Capabilities

（无已有 capability 的 spec 级需求变更。本变更新建 `performance-architecture` capability。）

## Impact

### 受影响的代码

| 模块      | 文件                                                                                                                          | 影响类型                                                                                                                                                                                                                                                                                                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 新增      | `src/core/common/SignatureCanonicalizer.ts`                                                                                   | 正式签名值语义去重与单实例化基础设施；采用 hash + equals 三层架构（`Canonicalizable` 接口 + `numberWithEquality` 策略），替代 toMapKey 字符串去重                                                                                                                                                                                                                                              |
| 新增      | `src/core/common/SignatureModelCanonicalizer.ts`                                                                              | 签名+模型统一存储；继承 `SignatureCanonicalizer`，新增 `models: (M \| undefined)[]` 数组                                                                                                                                                                                                                                                                                                       |
| 新增      | `src/core/common/SignatureCanonicalizerRegistry.ts`                                                                           | 全局单例 Registry；集中管理所有 canonicalizer、methodsMap、customComponentMap                                                                                                                                                                                                                                                                                                                  |
| 新增      | `src/core/common/TempSignatureCanonicalizer.ts`                                                                               | 临时签名引用语义分配与引用计数管理；`register`/`release`/`refCounts` 机制已实现并预留                                                                                                                                                                                                                                                                                                         |
| 新增      | `src/utils/HashUtils.ts`                                                                                                      | MurmurHash3 风格字符串哈希 + boost 风格 hash combine                                                                                                                                                                                                                                                                                                                                            |
| Scene     | `src/Scene.ts`                                                                                                                | 删除 4 个 Map + 10 个 canonicalizer 字段；公开 API 委托 Registry；`dispose()`/`clear()` 调用 `Registry.dispose()`；`internXxxSig()`/`getXxxById()` 当前保留为委托（待删除）；`getMethodsMap(refresh)` 当前保留（待重新探索）                                                                                                                                                                  |
| 签名      | `src/core/model/ArkSignature.ts`                                                                                              | `FieldSignature` 新增 `toMapKey()` 方法 + `DEFAULT` lazy getter；`MethodSignature` 新增 `DEFAULT` lazy getter；5 个签名类新增 `getHashCode()`/`equals()` 方法；`MethodSignature`/`FieldSignature` 新增 `declaringClassSigID`/`declaringSigID` + `declaringTempSigID` 双字段；删除 `scene?: any`/`setScene()`                                                                                  |
| 模型      | `src/core/model/ArkFile.ts`                                                                                                   | 保留 `scene: Scene`；新增 `projectFile: boolean` + `defaultClassID` + `setDefaultClassID()`；`getDefaultClass()` ID 优先 + 对象引用回退；`setScene()` 恢复为仅 `this.scene = scene`（无级联传播）；`setFileSignature()` 自动 intern                                                                                                                                                              |
| 模型      | `src/core/model/ArkClass.ts`、`ArkMethod.ts`、`ArkNamespace.ts`、`ArkField.ts`                                                | 删除 `scene?: Scene`/`setScene()`；新增 ID 字段（`declaringFileID`/`declaringClassID`/`outerMethodSigID`）+ setter；`getDeclaringArkFile()`/`getDeclaringArkClass()`/`getOuterMethod()` 改为 ID 优先 + 对象引用回退；签名 setter 自动 intern                                                                                                                                                |
| Type 系统 | `src/core/base/Type.ts`                                                                                                       | `ClassType`、`FunctionType`、`LexicalEnvType`、`EnumValueType` 新增 `sigID` + `tempSigID` 双字段；删除 `scene?: Scene`/`setScene()`；setter 清除 ID 缓存                                                                                                                                                                                                                                        |
| 类型推导  | `src/core/common/TypeInference.ts`、`src/core/common/IRInference.ts`                                                          | `===` 比较改为 `toMapKey()` 值比较；混合方案下 setter 自动清除 ID 缓存                                                                                                                                                                                                                                                                                                                          |
| 模型查询  | `src/core/common/ModelUtils.ts`                                                                                               | `===` 比较改为 `toMapKey()` 值比较（含 ClassSignature 和 FieldSignature 修复）                                                                                                                                                                                                                                                                                                                 |
| VFG       | `src/VFG/builder/DVFGBuilder.ts`                                                                                              | FieldSignature 作为 Map key 的场景依赖 toMapKey 引用相等性                                                                                                                                                                                                                                                                                                                                      |
| Builder   | `src/core/model/builder/ArkClassBuilder.ts`、`ArkMethodBuilder.ts`、`ArkFieldBuilder.ts`、`ArkNamespaceBuilder.ts`            | Builder 阶段通过 Registry 显式设置 ID（`setDeclaringFileID()`/`setDeclaringClassID()`/`setOuterMethodSigID()`）                                                                                                                                                                                                                                                                                 |
| Builder   | `src/frontend/cppFrontend/model/builder/ArkClassBuilder.ts`、`ArkMethodBuilder.ts`、`ArkFieldBuilder.ts`、`ArkNamespaceBuilder.ts` | C++ 版本同上                                                                                                                                                                                                                                                                                                                                                                                   |
| 依赖排序  | `src/utils/DependenciesSort.ts`                                                                                               | `sortByDependency()` 移除 `scene: Scene` 参数，通过 Registry 获取 ID                                                                                                                                                                                                                                                                                                                            |
| 文件工具  | `src/utils/FileUtils.ts`                                                                                                      | `getFileSignatureMapKey()` 不再被 Scene 使用                                                                                                                                                                                                                                                                                                                                                    |

### 受影响的 API

- `Scene.getFile()`、`Scene.getClass()` 等公开方法签名和行为保持不变，内部委托 Registry。
- `toMapKey()` 保持返回 `string`。签名类上不新增 `toMapKeyId()` 方法（因签名类无法访问 Scene 上的 canonicalizer，存在循环依赖）；改为在 Registry 上统一提供 ID 转换。
- `Scene` 的 `internXxxSig()`/`getXxxById()` 当前保留为委托 Registry 的快捷方法（待删除，调用方直接使用 Registry）。
- 模型层（ArkFile/ArkClass/ArkMethod/ArkNamespace/ArkField）和 Type 层（ClassType/FunctionType/LexicalEnvType/EnumValueType）及签名层（MethodSignature/FieldSignature）新增 `@internal` ID 字段和 setter；对象引用 getter 改为 ID 优先 + 对象引用回退。
- 不新增 `SceneOptions` 配置项（ID 化为纯内部改造，对用户透明）。

### 受影响的依赖

- 无新增外部依赖。正式 canonicalizer 内部复用已有的 `Canonicalizer<T>`（`src/utils/Canonicalizer.ts`，`numberWithEquality` 策略 + TypedArray 哈希表 + 开放寻址 + 拉链碰撞处理）；临时 canonicalizer 为 `TempSignatureCanonicalizer<S>`（内部包装 `Canonicalizer<T>` 的 objectIdentity 策略 + 引用计数 `Map<number, number>`）。

### 受影响的测试

- 现有 vitest 单测验证 ID 化后行为一致性（特别是类型推导相关测试）。
- 新增 `SignatureCanonicalizer` / `SignatureModelCanonicalizer` / `SignatureCanonicalizerRegistry` / `TempSignatureCanonicalizer` 单元测试。
- 新增模型间关系引用 ID 化测试、临时 ID 机制测试。
- 测试文件更新为 Registry 方式（移除 `STUB_SCENE = new Scene()` 等 workaround，`setup` 移到 `beforeAll` + `SignatureCanonicalizerRegistry.dispose()`）。
- 性能测试（`tests/samples/perf/`）需验证内存峰值降低。
