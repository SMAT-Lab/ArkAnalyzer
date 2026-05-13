# ArkMethod

## 1. 概述

**`ArkMethod`** 是 ArkAnalyzer 中"方法/函数"的统一抽象，代表一切可被调用的代码单元——包括类成员方法、构造器、独立函数、箭头函数、嵌套函数、setter/getter，以及由 IR 转换器隐式生成的初始化方法（`%instInit`、`%statInit`）和容纳顶层语句的"默认方法"（`%dflt`）。

`ArkMethod` 同时承担三件事：

1. **签名管理** —— 通过 [`MethodSignature`](#5-主要接口) 全局唯一标识；TS 重载的多个 declare 签名与一个 implementation 签名分别维护。
2. **方法体托管** —— 持有一个可选的 [`ArkBody`](./ArkBody.md)，里面装着 [CFG](./CFG.md) 与所有 ArkIR Stmt。`abstract`、`declare`、接口签名等无实现的方法 `getBody()` 返回 `undefined`。
3. **元数据** —— 修饰符（继承自 [`ArkBaseModel`](../../src/core/model/ArkBaseModel.ts)）、泛型、源码位置、`isGenerated`、外层方法（嵌套函数用）、ViewTree（ArkUI 组件方法用）等。

## 2. 方法类型

### 2.1 普通方法

```typescript
// 源码 — 摘自 tests/resources/save/basic.ts
class Person {
    age: number;
    growOld(): void {
        this.age = this.age + 1;
    }
}
```

```typescript
// ArkIR
class Person {
  Methods:
    growOld(): void {
      label0:
        this = this: @save/basic.ts: Person
        %0 = this.<@save/basic.ts: Person.age>
        %0 = %0 + 1
        this.<@save/basic.ts: Person.age> = %0
        return
    }
}
```

### 2.2 默认方法 `%dflt`

每个 `ArkClass` 隐式拥有一个名为 `%dflt`（即 `DEFAULT_ARK_METHOD_NAME`，`%` 前缀 + `dflt`）的"默认方法"，承载该类作用域的顶层语句——对应每个 `ArkFile` 的 **默认类的默认方法** 即整文件的"主体"。

```typescript
// 源码（顶层语句）
let x = 1;
console.log(x);
```

```typescript
// ArkIR — 顶层语句被装入 @F: %dflt.%dflt()
%dflt(): void {
  label0:
    this = this: @F: %dflt
    x = 1
    instanceinvoke console.<@%unk/%unk: .log()>(x)
    return
}
```

### 2.3 构造器 `constructor`

```typescript
// 源码
class Person {
    age: number;
    constructor(age: number) { this.age = age; }
}
```

```typescript
// ArkIR — constructor 由实例字段写入 + 显式构造器体组成
constructor(age: number): Person {
  label0:
    this = this: @F: Person
    age = parameter0: number
    instanceinvoke this.<@F: Person.%instInit()>()    // 自动调用 %instInit
    this.<@F: Person.age> = age
    return
}
```

> 任何构造器开头都会自动注入对 `%instInit()` 的调用，把字段默认值与参数属性赋值集中处理。

### 2.4 实例初始化方法 `%instInit`

ArkIR 自动生成的方法，把所有实例字段的默认值表达式集中到此处执行。

```typescript
// 源码
class Person {
    age: number = 18;
    growOld = () => {};
}
```

```typescript
// ArkIR
%instInit(): void {
  label0:
    this = this: @F: Person
    this.<@F: Person.age> = 18
    this.<@F: Person.growOld> = %AM0$%instInit         // 箭头函数被抽成匿名方法
    return
}
```

### 2.5 静态初始化方法 `%statInit`

与 `%instInit` 对称，处理静态字段初始化与 `enum` 成员赋值。

```typescript
// 源码
enum E { A = 1, B = 2 }
```

```typescript
// ArkIR
%statInit(): void {
  label0:
    <@F: E.[static]A> = 1
    <@F: E.[static]B> = 2
    return
}
```

### 2.6 匿名方法 `%AM<idx>$<outer>`

箭头函数、函数表达式、回调等没有名字的可调用单元，统一以 `%AM` 前缀（`ANONYMOUS_METHOD_PREFIX`）+ 序号 + `$<外层方法名>` 命名。

```typescript
// 源码
function f() {
    let g = (x: number) => x + 1;
    return g(2);
}
```

```typescript
// ArkIR
f(): number {
  label0:
    this = this: @F: %dflt
    g = %AM0$f                                          // 匿名方法的引用（FunctionType）
    %0 = ptrinvoke <@F: %dflt.%AM0$f(number)>(g, 2)
    return %0
}

%AM0$f(x: number): number {
  label0:
    x = parameter0: number
    %0 = x + 1
    return %0
}
```

### 2.7 嵌套方法

嵌套函数是顶层语句中产生的普通命名方法，但其 `outerMethod` 指向外层 `ArkMethod`，便于做闭包变量分析。

```typescript
// 源码
function outer() {
    let z = 10;
    function inner() { return z; }
    return inner();
}
```

```typescript
// ArkIR — outer / inner 是两个独立 ArkMethod；inner.getOuterMethod() === outer
outer(): number {
  label0:
    z = 10
    %0 = staticinvoke <@F: %dflt.inner()>()
    return %0
}

inner(): number {
  label0:
    %0 = closurefieldref this.<z: number>              // 通过闭包字段访问外层 z
    return %0
}
```

> 闭包变量在 IR 中通过 [`ClosureFieldRef`](./IRBasics.md#48-closurefieldref-闭包字段引用) 间接访问；详见 IRBasics §4.8。

## 3. 核心数据结构

```typescript
// src/core/model/ArkMethod.ts
export class ArkMethod extends ArkBaseModel implements ArkExport {
    private code?: string;
    private declaringArkClass!: ArkClass;
    private outerMethod?: ArkMethod;                    // 嵌套方法定位外层
    private genericTypes?: GenericType[];

    private declareSignatures?: MethodSignature[];      // 重载的 declare 签名（多个）
    private declareOriginFullPositions?: FullPosition[];// declare 签名的完整位置（起始/结束行列）

    private implSignature?: MethodSignature;            // implementation 签名（唯一）
    private implOriginFullPosition?: FullPosition;      // implementation 的完整位置（起始/结束行列）

    private body?: ArkBody;                             // 方法体
    private viewTree?: ViewTree;                        // ArkUI 组件方法的视图树

    private bodyBuilder?: BodyBuilder;
    private CxxBodyBuilder?: CxxBodyBuilder;            // C/C++ 专用
}
```

| 字段                        | 说明                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `declaringArkClass`       | 反向定位所属类。任何方法都属于一个类——独立函数挂在 `ArkFile` 的 `%dflt` 默认类上                                    |
| `outerMethod`             | 嵌套函数 / 匿名函数的外层方法；用于跨层闭包变量分析                                                            |
| `methodDeclareSignatures` | TS 重载的 declare 签名列表（如多签名 + 1 实现的形式）                                                    |
| `methodSignature`         | 真正实现的签名；与所有 declare 签名不冲突。**至少有一个**：纯 declare/接口方法只有 declare 签名，独立函数等只有 implementation |
| `body`                    | 方法体；为空表示抽象/declare/接口方法                                                                |
| `viewTree`                | ArkUI `build()` / `@Builder` 等方法构建得到的 [ViewTree](../analysis/ViewTree.md)              |
| `bodyBuilder`             | 延迟构建 `ArkBody` 的器件；构建完成后会被释放                                                           |
| `isGeneratedFlag`         | `%instInit` / `%statInit` / 默认导出的合成桥接方法等设置为 true                                       |
| `asteriskToken`           | `function* gen() {}` 的标记                                                               |
| `questionToken`           | `interface I { foo?(): void }` 的可选标记                                                   |

`MethodSignature`（[src/core/model/ArkSignature.ts](../../src/core/model/ArkSignature.ts)）包含两层：

- **`ClassSignature`** —— 标识所属类（含 `FileSignature` + `NamespaceSignature` + 类名）。
- **`MethodSubSignature`** —— `methodName` + `parameters` + `returnType` + `staticFlag`。

`toString()` 形如 `<@Pkg/File: ClassName.methodName(P1, P2)>`，与 IR 中调用语句里的方法引用文本一致。

特殊方法名常量（来自 [src/core/common/Const.ts](../../src/core/common/Const.ts) 与 `TSConst.ts`）：

| 常量                          | 值             | 含义                         |
| --------------------------- | ------------- | -------------------------- |
| `DEFAULT_ARK_METHOD_NAME`   | `%dflt`       | 默认方法名（每个类都有一个，承载顶层/类作用域语句） |
| `INSTANCE_INIT_METHOD_NAME` | `%instInit`   | 实例初始化方法                    |
| `STATIC_INIT_METHOD_NAME`   | `%statInit`   | 静态初始化 / 枚举初始化方法            |
| `ANONYMOUS_METHOD_PREFIX`   | `%AM`         | 匿名方法名前缀，后跟序号 + `$外层`       |
| `CONSTRUCTOR_NAME`          | `constructor` | TS 构造器名                    |

## 4. 主要接口

### 标识与签名

| 方法                                                                                             | 说明                                          |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `getName(): string`                                                                            | 实现签名的方法名（无实现时为第一个 declare 签名的名字）            |
| `getSignature(): MethodSignature`                                                              | 实现签名；若无实现则回退到第一个 declare 签名                 |
| `getImplementationSignature(): MethodSignature \| null`                                        | 仅 implementation 签名                         |
| `getDeclareSignatures(): MethodSignature[] \| null`                                            | 所有 declare 签名（重载）                           |
| `getDeclareSignatureIndex(target): number`                                                     | 按签名查询其 declare 索引                           |
| `setImplementationSignature(s) / setDeclareSignatures(s) / setDeclareSignatureWithIndex(s, i)` | 写入对应签名                                      |
| `getSubSignature(): MethodSubSignature`                                                        | 等价 `getSignature().getMethodSubSignature()` |
| `getParameters(): MethodParameter[]`                                                           | 形参表                                         |
| `getReturnType(): Type`                                                                        | 返回类型                                        |
| `matchMethodSignature(args): MethodSignature`                                                  | 按实参列表挑选最匹配的重载签名                             |

### 方法体与 IR

| 方法                                                                     | 说明                                                   |
| ---------------------------------------------------------------------- | ---------------------------------------------------- |
| `getBody(): ArkBody \| undefined`                                      | 方法体（含 CFG / locals / traps / aliases）                |
| `setBody(body)`                                                        | 写入方法体（IR 转换器使用）                                      |
| `getCfg(): Cfg \| undefined`                                           | 等价 `getBody()?.getCfg()`                             |
| `getParameterRefs(): ArkParameterRef[] \| null`                        | 起始块里所有 `parameterN` 引用                               |
| `getParameterInstances(): Value[]`                                     | 起始块里 `param = parameterN: T` 的左值（命名后的 Local）         |
| `getThisInstance(): Value \| null`                                     | 起始块里 `this = this: ...` 的左值（即命名后的 `this` Local）      |
| `getReturnValues(): Value[]`                                           | 所有 `ArkReturnStmt.getOp()`（不含 void return）           |
| `getReturnStmt(): Stmt[]` / `getReturnVoidStmt(): ArkReturnVoidStmt[]` | return / return void 语句                              |
| `buildBody()`                                                          | 触发 BodyBuilder 实际构建 ArkBody（延迟到 `buildClassDone` 之后） |
| `freeBodyBuilder() / freeCxxBodyBuilder()`                             | 构建完毕后释放 builder，省内存                                  |
| `getBodyBuilder() / getCxxBodyBuilder()`                               | 取 builder（C/C++ 特殊处理）                                |
| `getFunctionLocal(name): Local \| null`                                | 在 locals 中找一个类型为函数（含 C++ 函数指针）的同名 Local              |

### 元信息

| 方法                                                              | 说明                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------- |
| `getDeclaringArkClass() / setDeclaringArkClass(c)`              | 反向引用所属类                                                              |
| `getDeclaringArkFile(): ArkFile`                                | 等价 `getDeclaringArkClass().getDeclaringArkFile()`                    |
| `getOuterMethod() / setOuterMethod(m)`                          | 嵌套关系                                                                 |
| `getLanguage(): Language`                                       | 所属文件的语言种类                                                            |
| `getCode() / setCode(s)`                                        | 源码片段                                                                 |
| `getGenericTypes() / setGenericTypes(t)` / `isGenericsMethod()` | 泛型参数                                                                 |
| `isDefaultArkMethod(): boolean`                                 | 是否 `%dflt`                                                           |
| `isAnonymousMethod(): boolean`                                  | 是否 `%AM` 开头的匿名方法                                                     |
| `isGenerated() / setIsGeneratedFlag(b)`                         | 通过 `BaseModelTag.GENERATED` 管理，是否 IR 自动生成（`%instInit`/`%statInit` 等） |
| `getAsteriskToken() / setAsteriskToken(b)`                      | 通过 `BaseModelTag.ASTERISK_TOKEN` 管理，generator `*`                    |
| `getQuestionToken() / setQuestionToken(b)`                      | 通过 `BaseModelTag.QUESTION_TOKEN` 管理，接口可选方法 `?`                       |
| `getViewTree() / setViewTree(vt) / hasViewTree()`               | ArkUI 视图树（详见 [ViewTree.md](../analysis/ViewTree.md)）                 |
| `validate(): ArkError`                                          | 检查签名/位置一致性、必填字段                                                      |
| `isPublic(): boolean`                                           | 类成员方法默认 public（非匿名 / 非 generated / 非 constructor）                    |

### 修饰符

| 方法                                                                                | 说明      |
| --------------------------------------------------------------------------------- | ------- |
| `containsModifier(m: ModifierType)`                                               | 是否含某修饰符 |
| `addModifier(m) / removeModifier(m)`                                              | 添 / 删   |
| `isStatic() / isAsync() / isAbstract() / isOverride() / isExport() / isDefault()` | 常用判断    |

### 已废弃接口

以下接口自 **1.0.91** 版本起废弃，建议使用新的替代接口：

| 方法                                                   | 说明                                       |
| ---------------------------------------------------- | ---------------------------------------- |
| `getOriginalCfg(): Cfg \| undefined`                   | ⚠️ **废弃于 1.0.91**，恒返回 `undefined`，建议使用 `getCfg()` 替代 |
| `getDeclareLines(): number[] \| null`                 | ⚠️ **废弃于 1.0.91**，建议使用 `getDeclareOriginFullPositions().map(p => p.getFirstLine())` |
| `getDeclareColumns(): number[] \| null`               | ⚠️ **废弃于 1.0.91**，建议使用 `getDeclareOriginFullPositions().map(p => p.getFirstCol())` |
| `setDeclareLinesAndCols(lines, columns): void`        | ⚠️ **废弃于 1.0.91**，建议使用 `setDeclareOriginFullPositions()` |
| `setDeclareLineCols(lineCols): void`                  | ⚠️ **废弃于 1.0.91**，建议使用 `setDeclareOriginFullPositions()` |
| `getDeclareLineCols(): LineCol[] \| null`             | ⚠️ **废弃于 1.0.91**，建议使用 `getDeclareOriginFullPositions().map()` |
| `getLine(): number \| null`                           | ⚠️ **废弃于 1.0.91**，建议使用 `getImplOriginFullPosition()?.getFirstLine()` |
| `setLine(line): void`                                 | ⚠️ **废弃于 1.0.91**，建议使用 `setImplOriginFullPosition()` |
| `getColumn(): number \| null`                         | ⚠️ **废弃于 1.0.91**，建议使用 `getImplOriginFullPosition()?.getFirstCol()` |
| `setColumn(column): void`                             | ⚠️ **废弃于 1.0.91**，建议使用 `setImplOriginFullPosition()` |
| `getLineCol(): LineCol \| null`                       | ⚠️ **废弃于 1.0.91**，建议使用 `getImplOriginFullPosition()` |
| `setLineCol(lineCol): void`                           | ⚠️ **废弃于 1.0.91**，建议使用 `setImplOriginFullPosition()` |

> 所有位置相关废弃接口已统一迁移至 `FullPosition` 版本，提供更完整的源码位置信息（起始/结束行列）。

## 5. 使用示例

下例展示如何遍历 `ArkMethod`，区分各种特殊方法、打印签名与方法体。

```typescript
import {
    Scene, SceneConfig,
    ArkMethod, DEFAULT_ARK_METHOD_NAME,
} from 'arkanalyzer';

const config = new SceneConfig();
config.buildFromProjectDir('tests/resources/save');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes();

function classify(m: ArkMethod): string {
    if (m.isDefaultArkMethod()) return '%dflt';
    if (m.isAnonymousMethod())  return 'anonymous (%AM)';
    if (m.getName() === '%instInit') return '%instInit';
    if (m.getName() === '%statInit') return '%statInit';
    if (m.getName() === 'constructor') return 'constructor';
    if (m.isGenerated())        return 'generated';
    if (m.getOuterMethod())     return `nested in ${m.getOuterMethod()!.getName()}`;
    return 'normal';
}

for (const arkFile of scene.getFiles()) {
    for (const arkClass of arkFile.getClasses()) {
        for (const arkMethod of arkClass.getMethods()) {
            const sig = arkMethod.getSignature().toString();
            const kind = classify(arkMethod);
            console.log(`[${kind}] ${sig}`);

            // declare 签名（重载）数量
            const declares = arkMethod.getDeclareSignatures();
            if (declares && declares.length > 1) {
                console.log(`   overloads: ${declares.length}`);
            }

            // 方法体（abstract/接口方法没有 body）
            const cfg = arkMethod.getCfg();
            if (cfg) {
                console.log(`   blocks: ${cfg.getBlocks().size}, stmts: ${cfg.getStmts().length}`);
            }

            // 参数 / this / 返回
            console.log(`   params: ${arkMethod.getParameters().length}`);
            console.log(`   this:   ${arkMethod.getThisInstance()}`);
            console.log(`   return: ${arkMethod.getReturnValues().length} value(s)`);
        }
    }
}
```

> 完整可运行示例可参考：[tests/samples/CfgTest.ts](../../tests/samples/CfgTest.ts) 及 [tests/samples/SceneTest.ts](../../tests/samples/SceneTest.ts)。

