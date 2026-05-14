# 类型推导（Type Inference）

## 1. 概述

**类型推导**是 ArkAnalyzer 中把 IR 上 **`UnknownType`**、**`UnclearReferenceType`** 等"未确定类型"替换为具体类型（`ClassType`、`NumberType`、`FunctionType` 等）的核心步骤。它把基于源码 AST 解析得到的"形式化签名"与基于上下文的"实际值类型"对齐，是 [CallGraph](./CallGraph.md)、[Def-Use Chain](./Def-Use%20Chain.md)、[IFDS](./IFDS.md)、[ViewTree](./ViewTree.md) 等几乎所有下游分析的 **必要前置**。

> 推荐流程：构建 Scene 后立即调用 `scene.inferTypes()`，再做任何分析。即使是看似"只读"的遍历（例如统计调用关系），其结果都依赖类型推导后的 `MethodSignature`、`ClassType` 等才能正确解析。

类型推导覆盖：

- **Local 类型** —— 源码无注解时根据 def 表达式 / 上下文推断；如 `let x = new Foo()` 中 `x` 的类型由 `new Foo()` 决定。
- **MethodSignature 返回类型与参数类型** —— 形式上声明为 `any` / 缺省时按方法体内 `return` 表达式与实参补齐。
- **字段类型** —— 接口属性签名、类字段、参数属性等。
- **泛型实参** —— 调用 / 继承点的具体实参回填到 `realTypes`。
- **import / re-export** —— 把 `import { X } from './a'` 中的 `X` 解析到具体的 `ArkClass` / `ArkMethod` / `Local`，再回写其类型。

## 2. 分析流程

`Scene.inferTypes()`（[src/Scene.ts](../../src/Scene.ts)）的整体顺序：

```text
1) 确认 buildStage >= METHOD_DONE        // 方法体已生成
2) 触发 getMethodsMap(true)              // 重建方法索引
3) 自上而下遍历：File → Namespace → Class → Method → Stmt
   ├── ArkField.type 由 inferTypeInArkField() 处理
   ├── ArkMethod.signature  ↓
   │     · 参数类型用 inferParameterType()
   │     · 返回类型用 inferReturnType() 或 inferSignatureReturnType()
   ├── 方法体内 Stmt 逐条用 inferTypeInMethod() 处理：
   │     · ArkAssignStmt：先推 rhs，再用 rhs 类型补 lhs
   │     · ArkInvokeStmt：解析调用目标 → 回填 callee 签名
   │     · ArkReturnStmt：把 op 类型回填到方法签名
   └── 把别名 / 泛型实参 (realTypes) 回填到 ClassType
4) 标记 buildStage = TYPE_INFERRED
```

源代码入口文件：

- [src/core/common/TypeInference.ts](../../src/core/common/TypeInference.ts) — 推导算法主体（`TypeInference` 静态类）
- [src/core/inference/Inference.ts](../../src/core/inference/Inference.ts) / `ModelInference.ts` / `ValueInference.ts` — 多遍模型 / 值层面的二次推导，处理跨方法依赖
- [src/core/common/IRInference.ts](../../src/core/common/IRInference.ts) — IR 转换期就地的初步推导

下面用一段简单 ArkTS 演示推导前后的 IR 差异：

```typescript
// 源码
class Person {
    age: number = 0;
    grow() { this.age = this.age + 1; }
}
let p = new Person();
p.grow();
let n = p.age;
```

**推导前**（IR 转换器初次产物，用 `unknown` 占位）：

```typescript
%dflt(): void {
    p = new @F: Person                                   // p: unknown
    %0 = instanceinvoke p.<@F: Person.constructor()>()
    instanceinvoke p.<@F: Person.grow()>()
    %1 = p.<@F: Person.age>                              // %1: unknown
    n = %1                                               // n: unknown
    return
}
```

**推导后**（`scene.inferTypes()`）：

```typescript
%dflt(): void {
    p = new @F: Person                                   // p: @F: Person
    %0 = instanceinvoke p.<@F: Person.constructor()>()   // %0: @F: Person
    instanceinvoke p.<@F: Person.grow()>()
    %1 = p.<@F: Person.age>                              // %1: number
    n = %1                                               // n: number
    return
}
```

> 类型注解通常以"冒号 + 类型名"形式出现在 Local / 引用 IR 末尾——参见 [IRBasics §2 Local](../components/IRBasics.md#2-local---局部变量)。

## 3. Type 类层次

ArkAnalyzer 的所有类型都派生自抽象基类 [`Type`](../../src/core/base/Type.ts)。最常见的子类层次：

```text
Type（abstract）
├── PrimitiveType（abstract）
│   ├── BooleanType / NumberType / BigIntType / StringType
│   ├── NullType / UndefinedType
│   └── LiteralType            // 字面量类型，如 'foo' / 42
├── AnyType                    // 显式 any
├── UnknownType                // 推导失败 / 占位
├── UnclearReferenceType       // 引用尚未解析（带名字的占位）
├── VoidType / NeverType
├── UnionType  (A | B)
├── IntersectionType  (A & B)
├── ClassType                  // 指向 ArkClass，含 realGenericTypes
├── FunctionType               // 指向 MethodSignature，含 realGenericTypes
│   └── ClosureType            // 闭包函数类型，含外层变量集合
├── ArrayType                  // T[]
├── TupleType                  // [T1, T2, ...]
├── AliasType                  // type X = ...; 见 IRBasics §5.5
├── GenericType                // 类 / 方法层泛型形参 T
├── EnumValueType              // 枚举成员类型
├── AnnotationType（abstract） // typeof X / namespace X 等注解形式
│   ├── AnnotationNamespaceType
│   └── AnnotationTypeQueryType
└── LexicalEnvType             // 词法环境（闭包构建期使用）
```

| 类 | 关键属性 | 说明 |
|----|---------|------|
| `ClassType` | `classSignature`、`realGenericTypes?` | 指向 `ArkClass`；若该类是泛型类，`realGenericTypes` 装实参 |
| `FunctionType` | `methodSignature`、`realGenericTypes?` | 函数 / 方法值类型，可作为 Local 类型 |
| `ArrayType` | `baseType`、`dimension` | 多维数组用 `dimension` 表示 |
| `UnionType` | `types[]`、`currType?` | 某点上若已收窄到具体支，会写到 `currType` |
| `AliasType` | `name`、`originalType`、`signature`、`modifiers` | 类型别名；详见 [IRBasics §5.5](../components/IRBasics.md#55-aliastypeexpr) |
| `GenericType` | `name`、`defaultType?`、`constraint?` | 类 / 方法层泛型形参 |
| `UnclearReferenceType` | `name` | 推导前的引用占位，推导后通常被替换 |

## 4. 核心数据结构

### TypeInference 静态工具类

```typescript
// src/core/common/TypeInference.ts
export class TypeInference {
    public static inferTypeInArkField(field: ArkField): void;
    public static inferTypeInMethod(method: ArkMethod): void;
    public static inferSimpleTypeInMethod(method: ArkMethod): void;
    public static inferSimpleTypeInStmt(stmt: Stmt): void;

    public static inferValueType(value: Value, method: ArkMethod): Type | null;
    public static inferParameterType(p: MethodParameter, method: ArkMethod): void;
    public static inferReturnType(method: ArkMethod): Type | null;
    public static inferSignatureReturnType(sig: MethodSignature, method: ArkMethod): void;

    public static inferGenericType(types: GenericType[] | undefined, cls: ArkClass): void;
    public static inferRealGenericTypes(realTypes: Type[] | undefined, cls: ArkClass): void;

    public static inferUnclearRefType(t: UnclearReferenceType, cls: ArkClass): Type | null;
    public static inferUnclearRefName(name: string, cls: ArkClass): Type | null;
    public static inferBaseType(name: string, cls: ArkClass): Type | null;
    public static inferTypeByName(name: string, cls: ArkClass): Type | null;
    public static inferFieldType(baseType: Type, fieldName: string, cls: ArkClass): [any, Type] | null;
    public static inferDynamicImportType(from: string, cls: ArkClass): Type | null;
    public static inferFunctionType(arg: FunctionType, paramSig: MethodSubSignature | undefined, realTypes?: Type[]): void;

    public static isUnclearType(t: Type | null | undefined): boolean;
    public static replaceAliasType(t: Type): Type;
    public static inferUnclearedType(leftOpType: Type, cls: ArkClass): Type | null | undefined;
}
```

| 方法 | 说明 |
|------|------|
| `inferTypeInMethod(method)` | 单方法完整推导（推 locals / 引用 / 调用目标 / 返回类型等） |
| `inferSimpleTypeInMethod(method)` | 仅做"局部一遍"轻量推导，速度快、精度低；用于第一次构建 |
| `inferValueType(value, method)` | 从 IR `Value` 推回 `Type`，常用于反向取一个 Local / Ref 的真实类型 |
| `inferParameterType / inferReturnType / inferSignatureReturnType` | 方法签名级别 |
| `inferUnclearRefType / inferUnclearRefName / inferBaseType / inferTypeByName` | 解决 "name → Type" 的查表，作用域为某个 `ArkClass`（含其文件 / 命名空间 / import 链） |
| `inferFieldType(base, name, cls)` | 给定 base 类型与字段名查字段类型，返回 `[ArkField, Type]` |
| `inferDynamicImportType(from, cls)` | 解决 `import('./xxx')` 这种异步 import 的类型 |
| `inferFunctionType(arg, paramSig, realTypes)` | 把 callable 实参的形参签名 / 泛型实参打通 |
| `isUnclearType(t)` | 判断 `t` 是否是 `UnknownType` / `UnclearReferenceType`（推导未完成） |
| `replaceAliasType(t)` | 把 `AliasType` 解开成原始类型 |

### Scene 上的入口

| 方法 | 行为 |
|------|------|
| `scene.inferTypes()` | 全量推导（推荐） |
| `scene.inferTypesOld()` | 旧版兼容入口 |
| `scene.inferSimpleTypes()` | 仅简单推导（速度快、精度有限） |

`scene.inferTypes()` 一次推导后会把 `buildStage` 推进到 `SceneBuildStage.TYPE_INFERRED`；可重复调用，但只在第一次推动阶段。

## 5. 典型应用场景

### 5.1 调用关系解析

`scene.makeCallGraphCHA(entryPoints)` 与 `scene.makeCallGraphRTA(entryPoints)` 都依赖类型推导：CHA 需要 `ClassType` 来枚举接收者类型层次，RTA 需要类型来过滤"实际被实例化的类"。详见 [CallGraph.md](./CallGraph.md)。

### 5.2 字段访问点的精准定位

`ArkInstanceFieldRef.base` 上的 `Local` 在推导后会带上 `ClassType`，这样 [Def-Use Chain](./Def-Use%20Chain.md) 就能把 `obj.field` 与 `ArkClass.getFieldWithName(field)` 一一对应；缺类型推导时只能停留在签名字符串匹配。

### 5.3 ArkUI 视图树构建

[`ViewTree`](./ViewTree.md) 通过识别 `@Component` 标注的 `struct` 与其 `build()` 方法实现；标注、`@State`、`@Link` 等修饰需要靠类型推导把对应的装饰器表达式映射到 `ArkAnnotationType` / `AnnotationNamespaceType`。

### 5.4 IFDS / 数据流分析

[`IFDS`](./IFDS.md) 的流函数大多按 `Type` 分类讨论（如把"具体类对象"与"primitive"区分对待），缺类型推导会让 normal flow 退化成保守的 over-approximation。

## 6. 使用示例

```typescript
import {
    Scene, SceneConfig,
    DEFAULT_ARK_METHOD_NAME,
    ClassType, FunctionType, UnknownType, UnclearReferenceType,
    ArkAssignStmt,
} from 'arkanalyzer';

// 1) 构建 + 推导
const config = new SceneConfig();
config.buildFromProjectDir('tests/resources/save');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);

console.log('--- before inferTypes() ---');
dumpUnknownLocals(scene);

scene.inferTypes();

console.log('--- after  inferTypes() ---');
dumpUnknownLocals(scene);

function dumpUnknownLocals(scene: Scene) {
    let unknown = 0, total = 0;
    for (const arkFile of scene.getFiles()) {
        for (const arkClass of arkFile.getClasses()) {
            for (const arkMethod of arkClass.getMethods()) {
                if (arkMethod.getName() === DEFAULT_ARK_METHOD_NAME) continue;
                const body = arkMethod.getBody();
                if (!body) continue;
                for (const [, local] of body.getLocals()) {
                    total++;
                    const t = local.getType();
                    if (t instanceof UnknownType || t instanceof UnclearReferenceType) {
                        unknown++;
                    }
                }
            }
        }
    }
    console.log(`unknown / total = ${unknown} / ${total}`);
}

// 2) 反向：取某个 Stmt 上每个 Value 的实际类型
const arkMethod = scene.getMethods()
    .find(m => m.getName() === 'grow' || m.getName() === 'add');
if (arkMethod) {
    for (const stmt of arkMethod.getCfg()!.getStmts()) {
        if (!(stmt instanceof ArkAssignStmt)) continue;
        const lhsType = stmt.getLeftOp().getType();
        const rhsType = stmt.getRightOp().getType();
        console.log(`${stmt}    // lhs: ${lhsType}, rhs: ${rhsType}`);
        if (lhsType instanceof ClassType) {
            console.log(`  -> class: ${lhsType.getClassSignature()}`);
        }
        if (rhsType instanceof FunctionType) {
            console.log(`  -> fn:    ${rhsType.getMethodSignature()}`);
        }
    }
}
```

> 完整可运行示例可参考：[tests/samples/TypeInferenceTest.ts](../../tests/samples/TypeInferenceTest.ts) 与 [tests/samples/TypeTest.ts](../../tests/samples/TypeTest.ts)。
