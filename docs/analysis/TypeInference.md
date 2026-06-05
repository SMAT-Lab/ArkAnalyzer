# 类型推导（Type Inference）

## 1. 概述

**类型推导**是 ArkAnalyzer 中把 IR 上 **`UnknownType`**、**`UnclearReferenceType`** 等"未确定类型"替换为具体类型（
`ClassType`、`NumberType`、`FunctionType` 等），把未知的FileSignature、ClassSignature和MethodSignature关联填充的核心步骤。
它把基于源码 AST 解析得到的"形式化签名"与基于上下文的"实际值类型"
对齐，是 [CallGraph](./CallGraph.md)、[Def-Use Chain](./Def-Use%20Chain.md)、[IFDS](./IFDS.md)、[ViewTree](./ViewTree.md)
等几乎所有下游分析的 **必要前置**。

> 推荐流程：构建 Scene 后立即调用 `scene.inferTypes()`，再做任何分析。即使是看似"只读"的遍历（例如统计调用关系），其结果都依赖类型推导后的
`MethodSignature`、`ClassType` 等才能正确解析。

类型推导覆盖：

- **Local 类型** —— 源码无注解时根据 def 表达式 / 上下文推断；如 `let x = new Foo()` 中 `x` 的类型由 `new Foo()` 决定。
- **MethodSignature 返回类型与参数类型** —— 形式上声明为 `any` / 缺省时按方法体内 `return` 表达式与实参补齐。
- **字段类型** —— 接口属性签名、类字段、参数属性等。
- **泛型实参** —— 调用 / 继承点的具体实参回填到 `realTypes`。
- **import / re-export** —— 把 `import { X } from './a'` 中的 `X` 解析到具体的 `ArkClass` / `ArkMethod` / `Local`
  ，再回写其类型。

## 2. 分析流程

`Scene.inferTypes()`（[src/Scene.ts](../../src/Scene.ts)）的整体顺序：

```text
Scene.inferTypes(times = 1)
│
├── [Step 1] 校验迭代次数
│       · times < 1: 直接返回
│       · times > 5: 截断为 5（最多 5 遍迭代）
│
├── [Step 2] 依赖排序（拓扑排序）
│       └── sortByDependency(filesMap, projectName)
│           · 构建 import/export 依赖图
│           · Kahn 算法拓扑排序：被依赖文件先处理
│           · 循环依赖文件追加到末尾
│
├── [Step 3] 多轮迭代推导（while times > 0）
│       └── for (const file of sortedFiles):
│           └── InferenceManager.getInstance()
│               └── .getInference(file.getLanguage())  // 按语言分发
│                   └── .doInfer(file)                 // 核心推导入口
│
└── [Step 4] 收尾
    ├── getMethodsMap(true)              // 重建方法索引
    ├── buildStage = TYPE_INFERRED       // 标记阶段完成
    └── SdkUtils.dispose() / ModuleUtils.dispose() / ValueUtil.dispose()  // 清理缓存
```

源代码入口文件：

- [src/core/common/TypeInference.ts](../../src/core/common/TypeInference.ts) — 类型处理与转换（`TypeInference` 静态类）
- [src/core/inference/Inference.ts](../../src/core/inference/Inference.ts) — `InferenceManager` 语言分发
- [src/core/inference/ModelInference.ts](../../src/core/inference/ModelInference.ts) — 四层架构：File/Class/Method/Stmt
- [src/core/inference/ValueInference.ts](../../src/core/inference/ValueInference.ts) — Value 级推导器，装饰器注册机制
- [src/core/inference/arkts/ArkTsInference.ts](../../src/core/inference/arkts/ArkTsInference.ts) — ArkTS 特化推导器
- [src/core/common/IRInference.ts](../../src/core/common/IRInference.ts) — Value 实例底层推导

下面用一段简单 ArkTS 演示推导前后的 IR 差异：

```typescript
// 源码
class Person {
    age: number = 0;

   grow() {
      this.age = this.age + 1;
   }
}
let p = new Person();
p.grow();
let n = p.age;
```

**推导前**（IR 转换器初次产物，用 `unknown` 占位）：

```typescript
%
dflt()
:
void {
   p = new @F
:
Person                                   // p: unknown
% 0 = instanceinvoke
p. < @F
:
Person.constructor() > ()
instanceinvoke
p. < @F
:
Person.grow() > ()
% 1 = p. < @F
:
Person.age >                              // %1: unknown
n =
%
1                                               // n: unknown
return
}
```

**推导后**（`scene.inferTypes()`）：

```typescript
%
dflt()
:
void {
   p = new @F
:
Person                                   // p: @F: Person
% 0 = instanceinvoke
p. < @F
:
Person.constructor() > ()   // %0: @F: Person
instanceinvoke
p. < @F
:
Person.grow() > ()
% 1 = p. < @F
:
Person.age >                              // %1: number
n =
%
1                                               // n: number
return
}
```

> 类型注解通常以"冒号 + 类型名"形式出现在 Local / 引用 IR
> 末尾——参见 [IRBasics §2 Local](../components/IRBasics.md#2-local---局部变量)。

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

| 类                      | 关键属性                                          | 说明                                                                  |
|------------------------|-----------------------------------------------|---------------------------------------------------------------------|
| `ClassType`            | `classSignature`、`realGenericTypes?`          | 指向 `ArkClass`；若该类是泛型类，`realGenericTypes` 装实参                        |
| `FunctionType`         | `methodSignature`、`realGenericTypes?`         | 函数 / 方法值类型，可作为 Local 类型                                             |
| `ArrayType`            | `baseType`、`dimension`                        | 多维数组用 `dimension` 表示                                                |
| `UnionType`            | `types[]`、`currType?`                         | 某点上若已收窄到具体支，会写到 `currType`                                          |
| `AliasType`            | `name`、`originalType`、`signature`、`modifiers` | 类型别名；详见 [IRBasics §5.5](../components/IRBasics.md#55-aliastypeexpr) |
| `GenericType`          | `name`、`defaultType?`、`constraint?`           | 类 / 方法层泛型形参                                                         |
| `UnclearReferenceType` | `name`                                        | 推导前的引用占位，推导后通常被替换                                                   |

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

| 方法                                                                            | 说明                                                             |
|-------------------------------------------------------------------------------|----------------------------------------------------------------|
| `inferTypeInMethod(method)`                                                   | 单方法完整推导（推 locals / 引用 / 调用目标 / 返回类型等）                          |
| `inferSimpleTypeInMethod(method)`                                             | 仅做"局部一遍"轻量推导，速度快、精度低；用于第一次构建                                   |
| `inferValueType(value, method)`                                               | 从 IR `Value` 推回 `Type`，常用于反向取一个 Local / Ref 的真实类型              |
| `inferParameterType / inferReturnType / inferSignatureReturnType`             | 方法签名级别                                                         |
| `inferUnclearRefType / inferUnclearRefName / inferBaseType / inferTypeByName` | 解决 "name → Type" 的查表，作用域为某个 `ArkClass`（含其文件 / 命名空间 / import 链） |
| `inferFieldType(base, name, cls)`                                             | 给定 base 类型与字段名查字段类型，返回 `[ArkField, Type]`                      |
| `inferDynamicImportType(from, cls)`                                           | 解决 `import('./xxx')` 这种异步 import 的类型                           |
| `inferFunctionType(arg, paramSig, realTypes)`                                 | 把 callable 实参的形参签名 / 泛型实参打通                                    |
| `isUnclearType(t)`                                                            | 判断 `t` 是否是 `UnknownType` / `UnclearReferenceType`（推导未完成）       |
| `replaceAliasType(t)`                                                         | 把 `AliasType` 解开成原始类型                                          |

### Scene 上的入口

| 方法                         | 行为              |
|----------------------------|-----------------|
| `scene.inferTypes()`       | 全量推导（推荐）        |
| `scene.inferTypesOld()`    | 旧版兼容入口          |
| `scene.inferSimpleTypes()` | 仅简单推导（速度快、精度有限） |

`scene.inferTypes()` 一次推导后会把 `buildStage` 推进到 `SceneBuildStage.TYPE_INFERRED`；默认推导1次。

## 5. 典型应用场景

### 5.1 调用关系解析

`scene.makeCallGraphCHA(entryPoints)` 与 `scene.makeCallGraphRTA(entryPoints)` 都依赖类型推导：CHA 需要 `ClassType`
来枚举接收者类型层次，RTA 需要类型来过滤"实际被实例化的类"。详见 [CallGraph.md](./CallGraph.md)。

### 5.2 字段访问点的精准定位

`ArkInstanceFieldRef.base` 上的 `Local` 在推导后会带上 `ClassType`，这样 [Def-Use Chain](./Def-Use%20Chain.md) 就能把
`obj.field` 与 `ArkClass.getFieldWithName(field)` 一一对应；缺类型推导时只能停留在签名字符串匹配。

### 5.3 ArkUI 视图树构建

[`ViewTree`](./ViewTree.md) 通过识别 `@Component` 标注的 `struct` 与其 `build()` 方法实现；标注、`@State`、`@Link`
等修饰需要靠类型推导把对应的装饰器表达式映射到 `ArkAnnotationType` / `AnnotationNamespaceType`。

### 5.4 IFDS / 数据流分析

[`IFDS`](./IFDS.md) 的流函数大多按 `Type` 分类讨论（如把"具体类对象"与"primitive"区分对待），缺类型推导会让 normal flow
退化成保守的 over-approximation。

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

### 6.1 多轮迭代使用建议

```typescript
// 场景 1：简单项目（无复杂跨文件依赖）
scene.inferTypes();  // 1 轮足够

// 场景 2：复杂项目（多层继承、泛型嵌套、回调频繁）
scene.inferTypes(2);  // 2 轮，平衡精度和性能

// 场景 3：极端复杂（循环依赖深、大量回调）
scene.inferTypes(5);  // 最多 5 轮
```

> 完整可运行示例可参考：[tests/samples/TypeInferenceTest.ts](../../tests/samples/TypeInferenceTest.ts)
> 与 [tests/samples/TypeTest.ts](../../tests/samples/TypeTest.ts)。

## 8. 常见问题（FAQ）

### Q1：为什么类型推导后还有很多 `UnknownType`？

**可能原因：**

1. **源码缺少类型注解**：TypeScript/ArkTS 本身就是 `any`  `EsObject`  `object` 或隐式类型
2. **SDK 类型未加载或者版本不一致**：确保加载了正确的sdk
3. **动态类型场景**：map等容器、动态 import等无法静态分析
4. **跨文件循环依赖**：尝试多轮迭代 `scene.inferTypes(2)`
5. **未支持场景**：1）内置类型Record、ReadOnly等；2）复杂泛型（包含extends、keyof）；3） namespace 中 import

**排查方法：**

```typescript
// 打印所有未确定类型的 Local
for (const arkFile of scene.getFiles()) {
   for (const arkClass of arkFile.getClasses()) {
      for (const arkMethod of arkClass.getMethods()) {
         const body = arkMethod.getBody();
         if (!body) continue;
         for (const [name, local] of body.getLocals()) {
            const t = local.getType();
            if (TypeInference.isUnclearType(t)) {
               console.log(`${arkFile.getFilePath()}:${name} = ${t}`);
            }
         }
      }
   }
}
```

---

### Q2：第三方库类型支持吗？

**支持**，但前提条件是第三方库成功加载（ohpm install）或者 SDK 中配置三方库路径

**第三方库默认不加载方法体** 如有需要请在config/arkanalyzer.json 中开启 "enableOhModulesBody": true,


---

### Q3：什么时候需要多轮迭代（`times > 1`）？

**需要多轮的典型场景：**

1. **方法 A 调用方法 B，B 的返回类型依赖 A 的推导结果**
   ```typescript
   function process(data: any) {
       return transform(data);  // A 调用 B
   }
   function transform(x: any) {
       return x.value;  // B 的返回类型依赖 x 的类型
   }
   ```

2. **循环依赖**：`A → B → C → A`

3. **泛型嵌套深**：多层 `Promise<Map<K, V[]>>`

4. **回调/闭包频繁**：事件监听、Promise.then() 链式调用

**判断方法：**

- 观察 `inferTypes(1)` 后是否仍有大量 `UnknownType` `UnclearReferenceType`
- 对比 `inferTypes(1)` 和 `inferTypes(3)` 的 unknown 数量差异

---

### Q4：类型推导会修改原模型吗？

**会**。类型推导是**原地修改（in-place）**：

| 被修改的对象               | 修改内容                                         |
|----------------------|----------------------------------------------|
| `Local.type`         | `UnknownType` → `ClassType` / `NumberType` 等 |
| `MethodSignature`    | 参数类型、返回类型                                    |
| `ArkField.type`      | 字段类型                                         |
| `AbstractInvokeExpr` | 方法签名、泛型实参                                    |
| `ArkRef`             | 引用指向的实际对象                                    |

**注意**：

- 推导后 `buildStage` 推进到 `TYPE_INFERRED`
- 多次调用 `inferTypes()` 是安全的（幂等设计）
- 如需"推导前/后对比"，建议在推导前先保存需要的数据

---

### Q5：二进制hap、引用arkanalyzer源码需要注意？

**二进制hap**
config/arkanalyzer.json 中开启 "isScanAbc": true,

**引用arkanalyzer源码**
built-in 无法自动加载；需要在SDK中手动配置

```json
{
   "sdk": [
      {
         "name": "built-in",
         "path": "your-path"
      },
      {
         "name": "ohos",
         "path": "your-path"
      },
      {
         "name": "hms",
         "path": "your-path"
      }
   ]
}
```

---

### Q6：C++ 项目支持类型推导吗？

**支持**，但有差异：

| 特性   | ArkTS/TS                                           | C++                                           |
|------|----------------------------------------------------|-----------------------------------------------|
| 入口   | `InferenceManager.getInference(Language.ARKTS1_1)` | `InferenceManager.getInference(Language.CXX)` |
| 推导器  | `ArkTsInferenceBuilder`                            | `CxxInferenceBuilder`                         |
| 主要差异 | 侧重装饰器、泛型、闭包                                        | 侧重指针、引用、继承                                    |

**C++ 推导注意点：**

- C++ 类型系统更复杂（指针、引用、多重继承等）
- 部分 C++ 特性可能无法完全推导（模板元编程等）
- 参考 `src/frontend/cppFrontend/inference/CxxInference.ts`

---

### Q7：类型推导的性能如何？

**性能影响因素：**

| 因素   | 影响            | 建议                                 |
|------|---------------|------------------------------------|
| 项目大小 | 线性关系          | 大项目考虑分批分析                          |
| 迭代轮次 | 每轮 O(n)       | 默认 1 轮，必要时增至 3 轮                   |
| 方法数量 | 主要耗时在方法体      | 可通过 `scene.getMethods().length` 预估 |
| 超时保护 | 单方法 3000ms 上限 | 复杂方法会被中断并记录日志                      |

**性能优化建议：**

```typescript
// 场景 1：只关心特定文件的类型
const targetFiles = scene.getFiles().filter(f =>
        f.getFilePath().includes('my-module')
);
// 类型推导是全量的，但可只分析目标文件

// 场景 2：快速预览（轻量推导）
scene.inferSimpleTypes();  // 不跨方法、不迭代

// 场景 3：监控推导进度
console.time('infer');
scene.inferTypes();
console.timeEnd('infer');
```

---

### Q8：如何调试类型推导问题？

**调试方法：**

1. **检查日志**：设置日志级别为 DEBUG 或 TRACE
2. **对比前后**：推导前后 dump `Local.type`
3. **定位具体方法**：

```typescript
// 找出类型变化最大的方法
function findMethodWithMostChanges(scene: Scene): ArkMethod | null {
   let maxChanges = 0;
   let result: ArkMethod | null = null;

   // 建议在 inferTypes() 前记录状态
   // 推导后对比

   return result;
}
```

4. **查看 SDK 加载状态**： sdk 顺序需要遵循 built-in -> openharmony -> hms

```typescript
// 确认 SDK 是否正确加载
console.log('SDK count:', scene.getProjectSdkMap().size);
for (const [name, sdk] of scene.getProjectSdkMap()) {
   console.log(`  ${name}: ${sdk.path}`);
}
```

---

### Q9：泛型类型如何推导？

**泛型推导流程：**

1. **类/方法泛型参数**：`ArkTsClassInference.preInfer()` → `inferGenericType()`
2. **调用点实参回填**：`ArkTsInstanceInvokeExprInference` → `inferRealGenericTypes()`
3. **泛型特化**：`TypeInference.replaceTypeWithReal()`

**示例：**

```typescript
// 源码
class Container<T> {
   value: T;

   get(): T {
      return this.value;
   }
}

const c = new Container<number>();
const x = c.get();  // x: number（推导后）
```

推导后：

- `Container.value` 的类型：`GenericType<T>` → `NumberType`
- `c.get()` 的返回类型：`GenericType<T>` → `NumberType`

**未推导的泛型场景：**

- 完全无实参的泛型调用（依赖运行时类型）
- 复杂的条件类型推断
- 递归泛型边界情况

---

### Q10：`UnclearReferenceType` 和 `UnknownType` 有什么区别？

| 类型                     | 含义      | 常见场景             | 可否进一步推导？          |
|------------------------|---------|------------------|-------------------|
| `UnknownType`          | 完全未知    | 无注解、`any`、动态代码   | 通常无法              |
| `UnclearReferenceType` | 有名字但未解析 | import 未解析、跨文件引用 | **可以**，依赖关系建立后可解析 |

**排查示例：**

```typescript
const type = local.getType();

if (type instanceof UnclearReferenceType) {
   // 有名字，可能是 import 或跨文件引用
   console.log('未解析的引用名:', type.getName());
   // 检查是否缺少依赖文件
} else if (type instanceof UnknownType) {
   // 完全未知，可能是 any 或动态代码
   console.log('完全未知类型');
}
```

**`UnclearReferenceType` 常见原因及解决：**

| 原因             | 解决方法                                  |
|----------------|---------------------------------------|
| import 的源文件未加载 | 确保所有源文件都在 `projectFiles`              |
| 循环依赖导致顺序问题     | 尝试多轮迭代 `inferTypes(3)`                |
| 类型别名未展开        | 调用 `TypeInference.replaceAliasType()` |
