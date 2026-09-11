# ArkAnalyzer ID 化架构重构 — 改动说明书（round8 code review 输入）

| 项 | 内容 |
|---|---|
| 涉及 commit | `2cb7ada0` "refactor with id"（207 文件，+18139/-5078）<br>`2ea2421b` "performance improve"（48 文件，+3904/-1088，基于前者） |
| 分析基线 | `git diff 2cb7ada0^ 2ea2421b`（行号引用以当前工作区为准） |
| 测试状态 | `npx tsc --noEmit` 通过；commit 时 TS 单测 1235/1236（唯一失败 ModuleBuilder EPERM 环境问题），本轮 review 期间随测试增长为 **1490/1491**（同一 EPERM 环境问题）；工作项 A/G/D/B/I 依次落地后全量回归维持 1490/1491，无新增失败。C++ 测试需 LLVM/Clang 环境（本机未配置，历轮基线均为 TS-only） |
| 配套设计文档 | `openspec/changes/high-performance-architecture-refactor/`（proposal / design / spec / tasks / current-status） |

**本文档的定位**：代码改动过于庞大（2 万+ 行），直接 review code 不现实。本文档试图把改动"翻译"出来——每个主要 model 改了什么字段、关键处理流程从什么样变成了什么样、为什么必须改——通过 review 本文档来代替 review code。文中所有结论都附文件:行号，可随时回查代码验证。

// TODO: PR 可能还会修改，再终稿定稿之后，记得来刷新所有的行列号信息。

**章节导航**：
- 第 1 章：最核心的架构改造（Registry 总览 → 三个新增 Canonicalizer 类 → hash 查找机制 → formal / temp 两张签名表），其他一切都建立在它之上；
- 第 2 章：Registry 的核心配套机制（DEFAULT 保留位 / project-SDK ID 边界 / namespace 无 temp 论证 / 配套存储 / 依赖图约束 / API 清单）；
- 第 3 章：按层级从高到低逐个 model 介绍适配改动（ArkSignature → Scene → ArkNamespace → ArkClass → ArkField → ArkMethod（含 n:1 重载注册专题）→ 底层）；
- 第 4 章：周边架构与辅助设施的修改（SceneBuilder 构建流程拆分 / 阶段统计 / 不变式校验器 / 典型场景举例 / 其他）；
- 第 5 章：工作项清单（待执行 / 待分析 / 本轮已执行）——所有 review 衍生工作项的唯一登记处；
- 第 6 章： review 建议关注点。

---

## 1. 最主要的架构改造：Registry 与 formal / temp 两张签名表

### 1.1 改造背景：为什么要做 ID 化 

**改造动机**：

1. **演进基础**：模型间靠对象指针互指（`declaringArkFile: ArkFile` 等），无法高效序列化——ID 化为 Scene 列式序列化/反序列化奠定基础（本轮只打基础，序列化不在范围）；
2. **正确性（隐藏缺陷）**：签名对象多实例化——同一逻辑签名在代码各处被 `new`（88+33 处构造点），值相同但引用不同。历史代码有 6 处用 `===` 引用比较签名（`TypeInference.isSameType`、`IRInference.needInfer`、`ModelUtils` 等），多实例时判"不等"，推导结果随机取决于对象从哪条路创建（本轮已修 4 处，见 §3.7）；
3. **内存收益**：签名字符串的重复分配与常驻消减，同一个签名对象多实例化造的消减；
4. **不明确签名的归宿**：builder 阶段 `extends` 目标等签名的文件来源未知，这类"孤儿签名"以普通对象实例散落各处，难以统计与评估类型推导的程度。

### 1.2 SignatureCanonicalizerRegistry 总览

**方案**：`src/core/common/SignatureCanonicalizerRegistry.ts` 全局单例，是所有签名、所有模型的统一存储中心。核心就两张表：

- **5 个正式（formal）`SignatureModelCanonicalizer`**：file / class / namespace / field / method 五类签名各自的"值 ↔ SigID ↔ 模型"三向绑定（详见 §1.5）。
- **3 个临时（temp）`TempSignatureCanonicalizer`**（class / method / field）：存放"文件来源未知"的不明确签名（详见 §1.6）。

配套的生命周期规则：`Scene.dispose()` / `Scene.clear()` → `Registry.dispose()` 清空单例；之后任何代码再调 `getInstance()` 会自动重建并重新初始化 DEFAULT 签名。

本章的展开顺序：三个新增 Canonicalizer 类的结构（§1.3）→ hash 查找机制（§1.4）→ formal 表的构建（§1.5）→ temp 表的构建（§1.6）。

**设计约束**：
- 当前假设运行时单 Scene，很多用例无法满足单Scene的约束，需要修改用例；计划支持多 Scene，适配只需把单例改为 `Registry.forScene(scene)`，这样可以避免对现有用例做相应修改。
- Registry 的依赖图约束（禁止值 import 模型类）// TODO: 这个也看不懂，放到单独小节介绍，不在这里介绍。→ 见 §2.5。

### 1.3 三个新增 Canonicalizer 类及其相互关系

本次复用 1 个已有类，新增 3 个类，它们的分工与关系如下：

```
utils/Canonicalizer.ts（旧有，未改动）
  └─ 底层哈希表引擎：TypedArray（Int32Array keys/heads/nextById + Uint8Array occupied）
     开放寻址 + 拉链碰撞处理，三种策略（objectIdentity / numberWithEquality / stringIdentity）

core/common/SignatureCanonicalizer.ts（新增）—— 正式签名的值语义去重
  └─ 组合上面的引擎，选用 numberWithEquality 策略：
     keyExtractor = sig.getHashCode()（签名自己缓存的 32 位 hash）
     equalityComparer = sig.equals()（碰撞时逐字段语义比较）
  └─ 对外提供：getId(sig) [intern，未注册则分配新 ID] / getExistingId(sig) [只读查询，未注册返回 -1] / get(id) [ID → canonical 签名实例]
     （曾有 intern(sig) = getId+get 组合，已删——工作项 A，生产 0 调用）

core/common/SignatureModelCanonicalizer.ts（新增）—— 在前者基础上加模型存储
  └─ extends SignatureCanonicalizer<S>，新增 models: (M | undefined)[] 数组
  └─ 对外提供：setModel(id, model) / getModel(id) / removeModel(id) / getModels()
  └─ 关键点：models 数组与签名表共用同一 ID 空间 —— 签名 ID 就是模型数组的下标

core/common/TempSignatureCanonicalizer.ts（新增）—— temp 签名的索引表（独立机制，非值语义）
  └─ 刻意既不 extends SignatureCanonicalizer、也不组合 Canonicalizer：
     temp 是实例语义（值相同的不同实例各占一个 slot，绝不合并），与 formal 的值语义方向相反，is-a 不成立；
     且 temp 的核心能力（retire 置空 / 迁移记账 / live-retired 统计）在两个既有类上均无对应物——完整设计分析（含组合可行性评估）见 §1.6"与 SignatureCanonicalizer 的关系"
```

### 1.4 hash 查找机制：新方案 vs 旧字符串拼接 key 方案

**新方案的"去重"**：formal 表（§1.5）的核心操作是把一个签名值映射到一个唯一整数 ID——"去重"就是 `getId(sig)` 的语义本身：值相同（hash 相同且 equals 为真）的多个签名对象，无论被 `new` 了多少次，都折叠为**同一个 ID、同一个 canonical 实例**（这就是 intern）。它的使用场景贯穿全程：builder 注册签名（§1.5 的注册过程）、一切按签名查模型的查询（`scene.getClass(sig)` 等）、签名 setter 的自动 intern。

**新方案的"三层"**：是这条路径上从"一个签名对象"到"一个 ID"的**三道工序**：缓存 hash → 哈希表定位 → equals 终审。下面以 `getId(sig)` 为例串起来走一遍：

1. **Layer 1（缓存 hash）**：签名对象构造时用 `hashString32`（MurmurHash3 变体）+ `hashCombineU32`（boost 风格组合）把身份字段（如 classSigID + className）算成一个 32 位数字，存进 `readonly` 字段。**这一步在对象生命周期内只发生一次**（例外：MethodSignature 构造 hash 内部含一次 `methodSubSignature.toString()` 拼接——工作项 I 评估后**保持现状**：构造期一次性成本非热点，见"例外一"）；
2. **Layer 2（哈希表探测）**：`getId()` 调 `getHashCode()`——只是 `return this.hashCode` 读缓存字段（ArkSignature.ts:94-96），随后用这个数字在 TypedArray 哈希表里定位桶。**hash 不同的比较在此结束**（短路，无任何字符串操作）；结果为相等的比较会进入 Layer 3；
3. **Layer 3（equals 终审）**：hash 相同（值相同或罕见的 32 位碰撞）时逐个 `equals()` 比较。**equals 不是本方案新增的成本，而是任何哈希表查询的固有步骤**——"hash 定位 + 等值确认"两步缺一不可（修改前的 JS Map 同样要做，而且是**整个 key 字符串逐字节 memcmp**，50-100 字符；新方案的 equals 是逐字段比较：2 个数字 `===` + 1 个字符串名 `===`，canonical 实例场景第一行 `this === other` 引用短路，一次指针比较）。MurmurHash3 的雪崩性保证绝大多数 slot 链长 = 1，桶内第一跳即命中——equals 恰好执行 1 次。（原例外"MethodSignature.equals 走 toString 拼接"已由工作项 I 消除——equals/isMatch 改为字段级短路，见"例外一"。）

**可变字段排除原则**：`MethodSignature` 的 hash 不含 `returnType`、`FieldSignature` 的 hash 不含 `type`。原因：类型推导会原地 `setReturnType()`/`setType()` 修改这些字段——若参与 hash，改一次类型签名 hash 就变了，下次 intern 会落进不同 ID，前功尽弃。排除后签名身份终身稳定。（`MethodSignature.equals` 与 hash 刻意不对齐的完整原因——重载需要 equals 含 returnType——详见 §3.6 ArkMethod 节的 n:1 专题，它是 method 签名的特有问题，故在彼处展开。）

> Note: `getId` 和 `getExistingId` 匹配到hashcode后仍要做一次 equals 判断，这会影响性能。可以考虑做优化，收窄需要比较的场景。

**旧字符串拼接 key 方案的真实开销**：

- 修改前 `FileSignature` 其实已经有一个 hashcode 缓存字段：构造时 `this.hashcode = CryptoUtils.hashcode(this.toString())` 算一次存起来。**但它省的只是 toMapKey 内部的一小段**——`toMapKey()` 的实现是模板字符串 `` `${this.hashcode}${path.basename(this.fileName)}` ``，即把缓存的数字转成字符串、再拼上文件名 basename，**每次调用 toMapKey 仍然产生一个新字符串**。而 Map 的 key 是字符串，所以缓存没能消除拼接，更没能消除 JS Map 内部对 key 的字符串 hash（V8 对字符串 hash 有内部缓存，但每次查询拼出的都是**新字符串对象**，缓存永远不命中，等于每次都完整算一遍）；
- 其余 4 类签名（Class/Namespace/Method/Field）连这点缓存都没有：`toMapKey()` 是**递归拼接**——`ClassSignature.toMapKey() = fileSig.toMapKey() + '.' + className`，每次查询都从文件层一路拼到类名（MethodSignature 还要再拼 `methodSubSignature.toString()`，参数列表越多串越长）；
- 所以修改前的查询链路是：**现场拼一个完整 key 字符串（例如 `@myProject/src/main/ets/pages/Index.ets: MyClass`）→ JS Map 对新字符串算 hash → 逐位比较 → 用完即扔**。

**修改后机制与例外**：

- 5 类签名统一在**构造时**算一次 32 位数字 hash，缓存在 `private readonly hashCode` 字段；查找时 `getHashCode()` 就是 `return this.hashCode`——**读一个字段，不做任何计算**。数字直接作为 TypedArray 哈希表的探测 key（纯整数运算定位桶），命中即返回；
- **例外一（bug 清单 #8，已由工作项 I 修复）**：原实现中 `MethodSignature` 的 equals 与 isMatch 走 `methodSubSignature.toString()` 拼接（equals 每次拼 2 个参数串 + 2 个 returnType 串；isMatch 每次拼 6 个递归字符串，且 isMatch 是 addMethod/updateMethodIndex 重载合并的**构建期热路径**）。工作项 I 改为字段级短路（新增 `methodSubSignatureValueEquals` helper：staticFlag → methodName → 参数数量 → 逐参数类型（单例 Type 引用短路）→ returnType，从快到慢；isMatch 的 declaring 部分改 `signatureEquals`）——多数不匹配场景零拼接零分配。**仅剩**：构造期 hash 的 `hashString32(methodSubSignature.toString())` 一次拼接——评估后保持现状（C 决策：hash 缓存 readonly 一次性成本，非反复调用热点；Type 无 hash 基础设施，逐字段改写收益有限）。其余 4 类签名的构造 hash 与 equals 均为逐字段数字/字符串 `===`，无拼接；
- **例外二**（不属于"通过签名查 ID"但相关）：按**名字**查询的路径（如 `ArkClass.getFieldWithName(name)`）每次要现场构造一个临时 FieldSignature（含一次 hash 计算），是已知热路径分配开销（bug 清单 #17）；
- `toMapKey()` 已整体**降级 @deprecated**。

**现在构造时算的 32 位 hash，与原先 Map 的 key 是什么关系**——原先 Map 的 key（toMapKey 字符串）同时承担三个职责，改造后被拆开了：

| 原 key 字符串的职责 | 修改后由谁承担 | 代价变化 |
|---|---|---|
| **定位**：JS Map 内部对 key 算 hash 找桶 | 构造时缓存的 32 位数字 hash 直接作为 TypedArray 探测值 | 每次查询从"拼 key + 字符串 hash"变为"读字段 + 整数探测"；且 V8 字符串 hash 缓存因每次新拼而永远失效的问题不复存在 |
| **身份**：key 相同 ⇔ 同一签名 | hash 粗筛（定位桶内候选）+ `equals()` 细判（最终裁决） | hash 相同≠身份相同（存在碰撞），所以配了 equals 兜底——这是"数字 hash 比字符串 key 信息少"的必要补偿 |
| **常驻索引材料**：Map 每个条目存一份完整 key 字符串（万级 × 50-100 字节） | 不再存在——哈希表只剩 TypedArray 的 int32 槽位 | 直接省掉这部分内存 |

> Note：从内存快照中查看原先这些Map所占内存，现在这些Map没有了，相应的内存有没有省下来？300w基线工程所有ArkModel数量总和大概177w，总共约84M ~ 168M。

**新的 hashcode 计算方式**（`src/utils/HashUtils.ts`，所有 5 类签名构造时统一使用）：

- **`hashString32(raw)`**——MurmurHash3 风格字符串哈希：seed `0xdeadbeef`，逐字符 `imul(x ^ c, 0x85ebca6b)` 混合，末尾跑**完整 fmix32 finalizer**（两次 xor-shift + 两次 imul 的雪崩混合）；UTF-16 代理对先合并为码点再参与混合（避免代理对拆分造成的分布空洞）；
- **`hashCombineU32(seed, value)`**——boost 风格字段组合：`seed ^= imul(value, 0x9e3779b9)` + 局部 fmix，把多个身份字段（fileSigID、className、staticFlag 等）按序混合进同一个 32 位结果，组合具有顺序敏感性（f(a,b) ≠ f(b,a)）。

**为什么不用原先的 `CryptoUtils.hashcode`（Java String.hashCode 风格的 31 进制多项式，`h = 31*h + charCode`）**——核心原因是**用途变了，对质量的要求就变了**：

| 维度 | 旧：31 进制多项式 | 新：MurmurHash3 + boost combine |
|---|---|---|
| **雪崩性** | 无 finalizer——相近输入产生相近 hash（`"abc1"` 与 `"abc2"` 的 hash 仅差低位几个 bit），输入的局部变化只影响输出的局部位 | fmix32 完整雪崩——输入变 1 bit，输出约 50% 的 bit 翻转 |
| **分布均匀性** | 低质量 hash 作为开放寻址探测键时造成 **slot 聚集**——线性探测链与拉链都变长，**equals 执行次数随链长上升**，性能随规模退化 | 均匀分布 → 绝大多数 slot 链长 = 1，桶内第一跳即命中 |
| **用途匹配** | 它原本的用途是 **toMapKey 的拼接材料**（拼进字符串的一段字符），对分布质量**无要求** | 新用途是**哈希表探测键**（引擎内 `mixNumber(key) & mask` 定位 slot）——分布质量直接决定查询性能。TypedArray 开放寻址表对输入 hash 质量高度敏感，引擎内的 mixNumber 再混合一层也救不回 31 进制的结构性弱点（短字符串低位聚集） |
| **多字段组合** | 无组合原语（只对整个字符串单遍） | hashCombineU32 按序组合各身份字段，顺序敏感且逐层混合 |
| **计算成本** | O(len) 单遍 | O(len) 单遍 + 每字段约 5 次整数运算的 finalizer——两者都是构造时算一次，成本差异可忽略 |

### 1.5 formal 签名表：构建阶段、特点与 model 注册过程

**构建阶段**：formal 签名从 **builder 阶段**就开始注册。前端解析每个文件时（ArkFileBuilder → ArkNamespaceBuilder → ArkClassBuilder → ArkMethodBuilder / ArkFieldBuilder），每创建一个模型就通过签名 setter 把签名 intern 进对应 canonicalizer，立刻拿到正式 SigID。也就是说：**模型还没推导、甚至方法体还没生成，它的签名和Model就已经有正式 ID 了**。

**四个关键特点**：

1. **ID 连续**：每个 formal 空间的 ID 从 0 开始连续递增（0 是 DEFAULT 保留位，见 §2.1），没有空洞。稠密性使得"ID = 数组下标"成立，`getModel(id)` 是纯数组访问；
2. **签名 ↔ 模型一一对应**（4 类）：FileSignature ↔ ArkFile、ClassSignature ↔ ArkClass、NamespaceSignature ↔ ArkNamespace、FieldSignature ↔ ArkField 各自 1:1——一个 ID 唯一挂一个模型。例外是 MethodSignature ↔ ArkMethod 为 **n:1**，AliasClassSignature 双注册同理：origin 的模型同时挂在 origin ID 和 alias ID 两个下标上。n:1 用 impl + declare 槽位双注册解决（§3.6 ArkMethod 节专题）；
3. **不变性**：签名一旦 intern，其身份字段的值不再变化（可变字段被排除在 hash/身份之外）；推导阶段哪怕 `setReturnType` 修改了 MethodSubSignature，签名仍落回同一 ID；
4. **驱逐态**：`removeModel(id)` 只把 `models[id]` 置 undefined，签名条目与 ID 保留（模块卸载后重加载可复用同一 ID）。

**举例：一个 formal class sig 的创建与 model 注册全过程**（以 `// a.ets` 中的 `class Foo {}` 为例，两步完成，串起 ArkClassBuilder → ArkClass → ArkFile 三个环节）：

1. **签名创建**（`buildClassSignature`，ArkClassBuilder.ts:94-113）：builder 从所属文件拿 `FileSigID`（顶层类无命名空间），**`new ClassSignature('Foo', fileSigID=5, undefined)`**——传的全是数字/undefined，走 SigID 构造重载，hash 在构造函数里算好缓存；
2. **intern + 注册 model 一步完成**（`cls.setSignature(sig)`，ArkClass.ts:395-404）：调 `classSigCanonicalizer.getId(sig)`——缓存 hash 定位桶，没有则分配新 ID（比如 23）；缓存 `cls.classSigID = 23`；同时**首建注册** `models[23] = cls`。三态处理：首次出现 → 注册；驱逐态恢复（ID 有签名但 model 被 remove 过）→ 补注册；ID 已被别的 model 占住 → 不覆盖（写穿保护）；
3. **挂入文件顶层索引**（`arkFile.addArkClass(cls)`，ArkFile.ts:235-246）：SigID 查重未命中 → `Registry.registerClass(cls)` + `topClassSigIDSet.add(23)`。
// TODO: `arkFile.addArkClass(cls)`这里SigID 查重未命中应该是不允许出现的情况，应该输出Error日志，不应该做register操作？

**对这个疑问的分析（只记录，代码未动）**：未命中**不是异常，而是新类首次加入本文件的正常路径**——`getTopClassByID(id)` 查的是**本文件的 topClassSigIDSet**（文件顶层类索引），不是 canonicalizer 的 model 表。查重的目的不是"防重复注册"，而是**识别声明合并场景**（命中 = 同文件已有同 SigID 类 → copyMembers 合并；未命中 = 新类 → register + 入索引，此时不 register 索引就是空的）。registerClass 在正常流程中是幂等的第二次 setModel（第 2 步 setSignature 已首建注册），作为兜底保留。但用户的观察有一层真实的合理性值得记录：`registerClass` 是**无条件** `setModel`，若未来出现"本文件索引未命中、但 canonicalizer 的 model 已被其他对象持有"的路径（如跨文件误加同名类——同名类在不同文件是不同 FileSignature/不同 ID，正常不会发生，但属于防御面），它会静默覆盖——与 setSignature 的"他 model 已持有不覆盖"保护不一致。已列入 Review 建议关注点（§6）。

之后任何地方 `scene.getClass(sig)`：`getExistingId(sig)`（缓存 hash 桶探测）→ `getModel(23)`（数组下标）——主路径无字符串、无遍历（碰撞时的 equals 例外见 §1.4"修改后机制与例外"）。

### 1.6 temp 签名表：三版演进、构建阶段与 formal 切换

**为什么需要 temp 表（修改前的 gap）**：builder 阶段有些签名 unclear，（例如 `class A extends F` 中 F 的 ClassSignature 文件来源未知（declaringFile = DEFAULT）），只有推导阶段才能解析。若与正式签名共用 ID 空间会产生"空洞"（有 ID 无模型），破坏签名 ID ↔ 模型 1:1 不变式。修改前这类"孤儿签名"以普通对象实例散落在各处，`===` 比较和去重都对它们无效。

**构建阶段**：temp 签名主要产生在 **builder 阶段中后期与推导期**。

登记 temp 的实际条件是**formal 只读探测未命中**：持有者（Type/Expr/Ref）构造或路由时调 `getExistingId(sig)`，miss 就 `register(sig)` 进 temp。

**三版演进**（每版都是上一版实测翻车后的修正，`TempSignatureCanonicalizer.ts:16-53` 头注释有完整记录）：

- **一版（refcount）**：`Map<id, sig>` + 引用计数，推导成功一处计数减1，计数为0则置空可回收。但是共享场景计数不精确（register 1 次持有 2~N 个），最终出现大量无法回收的签名，方案被舍弃；
- **二版（弱引用表）**：`Map<id, WeakRef>` + FinalizationRegistry——GC 驱动清理时序不确定（KeepDuringJob 窗口）、只能一次性全部回收、中途不会逐步回收、WeakRef/FR 有真实 GC 开销，方案被舍弃；
- **三版（索引表，当前方案）**：**简单说就是"一个数组 + 一本迁移账"**——数组 `slots` 强持有每个登记过的签名（下标即 tempSigID，ID 永不复用）；某签名解析成功迁移去 formal 时，把它的 slot 置空（retire），并在"迁移账"（`replacements` Map）里记一笔 `tempId → formalId`；其他还持有这个 tempId 的对象来取签名时发现 slot 空了，翻账本直达 formal 结果。

**关键特性**：

- **register(sig)**：用签名实例自带的 symbol 属性判断"我登记过没有"——登记过直接复用原 ID（同一实例绝不占两个 slot）；没登记则分配单调递增的新 ID，`slots[id] = sig` 强持有（签名的存活由 slot 锚定，持有者消亡不影响，见下）；
- **ID 永不复用**（单调 nextId）：FieldSignature 的 hash 会混入 tempSigID，若复用旧 ID，同值签名会出现 hash 语义混乱；
- **retireWithReplacement(tempId, formalId)**：迁移置空 slot + `replacements.set(tempId, formalId)`（幂等，重复调用以首笔为准）；
- **生命周期（全保留策略）**：未 retire 的 slot 永不强清——slot 是完整注册审计表，"推导中间垃圾"（持有者已死但未迁移的条目）钉活到 Registry.dispose。这是知情权衡：JS 无法感知强可达对象的持有者消亡，量级控制靠源头减量而非注册侧清理；

  **"推导中间垃圾"实例（builder 阶段先建 fieldRef、再被 invokeExpr 摘取的场景）**：源码 `foo.bar()`——IR 转换器处理属性访问 `foo.bar` 时，**先**把它建为 `ArkInstanceFieldRef`（此刻 foo 类型未知 → FieldSignature 探测 formal miss → 登记 temp field 空间）；**随后**发现它是被调用的 callee，摘取 base 和签名转建 `ArkInstanceInvokeExpr`，fieldRef 本体被丢弃、不进入 IR。这个已死 ref 的 temp 行再没有持有者来迁移——就是典型的"持有者已死但未 retire"中间垃圾，全保留策略下钉活到 dispose。
- **可观测性**：统计同步即精确，三数自洽 `totalRegistered = liveCount + retiredCount`。

**举例：temp → formal 切换全流程**：

```typescript
// ───────── 文件：types.ets（定义处） ─────────
export class Foo {                    // builder 期：Foo 注册为 formal ClassSigID = 9
    bar(): void {}                    // builder 期：bar 注册为 formal MethodSigID = 42
}

// ───────── 文件：main.ets（调用处一） ─────────
declare const foo: Foo;               // builder 期：foo 的类型来源未解析
foo.bar();                            // builder 期：为此行构造 invoke expr #1 → route(stubSig)：formal 探测 miss → 登记 temp，分到 tempMethodSigID = 7
foo.bar(); // 调用2次                  // builder 期：为此行构造 invoke expr #2 → 恰好复用同一个 stubSig 实例 → register 的 symbol 幂等检查发现"这个实例登记过"→ 直接复用 tempId = 7（不占新 slot）
                                      // ── 推导期（两条时间线在此汇合）──
                                      // #1：解析出 foo: Foo → expr#1.setMethodSignature(realSig)：
                                      //     formal 命中 42 → retireWithReplacement(7, 42)（slot[7] 置空 + replacements[7]=42）→ #1 从此 methodSigID=42，取签名直达 formal
                                      // #2（之后任意时刻）：调 getMethodSignature()：
                                      //     自己 methodSigID=-1 miss
                                      //     → tempMethodSigCanonicalizer.get(7) 发现 slot 已空
                                      //     → 翻账本 getReplacement(7) 得 42 → 返回 formal 实例
                                      //     → 顺手物化自己的 methodSigID=42（tempSigID 保留作"曾 temp"审计痕迹）
                                      //     → #2 不需要任何主动迁移代码就完成切换，且从此与 #1 一样直达 formal
```

**与 SignatureCanonicalizer 的关系——为什么不继承、也不组合**（两类形状相似：稠密 ID + 数组下标取回 + symbol 幂等，但这是**形态约定**的相似，不是**行为机制**的复用）：

**为什么不 extends**——语义模型相反，is-a 不成立：

| 维度 | SignatureCanonicalizer（formal） | TempSignatureCanonicalizer（temp） |
|---|---|---|
| 去重语义 | **值语义**：值相同（hash+equals）→ 同一 ID、同一 canonical 实例 | **实例语义**：同一实例幂等复用 ID，**值相同的不同实例各占一个 slot、绝不合并**（spec.md 明文要求） |
| 泛型约束 | `<S extends Canonicalizable>`（必须实现 getHashCode/equals） | `<S extends object>`（**不要求**——temp 不做值去重，这两个方法对它无意义） |
| ID 生命周期 | 分配后**永久有效**（驱逐只删 model，签名条目保留） | **以迁移为终点**：retire 置空 slot + replacements 记账 + 三数自洽统计 |
| 幂等依据 | 哈希表探测（hash+equals） | symbol 实例属性直读 |

实例语义是必须的：unclear 签名的值本身不完整（declaringFile=DEFAULT），按值合并会把不同来源的 stub（两个类各自 `extends F` 产生的同值 ClassSignature）折叠成同一个 tempId——而迁移是**按实例**记账的（retire 的是"这个 stub 对象"），错误合并会让一次迁移误伤其他持有者。此外硬继承的后果是所有继承来的 API 全部语义错乱（`getId` 盲写分配 vs `register` 实例幂等、`size` 唯一值数 vs 未迁移 slot 数、`clear` 行为不同——同名不同义，全部要 override）。

**为什么也不组合 Canonicalizer（objectIdentity 策略）**——技术上可行，但不划算。逐项映射账：
- `register`/`getExistingTempId`/`clear` 三者可委托（objectIdentity 的 symbol 幂等机制逐行相同，Canonicalizer.ts:243-262/264-270/191-216）；
- **`get(id)` 存在核心冲突**——retire 后必须返回 undefined，而 `Canonicalizer.list[id]` 永久持有实例且无置空 API，只能自维护 `retiredSet` 让每次 get 变成 `retiredSet.has(id) + get` 双跳；
- `retire`/`getReplacement`/`liveIds`/三数统计在 Canonicalizer 上无任何对应，全部自有一一硬继承的语义错乱同构。

> Note: 这一点还需要再看看，我感觉还是可以组合Canonicalizer的

---

## 2. Registry 的核心配套机制

// TODO: 周边架构改造的部分放到第4章，第4章的定位是做的其他边缘辅助类的修改，不是主要架构改动的核心内容。 →（已落实：SceneBuilder 构建流程拆分 / StageStatistics 统计 / CanonicalizerValidator 校验器 / 两个典型场景举例共四节挪入第 4 章；n:1 重载注册专题挪入第 3 章 ArkMethod 节。本章只保留 Registry 核心配套机制。）

### 2.1 ID 0 = DEFAULT 签名保留位

Registry 构造时 `internDefaults()` 把 5 类 UNKNOWN 常量签名各自 intern 到 ID 0（Registry.ts:553-560），`models[0]` 恒为 undefined（不对应任何模型）：
- DEFAULT_FILE_SIGNATURE
- DEFAULT_CLASS_SIGNATURE
- DEFAULT_NAMESPACE_SIGNATURE
- DEFAULT_METHOD_SIGNATURE
- DEFAULT_FIELD_SIGNATURE

作用：

- 所有"未解析/占位"语义统一指向 DEFAULT，签名值域不会坍缩出意外 ID；
- DEFAULT 判断变成一次数字比较（`sigID === 0` / `isDefault()`），isUnclear 的 ID 快判依赖它（§3.1）；
- `getInstance()` 重建后自动重新初始化 DEFAULT，保证 dispose 后系统立即可用。

### 2.2 project / SDK 文件的 ID 边界

**问题**：`getFiles()`（项目文件）与 `getSdkArkFiles()`（SDK 文件）需要区分两类文件。修改前靠两个独立 Map（filesMap / sdkArkFilesMap）；修改后全部文件在同一个 fileSigCanonicalizer 里，需要新的切分手段。

**方案**：`markProjectFileBoundary()`（Registry.ts:207-246）——SDK 构建阶段结束时（此后注册的都是 project 文件）记下当时的 `fileSigCanonicalizer.size()` 作为边界 `firstProjectFileSigID`。此后：

- `[1, boundary)` = SDK 文件，`[boundary, size)` = project 文件（ID 0 是 DEFAULT，两边都不属于）；
- `isProjectFileID(id)` / `isSdkFileID(id)` 只做一次数字比较；
- `getFiles()` / `getSdkArkFiles()` 从逐文件 `filter(isProjectFile)` 变为区间取模型。

**正确性前提**：构建时序上全部 SDK（含 oh_modules 依赖包）先于 project 文件注册（ModuleBuilder.prepareSdks → buildBasicInfo → genArkFiles），因此边界单调。

**为什么不拆分独立存储**：构建期和推导期需要频繁地根据Signature或ID来查找model，合并是方便查找；如果拆分成2个表，需要2个独立的属性来存各自的id，或者1个id在2个表中进行查找，增加查询复杂度。

> Note: 
> - 当前只对file做了这个标志位的记录，用于区分 sdk 和 project 文件，class、namespace、method等没有做此标志位记录，后续考虑对所有表进行sdk的位置记录

### 2.3 namespace 为什么不需要 temp 表

tempFile 是身份根，没有 declaring，`isUnclear()` 恒 false，天然不可能 unclear。

代码中不存在 tempNamespace 空间是有结构性保证，论证分三层：

1. **唯一入口检查**：temp 空间的唯一写入 API 是 `TempSignatureCanonicalizer.register()`。全仓库 register 调用点**全部**针对 ClassSignature / MethodSignature / FieldSignature 三类：ClassType/FunctionType/LexicalEnvType/EnumValueType 构造器的 unclear 分支（Type.ts:677/541/1180/1259）、FieldSignature.setDeclaringFields 的 unclear **class** 分支（ArkSignature.ts:609）、MethodSignature 构造器的 unclear **class** 分支（ArkSignature.ts:887）、AbstractInvokeExpr.route / AbstractFieldRef 的 miss 分支。**不存在任何一条路径把 NamespaceSignature 传给 register**；
2. ** unclear 的根源不适用于 ns**：unclear 的定义是"declaringFile 未知"（Builtin stub、extends 目标未解析）。而 namespace 的声明链总是从**真实的 ArkFile** 出发——builder 创建 ns 时文件已知，直接传 FileSigID（SigID 构造重载）；Builtin 造 stub 只造 ClassSignature（declaringFile=DEFAULT），从不造 ns stub。ClassSignature / MethodSignature 里挂的也是 `declaringNamespaceSigID`（数字），不会把 ns 对象卷进 unclear 链；
3. **唯一的例外分支被刻意"仅标记"**：FieldSignature 值对象构造若传入 unclear 的 NamespaceSignature，该分支只置 `declaringNamespaceSigID = -1`（标记），**不登记 temp**（ArkSignature.ts:614-619 注释原文："no temp registration — the temp namespace space never had a production registrant; the unclear-ns form is a marking-only shape"）。需要取回时由调用方自持签名实例。

### 2.4 Registry 上的配套存储：customComponentMap 与 sdkGlobalMap 多值表

- **`customComponentMap: Map<string, ClassSignature>`**：@Component 组件简单名 → 类签名。迁到 Registry 的关键原因：模块卸载（disposeModule）后条目仍需存活（ViewTree 建叶子节点要解析签名），生命周期必须独立于模块，挂在全局 Registry 上最自然。
- **`sdkGlobalMap: Map<string, ArkExport[]>`**（Registry.ts:84-93）：SDK 全局符号**多值表**。修改前是 Scene 上的 `Map<string, ArkExport>` 单值表——`interface Object`（lib.es5）与 `declare var Object: ObjectConstructor` 这类**同名多实体**互相覆盖，只能靠 copyMembers 把成员物理灌进首实体（污染模型）。修改后同名实体按登记序全部保留在列表里（entry[0] 保持旧单值 first-win 语义），成员留在各自真实声明类上，探测层（`getSdkGlobalMemberClasses`）逐实体查找，成员签名自然归属真实声明文件。典型消费场景见 §4.4 例二。

### 2.5 Registry 的依赖图约束：为什么禁止值 import 模型类

// TODO: 这个也看不懂，放到单独小节介绍，不在这里介绍。

**这条约束的背景是一个真实翻车案例**（Registry.ts:96-102 注释记录）：

- Registry 处于模块依赖图的**最底层**——所有模型类（ArkClass/ArkMethod/ArkFile...）、Type、推导器都要 import 它。因此它自己**不能反向 import 模型类**，否则成环；
- 麻烦在于 TypeScript 的"纯类型 import"（只用作类型标注）本来会被编译器剥离、不产生运行时依赖。但 **esbuild 打包时会把某些纯类型 import 真实化**（保留成真实的运行时 import）；
- 一旦 Registry → ArkClass 的值 import 边成立，ESM 加载时 Registry ↔ base/Type ↔ cpp/ModelUtils → cpp/base/Type（extends 未完成类）这个环的**进入方向被翻转**，实测触发 `Class extends value undefined` 崩溃（cpp/base/Type extends 的基类还没加载完）；
- **解法**：Registry 的 SDK 查询方法（getSdkGlobalMemberClasses 等需要判别实体类型的地方）一律不 import ArkClass/ArkNamespace/Local，改用**结构判别 helper**——`isArkClassEntity(e)` 检查对象上是否有 `getClassSigID` + `getFields` 方法、`isArkNamespaceEntity` 检查 `getNamespaceSigID` + `getNamespaces`（Registry.ts:104-112），duck-typing 判型，零 import。

### 2.6 Registry / Canonicalizer 新增 API 清单

**SignatureCanonicalizer\<S\>（正式签名空间的基础 API）**：

| API | 用途 | 内部使用情况 |
|---|---|---|
| `getId(sig): number` | intern：已注册返回既有 ID，未注册**分配新 ID**（写路径专用） | builder 期签名注册的主力（ArkMethod/ArkClass/ArkField/ArkFile/ArkNamespace 的 setSignature 族）、ArkSignatureBuilder |
| `getExistingId(sig): number` | 只读查询：未注册返回 -1，**不改任何状态** | 查询热路径主力（Scene.getFile/getClass/getMethod、Registry.getArkXxxBySig、归属初筛） |
| `get(id): S \| undefined` | ID → canonical 签名实例（数组下标） | 所有 getter 的取回通道；DEFAULT 获取（get(0)） |
| `signatureEquals(a, b)`（模块级导出函数） | **身份值比较（工作项 D 新增）**：缓存 hash 先比（不等比较在此短路）+ equals 终审（相等比较必然执行，canonical 实例首行引用短路）——判等协议与 canonicalizer 探测同构，只跑一遍；不依赖 Registry（区别于 ID 判等：-1 哨兵对未注册签名双向误判，getId 版另有盲写副作用） | 3 处：TypeInference.isSameType、ModelUtils.matchType×2 |
| `size() / getStats() / clear()` | 容量 / 哈希表统计（`CanonicalizerStats` 已导出供 StageStatistics 消费）/ 重置 | 统计报告、dispose |

**SignatureModelCanonicalizer\<S, M\>（追加的模型存储 API）**：

| API | 用途 | 内部使用情况 |
|---|---|---|
| `setModel(id, model)` | 在既有 ID 上挂模型（要求先 intern） | ArkClass.addMethod（终点注册）、ArkMethod.registerImplModelWithArbitration、Registry.registerXxx 族 |
| `getModel(id): M \| undefined` | ID → 模型（O(1)） | **全框架最热的查询**——所有 getDeclaringArkFile/getDeclaringArkClass/getFiles/getMethods 的底层通道 |
| `removeModel(id)` | 置 undefined（ID 与签名保留 = 驱逐态） | Registry.removeXxx 族、disposeModule |
| `getModels(): M[]` | 过滤 undefined 收集全部模型（每次新建数组） | getFiles/getClasses/getMethods/getNamespaces 平面遍历、SDK 推断遍历 |
| `clearModels()` | 仅清模型、签名表与 ID 稳定 | （预留：推导后重建模型的场景） |


**TempSignatureCanonicalizer\<S\>（temp 索引表 API）**：

| API | 用途 | 内部使用情况 |
|---|---|---|
| `register(sig): number` | 登记（同实例幂等复用 ID） | Type 构造 unclear 分支、FieldSignature/MethodSignature 值对象构造、InvokeExpr/FieldRef route |
| `get(id): S \| undefined` | 取 slot；undefined = 已迁移（该查 getReplacement） | 三级查的第 2 级 |
| `getExistingTempId(sig): number` | 查对象的 tempSigID 不登记（symbol 属性） | 懒加载缓存路径（InvokeExpr/FieldRef 恢复） |
| `retireWithReplacement(id, formalId)` | 迁移置空 + 记账 | 签名 setter 的迁移触发（ClassType.setClassSignature、route() formal 命中分支） |
| `getReplacement(id): number` | 查迁移账（-1 = 无记录） | 三级查的第 3 级（共享持有者直达 formal） |
| `size() / totalRegistered() / retired() / getStats()` | live / 历史 / 已迁移计数（三数自洽） | `--stats` 报告、checkTempSignatureCompleteness |
| `registeredIds() / liveIds()` | 全区间审计视图 / 遗留视图 | TempSpaceDiagnose 诊断工具 |

**SignatureCanonicalizerRegistry（单例门面 API）**：

| API | 用途 | 内部使用情况 |
|---|---|---|
| `getInstance() / dispose()` | 单例获取 / 全清（Scene.dispose 与 clear 调用） | 全框架 |
| `getXxxId(sig)`（×5） | 各空间只读 ID 查询（@internal 实例方法） | 工具层散点 |
| `getArkXxxById(id)` / `getArkXxxBySig(sig)`（×5 各 2 个） | ID 直查 / 签名只读查模型 | 查询热路径（取代旧 Scene 的 Map.get） |
| `registerFile/registerClass/registerMethod/registerNamespace/registerField`（静态） | 模型注册（含 id>0 守卫） | 各模型 addXxx 终点 |
| `removeFile/removeClass/removeClassModel/removeMethod/removeNamespace/removeField`（静态） | 模型驱逐（removeClass 顺带 customComponentMap；removeClassModel 不动它） | disposeModule、ArkClass.removeMethod 等 |
| `registerCustomComponent / unregisterCustomComponent` | 组件名表维护 | ArkClassBuilder、removeClass |
| `markProjectFileBoundary / getFirstProjectFileSigID / isProjectFileID / isSdkFileID` | project/SDK ID 边界（§2.2） | buildSdkStage、loadModule、getFiles/getSdkArkFiles |
| `getSdkGlobal / getSdkGlobals / getSdkGlobalMemberClasses / getNamespacedSiblingClasses`（静态） | SDK 全局符号单值/多值/成员类/兄弟 ns 类查询 | 推导器 40+ 处直连（TypeInference/IRInference/ModelUtils/ValueInference/RTA/PagBuilder...） |
| `getTempSpacesStats / settleTempSpaces`（静态） | temp 三空间统计快照（settle 的 async 签名仅兼容保留） | StageStatistics.recordSignatureStats、Scene.settleTempSignatureStats |

// （原 §2.8 举例 / §2.9 SceneBuilder / §2.10 StageStatistics / §2.11 CanonicalizerValidator 四节已挪入第 4 章 §4.4/§4.1/§4.2/§4.3。）

---

## 3. 适配新架构的改造（层级从高到低）

### 3.1 ArkSignature — 签名类（前提，先于一切模型介绍）

签名类是整个 ID 化的前提：**模型存的 ID 就是签名的 ID，签名不稳则一切皆休**。本节先讲签名怎么改的，后面各 model 节的 ID 字段才有意义。

**表 1：字段/数据结构的修改**（ArkSignature.ts，495 → 1123 行）

| 签名类 | 修改前 | 修改后 | 必要性 |
|---|---|---|---|
| FileSignature | `hashcode` 字段（供 toMapKey） | 仅 `hashCode`（32 位 MurmurHash3，构造时算好缓存）——旧 `hashcode` 已删（**工作项 B**，§5.1），`toMapKey()` 改为 `toString()` 身份投影并标 @deprecated | canonicalizer 查找走数字 hash；toMapKey 为无碰撞身份投影 |
| NamespaceSignature | `declaringFileSignature: FileSignature` + `declaringNamespaceSignature: NamespaceSignature` 两个**对象引用** | `declaringFileSigID: number` + `declaringNamespaceSigID?: number` 两个**数字** | 对象引用 → ID：签名树不再嵌套持有对象图，hash 可以一次算全 |
| ClassSignature | 同 NamespaceSignature | 同上（`declaringFileSigID` + `declaringNamespaceSigID`） | 同上 |
| FieldSignature | `declaringSignature: BaseSignature` 单个对象引用（类或 ns 侧二选一） | **三字段**：`declaringClassSigID?` / `declaringNamespaceSigID?`（undefined = 另一侧声明；-1 = unclear）+ `declaringClassTempSigID?`（temp 侧引用） | 字段可声明在类或命名空间里，两个 ID 空间要分开存；unclear 类要走 temp |
| MethodSignature | `declaringClassSignature: ClassSignature` 对象引用 | `declaringClassSigID: number`（-1 = unclear）+ `declaringClassTempSigID?: number` | 方法只声明在类里，单侧即可 |
| AliasClassSignature | aliasName 只是展示名，不参与身份 | aliasName 升格为身份维度（`aliasHashCode` + equals 含 aliasName）；构造器**双注册**（intern 自身 + 把 origin 类的 model 也挂到 alias ID，多 SigID 单 model） | 修改前 alias 与 origin 签名值相同会误合并；升格后 by-alias 查询能直达 model |
| 全部 5 类 | 无 hash 缓存 | 构造时 `hashCode` 缓存到 readonly 字段 | §1.4 Layer 1 |

**表 2：接口/方法的修改**

| 接口 | 修改前 | 修改后 |
|---|---|---|
| 构造函数 | 只能传签名对象 | **新增 SigID 重载**（推荐）：`new ClassSignature(name, fileSigID, nsSigID?)` 等。值对象重载保留但 deprecated，行为分化：NS/Class 重载对未 intern 的 declaring **fail-fast 抛异常**（`requireExistingId`，ArkSignature.ts:43-52——"值对象重载不是查询路径"，静默 intern 会污染 formal 空间产生无 model 空洞）；Field/Method 重载自动路由——unclear declaring 登记到 temp，clear 的解析 formal ID |
| `DEFAULT` | `static` 字段模块加载时直接 new | **lazy getter**，从 registry `get(0)` 取（单例保证 + 避免 Type.ts 循环依赖） |
| `getDeclaringXxxSignature()` | 返回自己的字段 | 经 Registry 按 SigID 反查；stale（模型被驱逐）时降级返回 DEFAULT + error log；MethodSignature/FieldSignature 是**三级查 + 惰性物化**（formal → temp slot → 替换记录，§1.6） |
| 身份判定 | 靠 `toString()` 字符串比较（isMatch / fieldSignatureCompare 等自由函数） | 新增 `getHashCode()` / `equals()`（从快到慢短路）；**可变字段排除**：MethodSignature 的 hash 不含 returnType、FieldSignature 不含 type（推导原地改这些字段，参与 hash 会导致 ID 漂移） |
| `isUnclear()` | 无 | 新增：判断"声明链上文件来源未知"（最终追溯到 declaringFileSigID === 0），决定签名走 temp 还是 formal |
| `toMapKey()` | 4 类有，FieldSignature 缺失 | commit 时：FieldSignature **新增**（declaringSig + fieldName + staticFlag，排除可变 type）。review 工作项 B 后：5 类全部**标 @deprecated**（生产消费者归零——值比较走 signatureEquals、索引走 canonicalizer，保留仅为 D11 对外兼容）；FileSignature 实现改为 toString 身份投影 |
| `setClassName()` | 可原地改名 | deprecated（改名破坏缓存的 hash，应新建实例） |

**表 3：API 兼容性**

| deprecated API | 替代方案 | 内部调用情况 |
|---|---|---|
| `NamespaceSignature` / `ClassSignature` 值对象重载 | SigID 重载 | **0 处**（src 内全部 `new` 已是 ID 形式），可安全移除 |
| `FieldSignature` 值对象重载 | class-ID 重载 / namespace-ID + `true` 重载 | **18 处内部仍在用**（ArkValueTransformer/ArkIRTransformer/IRInference/Ref/PTAUtils/cpp 侧）——**不是纯兼容残留**：unclear 签名正是经此路由到 temp canonicalizer（"Object path"），是内部基础设施，不能贸然删除 |
| `MethodSignature` 值对象重载 | ClassSigID 重载 | **19 处内部仍在用**（Builtin/ArkValueTransformer/ArkSignatureBuilder/IRInference/cpp 侧）——同上，Builtin stub 池依赖此路由 |
| `ClassSignature.setClassName()` | 新建实例 | **0 处** |

### 3.2 Scene 层（Scene.ts，1769 → 1596 行）

// TODO: 改动前的介绍太简单，需要围绕ID化改造的情况来有针对性的描述改动前的每项的痛点，以及改动的必要性。

**改动前逐项痛点（围绕 ID 化）**：

- **索引层**：5 个字符串 key 的 Map（filesMap/classesMap/methodsMap/namespacesMap/sdkArkFilesMap）——每个 key 都是一份拼接字符串；签名对象多实例化（88+ 处 `new`），同一逻辑签名值不同实例，`===` 比较有 6 处已知缺陷；methodsMap 与模型的真实状态会漂移，才需要 `getMethodsMap(refresh)` 这种"强制重建索引"的补丁接口；
- **关系层**：模型互指靠对象指针，Scene 还要给每个模型做 `setScene()` 级联传播（模型要拿 scene 才能反查兄弟模型）；
- **流程层**：构建编排全部内联在 Scene，`inferTypes` 每轮对 filesMap 做全量拓扑排序（`sortByDependency`），构建工作态构建完不释放；
- **生命周期**：dispose 只清静态缓存，单测之间 Scene 的 Map 残留互相污染。

// TODO: 拆分表格，分为1张Scene的字段的修改，1张scene的接口的修改，增加1张scene的API兼容性情况

**表 1：字段的修改**

（修改前的完整存储形态：项目文件 `filesMap: Map<string, ArkFile>`、类/命名空间/方法/字段各一个同构 Map（key = `signature.toMapKey()` 拼接串）；SDK/三方文件**再单独一个** `sdkArkFilesMap`——"文件"概念拆在两个容器里，`getFiles()` 与 `getSdkArkFiles()` 各查各的（§1.1）；字符串 key 的开销机理见 §1.4。）

| 字段 | 修改前 | 修改后 | 必要性 |
|---|---|---|---|
| `filesMap/classesMap/methodsMap/namespacesMap` | `Map<string, Model>`，key = toMapKey() 拼接串 | **全部删除** → Registry 4 个 canonicalizer | 字符串重复分配 + 拼接开销 + 索引漂移，ID 化的原始动机 |
| `sdkArkFilesMap` | `Map<string, ArkFile>`（SDK 文件单独一份） | 删除 → 与 project 文件同空间，按 ID 边界切分（§2.2） | 同一文件只会误入其中一个 Map 的隐患消除 |
| `sdkGlobalMap` | `Map<string, ArkExport>` 单值 | 迁 Registry 并**多值化**（§2.4） | 同名多实体覆盖问题 |
| `customComponentMap` | Scene 字段 | 迁 Registry（模块卸载后存活） | 生命周期与模块解耦 |
| 构建工作态（ohPkgContentMap / baseUrl / projectFiles / globalModule2PathMapping 等十余个） | 构建完成后驻留 Scene | 迁 **SceneBuilder**，构建入口结束 `releaseSceneBuilder()` 释放 | 大工程的工作态可达数十 MB，不该陪 Scene 活一辈子 |
| （新增）`activeBuilder: SceneBuilder` | — | 构建期一次性上下文（§4.1） | 承接上面的迁移 |
| （新增）`builtFileOrder: number[]` | — | DFS 后序 = 严格拓扑序，推断期零排序的事实源 | 取代每轮 sortByDependency |
| （新增）`stageStatistics` + exit hook | — | 阶段统计（§4.2） | 性能可观测 |

**表 2：接口的修改**

| 接口 | 修改前 | 修改后 |
|---|---|---|
| `getFile/getClass/getNamespace(sig)` | `xxxMap.get(sig.toMapKey())` | `registry.getArkXxxBySig(sig)`（getExistingId + getModel，只读不 intern） |
| `getMethod(sig)` | methodsMap 字符串查 | 同上 fast path + **声明类内遍历兜底**（闭包重建的签名可能未注册为 model），兜底**只读不回填**（查询路径不许写） |
| `getFiles()/getSdkArkFiles()` | 遍历对应 Map / filter | ID 区间切分取模型（§2.2），getSdkArkFiles 显式排除 ID 0 |
| `getMethods()` | 遍历 methodsMap | methodSigCanonicalizer 平面遍历收集 |
| `getMethodsMap(refresh)` | refresh=true 全量重建索引 | **整个方法删除**——canonicalizer 是唯一事实源，ID 稳定无需 refresh |
| `buildBasicInfo()/genArkFiles()` | 内联配置解析 + SDK 构建 + 文件 DFS | 分别委托 `SceneBuilder.parseProjectConfigs()+buildSdkStage()` 与 `buildProjectFiles()+buildAllMethodBodies()`；`collectAllMethods()` 私有遍历删除，改 `SceneBuilder.forEachProjectMethod`（canonicalizer 平面遍历） |
| `inferTypes()` | 每轮 `sortByDependency(filesMap)` 全量拓扑排序 | 正序遍历 `builtFileOrder`（被依赖文件先推）；收尾 `checkTempSignatureCompleteness`（temp live>0 告警）+ 可选 `CanonicalizerValidator.validateAll()` + 三 dispose + `recordSignatureStats('post-infer')` |
| `dispose()` | 清 6 项静态缓存 | 新增 `disposeClassMap()`、exit hook 摘除、**`Registry.dispose()`**、`ArkSignatureBuilder.clearComponentStubCache()` |
| `clear()` | 清各 Map | `releaseSceneBuilder()` + Registry dispose + **立即 `getInstance()` 强制重建**（DEFAULT 立即可用） |
| `disposeModule()` | 遍历 Map 删模型 | 全部经 `Registry.removeFile/removeNamespace/removeClassModel/removeMethod` 静态方法；新增 field model 驱逐、`removeExtendedClass`（防基类反向引用泄漏）、`setAST(null)` + `clearSourceCode()`（AST/源码随模块卸载释放） |

**表 3：API 兼容性**

| deprecated API | 替代方案 | 内部调用情况 |
|---|---|---|
| `getSdkGlobal(name)` | `SignatureCanonicalizerRegistry.getSdkGlobal()` | **0 处**（src 内 40+ 处全部直连 Registry） |
| `getSdkGlobalMap()` | `Registry.getInstance().sdkGlobalMap` | **0 处** |
| `getMethod(sig, refresh?)` 双参 | 单参版（refresh 无效） | **0 处** |
| `inferSimpleTypes()` | `inferTypes()` | **0 处**（存量调用仅 tests/） |
| `getClassMap()` | `getClasses()` | **0 处**（连带 3 个私有 helper 成死链） |
| `getGlobalVariableMap()` | 基于 canonicalizer 重实现 | **0 处**（连带 4 个私有 helper） |
| `inferTypesOld()`（历史遗留） | `inferTypes()` | **0 处** |

### 3.3 ArkNamespace（385 → 656 行）

// TODO: 同scene的3张表格

**表 1：字段的修改**

| 字段 | 修改前 | 修改后 | 必要性 |
|---|---|---|---|
| `declaringArkFile` / `declaringArkNamespace` / `declaringInstance` | 三个**对象引用** | `declaringFileID: number`（-1 哨兵）+ `declaringNamespaceSigID?: number`（undefined = 顶层），getter 经 Registry 反查 | ID 化核心：对象指针 → 数字 |
| `namespaceSignature` | 签名对象引用 | `namespaceSigID: number`（`setSignature` 注册点赋值） | setter 即注册（§1.5） |
| `defaultClass` | ArkClass 对象引用 | `defaultClassSigID` | 同上 |
| `namespaces: Map<string, ArkNamespace>` | 名字 key 的 Map | `topNamespaceSigIDs: Int32Array + count`（懒初始化、2x 扩容、swap-remove 删除） | Map per-entry ~70-90 字节 → Int32Array 4 字节/项；无子元素时不分配 |
| `classes: Map<string, ArkClass>` | 名字 key 的 Map | `topClassSigIDs: Int32Array + count` | 同上 |
| `sourceCodes/lineCols` | 源码片段数组 | 仅 `originFullPositions`（源码统一存 ArkFile，1.0.91 起的既有方向） | 非本次重点 |

**表 2：接口的修改**

| 接口 | 修改前 | 修改后 |
|---|---|---|
| 构造函数 | 无参 `new ArkNamespace()` + setter 注入 | **ID 注入重载** `new ArkNamespace(declaringFileID, nsSigID?, sig?)`；`setSignature` 是注册点（intern + 首建注册；model 缺失的错误态**故意不补挂**，交 Validator N3 规则暴露，ArkNamespace.ts:293-302） |
| `getDeclaringArkFile()` | 返回字段 | Registry 按 declaringFileID 反查 |
| `getNamespace(sig)` | 按 name key 查 namespaces Map | **三步**：① 签名的 declaringNamespaceSigID 直比本 ns SigID（O(1) 归属初筛，不是我的直接 null）→ ② canonicalizer 值查 → ③ 顶层 SigID 索引校验（防 canonicalizer 里有但不是我直接子级） |
| `getNamespaceWithName(name)` | Map.get(name) | 拼"本容器归属签名"（`new NamespaceSignature(name, 本fileID, 本nsID)`）走 canonicalizer 直查——签名归属是唯一真相 |
| `getNamespaces()/getClasses()` | 返回 Map values | 遍历 SigID 数组 + getModel 收集 |

**表 3：API 兼容性**

| deprecated API | 替代方案 | 内部调用情况 |
|---|---|---|
| 无参构造 `new ArkNamespace()` | ID 注入构造 | **0 处** |
| `setDeclaringArkFile(f)` | `setDeclaringFileID(id)` / ID 注入构造 | **0 处** |
| `setDeclaringArkNamespace(ns)` | `setDeclaringNamespaceID(id)` | **0 处** |
| `getCode/setCode/getCodes/setCodes/addCode`（1.0.91 历史族） | 源码统一在 ArkFile | **0 处** |
| `getLine/setLine/getColumn/setColumn/getLineColPairs/setLineCols`（1.0.91 历史族） | `get/setOriginFullPositions()` | **0 处** |

// TODO: 不同文件的namespace合并的处理的修改

**不同文件的 namespace 合并处理**（TS 允许同名 namespace 跨文件/跨声明块声明，语义上是同一实体）：

- 修改前：`addNamespace(ns)` 按名字查 `namespaces: Map<string, ArkNamespace>`——同名则把新 ns 的 classes/namespaces 逐个搬进旧 ns（合并），namespaces Map 的 value 被替换或保留取决于调用方；
- 修改后（ArkNamespace.ts:103-113）：`addNamespace` 查重改走 `getNamespace(ns.getSignature())`（上面的三步法，签名值比较，杜绝"名字相同但归属文件不同"的误合并）——命中 existing 则 `existing.addArkClass(cls)` / `existing.addNamespace(ns)` 递归合并子内容后 **return（不追加 SigID 到本容器索引）**——合并的子元素归 existing 管；未命中则 `addTopNamespaceSigID` + `Registry.registerNamespace(ns)`。
- 关键差异：合并判定从"名字相同"变为"签名值相同"（名字 + 归属文件 + 父链全等才合并，与 TS 块级作用域语义一致）；且新 ns 自身的 SigID 在合并分支中不再入索引，索引里每个 SigID 唯一对应一个活模型，不会出现两个 SigID 指向同一逻辑实体的双记账。

### 3.4 ArkClass（777 → 1531 行，改动最大）

// TODO: 同scene的3张表格

**表 1：字段的修改**

| 字段 | 修改前 | 修改后 | 必要性 |
|---|---|---|---|
| `declaringArkFile` / `declaringArkNamespace` | 对象引用 | `declaringFileID: number` + `declaringNamespaceSigID?: number` | ID 化核心 |
| `classSignature` | 签名对象引用 | `classSigID: number`（`setSignature` 注册点赋值并缓存，ArkClass.ts:395-404） | setter 即注册 |
| `methods/staticMethods: Map<string, ArkMethod[]>` | 名字 key 的 Map，重载数组 | `methodNameIndex/staticMethodNameIndex: Map<string, number[]>`（**名字 → MethodSigID 数组**）。**2ea2421b 从 SigID 平铺 Int32Array 改回名字索引**——方法名不足以构造签名（身份含参数列表），名字查询（getMethodWithName 族）必须按名索引 | 兼顾两类查询：按名（索引）与按签名（canonicalizer 直查）；`getMethods` 顺序稳定性刻意维护（非重载语言 set 保插入序、重载语言 isMatch 原位替换） |
| `fields/staticFields: Map<string, ArkField>` | 名字 key 的 Map | `topFieldSigIDs/topStaticFieldSigIDs: Int32Array + count` | 字段名可拼签名，直接 SigID 索引 |
| `extendedClasses: Map<string, ArkClass>` | 名字 key 的子类反向引用 Map | `extendedClassSigIDs: Int32Array`（`getExtendedClasses()` 每次重建 Map 视图兼容旧 API；热路径用 `getExtendedClassList()` 免重建） | 反向引用 ID 化 |
| `defaultMethod/instanceInitMethod/staticInitMethod` | 三个 ArkMethod 对象引用 | 三个 MethodSigID（undefined = 无） | 同上 |
| `heritageClasses` | `Map<string, heritageClassWithInfo>` | **刻意不 ID 化，保持原样** | 回填依赖类型推断、key 是源码名字，时序复杂（design.md D5 明确本轮不动） |

**表 2：接口的修改**

| 接口 | 修改前 | 修改后 |
|---|---|---|
| 构造函数 | 无参 + setter 注入 | ID 注入重载 `new ArkClass(declaringFileID, nsSigID?, classSig?)`；`setSignature` 三态处理：新值首建注册 / 驱逐态恢复补注册 / 他 model 已持有不覆盖 |
| `getDeclaringArkFile()` | 返回字段 | Registry 按 declaringFileID 反查 |
| `getField(sig)` | 按 name key 查 fields Map | 按传入签名整体身份 canonicalizer 直查 + **归属守卫** `fld.getDeclaringClassID() === this.classSigID`——**防他类字段越界命中，无守卫时实测 100% 越界**（ArkClass.ts:569-584 注释） |
| `getFieldWithName/getStaticFieldWithName(name)` | Map.get(name) | 现场构造临时 `FieldSignature`（含本类 SigID）canonicalizer 直查（miss 即 null）——已知热路径分配开销（bug #17） |
| `getMethod(sig)` | methods Map 按名查 + isMatch 遍历 | **三段式**：① canonicalizer 值查 + 归属守卫（fast path）→ ② 类内遍历 `findMatchingMethod`（isMatch 兜底，闭包重建签名场景）→ ③ 埋点统计（模块级 `getMethodFallbackStats` 观测 fast path 命中率） |
| `addMethod(method, originName?)` | 名字 + originName 双键索引 | **删除 originName 参数**（见下方嵌套方法专题）；SigID 校验（id ≤ 0 拒绝 + error log）→ `setModel` 无条件注册（合并链终点胜者）→ **B1 全槽注册**（declareSigIDs 各槽也注册到本方法，body 持有者优先仲裁，§3.6 n:1 专题）→ `updateMethodIndex` |
| `removeMethod(method)` | **按名删除全部同名方法** | **按 SigID 精确删除这一个** + 同步 `Registry.removeMethod`（impl + declare 槽）——语义变化，重载方法不再被误删 |
| `addExtendedClass/removeExtendedClass` | Map set/delete | SigID 数组 append / swap-remove（查重） |

**表 3：API 兼容性**

| deprecated API | 替代方案 | 内部调用情况 |
|---|---|---|
| 无参构造 `new ArkClass()` | `(declaringFileID, nsSigID?, classSig?)` | **0 处** |
| `setDeclaringArkFile(f)` | ID 注入构造（注意：src 内 8 处同名调用均为 ArkImport 的**非** deprecated 方法） | **0 处** |
| `setDeclaringArkNamespace(ns)` | 同上 | **0 处** |
| `getStaticFields(classMap)` 双参 | 无参版（classMap 参数史前遗留从未使用；无参版 src 内也 0 调用） | **0 处** |
| `getInstanceInitMethod()` / `getStaticInitMethod()`（兜底返回 `new ArkMethod()` 的非空版） | `getInstanceInitMethodOrNull()` / `getStaticInitMethodOrNull()` | **0 处**（兜底里的 `new ArkMethod()` 是 ArkMethod 无参构造仅存的 2 处内部调用） |
| `getLine/setLine/getColumn/setColumn`、`setCode`（1.0.91 历史族） | FullPosition 族 | **0 处** |

// TODO：不同文件的class合并处理的修改

**不同文件的 class 合并处理**（TS 的 interface 声明合并 / SDK 同名类跨文件增补）：

- 模型层（`ArkFile.addArkClass`，ArkFile.ts:235-246）：查重从"名字 key 存在"变为 `getTopClassByID(arkClass.getClassSigID())`（SigID 直查）；命中 existing 则 `SdkUtils.copyMembers(arkClass, existing)` 把新类的方法/声明签名搬进旧类（合并语义保留）；未命中则 `Registry.registerClass` + SigID 入顶层索引 `topClassSigIDSet`；
- **SDK 全局层的合并策略反转**（SdkUtils.ts:264-316，配合 §2.4 多值表）：修改前同名 interface/类跨文件出现时，用 copyMembers 把后到者的成员物理灌进首实体（成员的 declaring class 被篡改为首实体，enum vs interface 类别冲突时还做 delete+override）；**修改后不再 copyMembers 合并**——各文件的实体全部共存于 `sdkGlobalMap` 多值列表，成员留在各自真实声明类上，探测层（`getSdkGlobalMemberClasses`）逐实体查找，成员签名自然归属真实声明文件。三处场景各自的注释：同名 interface 增补（TS 语义同一实体但不灌成员）、类别冲突（两实体共存多值）、abc 的 attr/interface 挂载分裂（var 侧登记为多值候选）。

// TODO: 补充对function内嵌套class声明的改造处理，举例说明，描述修改前、修改后、以及修改的必要性

**function 内嵌套 class 声明的改造**（新增 `localClassSigIDs` 机制，ArkMethod.ts:988-1012）：

以这段代码为例：

```typescript
function outer() {
    class Local { }
    return new Local();
}
```

- **修改前**：Local 类被提升到文件顶层建模，类名改写成组合名 `Local$outer`（保证全局唯一、不与其他文件的 Local 冲突）。但推导期遇到 `new Local()` 时，只知道裸名字 `Local`——只能做**文件级模糊前缀匹配**：在顶层类表里找所有以 `Local$` 开头的类。问题：① 模糊匹配可能命中其他文件/其他方法的 `Local$xxx`（跨文件同名局部类）；② 全文件扫描性能差；③ 无法表达"inner 函数里能看到 outer 函数的局部类"这种作用域链语义（嵌套捕获场景基本靠运气）；
- **修改后**：构建期 `ArkIRTransformer.classDeclarationToStmts`（ArkIRTransformer.ts:208-219）在声明处调用 `declaringMethod.registerLocalClass('Local', cls.getClassSigID())`——把**裸名 → ClassSigID 的作用域绑定**登记在声明方法上（类模型本身仍以组合名挂顶层，不变）；推导期 `ModelUtils.findLocalClassInMethodChain('Local', currentMethod)`（ModelUtils.ts:438-451）沿 outer-method 链（`getOuterMethod()` 逐层向上）查这个绑定，命中即 `getArkClassById(sigID)` 直达；
- **必要性**：把"模糊前缀猜测"变成"确定性作用域链解析"——与 TS 的词法作用域语义一致（inner 能看到 outer 的 Local，看不到无关函数的 Local）；查找从 O(全文件类数) 的字符串前缀比较变成 O(嵌套深度) 的 Map 查找。配套新增 `LocalClassResolution.test.ts` / `tests/resources/localClass/localClass.ts` 用例。

### 3.5 ArkField（235 → 300 行）

// TODO: 同scene的3张表格

**表 1：字段的修改**

| 字段 | 修改前 | 修改后 | 必要性 |
|---|---|---|---|
| `declaringClass: ArkClass` | 对象引用 | `declaringClassID: number`（-1 哨兵） | ID 化核心 |
| `fieldSignature` | 签名对象引用 | `fieldSigID: number`（`setSignature` 注册点赋值） | setter 即注册 |

**表 2：接口的修改**

| 接口 | 修改前 | 修改后 |
|---|---|---|
| 构造函数 | 无参 + setter 注入 | ID 注入 `new ArkField(declaringClassID, fieldSig?)` |
| `getDeclaringArkClass()` | 返回字段 | Registry 按 ID 反查 |
| `getSignature()` | 返回字段 | 经 canonicalizer 取**规范实例**；stale/未设时 error log + 返回 `FieldSignature.DEFAULT`（错误以"合法但错误"的值扩散而非异常——见 bug 清单相关讨论） |
| `setSignature(sig)` | 直接赋字段引用 | intern + 首建注册 + **防"后 setSignature 者顶替"写穿保护**：`existing ≥ 0`（全局 model 已被别人占住）时不覆盖——注释举了推断期匿名类字段 setSignature 顶替声明类字段真实 model 的实例（ArkField.ts:190-201） |

**表 3：API 兼容性**

| deprecated API | 替代方案 | 内部调用情况 |
|---|---|---|
| 无参构造 `new ArkField()` | `(declaringClassID, fieldSig?)` | **0 处**（Local.ts 的 @example 已修正） |
| `setDeclaringArkClass(c)` | ID 注入构造 | **0 处** |
| `setCode` / `getOriginPosition/setOriginPosition`（1.0.91 历史族） | 源码在 ArkFile / `getOriginFullPosition` | **0 处** |

### 3.6 ArkMethod（820 → 1069 行）

// TODO: 同scene的3张表格

**表 1：字段的修改**

| 字段 | 修改前 | 修改后 | 必要性 |
|---|---|---|---|
| `declaringArkClass` | 对象引用 | `declaringClassID: number`（-1 哨兵） | ID 化核心 |
| `outerMethod: ArkMethod` | 对象引用 | `outerMethodSigID?: number`（≤0 视为无） | 嵌套方法的父链 ID 化 |
| `implSignature: MethodSignature` | 签名对象引用 | `implementSigID?: number`（`setImplementationSignature` 注册点） | §3.6 n:1 专题 |
| `declareSignatures: MethodSignature[]` | 签名对象数组 | `declareSigIDs?: number[]`（`getDeclareSignatures()` 返回**重建副本**防外部改内部数组） | n:1 槽位注册（§3.6） |
| （新增）`localClassSigIDs: Map<string, number>` | 无 | 方法体内局部类 裸名 → ClassSigID 绑定（§3.4 专题） | 确定性作用域解析 |

**表 2：接口的修改**

| 接口 | 修改前 | 修改后 |
|---|---|---|
| 构造函数 | 无参 + setter 注入 | 四参 ID 构造 `new ArkMethod(declaringClassID, implSig?, declSigs?, outerSigID?)` |
| `getSignature()` | 返回 impl 或 declare[0] | 同 + **兜底分支 bug 修复**（2ea2421b）：原兜底调 `this.getName()`，与 `getSignature()` 互递归**栈溢出**——C++ 类构建中断、异常被 try-catch 吞掉后整个 TU 节点静默丢失；改为打印 SigID（ArkMethod.ts:508-515 注释） |
| `setImplementationSignature(sig)` | 赋引用 | intern + 缓存 methodSigID + `refreshCanonicalParameterNames`（实现侧参数名刷新到 canonical 实例——参数名不参与签名身份）+ `registerImplModelWithArbitration`（§3.6 n:1 专题构造期仲裁注册） |
| `setDeclareSignatures(sigs)` | 赋数组 | **只 intern 不注册**（注册延迟到 `ArkClass.addMethod` 终点，防覆盖 builder 合并期需读取的前一个同签名方法，ArkMethod.ts:523-534） |
| `getOuterMethod()/setOuterMethod(m)` | 返回/赋对象 | SigID 反查 / 存对方 methodSigID |

**表 3：API 兼容性**

| deprecated API | 替代方案 | 内部调用情况 |
|---|---|---|
| 无参构造 `new ArkMethod()` | 四参 ID 构造 | **2 处**（ArkClass.ts:1074/1079，均在已 deprecated 的 init 方法兜底内——死链套死链，可随外层一并清理） |
| `setDeclaringArkClass(c)` | 四参 ID 构造 | **0 处** |
| `getOriginalCfg()`（历史） | `getCfg()` | **0 处** |
| `getDeclareLines/getDeclareColumns/setDeclareLinesAndCols/setDeclareLineCols/getDeclareLineCols`、`getLine/setLine/getColumn/setColumn/getLineCol/setLineCol`（1.0.91 位置族） | `get/setDeclareOriginFullPositions()`、`get/setImplOriginFullPosition()` | **0 处** |
| `setCode`（1.0.91） | 源码在 ArkFile | **0 处** |

// TODO: 补充nestedmethod的改造，origin name的改造，举例说明，描述修改前、修改后、以及修改的必要性

// TODO: 这个放到第3章ArkMethod那里 →（已落实：本专题自第 2 章移入。）

**MethodSignature ↔ ArkMethod 的 n:1：impl + declare 槽位双注册**（呼应表 1 的 `implementSigID`/`declareSigIDs` 字段与表 2 的两个 setter 行）：

**问题背景**：一个 ArkMethod 可能同时持有 1 个实现签名（implSignature）和 N 个声明签名（declareSignatures，TS 重载声明 / C++ 声明定义分离），且**同名同参不同返回类型是不同的签名**。所以同一个 ArkMethod 需要注册在多个 MethodSigID 上——这是 method 空间无法像其他 4 类那样 1:1 的原因。

**修改前**：

- 每个签名是一份字符串 key；
- declare 签名注册时机分散，builder 合并期同名方法互相覆盖，最终 map 里哪个签名指向哪个方法取决于注册顺序，容易错；
- `getMethodsMap(refresh)` 需要全量重建才能修复不一致。

**修改后**：注册收敛为**两个时机 + 一条仲裁规则**：

1. **构造期（ArkMethod setter）**：`setImplementationSignature` intern impl 签名 + `registerImplModelWithArbitration`（同类兄弟方法不互相覆盖、C++ decl/impl 分裂时 body 持有者优先占槽、异常双实现打 error）；`setDeclareSignatures` **只 intern 不注册**——注册刻意延迟，防止覆盖 builder 合并期还需要读取的前一个同签名方法；
2. **终点（ArkClass.addMethod，ArkClass.ts:821-846）**：`setModel(implID, method)` 无条件注册（合并链终点，最终胜者说了算）；然后 **B1 全槽注册**——把该方法的其余 declare 签名 ID 也逐个注册到本方法（`registerDeclareSlotWithArbitration`，唯一仲裁规则：body 持有者占住的槽位不被 body-less 的方法顶替）。

**举例：一个带重载的方法从签名创建到双槽注册的全过程**（从原 §1.4 formal 表小节移来并扩充）：

// TODO: methodSignature的处理有点复杂，这里可以使用class Signature的定义，这样比较简单。这个复杂的例子说明可以放入method Signature改造那边，加上重载来说。 →（例已移至此处。）
// TODO: 这里setDeclaringSignature 时候也会intern吧？ →（是的——declare 路径也 intern 拿 ID，只是不注册 model，见第 2 步。）
// TODO：这点也要再解释清楚一点，现在看不懂，也别是和上一条的关系？ →（与上一条的关系：declare 路径只做"签名 ↔ ID"不做"ID ↔ 模型"，impl 路径两件都做——两步的差异只在"是否挂 model"，而非"是否 intern"，见第 2/3 步。）

```typescript
class A {
    foo(a: number): string;    // 重载声明 1（declare）
    foo(a: string): number;    // 重载声明 2（declare）
    foo(a: any): any {}        // 实现（impl）
}
```

1. **签名创建**（ArkMethodBuilder.ts:108-130）：builder 为每个声明/实现分别组装 `new MethodSignature(declaringClass.getClassSigID(), methodSubSignature)`（SigID 构造重载，hash 构造时缓存）。三个签名的参数类型不同，互相 equals 为 false——**三个不同的签名值，将分到三个不同 ID**；
2. **declare 路径：只 intern、不注册 model**（`mtd.setDeclareSignatures(sig1, sig2)`，ArkMethod.ts:523-534）：每个签名调 `getId` intern 拿 ID（比如 41、42），存入 `declareSigIDs = [41, 42]`——**但故意不 setModel**。为什么：builder 合并期（TS 声明合并）需要通过 canonicalizer 读取"前一个同签名方法"做合并，若 declare 一 intern 就挂 model，会覆盖前一个方法的注册，合并链就断了（ArkMethod.ts:526-528 注释原文说明此设计）；
3. **impl 路径：intern + 注册 model（带仲裁）**（`mtd.setImplementationSignature(implSig)`，ArkMethod.ts:557-564）：这一步做**两件事**——① `getId(implSig)` intern 拿 ID（43）并缓存 `mtd.methodSigID = 43`（**签名 ↔ ID** 绑定）；② `registerImplModelWithArbitration(43)` 把 `models[43] = mtd` 挂上（**ID ↔ 模型** 绑定）。仲裁规则（ArkMethod.ts:597-625）：槽位已有别的 model 时——同类兄弟方法（TS 重载/声明合并）**不覆盖**（保住 builder 合并期的可读性，终点注册说了算）；C++ decl/impl 分裂时 body 持有者优先占槽；非 C++ 场景双实现打 error（latter wins）；
4. **终点注册 + 全槽注册 + 名字索引**（`declaringClass.addMethod(mtd)`，ArkClass.ts:821-846）：`setModel(43, mtd)` **无条件**注册（addMethod 是合并链终点，最终胜者说了算——与第 3 步"同类兄弟不覆盖"形成分工：中途保护前人、终点确认胜者）；然后 **B1 全槽注册**：把 `declareSigIDs` 里的 41、42 也逐个 `setModel` 挂到本方法（`registerDeclareSlotWithArbitration`，唯一规则：body 持有者占住的槽不被 body-less 顶替）；最后名字索引 `methodNameIndex['foo'] = [43]`（impl ID 优先，declare-only 方法才用 declareSigIDs[0]）。

至此 `getMethod(声明1签名 / 声明2签名 / 实现签名)` 三种查询都能 canonicalizer fast path O(1) 命中**同一个** ArkMethod——这正是 n:1 的"多签名共享一个模型"。

// TODO: 这个太细节了，应该放到它作用的地方，比如按照例子他应该放到ArkMethod那里作为特殊情况来说明？ →（已落实：随 n:1 专题移入 ArkMethod 节。）

**MethodSignature 特有设计：equals 与 hash 刻意不对齐**（hash 不含 returnType，equals 含）——两个相反方向约束的合力：

1. **hash 必须不含 returnType**：类型推导会**原地** `setReturnType()` 修改 MethodSubSignature。若 returnType 参与 hash，推导每改一次返回类型，签名的 hash 就变了——同一个签名对象再 intern 会落到**不同的 ID**，此前挂在这个 ID 上的 model、所有持有这个 ID 的 Type/Expr/Ref 全部失联（ID 漂移）。排除它，保证"推导中签名被改值，ID 不漂移"；
2. **equals 必须含 returnType**：TS 允许"同名同参、仅返回类型不同"的重载声明（interface 中常见）。若 equals 也排除 returnType，上面例子里的两个 declare 签名若仅返回类型不同（如 `foo(a: number): string` 与 `foo(a: number): number`）会被判等 → 折叠为同一个 ID → `getMethod(第二个)` 命中第一个的 model，注册也互相覆盖。ArkSignature.ts:990-994 注释原文："overloads differing only in return type intern to distinct IDs"；
3. **两者组合在哈希表语义下合法**：哈希表只要求 **equals 相等 ⇒ hash 相等**（必要条件），不要求反向。hash 宽松 = 同桶候选略多（returnType 修改前后的签名值同桶），桶内由 equals 严格终审，正确性不受影响，代价仅是碰撞率微增。这就是"hash 宽松保证 ID 稳定，equals 严格保证语义"的完整含义。

**收益举例**：修改前 declare 签名（重载声明的第 2、3 个签名）在 methodsMap 里没有独立条目，`getMethod(declareSig)` 只能走类内遍历 fallback；修改后任何 declare 签名都能 canonicalizer fast path O(1) 命中。

**嵌套方法（nested method）与 origin name 的改造**：

以这段代码为例：

```typescript
function outer() {
    function inner() { }
    const arrow = () => { };
}
```

- **修改前**：inner/arrow 作为方法挂在 outer 的声明类下，名字改写成组合名 `%inner$outer`、`%arrow$outer`（`%` 前缀 + `$` 分隔，保证唯一）；同时 `addMethod(method, originName)` 会**额外按裸 origin 名（inner/arrow）注册一份索引键**，查询走 `methodMatchesName` 的**裸名前缀匹配**（startsWith `%inner$`）。问题：① 双份索引键（完整名 + origin 键）浪费且易失同步；② 前缀匹配是模糊的——`%inner$outer` 与 `%inner2$outer` 都以 `%inner` 相关前缀起头时存在误配风险；③ `outerMethod` 对象引用无法表达到"外层的外层"链式查找的确定性；
- **修改后**：① `outerMethodSigID` 精确指向外层方法（`getOuterMethod()` 经 Registry 反查），作用域链（inner → outer → 顶层）成为精确的 ID 链——局部类解析（§3.4）、闭包变量分析（BodyBuilder 的 generateNestedMethodChains）都沿这条链走；② 方法名索引只存**完整组合名**一份键（`methodNameIndex`，ArkClass.ts:784-789 注释明确：'%origin$outer' 组合名的裸 origin 前缀匹配语义已退役，origin 键的唯一理由 methodMatchesName 第二分支已删除）；③ `addMethod` 删除 `originName` 参数；
- **必要性**：模糊前缀匹配 → 精确 ID 链 + 完整名精确匹配，消除误配风险；单份索引键减少内存与失同步面。配套新增 `OriginNameRemoval.test.ts` 守护该语义。

### 3.7 更底层（Type / Expr / Ref / 推导层 / Builtin / ArkModule）

// TODO: 这个不用单独章节，融合到前面的章节里描述 →（原独立的 deprecated 章节已按此拆并：各 model 的表 3 + 本节的汇总说明。）

- **Type.ts**：`ClassType/FunctionType/EnumValueType/LexicalEnvType` 四个类型类**删除签名对象引用字段，改纯 sigID + tempSigID 双字段存储**。构造函数采用与 ClassType 同构的路由：**formal 只读命中（`getExistingId`）→ 持 formal ID；miss → temp 兜底登记（不区分 isUnclear——含"clear 但尚未注册"的签名，防盲写 formal 产生空洞，见 §1.6 核实结论）**。getter 是三级查 + 惰性物化（§1.6 协议）。**兼容设计（D11）**：外部代码 `type.classSignature` 这种字段式访问不能破坏——新增 4 个属性 getter（`get classSignature()` / `get methodSignature()` / `get signature()` / `get nestedMethodSignature()`）委托给对应方法，字段式与方法式访问都正常。
- **Expr.ts / Ref.ts**：`AbstractInvokeExpr` / `AbstractFieldRef` **回退不改造**——原因 R11：invoke 表达式的签名会被推导原地 `setReturnType`、field 引用会被 `setType`，而 canonicalizer 的去重刻意忽略这些可变字段（§1.4）——若 expr 只存 sigID，取回的 canonical 实例会丢失"我这一处"的可变字段差异。因此保留签名对象引用为主存储，sigID/tempSigID 作为**构造/替换时即时解析的辅助缓存**（`route()` 两分路由 + `setMethodSignature` 重路由，Expr.ts:125-138）。
- **`===` 引用比较修复（3 处，经两步演进）**：`TypeInference.isSameType`（TypeInference.ts:1171）、`ModelUtils.matchType` 两处（:629/:632）。第一步（commit 内）改 `toMapKey()` 值比较；第二步（review 工作项 D，§5.1）再改为 `signatureEquals(a, b)`——hash 数字先比 + equals 终审，彻底去字符串。例：`isSameType` 原直接 `type1.getClassSignature() === type2.getClassSignature()`——两个值相同但引用不同的 ClassSignature（修改前签名多实例化的常态）会误判"不是同一个类型"，推导结果随机取决于对象从哪条路创建；修复后按值语义判等，与实例无关。（注：commit 时记载的第 4 处 `IRInference.needInfer` 实际实现是 `getFileName() === UNKNOWN_FILE_NAME`，不走 toMapKey。另有 2 处 `===` 天然安全：ArkClass 的 Map 返回同实例、MethodSubSignature 随宿主单实例化。）
- **Builtin lazy getter**：core/cpp 两份 Builtin.ts 的 ClassType 静态字段（OBJECT_CLASS_TYPE 等）改为**不缓存的 lazy getter**（每次访问创建新 ClassType，其 sigID 指向当前 Registry）——解决测试中多次创建 Scene / Registry dispose 重建后静态缓存里 sigID 指向已死实例的问题（R12）。
- **ArkModule**：`filesMap` key 从 `toMapKey()` 字符串变为 FileSigID（`addFile` 改用 `arkFile.getFileSigID()`）。
- **历史遗留 deprecated 汇总**（分布在上文各表 3，此处一并交代）：位置信息族（1.0.91 FullPosition 统一，25 处）与源文本存储族（1.0.91 源码统一存 ArkFile，10 处空实现）内部全部 0 调用；唯一例外是 `ArkBaseModel.isExported()`（1.0.91 起 deprecated）**内部仍有 10 处调用未迁移**（3 处在 deprecated 死链内、7 处在 ArkNamespaceBuilder/ArkFileBuilder 活代码中）——是历史遗留中唯一有真实内部调用的方法，review 时需决策是否顺手迁移。

---

## 4. 周边架构与辅助设施的修改

> 本章定位：ID 化核心架构（第 1-3 章）之外的周边架构改造与辅助设施——构建流程拆分、统计、校验等边缘辅助类的修改。四节自第 2 章移入（TODO 落实）。

### 4.1 SceneBuilder / ModuleScene / SceneBuildStage — 构建流程拆分 // TODO: 挪入第 4 章 →（已挪入）

**修改前**：Scene.ts 1700+ 行同时承担：构建编排（配置解析、project 文件 DFS、SDK 构建、方法体构建）+ 查询服务（按签名/名字查模型）+ 模块化分析。构建工作态（ohPkgContentMap、解析缓存、baseUrl 等十几个字段）在构建完成后仍驻留 Scene。

**问题**：本次修改也会增加很多构建编排内容，导致他的问题更加突出。

**修改后**：

- **`SceneBuilder.ts`**（844 行，全部从 Scene.ts 拆出，文件头有逐段迁移对照）：**一次性构建上下文**。`Scene.getOrCreateSceneBuilder()` 惰性创建挂 `scene.activeBuilder`；完整构建入口结束时 `releaseSceneBuilder()` 释放（工作态随 GC 回收，Scene 只留产物）。五大分区：配置解析族 / project 文件 DFS 族 / SDK 构建族 / body 构建族 / harmony 模块族。模块化增量路径（`analyseByModule`/`loadModule` → ModuleBuilder）不经此上下文。
- **`builtFileOrder: number[]`**（Scene.ts:144）：DFS 中 `setFile` 的后序记录 = 严格拓扑序（被依赖者在前）。**推断期零排序**：`inferTypes` 直接正序遍历该数组（Scene.ts:1047-1059），取代旧版每轮 `sortByDependency(filesMap, projectName)` 全量拓扑重算（该函数 commit 时成为无调用的残留体，已随 review 工作项 G 整文件删除 DependenciesSort.ts，§5.1）。注意 FileSigID 本身的前序 intern 序不具拓扑性质（多入口/菱形场景依赖方可能晚于被依赖方 intern），**不可**替代此数组（注释明确警告）。
- **performance improve 增量**：`fromResolutionCache`（import from → 物理路径解析缓存，含负缓存）、`fromResolutionStack`（嵌套槽隔离）、`resolvedOhPkgCache`（刻意独立于正被遍历的 ohPkgContentMap，避开 JS Map 迭代中新增项的坑，SceneBuilder.ts:515-522）。
- **`ModuleScene.ts`**：模块视图类拆出（Scene.ts re-export 兼容）；`moduleFileMap` key 从签名字符串变为 FileSigID；文件构建复用 SceneBuilder 的 DFS（必须先注册后构建）。
- **`SceneBuildStage.ts`**：枚举从 7 值减为 5 值（`CLASS_COLLECTED`/`METHOD_COLLECTED` 随懒收集流程退役删除——模型在 `setSignature` 注册点即进 canonicalizer，不再需要收集阶段）。拆到 frontend 层的动机是打破 Scene ↔ frontend 值导入循环（ESM 加载边，同类循环曾实测触发 "Class extends value undefined"，与 §2.5 同源）。

### 4.2 StageStatistics / StageStatisticsReporter — 阶段统计 // TODO: 挪入第 4 章 →（已挪入）

**原先的 gap**：无系统化性能观测手段，性能问题定位靠手工打点。

**现状**（`src/statistics/`）：`StageStatistics` 收集 9 个内置阶段（Builder 总阶段 + ParseConfigs/Sdk/SdkFiles/SdkInfer/Files/Bodies 五个子阶段 + InferTypes 每轮 + InferTypesFinalize）的耗时与内存（RSS/heap）。关键设计：**内存峰值靠同步采样点**（start/endStage/checkpoint 时刻），刻意不用 `setInterval`——Node 单线程下 CPU 密集操作（AST 解析、IR 构建）无法调度 timer 回调；嵌套关系自动捕获（start 时以最近未结束阶段为 parent）；禁用时零开销。`recordSignatureStats(label)` 在 post-build / post-infer 两个时点对 Registry 做只读快照（formal 5 空间 size + temp 3 空间 live/total/retired/replaced）。CLI `cg --stats` / `ir --stats` 开启（`SceneOptions.enableStatistics`），进程退出 hook 自动落盘 `out/<projectName>_statistics.txt`。

### 4.3 CanonicalizerValidator — 不变式校验器（dev-only） // TODO: 挪入第 4 章 →（已挪入）

**现状**（`src/core/common/CanonicalizerValidator.ts`，1004 行纯静态工具）：对 §1.5/§1.6 声称的所有不变式做全量体检，5 个 formal 空间各 6 条通用规则（X1a ID 0 有 DEFAULT / X1b ID 0 无 model / X2 ID 稠密无洞 / X3 model 完备性（区分合法驱逐态）/ X4 model 回指 SigID 一致 / X5 签名值唯一（hashCode 分组 + 组内 equals）/ X6 无多挂）+ 空间特有规则（file 的 R7 ID 边界一致；namespace 的 N7 嵌套链；class 的 AliasClassSignature 双注册豁免；field 的 F4b 双侧声明类一致；method 的 M3/M4/M6/M7 反向链）+ temp 3 空间的 T1/T2/T3（含全模型树遍历 `checkTempHolderIDs` 检查持有者声明的 tempSigID 指向活 slot 或有替换记录）。**唯一调用点**：`Scene.inferTypes()` 末段（Scene.ts:1064-1067），`SceneOptions.validateCanonicalizers` 门控，默认关闭。

### 4.4 两个典型场景对比（举例） // TODO: 挪入第 4 章 →（已挪入）

**例一：`scene.getClass(sig)` 的查询路径对比**——

- 修改前：`classesMap.get(sig.toMapKey())`——现场拼字符串（项目名 + 文件路径 + 类名）→ JS Map 字符串 hash → 字符串逐位比较命中 → 返回值；
- 修改后：`registry.getArkClassBySig(sig)` = `classSigCanonicalizer.getExistingId(sig)`（用构造时缓存的数字 hash 定位 TypedArray 桶，碰撞才 equals——ClassSignature 的 equals 是逐字段 `===`，无拼接）→ `getModel(id)`（数组下标）。整个链路只读、零字符串、零分配（MethodSignature 空间的例外见 §1.4"修改后机制与例外"）。

**例二：SDK 全局符号 `Object` 的多实体处理**——

- 修改前：`Map<string, ArkExport>` 只能存一个实体。lib.es5.d.ts 的 `interface Object` 先登记，`declare var Object: ObjectConstructor` 再来就互相覆盖——只能靠 copyMembers 把 var 侧的成员物理拷进 interface 实体，成员签名归属失真（成员的 declaring class 被篡改），且 enum vs interface 类别冲突时行为混乱；
- 修改后：`sdkGlobalMap['Object']` 是实体列表 [interface 实体, var 的 Local 实体]。`getSdkGlobalMemberClasses('Object')`（Registry.ts:141-180）遍历列表：ArkClass 实体直接收；var 的 Local 实体经其 ClassType 找到 constructor 侧类（ObjectConstructor），再连带收 ObjectConstructor 名下全部同名实体。成员探测在所有候选上做，成员签名自然归属真实声明类——不再拷贝成员、不再篡改归属。

### 4.5 其他方面的修改

| 类别 | 内容 |
|---|---|
| **新测试**（合计 20+ 新文件） | `SignatureCanonicalizer.test` / `SignatureCanonicalizerRegistry.test`(1002 行) / `SignatureModelCanonicalizer.test` / `TempSignatureCanonicalizer.test` / `TempIDMechanism.test` / `CanonicalizerValidator.test`(+smoke) / `ModelRelationshipID.test` / `SceneCanonicalizerIntegration.test` / `LocalClassResolution.test` / `OriginNameRemoval.test` / `ShortNameResolution.test` / `SdkGlobalProbing.test` / `ReverseTopoInvariant.test` / `TypeIsUnclear.test` / `FieldSignatureToMapKey.test` / `ModuleBuilder.test` / `StageStatistics.test` / `TempSpaceDiagnose`（samples） |
| **测试基建** | `tests/unit/common.ts`：`buildScene` 移到 `beforeAll` + `SignatureCanonicalizerRegistry.dispose()`（多 Scene 测试必须手动 dispose，R12）；C++ expect 文件批量更新（~40 个，签名字符串 key → ID 化后的输出差异） |
| **CLI** | `cg`/`ir` 新增 `--stats`；`ir.ts:41` fileCount 从 `getFiles().length` 改为 `fileSigCanonicalizer.size()`（**语义变化，见 bug 清单 #2**） |
| **Config** | `SceneOptions` 新增 `validateCanonicalizers`（默认关）/ `enableStatistics` / `statisticsOutputPath` |
| **index.ts** | 导出 `SignatureCanonicalizerRegistry` + statistics 族 |
| **文档** | `docs/components/ArkFile.md`/`ArkNameSpace.md`（originName 语义删除）；`docs/api_docs`（Ref 类 3 个）；openspec 全套设计文档随 commit 落盘 |
| **CppFrontend** | 4 个 Builder + ModelUtils/TypeInference/IRInference 等 C++ 侧同构改造（D13 sigID 缓存 + Registry import 清理） |

---

## 5. 工作项清单（待执行 / 待分析 / 本轮已执行）

> **本章定位**：所有工作项的唯一登记处——review 过程中发现的任何问题、讨论衍生的任何决策与改进设想，都先记录于此再排期执行；编号 A-Z 顺序分配，状态分为"已执行 / 已拍板待执行 / 待分析"。

### 5.1 本轮已执行（随本轮 PR 落盘）

| 编号 | 工作项 | 内容 | 验证结果 |
|---|---|---|---|
| **A** | 删除 `SignatureCanonicalizer.intern()` | 生产代码 0 调用（唯一历史消费者 D9 setter 已被 D13 消化为 getId+get 拆分）；新类无兼容包袱（不触发 D11）。删方法（原 SignatureCanonicalizer.ts:92-104）+ 13 处测试断言改写为 `get(getId(sig))!`（语义严格等价，"canonical 单实例化使 === 安全"语义由 getId+get 组合继续承载） | tsc 通过；定向 5 个测试文件 116/116；全量 1490/1491（唯一失败为既有 ModuleBuilder EPERM symlink 环境问题） |
| **G** | 删除死代码 `DependenciesSort.ts` 整文件 | 文件唯一导出 `sortByDependency` 在 src/tests/packages 均无调用（Scene 已改用 builtFileOrder 零排序；TypeInference.test.ts:148 注释"已随该不变量删除"但函数体残留）。其 :36 的 toMapKey 调用是 D 落地前 toMapKey 的最后一个非比较类生产消费者 | tsc 通过；全量回归无变化 |
| **D** | 3 处身份值比较改 `signatureEquals`（hash 数字先比 + equals 终审） | 新增导出函数 `signatureEquals(a, b)`（SignatureCanonicalizer.ts，Canonicalizable 定义旁）：`a.getHashCode() === b.getHashCode() && a.equals(b)`。三处消费点改写：`TypeInference.isSameType`（TypeInference.ts:1171）、`ModelUtils.matchType` 两处（:629/:632，原 toMapKey 值比较）。**为什么不用"查 ID、ID 相同即相等"**：① ID 是"值 × 注册历史"的函数而非值的纯函数——两个未注册签名（temp stub 场景）`getExistingId` 都返回 -1，`-1 === -1` **误判相等**；一注册一未注册则误判不等；② `getId` 版本对未注册签名**盲写 formal 空间**（永久空洞，即 §1.6 记录的历史翻车点），查询路径必须只读；③ **协议同构**：signatureEquals 的判等协议（hash 粗筛 + equals 终审）与 canonicalizer 探测内部完全同构——ID 判等等于把该协议对 a、b 各跑一遍（含两次 slot 表访问）再加一次 ID 比，signatureEquals 只跑一遍；④ 纯函数不依赖 Registry 单例与注册历史，temp/正式/临时构造签名统一语义。**equals 执行条件（修正早期表述）**：hash 短路仅对"结果为不等"的比较生效；结果为相等时 equals 必然执行（契约使然），但 canonical 实例场景 equals 首行引用短路、成本近零——性能优势来源是"协议跑一遍 vs 两遍 + 省两次表访问"，而非"省掉 equals"。**语义说明**：FieldSignature 的 hash/equals 一致地含 declaringClassTempSigID（temp 引用语义）——与原 toMapKey 纯值语义在"同值不同 temp 实例"场景有差异，属 ID 化有意设计 | tsc 通过；定向 7 个测试文件（含 InferArray 67 例、reproduce_issues）190/190；全量 1490/1491 |
| **B** | toMapKey 降级 + FileSignature 双哈希收敛（按 D→deprecated→B 的演进排序执行） | ① 5 类签名的 `toMapKey()` 全部标 `@deprecated`（生产消费者已归零：比较走 signatureEquals、索引走 canonicalizer，保留仅为 D11 对外兼容）；② FileSignature.toMapKey 改为 `toString()` 身份投影（projectName + fileName 完整身份字段，无碰撞）+ 删旧 `hashcode` 字段与 CryptoUtils/path import（bug #16 收敛）；③ 连锁：TypeInference.test.ts 期望值改新格式（`@exportAll/util/test2.ets: ` 等）、FieldSignatureToMapKey 一处断言翻转（toMapKey 与 toString 的区分点随文件层格式统一而消失）、删除死代码 `FileUtils.getFileSignatureMapKey`（旧格式平行复刻，无调用者）+ FileUtils 的 CryptoUtils/transfer2UnixPath import 清理。**执行顺序说明**：此前曾直接按方案一实施并因超出授权回退；本轮经用户确认按"D 先行消灭生产消费 → toMapKey 降级 deprecated → B 成为无风险清理"的顺序落地，方案争议（D11 格式变化顾虑）随 deprecated 标注消解 | tsc 通过；全量 1490/1491 |
| **I** | bug #8 修复：MethodSignature equals/isMatch 去字符串拼接 + Compare 自由函数族性能改造 | **现状**（修复前）：equals 每次拼 2 个参数串 + 2 个 returnType 串（signatureEquals 终审在工作项 D 后成为"相等比较"的必经路径）；isMatch 每次拼 **6 个递归字符串**（完整 declaring.toString 递归 + 参数 Type 递归）×2——isMatch 是 addMethod/updateMethodIndex 重载合并的**构建期热路径**（7 处调用方）；Compare 自由函数族（5 个 export）内为 toString 拼接 + Type 引用比较。**修复（A+B+D 三部分）**：① **A** equals 改字段级短路——新增模块函数 `methodSubSignatureValueEquals`（staticFlag → methodName → 参数数量 → 逐参数类型（单例 Type 引用短路，否则 toString——Type 无 hash 基础设施本轮不引入）→ returnType，语义与原 toString 投影严格等价、保留 undefined 参数→UnknownType 投影），equals 两处拼接替换为一次 helper 调用；② **B** isMatch 重写——declaring 部分改 `signatureEquals`（值判等，**保留 isMatch 对 unclear stub 的宽松值语义**，不引入 equals 的 tempSigID 严格语义），subSig 部分与 equals 共用 helper；③ **D** 5 个 Compare 函数全部保留（外部可能有调用者，D11）但内部委托判等协议：fileSignatureCompare→equals、classSignatureCompare→signatureEquals（**顺带修复**：原实现漏比较 declaring namespace，不同 ns 同名类误判相等）、fieldSignatureCompare→signatureEquals(declaring)+fieldName、methodSubSignatureCompare→valueEquals（**顺带修复**：原参数/返回类型 `===` 引用比较，同值不同实例 Type 误判不等）、methodSignatureCompare→signatureEquals+valueEquals；私有死代码 arrayCompare 移除。**C（构造期 hash 拼接）保持现状**：hash 缓存 readonly 一次性成本非热点，Type 无 hash 基础设施，逐字段改写收益有限 | tsc 通过；定向 8 个测试文件 258/258（含 Registry 71 例 equals/hash 密集、InferArray 67、ModelRelationshipID 58、reproduce_issues 的 methodSubSignatureCompare 用例）；全量 1490/1491。C++ 侧（ArkMethodBuilder:200 重载合并使用 isMatch）测试需 LLVM/Clang 环境本机不可跑——语义等价性已代码级论证（同类 canonical declaring 直接命中 + subSig 与 toString 投影等价） |

### 5.2 已拍板、待执行

| 编号 | 工作项 | 内容 |
|---|---|---|
| **C** | dispose/clear 收敛——**方案 B**（用户已拍板） | 只保留 `dispose()`，`clear()` 标 @deprecated 委托 dispose。完整评估记录（原 §1.2 讨论移此）：① src/ 内两个入口调用为 0（纯对外 API）；② 测试侧 `scene.dispose()` 仅 3 处、`scene.clear()` 仅 1 处，直连 `Registry.dispose()` 达 40+ 处；③ 本质差异仅三块——静态缓存清不清 / 实例字段清不清 / moduleCache 置空 vs 保实例清内容（clear 的"立即重建"非本质，getInstance 本就懒重建）；④ 两套维护已产生 bug #1（dispose 漏 releaseSceneBuilder）。**执行注意事项**：方案 B 属 breaking 性质（clear 语义并入"全清"），执行时需同步迁移存量调用方；bug #1 的不对称问题随重写一并解决；曾对比过的备选方案 A（dispose = 静态清理 + clear，零 breaking）与 C（仅补 releaseSceneBuilder）留档备查 |

### 5.3 待分析 / 待决策

| 编号 | 工作项 | 内容 |
|---|---|---|
| **E** | design.md D12 与实现偏差待同步 | D12 描述"isUnclear 判断决定走 temp 还是 formal"，实现已演化为"formal 只读探测 miss 即 temp 兜底（不区分 isUnclear）"——早期 isUnclear 分流方案因"clear 未注册签名盲写 formal 产生永久空洞"翻车而改（见 §1.6 核实结论）。设计文档待按实现现状改写 |
| **F** | `ArkFile.addArkClass` 的 registerClass 防御面确认 | `registerClass` 为无条件 `setModel`，与 `setSignature` 的"他 model 已持有不覆盖"保护不一致——正常路径幂等无害（未命中 = 新类首次入本文件，注册是必须的），但防御面上存在静默覆盖可能（跨文件误加同名类等理论路径），见 §1.5 例子第 3 步的分析。待确认是否补一致的保护或 error 日志 |
| **H** | `CryptoUtils` 整类死文件清理（B/D 连锁衍生） | 工作项 B 删除 FileSignature 的 `CryptoUtils.hashcode` 调用与 FileUtils 的 `getFileSignatureMapKey` 后，`src/utils/crypto_utils.ts`（含 sha256/hash/hashcode 三方法）在 src/tests 内已无任何调用者。历史工具类，单独清理以控制本轮改动面 |
| **J** | 探测内 equals 的收窄优化（§1.4 Note 的设想） | `getId`/`getExistingId` 匹配到 hashcode 桶后仍要做 equals 判断——可探索收窄需要比较的场景（如canonicalizer 表内缓存"该 slot 只有一个条目且上次命中实例"的快速路径，或 canonical 实例的引用预检前置）。待分析：收益场景（signatureEquals 相等比较、碰撞链遍历）与实现复杂度的平衡 |

### 5.4 问题清单（待修复工作项池）

原 bug 清单——每项本质即待修复工作项，编号沿用 #1-#18 便于正文引用：

| # | 严重性 | 问题 | 位置 |
|---|---|---|---|
| 1 | 中 | **`dispose()` 不释放 `activeBuilder` 且 `SceneBuilder.registry` 为构造期缓存引用**：`clear()` 有 `releaseSceneBuilder()` 而 `dispose()` 没有（不对称）；`SceneBuilder.registry` 是 readonly 构造期快照，若用户 dispose 后复用同一 Scene 继续 build，旧 builder 的 `this.registry` 指向已清空的旧单例，而 `Scene.registry` getter 返回新实例——签名注册写旧、查询走新，**静默丢数据**。正常"drop 前 dispose"流程无害（随工作项 C 重写一并解决） | Scene.ts:193-211、SceneBuilder.ts:64/109 |
| 2 | 中 | **ir.ts `fileCount` 语义膨胀**：从 `getFiles().length`（project 文件数）变为 `fileSigCanonicalizer.size()`（1 个 DEFAULT + 全部 SDK + project）。配置 OHOS SDK 时输出 JSON 的 fileCount 从几十膨胀到数千，`--help` 无声明 | ir.ts:41 |
| 3 | 中 | **`markProjectFileBoundary` 调用面缺口**：仅 `buildSdkStage`（SceneBuilder.ts:602）与 `ModuleBuilder.loadModule`（ModuleBuilder.ts:1021）调用。API 层面"仅 `config()` + `buildModuleScene()`"可达（不设边界）→ `getFiles()`/`getSdkArkFiles()` 恒返回空、`isProjectFileID` 恒 false，而旧 filter 语义会返回文件 | SceneBuilder.ts:791-823 |
| 4 | 中 | **ModuleScene 无 active builder 时静默跳过**：仅 warn 后 return，整个模块文件不构建，上层无失败传播 | ModuleScene.ts:123-127 |
| 5 | 中 | **`validateFields` truthy 检查对数字 ID 语义倒置**：`!value` 判断下 `-1`（未 intern 哨兵）判"有效"、合法 `0`（DEFAULT）判 undefined。受影响 validate 调用：ArkClass.ts:1466、ArkField.ts:277、ArkMethod.ts:948、ArkNamespace.ts:634 | ArkBaseModel.ts:414-430 |
| 6 | 低 | **哨兵不一致 + 无效守卫**：`ArkFile.fileSigID` 以 0 为"未 set"（DEFAULT 占用 0，无法用 -1），其余模型用 -1。导致 ArkFile.ts:294/430 的 `this.fileSigID >= 0` 守卫恒真形同虚设 | ArkFile.ts:72-73/294/430 |
| 7 | 低 | **`undefined as unknown as X` 类型欺骗**：ID 未设时 getter 返回类型不合法的 undefined，下游链式调用静默崩溃 | ArkClass.ts:333、ArkNamespace.ts:456/564、ArkField.ts:105、ArkMethod.ts:372、ArkFile.ts:252 |
| 8 | ~~低~~ | ~~**equals/hash 仍依赖 toString 拼接**~~ → **已由工作项 I 修复**（§5.1）：equals/isMatch 改字段级短路（`methodSubSignatureValueEquals`）、isMatch declaring 改 signatureEquals、Compare 自由函数族委托判等协议（顺带修复 classSignatureCompare 漏 ns 与 methodSubSignatureCompare 的 Type 引用比较两处历史缺陷）；仅剩构造期 hash 一次拼接（C 决策：保持现状，非热点） | ArkSignature.ts:892-895/987/1013（修复前） |
| 9 | 低 | **isUnclear 的 class/ns 不对称**：declaring 为 ClassSignature.DEFAULT 有特判返回 false，NamespaceSignature.DEFAULT 无特判落到 fileSigID===0 判 true——ns 声明的 DEFAULT 字段被算作 unclear | ArkSignature.ts:758-768 |
| 10 | 低 | **setSignature 补挂策略不一致**：ArkClass（model 缺失补注册）vs ArkNamespace（故意不补、交 N3 暴露）——注释均有说明，行为分歧需确认 | ArkClass.ts:401、ArkNamespace.ts:299 |
| 11 | 低 | **`--stats` 依赖进程退出钩子**：CLI 场景成立；库被长生命周期进程使用时报告永不产出（除非手动调 print/export），CLI help 未声明 | Scene.ts:1564-1581 |
| 12 | 低 | **post-infer 快照时序耦合**：`recordSignatureStats('post-infer')` 在 dispose 系列之后调用，当前各 dispose 不动 Registry 暂无偏差，属时序耦合点 | Scene.ts:1068-1074 |
| 13 | 低 | **索引实现不统一**：ArkFile 用 `Set<number>`（保插入序），ArkNamespace/ArkClass 用 `Int32Array + swap-remove`（删除后顺序打乱）——namespace/file 侧 swap-remove 对遍历顺序的影响需评估 | ArkFile.ts:82 等 |
| 14 | 低 | **Canonicalizer.ts:22 导出类型引用私有名**：`export interface CanonicalizerStats.strategy: CanonicalizerStrategy` 引用未导出的 type，`--declaration` 构建会报 TS4023 | Canonicalizer.ts:20-29 |
| 15 | 低 | **HomeFlow 遗留死代码**：`scratchFoundStored`/`getScratchFoundStored` 全仓库无调用；`preferCanonicalRepresentative` 钩子无实现者且 equals 命中时静默替换代表实例（对依赖 get(id) 稳定引用的签名体系是潜伏风险） | Canonicalizer.ts:92/127-140/586-594 |
| 16 | ~~低~~ | ~~**FileSignature 双哈希冗余**~~ → **已由工作项 B 修复**（§5.1）：经"D 先行 → toMapKey 降级 deprecated → B 收尾"顺序落地，旧 hashcode 已删、toMapKey 改身份投影 | ArkSignature.ts:60-75（修复前） |
| 17 | 低 | **`getFieldWithName/getStaticFieldWithName` 每次构造临时 FieldSignature**（含 4 次 hash 组合）——名字查询热路径分配开销 | ArkClass.ts:586-605 |
| 18 | 低 | **register 无可扩展性预检**：对 frozen/sealed 对象写 symbol 属性抛裸 TypeError（对照 Canonicalizer.getObjectIdentityId 有 Object.isExtensible 预检），两处行为不一致 | TempSignatureCanonicalizer.ts:69-80 |

---

## 6. Review 建议关注点（优先级排序）

1. **正确性**：#1（dispose/builder stale registry，随工作项 C 一并解决）、#3（边界缺口）、#5（validate 倒置）、#4（ModuleScene 静默跳过）；
2. **语义确认**：#2（ir fileCount）、#9（isUnclear ns 不对称）、#10（补挂策略分歧）、`FieldSignature.equals` 不含 type 的消费方影响、`removeMethod` 从按名删全部到按 SigID 单删的行为变化（§3.4 表 2）；
3. **API 生命周期**：Field/MethodSignature 值对象重载（§3.1 表 3）实为 unclear 路由的内部基础设施，删除前需先把 Builtin stub 池与 37 处调用点迁移到显式 temp API；
4. **性能债务**：#17（名字查询临时签名）、#13（swap-remove 顺序影响）、§1.4 Note（探测内 equals 的收窄优化设想）；（#8 equals/isMatch 拼接已由工作项 I 修复——仅剩构造期 hash 一次拼接，C 决策保持现状；#16 双哈希已由工作项 B 修复）
5. **工作项跟进**：已执行 A/B/D/G/I（§5.1）；C（dispose/clear 方案 B，已拍板待执行）、E（D12 文档同步）、F（addArkClass 防御面）、H（CryptoUtils 死文件清理）、J（探测内 equals 收窄优化，§1.4 Note）——详见 §5.2/§5.3。
