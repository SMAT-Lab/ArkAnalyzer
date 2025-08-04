/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// callgraph/algorithm
export { AbstractAnalysis } from './callgraph/algorithm/AbstractAnalysis';
export { ClassHierarchyAnalysis } from './callgraph/algorithm/ClassHierarchyAnalysis';
export { RapidTypeAnalysis } from './callgraph/algorithm/RapidTypeAnalysis';

// callgraph/common
export { PTAStat, PAGStat, CGStat } from './callgraph/common/Statistics';

// callgraph/model
export * from './callgraph/model/CallGraph';
export { CallGraphBuilder } from './callgraph/model/builder/CallGraphBuilder';

// callgraph/pointerAnalysis
export { DummyCallCreator } from './callgraph/pointerAnalysis/DummyCallCreator';
export * from './callgraph/pointerAnalysis/Pag';
export { CSFuncID, PagBuilder } from './callgraph/pointerAnalysis/PagBuilder';
export { PointerAnalysis } from './callgraph/pointerAnalysis/PointerAnalysis';
export { PointerAnalysisConfig } from './callgraph/pointerAnalysis/PointerAnalysisConfig';
export { PtsSet, DiffPTData } from './callgraph/pointerAnalysis/PtsDS';

export { DVFG } from './VFG/DVFG';
export { DVFGBuilder } from './VFG/builder/DVFGBuilder';

// core/base
export { Constant } from './core/base/Constant';
export { Decorator } from './core/base/Decorator';
export { DefUseChain } from './core/base/DefUseChain';
export * from './core/base/Expr';
export { Local } from './core/base/Local';
export { LineColPosition, FullPosition } from './core/base/Position';
export * from './core/base/Ref';
export * from './core/base/Stmt';
export * from './core/base/Type';
export { Value } from './core/base/Value';

// core/common
export { ModelUtils } from './core/common/ModelUtils';
export * from './core/common/Const';
export { DummyMainCreater } from './core/common/DummyMainCreater';
export * from './core/common/EtsConst';
export { ExprUseReplacer } from './core/common/ExprUseReplacer';
export { IRUtils } from './core/common/IRUtils';
export { RefUseReplacer } from './core/common/RefUseReplacer';
export { StmtUseReplacer } from './core/common/StmtUseReplacer';
export * from './core/common/TSConst';
export { TypeInference } from './core/common/TypeInference';
export { ValueUtil } from './core/common/ValueUtil';
export { VisibleValue, Scope } from './core/common/VisibleValue';

// core/dataflow
export { DataflowProblem, FlowFunction } from './core/dataflow/DataflowProblem';
export { DataflowResult } from './core/dataflow/DataflowResult';
export { DataflowSolver } from './core/dataflow/DataflowSolver';
export { PathEdgePoint, PathEdge } from './core/dataflow/Edge';
export { Fact } from './core/dataflow/Fact';
export { UndefinedVariableChecker, UndefinedVariableSolver } from './core/dataflow/UndefinedVariable';

// core/graph
export { BasicBlock } from './core/graph/BasicBlock';
export { Cfg } from './core/graph/Cfg';
export { ViewTree, ViewTreeNode } from './core/graph/ViewTree';
export { DominanceFinder } from './core/graph/DominanceFinder';
export { DominanceTree } from './core/graph/DominanceTree';
export { NodeID, Kind, BaseEdge, BaseNode, BaseExplicitGraph } from './core/graph/BaseExplicitGraph';
export { SCCDetection } from './core/graph/Scc';

// core/model
export { ArkFile } from './core/model/ArkFile';
export { ArkNamespace } from './core/model/ArkNamespace';
export { ArkClass } from './core/model/ArkClass';
export { ArkMethod } from './core/model/ArkMethod';
export { ArkField } from './core/model/ArkField';
export { ExportInfo } from './core/model/ArkExport';
export { ImportInfo } from './core/model/ArkImport';
export { ArkBody } from './core/model/ArkBody';
export * from './core/model/ArkSignature';
export * from './core/model/builder/ArkSignatureBuilder';

export { SceneConfig } from './Config';
export { Scene } from './Scene';

// save
export { Printer } from './save/Printer';
export { PrinterBuilder } from './save/PrinterBuilder';
export { DotMethodPrinter, DotClassPrinter, DotNamespacePrinter, DotFilePrinter } from './save/DotPrinter';
export { SourceMethod as SourceMethodPrinter } from './save/source/SourceMethod';
export { SourceClass as SourceClassPrinter } from './save/source/SourceClass';
export { SourceNamespace as SourceNamespacePrinter } from './save/source/SourceNamespace';
export { SourceFilePrinter } from './save/source/SourceFilePrinter';
export { JsonPrinter } from './save/JsonPrinter';
export { GraphPrinter } from './save/GraphPrinter';
export { ViewTreePrinter } from './save/ViewTreePrinter';

// transformer
export * from './transformer/StaticSingleAssignmentFormer';

// utils
export * from './utils/callGraphUtils';
export * from './utils/entryMethodUtils';
export * from './utils/FileUtils';
export * from './utils/getAllFiles';
export * from './utils/json5parser';
export * from './utils/pathTransfer';
export * from './utils/AstTreeUtils';
export { LOG_LEVEL, LOG_MODULE_TYPE } from './utils/logger';
export { default as Logger } from './utils/logger';

//ohos-typescript
import ts from 'ohos-typescript';
export { ts };
