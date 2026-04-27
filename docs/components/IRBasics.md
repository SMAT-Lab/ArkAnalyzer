# IR 基础元素

## 1. 概述

ArkIR 采用**三地址码（3AC）**形式：每条语句最多包含一个运算或一次赋值，复杂表达式通过临时变量被拆分为多条简单语句。在三地址码中，所有可以出现在语句中的"值"统一抽象为接口 `Value`（[src/core/base/Value.ts](../../src/core/base/Value.ts)）。`Value` 共有 4 类子类型，它们是构造 [Stmt](./Stmt.md) 的基本积木：

```typescript
Value（值接口 —— 所有可出现在语句中的"值"）
 ├── Local（局部变量：用户变量、临时变量、参数、this）
 ├── Constant（常量：数字、字符串、布尔、null、undefined、bigint）
 ├── Ref（引用：字段、数组元素、参数、this、捕获异常、全局、闭包）
 └── Expr（表达式：调用、创建、运算、类型操作、Phi 等）
```

`Value` 接口（[src/core/base/Value.ts](../../src/core/base/Value.ts)）只规定了三个能力：

| 方法 | 说明 |
|------|------|
| `getType(): Type` | 该值的静态/推导类型，类型层次见 [TypeInference](../analysis/TypeInference.md) |
| `getUses(): Value[]` | 该值进一步引用到的子值（Local/Constant 通常返回 `[]`，复合表达式会递归收集子操作数） |
| `toString(): string` | 该值在 ArkIR 文本输出中的形态 |

> 本文档逐一介绍 4 大类子类型；语句（`Stmt`）的组织参见 [Stmt](./Stmt.md)。

## 2. Local - 局部变量

`Local`（[src/core/base/Local.ts](../../src/core/base/Local.ts)）表示方法体内的局部变量。三地址码会显式产出 4 类局部变量：

```typescript
Local
├── 用户变量          // 源码中显式声明的局部变量，如 myPerson、i
├── 临时变量          // 表达式拆分时生成的中间变量，命名为 %0、%1、…
├── 参数变量          // 方法入口处的形参绑定，命名为 parameter0、parameter1、…
└── this              // 当前实例引用，命名固定为 this
```

### 2.1 类的定义

```typescript
// src/core/base/Local.ts
export class Local implements Value, ArkExport {
    private name: string;                    // 名称：用户名、%N、parameterN、this
    private type: Type;                      // 类型，未推导时为 UnknownType
    private originalValue: Value | null;     // 临时变量回溯到的原始表达式（如有）
    private declaringStmt: Stmt | null;      // 该 Local 第一次被定义的语句
    private usedStmts: Stmt[];               // 所有引用该 Local 的语句
    private signature?: LocalSignature;      // 跨方法定位用
    private constFlag?: boolean;             // 是否由 const 声明
}
```

### 2.2 主要接口

| 方法 | 说明 |
|------|------|
| `getName() / setName(name)` | 获取/修改 Local 名称 |
| `getType() / setType(type)` | 获取/修改 Local 类型 |
| `getDeclaringStmt() / setDeclaringStmt(stmt)` | 第一次定义此 Local 的语句 |
| `getUsedStmts() / addUsedStmt(stmt)` | 所有使用此 Local 的语句 |
| `getOriginalValue() / setOriginalValue(v)` | 临时变量对应的原始表达式 |
| `getSignature() / setSignature(sig)` | 跨方法的唯一标识 |
| `getConstFlag() / setConstFlag(flag)` | 是否为 const |
| `inferType(arkMethod)` | 配合 [TypeInference](../analysis/TypeInference.md) 完成类型推导 |
| `toString()` | 返回 `name`，例如 `%0`、`parameter0`、`this` |

### 2.3 各子类型示例

#### 用户变量

```typescript
// 源码
function add(a: number, b: number): number {
    let sum = a + b;
    return sum;
}
```

```typescript
// ArkIR
add(@number, @number): @number {
  label0:
    this = this: @example.ts: %dflt
    a = parameter0: number
    b = parameter1: number
    sum = a + b
    return sum
}
```

`sum`、`a`、`b` 即为用户变量；它们在 `body.getLocals()` 中以名称为键。

#### 临时变量（`%N`）

复杂表达式被拆解时，编译器会按需生成 `%0`、`%1`、…：

```typescript
// 源码
let myPerson = new Person(10);
```

```typescript
// ArkIR（摘自 tests/resources/save/basic.ts 的 forLoopTest）
%0 = new @save/basic.ts: Person
%0 = instanceinvoke %0.<@save/basic.ts: Person.constructor(number)>(10)
myPerson = %0
```

可见 `new` 与构造函数调用被拆为两条 3AC 语句，`%0` 是承接对象的临时变量。

#### 参数变量（`parameterN`）

方法入口处会插入 `parameterN: Type` 的赋值，把形参绑定到对应序号的局部：

```typescript
// ArkIR
add(@number, @number): @number {
  label0:
    this = this: @example.ts: %dflt
    a = parameter0: number
    b = parameter1: number
    ...
}
```

注意：右侧 `parameter0: number` 是 [`ArkParameterRef`](#42-arkparameterref---参数引用) 引用，而 `a` 是承接它的 `Local`。

#### `this`

在非静态方法中，入口处会赋值 `this = this: @<file>: <class>`，以 [`ArkThisRef`](#43-arkthisref---this-引用) 形式提供当前实例的引用，再写入名为 `this` 的 `Local`。

## 3. Constant - 常量

`Constant`（[src/core/base/Constant.ts](../../src/core/base/Constant.ts)）封装编译期已知字面量。共 6 个子类型，全部继承自 `Constant` 基类：

```typescript
Constant
├── BooleanConstant     // true / false（单例）
├── NumberConstant      // 数字字面量，例如 1、3.14
├── BigIntConstant      // BigInt 字面量，例如 10n
├── StringConstant      // 字符串字面量，例如 "hello"
├── NullConstant        // null（单例）
└── UndefinedConstant   // undefined（单例）
```

### 3.1 类的定义

```typescript
// src/core/base/Constant.ts
export class Constant implements Value {
    private readonly value: string;          // 字面量文本
    private readonly type: Type;             // BooleanType / NumberType / StringType / ...
}

export class BooleanConstant extends Constant {
    public static getInstance(value: boolean): BooleanConstant; // 单例 TRUE / FALSE
}
export class NumberConstant   extends Constant { /* type = NumberType */ }
export class BigIntConstant   extends Constant { /* value 后缀 'n' */ }
export class StringConstant   extends Constant { /* type = StringType */ }
export class NullConstant     extends Constant { /* 单例 INSTANCE，value = "null" */ }
export class UndefinedConstant extends Constant { /* 单例 INSTANCE，value = "undefined" */ }
```

### 3.2 主要接口

| 方法 | 说明 |
|------|------|
| `getValue(): string` | 字面量文本（数字/布尔/字符串等都序列化为字符串） |
| `getType(): Type` | 字面量类型，对应 [Type](../analysis/TypeInference.md) 中的 `BooleanType` / `NumberType` / `StringType` 等 |
| `toString()` | 字符串字面量加单引号；其余直接输出文本 |

### 3.3 示例

```typescript
// 源码
let n = 42;
let s = "hello";
let f = false;
let nothing = null;
let nope: bigint = 10n;
```

```typescript
// ArkIR
n = 42
s = 'hello'
f = false
nothing = null
nope = 10n
```

`Boolean/Null/Undefined` 三类常量为单例，可通过 `BooleanConstant.getInstance(true)`、`NullConstant.getInstance()`、`UndefinedConstant.getInstance()` 获取，避免重复构造。

## 4. Ref - 引用

`Ref`（[src/core/base/Ref.ts](../../src/core/base/Ref.ts)）抽象"对某个外部存储位置的取/写"——它本身不是局部，而是访问字段、数组元素、参数槽位、`this`、闭包变量、捕获异常等的左值/右值。所有引用继承自抽象类 `AbstractRef`。

```typescript
AbstractRef
├── ArkArrayRef              // 数组元素：arr[index]
├── AbstractFieldRef         // 字段引用
│   ├── ArkInstanceFieldRef  // 实例字段：obj.<@Pkg/File: Class.field>
│   └── ArkStaticFieldRef    // 静态字段：<@Pkg/File: Class.staticField>
├── ArkParameterRef          // 参数槽位（方法入口处赋值给对应 Local）：parameter0: T
├── ArkThisRef               // this 引用（方法入口处）：this: @Pkg/File: Class
├── ArkCaughtExceptionRef    // catch 块捕获的异常对象：caughtexception: T
├── GlobalRef                // 全局变量
└── ClosureFieldRef          // 闭包捕获的变量
```

### 4.1 ArkArrayRef - 数组元素引用

类定义：

```typescript
export class ArkArrayRef extends AbstractRef {
    private base: Local;     // 数组对象
    private index: Value;    // 索引（Local 或 Constant）
}
```

主要接口：`getBase()` / `setBase()` / `getIndex()` / `setIndex()` / `getType()`（返回元素类型）。

示例：

```typescript
// 源码
const sampleData: number[] = [1, 2, 3, 4, 5];
let v = sampleData[i];
```

```typescript
// ArkIR（摘自 tests/resources/save/basic.ts）
%0 = newarray (number)[5]
%0[0] = 1
%0[1] = 2
%0[2] = 3
%0[3] = 4
%0[4] = 5
sampleData = %0
...
%2 = sampleData[i]
```

`%0[0] = 1` 中等号左侧的 `%0[0]` 即为 `ArkArrayRef`，被作为 `ArkAssignStmt.leftOp`；`sampleData[i]` 同样是 `ArkArrayRef`，但作为 `rightOp`。

### 4.2 ArkInstanceFieldRef / ArkStaticFieldRef - 字段引用

公共父类 `AbstractFieldRef` 持有 `FieldSignature`；二者的差异在于实例字段额外保存 `base: Local`（属于哪个对象），静态字段无 base。

```typescript
export class ArkInstanceFieldRef extends AbstractFieldRef {
    private base: Local;
    private dynamic?: boolean;
}
export class ArkStaticFieldRef extends AbstractFieldRef { /* 仅 fieldSignature */ }
```

主要接口：`getFieldName()`、`getFieldSignature()`、（仅实例）`getBase()` / `setBase()`、`isDynamic()`。

示例（实例字段）：

```typescript
// 源码
let newAge = myPerson.age + i;
```

```typescript
// ArkIR
%1 = myPerson.<@save/basic.ts: Person.age>
newAge = %1 + i
```

字段访问被拆为先把 `myPerson.age` 读到临时 `%1`，再做加法。读出的字段是 `ArkInstanceFieldRef(base = myPerson, fieldSignature = ...Person.age)`。

示例（静态字段）：

```typescript
// ArkIR
%2 = <@example.ts: Math.PI>
```

输出格式仅为字段签名，不带 base。

### 4.3 ArkThisRef - this 引用

```typescript
export class ArkThisRef extends AbstractRef {
    private type: ClassType;     // 当前类的 ClassType
}
```

只在方法入口出现一次，写入名为 `this` 的局部：

```typescript
this = this: @save/basic.ts: %dflt
```

### 4.4 ArkParameterRef - 参数引用

```typescript
export class ArkParameterRef extends AbstractRef {
    private index: number;       // 形参序号
    private paramType: Type;
}
```

形如 `parameterN: Type`，仅出现在方法入口处的 `ArkAssignStmt` 右侧，被赋值给对应的 `Local`：

```typescript
a = parameter0: number
b = parameter1: number
```

### 4.5 ArkCaughtExceptionRef - 捕获的异常引用

`catch` 块入口被翻译为一次赋值，把捕获的异常以 `caughtexception: T` 的形式取出：

```typescript
e = caughtexception: Error
```

### 4.6 GlobalRef - 全局引用

未在当前作用域显式声明、需要在全局/外部作用域查找的标识符。`GlobalRef` 持有 `name`、`ref`（指向真正的解析结果，惰性绑定）、以及 `usedStmts`。

### 4.7 ClosureFieldRef - 闭包变量引用

形如 `outerScope.x`，专门用于嵌套函数或箭头函数捕获的外层变量：

```typescript
export class ClosureFieldRef extends AbstractRef {
    private base: Local;         // 外层闭包对象（LexicalEnv）
    private fieldName: string;
    private type: Type;
}
```

`toString()` 输出 `base.fieldName`。

## 5. Expr - 表达式

`Expr`（[src/core/base/Expr.ts](../../src/core/base/Expr.ts)）表示一次显式的运算/调用/创建，所有 Expr 继承自 `AbstractExpr`。常见的 Expr 子类型按用途分组：

```typescript
Expr
├── 调用表达式
│   ├── ArkInstanceInvokeExpr      // 实例方法调用
│   ├── ArkStaticInvokeExpr        // 静态方法调用
│   └── ArkPtrInvokeExpr           // 函数指针/回调调用
├── 对象创建表达式
│   ├── ArkNewExpr                 // 对象创建
│   └── ArkNewArrayExpr            // 数组创建
├── 运算表达式
│   ├── ArkNormalBinopExpr         // 算术/位/逻辑等普通二元
│   ├── ArkConditionExpr           // 关系/相等等返回布尔的二元
│   └── ArkUnopExpr                // 一元运算
├── 类型相关表达式
│   ├── ArkCastExpr                // 类型转换 <T>x
│   ├── ArkTypeOfExpr              // typeof x
│   └── ArkInstanceOfExpr          // x instanceof T
└── 特殊表达式
    ├── ArkPhiExpr                 // SSA Phi 函数
    ├── ArkAwaitExpr               // await
    ├── ArkYieldExpr               // yield
    ├── ArkDeleteExpr              // delete x.y
    └── AliasTypeExpr              // 类型别名右值（type T = ...）
```

### 5.1 调用表达式

公共父类 `AbstractInvokeExpr` 持有 `methodSignature: MethodSignature`、`args: Value[]`、`realGenericTypes?: Type[]`、`spreadFlags?: boolean[]`。三种子类型分别对应：

#### ArkInstanceInvokeExpr - 实例方法调用

```typescript
export class ArkInstanceInvokeExpr extends AbstractInvokeExpr {
    private base: Local;             // 接收者对象
}
```

```typescript
instanceinvoke <base>.<@Pkg/File: Class.method(<param-types>)>(<args>)
```

示例：

```typescript
logger.info(newAge);
```

```typescript
instanceinvoke logger.<@%unk/%unk: .info()>(newAge)
```

#### ArkStaticInvokeExpr - 静态方法调用

无 base，签名直接在尖括号内：

```typescript
staticinvoke <@Pkg/File: Class.method(<param-types>)>(<args>)
```

#### ArkPtrInvokeExpr - 函数指针调用

承接"通过变量/字段调用函数"的情形：

```typescript
let ptr = foo;
ptr();           // ArkPtrInvokeExpr，funPtr = ptr (Local)
new A().b();     // ArkPtrInvokeExpr，funPtr = a.b (FieldRef)
```

输出格式：`ptrinvoke <ptrName><@Sig>(<args>)`。在 C/C++ 文件场景下会用动态指针名替换签名中的方法名（详见 [Expr.ts:333](../../src/core/base/Expr.ts#L333)）。

### 5.2 对象创建表达式

#### ArkNewExpr - 对象创建

```typescript
export class ArkNewExpr extends AbstractExpr {
    private classType: ClassType;
}
```

```typescript
%0 = new @save/basic.ts: Person
%0 = instanceinvoke %0.<@save/basic.ts: Person.constructor(number)>(10)
```

`new` 与 `constructor` 调用永远是两条独立 3AC 语句。

#### ArkNewArrayExpr - 数组创建

```typescript
export class ArkNewArrayExpr extends AbstractExpr {
    private baseType: Type;          // 元素类型
    private size: Value;             // 长度
    private fromLiteral: boolean;    // 是否由数组字面量产生
}
```

```typescript
%0 = newarray (number)[5]
```

随后通过 `%0[i] = ...` 的若干 `ArkArrayRef` 写入完成字面量初始化。

### 5.3 运算表达式

二元运算的公共父类 `AbstractBinopExpr` 持有 `op1`、`op2`、`operator`。完整运算符见 `NormalBinaryOperator` 与 `RelationalBinaryOperator` 枚举（[Expr.ts:633-670](../../src/core/base/Expr.ts#L633)）。

#### ArkNormalBinopExpr - 普通二元运算

支持的运算符：`+ - * / % ** << >> >>> & | ^ && || ??`。结果类型按操作数类型推导：`+` 在任一侧是字符串时为 `StringType`；位运算/移位、`-/*//%/**` 默认 `NumberType`，`BigInt` 操作数下为 `BigIntType`；`&& || ??` 退化到操作数类型（详见 [Expr.ts:setType](../../src/core/base/Expr.ts#L767)）。

#### ArkConditionExpr - 条件（关系）二元运算

支持的运算符：`< <= > >= == != === !== in`。结果类型恒为 `BooleanType`。`ArkConditionExpr` 还作为 [`ArkIfStmt`](./Stmt.md#24-arkifstmt---条件分支) 的条件项出现。

```typescript
if i < 10 goto label2 label3
```

#### ArkUnopExpr - 一元运算

支持的运算符：`-`（取负）、`~`（按位取反）、`!`（逻辑非），以及 C++ 专用的 `&`（取址）、`*`（解引用）。`toString()` 形如 `-x`、`!flag`。

### 5.4 类型相关表达式

| 类 | toString() 形态 | 类型 |
|----|----------------|------|
| `ArkCastExpr` | `<T>x` | `T` |
| `ArkTypeOfExpr` | `typeof x` | `x` 的类型（非字符串） |
| `ArkInstanceOfExpr` | `x instanceof T` | `BooleanType` |

### 5.5 特殊表达式

#### ArkPhiExpr - SSA Phi 函数

```typescript
export class ArkPhiExpr extends AbstractExpr {
    private args: Local[];
    private argToBlock: Map<Local, BasicBlock>;
}
```

`toString()` 形如 `phi(arg0, arg1, ...)`，用于 SSA 形式中合并来自不同前驱块的同名变量。配合 [Def-Use Chain](../analysis/Def-Use%20Chain.md) 使用。

#### ArkAwaitExpr / ArkYieldExpr

```typescript
%1 = await %0
%2 = yield %0
```

`ArkAwaitExpr.getType()` 自动剥离 `Promise<T>` 的泛型；`ArkYieldExpr.getType()` 直接取 yield 表达式自身类型。

#### ArkDeleteExpr - 删除属性

```typescript
delete a.b;        // 源码
```

```typescript
%0 = delete a.<@example.ts: A.b>
```

`getType()` 恒为 `BooleanType`。

#### AliasTypeExpr - 类型别名右值

`type T = U` 这类语句会被翻译为 [`ArkAliasTypeDefineStmt`](./Stmt.md#27-arkaliastypedefinestmt---类型别名定义)，其右值即 `AliasTypeExpr`。原始对象 `originalObject` 可以是 `Type` / `ImportInfo` / `Local` / `ArkClass` / `ArkMethod` / `ArkField` 之一；当 `transferWithTypeOf = true` 时表示 `type T = typeof x` 形式。

## 6. 与 Stmt 的关系

`Local`、`Constant`、`Ref`、`Expr` 是构建 `Stmt` 的"砖块"：

- `ArkAssignStmt(leftOp, rightOp)` 中：`leftOp` 是 `Local` / `ArkArrayRef` / `ArkInstanceFieldRef` / `ArkStaticFieldRef` 之一；`rightOp` 可以是任意 `Value`。
- `ArkInvokeStmt` 持有一个 `AbstractInvokeExpr`。
- `ArkIfStmt` 的条件项是 `ArkConditionExpr`。
- `ArkReturnStmt` / `ArkThrowStmt` 的操作数是 `Value`。

各 Stmt 类型与其携带 Value 的对应关系见 [Stmt - 与 IR 基础元素的关系](./Stmt.md#3-stmt-和各-ir-基础元素的关系)。
