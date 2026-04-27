# ArkClass

## 1. 概述

**`ArkClass`** 是 ArkAnalyzer 中"类型容器"的统一抽象。它不仅代表 TypeScript / ArkTS 的 `class`，还涵盖 `interface`、`enum`、`struct`（ArkUI）、对象字面量、`type literal`、C/C++ 的 `union` 等所有"带成员"的语言构造，并通过 [`ClassCategory`](#3-核心数据结构) 区分。每一个 `ArkClass` 都隶属于唯一的 [`ArkFile`](./ArkFile.md)（可选地再隶属一个 [`ArkNamespace`](./ArkNameSpace.md)），并通过 [`ClassSignature`](#3-核心数据结构) 全局唯一标识。

`ArkClass` 同时托管：

- 字段（[`ArkField`](./ArkField.md)）：实例字段 + 静态字段，分别索引。
- 方法（[`ArkMethod`](./ArkMethod.md)）：实例方法 + 静态方法 + 默认方法 `%dflt` + 自动生成的 `%instInit` / `%statInit`，重载场景下同名方法存放为数组。
- 继承关系：父类与若干接口，统一存放在 `heritageClasses`，按"父类在前、接口在后"的顺序。
- ArkUI 视图树：若该类是 `@Component`，会持有一棵 [`ViewTree`](../analysis/ViewTree.md)。

## 2. ArkIR

ArkIR 中以一段缩进良好的"伪类声明"展示一个 `ArkClass`：第一行写 `<类别> <名字>`（带 `extends` / `implements` 修饰），随后两块 `Fields:` 与 `Methods:` 列出所有成员，并把所有方法体一并展开。下面按 `ClassCategory` 给出 7 类形态。

### 2.1 普通类（`CLASS`）

```typescript
// 源码
class Person {
    age: number;
    constructor(age: number) { this.age = age; }
    growOld(): void { this.age = this.age + 1; }
}
```

```typescript
// ArkIR
class Person {
  Fields:
    age: number
  Methods:
    %instInit(): void { ... this.<@F: Person.age> = age ... }
    constructor(age: number): Person { ... }
    growOld(): void { ... }
}
```

### 2.2 接口（`INTERFACE`）

接口字段没有初始化语句，方法没有实现体。

```typescript
// 源码
interface Alarm {
    alert(): void;
    snooze?: number;
}
```

```typescript
// ArkIR
interface Alarm {
  Fields:
    snooze?: number
  Methods:
    alert(): void
}
```

### 2.3 ArkUI Struct（`STRUCT`）

```typescript
// 源码
@Component
struct Index {
    @State message: string = 'Hello';
    build() { Text(this.message) }
}
```

```typescript
// ArkIR
struct Index {
  Fields:
    message: string @State
  Methods:
    %instInit(): void { ... this.<@F: Index.message> = 'Hello' ... }
    build(): void { ... }       // 该方法附带 ViewTree
}
```

### 2.4 枚举（`ENUM`）

枚举每个成员是一个静态字段，初始化集中在 `%statInit`。

```typescript
// 源码
enum Direction { Up = 1, Down }
```

```typescript
// ArkIR
enum Direction {
  Fields:
    Up
    Down
  Methods:
    %statInit(): void {
      <@F: Direction.[static]Up>   = 1
      <@F: Direction.[static]Down> = 2
      return
    }
}
```

### 2.5 类型字面量（`TYPE_LITERAL`）

```typescript
// 源码
type Point = { x: number; y: number };
```

```typescript
// ArkIR — 类型字面量也建模为 ArkClass，类别 TYPE_LITERAL
type_literal Point {
  Fields:
    x: number
    y: number
}
```

### 2.6 对象字面量（`OBJECT`）

每出现一次形如 `{ key: value, … }` 的对象字面量，IR 会合成一个匿名类（名字以 `%AC` 开头）来描述其形态。

```typescript
// 源码
let cfg = { host: 'localhost', port: 8080 };
```

```typescript
// ArkIR — 合成匿名类
class %AC0$%dflt {                            // ANONYMOUS_CLASS_PREFIX = '%AC'
  Fields:
    host: string
    port: number
  Methods:
    %instInit(): void {
      this.<@F: %AC0$%dflt.host> = 'localhost'
      this.<@F: %AC0$%dflt.port> = 8080
    }
}

// 调用点
%dflt(): void {
  ...
  cfg = new @F: %AC0$%dflt
  instanceinvoke cfg.<@F: %AC0$%dflt.%instInit()>()
  ...
}
```

### 2.7 默认类 `%dflt`

每个 `ArkFile` 都隐式拥有一个名为 `%dflt`（`DEFAULT_ARK_CLASS_NAME`）的默认类，作为顶层语句、独立函数、顶层变量、`type` 别名等所有不属于具体类的成员的"载体"。

```typescript
// 源码（顶层）
function add(a: number, b: number) { return a + b; }
let x = 1;
```

```typescript
// ArkIR
class %dflt {
  Fields:
    x: number = 1                              // 顶层 let/const 落在默认类的字段表
  Methods:
    add(a: number, b: number): number { ... } // 独立函数挂在默认类下
    %dflt(): void { ... x = 1 ... }           // 顶层执行语句
}
```

> 默认类与默认方法的命名都来自 [`src/core/common/Const.ts`](../../src/core/common/Const.ts)：`DEFAULT_ARK_CLASS_NAME = "%dflt"`、`DEFAULT_ARK_METHOD_NAME = "%dflt"`。

## 3. 核心数据结构

```typescript
// src/core/model/ArkClass.ts
export class ArkClass extends ArkBaseModel implements ArkExport {
    private category!: ClassCategory;                                    // 类别（7 种）
    private code?: string;
    private lineCol: LineCol = 0;

    private declaringArkFile!: ArkFile;                                  // 所属文件
    private declaringArkNamespace: ArkNamespace | undefined;             // 所属命名空间（可选）
    private classSignature!: ClassSignature;                             // 全局唯一签名

    private heritageClasses: Map<string, heritageClassWithInfo | undefined>; // 继承表（父类在前）
    private genericsTypes?: GenericType[];                               // 类层泛型形参
    private realTypes?: Type[];                                          // 泛型实例化时的实参

    private defaultMethod: ArkMethod | null = null;                      // %dflt 方法

    private methods: Map<string, ArkMethod[]>;                           // 实例方法（同名重载用数组）
    private staticMethods: Map<string, ArkMethod[]>;                     // 静态方法
    private fields: Map<string, ArkField>;                               // 实例字段
    private staticFields: Map<string, ArkField>;                         // 静态字段
    private extendedClasses: Map<string, ArkClass>;                      // 反向：所有继承本类的子类

    private instanceInitMethod: ArkMethod;                               // %instInit
    private staticInitMethod: ArkMethod;                                 // %statInit

    private anonymousMethodNumber: number = 0;                           // 用于命名 %AM<idx>$<外层>
    private indexSignatureNumber: number = 0;
    private viewTree?: ViewTree;                                         // ArkUI 视图树
}
```

### `ClassCategory` 7 种取值

| 枚举值 | 含义 | 示例 |
|--------|------|------|
| `CLASS` | 普通类 | `class C {}` |
| `STRUCT` | ArkUI 组件 | `@Component struct C {}` |
| `INTERFACE` | 接口 | `interface I {}` |
| `ENUM` | 枚举 | `enum E { A, B }` |
| `TYPE_LITERAL` | 类型字面量 | `type T = { x: number }` |
| `OBJECT` | 对象字面量（合成匿名类） | `{ a: 1 }` |
| `UNION` | C/C++ union | `union U {}` |

### 特殊类名

| 常量 | 值 | 含义 |
|------|----|------|
| `DEFAULT_ARK_CLASS_NAME` | `%dflt` | 每个 `ArkFile` 的默认类 |
| `ANONYMOUS_CLASS_PREFIX` | `%AC` | 对象字面量等场景合成的匿名类前缀，命名形如 `%AC<idx>$<外层>` |

### `ModifierType` 修饰符（继承自 [`ArkBaseModel`](../../src/core/model/ArkBaseModel.ts)）

常用：`PUBLIC` / `PROTECTED` / `PRIVATE`、`ABSTRACT`、`EXPORT` / `DEFAULT`、`DECLARE`、`OVERRIDE`、`READONLY`；C/C++ 还包括 `VIRTUAL`、`PURE_VIRTUAL`、`INLINE`、`CONSTEXPR`、`MUTABLE` 等。完整位标志见 [ArkField §3](./ArkField.md#3-核心数据结构)。

### `ClassSignature`

```typescript
// src/core/model/ArkSignature.ts
export class ClassSignature {
    private declaringFileSignature!: FileSignature;
    private declaringNamespaceSignature: NamespaceSignature | null;
    private className: string;
}
```

`toString()` 形如 `@Pkg/File: ClassName`，命名空间内则形如 `@Pkg/File: NS.ClassName`。

### `heritageClasses`

`Map<string, heritageClassWithInfo | undefined>`：键为父类名 / 接口名，值为：

```typescript
interface heritageClassWithInfo {
    baseClass: ArkClass | undefined | null;
    isVirtual: boolean;       // C++ virtual inheritance
    access: string;           // C++ public/protected/private inheritance
}
```

约定：
- 父类（若有）放第一项；不存在时占位空字符串。
- 余下都是接口。
- 类型推导阶段把 `baseClass` 由 `undefined` 替换为真正的 `ArkClass`（或 `null` 表示找不到）。

## 4. 主要接口

### 标识与归属

| 方法 | 说明 |
|------|------|
| `getName(): string` | 类名（来自 `classSignature`） |
| `getSignature(): ClassSignature` / `setSignature(s)` | 全局签名 |
| `getCategory(): ClassCategory` / `setCategory(c)` | 类别 |
| `getDeclaringArkFile(): ArkFile` / `setDeclaringArkFile(f)` | 所属文件 |
| `getDeclaringArkNamespace(): ArkNamespace \| undefined` / `setDeclaringArkNamespace(ns)` | 所属命名空间 |
| `getLanguage(): Language` | 等价 `getDeclaringArkFile().getLanguage()` |
| `isDefaultArkClass()` | 是否 `%dflt` |
| `isAnonymousClass()` | 是否 `%AC` 前缀 |
| `isLibraryClass()` | 是否第三方库类（与当前 Scene 主项目名不一致） |
| `getCode() / setCode(s)` | 源码片段 |
| `getLine() / setLine(n) / getColumn() / setColumn(n)` | 源码位置 |

### 继承

| 方法 | 说明 |
|------|------|
| `getSuperClassName(): string` | 父类名（`heritageClasses` 第一项） |
| `getSuperClass(): ArkClass \| null` | 父类对象。注意：若父类是 INTERFACE 且非第三方库类，返回 `null` |
| `getHeritageClass(name): ArkClass \| null` | 按名查继承类（懒类型推导） |
| `getAllHeritageClasses(): ArkClass[]` | 所有父类 + 实现接口 |
| `getImplementedInterfaceNames(): string[]` | 所有 implements 接口名（不含 INTERFACE 类自身的 extends） |
| `hasImplementedInterface(name) / getImplementedInterface(name)` | 接口判断与查询 |
| `addHeritageClassName(name) / addHeritageClassNameWithInfo(name, info)` | 在构建期登记继承关系 |
| `getExtendedClasses(): Map<string, ArkClass>` / `addExtendedClass(c)` | 反向：本类的子类集合 |

### 字段

| 方法 | 说明 |
|------|------|
| `getFields(): ArkField[]` | 所有字段（静态在前 + 实例） |
| `getFieldWithName(name) / getStaticFieldWithName(name) / getField(sig)` | 按名 / 按签名查 |
| `addField(f) / addFields(fs)` | 加入（自动按 `isStatic` 分流） |
| `removeField(f): boolean` | 删除 |
| `getStaticFields(classMap): ArkField[]` | 仅静态字段 |

### 方法

| 方法 | 说明 |
|------|------|
| `getMethods(generated?): ArkMethod[]` | 所有方法（静态 + 实例）。`generated=true` 时包含 `%instInit` / `%statInit` 等自动生成的方法 |
| `getMethodWithName(name) / getStaticMethodWithName(name)` | 按名查首个匹配（重载多签名时仅返回一个） |
| `getMethodsWithName(name) / getStaticMethodsWithName(name) / getAllMethodsWithName(name)` | 按名查全部（含重载） |
| `getMethod(signature): ArkMethod \| null` | 按签名查 |
| `addMethod(method, originName?)` | 加入；嵌套方法名（`%name$outer`）会同时按 originName 索引一份 |
| `removeMethod(method): boolean` | 从类与 Scene 中同时移除 |
| `setDefaultArkMethod(m) / getDefaultArkMethod(): ArkMethod \| null` | 默认方法 `%dflt` |
| `getInstanceInitMethod(): ArkMethod` / `setInstanceInitMethod(m)` | `%instInit` |
| `getStaticInitMethod(): ArkMethod` / `setStaticInitMethod(m)` | `%statInit` |
| `getAnonymousMethodNumber(): number` | 在添加新匿名方法时自增 |
| `getIndexSignatureNumber(): number` | 在添加新索引签名时自增 |

### 泛型与 ArkUI

| 方法 | 说明 |
|------|------|
| `getGenericsTypes(): GenericType[] \| undefined` / `addGenericType(t)` | 类形参（如 `class Box<T>` 的 T） |
| `getRealTypes(): Type[] \| undefined` | 泛型实例化的实参（继承时被父类传入） |
| `getViewTree(): ViewTree \| undefined` / `setViewTree(vt)` / `hasViewTree()` | ArkUI 视图树 |

### 杂项

| 方法 | 说明 |
|------|------|
| `getGlobalVariable(globalMap): Local[]` | 该类作用域可见的全局变量列表 |
| `validate(): ArkError` | 必填字段检查（`declaringArkFile`、`category`、`classSignature`） |
| `getDeclareSignature() / setDeclareSignature(s)` | C/C++ 声明与定义分离时的声明签名 |
| `getTs2cxxFuncMap()` / `addTs2cxxFuncMapElement(name, mtds)` | TS ↔ CXX 跨语言函数映射（仅鸿蒙 native 场景） |
| `getExportType(): ExportType` | 恒返回 `ExportType.CLASS` |

## 5. 使用示例

下例展示如何遍历项目中所有 `ArkClass`，按类别分类，并抽取继承关系与成员统计。

```typescript
import {
    Scene, SceneConfig,
    ArkClass, ClassCategory, ModifierType,
} from 'arkanalyzer';

const config = new SceneConfig();
config.buildFromProjectDir('tests/resources/save');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes();

for (const arkFile of scene.getFiles()) {
    for (const arkClass of arkFile.getClasses()) {
        const cat   = ClassCategory[arkClass.getCategory()];
        const flags = [
            arkClass.containsModifier(ModifierType.EXPORT)   && 'export',
            arkClass.containsModifier(ModifierType.ABSTRACT) && 'abstract',
            arkClass.containsModifier(ModifierType.DECLARE)  && 'declare',
        ].filter(Boolean).join(' ');
        const sig = arkClass.getSignature().toString();

        let kind = 'normal';
        if (arkClass.isDefaultArkClass())   kind = '%dflt';
        if (arkClass.isAnonymousClass())    kind = '%AC';

        console.log(`[${cat}${flags ? ' ' + flags : ''}] ${sig}  (${kind})`);

        // 继承
        const sup = arkClass.getSuperClass();
        if (sup) console.log(`  extends ${sup.getName()}`);
        const ifaces = arkClass.getImplementedInterfaceNames();
        if (ifaces.length) console.log(`  implements ${ifaces.join(', ')}`);

        // 成员统计
        const fields = arkClass.getFields();
        const methods = arkClass.getMethods(true);   // 含 generated
        console.log(`  fields=${fields.length}, methods=${methods.length}`);
        if (arkClass.hasViewTree()) console.log('  hasViewTree');
    }
}
```

> 完整可运行示例可参考：[tests/samples/SceneTest.ts](../../tests/samples/SceneTest.ts) 与 [tests/samples/CfgTest.ts](../../tests/samples/CfgTest.ts)。
