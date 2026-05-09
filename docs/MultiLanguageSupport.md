# ArkAnalyzer 多语言支持说明

## 1. 概述

ArkAnalyzer 把所有支持的源语言统一编译成 **ArkIR**（三地址中间表示），从而让上层分析对源语言透明。各前端的差别集中在两处：

1. **解析与 IR 转换**：`.ts` / `.ets` / `.js` 走 [TypeScript Compiler API](https://github.com/microsoft/TypeScript) + ArkAnalyzer 自己的转换器；`C/C++` 经 [`src/frontend/cppFrontend`](../src/frontend/cppFrontend) 的独立流水线（依赖外部 cppast JSON / compile_commands.json）。
2. **类型推导**：[`InferenceManager`](../src/core/inference/Inference.ts) 把 `Language` 派发到对应实现 —— [`ArkTsInferenceBuilder`](../src/core/inference/arkts/ArkTsInference.ts)、`JsInferenceBuilder`、`ArkTs2InferenceBuilder`、`CxxInferenceBuilder`、`AbcInferenceBuilder`。

下面给出**功能矩阵**与**与 ArkTS 的 IR 差异**。完整的阶段化使用场景见根 [README.md](../README.md#支持的使用场景分语言)。

## 2. 功能支持矩阵

| 维度 | ArkTS 1.1 (`.ets`) | ArkTS 1.2 (`'use static'`) | TypeScript (`.ts`) | JavaScript (`.js`) | C / C++ | ABC |
|------|--------------------|-----------------------------|---------------------|--------------------|---------|-----|
| `Language` 枚举值 | `ARKTS1_1` | `ARKTS1_2` | `TYPESCRIPT` | `JAVASCRIPT` | `CXX` | `ABC` |
| 扩展名识别 | `.ets` | `.ets` + 文件头 `'use static'` | `.ts` | `.js` | `.c/.cc/.cpp/.h/.hpp` 等 | `.abc` |
| AST 来源 | TS Compiler API | TS Compiler API | TS Compiler API | TS Compiler API | cppast JSON | ArkCompiler 字节码 |
| 全部 7 种 [`ClassCategory`](./components/ArkClass.md#3-核心数据结构) | ✅ | ✅ | ✅ | ✅ (除 INTERFACE / TYPE_LITERAL) | ✅（独占 `UNION`） | 部分 |
| 命名空间 | ✅ | ✅ | ✅ | — | ✅（按 namespace / 文件） | — |
| 接口 / 抽象类 | ✅ | ✅ | ✅ | — | ✅（纯虚函数） | — |
| 泛型 | ✅ | ✅ | ✅ | — | ✅（template，受限） | — |
| 装饰器 / 注解 | ✅（`@Component`、`@State` 等） | ✅ | ✅（experimental） | — | — | — |
| `import` / `export` 解析 | ✅ | ✅ | ✅ | ✅ | ✅（基于 `#include`） | — |
| 类型推导（`scene.inferTypes()`） | ✅ 完整 | ✅ 完整 | ✅ 完整 | ⚠ 受限（无注解处退化为 `UnknownType`） | ⚠ 部分（依赖头文件可见性） | — |
| Method 重载（[`isLanguageOverloadSupport`](../src/core/common/ModelUtils.ts)） | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| [CallGraph](./analysis/CallGraph.md)（CHA / RTA） | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| [Def-Use Chain](./analysis/Def-Use%20Chain.md) | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| [IFDS](./analysis/IFDS.md) | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| [ViewTree](./analysis/ViewTree.md) | ✅ | ✅ | — | — | — | — |
| 多模块（鸿蒙 `oh-package.json5`） | ✅ | ✅ | — | — | ✅（与 ArkTS 同工程） | — |

> "✅" 表示已实现且测试覆盖；"⚠" 表示部分实现；"—" 表示当前不支持或不适用。

### 2.1 语言识别规则

- 文件扩展名映射在 [`FileUtils.getFileLanguage`](../src/utils/FileUtils.ts)：

  | 扩展名 | 语言 |
  |--------|------|
  | `.ts` / `.tsx` | `TYPESCRIPT` |
  | `.ets` | `ARKTS1_1`（默认） |
  | `.js` / `.mjs` | `JAVASCRIPT` |
  | `.c` / `.cc` / `.cpp` / `.cxx` / `.h` / `.hpp` / `.hh` 等 | `CXX` |
  | 其他 | `UNKNOWN` |

- **ArkTS 1.2 升级**：`.ets` 文件头若有顶层 `'use static'` 指令（`ARKTS_STATIC_MARK`），[`ArkFileBuilder`](../src/core/model/builder/ArkFileBuilder.ts) 会把语言切到 `ARKTS1_2`，启用更严格的静态推导路径。
- C/C++ 集合定义在 [`CXX_EXTENSION_SET`](../src/utils/FileUtils.ts) 中。
- 用户可通过 `SceneConfig` 提供 `fileTags`（路径 → Language）覆盖默认识别。

### 2.2 类型推导分发

[`InferenceManager.changeToInferLanguage`](../src/core/inference/Inference.ts) 把六种 Language 折叠为五条推导链路：

| Language | 推导实现 | 关键差异 |
|----------|---------|---------|
| `ARKTS1_1` / `TYPESCRIPT` | `ArkTsInferenceBuilder` | 同一套 TS 类型系统 |
| `ARKTS1_2` | `ArkTs2InferenceBuilder` | 把不可空、`final`、`null vs undefined` 严格区分 |
| `JAVASCRIPT` | `JsInferenceBuilder` | 不读类型注解；fall-back 到运行时形态推断 |
| `CXX` | `CxxInferenceBuilder` | 处理指针 / 引用 / 模板实例化 / 继承可访问性 |
| `ABC` | `AbcInferenceBuilder` | 直接读字节码已有的类型槽 |

## 3. 各语言使用方式

> 三步流程对所有语言一致：构造 `SceneConfig` → `Scene.buildSceneFromProjectDir` → `scene.inferTypes()`。下面只列出**与 ArkTS 不同**的额外步骤。

### 3.1 ArkTS（HarmonyOS）

最常用：直接 `buildSceneFromProjectDir`，对鸿蒙多模块工程改用 `buildScene4HarmonyProject`。详见 [Scene §5.1](./components/Scene.md#51-构建-scene)。

```typescript
const config = new SceneConfig();
config.buildFromProjectDir('./harmony-app');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);     // 或 scene.buildScene4HarmonyProject();
scene.inferTypes();
```

### 3.2 TypeScript / JavaScript

与 ArkTS 一致，`SceneConfig.buildFromProjectDir` 即可：

```typescript
const config = new SceneConfig();
config.buildFromProjectDir('./my-ts-lib');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes();
```

### 3.3 C / C++

C/C++ 必须额外提供 **cppast JSON** 与 **compile_commands.json**，以及头文件 include 目录：

```typescript
import { SceneConfig, Scene } from 'arkanalyzer';

const config = new SceneConfig();
config.buildFromJson('./cxx-config.json');     // 配置中含 cppAstPath / ccjsonPath / includeDirs
const scene = new Scene();
scene.buildBasicInfo(config);
scene.buildSceneFromProjectDir(config);
scene.inferTypes();

console.log('cxx files:', scene.getFiles().filter(f => f.getLanguage() === Language.CXX).length);
```

> CXX 配置示例可参考 [tests/resources/cpp/](../tests/resources/cpp/)；`SceneConfig` 中提供 `cppAstPath: <cppast JSON>`、`ccjsonPath: <compile_commands.json>` 与 `includeDirs: string[]`。

### 3.4 ArkTS 与 C/C++ 混合工程

鸿蒙原生模块经常出现 ArkTS 通过 `napi_*` 调到 C/C++ 实现的场景。`ArkClass` 提供桥接表：

```typescript
for (const cls of scene.getClasses()) {
    const tsToCxx = cls.getTs2cxxFuncMap();
    for (const [tsName, cxxMethods] of tsToCxx) {
        console.log(`TS ${cls.getName()}.${tsName} -> ${cxxMethods.map(m => m.getName()).join(', ')}`);
    }
}
```

调用图同时跨越 TS 与 C/C++ 边界，可作过程间分析。

## 4. 与 ArkTS 的 IR 差异

下面把"非 ArkTS 1.1"语言相对 ArkTS 的 IR 形态差异分项列出。Language 维度上的"完全相同"项不重复。

### 4.1 ArkTS 1.2

差异主要在**语义**而非 IR 形态：

- **静态强类型**：方法 / 字段缺类型注解时直接报错而非给出 `UnknownType`。
- **更严格的 null / undefined 区分**：联合类型表达式不会自动塌缩；`UnionType` 内 `null`、`undefined` 维持独立支。
- **强 `final`**：类成员 `final` 修饰会被记到 `ModifierType.READONLY` 同位标志（具体记法见 [`ArkBaseModel.ts`](../src/core/model/ArkBaseModel.ts) 的 `keywordToModifier` 表）。

IR 文本与 1.1 完全相同——下游分析无需特化处理。

### 4.2 TypeScript（与 ArkTS 1.1 几乎一致）

唯一差异：TS 工程没有 `@Component` / `@State` / `@Builder` 等 ArkUI 装饰器，因此不会构建 [`ViewTree`](./analysis/ViewTree.md)。其余（命名空间、泛型、装饰器、`type` / `interface`、`namespace`、`type literal`、对象字面量等）都与 ArkTS 1.1 共用同一套 ArkIR 表示。

### 4.3 JavaScript

- **类型槽几乎全为 `UnknownType`**：缺类型注解，`scene.inferTypes()` 后 `Local.getType()` 大概率仍是 `UnknownType` 或被推为字面量的 `LiteralType`。
- **没有 `interface` / `type` / `enum`**：`ClassCategory.INTERFACE` / `TYPE_LITERAL` 不会出现；`enum` 退化为对象字面量（`OBJECT`）。
- **属性签名 / 索引签名缺失**：`FieldCategory.PROPERTY_SIGNATURE` / `INDEX_SIGNATURE` 不会出现。
- 调用与赋值的 IR 形态与 TS 一致；下游分析仍可运行，但精度受类型缺失影响（见 [TypeInference §1](./analysis/TypeInference.md#1-概述)）。

### 4.4 C / C++

差异最大，需要额外建模指针、引用、模板、独立修饰符与 union。

#### 4.4.1 类别扩展

- 新增 [`ClassCategory.UNION`](./components/ArkClass.md#3-核心数据结构)：对应 C/C++ 的 `union T { ... }`，与 `class` 的字段表象一致，但成员共享存储。
- 接口对应"全 `pure virtual` 的 C++ class"——`ClassCategory.INTERFACE` 仍可用，由 cppFrontend 在识别全纯虚函数后置位。

#### 4.4.2 修饰符扩展

[`ModifierType`](../src/core/model/ArkBaseModel.ts) 中专为 C/C++ 增加：

| 标志 | 对应关键字 |
|------|----------|
| `VIRTUAL` | `virtual` 函数 |
| `PURE_VIRTUAL` | `= 0` 纯虚函数 |
| `FRIEND` | `friend` 声明 |
| `MUTABLE` | `mutable` 字段 |
| `EXPLICIT` | `explicit` 构造器 |
| `CONSTEXPR` | `constexpr` |
| `INLINE` | `inline` |
| `VOLATILE` | `volatile` |
| `NOEXCEPT` | `noexcept` |
| `AUTO` / `EXTERN` | `auto` / `extern` |

C/C++ 类继承的 `extends` 语义比 TS 复杂（多继承 / 虚继承 / 不同 access），因此 [`heritageClassWithInfo`](./components/ArkClass.md#heritageclasses)（`isVirtual` / `access`）的非默认值**主要在 CXX 工程**中出现。

#### 4.4.3 Type 系统扩展

[`src/frontend/cppFrontend/base/Type.ts`](../src/frontend/cppFrontend/base/Type.ts) 在 ArkAnalyzer 通用 `Type` 之上增补：

```typescript
// 整型：8 / 16 / 32 / 64 位 + signed/unsigned
class CxxIntegralType extends NumberType {
    public bits: CxxTypeBitWidth;
    public signed: CxxTypeSigned;
}
class CxxIntType / CxxShortType / CxxLongType / CxxLongLongType / CxxSizeTType extends CxxIntegralType;

// 浮点
class CxxFloatType / CxxDoubleType / CxxLongDoubleType extends CxxFloatingPointType;

// 字符
class CxxCharType / CxxWcharType extends Type;

// 指针 & 引用
class PointerType extends Type {
    private baseType: Type;
    private dimension: number;            // T**: dimension=2
}
class SmartPointerType extends PointerType { /* unique_ptr / shared_ptr / weak_ptr */ }

enum ReferCategory { L_VALUE, R_VALUE }   // T& / T&&
```

这些类型在 IR 中出现在 `Local` / 字段 / 形参的类型槽里，例如：

```typescript
// 源码（C++）
int* arr = new int[10];
const std::string& s = "hi";
```

```typescript
// ArkIR（ArkAnalyzer 文本）
arr = new @F: int[10]: PointerType<int, 1>
s   = parameter0: ReferenceType<string, L_VALUE, const>
```

#### 4.4.4 调用 IR 差异

C/C++ 的方法调用文本与 TS 一致（`instanceinvoke` / `staticinvoke`），但**支持重载**：同一个类的多个方法签名仍以同一个 `methodName` 索引到 `methods.get(name)` 数组中（见 [`ArkClass.addMethod`](./components/ArkClass.md#方法)）。这一点由 [`ModelUtils.isLanguageOverloadSupport(language)`](../src/core/common/ModelUtils.ts) 控制：仅 `CXX` 返回 `true`。

#### 4.4.5 默认行为差异

- C/C++ 文件没有 `%dflt` 类的"顶层语句执行"语义——全局变量初始化会落到 `%statInit`，函数体之外不会有"任意 stmt 的 %dflt() 方法"。
- 头文件（`.h` / `.hpp`）与实现文件（`.cpp` / `.cc`）通过 `ArkClass.getDeclareSignature()` / `setDeclareSignature()` 维护**声明与定义分离**关系；同一类型可能同时存在于多个 `ArkFile` 中。
- import 文本来自 `#include`，但仍以 `ImportInfo` 形态存放在 `ArkFile.importInfoMap` 中；标准库 / SDK 头被 [`ArkFile.getImportInfos`](./components/ArkFile.md) 排序到末尾以便阅读。

### 4.5 ABC（实验）

`ABC` 是直接读取 ArkCompiler 字节码的实验通道，目前仅用于 IR 验证（往返：源码 → ArkIR → ABC → ArkIR 一致性测试），**不参与下游分析**。`InferenceManager` 路由到 `AbcInferenceBuilder`，但其结果不保证与 TS 前端等价。

## 5. 选用建议

| 场景 | 推荐前端 |
|------|---------|
| HarmonyOS 应用 / ArkUI 视图分析 | ArkTS 1.1（`.ets`）；启用了 `'use static'` 的新代码用 ArkTS 1.2 |
| 通用 TS 库 / 服务端 | TypeScript |
| 既有 JS 工程做粗粒度 CG | JavaScript（建议先补类型注解再升级到 TS） |
| 鸿蒙 Native 模块 / 跨语言追踪 | C/C++（搭配 ArkTS 主工程同 Scene 构建） |
| IR 互译验证 | ABC（实验） |

## 6. 参考资料

- 语言枚举与扩展名映射：[`src/utils/FileUtils.ts`](../src/utils/FileUtils.ts)、[`src/core/model/ArkFile.ts`](../src/core/model/ArkFile.ts)
- 推导分发：[`src/core/inference/Inference.ts`](../src/core/inference/Inference.ts)
- 重载支持判断：[`src/core/common/ModelUtils.ts`](../src/core/common/ModelUtils.ts)（`isLanguageOverloadSupport`）
- ArkTS 1.2 检测：[`src/core/model/builder/ArkFileBuilder.ts`](../src/core/model/builder/ArkFileBuilder.ts)（`ARKTS_STATIC_MARK = 'use static'`）
- C/C++ 前端：[`src/frontend/cppFrontend/`](../src/frontend/cppFrontend/)
- 各语言修饰符表：[`src/core/model/ArkBaseModel.ts`](../src/core/model/ArkBaseModel.ts) 的 `keywordToModifier`
- 上层组件文档：[ArkFile.md](./components/ArkFile.md) §3（Language 枚举完整表）、[ArkClass.md](./components/ArkClass.md)（ClassCategory 七种 + UNION）、[ArkField.md](./components/ArkField.md)（FieldCategory 与 ModifierType）。
