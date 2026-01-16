# ArkAnalyzer 核心IR架构详细分析

## 概述

ArkAnalyzer的核心模块负责将ArkTS源代码转换为中间表示（IR）。IR采用三地址码（3AC）形式，将高级语言结构转换为适合静态分析的低级表示。本文档详细分析核心IR的各个组成部分及其协作关系。

## IR转换流程

```
ArkTS源代码 
  ↓ (AST解析)
Scene (项目结构抽象)
  ↓ (方法体构建)
ArkMethod + ArkBody
  ↓ (IR生成)
CFG (控制流图) + Statements + Expressions
  ↓ (类型推断)
类型化的IR
```

## 一、核心IR组件架构

### 1.1 Scene类 - 项目级抽象

**位置**: `src/Scene.ts`

**职责**: Scene是整个项目的顶层抽象，管理所有文件、类、方法、命名空间等结构。

**核心数据结构**:
```typescript
class Scene {
    // 文件映射
    private filesMap: Map<string, ArkFile>
    // 类映射
    private classesMap: Map<string, ArkClass>
    // 方法映射
    private methodsMap: Map<string, ArkMethod>
    // 命名空间映射
    private namespacesMap: Map<string, ArkNamespace>
    // SDK文件映射
    private sdkArkFilesMap: Map<string, ArkFile>
}
```

**在IR转换中的作用**:
- 提供项目全局上下文，支持跨文件引用解析
- 管理SDK和项目文件的依赖关系
- 支持模块化场景（ModuleScene）的构建
- 作为类型推断和调用图构建的入口

**关键方法**:
- `buildSceneFromProjectDir()`: 从项目目录构建Scene
- `buildSceneFromFiles()`: 从文件列表构建Scene
- `inferTypes()`: 执行全局类型推断
- `getMethod()`: 根据方法签名获取方法（支持跨文件查找）

### 1.2 core/base - IR基础元素

#### 1.2.1 Value接口 - 值的抽象

**位置**: `src/core/base/Value.ts`

**定义**:
```typescript
interface Value {
    getUses(): Value[]  // 获取使用的值
    getType(): Type      // 获取类型
}
```

**作用**: 所有IR中的值（变量、表达式、常量等）都实现此接口，提供统一的类型和依赖查询能力。

#### 1.2.2 Local - 局部变量

**位置**: `src/core/base/Local.ts`

**核心属性**:
```typescript
class Local implements Value {
    private name: string              // 变量名（如 "$temp0", "x"）
    private type: Type               // 变量类型
    private declaringStmt: Stmt      // 定义语句
    private usedStmts: Stmt[]        // 使用语句列表
}
```

**IR中的表示**:
- 临时变量: `$temp0`, `$temp1`, ... (三地址码中的临时变量)
- 用户变量: 保持原始名称（如 `x`, `y`）
- 特殊变量: `this`, `parameter0`, `parameter1`, ...

**特点**:
- 支持类型推断 (`inferType()`)
- 维护定义-使用关系
- 可作为ArkExport导出（全局变量）

#### 1.2.3 Expr - 表达式层次结构

**位置**: `src/core/base/Expr.ts`

**表达式类型体系**:

```
AbstractExpr (抽象基类)
├── AbstractInvokeExpr (调用表达式)
│   ├── ArkInstanceInvokeExpr (实例方法调用)
│   ├── ArkStaticInvokeExpr (静态方法调用)
│   └── ArkPtrInvokeExpr (函数指针调用)
├── ArkNewExpr (对象创建)
├── ArkNewArrayExpr (数组创建)
├── AbstractBinopExpr (二元运算)
│   ├── ArkNormalBinopExpr (普通二元运算: +, -, *, /, ...)
│   └── ArkConditionExpr (条件表达式: <, >, ==, ...)
├── ArkUnopExpr (一元运算: -, !, ~)
├── ArkCastExpr (类型转换)
├── ArkPhiExpr (SSA形式的Phi函数)
├── ArkAwaitExpr (异步等待)
└── ArkYieldExpr (生成器)
```

**IR表示示例**:

```typescript
// 源代码: obj.method(arg1, arg2)
// IR: instanceinvoke obj.<@Project/File: Class.method(Param1, Param2)>(arg1, arg2)

// 源代码: Class.staticMethod(x)
// IR: staticinvoke <@Project/File: Class.staticMethod(Param1)>(x)

// 源代码: a + b
// IR: a + b  (保持二元运算形式)

// 源代码: new MyClass()
// IR: new @Project/File: MyClass
```

**关键特性**:
- 每个表达式维护 `getUses()` 返回使用的值
- 支持类型推断 (`inferType()`)
- 支持泛型类型参数 (`realGenericTypes`)
- 支持展开参数 (`spreadFlags`)

#### 1.2.4 Ref - 引用类型

**位置**: `src/core/base/Ref.ts`

**引用类型**:

```typescript
AbstractRef
├── ArkArrayRef          // 数组引用: arr[index]
├── AbstractFieldRef     // 字段引用
│   ├── ArkInstanceFieldRef  // 实例字段: obj.field
│   └── ArkStaticFieldRef   // 静态字段: Class.field
├── ArkParameterRef      // 参数引用: parameter0, parameter1
├── ArkThisRef           // this引用
├── ArkCaughtExceptionRef // 异常捕获引用
├── GlobalRef            // 全局变量引用
└── ClosureFieldRef      // 闭包字段引用
```

**IR表示**:
```typescript
// 源代码: arr[i]
// IR: arr[i]

// 源代码: obj.field
// IR: obj.<@Project/File: Class.field>

// 源代码: Class.staticField
// IR: <@Project/File: Class.staticField>
```

#### 1.2.5 Stmt - 语句层次结构

**位置**: `src/core/base/Stmt.ts`

**语句类型**:

```typescript
Stmt (抽象基类)
├── ArkAssignStmt        // 赋值: left = right
├── ArkInvokeStmt        // 方法调用语句
├── ArkIfStmt            // 条件分支: if (condition)
├── ArkReturnStmt         // 返回: return value
├── ArkReturnVoidStmt     // 无返回值返回: return
├── ArkThrowStmt          // 抛出异常: throw exception
└── ArkAliasTypeDefineStmt // 类型别名定义: type A = B
```

**三地址码特性**:
- 每个语句最多定义一个值 (`getDef()`)
- 语句使用多个值 (`getUses()`)
- 语句关联到CFG (`getCfg()`)
- 维护源码位置信息 (`getOriginPositionInfo()`)

**IR表示示例**:
```typescript
// 源代码: let x = a + b;
// IR: 
//   $temp0 = a + b
//   x = $temp0

// 源代码: obj.method(arg);
// IR: instanceinvoke obj.<@Project/File: Class.method(Param1)>(arg)

// 源代码: if (x > 0) { ... }
// IR: if x > 0
```

#### 1.2.6 Type - 类型系统

**位置**: `src/core/base/Type.ts`

**类型层次**:

```typescript
Type (抽象基类)
├── PrimitiveType (基本类型)
│   ├── BooleanType
│   ├── NumberType
│   ├── StringType
│   ├── BigIntType
│   ├── NullType
│   └── UndefinedType
├── ClassType (类类型)
├── FunctionType (函数类型)
├── ArrayType (数组类型)
├── TupleType (元组类型)
├── UnionType (联合类型: A | B)
├── IntersectionType (交集类型: A & B)
├── AliasType (类型别名)
├── GenericType (泛型参数)
├── UnknownType (未知类型)
├── AnyType (任意类型)
└── VoidType (void类型)
```

**类型推断**:
- 支持从表达式推断类型
- 支持泛型类型参数解析
- 支持类型别名展开
- 支持联合类型和交集类型处理

### 1.3 core/model - 结构模型

#### 1.3.1 ArkMethod - 方法模型

**位置**: `src/core/model/ArkMethod.ts`

**核心属性**:
```typescript
class ArkMethod {
    private methodSignature: MethodSignature  // 方法签名
    private body: ArkBody                    // 方法体（包含CFG）
    private viewTree?: ViewTree           // UI视图树（ArkUI特有）
    private genericTypes?: GenericType[]    // 泛型参数
}
```

**方法体构建流程**:
1. 从AST解析方法声明和签名
2. 构建方法体 (`buildBody()`)
3. 生成CFG
4. 类型推断
5. 构建视图树（如果是ArkUI组件）

#### 1.3.2 ArkBody - 方法体

**位置**: `src/core/model/ArkBody.ts`

**核心结构**:
```typescript
class ArkBody {
    private locals: Map<string, Local>       // 局部变量映射
    private cfg: Cfg                         // 控制流图
    private aliasTypeMap                     // 类型别名映射
    private traps?: Trap[]                   // 异常处理陷阱
    private usedGlobals?: Map<string, Value> // 使用的全局变量
}
```

**作用**:
- 封装方法的完整IR表示
- 管理局部变量作用域
- 提供CFG访问接口
- 支持异常处理信息

### 1.4 core/graph - 图结构

#### 1.4.1 Cfg - 控制流图

**位置**: `src/core/graph/Cfg.ts`

**核心结构**:
```typescript
class Cfg {
    private blocks: Set<BasicBlock>          // 基本块集合
    private stmtToBlock: Map<Stmt, BasicBlock> // 语句到基本块的映射
    private startingStmt: Stmt                // 起始语句
    private defUseChains: DefUseChain[]      // 定义-使用链
    private declaringMethod: ArkMethod       // 声明方法
}
```

**功能**:
- **基本块管理**: 将语句组织成基本块
- **控制流边**: 通过BasicBlock的前驱/后继关系表示
- **定义-使用链**: 构建变量的定义-使用关系 (`buildDefUseChain()`)
- **可达性分析**: 检测不可达基本块 (`getUnreachableBlocks()`)

**CFG构建过程**:
1. 从方法体语句序列构建基本块
2. 识别分支语句（if, return等）作为基本块边界
3. 建立基本块之间的控制流边
4. 构建定义-使用链

#### 1.4.2 BasicBlock - 基本块

**位置**: `src/core/graph/BasicBlock.ts`

**核心结构**:
```typescript
class BasicBlock {
    private id: number                       // 基本块ID
    private stmts: Stmt[]                    // 语句序列
    private predecessorBlocks: BasicBlock[]  // 前驱基本块
    private successorBlocks: BasicBlock[]    // 后继基本块
    private exceptionalSuccessorBlocks?: BasicBlock[] // 异常后继
}
```

**基本块特性**:
- **单入口单出口**: 除了最后一个语句，其他语句顺序执行
- **分支语句**: 最后一个语句可以是分支（if）或返回（return）
- **控制流**: 通过前驱/后继关系表示程序控制流

**基本块划分规则**:
1. 方法入口是第一个基本块的开始
2. 分支语句（if）是基本块的结束
3. 返回语句（return）是基本块的结束
4. 跳转目标（label）是新基本块的开始

#### 1.4.3 ViewTree - 视图树（ArkUI特有）

**位置**: `src/core/graph/ViewTree.ts`

**核心结构**:
```typescript
interface ViewTree {
    getRoot(): ViewTreeNode | null           // 根节点
    getStateValues(): Map<ArkField, Set<ViewTreeNode>> // 状态值映射
}

interface ViewTreeNode {
    name: string                              // 组件名称
    attributes: Map<string, [Stmt, Value[]]> // 组件属性
    stateValues: Set<ArkField>               // 使用的状态值
    parent: ViewTreeNode | null              // 父节点
    children: ViewTreeNode[]                 // 子节点
    signature?: ClassSignature | MethodSignature // 组件签名
}
```

**作用**:
- 表示ArkUI组件的层次结构
- 跟踪状态变量与组件的绑定关系
- 支持组件属性分析
- 支持自定义组件分析

## 二、IR转换过程详解

### 2.1 从AST到IR的转换流程

```
1. 文件解析阶段
   ArkTS文件 → AST (通过ohos-typescript)
   ↓
   Scene.buildSceneFromProjectDir()
   ↓
   ArkFile (文件模型)

2. 类和方法收集阶段
   ArkFile → ArkClass → ArkMethod
   ↓
   Scene.classesMap, Scene.methodsMap

3. 方法体构建阶段
   ArkMethod.buildBody()
   ↓
   BodyBuilder (从AST构建IR)
   ↓
   ArkBody (包含CFG和语句)

4. CFG构建阶段
   语句序列 → 基本块划分 → 控制流边
   ↓
   Cfg (完整的控制流图)

5. 类型推断阶段
   Scene.inferTypes()
   ↓
   为所有Local、Expr、Ref推断类型
   ↓
   类型化的IR
```

### 2.2 三地址码转换规则

#### 2.2.1 表达式转换

**复杂表达式分解**:
```typescript
// 源代码: let x = a + b * c;
// IR转换:
//   $temp0 = b * c
//   $temp1 = a + $temp0
//   x = $temp1
```

**方法调用转换**:
```typescript
// 源代码: let result = obj.method(arg1, arg2);
// IR转换:
//   $temp0 = instanceinvoke obj.<@Project/File: Class.method(Param1, Param2)>(arg1, arg2)
//   result = $temp0
```

#### 2.2.2 控制流转换

**循环转换** (去语法糖):
```typescript
// 源代码: for (let i = 0; i < 10; i++) { ... }
// IR转换:
//   BB0: i = 0
//   BB1: if i < 10 goto BB2 else goto BB3
//   BB2: ... (循环体)
//        i = i + 1
//        goto BB1
//   BB3: (后续代码)
```

**条件转换**:
```typescript
// 源代码: if (x > 0) { A } else { B }
// IR转换:
//   BB0: if x > 0 goto BB1 else goto BB2
//   BB1: A
//        goto BB3
//   BB2: B
//        goto BB3
//   BB3: (后续代码)
```

#### 2.2.3 匿名函数处理

```typescript
// 源代码: arr.forEach(item => { ... })
// IR转换:
//   1. 创建匿名函数: AnonymousFunc$desugaring$0
//   2. 转换调用: staticinvoke <Array.forEach(Function)>(arr, AnonymousFunc$desugaring$0)
```

### 2.3 类型推断过程

**类型推断层次**:
1. **局部推断**: 在方法内推断局部变量类型
2. **字段推断**: 推断类字段类型
3. **方法签名推断**: 推断方法参数和返回值类型
4. **全局推断**: 跨方法、跨文件的类型推断

**推断策略**:
- 从字面量推断: `let x = 5` → `NumberType`
- 从赋值推断: `let x = y` → `x`的类型从`y`推断
- 从调用推断: `let x = obj.method()` → 从方法返回类型推断
- 从上下文推断: 泛型参数从使用上下文推断

## 三、IR的数据流特性

### 3.1 定义-使用链 (Def-Use Chain)

**构建过程** (`Cfg.buildDefUseChain()`):
1. 遍历所有基本块和语句
2. 对每个使用的值，查找其定义
3. 在同一基本块内向后查找
4. 跨基本块时，遍历前驱基本块查找
5. 建立DefUseChain对象

**用途**:
- 数据流分析的基础
- 死代码检测
- 变量活跃性分析
- 常量传播

### 3.2 SSA形式支持

**Phi表达式** (`ArkPhiExpr`):
```typescript
// 控制流汇合点的值合并
// BB1: x = 1
// BB2: x = 2
// BB3: x = phi(BB1: 1, BB2: 2)  // 根据控制流来源选择值
```

**SSA转换** (`StaticSingleAssignmentFormer`):
- 为每个变量分配唯一的SSA版本
- 在控制流汇合点插入Phi函数
- 支持后续的优化和分析

## 四、IR的扩展性

### 4.1 元数据支持

**ArkMetadata** (`Stmt.metadata`):
- 支持为语句附加元数据
- 可用于存储分析结果
- 支持自定义分析信息

### 4.2 位置信息

**位置追踪**:
- `LineColPosition`: 源码行号和列号
- `FullPosition`: 完整位置信息（文件、行、列）
- `operandOriginalPositions`: 操作数的原始位置

**用途**:
- 错误报告定位
- 调试信息生成
- 源码映射

## 五、IR的特点总结

### 5.1 设计优势

1. **层次清晰**: Value → Expr/Ref → Stmt → BasicBlock → Cfg
2. **类型安全**: 完整的类型系统支持
3. **可扩展**: 支持自定义表达式和语句类型
4. **位置追踪**: 完整的源码位置信息
5. **SSA支持**: 支持静态单赋值形式

### 5.2 适用场景

1. **静态分析**: 数据流分析、控制流分析
2. **类型检查**: 类型推断和验证
3. **代码优化**: 死代码消除、常量折叠
4. **缺陷检测**: 空指针检测、未初始化变量检测
5. **调用图构建**: 基于IR的方法调用分析

## 六、使用IR进行静态分析的实际示例

本章节基于`tests/samples`中的实际测试用例，展示如何使用每一层IR进行不同类型的静态分析。

### 6.1 Scene层 - 项目级遍历和分析

**使用场景**: 遍历整个项目，进行全局分析

**示例代码** (基于 `SceneTest.ts`):
```typescript
import { Scene, SceneConfig, Logger, LOG_LEVEL, LOG_MODULE_TYPE } from 'arkanalyzer';

const logger = Logger.getLogger(LOG_MODULE_TYPE.TOOL, 'Analysis');

// 1. 构建Scene
function buildScene(): Scene {
    const projectDir = 'tests/resources/scene/mainModule';
    const config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(projectDir);
    
    const scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();  // 执行类型推断
    
    return scene;
}

// 2. 遍历所有文件、类、方法
function analyzeProject(scene: Scene): void {
    // 遍历所有文件
    for (const arkFile of scene.getFiles()) {
        logger.info(`文件: ${arkFile.getName()}`);
        
        // 遍历文件中的所有类
        for (const arkClass of arkFile.getClasses()) {
            logger.info(`  类: ${arkClass.getName()}`);
            
            // 遍历类中的所有方法
            for (const arkMethod of arkClass.getMethods()) {
                logger.info(`    方法: ${arkMethod.getName()}`);
                
                // 访问方法体
                const body = arkMethod.getBody();
                if (body) {
                    // 分析局部变量
                    body.getLocals().forEach(local => {
                        logger.info(`      局部变量: ${local.getName()}, 类型: ${local.getType()}`);
                    });
                }
            }
        }
    }
}

// 3. 获取特定方法
function getMethodByName(scene: Scene, className: string, methodName: string) {
    for (const file of scene.getFiles()) {
        for (const cls of file.getClasses()) {
            if (cls.getName() === className) {
                return cls.getMethodWithName(methodName);
            }
        }
    }
    return null;
}
```

**应用场景**:
- 项目级别的代码统计
- 查找特定模式的方法或类
- 全局类型检查
- 依赖关系分析

### 6.2 CFG层 - 控制流分析

**使用场景**: 分析方法的控制流结构，检测不可达代码、循环等

**示例代码** (基于 `CfgTest.ts`):
```typescript
import { Scene, SceneConfig, DEFAULT_ARK_METHOD_NAME } from 'arkanalyzer';

function analyzeControlFlow(scene: Scene): void {
    for (const arkFile of scene.getFiles()) {
        for (const arkClass of arkFile.getClasses()) {
            for (const arkMethod of arkClass.getMethods()) {
                if (arkMethod.getName() === DEFAULT_ARK_METHOD_NAME) {
                    continue;  // 跳过默认方法
                }
                
                const body = arkMethod.getBody();
                if (!body) continue;
                
                const cfg = body.getCfg();
                const blocks = [...cfg.getBlocks()];
                
                logger.info(`方法: ${arkMethod.getName()}`);
                
                // 遍历所有基本块
                for (let i = 0; i < blocks.length; i++) {
                    const block = blocks[i];
                    logger.info(`基本块 ${i}:`);
                    
                    // 打印基本块中的语句
                    for (const stmt of block.getStmts()) {
                        logger.info(`  ${stmt.toString()}`);
                    }
                    
                    // 打印控制流边（后继基本块）
                    const successors = block.getSuccessors();
                    if (successors.length > 0) {
                        const nextBlocks = successors.map(succ => blocks.indexOf(succ)).join(', ');
                        logger.info(`  后继: ${nextBlocks}`);
                    }
                }
                
                // 检测不可达基本块
                const unreachable = cfg.getUnreachableBlocks();
                if (unreachable.size > 0) {
                    logger.warn(`发现 ${unreachable.size} 个不可达基本块`);
                }
            }
        }
    }
}
```

**应用场景**:
- 死代码检测
- 控制流复杂度分析
- 循环检测
- 路径覆盖分析

### 6.3 定义-使用链分析

**使用场景**: 分析变量的定义和使用关系，用于数据流分析

**示例代码** (基于 `DefUseChainTest.ts`):
```typescript
import { Scene, SceneConfig, DEFAULT_ARK_METHOD_NAME } from 'arkanalyzer';

function analyzeDefUseChains(scene: Scene): void {
    for (const arkFile of scene.getFiles()) {
        for (const arkClass of arkFile.getClasses()) {
            for (const arkMethod of arkClass.getMethods()) {
                if (arkMethod.getName() === DEFAULT_ARK_METHOD_NAME) {
                    continue;
                }
                
                const cfg = arkMethod.getBody()!.getCfg();
                
                // 构建定义-使用链
                cfg.buildDefUseChain();
                
                // 遍历所有定义-使用链
                for (const chain of cfg.getDefUseChains()) {
                    const variable = chain.value.toString();
                    const defStmt = chain.def.toString();
                    const useStmt = chain.use.toString();
                    
                    logger.info(`变量: ${variable}`);
                    logger.info(`  定义: ${defStmt}`);
                    logger.info(`  使用: ${useStmt}`);
                    
                    // 获取源码位置
                    const defPos = chain.def.getOriginPositionInfo();
                    const usePos = chain.use.getOriginPositionInfo();
                    logger.info(`  定义位置: 行${defPos.getLineNo()}, 列${defPos.getColNo()}`);
                    logger.info(`  使用位置: 行${usePos.getLineNo()}, 列${usePos.getColNo()}`);
                }
            }
        }
    }
}

// 检测未使用的变量
function findUnusedVariables(scene: Scene): void {
    for (const method of scene.getMethods()) {
        const cfg = method.getBody()?.getCfg();
        if (!cfg) continue;
        
        cfg.buildDefUseChain();
        const chains = cfg.getDefUseChains();
        
        // 收集所有定义的变量
        const definedVars = new Set<string>();
        const usedVars = new Set<string>();
        
        for (const chain of chains) {
            definedVars.add(chain.value.toString());
            usedVars.add(chain.value.toString());
        }
        
        // 检查是否有定义但未使用的变量
        for (const stmt of cfg.getStmts()) {
            const def = stmt.getDef();
            if (def && !usedVars.has(def.toString())) {
                logger.warn(`未使用的变量: ${def.toString()} 在 ${method.getName()} 中`);
            }
        }
    }
}
```

**应用场景**:
- 未使用变量检测
- 变量活跃性分析
- 数据流分析的基础
- 常量传播

### 6.4 类型推断和分析

**使用场景**: 分析变量的类型，检测类型错误

**示例代码** (基于 `TypeInferenceTest.ts`):
```typescript
import { Scene, SceneConfig, DEFAULT_ARK_METHOD_NAME } from 'arkanalyzer';
import { UnknownType, NumberType, StringType } from 'arkanalyzer';

function analyzeTypes(scene: Scene): void {
    // 执行类型推断
    scene.inferTypes();
    
    for (const arkFile of scene.getFiles()) {
        for (const arkClass of arkFile.getClasses()) {
            for (const arkMethod of arkClass.getMethods()) {
                if (arkMethod.getName() === DEFAULT_ARK_METHOD_NAME) {
                    continue;
                }
                
                const body = arkMethod.getBody();
                if (!body) continue;
                
                logger.info(`方法: ${arkMethod.getName()}`);
                
                // 分析局部变量类型
                body.getLocals().forEach(local => {
                    const name = local.getName();
                    const type = local.getType();
                    
                    logger.info(`  局部变量 ${name}: ${type.toString()}`);
                    
                    // 检测未知类型
                    if (type instanceof UnknownType) {
                        logger.warn(`    警告: ${name} 的类型未知`);
                    }
                });
                
                // 分析语句中的类型
                const cfg = body.getCfg();
                for (const stmt of cfg.getStmts()) {
                    // 检查赋值语句的类型兼容性
                    if (stmt instanceof ArkAssignStmt) {
                        const leftType = stmt.getLeftOp().getType();
                        const rightType = stmt.getRightOp().getType();
                        
                        if (!isTypeCompatible(leftType, rightType)) {
                            const pos = stmt.getOriginPositionInfo();
                            logger.warn(`类型不兼容: 行${pos.getLineNo()}`);
                        }
                    }
                }
            }
        }
    }
}

function isTypeCompatible(left: Type, right: Type): boolean {
    // 简单的类型兼容性检查
    if (left instanceof UnknownType || right instanceof UnknownType) {
        return true;  // 未知类型不检查
    }
    if (left === right) {
        return true;
    }
    // 可以添加更复杂的类型兼容性规则
    return false;
}
```

**应用场景**:
- 类型错误检测
- 类型推断验证
- 类型安全分析
- 泛型类型解析

### 6.5 数据流分析 - 到达定义分析

**使用场景**: 分析每个程序点的变量定义，用于优化和缺陷检测

**示例代码** (基于 `ReachingDefTest.ts`):
```typescript
import { Scene, SceneConfig } from 'arkanalyzer';
import { ReachingDefProblem } from 'arkanalyzer/core/dataflow/ReachingDef';
import { MFPDataFlowSolver } from 'arkanalyzer/core/dataflow/GenericDataFlow';

function performReachingDefAnalysis(scene: Scene): void {
    scene.inferTypes();
    
    for (const method of scene.getMethods()) {
        if (method.getName() === '%dflt') {
            continue;  // 跳过默认方法
        }
        
        // 创建到达定义问题
        const problem = new ReachingDefProblem(method);
        
        // 使用MFP（最大不动点）求解器
        const solver = new MFPDataFlowSolver();
        const solution = solver.calculateMopSolutionForwards(problem);
        
        logger.info(`方法: ${method.getName()}`);
        
        // 输出每个基本块的到达定义
        solution.out.forEach((defs, nodeId) => {
            const defList = Array.from(defs).join(', ');
            logger.info(`  基本块 ${nodeId} 的到达定义: ${defList}`);
        });
    }
}

// 使用到达定义分析检测未初始化变量
function detectUninitializedVariables(scene: Scene): void {
    for (const method of scene.getMethods()) {
        const problem = new ReachingDefProblem(method);
        const solver = new MFPDataFlowSolver();
        const solution = solver.calculateMopSolutionForwards(problem);
        
        // 检查每个使用点
        const cfg = method.getBody()?.getCfg();
        if (!cfg) continue;
        
        for (const block of cfg.getBlocks()) {
            for (const stmt of block.getStmts()) {
                // 检查使用的变量是否有定义
                for (const use of stmt.getUses()) {
                    if (use instanceof Local) {
                        const blockId = cfg.getBlocks().indexOf(block);
                        const reachingDefs = solution.out.get(blockId);
                        
                        // 检查变量是否有定义到达
                        const hasDef = Array.from(reachingDefs || []).some(def => 
                            def.toString() === use.toString()
                        );
                        
                        if (!hasDef) {
                            const pos = stmt.getOriginPositionInfo();
                            logger.warn(
                                `未初始化变量: ${use.toString()} 在方法 ${method.getName()} 行${pos.getLineNo()}`
                            );
                        }
                    }
                }
            }
        }
    }
}
```

**应用场景**:
- 未初始化变量检测
- 常量传播
- 死代码消除
- 变量活跃性分析

### 6.6 未定义变量检测（IFDS分析）

**使用场景**: 使用IFDS框架检测未定义变量

**示例代码** (基于 `UndefinedVariableTest.ts`):
```typescript
import { Scene, SceneConfig, ModelUtils } from 'arkanalyzer';
import { UndefinedVariableChecker, UndefinedVariableSolver } from 'arkanalyzer';

function detectUndefinedVariables(scene: Scene): void {
    // 获取特定方法
    const defaultMethod = scene.getFiles()[0]
        .getDefaultClass()
        .getDefaultArkMethod();
    
    const method = ModelUtils.getMethodWithName("u4", defaultMethod!);
    
    if (method) {
        const cfg = method.getCfg()!;
        const blocks = [...cfg.getBlocks()];
        const firstBlock = blocks[0];
        const startStmt = firstBlock.getStmts()[method.getParameters().length];
        
        // 创建未定义变量检查器
        const problem = new UndefinedVariableChecker(startStmt, method);
        
        // 使用IFDS求解器
        const solver = new UndefinedVariableSolver(problem, scene);
        solver.solve();
        
        // 输出检测结果
        for (const outcome of problem.getOutcomes()) {
            const position = outcome.stmt.getOriginPositionInfo();
            logger.error(
                `未定义变量错误: 行${position.getLineNo()}, 列${position.getColNo()}`
            );
            logger.error(`  语句: ${outcome.stmt.toString()}`);
        }
    }
}
```

**应用场景**:
- 未定义变量检测
- 路径敏感分析
- 上下文敏感分析

### 6.7 调用图构建和分析

**使用场景**: 构建方法调用图，分析方法调用关系

**示例代码** (基于 `CallGraphTest.ts`):
```typescript
import { Scene, SceneConfig, CallGraph, CallGraphBuilder, MethodSignature, DEFAULT_ARK_CLASS_NAME } from 'arkanalyzer';

function buildAndAnalyzeCallGraph(scene: Scene): void {
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
    logger.info(`调用图统计: ${callGraph.getStat()}`);
    logger.info(`入口点数量: ${callGraph.getEntries().length}`);
    
    // 遍历调用图节点
    for (const node of callGraph.getNodes()) {
        logger.info(`方法: ${node.getMethod().getSignature().toString()}`);
        
        // 获取该方法的调用者
        const callers = callGraph.getCallers(node);
        logger.info(`  调用者数量: ${callers.length}`);
        
        // 获取该方法调用的方法
        const callees = callGraph.getCallees(node);
        logger.info(`  被调用方法数量: ${callees.length}`);
    }
    
    // 4. 导出调用图（DOT格式）
    callGraph.dump('out/cg.dot');
}
```

**应用场景**:
- 方法调用关系分析
- 程序切片
- 影响分析
- 测试用例生成

### 6.8 值流图（DVFG）分析

**使用场景**: 分析值的流动，用于污点分析、数据流分析等

**示例代码** (基于 `DVFGTest.ts`):
```typescript
import { Scene, SceneConfig } from 'arkanalyzer';
import { CallGraph, DVFG, DVFGBuilder } from 'arkanalyzer';

function buildValueFlowGraph(scene: Scene): void {
    scene.inferTypes();
    
    // 1. 构建调用图（DVFG需要调用图）
    const callGraph = new CallGraph(scene);
    // ... 构建调用图 ...
    
    // 2. 构建直接值流图（DVFG）
    const dvfg = new DVFG(callGraph);
    const dvfgBuilder = new DVFGBuilder(dvfg, scene);
    
    // 3. 为特定方法构建值流图
    const method = scene.getMethods().find(m => m.getName() === 'test1');
    if (method) {
        dvfgBuilder.buildForSingleMethod(method);
    }
    
    // 4. 分析值流
    for (const node of dvfg.getNodes()) {
        logger.info(`值流节点: ${node.toString()}`);
        
        // 获取该值的来源（定义）
        const predecessors = dvfg.getPredecessors(node);
        logger.info(`  来源: ${predecessors.map(p => p.toString()).join(', ')}`);
        
        // 获取该值的使用（流向）
        const successors = dvfg.getSuccessors(node);
        logger.info(`  流向: ${successors.map(s => s.toString()).join(', ')}`);
    }
    
    // 5. 导出值流图
    dvfg.dump('out/dvfg.dot');
}
```

**应用场景**:
- 污点分析
- 数据流追踪
- 值流分析
- 安全漏洞检测

### 6.9 语句和表达式遍历

**使用场景**: 遍历IR中的语句和表达式，进行模式匹配和转换

**示例代码**:
```typescript
import { Scene, SceneConfig, ArkAssignStmt, ArkInvokeStmt, ArkInstanceInvokeExpr } from 'arkanalyzer';

function analyzeStatementsAndExpressions(scene: Scene): void {
    for (const method of scene.getMethods()) {
        const cfg = method.getBody()?.getCfg();
        if (!cfg) continue;
        
        // 遍历所有语句
        for (const stmt of cfg.getStmts()) {
            // 分析赋值语句
            if (stmt instanceof ArkAssignStmt) {
                const left = stmt.getLeftOp();
                const right = stmt.getRightOp();
                
                logger.info(`赋值: ${left.toString()} = ${right.toString()}`);
                
                // 检查右侧表达式
                if (right instanceof ArkInstanceInvokeExpr) {
                    const methodSig = right.getMethodSignature();
                    logger.info(`  调用方法: ${methodSig.toString()}`);
                    logger.info(`  调用对象: ${right.getBase().toString()}`);
                    logger.info(`  参数: ${right.getArgs().map(a => a.toString()).join(', ')}`);
                }
            }
            
            // 分析调用语句
            if (stmt instanceof ArkInvokeStmt) {
                const invokeExpr = stmt.getInvokeExpr();
                logger.info(`方法调用: ${invokeExpr.toString()}`);
            }
            
            // 获取语句使用的所有值
            const uses = stmt.getUses();
            logger.info(`  使用的值: ${uses.map(u => u.toString()).join(', ')}`);
            
            // 获取语句定义的值
            const def = stmt.getDef();
            if (def) {
                logger.info(`  定义的值: ${def.toString()}`);
            }
        }
    }
}

// 查找特定模式的方法调用
function findMethodCalls(scene: Scene, targetMethodName: string): void {
    for (const method of scene.getMethods()) {
        const cfg = method.getBody()?.getCfg();
        if (!cfg) continue;
        
        for (const stmt of cfg.getStmts()) {
            const invokeExpr = stmt.getInvokeExpr();
            if (invokeExpr) {
                const methodName = invokeExpr.getMethodSignature()
                    .getMethodSubSignature()
                    .getMethodName();
                
                if (methodName === targetMethodName) {
                    const pos = stmt.getOriginPositionInfo();
                    logger.info(
                        `找到调用: ${targetMethodName} 在方法 ${method.getName()} 行${pos.getLineNo()}`
                    );
                }
            }
        }
    }
}
```

**应用场景**:
- 模式匹配
- 代码转换
- API使用分析
- 代码重构

### 6.10 视图树分析（ArkUI特有）

**使用场景**: 分析ArkUI组件的层次结构和状态绑定

**示例代码** (基于 `SceneTest.ts`):
```typescript
import { Scene, SceneConfig } from 'arkanalyzer';

function analyzeViewTree(scene: Scene): void {
    for (const arkFile of scene.getFiles()) {
        for (const arkClass of arkFile.getClasses()) {
            // 获取视图树
            const viewTree = arkClass.getViewTree();
            
            if (viewTree) {
                logger.info(`类 ${arkClass.getName()} 有视图树`);
                
                // 获取根节点
                const root = viewTree.getRoot();
                if (root) {
                    logger.info(`根组件: ${root.name}`);
                    
                    // 遍历视图树
                    root.walk((node) => {
                        logger.info(`组件: ${node.name}`);
                        
                        // 检查是否是自定义组件
                        if (node.isCustomComponent()) {
                            logger.info(`  自定义组件: ${node.signature?.toString()}`);
                        }
                        
                        // 检查是否是Builder
                        if (node.isBuilder()) {
                            logger.info(`  Builder: ${node.builder?.toString()}`);
                        }
                        
                        // 获取使用的状态值
                        if (node.stateValues.size > 0) {
                            logger.info(`  状态值: ${Array.from(node.stateValues).map(f => f.getName()).join(', ')}`);
                        }
                        
                        // 获取属性
                        node.attributes.forEach((value, attrName) => {
                            logger.info(`  属性 ${attrName}: ${value[0].toString()}`);
                        });
                        
                        return false;  // 继续遍历
                    });
                }
                
                // 获取状态值映射
                const stateValues = viewTree.getStateValues();
                stateValues.forEach((nodes, field) => {
                    logger.info(`状态值 ${field.getName()} 被 ${nodes.size} 个组件使用`);
                });
            }
        }
    }
}
```

**应用场景**:
- UI组件分析
- 状态管理分析
- 组件依赖分析
- UI性能优化

## 七、总结

ArkAnalyzer的核心IR通过以下层次结构实现了从ArkTS到三地址码的转换:

1. **Scene层**: 项目级抽象，管理全局上下文
2. **Model层**: 文件、类、方法的结构模型
3. **Base层**: 值、表达式、语句的基础元素
4. **Graph层**: 控制流图和视图树
5. **Body层**: 方法体的完整IR表示

这种设计使得IR既保持了源代码的语义信息，又提供了适合静态分析的低级表示形式，为后续的调用图构建、数据流分析、类型推断等高级分析提供了坚实的基础。

### 7.1 分析工作流程总结

典型的静态分析工作流程：

1. **构建Scene**: 使用`SceneConfig`配置项目，调用`buildSceneFromProjectDir()`构建Scene
2. **类型推断**: 调用`scene.inferTypes()`进行全局类型推断
3. **遍历IR**: 通过Scene → File → Class → Method → Body → CFG → Block → Stmt的层次遍历
4. **执行分析**: 根据分析目标使用相应的分析框架（数据流、控制流、调用图等）
5. **输出结果**: 将分析结果输出为日志、报告或可视化图形

### 7.2 各层IR的使用建议

- **Scene层**: 用于项目级分析、跨文件分析、全局类型检查
- **CFG层**: 用于控制流分析、路径分析、死代码检测
- **Def-Use链**: 用于数据流分析、变量分析、优化
- **类型系统**: 用于类型检查、类型推断验证、类型安全分析
- **调用图**: 用于方法调用分析、程序切片、影响分析
- **值流图**: 用于污点分析、数据流追踪、安全分析
- **视图树**: 用于UI组件分析、状态管理分析（ArkUI特有）

