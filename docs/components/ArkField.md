# ArkField

## 1. 概述

**`ArkField`** 是 ArkAnalyzer 中"类成员字段"的抽象，代表一切声明在 [`ArkClass`](./ArkClass.md) 内部的属性——不仅包括普通类的字段，还覆盖接口属性签名、枚举成员、索引签名、参数属性、对象字面量短手属性等多种 TS/ArkTS 形态。所有种类共享同一个 `ArkField` 类，靠 [`FieldCategory`](#3-核心数据结构) 枚举区分；修饰符（`public`、`static`、`readonly` 等）通过继承自 [`ArkBaseModel`](../../src/core/model/ArkBaseModel.ts) 的 `ModifierType` 位标志记录。

> 注意区分 `ArkField`（**字段定义**）与 `ArkInstanceFieldRef` / `ArkStaticFieldRef`（**字段读写引用**，详见 [IRBasics §4.2/§4.3](./IRBasics.md#4-ref---引用)）。前者描述"这个类有哪些字段"，后者出现在 IR Stmt 里，用于实际访问字段。

## 2. 字段类型

### 2.1 普通字段（`PROPERTY_DECLARATION`）

```typescript
// 源码 — 摘自 tests/resources/save/basic.ts
class Person {
    age: number;
    x: number = 0;
    constructor(age: number) {
        this.age = age;
    }
}
```

```typescript
// ArkIR — 字段初始化被搬到 %instInit 方法
class Person {
  Fields:
    age: number
    x: number = 0
  Methods:
    %instInit():
      this.<@save/basic.ts: Person.age> = age          // 来自构造器参数
      this.<@save/basic.ts: Person.x> = 0              // 来自字段默认值
    constructor(age: number):
      ...
}
```

字段在 IR 中通过两类 `Ref` 访问（详见 [IRBasics §4.2/§4.3](./IRBasics.md#42-arkinstancefieldref-实例字段引用)）：

```typescript
// 实例字段读：obj.field
%1 = myPerson.<@save/basic.ts: Person.age>          // ArkInstanceFieldRef

// 实例字段写：obj.field = v
this.<@save/basic.ts: Person.age> = age

// 静态字段：FieldSignature 名带 [static] 前缀
staticinvoke <@save/basic.ts: Person.[static]wooooof()>()
```

### 2.2 枚举成员（`ENUM_MEMBER`）

枚举本身在 ArkIR 里被建模成 `ArkClass`（`ClassCategory.ENUM`），每个枚举值是一个 `ArkField`，初始值在 `%statInit` 方法里赋给静态字段。

```typescript
// 源码 — 摘自 tests/resources/save/enums.ts
enum SceneBuildStage {
    BUILD_INIT = 1 << 1,
    CLASS_DONE = 1 << 2,
    METHOD_DONE = BUILD_INIT | CLASS_DONE,
    ALL = 'all'.length,
}
```

```typescript
// ArkIR
enum SceneBuildStage {
  Fields:
    BUILD_INIT
    CLASS_DONE
    METHOD_DONE
    ALL
  Methods:
    %statInit():
      <@save/enums.ts: SceneBuildStage.[static]BUILD_INIT> = 1 << 1
      <@save/enums.ts: SceneBuildStage.[static]CLASS_DONE> = 1 << 2
      <@save/enums.ts: SceneBuildStage.[static]METHOD_DONE> = BUILD_INIT | CLASS_DONE
      ...
}
```

### 2.3 参数属性（`PARAMETER_PROPERTY`）

TS 允许在构造器形参前加访问修饰符自动声明字段，ArkAnalyzer 会把这种参数同时记为 `ArkField`（category = `PARAMETER_PROPERTY`）和构造器形参，构造期自动注入 `this.x = x`：

```typescript
// 源码
class Greeter {
    constructor(public name: string, private age: number) {}
}
```

```typescript
// ArkIR
class Greeter {
  Fields:
    name: string         // PARAMETER_PROPERTY, public
    age: number          // PARAMETER_PROPERTY, private
  Methods:
    constructor(name: string, age: number):
      this.<@F: Greeter.name> = name
      this.<@F: Greeter.age> = age
      return
}
```

### 2.4 接口属性签名（`PROPERTY_SIGNATURE`）

接口字段没有初始化代码，仅持有 `FieldSignature` 与可选标记 `?`：

```typescript
// 源码 — 摘自 tests/resources/save/basic.ts
interface Alarm {
    alert(): void;
    snooze?: number;
}
```

```typescript
// ArkIR
interface Alarm {
  Fields:
    snooze?: number      // PROPERTY_SIGNATURE, questionToken=true
  Methods:
    alert(): void        // 接口方法独立建模，详见 ArkMethod.md
}
```

### 2.5 索引签名（`INDEX_SIGNATURE`）

```typescript
// 源码
interface StringMap {
    [key: string]: number;
}
```

```typescript
// ArkIR — 索引签名也被记为 ArkField，名字固定为参数名
interface StringMap {
  Fields:
    key: number          // INDEX_SIGNATURE
}
```

### 2.6 GET 访问器（`GET_ACCESSOR`）

```typescript
// 源码
class Box {
    get area(): number { return 10; }
}
```

```typescript
// ArkIR — area 同时表现为 ArkField (GET_ACCESSOR) 与 ArkMethod
class Box {
  Fields:
    area: number         // GET_ACCESSOR
  Methods:
    get area(): number { return 10 }
}
```

## 3. 核心数据结构

```typescript
// src/core/model/ArkField.ts
export class ArkField extends ArkBaseModel {
    private code: string = '';                  // 源码片段（用于诊断 / 转写）
    private declaringClass!: ArkClass;          // 所属类
    private fieldSignature!: FieldSignature;    // 全局唯一签名（含名字、类型、staticFlag）
    private originFullPosition!: FullPosition;  // 源码完整位置（起始/结束行列）
    private initializer: Stmt[] = [];           // 字段初始化语句序列
}
```

`FieldCategory` 9 种取值：

| 枚举值 | 含义 | 典型语法 |
|--------|------|---------|
| `PROPERTY_DECLARATION` | 普通类字段 | `class C { x: number = 0 }` |
| `PROPERTY_ASSIGNMENT` | 对象字面量属性 | `{ x: 1 }` |
| `SHORT_HAND_PROPERTY_ASSIGNMENT` | 对象字面量短手 | `{ x }`（等价 `{ x: x }`） |
| `SPREAD_ASSIGNMENT` | 对象展开 | `{ ...other }` |
| `PROPERTY_SIGNATURE` | 接口属性签名 | `interface I { x?: number }` |
| `ENUM_MEMBER` | 枚举成员 | `enum E { A = 1 }` |
| `INDEX_SIGNATURE` | 索引签名 | `[k: string]: number` |
| `GET_ACCESSOR` | getter | `get x() { … }` |
| `PARAMETER_PROPERTY` | 构造器参数属性 | `constructor(public x: number)` |

`ModifierType`（位标志，按需 OR 组合）：

| 标志 | 说明 |
|------|------|
| `PUBLIC` / `PROTECTED` / `PRIVATE` | 访问可见性；类字段无显式修饰时默认 `public` |
| `STATIC` | 静态字段，签名带 `[static]` 前缀 |
| `READONLY` | 只读字段（写检查时使用） |
| `ABSTRACT` | `abstract` 字段 |
| `DECLARE` | `declare` 字段（无实现） |
| `EXPORT` / `DEFAULT` | 导出 / 默认导出（适用于 namespace 内字段） |
| `OVERRIDE` | `override` 标记 |
| `ACCESSOR` | TS 5 `accessor` 关键字 |

> 完整列表见 [src/core/model/ArkBaseModel.ts](../../src/core/model/ArkBaseModel.ts) 的 `ModifierType` 枚举（含 C/C++ 专用的 `VIRTUAL` / `INLINE` / `CONSTEXPR` 等）。

`FieldSignature`（[src/core/model/ArkSignature.ts](../../src/core/model/ArkSignature.ts)）作为字段的全局唯一标识：

```typescript
export class FieldSignature {
    private declaringSignature: BaseSignature;  // 所属类或命名空间签名
    private fieldName: string;
    private type: Type;
    private staticFlag: boolean;
}
```

`toString()` 输出 `<@Project/File: ClassName.fieldName>` 或带 `[static]` 前缀，与 IR 中 `Ref` 文本一致。

## 4. 主要接口

### 基本接口

| 方法 | 说明 |
|------|------|
| `getName(): string` | 返回 `fieldSignature.getFieldName()` |
| `getType(): Type` | 返回 `fieldSignature.getType()` |
| `getSignature(): FieldSignature` / `setSignature(s)` | 全局唯一签名 |
| `getCategory(): FieldCategory` / `setCategory(c)` | 通过 tag 系统获取/设置字段种类（9 种类型） |
| `getDeclaringArkClass(): ArkClass` / `setDeclaringArkClass(c)` | 反向定位所属类 |
| `getInitializer(): Stmt[]` / `setInitializer(stmts)` | 初始化语句（会被搬到 `%instInit` / `%statInit`） |
| `getQuestionToken() / setQuestionToken(b)` | 通过 `BaseModelTag.QUESTION_TOKEN` 管理 `foo?: T` 中的可选标记 |
| `getExclamationToken() / setExclamationToken(b)` | 通过 `BaseModelTag.EXCLAMATION_TOKEN` 管理 `foo!: T` 中的"definite assignment"标记 |
| `getCode(): string` / `setCode(s)` | 字段对应的源码片段 |
| `getOriginFullPosition(): FullPosition` | 源码完整位置（起始/结束行列） |
| `setOriginFullPosition(position: FullPosition)` | 设置源码完整位置 |
| `getLanguage(): Language` | 字段所属文件的语言种类（继承自类） |
| `validate(): ArkError` | 必要字段完整性检查（`declaringClass`、`fieldSignature`） |
| `isPublic(): boolean` | 是否为 public（无显式修饰时类/接口/对象字段默认 true） |

### 修饰符

| 方法 | 说明 |
|------|------|
| `containsModifier(m: ModifierType): boolean` | 是否包含某修饰符 |
| `addModifier(m: ModifierType)` | 加入修饰符 |
| `removeModifier(m: ModifierType)` | 删除修饰符 |
| `isStatic() / isReadonly() / isAbstract() / isExport() / isDefault()` | 常用修饰符快捷判断 |
| `getModifiers(): number` | 原始位标志 |

### FieldSignature

| 方法 | 说明 |
|------|------|
| `getFieldName(): string` | 字段名 |
| `getType(): Type` / `setType(t)` | 字段类型 |
| `isStatic(): boolean` | 是否静态 |
| `getDeclaringSignature(): BaseSignature` | 所属 `ClassSignature` 或 `NamespaceSignature` |
| `getBaseName(): string` | 所属类名（或命名空间名） |
| `toString(): string` | `<@Pkg/File: Class.field>`，静态字段加 `[static]` |

### 已废弃接口

以下接口自 **1.0.91** 版本起废弃，建议使用新的替代接口：

| 方法 | 说明 |
|------|------|
| `getOriginPosition(): LineColPosition` | ⚠️ **废弃于 1.0.91**，建议使用 `getOriginFullPosition()` |
| `setOriginPosition(position: LineColPosition)` | ⚠️ **废弃于 1.0.91**，建议使用 `setOriginFullPosition()` |
| `isExported(): boolean` | ⚠️ **废弃于 1.0.91**，建议使用 `isExport()` 替代 |

## 5. 使用示例

下例展示如何遍历所有 `ArkField`，按 category 与修饰符分类输出，并演示如何从 `ArkInstanceFieldRef` 反查到对应 `ArkField`。

```typescript
import {
    Scene, SceneConfig,
    ArkField, FieldCategory, ModifierType,
    ArkInstanceFieldRef, ArkStaticFieldRef, ArkAssignStmt,
} from 'arkanalyzer';

const config = new SceneConfig();
config.buildFromProjectDir('tests/resources/save');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes();

for (const arkFile of scene.getFiles()) {
    for (const arkClass of arkFile.getClasses()) {
        for (const field of arkClass.getFields()) {
            const sig = field.getSignature();
            const cat = FieldCategory[field.getCategory()];
            const mods = field.containsModifier(ModifierType.STATIC) ? ' static' : '';
            const ro   = field.containsModifier(ModifierType.READONLY) ? ' readonly' : '';
            console.log(`[${cat}]${mods}${ro}  ${sig}  init#=${field.getInitializer().length}`);
        }

        // 反向：找到 IR 里所有的字段读写
        for (const arkMethod of arkClass.getMethods()) {
            const cfg = arkMethod.getBody()?.getCfg();
            if (!cfg) continue;
            for (const stmt of cfg.getStmts()) {
                if (!(stmt instanceof ArkAssignStmt)) continue;
                const lhs = stmt.getLeftOp(), rhs = stmt.getRightOp();
                for (const v of [lhs, rhs]) {
                    if (v instanceof ArkInstanceFieldRef || v instanceof ArkStaticFieldRef) {
                        const fieldSig = v.getFieldSignature();
                        const owner = scene.getClass(fieldSig.getDeclaringSignature() as any);
                        const field = owner?.getFieldWithName(fieldSig.getFieldName());
                        if (field) {
                            console.log(`  ${stmt} -> ${field.getSignature()}`);
                        }
                    }
                }
            }
        }
    }
}
```

> 完整可运行示例可参考：[tests/samples/SceneTest.ts](../../tests/samples/SceneTest.ts) —— 在它的类遍历循环里添加上述字段处理逻辑即可。
