/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import { Constant } from '../../../core/base/Constant';
import { AbstractInvokeExpr, ArkInstanceInvokeExpr, ArkStaticInvokeExpr } from '../../../core/base/Expr';
import { Local } from '../../../core/base/Local';
import { Stmt, ArkAssignStmt } from '../../../core/base/Stmt';
import { ClassType, StringType } from '../../../core/base/Type';
import { Value } from '../../../core/base/Value';
import { NodeID } from '../../../core/graph/GraphTraits';
import { CallGraph, CallGraphNode } from '../../model/CallGraph';
import { ICallSite } from '../../model/CallSite';
import { ContextID } from '../context/Context';
import { Pag, PagEdgeKind, PagLocalNode, PagNode } from '../Pag';
import { PagBuilder } from '../PagBuilder';
import { IPagPlugin } from './IPagPlugin';

export enum StorageType {
    APP_STORAGE,
    LOCAL_STORAGE,
    SUBSCRIBED_ABSTRACT_PROPERTY,
    Undefined,
};

export enum StorageLinkEdgeType {
    Property2Local,
    Local2Property,
    TwoWay,
};

/**
 * StoragePlugin processes AppStorage, LocalStorage, and SubscribedAbstractProperty APIs.
 */
export class StoragePlugin implements IPagPlugin {
    pag: Pag;
    pagBuilder: PagBuilder;
    cg: CallGraph;
    private storagePropertyMap: Map<StorageType, Map<string, Local>> = new Map();

    constructor(pag: Pag, pagBuilder: PagBuilder, cg: CallGraph) {
        this.pag = pag;
        this.pagBuilder = pagBuilder;
        this.cg = cg;

        // Initialize storagePropertyMap for each StorageType
        this.storagePropertyMap.set(StorageType.APP_STORAGE, new Map());
        this.storagePropertyMap.set(StorageType.LOCAL_STORAGE, new Map());
    }

    getName(): string {
        return 'StoragePlugin';
    }

    canHandle(cs: ICallSite, cgNode: CallGraphNode): boolean {
        const storageName = cgNode.getMethod().getDeclaringClassSignature().getClassName();
        return this.getStorageType(storageName) !== StorageType.Undefined;
    }

    processCallSite(cs: ICallSite, cid: ContextID, emptyNode: NodeID): NodeID[] {
        let calleeFuncID = cs.getCalleeFuncID();
        if (!calleeFuncID) {
            return [];
        }

        const cgNode = this.cg.getNode(calleeFuncID) as CallGraphNode;
        const storageName = cgNode.getMethod().getDeclaringClassSignature().getClassName();
        const storageType = this.getStorageType(storageName);
        const calleeName = cgNode.getMethod().getMethodSubSignature().getMethodName();

        return this.processStorageAPI(cs, cid, storageType, calleeName, this.pagBuilder);
    }

    /**
     * get storageType enum with method's Declaring ClassName
     *
     * @param storageName ClassName that method belongs to, currently support AppStorage and SubscribedAbstractProperty
     * SubscribedAbstractProperty: in following listing, `link1` is infered as ClassType `SubscribedAbstractProperty`,
     * it needs to get PAG node to check the StorageType
     * let link1: SubscribedAbstractProperty<A> = AppStorage.link('PropA');
     * link1.set(a);
     * @param cs: for search PAG node in SubscribedAbstractProperty
     * @param cid: for search PAG node in SubscribedAbstractProperty
     * @returns StorageType enum
     */
    private getStorageType(storageName: string): StorageType {
        switch (storageName) {
            case 'AppStorage':
                return StorageType.APP_STORAGE;
            case 'SubscribedAbstractProperty':
                return StorageType.SUBSCRIBED_ABSTRACT_PROPERTY;
            case 'LocalStorage':
                return StorageType.LOCAL_STORAGE;
            default:
                return StorageType.Undefined;
        }
    }

    private processStorageAPI(cs: ICallSite, cid: ContextID, storageType: StorageType, calleeName: string, pagBuilder: PagBuilder): NodeID[] {
        let srcNodes: NodeID[] = [];
        switch (calleeName) {
            case 'setOrCreate':
                this.processStorageSetOrCreate(cs, cid, storageType, srcNodes);
                break;
            case 'link':
                this.processStorageLink(cs, cid, storageType, srcNodes);
                break;
            case 'prop':
                this.processStorageProp(cs, cid, storageType, srcNodes);
                break;
            case 'set':
                this.processStorageSet(cs, cid, storageType, srcNodes);
                break;
            case 'get':
                this.processStorageGet(cs, cid, storageType, srcNodes);
                break;
            default:
                break;
        };

        return srcNodes;
    }

    private processStorageSetOrCreate(cs: ICallSite, cid: ContextID, storageType: StorageType, srcNodes: NodeID[]): void {
        let propertyStr = this.getPropertyName(cs.args![0]);
        if (!propertyStr) {
            return;
        }

        let propertyName = propertyStr;
        let propertyNode = this.getOrNewPropertyNode(StorageType.APP_STORAGE, propertyName);

        if (storageType === StorageType.APP_STORAGE) {
            let storageObj = cs.args![1];

            this.addPropertyLinkEdge(propertyNode, storageObj, cid, cs.callStmt, StorageLinkEdgeType.Local2Property, srcNodes);
        } else if (storageType === StorageType.LOCAL_STORAGE) {
            // TODO: WIP
        }

        return;
    }

    /**
     * search the storage map to get propertyNode with given storage and propertyFieldName
     * @param storage storage type: AppStorage, LocalStorage etc.
     * @param propertyName string property key
     * @returns propertyNode: PagLocalNode
     */
    public getOrNewPropertyNode(storage: StorageType, propertyName: string): PagNode {
        let storageMap = this.storagePropertyMap.get(storage)!;

        let propertyLocal = storageMap.get(propertyName);

        if (!propertyLocal) {
            switch (storage) {
                case StorageType.APP_STORAGE:
                    propertyLocal = new Local('AppStorage.' + propertyName);
                    break;
                case StorageType.LOCAL_STORAGE:
                    propertyLocal = new Local('LocalStorage.' + propertyName);
                    break;
                default:
                    propertyLocal = new Local(propertyName);
            };
            storageMap.set(propertyName, propertyLocal);
        }

        return this.pag.getOrNewNode(-1, propertyLocal);
    }

    /**
     * add PagEdge
     * @param edgeKind: edge kind differs from API
     * @param propertyNode: PAG node created by protpertyName
     * @param obj: heapObj stored with Storage API
     */
    public addPropertyLinkEdge(propertyNode: PagNode, storageObj: Value, cid: ContextID, stmt: Stmt, edgeKind: number, srcNodes: NodeID[]): void {
        if (!(storageObj.getType() instanceof ClassType)) {
            return;
        }

        let objNode = this.pag.getOrNewNode(cid, storageObj) as PagNode;
        if (edgeKind === StorageLinkEdgeType.Property2Local) {
            // propertyNode --> objNode
            this.pag.addPagEdge(propertyNode, objNode, PagEdgeKind.Copy, stmt);
            srcNodes.push(propertyNode.getID());
        } else if (edgeKind === StorageLinkEdgeType.Local2Property) {
            // propertyNode <-- objNode
            this.pag.addPagEdge(objNode, propertyNode, PagEdgeKind.Copy, stmt);
            srcNodes.push(objNode.getID());
        } else if (edgeKind === StorageLinkEdgeType.TwoWay) {
            // propertyNode <-> objNode
            this.pag.addPagEdge(propertyNode, objNode, PagEdgeKind.Copy, stmt);
            this.pag.addPagEdge(objNode, propertyNode, PagEdgeKind.Copy, stmt);
            srcNodes.push(propertyNode.getID(), objNode.getID());
        }
        return;
    }

    private processStorageLink(cs: ICallSite, cid: ContextID, storageType: StorageType, srcNodes: NodeID[]): void {
        let propertyStr = this.getPropertyName(cs.args![0]);
        if (!propertyStr) {
            return;
        }

        let propertyName = propertyStr;
        let propertyNode = this.getOrNewPropertyNode(StorageType.APP_STORAGE, propertyName);
        let leftOp = (cs.callStmt as ArkAssignStmt).getLeftOp() as Local;
        let linkedOpNode = this.pag.getOrNewNode(cid, leftOp) as PagNode;

        if (storageType === StorageType.APP_STORAGE) {
            if (linkedOpNode instanceof PagLocalNode) {
                linkedOpNode.setStorageLink(StorageType.APP_STORAGE, propertyName);
            }

            this.pag.addPagEdge(propertyNode, linkedOpNode, PagEdgeKind.Copy);
            this.pag.addPagEdge(linkedOpNode, propertyNode, PagEdgeKind.Copy);
            srcNodes.push(propertyNode.getID(), linkedOpNode.getID());
        } else if (storageType === StorageType.LOCAL_STORAGE) {
            // TODO: WIP
        }
        return;
    }

    private processStorageProp(cs: ICallSite, cid: ContextID, storageType: StorageType, srcNodes: NodeID[]): void {
        let propertyStr = this.getPropertyName(cs.args![0]);
        if (!propertyStr) {
            return;
        }

        let propertyName = propertyStr;
        let propertyNode = this.getOrNewPropertyNode(StorageType.APP_STORAGE, propertyName);
        let leftOp = (cs.callStmt as ArkAssignStmt).getLeftOp() as Local;
        let propedOpNode = this.pag.getOrNewNode(cid, leftOp) as PagNode;

        if (storageType === StorageType.APP_STORAGE) {
            if (propedOpNode instanceof PagLocalNode) {
                propedOpNode.setStorageLink(StorageType.APP_STORAGE, propertyName);
            }
            this.pag.addPagEdge(propertyNode, propedOpNode, PagEdgeKind.Copy);
            srcNodes.push(propertyNode.getID());
        } else if (storageType === StorageType.LOCAL_STORAGE) {
            // TODO: WIP
        }

        return;
    }

    private processStorageSet(cs: ICallSite, cid: ContextID, storageType: StorageType, srcNodes: NodeID[]): void {
        let ivkExpr: AbstractInvokeExpr = cs.callStmt.getInvokeExpr()!;

        if (ivkExpr instanceof ArkInstanceInvokeExpr) {
            let base = ivkExpr.getBase();
            let baseNode = this.pag.getOrNewNode(cid, base) as PagLocalNode;

            if (baseNode.isStorageLinked()) {
                let argsNode = this.pag.getOrNewNode(cid, cs.args![0]) as PagNode;

                this.pag.addPagEdge(argsNode, baseNode, PagEdgeKind.Copy);
                srcNodes.push(argsNode.getID());
                return;
            }
        } else if (ivkExpr instanceof ArkStaticInvokeExpr) {
            // TODO: process AppStorage.set()
        }

        return;
    }

    private processStorageGet(cs: ICallSite, cid: ContextID, storageType: StorageType, srcNodes: NodeID[]): void {
        if (!(cs.callStmt instanceof ArkAssignStmt)) {
            return;
        }

        let leftOp = (cs.callStmt as ArkAssignStmt).getLeftOp() as Local;
        let leftOpNode = this.pag.getOrNewNode(cid, leftOp) as PagNode;
        let ivkExpr = cs.callStmt.getInvokeExpr();
        let propertyName!: string;
        if (ivkExpr instanceof ArkStaticInvokeExpr) {
            let propertyStr = this.getPropertyName(cs.args![0]);
            if (propertyStr) {
                propertyName = propertyStr;
            }

            let propertyNode = this.getOrNewPropertyNode(storageType, propertyName);
            if (!propertyNode) {
                return;
            }

            this.pag.addPagEdge(propertyNode, leftOpNode, PagEdgeKind.Copy, cs.callStmt);
            srcNodes.push(propertyNode.getID());
        } else if (ivkExpr instanceof ArkInstanceInvokeExpr) {
            let baseNode = this.pag.getOrNewNode(cid, ivkExpr.getBase()) as PagLocalNode;
            this.pag.addPagEdge(baseNode, leftOpNode, PagEdgeKind.Copy, cs.callStmt);
            srcNodes.push(baseNode.getID());
        }

        return;
    }

    private getPropertyName(value: Value): string | undefined {
        if (value instanceof Local) {
            let type = value.getType();
            if (type instanceof StringType) {
                return type.getName();
            }
        } else if (value instanceof Constant) {
            return value.getValue();
        }

        return undefined;
    }
}