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

### 24.2 【方案已定，可直接实施】B2：method WithName 索引（选项 B：origin 语义整体退役 + 单键索引）
**决策**（round11 与用户确认）：不做双键等价版（选项 A），直接删 origin 前缀语义 + 类内单键名字索引。理由：origin 键唯一理由是 `methodMatchesName` 的第二分支；真实消费面核对（91 生产调用点）仅 findPropertyInClass/findArkModel 链的方法引用路径潜在依赖（无测试固化）；双键方案为兼容一个历史 quirk 付出持续复杂度。

**调研结论（已全量核对，新会话无需重查）**：
- 触点：`methodMatchesName` 6 处——ArkClass.ts :730 注释 / :766 定义 / :829+:851 读路径（getMethodsWithName/getStaticMethodsWithName）/ :1095+:1213 删除路径（removeMethodsByName/removeStaticMethodsByName）
- 删除内容：① `methodMatchesName` 的 `startsWith(NAME_PREFIX + name + NAME_DELIMITER)` 分支（退化为 `n === name` 精确匹配）② ArkClass.ts 的 NAME_PREFIX/NAME_DELIMITER import（:26，origin 分支删除后仅剩此处引用）③ ModelRelationshipID.test:607 裸名查嵌套断言（:606 完整名 / :609 outerFunc 不命中两条保持）
- **顶替语义顺带修复**：删 origin 分支后非重载语言 `add(foo)` 不再误删 `'%foo$bar'`（历史 quirk——removeMethodsByName 曾按 methodMatchesName 含 origin 命中删除）
- **B2 索引（简化为单键）**：ArkClass 新增 `methodNameIndex`/`staticMethodNameIndex: Map<string, number[]>`（完整名 → SigID 列表，追加序）懒建（首次名字查询时扫 topMethodSigIDs 全量注册）+ 增量维护（选增量而非 dirty-重建：构建期 checkAndUpdateMethod 是 add+query 交替，dirty 退化为 O(n²)；增量使构建期总计 O(n)）；读路径 getMethodsWithName/getStaticMethodsWithName 接入（get → getModel 过滤驱逐态）；写路径 4 处同步（updateMethodIndex 三分支 + removeMethod）；removeMethodsByName/replaceTopXxxByMatch 索引存在时走 map 定位（保持 firstIndex 语义）；sigID 选择与数组一致（`getMethodSigID() ?? getDeclareSigIDs()?.[0]`）
- 验证：专项测试（精确命中/同名共存/替换/删除/驱逐态/懒建幂等）+ ModelRelationshipID + OriginNameRemoval + 全量回归（基线 1450/1451）
- 内存预估：每方法 1 entry，SDK 十万级 ~5-10MB；懒建天然限制，基准数据决定是否加小类阈值

### 24.3 A 类（验证收尾，改动已完成、验证欠账）
- [ ] A1 cppCore 回归：round5/9/10/11 的 C++ 侧改动累积四轮未实测（需 LLVM 环境：`npm run build:cpp && npm run test:cpp`；ExportInfo nestedCase 重点）
- [ ] A2 性能基准：round5-11 累积性能改动（签名直查/多值探测/field 直查化/Registry 迁移）收益未量化（`PERF_ROUNDS=3 npm run perf:arkts`，需大型工程输入；同时为 B2 内存阈值定优先级）
- [ ] A3 docs 更新：多值化/探测层/Registry 迁移/Scene deprecated 均未反映到 docs/

### 24.4 B 类（已调研未实施）
- [ ] B1 getMethod(sig) fallback 收窄三步走：addMethod 补齐 declare 全槽注册（需 registerImplModelWithArbitration 同款仲裁）→ fallback 命中计数验证残余 → 收窄为 CXX/unclear 归属专属
- [ ] B3 CxxSceneUtils 死链删除（@deprecated 已标，puncture→processApiDefine 链全库零引用，~150 行）
- [ ] B4 forEachCreationParser 防环（ViewTreeBuilder ForEach/LazyForEach 回调直接递归不经 buildingTrees 防护，推导 miss 时可无限递归）

### 24.5 C/D 类（待专项分析/可关闭）
- [ ] C1 heritageClasses/extendedClasses 迁移 ID（16.1，时序复杂）；C2 Signature Usage Table（16.2，前置已就绪）；C3 getMethodsMap(refresh) 依赖消除（4.25）；C4 AnnotationNamespaceType ns 类型归属（低优，实测无差异）；C5 cpp 侧 ns 探测（低优，built-in Intl 不进 cpp 链）
- [ ] D：15.3/15.4（S8/S9）显式关闭（已标"不建议实施"）
