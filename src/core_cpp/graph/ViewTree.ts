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

import { Constant } from '../base/Constant';
import { Decorator } from '../base/Decorator';
import { ArkInstanceFieldRef } from '../base/Ref';
import { Stmt } from '../base/Stmt';
import { Type } from '../base/Type';
import { ArkField } from '../model/ArkField';
import { ArkMethod } from '../model/ArkMethod';
import { ClassSignature, MethodSignature } from '../model/ArkSignature';

/**
 * @category core/graph
 */
export interface ViewTreeNode {
    /** Component node name */
    name: string;
    /** @deprecated Use {@link attributes} instead. */
    stmts: Map<string, [Stmt, (Constant | ArkInstanceFieldRef | MethodSignature)[]]>;
    /** Component attribute stmts, key is attribute name, value is [Stmt, [Uses Values]]. */
    attributes: Map<string, [Stmt, (Constant | ArkInstanceFieldRef | MethodSignature)[]]>;
    /** Used state values. */
    stateValues: Set<ArkField>;
    /** Node's parent, CustomComponent and root node no parent. */
    parent: ViewTreeNode | null;
    /** Node's children. */
    children: ViewTreeNode[];
    /** @deprecated Use {@link signature} instead. */
    classSignature?: ClassSignature | MethodSignature;
    /** CustomComponent class signature or Builder method signature. */
    signature?: ClassSignature | MethodSignature;

    /**
     * Custom component value transfer
     * - key: ArkField, child custom component class stateValue field.
     * - value: ArkField | ArkMethod, parent component transfer value.
     *     key is BuilderParam, the value is Builder ArkMethod.
     *     Others, the value is parent class stateValue field.
     */
    stateValuesTransfer?: Map<ArkField, ArkField | ArkMethod>;

    /** BuilderParam placeholders ArkField. */
    builderParam?: ArkField;

    /** builderParam bind builder method signature. */
    builder?: MethodSignature;

    /**
     * walk node and node's children
     * @param selector Node selector function, return true skipping the follow-up nodes.
     * @returns
     *  - true: There are nodes that meet the selector.
     *  - false: does not exist.
     */
    walk(selector: (item: ViewTreeNode) => boolean): boolean;

    /**
     * Whether the node type is Builder.
     * @returns true: node is Builder, false others.
     */
    isBuilder(): boolean;

    /**
     * Whether the node type is custom component.
     * @returns true: node is custom component, false others.
     */
    isCustomComponent(): boolean;
}

/**
 * ArkUI Component Tree
 * @example
 * // Component Class get ViewTree
 * let arkClas: ArkClass = ...;
 * let viewtree = arkClas.getViewTree();
 *
 * // get viewtree root node
 * let root: ViewTreeNode = viewtree.getRoot();
 *
 * // get viewtree stateValues Map
 * let stateValues: Map<ArkField, Set<ViewTreeNode>> = viewtree.getStateValues();
 *
 * // walk all nodes
 * root.walk((node) => {
 *   // check node is builder
 *   if (node.isBuilder()) {
 *      xx
 *   }
 *
 *   // check node is sub CustomComponent
 *   if (node.isCustomComponent()) {
 *      xx
 *   }
 *
 *   if (xxx) {
 *      // Skip the remaining nodes and end the traversal
 *      return true;
 *   }
 *
 *   return false;
 * })
 *
 * @category core/graph
 */
export interface ViewTree {
    /**
     * @deprecated Use {@link getStateValues} instead.
     */
    isClassField(name: string): boolean;

    /**
     * @deprecated Use {@link getStateValues} instead.
     */
    getClassFieldType(name: string): Decorator | Type | undefined;

    /**
     * Map of the component controlled by the state variable
     * @returns
     */
    getStateValues(): Map<ArkField, Set<ViewTreeNode>>;

    /**
     * ViewTree root node.
     * @returns root node
     */
    getRoot(): ViewTreeNode | null;
}
