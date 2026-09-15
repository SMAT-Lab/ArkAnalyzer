# ArkAnalyzer ID 化架构重构 — 改动说明书（round8 code review 输入）


| 项           | 内容                                                                                                                                                                                                                                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 涉及 commit  | `2cb7ada0` "refactor with id"（207 文件，+18139/-5078）`2ea2421b` "performance improve"（48 文件，+3904/-1088，基于前者）                                                                                                                                                                                              |
| 分析基线     | `git diff 2cb7ada0^ 2ea2421b`（行号引用以当前工作区为准）                                                                                                                                                                                                                                                              |
| 测试状态     | `npx tsc --noEmit` 通过；commit 时 TS 单测 1235/1236（唯一失败 ModuleBuilder EPERM 环境问题），本轮 review 最终为 **1480/1481**（同一 EPERM 环境问题；减少 = CryptoUtils 整文件删除 -6 测试）；工作项 A-S 全部落地后全量回归维持 1480/1481，无新增失败。C++ 测试需 LLVM/Clang 环境（本机未配置，历轮基线均为 TS-only） |
| 配套设计文档 | `openspec/changes/high-performance-architecture-refactor/`（proposal / design / spec / tasks / current-status）                                                                                                                                                                                                        |

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
3. **内存收益**：签名拼接字符串的重复分配与常驻消减，同一个签名对象多实例化构造的消减；
4. **不明确签名的归宿**：builder 阶段 `extends` 目标等签名的文件来源未知，这类"孤儿签名"以普通对象实例散落各处，难以统计与评估类型推导的程度。

### 1.2 SignatureCanonicalizerRegistry 总览

**方案**：`src/core/common/SignatureCanonicalizerRegistry.ts` 全局单例，是所有签名、所有模型的统一存储中心。核心就两张表：

- **5 个正式（formal）`SignatureModelCanonicalizer`**：file / class / namespace / field / method 五类签名各自的"值 ↔ SigID ↔ 模型"三向绑定（详见 §1.5）。
- **3 个临时（temp）`TempSignatureCanonicalizer`**（class / method / field）：存放"文件来源未知"的不明确签名（详见 §1.6）。

配套的生命周期规则：`Scene.dispose()` / `Scene.clear()` → `Registry.dispose()` 清空单例；之后任何代码再调 `getInstance()` 会自动重建并重新初始化 DEFAULT 签名。

本章的展开顺序：三个新增 Canonicalizer 类的结构（§1.3）→ hash 查找机制（§1.4）→ formal 表的构建（§1.5）→ temp 表的构建（§1.6）。

**设计约束**：

- 当前假设运行时单 Scene，很多用例无法满足单Scene的约束，需要修改用例；计划支持多 Scene，适配只需把单例改为 `Registry.forScene(scene)`，这样可以避免对现有用例做相应修改。

### 1.3 三个新增 Canonicalizer 类及其相互关系

本次复用 1 个已有类，新增 3 个类，它们的分工与关系如下：

```
utils/Canonicalizer.ts（旧有，少许改动）
  └─ 底层哈希表引擎：TypedArray（Int32Array keys/heads/nextById + Uint8Array occupied）
     开放寻址 + 拉链碰撞处理，三种策略（objectIdentity / numberWithEquality / stringIdentity）
  └─ 新增 `removeAt(id)` 方法——置 `list[id] = undefined`，ID 不回收

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
   
core/common/TempSignatureCanonicalizer.ts（新增）—— temp 签名的索引表
  ├── inner: Canonicalizer<S>（objectIdentity——处理 register/getExistingTempId/get/clear）
  ├── retiredIds: Set<number>（已 retire 的 ID 集）
  ├── replacements: Map<number, number>（temp→formal 归宿）
  └── 派生计数器（size = inner.size - retiredIds.size）
```

### 1.4 hash 查找机制：新方案 vs 旧字符串拼接 key 方案

**新方案的"去重"**：formal 表（§1.5）的核心操作是把一个签名值映射到一个唯一整数 ID——"去重"就是 `getId(sig)` 的语义本身：值相同（hash 相同且 equals 为真）的多个签名对象，无论被 `new` 了多少次，都折叠为**同一个 ID、同一个 canonical 实例**（这就是 intern）。它的使用场景贯穿全程：builder 注册签名（§1.5 的注册过程）、一切按签名查模型的查询（`scene.getClass(sig)` 等）、签名 setter 的自动 intern。

**新方案的"三层"**：是这条路径上从"一个签名对象"到"一个 ID"的**三道工序**：缓存 hash → 哈希表定位 → equals 终审。下面以 `getId(sig)` 为例串起来走一遍：

1. **Layer 1（缓存 hash）**：签名对象构造时把身份字段（如 classSigID + className）算成一个 32 位数字，存进 `readonly` 字段。**这一步在对象生命周期内只发生一次**（例外：MethodSignature 构造 hash 内部含一次 `methodSubSignature.toString()` 拼接——工作项 I 评估后**保持现状**：构造期一次性成本非热点，见"例外一"）；
2. **Layer 2（哈希表探测）**：`getId()` 调 `getHashCode()`——只是 `return this.hashCode` 读缓存字段（ArkSignature.ts:94-96），随后用这个数字在 TypedArray 哈希表里定位桶。**hash 不同的比较在此结束**（短路，无任何字符串操作）；结果为相等的比较会进入 Layer 3；
3. **Layer 3（equals 终审）**：hash 相同（值相同或罕见的 32 位碰撞）时逐个 `equals()` 比较。**equals 不是本方案新增的成本，而是任何哈希表查询的固有步骤**——"hash 定位 + 等值确认"两步缺一不可（修改前的 JS Map 同样要做，而且是**整个 key 字符串逐字节 memcmp**，50-100 字符；新方案的 equals 是逐字段比较：2 个数字 `===` + 1 个字符串名 `===`，canonical 实例场景第一行 `this === other` 引用短路，一次指针比较）。

**可变字段排除原则**：`MethodSignature` 的 hash 不含 `returnType`、`FieldSignature` 的 hash 不含 `type`。原因：类型推导会原地 `setReturnType()`/`setType()` 修改这些字段——若参与 hash，改一次类型签名 hash 就变了，下次 intern 会落进不同 ID，前功尽弃。排除后签名身份终身稳定。（`MethodSignature.equals` 与 hash 刻意不对齐的完整原因——重载需要 equals 含 returnType——详见 §3.6 ArkMethod 节的 n:1 专题，它是 method 签名的特有问题，故在彼处展开。）

> Note: `getId` 和 `getExistingId` 匹配到hashcode后仍要做一次 equals 判断，这会影响性能。可以考虑做优化，收窄需要比较的场景。但是因为hash碰撞的可能性，这个equals操作可能也是必须的。

**旧字符串拼接 key 方案的真实开销**：

- 修改前 `FileSignature` 其实已经有一个 hashcode 缓存字段：构造时 `this.hashcode = CryptoUtils.hashcode(this.toString())` 算一次存起来。**但它省的只是 toMapKey 内部的一小段**——`toMapKey()` 的实现是模板字符串 `` `${this.hashcode}${path.basename(this.fileName)}` ``，即把缓存的数字转成字符串、再拼上文件名 basename，**每次调用 toMapKey 仍然产生一个新字符串**。而 Map 的 key 是字符串，所以缓存没能消除拼接，更没能消除 JS Map 内部对 key 的字符串 hash（V8 对字符串 hash 有内部缓存，但每次查询拼出的都是**新字符串对象**，缓存永远不命中，等于每次都完整算一遍）；
- 其余 4 类签名（Class/Namespace/Method/Field）连这点缓存都没有：`toMapKey()` 是**递归拼接**——`ClassSignature.toMapKey() = fileSig.toMapKey() + '.' + className`，每次查询都从文件层一路拼到类名（MethodSignature 还要再拼 `methodSubSignature.toString()`，参数列表越多串越长）；
- 所以修改前的查询链路是：**现场拼一个完整 key 字符串（例如 `@myProject/src/main/ets/pages/Index.ets: MyClass`）→ JS Map 对新字符串算 hash → 逐位比较 → 用完即扔**。

**修改后机制与例外**：

- 5 类签名统一在**构造时**算一次 32 位数字 hash，缓存在 `private readonly hashCode` 字段；查找时 `getHashCode()` 就是 `return this.hashCode`——**读一个字段，不做任何计算**。数字直接作为 TypedArray 哈希表的探测 key（纯整数运算定位桶），命中即返回；
- **例外一**：原实现中 `MethodSignature` 的 equals 与 isMatch 走 `methodSubSignature.toString()` 拼接（isMatch 是 addMethod/updateMethodIndex 重载合并的**构建期热路径**）。改为字段级短路（新增 `methodSubSignatureValueEquals` helper：staticFlag → methodName → 参数数量 → 逐参数类型（单例 Type 引用短路）→ returnType，从快到慢；isMatch 的 declaring 部分改 `signatureEquals`）——多数不匹配场景零拼接零分配。**仅剩**：构造期 hash 的 `hashString32(methodSubSignature.toString())` 一次拼接——评估后保持现状（决策：hash 缓存 readonly 一次性成本，非反复调用热点；Type 无 hash 基础设施，逐字段改写收益有限，待Type编码后可考虑完全消除）。其余 4 类签名的构造 hash 与 equals 均为逐字段数字/字符串 `===`，无拼接；
- **例外二**（不属于"通过签名查 ID"但相关）：按**名字**查询的路径（如 `ArkClass.getFieldWithName(name)`）每次要现场构造一个临时 FieldSignature（含一次 hash 计算），是已知热路径分配开销（bug 清单 #17）；
- `toMapKey()` 已整体**降级 @deprecated**。

> Note: 例外二需要考虑缓存Map，维护 name -> id 的映射关系来直查 id，避免构造 Signature 来查找。

**现在构造时算的 32 位 hash，与原先 Map 的 key 是什么关系**——原先 Map 的 key（toMapKey 字符串）同时承担三个职责，改造后被拆开了：


| 原 key 字符串的职责                                                        | 修改后由谁承担                                         | 代价变化                                                                                                          |
| -------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| **定位**：JS Map 内部对 key 算 hash 找桶                                   | 构造时缓存的 32 位数字 hash 直接作为 TypedArray 探测值 | 每次查询从"拼 key + 字符串 hash"变为"读字段 + 整数探测"；且 V8 字符串 hash 缓存因每次新拼而永远失效的问题不复存在 |
| **身份**：key 相同 ⇔ 同一签名                                             | hash 粗筛（定位桶内候选）+`equals()` 细判（最终裁决）  | hash 相同≠身份相同（存在碰撞），所以配了 equals 兜底——这是"数字 hash 比字符串 key 信息少"的必要补偿            |
| **常驻索引材料**：Map 每个条目存一份完整 key 字符串（万级 × 50-100 字节） | 不再存在——哈希表只剩 TypedArray 的 int32 槽位        | 直接省掉这部分内存                                                                                                |

> Note：从内存快照中查看原先这些Map所占内存，现在这些Map没有了，相应的内存有没有省下来？300w基线工程所有ArkModel数量总和大概177w，总共约84M ~ 168M。

**新的 hashcode 计算方式**（`src/utils/HashUtils.ts`，所有 5 类签名构造时统一使用，与HomeFlow一致）：

- **`hashString32(raw)`**——MurmurHash3 风格字符串哈希：seed `0xdeadbeef`，逐字符 `imul(x ^ c, 0x85ebca6b)` 混合，末尾跑**完整 fmix32 finalizer**（两次 xor-shift + 两次 imul 的雪崩混合）；UTF-16 代理对先合并为码点再参与混合（避免代理对拆分造成的分布空洞）；
- **`hashCombineU32(seed, value)`**——boost 风格字段组合：`seed ^= imul(value, 0x9e3779b9)` + 局部 fmix，把多个身份字段（fileSigID、className、staticFlag 等）按序混合进同一个 32 位结果，组合具有顺序敏感性（f(a,b) ≠ f(b,a)）。

**为什么不用原先的 `CryptoUtils.hashcode`（Java String.hashCode 风格的 31 进制多项式，`h = 31*h + charCode`）**——核心原因是**用途变了，对质量的要求就变了**：


| 维度           | 旧：31 进制多项式                                                                                                          | 新：MurmurHash3 + boost combine                                                                                                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **雪崩性**     | 无 finalizer——相近输入产生相近 hash（`"abc1"` 与 `"abc2"` 的 hash 仅差低位几个 bit），输入的局部变化只影响输出的局部位   | fmix32 完整雪崩——输入变 1 bit，输出约 50% 的 bit 翻转                                                                                                                                                                        |
| **分布均匀性** | 低质量 hash 作为开放寻址探测键时造成**slot 聚集**——线性探测链与拉链都变长，**equals 执行次数随链长上升**，性能随规模退化 | 均匀分布 → 绝大多数 slot 链长 = 1，桶内第一跳即命中                                                                                                                                                                           |
| **用途匹配**   | 它原本的用途是**toMapKey 的拼接材料**（拼进字符串的一段字符），对分布质量**无要求**                                        | 新用途是**哈希表探测键**（引擎内 `mixNumber(key) & mask` 定位 slot）——分布质量直接决定查询性能。TypedArray 开放寻址表对输入 hash 质量高度敏感，引擎内的 mixNumber 再混合一层也救不回 31 进制的结构性弱点（短字符串低位聚集） |
| **多字段组合** | 无组合原语（只对整个字符串单遍）                                                                                           | hashCombineU32 按序组合各身份字段，顺序敏感且逐层混合                                                                                                                                                                          |
| **计算成本**   | O(len) 单遍                                                                                                                | O(len) 单遍 + 每字段约 5 次整数运算的 finalizer——两者都是构造时算一次，成本差异可忽略                                                                                                                                        |

### 1.5 formal 签名表：构建阶段、特点与 model 注册过程

**构建阶段**：formal 签名从 **builder 阶段**就开始注册。前端解析每个文件时（ArkFileBuilder → ArkNamespaceBuilder → ArkClassBuilder → ArkMethodBuilder / ArkFieldBuilder），每创建一个模型就通过签名 setter 把签名 intern 进对应 canonicalizer，立刻拿到正式 SigID 并立即注册模型。也就是说：**模型还没推导、甚至方法体还没生成，它的签名和Model就已经有正式 ID 了**。

**四个关键特点**：

1. **ID 连续**：每个 formal 空间的 ID 从 0 开始连续递增（0 是 DEFAULT 保留位，见 §2.1），没有空洞。稠密性使得"ID = 数组下标"成立，`getModel(id)` 是纯数组访问；
2. **签名 ↔ 模型一一对应**（4 类）：FileSignature ↔ ArkFile、ClassSignature ↔ ArkClass、NamespaceSignature ↔ ArkNamespace、FieldSignature ↔ ArkField 各自 1:1——一个 ID 唯一挂一个模型。例外是 MethodSignature ↔ ArkMethod 为 **n:1**，AliasClassSignature 双注册同理：origin 的模型同时挂在 origin ID 和 alias ID 两个下标上。n:1 用 impl + declare 槽位双注册解决（§3.6 ArkMethod 节专题）；
3. **不变性**：签名一旦 intern，其身份字段的值不再变化（可变字段被排除在 hash/身份之外）；推导阶段哪怕 `setReturnType` 修改了 MethodSubSignature，签名仍落回同一 ID；
4. **驱逐态**：`removeModel(id)` 只把 `models[id]` 置 undefined，签名条目与 ID 保留（模块卸载后重加载可复用同一 ID）。

**Formal ID 创建与 model 注册时机** —— 统一收口到"**签名 setter 方法内**"，这样能保证 formal ID 一定会有 signature + model：


| 签名 ↔ 模型                              | formal ID 创建（setter 注册点）                                                                                    | model 注册策略                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| FileSignature ↔ ArkFile（1:1）           | `ArkFile.setFileSignature()` 内 `getId`                                                                            | `ArkFile.setFileSignature()` 内 `registerFile`（三态处理：新值首建 / 驱逐态补注册 / 不覆盖）         |
| ClassSignature ↔ ArkClass（1:1）         | `ArkClass.setSignature()` 内 `getId`                                                                               | `ArkClass.setSignature()` 内 `registerClass`，（三态处理：新值首建 / 驱逐态补注册 / 不覆盖）         |
| NamespaceSignature ↔ ArkNamespace（1:1） | `ArkNamespace.setSignature()` 内 `getId`                                                                           | `ArkNamespace.setSignature()` 内 `registerNamespace`，（三态处理：新值首建 / 驱逐态补注册 / 不覆盖） |
| FieldSignature ↔ ArkField（1:1）         | `ArkField.setSignature()` 内 `getId`                                                                               | `ArkField.setSignature()` 内 `registerField`，（三态处理：新值首建 / 驱逐态补注册 / 不覆盖）         |
| MethodSignature ↔ ArkMethod（**n:1**）   | impl：`setImplementationSignature`（intern + 缓存 sigID）；declare：`setDeclareSignatures`（**只 intern 不注册**） | **双时机注册**（见下方详细说明）                                                                     |

**MethodSignature 为什么不能和上面 4 个模型保持一致（单 setter 三态注册）**——因为 n:1 映射 + builder 合并链的时序需求：

1. **declare 侧刻意不注册**：`setDeclareSignatures` 只 intern 不挂 model。原因是 builder 合并链（`ArkMethodBuilder.checkAndUpdateMethod` 的 re-set 逻辑）依赖 canonicalizer 查到"前一个同签名方法"来做合并——如果 declare 一 intern 就挂 model，后到的同名方法在 set 时就会覆盖前一个的 model（合并链断裂）。
2. **impl 侧构造期仲裁**：`setImplementationSignature` 内的 `registerImplModelWithArbitration` 处理三类场景——同类兄弟不互相覆盖（合并链中间态保护）/ C++ body 持有者优先（decl/impl 分裂时反向查找槽给有 body 的一侧）/ 双 impl error log。
3. **终点 `ArkClass.addMethod` 全槽注册**：`setModel(implID, method)` **无条件**（与构造期"兄弟不覆盖"形成分工：中途保护前人、终点确认胜者）+ **declare 槽全注册**（`registerDeclareSlotWithArbitration`——body 持有者占住的槽不被 body-less 顶替）。addMethod 是合并链终点——所有合并已结束，最后加入者胜出。
4. **C++ re-sign 场景没有后续 addMethod**：`processMethodDeclAndImpl` 对已在类中的方法 re-set impl 签名——此处的构造期仲裁**就是最终注册**（无后续 addMethod 调用），所以构造期注册不可省略。

> Note: 对于Method的构建和ID注册流程还可以考虑进一步分析并进行简化。

**举例：一个 formal class sig 的创建与 model 注册全过程**（以 `// a.ets` 中的 `class Foo {}` 为例，两步完成，串起 ArkClassBuilder → ArkClass → ArkFile 三个环节）：

1. **签名创建**（`buildClassSignature`，ArkClassBuilder.ts:94-113）：builder 从所属文件拿 `FileSigID`（顶层类无命名空间），**`new ClassSignature('Foo', fileSigID=5, undefined)`**——传的全是数字/undefined，走 SigID 构造重载，hash 在构造函数里算好缓存；
2. **intern + 注册 model 一步完成**（`cls.setSignature(sig)`，ArkClass.ts:395-404）：调 `classSigCanonicalizer.getId(sig)`——缓存 hash 定位桶，没有则分配新 ID（比如 23）；缓存 `cls.classSigID = 23`；同时**首建注册** `models[23] = cls`。三态处理：首次出现 → 注册；驱逐态恢复（ID 有签名但 model 被 remove 过）→ 补注册；ID 已被别的 model 占住 → 不覆盖（防"后 setSignature 者顶替"写穿）；

### 1.6 temp 签名表：三版演进、构建阶段与 formal 切换

**为什么需要 temp 表（修改前的 gap）**：builder 阶段有些签名 unclear，（例如 `class A extends F` 中 F 的 ClassSignature 文件来源未知（declaringFile = DEFAULT）），只有推导阶段才能解析。若与正式签名共用 ID 空间会产生"空洞"（有 ID 无模型），破坏签名 ID ↔ 模型 1:1 不变式。修改前这类"孤儿签名"以普通对象实例散落在各处，`===` 比较和去重都对它们无效。

**构建阶段**：temp 签名主要产生在 **builder 阶段中后期与推导期**。

**关键特性**：

- **register(sig)**：用签名实例自带的 symbol 属性判断"我登记过没有"——登记过直接复用原 ID（同一实例绝不占两个 slot）；没登记则分配单调递增的新 ID，`slots[id] = sig` 强持有（签名的存活由 slot 锚定，持有者消亡不影响，见下）；
- **ID 永不复用**（单调 nextId）：FieldSignature 的 hash 会混入 tempSigID，若复用旧 ID，同值签名会出现 hash 语义混乱；
- **retireWithReplacement(tempId, formalId)**：迁移置空 slot + `replacements.set(tempId, formalId)`（幂等，重复调用以首笔为准）；
- **生命周期（全保留策略）**：未 retire 的 slot 永不强清——slot 是完整注册审计表，"推导中间垃圾"（持有者已死但未迁移的条目）钉活到 Registry.dispose。这是知情权衡：JS 无法感知强可达对象的持有者消亡，量级控制靠源头减量而非注册侧清理；

  **"推导中间垃圾"实例（builder 阶段先建 fieldRef、再被 invokeExpr 摘取的场景）**：源码 `foo.bar()`——IR 转换器处理属性访问 `foo.bar` 时，**先**把它建为 `ArkInstanceFieldRef`（此刻 foo 类型未知 → FieldSignature 探测 formal miss → 登记 temp field 空间）；**随后**发现它是被调用的 callee，摘取 base 和签名转建 `ArkInstanceInvokeExpr`，fieldRef 本体被丢弃、不进入 IR。这个已死 ref 的 temp 行再没有持有者来迁移——就是典型的"持有者已死但未 retire"中间垃圾，全保留策略下钉活到 dispose。
- **可观测性**：统计同步即精确，三数自洽 `totalRegistered = liveCount + retiredCount`。

**三版演进**（每版都是上一版实测翻车后的修正，`TempSignatureCanonicalizer.ts:16-53` 头注释有完整记录）：

- **一版（refcount）**：`Map<id, sig>` + 引用计数，推导成功一处计数减1，计数为0则置空可回收。但是共享场景计数不精确（register 1 次持有 2~N 个），最终出现大量无法回收的签名，方案被舍弃；
- **二版（弱引用表）**：`Map<id, WeakRef>` + FinalizationRegistry——GC 驱动清理时序不确定（KeepDuringJob 窗口）、只能一次性全部回收、中途不会逐步回收、WeakRef/FR 有真实 GC 开销，方案被舍弃；
- **三版（索引表，当前方案）**：**简单说就是"一个数组 + 一本迁移账"**——数组 `slots` 强持有每个登记过的签名（下标即 tempSigID，ID 永不复用）；某签名解析成功迁移去 formal 时，把它的 slot 置空（retire），并在"迁移账"（`replacements` Map）里记一笔 `tempId → formalId`；其他还持有这个 tempId 的对象来取签名时发现 slot 空了，翻账本直达 formal 结果。

**登记 temp 的统一路由：**

- **isUnclear → temp**（正常路径：声明链文件未知，需推导解析）；
- **clear + formal 命中 → formal ID**（正常路径：声明链文件清晰，已注册，直接替换）；
- **clear + formal miss → error log + 与 unclear 相同的兜底**（防御：编程异常。round10 修正：实测发现存在**已知合法的 miss**——① constructor 探测签名（object literal 匿名类的构造调用先于批量补全产生，且探测形态 `constructor(): UnknownType` 与真实默认构造器 `constructor(): ClassType(%ACn)` 值不等）——已由创建点提前 `buildDefaultConstructor` + 探测签名取真实签名消除；② DEFAULT declaring（SigID 0）的 stub 签名（本该走 unclear）——已由 isUnclear 非正判定消除（见 bug #19）；③ 字段探测签名 miss 属**正常探测语义**（字段可能声明在基类），error 日志保留待专项分析彻底消减）。


| temp 空间      | 创建时机（isUnclear → temp / clear-miss → error log + temp）                                                                       | retire 时机（迁移置空 + replacements 记账）                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **tempClass**  | ① ClassType 构造 / ClassType.setClassSignature（Type.ts）；② FieldSignature / MethodSignature 值对象构造的 unclear class declaring | ① ClassType.setClassSignature formal 命中 → retireWithReplacement；② Expr/FieldRef route 重路由 formal 命中分支 |
| **tempMethod** | ① FunctionType / LexicalEnvType 构造（Type.ts）；② AbstractInvokeExpr.route（Expr.ts）                                             | setMethodSignature(realSig) → route formal 命中 → retireWithReplacement                                          |
| **tempField**  | ① EnumValueType 构造（Type.ts）；② AbstractFieldRef.route（Ref.ts）                                                                | ① graduateToFormal（定义点回写快路径）；② updateFieldSignature 决策表                                            |

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

---

## 2. Registry 的核心配套机制

### 2.1 ID 0 = DEFAULT 签名保留位

Registry 构造时 `internDefaults()` 把 5 类 UNKNOWN 常量签名各自 intern 到 ID 0（Registry.ts:553-560），`models[0]` 恒为 undefined（不对应任何模型），这些原来是作为单例存在：

- DEFAULT_FILE_SIGNATURE
- DEFAULT_CLASS_SIGNATURE
- DEFAULT_NAMESPACE_SIGNATURE
- DEFAULT_METHOD_SIGNATURE
- DEFAULT_FIELD_SIGNATURE

作用：

- 所有"未解析/占位"语义统一指向 DEFAULT，签名值域不会坍缩出意外 ID；
- DEFAULT 判断变成一次数字比较（`sigID === 0` / `isDefault()`），isUnclear 的 ID 快判依赖它（§3.1）；
- `getInstance()` 重建后自动重新初始化 DEFAULT，保证 dispose 后系统立即可用。

**为什么 DEFAULT 放 formal 表（ID 0）而不是 temp 表**——两个表的设计语义决定了归属：


| 维度                  | formal 表（值语义）                                                                          | temp 表（实例语义）                                                                    | DEFAULT 需要哪种                                                                                                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 去重语义              | **值去重**：值相同（hash+equals）→ 同一 ID、同一 canonical 实例                             | **实例不去重**：值相同的两个实例各占一个 slot（spec 明文要求"即使值完全相同也不合并"） | DEFAULT 是**值概念**（"未解析占位"这一个语义），所有 `%unk/%unk` 实例应折叠为**同一个 ID 0**——这正是 formal 的值去重语义；若放 temp，每次 `new FileSignature('%unk','%unk')` 都占一个新 slot，DEFAULT 就不再是单例哨兵 |
| 生命周期              | 分配后**永久有效**                                                                           | **以迁移为终点**（retire + 记账），为"推导后解析"设计                                  | DEFAULT 是**永久占位**——不会被推导"解析"到某个真实文件（%unk 就是它的终态），不需要迁移机制                                                                                                                            |
| ID 0 哨兵的稳定性     | internDefaults 在构造时第一个 intern → 恒为 ID 0；dispose 后重建仍为 ID 0                   | nextId 单调不复用，clear 后 ID 空间归零——**重建后 DEFAULT 会得到不同的 temp ID**     | 下游大量依赖`sigID === 0` 快判（isUnclear 的 ID 快判、isDefault()、边界判断"ID 0 两侧均不属于"）——必须**恒定**为 0                                                                                                     |
| X2 不变式（稠密无洞） | ID 0 被 DEFAULT 占据后，真实模型从 ID 1 起——"ID 0 = 无模型"的语义**由 DEFAULT 的存在保证** | 无此不变式                                                                             | 若 DEFAULT 不占 formal ID 0，第一个真实签名会分到 ID 0，"models[0] 恒 undefined"的约定被打破                                                                                                                             |

一句话：**DEFAULT 是"永久的、需要值去重的、需要稳定 ID 哨兵的"签名——三个属性都是 formal 表的语义、都不是 temp 表的语义**（temp 为"临时的、实例独立的、ID 可变的"场景设计）。

### 2.2 project / SDK 文件的 ID 边界

**问题**：`getFiles()`（项目文件）与 `getSdkArkFiles()`（SDK 文件）需要区分两类文件。修改前靠两个独立 Map（filesMap / sdkArkFilesMap）；修改后全部文件在同一个 fileSigCanonicalizer 里，需要新的切分手段。

**方案**：`markProjectFileBoundary()`（Registry.ts:207-246）——SDK 构建阶段结束时（此后注册的都是 project 文件）记下当时的 `fileSigCanonicalizer.size()` 作为边界 `firstProjectFileSigID`。此后：

- `[1, boundary)` = SDK 文件，`[boundary, size)` = project 文件（ID 0 是 DEFAULT，两边都不属于）；
- `isProjectFileID(id)` / `isSdkFileID(id)` 只做一次数字比较；
- `getFiles()` / `getSdkArkFiles()` 从逐文件 `filter(isProjectFile)` 变为区间取模型。

**正确性前提**：构建时序上全部 SDK（含 oh_modules 依赖包）先于 project 文件注册（ModuleBuilder.prepareSdks → buildBasicInfo → genArkFiles），因此边界单调。

**为什么不拆分独立存储**：构建期和推导期需要频繁地根据Signature或ID来查找model，合并是方便查找；如果拆分成2个表，需要2个独立的属性来存各自的id，或者1个id在2个表中进行查找，增加存储复杂度或查询复杂度。

> Note: 当前只对file做了这个标志位的记录，用于区分 sdk 和 project 文件，class、namespace、method等没有做此标志位记录，后续考虑对所有ArkModel的isProject/isLibrary快速判断

### 2.3 file 和 namespace 为什么不需要 temp 表

tempFile 是身份根，没有 declaring，`isUnclear()` 恒 false，天然不可能 unclear。

代码中不存在 tempNamespace 空间是有结构性保证，论证分三层：

1. **唯一入口检查**：temp 空间的唯一写入 API 是 `TempSignatureCanonicalizer.register()`。全仓库 register 调用点**全部**针对 ClassSignature / MethodSignature / FieldSignature 三类：ClassType/FunctionType/LexicalEnvType/EnumValueType 构造器的 unclear 分支（Type.ts:677/541/1180/1259）、FieldSignature.setDeclaringFields 的 unclear **class** 分支（ArkSignature.ts:609）、MethodSignature 构造器的 unclear **class** 分支（ArkSignature.ts:887）、AbstractInvokeExpr.route / AbstractFieldRef 的 miss 分支。**不存在任何一条路径把 NamespaceSignature 传给 register**；
2. ** unclear 的根源不适用于 ns**：unclear 的定义是"declaringFile 未知"（Builtin stub、extends 目标未解析）。而 namespace 的声明链总是从**真实的 ArkFile** 出发——builder 创建 ns 时文件已知，直接传 FileSigID（SigID 构造重载）；Builtin 造 stub 只造 ClassSignature（declaringFile=DEFAULT），从不造 ns stub。ClassSignature / MethodSignature 里挂的也是 `declaringNamespaceSigID`（数字），不会把 ns 对象卷进 unclear 链；
3. **唯一的例外分支被刻意"仅标记"**：FieldSignature 值对象构造若传入 unclear 的 NamespaceSignature，该分支只置 `declaringNamespaceSigID = -1`（标记），**不登记 temp**（ArkSignature.ts:614-619 注释原文："no temp registration — the temp namespace space never had a production registrant; the unclear-ns form is a marking-only shape"）。需要取回时由调用方自持签名实例。

> Note: Namespace 是根据代码中的场景和实际测试结果来分析其不会出现的，为了简化表示，就将其删除了。如果后续有场景需要，可以再加。

### 2.4 Registry 上的配套存储：customComponentMap 与 sdkGlobalMap 多值表

- **`customComponentMap: Map<string, ClassSignature>`**：@Component 组件简单名 → 类签名。迁到 Registry 的关键原因：模块卸载（disposeModule）后条目仍需存活（ViewTree 建叶子节点要解析签名），生命周期必须独立于模块，挂在全局 Registry 上最自然。
- **`sdkGlobalMap: Map<string, ArkExport[]>`**（Registry.ts:84-93）：SDK 全局符号**多值表**。修改前是 Scene 上的 `Map<string, ArkExport>` 单值表——`interface Object`（lib.es5）与 `declare var Object: ObjectConstructor` 这类**同名多实体**互相覆盖，只能靠 copyMembers 把成员物理灌进首实体（污染模型）。修改后同名实体按登记序全部保留在列表里，成员留在各自真实声明类上，探测层逐实体查找，成员签名自然归属真实声明文件。**查询入口全部在 SdkUtils**。典型消费场景见 §4.4 例二。

> Note: `sdkGlobalMap: Map<string, ArkExport[]>` 后续要考虑删除，至少是类型推导后清除。但是要考虑接口兼容性。

### 2.5 Registry / Canonicalizer 新增 API 清单

**SignatureCanonicalizer\<S\>（正式签名空间的基础 API）**：


| API                                       | 用途                                                                                                                                                                                                                                                   | 内部使用情况                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getId(sig): number`                      | intern：已注册返回既有 ID，未注册**分配新 ID**（写路径专用）                                                                                                                                                                                           | builder 期签名注册的主力（ArkMethod/ArkClass/ArkField/ArkFile/ArkNamespace 的 setSignature 族）、ArkSignatureBuilder                                                                                                                                                                                                |
| `getExistingId(sig): number`              | 只读查询：未注册返回 -1，**不改任何状态**                                                                                                                                                                                                              | 查询热路径主力（Scene.getFile/getClass/getMethod、Registry.getArkXxxBySig、归属初筛）                                                                                                                                                                                                                               |
| `get(id): S                               | undefined`                                                                                                                                                                                                                                             | ID → canonical 签名实例（数组下标）                                                                                                                                                                                                                                                                                |
| `size() / getStats() / clear()`           | 容量 / 哈希表统计（`CanonicalizerStats` 已导出供 StageStatistics 消费）/ 重置                                                                                                                                                                          | 统计报告、dispose                                                                                                                                                                                                                                                                                                   |
| `signatureEquals(a, b)`（模块级导出函数） | **身份值比较**：缓存 hash 先比（不等比较在此短路）+ equals 终审（相等比较必然执行，canonical 实例首行引用短路）——判等协议与 canonicalizer 探测同构，只跑一遍；不依赖 Registry（区别于 ID 判等：-1 哨兵对未注册签名双向误判，getId 版另有盲写副作用） | 7 处：TypeInference.isSameType（:1174）、ModelUtils.matchType×2（:631/:634）、ArkSignature 内 4 处（MethodSignature.isMatch 的 declaring 值判等 :1097 + 工作项 I 现代化的 fieldSignatureCompare/methodSignatureCompare/classSignatureCompare :1167/:1171/:1179）——前 3 处为工作项 D 落地，后 4 处为工作项 I 落地 |

**SignatureModelCanonicalizer\<S, M\>（追加的模型存储 API）**：


| API                   | 用途                                        | 内部使用情况                                                                                        |
| --------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `setModel(id, model)` | 在既有 ID 上挂模型（要求先 intern）         | ArkClass.addMethod（终点注册）、ArkMethod.registerImplModelWithArbitration、Registry.registerXxx 族 |
| `getModel(id): M      | undefined`                                  | ID → 模型（O(1)）                                                                                  |
| `removeModel(id)`     | 置 undefined（ID 与签名保留 = 驱逐态）      | Registry.removeXxx 族、disposeModule                                                                |
| `getModels(): M[]`    | 过滤 undefined 收集全部模型（每次新建数组） | getFiles/getClasses/getMethods/getNamespaces 平面遍历、SDK 推断遍历                                 |
| `clearModels()`       | 仅清模型、签名表与 ID 稳定                  | （预留：推导后重建模型的场景）                                                                      |

**TempSignatureCanonicalizer\<S\>（temp 索引表 API）**：


| API                                                   | 用途                                     | 内部使用情况                                                                                 |
| ----------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `register(sig): number`                               | 登记（同实例幂等复用 ID）                | Type 构造 unclear 分支、FieldSignature/MethodSignature 值对象构造、InvokeExpr/FieldRef route |
| `get(id): S                                           | undefined`                               | 取 slot；undefined = 已迁移（该查 getReplacement）                                           |
| `getExistingTempId(sig): number`                      | 查对象的 tempSigID 不登记（symbol 属性） | 懒加载缓存路径（InvokeExpr/FieldRef 恢复）                                                   |
| `retireWithReplacement(id, formalId)`                 | 迁移置空 + 记账                          | 签名 setter 的迁移触发（ClassType.setClassSignature、route() formal 命中分支）               |
| `getReplacement(id): number`                          | 查迁移账（-1 = 无记录）                  | 三级查的第 3 级（共享持有者直达 formal）                                                     |
| `size() / totalRegistered() / retired() / getStats()` | live / 历史 / 已迁移计数（三数自洽）     | `--stats` 报告、checkTempSignatureCompleteness                                               |
| `registeredIds() / liveIds()`                         | 全区间审计视图 / 遗留视图                | TempSpaceDiagnose 诊断工具                                                                   |

**SignatureCanonicalizerRegistry API**：


| API                                                                                  | 用途                                                                     | 内部使用情况                                                         |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `getInstance() / dispose()`（静态）                                                  | 单例获取 / 全清（Scene.dispose 与 clear 调用）                           | 全框架                                                               |
| `getXxxId(sig)`（×5）                                                               | 各空间只读 ID 查询（@internal）                                          | 工具层散点                                                           |
| `getXxxById(id)` / `getXxxBySig(sig)`（×5 各 2 个）                                 | ID 直查 / 签名只读查模型                                                 | 查询热路径（取代旧 Scene 的 Map.get）                                |
| `registerFile/registerClass/registerMethod/registerNamespace/registerField`          | 模型注册（含 id>0 守卫）                                                 | 各模型 addXxx 终点 / setSignature                                    |
| `removeFile/removeClass/removeClassModel/removeMethod/removeNamespace/removeField`   | 模型驱逐（removeClass 顺带 customComponentMap；removeClassModel 不动它） | disposeModule、ArkClass.removeMethod 等                              |
| `registerCustomComponent / unregisterCustomComponent`                                | 组件名表维护                                                             | ArkClassBuilder、removeClass                                         |
| `markProjectFileBoundary / getFirstProjectFileSigID / isProjectFileID / isSdkFileID` | project/SDK ID 边界（§2.2）                                             | buildSdkStage、loadModule、getFiles/getSdkArkFiles                   |
| `getTempSpacesStats / settleTempSpaces`                                              | temp 三空间统计快照（settle 的 async 签名仅兼容保留）                    | StageStatistics.recordSignatureStats、Scene.settleTempSignatureStats |

---

## 3. 适配新架构的改造

### 3.1 ArkSignature — 签名类（前提，先于一切模型介绍）

签名类是整个 ID 化的前提：**模型存的 ID 就是签名的 ID，签名不稳则一切皆休**。本节先讲签名怎么改的，后面各 model 节的 ID 字段才有意义。

**表 1：字段/数据结构的修改**


| 序号 | 签名类              | 修改前                             | 修改后                                                                                       | hashcode 组成                                                                                                                                                          | 必要性                              |
| ---- | ------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 1.1  | FileSignature       | `hashcode` 字段（供 toMapKey）     | 仅`hashCode`（构造时算好缓存）                                                               | `hashString32(projectName)` + `hashString32(fileName)`                                                                                                                 | canonicalizer 查找走数字 hash       |
| 1.2  | NamespaceSignature  | 两个**对象引用**                   | 两个**数字**：`declaringFileSigID` + `declaringNamespaceSigID?`                              | `declaringFileSigID` + `hashString32(namespaceName)` + `declaringNamespaceSigID ?? 0`                                                                                  | 签名树不再嵌套持有对象图            |
| 1.3  | ClassSignature      | 同 1.2                             | 同上                                                                                         | `declaringFileSigID` + `hashString32(className)` + `declaringNamespaceSigID ?? 0`                                                                                      | 同上                                |
| 1.4  | FieldSignature      | 单个对象引用`declaringSignature`   | **三字段**：`declaringClassSigID?` / `declaringNamespaceSigID?` / `declaringClassTempSigID?` | `declaringClassSigID ?? 0` + `declaringNamespaceSigID ?? 0` + `declaringClassTempSigID ?? 0` + `hashString32(fieldName)` + `staticFlag`；**不含 type**（可变字段排除） | 两个 ID 空间分开存；unclear 走 temp |
| 1.5  | MethodSignature     | `declaringClassSignature` 对象引用 | `declaringClassSigID`（-1 = unclear）+ `declaringClassTempSigID?`                            | `declaringClassSigID` + `declaringClassTempSigID ?? 0` + `hashString32(methodSubSignature.toString())`；**不含 returnType**（可变字段排除）                            | 方法只声明在类里                    |
| 1.6  | AliasClassSignature | aliasName 不参与身份               | aliasName 升格为身份维度 + 构造器**双注册**                                                  | 同 1.3 +`aliasHashCode`（含 aliasName）                                                                                                                                | 防误合并；by-alias 查询直达 model   |
| 1.7  | 全部 6 类           | 无 hash 缓存                       | 构造时`hashCode` 缓存到 readonly 字段                                                        | —（见各行）                                                                                                                                                           | §1.4 Layer 1                       |

**表 2：接口/方法的修改**


| 序号 | 签名类       | API                                                                | 修改类型 | 说明                                                                      |
| ---- | ------------ | ------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------- |
| 2.1  | 全部 5 类    | `constructor` SigID 重载                                           | **+**    | 推荐：`new ClassSignature(name, fileSigID, nsSigID?)` 等，数字直存        |
| 2.2  | 全部 5 类    | `constructor` 值对象重载                                           | **D**    | 保留但标 deprecated                                                       |
| 2.3  | 全部 5 类    | `DEFAULT`                                                          | **~**    | static 字段 → lazy getter，从 registry`get(0)` 取                        |
| 2.4  | 全部 5 类    | `getHashCode()` / `equals()`                                       | **+**    | 构造时缓存 hash + 逐字段语义比较（从快到慢短路）；可变字段排除（1.4/1.5） |
| 2.5  | 全部 5 类    | `isUnclear()`                                                      | **+**    | 判断"声明链上文件来源未知"（追溯 declaringFileSigID === 0）               |
| 2.6  | 全部 5 类    | `toMapKey()`                                                       | **D**    | 5 类全部标 @deprecated（生产消费者归零，保留仅为对外兼容）                |
| 2.7  | NS/Class     | `getDeclaringFileSignature()` / `getDeclaringNamespaceSignature()` | **~**    | 经 Registry 按 SigID 反查；stale 时降级 DEFAULT + error log               |
| 2.8  | Method/Field | `getDeclaringClassSignature()` / `getDeclaringSignature()`         | **~**    | **三级查 + 惰性物化**：formal → temp slot → 替换记录（§1.6）           |
| 2.9  | Class        | `setClassName()`                                                   | **D**    | 改名破坏缓存 hash，应新建实例                                             |
| 2.10 | Method/Field | declaring 侧双字段（SigID + TempSigID）                            | **+**    | `declaringClassSigID`(-1=unclear) + `declaringClassTempSigID?`            |

**三级查 + 惰性物化**——`getDeclaringClassSignature()` / `getDeclaringSignature()` 的取回协议（§1.6 temp→formal 切换的核心消费端）：

1. **第一级（formal）**：`declaringClassSigID >= 0` → `classSigCanonicalizer.get(id)` 取 formal canonical 实例。绝大多数查询在此结束（签名已注册 formal 或从未走过 temp）；
2. **第二级（temp slot）**：`declaringClassTempSigID !== undefined` → `tempClassSigCanonicalizer.get(tempId)` 取构造时登记的原始实例（尚未迁移的 temp 签名，如 Builtin stub）；
3. **第三级（replacement 替换记录）**：slot 已空（该签名已迁移）→ `getReplacement(tempId)` 拿到 formalId → 取 formal 实例返回。

**惰性物化**：当第三级命中时，调用方**顺手把自己的 `declaringClassSigID` 写成 formalId**（tempSigID 保留作"曾 temp"审计痕迹）——下次访问直接走第一级，不再需要经过三级查。这意味着每个持有者的迁移是"自驱动的"：不需要任何主动迁移代码，只要第一次访问时完成物化即可。

具体代码路径见 §1.6 的举例（举例中的第 5 步"共享者延伸"就是惰性物化的完整演示）。

**表 3：API 兼容性**


| 序号 | deprecated API                  | @deprecated | 内部调用                            | 替代（表 2 序号）           | 清理建议                                                  |
| ---- | ------------------------------- | ----------- | ----------------------------------- | --------------------------- | --------------------------------------------------------- |
| 3.1  | NS/Class 值对象重载             | ✓          | **0 处**                            | 2.1（SigID 重载）           | 可安全移除                                                |
| 3.2  | FieldSignature 值对象重载       | ✓          | **18 处**（ArkValueTransformer 等） | 2.1 + 2.2（B' 路由）        | **不可移除**——unclear 签名经此路由 temp（内部基础设施） |
| 3.3  | MethodSignature 值对象重载      | ✓          | **19 处**（Builtin 等）             | 2.1 + 2.2（B' 路由）        | 同上——Builtin stub 池依赖                               |
| 3.4  | `ClassSignature.setClassName()` | ✓          | **0 处**                            | 新建实例（见 2.9）          | 可安全移除                                                |
| 3.5  | 全部 5 类`toMapKey()`           | ✓          | **0 处**（工作项 B/D 后）           | 2.4（signatureEquals）+ 2.5 | 可安全移除                                                |

> Note: 构造函数的值对象重载原本是计划全部deprecated，现在unclear sig的场景还是会使用值对象重载。看看后续是继续使用，还是全部使用ID更好。

### 3.2 Scene 层（Scene.ts，1769 → 1596 行）

**改动前逐项痛点（围绕 ID 化）**：

- **索引层**：5 个字符串 key 的 Map（filesMap/classesMap/methodsMap/namespacesMap/sdkArkFilesMap）——每个 key 都是一份拼接字符串；签名对象多实例化（88+ 处 `new`），同一逻辑签名值不同实例，`===` 比较有 6 处已知缺陷；methodsMap 与模型的真实状态会漂移，才需要 `getMethodsMap(refresh)` 这种"强制重建索引"的补丁接口；
- **关系层**：模型互指靠对象指针，Scene 还要给每个模型做 `setScene()` 级联传播（模型要拿 scene 才能反查兄弟模型）；
- **流程层**：构建编排全部内联在 Scene，`inferTypes` 每轮对 filesMap 做全量拓扑排序（`sortByDependency`），构建工作态构建完不释放；
- **生命周期**：dispose 只清静态缓存，单测之间 Scene 的 Map 残留互相污染。

**表 1：字段的修改**


| 序号 | 字段                                                                                       | 修改前                         | 修改后                                                        | 必要性                                                |
| ---- | ------------------------------------------------------------------------------------------ | ------------------------------ | ------------------------------------------------------------- | ----------------------------------------------------- |
| 1.1  | `filesMap/classesMap/methodsMap/namespacesMap`                                             | `Map`，key = toMapKey() 拼接串 | **全部删除** → Registry 4 个 canonicalizer                   | 字符串重复分配 + 拼接开销 + 索引漂移，ID 化的原始动机 |
| 1.2  | `sdkArkFilesMap`                                                                           | `Map`（SDK 文件单独一份）      | 删除 → 与 project 文件同空间，按 ID 边界切分（§2.2）        | 同一文件只会误入其中一个 Map 的隐患消除               |
| 1.3  | `sdkGlobalMap`                                                                             | `Map` 单值                     | 迁 Registry 并**多值化**（§2.4）                             | 同名多实体覆盖问题                                    |
| 1.4  | `customComponentMap`                                                                       | Scene 字段                     | 迁 Registry（模块卸载后存活）                                 | 生命周期与模块解耦                                    |
| 1.5  | 构建工作态（ohPkgContentMap / baseUrl / projectFiles / globalModule2PathMapping 等十余个） | 构建完成后驻留 Scene           | 迁**SceneBuilder**，构建入口结束 `releaseSceneBuilder()` 释放 | 大工程的工作态可达数十 MB，不该陪 Scene 活一辈子      |
| 1.6  | （新增）`activeBuilder: SceneBuilder`                                                      | —                             | 构建期一次性上下文（§4.1）                                   | 承接上面的迁移                                        |
| 1.7  | （新增）`builtFileOrder: number[]`                                                         | —                             | DFS 后序 = 严格拓扑序，推断期零排序的事实源                   | 取代每轮 sortByDependency                             |
| 1.8  | （新增）`stageStatistics` + exit hook                                                      | —                             | 阶段统计（§4.2）                                             | 性能可观测                                            |

**表 2：接口的修改**


| 序号 | 接口                                 | 修改类型 | 说明                                                                                                                                                                                                  |
| ---- | ------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1  | `getFile/getClass/getNamespace(sig)` | **~**    | `xxxMap.get(sig.toMapKey())` → `registry.getArkXxxBySig(sig)`（getExistingId + getModel，只读不 intern）                                                                                             |
| 2.2  | `getMethod(sig)`                     | **~**    | methodsMap 字符串查 → 同上 fast path +**声明类内遍历兜底**（闭包重建的签名可能未注册为 model），兜底**只读不回填**（查询路径不许写）                                                                 |
| 2.3  | `getFiles()/getSdkArkFiles()`        | **~**    | 遍历对应 Map / filter → ID 区间切分取模型（§2.2），getSdkArkFiles 显式排除 ID 0                                                                                                                     |
| 2.4  | `getMethods()`                       | **~**    | 遍历 methodsMap → methodSigCanonicalizer 平面遍历收集                                                                                                                                                |
| 2.5  | `getMethodsMap(refresh)`             | **-**    | **整个方法删除**——canonicalizer 是唯一事实源，ID 稳定无需 refresh                                                                                                                                   |
| 2.6  | `buildBasicInfo()/genArkFiles()`     | **~**    | 内联构建 → 委托`SceneBuilder.parseProjectConfigs()+buildSdkStage()` 与 `buildProjectFiles()+buildAllMethodBodies()`；`collectAllMethods()` 私有遍历删除，改 `SceneBuilder.forEachProjectMethod`      |
| 2.7  | `inferTypes()`                       | **~**    | 每轮`sortByDependency` 全量排序 → 正序遍历 `builtFileOrder`；收尾 `checkTempSignatureCompleteness` + 可选 `CanonicalizerValidator.validateAll()` + 三 dispose + `recordSignatureStats('post-infer')` |
| 2.8  | `dispose()`                          | **~**    | 清 6 项静态缓存 → 新增`disposeClassMap()`、exit hook 摘除、**`Registry.dispose()`**、`ArkSignatureBuilder.clearComponentStubCache()`                                                                 |
| 2.9  | `disposeModule()`                    | **~**    | 遍历 Map 删模型 → 全部经`Registry.removeXxx()` 静态方法；新增 field model 驱逐、`removeExtendedClass`、`setAST(null)` + `clearSourceCode()`                                                          |

**表 3：API 兼容性**


| 序号 | deprecated API                  | @deprecated | 内部调用                                | 替代方案                                | 清理建议   |
| ---- | ------------------------------- | ----------- | --------------------------------------- | --------------------------------------- | ---------- |
| 3.1  | `getSdkGlobal(name)`            | ✓          | **0 处**                                | `SdkUtils.getSdkGlobal()`（40+ 处直连） | 可安全移除 |
| 3.2  | `getSdkGlobalMap()`             | ✓          | **0 处**                                | `Registry.getInstance().sdkGlobalMap`   | 可安全移除 |
| 3.3  | `getMethod(sig, refresh?)` 双参 | ✓          | **0 处**                                | 单参版（refresh 无效）                  | 可安全移除 |
| 3.4  | `inferSimpleTypes()`            | ✓          | **0 处**（存量调用仅 tests/）           | `inferTypes()`                          | 可安全移除 |
| 3.5  | `getClassMap()`                 | ✓          | **0 处**（连带 3 个私有 helper 成死链） | `getClasses()`                          | 可安全移除 |
| 3.6  | `getGlobalVariableMap()`        | ✓          | **0 处**（连带 4 个私有 helper）        | 基于 canonicalizer 重实现               | 可安全移除 |
| 3.7  | `inferTypesOld()`（历史遗留）   | ✓          | **0 处**                                | `inferTypes()`                          | 可安全移除 |
| 3.8  | `clear()`（历史遗留）           | ✓          | **0 处**                                | `inferTypes()`                          | 可安全移除 |

### 3.3 ArkNamespace（385 → 656 行）

**表 1：字段的修改**


| 序号 | 字段                                                               | 修改前            | 修改后                                                                                                                | 必要性                                                              |
| ---- | ------------------------------------------------------------------ | ----------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1.1  | `declaringArkFile` / `declaringArkNamespace` / `declaringInstance` | 三个**对象引用**  | `declaringFileID: number`（-1 哨兵）+ `declaringNamespaceSigID?: number`（undefined = 顶层），getter 经 Registry 反查 | ID 化核心：对象指针 → 数字                                         |
| 1.2  | `namespaceSignature`                                               | 签名对象引用      | `namespaceSigID: number`（`setSignature` 注册点赋值）                                                                 | setter 即注册（§1.5）                                              |
| 1.3  | `defaultClass`                                                     | ArkClass 对象引用 | `defaultClassSigID`                                                                                                   | 同上                                                                |
| 1.4  | `namespaces: Map`                                                  | 名字 key 的 Map   | `topNamespaceSigIDs: Int32Array + count`（懒初始化、2x 扩容、swap-remove 删除）                                       | Map per-entry ~70-90 字节 → Int32Array 4 字节/项；无子元素时不分配 |
| 1.5  | `classes: Map`                                                     | 名字 key 的 Map   | `topClassSigIDs: Int32Array + count`                                                                                  | 同上                                                                |
| 1.6  | `sourceCodes/lineCols`                                             | 源码片段数组      | 仅`originFullPositions`（源码统一存 ArkFile，1.0.91 起的既有方向）                                                    | 非本次重点                                                          |

**表 2：接口的修改**


| 序号 | 接口                           | 修改类型 | 说明                                                                                                                                                |
| ---- | ------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1  | 构造函数                       | **+**    | ID 注入重载`new ArkNamespace(declaringFileID, nsSigID?, sig?)`；`setSignature` 是注册点（intern + 首建注册）                                        |
| 2.2  | `getDeclaringArkFile()`        | **~**    | 返回字段 → Registry 按 declaringFileID 反查                                                                                                        |
| 2.3  | `getNamespace(sig)`            | **~**    | 按 name key 查 Map →**三步**：① 签名的 declaringNamespaceSigID 直比本 ns SigID（O(1) 归属初筛）→ ② canonicalizer 值查 → ③ 顶层 SigID 索引校验 |
| 2.4  | `getNamespaceWithName(name)`   | **~**    | Map.get(name) → 拼"本容器归属签名"走 canonicalizer 直查——签名归属是唯一真相                                                                      |
| 2.5  | `getNamespaces()/getClasses()` | **~**    | 返回 Map values → 遍历 SigID 数组 + getModel 收集                                                                                                  |

**表 3：API 兼容性**


| 序号 | deprecated API                                                                     | @deprecated | 内部调用 | 替代方案                               | 清理建议   |
| ---- | ---------------------------------------------------------------------------------- | ----------- | -------- | -------------------------------------- | ---------- |
| 3.1  | 无参构造`new ArkNamespace()`                                                       | ✓          | **0 处** | ID 注入构造                            | 可安全移除 |
| 3.2  | `setDeclaringArkFile(f)`                                                           | ✓          | **0 处** | `setDeclaringFileID(id)` / ID 注入构造 | 可安全移除 |
| 3.3  | `setDeclaringArkNamespace(ns)`                                                     | ✓          | **0 处** | `setDeclaringNamespaceID(id)`          | 可安全移除 |
| 3.4  | `getCode/setCode/getCodes/setCodes/addCode`（1.0.91 历史族）                       | ✓          | **0 处** | 源码统一在 ArkFile                     | 可安全移除 |
| 3.5  | `getLine/setLine/getColumn/setColumn/getLineColPairs/setLineCols`（1.0.91 历史族） | ✓          | **0 处** | `get/setOriginFullPositions()`         | 可安全移除 |

**不同文件的 namespace 合并处理**（TS 允许同名 namespace 跨文件/跨声明块声明，语义上是同一实体）：

**先澄清"合并"的两个层次**——签名含 `declaringFileSigID`（表 1 序号 1.1）决定了同名 namespace 的两种形态走完全不同的路：


| 形态                                                        | 模型层行为                                                                              | 成员可见性由谁保证                                                                                              |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **同文件多声明块**（a.ets 里 `namespace Util {}` 出现两次） | **合并为一个 ArkNamespace**——签名值相同（name + fileSigID + 父链全等）→ 同一 nsSigID | 直接合并进同一模型                                                                                              |
| **跨文件同名**（lib.es5 与 lib.es20XX.intl 各声明 `Intl`）  | **不合并**——fileSigID 不同 → 签名值不同 → **两个独立 ArkNamespace 模型**            | 推导期探测层`SdkUtils.getNamespacedSiblingClasses`（工作项 L，SdkUtils.ts:378-394）遍历同名 ns 实体逐个找同名类 |

**同文件多声明块的处理**（合并主场景）——以 `a.ets`（FileSigID = 5，ID 均为示意值）为例：

```typescript
// a.ets（FileSigID = 5）
namespace Util { class A {} }     // 声明块 1
namespace Util { class B {} }     // 声明块 2（TS 声明合并：语义上是同一实体）
```

- **修改前**（"先建后合"，builder 与 model 两层都按裸名字搬运）：

  1. **builder 层**（旧 ArkFileBuilder.ts:107-127）：每个声明块**各自完整建模型**，收进临时数组——块 1 产出 ns#1（含 A），块 2 产出 ns#2（含 B），**两份对象并存**；
  2. 文件遍历结束后 `mergeAndAddNamespaces`（:187-198）→ `mergeNameSpaces` 按**名字**把 ns#2 的 classes/namespaces 逐个**搬运**进 ns#1，ns#2 整体丢弃；再 `arkFile.addNamespace` 走名字键 Map；
  3. **model 层**（旧 ArkNamespace.ts:67-76）：`addNamespace` 按 `namespaces.get(name)` 名字查重，同名同样搬运合并。

  ```
  修改前数据流（a.ets 双声明块）：
    块1 → new ns#1{name:'Util', classes:[A]} ─┐
    块2 → new ns#2{name:'Util', classes:[B]} ─┤→ mergeNameSpaces（按名合并）
                                             └→ ns#1.classes += [B]（搬运）；ns#2 丢弃
                                                file.namespaces['Util'] = ns#1   （名字键 Map）
  ```

  问题：

  - 每块都建完整模型再丢弃一份——双份对象 + 搬运开销；
  - 判据是裸名字，无签名值校验（名字撞了就合，防御性差）；
  - 搬运只搬 classes/namespaces，defaultClass、modifiers 等字段在合并时的取舍隐晦；
  - 虽然合并时舍弃ns#2，但是其下的class、method等declaring namespace仍然使用ns#2，导致根据signature查找时出现错误
- **修改后**（builder 层"建前复用"成主路径 + model 层签名值查重退化为兜底）：

  1. **builder 层签名复用**（ArkFileBuilder.ts:128-141）：每个声明块先 `buildNamespaceSignature`（ArkNamespaceBuilder.ts:34-40，`NamespaceSignature('Util', fileSigID=5)`）→ `registry.getNamespaceBySig(sig)` **只读值查**（getExistingId + getModel，不 intern 不注册）——
     - **块 1**：miss → `new ArkNamespace(fileSigID, undefined, sig)` → setSignature 三态 intern → **nsSigID = 12**；续建成员：A 的 `ClassSignature('A', 5, ns=12)` → **classSigID = 23**；ns（=Util#12）的 `topClassSigIDs = [23]`；
     - **块 2**：同值签名（'Util', 5）hash+equals 命中 canonicalizer → **直接复用 SigID 12 的既有模型续建**——B → **classSigID = 24**；`topClassSigIDs = [23, 24]`。**没有第二份 ns 对象、没有搬运、没有丢弃**——合并在"建之前"就被消解了；
  2. **model 层兜底**（ArkNamespace.ts:103-115）：`addNamespace` 查重改走 `getNamespace(ns.getSignature())` 三步法（① 签名的 declaringNamespaceSigID 直比本 ns SigID 的 O(1) 归属初筛 → ② canonicalizer 值查 → ③ 顶层 SigID 索引校验）——命中 existing 则 `existing.addArkClass(cls)` / `existing.addNamespace(ns)` 递归合并子内容后 **return（不追加 SigID 到本容器索引）**——合并的子元素归 existing 管；未命中则仅 `addTopNamespaceSigID`（**工作项 O 后不再注册 model**——注册由 setSignature 唯一保证，与 K 项对齐，本方法只维护顶层索引）。builder 复用路径下此分支不触发；它服务于"独立构建完成的 ns 后到"的调用方（测试直构 / 非 builder 路径）。

  ```
  修改后数据流（a.ets 双声明块）：
    块1 → 拼签名('Util',5) → 值查 miss → new ns#12 → 续建 A(23) → topClassSigIDs=[23]
    块2 → 拼签名('Util',5) → 值查命中 ns#12 → 复用续建 B(24) → topClassSigIDs=[23,24]
    （canonicalizer: NamespaceSignature('Util',5) ↔ ID 12 ↔ 唯一 model —— 一份对象，零搬运）
  ```
- **关键差异**：

  - 合并判据从"名字相同"变为"签名值相同"；
  - 主路径从"先建后合"变为"建前复用"（双份对象与搬运消失）；
  - 索引里每个 SigID 唯一对应一个活模型，不会出现两个 SigID 指向同一逻辑实体的双记账
  - 内部class、method等的declaring namespace也是统一的

### 3.4 ArkClass（777 → 1531 行，改动最大）

**表 1：字段的修改**


| 序号 | 字段                                                | 修改前                      | 修改后                                                                                                                                                                                                                   | 必要性                                                                                                                                          |
| ---- | --------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1  | `declaringArkFile` / `declaringArkNamespace`        | 对象引用                    | `declaringFileID: number` + `declaringNamespaceSigID?: number`                                                                                                                                                           | ID 化核心                                                                                                                                       |
| 1.2  | `classSignature`                                    | 签名对象引用                | `classSigID: number`（`setSignature` 注册点赋值并缓存，ArkClass.ts:395-404）                                                                                                                                             | setter 即注册                                                                                                                                   |
| 1.3  | `methods/staticMethods: Map`                        | 名字 key 的 Map，重载数组   | `methodNameIndex/staticMethodNameIndex: Map`（**名字 → MethodSigID 数组**）。**2ea2421b 从 SigID 平铺 Int32Array 改回名字索引**——方法名不足以构造签名（身份含参数列表），名字查询（getMethodWithName 族）必须按名索引 | 兼顾两类查询：按名（索引）与按签名（canonicalizer 直查）；`getMethods` 顺序稳定性刻意维护（非重载语言 set 保插入序、重载语言 isMatch 原位替换） |
| 1.4  | `fields/staticFields: Map`                          | 名字 key 的 Map             | `topFieldSigIDs/topStaticFieldSigIDs: Int32Array + count`                                                                                                                                                                | 字段名可拼签名，直接 SigID 索引                                                                                                                 |
| 1.5  | `extendedClasses: Map`                              | 名字 key 的子类反向引用 Map | `extendedClassSigIDs: Int32Array`（`getExtendedClasses()` 每次重建 Map 视图兼容旧 API；热路径用 `getExtendedClassList()` 免重建）                                                                                        | 反向引用 ID 化                                                                                                                                  |
| 1.6  | `defaultMethod/instanceInitMethod/staticInitMethod` | 三个 ArkMethod 对象引用     | 三个 MethodSigID（undefined = 无）                                                                                                                                                                                       | 同上                                                                                                                                            |
| 1.7  | `heritageClasses`                                   | `Map`                       | **刻意不 ID 化，保持原样**                                                                                                                                                                                               | 回填依赖类型推断、key 是源码名字，时序复杂（design.md D5 明确本轮不动）                                                                         |

**表 2：接口的修改**


| 序号 | 接口                                            | 修改类型 | 说明                                                                                                                                                                                                                                                                            |
| ---- | ----------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1  | 构造函数                                        | **+**    | ID 注入重载`new ArkClass(declaringFileID, nsSigID?, classSig?)`；`setSignature` 三态处理：新值首建注册 / 驱逐态恢复补注册 / 他 model 已持有不覆盖                                                                                                                               |
| 2.2  | `getDeclaringArkFile()`                         | **~**    | 返回字段 → Registry 按 declaringFileID 反查                                                                                                                                                                                                                                    |
| 2.3  | `getField(sig)`                                 | **~**    | 按 name key 查 fields Map → 按传入签名整体身份 canonicalizer 直查 +**归属守卫** `fld.getDeclaringClassID() === this.classSigID`——**防他类字段越界命中，无守卫时实测 100% 越界**（ArkClass.ts:569-584 注释）                                                                  |
| 2.4  | `getFieldWithName/getStaticFieldWithName(name)` | **~**    | Map.get(name) → 现场构造临时`FieldSignature`（含本类 SigID）canonicalizer 直查（miss 即 null）——已知热路径分配开销（bug #17）                                                                                                                                                |
| 2.5  | `getMethod(sig)`                                | **~**    | methods Map 按名查 + isMatch 遍历 →**三段式**：① canonicalizer 值查 + 归属守卫（fast path）→ ② 类内遍历 `findMatchingMethod`（isMatch 兜底，闭包重建签名场景）→ ③ 埋点统计（模块级 `getMethodFallbackStats` 观测 fast path 命中率）                                       |
| 2.6  | `addMethod(method, originName?)`                | **~**    | **删除 originName 参数**（见下方嵌套方法专题）；名字 + originName 双键索引 → SigID 校验（id ≤ 0 拒绝 + error log）→ `setModel` 无条件注册（合并链终点胜者）→ **B1 全槽注册**（declareSigIDs 各槽也注册到本方法，body 持有者优先仲裁，§3.6 n:1 专题）→ `updateMethodIndex` |
| 2.7  | `removeMethod(method)`                          | **~**    | **按名删除全部同名方法** → **按 SigID 精确删除这一个** + 同步 `Registry.removeMethod`（impl + declare 槽）——语义变化，重载方法不再被误删                                                                                                                                     |
| 2.8  | `addExtendedClass/removeExtendedClass`          | **~**    | Map set/delete → SigID 数组 append / swap-remove（查重）                                                                                                                                                                                                                       |

**表 3：API 兼容性**


| 序号 | deprecated API                                                                             | @deprecated | 内部调用                                                                     | 替代方案                                                        | 清理建议                                                                                             |
| ---- | ------------------------------------------------------------------------------------------ | ----------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 3.1  | 无参构造`new ArkClass()`                                                                   | ✓          | **0 处**                                                                     | ID 注入构造（表 2 序号 2.1）                                    | 可安全移除                                                                                           |
| 3.2  | `setDeclaringArkFile(f)`                                                                   | ✓          | **0 处**（注意：src 内 8 处同名调用均为 ArkImport 的**非** deprecated 方法） | ID 注入构造                                                     | 可安全移除                                                                                           |
| 3.3  | `setDeclaringArkNamespace(ns)`                                                             | ✓          | **0 处**                                                                     | 同上                                                            | 可安全移除                                                                                           |
| 3.4  | `getStaticFields(classMap)` 双参                                                           | ✓          | **0 处**                                                                     | 无参版（classMap 参数史前遗留从未使用；无参版 src 内也 0 调用） | 可安全移除                                                                                           |
| 3.5  | `getInstanceInitMethod()` / `getStaticInitMethod()`（兜底返回 `new ArkMethod()` 的非空版） | ✓          | **0 处**                                                                     | `getInstanceInitMethodOrNull()` / `getStaticInitMethodOrNull()` | 可安全移除（兜底里的`new ArkMethod()` 是 ArkMethod 无参构造仅存的 2 处内部调用，随外层死链一并消失） |
| 3.6  | `getLine/setLine/getColumn/setColumn`、`setCode`（1.0.91 历史族）                          | ✓          | **0 处**                                                                     | FullPosition 族                                                 | 可安全移除                                                                                           |

**必须处理项1：不同文件的 class 合并处理**（TS 的 interface 声明合并 / SDK 同名类跨文件增补）：

**两个层次**——同文件（模型层 SigID 直查 + copyMembers 搬运）与跨文件 SDK（全局层多值表 + 探测层查找）。

**层次一：同文件同名 class**——注意与 namespace 的关键差异：**class builder 不做"建前复用"**（`buildAndExportClass` 每次 `new ArkClass` 后完整构建，ArkFileBuilder.ts:143-148；namespace 是先 `getNamespaceBySig` 值查复用再建）。所以同文件两个同名声明块各建一份模型对象，但 intern 到**同一个 classSigID**（签名值相同），合并发生在 model 层 `ArkFile.addArkClass`。以 lib.es5.d.ts（FileSigID = 3）为例：

```typescript
// lib.es5.d.ts（FileSigID = 3）
interface Promise {        // 声明块 1 → ArkClass#1，ClassSignature('Promise', 3) → classSigID = 31
    then(onfulfilled): Promise;
}
interface Promise {        // 声明块 2 → ArkClass#2，同值签名 → 同 classSigID = 31
    catch(onrejected): Promise;
}
```

- **修改前**（旧 ArkFile.ts:203-220）：`classes.get(originName ?? name)` 名字查——命中则 `copyMembers(新, 旧)` 灌成员；**另有 origin 裸名键预置**：非匿名类且名字含 `$`（NAME_DELIMITER）时提取裸名（`Local$C-outer` → `Local`）、`!classes.has(裸名)` 时**再注册一份裸名键**（首注册占键）——这是嵌套/局部类按裸名可达的旧机制（缺陷见必须处理项2）；
- **修改后**（ArkFile.ts:239-249）：`getTopClassByID(arkClass.getClassSigID())` SigID 直查（数组/集合一次数字比较，替代字符串 key 的 Map.get）——同 classSigID 命中 → `SdkUtils.copyMembers(新, 旧)`（搬运规则见下表，合并语义保留）；未命中 → 仅 `topClassSigIDSet.add(classSigID)`。

**层次二：跨文件 SDK 全局符号的合并策略反转**（SdkUtils.ts:264-316，配合 §2.4 多值表）——以 `interface Object` + `declare var Object: ObjectConstructor`（lib.es5.d.ts 内的 var 侧，跨文件场景如 `Intl` 在 lib.es5 与 lib.es20XX.intl 同理）为例：

- **修改前**（`sdkGlobalMap: Map<string, ArkExport>` **单值**表，旧 SdkUtils.ts:229-270）：
  1. `interface Object` 先登记 → `map['Object'] = interfaceCls`（classSigID = 61）——单值表只能装一个实体；
  2. var 侧的 `Object` Local 后到（loadGlobalLocal，旧 :259-263）：`map['Object']` 已被 interfaceCls 占住且 local 类型是 ClassType → 取 `map['ObjectConstructor']` → **`copyMembers(ObjectConstructorCls, interfaceCls)`——把构造器类的成员物理灌进 interface 实体**；
  3. **归属失真具体化**：`Object.create()` 声明在 ObjectConstructor，灌入后其方法模型的 declaring class 变成 `lib.es5.d.ts: Object`（interface 实体）——按成员签名判别"来自哪个文件/哪个声明"的下游（如 ES 版本判别）拿到的是假地址；类别冲突场景（enum vs interface，旧 :236-239）更是 delete 旧实体 + 重新登记（成员双向灌完后覆盖）；
- **修改后**（`Map<string, ArkExport[]>` **多值**表 + 探测层查找，成员零搬运）：
  1. **登记期**（loadAPI 首登记 + loadClass/loadGlobalLocal 三场景）：同名实体按登记序**全部保留**——`map['Object'] = [interfaceCls(61), localObject(类型 ObjectConstructor)]`；**成员留在各自真实声明类**（同名 interface 跨文件增补：不灌成员，TS 语义同一实体但各文件成员留各处；类别冲突：两实体共存，新者仅提升为单值视图 `promoteGlobal`；abc 的 attr/interface 挂载分裂：var 侧登记为多值候选 `appendGlobal`）；
  2. **探测期** `getSdkGlobalMemberClasses('Object')`（SdkUtils.ts:334-369）——成员探测改在完整实体列表上做：

```
遍历 map['Object'] 实体列表（登记序）：
  ├─ interfaceCls ∈ ArkClass          → 直接收入候选集
  └─ localObject ∈ Local              → 取其 ClassType 的签名 ObjectConstructor
        ├─ classSigCanonicalizer.getExistingId → 35 → getModel(35)
        │    = ObjectConstructorCls    → 收入候选集
        └─ 连带 getSdkGlobals('ObjectConstructor') 名下
             全部同名 ArkClass 实体    → 逐个收入（跨文件同名增补都在）
  （seen 去重；成员在所有候选上逐个探测）
```

3. **结果**：`toString` 探测命中 interfaceCls（declaring = `lib.es5.d.ts: Object` ✓），`create` 探测命中 ObjectConstructorCls（declaring = `lib.es5.d.ts: ObjectConstructor` ✓）——成员签名自然归属真实声明类，无一处篡改。

**前后对照**：


| 维度       | 修改前（单值 + 灌成员）                        | 修改后（多值 + 探测）                            |
| ---------- | ---------------------------------------------- | ------------------------------------------------ |
| 同名实体数 | 1（后到者覆盖或被灌散）                        | 全部保留（登记序）                               |
| 成员归属   | copyMembers 物理搬运，declaring 被篡改为首实体 | 成员留真实声明类                                 |
| 查询成本   | 单实体 Map.get（快但结果不全/不准）            | 探测层遍历实体列表（慢一点但结果完整且归属真实） |
| 类别冲突   | delete + override，行为混乱                    | 两实体共存，单值视图取首（first-win 兼容旧语义） |

**必须处理项2：function 内嵌套 class 声明的改造**（新增 `localClassSigIDs` 机制，ArkMethod.ts:988-1012）：

以这段代码为例（含同名遮蔽场景；ID 为示意值）：

```typescript
class C {                          // classSigID = 9
    outer() {
        class Local { }            // 组合名 Local$C-outer，classSigID = 31
        function inner() {
            class Local { }        // 组合名 Local$C-%inner$outer，classSigID = 47
            return new Local();    // 语义应命中 inner 自己的 Local(47) —— 词法遮蔽
        }
        return new Local();        // 语义应命中 outer 的 Local(31)
    }
}
```

**组合名的生成规则**（ArkClassBuilder.ts:73-92 `newGenClassName`）：方法内声明的类，模型类名 = 裸名 + `$`（ANONYMOUS_CLASS_DELIMITER）+ 方法所属类名 + `-`（NESTED_CLASS_METHOD_DELIMITER）+ 方法名。嵌套方法的方法名本身又是 `%inner$outer`（buildNestedMethodName，§3.6 嵌套方法专题），于是 inner 里的 Local 得到 `Local$C-%inner$outer`——组合名链保证全局唯一，**类模型挂文件顶层**。

**IR 视角先澄清**：类声明在方法 IR 中**不产生任何 stmt**——`classDeclarationToStmts` 返回 `[]`（ArkIRTransformer.ts:209-221），类模型以组合名挂文件顶层，**这一点修改前后不变**。真正变化的是 IR 中 `new Local()`（ArkNewExpr）的**类型解析路径**：构建期只知道裸名 `Local`，拼不出完整 ClassSignature（不知 fileSigID）→ `classType` 是 unclear stub（declaring file = %unk）；推导期必须把裸名解析回正确的类模型——旧机制与新机制在此分岔。

- **修改前**（裸名键预置 + 文件级直查；旧 ArkFile.ts:203-220 / 旧 Expr.ts:425-431）：

  1. **构建期预置裸名键**：`Local$C-outer`(31) 挂入 `file.classes` 时，addArkClass 发现名字含 `$` → 提取裸名 `Local` → `!classes.has('Local')` 时**以裸名再注册一份键**：`classes['Local'] = cls(31)`——首个同名局部类占住裸名键；inner 里的 `Local`(47) 后到，`classes.has('Local')` 已被 31 占住 → **不注册**，47 从此按裸名不可达；
  2. **推导期文件级直查**：`new Local()` → `classType` unclear → `inferUnclearRefName('Local', declaringClass)`（**旧版无 method 参数**）→ 名字查找链路（inferTypeByName → getClassWithName）→ `file.classes.get('Local')` → 31。

  ```
  修改前解析 new Local()（在 inner 中）：
    ArkNewExpr.classType = unclear stub('Local', %unk)
    → inferUnclearRefName('Local', C)          ← 没有方法上下文
    → file.classes.get('Local') = 31           ← 文件级裸名键，首注册者赢
    → inner 的 new Local() 解析到 outer 的 Local(31) ✗ 遮蔽语义错误
  ```

  三个缺陷具体化：① **同名只有一个可达**——同文件多处同名局部类，首注册者独占裸名键，inner 的 47 永远查不到；② **文件级可见**——不相关方法 `other()` 里的 `new Local()` 同样解析到 31（无作用域语义）；③ **无遮蔽**——inner 里的 `new Local()` 语义上应命中自己的 47，实际命中 outer 的 31；
- **修改后**（构建期作用域绑定 + 推导期 outer-method 链解析）：

  1. **构建期绑定**（ArkIRTransformer.ts:209-221）：类模型照旧以组合名挂顶层（不变），**新增一步** `declaringMethod.registerLocalClass('Local', cls.getClassSigID())`——裸名 → ClassSigID 绑定登记在**声明方法**上（ArkMethod.ts:994-1004，Map 首注册占键）：

  ```
  outer.localClassSigIDs = { 'Local': 31 }
  inner.localClassSigIDs = { 'Local': 47 }
  ```

  2. **推导期链式解析**（3 处消费点：Expr.ts:544 ArkNewExpr.inferType、TypeInference.ts:725 inferUnclearRefName、ValueInference.ts:529）走 `findLocalClassInMethodChain('Local', currentMethod)`（ModelUtils.ts:439-452）——while 循环沿 outer-method 链逐层向上：

  ```
  解析 new Local()（在 inner 中）：
    第 1 跳: inner.getLocalClassSigID('Local') = 47
             → registry.getClassById(47) → inner 自己的 Local ✓（词法遮蔽正确）

  解析 new Local()（在 outer 中）：
    第 1 跳: outer.getLocalClassSigID('Local') = 31 → 命中 ✓

  解析 new Local()（在嵌套更深的函数中，本层未声明）：
    第 1 跳: 本层 localClassSigIDs miss（undefined）
    第 2 跳: method = method.getOuterMethod() → 上溯一层继续查
    ……      while 循环沿词法链逐层向上（inner 能看到 outer 的 Local，
             看不到无关函数的 Local —— 与 TS 作用域语义一致）
    链尽头: 返回 null → 回落文件级名字查找兜底（inferUnclearRefName 其余路径）
  ```
- **必要性**：

  - 解析机制从"构建期预置裸名键 + 推导期文件级 Map 直查"变为"构建期作用域绑定 + 推导期词法链逐层 + SigID 直查"——三个缺陷全部消除（同名各自可达、仅词法链可见、遮蔽语义正确）；
  - 查找成本 O(嵌套深度) 次 Map 查找 + 一次 `getClassById` 数组下标访问。

### 3.5 ArkField（235 → 300 行）

**表 1：字段的修改**


| 序号 | 字段                       | 修改前       | 修改后                                            | 必要性        |
| ---- | -------------------------- | ------------ | ------------------------------------------------- | ------------- |
| 1.1  | `declaringClass: ArkClass` | 对象引用     | `declaringClassID: number`（-1 哨兵）             | ID 化核心     |
| 1.2  | `fieldSignature`           | 签名对象引用 | `fieldSigID: number`（`setSignature` 注册点赋值） | setter 即注册 |

**表 2：接口的修改**


| 序号 | 接口                     | 修改类型 | 说明                                                                                                                                                                                                                            |
| ---- | ------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1  | 构造函数                 | **+**    | 无参 + setter 注入 → ID 注入`new ArkField(declaringClassID, fieldSig?)`                                                                                                                                                        |
| 2.2  | `getDeclaringArkClass()` | **~**    | 返回字段 → Registry 按 ID 反查                                                                                                                                                                                                 |
| 2.3  | `getSignature()`         | **~**    | 返回字段 → 经 canonicalizer 取**规范实例**；stale/未设时 error log + 返回 `FieldSignature.DEFAULT`（错误以"合法但错误"的值扩散而非异常——见 bug 清单相关讨论）                                                                |
| 2.4  | `setSignature(sig)`      | **~**    | 直接赋字段引用 → intern + 首建注册 +**防"后 setSignature 者顶替"写穿保护**：`existing ≥ 0`（全局 model 已被别人占住）时不覆盖——注释举了推断期匿名类字段 setSignature 顶替声明类字段真实 model 的实例（ArkField.ts:190-201） |

**表 3：API 兼容性**


| 序号 | deprecated API                                                     | @deprecated | 内部调用                                | 替代方案                                | 清理建议   |
| ---- | ------------------------------------------------------------------ | ----------- | --------------------------------------- | --------------------------------------- | ---------- |
| 3.1  | 无参构造`new ArkField()`                                           | ✓          | **0 处**（Local.ts 的 @example 已修正） | ID 注入构造（表 2 序号 2.1）            | 可安全移除 |
| 3.2  | `setDeclaringArkClass(c)`                                          | ✓          | **0 处**                                | ID 注入构造                             | 可安全移除 |
| 3.3  | `setCode` / `getOriginPosition/setOriginPosition`（1.0.91 历史族） | ✓          | **0 处**                                | 源码在 ArkFile /`getOriginFullPosition` | 可安全移除 |

### 3.6 ArkMethod（820 → 1069 行）

**表 1：字段的修改**


| 序号 | 字段                                   | 修改前       | 修改后                                                                                  | 必要性                |
| ---- | -------------------------------------- | ------------ | --------------------------------------------------------------------------------------- | --------------------- |
| 1.1  | `declaringArkClass`                    | 对象引用     | `declaringClassID: number`（-1 哨兵）                                                   | ID 化核心             |
| 1.2  | `outerMethod: ArkMethod`               | 对象引用     | `outerMethodSigID?: number`（≤0 视为无）                                               | 嵌套方法的父链 ID 化  |
| 1.3  | `implSignature: MethodSignature`       | 签名对象引用 | `implementSigID?: number`（`setImplementationSignature` 注册点）                        | §3.6 n:1 专题        |
| 1.4  | `declareSignatures: MethodSignature[]` | 签名对象数组 | `declareSigIDs?: number[]`（`getDeclareSignatures()` 返回**重建副本**防外部改内部数组） | n:1 槽位注册（§3.6） |
| 1.5  | （新增）`localClassSigIDs: Map`        | 无           | 方法体内局部类 裸名 → ClassSigID 绑定（§3.4 专题）                                    | 确定性作用域解析      |

**表 2：接口的修改**


| 序号 | 接口                                 | 修改类型 | 说明                                                                                                                                                                                                                                        |
| ---- | ------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1  | 构造函数                             | **+**    | 无参 + setter 注入 → 四参 ID 构造`new ArkMethod(declaringClassID, implSig?, declSigs?, outerSigID?)`                                                                                                                                       |
| 2.2  | `getSignature()`                     | **~**    | 返回 impl 或 declare[0]，同 +**兜底分支 bug 修复**（2ea2421b）：原兜底调 `this.getName()`，与 `getSignature()` 互递归**栈溢出**——C++ 类构建中断、异常被 try-catch 吞掉后整个 TU 节点静默丢失；改为打印 SigID（ArkMethod.ts:508-515 注释） |
| 2.3  | `setImplementationSignature(sig)`    | **~**    | 赋引用 → intern + 缓存 methodSigID +`refreshCanonicalParameterNames`（实现侧参数名刷新到 canonical 实例——参数名不参与签名身份）+ `registerImplModelWithArbitration`（§3.6 n:1 专题构造期仲裁注册）                                      |
| 2.4  | `setDeclareSignatures(sigs)`         | **~**    | 赋数组 →**只 intern 不注册**（注册延迟到 `ArkClass.addMethod` 终点，防覆盖 builder 合并期需读取的前一个同签名方法，ArkMethod.ts:523-534）                                                                                                  |
| 2.5  | `getOuterMethod()/setOuterMethod(m)` | **~**    | 返回/赋对象 → SigID 反查 / 存对方 methodSigID                                                                                                                                                                                              |

**表 3：API 兼容性**


| 序号 | deprecated API                                                                                                                                                                 | @deprecated | 内部调用 | 替代方案                                                                 | 清理建议   |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | -------- | ------------------------------------------------------------------------ | ---------- |
| 3.1  | 无参构造`new ArkMethod()`                                                                                                                                                      | ✓          | **0 处** | 四参 ID 构造（表 2 序号 2.1）                                            | 可安全移除 |
| 3.2  | `setDeclaringArkClass(c)`                                                                                                                                                      | ✓          | **0 处** | 四参 ID 构造                                                             | 可安全移除 |
| 3.3  | `getOriginalCfg()`（历史）                                                                                                                                                     | ✓          | **0 处** | `getCfg()`                                                               | 可安全移除 |
| 3.4  | `getDeclareLines/getDeclareColumns/setDeclareLinesAndCols/setDeclareLineCols/getDeclareLineCols`、`getLine/setLine/getColumn/setColumn/getLineCol/setLineCol`（1.0.91 位置族） | ✓          | **0 处** | `get/setDeclareOriginFullPositions()`、`get/setImplOriginFullPosition()` | 可安全移除 |
| 3.5  | `setCode`（1.0.91）                                                                                                                                                            | ✓          | **0 处** | 源码在 ArkFile                                                           | 可安全移除 |

**必须修改项：嵌套方法（nested method）与 origin name 的改造**：

以这段代码为例：

```typescript
function outer() {
    function inner() { }
    const arrow = () => { };
}
```

- **修改前**：inner/arrow 作为方法挂在 outer 的声明类下，名字改写成组合名 `%inner$outer`、`%arrow$outer`（`%` 前缀 + `$` 分隔，保证唯一）；同时 `addMethod(method, originName)` 会**额外按裸 origin 名（inner/arrow）注册一份索引键**，查询走 `methodMatchesName` 的**裸名前缀匹配**（startsWith `%inner$`）。问题：
  - 双份索引键（完整名 + origin 键）浪费且易失同步；
  - 前缀匹配是模糊的——`%inner$outer` 与 `%inner2$outer` 都以 `%inner` 相关前缀起头时存在误配风险；
  - `outerMethod` 对象引用无法表达到"外层的外层"链式查找的确定性；
- **修改后**：
  - `outerMethodSigID` 精确指向外层方法（`getOuterMethod()` 经 Registry 反查），作用域链（inner → outer → 顶层）成为精确的 ID 链——局部类解析（§3.4）、闭包变量分析（BodyBuilder 的 generateNestedMethodChains）都沿这条链走；
  - 方法名索引只存**完整组合名**一份键；
  - `addMethod` 删除 `originName` 参数；
- **必要性**：模糊前缀匹配 → 精确 ID 链 + 完整名精确匹配，消除误配风险；单份索引键减少内存与失同步面。

### 3.7 更底层（Type / Expr / Ref / 推导层 / Builtin / ArkModule）

- **Type.ts**：
  - `ClassType/FunctionType/EnumValueType/LexicalEnvType` 四个类型类**删除签名对象引用字段，改纯 sigID + tempSigID 双字段存储**；
  - 构造函数采用与 ClassType 同构的路由：**formal 只读命中（`getExistingId`）→ 持 formal ID；miss → temp 兜底登记**；
  - getter 是三级查 + 惰性物化（§1.6 协议）；
  - **兼容设计（D11）**：外部代码 `type.classSignature` 这种字段式访问不能破坏——新增 4 个属性 getter（`get classSignature()` / `get methodSignature()` / `get signature()` / `get nestedMethodSignature()`）委托给对应方法，字段式与方法式访问都正常。
- **Expr.ts / Ref.ts**：`AbstractInvokeExpr` / `AbstractFieldRef` **回退不改造**——原因 R11：invoke 表达式的签名会被推导原地 `setReturnType`、field 引用会被 `setType`，而 canonicalizer 的去重刻意忽略这些可变字段（§1.4）——若 expr 只存 sigID，取回的 canonical 实例会丢失"我这一处"的可变字段差异。因此保留签名对象引用为主存储，sigID/tempSigID 作为**构造/替换时即时解析的辅助缓存**（`route()` 两分路由 + `setMethodSignature` 重路由，Expr.ts:125-138）。
- **Builtin lazy getter**：core/cpp 两份 Builtin.ts 的 ClassType 静态字段（OBJECT_CLASS_TYPE 等）改为**不缓存的 lazy getter**（每次访问创建新 ClassType，其 sigID 指向当前 Registry）——解决测试中多次创建 Scene / Registry dispose 重建后静态缓存里 sigID 指向已死实例的问题（R12）。

---

## 4. 周边架构与辅助设施的修改

> 本章定位：ID 化核心架构（第 1-3 章）之外的周边架构改造与辅助设施——构建流程拆分、统计、校验等边缘辅助类的修改。四节自第 2 章移入（TODO 落实）。

### 4.1 SceneBuilder / ModuleScene / SceneBuildStage — 构建流程拆分

**修改前**：Scene.ts 1700+ 行同时承担：构建编排（配置解析、project 文件 DFS、SDK 构建、方法体构建）+ 查询服务（按签名/名字查模型）+ 模块化分析。构建工作态（ohPkgContentMap、解析缓存、baseUrl 等十几个字段）在构建完成后仍驻留 Scene。

**问题**：本次修改也会增加很多构建编排内容，导致他的问题更加突出。

**修改后**：

- **`SceneBuilder.ts`**（844 行，全部从 Scene.ts 拆出，文件头有逐段迁移对照）：**一次性构建上下文**。`Scene.getOrCreateSceneBuilder()` 惰性创建挂 `scene.activeBuilder`；完整构建入口结束时 `releaseSceneBuilder()` 释放（工作态随 GC 回收，Scene 只留产物）。五大分区：配置解析族 / project 文件 DFS 族 / SDK 构建族 / body 构建族 / harmony 模块族。模块化增量路径（`analyseByModule`/`loadModule` → ModuleBuilder）不经此上下文。
- **`builtFileOrder: number[]`**（Scene.ts:144）：DFS 中 `setFile` 的后序记录 = 严格拓扑序（被依赖者在前）。**推断期零排序**：`inferTypes` 直接正序遍历该数组（Scene.ts:1047-1059），取代旧版每轮 `sortByDependency(filesMap, projectName)` 全量拓扑重算（该函数 commit 时成为无调用的残留体，已随 review 工作项 G 整文件删除 DependenciesSort.ts，§5.1）。注意 FileSigID 本身的前序 intern 序不具拓扑性质（多入口/菱形场景依赖方可能晚于被依赖方 intern），**不可**替代此数组（注释明确警告）。
- **performance improve 增量**：`fromResolutionCache`（import from → 物理路径解析缓存，含负缓存）、`fromResolutionStack`（嵌套槽隔离）、`resolvedOhPkgCache`（刻意独立于正被遍历的 ohPkgContentMap，避开 JS Map 迭代中新增项的坑，SceneBuilder.ts:515-522）。
- **`ModuleScene.ts`**：模块视图类拆出（Scene.ts re-export 兼容）；`moduleFileMap` key 从签名字符串变为 FileSigID；文件构建复用 SceneBuilder 的 DFS（必须先注册后构建）。
- **`SceneBuildStage.ts`**：枚举从 7 值减为 5 值（`CLASS_COLLECTED`/`METHOD_COLLECTED` 随懒收集流程退役删除——模型在 `setSignature` 注册点即进 canonicalizer，不再需要收集阶段）。拆到 frontend 层的动机是打破 Scene ↔ frontend 值导入循环（ESM 加载边，同类循环曾实测触发 "Class extends value undefined"，与 §2.5 同源）。

### 4.2 StageStatistics / StageStatisticsReporter — 阶段统计

**原先的 gap**：无系统化性能观测手段，性能问题定位靠手工打点。

`StageStatistics`收集 9 个内置阶段的耗时与内存（RSS/heap）：

- Builder 总阶段：ParseConfigs/Sdk/SdkFiles/SdkInfer/Files/Bodies 五个子阶段；
- 每轮 InferTypes + InferTypesFinalize。

关键设计：

- **内存峰值靠同步采样点**：start/endStage/checkpoint 时刻，刻意不用 `setInterval`——Node 单线程下 CPU 密集操作（AST 解析、IR 构建）无法调度 timer 回调；
- 嵌套关系自动捕获（start 时以最近未结束阶段为 parent）；
- 禁用时零开销。
- `recordSignatureStats(label)`在 post-build / post-infer 两个时点对 Registry 做只读快照（formal 5 空间 size + temp 3 空间 live/total/retired/replaced）。
- CLI `cg --stats`/`ir --stats` 开启（`SceneOptions.enableStatistics`），进程退出 hook 自动落盘 `out/<projectName>_statistics.txt`。

### 4.3 CanonicalizerValidator — 不变式校验器（dev-only）

**现状**（`src/core/common/CanonicalizerValidator.ts`，1004 行纯静态工具）：对 §1.5/§1.6 声称的所有不变式做全量体检，5 个 formal 空间各 6 条通用规则（X1a ID 0 有 DEFAULT / X1b ID 0 无 model / X2 ID 稠密无洞 / X3 model 完备性（区分合法驱逐态）/ X4 model 回指 SigID 一致 / X5 签名值唯一（hashCode 分组 + 组内 equals）/ X6 无多挂）+ 空间特有规则（file 的 R7 ID 边界一致；namespace 的 N7 嵌套链；class 的 AliasClassSignature 双注册豁免；field 的 F4b 双侧声明类一致；method 的 M3/M4/M6/M7 反向链）+ temp 3 空间的 T1/T2/T3（含全模型树遍历 `checkTempHolderIDs` 检查持有者声明的 tempSigID 指向活 slot 或有替换记录）。**唯一调用点**：`Scene.inferTypes()` 末段（Scene.ts:1064-1067），`SceneOptions.validateCanonicalizers` 门控，默认关闭。

### 4.4 其他方面的修改


| 类别                          | 内容                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **新测试**（合计 20+ 新文件） | `SignatureCanonicalizer.test` / `SignatureCanonicalizerRegistry.test`(1002 行) / `SignatureModelCanonicalizer.test` / `TempSignatureCanonicalizer.test` / `TempIDMechanism.test` / `CanonicalizerValidator.test`(+smoke) / `ModelRelationshipID.test` / `SceneCanonicalizerIntegration.test` / `LocalClassResolution.test` / `OriginNameRemoval.test` / `ShortNameResolution.test` / `SdkGlobalProbing.test` / `ReverseTopoInvariant.test` / `TypeIsUnclear.test` / `FieldSignatureToMapKey.test` / `ModuleBuilder.test` / `StageStatistics.test` / `TempSpaceDiagnose`（samples） |
| **测试基建**                  | `tests/unit/common.ts`：`buildScene` 移到 `beforeAll` + `SignatureCanonicalizerRegistry.dispose()`（多 Scene 测试必须手动 dispose，R12）；C++ expect 文件批量更新（~40 个，签名字符串 key → ID 化后的输出差异）                                                                                                                                                                                                                                                                                                                                                                   |
| **CLI**                       | `cg`/`ir` 新增 `--stats`；`ir.ts:41` fileCount 从 `getFiles().length` 改为 `fileSigCanonicalizer.size()`（**语义变化，见 bug 清单 #2**）                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Config**                    | `SceneOptions` 新增 `validateCanonicalizers`（默认关）/ `enableStatistics` / `statisticsOutputPath`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **index.ts**                  | 导出`SignatureCanonicalizerRegistry` + statistics 族                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **文档**                      | `docs/components/ArkFile.md`/`ArkNameSpace.md`（originName 语义删除）；`docs/api_docs`（Ref 类 3 个）；openspec 全套设计文档随 commit 落盘                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **CppFrontend**               | 4 个 Builder + ModelUtils/TypeInference/IRInference 等 C++ 侧同构改造（D13 sigID 缓存 + Registry import 清理）                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

---

## 5. 工作项清单（待执行 / 待分析 / 本轮已执行）

> **本章定位**：所有工作项的唯一登记处——review 过程中发现的任何问题、讨论衍生的任何决策与改进设想，都先记录于此再排期执行；编号 A-Z 顺序分配，状态分为"已执行 / 已拍板待执行 / 待分析"。

### 5.1 本轮已执行（随本轮 PR 落盘）


| 编号  | 工作项                                                                                                               | 内容                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 验证结果                                                                                                                                                                                                                                                                                                                                                               |
| ----- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A** | 删除`SignatureCanonicalizer.intern()`                                                                                | 生产代码 0 调用（唯一历史消费者 D9 setter 已被 D13 消化为 getId+get 拆分）；新类无兼容包袱（不触发 D11）。删方法（原 SignatureCanonicalizer.ts:92-104）+ 13 处测试断言改写为`get(getId(sig))!`（语义严格等价，"canonical 单实例化使 === 安全"语义由 getId+get 组合继续承载）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | tsc 通过；定向 5 个测试文件 116/116；全量 1490/1491（唯一失败为既有 ModuleBuilder EPERM symlink 环境问题）                                                                                                                                                                                                                                                             |
| **G** | 删除死代码`DependenciesSort.ts` 整文件                                                                               | 文件唯一导出`sortByDependency` 在 src/tests/packages 均无调用（Scene 已改用 builtFileOrder 零排序；TypeInference.test.ts:148 注释"已随该不变量删除"但函数体残留）。其 :36 的 toMapKey 调用是 D 落地前 toMapKey 的最后一个非比较类生产消费者                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | tsc 通过；全量回归无变化                                                                                                                                                                                                                                                                                                                                               |
| **D** | 3 处身份值比较改`signatureEquals`（hash 数字先比 + equals 终审）                                                     | 新增导出函数`signatureEquals(a, b)`（SignatureCanonicalizer.ts，Canonicalizable 定义旁）：`a.getHashCode() === b.getHashCode() && a.equals(b)`。三处消费点改写：`TypeInference.isSameType`（TypeInference.ts:1171）、`ModelUtils.matchType` 两处（:629/:632，原 toMapKey 值比较）。**为什么不用"查 ID、ID 相同即相等"**：① ID 是"值 × 注册历史"的函数而非值的纯函数——两个未注册签名（temp stub 场景）`getExistingId` 都返回 -1，`-1 === -1` **误判相等**；一注册一未注册则误判不等；② `getId` 版本对未注册签名**盲写 formal 空间**（永久空洞，即 §1.6 记录的历史翻车点），查询路径必须只读；③ **协议同构**：signatureEquals 的判等协议（hash 粗筛 + equals 终审）与 canonicalizer 探测内部完全同构——ID 判等等于把该协议对 a、b 各跑一遍（含两次 slot 表访问）再加一次 ID 比，signatureEquals 只跑一遍；④ 纯函数不依赖 Registry 单例与注册历史，temp/正式/临时构造签名统一语义。**equals 执行条件（修正早期表述）**：hash 短路仅对"结果为不等"的比较生效；结果为相等时 equals 必然执行（契约使然），但 canonical 实例场景 equals 首行引用短路、成本近零——性能优势来源是"协议跑一遍 vs 两遍 + 省两次表访问"，而非"省掉 equals"。**语义说明**：FieldSignature 的 hash/equals 一致地含 declaringClassTempSigID（temp 引用语义）——与原 toMapKey 纯值语义在"同值不同 temp 实例"场景有差异，属 ID 化有意设计                                                                                                                                                                                                                                               | tsc 通过；定向 7 个测试文件（含 InferArray 67 例、reproduce_issues）190/190；全量 1490/1491                                                                                                                                                                                                                                                                            |
| **B** | toMapKey 降级 + FileSignature 双哈希收敛（按 D→deprecated→B 的演进排序执行）                                       | ① 5 类签名的`toMapKey()` 全部标 `@deprecated`（生产消费者已归零：比较走 signatureEquals、索引走 canonicalizer，保留仅为 D11 对外兼容）；② FileSignature.toMapKey 改为 `toString()` 身份投影（projectName + fileName 完整身份字段，无碰撞）+ 删旧 `hashcode` 字段与 CryptoUtils/path import（bug #16 收敛）；③ 连锁：TypeInference.test.ts 期望值改新格式（`@exportAll/util/test2.ets: ` 等）、FieldSignatureToMapKey 一处断言翻转（toMapKey 与 toString 的区分点随文件层格式统一而消失）、删除死代码 `FileUtils.getFileSignatureMapKey`（旧格式平行复刻，无调用者）+ FileUtils 的 CryptoUtils/transfer2UnixPath import 清理。**执行顺序说明**：此前曾直接按方案一实施并因超出授权回退；本轮经用户确认按"D 先行消灭生产消费 → toMapKey 降级 deprecated → B 成为无风险清理"的顺序落地，方案争议（D11 格式变化顾虑）随 deprecated 标注消解                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | tsc 通过；全量 1490/1491                                                                                                                                                                                                                                                                                                                                               |
| **I** | bug #8 修复：MethodSignature equals/isMatch 去字符串拼接 + Compare 自由函数族性能改造                                | **现状**（修复前）：equals 每次拼 2 个参数串 + 2 个 returnType 串（signatureEquals 终审在工作项 D 后成为"相等比较"的必经路径）；isMatch 每次拼 **6 个递归字符串**（完整 declaring.toString 递归 + 参数 Type 递归）×2——isMatch 是 addMethod/updateMethodIndex 重载合并的**构建期热路径**（7 处调用方）；Compare 自由函数族（5 个 export）内为 toString 拼接 + Type 引用比较。**修复（A+B+D 三部分）**：① **A** equals 改字段级短路——新增模块函数 `methodSubSignatureValueEquals`（staticFlag → methodName → 参数数量 → 逐参数类型（单例 Type 引用短路，否则 toString——Type 无 hash 基础设施本轮不引入）→ returnType，语义与原 toString 投影严格等价、保留 undefined 参数→UnknownType 投影），equals 两处拼接替换为一次 helper 调用；② **B** isMatch 重写——declaring 部分改 `signatureEquals`（值判等，**保留 isMatch 对 unclear stub 的宽松值语义**，不引入 equals 的 tempSigID 严格语义），subSig 部分与 equals 共用 helper；③ **D** 5 个 Compare 函数全部保留（外部可能有调用者，D11）但内部委托判等协议：fileSignatureCompare→equals、classSignatureCompare→signatureEquals（**顺带修复**：原实现漏比较 declaring namespace，不同 ns 同名类误判相等）、fieldSignatureCompare→signatureEquals(declaring)+fieldName、methodSubSignatureCompare→valueEquals（**顺带修复**：原参数/返回类型 `===` 引用比较，同值不同实例 Type 误判不等）、methodSignatureCompare→signatureEquals+valueEquals；私有死代码 arrayCompare 移除。**C（构造期 hash 拼接）保持现状**：hash 缓存 readonly 一次性成本非热点，Type 无 hash 基础设施，逐字段改写收益有限 | tsc 通过；定向 8 个测试文件 258/258（含 Registry 71 例 equals/hash 密集、InferArray 67、ModelRelationshipID 58、reproduce_issues 的 methodSubSignatureCompare 用例）；全量 1490/1491。C++ 侧（ArkMethodBuilder:200 重载合并使用 isMatch）测试需 LLVM/Clang 环境本机不可跑——语义等价性已代码级论证（同类 canonical declaring 直接命中 + subSig 与 toString 投影等价） |
| **K** | addArkClass 去 registerClass——注册点唯一化到 setSignature（根除工作项 F）                                          | **触发**：用户质疑 ArkFile.addArkClass:240 的 registerClass 冗余（ArkClass.setSignature:402 已保证注册）。**全调用链核实**（TS 16 处 + C++ 8 处：ArkClassBuilder 各分支、defaultClass 链、ArkNamespaceBuilder:104 三参构造、ArkValueTransformer 三处匿名类——构造不传 sig 但先经 buildNormalArkClassFromXxx（内含 setSignature）、DummyMainCreater:151、addNamespace 合并分支（已构建类）、cpp 侧全部分支）：**所有调用方都先 setSignature 后 addArkClass**。**修复**：① ArkFile.addArkClass 与 ArkNamespace.addArkClass 两处删除 `registerClass` 调用，各补注释（注册由 setSignature 三态处理保证，本方法只维护顶层索引）；② `Registry.registerClass` 补 `id > 0` 守卫（原为唯一无守卫的 register——未 setSignature 的类（classSigID=-1）会写 `models[-1]` 污染：JS 负索引为对象属性，不进数组正文但阻止 GC）；③ registerClass 本身保留（setSignature 的调用目标，调用面收敛为唯一一处）。**根除的隐患**：无条件 setModel 写穿 setSignature"他 model 已持有不覆盖"保护（原 F 项防御面）+ models[-1] 污染                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | tsc 通过；定向 7 个测试文件 215/215（含 CanonicalizerValidator 全部挂载链规则 C4/C6/C7、ModelRelationshipID、DummyMain、BuildSceneByFiles）；全量 1490/1491                                                                                                                                                                                                            |
| **L** | 实体判别需求上移——getSdkGlobalMemberClasses / getNamespacedSiblingClasses 迁至 SdkUtils（根治 duck-typing helper） | **背景**：Registry 因依赖图约束（§2.5）不能值使用模型类，历史上的实体判别用 duck-typing 结构 helper（isArkClassEntity/isArkNamespaceEntity + 内联 Local 排除法探测）——脆弱（方法名巧合）、层次倒置（底层猜上层形状）、每个判别点都是约束的消费场景。**核查发现**：判别需求全部集中于 2 个查询方法（5 处判别点），而它们的既有依赖环境（SdkUtils）已 import 全部模型类且已有 instanceof 先例——**迁移零新增依赖边**。**修复**：① 两个查询方法迁至 SdkUtils，判别改原生 instanceof（Local 由排除法变 `e instanceof Local` 直判，tsc 类型安全）；② Registry 删除两方法 + 两 helper + 内联探测，只留 getSdkGlobal/getSdkGlobals 透传——**判别场景归零，约束降为纯预防性纪律**；③ Registry 约束注释改写（"禁止值 import"→"模型类仅限类型位置使用"——import 语句可存在，被 elision 剥离；并记录两条刻意的内环值边：ArkSignature/base/Type）；④ 清理 Registry 失效的 ClassType import。**调用方 10 处改前缀**：Expr:565、IRInference:535/543、TypeInference:815/827、InferArray:1192/1203、SdkGlobalProbing:74/97/102（Expr.ts 补 SdkUtils import——core/base 引 core/common 已有先例 Local→ModelUtils）                                                                                                                                                                                                                                                                                                                                                                                                                                                    | tsc 通过；定向 6 个测试文件 181/181（含 SdkGlobalProbing 全部多实体探测不变量、InferArray 版本判别 67 例）；全量 1490/1491                                                                                                                                                                                                                                             |
| **M** | getSdkGlobal / getSdkGlobals 也迁至 SdkUtils——sdkGlobalMap 消费完全内聚                                            | **动机**（用户指示）：工作项 L 迁走了判别类查询后，这两个纯透传查询（`getInstance().sdkGlobalMap.get(...)`）留在 Registry 的唯一理由是"字段在它那"——迁走后 sdkGlobalMap 的**登记**（loadAPI 族）+ **消费**（单值/多值/成员探测/兄弟类）全部内聚于 SdkUtils，Registry 回归"canonicalizer 管理 + 数据存储"纯定位。**修复**：① SdkUtils 新增 getSdkGlobal(name)/getSdkGlobals(name)（经 `Registry.getInstance().sdkGlobalMap` 访问——字段 owner 与 dispose 生命周期聚合不变）；② Registry 删除两 static 方法，注释更新（sdkGlobalMap 登记与消费统一内聚于 SdkUtils；Registry 仅保留字段存储与 dispose 清理）；③ **48 处调用方替换**（`Registry.getSdkGlobal` → `SdkUtils.getSdkGlobal`，17 个生产文件 + 2 个测试）；④ 8 个文件补 SdkUtils import；⑤ **11 个文件的 Registry import 清理**（调用全迁后 unused，tsc 逐一确认删除：Builtin/RapidTypeAnalysis/PagBuilder/ArkIRTransformer/ArkValueTransformer/CfgBuilder×2/ValueInference/AbcInference/cpp ModelUtils/cpp TypeInference/Sdk.test）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | tsc 通过；定向 9 个测试文件 293/293；全量 1490/1491                                                                                                                                                                                                                                                                                                                    |
| **N** | Registry 的 14 个 static 方法转实例方法——多 Scene 适配前置铺路                                                     | **动机**（用户拍板方案 A 现在改）：static 方法与全局单例绑死——多 Scene 时 `SignatureCanonicalizerRegistry.registerClass(cls)` 无法知道注册到哪个实例，是 `Registry.forScene(scene)` 演进路径上的隐性路障；且原形态混合不一致（registerFile 实例 / registerClass static 无规则可循）。**转换**（14 个方法，`this.getInstance().xxxCanonicalizer` → `this.xxxCanonicalizer`）：register 族 ×4（Class/Method/Namespace/Field）、remove 族 ×6（File/Class/ClassModel/Method/Namespace/Field）、customComponent 族 ×2、temp 统计族 ×2（getTempSpacesStats/settleTempSpaces）；`getInstance`/`dispose` 保留 static（单例管理职责）。分节注释改 "instance methods — multi-Scene ready"。**调用方 ~40 处**：有 `registry` getter 的（Scene 7 处、ArkClass 6、ArkFile 3、ArkNamespace 4）改 `this.registry.xxx(...)`——比类名前缀更贴合"本模型属于某个 registry"的语义；无 getter 的（ArkField/DummyMainCreater/ArkClassBuilder/ModuleBuilder×2/StageStatistics）补 `getInstance().`；tests 4 文件同步                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | tsc 通过；static 调用残留 grep 清零；定向 9 个测试文件 293/293；全量 1490/1491                                                                                                                                                                                                                                                                                         |
| **O** | registerNamespace 收敛到 setSignature 唯一一处——与 file/class 注册点唯一化对齐（K 项同构）                         | **分析**（用户质疑）：ArkFile.addNamespace:487 与 ArkNamespace.addNamespace:112 各有一处 registerNamespace——与工作项 K（addArkClass 去 registerClass）同构的冗余。**全调用链核实**（6 个 builder 调用点 + 2 个合并分支）：TS 侧 4 处（ArkFileBuilder:133、ArkNamespaceBuilder:69/:93——三参构造器含 sig → 构造器内 setSignature → 已注册）；C++ 侧 2 处（ArkFileBuilder:356、ArkNamespaceBuilder:106——一/二参构造无 sig，但 `buildArkNamespace` 内部 :59 显式调 setSignature → 已注册）；合并分支 2 处（递归重加的是已构建子 ns，model 已注册）。**修复**：两处 addNamespace 删除 `registerNamespace` 调用，各补注释（注册由 setSignature 保证，本方法只维护顶层索引——与 K 项注释同构）；`Registry.registerNamespace` 保留（setSignature 的调用目标，已有 id>0 守卫）。**注册点唯一化至此完成**：file/class/namespace 三类的 model 注册均收敛到各自的 setSignature 唯一一处（K + O），方法类的 addMethod 终点注册为其 n:1 特例（§3.6）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | tsc 通过；定向 6 个测试文件 135/135（含 CanonicalizerValidator 全部 namespace 规则 N3/N7、ModelRelationshipID、BuildSceneByFiles）；全量 1490/1491                                                                                                                                                                                                                     |
| **P** | temp 注册路由统一为模式 B'（isUnclear 优先 + clear-miss 错误日志 + temp 兜底，全代码库 14 处）                       | **动机**：用户指出代码中存在两种 temp 注册路由——Type/Expr/Ref 用"formal 探测 miss → temp"（模式 A），ArkSignature 值对象构造器用"isUnclear → temp / requireExistingId throw"（模式 B）——不统一。且模式 A 对 clear-but-unregistered 签名会将其放入 temp（语义污染：clear 签名不需要"解析"，它只是还没注册）；模式 B 的 requireExistingId throw 在生产环境中过于激进。**统一为模式 B'**：① isUnclear → temp（正常路径：需要推导解析）；② clear + formal 命中 → formal ID（正常路径）；③ clear + formal miss → **error log + 与 unclear 相同的兜底路径**（防御：不 throw）。Type 构造器保持 formal 只读（不加 getId——intern 仍在各 setter 三态中）。**改动**：Type.ts ×5（ClassType 构造/setClassSignature、FunctionType/LexicalEnvType/EnumValueType 构造）+ Expr.route + Ref.route（模式 A → B'，保留 retire 旧 temp 与精度栅栏）+ ArkSignature.ts ×7（requireExistingId 全部替换为 B'：ClassSignature declaring → error log + tempClass；NamespaceSignature declaring → error log + 标记 -1（无 temp 空间 §2.3）；FileSignature declaring → error log + 置 0（DEFAULT，复合签名变为 unclear 语义））。**requireExistingId 函数已删除**（全代码库零残留）。**测试更新**：TempIDMechanism 1 处 + SignatureCanonicalizerRegistry 4 处 fail-fast 断言 → B' 兜底断言（DEFAULT/-1/temp + isUnclear）                                                                                                                                                                                                                                              | tsc 通过；TempIDMechanism 32/32 + Registry 71/71；全量 1490/1491（唯一 EPERM）                                                                                                                                                                                                                                                                                         |
| **Q** | `getArkXxxById` / `getArkXxxBySig` 重命名为 `getXxxById` / `getXxxBySig`                                             | **动机**（用户指示 §2.6 TODO :349）：去掉 `Ark` 前缀简化命名。**改动**：Registry.ts 上 5 × 2 = 10 个方法定义重命名（getArkFileById → getFileById 等）+ src/ 38 处调用方批量替换（17 个文件）+ tests/ 3 个测试文件同步。纯机械重命名，无行为变化                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | tsc 通过；残留 grep 清零；定向 6 个测试文件 241/241；全量 1490/1491                                                                                                                                                                                                                                                                                                    |
| **R** | 签名构造器 temp 入参 + isUnclear 简化 + isDefault 删除（三项用户指示） | **① 构造器 temp number 入参**：MethodSignature 新增 `(classSigID, subSig, declaringClassTempSigID?)` 重载；FieldSignature 新增 `(name, classSigID, type, staticFlag, false, tempClassSigID?)` 重载——temp 构造不再依赖 deprecated 对象重载。**② isUnclear 简化为 O(1) 字段读**（消除全部 registry 查找链）：Class/NSSignature `fileSigID === 0 && name !== '%unk'`（字段值直判 DEFAULT）；MethodSignature `declaringClassSigID === -1`（模式 B' 不变式：formal ≥ 0 即 resolved）；FieldSignature `declaringClassSigID === -1 \|\| declaringNamespaceSigID === -1`。**③ isDefault() 删除**（5 个签名类全部；原实现每次调用做一次 registry 哈希探测——热路径浪费；DEFAULT 判断由字段值比较替代）。外部调用方 IRInference.ts:148 替换为 `getDeclaringFileSigID() > 0` 纯字段读。**行为变化**：旧代码追踪 declaring 链（class 的 file 为 DEFAULT 则 method unclear），新代码只查 ID——formal ID ≥ 0 即 not unclear（模式 B' 不变式下 correct：unclear 类走 temp 不走 formal）。2 处测试更新。**round10 修正（bug #19 ②）**：Method/Field 的 class 侧判定由 `=== -1` 收紧为非正——`=== -1 \|\| === 0`：stub 构造器直传 0 与 ClassSignature.DEFAULT 值对象构造均产生 declaringClassSigID = 0（"挂在未知类上"），原判定误判 clear 导致 formal 必 miss + error log；不变式相应修正为 formal > 0 即 resolved | tsc 通过；Registry 71/71；全量 1486/1487（-4 = CryptoUtils hashcode 测试删除）；round10 修正后全量 1480/1481（唯一 EPERM） |
| **C** | dispose/clear 收敛——方案 B                                                                                         | clear() 改为 @deprecated 委托 dispose()；dispose() 补齐 clear() 独有的 releaseSceneBuilder + builtFileOrder/scene 字段清理（**bug #1 随此修复**——原 dispose 漏 releaseSceneBuilder 的不对称问题消除）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | tsc 通过；全量 1486/1487                                                                                                                                                                                                                                                                                                                                               |
| **E** | design.md D12 与实现偏差同步                                                                                         | D12 添加实现状态更新块：isUnclear 从"isUnclear 判断决定走 temp 还是 formal"演进为模式 B' 统一路由 + O(1) 字段读（含最终实现表格、isDefault 删除、构造器 temp 入参说明），原文保留作设计历史                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 文档更新                                                                                                                                                                                                                                                                                                                                                               |
| **H** | CryptoUtils 整类删除（用户指示升级为全删）                                                                           | `src/utils/crypto_utils.ts` 整文件删除（hashcode 已死 + sha256/hash 也无 src/ 调用者）。`tests/unit/CryptoUtils.test.ts` 整文件删除（-6 测试）。`ViewTree.test.ts` 的 sha256 调用改为直接 `crypto.createHash('sha256').update(...).digest('base64url')`（golden hash 值不变）。HashUtils 注释清理 CryptoUtils 引用。全仓库零残留                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | tsc 通过；ViewTree 38/38；全量 1480/1481                                                                                                                                                                                                                                                                                                                               |
| **S** | TempSignatureCanonicalizer 组合 Canonicalizer.objectIdentity——消除代码重复                                         | **动机**（用户质疑）：Symbol 幂等机制与 Canonicalizer.objectIdentity 逐行相同（独立实现是代码重复），核心机制应单一来源。**改动**：① Canonicalizer 新增 `removeAt(id)` 方法（置 `list[id] = undefined`，ID 不回收）+ `list` 类型改为 `(T \| undefined)[]`+ rehash 跳过 undefined；② TempSignatureCanonicalizer 重写为组合——inner`Canonicalizer`（objectIdentity）处理 register/getExistingTempId/get/clear，追加 retiredIds Set + replacements Map + 派生计数器（size = inner.size - retiredIds.size）。195 行 → 146 行。**行为不变**：retire 语义（幂等置空 + 替换记录）、三数自洽、审计视图全部保持 | tsc 通过；TempSig 10/10 + TempID 32/32 + Registry 71/71 + Validator 47/47；全量 1480/1481 |

### 5.2 待分析

| 编号 | 工作项                             | 内容                                                                                                                                                                                     |
|----|---------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1  | 探测内 equals 的收窄优化（§1.4 Note 的设想） | `getId`/`getExistingId` 匹配到 hashcode 桶后仍要做 equals 判断——可探索收窄需要比较的场景（如canonicalizer 表内缓存"该 slot 只有一个条目且上次命中实例"的快速路径，或 canonical 实例的引用预检前置）。待分析：收益场景（signatureEquals 相等比较、碰撞链遍历）与实现复杂度的平衡 |
| 2  | 避免使用自构造的signature查询             |   `getFieldWithName/getStaticFieldWithName` 每次构造临时 FieldSignature（含 4 次 hash 组合）——名字查询热路径分配开销                                                                                                                                                                                                                      |

### 5.3 问题清单（待修复工作项池）

原 bug 清单——每项本质即待修复工作项，编号沿用 #1-#18 便于正文引用：


| #  | 严重性 | 问题                                                                                                                                                                                                                                                                                                                                                                     | 位置                                                                                        |
| -- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| 2  | 中     | **ir.ts `fileCount` 语义膨胀**：从 `getFiles().length`（project 文件数）变为 `fileSigCanonicalizer.size()`（1 个 DEFAULT + 全部 SDK + project）。配置 OHOS SDK 时输出 JSON 的 fileCount 从几十膨胀到数千，`--help` 无声明                                                                                                                                                | ir.ts:41                                                                                    |
| 3  | 中     | **`markProjectFileBoundary` 调用面缺口**：仅 `buildSdkStage`（SceneBuilder.ts:602）与 `ModuleBuilder.loadModule`（ModuleBuilder.ts:1021）调用。API 层面"仅 `config()` + `buildModuleScene()`"可达（不设边界）→ `getFiles()`/`getSdkArkFiles()` 恒返回空、`isProjectFileID` 恒 false，而旧 filter 语义会返回文件                                                         | SceneBuilder.ts:791-823                                                                     |
| 4  | 中     | **ModuleScene 无 active builder 时静默跳过**：仅 warn 后 return，整个模块文件不构建，上层无失败传播                                                                                                                                                                                                                                                                      | ModuleScene.ts:123-127                                                                      |
| 5  | 中     | **`validateFields` truthy 检查对数字 ID 语义倒置**：`!value` 判断下 `-1`（未 intern 哨兵）判"有效"、合法 `0`（DEFAULT）判 undefined。受影响 validate 调用：ArkClass.ts:1466、ArkField.ts:277、ArkMethod.ts:948、ArkNamespace.ts:634                                                                                                                                      | ArkBaseModel.ts:414-430                                                                     |
| 6  | 低     | **哨兵不一致 + 无效守卫**：`ArkFile.fileSigID` 以 0 为"未 set"（DEFAULT 占用 0，无法用 -1），其余模型用 -1。导致 ArkFile.ts:294/430 的 `this.fileSigID >= 0` 守卫恒真形同虚设                                                                                                                                                                                            | ArkFile.ts:72-73/294/430                                                                    |
| 7  | 低     | **`undefined as unknown as X` 类型欺骗**：ID 未设时 getter 返回类型不合法的 undefined，下游链式调用静默崩溃                                                                                                                                                                                                                                                              | ArkClass.ts:333、ArkNamespace.ts:456/564、ArkField.ts:105、ArkMethod.ts:372、ArkFile.ts:252 |
| 11 | 低     | **`--stats` 依赖进程退出钩子**：CLI 场景成立；库被长生命周期进程使用时报告永不产出（除非手动调 print/export），CLI help 未声明                                                                                                                                                                                                                                           | Scene.ts:1564-1581                                                                          |
| 12 | 低     | **post-infer 快照时序耦合**：`recordSignatureStats('post-infer')` 在 dispose 系列之后调用，当前各 dispose 不动 Registry 暂无偏差，属时序耦合点                                                                                                                                                                                                                           | Scene.ts:1068-1074                                                                          |
| 13 | 低     | **索引实现不统一**：ArkFile 用 `Set`（保插入序），ArkNamespace/ArkClass 用 `Int32Array + swap-remove`（删除后顺序打乱）——namespace/file 侧 swap-remove 对遍历顺序的影响需评估                                                                                                                                                                                          | ArkFile.ts:82 等                                                                            |
| 14 | 低     | **Canonicalizer.ts:22 导出类型引用私有名**：`export interface CanonicalizerStats.strategy: CanonicalizerStrategy` 引用未导出的 type，`--declaration` 构建会报 TS4023                                                                                                                                                                                                     | Canonicalizer.ts:20-29                                                                      |
| 15 | 低     | **HomeFlow 遗留死代码**：`scratchFoundStored`/`getScratchFoundStored` 全仓库无调用；`preferCanonicalRepresentative` 钩子无实现者且 equals 命中时静默替换代表实例（对依赖 get(id) 稳定引用的签名体系是潜伏风险）                                                                                                                                                          | Canonicalizer.ts:92/127-140/586-594                                                         |
| 18 | 低     | **register 无可扩展性预检**：对 frozen/sealed 对象写 symbol 属性抛裸 TypeError（对照 Canonicalizer.getObjectIdentityId 有 Object.isExtensible 预检），两处行为不一致                                                                                                                                                                                                     | TempSignatureCanonicalizer.ts:69-80                                                         |
| 19 | ~~中~~ | ~~**模式 B' 路由 clear-miss 误报（ERROR 日志风暴）**~~ → **已修复（round10 实施轮）**，两类根因：**① %unk 形态**——stub 构造器（`ArkSignatureBuilder.buildMethodSignatureFromMethodName` / `buildFieldSignatureFromFieldName` 直传数字 0）与 `ClassSignature.DEFAULT` 值对象构造（DEFAULT 类自身 isUnclear=false 的 name==='%unk' 例外 → formal 命中 ID 0）均产生 `declaringClassSigID = 0` 的签名，而 isUnclear 只认 -1 → 误判 clear → formal 必 miss（DEFAULT 类下永无方法/字段模型）→ error log；**② AC constructor 形态**——object literal 匿名类（%ACn）的 constructor 探测签名产生于方法体构建期，晚于它的 `updateOrAddDefaultConstructors` 批量补全还没跑（时序差），且探测形态 `constructor(): UnknownType` 与真实默认构造器 `constructor(): ClassType(%ACn)`（returnType 不同 → 值不等）错位——每对象字面量构建期一条 ERROR + temp 残留（推导期解析真实签名时被 retire）。**修复**：a) isUnclear class 侧改非正判定（`=== -1 \|\| === 0`，-1 = temp-held / 0 = DEFAULT declaring"挂在未知类上"，Method+FieldSignature 两处，行为等价仅消除误报——路由结果同为 temp）；b) `objectLiteralExpresionToValueAndStmts` 创建点提前调 `buildDefaultConstructor`（needDefaultConstructorInClass 的 OBJECT 白名单本就打开、批量补全幂等跳过、模型总数不变）+ 探测签名改取真实 constructor 签名（route formal 直达，零 ERROR 零 temp）。**决策记录**：route miss 分支防御性 retire **取消**——纯 retire 会使共享同一 temp 实例的其他持有者断链（`Builtin.TO_STRING_METHOD_SIGNATURE` 单例多 expr 共享先例，retire 后三级查 slot 空 + 无 replacement 直接 throw；retireTemp 的设计前提是"替换后无任何持有者"）；属性探测（字段 miss）日志**保持 error 不降级**（用户拍板，待专项分析彻底消减）。测试同步：SignatureCanonicalizerRegistry 2 处断言更新为新语义（SigID 0 作 declaring → unclear） | ArkValueTransformer.ts:313/:332-334、ArkSignature.ts:804/:1087、ArkMethodBuilder.ts:331-340/:359-414（修复涉及）；Expr.ts:144-148 / Ref.ts:179-183（日志保留点） |

---

## 6. Review 建议关注点（优先级排序）

1. **正确性**：#1（dispose/builder stale registry，随工作项 C 一并解决）、#3（边界缺口）、#5（validate 倒置）、#4（ModuleScene 静默跳过）；
2. **语义确认**：#2（ir fileCount）、#9（isUnclear ns 不对称）、#10（补挂策略分歧）、`FieldSignature.equals` 不含 type 的消费方影响、`removeMethod` 从按名删全部到按 SigID 单删的行为变化（§3.4 表 2）；
3. **API 生命周期**：Field/MethodSignature 值对象重载（§3.1 表 3）实为 unclear 路由的内部基础设施，删除前需先把 Builtin stub 池与 37 处调用点迁移到显式 temp API；
4. **性能债务**：#17（名字查询临时签名）、#13（swap-remove 顺序影响）、§1.4 Note（探测内 equals 的收窄优化设想）；（#8 equals/isMatch 拼接已由工作项 I 修复——仅剩构造期 hash 一次拼接，C 决策保持现状；#16 双哈希已由工作项 B 修复）
5. **工作项跟进**：已执行 A/B/C/D/E/G/H/I/K/L/M/N/O/P/Q/R/S（§5.1，F 已由 K 根除，#1 已由 C 修复）；J（探测内 equals 收窄优化，§1.4 Note）——详见 §5.3。#19（模式 B' clear-miss 误报）已修复（round10 实施轮，isUnclear 非正判定 + object literal 创建点补建 constructor）；其遗留子项：**属性探测 miss 的 error 日志保持原级**，待专项分析根因后彻底消减。
