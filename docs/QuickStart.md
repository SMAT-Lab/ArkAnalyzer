# ArkAnalyzer 快速入门指南

[TOC]

## 1. ArkAnalyzer 简介

ArkAnalyzer 是针对基于 ArkTS 语言开发的鸿蒙原生应用的静态代码分析框架。下图展示了其基本工作原理，对于输入的 ArkTS 项目，ArkAnalyzer 会先为其生成一个抽象语法树（AST），接着遍历这颗语法树并生成一个 Scene数据结构。这个 Scene 数据结构对代码结构进行了抽象，用户可通过该数据结构快速获取 ArkTS 项目中某个具体的类、函数或者属性。接下来，ArkAnalyzer 为每一个函数生成一个控制流程图（CFG），用户可基于此图进行控制流相关的分析。基于 CFG，ArkAnalyzer 进一步实现方法调用图的生成（CallGraph），并基于此支持用户实现数据流分析。

![ArkAnalyzer 基本工作原理](./images/1-arkanalyzer-workflow.png)

### 1.1 Scene 数据结构

Scene 是 ArkAnalyzer 的核心数据结构，它是对整个项目的抽象表示。Scene 包含了项目中所有的文件、类、方法、命名空间等信息，是进行静态分析的基础。

![Scene结构](./images/3-scene-struct-model.png)
**Scene 的主要作用**：

- **项目结构抽象**：将整个项目的代码结构组织成层次化的数据结构
- **全局上下文管理**：提供项目全局上下文，支持跨文件引用解析
- **统一访问接口**：通过 Scene 可以快速访问项目中的任意文件、类、方法等

### 1.2 多语言支持
除了 ArkTS 之外，ArkAnalyzer 还支持 TypeScript、JavaScript 以及 C/C++ 作为输入。通过将不同语言统一转换为三地址码形式的中间表示（ArkAnalyzer-IR，简称 ArkIR），ArkAnalyzer 构建统一的 Scene 数据结构，并在此基础上形成一系列静态分析能力。

各语言的具体支持范围与功能细节请参考 [ArkAnalyzer 各语言支持详细说明](./MultiLanguageSupport.md) 。

### 1.3 应用场景

作为底层程序分析框架，ArkAnalyzer 已在多个面向 OpenHarmony 应用的分析项目中得到实际落地和验证，能够支撑不同场景下的程序分析需求，典型应用包括：

• [HomeFlow](https://gitcode.com/openharmony-sig/homeflow)：面向 OpenHarmony 应用的深度数据流分析工具，基于IFDS框架实现，主要提供资源泄露分析和数据泄露检测能力。

• [HomeCheck](https://gitcode.com/openharmony-sig/homecheck)：面向 OpenHarmony 应用代码缺陷扫描的自动化程序分析工具，已作为核心程序分析引擎集成至鸿蒙官方 IDE DevEco Studio，作为代码扫描工具 CodeLinter 的重要组成部分服务广大鸿蒙开发者。

在实际使用中，ArkAnalyzer 支持通过 npm 依赖 或 源码引用 两种方式进行集成。具体集成方法可参考 [ArkAnalyzer 集成说明](./QuickStart.md#26-集成-arkanalyzer)

## 2. 环境配置

### 2.1 前置要求

1. **Node.js**: 从 [Node.js官网](https://nodejs.org/en/download/current) 下载并安装（推荐使用最新LTS版本）
2. **TypeScript**: 通过npm全局安装
   ```shell
   npm install -g typescript
   ```
3. **IDE**: 推荐使用 [Visual Studio Code](https://code.visualstudio.com/download)

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

### 2.6 集成 ArkAnalyzer
如果需要在自己的项目中使用 ArkAnalyzer，可以通过 npm 依赖或源码引用两种方式进行集成。
1. **通过 npm 依赖引入**

   在项目的 `package.json` 中，通过 `dependencies` 字段添加 ArkAnalyzer 依赖：

   ```json
   {
       "dependencies": {
           "arkanalyzer": "^1.0.8"  //版本号根据实际情况修改
       }
   }
   ```

   在项目根目录下执行以下命令以安装依赖：

   ```shell
   npm install arkanalyzer
   ```

2. **通过源码方式引入**

   如果需要基于源码进行开发或调试，也可以将 `Arkanalyzer` 以源码形式引入项目，例如作为子模块或本地依赖。在 `tsconfig.json` 中添加以下配置：

   ```json
   {
       "compilerOptions": {
           "paths": {
               "@ArkAnalyzer/*": ["../arkanalyzer/*"]
           }
       }
   }
   ```

   完成配置后，即可在项目中通过模块名直接引用 Arkanalyzer 相关接口。


## 3. Scene 结构使用样例

### 3.1 基本功能 - 构建 Scene

#### 步骤1：创建配置
ArkAnalyzer的分析对象支持指定目录（适合简单测试）或指定鸿蒙应用工程。如果指定鸿蒙工程，ArkAnalyzer会额外读取工程配置信息，这里需要首先构建如下的JSON指定工程目录和SDK目录信息：

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
import { SceneConfig, Scene } from 'src/index'; //index.ts的相对目录

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
import { Scene, SceneConfig, DEFAULT_ARK_CLASS_NAME, DEFAULT_ARK_METHOD_NAME } from 'src/index'; //index.ts的相对目录

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
### 4.1 控制流图（CFG）
通过 ArkMethod 的getBody()方法获取方法体，再通过getCfg()方法可以获取方法的CFG，示例如下所示。
```typescript
import { Scene, SceneConfig, DEFAULT_ARK_METHOD_NAME } from 'src/index'; //index.ts的相对目录

// 构建Scene
const config = new SceneConfig();
config.buildFromProjectDir('path/to/your/project');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes()

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
import { Scene, SceneConfig, UnknownType } from 'src/index'; //index.ts的相对目录

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
import { Scene, SceneConfig, DEFAULT_ARK_METHOD_NAME } from 'src/index'; //index.ts的相对目录

// 构建Scene
const config = new SceneConfig();
config.buildFromProjectDir('path/to/your/project');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes()

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
1. 从入口点 `main` 方法构建

```typescript
import { Scene, SceneConfig, CallGraph, CallGraphBuilder, CallGraphNode, MethodSignature, DEFAULT_ARK_CLASS_NAME } from 'src/index'; //index.ts的相对目录

// 构建Scene
const config = new SceneConfig();
config.buildFromProjectDir('path/to/your/project');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes()

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
    console.log(`  调用者数量: ${cgNode.getIncomingEdge().size}`);
    console.log(`  被调用方法数量: ${cgNode.getOutgoingEdges().size}`);
}

// 4. 导出调用图（DOT格式）
callGraph.dump('out/cg.dot');
```

2. 构建完整项目的调用图

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



### 4.5 数据流分析（IFDS）

ArkAnalyzer 提供基于 IFDS 框架的过程间数据流分析能力。用户先定义具体的数据流问题，再使用求解器执行分析。下面以内置的未定义变量检测为例说明其基本使用方式。

```typescript
import { Scene, SceneConfig, ModelUtils } from 'arkanalyzer';
import { UndefinedVariableChecker, UndefinedVariableSolver } from 'arkanalyzer';

const config = new SceneConfig();
config.buildFromProjectDir('tests/resources/ifds/UndefinedVariable');

const scene = new Scene();
scene.buildSceneFromProjectDir(config);

// 获取待分析的方法
// 这里以测试资源中的第一个文件为例，取其默认类的默认方法作为起点
const defaultMethod = scene.getFiles()[0].getDefaultClass().getDefaultArkMethod();
const method = ModelUtils.getMethodWithName('u4', defaultMethod!);

if (method) {
    const blocks = [...method.getCfg()!.getBlocks()];
    // 跳过参数赋值语句，从方法体的实际入口语句开始分析
    const entryStmt = blocks[0].getStmts()[method.getParameters().length];

    // 1. 创建具体的数据流问题
    const problem = new UndefinedVariableChecker(entryStmt, method);

    // 2. 创建求解器并执行分析
    const solver = new UndefinedVariableSolver(problem, scene);
    solver.solve();

    // 3. 输出分析结果
    for (const outcome of problem.getOutcomes()) {
        const position = outcome.stmt.getOriginPositionInfo();
        console.log(`未定义变量错误: 行${position.getLineNo()}, 列${position.getColNo()}`);
        console.log(`  语句: ${outcome.stmt.toString()}`);
    }
}
```
**详细说明**：数据流分析的详细说明请参考 [IFDS 文档](./analysis/IFDS.md)

### 4.6 ArkUI ViewTree 分析

对于 ArkUI 组件（使用 `@Component` 装饰器的类），ArkAnalyzer 能够构建其组件层次结构的 ViewTree，并分析 `@State` 状态变量与组件节点的绑定关系。

```typescript
import { Scene, SceneConfig } from 'arkanalyzer';

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

// 辅助函数：计算节点深度
function getDepth(node: { parent: any }): number {
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

- **[Scene详细文档](./README.md)**：深入了解ArkAnalyzer的Scene结构、各层组件、转换过程和使用示例
- **[API文档](./api_docs/globals.md)**：完整的API参考文档

### 7.2 示例代码

- 查看 `tests/samples/` 目录下的测试用例，了解各种分析场景的实际用法
- 主要示例：
  - `SceneTest.ts` - Scene构建和遍历
  - `CfgTest.ts` - 控制流图分析
  - `DefUseChainTest.ts` - 定义-使用链分析
  - `TypeInferenceTest.ts` - 类型推导
  - `CallGraphTest.ts` - 调用图构建
  - `ReachingDefTest.ts` - 数据流分析
  - `UndefinedVariableTest.ts` - 未定义变量检测

### 7.3 相关链接

- [如何创建PR](./contributing/HowToCreatePR.md)
- [如何处理Issues](./contributing/HowToHandleIssues.md)
- [项目主页](https://gitcode.com/openharmony-sig/arkanalyzer)

## 8. 下一步

现在您已经了解了ArkAnalyzer的基本使用方法，可以：

**查看示例代码**：研究 `tests/samples/` 目录下的测试用例

祝您使用愉快！
