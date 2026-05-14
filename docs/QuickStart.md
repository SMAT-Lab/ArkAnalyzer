# ArkAnalyzer 快速入门指南

[TOC]

> **提示**：部分 Markdown 预览器不会解析 `[TOC]` 自动生成目录（例如 GitHub 网页预览）。可使用编辑器自带的大纲视图，或直接浏览下文各级标题。

## 1. ArkAnalyzer 简介

ArkAnalyzer 面向基于 **ArkTS** 的鸿蒙原生应用（以及其它前端支持的源码），提供静态代码分析基础设施：**输入**一个工程目录或标准化配置，**输出**可供程序访问的中间模型与分析结果。

典型的工程流程如下（详见插图）。

1. **解析**：从源码构造抽象语法树（AST）。
2. **Scene**：遍历 AST，生成 **Scene**——项目在内存中的结构化视图（文件、类、方法、命名空间等），并完成类型推导。
3. **CFG**：对每个方法构造控制流图（CFG），刻画执行路径与基本块。
4. **调用图**：在 CFG 等基础上构建调用图（Call Graph），刻画调用关系。
5. **其它分析**：在此之上可实现类型检查、Def-Use、指针分析等高阶静态程序分析及可视化导出。

ArkAnalyzer 基本工作原理

**术语速览**

- **Scene**：整个工程的「结构化快照」，便于按文件 / 类 / 方法遍历与查询。
- **CFG（控制流图）**：单个方法内部的控制流结构（基本块与跳转）。
- **调用图（Call Graph/CG）**：方法之间的调用关系图，常用于过程间分析的输入。

### 1.1 Scene 数据结构

Scene 是 ArkAnalyzer 的核心数据结构，是对整个项目的抽象表示；包含文件、类、方法、命名空间等元数据，是绝大多数静态分析的起点。

Scene结构
**Scene 的主要作用**：

- **项目结构抽象**：将整个项目的代码结构组织成层次化的数据结构
- **全局上下文管理**：提供项目全局上下文，支持跨文件引用解析
- **统一访问接口**：通过 Scene 可以快速访问项目中的任意文件、类、方法等

### 1.2 多语言支持

除了 ArkTS 之外，ArkAnalyzer 还支持 TypeScript、JavaScript 以及 C/C++ 作为输入。通过将不同语言统一转换为三地址码形式的中间表示（ArkAnalyzer-IR，简称 ArkIR），ArkAnalyzer 构建统一的 Scene 数据结构，并在此基础上形成一系列静态分析能力。

各语言的具体支持范围与功能细节请参考 [ArkAnalyzer 各语言支持详细说明](./MultiLanguageSupport.md) 。

### 1.3 应用场景

作为底层程序分析框架，ArkAnalyzer 已在多个面向 OpenHarmony 应用的分析项目中得到验证，典型应用包括：

- [HomeFlow](https://gitcode.com/openharmony-sig/homeflow)：面向 OpenHarmony 应用的深度数据流分析工具（常见实现基于 IFDS 思路），侧重资源泄露与数据泄露等场景。
- [HomeCheck](https://gitcode.com/openharmony-sig/homecheck)：面向 OpenHarmony 应用的缺陷扫描工具；作为程序分析引擎集成于 DevEco Studio 的 CodeLinter。

在实际使用中，可通过 **npm 依赖**或**源码路径映射**集成 ArkAnalyzer；详见下文 **「集成 ArkAnalyzer」**（第 2.6 节）。

## 2. 环境配置

### 2.1 前置要求

1. **Node.js**：从 [Node.js 官网](https://nodejs.org/en/download/current) 下载并安装（推荐最新 LTS 版本，自带 npm）。
2. **IDE**：推荐 [Visual Studio Code](https://code.visualstudio.com/download)，也可使用其他熟悉的 IDE。

> 不需要全局安装 TypeScript：本项目使用 `ohos-typescript`（已在 `devDependencies` 中），所有编译命令（`npm run build`、`npm run gendoc` 等）会自动调用本地版本，避免与全局 `tsc` 版本冲突。

### 2.2 安装依赖

```shell
# 克隆项目后，进入项目目录，安装依赖
npm install
```

### 2.3 构建项目

```shell
# 编译TypeScript代码
npm run build
```

### 2.4 生成API文档（可选）

```shell
# 生成API文档到 docs/api_docs
npm run gendoc
```

### 2.5 运行第一个用例

完成环境配置后，可以运行 `tests/samples` 目录下的测试用例来快速体验ArkAnalyzer的功能。

**示例：运行控制流图分析测试**

```shell
# 用npx命令运行CfgTest（控制流图分析测试）
npx ts-node tests/samples/CfgTest.ts

# 或者用node命令
node -r ts-node/register tests/samples/CfgTest.ts
```

这个测试用例会：

1. 构建一个示例项目的Scene
2. 执行类型推导
3. 遍历所有方法，打印每个方法的控制流图（基本块和语句）
4. 显示基本块之间的控制流关系

**测试用例说明**：

```typescript
// tests/samples/CfgTest.ts 的核心代码
import { SceneConfig, Scene, DEFAULT_ARK_METHOD_NAME, Logger, LOG_LEVEL, LOG_MODULE_TYPE } from '../../src';

const logger = Logger.getLogger(LOG_MODULE_TYPE.TOOL, 'CfgTest');
Logger.configure('', LOG_LEVEL.ERROR, LOG_LEVEL.INFO, false);

// 1. 构建Scene
const config = new SceneConfig();
config.buildFromProjectDir("tests/resources/cfg/for");
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes();

// 2. 遍历所有方法并分析CFG
for (const arkFile of scene.getFiles()) {
    for (const arkClass of arkFile.getClasses()) {
        for (const arkMethod of arkClass.getMethods()) {
            if (arkMethod.getName() == DEFAULT_ARK_METHOD_NAME) {
                continue;  // 跳过默认方法
            }
            
            const body = arkMethod.getBody();
            const blocks = [...body!.getCfg().getBlocks()];
            
            // 打印每个基本块及其语句
            for (let i = 0; i < blocks.length; i++) {
                const block = blocks[i];
                logger.info("block" + i);
                for (const stmt of block.getStmts()) {
                    logger.info("  " + stmt.toString());
                }
                
                // 打印控制流边
                let text = "next:";
                for (const next of block.getSuccessors()) {
                    text += blocks.indexOf(next) + ' ';
                }
                logger.info(text);
            }
        }
    }
}
```

**其他部分可运行的测试用例**：

- `DefUseChainTest.ts` - 定义-使用链（def-use chain）分析
- `TypeInferenceTest.ts` - 类型推导测试
- `SceneTest.ts` - Scene 构建和遍历
- `CallGraphTest.ts` - 调用图（Call Graph, CG）构建

更多测试用例请查看 `tests/samples/` 目录。

**推荐阅读顺序（初学者）**

1. 运行本节 `CfgTest`，建立对 CFG 输出的直观印象。
2. 阅读第 3 节，掌握 Scene 构建与项目遍历。
3. 按需跳到第 4 节各小节（CFG、类型、Def-Use、调用图、数据流、ViewTree）。

### 2.6 集成 ArkAnalyzer

如果需要在自己的项目中使用 ArkAnalyzer，可以通过 npm 依赖或源码引用两种方式进行集成。

1. **通过 npm 依赖引入**
  在项目的 `package.json` 中，通过 `dependencies` 字段添加 ArkAnalyzer 依赖：
   发布版本以 [npm 上的 `arkanalyzer](https://www.npmjs.com/package/arkanalyzer)` 为准；若需特定补丁号，请将上述版本区间改为实际可用版本。
   在项目根目录下执行以下命令以安装依赖：
2. **通过源码方式引入**
  如果需要基于源码进行开发或调试，也可以将 `arkanalyzer` 以源码形式引入项目，例如作为子模块或本地依赖。在 `tsconfig.json` 中添加以下配置：
   完成配置后，即可在项目中以 `import { ... } from 'arkanalyzer'` 形式直接引用相关接口——与 npm 安装方式完全一致。

> **示例代码的 import 约定**：以下第 3、4、5 节的示例统一使用 `from 'arkanalyzer'`。若以源码方式集成，请配置上文中的 `paths`，或改写为相对路径（例如 `from '../arkanalyzer/src/index'`）。

## 3. Scene 结构使用样例

### 3.1 基本功能 - 构建 Scene

#### 步骤1：创建配置

分析对象可以是 **普通源码目录**（适合学习与小型示例），也可以是 **鸿蒙 / OpenHarmony 应用工程**。前者可直接用 API 指向目录；后者通常需要通过 JSON **声明工程根路径与 SDK 路径**，以便解析模块与依赖。

若为鸿蒙工程，请先准备类似下方的配置文件：

**配置文件示例** (`config.json`):

```json
{
  "targetProjectName": "MyProject",
  "targetProjectDirectory": "path/to/project",
  "sdks": [
    {
      "name": "etsSdk",
      "path": "path/to/sdk",
      "moduleName": ""
    }
  ],
  "options": {
    "supportFileExts": [".ets", ".ts"],
    "enableBuiltIn": true
  }
}
```

#### 步骤2：构建Scene

```typescript
import { SceneConfig, Scene } from 'arkanalyzer';

// 方式1：从项目目录构建配置
const config = new SceneConfig();
config.buildFromProjectDir('path/to/your/project');

// 方式2：从JSON文件构建配置
const config = new SceneConfig();
config.buildFromJson('path/to/config.json');

// 创建Scene对象
const scene = new Scene();

// 方式1：从项目目录构建（适用于简单项目）
scene.buildSceneFromProjectDir(config);

// 方式2：构建OpenHarmony项目（支持模块化）
scene.buildBasicInfo(config);
scene.buildScene4HarmonyProject();
```

#### 步骤3：执行类型推导

```typescript
// 执行全局类型推导（推荐在分析前执行）
scene.inferTypes();
```

### 3.2 基本示例：遍历项目结构

```typescript
import { Scene, SceneConfig, DEFAULT_ARK_CLASS_NAME, DEFAULT_ARK_METHOD_NAME } from 'arkanalyzer';

// 构建Scene
const config = new SceneConfig();
config.buildFromProjectDir('tests/resources/example');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes();

// 遍历所有文件
for (const arkFile of scene.getFiles()) {
    console.log(`文件: ${arkFile.getName()}`);
    
    // 遍历文件中的所有类
    for (const arkClass of arkFile.getClasses()) {
        // 跳过默认类（可选）
        if (arkClass.getName() === DEFAULT_ARK_CLASS_NAME) {
            continue;
        }
        
        console.log(`  类: ${arkClass.getName()}`);
        
        // 遍历类中的所有方法
        for (const arkMethod of arkClass.getMethods()) {
            // 跳过默认方法（可选）
            if (arkMethod.getName() === DEFAULT_ARK_METHOD_NAME) {
                continue;
            }
            
            console.log(`    方法: ${arkMethod.getName()}`);
            
            // 访问方法体
            const body = arkMethod.getBody();
            if (body) {
                // 获取局部变量
                body.getLocals().forEach(local => {
                    console.log(`      局部变量: ${local.getName()}, 类型: ${local.getType()}`);
                });
            }
        }
    }
}
```

**详细说明**：更多遍历和分析示例请参考 [Scene 结构详细文档](./components/Scene.md)

## 4. ArkAnalyzer 静态分析使用样例

下列示例默认你已按 **第 3.1 节** 完成 `Scene` 构建，并在分析前调用 `scene.inferTypes()`。为便于复制运行，多数代码块仍写出完整前置步骤；若已在工程中封装 Scene 初始化，可自行省略重复片段。

### 4.1 控制流图（CFG）

通过 `ArkMethod.getBody()` 取得方法体，再调用 `getCfg()` 即可得到 CFG，例如：

```typescript
import { Scene, SceneConfig, DEFAULT_ARK_METHOD_NAME } from 'arkanalyzer';

// 构建Scene
const config = new SceneConfig();
config.buildFromProjectDir('path/to/your/project');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes();

for (const method of scene.getMethods()) {
    if (method.getName() === DEFAULT_ARK_METHOD_NAME) {
        continue;
    }
    
    const body = method.getBody();
    if (!body) continue;
    
    const cfg = body.getCfg();
    const blocks = [...cfg.getBlocks()];
    
    // 遍历所有基本块
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        console.log(`基本块 ${i}:`);
        
        // 打印基本块中的语句
        for (const stmt of block.getStmts()) {
            console.log(`  ${stmt.toString()}`);
        }
        
        // 打印控制流边
        const successors = block.getSuccessors();
        if (successors.length > 0) {
            const nextBlocks = successors.map(succ => blocks.indexOf(succ)).join(', ');
            console.log(`  后继: ${nextBlocks}`);
        }
    }
    
    // 检测不可达基本块
    const unreachable = cfg.getUnreachableBlocks();
    if (unreachable.size > 0) {
        console.warn(`发现 ${unreachable.size} 个不可达基本块`);
    }
}
```

**详细说明**：CFG的详细结构和使用方法请参考 [CFG 详细说明](./components/CFG.md)

### 4.2 类型推导和分析

```typescript
import { Scene, SceneConfig, UnknownType } from 'arkanalyzer';

// 构建Scene
const config = new SceneConfig();
config.buildFromProjectDir('path/to/your/project');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);

// 执行类型推导
scene.inferTypes();

// 分析局部变量类型
for (const method of scene.getMethods()) {
    const body = method.getBody();
    if (!body) continue;
    
    body.getLocals().forEach(local => {
        const type = local.getType();
        console.log(`变量 ${local.getName()}: ${type.toString()}`);
        
        // 检测未知类型
        if (type instanceof UnknownType) {
            console.warn(`  警告: ${local.getName()} 的类型未知`);
        }
    });
}
```

**详细说明**：类型推导的详细说明请参考 [类型推导和分析文档](./analysis/TypeInference.md)

### 4.3 定义-使用链分析

```typescript
import { Scene, SceneConfig, DEFAULT_ARK_METHOD_NAME } from 'arkanalyzer';

// 构建Scene
const config = new SceneConfig();
config.buildFromProjectDir('path/to/your/project');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes();

for (const method of scene.getMethods()) {
    if (method.getName() === DEFAULT_ARK_METHOD_NAME) {
        continue;
    }

    const body = method.getBody();
    if (!body) continue;

    const cfg = body.getCfg();

    // 构建定义-使用链
    cfg.buildDefUseChain();
    
    // 遍历所有定义-使用链
    for (const chain of cfg.getDefUseChains()) {
        console.log(`变量: ${chain.value.toString()}`);
        console.log(`  定义: ${chain.def.toString()}`);
        console.log(`  使用: ${chain.use.toString()}`);
        
        // 获取源码位置
        const defPos = chain.def.getOriginPositionInfo();
        const usePos = chain.use.getOriginPositionInfo();
        console.log(`  定义位置: 行${defPos.getLineNo()}, 列${defPos.getColNo()}`);
        console.log(`  使用位置: 行${usePos.getLineNo()}, 列${usePos.getColNo()}`);
    }
}
```

**详细说明**：定义-使用链的详细说明请参考 [Def-Use Chain 构建和分析文档](./analysis/Def-Use%20Chain.md)

### 4.4 调用图（CG）构建

调用图质量高度依赖 **入口方法集合**。下文「从 `main` 起步」仅便于演示最小工程；真实鸿蒙应用中入口常为 Ability、`UIAbility`、`@Entry` 等与页面生命周期相关的符号，请按实际工程裁剪入口或直接使用下一小节的「全项目 CHA」。详见 [调用图文档](./analysis/CallGraph.md)。

1. 从入口点 `main` 方法构建

```typescript
import { Scene, SceneConfig, CallGraph, CallGraphBuilder, CallGraphNode, MethodSignature, DEFAULT_ARK_CLASS_NAME } from 'arkanalyzer';

// 构建Scene
const config = new SceneConfig();
config.buildFromProjectDir('path/to/your/project');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes();

// 1. 确定入口点
const entryPoints: MethodSignature[] = [];

// 从main方法开始
for (const file of scene.getFiles()) {
    if (file.getName() === 'main.ts') {
        for (const cls of file.getClasses()) {
            if (cls.getName() === DEFAULT_ARK_CLASS_NAME) {
                for (const method of cls.getMethods()) {
                    if (method.getName() === 'main') {
                        entryPoints.push(method.getSignature());
                    }
                }
            }
        }
    }
}

// 2. 构建调用图
const callGraph = new CallGraph(scene);
const builder = new CallGraphBuilder(callGraph, scene);

// 使用类层次分析（CHA）构建调用图
builder.buildClassHierarchyCallGraph(entryPoints, false);

// 或者使用快速类型分析（RTA）
// builder.buildRapidTypeCallGraph(entryPoints, false);

// 3. 分析调用图
console.log(`调用图统计: ${callGraph.getStat()}`);
console.log(`入口点数量: ${callGraph.getEntries().length}`);

// 遍历调用图节点
for (const node of callGraph.getNodesIter()) {
    const cgNode = node as CallGraphNode;
    console.log(`方法: ${cgNode.getMethod().toString()}`);
    // 注意：getIncomingEdge() / getOutgoingEdges() 在节点没有边时返回 undefined
    console.log(`  调用者数量: ${cgNode.getIncomingEdge()?.size ?? 0}`);
    console.log(`  被调用方法数量: ${cgNode.getOutgoingEdges()?.size ?? 0}`);
}

// 4. 导出调用图（DOT格式）
callGraph.dump('out/cg.dot');
```

1. 构建完整项目的调用图

```typescript
import { Scene, SceneConfig, CallGraph, CallGraphBuilder } from 'arkanalyzer';

const scene = new Scene();
// ... 构建scene和类型推导 ...

// 构建调用图
let callGraph = new CallGraph(scene);
let callGraphBuilder = new CallGraphBuilder(callGraph, scene);

// 使用 CHA 构建完整项目的调用图，自动分析所有可能的入口方法
callGraphBuilder.buildCHA4WholeProject(true);

console.log('entry count: ', callGraph.getEntries().length);
callGraph.dump('out/cg.dot');
```

**详细说明**：调用图构建的详细说明请参考 [调用图构建和分析文档](./analysis/CallGraph.md)

### 4.5 数据流分析（到达定值）

当前主线对外导出 **过程内** 数据流框架（`GenericDataFlow`、`MFPDataFlowSolver`）及内置 **到达定值（Reaching Definitions）**：在每个方法上基于 CFG 语句结点计算定义的可达集合（保守近似）。完整概念与扩展方式见 [数据流分析文档](./analysis/DataFlow.md)；若你从旧文档跳转而来，亦可参阅 [IFDS（兼容说明）](./analysis/IFDS.md)。

```typescript
import {
    Scene,
    SceneConfig,
    DEFAULT_ARK_METHOD_NAME,
    ReachingDefProblem,
    MFPDataFlowSolver,
} from 'arkanalyzer';

const config = new SceneConfig();
config.buildFromProjectDir('tests/resources/reachingDef/loop');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes();

for (const method of scene.getMethods()) {
    if (method.getName() === DEFAULT_ARK_METHOD_NAME) {
        continue;
    }
    const body = method.getBody();
    if (!body?.getCfg()) {
        continue;
    }

    const problem = new ReachingDefProblem(method);
    const solver = new MFPDataFlowSolver();
    const solution = solver.calculateMopSolutionForwards(problem);

    console.log(`方法: ${method.getName()}`);
    solution.out.forEach((defs, nodeId) => {
        console.log(`  语句结点 ${nodeId}，出口到达定值数量: ${defs.count()}`);
    });
}
```

**详细说明**：参见 [数据流分析（过程内）](./analysis/DataFlow.md) 与示例 `[tests/samples/ReachingDefTest.ts](../tests/samples/ReachingDefTest.ts)`。

### 4.6 ArkUI ViewTree 分析

对于 ArkUI 组件（使用 `@Component` 装饰器的类），ArkAnalyzer 能够构建其组件层次结构的 ViewTree，并分析 `@State` 状态变量与组件节点的绑定关系。

```typescript
import { Scene, SceneConfig } from 'arkanalyzer';
import type { ViewTreeNode } from 'arkanalyzer';

const scene = new Scene();
// ... 构建scene和类型推导 ...

for (const arkFile of scene.getFiles()) {
    for (const arkClass of arkFile.getClasses()) {
        // 获取 ViewTree（仅 @Component 类拥有）
        const viewTree = arkClass.getViewTree();
        if (!viewTree) continue;

        console.log(`组件: ${arkClass.getName()}`);

        // 1. 遍历组件树
        const root = viewTree.getRoot();
        root?.walk((node) => {
            const indent = '  '.repeat(getDepth(node));
            console.log(`${indent}${node.name}`);

            // 检查节点类型
            if (node.isCustomComponent()) {
                console.log(`${indent}  → 自定义组件: ${node.signature}`);
            }
            if (node.isBuilder()) {
                console.log(`${indent}  → @Builder 方法`);
            }

            // 查看节点属性
            node.attributes.forEach((value, key) => {
                console.log(`${indent}  属性: ${key}`);
            });

            return false;  // 继续遍历
        });

        // 2. 分析 @State 变量绑定关系
        const stateValues = viewTree.getStateValues();
        stateValues.forEach((nodes, field) => {
            console.log(`@State ${field.getName()} 影响 ${nodes.size} 个组件节点`);
        });
    }
}

function getDepth(node: ViewTreeNode): number {
    let depth = 0;
    let current = node.parent;
    while (current) {
        depth++;
        current = current.parent;
    }
    return depth;
}
```

**详细说明**：ViewTree 的详细说明请参考 [ViewTree 文档](./analysis/ViewTree.md)

## 5. 输出和可视化

### 5.1 导出CFG为DOT格式

```typescript
import { Scene, SceneConfig, PrinterBuilder } from 'arkanalyzer';

const scene = new Scene();
// ... 构建scene ...

// 为每个文件生成CFG的DOT图
for (const arkFile of scene.getFiles()) {
    const printer = new PrinterBuilder();
    printer.dumpToDot(arkFile);
}
```

生成的 `.dot` 文件可以使用 [Graphviz](https://graphviz.org/) 或在线工具（如 [Graphviz Online](https://dreampuf.github.io/GraphvizOnline/)）可视化。

### 5.2 导出调用图

```typescript
// 调用图已构建后
callGraph.dump('out/cg.dot');
```

### 5.3 导出JSON格式

```typescript
import { PrinterBuilder } from 'arkanalyzer';

// 使用 PrinterBuilder 为每个文件导出 JSON
const printer = new PrinterBuilder('output');
for (const arkFile of scene.getFiles()) {
    printer.dumpToJson(arkFile);
}
```

## 6. 常见问题

### 6.1 默认类和默认方法

ArkAnalyzer 会为每个文件和命名空间创建默认类和默认方法：

- 默认类名：`%dflt` (对应常量 `DEFAULT_ARK_CLASS_NAME`)
- 默认方法名：`%dflt` (对应常量 `DEFAULT_ARK_METHOD_NAME`)

在遍历时，可以通过这些常量过滤默认类和方法：

```typescript
import { DEFAULT_ARK_CLASS_NAME, DEFAULT_ARK_METHOD_NAME } from 'arkanalyzer';

if (arkClass.getName() === DEFAULT_ARK_CLASS_NAME) {
    continue;  // 跳过默认类
}

if (arkMethod.getName() === DEFAULT_ARK_METHOD_NAME) {
    continue;  // 跳过默认方法
}
```

### 6.2 类型推导时机

建议在构建Scene后、进行分析前执行类型推导：

```typescript
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes();  // 在分析前执行类型推导
```

### 6.3 项目构建方式选择

- **简单项目**：使用 `buildSceneFromProjectDir(config)`
- **OpenHarmony项目（支持模块化）**：使用 `buildBasicInfo(config)` + `buildScene4HarmonyProject()`

## 7. 更多资源

### 7.1 详细文档

- **[文档总目录](./README.md)**：完整的核心组件、静态分析、项目级说明索引
- **[Scene 详细文档](./components/Scene.md)**：深入了解 ArkAnalyzer 的 Scene 结构、各层组件、构建过程与查询接口
- **[多语言支持说明](./MultiLanguageSupport.md)**：ArkTS / TypeScript / JavaScript / C/C++ 各前端能力差异
- **[数据流分析（过程内）](./analysis/DataFlow.md)**：`MFPDataFlowSolver`、到达定值与自定义数据流问题
- **[API 文档](./api_docs/globals.md)**：自动生成的完整 API 参考（运行 `npm run gendoc` 更新）

### 7.2 示例代码

- 查看 `tests/samples/` 目录下的测试用例，了解各种分析场景的实际用法
- 主要示例：
  - `SceneTest.ts` - Scene构建和遍历
  - `CfgTest.ts` - 控制流图分析
  - `DefUseChainTest.ts` - 定义-使用链分析
  - `TypeInferenceTest.ts` - 类型推导
  - `CallGraphTest.ts` - 调用图构建
  - `ReachingDefTest.ts` - 过程内数据流（到达定值）

### 7.3 相关链接

- [如何创建PR](./contributing/HowToCreatePR.md)
- [如何处理Issues](./contributing/HowToHandleIssues.md)
- [项目主页](https://gitcode.com/openharmony-sig/arkanalyzer)

## 8. 下一步

建议在本仓库中打开 `tests/samples/`，对照第 4 节章节顺序逐个运行或调试；遇到 API 细节时再查阅 `[docs/analysis/](./analysis/)` 专题文档或 `npm run gendoc` 生成的 API 索引。

祝您使用愉快！