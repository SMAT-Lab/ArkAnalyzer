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

import { CallGraph, CallGraphNode, CallGraphNodeKind, CallSite, DynCallSite, FuncID, ICallSite } from '../model/CallGraph';
import { Scene } from '../../Scene';
import { ArkAssignStmt, ArkInvokeStmt, ArkReturnStmt, Stmt } from '../../core/base/Stmt';
import {
    AbstractExpr,
    AbstractInvokeExpr,
    ArkInstanceInvokeExpr,
    ArkNewArrayExpr,
    ArkNewExpr,
    ArkPtrInvokeExpr,
} from '../../core/base/Expr';
import { AbstractFieldRef, ArkArrayRef, ArkInstanceFieldRef, ArkParameterRef, ArkStaticFieldRef, ArkThisRef, ClosureFieldRef } from '../../core/base/Ref';
import { Value } from '../../core/base/Value';
import { ArkMethod } from '../../core/model/ArkMethod';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { Local } from '../../core/base/Local';
import { NodeID } from '../../core/graph/BaseExplicitGraph';
import { ClassSignature } from '../../core/model/ArkSignature';
import { ArkClass } from '../../core/model/ArkClass';
import { ClassType, FunctionType, LexicalEnvType } from '../../core/base/Type';
import { Constant } from '../../core/base/Constant';
import { PAGStat } from '../common/Statistics';
import {
    FuncPag,
    InterFuncPag,
    InterProceduralEdge,
    IntraProceduralEdge,
    Pag,
    PagEdgeKind,
    PagFuncNode,
    PagGlobalThisNode,
    PagLocalNode,
    PagNode,
    PagNodeType,
    PagThisRefNode,
} from './Pag';
import { GLOBAL_THIS_NAME } from '../../core/common/TSConst';
import { IPtsCollection } from './PtsDS';
import { ContextType, PointerAnalysisConfig, PtaAnalysisScale } from './PointerAnalysisConfig';
import { ContextID, DUMMY_CID } from './context/Context';
import { ContextSelector, emptyID, KCallSiteContextSelector, KFuncContextSelector, KObjContextSelector } from './context/ContextSelector';
import { PluginManager } from './plugins/PluginManager';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'PTA');

export class CSFuncID {
    public cid: ContextID;
    public funcID: FuncID;

    constructor(cid: ContextID, fid: FuncID) {
        this.cid = cid;
        this.funcID = fid;
    }
}

export class PagBuilder {
    private pag: Pag;
    private cg: CallGraph;
    private scale: PtaAnalysisScale;
    private funcPags: Map<FuncID, FuncPag>;
    private interFuncPags?: Map<FuncID, InterFuncPag>;
    private handledFunc: Set<string> = new Set();
    private ctxSelector: ContextSelector;
    private pluginManager: PluginManager;
    private scene: Scene;
    private worklist: CSFuncID[] = [];
    private pagStat: PAGStat;
    // TODO: change string to hash value
    private staticField2UniqInstanceMap: Map<string, Value> = new Map();
    private instanceField2UniqInstanceMap: Map<string, Value> = new Map();
    private sdkMethodReturnValueMap: Map<ArkMethod, Map<ContextID, ArkNewExpr>> = new Map();
    private funcHandledThisRound: Set<FuncID> = new Set();
    private updatedNodesThisRound: Map<NodeID, IPtsCollection<NodeID>> = new Map();
    private singletonFuncMap: Map<FuncID, boolean> = new Map();
    private globalThisValue: Local = new Local(GLOBAL_THIS_NAME);
    private globalThisPagNode?: PagGlobalThisNode;
    private externalScopeVariableMap: Map<Local, Local[]> = new Map();
    private retriggerNodesList: Set<NodeID> = new Set();
    // Record arrow function object nodes: funcName -> function object node ID
    private arrowFunctionObjectMap: Map<string, NodeID> = new Map();

    constructor(p: Pag, cg: CallGraph, s: Scene, config: PointerAnalysisConfig) {
        this.pag = p;
        this.cg = cg;
        this.scale = config.analysisScale;
        this.funcPags = new Map<FuncID, FuncPag>();
        this.scene = s;
        this.pagStat = new PAGStat();
        this.pluginManager = new PluginManager(p, this, cg);
        let kLimit = config.kLimit;

        switch (config.contextType) {
            case ContextType.CallSite:
                this.ctxSelector = new KCallSiteContextSelector(kLimit);
                break;
            case ContextType.Obj:
                this.ctxSelector = new KObjContextSelector(kLimit);
                break;
            case ContextType.Func:
                this.ctxSelector = new KFuncContextSelector(kLimit);
                break;
            default:
                this.ctxSelector = new KCallSiteContextSelector(kLimit);
                break;
        }
    }

    public buildFuncPagAndAddToWorklist(cs: CSFuncID): CSFuncID {
        if (this.worklist.includes(cs)) {
            return cs;
        }

        this.buildFuncPag(cs.funcID);
        if (this.isSingletonFunction(cs.funcID)) {
            cs.cid = DUMMY_CID;
        }

        this.worklist.push(cs);
        return cs;
    }

    private addToFuncHandledListThisRound(id: FuncID): void {
        if (this.funcHandledThisRound.has(id)) {
            return;
        }

        this.funcHandledThisRound.add(id);
    }

    public buildForEntries(funcIDs: FuncID[]): void {
        this.worklist = [];
        funcIDs.forEach(funcID => {
            let cid = this.ctxSelector.emptyContext(funcID);
            let csFuncID = new CSFuncID(cid, funcID);
            this.buildFuncPagAndAddToWorklist(csFuncID);
        });

        this.handleReachable();
        this.globalThisPagNode = this.getOrNewGlobalThisNode(emptyID) as PagGlobalThisNode;
        this.pag.addPagEdge(this.globalThisPagNode, this.globalThisPagNode, PagEdgeKind.Copy);
    }

    public handleReachable(): boolean {
        if (this.worklist.length === 0) {
            return false;
        }
        this.funcHandledThisRound.clear();

        while (this.worklist.length > 0) {
            let csFunc = this.worklist.shift() as CSFuncID;
            this.buildPagFromFuncPag(csFunc.funcID, csFunc.cid);
            this.addToFuncHandledListThisRound(csFunc.funcID);
        }

        return true;
    }

    public build(): void {
        for (let funcID of this.cg.getEntries()) {
            let cid = this.ctxSelector.emptyContext(funcID);
            let csFuncID = new CSFuncID(cid, funcID);
            this.buildFuncPagAndAddToWorklist(csFuncID);

            this.handleReachable();
        }
    }

    public buildFuncPag(funcID: FuncID): boolean {
        if (this.funcPags.has(funcID)) {
            return false;
        }

        let arkMethod = this.cg.getArkMethodByFuncID(funcID);
        if (arkMethod == null) {
            return false;
        }

        let cfg = arkMethod.getCfg();
        if (!cfg) {
            // build as sdk method
            return this.pluginManager.processSDKFuncPag(funcID, arkMethod).handled;
        }

        logger.trace(`[build FuncPag] ${arkMethod.getSignature().toString()}`);

        let fpag = new FuncPag();
        for (let stmt of cfg.getStmts()) {
            if (stmt instanceof ArkAssignStmt) {
                this.processExternalScopeValue(stmt.getRightOp(), funcID);
                // Add non-call edges
                let kind = this.getEdgeKindForAssignStmt(stmt);
                if (kind !== PagEdgeKind.Unknown) {
                    fpag.addInternalEdge(stmt, kind);
                    continue;
                }

                // handle call
                this.buildInvokeExprInStmt(stmt, fpag);
            } else if (stmt instanceof ArkInvokeStmt && this.scale === PtaAnalysisScale.WholeProgram) {
                this.processExternalScopeValue(stmt.getInvokeExpr(), funcID);
                this.buildInvokeExprInStmt(stmt, fpag);
            } else {
                // TODO: need handle other type of stmt?
            }
        }

        this.funcPags.set(funcID, fpag);
        this.pagStat.numTotalFunction++;
        return true;
    }

    private buildInvokeExprInStmt(stmt: Stmt, fpag: FuncPag): void {
        // TODO: discuss if we need a invokeStmt
        if (!stmt.getInvokeExpr()) {
            return;
        }

        let callSites = this.cg.getCallSiteByStmt(stmt);
        if (callSites.length !== 0) {
            // direct call or constructor call is already existing in CG
            // TODO: some ptr invoke stmt is recognized as Static invoke in tests/resources/callgraph/funPtrTest1/fnPtrTest4.ts
            // TODO: instance invoke(ptr invoke)
            callSites.forEach(cs => {
                if (this.cg.isUnknownMethod(cs.calleeFuncID)) {
                    fpag.addUnknownCallSite(cs);
                } else {
                    fpag.addNormalCallSite(cs);
                }
            });

            return;
        }

        let dycs = this.cg.getDynCallSiteByStmt(stmt);
        if (dycs) {
            this.addToDynamicCallSite(fpag, dycs);
        } else {
            logger.error(`can not find callSite by stmt: ${stmt.toString()}`);
        }
    }

    private processExternalScopeValue(value: Value, funcID: FuncID): void {
        let dummyMainFuncID = this.cg.getDummyMainFuncID();
        if (dummyMainFuncID && funcID === dummyMainFuncID) {
            return;
        }

        if (value instanceof Local) {
            this.handleValueFromExternalScope(value, funcID);
        } else if (value instanceof ArkInstanceInvokeExpr) {
            value.getUses().forEach(v => {
                this.handleValueFromExternalScope(v, funcID);
            });
        }
    }

    /**
     * process Method level analysis only
     */
    private createDummyParamValue(funcID: FuncID): Map<number, Value> {
        let arkMethod = this.cg.getArkMethodByFuncID(funcID);
        if (!arkMethod) {
            return new Map();
        }

        let args = arkMethod.getParameters();
        if (!args) {
            return new Map();
        }

        let paramArr: Map<number, Value> = new Map();

        // heapObj
        args.forEach((arg, index) => {
            let paramType = arg.getType();
            if (!(paramType instanceof ClassType)) {
                return;
                // TODO: support more type
            }

            let argInstance: ArkNewExpr = new ArkNewExpr(paramType);
            paramArr.set(index, argInstance);
        });

        return paramArr;
    }

    private createDummyParamPagNodes(value: Map<number, Value>, funcID: FuncID): Map<number, NodeID> {
        let paramPagNodes: Map<number, NodeID> = new Map();
        let method = this.cg.getArkMethodByFuncID(funcID)!;
        if (!method || !method.getCfg()) {
            return paramPagNodes;
        }

        value.forEach((v, index) => {
            let paramArkExprNode = this.pag.getOrNewNode(DUMMY_CID, v);
            paramPagNodes.set(index, paramArkExprNode.getID());
        });

        return paramPagNodes;
    }

    public buildPagFromFuncPag(funcID: FuncID, cid: ContextID): void {
        let funcPag = this.funcPags.get(funcID);
        if (funcPag === undefined) {
            return;
        }
        if (this.handledFunc.has(`${cid}-${funcID}`)) {
            return;
        }

        this.addEdgesFromFuncPag(funcPag, cid, funcID);
        let interFuncPag = this.interFuncPags?.get(funcID);
        if (interFuncPag) {
            this.addEdgesFromInterFuncPag(interFuncPag, cid);
        }

        this.addCallsEdgesFromFuncPag(funcPag, cid);
        this.addDynamicCallSite(funcPag, funcID, cid);
        this.addUnknownCallSite(funcPag, funcID);

        // Check if this is an arrow function and set up its 'this' binding
        // Must be called after addEdgesFromFuncPag to ensure this node is created
        this.setupArrowFunctionThis(funcID, cid);

        this.handledFunc.add(`${cid}-${funcID}`);
    }

    /// Add Pag Nodes and Edges in function
    public addEdgesFromFuncPag(funcPag: FuncPag, cid: ContextID, funcID: FuncID): boolean {
        let inEdges = funcPag.getInternalEdges();
        if (inEdges === undefined) {
            return false;
        }
        let paramNodes;
        let paramRefIndex = 0;
        if (this.scale === PtaAnalysisScale.MethodLevel) {
            paramNodes = this.createDummyParamPagNodes(this.createDummyParamValue(funcID), funcID);
        }

        for (let e of inEdges) {
            // handle closure field ref
            if (e.src instanceof ClosureFieldRef) {
                this.addClosureEdges(e, cid);
                continue;
            }

            let srcPagNode = this.getOrNewPagNode(cid, e.src, e.stmt);
            let dstPagNode = this.getOrNewPagNode(cid, e.dst, e.stmt);

            this.pag.addPagEdge(srcPagNode, dstPagNode, e.kind, e.stmt);

            // Take place of the real stmt for return
            if (dstPagNode.getStmt() instanceof ArkReturnStmt) {
                dstPagNode.setStmt(e.stmt);
            }

            // Record arrow function object node (for variable assignment, field assignment, etc.)
            if (srcPagNode instanceof PagFuncNode) {
                this.recordArrowFunctionObjectNode(srcPagNode, e.src);
            }

            // for demand-driven analysis, add fake parameter heapObj nodes
            if (e.src instanceof ArkParameterRef && this.scale === PtaAnalysisScale.MethodLevel) {
                let paramObjNodeID = paramNodes?.get(paramRefIndex++);
                if (!paramObjNodeID) {
                    continue;
                }

                this.pag.addPagEdge(this.pag.getNode(paramObjNodeID) as PagNode, srcPagNode, PagEdgeKind.Address);
            }
        }

        return true;
    }

    /**
     * handle closure field ref intra-procedural edge
     * @param edge the intra-procedural edge with ClosureFieldRef as src
     * @param cid 
     */
    public addClosureEdges(edge: IntraProceduralEdge, cid: ContextID): void {
        let src = edge.src as ClosureFieldRef;
        let dst = edge.dst;

        let fieldName = src.getFieldName();
        let closureValues = (src.getBase().getType() as LexicalEnvType).getClosures();
        // search out method closure local with closureFieldRef.fieldName
        let srcValue = closureValues.find(value => value.getName() === fieldName);
        let dstPagNode = this.getOrNewPagNode(cid, dst, edge.stmt);

        if (srcValue) {
            // unable to get parent method cid, connect all the value nodes in different cid
            let srcPagNodes = this.pag.getNodesByValue(srcValue);
            if (srcPagNodes) {
                srcPagNodes.forEach(srcNodeID => {
                    let srcNode = this.pag.getNode(srcNodeID)! as PagNode;
                    this.pag.addPagEdge(srcNode,
                        dstPagNode, edge.kind, edge.stmt);

                    this.retriggerNodesList.add(srcNodeID);
                });
            }
        } else {
            throw new Error(`error find closure local: ${fieldName}`);
        }
    }

    /// add Copy edges interprocedural
    public addCallsEdgesFromFuncPag(funcPag: FuncPag, cid: ContextID): boolean {
        for (let cs of funcPag.getNormalCallSites()) {
            let ivkExpr = cs.callStmt.getInvokeExpr();
            const calleeFuncID: FuncID = cs.getCalleeFuncID()!;
            let calleeCid = this.ctxSelector.selectContext(cid, cs, emptyID, calleeFuncID);

            let calleeCGNode = this.cg.getNode(calleeFuncID) as CallGraphNode;

            if (this.scale === PtaAnalysisScale.MethodLevel) {
                this.addStaticPagCallReturnEdge(cs, cid, calleeCid);
            }

            // Storage Plugin, SDK Plugin
            const pluginResult = this.pluginManager.processCallSite(cs, cid, emptyID, this.cg);
            if (pluginResult.handled) {
                logger.debug(`[buildFuncPag] plugin handled call site ${cs.callStmt.toString()}`);
            } else {
                this.addStaticPagCallEdge(cs, cid, calleeCid);
            }

            // Add edge to thisRef for special calls
            if (calleeCGNode.getKind() === CallGraphNodeKind.constructor || calleeCGNode.getKind() === CallGraphNodeKind.intrinsic) {
                let callee = this.scene.getMethod(this.cg.getMethodByFuncID(cs.calleeFuncID)!)!;
                if (ivkExpr instanceof ArkInstanceInvokeExpr) {
                    this.addThisRefCallEdge(cid, ivkExpr.getBase(), callee, calleeCid, cs.callerFuncID);
                } else {
                    logger.debug(`constructor or intrinsic func is static ${ivkExpr!.toString()}`);
                }
            }

            const callerMethod = this.cg.getArkMethodByFuncID(cs.callerFuncID);
            const calleeMethod = this.cg.getArkMethodByFuncID(calleeFuncID);

            if (!callerMethod || !calleeMethod) {
                logger.error(`can not find caller or callee method by funcID ${cs.callerFuncID} ${calleeFuncID}`);
                return false;
            }

            this.cg.addDirectOrSpecialCallEdge(
                callerMethod.getSignature()!, calleeMethod.getSignature()!, cs.callStmt,
            );
        }

        return true;
    }

    public addDynamicCallSite(funcPag: FuncPag, funcID: FuncID, cid: ContextID): void {
        // add dyn callSite in funcpag to base node
        for (let cs of funcPag.getDynamicCallSites()) {
            let invokeExpr: AbstractInvokeExpr = cs.callStmt.getInvokeExpr()!;
            let base!: Local;
            if (invokeExpr instanceof ArkInstanceInvokeExpr) {
                base = invokeExpr.getBase();
            } else if (invokeExpr instanceof ArkPtrInvokeExpr && invokeExpr.getFuncPtrLocal() instanceof Local) {
                base = invokeExpr.getFuncPtrLocal() as Local;
            } else if (invokeExpr instanceof ArkPtrInvokeExpr && invokeExpr.getFuncPtrLocal() instanceof AbstractFieldRef) {
                /**
                 * TODO: wait for IR change
                 * throw error in ptrInvoke with field ref
                 * this.field() // field is lambda expression
                 */
                continue;
            }
            // TODO: check base under different cid
            let baseNodeIDs = this.pag.getNodesByValue(base);
            if (!baseNodeIDs) {
                // bind the call site to export base
                let interProceduralLocal = this.getSourceValueFromExternalScope(base, funcID);
                if (interProceduralLocal) {
                    baseNodeIDs = this.pag.getNodesByValue(interProceduralLocal);
                }
            }

            if (!baseNodeIDs) {
                logger.warn(`[build dynamic call site] can not handle call site with base ${base.toString()}`);
                continue;
            }

            for (let nodeID of baseNodeIDs!.values()) {
                let node = this.pag.getNode(nodeID);
                if (!(node instanceof PagLocalNode)) {
                    continue;
                }

                node.addRelatedDynCallSite(cs);
            }

            if (cs.callStmt instanceof ArkAssignStmt) {
                this.getOrNewPagNode(cid, cs.callStmt.getLeftOp(), cs.callStmt);
            }
        }
    }

    public addUnknownCallSite(funcPag: FuncPag, funcID: FuncID): void {
        let method = this.cg.getArkMethodByFuncID(funcID);

        if (!method) {
            throw new Error(`can not find ArkMethod by FuncID ${funcID}`);
        }

        let locals = method.getBody()?.getLocals()!;

        funcPag.getUnknownCallSites().forEach(unknownCallSite => {
            let calleeName = unknownCallSite.callStmt.getInvokeExpr()?.getMethodSignature().getMethodSubSignature().getMethodName()!;

            let base = locals.get(calleeName);
            if (!base) {
                return;
            }
            let baseNodeIDs = this.pag.getNodesByValue(base);
            if (!baseNodeIDs) {
                logger.warn(`[build dynamic call site] can not handle call site with base ${base.toString()}`);
                return;
            }
            for (let nodeID of baseNodeIDs!.values()) {
                let node = this.pag.getNode(nodeID);
                if (!(node instanceof PagLocalNode)) {
                    continue;
                }

                node.addRelatedUnknownCallSite(unknownCallSite);
            }
        });
    }

    public addDynamicCallEdge(cs: ICallSite, baseClassPTNode: NodeID, cid: ContextID): NodeID[] {
        let srcNodes: NodeID[] = [];
        let ivkExpr = cs.callStmt.getInvokeExpr();

        let ptNode = this.pag.getNode(baseClassPTNode) as PagNode;
        let value = (ptNode as PagNode).getValue();
        let callees: ArkMethod[] = this.getDynamicCallee(ptNode, value, ivkExpr!, cs);

        for (let callee of callees) {
            if (!callee) {
                continue;
            }
            // get caller and callee CG node, add param and return value PAG edge
            let dstCGNode = this.cg.getCallGraphNodeByMethod(callee.getSignature());
            let callerNode = this.cg.getNode(cs.callerFuncID) as CallGraphNode;
            if (!callerNode) {
                throw new Error('Can not get caller method node');
            }
            // update call graph
            // TODO: movo to cgbuilder

            this.cg.addDynamicCallEdge(callerNode.getID(), dstCGNode.getID(), cs.callStmt);

            if (this.cg.detectReachable(dstCGNode.getID(), callerNode.getID())) {
                return srcNodes;
            }

            let staticCS = this.cg.getCallSiteManager().cloneCallSiteFromDyn((cs as DynCallSite), dstCGNode.getID());

            if (this.scale === PtaAnalysisScale.MethodLevel) {
                srcNodes.push(...this.addStaticPagCallReturnEdge(staticCS, cid, baseClassPTNode));
                continue;
            }

            // Storage Plugin, SDK Plugin, Function Plugin, Container Plugin
            const pluginResult = this.pluginManager.processCallSite(staticCS, cid, baseClassPTNode, this.cg);
            if (pluginResult.handled) {
                logger.debug(`[buildDynamicCallEdge] plugin handled call site ${cs.callStmt.toString()}`);
                srcNodes.push(...pluginResult.srcNodes);
                continue;
            }

            srcNodes.push(...this.processNormalMethodPagCallEdge(staticCS, cid, baseClassPTNode));
        }

        return srcNodes;
    }

    /**
     * all possible callee methods of a dynamic call site
     * handle both PtrInvokeExpr and InstanceInvokeExpr
     */
    private getDynamicCallee(ptNode: PagNode, value: Value, ivkExpr: AbstractInvokeExpr, cs: ICallSite): ArkMethod[] {
        let callee: ArkMethod[] = [];

        if (ptNode instanceof PagFuncNode) {
            // function ptr invoke
            let tempCallee = this.scene.getMethod(ptNode.getMethod());

            if (!callee) {
                return callee;
            }
            callee.push(tempCallee!);
            return callee;
        }
        //else branch
        let calleeName = ivkExpr!.getMethodSignature().getMethodSubSignature().getMethodName();
        // instance method invoke
        if (!(value instanceof ArkNewExpr || value instanceof ArkNewArrayExpr)) {
            return callee;
        }

        // try to get callee by MethodSignature
        const getClassSignature = (value: ArkNewExpr | ArkNewArrayExpr): ClassSignature => {
            if (value instanceof ArkNewExpr) {
                return (value.getType() as ClassType).getClassSignature() as ClassSignature;
            }
            return this.scene.getSdkGlobal('Array')!.getSignature() as ClassSignature;
        };

        const clsSig = getClassSignature(value);
        let cls: ArkClass | null = this.scene.getClass(clsSig) as ArkClass;
        let tempCallee: ArkMethod | undefined;

        while (!tempCallee && cls) {
            tempCallee = cls.getMethodWithName(calleeName) ?? undefined;
            cls = cls.getSuperClass();
        }

        if (!tempCallee) {
            tempCallee = this.scene.getMethod(ivkExpr!.getMethodSignature()) ?? undefined;
        }

        if (!tempCallee && cs.args) {
            // while pts has {o_1, o_2} and invoke expr represents a method that only {o_1} has
            // return empty node when {o_2} come in
            // try to get callee by anonymous method in param
            for (let arg of cs.args) {
                // TODO: anonymous method param and return value pointer pass
                let argType = arg.getType();
                if (argType instanceof FunctionType) {
                    callee.push(this.scene.getMethod(argType.getMethodSignature())!);
                }
            }
        } else if (tempCallee) {
            callee.push(tempCallee);
        }

        return callee;
    }

    public processNormalMethodPagCallEdge(staticCS: CallSite, cid: ContextID, baseClassPTNode: NodeID): NodeID[] {
        let srcNodes: NodeID[] = [];
        let ivkExpr = staticCS.callStmt.getInvokeExpr()!;
        let ptNode = this.pag.getNode(baseClassPTNode) as PagNode;
        let dstCGNode = this.cg.getNode(staticCS.calleeFuncID) as CallGraphNode;
        let calleeCid = this.ctxSelector.selectContext(cid, staticCS, baseClassPTNode, dstCGNode.getID());
        let callee = this.cg.getArkMethodByFuncID(staticCS.calleeFuncID);
        // Dynamic call, Ptr call, normal SDK call
        srcNodes.push(...this.addStaticPagCallEdge(staticCS, cid, calleeCid, ptNode));

        // Pass base's pts to callee's this pointer
        if (!dstCGNode.isSdkMethod() && ivkExpr instanceof ArkInstanceInvokeExpr) {
            let srcBaseNode = this.addThisRefCallEdge(cid, ivkExpr.getBase(), callee!, calleeCid, staticCS.callerFuncID);

            if (srcBaseNode !== -1) {
                srcNodes.push(srcBaseNode);
            }
        } else if (!dstCGNode.isSdkMethod() && ivkExpr instanceof ArkPtrInvokeExpr) {
            let originCS = (ptNode as PagFuncNode).getCS();
            if (!originCS) {
                return srcNodes;
            }

            let thisValue = originCS.args![0];

            if (!(thisValue instanceof Local)) {
                return srcNodes;
            }
            this.addThisRefCallEdge((ptNode as PagFuncNode).getOriginCid(), thisValue, callee!, calleeCid, staticCS.callerFuncID);
        }

        return srcNodes;
    }

    public handleUnkownDynamicCall(cs: DynCallSite, cid: ContextID): NodeID[] {
        let srcNodes: NodeID[] = [];
        let callerNode = this.cg.getNode(cs.callerFuncID) as CallGraphNode;
        let ivkExpr = cs.callStmt.getInvokeExpr() as AbstractInvokeExpr;
        logger.warn('Handling unknown dyn call site : \n  ' + callerNode.getMethod().toString() + '\n  --> ' + ivkExpr.toString() + '\n  CID: ' + cid);

        let callees: ArkMethod[] = [];
        let callee: ArkMethod | null = null;
        callee = this.scene.getMethod(ivkExpr.getMethodSignature());
        if (!callee) {
            cs.args?.forEach(arg => {
                if (!(arg.getType() instanceof FunctionType)) {
                    return;
                }

                callee = this.scene.getMethod((arg.getType() as FunctionType).getMethodSignature());
                if (callee) {
                    callees.push(callee);
                }
            });
        } else {
            callees.push(callee);
        }

        if (callees.length === 0) {
            return srcNodes;
        }

        callees.forEach(callee => {
            let dstCGNode = this.cg.getCallGraphNodeByMethod(callee.getSignature());
            if (!callerNode) {
                throw new Error('Can not get caller method node');
            }

            logger.warn(`\tAdd call edge of unknown call ${callee.getSignature().toString()}`);
            this.cg.addDynamicCallEdge(callerNode.getID(), dstCGNode.getID(), cs.callStmt);
            if (!this.cg.detectReachable(dstCGNode.getID(), callerNode.getID())) {
                let staticCS = this.cg.getCallSiteManager().cloneCallSiteFromDyn(cs, dstCGNode.getID());
                let calleeCid = this.ctxSelector.selectContext(cid, staticCS, emptyID, staticCS.calleeFuncID);
                let staticSrcNodes = this.addStaticPagCallEdge(staticCS, cid, calleeCid);
                srcNodes.push(...staticSrcNodes);
            }
        });
        return srcNodes;
    }

    public handleUnprocessedCallSites(processedCallSites: Set<DynCallSite>): NodeID[] {
        let reAnalyzeNodes: NodeID[] = [];
        for (let funcID of this.funcHandledThisRound) {
            let funcPag = this.funcPags.get(funcID);
            if (!funcPag) {
                logger.error(`can not find funcPag of handled func ${funcID}`);
                continue;
            }
            let callSites = funcPag.getDynamicCallSites();

            const diffCallSites = new Set(Array.from(callSites).filter(item => !processedCallSites.has(item)));
            diffCallSites.forEach(cs => {
                let ivkExpr = cs.callStmt.getInvokeExpr();
                if (!(ivkExpr instanceof ArkInstanceInvokeExpr)) {
                    return;
                }
                // Get local of base class
                let base = ivkExpr.getBase();
                // TODO: remove this after multiple this local fixed
                base = this.getRealThisLocal(base, cs.callerFuncID);
                // Get PAG nodes for this base's local
                let ctx2NdMap = this.pag.getNodesByValue(base);
                if (!ctx2NdMap) {
                    return;
                }

                for (let [cid] of ctx2NdMap.entries()) {
                    reAnalyzeNodes.push(...this.handleUnkownDynamicCall(cs, cid));
                }
            });
        }

        return reAnalyzeNodes;
    }

    public addThisRefCallEdge(
        cid: ContextID,
        baseLocal: Local,
        callee: ArkMethod,
        calleeCid: ContextID,
        callerFunID: FuncID
    ): NodeID {
        let thisRefNodeID = this.recordThisRefNode(callee, calleeCid);
        if (thisRefNodeID === -1) {
            return -1;
        }

        let thisRefNode = this.pag.getNode(thisRefNodeID) as PagThisRefNode;
        let srcBaseLocal = baseLocal;
        srcBaseLocal = this.getRealThisLocal(srcBaseLocal, callerFunID);
        let srcNodeId = this.pag.hasCtxNode(cid, srcBaseLocal);
        if (!srcNodeId) {
            // this check is for export local and closure use
            // replace the invoke base, because its origin base has no pag node
            let interProceduralLocal = this.getSourceValueFromExternalScope(srcBaseLocal, callerFunID);
            if (interProceduralLocal) {
                srcNodeId = this.pag.hasCtxNode(cid, interProceduralLocal);
            }
        }

        if (!srcNodeId) {
            throw new Error('Can not get base node');
        }

        this.pag.addPagEdge(this.pag.getNode(srcNodeId) as PagNode, thisRefNode, PagEdgeKind.This);
        return srcNodeId;
    }

    private recordThisRefNode(callee: ArkMethod, calleeCid: ContextID): NodeID {
        if (!callee || !callee.getCfg()) {
            logger.error(`callee is null`);
            return -1;
        }
        let thisAssignStmt = callee
            .getCfg()
            ?.getStmts()
            .filter(s => s instanceof ArkAssignStmt && s.getRightOp() instanceof ArkThisRef);
        let thisPtr = (thisAssignStmt?.[0] as ArkAssignStmt).getRightOp() as ArkThisRef;
        if (!thisPtr) {
            throw new Error('Can not get this ptr');
        }

        let thisRefNode = this.getOrNewPagNode(calleeCid, thisPtr) as PagThisRefNode;

        return thisRefNode.getID();
    }

    /*
     * Add copy edges from arguments to parameters
     *     ret edges from return values to callSite
     * Return src node
     */
    public addStaticPagCallEdge(cs: CallSite, callerCid: ContextID, calleeCid?: ContextID, ptNode?: PagNode): NodeID[] {
        if (!calleeCid) {
            calleeCid = this.ctxSelector.selectContext(callerCid, cs, ptNode ? ptNode.getID() : emptyID, cs.calleeFuncID);
        }

        let srcNodes: NodeID[] = [];
        // Add reachable

        let calleeNode = this.cg.getNode(cs.calleeFuncID) as CallGraphNode;
        let calleeMethod: ArkMethod | null = this.scene.getMethod(calleeNode.getMethod());
        if (!calleeMethod) {
            // TODO: check if nodes need to delete
            return srcNodes;
        }
        if (calleeNode.isSdkMethod()) {
            logger.warn(`SDK method ${calleeMethod.getSignature().toString()} should be handled by plugin (ignored)`);
            return srcNodes;
        }

        if (!calleeMethod.getCfg()) {
            // method have no cfg body
            return srcNodes;
        }

        let calleeCS = this.buildFuncPagAndAddToWorklist(new CSFuncID(calleeCid, cs.calleeFuncID));
        // callee cid will updated if callee is singleton
        calleeCid = calleeCS.cid;

        let realArgs: Value[] = cs.args ?? [];
        let argsOffset: number = 0;
        if (ptNode && ptNode instanceof PagFuncNode && ptNode.getCS()) {
            // for ptr invoke cloned by Function.bind()
            realArgs = ptNode.getCS().args ?? [];
            argsOffset = ptNode.getArgsOffset() ?? 0;
            callerCid = ptNode.getOriginCid() ?? callerCid;
        }

        srcNodes.push(...this.addCallParamPagEdge(calleeMethod, realArgs, cs, callerCid, calleeCid, argsOffset));
        srcNodes.push(...this.addCallReturnPagEdge(calleeMethod, cs.callStmt, callerCid, calleeCid));

        return srcNodes;
    }

    /**
     * only process the param PAG edge for invoke stmt
     */
    public addCallParamPagEdge(calleeMethod: ArkMethod, args: Value[], cs: ICallSite, callerCid: ContextID, calleeCid: ContextID, offset: number): NodeID[] {
        let callStmt = cs.callStmt;

        const params = this.pluginManager.getSDKParamValue(calleeMethod) ??
            calleeMethod
                .getCfg()!
                .getStmts()
                .filter(stmt => stmt instanceof ArkAssignStmt && stmt.getRightOp() instanceof ArkParameterRef)
                .map(stmt => (stmt as ArkAssignStmt).getRightOp());

        let srcNodes: NodeID[] = [];

        // add args to parameters edges
        for (let i = offset; i <= args.length; i++) {
            let arg = args[i];
            let param = params[i - offset];
            if (!arg || !param) {
                return srcNodes;
            }

            if (arg instanceof Constant || arg instanceof AbstractExpr) {
                // TODO: handle AbstractExpr
                continue;
            }

            // Get or create new PAG node for argument and parameter
            let srcPagNode = this.getOrNewPagNode(callerCid, arg, callStmt);
            let dstPagNode = this.getOrNewPagNode(calleeCid, param, callStmt);

            // Record arrow function object node for later thisPt setup
            if (srcPagNode instanceof PagFuncNode) {
                this.recordArrowFunctionObjectNode(srcPagNode, arg);
            }

            this.pag.addPagEdge(srcPagNode, dstPagNode, PagEdgeKind.Copy, callStmt);
            srcNodes.push(srcPagNode.getID());
            // TODO: handle other types of parmeters
        }

        return srcNodes;
    }

    /**
     * process the return value PAG edge for invoke stmt
     */
    public addCallReturnPagEdge(calleeMethod: ArkMethod, callStmt: Stmt, callerCid: ContextID, calleeCid: ContextID): NodeID[] {
        let srcNodes: NodeID[] = [];
        // add ret to caller edges
        let retStmts = calleeMethod.getReturnStmt();
        // TODO: call statement must be a assignment state
        if (callStmt instanceof ArkAssignStmt) {
            let retDst = callStmt.getLeftOp();
            for (let retStmt of retStmts) {
                let retValue = (retStmt as ArkReturnStmt).getOp();
                if (retValue instanceof Local) {
                    let srcPagNode = this.getOrNewPagNode(calleeCid, retValue, retStmt);
                    let dstPagNode = this.getOrNewPagNode(callerCid, retDst, callStmt);

                    this.pag.addPagEdge(srcPagNode, dstPagNode, PagEdgeKind.Copy, retStmt);
                } else if (retValue instanceof Constant) {
                    continue;
                } else if (retValue instanceof AbstractExpr) {
                    logger.debug(retValue);
                    continue;
                } else {
                    throw new Error('return dst not a local or constant, but: ' + retValue.getType().toString());
                }
            }
        }

        return srcNodes;
    }

    /**
     * for method level call graph, add return edge
     */
    public addStaticPagCallReturnEdge(cs: CallSite, cid: ContextID, baseClassPTNode: NodeID): NodeID[] {
        let srcNodes: NodeID[] = [];
        // Add reachable

        let calleeNode = this.cg.getNode(cs.calleeFuncID) as CallGraphNode;
        let calleeMethod: ArkMethod | null = this.scene.getMethod(calleeNode.getMethod());
        let calleeCid = this.ctxSelector.selectContext(cid, cs, baseClassPTNode, cs.calleeFuncID);
        if (!calleeMethod) {
            // TODO: check if nodes need to delete
            return srcNodes;
        }
        srcNodes.push(...this.addSDKMethodReturnPagEdge(cs, cid, calleeCid, calleeMethod)); // TODO: ???? why sdk
        return srcNodes;
    }

    private addSDKMethodReturnPagEdge(cs: CallSite, callerCid: ContextID, calleeCid: ContextID, calleeMethod: ArkMethod): NodeID[] {
        let srcNodes: NodeID[] = [];
        let returnType = calleeMethod.getReturnType();
        if (!(returnType instanceof ClassType) || !(cs.callStmt instanceof ArkAssignStmt)) {
            return srcNodes;
        }

        // check fake heap object exists or not
        let cidMap = this.sdkMethodReturnValueMap.get(calleeMethod);
        if (!cidMap) {
            cidMap = new Map();
        }
        let newExpr = cidMap.get(calleeCid);
        if (!newExpr) {
            if (returnType instanceof ClassType) {
                newExpr = new ArkNewExpr(returnType);
            }
        }
        cidMap.set(calleeCid, newExpr!);
        this.sdkMethodReturnValueMap.set(calleeMethod, cidMap);

        let srcPagNode = this.getOrNewPagNode(calleeCid, newExpr!);
        let dstPagNode = this.getOrNewPagNode(callerCid, cs.callStmt.getLeftOp(), cs.callStmt);

        this.pag.addPagEdge(srcPagNode, dstPagNode, PagEdgeKind.Address, cs.callStmt);
        srcNodes.push(srcPagNode.getID());
        return srcNodes;
    }

    public getOrNewPagNode(cid: ContextID, v: PagNodeType, s?: Stmt): PagNode {
        // globalThis process can not be removed while all `globalThis` ref is the same Value
        if (v instanceof Local && v.getName() === GLOBAL_THIS_NAME && v.getDeclaringStmt() == null) {
            // globalThis node has no cid
            return this.getOrNewGlobalThisNode(-1);
        }

        if (v instanceof ArkInstanceFieldRef || v instanceof ArkStaticFieldRef) {
            v = this.getRealInstanceRef(v);
        }

        return this.pag.getOrNewNode(cid, v, s);
    }

    public getOrNewGlobalThisNode(cid: ContextID): PagNode {
        return this.pag.getOrNewNode(cid, this.getGlobalThisValue());
    }

    /*
     * In ArkIR, ArkField has multiple instances for each stmt which use it
     * But the unique one is needed for pointer analysis
     * This is a temp solution to use a ArkField->(first instance)
     *  as the unique instance
     *
     * node merge condition:
     * instance field: value and ArkField
     * static field: ArkField
     */
    public getRealInstanceRef(v: Value): Value {
        if (!(v instanceof ArkInstanceFieldRef || v instanceof ArkStaticFieldRef)) {
            return v;
        }

        let sig = v.getFieldSignature();
        let sigStr = sig.toString();
        let base: Local;
        let real: Value | undefined;

        if (v instanceof ArkInstanceFieldRef) {
            base = (v as ArkInstanceFieldRef).getBase();
            if (base instanceof Local && base.getName() === GLOBAL_THIS_NAME && base.getDeclaringStmt() == null) {
                // replace the base in fieldRef
                base = this.getGlobalThisValue();
                (v as ArkInstanceFieldRef).setBase(base as Local);
            }
            let key = `${base.getSignature()}-${sigStr}`;

            real = this.instanceField2UniqInstanceMap.get(key);
            if (!real) {
                this.instanceField2UniqInstanceMap.set(key, v);
                real = v;
            }
        } else {
            real = this.staticField2UniqInstanceMap.get(sigStr);
            if (!real) {
                this.staticField2UniqInstanceMap.set(sigStr, v);
                real = v;
            }
        }
        return real;
    }

    /**
     * check if a method is singleton function
     * rule: static method, assign heap obj to global var or static field, return the receiver
     */
    public isSingletonFunction(funcID: FuncID): boolean {
        if (this.singletonFuncMap.has(funcID)) {
            return this.singletonFuncMap.get(funcID)!;
        }

        let arkMethod = this.cg.getArkMethodByFuncID(funcID);
        if (!arkMethod) {
            this.singletonFuncMap.set(funcID, false);
            return false;
        }

        if (!arkMethod.isStatic()) {
            this.singletonFuncMap.set(funcID, false);
            return false;
        }

        let funcPag = this.funcPags.get(funcID)!;
        let heapObjects = [...funcPag.getInternalEdges()!].filter(edge => edge.kind === PagEdgeKind.Address).map(edge => edge.dst);

        let returnValues = arkMethod.getReturnValues();

        let result = this.isValueConnected([...funcPag.getInternalEdges()!], heapObjects, returnValues);
        this.singletonFuncMap.set(funcID, result);
        if (result) {
            logger.info(`function ${funcID} is marked as singleton function`);
        }
        return result;
    }

    private isValueConnected(edges: IntraProceduralEdge[], leftNodes: Value[], targetNodes: Value[]): boolean {
        // build funcPag graph
        const graph = new Map<Value, Value[]>();
        let hasStaticFieldOrGlobalVar: boolean = false;

        for (const edge of edges) {
            let dst = this.getRealInstanceRef(edge.dst);
            let src = this.getRealInstanceRef(edge.src);
            if (!graph.has(dst)) {
                graph.set(dst, []);
            }
            if (!graph.has(src)) {
                graph.set(src, []);
            }

            if (dst instanceof ArkStaticFieldRef || src instanceof ArkStaticFieldRef) {
                hasStaticFieldOrGlobalVar = true;
            }

            graph.get(src)!.push(dst);
        }

        if (!hasStaticFieldOrGlobalVar) {
            return false;
        }

        for (const targetNode of targetNodes) {
            for (const leftNode of leftNodes) {
                const visited = new Set<Value>();
                let meetStaticField = false;
                if (this.funcPagDfs(graph, visited, leftNode, targetNode, meetStaticField)) {
                    return true; // a value pair that satisfy condition
                }

                if (!meetStaticField) {
                    break; // heap obj will not deal any more
                }
            }
        }

        return false;
    }

    private funcPagDfs(graph: Map<Value, Value[]>, visited: Set<Value>, currentNode: Value, targetNode: Value, staticFieldFound: boolean): boolean {
        if (currentNode === targetNode) {
            return staticFieldFound;
        }

        visited.add(currentNode);

        for (const neighbor of graph.get(currentNode) || []) {
            // TODO: add global variable
            const isSpecialNode = neighbor instanceof ArkStaticFieldRef;

            if (!visited.has(neighbor)) {
                if (isSpecialNode) {
                    staticFieldFound = true;
                }

                if (this.funcPagDfs(graph, visited, neighbor, targetNode, staticFieldFound)) {
                    return true;
                }
            }
        }

        return false;
    }

    public getGlobalThisValue(): Local {
        return this.globalThisValue;
    }

    private getEdgeKindForAssignStmt(stmt: ArkAssignStmt): PagEdgeKind {
        if (this.stmtIsCreateAddressObj(stmt)) {
            return PagEdgeKind.Address;
        }

        if (this.stmtIsCopyKind(stmt)) {
            return PagEdgeKind.Copy;
        }

        if (this.stmtIsReadKind(stmt)) {
            return PagEdgeKind.Load;
        }

        if (this.stmtIsWriteKind(stmt)) {
            return PagEdgeKind.Write;
        }

        return PagEdgeKind.Unknown;
    }

    /**\
     * ArkNewExpr, ArkNewArrayExpr, function ptr, globalThis
     */
    private stmtIsCreateAddressObj(stmt: ArkAssignStmt): boolean {
        let lhOp = stmt.getLeftOp();
        let rhOp = stmt.getRightOp();
        if (
            rhOp instanceof ArkNewExpr ||
            rhOp instanceof ArkNewArrayExpr ||
            (lhOp instanceof Local &&
                ((rhOp instanceof Local && rhOp.getType() instanceof FunctionType && rhOp.getDeclaringStmt() === null) ||
                    (rhOp instanceof AbstractFieldRef && rhOp.getType() instanceof FunctionType))) ||
            (rhOp instanceof Local && rhOp.getName() === GLOBAL_THIS_NAME && rhOp.getDeclaringStmt() == null)
        ) {
            return true;
        }

        // TODO: add other Address Obj creation
        // like static object
        return false;
    }

    private stmtIsCopyKind(stmt: ArkAssignStmt): boolean {
        let lhOp = stmt.getLeftOp();
        let rhOp = stmt.getRightOp();

        let condition: boolean =
            (lhOp instanceof Local &&
                (rhOp instanceof Local || rhOp instanceof ArkParameterRef ||
                    rhOp instanceof ArkThisRef || rhOp instanceof ArkStaticFieldRef ||
                    rhOp instanceof ClosureFieldRef)) ||
            (lhOp instanceof ArkStaticFieldRef && rhOp instanceof Local);

        if (condition) {
            return true;
        }
        return false;
    }

    private stmtIsWriteKind(stmt: ArkAssignStmt): boolean {
        let lhOp = stmt.getLeftOp();
        let rhOp = stmt.getRightOp();

        if (rhOp instanceof Local && (lhOp instanceof ArkInstanceFieldRef || lhOp instanceof ArkArrayRef)) {
            return true;
        }
        return false;
    }

    private stmtIsReadKind(stmt: ArkAssignStmt): boolean {
        let lhOp = stmt.getLeftOp();
        let rhOp = stmt.getRightOp();

        if (lhOp instanceof Local && (rhOp instanceof ArkInstanceFieldRef || rhOp instanceof ArkArrayRef)) {
            return true;
        }
        return false;
    }

    public addToDynamicCallSite(funcPag: FuncPag, cs: DynCallSite): void {
        funcPag.addDynamicCallSite(cs);
        this.pagStat.numDynamicCall++;

        logger.trace('[add dynamic callSite] ' + cs.callStmt.toString() + ':  ' + cs.callStmt.getCfg()?.getDeclaringMethod().getSignature().toString());
    }

    public setPtForNode(node: NodeID, pts: IPtsCollection<NodeID> | undefined): void {
        if (!pts) {
            return;
        }

        (this.pag.getNode(node) as PagNode).setPointTo(pts);
    }

    public getRealThisLocal(input: Local, funcId: FuncID): Local {
        if (input.getName() !== 'this') {
            return input;
        }
        let real = input;

        let f = this.cg.getArkMethodByFuncID(funcId);
        f
            ?.getCfg()
            ?.getStmts()
            .forEach(s => {
                if (s instanceof ArkAssignStmt && s.getLeftOp() instanceof Local) {
                    if ((s.getLeftOp() as Local).getName() === 'this') {
                        real = s.getLeftOp() as Local;
                        return;
                    }
                }
            });
        return real;
    }

    public doStat(): void {
        this.pagStat.numTotalNode = this.pag.getNodeNum();
    }

    public printStat(): void {
        this.pagStat.printStat();
    }

    public getStat(): string {
        return this.pagStat.getStat();
    }

    public getUnhandledFuncs(): FuncID[] {
        let handledFuncs = this.getHandledFuncs();
        let unhandleFuncs = Array.from(this.cg.getNodesIter())
            .filter(f => !handledFuncs.includes(f.getID()))
            .map(f => f.getID());
        return unhandleFuncs;
    }

    public getHandledFuncs(): FuncID[] {
        return Array.from(this.funcPags.keys());
    }

    /**
     * build export edge in internal func pag
     * @param value: Value that need to check if it is from import/export
     * @param originValue: if Value if InstanceFieldRef, the base will be passed to `value` recursively,
     *                      fieldRef will be passed to `originValue`
     */
    private handleValueFromExternalScope(value: Value, funcID: FuncID, originValue?: Value): void {
        if (value instanceof Local) {
            if (value.getDeclaringStmt() || value.getName() === 'this') {
                // not from external scope
                return;
            }

            if (!value.getType()) {
                return;
            }

            let srcLocal = this.getSourceValueFromExternalScope(value, funcID);

            if (srcLocal) {
                // if `value` is from field base, use origin value(fieldRef) instead
                this.addInterFuncEdge(srcLocal, originValue ?? value, funcID);
            }
        } else if (value instanceof ArkInstanceFieldRef) {
            let base = value.getBase();
            if (base) {
                this.handleValueFromExternalScope(base, funcID, value);
            }
        }
    }

    private addInterFuncEdge(src: Local, dst: Value, funcID: FuncID): void {
        this.interFuncPags = this.interFuncPags ?? new Map();
        let interFuncPag = this.interFuncPags.get(funcID) ?? new InterFuncPag();
        // Export a local
        // Add a InterProcedural edge
        if (dst instanceof Local) {
            let e: InterProceduralEdge = {
                src: src,
                dst: dst,
                kind: PagEdgeKind.InterProceduralCopy,
            };
            interFuncPag.addToInterProceduralEdgeSet(e);
            this.addExportVariableMap(src, dst as Local);
        } else if (dst instanceof ArkInstanceFieldRef) {
            // record the export base use
            this.addExportVariableMap(src, dst.getBase());
        }
        this.interFuncPags.set(funcID, interFuncPag);

        // Put the function which the src belongs to to worklist
        let srcFunc = src.getDeclaringStmt()?.getCfg().getDeclaringMethod();
        if (srcFunc) {
            let srcFuncID = this.cg.getCallGraphNodeByMethod(srcFunc.getSignature()).getID();
            let cid = this.ctxSelector.emptyContext(funcID);
            let csFuncID = new CSFuncID(cid, srcFuncID);
            this.buildFuncPagAndAddToWorklist(csFuncID);
        }
        // Extend other types of src here
    }

    private getSourceValueFromExternalScope(value: Local, funcID: FuncID): Local | undefined {
        let sourceValue;

        sourceValue = this.getDefaultMethodSourceValue(value, funcID);
        if (!sourceValue) {
            sourceValue = this.getExportSourceValue(value, funcID);
        }

        return sourceValue;
    }

    private getDefaultMethodSourceValue(value: Local, funcID: FuncID): Local | undefined {
        // namespace check
        let arkMethod = this.cg.getArkMethodByFuncID(funcID);
        if (!arkMethod) {
            return undefined;
        }

        let declaringNameSpace = arkMethod.getDeclaringArkClass().getDeclaringArkNamespace();
        while (declaringNameSpace) {
            let nameSpaceLocals = declaringNameSpace.getDefaultClass().getDefaultArkMethod()?.getBody()?.getLocals() ?? new Map();
            if (nameSpaceLocals.has(value.getName())) {
                return nameSpaceLocals.get(value.getName());
            }

            declaringNameSpace = declaringNameSpace.getDeclaringArkNamespace() ?? undefined;
        }

        // file check
        let declaringFile = arkMethod.getDeclaringArkFile();
        let fileLocals = declaringFile.getDefaultClass().getDefaultArkMethod()?.getBody()?.getLocals() ?? new Map();
        if (!fileLocals.has(value.getName())) {
            return undefined;
        }

        return fileLocals.get(value.getName());
    }

    private getExportSourceValue(value: Local, funcID: FuncID): Local | undefined {
        let curMethod = this.cg.getArkMethodByFuncID(funcID);
        if (!curMethod) {
            return undefined;
        }

        let curFile = curMethod.getDeclaringArkFile();
        let impInfo = curFile.getImportInfoBy(value.getName());
        if (!impInfo) {
            return undefined;
        }

        let exportSource = impInfo.getLazyExportInfo();
        if (!exportSource) {
            return undefined;
        }

        let exportSouceValue = exportSource.getArkExport();
        if (exportSouceValue instanceof Local) {
            return exportSouceValue;
        }
        return undefined;
    }

    private addExportVariableMap(src: Local, dst: Local): void {
        let exportMap: Local[] = this.externalScopeVariableMap.get(src) ?? [];
        if (!exportMap.includes(dst)) {
            exportMap.push(dst);
            this.externalScopeVariableMap.set(src, exportMap);
        }
    }

    public getExportVariableMap(src: Local): Local[] {
        return this.externalScopeVariableMap.get(src) ?? [];
    }

    /// Add inter-procedural Pag Nodes and Edges
    public addEdgesFromInterFuncPag(interFuncPag: InterFuncPag, cid: ContextID): boolean {
        let edges = interFuncPag.getInterProceduralEdges();
        if (edges.size === 0) {
            return false;
        }

        for (let e of edges) {
            // Existing local exported nodes -> ExportNode
            let exportLocal = e.src;
            let dstPagNode = this.getOrNewPagNode(cid, e.dst);

            // get export local node in all cid
            let existingNodes = this.pag.getNodesByValue(exportLocal);
            existingNodes?.forEach(n => {
                this.pag.addPagEdge(this.pag.getNode(n)! as PagNode, dstPagNode, e.kind);
                this.retriggerNodesList.add(n);
            });
        }

        return true;
    }

    public getRetriggerNodes(): NodeID[] {
        let retriggerNodes = Array.from(this.retriggerNodesList);
        this.retriggerNodesList.clear();
        return retriggerNodes;
    }

    public addUpdatedNode(nodeID: NodeID, diffPT: IPtsCollection<NodeID>): void {
        let ptaConfig = PointerAnalysisConfig.getInstance();
        let updatedNode = this.updatedNodesThisRound.get(nodeID) ?? new ptaConfig.ptsCollectionCtor();
        updatedNode.union(diffPT);
        this.updatedNodesThisRound.set(nodeID, updatedNode);
    }

    public getUpdatedNodes(): Map<number, IPtsCollection<number>> {
        return this.updatedNodesThisRound;
    }

    public resetUpdatedNodes(): void {
        this.updatedNodesThisRound.clear();
    }

    public getContextSelector(): ContextSelector {
        return this.ctxSelector;
    }

    /**
     * Record arrow function object node for later thisPt setup
     */
    private recordArrowFunctionObjectNode(funcNode: PagFuncNode, funcValue: Value): void {
        const methodSig = funcNode.getMethod();
        if (!methodSig) {
            return;
        }

        const funcName = methodSig.getMethodSubSignature().getMethodName();

        // Only record arrow functions (name contains %AM)
        if (funcName.includes('%AM')) {
            this.arrowFunctionObjectMap.set(funcName, funcNode.getID());
            logger.debug(`Recorded arrow function object: ${funcName} -> Node ${funcNode.getID()}`);
        }
    }

    /**
     * Set up 'this' binding for arrow functions
     * 1. Set the thisPt of arrow function object node (pointing to ThisRef node inside arrow function body)
     * 2. Establish This edge from arrow function's ThisRef to outer function's this
     */
    private setupArrowFunctionThis(funcID: FuncID, cid: ContextID): void {
        const arkMethod = this.cg.getArkMethodByFuncID(funcID);
        if (!arkMethod) {
            return;
        }

        // Check if this is an arrow function (name contains %AM)
        const funcName = arkMethod.getName();
        if (!funcName.includes('%AM')) {
            return;
        }

        logger.debug(`Setting up arrow function this for ${funcName} (FuncID: ${funcID}, Ctx: ${cid})`);

        // 1. Get ThisRef node inside the arrow function body
        const arrowFuncThisRefID = this.recordThisRefNode(arkMethod, cid);
        if (arrowFuncThisRefID === -1) {
            return;
        }

        // 2. Look up arrow function object node from map (O(1))
        const arrowFuncObjNodeID = this.arrowFunctionObjectMap.get(funcName);
        if (arrowFuncObjNodeID !== undefined) {
            const funcNode = this.pag.getNode(arrowFuncObjNodeID) as PagFuncNode;
            funcNode.setThisPt(arrowFuncThisRefID);
            logger.debug(`Set function object node ${arrowFuncObjNodeID} thisPt to ThisRef ${arrowFuncThisRefID}`);
        } else {
            logger.warn(`Arrow function object node not found for ${funcName}`);
        }

        // 3. Get the outer function of arrow function and establish This edge
        const outerMethod = arkMethod.getOuterMethod();
        if (!outerMethod) {
            logger.warn(`Could not find outer method for arrow function ${funcName}`);
            return;
        }

        logger.debug(`Arrow function outer method: ${outerMethod.getName()}`);

        // Get context of arrow function object node (in which context of outer function the arrow function object is created)
        const arrowFuncObjNode = arrowFuncObjNodeID !== undefined ? this.pag.getNode(arrowFuncObjNodeID) as PagNode : undefined;
        const outerContextID = arrowFuncObjNode?.getCid();

        // Find 'this' local node of outer function in specified context
        const outerThisNode = this.findThisNodeForMethod(outerMethod, outerContextID);
        if (outerThisNode) {
            const arrowFuncThisRef = this.pag.getNode(arrowFuncThisRefID) as PagThisRefNode;

            // Establish This edge: outer this -> arrow function ThisRef
            if (this.pag.addPagEdge(outerThisNode, arrowFuncThisRef, PagEdgeKind.This)) {
                logger.info(`Connected arrow function ${funcName} this (Node ${arrowFuncThisRefID}) to outer this (Node ${outerThisNode.getID()})`);

                // Add outer this node to retrigger list to ensure pointer propagation
                this.retriggerNodesList.add(outerThisNode.getID());
            }
        }
    }

    /**
     * Find 'this' local node for the specified method in the specified context
     * @param method Target method
     * @param contextID Optional context ID. If not specified, returns the 'this' node in the first found context
     */
    private findThisNodeForMethod(method: ArkMethod, contextID?: ContextID): PagLocalNode | undefined {
        const cfg = method.getCfg();
        if (!cfg) { return undefined; }

        // Find 'this' assignment statement in method: this = this: ClassName
        const thisAssignStmt = cfg
            .getStmts()
            .find(s => s instanceof ArkAssignStmt && s.getRightOp() instanceof ArkThisRef);

        if (!thisAssignStmt) { return undefined; }

        const thisLocal = (thisAssignStmt as ArkAssignStmt).getLeftOp();
        if (!(thisLocal instanceof Local)) { return undefined; }

        const ctx2NodeMap = this.pag.getNodesByValue(thisLocal);
        if (!ctx2NodeMap || ctx2NodeMap.size === 0) { return undefined; }

        // If context is specified, find node in that context
        if (contextID !== undefined) {
            const nodeID = ctx2NodeMap.get(contextID);
            if (nodeID === undefined) { return undefined; }
            return this.pag.getNode(nodeID) as PagLocalNode;
        }

        // Otherwise return 'this' node in the first found context
        const firstNodeID = ctx2NodeMap.values().next().value;
        if (firstNodeID === undefined) { return undefined; }
        return this.pag.getNode(firstNodeID) as PagLocalNode;
    }
}
