# ArkFile

## 1. 概述

**`ArkFile`** 是 ArkAnalyzer 中"源文件"的抽象——每一个被纳入 [`Scene`](./Scene.md) 的源文件都对应一个 `ArkFile` 实例。它把文件级别的信息（绝对路径、源码、AST、语言种类、import / export 列表）与文件内部的所有 [`ArkClass`](./ArkClass.md) / [`ArkNamespace`](./ArkNameSpace.md) 串联起来，并通过 [`FileSignature`](#3-核心数据结构) 全局唯一标识。

每个 `ArkFile` 隐式拥有一个 **默认类 `%dflt`**（`defaultClass`）：承载文件顶层的独立函数、顶层变量、`type` 别名、export 桥接等所有不属于具体类 / 命名空间的成员。这一约定让"独立函数"与"类成员方法"在 IR 中有完全相同的呈现形式，简化了下游分析。

## 2. ArkIR

### 2.1 普通 TS 文件

```typescript
// 源码 — abc.ts
export class A {
    foo(): number { return 1; }
}

function bar() { return 2; }
let x = 3;
```

```typescript
// ArkIR
ArkFile @MyApp/abc.ts (TYPESCRIPT) {
  Imports:
    (空)
  Exports:
    A
  Classes:
    class A {
      Methods:
        foo(): number { ... }
    }
    class %dflt {                          // 文件的默认类
      Fields:
        x: number = 3
      Methods:
        bar(): number { ... }
        %dflt(): void { ... }              // 文件顶层执行（含 x = 3）
    }
}
```

### 2.2 含 import / export from 的文件

```typescript
// 源码 — main.ts
import { A } from './abc';
import * as ns from './abc';
export { default as Default } from './abc';

let a = new A();
```

```typescript
// ArkIR
ArkFile @MyApp/main.ts (TYPESCRIPT) {
  Imports:
    A      from './abc'
    ns (*) from './abc'
  Exports:
    Default re-export of default from './abc'
  Classes:
    class %dflt {
      Methods:
        %dflt(): void {
          %0 = new @MyApp/abc.ts: A
          %0 = instanceinvoke %0.<@MyApp/abc.ts: A.constructor()>()
          a = %0
          return
        }
    }
}
```

### 2.3 含命名空间的文件

```typescript
// 源码 — namespaces.ts
namespace Validation { export class LettersValidator { ... } }
namespace Shapes { export namespace Polygons { export class Circle {} } }
```

```typescript
// ArkIR
ArkFile @save/namespaces.ts (TYPESCRIPT) {
  Namespaces:
    namespace Validation { ... }
    namespace Shapes {
      Namespaces:
        namespace Polygons { ... }
      Classes:
        class %dflt { ... }
    }
  Classes:
    class %dflt { ... }
}
```

> 注意：`ArkFile.getNamespaces()` 仅返回**直接子命名空间**；要递归取所有后代用 `getAllNamespacesUnderThisFile()`。

## 3. 核心数据结构

```typescript
// src/core/model/ArkFile.ts
export class ArkFile {
    private language: Language;                                 // 语言种类
    private absoluteFilePath: string = '';                      // 文件绝对路径
    private projectDir: string = '';                            // 项目根
    private code: string = '';                                  // 全文源码

    private defaultClass!: ArkClass;                            // %dflt
    private namespaces: Map<string, ArkNamespace>;              // 直接子命名空间
    private classes: Map<string, ArkClass>;                     // 直接成员类（不含命名空间内）

    private importInfoMap: Map<string, ImportInfo>;             // import 表
    private exportInfoMap: Map<string, ExportInfo>;             // export 表

    private scene!: Scene;                                      // 反向指向 Scene
    private moduleScene?: ModuleScene;                          // 鸿蒙 module 的反向引用
    private fileSignature: FileSignature = FileSignature.DEFAULT;

    private ohPackageJson5Path: string[] = [];                  // 鸿蒙 oh-package.json5
    private anonymousClassNumber: number = 0;
    private anonymousNamespaceNumber: number = 0;
    private ast: ts.SourceFile | null = null;                   // 原始 TS AST，可被 Scene 释放
}
```

### `Language` 枚举

| 枚举值 | 值 | 说明 |
|--------|----|------|
| `TYPESCRIPT` | 0 | 普通 TS（包括 .ts / .tsx） |
| `ARKTS1_1` | 1 | ArkTS 1.1（HarmonyOS API 9–10） |
| `ARKTS1_2` | 2 | ArkTS 1.2（API 11+，引入更多严格语义） |
| `JAVASCRIPT` | 3 | 纯 JS / .mjs |
| `CXX` | 4 | C / C++（鸿蒙 native 模块） |
| `ABC` | 5 | ArkCompiler bytecode 直接产物 |
| `UNKNOWN` | -1 | 兜底 |

> 语言由 `SceneConfig` 在文件扫描阶段根据扩展名 + 工程结构推断，并在 `ArkFile` 构造时注入。

### `FileSignature`

```typescript
// src/core/model/ArkSignature.ts
export class FileSignature {
    private projectName: string;
    private fileName: string;     // 项目内相对路径（POSIX 风格）
}
```

`toString()` 形如 `@ProjectName/relative/path/file.ts`，与 IR 中所有跨文件签名前缀一致（如 `<@ProjectName/file.ts: ClassName>`）。

### import / export 数据结构

| 字段 | 含义 |
|------|------|
| `importInfoMap` | 按"导入子句名"索引 `ImportInfo`；CXX 场景下会把 SDK / libc++ 标准头排序到末尾 |
| `exportInfoMap` | 按"导出子句名"索引 `ExportInfo`；`getExportInfoBy('B.C.D')` 支持嵌套命名空间链路解析 |

### 默认类 `%dflt`

每个 `ArkFile` 必有一个 `defaultClass: ArkClass`（`getName() === '%dflt'`，类别 `CLASS`）。它持有：

- 顶层独立函数（作为该类的实例方法）。
- 文件级 `let` / `const` / `var`（作为该类的实例字段，初始化语句搬到 `%dflt.%dflt()` 方法体）。
- 顶层 `type T = …` 别名（在默认方法的 `aliasTypeMap` 中）。
- 顶层执行语句（按 IR 转换为 ArkAssignStmt / ArkInvokeStmt 装入 `%dflt.%dflt()`）。

## 4. 主要接口

### 标识与基本属性

| 方法 | 说明 |
|------|------|
| `getName(): string` | 等价 `fileSignature.getFileName()`（项目内相对路径） |
| `getFileSignature(): FileSignature` / `setFileSignature(s)` | 全局签名 |
| `getLanguage(): Language` / `setLanguage(l)` | 文件语言 |
| `getFilePath(): string` / `setFilePath(p)` | **绝对路径** |
| `getProjectDir(): string` / `setProjectDir(d)` | 项目根目录 |
| `getProjectName(): string` | 等价 `fileSignature.getProjectName()` |
| `getModuleName(): string \| undefined` | 鸿蒙 module 名（来自 `ModuleScene`） |
| `getCode(): string` / `setCode(s)` | 全文源码 |
| `getAST(): ts.SourceFile \| null` / `setAST(ast)` | TypeScript AST，构建完成后 Scene 可主动释放以省内存 |
| `getOhPackageJson5Path() / setOhPackageJson5Path(arr)` | `oh-package.json5` 路径列表（鸿蒙模块） |
| `getScene(): Scene` / `setScene(s)` | 反向引用 |
| `getModuleScene(): ModuleScene \| undefined` / `setModuleScene(ms)` | 鸿蒙 module 反向 |

### 类与命名空间

| 方法 | 说明 |
|------|------|
| `getDefaultClass(): ArkClass` / `setDefaultClass(c)` | 默认类 `%dflt` |
| `addArkClass(c, originName?)` | 加入；嵌套类按 originName 索引一份 |
| `getClassWithName(name): ArkClass \| null` | 按名查；**先查顶层**，再递归命名空间 |
| `getClass(sig): ArkClass \| null` | 按签名查 |
| `getClasses(): ArkClass[]` | 直接成员类（不含命名空间内） |
| `removeArkClass(c): boolean` | 同步从 Scene 中删除 |
| `addNamespace(ns)` | 加入直接子命名空间 |
| `getNamespaceWithName(name) / getNamespace(sig)` | 直接子命名空间查询 |
| `getNamespaces(): ArkNamespace[]` | 直接子命名空间列表 |
| `getAllNamespacesUnderThisFile(): ArkNamespace[]` | 递归取所有后代命名空间（含嵌套） |
| `removeNamespace(ns): boolean` | 同步从 Scene 中删除 |
| `getAnonymousClassNumber(): number` / `getAnonymousNamespaceNumber(): number` | 自增计数器 |

### import / export

| 方法 | 说明 |
|------|------|
| `getImportInfos(): ImportInfo[]` | 该文件的所有 import；CXX 场景下 SDK 标准头会排到后面 |
| `getImportInfoBy(name): ImportInfo \| undefined` | 按导入子句名查 |
| `addImportInfo(info)` / `removeImportInfo(info): boolean` | 增删 |
| `getExportInfos(): ExportInfo[]` | 该文件的所有 export；过滤无来源的 `export *` 通配项 |
| `getExportInfoBy(name): ExportInfo \| undefined` | 按导出子句名查；支持 `'B.C.D'` 嵌套链路 |
| `addExportInfo(info, key?)` / `removeExportInfo(info, key?)` | 增删，可指定自定义 key |

## 5. 使用示例

下例展示如何遍历 Scene 中所有 `ArkFile`，按语言分类，并打印 import / export 概要。

```typescript
import {
    Scene, SceneConfig,
    ArkFile, Language,
} from 'arkanalyzer';

const config = new SceneConfig();
config.buildFromProjectDir('tests/resources/save');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes();

for (const arkFile of scene.getFiles()) {
    const lang = Language[arkFile.getLanguage()];
    const sig = arkFile.getFileSignature().toString();
    console.log(`[${lang}] ${sig}  (${arkFile.getFilePath()})`);

    // import
    for (const imp of arkFile.getImportInfos()) {
        console.log(`  import ${imp.getImportClauseName()} from '${imp.getFrom()}'`);
    }

    // export
    for (const exp of arkFile.getExportInfos()) {
        const from = exp.getFrom() ? ` from '${exp.getFrom()}'` : '';
        console.log(`  export ${exp.getExportClauseName()}${from}`);
    }

    // 直接成员类（不含命名空间内）
    const directClasses = arkFile.getClasses().length;
    const allClasses = directClasses
        + arkFile.getAllNamespacesUnderThisFile()
            .reduce((acc, ns) => acc + ns.getClasses().length, 0);
    console.log(`  classes: direct=${directClasses}  total(incl. namespaces)=${allClasses}`);

    // 默认类 / 顶层执行
    const dflt = arkFile.getDefaultClass();
    const dfltMethod = dflt.getDefaultArkMethod();
    if (dfltMethod?.getCfg()) {
        console.log(`  top-level stmts: ${dfltMethod.getCfg()!.getStmts().length}`);
    }
}

// 通过 FileSignature 直接拿到一个 ArkFile：
const sig = scene.getFiles()[0].getFileSignature();
const sameFile = scene.getFile(sig);
console.log(sameFile?.getName());
```

> 完整可运行示例可参考：[tests/samples/SceneTest.ts](../../tests/samples/SceneTest.ts)。命令行查看每个文件的 IR 文本：`npx arkanalyzer ir <project> -f text -o ./out`，会按 `getFileSignature()` 的 `@Pkg/relative/path` 输出对应的 .ir 文本文件。
