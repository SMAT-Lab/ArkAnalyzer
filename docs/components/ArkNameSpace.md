# ArkNamespace

## 1. 概述

**`ArkNamespace`** 是 ArkAnalyzer 对 TypeScript / ArkTS `namespace`（即旧式 `module`）的抽象，承担"作用域容器"的职责：把若干 [`ArkClass`](./ArkClass.md) 与子 `ArkNamespace` 包裹起来，并支持嵌套与同名命名空间合并。

每个 `ArkNamespace`：

- 隶属一个 [`ArkFile`](./ArkFile.md)（`declaringArkFile`）；可选地再隶属一个父命名空间（`declaringArkNamespace`），由 `declaringInstance: ArkFile | ArkNamespace` 统一指向直接外层。
- 拥有一个 **默认类 `%dflt`**（`defaultClass`）：承载该命名空间作用域内的顶层语句、独立函数、类型别名等不直接归属于具体类的成员。
- 通过 [`NamespaceSignature`](#3-核心数据结构) 全局唯一标识。
- 维护自己的 import / export 列表（`exportInfos`）。

## 2. ArkIR

### 2.1 含类、接口、枚举、函数的命名空间

```typescript
// 源码 — 摘自 tests/resources/save/namespaces.ts
namespace Validation {
    enum FileAccess { None, Read = 1 << 1, Write = 1 << 2 }

    export interface StringValidator {
        isAcceptable(s: string): boolean;
    }

    export class LettersValidator implements StringValidator {
        isAcceptable(s: string) { return lettersRegexp.test(s); }
    }

    function test(): void {}
    const lettersRegexp = /^[A-Za-z]+$/;
}
```

```typescript
// ArkIR
namespace Validation {
  Classes:
    enum FileAccess { ... }                            // ClassCategory.ENUM
    interface StringValidator { ... }                  // ClassCategory.INTERFACE
    class LettersValidator implements StringValidator { ... }
    class %dflt {                                      // 默认类，承载顶层
      Fields:
        lettersRegexp: RegExp = /^[A-Za-z]+$/
      Methods:
        test(): void { ... }
        %dflt(): void { ... }                          // 命名空间体内的顶层执行
    }
}
```

> 注意：`namespace` 内的 **全局函数 `test`** 与 **顶层 `const lettersRegexp`** 都被装入该命名空间的 `%dflt` 默认类。

### 2.2 嵌套命名空间

```typescript
// 源码
namespace Shapes {
    export namespace Polygons {
        export class Circle {}
        export class Elliptical {}
    }
}
```

```typescript
// ArkIR
namespace Shapes {
  Namespaces:
    namespace Polygons {
      Classes:
        class Circle { ... }
        class Elliptical { ... }
        class %dflt { ... }
    }
  Classes:
    class %dflt { ... }                                // Shapes 自身的默认类
}
```

通过签名访问：`<@Pkg/File: Shapes.Polygons.Circle>`。

### 2.3 同名命名空间合并

ArkTS / TS 允许同一文件多次声明 `namespace X` 并自动合并；ArkNamespace 的 `addNamespace` 内置该语义：

```typescript
// 源码
namespace U { export class A {} }
namespace U { export class B {} }
```

```typescript
// ArkIR
namespace U {
  Classes:
    class A { ... }
    class B { ... }                                    // 合并入同一个 ArkNamespace
    class %dflt { ... }
}
```

## 3. 核心数据结构

```typescript
// src/core/model/ArkNamespace.ts
export class ArkNamespace extends ArkBaseModel implements ArkExport {
    private originFullPositions!: FullPosition[];                            // 同名命名空间合并时累加

    private declaringFileID: number = -1;                                    // 所属文件 FileSigID（-1 = 未 intern）
    private declaringNamespaceSigID?: number;                                // 父命名空间 NamespaceSigID（顶层为 undefined）
    private namespaceSigID: number = -1;                                     // 本命名空间 NamespaceSigID

    private exportInfos: Map<string, ExportInfo>;                            // 命名空间内的 export
    private defaultClassSigID: number = -1;                                  // %dflt 的 ClassSigID
    private topNamespaceSigIDs?: Int32Array;                                 // 直接子命名空间 NamespaceSigID 索引
    private topClassSigIDs?: Int32Array;                                     // 直接成员类 ClassSigID 索引

    private anonymousClassNumber: number = 0;                                // 用于 %AC<n>$<owner> 命名
    private anonymousNamespaceNumber: number = 0;
}
```

| 字段 | 含义 |
|------|------|
| `declaringFileID` | 反向定位所属文件（`getDeclaringArkFile()` 经 Registry 反查） |
| `declaringNamespaceSigID` | 父命名空间；顶层命名空间为 `undefined` |
| `defaultClassSigID` | 命名空间作用域 `%dflt` 类的 ClassSigID，承载独立函数、顶层变量、`type` 别名等 |
| `topNamespaceSigIDs` | **仅直接** 子命名空间的 SigID 索引；递归全部用 `getAllNamespacesUnderThisNamespace()` |
| `topClassSigIDs` | 直接成员类的 SigID 索引；同上递归用 `getAllClassesUnderThisNamespace()` |
| `exportInfos` | 命名空间内的 `export` / `export from` 项 |
| `originFullPositions` | 同名命名空间合并时按出现顺序累加，每段保留独立起始位置 |

`NamespaceSignature` 形如 `@Pkg/File: NS1.NS2`（嵌套以 `.` 拼接），与命名空间内成员签名前缀一致。

## 4. 主要接口

### 标识与归属

| 方法 | 说明 |
|------|------|
| `getName(): string` | 等价 `getSignature().getNamespaceName()` |
| `getSignature(): NamespaceSignature` / `getNamespaceSignature()` / `setSignature(s)` | 全局签名 |
| `getDeclaringArkFile() / setDeclaringFileID(id)` | 所属文件（getter 经 Registry 按 FileSigID 反查；对象 setter 已废弃） |
| `getDeclaringArkNamespace() / setDeclaringNamespaceID(id)` | 父命名空间（同上，按 NamespaceSigID 反查） |
| `getDeclaringInstance(): ArkFile \| ArkNamespace` | 直接外层（经 Registry 反查后判定） |
| `getLanguage(): Language` | 等价 `getDeclaringArkFile().getLanguage()` |
| `getOriginFullPositions(): FullPosition[] / setOriginFullPositions(arr)` | 所有段的完整位置（`getCode`/`getLine` 等旧 API 已废弃，源码统一存储在 `ArkFile` 上） |

### 子命名空间

| 方法 | 说明 |
|------|------|
| `addNamespace(ns: ArkNamespace)` | 加入；同名时**就地合并**子内容 |
| `getNamespace(sig): ArkNamespace \| null` / `getNamespaceWithName(name)` | 仅查直接子命名空间 |
| `getNamespaces(): ArkNamespace[]` | 直接子命名空间列表 |
| `getAllNamespacesUnderThisNamespace(): ArkNamespace[]` | 递归取所有后代命名空间 |
| `removeNamespace(ns): boolean` | 同步从 Scene 中删除 |
| `getAnonymousNamespaceNumber(): number` | 自增计数器，用于命名匿名命名空间 |

### 类与默认类

| 方法 | 说明 |
|------|------|
| `addArkClass(c)` | 加入 |
| `getClass(sig): ArkClass \| null` / `getClassWithName(name)` | 直接成员类查询 |
| `getClasses(): ArkClass[]` | 直接成员类列表 |
| `getAllClassesUnderThisNamespace(): ArkClass[]` | 递归取所有后代类（含子命名空间） |
| `getAllMethodsUnderThisNamespace(): ArkMethod[]` | 递归取所有方法 |
| `getDefaultClass(): ArkClass / setDefaultClass(c)` | 默认类 `%dflt` |
| `getAnonymousClassNumber(): number` | 自增计数器，用于 `%AC<n>$<owner>` 命名 |
| `removeArkClass(c): boolean` | 同步从 Scene 中删除 |

### 导出（Export）

| 方法 | 说明 |
|------|------|
| `getExportInfos(): ExportInfo[]` | 该命名空间所有显式 `export` 项；已过滤无来源的 `export *` 通配项 |
| `getExportInfoBy(name): ExportInfo \| undefined` | 按名查 |
| `addExportInfo(info)` | 在构建期登记 |
| `getExportType(): ExportType` | 恒返回 `ExportType.NAME_SPACE` |

### 杂项

| 方法 | 说明 |
|------|------|
| `validate(): ArkError` | 必填字段检查（`declaringArkFile`、`declaringInstance`、`namespaceSignature`、`defaultClass`） |

## 5. 使用示例

```typescript
import {
    Scene, SceneConfig,
    ArkNamespace, ClassCategory,
} from 'arkanalyzer';

const config = new SceneConfig();
config.buildFromProjectDir('tests/resources/save');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes();

function dumpNamespace(ns: ArkNamespace, indent = ''): void {
    console.log(`${indent}namespace ${ns.getSignature()}`);

    // 直接成员类
    for (const cls of ns.getClasses()) {
        const cat = ClassCategory[cls.getCategory()];
        console.log(`${indent}  [${cat}] ${cls.getName()}`);
    }

    // 默认类的独立函数
    const dflt = ns.getDefaultClass();
    for (const m of dflt.getMethods()) {
        if (!m.isDefaultArkMethod()) {
            console.log(`${indent}  fn ${m.getName()}(${m.getParameters().length})`);
        }
    }

    // exports
    for (const exp of ns.getExportInfos()) {
        console.log(`${indent}  export ${exp.getExportClauseName()}`);
    }

    // 递归
    for (const sub of ns.getNamespaces()) {
        dumpNamespace(sub, indent + '  ');
    }
}

for (const arkFile of scene.getFiles()) {
    for (const ns of arkFile.getNamespaces()) {
        dumpNamespace(ns);
    }
}

// 直接拿到一个命名空间下所有后代类（跨嵌套）：
const shapes = scene.getFiles()[0].getNamespaceWithName('Shapes');
if (shapes) {
    console.log('all descendant classes:', shapes.getAllClassesUnderThisNamespace().length);
}
```

> 完整可运行示例可参考：[tests/samples/SceneTest.ts](../../tests/samples/SceneTest.ts) 与命名空间相关单测 [tests/unit/save/](../../tests/unit/save/)。
