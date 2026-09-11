## Purpose

为 ArkAnalyzer 提供高性能架构基础设施，通过 `SignatureCanonicalizerRegistry` 全局单例统一管理签名单实例化与模型 ID 化，将 Scene 内部的签名和核心模型从基于字符串 Map key 的 JS 对象存储迁移到基于稠密整数 ID 的 canonicalizer 内置数组存储，以显著降低内存开销并提升比较性能。ID 化设计同时为未来的 Scene 列式序列化与反序列化奠定基础。

## ADDED Requirements

### Requirement: SignatureCanonicalizerRegistry 全局单例

ArkAnalyzer 应引入 `SignatureCanonicalizerRegistry` 全局单例，集中管理所有正式/临时 canonicalizer、`methodsMap` 和 `customComponentMap`。任何代码通过 `SignatureCanonicalizerRegistry.getInstance()` 或静态快捷方法直接访问，无需通过 Scene。当前设计假设运行时只有 1 个 Scene 实例。

#### Scenario: 全局单例访问

- **WHEN** 任何代码需要获取签名的正式 ID 或通过 ID 查询模型
- **THEN** 应通过 `SignatureCanonicalizerRegistry.getInstance()` 获取 Registry 实例，或通过静态快捷方法（如 `SignatureCanonicalizerRegistry.getFileId(sig)`、`SignatureCanonicalizerRegistry.getClassById(id)`）直接访问，无需持有 Scene 引用

#### Scenario: DEFAULT 签名初始化

- **WHEN** Registry 单例首次创建时（`getInstance()` 首次调用）
- **THEN** 5 个 DEFAULT 签名（`FileSignature.DEFAULT`、`ClassSignature.DEFAULT`、`MethodSignature.DEFAULT`、`NamespaceSignature.DEFAULT`、`FieldSignature.DEFAULT`）应被 intern 到对应的正式 canonicalizer，获得固定 ID 0
- **AND** ID 0 不对应任何模型对象（`models[0]` 为 `undefined`），实际模型从 ID=1 开始注册

#### Scenario: dispose 清空单例

- **WHEN** `Scene.dispose()` 或 `Scene.clear()` 被调用
- **THEN** 应调用 `SignatureCanonicalizerRegistry.dispose()` 清空所有 canonicalizer、models 数组、methodsMap 和 customComponentMap
- **AND** 下次 `getInstance()` 调用时自动重建单例并重新初始化 DEFAULT 签名

#### Scenario: Scene 待删除的委托方法（已删除）

- **WHEN** Scene 上的 `internFileSig()`/`internClassSig()`/`internMethodSig()`/`internNamespaceSig()`/`internFieldSig()` 和 `getFileById()`/`getClassById()`/`getMethodById()`/`getNamespaceById()` 方法被调用
- **THEN** 这些方法已在后续轮次全部删除（原为"过渡期保留委托"），调用方直接使用 `SignatureCanonicalizerRegistry.getInstance()` / Registry 静态方法访问

#### Scenario: getMethodsMap refresh（已删除）

- **WHEN** 类型推导过程中需要获取所有方法
- **THEN** `getMethodsMap(refresh)` 方法已在后续轮次彻底删除：methodSigCanonicalizer 是唯一事实源（ID 稳定，无需 refresh），`getMethods()` 平面遍历 canonicalizer models 收集

### Requirement: SignatureModelCanonicalizer — 签名+模型统一存储

`SignatureModelCanonicalizer<S, M>` 扩展 `SignatureCanonicalizer<S>`，新增 `models: (M | undefined)[]` 数组，使 ID→签名和 ID→模型共用同一 ID 空间，消除独立的 `Map<number, Model>`。

#### Scenario: 签名→ID→模型统一查询

- **WHEN** 一个 `FileSignature` 通过 `getId(sig)` 获得 ID 后，需要查询对应的 `ArkFile`
- **THEN** 应通过 `getModel(id)` 直接从 `models` 数组获取，O(1) 数组索引，无需额外 Map 查询

#### Scenario: 模型注册与移除

- **WHEN** 通过 `setFile()` 注册一个 ArkFile，或通过 `disposeModule()` 移除一个 ArkFile
- **THEN** 应调用 `setModel(id, file)` 注册或 `removeModel(id)` 移除（设为 `undefined`，ID 不回收）

#### Scenario: 获取所有模型

- **WHEN** 需要遍历所有已注册的模型（如 `getFiles()`、`getClasses()`）
- **THEN** 应通过 `getModels()` 获取所有非 `undefined` 的模型条目

### Requirement: 签名单实例化与模型 ID 化

5 类签名（`FileSignature`、`ClassSignature`、`MethodSignature`、`NamespaceSignature`、`FieldSignature`）通过正式 canonicalizer 按值语义去重为稠密整数 ID。`MethodSubSignature` 不设独立 canonicalizer，与 `MethodSignature` 1:1 绑定，共用同一 MethodSigID。正式签名 ID 与对应的核心模型（`ArkFile`、`ArkClass`、`ArkMethod`、`ArkNamespace`、`ArkField`）共用同一 ID（1:1 关系），`MethodSignature` 除外（n:1）。

#### Scenario: 正式签名值语义去重

- **WHEN** 两个不同的 `FileSignature` 实例具有相同的身份（`getHashCode()` 相同且 `equals()` 返回 true）
- **THEN** 正式 canonicalizer 的 `getId(sig)` 应对两者返回相同的整数 ID

#### Scenario: 正式签名单实例化

- **WHEN** 两个值相同但引用不同的签名实例分别经 `getId(sig)` 注册（intern）后再通过 `get(id)` 取回
- **THEN** 应取回同一个 canonical 单实例对象（首次注册的实例）；后续所有值相同签名的 `getId` + `get` 组合取回同一对象（曾有 `intern(sig)` = getId+get 的组合方法，review 工作项 A 已删除——生产 0 调用，语义由 getId+get 组合承载）

#### Scenario: 仅检查不新建

- **WHEN** 调用正式 canonicalizer 的 `getExistingId(sig)` 查询一个尚未注册的签名
- **THEN** 应返回 `-1`，不创建新 ID，不修改 canonicalizer 内部状态

#### Scenario: 临时签名引用语义分配

- **WHEN** Builder 阶段创建两个值相同但引用不同的不明确签名实例（如两个 `ClassSignature("F", FileSignature.DEFAULT, null)`，分别来自不同类的 extends 声明）
- **THEN** 临时 canonicalizer 应基于对象引用（`objectIdentity` 策略）为每个实例分配独立的临时 ID，即使值完全相同也不合并
- **AND** 临时 canonicalizer 使用 `TempSignatureCanonicalizer<S>`（内部包装 `Canonicalizer<T>` 的 objectIdentity 策略），维护引用计数追踪每个 tempSigID 被多少个 Type/Signature 对象引用
- **AND** `register(sig)` 在 Type 构造/签名赋值时调用（refcount++），`release(tempSigID)` 在迁移入口调用（refcount--，归 0 则移除）
- **AND** 此引用计数机制已实现并预留，当前混合方案中暂未在 Type 构造和 setter 中强制使用

#### Scenario: DEFAULT 签名进入正式空间

- **WHEN** Scene 初始化时
- **THEN** 4 个签名类的静态 `DEFAULT` 属性（`FileSignature.DEFAULT`、`ClassSignature.DEFAULT`、`MethodSignature.DEFAULT`、`NamespaceSignature.DEFAULT`）以及新增的 `FieldSignature.DEFAULT` 应被 intern 到对应的正式 canonicalizer，获得固定 ID 0
- **AND** ID 0 不对应任何模型对象（`Scene.files[0]` 等为 `undefined`），实际模型从 ID=1 开始注册

#### Scenario: 正式签名与模型共用 ID

- **WHEN** `FileSignature`、`ClassSignature`、`NamespaceSignature`、`FieldSignature` 通过正式 canonicalizer 获得 ID（ID >= 1）后，其对应的 `ArkFile`、`ArkClass`、`ArkNamespace`、`ArkField` 被注册到 Scene
- **THEN** 这四类签名与模型共用同一 ID（FileID、ClassID、NamespaceID、FieldID），模型存储在 canonicalizer 的 `models` 数组中以 ID 为索引，无空洞
- **AND** `MethodSignature` 因重载特性与 `ArkMethod` 为 n:1 关系（一个 ArkMethod 有 1 个 implSignature 和 N 个 declareSignatures），MethodSignature 拥有独立的 MethodSigID，不与 ArkMethod 共用 ID 空间；Scene 通过 MethodSigID 索引 ArkMethod
- **AND** `MethodSubSignature` 是 `MethodSignature` 的组成部分，与 MethodSignature 1:1 绑定，共用同一 MethodSigID，不设独立 canonicalizer；`setReturnType()` 等修改不影响 ID（ID 来自 MethodSignature 的 `toMapKey()`，不依赖 MethodSubSignature 的内容）
- **AND** 临时 ID 不与任何模型共用，不破坏正式 ID ↔ 模型的 1:1 不变式

#### Scenario: 正式 ID 与模型 1:1 不变式

- **WHEN** 正式 canonicalizer 中的任何 ID（ID >= 1）
- **THEN** 该 ID 应在 canonicalizer 的 `models` 数组中存在对应的模型对象（`models[id]`），不存在空洞
- **AND** 临时 ID 不参与此不变式，临时 canonicalizer 中的 ID 不对应任何模型

#### Scenario: ArkFile projectFile 标记

- **WHEN** `setFile()` 注册一个 project ArkFile，或 `addSdkArkFile()` 注册一个 SDK ArkFile
- **THEN** project 文件的 `isProjectFile()` 返回 `true`，SDK 文件的 `isProjectFile()` 返回 `false`
- **AND** `getFiles()` 返回 `isProjectFile() === true` 的文件，`getSdkArkFiles()` 返回 `isProjectFile() === false` 的文件

#### Scenario: 签名引用比较安全性

- **WHEN** 代码中需要比较两个签名对象的值是否相同（如 `TypeInference.isSameType()`、`ModelUtils.matchType()` 中的比较点）
- **THEN** 应使用 `signatureEquals(a, b)`（缓存 hash 先比 + equals 终审的纯值比较，不依赖注册状态——ID 判等对未注册签名存在 -1 哨兵双向误判，getId 版另有盲写副作用）；原始 `===` 引用比较已从 TypeInference.isSameType、IRInference.needInfer（最终实现为 fileName 比较）、ModelUtils 中的比较点修复；`ArkClass` 和 `MethodSubSignature` 的 `===` 比较在混合方案下天然安全（Map 查询返回同一实例 / MethodSignature 持有同一 MethodSubSignature）

#### Scenario: ArkBody 不 ID 化

- **WHEN** `ArkMethod` 的 `body` 字段（包含 `ArkBody`、CFG、locals、stmts）被访问
- **THEN** `ArkBody` 及其内部结构应保持对象形式，不进行 ID 化，序列化时作为嵌入对象处理

### Requirement: 签名 setter 自动 intern

模型的签名 setter 应自动完成签名的 intern（注册到 canonicalizer 并取回 canonical 单实例），确保签名对象单实例化，减少值相同但引用不同的签名实例数量。实现形式为 `getId(sig)` + `get(id)` 拆分（D13：setter 中同步缓存 sigID；曾有 `intern()` 组合方法，工作项 A 已删除）。

#### Scenario: 模型签名 setter 自动 intern

- **WHEN** `ArkFile.setFileSignature()`、`ArkClass.setSignature()`、`ArkMethod.setImplementationSignature()`、`ArkField.setSignature()`、`ArkNamespace.setSignature()` 被调用设置签名
- **THEN** setter 内部应调用对应 canonicalizer 的 `getId(sig)`（注册并取得 ID）并将返回的 canonical 实例（`get(id)`）存为签名引用，同时缓存 sigID 字段
- **AND** 后续通过 getter 获取的签名为 canonical 单实例，`===` 引用比较更安全

#### Scenario: declare 签名 setter 不注册 model

- **WHEN** `ArkMethod.setDeclareSignatures()` 或 `ArkClass.setDeclareSignature()` 被调用
- **THEN** declare 路径只 intern 签名取得 ID（`getId`），**不注册 model**——注册延迟到 `ArkClass.addMethod` 终点（防止覆盖 builder 合并期需读取的前一个同签名方法；overload 方法有多个声明签名，参数相同返回类型不同的会被误判为相同，故不做单实例替换）
- **AND** 声明签名保持原始实例

### Requirement: isUnclear() 接口 — 签名不明确性判断

5 个签名类应提供 `@internal isUnclear(): boolean` 方法，判断签名是否为不明确签名（需要走临时 canonicalizer）。判断标准是签名的 `declaringFileSignature` 是否为 `FileSignature.DEFAULT`。DEFAULT 单例及其直接组合返回 `false`（走正式 canonicalizer ID 0）。

#### Scenario: FileSignature 永远不为 unclear

- **WHEN** 调用 `FileSignature.isUnclear()`
- **THEN** 应返回 `false`（文件签名自身是身份根，不可能不明确）

#### Scenario: ClassSignature 不明确判断

- **WHEN** 调用 `ClassSignature.isUnclear()`
- **THEN** 如果 `this === ClassSignature.DEFAULT`，返回 `false`（DEFAULT 单例走正式 ID 0）
- **AND** 如果 `this.getDeclaringFileSignature() === FileSignature.DEFAULT`，返回 `true`（文件来源未知）
- **AND** 否则返回 `false`（文件来源明确）

#### Scenario: MethodSignature 不明确判断

- **WHEN** 调用 `MethodSignature.isUnclear()`
- **THEN** 如果 `this === MethodSignature.DEFAULT`，返回 `false`
- **AND** 如果 `this.getDeclaringClassSignature() === ClassSignature.DEFAULT`，返回 `false`（DEFAULT 单例的直接组合走正式 ID）
- **AND** 如果 `this.getDeclaringClassSignature().getDeclaringFileSignature() === FileSignature.DEFAULT`，返回 `true`
- **AND** 否则返回 `false`

#### Scenario: FieldSignature 不明确判断

- **WHEN** 调用 `FieldSignature.isUnclear()`
- **THEN** 如果 `this === FieldSignature.DEFAULT`，返回 `false`
- **AND** 如果 `this.getDeclaringSignature() === ClassSignature.DEFAULT`，返回 `false`
- **AND** 如果 `this.getDeclaringSignature().getDeclaringFileSignature() === FileSignature.DEFAULT`，返回 `true`
- **AND** 否则返回 `false`

### Requirement: Type/Expr/Ref 签名引用 ID 化（部分完成）

ClassType、FunctionType、EnumValueType、LexicalEnvType 应删除签名对象引用字段，改为纯 sigID 存储（通过 `isUnclear()` 判断走正式/临时 canonicalizer）。AbstractInvokeExpr 和 AbstractFieldRef 因 returnType/type 可变字段与 canonicalizer 去重冲突（R11），保留签名对象引用 + sigID 懒加载辅助缓存。

#### Scenario: 已改造的 Type 类构造函数

- **WHEN** 创建 `new ClassType(classSignature)` / `new FunctionType(methodSignature)` / `new EnumValueType(fieldSignature)` / `new LexicalEnvType(nestedMethod)`
- **THEN** 构造函数参数类型保持为签名对象（API 兼容）
- **AND** 内部通过 `sig.isUnclear()` 判断：不明确→register 到临时 canonicalizer + 存 tempSigID；明确→getId 到正式 canonicalizer + 存 sigID

#### Scenario: 已改造的 Type 类 getter

- **WHEN** 调用 `getClassSignature()` / `getMethodSignature()` / `getFieldSignature()` / `getNestedMethod()`
- **THEN** 返回类型保持为签名对象（API 兼容）
- **AND** 内部双路查询：sigID >= 0 从正式 canonicalizer 查询；tempSigID != undefined 从临时 canonicalizer 查询

#### Scenario: 已改造的 Type 类属性 getter 兼容

- **WHEN** 下游代码通过属性访问器访问签名（如 `type.classSignature`、`type.methodSignature`、`type.signature`、`type.nestedMethodSignature`）
- **THEN** 应正常工作，内部委托给对应的 `getXxxSignature()` / `getNestedMethod()` 方法
- **AND** ClassType 新增 `get classSignature()` 委托给 `getClassSignature()`
- **AND** FunctionType 新增 `get methodSignature()` 委托给 `getMethodSignature()`
- **AND** EnumValueType 新增 `get signature()` 委托给 `getFieldSignature()`
- **AND** LexicalEnvType 新增 `get nestedMethodSignature()` 委托给 `getNestedMethod()`
- **AND** 原因：删除签名对象引用字段后，下游代码可能仍通过字段名访问，属性 getter 确保向后兼容

#### Scenario: AbstractInvokeExpr/AbstractFieldRef 保留对象引用

- **WHEN** 创建 `new ArkInstanceInvokeExpr(base, methodSignature, args)` / `new ArkInstanceFieldRef(base, fieldSignature)`
- **THEN** 保留签名对象引用作为主存储
- **AND** sigID/tempSigID 作为懒加载辅助缓存（构造时 sigID = -1，getMethodSigID() 懒加载）
- **AND** setter 中重置 sigID 为 -1，下次懒加载重算
- **AND** 原因：returnType/type 是可变字段，hashCode/equals 不包含它们，canonicalizer 去重会丢失可变字段差异（R11）

### Requirement: toMapKey 设计原则

`toMapKey()` 原为签名值比较的依据（用于 `TypeInference.isSameType()` 等代码中的值比较和调试输出）。**最终状态（review 工作项 B/D 后）**：身份值比较已改用 `signatureEquals`（hash + equals，见"签名引用比较安全性" Scenario），生产代码中 toMapKey 的消费者为零，**5 类签名的 `toMapKey()` 已全部标注 `@deprecated`**——保留仅为对外 API 兼容（D11），身份判等用 `equals()`（配 `getHashCode()` 快速排除）、调试输出用 `toString()`。FileSignature 的实现改为 `toString()` 身份投影（projectName + fileName 完整身份字段，无碰撞——旧 `${hashcode}${basename}` 格式的 32 位 hash 对同名 basename 文件存在碰撞误判），其余 4 类保持递归拼接实现。

**注意**：`SignatureCanonicalizer` 采用 hash + equals 三层架构做值语义去重（见"hash + equals 三层去重架构" Requirement），`toMapKey()` 从不作为 canonicalizer 的去重依据。

#### Scenario: toMapKey 包含身份标识字段

- **WHEN** 构造签名的 `toMapKey()` 返回值
- **THEN** 应包含唯一确定签名身份的字段：`FileSignature` 包含 projectName + fileName；`NamespaceSignature` 包含上层签名 + namespaceName；`ClassSignature` 包含上层签名 + className；`MethodSignature` 包含 classSig + methodName + paramTypes + staticFlag；`FieldSignature` 包含 declaringSig + fieldName + staticFlag
- **AND** 两个签名的 `toMapKey()` 相同当且仅当它们是"同一个签名"（身份相同）

#### Scenario: toMapKey 排除可变字段

- **WHEN** 签名的某个字段在类型推导阶段会通过 setter 修改（如 `MethodSubSignature.setReturnType()`、`FieldSignature.setType()`）
- **THEN** 该字段**不应**包含在 `toMapKey()` 中，避免推导中字段变化导致 ID 变化、破坏引用一致性
- **AND** 现有 `MethodSignature.toMapKey()` 已遵循此原则——通过 `MethodSubSignature.toString()` 包含 methodName + paramTypes + staticFlag，但**不包含 returnType**
- **AND** `FieldSignature.toMapKey()` 应遵循相同原则——**不包含 `type` 字段**（因 `setType()` 在推导中调用）

#### Scenario: toMapKey 递归调用上层签名的 toMapKey

- **WHEN** 复合签名（NamespaceSignature、ClassSignature、MethodSignature、FieldSignature）的 `toMapKey()` 需要引用上层签名
- **THEN** 应递归调用上层签名的 `toMapKey()`（而非 `toString()`），确保层级关系用紧凑的 Map key 表示，避免 `toString()` 中的可读性前缀/后缀（如 `FileSignature.toString()` 的 `@` 前缀和 `: ` 后缀）进入 Map key

#### Scenario: toMapKey 与 toString 分离

- **WHEN** 需要紧凑的 Map key 或值比较依据时
- **THEN** 应使用 `toMapKey()`，它仅包含身份标识字段，不含可变字段和可读性修饰
- **AND** 当需要调试输出或可读性表示时，应使用 `toString()`，它可包含更完整的信息（如 returnType、可读性前缀等）
- **AND** 例外（工作项 B 后）：`FileSignature.toMapKey()` 即 `toString()` 身份投影——FileSignature 的 toString 本就只含身份字段（projectName + fileName），分离无实际意义；上层 4 类签名的递归拼接规则不变

#### Scenario: FieldSignature.toMapKey 新增

- **WHEN** `FieldSignature` 需要参与值比较
- **THEN** 应新增 `toMapKey()` 方法，计算逻辑为：`declaringSignature.toMapKey() + '.' + fieldName`，若 `isStatic()` 则在 fieldName 前加 `[static]` 前缀
- **AND** 不包含 `type` 字段（因 `setType()` 在推导中调用，是可变字段）
- **AND** 与现有 `toString()` 的区别仅在于：`toString()` 递归调用 `declaringSignature.toString()`，`toMapKey()` 递归调用 `declaringSignature.toMapKey()`
- **AND** `AliasClassSignature` 作为 `ClassSignature` 的子类，继承 `toMapKey()` 但 `getClassName()` 被 override 返回 aliasName，因此 `AliasClassSignature.toMapKey()` 与原始 `ClassSignature.toMapKey()` 自然不同——这是正确行为，无需额外处理

### Requirement: hash + equals 三层去重架构

`SignatureCanonicalizer` 采用 hash + equals 三层架构做值语义去重，替代原 toMapKey 字符串去重方案，消除字符串存储和拼接开销。

#### Scenario: 签名类实现 Canonicalizable 接口

- **WHEN** 5 类签名（FileSignature、ClassSignature、MethodSignature、NamespaceSignature、FieldSignature）参与正式 canonicalizer 的值语义去重
- **THEN** 应实现 `Canonicalizable` 接口，提供 `getHashCode(): number` 和 `equals(other: this): boolean` 方法
- **AND** `getHashCode()` 在构造时用 `hashString32`（MurmurHash3）+ `hashCombineU32`（boost-style combine）计算 32 位 hash 并缓存到 `readonly` 字段
- **AND** `equals()` 逐字段语义比较，从快到慢短路（字符串→嵌套签名 equals）

#### Scenario: SignatureCanonicalizer 内部委托 numberWithEquality 策略

- **WHEN** `SignatureCanonicalizer` 的 `getId(sig)` / `getExistingId(sig)` / `intern(sig)` 被调用
- **THEN** 内部委托 `Canonicalizer<S>` 的 `numberWithEquality` 策略，keyExtractor 返回 `sig.getHashCode()`，equalityComparer 为 `sig.equals()`
- **AND** 使用全 TypedArray 哈希表 + 开放寻址 + 拉链碰撞处理
- **AND** `toMapKey()` 不被 canonicalizer 调用（但仍用于代码中的值比较和调试）

#### Scenario: MethodSignature.equals 语义一致性

- **WHEN** `MethodSignature.equals()` 比较两个 MethodSignature
- **THEN** equals 的值语义等价于比较 `methodSubSignature.toString()`（方法名+参数类型+静态标志）+ returnType——工作项 I（bug #8 修复）后实现为**字段级短路**（`methodSubSignatureValueEquals`：staticFlag → methodName → 参数数量 → 逐参数类型 → returnType），多数不匹配场景零字符串拼接；值语义与原 toString 比较严格等价
- **AND** equals **比较 returnType**（重载要求：仅返回类型不同的签名 intern 到不同 ID——与 toMapKey 排除 returnType 不同）；returnType 刻意不参与缓存 hash（推导原地改 returnType 不致 ID 漂移，"hash 宽松保证 ID 稳定，equals 严格保证语义"）

### Requirement: 不明确签名的临时 ID 机制

Builder 阶段产生的无法立即解析的签名（如 extends/implements 目标、未知文件来源的类型引用等）应使用临时 canonicalizer 分配引用语义的临时 ID，在类型推导阶段签名被修正后迁移为正式 ID。

#### Scenario: 不明确签名使用临时 ID

- **WHEN** Builder 阶段创建的签名包含不明确信息（如 `FileSignature.DEFAULT` 作为声明文件、`UNKNOWN_FILE_NAME`、`UNKNOWN_CLASS_NAME`、`UnclearReferenceType` 中的类型引用）
- **THEN** 这些签名应通过临时 canonicalizer 的 `register(sig)` 分配临时 ID（引用语义，每个实例独立 ID），Type/Signature 中持有 `tempSigID` 字段，`sigID` 字段为 -1
- **AND** 此机制适用于所有 5 类签名（FileSignature、ClassSignature、MethodSignature、NamespaceSignature、FieldSignature）；`MethodSubSignature` 不设临时 canonicalizer，随 MethodSignature 一起处理

#### Scenario: Type/Signature 中的双字段存储

- **WHEN** `ClassType`、`FunctionType`、`LexicalEnvType`、`EnumValueType` 等 Type 子类或 `MethodSignature`、`FieldSignature` 等签名类持有签名引用
- **THEN** 内部应使用 `sigID: number`（正式 ID，-1 = 尚未解析）+ `tempSigID?: number`（临时 ID，可选，仅不明确时设置）双字段存储
- **AND** 不变式：`sigID >= 0` 时 `tempSigID` 必须为 `undefined`；`sigID == -1` 时 `tempSigID` 可有值
- **AND** `LexicalEnvType` 和 `EnumValueType` 不设 tempSigID（不明确签名场景较少）
- **AND** `MethodSubSignature` 不使用双字段存储，作为 MethodSignature 的内部组成部分随 MethodSignature 的 ID 一起管理

#### Scenario: setter 清除缓存

- **WHEN** `ClassType.setClassSignature(realSig)` 等 setter 被调用回写修正后的明确签名
- **THEN** 应更新对象引用（主存储）+ 清除 ID 缓存（`sigID = -1` + `tempSigID = undefined`）
- **AND** 下次需要 ID 时由调用方通过 `SignatureCanonicalizerRegistry.getInstance().xxxCanonicalizer.getId(sig)` 重新获取并设置
- **AND** 无需 scene 引用或懒加载

#### Scenario: 推导修正迁移临时 ID 到正式 ID

- **WHEN** 类型推导阶段通过 `ClassType.setClassSignature(realSig)`、`expr.setMethodSignature(realSig)`、`ref.setFieldSignature(realSig)` 等回写修正后的明确签名
- **THEN** setter 更新对象引用 + 清除 ID 缓存（`sigID = -1` + `tempSigID = undefined`），下次需要 ID 时由调用方通过 Registry 重新获取（内部优先 `getExistingId` 查找已有正式 ID，找到则不新建；仅当查找失败时通过 `getId` 新建并记录日志）
- **AND** 此迁移机制适用于所有 5 类签名的修正入口（setter 清除缓存 + 调用方重新获取）
- **AND** 除临时→正式替换外，推导还可更新正式 ID 对应模型对象的不清晰字段（如 `ArkClass.heritageClasses` 的 `baseClassID` 从 undefined 填充为真实 ClassID），此操作不改变模型自身的正式 ID

#### Scenario: 推导后临时集合完整性检查

- **WHEN** 类型推导完成后
- **THEN** 临时 canonicalizer 的 `size()`（返回 `refCounts.size`，即仍有引用的 tempSigID 数量）在完整方案（ID-only 存储启用 register/release）后应为 0；当前混合方案中临时 canonicalizer 基础设施已实现并预留，但 `register`/`release` 暂未在 Type 构造和 setter 中强制使用，完整性检查暂不可用
- **AND** 引用计数方式无需遍历 Type 对象，O(1) 检查（完整方案启用后）

### Requirement: 内部 ID 传递

在签名单实例化与模型 ID 化的基础上，ArkAnalyzer 项目内部的各种传递（模型间关系引用、Scene 内部查询、Builder 构建过程等）应尽可能改为 ID 传递，替代现有的对象指针传递，以减少对象引用的内存开销并为序列化奠定基础。

#### Scenario: 模型间关系引用 ID 优先

- **WHEN** 调用 `arkClass.getDeclaringArkFile()` 或 `arkMethod.getDeclaringArkClass()` 等模型关系查询方法
- **THEN** 优先检查对象引用字段是否已设置（非 undefined），如果有则直接返回
- **AND** 如果对象引用未设置，通过 ID 字段从 `SignatureCanonicalizerRegistry` 查询模型对象
- **AND** 如果 ID 字段也为 -1，返回 undefined（不应发生）

#### Scenario: Builder 阶段显式设置 ID

- **WHEN** `ArkClassBuilder` / `ArkMethodBuilder` / `ArkFieldBuilder` / `ArkNamespaceBuilder` 构建模型后
- **THEN** 通过被引用模型的 `getXxxSigID()`（如 `arkFile.getFileSigID()`、`cls.getClassSigID()`）获取 ID 并调用 `setDeclaringFileID(id)` / `setDeclaringClassID(id)` 设置到模型上
- **AND** `getXxxSigID()` 返回在 setter（`setSignature` / `setFileSignature` 等）中缓存的 sigID，无需额外 `getSignature()` + `getId()` 查询

#### Scenario: 五大模型 sigID 缓存

- **WHEN** ArkClass/ArkMethod/ArkField/ArkFile/ArkNamespace 的签名 setter（`setSignature` / `setImplementationSignature` / `setFileSignature`）被调用
- **THEN** 内部通过 `getId(sig)` + `get(id)` 获取 canonical 实例并缓存 sigID（替代原来的 `intern(sig)`）
- **AND** 新增 `getClassSigID()` / `getMethodSigID()` / `getFieldSigID()` / `getFileSigID()` / `getNamespaceSigID()` 返回缓存的 sigID
- **AND** 下游代码可直接调用 `model.getXxxSigID()` 获取 sigID，无需 `getSignature()` + `getId(sig)` 两步查询
- **AND** 模型的 `getDeclaringXxxID()` 懒加载也改为直接用被引用模型的 `getXxxSigID()`

#### Scenario: 无 scene 引用（ArkClass/ArkMethod/ArkNamespace/ArkField）

- **WHEN** 模型或 Type 对象需要从 ID 查询模型
- **THEN** 通过 `SignatureCanonicalizerRegistry.getInstance().classSigCanonicalizer.getModel(id)` 查询，不需要模型上存储 scene 引用
- **AND** ArkClass、ArkMethod、ArkNamespace、ArkField、ClassType、FunctionType、LexicalEnvType、EnumValueType、MethodSignature、FieldSignature 的 `scene` 字段和 `setScene()` 方法已删除

#### Scenario: ArkFile 保留 scene 引用

- **WHEN** 代码通过 `getDeclaringArkFile().getScene()` 链式访问 Scene
- **THEN** ArkFile 作为顶层模型保留 `scene: Scene` 引用，链式访问仍然可用（65 处调用点无需修改）
- **AND** `ArkFile.setScene()` 恢复为仅 `this.scene = scene`（无级联传播）

#### Scenario: Scene 内部查询使用 ID

- **WHEN** Scene 内部需要根据签名查询模型（如根据 `FileSignature` 查找 `ArkFile`、根据 `ClassSignature` 查找 `ArkClass`）
- **THEN** 应优先使用正式 canonicalizer 的 `getExistingId(sig)` 获取 ID，再通过 `canonicalizer.getModel(id)` 数组索引查询，而非通过字符串 Map key 查询

#### Scenario: Builder 构建过程传递 ID

- **WHEN** Builder 在构建过程中需要传递模型或签名引用（如 `ArkClassBuilder` 需要引用声明文件和声明命名空间）
- **THEN** 应优先传递 ID 而非对象引用，在需要访问对象属性时通过 Registry 的数组索引获取

#### Scenario: ID 与对象的转换边界

- **WHEN** 公开 API 接收对象参数（如 `Scene.getFile(fileSignature)` 被外部调用）
- **THEN** API 入口处将对象 intern 为 ID（正式 canonicalizer 的 `getId(sig)`），内部流程使用 ID 传递；API 返回处通过 ID 查询获取对象返回给调用方，转换过程对调用方透明

#### Scenario: Scene 公开 API 委托 Registry

- **WHEN** 外部调用 `Scene.getFile(fileSignature)` 等公开 API
- **THEN** Scene 内部委托 `SignatureCanonicalizerRegistry` 查询，返回对象给调用方，转换对调用方透明

#### Scenario: ArkBody 内部不强制 ID 传递

- **WHEN** `ArkBody` 内部的 `locals`、`usedGlobals`、`cfg`、`aliasTypeMap` 等结构被访问
- **THEN** ArkBody 内部保持对象形式，不强制改为 ID 传递；ID 传递改造仅限于模型层（ArkFile / ArkClass / ArkMethod / ArkNamespace）之间的关系引用

### Requirement: 类型推导阶段的签名处理

类型推导阶段（`TypeInference`、`IRInference`、`ModelInference`、`ValueInference` 等）是签名使用最密集的区域，存在大量签名重建、签名比较和签名→模型查找操作。ID 化改造需着重确保推导阶段的签名一致性和比较安全性，并正确处理临时 ID 到正式 ID 的迁移。

#### Scenario: Type 内部持有的签名引用经过 intern

- **WHEN** `ClassType.classSignature`、`FunctionType.methodSignature`、`AliasType.signature`、`LexicalEnvType.nestedMethodSignature`、`EnumValueType.signature`（持有 `FieldSignature`）等 Type 子类持有的签名引用被设置（包括构造函数设置和 `setClassSignature()` 等回写操作）
- **THEN** Type/Signature 保留签名对象引用作为主存储，新增 `sigID: number`（正式 ID，-1 = 尚未懒加载）+ `tempSigID?: number`（临时 ID，可选）双字段；setter 清除 ID 缓存，下次需要 ID 时由调用方通过 Registry 重新获取
- **AND** `EnumValueType` 持有的 `FieldSignature` 同样适用此规则

#### Scenario: 推导中新建的签名经过 intern

- **WHEN** 类型推导过程中创建新签名实例（如 `IRInference` 中的 `new MethodSignature(...)`、`new AliasClassSignature(...)`、`new FieldSignature(...)` 等重建操作）
- **THEN** 新建的签名通过 setter（如 `setMethodSignature()`、`setFieldSignature()`）写入 Type/Signature 对象时，setter 自动清除 ID 缓存（`sigID = -1`），下次需要 ID 时由调用方通过 Registry 重新获取；无需显式调用 `intern()`

#### Scenario: isSameType 引用比较安全性

- **WHEN** `TypeInference.isSameType()` 通过 `===` 比较两个 `ClassType` 的 `getClassSignature()`（`TypeInference.ts:1101`）
- **THEN** 该比较已改为 `toMapKey()` 值比较（`type1.getClassSignature().toMapKey() === type2.getClassSignature().toMapKey()`），不依赖 intern 单实例化，相同值的签名即使不是同一对象引用也能正确比较

- **WHEN** `IRInference.needInfer()` 通过 `===` 比较传入的 `FileSignature` 与 `FileSignature.DEFAULT` / `Builtin.BUILT_IN_CLASSES_FILE_SIGNATURE` 单例（`IRInference.ts:146,154`）
- **THEN** 该比较已改为 `toMapKey()` 值比较（`fileSignature.toMapKey() === FileSignature.DEFAULT.toMapKey()`），不依赖 intern 单实例化

#### Scenario: 推导中的签名→模型查找改用 ID

- **WHEN** 推导过程中需要根据签名查找模型（如 `scene.getClass(classSignature)`、`scene.getMethod(methodSignature)`）
- **THEN** 应优先使用正式 canonicalizer 的 `getExistingId(sig)` 获取 ID，再通过 `canonicalizer.getModel(id)` 数组索引查询，减少签名对象的传递和字符串 Map 查找开销

#### Scenario: isSubType 中 ArkClass 引用比较安全性

- **WHEN** `TypeInference.isSubType()` 通过 `===` 比较两个 `ArkClass` 对象（`TypeInference.ts:1149,1155`）
- **THEN** 由于通过 `canonicalizer.getModel(id)` 数组索引查询返回的是同一 ArkClass 实例，相同类的引用比较结果正确

#### Scenario: FieldSignature 引用比较安全性

- **WHEN** `ModelUtils.ts:677` 通过 `===` 直接比较两个 `FieldSignature` 对象（`paramType.getFieldSignature() === argType.getFieldSignature()`）
- **THEN** 该比较已改为 `toMapKey()` 值比较（`paramType.getFieldSignature().toMapKey() === argType.getFieldSignature().toMapKey()`），不依赖 intern 单实例化
- **AND** `DVFGBuilder.ts:51` 中 `FieldSignature` 作为 Map key 的场景，Scene 改造中 Map key 已改为 `toMapKey()` 字符串或整数 ID，引用相等性问题已消除

#### Scenario: MethodSubSignature 随 MethodSignature 单实例化

- **WHEN** `methodSubSignatureCompare`（`ArkSignature.ts:459`）内部通过 `===` 比较两个 `MethodSubSignature` 的 `getReturnType()`（Type 引用比较）
- **THEN** 由于 `MethodSubSignature` 随 `MethodSignature` 的 `intern()` 一起获得单实例化（MethodSignature 持有 canonical MethodSubSignature 实例），相同 MethodSignature 返回同一 MethodSubSignature 对象，其 `getReturnType()` 返回同一 Type 引用
- **AND** `MethodSubSignature` 不设独立 canonicalizer，不需要 `toMapKey()` 方法，其身份由 MethodSignature 的 ID 决定

#### Scenario: 推导阶段签名回写触发临时→正式迁移

- **WHEN** 推导过程中通过 `ClassType.setClassSignature(realSig)`、`expr.setMethodSignature(realSig)`、`ref.setFieldSignature(realSig)` 等回写推导出的明确签名
- **THEN** setter 更新对象引用 + 清除 ID 缓存（`sigID = -1` + `tempSigID = undefined`），下次需要 ID 时由调用方通过 Registry 重新获取（内部优先 `getExistingId` 查找已有正式 ID，仅当查找失败时 `getId` 新建并记录日志）
- **AND** `AliasClassSignature` 与原始 `ClassSignature` 因 `toMapKey()` 不同（`getClassName()` 返回 aliasName vs 原始类名），会被正式 canonicalizer 分配不同的正式 ID，这是正确的行为
- **AND** 推导还可更新正式 ID 对应模型对象的不清晰字段（如 `ArkClass.heritageClasses` 的 `baseClassID` 填充），此操作不改变模型自身的正式 ID

#### Scenario: 推导阶段不影响 ArkBody 内部结构

- **WHEN** 推导过程访问 `ArkBody` 的 `locals`、`usedGlobals`、`cfg`、`aliasTypeMap` 等内部结构
- **THEN** ArkBody 内部结构保持对象形式不变，ID 化和 intern 仅作用于 ArkBody 外部的签名和模型层引用

### Requirement: 外部 API 兼容性

ArkAnalyzer 作为其他项目的依赖项发布，所有对外提供的 API 必须保持向后兼容。项目内部可新建基于 ID 的接口用于 ID 传递替代对象传递的改造，但不得破坏现有公开 API 的签名和行为。**此约束是强制性的，每次修改代码时必须检查。**

#### Scenario: 公开 API 签名不变

- **WHEN** 外部项目通过现有公开 API 访问 ArkAnalyzer 功能（如 `Scene.getFile(fileSignature): ArkFile | null`、`ArkClass.getMethod(name: string): ArkMethod | undefined`、`CallGraph.getNode(funcID): CallGraphNode` 等）
- **THEN** 方法签名（参数类型、返回类型）和行为应保持不变，外部代码无需修改

#### Scenario: Type/Expr/Ref 构造函数参数类型不变

- **WHEN** 外部代码通过构造函数创建 Type/Expr/Ref 对象（如 `new ClassType(classSignature)`、`new FunctionType(methodSignature)`、`new ArkInstanceInvokeExpr(base, methodSignature, args)`、`new ArkInstanceFieldRef(base, fieldSignature)`、`new EnumValueType(fieldSignature)`、`new LexicalEnvType(nestedMethod)`）
- **THEN** 构造函数参数类型应保持为签名对象（如 `ClassSignature`、`MethodSignature`、`FieldSignature`），不可改为 `number`（sigID）
- **AND** 内部存储可改为 sigID，但构造函数在边界处通过 `Registry.getInstance().xxxCanonicalizer.getId(sig)` 转换
- **AND** 可额外新增 `@internal` 的 ID 构造方法（如 `static fromSigID(sigID: number)`）供内部高效创建

#### Scenario: Type/Expr/Ref getter 返回类型不变

- **WHEN** 外部代码调用 `getClassSignature(): ClassSignature`、`getMethodSignature(): MethodSignature`、`getFieldSignature(): FieldSignature` 等 getter
- **THEN** 返回类型应保持为签名对象，不可改为 `number`（sigID）
- **AND** 内部通过 `Registry.getInstance().xxxCanonicalizer.get(this.sigID)` 查询 canonical 实例返回

#### Scenario: Type/Expr/Ref setter 参数类型不变

- **WHEN** 外部代码调用 `setClassSignature(classSignature)`、`setMethodSignature(methodSignature)`、`setFieldSignature(fieldSignature)` 等 setter
- **THEN** 参数类型应保持为签名对象，不可改为 `number`（sigID）
- **AND** 内部更新 sigID（通过 `Registry.getInstance().xxxCanonicalizer.getId(newSig)` 获取新 sigID）

#### Scenario: toMapKey 保持返回 string

- **WHEN** 外部代码调用 `FileSignature.toMapKey()`、`ClassSignature.toMapKey()`、`MethodSignature.toMapKey()`、`NamespaceSignature.toMapKey()`、`FieldSignature.toMapKey()`（`FieldSignature.toMapKey()` 为本次新增方法）
- **THEN** 返回值类型应保持为 `string`，行为不变；内部 ID 化通过 Registry 统一提供 ID 转换，签名类上不新增 `toMapKeyId()` 方法（因签名类无法访问 Scene 上的 canonicalizer，存在循环依赖）

#### Scenario: 内部可新增 ID 接口

- **WHEN** 项目内部需要基于 ID 进行高效传递和查询（如 `SignatureCanonicalizerRegistry.getClassById(id: number): ArkClass | undefined`）
- **THEN** 可新建 ID 接口供内部使用，这些接口不影响现有公开 API 的行为。Registry 上的静态快捷方法提供签名→ID 和 ID→模型的转换

#### Scenario: 新增 ID 接口标注内部用途

- **WHEN** 新增基于 ID 的接口被定义
- **THEN** 应通过 JSDoc `@internal` 标注表明其为内部接口，避免外部项目依赖尚未稳定的接口

#### Scenario: 内部存储变更对外透明

- **WHEN** Scene 的 Map key 从 `string` 改为 `number`、签名内部存储迁移到正式/临时 canonicalizer、Type 内部存储改为 sigID（删除签名对象引用）
- **THEN** 通过公开 API 访问 Scene 的外部代码应无感知，返回的对象和结果与改造前一致
- **AND** 构造函数参数类型和 getter 返回类型保持不变，转换在边界处完成
