## 1. SignatureCanonicalizer + SignatureModelCanonicalizer + Registry 基础设施

- [x] 1.1 新建 `src/core/common/SignatureCanonicalizer.ts`，实现 `SignatureCanonicalizer<S extends Canonicalizable>` 类，定义 `Canonicalizable` 接口（`getHashCode(): number` + `equals(other: this): boolean`）；内部委托 `Canonicalizer<S>` 的 `numberWithEquality` 策略（keyExtractor 返回 `sig.getHashCode()`，equalityComparer 为 `sig.equals()`）；包含 4 个核心方法：`getId(sig)`、`getExistingId(sig)`（返回 -1）、`get(id)`、`intern(sig)`
- [x] 1.2 新建 `src/core/common/SignatureModelCanonicalizer.ts`，继承 `SignatureCanonicalizer<S>`，新增 `models: (M | undefined)[]` 数组和 `setModel(id, model)` / `getModel(id)` / `removeModel(id)` / `getModels()` 方法
- [x] 1.3 新建 `src/core/common/TempSignatureCanonicalizer.ts`，实现 `TempSignatureCanonicalizer<S>` 类：内部包装 `Canonicalizer<S>`（objectIdentity 策略）+ `refCounts: Map<number, number>`；3 个核心方法：`register(sig)`（分配/复用 ID + refcount++）、`release(tempSigID)`（refcount--，归 0 则从 refCounts 移除）、`get(id)`；`size()` 返回 `refCounts.size`；`clear()` 清空
- [x] 1.4 新建 `src/core/common/SignatureCanonicalizerRegistry.ts`，全局单例类：持有 5 个 `SignatureModelCanonicalizer` + 1 个 `SignatureCanonicalizer<MethodSignature>` + 5 个 `TempSignatureCanonicalizer` + `methodsMap: Map<number, ArkMethod>` + `customComponentMap: Map<string, ClassSignature>`；构造函数中 `internDefaults()` 初始化 5 个 DEFAULT 签名（ID=0）；`static getInstance()` / `static dispose()` / 静态快捷方法（`getFileId(sig)` / `getClassById(id)` 等）
- [x] 1.5 新建 `src/utils/HashUtils.ts`，提供 `hashString32`（MurmurHash3 风格）、`hashCombineU32`（boost 风格）、`hashCombineOptionalU32` / `hashCombineOptionalString`
- [x] 1.6 编写 `SignatureCanonicalizer` 单元测试：验证值语义去重（相同 hash + equals 返回相同 ID）、单实例化（`intern()` 返回同一对象）、`getExistingId` 不新建（返回 -1）、`get` 反查正确
- [x] 1.7 编写 `SignatureModelCanonicalizer` 单元测试：`setModel`/`getModel`/`removeModel`/`getModels` 正确性、ID=0 不对应模型、removeModel 后 getModels 过滤 undefined
- [x] 1.8 编写 `SignatureCanonicalizerRegistry` 单元测试：单例 getInstance/dispose、DEFAULT 签名 ID=0、静态快捷方法正确性
- [x] 1.9 编写 `TempSignatureCanonicalizer` 单元测试：引用语义分配（值相同但引用不同→不同 ID）、同一实例多次 `register` → refcount 递增、`release` 后 refcount 递减、refcount 归 0 后 `size()` 减少

## 2. FieldSignature.toMapKey() + DEFAULT + 5 类签名 getHashCode/equals

- [x] 2.1 在 `src/core/model/ArkSignature.ts` 的 `FieldSignature` 类中新增 `toMapKey()` 方法，计算逻辑为：`declaringSignature.toMapKey() + '.' + fieldName`，若 `isStatic()` 则在 fieldName 前加 `[static]` 前缀；不包含 `type` 字段（可变字段）
- [x] 2.2 在 `FieldSignature` 类中新增 `public static get DEFAULT(): FieldSignature`（lazy getter，避免与 `Type.ts` 循环依赖），使用 `UNKNOWN_FIELD_NAME` + `ClassSignature.DEFAULT` + `UnknownType.getInstance()` 构造；在 `MethodSignature` 类中新增 `public static get DEFAULT(): MethodSignature`（lazy getter），使用 `ClassSignature.DEFAULT` + `MethodSubSignature(UNKNOWN_METHOD_NAME, [], UnknownType.getInstance(), false)` 构造
- [x] 2.3 为 5 个签名类（FileSignature、ClassSignature、MethodSignature、NamespaceSignature、FieldSignature）添加 `getHashCode(): number` 方法（构造时用 `hashString32` + `hashCombineU32` 计算 32 位 hash 并缓存到 `readonly` 字段）
- [x] 2.4 为 5 个签名类添加 `equals(other: this): boolean` 方法（逐字段语义比较，从快到慢短路）；`MethodSignature.equals()` 改为比较 `methodSubSignature.toString()`（与 `toMapKey()` 语义一致）
- [x] 2.5 编写 `FieldSignature.toMapKey()` 单元测试：验证相同 declaringSignature + fieldName + staticFlag 返回相同 key、不同 fieldName 返回不同 key、`type` 变化不影响 key

## 3. ArkFile 新增 projectFile 字段

- [x] 3.1 在 `ArkFile` 中新增 `private projectFile: boolean = false` + `isProjectFile(): boolean` + `setProjectFile(isProject: boolean): void`

## 4. Scene 改造 — 委托 Registry

- [x] 4.1 删除 Scene 的 `filesMap`、`classesMap`、`namespacesMap`、`sdkArkFilesMap` 字段
- [x] 4.2 删除 Scene 的 10 个 canonicalizer 字段、`defaultsInterned` 标志、`internDefaults()` 方法、`clearSignatureCanonicalizers()` 方法
- [x] 4.3 改造 `setFile(file)`：`file.setScene(this)` + `file.setProjectFile(true)` + `Registry.getInstance().fileSigCanonicalizer.getId(sig)` + `setModel(id, file)`
- [x] 4.4 改造 `addSdkArkFile(arkFile)`：`arkFile.setScene(this)` + `arkFile.setProjectFile(false)` + `Registry.getInstance().fileSigCanonicalizer.getId(sig)` + `setModel(id, arkFile)`
- [x] 4.5 改造 `getFile(fileSignature)`：`Registry.getInstance().fileSigCanonicalizer.getExistingId(sig)` + `getModel(id)`
- [x] 4.6 改造 `getFiles()`：`Registry.getInstance().fileSigCanonicalizer.getModels().filter(f => f.isProjectFile())`
- [x] 4.7 改造 `getSdkArkFiles()`：`Registry.getInstance().fileSigCanonicalizer.getModels().filter(f => !f.isProjectFile())`
- [x] 4.8 改造 `hasSdkFile(fileSignature)`：`Registry.getInstance().fileSigCanonicalizer.getExistingId(sig) !== -1 && getModel(id)?.isProjectFile() === false`
- [x] 4.9 改造 `getClass()` / `getClasses()` / `removeClass()`：getClasses 改为遍历 getFiles，addClass 通过 registerClass 增量注册
- [x] 4.10 改造 `getNamespace()` / `getNamespaces()` / `removeNamespace()`：getNamespaces 改为遍历 getFiles
- [x] 4.11 改造 `getMethod()` / `getMethods()` / `addToMethodsMap()` / `removeMethod()`：getMethods 改为遍历 getClasses
- [x] 4.12 改造 `getNamespacesMap()`：改为遍历 getFiles 中的 namespace
- [x] 4.13 改造 `disposeModule(module)`：`Registry.getInstance().xxxCanonicalizer.removeModel(id)` 替代 `Map.delete()`
- [x] 4.14 改造 `dispose()`：调用 `SignatureCanonicalizerRegistry.dispose()`
- [x] 4.15 改造 `clear()`：调用 `SignatureCanonicalizerRegistry.dispose()` + 重新 `getInstance()`
- [x] 4.16 改造 `isRepeatBuildFile()`：通过 `Registry.getInstance().fileSigCanonicalizer.getExistingId(sig)` 查询
- [x] 4.17 改造 `unregisterCustomComponent()` / `registerCustomComponent()` / `getCustomComponent()` / `getCustomComponentMap()`：委托 Registry.customComponentMap
- [x] 4.18 改造 `buildBasicInfo()` 中 SDK 文件遍历为 `Registry.getInstance().fileSigCanonicalizer.getModels().filter(f => !f.isProjectFile()).forEach`
- [x] 4.19 改造 `getStaticInitMethods()`：改为遍历 `getClasses()` 的方法
- [x] 4.20 改造 `ModuleScene.addArkFile()` / `getModuleFilesMap()`：通过 `Registry.getInstance().fileSigCanonicalizer.getId(sig)` 获取 key
- [x] 4.21 新增 `registerClass(cls)` 和 `registerNamespace(ns)` 方法，供 ArkFile/ArkNamespace 增量注册
- [x] 4.22 修复 `getDependencyFilesDeeply()` 中 `internFileSig` 泄漏：用 `getExistingId` 替代
- [x] 4.23 恢复 `getMethodsMap(refresh)` 方法（实施中尝试删除后发现 `inferTypes()` 仍需 refresh，已回退保留）
- [x] 4.24 恢复 `inferTypes()` 中 `getMethodsMap(true)` 调用（在 `if (buildStage < TYPE_INFERRED)` 条件内）
- [ ] 4.25 **待重新探索**：分析是否能消除 `getMethodsMap(refresh)` 的 refresh 依赖（可能需要推导中增量注册方法到 methodsMap），实现设计目标"删除 refresh 逻辑"

## 5. DependenciesSort 改造

- [x] 5.1 移除 `sortByDependency()` 的 `scene: Scene` 参数，改为通过 `SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.getId(sig)` 获取 ID
- [x] 5.2 更新 `Scene.ts` 中的调用点

## 6. 移除模型/Type/Signature 的 scene 字段

- [x] 6.1 移除 `ArkClass` 的 `scene?: Scene` 字段和 `setScene()` 方法
- [x] 6.2 移除 `ArkMethod` 的 `scene?: Scene` 字段和 `setScene()` 方法
- [x] 6.3 移除 `ArkNamespace` 的 `scene?: Scene` 字段和 `setScene()` 方法
- [x] 6.4 移除 `ArkField` 的 `scene?: Scene` 字段和 `setScene()` 方法
- [x] 6.5 移除 `ClassType` 的 `scene?: Scene` 字段和 `setScene()` 方法
- [x] 6.6 移除 `FunctionType` 的 `scene?: Scene` 字段和 `setScene()` 方法
- [x] 6.7 移除 `LexicalEnvType` 的 `scene?: Scene` 字段和 `setScene()` 方法
- [x] 6.8 移除 `EnumValueType` 的 `scene?: Scene` 字段和 `setScene()` 方法
- [x] 6.9 移除 `MethodSignature` 的 `scene?: any` 字段和 `setScene()` 方法
- [x] 6.10 移除 `FieldSignature` 的 `scene?: any` 字段和 `setScene()` 方法
- [x] 6.11 移除 `ArkFile.setScene()` 的级联传播逻辑（恢复为仅 `this.scene = scene`）
- [x] 6.12 修改所有 `getXxxID()` 懒加载方法——改为通过 `SignatureCanonicalizerRegistry.getInstance()` 获取 ID

## 7. Builder 设置 ID + ID 优先 getter

- [x] 7.1 ArkClassBuilder 中 `setDeclaringFileID(Registry.getInstance().fileSigCanonicalizer.getId(arkFile.getFileSignature()))`
- [x] 7.2 ArkMethodBuilder 中 `setDeclaringClassID(Registry.getInstance().classSigCanonicalizer.getId(cls.getSignature()))` + `setOuterMethodSigID`
- [x] 7.3 ArkFieldBuilder 中 `setDeclaringClassID(Registry.getInstance().classSigCanonicalizer.getId(cls.getSignature()))`
- [x] 7.4 ArkNamespaceBuilder 中 `setDeclaringFileID(Registry.getInstance().fileSigCanonicalizer.getId(arkFile.getFileSignature()))`
- [x] 7.5 C++ ArkClassBuilder / ArkMethodBuilder / ArkFieldBuilder / ArkNamespaceBuilder 同上
- [x] 7.6 新增 setter 方法：`ArkClass.setDeclaringFileID()` / `ArkMethod.setDeclaringClassID()` + `setOuterMethodSigID()` / `ArkNamespace.setDeclaringFileID()` / `ArkFile.setDefaultClassID()`
- [x] 7.7 `getDeclaringArkFile()` / `getDeclaringArkClass()` / `getDefaultClass()` / `getOuterMethod()` 改为 ID 优先 + 对象引用回退
- [x] 7.8 修改 `BuildSceneByFiles.test.ts` 的期望文件顺序（从依赖排序改为解析顺序）

## 8. 不明确签名临时 ID 机制（双字段存储 — 基础设施已实现，生产代码未接入）

**当前状态**：`TempSignatureCanonicalizer` 类完整实现并有单元测试；ClassType/FunctionType/MethodSignature/FieldSignature 的双字段和 getter/setter 已定义。但 `register()`/`release()` 在生产代码中零调用，Type 构造函数不调用 `register()`，setter 不调用 `release()`，`tempSigID` 字段永远为 `undefined`，整套机制不产生实际效果。详见第 14 部分待实施项。

- [x] 8.1 在 `ClassType` 中新增 `classSigID: number = -1` + `tempSigID?: number` 双字段；`getClassSigID()` / `getTempSigID()` / `setTempSigID()` 方法；`setClassSignature()` 清除 ID 缓存（但不调用 `release()`）
- [x] 8.2 在 `FunctionType` 中新增 `methodSigID: number = -1` + `tempSigID?: number` 双字段；同理处理 getter/setter（无 `setMethodSignature()` 方法，签名构造后不可变）
- [x] 8.3 在 `LexicalEnvType` 中新增 `methodSigID: number = -1`（**缺失 tempSigID 字段**，待实施 14.5 补全）
- [x] 8.4 在 `EnumValueType` 中新增 `fieldSigID: number = -1`（**缺失 tempSigID 字段**，待实施 14.5 补全）
- [x] 8.5 在 `MethodSignature` 中新增 `declaringClassSigID: number = -1` + `declaringTempSigID?: number` 双字段（无 `setDeclaringClassSignature()` 方法，构造后不可变）
- [x] 8.6 在 `FieldSignature` 中新增 `declaringSigID: number = -1` + `declaringTempSigID?: number` 双字段（无 `setDeclaringSignature()` 方法，构造后不可变）
- [x] 8.7 setter 清除 ID 缓存：仅 `ClassType.setClassSignature()` 实现了清除 `sigID = -1` + `tempSigID = undefined`（但不调用 `release()`）；`Expr.setMethodSignature()` / `Ref.setFieldSignature()` 当前纯赋值，不清除缓存（待实施 14.3 补全）
- [x] 8.8 编写临时 ID 机制测试：验证双字段存储、setter 清除缓存、引用语义分配（值相同但引用不同→不同临时 ID）— **仅测试代码调用 `getClassSigID` 等，生产代码零调用**
- [x] 8.9 懒加载 getter（`getClassSigID()` / `getMethodSigID()` / `getFieldSigID()` / `getDeclaringSigID()` / `getDeclaringClassSigID()`）通过 `Registry.getInstance().xxxCanonicalizer.getId(sig)` 获取正式 ID — **当前用 `getId`（会创建新 ID），待实施 14.4 改为 `getExistingId` 优先**

## 9. 签名 setter 自动 intern

- [x] 9.1 `ArkFile.setFileSignature()` 调用 `fileSigCanonicalizer.intern(fileSignature)`
- [x] 9.2 `ArkClass.setSignature()` 调用 `classSigCanonicalizer.intern(classSig)`
- [x] 9.3 `ArkMethod.setImplementationSignature()` 调用 `methodSigCanonicalizer.intern(signature)`
- [x] 9.4 `ArkField.setSignature()` 调用 `fieldSigCanonicalizer.intern(fieldSig)`
- [x] 9.5 `ArkNamespace.setSignature()` 调用 `namespaceSigCanonicalizer.intern(namespaceSig)`
- [x] 9.6 `ArkMethod.setDeclareSignatures()` 不调用 intern（overload 方法有多个声明签名，参数相同返回类型不同的会被误判为相同）
- [x] 9.7 `ArkClass.setDeclareSignature()` 不调用 intern

## 10. 类型推导 `===` 修复

- [x] 10.1 `TypeInference.isSameType()` 改为 `toMapKey()` 值比较
- [x] 10.2 `IRInference.needInfer()` 和 `inferStaticInvokeExpr()` 改为 `toMapKey()` 值比较
- [x] 10.3 `ModelUtils.ts:674,677` 改为 `toMapKey()` 值比较
- [x] 10.4 `TypeInference.isSubType()` 中 `ArkClass` `===` 安全（无需修改）
- [x] 10.5 `methodSubSignatureCompare` 中 Type `===` 安全（无需修改）

## 11. 测试更新

- [x] 11.1 更新测试文件：setup 移到 `beforeAll` + `SignatureCanonicalizerRegistry.dispose()`
- [x] 11.2 更新 `TypeInference.test.ts`：`sortByDependency` 调用移除 scene 参数
- [x] 11.3 更新 `SceneCanonicalizerIntegration.test.ts`：dispose 断言改为 size()==1
- [x] 11.4 更新 `ModelRelationshipID.test.ts`：删除 `setScene()` 调用
- [x] 11.5 更新 `TempIDMechanism.test.ts`：删除 `setScene()` 调用，更新断言

## 12. 集成与验证

- [x] 12.1 运行全量 vitest 单测（`npx vitest run --exclude tests/unit/cppCore`），验证所有测试通过（1235/1236，1 个 Windows EPERM 环境问题）
- [x] 12.2 运行 TypeScript 编译检查（`npx tsc --noEmit`），验证无类型错误
- [x] 12.3 运行代码格式检查（`prettier --write`），验证代码格式合规
- [ ] 12.4 运行性能基准测试（`PERF_ROUNDS=3 npm run perf:arkts`），记录优化前后的内存峰值和 Wall-clock 时间（需要大型工程作为输入，待环境就绪后执行）
- [ ] 12.5 更新 `tests/samples/perf/` 中的基准对比数据（`baseline-summary.json`）（依赖 12.4）
- [x] 12.6 更新 `CHANGELOG.md`，添加高性能架构改造的变更记录
- [ ] 12.7 更新 `docs/` 中相关架构文档，描述 Registry 全局单例和 ID 化设计

## 13. Scene 委托方法删除 — ✅ 已完成

- [x] 13.1 删除 Scene 的 `internFileSig()`/`internClassSig()`/`internMethodSig()`/`internNamespaceSig()`/`internFieldSig()` 委托方法
- [x] 13.2 删除 Scene 的 `getFileById()`/`getClassById()`/`getMethodById()`/`getNamespaceById()` 委托方法
- [x] 13.3 更新所有调用点（Scene.ts 内部 ~27 处 + ArkModule.ts 1 处 + 测试文件）
- [x] 13.4 运行全量测试验证删除后无回归（1235/1236 通过）

## 14. 临时 ID 与迁移机制接入生产代码（方案B）— ✅ 已完成

**实施方案**：Type 构造函数中通过 `isUnclear()` 统一判断，不明确签名 register 到临时 canonicalizer，明确签名 getId 到正式 canonicalizer。ArkSignatureBuilder 不再 register（构造函数统一处理）。

**签名分类与处理方式**：

| 签名类型 | 来源 | tempSigID | 正式 ID | 完整性检查 |
|----------|------|-----------|---------|-----------|
| 待解析不明确签名 | ArkSignatureBuilder 4 个方法 | ✅ Type 构造函数 register | ❌ 迁移后通过 setter 走正式 | ✅ size() 应归 0（下界） |
| 永久默认签名 | Builtin/Local/ArkIRTransformer 6 处 | ❌ isUnclear() 返回 false（DEFAULT 单例例外） | 正式 ID 0 | 不参与 |
| 推导中动态新签名 | AliasClassSignature 3 处 | ❌ isUnclear() 返回 false（文件来源明确） | 懒加载 `getExistingId` → fallback `getId` 新建 | 不参与 |
| 明确签名 | ArkClass.getSignature() 等 | ❌ isUnclear() 返回 false | 构造函数 getId | 不参与 |

**已知限制 — 引用计数不精确（size() 为下界）**：详见 design.md R10。

- [x] 14.1 **5 个签名类新增 `isUnclear(): boolean` 方法**：按 `declaringFileSignature === FileSignature.DEFAULT` 判断，DEFAULT 单例及其直接组合返回 false
- [x] 14.2 **ClassType/FunctionType/EnumValueType/LexicalEnvType 删除签名引用字段**，构造函数中 `isUnclear()` 判断 + getId/register，getter 双路查询（正式/临时 canonicalizer）
- [x] 14.3 **ClassType.setClassSignature() 迁移逻辑**：release 旧 tempSigID + isUnclear() 判断新签名走向
- [x] 14.4 **ArkSignatureBuilder 移除 register 调用**（Type 构造函数统一处理）
- [x] 14.5 **AbstractInvokeExpr/AbstractFieldRef 保留对象引用 + sigID 懒加载**：构造时 `sigID = -1`，`getMethodSigID()`/`getFieldSigID()` 懒加载（getExistingId 优先 + getId fallback），setter 重置为 -1。**注意**：sigID/tempSigID 为辅助缓存，主存储仍为对象引用（D2 回退，详见 R11）
- [x] 14.6 **推导后完整性检查**（仅警告）：`Scene.inferTypes()` 末尾检查 `tempXxxCanonicalizer.size()`
- [x] 14.7 **Registry 临时 canonicalizer 静态快捷方法**
- [x] 14.8 **TempSignatureCanonicalizer 新增 `getExistingTempId(sig)`**
- [x] 14.9 **Local.ts 改为 MethodSignature.DEFAULT 单例**
- [x] 14.10 **Builtin.ts（core + cpp）4 个 ClassType 静态字段改为 lazy getter**（不缓存，解决 Registry 重建后 sigID 失效）

## 15. SoA 数据结构替代 — 部分完成

**已完成的性能优化**：
- ✅ S1: methodsMap → SignatureModelCanonicalizer（~720 KB）
- ✅ S3: hash + equals 三层去重（~500 KB-1 MB）
- ✅ S6: 签名对象单实例化 intern（~数 MB）
- ✅ S7（部分）: ClassType/FunctionType/EnumValueType/LexicalEnvType 删除签名引用改纯 sigID

**S7 回退部分（AbstractInvokeExpr/AbstractFieldRef）**：
- ❌ AbstractInvokeExpr：returnType 可变字段与 canonicalizer 去重冲突（R11），无法删除签名引用
- ❌ AbstractFieldRef：type 可变字段同 R11 原因

**不建议实施的 SoA 替代项**：

- [ ] 15.3 **S8: 模型签名引用改 ID** — 不建议实施
  - 收益 ~12 KB（仅 ArkClass/ArkNamespace/ArkFile 可改造；ArkMethod/ArkField 有 R11 障碍）
  - 收益不匹配改动量
- [ ] 15.4 **S9: 签名内嵌签名引用改 ID** — 不建议实施
  - 收益 ~40-80 KB（签名已通过 intern 单实例化）
  - 改动量大（~数百处 getter 调用），收益不匹配
  - 当前：`Map<number, ArkMethod>`，key 是 MethodSigID（稠密整数，从 1 开始递增），Map per-entry ~80 字节，万级方法 → ~800 KB
  - 替换：`methodSigCanonicalizer` 从 `SignatureCanonicalizer` 升级为 `SignatureModelCanonicalizer<MethodSignature, ArkMethod>`，删除独立的 `methodsMap` 字段，模型存储在 canonicalizer 内置的 `models` 数组中，per-entry 8 字节 → ~80 KB
  - 改动：`SignatureModelCanonicalizer` 新增 `clearModels()` 方法（只清模型，保留签名表）；`SignatureCanonicalizerRegistry` 改 methodSigCanonicalizer 类型 + 删除 methodsMap + 更新 dispose/getArkMethodById；`Scene.ts` 7 处 methodsMap 操作改为 getModel/setModel/removeModel/clearModels；`ArkMethod.ts` getOuterMethod 改为 getModel
## 16. 其他待实施项

- [ ] 16.1 **`ArkClass.heritageClasses` 和 `extendedClasses` 迁移到 ID** — 时序复杂，需专项分析
- [ ] 16.2 **Signature Usage Table（签名使用表）** — 后续独立变更，前置依赖（临时 ID 接入）已完成
- [ ] 12.4 **性能基准测试** — 需大型工程输入
- [ ] 12.5 **更新基准对比数据** — 依赖 12.4
- [ ] 12.7 **更新 docs/ 架构文档**

## 17. 文档状态修正 — ✅ 已完成

- [x] 17.1 design.md / spec.md 中临时 ID 部分标注准确状态
- [x] 17.2 design.md D7 中 `getExistingId` 描述修正

## 18. getClassWithName 去按名化（round5-6）— ✅ 已完成

**round5（C 类签名直查 + 同步项）**：
- [x] 18.1 `ArkNamespace.getClass(sig)` 三段式签名直查（归属初筛 → getExistingId → topClass 在位校验），删 `getOriginName()` 名字匹配分支
- [x] 18.2 C 类 7 处调用点签名化：DummyMainCreater / AbcInference / core ArkIRTransformer（签名优先+按名兜底）/ SdkUtils.copyNamespace（精确匹配，消除 Foo/Foo$Bar 错配）/ cpp ModelUtils.getStaticMethodWithName（getDefaultClass）/ cpp TypeInference.inferNestedClassType / cpp ArkNamespaceBuilder（签名 get-or-create）
- [x] 18.3 core `ModelUtils.getStaticMethodWithName` 改 `getDefaultClass()`（全量插桩实证两实现零差异，1425 用例 DIAG-diff=0）

**round5-X1（方法内局部类确定性解析）**：
- [x] 18.4 `ArkMethod.localClassSigIDs`（裸名→ClassSigID 登记表）+ `registerLocalClass`/`getLocalClassSigID` + clearAllReferences 联动
- [x] 18.5 `classDeclarationToStmts` 构建期按源码裸名登记到 declaringMethod（嵌套函数内声明经递归 transformer 自动登记）
- [x] 18.6 `ModelUtils.findLocalClassInMethodChain`（沿 outerMethod 链查表 → registry 解析）
- [x] 18.7 推断接入：`ArkNewExpr.inferType`（Expr.ts + ValueInference 双入口）+ `inferUnclearedType`/`inferUnclearRefType`/`inferUnclearRefName` 链式可选 `arkMethod` 参数 + `resolveArkAssignStmt` 传方法上下文
- [x] 18.8 专项测试 `LocalClassResolution.test.ts`（6 用例：登记绑定/new 解析/类型标注/同名遮蔽修复/闭包链跨层/箭头返回类型），资源 `tests/resources/localClass/`

**round6（删 originName 前缀匹配）**：
- [x] 18.9 cpp `CxxModelUtils.findClassByShortName` 拼名候选链（外围名链由内向外 `short$enclosing` 候选 + 方法局部类 `short$cls.m`，逐个 ClassSignature 直查，内层遮蔽外层）
- [x] 18.10 接入 4 处：cpp `findSymbolInFileWithName`（容器查询前，覆盖推断回查全链）/ `builderUtils.buildTypeFromDerivedType`（arkInstance 推 ctxClass）/ cpp `ArkValueTransformer` new fallback / 匿名 ns 保持精确
- [x] 18.11 **删除 `ArkFile/ArkNamespace.getClassWithName` 前缀模糊匹配分支**，改为容器归属签名直查（复用 canonicalizer 值索引，零新状态）；core 方法内局部类经方法链表解析、cpp 嵌套类经拼名链解析
- [x] 18.12 `OriginNameRemoval.test.ts` 用例 6 改写为断言前缀不可达（固化精确匹配语义）
- [x] 18.13 专项测试 `ShortNameResolution.test.ts`（11 用例：单层/多层链/ns 容器/方法局部类/同名遮蔽/合成查询拒绝 + core 精确匹配/前缀不匹配/真顶层类共存/ns 级精确/手工构建容器安全）
- [x] 18.14 验证：tsc 零错误 + 全量 vitest 回归 + prettier（注：ExportInfo.test nestedCase 的嵌套类短名断言依赖拼名链，需 LLVM 环境机器跑 `npm run test:cpp` 最终确认）
- [x] 18.15 **删除线性精确扫描兜底**：`getClassWithName` 签名直查 miss 即 null——签名归属是唯一真相，签名归属与挂载归属不一致的类不可见（新增 mismatch 语义固化用例）；`reproduce_issues.test.ts` Bug 8 用例同步修正为规范构建（类签名声明 ns 归属）

## 19. getClassWithName 调用面收缩（round7）— ✅ 已完成

**范围界定**：调用处构造 ClassSignature 与方法内部构造无区别（内部已是签名直查）——纯等价内联不做；只改"调用处已持有 ClassSignature 可直接使用"的场景 + 死代码清理。

- [x] 19.1 core `ArkIRTransformer.ts` generateAliasTypeExpr：删按名兜底，仅留 `getArkClassBySig(rightSig)`——TypeLiteral 的 ClassType 唯一生成路径（builderUtils）"构建即 addArkClass 注册、签名即归属"，直查必命中，兜底仅防驱逐态
- [x] 19.2 cpp `ArkIRTransformer.ts` cxxGenerateAliasTypeExpr：`getArkClassBySig(rightType.getClassSignature())` 签名直查优先 + 按名兜底保守保留（typedef 右侧 ClassType 三条生成路径均为真实签名；CxxModelInference 回写可能引入非真实签名，且本机无 C++ 环境实测）
- [x] 19.3 删 core `ModelUtils` 死方法簇（5 个，构成封闭死簇，全库零外部调用）：`getClassWithNameInNamespaceRecursively` / `getClassWithNameFromClass` / `getClassInFileWithName` / `getNamespaceWithNameFromClass` / `getNamespaceInFileWithName`（最后一个为删除连坐孤儿）
- [x] 19.4 `CxxSceneUtils` 标记 `@deprecated`（puncture → processApiDefine → getClassWithName 整链零引用死代码，待确认无外部依赖后删除）
- [x] 19.5 明确保持：core `ModelUtils.getClassWithName`（:135）/`findSymbolInFileWithName`（:254）/`findArkExportInFile`（:862）与 cpp `ArkClassBuilder:300`/`ArkMethodBuilder:233` 的 file 级递归宽语义（ns 祖先链之外的兄弟/深层 ns 依赖此覆盖；`findArkExportInFile` 需递归进 ns 解析 `export class`/`declare module`）——已调研确认，收缩即回归

## 20. getXxxWithName 系列统一签名化（round8）— ✅ 已完成

**盘点**：ArkFile/ArkNamespace/ArkClass 共 9 个 `*WithName` 方法（getClassWithName ×2 已于 §18 处理），本轮处理剩余 7 个。

- [x] 20.1 `ArkFile.getNamespaceWithName` / `ArkNamespace.getNamespaceWithName` 签名直查化：拼容器归属 `NamespaceSignature` 走 `getNamespace(sig)`（13 处 src 调用点逐一核实等价：全部单段精确名、无嵌套串查/前缀/大小写特殊语义、构建时序对称）；Bug 7 测试同步改规范构建（parent setSignature + 子签名带 parentSigID，保持"同名 ns 合并不覆盖"本意）
- [x] 20.2 **field WithName 不可签名化**（实证回退，注释固化）：SDK 多文件同名类声明合并（SdkUtils.copyMembers）把字段挂到合并目标类但保留原声明签名——挂载类 ≠ 签名声明类是**合法设计**（签名指向真正声明处，IR 期望输出固化为如 `ObjectConstructor.prototype`，全量对照诊断实证 173 处此类字段）。签名值直查在该场景必 miss，`getFieldWithName`/`getStaticFieldWithName` 保持线性按名扫
- [x] 20.3 `ArkClass.getField(sig)` 语义精确化：原实现忽略传入签名 staticFlag（先 instance 后 static 各扫一遍），现按签名整体身份直查 + **归属校验**（对齐 getMethod Plan A 模式，防 ref 签名归属父类时的越界命中）；唯一调用方 ViewTreeBuilder 传真实 ref 签名，专项验证通过
- [x] 20.4 ArkFieldBuilder 源头一致化：index-signature 字段签名 staticFlag 由硬编码 true 改为 `field.isStatic()`（与 addField 分流基准一致，消除 27 个签名 flag 与 isStatic() 分裂的实例字段；toString 无 `[static]` 前缀变化，期望输出未固化旧形态）
- [x] 20.5 **明确不签名化**（注释固化）：method WithName 系列 ×5——MethodSignature 身份含参数列表+返回类型，名字不足以构造签名；`methodMatchesName` 的 `%origin$outer` 按 origin 前缀匹配是被测试守护的公开语义
- [x] 20.6 **getMethod(sig) fallback 不可删除**（注释固化）：isMatch 唯一实质宽松 = 归属比较用字符串值而非 SigID；fallback 承载三个结构性场景——① declare[k>0] 无 model（addMethod 只注册 impl ?? declare[0]，matchMethodSignature 选出的非首选声明签名是 callgraph callee 解析主链路）② 闭包 declare 重建签名（只 intern 不注册）③ C++ 跨类借用（声明方法借实现侧签名）。收窄路径（独立轮次）：addMethod 补齐 declare 全槽注册（需带仲裁）→ 命中计数验证残余 → 收窄为 CXX/unclear 专属

## 21. SDK 全局符号多值化 + 成员探测（round9）— ✅ 已完成

**目标**：消除 copyMembers 跨实体/跨文件合并产生的"挂载类 ≠ 签名声明类"分裂（顶层全局符号范围），成员查找改为多实体探测——签名自然归属真实声明文件（版本判据主判据）。

- [x] 21.1 **A1 存储多值化**：`Scene.sdkGlobalMap → Map<string, ArkExport[]>`；`getSdkGlobal` 保持单值签名（返回首实体，36+9 处调用零改动）+ 新增 `getSdkGlobals`；loadAPI 多值登记（first-win append 尾部 / override promote 头部，单值视图语义与旧单值 Map 完全一致）。实施中修正一处失误：duplicated 分支需 append（后续同名实体进列表），否则多值列表残缺
- [x] 21.2 **A2 探测层 + canonical 表**：`inferBaseTypes`（inferBaseType 多候选版，global 级展开）+ `StaticFieldRefInference`/`StaticInvokeExprInference` 入口候选循环 + `inferInvokeExprWithDeclaredClass` 多候选；`Scene.canonicalGlobalMap` + `getCanonicalGlobal`（var 声明同文件 interface 规则；实测 Promise 例外——var 文件无 interface 主体，fallback 首实体）+ `getSdkGlobalMemberClasses`（成员提供者展开：interface 实体 + local 的构造器类及其同名实体，等价旧胖类成员并集）
- [x] 21.3 **A3 移除全部顶层合并**：`loadGlobalLocal`（var 侧 copyMembers 退役，local 登记为多值候选）/ `loadClass`（增补分支成员留原类；类别冲突分支两实体共存）/ abc 分支同款退役；`copyNamespace` 保留现状（ns 级探测待后续轮次，注释标注）。探测层修复三缺口：重载聚合（methodMatchesArgs 精确匹配优先，对齐胖类 matchMethodSignature 语义）+ `constructorSignature` 多实体 + `inferClassFieldType` 字段多实体探测
- [x] 21.4 **期望影响实测**：全量 1442/1443 零回归；ObjectConstructor.prototype/keys(%AC3)/construct-signature 三链路期望零变化（探测命中实体签名与旧胖类一致）；仅 InferArray version 2021/2017 两处断言按多值探测语义改写（Promise.any 属主断言 lib.es2021.promise——旧断言借用分裂挂载才成立）；顺带修复 copyMembers(Math, Math) 自复制翻倍（declare var Math: Math 自引用，旧合并路径死代码化）
- [x] 21.5 **A4 固化测试 + 注释**：`SdkGlobalProbing.test.ts` 3 用例——非首载文件成员探测（replaceAll@es2021.string / includes@es2016）+ 多值列表完整性（Promise 实体集 + any@es2021.promise）+ 全局符号类实体字段不变量（归属 == 挂载类，ns 级残留不在此范围）；ArkClass.getFieldWithName 注释更新（分裂来源缩窄为 ns 级 copyNamespace，实测残留 32 处 Intl 系）
- [x] 21.6 **field WithName 直查化条件不成立的结论**（如实记录）：ns 级 copyNamespace 分裂残留（跨文件同名 namespace 成员互拷仍保留，因 ns 成员查找链未多值化）→ getFieldWithName/getStaticFieldWithName 保持线性按名扫；ns 级多值探测留待后续轮次（需 findPropertyInNamespace 链多值化后移除 copyNamespace）

## 22. canonical 删除 + copyNamespace 退役 + ns 多值探测（round10）— ✅ 已完成

**批 0：canonicalGlobalMap 删除 + sdkGlobalMap 迁移 Registry**
- [x] 22.1 删 canonicalGlobalMap（Scene 4 处 + inferBaseTypes 候选排序 + loadGlobalLocal 写入；规则结论注释存档——Promise 例外使其实测未改变行为，防御价值不抵一张表）
- [x] 22.2 sdkGlobalMap 迁移 `SignatureCanonicalizerRegistry`（"cannot be replaced by canonicalizer" 区，customComponentMap 先例）：Scene 的 getSdkGlobal/getSdkGlobals/getSdkGlobalMap 委托保持 API 签名（45 处调用 + 2 builder 传递零改动）；dispose 生命周期自动覆盖（Scene.clear/dispose 末尾均调 Registry.dispose）；disposeModule 不清（模块卸载后全局符号仍可解析，语义保持）。`Map<string, ArkExport[]>` 原样迁移（Local 无 SigID / class-ns 双 ID 空间冲突 / 对象本就在 canonicalizer models 中——ID 化无收益，customComponentMap 同款先例）

**批 1：Intl 固化测试 + 探测基建 + 构造器对象升级（1449/1450 零回归）**
- [x] 22.3 固化测试（probe-intl.ts + SdkGlobalProbing.test 4 用例）：new Intl.NumberFormat@es5 构造 / formatToParts@es2018.intl / resolvedOptions().notation@es2020.intl / Intl.PluralRules 值访问——实施中发现后三者在**旧胖类时代即 %unk**（独立缺口，非 copyNamespace 的锅）
- [x] 22.4 **构造器对象升级窄修**（ArkNewExprInference）：type 解析为构造器持有类（ns 内 declare const 的 %AC 字面量类 / 顶层 Constructor interface）时，new 实例类型 = construct-signature（或 call）返回类型。根因：`new Intl.NumberFormat` 的 classType 构建期为 %AC1（构造器对象，明确类型），narrowing 哲学下赋值传播不覆盖——顶层 `new Map()` 靠 %0 初始 unclear 的传播兜底升级，ns 内 %AC 无此兜底。对齐 Expr.ArkNewExpr.inferType 的 constructorSignature 升级链
- [x] 22.5 ns 兄弟类探测基建：`Scene.getNamespacedSiblingClasses(arkClass)`（多值全局 ns 的兄弟实体内同名类，登记序 = DFS 序）；inferClassFieldType / inferInvokeExprWithDeclaredClass 探测循环接入（胖类时代休眠，探测是超集）

**批 2：ns 成员探测 + copyNamespace 退役 + field 直查化（1450/1451）**
- [x] 22.6 `ModelUtils.findPropertyInNamespaces`：primary ns miss 后按 ns 名展开 getSdkGlobals 逐实体探测（覆盖各 ns 的 %dflt locals/ns 内类/嵌套 ns/export）；替换 5 个 core 调用点（inferFieldType ns 分支 / findArkModelByRefName / findArkModelBySignature / IRInference+ValueInference 的 invoke ns 分支）；cpp 侧不动（built-in Intl 不进 cpp 链）
- [x] 22.7 **copyNamespace 整体删除**（类互拷 + addArkClass 幽灵挂载 + %dflt locals/aliasTypeMap 互拷三链退役）；输出保持验证：Intl 测试 7/7 全绿；唯一期望更新 1 处（InferArray BigInt.toLocaleString 的 `Intl.LocalesArgument` 参数类型——旧为未解析名（copyNamespace 时序巧合：es2020.bigint 推断时 es2020.intl 尚未 merge），新经兄弟 ns 探测正确解析为 @es2020.intl 的 alias）
- [x] 22.8 **field WithName 签名直查化**（round8 回退的收尾）：诊断实证 copyNamespace 退役后字段违规**归零**（488 字段 0 违规）→ getFieldWithName/getStaticFieldWithName 改回 `getExistingId(new FieldSignature(name, classSigID, UnknownType, flag))` 直查；全局不变量"字段签名归属 == 挂载类"成立；不变量固化测试扩展 ns 范围（getNamespacedSiblingClasses 递归覆盖）
- [x] 22.9 遗留：AnnotationNamespaceType 类型表示不动（ns 类型归属仍首实体——与类场景同构）；cpp 侧 ns 探测不做；`Map(Math, Math)` 自复制类问题已随 copyNamespace 退役消失

## 23. SDK 全局查询迁 Registry（round11 批 1）— ✅ 已完成

**目标**：sdkGlobalMap 的查询方法从 Scene 移到 Registry（数据 round10 已迁，本轮补查询归属）；Scene 只保留基础查询接口做兼容。

- [x] 23.1 Registry 新增 4 个静态查询方法（"SDK global symbol queries" 区）：`getSdkGlobal`（单值视图，首实体）/ `getSdkGlobals`（多值）/ `getSdkGlobalMemberClasses`（成员提供者展开）/ `getNamespacedSiblingClasses`（ns 兄弟类）。
  **⚠️ 关键约束（ESM 加载边，新会话必读）**：Registry 处于依赖图最底层，方法内**禁止值 import ArkClass/ArkNamespace/Local 等模型类**——esbuild 对纯类型 import 做 **elision**（产物剥离该加载边），但值使用（`instanceof`）会使 import 真实化 → 新增 Registry→模型深链加载边 → 翻转 ESM 循环（`Registry ↔ core/base/Type ↔ cpp/ModelUtils → cpp/base/Type extends NumberType`）的进入方向 → **实测触发 "Class extends value undefined" 崩溃**。实体判别一律用 `isArkClassEntity`/`isArkNamespaceEntity` 结构判别（Registry 内已实现）；`import type` 也不行（esbuild 无法静态确认时保留为值 import）。基线 Registry 的 ArkClass/ArkMethod 等 import 是纯类型使用被 elision——这是加载序安全的根基，不可破坏。
- [x] 23.2 Scene 处置：`getSdkGlobal`/`getSdkGlobalMap`（原有方法）保留 **@deprecated** 委托 Registry（仅兼容性维护）；`getSdkGlobals`/`getSdkGlobalMemberClasses`/`getNamespacedSiblingClasses`（round9/10 新增，无兼容义务）**直接删除**
- [x] 23.3 生产代码全量切换：24 处调用（core ~19：IRInference ×5 / TypeInference ×5 / ModelUtils ×4 / ValueInference / Builtin / ArkIRTransformer / ArkValueTransformer / SdkUtils ×2 / callgraph ×2 / AbcInference / CfgBuilder；cpp 5：cpp IRInference ×4 / cpp ModelUtils / cpp TypeInference ×3 / cpp CfgBuilder）+ 2 builder 5 处 `scene.getSdkGlobalMap()` → `Registry.getInstance().sdkGlobalMap`（public 字段直取，SdkUtils 方法签名不变）+ `ModelUtils.findPropertyInNamespaces` 顺带消除 `getScene()` 间接依赖；测试全切 Registry（SdkGlobalProbing / InferArray / Sdk.test）
- [x] 23.4 **Constant.ts / ValueUtil.ts 模块级静态 new 改 lazy 单例**（防御性加固）：`BooleanConstant.TRUE/FALSE`、`NullConstant.INSTANCE`、`UndefinedConstant.INSTANCE`、`ValueUtil.EMPTY_STRING_CONSTANT`（getter 形式，访问点零感知）均为模块级 `new`（构造期调 `XxxType.getInstance()`）——ESM 循环链上的模块级 new 是固有定时炸弹，Type 未完成加载时即崩。lazy 化后不再依赖"加载序恰好安全"的脆弱前提（事故触发源 23.1 已根治，此为第二重保险）
- [x] 23.5 验证：tsc 零错误；专项 6 文件 220/220（SdkGlobalProbing/Sdk/InferArray/Type/ExportInfo/Promise）；全量 **1450/1451**（基线一致，唯一失败为已知 Windows EPERM symlink 环境问题）
- [x] 23.6 **修改范围控制**（用户要求）：prettier 顺带的无关重排已还原重应用，仅保留任务相关改动——RapidTypeAnalysis / PagBuilder / core CfgBuilder / cpp CfgBuilder / cpp ModelUtils / ValueInference 各 2 hunks（import + 调用点）；core ModelUtils 改动在暂存区（git add 状态，diff 前注意）。**教训（新会话注意）**：对未格式化过的文件跑 prettier 会大面积重排——收尾时先 `git diff --stat` 检查 hunks 数，超预期即还原（`git checkout -- <file>`）后手工重应用任务改动

## 24. 待办交接清单（新会话接续，按优先级）

### 24.1 立即（半步收尾，本轮已基本完成）
- [x] ValueInference.ts 收尾验证：import（:68）+ 调用点（:367 arrayInterface）已重应用，tsc 零错误 + 专项 3 文件 179/179 复验通过；改动在暂存区
- [x] 本交接文档落盘

### 24.2 【✅ round12 已完成】B2：method WithName 索引（最终形态：方案 Y 仅 Map 主存储）
**决策演进（round12 与用户多轮确认后定案，推翻 §24.2 原方案）**：
- 懒建取消：`checkAndUpdateMethod` 对每个构建的方法都调 `getMethodWithName`（构建期必然全量触发名字查询），懒建的节省为零
- 存储形态：**方案 Y——删 Int32Array 主存储，`Map<string, number[]>` 为唯一类级方法存储**（instance/static 各一：`methodNameIndex`/`staticMethodNameIndex`）。value = 每方法**选定 ID**（`getMethodSigID() ?? getDeclareSigIDs()?.[0]`，与 addMethod 同源）追加序；全槽 [impl+declare] 不进类存储（签名直查由 B1 的 canonicalizer 全槽注册承担）。`topMethodCount`/`getTopMethodCount` 一并删除（零消费）
- origin 语义退役：`methodMatchesName`（含 `NAME_PREFIX`/`NAME_DELIMITER` import）删除，名字查询精确匹配；顺带修复非重载 `add(foo)` 误删 `'%foo$bar'` 的历史 quirk；ModelRelationshipID.test :607 裸名断言改反向（origin 前缀不再命中）
- 保位语义：Map `set()` 对已存在键保持插入位置 → 非重载同名顶替键序不动（历史 insertAt 语义等价成立；注意 delete+re-set 会把键移到末尾——曾引入后修正为 set 覆盖）
- **嵌套方法裸名解析链补丁（origin 退役的连带修复，IRInference.ts）**：origin 匹配的真实消费面 = `inferStaticInvokeExprByMethodName` 的第一候选 `getStaticMethodWithName`（裸名 → origin 前缀命中组合名嵌套方法）。新增 `getNestedMethodInScopeChain`（沿 outerMethod 链构造 `%name$<scope>` 精确匹配，作用域感知，比旧 origin 前缀严格——不会跨作用域误命中）。两处测试期望更新（均为 quirk 修正）：ArkMethod.test :573 跨作用域误命中改作用域内正确值（与 :587 类型断言一致化）；FunctionExpectIR `BasicOuterMethod_Expect_IR` 两处 unknown 占位改真实嵌套签名
- Validator M4/M6 适配：`getTopMethodSigIDs()` 遍历 → `getMethodNameIndex()/getStaticMethodNameIndex()` Map 迭代（校验语义零变化）
- 专项测试：B2 describe 6 用例（CXX 同名共存/同签名原位替换/quirk 修复守护/static 镜像/键内部分删除/驱逐态过滤）+ 既有 6 用例 Map 断言改造
- 验证：tsc 零错误；专项 5 文件 190/190；全量 **1462/1463**（基线唯一失败为已知 Windows EPERM symlink）

### 24.3 A 类（验证收尾，改动已完成、验证欠账）
- [ ] A1 cppCore 回归：round5/9/10/11 的 C++ 侧改动累积四轮未实测（需 LLVM 环境：`npm run build:cpp && npm run test:cpp`；ExportInfo nestedCase 重点）
- [ ] A2 性能基准：round5-11 累积性能改动（签名直查/多值探测/field 直查化/Registry 迁移）收益未量化（`PERF_ROUNDS=3 npm run perf:arkts`，需大型工程输入；同时为 B2 内存阈值定优先级）
- [ ] A3 docs 更新：多值化/探测层/Registry 迁移/Scene deprecated 均未反映到 docs/

### 24.4 B 类（已调研未实施）
- [x] B1 getMethod(sig) fallback 收窄三步走【round12 完成第一步 + 第二步埋点】：
  - **第一步（全槽注册）✅**：`ArkClass.addMethod` 对非首选 declare 槽逐个注册 model（`registerDeclareSlotWithArbitration`），带单条仲裁——"有 body 的持有者不被无 body 后来者驱逐"（C++ decl/impl 分离反向 add 防御）；**不含**同类兄弟分支（addMethod 是终态注册点，合并赢家需接管同类旧槽——与构造期 `registerImplModelWithArbitration` 的保守仲裁分工）；选定槽维持无条件注册（终态赢家语义，既有行为）；构造期仲裁路径零改动（builder merge 读旧实体能力保持）；`Registry.removeMethod` 本就全槽撤销，对称性就此补齐
  - **第二步（命中计数埋点）✅**：`getMethodFallbackStats` 五分类计数器（fastPathNoModel/fastPathForeignOwner/fallbackNameMiss/fallbackMatched/fallbackUnmatched），module 级导出 `snapshot/resetGetMethodFallbackStats`（ArkClass.ts），测试与基准可读；fallback 注释更新为"缺口①已关闭，观察埋点残余"
  - **第三步（收窄）待 A2 基准数据**：判据见 tasks.md §24.2 决策讨论——fastPathNoModel 归零（全槽注册生效）且残余仅 C++ 跨类借用 → 收窄 fallback 为 CXX/unclear 归属专属；闭包重建签名（updateNestedMethodWithClosures 只 intern 不注册）若仍有合法命中需先补该路径注册
  - 专项测试 5 用例：declare[k>0] fast path 直查（埋点零活动断言）/非首选槽仲裁双方向/全槽撤销对称/埋点分类
- [ ] B3 CxxSceneUtils 死链删除（@deprecated 已标，puncture→processApiDefine 链全库零引用，~150 行）
- [ ] B4 forEachCreationParser 防环（ViewTreeBuilder ForEach/LazyForEach 回调直接递归不经 buildingTrees 防护，推导 miss 时可无限递归）
- [x] B5 Type 层 `isUnclear()` 多态化【round12 完成，"先对齐后修"第一步】：
  - **形态**：Type 基类新增三个方法——`isUnclear()`（public 入口，每次调用新建 visited）/ `isUnclearWithVisited(visited)`（完整语义递归，基类默认 false）/ `containsUnclearOrGeneric(visited)`（窄谓词探测：自身或嵌套含 UnclearReferenceType|GenericType，对齐历史 checkType 遍历）。public+@internal 规避 TS protected 跨实例限制
  - **覆盖面**：core/base/Type.ts 15 处（5 个 true 叶子 Unknown/Unclear/Null/Undefined/Generic；ClassType 专属判断 unclear 文件名∈UNKNOWN_FILE_NAMES 数组或 PROMISE 无泛型；Union/Intersection/Tuple=谓词探测 quirk 保持；Array=baseType 谓词探测 quirk 保持；Alias=**完整语义**递归——与 Union 的窄谓词语义并存是历史差异，测试固化）+ TypeExpr.ts 2 处（Keyof=opType 完整递归；TypeQuery=getType 完整递归+generateTypes 谓词探测，**core 语义为准**——cpp 侧历史上跳过 generateTypes，此为唯一有意行为收敛）+ cppFrontend/base/Type.ts 2 处（Pointer/Reference=baseType 完整递归，core/cpp 原本一致）
  - **TypeInference.isUnclearType 双份薄委托化**：core/cpp 均改为 `type?.isUnclear()` 一行，instanceof 链（~35 行×2）删除；`checkType` 保留（6 个外部调用者使用不同谓词，通用工具非 unclear 专属）；37 处裸 `instanceof UnclearReferenceType`（字面语义）不动
  - **防环**：两套递归共享 visited（历史 checkType 有防环、isUnclearType 的 Alias/Pointer 链无防环会栈溢出——本轮加防环是纯防御，无环场景行为零差异）
  - **ESM 安全**：谓词探测设计为多态方法（而非 Type.ts 集中 helper）正是为了规避 Type.ts→TypeExpr.ts 值 import 循环（TypeExpr extends Type，反向 import 的 instanceof 值使用会真实化加载边——§23.1 教训）
  - **固化测试**：TypeIsUnclear.test.ts 11 用例（叶子/ClassType PROMISE/Union quirk 含 Union[Array[Unknown]] 深层不计数/Array quirk/Alias 完整语义与 Union 相反/ClassType 泛型参与容器探测/TypeQuery generateTypes/Pointer 链/FunctionType 泛型/自引用防环/薄委托一致性）
  - **abstract 化强化（同轮追加，用户拍板）**：`isUnclearWithVisited` 与 `containsUnclearOrGeneric` 改 **abstract**——每个派生类编译期强制表态（新容器"忘记递归"的失败模式根除）；`isUnclear()` 入口保持具体（语义 final：入口若被子类覆盖会绕过 visited 共享破坏防环）；中转抽象类 PrimitiveType/AnnotationType 补 transit 实现吸收 7+2 个子类；盘点补齐 cpp 侧全部派生类（CxxChar/Thread/TypeInfo/Auto 叶子 false、Pointer/Reference 的 contains 显式 false 固化历史语义"谓词不深入指针"、CxxIntegral 系经 NumberType 继承）——**顺带修正现存 bug：CxxArrayType 是容器但从未覆盖 isUnclear（`CxxArray[Unclear]` 静默判 false），现对齐 core ArrayType 谓词语义**（行为变化仅影响 cpp 链，A1 测试环境欠账下记录在案）；库外 breaking 声明：@internal 双 abstract 方法对库外 `extends Type` 者要求补实现，可接受；固化测试扩至 13 用例（cpp 叶子/继承链/CxxArrayType 递归）
  - **contains 常量化（同轮追加，用户建议）**：叶子的 visited 登记是纯开销（false 叶子重复探测结果不变；true 谓词目标首次命中即短路 some，登记永远等不到第二次）——15 处 `predicateProbeOnLeaf` 调用全部改为直接常量返回（UnclearReference/Generic → `true`，其余叶子含 UnknownType → `false`——注意 Unknown 的 contains 是 false 而 isUnclear 是 true，两套语义差异保持），helper 删除，各类语义自文档化；零行为差异（118/118 专项 + 1475/1476 全量验证）
  - **验证**：tsc 零错误；专项 118/118（TypeIsUnclear 13 + Type.test 105）；全量 **1475/1476**（基线 1462/1463 + 13 新用例，唯一失败为已知 EPERM）
  - **待办（quirk 修复轮次，先有固化测试再改）**：① Union/Intersection/Tuple 子项语义统一为完整递归（Union[Unknown] 变 true）② Array baseType 谓词的 baseType 笔误形态确认 ③ 37 处裸 instanceof 中与 UnknownType 并排的组合判断渐进切换为 isUnclear()
  - **语义统一实验（round12 追加，已实证不可行并回退）**：尝试删除 containsUnclearOrGeneric、容器统一完整递归、Class/Function 泛型传播、Null/Undefined 顶层改 false（"值占位符不算 unclear"）——**四个方向全部撞上推导引擎的隐式依赖**，逐一实证：① Union 完整递归 → keyof-typeof 推导链退化（Type.test keyof ×2：opValue 停留 Local/AliasType，inferTypeQueryExpr:1076 的 `!isUnclearType(opValueType)` 提前返回依赖窄语义）② ClassType 泛型递归 → 同一 keyof 链回归（二分定位）③ Null/Undefined 顶层 false → `X|null` Nullable 类型推导退化（Type.test Special check：期望完整类型变 unknown）**且** Intl 构造签名推导退化（InferArray/SdkGlobalProbing ×4：`new Intl.NumberFormat()` 的 %AC1 construct-signature 匹配依赖 null/undefined=unclear 的分支行为）④ Array 完整递归 → Sdk 泛型约束快照漂移。**结论：窄谓词语义是推导引擎的既有契约，统一必须先逐个迁移消费方（独立工程，估计涉及 isUnclearType 的数十处调用点语义审计）**；本轮全部回退至实验前状态（全量 1475/1476 与基线一致），仅在基类 containsUnclearOrGeneric JSDoc 固化实验结论防止重蹈
  - **语义统一工程（round13 完成，上一条的"独立工程"落地）**：containsUnclearOrGeneric（基类 abstract + 26 处实现 + predicateProbeOnLeaf）**全库删除**，isUnclearWithVisited 成为唯一语义——完整递归（容器=成员 or）。逐差集项迁移而非全开兜底：
    - **Null/Undefined 顶层 false（占位语义显式化，4 个消费点）**：null/undefined 的"unclear"身份实为**值层占位信号**（builder 给 new 表达式 base/declare-var 无初值建 UndefinedType 占位），从类型层迁到消费点显式判断——① `LocalInference.preInfer`（占位 Local 触发推导，SDK ns declare-var Local 的类型解析依赖）② `ModelInference.updateValueType`（占位目标可被覆盖）③ `ModelInference.transferRight2Left` + ④ `ArkTsStmtInference.transferRight2Left`（**占位右值不回写**——Intl 链根：SDK `Intl.%dflt` 方法的 declare 建模范式下，UndefinedType 右值曾把 Local('NumberFormat') 的 builder 期注解类型 ClassType(%AC1) 倒退覆盖，D=true 时靠"unclear 不传播"保护）；X|null Nullable 修复由此成立
    - **容器完整递归（Union/Intersection/Tuple/Array/CxxArray/TypeQuery.generates）**：谓词的"值占位符不传播"已被上面显式化取代；`inferGenericType:668` 的约束重解析链顺带修复谓词漏检（`Args extends Object[]` 现在真正解析到 lib.es5——Sdk.test WrappedBuilder 快照更新，属解析改进）
    - **Class/Function 泛型不传播（语义修正版 C）**：ClassType/FunctionType 的判定=**自身引用可解析性**（unclear 文件/PROMISE 无泛型），泛型实参不参与——`Foo<T>`（形式泛参）/`Foo<Anything>` 的类引用都是明确的。C 的泛型递归版本（Foo<Unclear>=true）曾致 keyof ×2/SourceGenerics/concurrent-sdk PTA 失败（`Array<T>` 声明泛型被误判 unclear），二分实证后放弃——**顶层不看泛型是自洽的正确语义**，谓词的泛型深入能力随谓词退役
    - 验证：tsc 零错误；全量 **1475/1476**（基线一致，唯一失败为已知 EPERM）；TypeIsUnclear 13 用例全部统一语义版（占位迁移注释指向消费点）
    - **调试方法论沉淀**：Local.setType 条件 TRACE（抓 builder 期写点）→ SET-TYPE OVERWRITE 反向 TRACE（抓倒退覆盖者+调用栈）→ 对照实验（stash 切换语义观察同写点行为）——三步定位法适用于一切"类型被意外改写"类问题
  - **unclear 判定 ID 化（round13 追加）**：字符串比较链收敛为 SigID 数字比较——**主项** ClassType.isUnclearWithVisited：`UNKNOWN_FILE_NAMES.includes(getDeclaringFileSignature().getFileName())`（fileSig Map 查+字符串比较）→ `getDeclaringFileSigID() === 0` 字段直读（等价依据：FileSignature.DEFAULT 是 internDefaults 固化的 formal sigID 0，全库唯一 fileName='%unk' 来源；temp 兜底锚点与 formal 签名字段值同构；UNKNOWN_FILE_NAMES 常量删除）；**签名层 4 处**（Namespace/Class/Method/Field 的 isUnclear 尾链）`X.getDeclaringFileSignature().isDefault()`（fileSig get+getExistingId 两次 Map）→ `X.getDeclaringFileSigID() === 0`，MethodSignature 版三环链（classSig Map→fileSig Map→getExistingId Map）收敛为一次 Map+字段读；FieldSignature 构造期 tempsig 分叉（:508/:515）为主要受益热路径。**顺带拼写统一**：NamespaceSignature.getDeclaringFileSigId → getDeclaringFileSigID（与 ClassSignature/getFileSigID 主流大小写对齐，3 处调用方同步）；stale-SigID 降级路径的语义分歧已评估（旧代码降级返回 DEFAULT 判 unclear，新代码读老 ID 判 false——该场景本身带 error log，行为差异可接受）。验证：tsc 零错误；专项 188/188（ClassType 等价性断言全过）；全量 1475/1476（基线一致）。**教训**：PowerShell Set-Content 整文件重写会污染行尾（CRLF/LF 全文件翻转），子串替换必须用 edit 工具或 Node 脚本定点写

### 24.6 temp 弱注册表：生产数据诊断 + 二版重设计（round14）— ✅ 已完成
**背景**：用户生产项目实测（ArkField 73092 / temp field: live 7514 total 114142 dead 106628 / 堆快照 FieldSignature 187234 ≈ formal 73093 + temp total 114142），怀疑"temp sig 全部未释放"。
**诊断方法（可复用工具，新增）**：① `tests/samples/TempSpaceDiagnose.ts`（--expose-gc 驱动：受控弱引用实验 + build/infer/settle 三阶段 stats+快照 + 3a 未清扫/3b 清扫对照）② `script/analyze-heapsnapshot.js`（堆快照分析器：类实例计数 + Retainer 自动分组——formal list/IR 锚点/weak-edge 三分类，解决"用户不会手动看 Retainers"）。
**实证结论（四组决定性数据）**：
- 受控实验：丢弃 1000/1000 deref→undefined、锚定 100/100 存活——**dead ⟺ 物理回收**（弱槽零持有）
- 同 job vs 跨 job 边界：build 后 dead=0 → 边界+gc 后 dead=9——**KeepDuringJob 时序窗口**：生产快照 187234 ≈ formal+total 正是"同 job 拍快照，全部 temp 被 KeepDuringJob+IR 锚定钉活"的时序效应，**签名泄漏为零**（快照 Retainer 分析：formal-list 强持有 + IR 锚点，weak-only=0）
- **唯一真实问题（C）**：死 WeakRef 包装对象被 push-only refs 数组强引用，sweep 被调用前持续堆积（本机复现：未清扫快照 40 个 wrapper → 清扫后 34）
- Retainer 链"registry in ModelUtils"= Registry 单例经 ModelUtils.registry 静态缓存可达；DevTools 会显示弱引用边（不构成 retention）
**二版重设计（P1，全部落地）**：
- 存储：`Map<id, WeakRef>` + 单调 nextId（永不复用，hashCode 混入语义稳定）——死条目**真删除**，结构收敛到存活集，wrapper 堆积根治
- 自动销毁三层：FinalizationRegistry（GC/job 边界回调 evict，主路径）+ get(id) 同步兜底（deref 不到即删）+ register 摊还清扫（增量 ≥4096 时顺带 sweep，FR 不可用环境的退化主路径）
- 代数守卫：clear() 递增 generation 重建 FR，迟到回调按代过滤（防误删归零重用后的同号新 ID）
- 可观测接口：`registeredIds()`（结构视图，零 deref）/ `aliveIds()`（精确，先清扫）/ `onEvict` 钩子（销毁即通知）/ `getStats()` 扩展 structureSize+evictedCount（Registry/Scene 统计类型同步，TempSpaceStats 导出）
- **公开方法签名全部保留**（register/get/getExistingTempId/size/totalRegistered/getStats/clear），消费方零改动
- 端到端验证：重跑诊断驱动——新实现 3a 快照（settled 后零统计调用）中 refs[] 死 wrapper 堆积组**消失**（FR 在 job 边界已自动清理），weak-only 恒 0；弱表单测 16/16（含新 4 用例：结构视图/清空重置/真删除收敛/evict 钩子路径）；全量 **1479/1480**（基线+4，唯一失败已知 EPERM）
- 遗留：P1b（route 注册面源头减量：temp 注册量 ≈ 字段访问表达式路由量，114142 次注册的 per-use 语义审计）待独立轮次

### 24.7 Scene.getNamespaceBySignature 退役（round14 追加）— ✅ 已完成
private `getNamespaceBySignature`（树形导航：file→逐层 ns 下钻 + 归属校验）唯一消费者是 `Scene.getClass(:815)` 的 ns 分支——而 getClass 的 project 快路径本就是无归属校验的注册表值查，两路径语义本应同构。改为 `this.getNamespace(nsSig)`（全局值查 O(1)，签名→ID→model），删除树导航方法（嵌套 ns 深链递归消除）。归属校验差异仅防御 builder 不一致态（正常流程挂树与注册 model 成对发生），值查语义更符合消费方期望。`ArkFile/ArkNamespace.getNamespace` 保留（树结构自身方法，addNamespace 去重等内部使用）。getNamespace JSDoc 补语义说明（全局值查、无归属校验、与 getClass 快路径同构）。验证：tsc 零错误；全量 1479/1480（基线一致，唯一失败已知 EPERM）。

### 24.8 Scene.getClass 简化为无条件注册表值查（round14 追加）— ✅ 已完成
删除 isProject 守卫 + ns/file 树 fallback（:813-821），简化为与 getNamespace 同构的三行值查。**结构性依据**：树路径（ArkFile/ArkNamespace.getClass）的最后一公里与值查完全相同（getExistingId → classSigCanonicalizer.getModel），归属校验（declaringFileSigID 直比 + hasTopClassWithID）只能砍结果不能加结果；model 注册面已全覆盖（ArkClass.setSignature:402 为一切类构建主路径含 SDK 类，addArkClass 挂树补注册）——isProject 守卫是注册面补全（round5-11）前的历史遗迹。**唯一行为变化（宽松化）**：签名已注册 model 但未挂树的类（builder 不一致态/测试手工构造）从 null 变为返回实体，与 34 处消费方（IRInference/ModelUtils/PagBuilder/RTA/TypeInference/Expr/DummyCallCreator）"按签名找类"语义一致。验证：tsc 零错误；全量 1479/1480（基线一致，34 消费点零回归）；prettier 通过。

### 24.9 tempFile/tempNamespace 弱注册空间删除（round14 追加）— ✅ 已完成
**论断验证（全量核验后确认两个空间永远为空）**：tempFileSigCanonicalizer 全库零注册点；tempNamespaceSigCanonicalizer 唯一注册点为 FieldSignature 值构造器 ns-unclear 分支（ArkSignature:526）——核验全部 34+ 生产 new FieldSignature 调用点，对象传参全为 ClassSignature（ns 场景全走 SigID+true 重载，IRInference:899/:716 三元显式拦截），唯一激活是专测用例；佐证：getTempSpacesStats 从未纳入这两个空间。**改动**：① Registry 删两字段 + dispose 两行（注释固化删除依据）② FieldSignature 删 declaringNamespaceTempSigID 全套（字段/getter/temp 注册/hash 混入行/equals 比较项），ns-unclear 分支保留 SigID=-1 标记（isUnclear 语义不变，display 锚点已覆盖 getDeclaringSignature）③ 测试同步（accessible 用例断言两空间 undefined + 专测改写为"仅标记不注册"）。**hash 影响已评估**：hashCombineU32(h,0) 非恒等，删 :536 混入行改变全部 FieldSignature hashCode——全库 hash 断言均为相等性断言（两类构造同步变化仍成立），无固化数值、无跨版本持久化依赖，canonicalizer 分桶位移由 equals 兜底。验证：tsc 零错误；专项 137/137；全量 1479/1480（基线一致，hash 变化零回归）。

### 24.10 validateTempSpaces：temp 弱注册空间结构校验（round14 追加）— ✅ 已完成
CanonicalizerValidator 新增 temp 空间校验（挂 validateAll 尾部，随 validateCanonicalizers 开关），四规则全 error 级：
- **T1 非陈旧性**：存活条目值不得与 formal 重叠（temp 注册前提是 formal miss；后来同值进 formal = 陈旧残留）。语义修正记录：不做"全部 unclear"强断言——ClassType/FunctionType/Ref 等注册源条件是 formal miss，clear-未注册与泛型双视图 per-use 条目为设计内合法形态（用户已确认此修正）
- **T2 register 幂等守护**：槽位 ID ↔ 实例自带 symbol ID 双向一致（同实例双登记 = 结构破坏）。注：用户指正"temp 中不同实例占不同 ID 是设计本身"——原 T2 的值重复统计已移除（那是 P1b 分析数据非正确性问题），改为幂等守护
- **T3 锚一致性（反向）**：持有结构声明的 tempSigID 必须与锚定实例的弱表登记 ID 一致。**锚点判据一律用注册标记字段**（getTempSigID/getDeclaringClassTempSigID）——锚字段（tempMethodSignature 等）formal 命中路径也设置（display 载体），不能作判据（用户 pop 实例观察的教训）。持有面：ClassType/FunctionType/LexicalEnvType/EnumValueType/AbstractInvokeExpr/AbstractFieldRef + Field/MethodSignature 的 declaringClassTempSigID，走 registry models 枚举（classSigCanonicalizer.getModels 全类树含 SDK，无需 scene 参数，validateAll 签名零变化）
- **T4 持有可达性（正向，仅 settled 入口）**：存活条目必须有模型树/Builtin.stubCache 持有者。仅 `validateTempSpacesAfterSettle()`（异步：跨 job 边界 × gc × 3 后执行）——同步时点 KeepDuringJob 钉活已替换旧签名必误报（用户验证过的时序机制）；无 gc 环境 T4 为含 pending-dead 上界
- 顺带：Builtin.getStubCacheEntries() @internal 访问器（T4 常驻基线持有者，stub 是生产者不做锚校验）
- 验证：tsc 零错误；Validator 专项 45/45（新增 5 用例：干净/健康锚/T1 陈旧造假/T4 孤儿造假/T4 模型树锚定不报）+ Smoke 11/11（真实工程 T1-T3 零违规——现网结构健康的首次实证）；全量 **1484/1485**（基线+5，唯一失败已知 EPERM）
- 挂账更新：ViewTree 归属错位正向修复课题（AliasClassSignature display 承载机制改造 → 修复后 route() formal 命中清空 tempMethodSignature 锚）待独立轮次

### 24.11 C++ 测试本地环境配置（round15）— ✅ 已完成
**成果**：cppCore 从"永久 skip（C++ environment not ready）"变为**13/13 纳入全量**（testonce 1497/1498，唯一失败仍为已知 EPERM）。
**环境装配（预编译路线，无本地编译）**：npm registry 平台包 `@arkanalyzer/cxx-ast-parser-win32-x64`（用 1.0.90 与本地 packages/cxx-ast-parser 版本对齐——1.0.93 曾致 41 例行为差异失败，版本对齐后归零）→ lib（robocopy 全量 60 文件，含 flatGenerated 12 js）+ dumper（.node + 10 DLL，MinGW LLVM22 构建）拷入项目内 packages/cxx-ast-parser → lib 时间戳刷新（cxxAstRuntimeLibNeedsRebuild 以 mtime 判 stale，Copy/robocopy 保留源时间戳会误触发 tsc→flatc 网络依赖）→ `npm install ./packages/cxx-ast-parser --no-save` link 本地包为自愈稳态（ensureCxxAstRuntimeInstalled 走第二候选 require 成功即 return，extraneous 平台包被 npm 清除无碍）。**陷阱记录**：①npm install 会移除 --no-save 的 extraneous 平台包（每次重装后需重拷 lib/dumper 或直接依赖 linked 本地包）②Copy-Item -Recurse 目标已存在时产生嵌套目录，用 robocopy /E ③flatc 源码下载（github）本机不可达且 tar 解压长路径报 Invalid argument。
**OHOS SDK 依赖测试（Cfg/ExportInfo，本机 DevEco SDK 实测）**：Windows host LibTooling clang 与 OHOS arm64 libc++ 类型模型不兼容（typedef redefinition long/long long、aligned_alloc 缺失——CI Linux 同 ELF 才通过）→ **Windows 保持 skip**（OHOS_SDK_HOME 不设），CI Linux 为主场。测试辅助层适配改动（对 Linux CI 是修复）：①cppBuildUtils.resolveSdkPaths 新增 builtinIncludeDir 发现（Clang builtin resource dir——LibTooling 不自动加 resource dir，libc++ stddef.h __include_next 链断）+ compareVersions；②Cfg/ExportInfo includeDirs 接入；③Cfg 的 ensureCompileDb 限 linux（arm64 工具链 db 限 Linux host）。
**深挖记录（ExportInfo 最后 1 例 6/7 差异）**：缺 Circle import；probe 证实干净 Registry 单跑时 test.h exports 只有 3（Circle 缺）——**测试对 Registry 共享状态敏感**（前序用例污染后才 4/7），属 cppFrontend export 构建的顺序依赖问题，与 A1（round5/9/10/11 C++ 改动欠账）同挂待专项。
**工具落地**：CMake 3.31.6 → tools/cmake-3.31.6（gitignored tools/，Windows 当前不被需要——ensureCompileDb 已限 linux，留作备用）。prettier 对未格式化测试文件的无关重排已还原手工重应用（diff 60/0+2/2+17/9 纯任务改动）。

### 24.5 C/D 类（待专项分析/可关闭）
- [ ] C1 heritageClasses/extendedClasses 迁移 ID（16.1，时序复杂）；C2 Signature Usage Table（16.2，前置已就绪）；C3 getMethodsMap(refresh) 依赖消除（4.25）；C4 AnnotationNamespaceType ns 类型归属（低优，实测无差异）；C5 cpp 侧 ns 探测（低优，built-in Intl 不进 cpp 链）
- [ ] D：15.3/15.4（S8/S9）显式关闭（已标"不建议实施"）

---

## 25. 门禁失败修复交接（round16）— ✅ 已完成（round17 验证收尾）

**用户报告**：流水线门禁上 `tests/unit/cppCore/graph/Cfg.test.ts` / `ExportInfo.test.ts` 自 9.2 左右的提交起失败；典型断言：`CfgTest > Function Test > case5: Overload Test`，`expected Set { "x", "y" }`，`received Set {}`。

**根因（已实证，非推测）**：
1. 本地已能用 C++ 环境（§24.11）复现：`overloadSample.cpp` 构建后 `Vector` 类**整类丢失**，`getClasses()` 只剩 `%dflt`、`Person`、一个**空名类**；AST dump 证明 `Vector` 节点本身完好（`kind=42 CXXRecordDecl, name="Vector", tag=1, inner=10`）——丢失发生在模型构建期。
2. 手动调 `buildArkClassFromCxxClass(vectorNode, ...)` 抛 **`Maximum call stack size exceeded`**，栈为：
   `ArkMethod.getSignature → ArkMethod.getName → getSignature` 无限互递归。
3. 源头：`src/core/model/ArkMethod.ts` 的 `getSignature()` 兜底分支在方法**无签名**时打 error 日志，日志里调了 `this.getName()`；而 `getName()` 又调 `getSignature()` → 死循环。master（`d8222bb2`）没有这段兜底日志，属本分支重构引入的潜在雷（触发面：构建期某个 friend/operator 路径的方法在 setSignature 前被消费）。
4. 致命放大器：`applyArkFile` 的 try-catch 吞掉栈溢出异常，**该 TU 后续全部节点静默丢弃**（实测 `main`/`operator<<` 也一并消失），`testBlocksClass` 拿到 `arkClass=undefined` 后 `?.` 短路：heritage 恰好期望空集侥幸通过、blocks 断言静默跳过、只有 `fields` 暴露为 `Set {}` —— 与用户门禁失败样本逐字吻合。

**已实施修复**：`ArkMethod.getSignature()` 兜底日志不再调用 `this.getName()`，改为打印 `declaringClassSigID` / `methodSigID`（方法名不可得正是该分支前提）。

**round17 验证结果（全部通过）**：
1. **上一轮遗留的"scene.getFiles() 为空"真因**：非 SceneConfig 语言开关问题——`node_modules/@arkanalyzer/cxx-ast-parser` 被 npm install 清除（§24.11 陷阱①：--no-save link 包被移除），`CppFrontend.requireAstJsonDumper()` 捕获加载失败后 **logger.warn + return false 静默跳过全部 cpp 文件**（探针无日志故表现为零文件）。vitest 不受影响（vitest.config.ts alias 直指 `packages/cxx-ast-parser/lib/index.js`）。修复：`npm install ./packages/cxx-ast-parser --no-save` 重新 link（自愈稳态，§24.11 方案复用）。
2. **Vector 回归验证**（门禁等价断言，探针跑 overloadSample.cpp）：`Vector fields=["x","y"] PASS`、`heritage=[] PASS`；`Person fields=["age","name"] PASS`、`heritage=[] PASS`；类/方法完整（Vector 6 方法、%dflt 含 main/operator<</operator>>/operator""_km/operator""_c）——栈溢出根因修复生效，门禁 fields 断言预期恢复。
3. **`npx vitest run tests/unit/cppCore`：13/13 全绿**（Cfg/ExportInfo 按 §24.11 设计 skip，OHOS_SDK_HOME 未设）。
4. **全量 `npm run testonce`：1497/1498**——与基线完全一致（唯一失败为已知 Windows EPERM symlink，ModuleBuilder.test.ts）。
5. 临时探针脚本（OverloadProbe.cjs/.mjs、VectorDebug.mjs）验证后已删除。

**round17 附加排查记录（本机环境限制，非回归，勿重复归因）**：
- 本机探针下 Person 的类外定义方法（`constructor(string&,int)` 等）NO-CFG、出现"空名类"——根因是**本机 1.0.90 预编译 dumper 对顶层类外定义节点不输出 `mangledName`**（AST dump 实证 `mangledName=undefined`），`getDeclaringArkClassOfMethod` 以 `''` 找类 → 新建空名类。该路由代码与 master（`d8222bb2`）逐字一致，master 门禁曾全绿 ⇒ CI 源码构建的 dumper 输出 mangledName、路由正常。**本机缺 libc++ 头（无 MSYS2/OHOS SDK Windows 不兼容）+ dumper 版本差异是硬限制，类外定义 blocks 断言只能由 CI 门禁最终确认**。
- 探针复现此问题的对照链：干净资源（无 #include）方法体构建完整（SCC 全绿）+ 类内定义方法 CFG 正常（Vector 6 方法全有 body）→ NO-CFG 仅限"类外定义路由"单一链路，与栈溢出修复无关。

**门禁最终确认**：本机验证边界已到，需在 CI（Linux + OHOS_SDK_HOME + 源码构建 dumper）跑 Cfg case5 / ExportInfo 做最终判定；预期 fields={x,y} 恢复。若 CI 仍有"类型推导"族失败，按 §25 原清单第 3 条另行二分（那是另一族问题）。

## 26. temp 空间索引表重构 + display 归一化（round18 规划）— A1 实施中

**背景**：用户提出 temp sig 存储机制重设计（弃弱引用表改索引表）+ display 机制归一化。经多轮方案对比（D1 expr 注记 vs U+ alias 升格一等签名），用户拍板 **U+ 完整版**（含修正② toString/toMapKey 多态化）。

### 26.1 方案演进记录（防止后续会话重复论证）

- **弱引用表的问题**（用户判断，成立）：WeakRef/FR 对 V8 GC 有真实开销 + KeepDuringJob 时序窗口不确定性。
- **用户索引表提案**：slot 数组强引用 + 单调 nextId + 迁移点置空（retire）+ temp→formal 替换记录（`Map<tempID, formalID>`，"下一处直接用 formal ID"）。
- **关键实证**：`getTempSigID()` 生产代码**零消费**（仅 Validator 8 处）——temp ID 的生产消费面从未建成，纯投入零产出；"推导中间垃圾"（total 114142 / live 7514 的 93%）= 推导引擎 working set（临时 Value 构造时注册、用完即弃）+ R10 七处等值重复 new 的膨胀——构造时无法预知生命周期，"注册侧挡住"不可行，正解是源头减量（P1b）。
- **删锚的 display 障碍**：Expr/Ref/FieldSignature 的锚承担 AliasClassSignature display 载体职责（ViewTree 归属），删锚前必须先归一化 display。
- **方案对比定稿**：D1（display 降级 expr 注记）vs U+（alias 升格一等 formal 签名）。用户三个关键论点均实证成立：① 双 SigID 注册同一 model（round12 declare 全槽同构先例）；② alias 签名 declaring file 明确（common.d.ts）→ `IRInference.inferStaticInvokeExpr:139` fileSigID≠0 短路，推导引擎零处理，display 不会被推导替换破坏；③ toString/toMapKey 多态化（`this.getClassName()`）使 equals/toMapKey 两维度一致（都独立）。**U+ 的意外收获：alias 进 formal 后 canonical[aliasID] 即 alias 实例，display 自持——"formal 命中仍锚定传入实例"的特殊逻辑可删**（对 alias 路径 P===C 零行为差异）。
- **③ 中间垃圾处置**：B 轮全保留（审计表语义），A2 量化后再议 prune。
- **③ 处置的根因澄清**：未迁移 slot ≠ 泄漏指控——全保留下 slot 是完整注册审计表（任何 temp ID 可追溯取回，弱表给不了的能力）；内存代价（dead 对象钉活到 dispose，估 10-40MB@用户工程）是知情权衡。

### 26.2 A1：display 归一化（U+ 完整版）— ✅ 已完成（round18）

**目标形态**：
```
AliasClassSignature('Text', commonSig) 构造时：
  ① origin 查 formal 命中 → aliasName 重算 hash → 写入 formal（新 ClassSigID）
  ② 双注册 setModel(aliasClassSigID, CommonMethod 的 ArkClass model)
P1 产生点：new MethodSignature(aliasSig, popSub) → intern methodSig formal + 双注册 model
Expr.route：alias 签名 formal 命中 → 持 SigID；getMethodSignature() 返回 canonical[aliasID] = alias 实例（display 自持）
toString/toMapKey：this.className → this.getClassName()（多态）→ IR 文本 CommonMethod.pop() → Text.pop()
```

**改动清单**：
- [x] 26.2.1 `AliasClassSignature` 升格：aliasName 参与 hash（override `getHashCode`，与父类同构公式 className→aliasName）+ equals（alias↔alias 比较 aliasName+origin 维度；父类 equals 对 other 为 alias 返回 false 保对称性）+ 构造器 formal 直存 + classSig 双注册（origin model 缺失时跳过，M3 将暴露）
- [x] 26.2.2 `ClassSignature.toString/toMapKey`：`this.className` → `this.getClassName()`（多态；非 alias 实例行为不变）
- [x] 26.2.3 P1（`ArkValueTransformer.generateComponentPopStmts`）经新增导出函数 `internAliasMethodSignature(aliasSig, originSig)` 完成 methodSig formal 化 + 双注册；P2（core/cpp `IRInference.replaceMethodSignature`）同款接入。**实施中的重要修正——P2 条件收窄**：原 `endsWith('Interface')` 无条件包 alias，在普通 interface 解析场景（init 为 %unk stub，如 `TestInterface.callf`）会把显示退化为 `%unk.callf`（信息丢失）——收窄为 `className !== UNKNOWN_CLASS_NAME && endsWith('Interface')`：组件场景（init 类名=组件名，有信息量）保持 alias，普通场景直接返回 declared（期望零变化）
- [x] 26.2.4 Expr.route/锚字段/getMethodSignature 注释更新：display 职责已由 formal alias 自持；锚定保留原因改为"R11 可变字段视图（setReturnType 打传入实例防跨持有者污染）"，B 轮索引表统一退役。alias 路径下传入实例 === formal canonical，锚定与否零差异
- [x] 26.2.5 期望 IR 更新：`InferArray.test.ts` ArkUIExtestIR 13 处（GlobalFancy/FancyUse/AnimatablePropertyText 三个 build 的 create/pop）——`ColumnInterface.create→Column.create`、`CommonMethod.pop→Text.pop/Column.pop/Row.pop`。**实证发现：create 的 `ColumnInterface` 显示本来就是 P2 alias 折叠产物**（init=组件名直构，declared=ColumnInterface）——修正②后 create/pop 统一显示组件名（与 %unk fallback 族 `Row.create` 形态一致）；`CommonMethod.width` 等 instance 链是 canonical（非 alias）不变。`SignatureCanonicalizerRegistry.test.ts` alias 用例按新语义重写（身份分离/独立 intern/多态 toString/toMapKey/同名幂等/异名不等）
- [x] 26.2.6 Validator：M4/M4b 为 alias 条目加豁免（`classSigCanonicalizer.get(sig.getDeclaringClassSigID()) instanceof AliasClassSignature` 判定——model 由 origin 条目持有、双侧声明类必然不同，均为双注册设计内形态）
- [x] 26.2.7 验证：tsc 零错误；专项 173/173（InferArray 67 + Registry 68 + ViewTree 38）；**ViewTree/ViewTreeRecursion/SourceViewTree/Sdk/SdkGlobalProbing/TypeInference 全过——display 消费端（ViewTree 层级匹配等）零回归实证**；全量 **1497/1498**（基线一致，唯一失败已知 EPERM）

**格式化记录（§23.6 教训复用）**：改动的 8 文件中 5 个（ArkSignature/ArkValueTransformer/cpp IRInference/Expr/InferArray.test）**基线（HEAD）本就 prettier 不合规**——`--write` 会引入大面积无关重排（如 FieldSignature.equals 的 return 拆行），已还原为基线风格；core IRInference/CanonicalizerValidator/Registry.test 三个基线合规文件保留格式化结果（check 全过）。

**A1 收尾（round18 追加，用户梳理后补做）— ✅ 已完成**：
- **C4/C6/C7 alias 豁免（正确性缺陷修复）**：A1 只豁免了 method 空间 M4/M4b，漏了 class 空间对称项——`CanonicalizerValidator.validateClassSpace` 的 C4（model 回指 origin ID）、C6（同 ArkClass 多 ID 挂载）、C7a/b/c（父 ns/顶层 file 的 top-class 挂载链只含 origin ID）对 alias 条目全部误报。实施：`isAliasEntry = sig instanceof AliasClassSignature` 判定 + 三处豁免（origin 条目自身守护照常）；C5 无需豁免（alias hash 独立分桶 + equals false）。
- **Smoke 未暴露根因**：`pta/Container` 资源仅 `container.ts`（无 .ets 组件语法）——场景不产生 alias 条目，属覆盖缺口非"alias 无 model"。Validator 默认关闭故全量也未暴露；任何开启校验的真实 ets 组件工程即触发。
- **过时注释修正 ×3**：Validator C5 注释（"aliasName 不参与 equals、折叠到 origin"→ 独立条目守护语义）+ F7 注记（"折叠形态折到 origin SigID"→ 独立 alias ID 直查）+ ArkSignature :540/:813 display 缓存 JSDoc（"value interns to the origin"→ 独立 formal 条目，缓存职责重排：temp 锚定为主 + alias 精确实例保持为辅）。
- **守护用例 ×2**（CanonicalizerValidator.test 新 describe "alias entries Test (U+ display normalization)"）：class 空间（C4+C6+C7c 零违规 + origin 条目守护仍在）+ method 空间（M4/M4b/M7 零违规 + 值查直命中 origin model）。**反向验证通过**：临时移除 C4 豁免 → 用例立刻报红 → 恢复（证明非恒真断言）。
- 验证：tsc 零错误；Validator 专项 58/58（47+11，含新增 2）；全量 **1499/1500**（基线 1497/1498 + 新增 2，唯一失败已知 EPERM）；prettier——Validator src/test 合规（test 的 import 拆行为新增区域），ArkSignature 保持基线风格。

### 26.3 后续轮次（round18 修订路线图：A1 ✅ → R 轮 → B 轮 → A2 → C 轮可选）

**B 轮方案定稿要点（round18 多轮推演收敛，实施前必读）**：
- **`TempSignatureCanonicalizer` 三版**：`slots: (S|undefined)[]` 强引用 + 单调 nextId + `retireWithReplacement(id, formalId)`（迁移置空 + `replacements: Map<tempID, formalID>`）+ `getReplacement(id)`；删 WeakRef/FR/sweep/代数守卫/onEvit 全套（~100 行）；三数自洽 total = live + retired。**③ 全保留**（slot = 完整注册审计表，任何 temp ID 可追溯取回；dead 对象钉活到 dispose 是知情权衡——用户生产数据 total 114142/live 7514 的 93% 为推导 working set"用过即弃"，构造时无法预知，正解是 A2 源头减量而非注册侧拦截）
- **迁移点接入**：7 个 route/构造器 formal 命中分支，旧 tempSigID ≠ undefined 时 retire + 记录（R10 共享安全：B 持有者走三级查 fallback）
- **getter 三级查 + 惰性物化**：formal → slot 实例 → 替换记录 formal；首次 fallback 后写回 formal ID（"下一处直接用 formal ID"），tempSigID 保留作"曾 temp"审计痕迹（物化态 = formalID≥0 && tempSigID≠undefined，-1 恒为真未迁移）
- **删锚依赖解除分析（round18 实证修正）**：
  - **Ref 侧无障碍**：formal 路径③本就无锚（canonical 活视图 + 单向精度栅栏 type 写穿——与 Expr 的私有副本路线相反，MethodSignature.equals 含 returnType/FieldSignature.type 不参与身份的历史分野）；temp 路径①②锚 === slot 实例。**泛型双视图②由 R 轮先行退役（见下）**——R 轮后 Ref 与 Expr 路径结构同构，getter 共用模板
  - **Expr 侧 7 处 setReturnType 逐点分析**：3 处 temp 守卫等价（import 动态类型:154、iterator stub:609 有 `getClassSigID()===-1` 守卫）、2 处常量类型 per-method 传播正确（ITERATOR_CLASS_TYPE:465——泛型实参已由 setRealGenericTypes 承载）、2 处 model 侧无关（cpp:297 局部变量、inferSignatureReturnType 打 model 签名）。**批 3 前插桩实证**（mutate 触发时 formal/temp 路径分布统计）
- **Validator**：T1 收窄保留（retire 自动保证仍守护手工遗漏）、T2 不变、T3 重定义（持有者 tempSigID ∈ 非空slot ∪ 有替换记录的已置空 slot）、**T4 退役**（强 slot 下 GC 孤儿概念消失，C 轮引入 prune 时再建）——均已拍板
- **统计**：`TempSpaceStats` 重构（liveCount/totalRegistered/retiredCount/replacedCount，删 deadSlots/structureSize/evictedCount）；`settleTempSpaces` gc 轮次退役（同步即精确）——已拍板
- **B 轮批次**：1 索引表+单测 → 2 迁移点+Layer1 删锚（Type 四类 + F/M declaring temp 侧，F/M formal 侧 display 随 U+ formal 自持顺手删）→ 2.5 Expr 7 处 mutate 插桩实证 → 3 Expr/Ref 全删锚（mutate 传播期望变化逐个判定：per-method 合理传播 vs per-use 污染回退重建路线）→ 4 Validator/统计/日志 → 5 收尾。批间独立可验证，全量零变化为硬断言
- **风险**：批 3 formal 副本 → canonical 共享的 mutate 传播可能在期望 IR 暴露（returnType 进签名文本处）；回退粒度 = 单批

**R 轮：Ref 泛型表示迁移（realFieldTypes，B 轮前置）— ✅ 已完成（round19）**：
- **动机**：route ② 泛型双视图（`Box<T>.items` 使用点 `{items: string[]}` 整体注册 temp）退役——表示模式统一到 `Expr.realGenericTypes` 同构（定义点签名保持 formal 身份 + 实参表旁路字段 + getType() 动态组合 `replaceTypeWithReal(定义点type, 实参表)`）；temp 空间回归"未解析签名"单一语义，B 轮删锚面干净（Ref 与 Expr 路径同构化，getter 共用模板）、A2 量化零噪音。**用户拍板顺序：先 R 后 B**
- **前置调研结论（round19）**：①`getFieldSignature().getType()` 直调点仅 2 处且均为 `Ref.getType()` 自身（core:264/cpp:42）——type 消费全部经 `ref.getType()`，改一处全局生效，"最大审计面"实证为零；②route ② 唯一触发源 = 推导链两处泛型分支（`genFieldSignature`/`getFieldSignature` 的 `property.getType() instanceof GenericType` 走使用点构造）；③cpp `base/Ref.ts` 为独立简化实现（无 route/无双视图），cpp 侧零改动；④static 分支无实例化语义（静态访问不携带实例化上下文，realFieldTypes 恒 undefined → getType 原样）
- **改动（3 文件）**：
  - `core/base/Ref.ts`：`AbstractFieldRef` + `realFieldTypes?: Type[]` + get/set；route ② 分支退役（三分路由收敛为两分：temp ① / formal ③——泛型与非泛型统一持 formal ID）；`getType()` 动态组合（Expr.getType 同构守卫：type 含 Generic/Any 且有实参表才替换——实参表残留无害）；字段注释清理
  - `core/common/IRInference.ts`：`genFieldSignature` 与 `getFieldSignature`（两条链）泛型分支统一改定义点签名（`property.getSignature()`）+ 链内 `ref.setRealFieldTypes(baseType.getRealGenericTypes())`（与 inferFieldType 的 replaceTypeWithReal 同源提取；落地处 `ref.setFieldSignature` 同一 ref 传递 ✓）
  - `tests/unit/TempIDMechanism.test.ts`：2 个双视图守护用例按新语义重写（formal 身份 + realFieldTypes 组合 + canonical 不污染 + 两使用点独立 + 无实参原样）
- **行为语义记录**：泛型字段 ref 的 `getFieldSignature()` 现返回定义点 canonical（原 temp 实例化形态）；实例化类型经 `ref.getType()` 组合读取。生产链路（genFieldSignature/getFieldSignature）R 轮后不再构造使用点形态签名——防御性说明：若未来有代码再传使用点形态签名给 route，将走 ③栅栏（首个 clear 实例化写穿 canonical，per-field first-precise-wins——与精度栅栏既有语义一致，不再是 per-use 隔离）
- **验证**：tsc 零错误；专项 Type 105 + InferArray 67 + TypeInference 8 + TempIDMechanism 31 全绿；全量 **1499/1500**（与基线完全一致——fieldSig.toString 不含 type 的设计使期望 IR 零变化，实证通过）；prettier——IRInference/TempIDMechanism 合规，Ref.ts 格式化重排 52 行全在本轮改写的注释区域内（基线代码零触及，保留）

### 26.4 A2 与 C 轮（顺序随 B 轮）

- [x] A2：temp 注册源头治理——见 §29（round22 实施记录）
- [ ] C 轮（可选）：`pruneUnanchored()` 接口——A2 后残余（method 侧 + 真未解析存量）再评估

## 29. A2：temp 注册源头治理（round22）— ✅ 已完成（field 空间先行）

**问题重定义**（多轮推演收敛，覆盖 §24.6/§26.1 的 P1b 旧定义）：R10 表格的 refcount 语义已随弱表退役；真实目标 = **孤儿链**——推导引擎每次处理未解析访问点都 new 新签名 + register 新行，旧行无人注销（temp→temp 重路由不 retire，B 轮设计），field 空间 2.17M total 中 1.9M 为此（用户生产数据）。

**方案演进关键决策**（用户主导的多轮推演，实施前全部定稿）：
1. **就地演进取代 new**：持有者更新签名时不再 new 新实例登记新行，直接改共享实例 S（值变化时编号不变——孤儿链从机制上消除）；值不变的重复处理零操作
2. **"修改现有 sig"的 hash 契约**：setter 同步更新 hash（FieldSignature.hashCode 去 readonly）——身份字段 mutate 在 temp 阶段安全（formal 分桶不受影响）
3. **共享语义**（用户拍板）："同一实例一处改处处生效"是特性——共享来源限于引用传播（temp 空间是实例语义，值等价不同实例不共享，无"值等价撞"）；读取顺序：正式编号 → 替换记录 → 表格行（后来者跟随第一解析者）
4. **已毕业不降级**：持有者持 formal 编号时，新值 miss 正式表 → 保持现状丢弃新值（修复历史 route 的 formal→temp 降级）
5. **毕业联动**（用户补的缺口）：签名毕业（命中正式表）时，其改写前的 declaringClassTempSigID 联动 `retireWithReplacement`——declaring 行随符号毕业同步收敛（method/field 推导成功必然 declaring class 也成功），共享该 declaring stub 的持有者经替换记录自动跟随
6. **消灭更新路径的 N 分配**（用户要求，GC 压力）：推导链主路径（genFieldSignature）返回参数元组而非构造实例——非 static 更新走 `ref.updateFieldSignature(参数...)`（S.applyFields 直接赋值，零分配）；static 新建持有者保留 new（slot 需真实例）
7. **工厂缓存白名单**（方案 b，用户拍板）：`buildClassSignatureFromClassName` 内部判断——`isEtsSystemComponent(name) || 常量集{View, If, Repeat}` 才缓存（className → 共享实例）；实证参数域：14 处调用面 = 系统组件白名单（动态集合，SDK 构建期灌入）+ 3 常量，**项目自定义类名不进工厂**（isEtsSystemComponent 分流，自定义组件用 'View' 常量折叠名）；名单外每次 new 保持现状（new 表达式/C++ 类型名等 8 处调用零影响）

**实施（五批，每批全量回归）**：
- [x] 29.1 批 1 工厂缓存：ArkSignatureBuilder 白名单缓存 + `clearComponentStubCache`（Scene.dispose/clear 与 Registry.dispose 同点——缓存实例 temp symbol 属旧空间；Builtin stubCache 的 dispose-stable 先例另证不清亦可）+ 守护用例 3 个（白名单共享/名单外 new/清缓存重建）
- [x] 29.2 批 2 FieldSignature 就地原语：`copyFieldsFrom(other)`（实例抄写，hash 随 other 值拷贝）+ hashCode 去 readonly
- [x] 29.3 批 3 Ref 决策表：`route`（构造首路径——唯一登记）与 `updateRoute`（setFieldSignature 专用）拆分；决策表 = 未毕业（改写前存旧 declaring → S.copyFieldsFrom → 查 formal → 命中毕业三连+declaring 联动 / miss 保持零登记）+ 已毕业（查表命中换编号+栅栏 / miss 保持丢弃）+ 行已划（惰性物化→按已毕业处理 / stale 兜底走 route）
- [x] 29.4 批 4 参数式主链：FieldSignature `setDeclaringFields`/`recomputeHashCode`/`applyFields`（构造器逻辑抽取复用）；Ref.`updateFieldSignature`（参数式决策表，与 updateRoute 同构；低频兜底/probe 路径保留构造）；IRInference `genFieldSignature` 构造分支改返回参数元组、`updateRefSignature` 消费分流（static new / 非 static 参数式）。**getFieldSignature/inferFieldRef 链保留批 3 决策表**（N 分配留待 method 推广轮一并处理）
- [x] 29.5 批 5 验证：tsc 零错误；全量 **1503/1504**（基线 1500/1501 + 批 1 新增 3 用例；批 3 的设计内行为变化仅 1 处 identity 断言按新语义更新——Ref.test:113 就地演进返回 S 非传入实例，值相等）

**量化实证**（inferType 19 文件样本探针）：
```
post-build: field total=217（构建期每访问点一次）
post-infer: field total=220（推导期仅 +3——全部为新建持有者路径）
            class retired=26/replaced=26（毕业联动生效）
            method total=273（+14——Expr.route 现状路径，field 先行未覆盖）
```
**field 空间推导期注册从"每次处理一行"降到"仅新建持有者"——孤儿链消除实证**。用户大型应用复测预期：field total 从 217 万收敛到访问点量级。

**prettier**：5 个改动文件均为基线固有不合规（HEAD 版本即 warn），按 §23.6 教训保持基线风格。

**遗留（method/class 推广轮）**：Expr.route 决策表化（method 空间同款）+ getFieldSignature/inferFieldRef 参数式 + MethodSignature.applyFields（returnType 在 equals 中的特殊处理需评估）+ ClassType.setClassSignature 决策表化（class 空间）——机械复用本轮接口；C 轮 prune 待推广轮后按残余数据评估。

**A2 追加（round23）：graduateToFormal 快路径 + 双轨收敛路径定稿**：
- **背景**：`setFieldSignature` 的 11 处生产调用中 7 处为**定义点正式签名回写**（`property/arkField.getSignature()`——formal canonical，终点确定）——走决策表全套（就地演进→值查→栅栏）是纯浪费（演进后的 S 即被划行、值查只为拿已知 ID、栅栏比较自反实例恒无操作）。
- **接口**：`AbstractFieldRef.graduateToFormal(formalId)`（**传 ID 不传对象**——用户定稿：调用方从 model 直读 `arkField.getFieldSigID()`，接口内一次 key 直查兼任 stale 防御，省去对象版的 hash 分桶值查；**stale 校验必须在开头**——已毕业分支无条件赋值若放入 stale ID，后续 getFieldSignature 将 throw）。逻辑：未毕业（行还在）→ declaring 联动（归宿从 canonical 一次直查）+ 划行 + 记替换 + 换编号；行已划 → 仅换编号；已毕业 → 直接换编号（重复回写 = 无操作）。
- **调用链改造**：`genFieldSignature` 返回结构增 `formalId`（定义点分支 `property.getFieldSigID()` 直读）——`updateRefSignature` 非 static 定义点分支改 `ref.graduateToFormal(formalId)`（static 分支保留 new ArkStaticFieldRef——新建持有者）；core/cpp IRInference 的 assignAnonField 尾部 + core/cpp TypeInference 的 inferTypeInArkField 双分支——7 处全替换（`graduateToFormal(property/arkField.getFieldSigID())`）。
- **双轨终态**（调用面分类定稿）：`setFieldSignature` 剩余 4 处（core updateRefSignature 产物链 / cpp 同构 ×2 / CxxValueInference / AbcInference——推导产物实例，终点不确定）+ 2 处测试 → 推广轮参数式化后 **setFieldSignature/updateRoute/copyFieldsFrom 三件套整体退役**；届时入口收敛为 `graduateToFormal`（终点确定）+ `updateFieldSignature`（终点不确定）双通道。MethodSignature 同款 `graduateToFormal(methodSigID)` 随 Expr 决策表化落地。
- **验证**：tsc 零错误；专项 292/292；全量 **1503/1504**（零期望变化——快路径终态与决策表等价的全量实证）；量化探针 retired/replaced 读数与 A2 批 5 完全一致（field 7/7、class 26/26——路径成本优化的终态不变性双重实证）。

**A2 追加（round24）：setFieldSignature 全量消除 + 三件套删除（field 双轨终态达成）**：
- **判别联合**：core/cpp `getFieldSignature`/`generateNewFieldSignature` 返回 `{formalId, staticFlag, type}（定义点，终点确定）| 参数元组（新构造值，终点不确定）| null`——Union 试探（core）按 `resolution.type` 判 unclear（零实例读取）；cpp 泛型守卫（泛型字段不走定义点）为 R 轮遗留语义照搬不改
- **消费分流**（core/cpp `inferFieldRef` + `CxxValueInference`）：formal+static → new ArkStaticFieldRef(canonical)（新建持有者零登记）；formal+非 static → `graduateToFormal`；params+static → 构造 new（首路径）；params+非 static → `updateFieldSignature` 决策表。CxxValueInference 保持原语义顺序（先更新 value 再判 static）
- **定点替换**：AbcInference（`field.setSignature` 已 intern → `graduateToFormal(field.getFieldSigID())`）；测试 2 处按分类（TempID:337 快路径 / Ref.test:110 参数式，用例更名 setBase/updateFieldSignature）
- **三件套删除**：`setFieldSignature` + `updateRoute` + `copyFieldsFrom` 全库退役（用户拍板直接删除，不走 @deprecated——AliasClassSignature 先例；docs/api_docs 三处章节同步删除）。tsc 全库零残留为删除完成判据 ✓
- **终态**：field 持有者更新入口收敛为双通道——`graduateToFormal(formalId)`（终点确定）+ `updateFieldSignature(params)`（终点不确定，决策表）；新构造路径仅剩 static 新建持有者（保留 new）。生产代码零 setFieldSignature 调用
- **验证**：tsc 零错误；专项 305/305（含 cppCore 13/13——cpp 侧判别联合改造无回归）；全量 **1503/1504**（唯一失败已知 EPERM，零期望变化）；量化探针读数与 round23 完全一致（field 213/220/7/7、class 21/47/26/26——终态不变性三重实证）
- **prettier**：8 个改动文件均为基线固有不合规（HEAD 即 warn），保持基线风格（§23.6）
- **MethodSignature 侧待推广轮**：`setMethodSignature` 调用面更大（20+ 处），同款判别联合 + `MethodSignature.graduateToFormal(methodSigID)` 随 Expr 决策表化落地（§29 遗留清单更新）

**A2 追加（round25-26）：大型应用实测数据剖析 + 源头治理（callee 先造后拆消除）**：
- **三版实测对账**（用户提供大型应用）：class live **-98.4%**（198,281→3,185，工厂缓存+毕业联动双机制生效）；method 零变化（A2 field 先行未动）；field 仅 -2.7%——**round22"孤儿链是主体"的归因错误**（实测更新路径登记仅 5.8 万），真实主体是**构建期首路径登记 ~205 万**（builder 为每个属性访问表达式构造 fieldRef 时 route 登记）。**post-build 分阶段数据（round25 用户提供）铁证闭合**：field post-build total=2,077,267（构建期即达 98.5%）、两轮推导仅 +30,851
- **错误归因修正存档**：①round22 误判"失败重推孤儿链是 217 万主体"（实际 5.8 万）——探针数据当时已显示 post-build 217/推导期 +3 但未抓住；②round25 误判"单轮 times=1 下重推不发生"（用户实测 2 轮）——修正后结论不变（total 差值法锁定：A2 只消灭更新路径登记，实测 8.9 万→3.1 万）
- **field live 186 万的三层拆解**：~12.5 万真活（弱引用版 live 同款）+ ~24.8 万毕业（retired）+ **~173 万构建期死 ref 被 slot 钉活（≈260MB 驻留，全保留设计的实际代价，超预估一个数量级）**
- **死 ref 来源调研（explore agent 全面梳理，round26）**：core ets 链 17 个构造点逐一分析——**来源①（大头）：`X.m()` 方法调用 callee 的"先造后拆"**（propertyAccessExpressionToValue 先造 fieldRef 登记 → handleFieldRefInvoke 拆解取 base+方法名 → ref 丢弃从不进 IR；与 method total 214 万的量级交叉验证吻合，预期贡献 130-150 万）；来源②（100% 死）：`typeof this.field` 类型查询 4 个构造点（TypeQueryExpr 包 ref 挂类型上永不进 stmts）；来源③（100% 死）：闭包 GlobalRef.setRef 2 个构造点（usedGlobals 元数据）；**已排除**：构建期无内嵌推断（ValueInference 零调用实证）、无 optional chain 降频复制、无重复转换、VisibleValue 构造点是死代码
- **P1 实施（round26）：callee 专用路径**——`generateInvokeValueAndStmts` 入口预判 `ts.isPropertyAccessExpression(functionNameNode)` → `propertyAccessCalleeToInvoke`（直接从 base+方法名派生 invoke，跳过 ref 构造与登记）。等价性四要点逐字段照搬：base 物化双条件（moreThanOneAddress + 非 Local 两次 generateAssignStmtForValue）/ OBJECT 特判（含 locals.delete 副作用 + static 分支 positions 不含 basePositions）/ 派生三分支（base ClassType→对象重载；类型不明→**ClassSignature.DEFAULT 对象重载**而非 ID 重载——两重载 declaring 字段值/ID 不同，与原路径三级查回 DEFAULT 走 class 分支严格等价）/ positions 组装（instance 含 basePositions=原 calleePositions.slice(1)）。链式 `a.b.c()` 的 base（a.b ref）自然走物化进 IR（活 ref 照常登记，无误消除）；element-access callee（handleArrayRefInvoke）与 for-of 合成 ref 确认不动（用户拍板）
- **验证**：tsc 零错误；专项 283/283；全量 **1503/1504 零期望变化**（IR 产物等价的全量实证）；本机探针（inferType 19 文件）：**post-build field total 217 → 60（-72%）**——callee 浪费完整消除，与大型应用预期占比（130-150/207.7 万 ≈ 63-72%）精确吻合；method/class 探针读数不变（259/47，methodSig 派生登记照旧——method 侧治理属 method 推广轮）。prettier 基线保持（ArkValueTransformer 为基线固有不合规）
- **大型应用复测预期**：post-build field total 从 2,077,267 → **~60-75 万**（callee 占比 63-72%）；P2（TypeQuery/GlobalRef 零登记化，预期再消若干万）按复测残余定形态；prune 按用户定位降级为最后清理手段（不依赖）

**A2 追加（round27）：P1 复测确认 + 替换埋葬 + :954 封堵**：
- **P1 大型应用实测确认**：field total 2,108,118 → **724,645（-65.6%）**、live 1,860,101 → 476,628；**retired 248,017 两轮逐位恒等**（P1 纯构建期改动、推导零触碰的行为不变性铁证）；method/class 不变（符合设计）。剩余 live 47.6 万 = 真活 ~12.5 万 + 死 stub ~35.1 万（≈53MB），死 stub 四来源：推导期被替换 ref / TypeQuery 载体 / GlobalRef.setRef / :954 残留
- **批 1 替换埋葬（"谁替换谁埋葬"）**：`AbstractFieldRef.retireTemp()`（纯 retire，幂等，formal 路径 no-op）+ `retireTempTo(formalId)`（带归宿版）两原语；接入 core `inferFieldRef` 三分支（ArrayType→ArkArrayRef / static formal→canonical / static params→新构造）+ `updateRefSignature` 四分支（dynamic ArrayType / getter value / params static / formal static）+ cpp `inferFieldRef` 三分支（对齐 core）+ `CxxValueInference` params static 分支（cpp 的 formal 分支 graduateToFormal 前置本就正确——core 侧 static 分支缺 retire 是历史遗漏，本轮对称补齐）。共享安全：被替换旧 ref 均为 builder 逐访问 new 的实例（temp 实例语义独占行，无共享者）
- **批 2 :954/:965 封堵（callee 侧先造后拆口子清零）**：入口括号剥壳（`(obj.m)()` ≡ `obj.m()`，ECMAScript 括号不改变 this 绑定）→ P1 专用路径；新增 `elementAccessCalleeToInvoke`（`obj[key]()` 专用——base/argument 物化照搬 A4，按 base 类型分流：Array/String 复刻 handleArrayRefInvoke 含 **stmts.pop() quirk**（方法名用源码 argument 文本、物化 stmt 丢弃）；dynamic 复刻原 handleFieldRefInvoke instance 路径（方法名 = 物化后 argumentValue.toString() quirk 照搬、MethodSignature 走 ClassSignature.DEFAULT 对象重载））；**handleFieldRefInvoke + handleArrayRefInvoke 双删除**（全库无残余调用方）；残余 fieldRef callee（理论不可达）掉 handleDefaultInvoke 物化兜底（行为可见不静默——用户确认的设计）
- **验证**：tsc 零错误；专项 354/354；全量 **1503/1504 零期望变化**（批 1 纯 temp 表操作 + 批 2 IR 等价复刻的双重实证）；本机探针（inferType）：post-infer field **retired 7 → 36、live 60 → 27**（+29 替换埋葬生效，60 = 27 live + 33 retired 三数自洽——小样本几乎全部收敛）；prettier 基线保持（5 文件均基线固有不合规）
- **大型应用复测预期**：live 476,628 → 大幅下降（替换死亡 + 括号/动态 callee 残余的量级由复测定）；total 小幅下降（:954 残留消除）。残余（真活 + TypeQuery/GlobalRef）→ P2 按数据定形态

**A2 追加（round27 复测确认 + round28 method total 源头治理）**：
- **round27 复测确认**：field **live 476,628 → 124,397**（≈弱引用版真活基准 125,617 ✓ 治理达成）；retired +352,202 = 替换埋葬精确埋葬全部替换死亡（35.1 万预测 ✓）；total -29（:954 残余——该应用括号/动态 callee 极少）。field 空间内存回到弱引用版水平且全行可审计（prune 依赖归零，用户判断验证）
- **method 空间源头调研（explore agent）**：214 万 total 的浪费模式 = **同名反复造**（temp 实例语义 + 派生签名每次 new），非 field 的"先造后拆"。库内对照实证：pop（popMethodSignatureCache 实例缓存）每组件名 1 行 vs create 每语句 1 行。候选排序：A7 callee 主路径（~40-60%）/ A10 直接调用（~15-30%）/ A3+B1+B5 组件 create（~10-20%）/ toString（~5-10%）/ for-of iterator+next（~2-5%）；FunctionType/LexicalEnvType 构建链 9 处全部 formal 命中零登记（与 field 不同）；**super() 替换不 retire 的死行**（replaceSuper2Constructor :587 整体换 expr）
- **round28 实施（三批 + 三次实证回退——教训级记录）**：
  - **保留（实证安全）**：① **M1 组件族 per-key 缓存**（`ModelUtils.componentMethodSigCache` + `getOrCreateComponentSig`——AVT 组件 create / IRT Repeat create + If create/branch 四处接入；**挂 ModelUtils.dispose 生命周期**）② **M1 slice stub per-name 缓存**（`Builtin.getOrCreateArrayStubMethodSignature`——A14-A16 数组 spread/解构 rest，stub-only 语义保持）③ **M3 super() 替换埋葬**（`Expr.retireTemp()` 对齐 Ref 版；replaceSuper2Constructor 替换前显式 retire）
  - **回退①（M2a/M2b callee 缓存族）**：(ClassSignature, name) WeakMap + (Local, name) 方法体级缓存——6 处回归（InferArray overload/promise/enum/ArkUI-extend + TypeInference import/operand-position）实证**共享 stub 的 returnType 在推导链存在就地改写/消费，跨调用点污染**。探索报告"落地时应统一以 COW 防御"的风险预判命中；恢复前置条件：method stub mutate 面逐改写点插桩审计（候选：inferInvokeExpr 系失败路径）
  - **回退②（for-of iterator/next 常量化）**：InferArray for case 实证 item 类型精化退化为 unknown——推导链对该两签名的消费依赖 **per-循环独立实例**（"改写值与构造值相同"的静态判定不充分）
  - **回退③（Builtin.toString 单例）**：ArkIRTransformer literal/closure + JsonPrinter 三处 **String/Number.toString 互换**——stub 存在 B2.5 插桩（仅 12 处调用点）未覆盖的 mutate 面；**原注释 "avoids the shared mutable singleton" 是实证过的设计智慧，静态 grep 不该推翻**
  - **stale ID 修复（保留项的关键补丁）**：MethodSignature 实例内部 `declaringClassTempSigID` 构造时固化——**跨 Registry（dispose 重建）复用缓存实例时该字段 stale** → 声明类三级查落空 → 降级 DEFAULT（实测 Row.create() → %unk.create()）。修复：componentMethodSigCache + arrayStubMethodSignatures 挂 ModelUtils.dispose（与 popMethodSignatureCache 同生命周期）。**"存实例 dispose 自愈"论证只覆盖顶层 register，不覆盖实例内部固化字段——缓存 MethodSignature 实例必须挂构建结束清理链**
- **验证**：tsc 零错误；全量 **1503/1504 零期望变化**（三次回退后的最终形态）；探针（inferType 19 文件）：method post-build total 259 → 249（小样本组件语句少，M1 收益在大型 UI 应用的组件密度下显现——估算 10-20% total 降幅）；prettier 基线保持（5 文件基线固有不合规）
- **method 大型应用实测定案（r1 形态，用户提供）**：total 2,149,038 → 1,953,956（**-195,082 / -9.08%**，全部 M1 组件族+slice 贡献）；live 234,510 → 168,720（**-28.05%**——组件 stub 行未解析率约为全局均值的 3 倍，M1 消除行的 1/3 原为 live，live 是 slot 强持有的内存直接指标）；retired 1,914,528 → 1,785,236（-129,292，M1 消除行中本会推导成功 retire 的部分）。三数两侧精确自洽（Δlive+Δretired = Δtotal 零残差）。与预估 -10~20% 对比略低于下限——修正归因：该应用组件语句密度低于假设 + 部分 create 签名 formal 命中（M1 仅覆盖 formal miss 路径）。super 死行清零（M3）体现在 live 下降中。r3 形态复测预期 total ≈ 持平（批 3 增强不减 total）。**M2 族（callee 主路径 ~40-60% 潜力）挂起且 r3 定稿关闭**（恢复前置不可满足，见下）

**round28-r2/r3（三次归因演进全记录——教训级存档，防第四轮重蹈）**：
- **r2 重新实现**：以"stale declaringClassTempSigID"新归因推翻首轮三次回退，恢复 toString 单例 + iterator/next 常量化 + M2a（ModelUtils.methodSigByClassSig）+ M2b（AVT.methodSigByBaseLocal），全部挂 dispose 清理链。**实测 8 用例失败（首轮回退面 100% 复现）**：ArkIRTransformer literal/closure + JsonPrinter（toString 互换）/ TypeInference operand-position + InferArray enum（instance→static 形态未升级）/ InferArray overload/promise（重载选择错乱）/ InferArray for case（item=unknown）——**单跑复现排除跨 Registry stale，r2 归因错误**
- **r3 实证定案（真正根因）**：**共享 temp 行的归宿被第一解析者垄断**——route() 实例幂等注册使 N 个 expr 汇聚同一 temp 行；第一解析者 setMethodSignature 触发 `retireWithReplacement(T, F)` 全局定向；跟随者 `getMethodSignature()` 三级查物化跟随 F。三个失败亚型：①归宿跟随（String/Number.toString 互换、createAVPlayer 重载跟随、SensorId 枚举字面量跟随）②升级短路（签名正确但 instance→static 形态未变——升级依赖推导期 expr 替换）③守卫短路（**for case 断点**：ValueInference.preInfer 的 `needInfer(物化签名文件)=false && isUnclearType(IterableIterator<T>)=false` → 整个推导跳过 → realGenericTypes 无人设置 → item=unknown；"待解析"是 per-expr 语义，共享行的"已解析"状态会传染给所有共享者）。**COW/挂 dispose 均无法防御（不是 mutate、不是 stale，是 temp 表替换记录语义）**
- **r3 实施（四批）**：批 1 回退 toString 单例 + M2a/M2b（注释固化"键丢身份且归宿 per-use 时共享在语义上就是错的"——method 签名身份 = declaringClass + name + **参数列表 + 返回类型**，`(base, name)` 键不足）；批 2 回退 iterator/next 常量化（r2 曾引入 import 剥离 quirk：esbuild 不查类型 → `new undefined()` 运行时抛错 → applyArkFile try-catch 吞掉 → 方法体静默丢失，§25 同款模式——回退时必须核对 import）；批 3 isStatic 形态升级防御增强（`InstanceInvokeExprInference.infer`：result===value 且 `sig.getMethodSubSignature().isStatic()` 且 base 非 super → 补 `new ArkStaticInvokeExpr`——主推导链是 ValueInference 新链非旧链 resolveExprsInStmt，增强点按实证落位）；批 4 验证收尾
- **r3 验证**：tsc 零错误；8 失败用例全绿；全量 **1503/1504 零期望变化**（含批 3 增强——无误升级暴露）；探针（inferType 样本）：method post-build total **244**（M1 终态 249 同量级，r3 回退零损失——M2 族/toString/iterator 在小样本本就无收益，大型应用的真实差异以 M1 组件族为主）；prettier——3 文件本轮引入不合规已 write 修复（HEAD/stage 均 clean），ModelUtils/ValueInference/Expr 保持基线固有风格
- **method stub 单实例化的最终边界（r3 定稿）**：**白名单族保留**（pop/componentMethodSigCache/slice——键含完整身份、归宿与 per-use 无关、推导全走 setMethodSignature 整体替换）；**普通 method 一律每次 new**（toString/iterator/next/callee 派生——归宿取决于各 expr 自己的 base 类型/实参）。M2 族恢复的实质前置 = 签名身份参数敏感化 + per-expr 待解析状态隔离，当前语义下不可满足，关闭
- **r3 遗留**：批 3 增强不 retire 被替换 instance expr 的 temp 行（替换埋葬未覆盖 ValueInference 新链——与 round27 Ref 侧对称的 Expr 侧缺口，量级待大型应用复测；r1 实测 live 残余 168,720 中含本缺口贡献——补 retire 后的降幅即批 3 增强触发频率的直接量度，建议下轮用 `getTempSpacesStats` 前后对照量化）；A2 性能基准（12.4）与 docs 更新（12.7）仍欠

**round29：`this.foo()` callee 直连 implement sig（用户提案，白名单族扩充）— ✅ 已完成**：
- **提案本质**：this 只表示自身所在的 class（类型编译期确定 = 声明类，AVT 构造器 :124 `new ClassType(declaringClass.getSignature())`）→ callee 可用本类 foo 的 **impl sig 归一化表示**，不需要每出现一次就 new 一个 stub。与 r2 失败的 M2a 本质差异：**直连 formal 签名 = 零 temp 注册**——不进归宿垄断射程（r3 三亚型全免疫），比 M1 per-key 缓存（1 行/符号）更彻底（**0 行/方法**）。
- **归一化条件**（AVT `propertyAccessCalleeToInvoke`，全部满足才直连否则降级原路径每次 new）：① base 为 Local + ClassType；② **类型同一**：`baseType.getClassSigID() === declaringClass.getClassSigID()`（super/跨类/unclear -1 自动比对不上降级）；③ **本类名字索引唯一命中** `getMethodsWithName().length === 1`（索引只含 instance 方法——**static 天然查不到**，`this.staticFoo()` 自动降级原路径走推导升级，static 分流自然消解；同名多个如 getter/setter 对也降级）；④ **非重载**（declare ≤ 1——重载选择依赖实参匹配，SensorId 教训）；⑤ impl sig 已设置（`getImplementationSignature() !== undefined`，构建时序防御——类构建完成后统一 buildBody，签名先行，判空兜底手工/测试路径）。
- **安全性论证**（r3 边界的 this 例外，注释固化在代码）：① 零 temp → 无归宿垄断；② impl sig 身份完整（declaringClass + 参数 + 返回类型全 formal）；③ **preInfer 短路 = 期望行为**（签名即终态无事可推；args 推导由 `StmtInference.inferValue:429` 的 uses 先序递归兜底，不依赖 invoke 自身的 infer）；④ 泛型方法 returnType 含 GenericType → isUnclear=true → preInfer 继续 → setMethodSignature(impl 同实例) route 同 ID 幂等 + realGenericTypes 正常。**文本等价铁证**：无重载 instance 方法基线推导终点 = `matchMethodSignature` fallback 链的 `this.getSignature()`（impl sig）——归一化文本 = 基线推导后文本。
- **%dflt 分流定案（用户拍板"去掉分流"）**：`isDefaultArkClass` 升级分支（9e329c2c 引入，`XX.f()` namespace 调用顶层函数的场景驱动）理论上也覆盖 %dflt 上下文的 this 调用——但**零测试样本**（13 处 `this.xxx()` 全在类内）且 ESM 顶层 this 语义非法，接受理论性偏差（instanceinvoke + impl sig 亦是可解释 IR）。考古记录：InferArray:931 的 `%dflt.fancy()` 保持 instanceinvoke 非反例（@Styles/@Extend 装饰链式函数走 AVT 特殊建模，不进 invokeMatchedMethod）。
- **父类方法定案（用户拍板"只根据 this 的类型"）**：`this.parentMethod()` 不查父类链（getAllHeritageClasses 时序复杂，C1 同款警告）——走原路径照常推导（父类方法签名在父类构建时已 formal 创建），行为不变。
- **验证**：tsc 零错误；专项 233/233（InferArray/TypeInference/ArkIRTransformer/Type/JsonPrinter）；全量 **1503/1504 零期望变化**（硬断言通过——归一化 IR 文本与基线完全一致的实证）；探针（inferType 样本）：method post-build total 243（r3 基线 244，小样本 this 调用密度极低）——**收益主战场在 UI 应用**（this 调用是 ArkTS 组件方法的主力形态，callee 主路径 A7 的重要构成，保守估 total 再降 5-15%）；prettier write 合规。
- **范围界定**：只做 core 侧显式 `this.foo()` 形态（propertyAccessCalleeToInvoke）；省略 this 的裸 `foo()` 调用与 cpp 侧（mangledName 路由独立）不在本轮。
- **白名单族扩充后全表**：pop / componentMethodSigCache / slice / **this-implementsig**（本条）；A10 裸名直接调用等其余 callee 形态仍按 r3 边界关闭。

**round30 回退记录（用户实测定案）**：formal 泛化（obj.m() 直连）实施后用户大应用实测仅 -51,002（-2.61%），**builder 阶段显式类型注解其实只知道 className、无 ClassSigID**（类型 sigID 解析依赖推导期）——`getClassSigID() >= 0` 守卫在构建期几乎全部落空，归一化射程远小于静态推演。代码已回退（ArkValueTransformer.ts 回到 HEAD），round29/30 的 callee 直连路线整体证伪关闭：**callee 构建期归一化需要 sigID 级类型信息，而它只在推导期可用——此为构建/推导两阶段的本质时序边界**。

**round31：buildSceneFromFiles 依赖解析缓存（buildSceneFromFiles-perf-optimization.md 方案落地）— ✅ 已完成**：
- **方案**（外部文档自包含）：`fromResolutionCache`（主缓存——from → 直接解析路径列表，含负缓存）+ `fromResolutionStack`（嵌套隔离的栈式收集）+ `resolvedOhPkgCache`（inner oh-package 读盘兜底）。核心原则：**只缓存纯函数结果（from → paths），绝不缓存"要不要构建"的决策**——命中后必须逐个经 `getDependencyFilesDeeply` 三重防重入重新仲裁（防 disposeModule 等状态变化下静默丢构建）。
- **现状修正（文档写作后代码迁移，3 处）**：① 目标方法全部已从 Scene.ts 迁至 **SceneBuilder.ts**（P2 frontend 化），逻辑逐字一致——改动范围从"仅 Scene.ts"变为"仅 SceneBuilder.ts"；② **架构红利**：SceneBuilder 是一次性构建上下文（activeBuilder 构建结束释放、工作态随实例 GC）——缓存字段放构建期工作态区后**天然 per-build 生命周期，Scene.clear() 零改动**（文档 3.4 的清理钩子取消，无泄漏面）；③ 文档引用的 `instanceCountUtils.ts`/`collectSceneInstanceSets` 已不存在——深度等价验证以自写探针替代。
- **实施（4 处，均在 SceneBuilder.ts）**：字段声明（unhandledFilePaths 后）；`addFileNode2DependencyGrap` 栈顶收集（汇点语义 = 记录 + getDependencyFilesDeeply）；`parseFrom` 缓存包装（key 对齐 getOriginPath：相对形式 `dirname(声明文件) + '\x00' + from`、判定正则 `/^\.{1,2}\//`；三分支逐字保留；try/finally 保证栈平衡且异常不写缓存）；`getDependenciesMapping` inner oh-package 缓存（独立 Map，**不写回 ohPkgContentMap**——for...of 遍历中插入 key 改变迭代行为）。
- **验证**：tsc 零错误；功能等价 BuildSceneByFiles + ImportCircularDependency 7/7；全量 **1503/1504 零变化**；**深度等价**（临时探针三项目 MyApplication4Files/namespace/closure：FileSignature toMapKey 集合 + 模型树实例计数 + 方法级 IR dump 全文**逐字节一致**——stash 前后对照唯一差异为测试时间戳）；prettier write 合规（重排全在本轮改动区）。
- **性能实测（MyApplication4Files 小项目）**：BEFORE/AFTER 各 3 轮——total 46/47ms、locate 30/30ms、existsSync 119/119 **完全一致**（零回归）；**机制实证**：临时命中计数插桩显示 3 次 CACHE-HIT（@kit.AbilityKit/@kit.PerformanceAnalysisKit/@kit.ArkUI，均负缓存 0 路径）——缓存正常工作，但该小项目唯一重复 from 恰是模块名分支（解析 miss 零磁盘调用），existsSync 不降是项目特性非机制失效。**大项目收益待用户复测**（大项目 `@ohos/hilog` 等模块名命中 ohPkg 后触发 existsSync+readdir 全链，重复 from 直接砍掉——文档预期定位次数从 Σ 每文件 import 数降为唯一 (上下文, from) 对数，大项目公共 import 重复度 80-95%）。库内最大测试项目仅 48 文件（同量级）无验证价值。
- **探针工具**：DeepEquivProbe.test.ts（深度等价）验证后已删；性能探针（monkey-patch existsSync + buildArkFileFromFile 分段计时）在会话 temp，未入库。

**round32：CPP UT 双失败修复（期望值判定 → 代码修复 + 测试隔离）— ✅ 已完成（CI 复跑待确认）**：
- **判定结论**：两个期望都合理、实际值都是缺陷——**修代码不改测试**。① ExportInfo crossFileCase case5：期望 `@crossFileCase/include/myHeader.h: Circle`（唯一定义处），实际 `@funcImplementInCpp/include/test.h: Circle` = **同文件内跨 describe 跨项目污染**（ExportInfo 的 buildScene 无 dispose，funcImplementInCpp 先构建，round24.11 挂账顺序依赖问题的显性化）；② Cfg structBinding case3：期望 `Person$%dflt.StructUsage`（cpp 局部类规范），实际 `%unk: Person` = **局部类归属丢失**（独立根因——Cfg 的 buildScene 已有 dispose，与 Registry 污染无关）。
- **Person 根因实证（本机最小复现，零 include 资源绕过 SDK 依赖）**：局部类正确注册（`Person$%dflt.UseLocalStruct` 挂 file），但 `findClassByShortName` 的 enclosing-name 链把 `%dflt` 当 `%` 前缀合成名排除 → 顶层函数上下文（ctxClass=%dflt）链恒空 → 方法局部类候选 `short$%dflt.method` 无法构造 → `buildTypeFromStr` 兜底 %unk stub。
- **修复（2 处 cpp 代码 + 1 处测试隔离）**：① `cpp ModelUtils.findClassByShortName`：enclosing 链放行 `%dflt`（DEFAULT_ARK_CLASS_NAME——file 级函数的合法局部类容器；其余 % 前缀合成名仍排除，%dflt 无 $ 分隔符下钻自然终止）；② `cpp ArkValueTransformer` new 表达式 :2174 **stub 采纳守卫**：`refType.isUnclear()` 时不再短路采纳（inferUnclearRefName 的 %unk 兜底会经此泄漏进 IR——CI new expr 形态路径），降级 else 域内解析链（域内也 miss 时兜底构造与原 stub 等价，行为仅升级不回归）；③ `ExportInfo.test.ts` buildScene 开头补 `SignatureCanonicalizerRegistry.dispose()`（对齐 Cfg.test.ts 同款）——**测试隔离消除跨项目共存**。:2169 不传 method（core 链的 localClassSigIDs 登记是 ets 专属，cpp 侧无登记，传了无用——cpp 正路是自己的 findClassByShortName）。
- **守护用例**：`LocalClassResolution.test.ts` + 资源 `cfg/localClassMini/`（零 include，全平台可跑不依赖 OHOS SDK——CI 上独立验证 Person 修复）；断言局部类按挂载名注册 + person 类型归属 `Person$%dflt.UseLocalStruct`（修复前 %unk stub）。
- **验证**：tsc 零错误；cppCore **14/14**（13 + 新守护用例）；全量 **1504/1505**（基线 1503/1504 + 1，唯一失败已知 EPERM）——**零回归**。prettier：4 个改动文件均基线固有不合规（保持基线风格），新测试文件合规。
- **⚠️ CI 复跑风险预告（用户推送后观察）**：① funcImplementInCpp `:155 file2?.getExportInfos().length === 4`——隔离后干净 Registry 下可能变 **3**（Circle export 缺失，round24.11 记录的本机 probe 实证；CI Linux 未知）——若挂需再拍板（期望固化 3 + 注释指向挂账 / 标 skip / 升级修 export 构建顺序 bug）；② crossFileCase case5 预期恢复绿（污染消除）；③ structBinding case3 预期恢复绿（Person 修复）。
- **挂账清单更新（独立轮次）**：① **Circle 无项目维度查询通路**（测试隔离只消除"共存"显形条件，通路本身未定位修复——若生产出现多模块/增量构建共享 Registry 场景仍可触发）；② **export 构建顺序 bug**（干净 Registry 下 test.h exports 缺 Circle——round24.11 挂账同项）。

**round32b：MapUsage `IterableIterator.*` → `Boolean.*` 修复（被遮蔽的 round23 回归）— ✅ 已完成（CI 复跑待确认）**：
- **现象**：round32 修复 Person 后 CI 暴露新失败（Cfg structBinding MapUsage：期望 `%7 = %5.<@%unk/%unk: IterableIterator.*>`，实际 `%5.<@built-in/lib.es5.d.ts: Boolean.*>`）。**遮蔽链实锤**：case3 内 testBlocks 顺序断言，StructUsage（Person）失败在先 → MapUsage 从未被断言——**非 round32 回归，是被遮蔽的 round23 存量回归**（loopSample/lazyImportCase3 的 deref 期望完全同构，应同样受累）。
- **根因（本机最小复现 + 4 层 TRACE 定位，三因子叠加）**：① **builder quirk**：range-for 降级把 begin/end 字段签名类型写死 `BooleanType`（cpp ArkIRTransformer:528/:537——begin/end 语义是迭代器端点而非 bool）；② **类型污染**：`%N = X.<begin>` 的 typeSpread（transferRight2Left）把迭代器 Local 类型从 IterableIterator stub 覆盖成 boolean（BooleanType 非 unclear 可传播）；③ **wrapper 提升**：deref 推导时 baseType=boolean → core `inferInstanceMember:775` 的 PrimitiveType→wrapper 链（`'boolean'` 首字母大写 → `Registry.getSdkGlobal('Boolean')` → lib.es5 Boolean 类）→ declaring 被改写为 Boolean。**round23 遮蔽机制**：该查询迁移 Registry 前（`scene.getSdkGlobal`）被 Cfg 测试的 prototype mock 拦截（返回 null → 提升不发生），迁移后 mock 失效 → Boolean 可达——round23 起 CI 上这些用例的 deref 已变 wrapper 形态，被更早的断言失败层层遮蔽至今。
- **取证方法（可复用）**：零 include 自定义容器资源（begin/end/iterator 形态同构）+ monkey-patch `Local.prototype.setType`（抓污染写点+栈）→ `FieldSignature.setDeclaringFields` TRACE（抓 declaring 改写）→ `TempSignatureCanonicalizer.retireWithReplacement` TRACE（排除 temp 迁移论）→ cpp `generateNewFieldSignature` TRACE 零调用（**发现分发缺口**）——四层定位法。
- **修复（因子① 本源，1 文件 2 处）**：begin/end 字段类型 `BooleanType` → `UnknownType`（循环条件的 boolean 语义由 handleForRangeIterEnd 对 doneFlag 的显式 setType:556 承担，不受影响；UnknownType 被 transferRight2Left 的 unclear guard 拦截 → 迭代器保持 stub 形态 → deref 无 primitive 提升无误伤）。
- **修复验证（unresolved 场景推演）**：CI 场景（std::map stub）begin 解析 miss → typeSpread 被拦 → 迭代器保持 IterableIterator stub → deref baseType=stub（非 primitive）→ 无 wrapper 提升 → **`IterableIterator.*` 恢复**（structBinding/loop/lazyImport 全部 range-for 期望同向恢复）。
- **守护用例**：`RangeForBeginEndType.test.ts` + 资源 `cfg/mapIterMini/`（零 include 全平台可跑；ns 限定名容器 resolved 形态）——断言 begin/end 字段类型非 BooleanType 占位 + 迭代器 Local 非 boolean 污染。**反向验证**：stash 修复 → 守护立即失败（`got boolean`）→ pop 恢复（非恒真断言实证）。
- **新发现挂账（因子C，独立轮次）**：`CxxFieldRefInference` 注册名 `ArkCxxInstanceFieldRef` 与实际 ref 类名 `ArkInstanceFieldRef`（core 类）**永不匹配**——cpp 字段推导分发 miss，一直落到 core FieldRefInference（ets 语义链）——cpp 侧的判别联合/A2 推广/retireTemp 在字段侧从未生效。**resolved 容器的独立缺陷**：resolved begin 方法被 core 链解析后迭代器类型变 FunctionType（`MyMap.begin()`）→ deref 走 FunctionType→SdkGlobal('Function') 提升（`Function.*`）——正确语义应为 begin() 返回类型（修复前 Boolean.*、修复后 Function.*，CI 期望不覆盖 resolved 场景）。
- **验证**：tsc 零错误；cppCore **15/15**（14+新守护）；全量 **1505/1506**（基线+1，唯一失败已知 EPERM）；prettier——ArkIRTransformer 基线固有不合规（保持），新测试合规。
- **CI 复跑预期**：① structBinding MapUsage `%7 = %5.<IterableIterator.*>` 恢复；② loop/lazyImport 的同构 deref 期望恢复（round23 后它们应也在挂——若 CI 只报了 structBinding 一条，则其余也应一并转绿）；③ FunctionReturnUsage/ConstReferenceUsage 首次被断言（此前被遮蔽）——期望均为 stub 形态应过，若有新失败形态回报。

**round32c：loop2 deref 期望 `operator*.*` → `IterableIterator.*` 改写（窄谓词时代形态退役）— ✅ 已完成（CI 复跑待确认）**：
- **现象**：round32b 修复 loop1（`IterableIterator.*` 恢复 ✓）后暴露 loop2 失败：期望 `%10 = %8.<@%unk/%unk: operator*.*>`，实际 `IterableIterator.*`——**同一降级构造（handleForRangeIterResult 统一用 ITERATOR_CLASS_SIGNATURE）的两个 loop 期望形态却不一致**（loop1=IterableIterator / loop2=operator*），本身不自洽。
- **考古定案（git log -S + b165c7fc 代码对照）**：期望 `operator*.*` 固化于 b165c7fc（2026-05 "bugfix: cppfrontend ut fail"，diff 显示从 `@CXX/std/BuiltinClass: IterableIterator.*` 改为 `operator*.*`——**按当时实际 IR 快照固化**）。产生机制 = **round13 前窄谓词 isUnclear 时代的传播链**：next 构造的 returnType = `ITERATOR_RESULT_CLASS_TYPE` = ClassType('operator*') stub（cpp Builtin `ITERATOR_RESULT = 'operator*'`）——窄谓词（containsUnclearOrGeneric）下 ClassType stub 无嵌套 UnclearRef/Generic 叶子 → 判 false（"明确"）→ **typeSpread 传播成功** → 迭代器 %8 = operator* stub → deref 经 impactedStmts 二次推导 → genFieldSignature else 分支 declaring = baseType 类签名 → `operator*.*`。
- **形态不可达的根因**：round13 语义统一后 ClassType 的 isUnclear = **自身引用可解析性**（%unk 文件 → true）→ operator* stub 是 unclear 占位 → **"占位不传播"设计原则**（round13 确立，Intl 链/X|null Nullable 多重实证保护）在 transferRight2Left 拦截 → 传播不再发生 → 迭代器保持降级构造的 IterableIterator stub → deref declaring 保持构造值。round13~23 之间该期望应已开始失败（CI 上被后续遮蔽链层层掩盖，从未本机验证过——round15/17 时 Windows skip + round17 存档明确"CI 最终判定"悬置）。
- **处置（期望改写，含注释固化语义依据）**：`operator*.*` → `IterableIterator.*`。依据：① 传播 unclear 占位被 round13 设计原则禁止（不可恢复也不应恢复——传播它等于把 next 返回类型 stub 错当迭代器类型，而降级构造已显式 setType(IterableIterator)）；② loop1/loop2 同构构造的期望形态统一自洽；③ 实际形态（构造值保持）是 round13 语义下的正确降级。
- **验证**：cppCore 15/15（本机 skip 状态——structBinding 期望改动由 CI 承担最终验证）；全量 **1505/1506**（零回归，唯一失败已知 EPERM）；守护用例 RangeForBeginEndType 在双循环版资源上通过；prettier——structBindingExpect 基线固有不合规（保持），守护用例 write 合规。
- **CI 复跑预期**：structBinding case3 全部 testBlocks（BasicUsage/ReferenceUsage/TupleUsage/StructUsage/MapUsage 两循环/FunctionReturnUsage/ConstReferenceUsage）应全绿——MapUsage loop2 期望已对齐实际，FunctionReturnUsage/ConstReferenceUsage（首次断言）期望均为 stub 形态应过。若仍有失败，属更深层遮蔽存量（回报新形态再分析）。

## 27. B 轮：temp 空间索引表重构 + 全删锚 + 替换记录（round20）— ✅ 已完成

**五批实施（批间独立验证，全部通过）**：

**批 1（机制切换）**：
- `TempSignatureCanonicalizer` 三版全文重写（~243→~190 行）：`slots: (S|undefined)[]` 强引用 + 单调 nextId + `retire`/`retireWithReplacement`/`getReplacement`；删 WeakRef/FR/sweep/代数守卫/onEvict/aliveIds 全套。关键语义：**全保留**（未 retire 的 slot 永不强清——完整注册审计表，任何 temp ID 可追溯取回）；retired 实例 re-register 返回原 ID（symbol 保留，消费方经 replacement 直达 formal——不复活 slot）
- Registry：`TempSpaceStats` 字段重构（liveCount/totalRegistered/retiredCount/replacedCount，删 deadSlots/structureSize/evictedCount）；`settleTempSpaces` gc×job 轮次退役（async 签名保留兼容）
- Scene：`checkTempSignatureCompleteness` 日志口径（"未迁移遗留"同步即精确）
- Validator：**T4 退役**（validateTempSpacesAfterSettle/validateTempReachability/checkTempReachability/Builtin stub 池段删除）；**T3 简化为 ID 有效性**（checkAnchor 实例比对 → checkTempID：声明的 tempSigID ∈ 非空slot ∪ 有替换记录，两者皆无 = stale）；T1 措辞更新
- 测试：弱表 16 用例重写为索引表 16（retire 幂等/替换记录/三数自洽/clear 清 replacements/retired 实例 re-register 原 ID）；Validator T4 两用例删除 + T3 新语义两用例（stale 检测/replacement 背书合法）；`TempSpaceDiagnose.ts` 口径适配（受控实验改三版：dropped 强持有 + retire/replacement 语义）
- 验证：全量 **1499/1500 与基线一致**（Smoke 真实工程 T1/T2/T3 新语义零违规）

**批 2（迁移点 + Layer 1 删锚 + 三级查）**：
- 迁移点 3 处（ClassType.setClassSignature / Expr.route / Ref.route 的 formal 命中分支）：旧 tempSigID ≠ undefined 时 `retireWithReplacement`；**retire 语义边界**：仅 →formal 迁移 retire（temp→temp 重路由不 retire——旧 slot 留存供共享者）
- Layer 1 删锚 6 类：ClassType（tempClassSignature）/FunctionType（tempMethodSignature）/LexicalEnvType（tempNestedMethod）/EnumValueType（tempFieldSignature）/FieldSignature（declaringSignatureDisplay）/MethodSignature（declaringClassSignatureDisplay）——全部改为三级查（formal → slot → 替换记录+惰性物化写回，tempSigID 保留作痕迹）
- **行为语义记录**：unclear-ns FieldSignature（生产不可达形态，§24.9）的 getDeclaringSignature 由 display 兜底改为 stale 降级 DEFAULT——专测断言同步
- 验证：全量 **1499/1500 零变化**（取回路径切换等价性实证）

**批 2.5（Expr mutate 插桩实证）**：
- 临时插桩 6 处（core :154/:465/:609 + TypeInference :602/:622/:1065）+ 探针脚本（tests/resources/inferType 19 文件真实工程 build+infer）
- **数据**：`ti:602-ctor: 127` + `ti:622-resolve: 495` **全部 formal（model 侧签名）**——与 Expr 锚无关；**core 3 处 Expr mutate 零触发**（:609 有 `getClassSigID()===-1` temp 守卫、:154 动态 import 场景、:465 ARRAY miss 兜底——真实工程 SDK 完整时不触发）
- **结论：批 3 零风险确认**（3 处零触发 + 2 处常量类型 per-method 传播正确 + 2 处 model 侧无关；cpp 3 处同构分析成立）。插桩已全部还原

**批 3（Expr/Ref 全删锚）**：
- `AbstractInvokeExpr` 删 `tempMethodSignature` 字段：route 两分支均不再锚定（temp 分支 slot === 传入实例，formal 分支 R11 per-use 视图经 B2.5 实证无生产依赖）；`getMethodSignature()` 三级查
- `AbstractFieldRef` 删 `tempFieldSignature` 字段；`getFieldSignature()` 三级查（temp 优先顺序问题随 R 轮双视图退役消失——与 Expr 同构模板）
- **内存收益落地**：formal 命中路径的传入副本（值等价但从未注册的 MethodSignature/FieldSignature 实例 + subSig/参数数组）不再被锚钉活，可被 GC
- 测试适配 1 处（formal 命中读语义：传入实例 → formal canonical 活视图）；**R10 共享迁移守护用例**新增（A/B 共享 stub → A 迁移 retire+记录 → B 三级查 fallback + 惰性物化痕迹态 + 二次快路径）
- 验证：全量 **1499/1500 零变化**（mutate 传播零差异——B2.5 实证兑现，期望 IR 零变化硬断言通过）

**批 4（收尾）**：
- 弱表注释残留清理（Ref setter / Registry 区注释）；ArkSignature:441 等历史叙述保留
- prettier：本轮新增文件（TempSignatureCanonicalizer 等 11 个）合规；ArkSignature/Expr/TempIDMechanism.test 为基线固有不合规保持基线风格（§23.6 教训——TempIDMechanism 的 --write 162 行无关重排已还原）
- **事故记录（防重蹈）**：`git checkout -- <file>` 恢复到**暂存区**而非 HEAD——多轮未提交工作区下暂存区含历史轮改动（R 轮被保留），但未暂存的当轮改动丢失（批 3/4 两用例重放恢复）。还原单文件前先确认暂存状态（`git diff --cached --stat`）
- 最终：全量 **1500/1501**（基线 1499/1500 + R10 新用例，唯一失败已知 EPERM）；tsc 零错误

**B 轮终态架构**：temp 空间 = slot 数组强持有索引表（全保留审计）+ retire 显式迁移 + `Map<tempID, formalID>` 替换记录；8 类持有者全部仅持 ID（锚全退役），getter 三级查（formal → slot → replacement+惰性物化）；Validator T1/T2/T3（T4 退役）；统计三数自洽同步精确。后续 A2（源头减量）→ C 轮（prune 决策）按 §26.4。

## 28. statistics 增强：SDK 子阶段拆分 + 阶段层级报告 + 签名空间快照（round21）— ✅ 已完成

**需求**（用户）：① SDK 构建阶段拆 file build / 类型推导两个子阶段，报告呈现外层/内层层级关系（原为平铺）；② 构建与类型推导完成后的 formal sig / temp sig 数据进报告。

**改动（4 文件 + 测试）**：
- [x] 28.1 `StageStatistics.ts`：①`StageName` 增 `BuilderSdkFiles`/`BuilderSdkInfer`；②**阶段嵌套机制**——`startStage` 自动取当前 running 栈顶为 parent（`currentStackTop`，Map 插入序 = start 序），`StageStatEntry` 增 `parent` 字段；③`recordSignatureStats(label)`——采集 formal 五空间 size + temp 三空间 stats（B 轮字段）为 `SignatureStatsSnapshot`，挂 `StageStatisticsData.signatureSnapshots`（reset/exportToJson 同步适配）。import Registry 无环（Registry 在依赖图最底层）
- [x] 28.2 `SceneBuilder.buildSdkStage`：子阶段 1（`builderSdkFiles`：SDK 源文件注册构建）+ 子阶段 2（`builderSdkInfer`：doInfer + mergeGlobalAPI + postInferredSdk）包裹；`setFileLanguages/extendArkUI/markProjectFileBoundary` 留外层
- [x] 28.3 `Scene.ts` 采集点：`buildSceneFromProjectDir`/`buildSceneFromFiles` 的 `endStage(Builder)` 后 `recordSignatureStats('post-build')`；`inferTypes` 的 `endStage(InferTypesFinalize)` 后 `recordSignatureStats('post-infer')`
- [x] 28.4 `StageStatisticsReporter.ts`：①Stages section **树形 DFS 先序渲染**（父在前、子按完成序缩进跟随；**两遍扫描**——完成序天然子先于父，单遍连边会把子误判为 root，实施中实测踩坑后修正）；②新增 `Signature Statistics` section（每时点：Formal 五空间+total、Temp 三空间 live/total/retired/replaced）
- [x] 28.5 测试：`StageStatistics.test` 主用例扩展断言——SDK 子阶段存在性、parent 层级关系（六对）、signatureSnapshots 双时点含 post-build/post-infer、temp 三数自洽、报告文本含 Signature section 与二级缩进（`builderSdkFiles` 行 4 空格前缀）

**实测报告样例**（pta/Container + ohos SDK）：`[builder]` → `[builderSdk]` → `[builderSdkFiles] 565ms` / `[builderSdkInfer] 84ms`（SDK 文件构建与推导占比首次可观测）；`[post-build]`/`[post-infer]` 的 formal total=32,208，temp 迁移效果可见（post-infer: class retired=7/replaced=7, method retired=12/replaced=12——B 轮替换记录的运行时实证）。

**验证**：tsc 零错误；StageStatistics 专项 4/4；全量 **1500/1501**（基线一致，唯一失败已知 EPERM）。prettier：StageStatistics/Reporter 合规；SceneBuilder 为基线固有不合规（94 行注释重排已按 §23.6 教训还原，新增行与基线风格一致）。
