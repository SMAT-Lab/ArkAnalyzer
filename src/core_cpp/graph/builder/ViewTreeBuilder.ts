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

import { Constant } from '../../base/Constant';
import { Decorator } from '../../base/Decorator';
import {
    AbstractInvokeExpr,
    ArkConditionExpr,
    ArkInstanceInvokeExpr,
    ArkNewExpr,
    ArkNormalBinopExpr,
    ArkPtrInvokeExpr,
    ArkStaticInvokeExpr,
} from '../../base/Expr';
import { Local } from '../../base/Local';
import { ArkArrayRef, ArkInstanceFieldRef, ArkThisRef } from '../../base/Ref';
import { ArkAssignStmt, ArkInvokeStmt, Stmt } from '../../base/Stmt';
import { ClassType, FunctionType, Type } from '../../base/Type';
import { Value } from '../../base/Value';
import {
    BUILDER_DECORATOR,
    BUILDER_PARAM_DECORATOR,
    COMPONENT_BRANCH_FUNCTION,
    COMPONENT_CREATE_FUNCTION,
    COMPONENT_CUSTOMVIEW,
    COMPONENT_FOR_EACH,
    COMPONENT_IF,
    COMPONENT_IF_BRANCH,
    COMPONENT_LAZY_FOR_EACH,
    COMPONENT_POP_FUNCTION,
    COMPONENT_REPEAT,
    isEtsContainerComponent,
    SPECIAL_CONTAINER_COMPONENT,
} from '../../common/EtsConst';
import { ArkClass, ClassCategory } from '../../model/ArkClass';
import { ArkField } from '../../model/ArkField';
import { ArkMethod } from '../../model/ArkMethod';
import { ClassSignature, MethodSignature } from '../../model/ArkSignature';
import { Cfg } from '../Cfg';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import { ViewTree, ViewTreeNode } from '../ViewTree';
import { ModelUtils } from '../../common/ModelUtils';
import { Scene } from '../../../Scene';
import { TEMP_LOCAL_PREFIX } from '../../common/Const';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ViewTreeBuilder');
const COMPONENT_CREATE_FUNCTIONS: Set<string> = new Set([COMPONENT_CREATE_FUNCTION, COMPONENT_BRANCH_FUNCTION]);

function backtraceLocalInitValue(value: Local): Local | Value {
    let stmt = value.getDeclaringStmt();
    if (stmt instanceof ArkAssignStmt) {
        let rightOp = stmt.getRightOp();
        if (rightOp instanceof Local) {
            return backtraceLocalInitValue(rightOp);
        } else if (rightOp instanceof ArkInstanceFieldRef && rightOp.getBase().getName().startsWith(TEMP_LOCAL_PREFIX)) {
            return backtraceLocalInitValue(rightOp.getBase());
        } else if (rightOp instanceof ArkArrayRef) {
            return backtraceLocalInitValue(rightOp.getBase());
        }
        return rightOp;
    }
    return value;
}

type ObjectLiteralMap = Map<ArkField, Value | ObjectLiteralMap>;

function parseObjectLiteral(objectLiteralCls: ArkClass | null, scene: Scene): ObjectLiteralMap {
    let map: ObjectLiteralMap = new Map();
    if (objectLiteralCls?.getCategory() !== ClassCategory.OBJECT) {
        return map;
    }
    objectLiteralCls?.getFields().forEach(field => {
        let stmts = field.getInitializer();
        if (stmts.length === 0) {
            return;
        }

        let assignStmt = stmts[stmts.length - 1];
        if (!(assignStmt instanceof ArkAssignStmt)) {
            return;
        }

        let value = assignStmt.getRightOp();
        if (value instanceof Local) {
            value = backtraceLocalInitValue(value);
        }

        map.set(field, value);
        if (value instanceof ArkNewExpr) {
            let subCls = ModelUtils.getArkClassInBuild(scene, value.getClassType());
            let childMap = parseObjectLiteral(subCls, scene);
            if (childMap) {
                map.set(field, childMap);
            }
        }
    });

    return map;
}

class StateValuesUtils {
    private declaringArkClass: ArkClass;

    constructor(declaringArkClass: ArkClass) {
        this.declaringArkClass = declaringArkClass;
    }

    public static getInstance(declaringArkClass: ArkClass): StateValuesUtils {
        return new StateValuesUtils(declaringArkClass);
    }

    public parseStmtUsesStateValues(
        stmt: Stmt,
        uses: Set<ArkField> = new Set(),
        wholeMethod: boolean = false,
        visitor: Set<MethodSignature | Stmt> = new Set()
    ): Set<ArkField> {
        if (visitor.has(stmt)) {
            return uses;
        }
        visitor.add(stmt);
        let values = stmt.getUses();
        if (stmt instanceof ArkAssignStmt) {
            values.push(stmt.getLeftOp());
        }

        for (const v of values) {
            this.parseValueUsesStateValues(v, uses, wholeMethod, visitor);
        }
        return uses;
    }

    private objectLiteralMapUsedStateValues(uses: Set<ArkField>, map: ObjectLiteralMap): void {
        for (const [_, value] of map) {
            if (value instanceof ArkInstanceFieldRef) {
                let srcField = this.declaringArkClass.getFieldWithName(value.getFieldName());
                let decorators = srcField?.getStateDecorators();
                if (srcField && decorators && decorators.length > 0) {
                    uses.add(srcField);
                }
            } else if (value instanceof Map) {
                this.objectLiteralMapUsedStateValues(uses, value);
            } else if (value instanceof ArkNormalBinopExpr || value instanceof ArkConditionExpr) {
                this.parseValueUsesStateValues(value.getOp1(), uses);
                this.parseValueUsesStateValues(value.getOp2(), uses);
            }
        }
    }

    public parseObjectUsedStateValues(type: Type, uses: Set<ArkField> = new Set()): Set<ArkField> {
        if (!(type instanceof ClassType)) {
            return uses;
        }
        let cls = ModelUtils.getArkClassInBuild(this.declaringArkClass.getDeclaringArkFile().getScene(), type);
        let map = parseObjectLiteral(cls, this.declaringArkClass.getDeclaringArkFile().getScene());
        this.objectLiteralMapUsedStateValues(uses, map);
        return uses;
    }

    private parseMethodUsesStateValues(methodSignature: MethodSignature, uses: Set<ArkField>, visitor: Set<MethodSignature | Stmt> = new Set()): void {
        if (visitor.has(methodSignature)) {
            return;
        }
        visitor.add(methodSignature);
        let method = this.declaringArkClass.getDeclaringArkFile().getScene().getMethod(methodSignature);
        if (!method) {
            return;
        }
        let stmts = method.getCfg()?.getStmts();
        if (!stmts) {
            return;
        }
        for (const stmt of stmts) {
            this.parseStmtUsesStateValues(stmt, uses, true, visitor);
        }
    }

    private parseValueUsesStateValues(
        v: Value,
        uses: Set<ArkField> = new Set(),
        wholeMethod: boolean = false,
        visitor: Set<MethodSignature | Stmt> = new Set()
    ): Set<ArkField> {
        if (v instanceof ArkInstanceFieldRef) {
            let field = this.declaringArkClass.getField(v.getFieldSignature());
            let decorators = field?.getStateDecorators();
            if (field && decorators && decorators.length > 0) {
                uses.add(field);
            }
        } else if (v instanceof ArkInstanceInvokeExpr) {
            this.parseMethodUsesStateValues(v.getMethodSignature(), uses, visitor);
        } else if (v instanceof Local) {
            if (v.getName() === 'this') {
                return uses;
            }
            let type = v.getType();
            if (type instanceof FunctionType) {
                this.parseMethodUsesStateValues(type.getMethodSignature(), uses, visitor);
                return uses;
            }
            this.parseObjectUsedStateValues(type, uses);
            let declaringStmt = v.getDeclaringStmt();
            if (!wholeMethod && declaringStmt) {
                this.parseStmtUsesStateValues(declaringStmt, uses, wholeMethod, visitor);
            }
        }

        return uses;
    }
}

enum ViewTreeNodeType {
    SystemComponent,
    CustomComponent,
    Builder,
    BuilderParam,
}

class ViewTreeNodeImpl implements ViewTreeNode {
    name: string;
    stmts: Map<string, [Stmt, (MethodSignature | ArkInstanceFieldRef | Constant)[]]>;
    attributes: Map<string, [Stmt, (MethodSignature | ArkInstanceFieldRef | Constant)[]]>;
    stateValues: Set<ArkField>;
    parent: ViewTreeNode | null;
    children: ViewTreeNodeImpl[];
    classSignature?: MethodSignature | ClassSignature | undefined;
    signature?: MethodSignature | ClassSignature | undefined;
    stateValuesTransfer?: Map<ArkField, ArkMethod | ArkField> | undefined;
    builderParam?: ArkField | undefined;
    builder?: MethodSignature | undefined;
    private type: ViewTreeNodeType;

    constructor(name: string) {
        this.name = name;
        this.attributes = new Map();
        this.stmts = this.attributes;
        this.stateValues = new Set();
        this.parent = null;
        this.children = [];
        this.type = ViewTreeNodeType.SystemComponent;
    }

    /**
     * Whether the node type is Builder.
     * @returns true: node is Builder, false others.
     */
    public isBuilder(): boolean {
        return this.type === ViewTreeNodeType.Builder;
    }

    /**
     * @internal
     */
    public isBuilderParam(): boolean {
        return this.type === ViewTreeNodeType.BuilderParam;
    }

    /**
     * Whether the node type is custom component.
     * @returns true: node is custom component, false others.
     */
    public isCustomComponent(): boolean {
        return this.type === ViewTreeNodeType.CustomComponent;
    }

    /**
     * walk node and node's children
     * @param selector Node selector function, return true skipping the follow-up nodes.
     * @returns
     *  - true: There are nodes that meet the selector.
     *  - false: does not exist.
     */
    public walk(selector: (item: ViewTreeNode) => boolean, visitor: Set<ViewTreeNode> = new Set()): boolean {
        if (visitor.has(this)) {
            return false;
        }

        let ret: boolean = selector(this);
        visitor.add(this);

        for (const child of this.children) {
            ret = ret || child.walk(selector, visitor);
            if (ret) {
                break;
            }
        }
        return ret;
    }

    public static createCustomComponent(): ViewTreeNodeImpl {
        let instance = new ViewTreeNodeImpl(COMPONENT_CUSTOMVIEW);
        instance.type = ViewTreeNodeType.CustomComponent;
        return instance;
    }

    public static createBuilderNode(): ViewTreeNodeImpl {
        let instance = new ViewTreeNodeImpl(BUILDER_DECORATOR);
        instance.type = ViewTreeNodeType.Builder;
        return instance;
    }

    public static createBuilderParamNode(): ViewTreeNodeImpl {
        let instance = new ViewTreeNodeImpl(BUILDER_PARAM_DECORATOR);
        instance.type = ViewTreeNodeType.BuilderParam;
        return instance;
    }

    public changeBuilderParam2BuilderNode(builder: ArkMethod): void {
        this.name = BUILDER_DECORATOR;
        this.type = ViewTreeNodeType.Builder;
        this.signature = builder.getSignature();
        this.classSignature = this.signature;
        const root = builder.getViewTree()?.getRoot();
        if (root) {
            for (let child of root.children) {
                this.children.push(child as ViewTreeNodeImpl);
            }
        } else {
            logger.error(`ViewTree->changeBuilderParam2BuilderNode ${builder.getSignature().toString()} @Builder viewtree fail.`);
        }
    }

    public hasBuilderParam(): boolean {
        return this.walk(item => {
            return (item as ViewTreeNodeImpl).isBuilderParam();
        });
    }

    public clone(parent: ViewTreeNodeImpl, map: Map<ViewTreeNodeImpl, ViewTreeNodeImpl> = new Map()): ViewTreeNodeImpl {
        let newNode = new ViewTreeNodeImpl(this.name);
        newNode.attributes = this.attributes;
        newNode.stmts = newNode.attributes;
        newNode.stateValues = this.stateValues;
        newNode.parent = parent;
        newNode.type = this.type;
        newNode.signature = this.signature;
        newNode.classSignature = newNode.signature;
        newNode.builderParam = this.builderParam;
        newNode.builder = this.builder;
        map.set(this, newNode);

        for (const child of this.children) {
            if (map.has(child)) {
                newNode.children.push(map.get(child)!);
            } else {
                newNode.children.push(child.clone(newNode, map));
            }
        }

        return newNode;
    }

    public addStmt(tree: ViewTreeImpl, stmt: Stmt): void {
        this.parseAttributes(stmt);
        if (this.name !== COMPONENT_FOR_EACH && this.name !== COMPONENT_LAZY_FOR_EACH) {
            this.parseStateValues(tree, stmt);
        }
    }

    private parseAttributes(stmt: Stmt): void {
        let expr: AbstractInvokeExpr | undefined;
        if (stmt instanceof ArkAssignStmt) {
            let op = stmt.getRightOp();
            if (op instanceof ArkInstanceInvokeExpr) {
                expr = op;
            } else if (op instanceof ArkStaticInvokeExpr) {
                expr = op;
            }
        } else if (stmt instanceof ArkInvokeStmt) {
            let invoke = stmt.getInvokeExpr();
            if (invoke instanceof ArkInstanceInvokeExpr) {
                expr = invoke;
            } else if (invoke instanceof ArkStaticInvokeExpr) {
                expr = invoke;
            }
        }
        if (expr) {
            let key = expr.getMethodSignature().getMethodSubSignature().getMethodName();
            let relationValues: (Constant | ArkInstanceFieldRef | MethodSignature)[] = [];
            for (const arg of expr.getArgs()) {
                if (arg instanceof Local) {
                    this.getBindValues(arg, relationValues);
                } else if (arg instanceof Constant) {
                    relationValues.push(arg);
                }
            }
            this.attributes.set(key, [stmt, relationValues]);
        }
    }

    private getBindValues(local: Local, relationValues: (Constant | ArkInstanceFieldRef | MethodSignature)[], visitor: Set<Local> = new Set()): void {
        if (visitor.has(local)) {
            return;
        }
        visitor.add(local);
        const stmt = local.getDeclaringStmt();
        if (!stmt) {
            let type = local.getType();
            if (type instanceof FunctionType) {
                relationValues.push(type.getMethodSignature());
            }
            return;
        }
        for (const v of stmt.getUses()) {
            if (v instanceof Constant) {
                relationValues.push(v);
            } else if (v instanceof ArkInstanceFieldRef) {
                relationValues.push(v);
            } else if (v instanceof Local) {
                this.getBindValues(v, relationValues, visitor);
            }
        }
    }

    public parseStateValues(tree: ViewTreeImpl, stmt: Stmt): void {
        let stateValues: Set<ArkField> = StateValuesUtils.getInstance(tree.getDeclaringArkClass()).parseStmtUsesStateValues(stmt);
        stateValues.forEach(field => {
            this.stateValues.add(field);
            tree.addStateValue(field, this);
        }, this);
    }
}

class TreeNodeStack {
    protected root: ViewTreeNodeImpl | null = null;
    protected stack: ViewTreeNodeImpl[];

    constructor() {
        this.stack = [];
    }

    /**
     * @internal
     */
    public push(node: ViewTreeNodeImpl): void {
        let parent = this.getParent();
        node.parent = parent;
        this.stack.push(node);
        if (parent === null || parent === undefined) {
            this.root = node;
        } else {
            parent.children.push(node);
        }
    }

    /**
     * @internal
     */
    public pop(): void {
        this.stack.pop();
    }

    /**
     * @internal
     */
    public top(): ViewTreeNodeImpl | null {
        return this.isEmpty() ? null : this.stack[this.stack.length - 1];
    }

    /**
     * @internal
     */
    public isEmpty(): boolean {
        return this.stack.length === 0;
    }

    /**
     * @internal
     */
    public popAutomicComponent(name: string): void {
        if (this.isEmpty()) {
            return;
        }

        let node = this.stack[this.stack.length - 1];
        if (name !== node.name && !this.isContainer(node.name)) {
            this.stack.pop();
        }
    }

    /**
     * @internal
     */
    public popComponentExpect(name: string): TreeNodeStack {
        for (let i = this.stack.length - 1; i >= 0; i--) {
            if (this.stack[i].name !== name) {
                this.stack.pop();
            } else {
                break;
            }
        }
        return this;
    }

    private getParent(): ViewTreeNodeImpl | null {
        if (this.stack.length === 0) {
            return null;
        }

        let node = this.stack[this.stack.length - 1];
        if (!this.isContainer(node.name)) {
            this.stack.pop();
        }
        return this.stack[this.stack.length - 1];
    }

    protected isContainer(name: string): boolean {
        return isEtsContainerComponent(name) || SPECIAL_CONTAINER_COMPONENT.has(name) || name === BUILDER_DECORATOR;
    }
}

export class ViewTreeImpl extends TreeNodeStack implements ViewTree {
    private render: ArkMethod;
    private buildViewStatus: boolean;
    private stateValues: Map<ArkField, Set<ViewTreeNode>>;
    private fieldTypes: Map<string, Decorator | Type>;

    /**
     * @internal
     */
    constructor(render: ArkMethod) {
        super();
        this.render = render;
        this.stateValues = new Map();
        this.fieldTypes = new Map();
        this.buildViewStatus = false;
    }

    /**
     * ViewTree root node.
     * @returns root node
     */
    public getRoot(): ViewTreeNode | null {
        this.buildViewTree();
        return this.root;
    }

    /**
     * Map of the component controlled by the state variable
     * @returns
     */
    public getStateValues(): Map<ArkField, Set<ViewTreeNode>> {
        this.buildViewTree();
        return this.stateValues;
    }

    /**
     * @deprecated Use {@link getStateValues} instead.
     */
    public isClassField(name: string): boolean {
        return this.fieldTypes.has(name);
    }

    /**
     * @deprecated Use {@link getStateValues} instead.
     */
    public getClassFieldType(name: string): Decorator | Type | undefined {
        return this.fieldTypes.get(name);
    }

    /**
     * @internal
     */
    private buildViewTree(): void {
        if (!this.render || this.isInitialized()) {
            return;
        }
        this.buildViewStatus = true;
        this.loadClasssFieldTypes();

        if (this.render.hasBuilderDecorator()) {
            let node = ViewTreeNodeImpl.createBuilderNode();
            node.signature = this.render.getSignature();
            node.classSignature = node.signature;
            this.push(node);
        }

        if (this.render.getCfg()) {
            this.buildViewTreeFromCfg(this.render.getCfg() as Cfg);
        }
    }

    /**
     * @internal
     */
    private isInitialized(): boolean {
        return this.root != null || this.buildViewStatus;
    }

    /**
     * @internal
     */
    public addStateValue(field: ArkField, node: ViewTreeNode): void {
        if (!this.stateValues.has(field)) {
            this.stateValues.set(field, new Set());
        }
        let sets = this.stateValues.get(field);
        sets?.add(node);
    }

    /**
     * @internal
     */
    private isCreateFunc(name: string): boolean {
        return COMPONENT_CREATE_FUNCTIONS.has(name);
    }

    private loadClasssFieldTypes(): void {
        for (const field of this.render.getDeclaringArkClass().getFields()) {
            let decorators = field.getStateDecorators();
            if (decorators.length > 0) {
                if (decorators.length === 1) {
                    this.fieldTypes.set(field.getName(), decorators[0]);
                } else {
                    this.fieldTypes.set(field.getName(), decorators[0]);
                }
            } else {
                this.fieldTypes.set(field.getName(), field.getSignature().getType());
            }
        }
    }

    /**
     * @internal
     */
    public getDeclaringArkClass(): ArkClass {
        return this.render.getDeclaringArkClass();
    }

    /**
     * @internal
     */
    private findMethod(methodSignature: MethodSignature): ArkMethod | null {
        let method = this.render.getDeclaringArkFile().getScene().getMethod(methodSignature);
        if (method) {
            return method;
        }

        // class
        method = this.getDeclaringArkClass().getMethod(methodSignature);
        if (method) {
            return method;
        }

        return this.findMethodWithName(methodSignature.getMethodSubSignature().getMethodName());
    }

    /**
     * @internal
     */
    private findMethodWithName(name: string): ArkMethod | null {
        let method = this.getDeclaringArkClass().getMethodWithName(name);
        if (method) {
            return method;
        }

        // namespace
        this.getDeclaringArkClass()
            .getDeclaringArkNamespace()
            ?.getAllMethodsUnderThisNamespace()
            .forEach(value => {
                if (value.getName() === name) {
                    method = value;
                }
            });
        if (method) {
            return method;
        }

        this.getDeclaringArkClass()
            .getDeclaringArkFile()
            .getAllNamespacesUnderThisFile()
            .forEach(namespace => {
                namespace.getAllMethodsUnderThisNamespace().forEach(value => {
                    if (value.getName() === name) {
                        method = value;
                    }
                });
            });
        return method;
    }

    /**
     * @internal
     */
    private findClass(classSignature: ClassSignature): ArkClass | null {
        return ModelUtils.getClass(this.render, classSignature);
    }

    private findBuilderMethod(value: Value): ArkMethod | undefined | null {
        let method: ArkMethod | undefined | null;
        if (value instanceof ArkInstanceFieldRef) {
            method = this.findMethodWithName(value.getFieldName());
        } else if (value instanceof ArkStaticInvokeExpr) {
            method = this.findMethod(value.getMethodSignature());
        } else if (value instanceof Local && value.getType() instanceof FunctionType) {
            method = this.findMethod((value.getType() as FunctionType).getMethodSignature());
        } else if (value instanceof Local) {
            method = this.findMethodWithName(value.getName());
        }
        if (method && !method.hasBuilderDecorator()) {
            method = this.findMethodInvokeBuilderMethod(method);
        }

        return method;
    }

    /**
     * @internal
     */
    private addBuilderNode(method: ArkMethod): ViewTreeNodeImpl {
        let builderViewTree = method.getViewTree();
        if (!builderViewTree || !builderViewTree.getRoot()) {
            logger.error(`ViewTree->addBuilderNode ${method.getSignature().toString()} build viewtree fail.`);
            // add empty node
            let node = ViewTreeNodeImpl.createBuilderNode();
            node.signature = method.getSignature();
            node.classSignature = node.signature;
            this.push(node);
            this.pop();
            return node;
        }

        let root = builderViewTree.getRoot() as ViewTreeNodeImpl;
        this.push(root);
        if (method.getDeclaringArkClass() === this.render.getDeclaringArkClass()) {
            for (const [field, nodes] of builderViewTree.getStateValues()) {
                for (const node of nodes) {
                    this.addStateValue(field, node);
                }
            }
        }
        this.pop();
        return root;
    }

    /**
     * @internal
     */
    private addCustomComponentNode(cls: ArkClass, arg: Value | undefined, builder: ArkMethod | undefined): ViewTreeNodeImpl {
        let node = ViewTreeNodeImpl.createCustomComponent();
        node.signature = cls.getSignature();
        node.classSignature = node.signature;
        node.stateValuesTransfer = this.parseObjectLiteralExpr(cls, arg, builder);
        if (arg instanceof Local && arg.getType()) {
            let stateValues = StateValuesUtils.getInstance(this.getDeclaringArkClass()).parseObjectUsedStateValues(arg.getType());
            stateValues.forEach(field => {
                node.stateValues.add(field);
                this.addStateValue(field, node);
            });
        }
        this.push(node);
        let componentViewTree = cls.getViewTree();
        if (!componentViewTree || !componentViewTree.getRoot()) {
            logger.error(`ViewTree->addCustomComponentNode ${cls.getSignature().toString()} build viewtree fail.`);
            return node;
        }
        let root = componentViewTree.getRoot() as ViewTreeNodeImpl;
        if (root.hasBuilderParam()) {
            root = this.cloneBuilderParamNode(node, root);
        }
        node.children.push(root);

        return node;
    }

    private cloneBuilderParamNode(node: ViewTreeNodeImpl, root: ViewTreeNodeImpl): ViewTreeNodeImpl {
        root = root.clone(node);
        if (node.stateValuesTransfer) {
            root.walk(item => {
                let child = item as ViewTreeNodeImpl;
                if (!child.isBuilderParam() || !child.builderParam) {
                    return false;
                }
                let method = node.stateValuesTransfer?.get(child.builderParam) as ArkMethod;
                if (method) {
                    child.changeBuilderParam2BuilderNode(method);
                }

                return false;
            });
        }
        return root;
    }

    /**
     * @internal
     */
    private addBuilderParamNode(field: ArkField): ViewTreeNodeImpl {
        let node = ViewTreeNodeImpl.createBuilderParamNode();
        node.builderParam = field;
        this.push(node);
        this.pop();

        return node;
    }

    /**
     * @internal
     */
    private addSystemComponentNode(name: string): ViewTreeNodeImpl {
        let node = new ViewTreeNodeImpl(name);
        this.push(node);

        return node;
    }

    private findMethodInvokeBuilderMethod(method: ArkMethod): ArkMethod | undefined {
        let stmts = method.getCfg()?.getStmts();
        if (!stmts) {
            return undefined;
        }
        for (const stmt of stmts) {
            let expr: AbstractInvokeExpr | undefined;

            if (stmt instanceof ArkInvokeStmt) {
                expr = stmt.getInvokeExpr();
            } else if (stmt instanceof ArkAssignStmt) {
                let rightOp = stmt.getRightOp();
                if (rightOp instanceof ArkInstanceInvokeExpr || rightOp instanceof ArkStaticInvokeExpr) {
                    expr = rightOp;
                }
            }

            if (expr === undefined) {
                continue;
            }

            let method = this.findMethod(expr.getMethodSignature());
            if (method?.hasBuilderDecorator()) {
                return method;
            }
        }
        return undefined;
    }

    private parseFieldInObjectLiteral(field: ArkField, cls: ArkClass, transferMap: Map<ArkField, ArkField | ArkMethod>): void {
        let dstField = cls.getFieldWithName(field.getName());
        if (dstField?.getStateDecorators().length === 0 && !dstField?.hasBuilderParamDecorator()) {
            return;
        }

        let stmts = field.getInitializer();
        if (stmts.length === 0) {
            return;
        }

        let assignStmt = stmts[stmts.length - 1];
        if (!(assignStmt instanceof ArkAssignStmt)) {
            return;
        }

        let value = assignStmt.getRightOp();
        if (value instanceof Local) {
            value = backtraceLocalInitValue(value);
        }
        if (dstField?.hasBuilderParamDecorator()) {
            let method = this.findBuilderMethod(value);
            if (method) {
                transferMap.set(dstField, method);
            }
        } else {
            let srcField: ArkField | undefined | null;
            if (value instanceof ArkInstanceFieldRef) {
                srcField = this.getDeclaringArkClass().getFieldWithName(value.getFieldName());
            }
            if (srcField && dstField) {
                transferMap.set(dstField, srcField);
            }
        }
    }

    private parseObjectLiteralExpr(cls: ArkClass, object: Value | undefined, builder: ArkMethod | undefined): Map<ArkField, ArkField | ArkMethod> | undefined {
        let transferMap: Map<ArkField, ArkField | ArkMethod> = new Map();
        if (object instanceof Local && object.getType() instanceof ClassType) {
            let anonymousSig = (object.getType() as ClassType).getClassSignature();
            let anonymous = this.findClass(anonymousSig);
            anonymous?.getFields().forEach(field => {
                this.parseFieldInObjectLiteral(field, cls, transferMap);
            });
        }
        // If the builder exists, there will be a unique BuilderParam
        if (builder) {
            cls.getFields().forEach(value => {
                if (value.hasBuilderParamDecorator()) {
                    transferMap.set(value, builder);
                }
            });
        }

        if (transferMap.size === 0) {
            return undefined;
        }
        return transferMap;
    }

    private viewComponentCreationParser(name: string, stmt: Stmt, expr: AbstractInvokeExpr): ViewTreeNodeImpl | undefined {
        let temp = expr.getArg(0) as Local;
        let arg: Value | undefined;
        temp.getUsedStmts().forEach(value => {
            if (value instanceof ArkAssignStmt && value.getRightOp() instanceof ArkInstanceInvokeExpr) {
                const rightOp: ArkInstanceInvokeExpr = value.getRightOp() as ArkInstanceInvokeExpr;
                const methodName = rightOp.getMethodSignature().getMethodSubSignature().getMethodName();
                if (methodName === 'constructor') {
                    arg = rightOp.getArg(0);
                }
            }
        });

        let builderMethod: ArkMethod | undefined;
        let builder = expr.getArg(1) as Local;
        if (builder) {
            let method = this.findMethod((builder.getType() as FunctionType).getMethodSignature());
            if (!method?.hasBuilderDecorator()) {
                method?.addDecorator(new Decorator(BUILDER_DECORATOR));
            }
            if (!method?.hasViewTree()) {
                method?.setViewTree(new ViewTreeImpl(method));
            }
            if (method) {
                builderMethod = method;
            }
        }

        let initValue = backtraceLocalInitValue(temp);
        if (!(initValue instanceof ArkNewExpr)) {
            return undefined;
        }
        const initValueType = initValue.getType();
        if (!(initValueType instanceof ClassType)) {
            return undefined;
        }

        let clsSignature = initValueType.getClassSignature();
        if (clsSignature) {
            let cls = this.findClass(clsSignature);
            if (cls && cls.hasComponentDecorator()) {
                return this.addCustomComponentNode(cls, arg, builderMethod);
            } else {
                logger.error(`ViewTree->viewComponentCreationParser not found class ${clsSignature.toString()}. ${stmt.toString()}`);
            }
        }
        return undefined;
    }

    private waterFlowCreationParser(name: string, stmt: Stmt, expr: AbstractInvokeExpr): ViewTreeNodeImpl {
        let node = this.addSystemComponentNode(name);
        let object = expr.getArg(0);
        if (object instanceof Local && object.getType() instanceof ClassType) {
            let anonymousSig = (object.getType() as ClassType).getClassSignature();
            let anonymous = this.findClass(anonymousSig);
            let footer = anonymous?.getFieldWithName('footer');
            if (!footer) {
                return node;
            }
            let stmts = footer.getInitializer();
            let assignStmt = stmts[stmts.length - 1];
            if (!(assignStmt instanceof ArkAssignStmt)) {
                return node;
            }

            let value = assignStmt.getRightOp();
            let method = this.findBuilderMethod(value);
            if (method?.hasBuilderDecorator()) {
                return this.addBuilderNode(method);
            }
        }

        return node;
    }

    private forEachCreationParser(name: string, stmt: Stmt, expr: AbstractInvokeExpr): ViewTreeNodeImpl {
        let node = this.addSystemComponentNode(name);
        let values = expr.getArg(0) as Local;
        let declaringStmt = values?.getDeclaringStmt();
        if (declaringStmt) {
            let stateValues = StateValuesUtils.getInstance(this.getDeclaringArkClass()).parseStmtUsesStateValues(declaringStmt);
            stateValues.forEach(field => {
                node.stateValues.add(field);
                this.addStateValue(field, node);
            });
        }

        let type = (expr.getArg(1) as Local).getType() as FunctionType;
        let method = this.findMethod(type.getMethodSignature());
        if (method && method.getCfg()) {
            this.buildViewTreeFromCfg(method.getCfg() as Cfg);
        }
        return node;
    }

    private repeatCreationParser(name: string, stmt: Stmt, expr: AbstractInvokeExpr): ViewTreeNodeImpl {
        let node = this.addSystemComponentNode(name);
        let arg = expr.getArg(0) as Local;
        let declaringStmt = arg?.getDeclaringStmt();
        if (declaringStmt) {
            let stateValues = StateValuesUtils.getInstance(this.getDeclaringArkClass()).parseStmtUsesStateValues(declaringStmt);
            stateValues.forEach(field => {
                node.stateValues.add(field);
                this.addStateValue(field, node);
            });
        }

        return node;
    }

    private ifBranchCreationParser(name: string, stmt: Stmt, expr: AbstractInvokeExpr): ViewTreeNodeImpl {
        this.popComponentExpect(COMPONENT_IF);
        return this.addSystemComponentNode(COMPONENT_IF_BRANCH);
    }

    private COMPONENT_CREATE_PARSERS: Map<string, (name: string, stmt: Stmt, expr: AbstractInvokeExpr) => ViewTreeNodeImpl | undefined> = new Map([
        ['ForEach.create', this.forEachCreationParser.bind(this)],
        ['LazyForEach.create', this.forEachCreationParser.bind(this)],
        ['Repeat.create', this.repeatCreationParser.bind(this)],
        ['View.create', this.viewComponentCreationParser.bind(this)],
        ['If.branch', this.ifBranchCreationParser.bind(this)],
        ['WaterFlow.create', this.waterFlowCreationParser.bind(this)],
    ]);

    private componentCreateParse(componentName: string, methodName: string, stmt: Stmt, expr: ArkStaticInvokeExpr): ViewTreeNodeImpl | undefined {
        let parserFn = this.COMPONENT_CREATE_PARSERS.get(`${componentName}.${methodName}`);
        if (parserFn) {
            let node = parserFn(componentName, stmt, expr);
            node?.addStmt(this, stmt);
            return node;
        }
        this.popAutomicComponent(componentName);
        let node = this.addSystemComponentNode(componentName);
        node.addStmt(this, stmt);
        return node;
    }

    private parseStaticInvokeExpr(local2Node: Map<Local, ViewTreeNode>, stmt: Stmt, expr: ArkStaticInvokeExpr): ViewTreeNodeImpl | undefined {
        let methodSignature = expr.getMethodSignature();
        let method = this.findMethod(methodSignature);
        if (method?.hasBuilderDecorator()) {
            let node = this.addBuilderNode(method);
            node.parseStateValues(this, stmt);
            return node;
        }

        let name = methodSignature.getDeclaringClassSignature().getClassName();
        let methodName = methodSignature.getMethodSubSignature().getMethodName();

        if (this.isCreateFunc(methodName)) {
            return this.componentCreateParse(name, methodName, stmt, expr);
        }

        let currentNode = this.top();
        if (name === currentNode?.name) {
            currentNode.addStmt(this, stmt);
            if (methodName === COMPONENT_POP_FUNCTION) {
                this.pop();
            }
            return currentNode;
        } else if (name === COMPONENT_IF && methodName === COMPONENT_POP_FUNCTION) {
            this.popComponentExpect(COMPONENT_IF);
            this.pop();
        }
        return undefined;
    }

    /**
     * $temp4.margin({ top: 20 });
     * @param viewTree
     * @param local2Node
     * @param expr
     */
    private parseInstanceInvokeExpr(local2Node: Map<Local, ViewTreeNodeImpl>, stmt: Stmt, expr: ArkInstanceInvokeExpr): ViewTreeNodeImpl | undefined {
        let temp = expr.getBase();
        if (local2Node.has(temp)) {
            let component = local2Node.get(temp);
            if (component?.name === COMPONENT_REPEAT && expr.getMethodSignature().getMethodSubSignature().getMethodName() === 'each') {
                let arg = expr.getArg(0);
                let type = arg.getType();
                if (type instanceof FunctionType) {
                    let method = this.findMethod(type.getMethodSignature());
                    this.buildViewTreeFromCfg(method?.getCfg() as Cfg);
                }
                this.pop();
            } else {
                component?.addStmt(this, stmt);
            }

            return component;
        }

        let name = expr.getBase().getName();
        if (name.startsWith(TEMP_LOCAL_PREFIX)) {
            let initValue = backtraceLocalInitValue(expr.getBase());
            if (initValue instanceof ArkThisRef) {
                name = 'this';
            }
        }

        let methodName = expr.getMethodSignature().getMethodSubSignature().getMethodName();
        let field = this.getDeclaringArkClass().getFieldWithName(methodName);
        if (name === 'this' && field?.hasBuilderParamDecorator()) {
            return this.addBuilderParamNode(field);
        }

        let method = this.findMethod(expr.getMethodSignature());
        if (name === 'this' && method?.hasBuilderDecorator()) {
            return this.addBuilderNode(method);
        }

        return undefined;
    }

    private parsePtrInvokeExpr(local2Node: Map<Local, ViewTreeNodeImpl>, stmt: Stmt, expr: ArkPtrInvokeExpr): ViewTreeNodeImpl | undefined {
        let temp = expr.getFuncPtrLocal();
        if (temp instanceof Local && local2Node.has(temp)) {
            let component = local2Node.get(temp);
            if (component?.name === COMPONENT_REPEAT && expr.getMethodSignature().getMethodSubSignature().getMethodName() === 'each') {
                let arg = expr.getArg(0);
                let type = arg.getType();
                if (type instanceof FunctionType) {
                    let method = this.findMethod(type.getMethodSignature());
                    this.buildViewTreeFromCfg(method?.getCfg() as Cfg);
                }
                this.pop();
            } else {
                component?.addStmt(this, stmt);
            }

            return component;
        } else if (temp instanceof ArkInstanceFieldRef) {
            let name = temp.getBase().getName();
            if (name.startsWith(TEMP_LOCAL_PREFIX)) {
                let initValue = backtraceLocalInitValue(temp.getBase());
                if (initValue instanceof ArkThisRef) {
                    name = 'this';
                }
            }

            let methodName = temp.getFieldName();
            let field = this.getDeclaringArkClass().getFieldWithName(methodName);
            if (name === 'this' && field?.hasBuilderParamDecorator()) {
                return this.addBuilderParamNode(field);
            }

            let method = this.findMethod(expr.getMethodSignature());
            if (name === 'this' && method?.hasBuilderDecorator()) {
                return this.addBuilderNode(method);
            }
        }
        return undefined;
    }

    /**
     * $temp3 = View.create($temp2);
     * $temp4 = View.pop();
     * $temp4.margin({ top: 20 });
     *
     * $temp2 = List.create();
     * $temp5 = $temp2.width('100%');
     * $temp6 = $temp5.height('100%');
     * $temp6.backgroundColor('#FFDCDCDC');
     * @param viewTree
     * @param local2Node
     * @param stmt
     * @returns
     */
    private parseAssignStmt(local2Node: Map<Local, ViewTreeNodeImpl>, stmt: ArkAssignStmt): void {
        let left = stmt.getLeftOp();
        let right = stmt.getRightOp();

        if (!(left instanceof Local)) {
            return;
        }

        let component: ViewTreeNodeImpl | undefined;
        if (right instanceof ArkStaticInvokeExpr) {
            component = this.parseStaticInvokeExpr(local2Node, stmt, right);
        } else if (right instanceof ArkInstanceInvokeExpr) {
            component = this.parseInstanceInvokeExpr(local2Node, stmt, right);
        } else if (right instanceof ArkPtrInvokeExpr) {
            component = this.parsePtrInvokeExpr(local2Node, stmt, right);
        }
        if (component) {
            local2Node.set(left, component);
        }
    }

    private parseInvokeStmt(local2Node: Map<Local, ViewTreeNodeImpl>, stmt: ArkInvokeStmt): void {
        let expr = stmt.getInvokeExpr();
        if (expr instanceof ArkStaticInvokeExpr) {
            this.parseStaticInvokeExpr(local2Node, stmt, expr);
        } else if (expr instanceof ArkInstanceInvokeExpr) {
            this.parseInstanceInvokeExpr(local2Node, stmt, expr);
        } else if (expr instanceof ArkPtrInvokeExpr) {
            this.parsePtrInvokeExpr(local2Node, stmt, expr);
        }
    }

    private buildViewTreeFromCfg(cfg: Cfg, local2Node: Map<Local, ViewTreeNodeImpl> = new Map()): void {
        if (!cfg) {
            return;
        }
        let blocks = cfg.getBlocks();
        for (const block of blocks) {
            for (const stmt of block.getStmts()) {
                if (!(stmt instanceof ArkInvokeStmt || stmt instanceof ArkAssignStmt)) {
                    continue;
                }

                if (stmt instanceof ArkAssignStmt) {
                    this.parseAssignStmt(local2Node, stmt);
                } else if (stmt instanceof ArkInvokeStmt) {
                    this.parseInvokeStmt(local2Node, stmt);
                }
            }
        }
    }
}

export function buildViewTree(render: ArkMethod): ViewTree {
    return new ViewTreeImpl(render);
}
