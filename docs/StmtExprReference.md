# ArkAnalyzer Stmt 和 Expr 完整参考文档

本文档详细说明ArkAnalyzer IR中所有语句（Stmt）和表达式（Expr）类型，包括对应的ArkTS语法和IR表示形式。

## 目录

- [语句（Statements）](#语句statements)
  - [ArkAssignStmt - 赋值语句](#arkassignstmt---赋值语句)
  - [ArkInvokeStmt - 方法调用语句](#arkinvokestmt---方法调用语句)
  - [ArkIfStmt - 条件分支语句](#arkifstmt---条件分支语句)
  - [ArkReturnStmt - 返回值语句](#arkreturnstmt---返回值语句)
  - [ArkReturnVoidStmt - 无返回值语句](#arkreturnvoidstmt---无返回值语句)
  - [ArkThrowStmt - 抛出异常语句](#arkthrowstmt---抛出异常语句)
  - [ArkAliasTypeDefineStmt - 类型别名定义语句](#arkaliastypedefinestmt---类型别名定义语句)

- [表达式（Expressions）](#表达式expressions)
  - [调用表达式](#调用表达式)
    - [ArkInstanceInvokeExpr - 实例方法调用](#arkinstanceinvokeexpr---实例方法调用)
    - [ArkStaticInvokeExpr - 静态方法调用](#arkstaticinvokeexpr---静态方法调用)
    - [ArkPtrInvokeExpr - 函数指针调用](#arkptrinvokeexpr---函数指针调用)
  - [对象创建表达式](#对象创建表达式)
    - [ArkNewExpr - 对象创建](#arknewexpr---对象创建)
    - [ArkNewArrayExpr - 数组创建](#arknewarrayexpr---数组创建)
  - [运算表达式](#运算表达式)
    - [ArkNormalBinopExpr - 普通二元运算](#arknormalbinopexpr---普通二元运算)
    - [ArkConditionExpr - 条件表达式](#arkconditionexpr---条件表达式)
    - [ArkUnopExpr - 一元运算](#arkunopexpr---一元运算)
  - [类型相关表达式](#类型相关表达式)
    - [ArkCastExpr - 类型转换](#arkcastexpr---类型转换)
    - [ArkTypeOfExpr - typeof表达式](#arktypeofexpr---typeof表达式)
    - [ArkInstanceOfExpr - instanceof表达式](#arkinstanceofexpr---instanceof表达式)
  - [特殊表达式](#特殊表达式)
    - [ArkPhiExpr - Phi函数（SSA）](#arkphiexpr---phi函数ssa)
    - [ArkAwaitExpr - 异步等待](#arkawaitexpr---异步等待)
    - [ArkYieldExpr - 生成器](#arkyieldexpr---生成器)
    - [ArkDeleteExpr - 删除属性](#arkdeleteexpr---删除属性)
    - [AliasTypeExpr - 类型别名表达式](#aliastypeexpr---类型别名表达式)

---

## 语句（Statements）

### ArkAssignStmt - 赋值语句

**ArkTS语法**:
```typescript
// 变量赋值
let x = value;
x = value;

// 字段赋值
obj.field = value;
Class.staticField = value;

// 数组元素赋值
arr[index] = value;
```

**IR表示**:
```typescript
// 简单赋值
x = value

// 字段赋值
obj.<@Project/File: Class.field> = value

// 数组赋值
arr[index] = value

// 复杂表达式会被分解为多个赋值
// 源代码: let x = a + b * c;
// IR:
//   $temp0 = b * c
//   $temp1 = a + $temp0
//   x = $temp1
```

**类定义**:
```typescript
class ArkAssignStmt extends Stmt {
    private leftOp: Value;   // 左操作数（被赋值的值）
    private rightOp: Value;  // 右操作数（赋值的值）
}
```

**关键方法**:
- `getLeftOp(): Value` - 获取左操作数（定义的值）
- `getRightOp(): Value` - 获取右操作数
- `getDef(): Value` - 返回左操作数（定义的值）
- `getUses(): Value[]` - 返回右操作数及其使用的所有值

**示例**:
```typescript
// 源代码
let result = obj.method(arg1, arg2);

// IR转换
$temp0 = instanceinvoke obj.<@Project/File: Class.method(Param1, Param2)>(arg1, arg2)
result = $temp0
```

---

### ArkInvokeStmt - 方法调用语句

**ArkTS语法**:
```typescript
// 实例方法调用
obj.method(arg1, arg2);

// 静态方法调用
Class.staticMethod(arg1);

// 函数调用
func(arg1, arg2);
```

**IR表示**:
```typescript
// 实例方法调用
instanceinvoke obj.<@Project/File: Class.method(Param1, Param2)>(arg1, arg2)

// 静态方法调用
staticinvoke <@Project/File: Class.staticMethod(Param1)>(arg1)

// 函数指针调用
ptrinvoke <@Project/File: Class.method(Param1)>(funcPtr, arg1)
```

**类定义**:
```typescript
class ArkInvokeStmt extends Stmt {
    private invokeExpr: AbstractInvokeExpr;  // 调用表达式
}
```

**关键方法**:
- `getInvokeExpr(): AbstractInvokeExpr` - 获取调用表达式
- `getUses(): Value[]` - 返回调用表达式使用的所有值

**说明**:
- 调用语句不定义值，只执行副作用
- 如果调用有返回值但未使用，使用此语句类型
- 如果调用返回值被使用，使用 `ArkAssignStmt` 配合调用表达式

---

### ArkIfStmt - 条件分支语句

**ArkTS语法**:
```typescript
if (condition) {
    // true分支
} else {
    // false分支
}

if (x > 0 && y < 10) {
    // ...
}
```

**IR表示**:
```typescript
// 简单条件
if x > 0 goto BB1 else goto BB2

// 复杂条件会被分解
// 源代码: if (x > 0 && y < 10)
// IR:
//   $temp0 = x > 0
//   if $temp0 goto BB1 else goto BB3
// BB1:
//   $temp1 = y < 10
//   if $temp1 goto BB2 else goto BB3
```

**类定义**:
```typescript
class ArkIfStmt extends Stmt {
    private conditionExpr: ArkConditionExpr;  // 条件表达式
}
```

**关键方法**:
- `getConditionExpr(): ArkConditionExpr` - 获取条件表达式
- `isBranch(): boolean` - 返回true（是分支语句）
- `getExpectedSuccessorCount(): number` - 返回2（两个后继基本块）

**CFG结构**:
```
BB0: if condition goto BB1 else goto BB2
BB1: (true分支代码)
     goto BB3
BB2: (false分支代码)
     goto BB3
BB3: (后续代码)
```

---

### ArkReturnStmt - 返回值语句

**ArkTS语法**:
```typescript
function foo(): number {
    return 42;
}

function bar(): string {
    return "hello";
}
```

**IR表示**:
```typescript
// 返回值
return 42

// 复杂返回值会被分解
// 源代码: return a + b;
// IR:
//   $temp0 = a + b
//   return $temp0
```

**类定义**:
```typescript
class ArkReturnStmt extends Stmt {
    private op: Value;  // 返回值
}
```

**关键方法**:
- `getOp(): Value` - 获取返回值
- `getExpectedSuccessorCount(): number` - 返回0（方法结束）

**说明**:
- 返回值语句是基本块的结束语句
- 方法可以有多个返回语句（不同基本块）

---

### ArkReturnVoidStmt - 无返回值语句

**ArkTS语法**:
```typescript
function foo(): void {
    return;
}

function bar(): void {
    // 隐式返回
}
```

**IR表示**:
```typescript
return
```

**类定义**:
```typescript
class ArkReturnVoidStmt extends Stmt {
    // 无属性
}
```

**关键方法**:
- `getExpectedSuccessorCount(): number` - 返回0（方法结束）

**说明**:
- 用于void方法的显式返回
- 方法结束时的隐式返回也会生成此语句

---

### ArkThrowStmt - 抛出异常语句

**ArkTS语法**:
```typescript
throw new Error("message");

throw exception;
```

**IR表示**:
```typescript
// 抛出异常对象
throw new @Project/File: Error

// 抛出变量
throw exception
```

**类定义**:
```typescript
class ArkThrowStmt extends Stmt {
    private op: Value;  // 异常对象
}
```

**关键方法**:
- `getOp(): Value` - 获取异常对象
- `getUses(): Value[]` - 返回异常对象及其使用的值

**说明**:
- 抛出语句会创建异常控制流边
- 异常会被最近的catch块捕获

---

### ArkAliasTypeDefineStmt - 类型别名定义语句

**ArkTS语法**:
```typescript
// 简单类型别名
type MyString = string;

// 泛型类型别名
type MyArray<T> = T[];

// 使用typeof
let x = 42;
type XType = typeof x;

// 使用import
type ImportType = import('./module').Type;
```

**IR表示**:
```typescript
// 简单类型别名
type @Project/File: MyString = string

// 泛型类型别名
type @Project/File: MyArray<T> = T[]

// typeof类型别名
type @Project/File: XType = typeof x

// import类型别名
type @Project/File: ImportType = typeof import('./module').Type
```

**类定义**:
```typescript
class ArkAliasTypeDefineStmt extends Stmt {
    private aliasType: AliasType;           // 类型别名
    private aliasTypeExpr: AliasTypeExpr;  // 类型别名表达式
}
```

**关键方法**:
- `getAliasType(): AliasType` - 获取类型别名
- `getAliasTypeExpr(): AliasTypeExpr` - 获取类型别名表达式
- `getAliasName(): string` - 获取类型别名名称

**说明**:
- 类型别名定义不参与数据流分析
- 主要用于类型系统，不影响运行时行为

---

## 表达式（Expressions）

### 调用表达式

#### ArkInstanceInvokeExpr - 实例方法调用

**ArkTS语法**:
```typescript
// 实例方法调用
obj.method(arg1, arg2);

// 链式调用
obj.method1().method2();

// 带泛型的方法调用
obj.method<Type1, Type2>(arg);
```

**IR表示**:
```typescript
// 基本调用
instanceinvoke obj.<@Project/File: Class.method(Param1, Param2)>(arg1, arg2)

// 带泛型参数
instanceinvoke obj.<@Project/File: Class.method<Type1, Type2>(Param1)>(arg1)

// 展开参数
instanceinvoke obj.<@Project/File: Class.method(Param1)>(...args)
```

**类定义**:
```typescript
class ArkInstanceInvokeExpr extends AbstractInvokeExpr {
    private base: Local;  // 调用对象（实例）
}
```

**关键方法**:
- `getBase(): Local` - 获取调用对象
- `getMethodSignature(): MethodSignature` - 获取方法签名
- `getArgs(): Value[]` - 获取参数列表
- `getUses(): Value[]` - 返回base、args及其使用的所有值

**示例**:
```typescript
// 源代码
let result = obj.calculate(x, y);

// IR
$temp0 = instanceinvoke obj.<@Project/File: Calculator.calculate(Number, Number)>(x, y)
result = $temp0
```

---

#### ArkStaticInvokeExpr - 静态方法调用

**ArkTS语法**:
```typescript
// 静态方法调用
Class.staticMethod(arg1, arg2);

// 命名空间中的静态方法
Namespace.Class.method(arg);
```

**IR表示**:
```typescript
// 静态方法调用
staticinvoke <@Project/File: Class.staticMethod(Param1, Param2)>(arg1, arg2)

// 带泛型参数
staticinvoke <@Project/File: Class.method<Type1>(Param1)>(arg1)
```

**类定义**:
```typescript
class ArkStaticInvokeExpr extends AbstractInvokeExpr {
    // 无base，因为是静态调用
}
```

**关键方法**:
- `getMethodSignature(): MethodSignature` - 获取方法签名
- `getArgs(): Value[]` - 获取参数列表
- `getUses(): Value[]` - 返回args及其使用的所有值

**示例**:
```typescript
// 源代码
let result = Math.max(a, b);

// IR
$temp0 = staticinvoke <@builtin: Math.max(Number, Number)>(a, b)
result = $temp0
```

---

#### ArkPtrInvokeExpr - 函数指针调用

**ArkTS语法**:
```typescript
// 函数变量调用
let func: () => void = someFunction;
func();

// 字段中的函数调用
obj.callback();

// 数组中的函数调用
callbacks[0]();
```

**IR表示**:
```typescript
// 局部变量函数指针
ptrinvoke <@Project/File: Class.method(Param1)>(func, arg1)

// 字段函数指针
ptrinvoke <@Project/File: Class.method(Param1)>(obj.callback, arg1)

// 数组函数指针
ptrinvoke <@Project/File: Class.method(Param1)>(callbacks[0], arg1)
```

**类定义**:
```typescript
class ArkPtrInvokeExpr extends AbstractInvokeExpr {
    private funPtr: Local | AbstractFieldRef;  // 函数指针
}
```

**关键方法**:
- `getFuncPtrLocal(): Local | AbstractFieldRef` - 获取函数指针
- `getMethodSignature(): MethodSignature` - 获取方法签名（从函数类型推断）

**说明**:
- 函数指针的类型在运行时确定
- 需要类型推断来确定实际调用的方法签名

---

### 对象创建表达式

#### ArkNewExpr - 对象创建

**ArkTS语法**:
```typescript
// 对象创建
let obj = new MyClass();

// 带参数的对象创建
let obj = new MyClass(arg1, arg2);

// 泛型类创建
let obj = new MyClass<Type1, Type2>();
```

**IR表示**:
```typescript
// 基本对象创建
new @Project/File: MyClass

// 带泛型参数
new @Project/File: MyClass<Type1, Type2>
```

**类定义**:
```typescript
class ArkNewExpr extends AbstractExpr {
    private classType: ClassType;  // 类类型
}
```

**关键方法**:
- `getClassType(): ClassType` - 获取类类型
- `getType(): Type` - 返回类类型
- `getUses(): Value[]` - 返回空数组（不依赖其他值）

**说明**:
- 构造函数调用在IR中不显式表示
- 构造函数体在类初始化时执行

---

#### ArkNewArrayExpr - 数组创建

**ArkTS语法**:
```typescript
// 数组创建
let arr = new Array<number>(10);

// 数组字面量
let arr = [1, 2, 3];

// 多维数组
let matrix = new Array<number[]>(5);
```

**IR表示**:
```typescript
// 指定大小的数组
newarray (number)[10]

// 从字面量创建（fromLiteral=true）
newarray (number)[3]  // 字面量 [1, 2, 3]

// 多维数组
newarray (number[])[5]
```

**类定义**:
```typescript
class ArkNewArrayExpr extends AbstractExpr {
    private baseType: Type;    // 数组元素类型
    private size: Value;        // 数组大小
    private fromLiteral: boolean;  // 是否来自字面量
}
```

**关键方法**:
- `getBaseType(): Type` - 获取数组元素类型
- `getSize(): Value` - 获取数组大小
- `isFromLiteral(): boolean` - 是否来自字面量
- `getType(): ArrayType` - 返回数组类型

**示例**:
```typescript
// 源代码
let arr = new Array<number>(10);

// IR
$temp0 = newarray (number)[10]
arr = $temp0
```

---

### 运算表达式

#### ArkNormalBinopExpr - 普通二元运算

**ArkTS语法**:
```typescript
// 算术运算
let sum = a + b;
let diff = a - b;
let prod = a * b;
let quot = a / b;
let mod = a % b;
let pow = a ** b;

// 位运算
let and = a & b;
let or = a | b;
let xor = a ^ b;
let leftShift = a << b;
let rightShift = a >> b;
let unsignedRightShift = a >>> b;

// 逻辑运算
let and = a && b;
let or = a || b;
let nullish = a ?? b;
```

**IR表示**:
```typescript
// 算术运算
a + b
a - b
a * b
a / b
a % b
a ** b

// 位运算
a & b
a | b
a ^ b
a << b
a >> b
a >>> b

// 逻辑运算
a && b
a || b
a ?? b
```

**类定义**:
```typescript
class ArkNormalBinopExpr extends AbstractBinopExpr {
    // 继承自AbstractBinopExpr
    // protected op1: Value
    // protected op2: Value
    // protected operator: NormalBinaryOperator
}
```

**支持的运算符**:
```typescript
enum NormalBinaryOperator {
    // 算术
    Exponentiation = '**',
    Division = '/',
    Addition = '+',
    Subtraction = '-',
    Multiplication = '*',
    Remainder = '%',
    
    // 位移
    LeftShift = '<<',
    RightShift = '>>',
    UnsignedRightShift = '>>>',
    
    // 位运算
    BitwiseAnd = '&',
    BitwiseOr = '|',
    BitwiseXor = '^',
    
    // 逻辑
    LogicalAnd = '&&',
    LogicalOr = '||',
    NullishCoalescing = '??',
}
```

**类型推断规则**:
- `+`: 如果任一操作数是字符串，结果为字符串；否则为数字或BigInt
- `-`, `*`, `/`, `%`, `**`: 数字或BigInt
- `&&`, `||`: 返回操作数的类型（短路求值）
- `??`: 返回非null/undefined的操作数类型

---

#### ArkConditionExpr - 条件表达式

**ArkTS语法**:
```typescript
// 比较运算
if (a < b) { }
if (a <= b) { }
if (a > b) { }
if (a >= b) { }
if (a == b) { }
if (a != b) { }
if (a === b) { }
if (a !== b) { }

// in运算符
if ('key' in obj) { }
```

**IR表示**:
```typescript
// 比较运算
a < b
a <= b
a > b
a >= b
a == b
a != b
a === b
a !== b

// in运算符
'key' in obj
```

**类定义**:
```typescript
class ArkConditionExpr extends AbstractBinopExpr {
    // 继承自AbstractBinopExpr
    // operator: RelationalBinaryOperator
}
```

**支持的运算符**:
```typescript
enum RelationalBinaryOperator {
    LessThan = '<',
    LessThanOrEqual = '<=',
    GreaterThan = '>',
    GreaterThanOrEqual = '>=',
    Equality = '==',
    InEquality = '!=',
    StrictEquality = '===',
    StrictInequality = '!==',
    isPropertyOf = 'in',
}
```

**类型**:
- 所有条件表达式返回 `BooleanType`

**特殊处理**:
- `x != 0` 会根据x的类型转换为相应的比较（字符串、布尔、对象等）

---

#### ArkUnopExpr - 一元运算

**ArkTS语法**:
```typescript
// 负号
let neg = -x;

// 按位取反
let not = ~x;

// 逻辑非
let not = !x;
```

**IR表示**:
```typescript
-x
~x
!x
```

**类定义**:
```typescript
class ArkUnopExpr extends AbstractExpr {
    private op: Value;
    private operator: UnaryOperator;
}
```

**支持的运算符**:
```typescript
enum UnaryOperator {
    Neg = '-',           // 负号
    BitwiseNot = '~',    // 按位取反
    LogicalNot = '!',  // 逻辑非
}
```

**类型**:
- `-`: 返回操作数的类型（Number或BigInt）
- `~`: 返回操作数的类型（Number或BigInt）
- `!`: 返回 `BooleanType`

---

### 类型相关表达式

#### ArkCastExpr - 类型转换

**ArkTS语法**:
```typescript
// 类型断言
let x = <string>value;
let x = value as string;

// 类型转换（运行时）
let num = Number(str);
let str = String(num);
```

**IR表示**:
```typescript
// 类型断言
<string>value

// 类型转换
<number>str
```

**类定义**:
```typescript
class ArkCastExpr extends AbstractExpr {
    private op: Value;
    private type: Type;  // 目标类型
}
```

**关键方法**:
- `getOp(): Value` - 获取被转换的值
- `getType(): Type` - 获取目标类型

**说明**:
- 类型断言不改变运行时值，只影响类型系统
- 类型转换可能涉及运行时操作

---

#### ArkTypeOfExpr - typeof表达式

**ArkTS语法**:
```typescript
let typeStr = typeof value;
```

**IR表示**:
```typescript
typeof value
```

**类定义**:
```typescript
class ArkTypeOfExpr extends AbstractExpr {
    private op: Value;
}
```

**类型**:
- 返回 `StringType`（typeof的返回值是字符串）

**说明**:
- typeof是运行时操作，返回类型名称字符串
- 在IR中保留为表达式，类型推断时处理

---

#### ArkInstanceOfExpr - instanceof表达式

**ArkTS语法**:
```typescript
if (obj instanceof MyClass) {
    // ...
}

if (arr instanceof Array) {
    // ...
}
```

**IR表示**:
```typescript
obj instanceof @Project/File: MyClass
arr instanceof Array
```

**类定义**:
```typescript
class ArkInstanceOfExpr extends AbstractExpr {
    private op: Value;
    private checkType: Type;  // 检查的类型
}
```

**关键方法**:
- `getOp(): Value` - 获取被检查的值
- `getCheckType(): Type` - 获取检查的类型

**类型**:
- 返回 `BooleanType`

**说明**:
- instanceof是运行时类型检查
- 在IR中保留，用于类型细化（type narrowing）

---

### 特殊表达式

#### ArkPhiExpr - Phi函数（SSA）

**ArkTS语法**:
```typescript
// Phi函数不是ArkTS语法，而是SSA转换的结果
// 对应多个控制流路径汇合时的值合并

// 源代码示例
let x;
if (condition) {
    x = 1;
} else {
    x = 2;
}
// 在SSA形式中，x在汇合点需要Phi函数
```

**IR表示**:
```typescript
// SSA形式
// BB1: x1 = 1
// BB2: x2 = 2
// BB3: x3 = phi(BB1: x1, BB2: x2)
phi(x1, x2)
```

**类定义**:
```typescript
class ArkPhiExpr extends AbstractExpr {
    private args: Local[];  // Phi的参数（来自不同基本块的值）
    private argToBlock: Map<Local, BasicBlock>;  // 参数到基本块的映射
}
```

**关键方法**:
- `getArgs(): Local[]` - 获取Phi的参数
- `getArgToBlock(): Map<Local, BasicBlock>` - 获取参数到基本块的映射

**说明**:
- Phi函数只在SSA转换后出现
- 用于在控制流汇合点合并来自不同路径的值
- 每个参数对应一个前驱基本块

---

#### ArkAwaitExpr - 异步等待

**ArkTS语法**:
```typescript
async function fetchData() {
    let result = await promise;
    return result;
}
```

**IR表示**:
```typescript
await promise
```

**类定义**:
```typescript
class ArkAwaitExpr extends AbstractExpr {
    private promise: Value;  // Promise对象
}
```

**关键方法**:
- `getPromise(): Value` - 获取Promise对象
- `getType(): Type` - 返回Promise的泛型参数类型

**类型推断**:
- 如果promise类型是 `Promise<T>`，返回类型是 `T`
- 如果promise类型是泛型类，从泛型参数推断

---

#### ArkYieldExpr - 生成器

**ArkTS语法**:
```typescript
function* generator() {
    yield 1;
    yield 2;
    return 3;
}
```

**IR表示**:
```typescript
yield value
```

**类定义**:
```typescript
class ArkYieldExpr extends AbstractExpr {
    private yieldValue: Value;  // 生成的值
}
```

**关键方法**:
- `getYieldValue(): Value` - 获取生成的值
- `getType(): Type` - 返回生成值的类型

**说明**:
- 用于生成器函数
- 生成器函数返回迭代器对象

---

#### ArkDeleteExpr - 删除属性

**ArkTS语法**:
```typescript
delete obj.property;
```

**IR表示**:
```typescript
delete obj.<@Project/File: Class.property>
```

**类定义**:
```typescript
class ArkDeleteExpr extends AbstractExpr {
    private field: AbstractFieldRef;  // 要删除的字段
}
```

**关键方法**:
- `getField(): AbstractFieldRef` - 获取要删除的字段
- `getType(): Type` - 返回 `BooleanType`（delete操作返回布尔值）

**说明**:
- delete操作返回布尔值（成功/失败）
- 在严格模式下，delete不可配置的属性会报错

---

#### AliasTypeExpr - 类型别名表达式

**ArkTS语法**:
```typescript
// 类型别名定义的右侧表达式
type MyType = string;
type MyType = typeof value;
type MyType = import('./module').Type;
type MyType = Class;
```

**IR表示**:
```typescript
// 简单类型
string

// typeof
typeof value

// import
typeof import('./module').Type

// 类类型
@Project/File: Class
```

**类定义**:
```typescript
class AliasTypeExpr extends AbstractExpr {
    private originalObject: AliasTypeOriginalModel;  // 原始对象（Type、ImportInfo、Local等）
    private transferWithTypeOf: boolean;  // 是否使用typeof
    private realGenericTypes?: Type[];  // 实际泛型参数
}
```

**关键方法**:
- `getOriginalObject(): AliasTypeOriginalModel` - 获取原始对象
- `getTransferWithTypeOf(): boolean` - 是否使用typeof
- `getRealGenericTypes(): Type[]` - 获取实际泛型参数

**说明**:
- 仅用于类型系统，不参与数据流
- `getUses()` 返回空数组
- 用于类型别名定义语句的右侧

---

## 表达式和语句的对应关系

### 表达式在语句中的使用

| 表达式类型 | 可用的语句类型 | 说明 |
|-----------|--------------|------|
| `AbstractInvokeExpr` | `ArkInvokeStmt`, `ArkAssignStmt` | 调用表达式可以作为独立语句或赋值右侧 |
| `ArkNewExpr` | `ArkAssignStmt` | 对象创建通常用于赋值 |
| `ArkNewArrayExpr` | `ArkAssignStmt` | 数组创建通常用于赋值 |
| `ArkConditionExpr` | `ArkIfStmt` | 条件表达式用于if语句 |
| `ArkNormalBinopExpr` | `ArkAssignStmt` | 二元运算用于赋值右侧 |
| `ArkUnopExpr` | `ArkAssignStmt` | 一元运算用于赋值右侧 |
| `ArkCastExpr` | `ArkAssignStmt` | 类型转换用于赋值 |
| `ArkAwaitExpr` | `ArkAssignStmt` | await用于异步函数中的赋值 |
| `ArkYieldExpr` | `ArkReturnStmt` | yield用于生成器函数的返回 |
| `ArkPhiExpr` | `ArkAssignStmt` | Phi函数用于SSA形式的赋值 |

### 语句到表达式的转换规则

1. **赋值语句**: `left = right`
   - `left`: 可以是 `Local`, `AbstractFieldRef`, `ArkArrayRef`
   - `right`: 可以是任何表达式

2. **调用语句**: `invokeExpr`
   - 调用表达式直接作为语句（不捕获返回值）

3. **条件语句**: `if conditionExpr`
   - 条件表达式必须是 `ArkConditionExpr`

4. **返回语句**: `return value`
   - 返回值可以是任何表达式

---

## 总结

本文档详细说明了ArkAnalyzer IR中所有语句和表达式类型：

- **7种语句类型**: 赋值、调用、条件、返回（两种）、抛出、类型别名定义
- **15+种表达式类型**: 调用（3种）、创建（2种）、运算（3种）、类型相关（3种）、特殊（4种）

每种类型都包含：
- ArkTS源代码示例
- IR表示形式
- 类定义和关键方法
- 使用说明和注意事项

这些信息对于理解ArkAnalyzer的IR结构、进行静态分析和开发分析工具都非常重要。

