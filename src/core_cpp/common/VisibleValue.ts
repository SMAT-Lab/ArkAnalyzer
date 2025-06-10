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

import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { Local } from '../base/Local';
import { ArkInstanceFieldRef, ArkStaticFieldRef } from '../base/Ref';
import { ArkAssignStmt } from '../base/Stmt';
import { ClassType } from '../base/Type';
import { Value } from '../base/Value';
import { BasicBlock } from '../graph/BasicBlock';
import { ArkClass } from '../model/ArkClass';
import { ArkFile } from '../model/ArkFile';
import { ArkMethod } from '../model/ArkMethod';
import { ArkNamespace } from '../model/ArkNamespace';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'VisibleValue');

export class VisibleValue {
    private scopeChain: Scope[]; // 不包含currScope
    private currScope: Scope;
    private currVisibleValues: Value[];

    constructor() {
        // TODO:填充全局变量
        this.currScope = new Scope([], 0);
        this.scopeChain = [this.currScope];
        this.currVisibleValues = [...this.currScope.values];
    }

    /** get values that is visible in curr scope */
    public getCurrVisibleValues(): Value[] {
        return this.currVisibleValues;
    }

    public getScopeChain(): Scope[] {
        return this.scopeChain;
    }

    /** udpate visible values after entered a scope, only support step by step */
    public updateIntoScope(model: ArkModel): void {
        let name = '';
        if (model instanceof BasicBlock) {
            name = 'block: ' + model.toString();
        } else {
            name = model.getName();
        }
        logger.info('---- into scope:{', name, '}');

        // get values in this scope
        let values: Value[] = [];
        if (model instanceof ArkFile || model instanceof ArkNamespace) {
            values = this.getVisibleValuesIntoFileOrNameSpace(model);
        } else if (model instanceof ArkClass) {
            values = this.getVisibleValuesIntoClass(model);
        } else if (model instanceof ArkMethod) {
            values = this.getVisibleValuesIntoMethod(model);
        } else if (model instanceof BasicBlock) {
            values = this.getVisibleValuesIntoBasicBlock(model);
        }

        // handle scope chain
        const targetDepth = this.getTargetDepth(model);
        this.addScope(values, targetDepth, model);
    }

    /** udpate visible values after left a scope, only support step by step */
    public updateOutScope(): void {
        const currModel = this.currScope.arkModel as ArkModel;

        let name = '';
        if (currModel instanceof BasicBlock) {
            name = 'block: ' + currModel.toString();
        } else {
            name = currModel.getName();
        }
        logger.info('---- out scope:{', name, '}');

        let targetDepth = this.currScope.depth;
        if (currModel instanceof BasicBlock) {
            const successorsCnt = currModel.getSuccessors().length;
            // if successorsCnt <= 0, unchange
            if (successorsCnt > 1) {
                targetDepth += 1; // goto inner scope
            }
        }
        this.deleteScope(targetDepth);
    }

    /** clear up previous scope */
    private deleteScope(targetDepth: number): void {
        const prevDepth = this.currScope.depth;
        if (targetDepth > prevDepth) {
            return;
        }

        let popScopeValuesCnt = 0;
        let popScopeCnt = 0;
        for (let i = this.scopeChain.length - 1; i >= 0; i--) {
            if (this.scopeChain[i].depth < targetDepth) {
                break;
            }
            popScopeCnt += 1;
            popScopeValuesCnt += this.scopeChain[i].values.length;
        }

        this.scopeChain.splice(this.scopeChain.length - popScopeCnt, popScopeCnt)[0]; // popScopeCnt >= 1
        this.currScope = this.scopeChain[this.scopeChain.length - 1];
        const totalValuesCnt = this.currVisibleValues.length;
        this.currVisibleValues.splice(totalValuesCnt - popScopeValuesCnt, popScopeValuesCnt);
    }

    /** add this scope to scope chain and update visible values */
    private addScope(values: Value[], targetDepth: number, model: ArkModel): void {
        const newScope = new Scope(values, targetDepth, model);
        this.currScope = newScope;
        this.scopeChain.push(this.currScope);
        this.currVisibleValues.push(...this.currScope.values);
    }

    // TODO:构造嵌套关系树
    private getTargetDepth(model: ArkModel): number {
        const prevDepth = this.currScope.depth;
        const prevModel = this.currScope.arkModel;
        let targetDepth = prevDepth + 1;
        if (model instanceof BasicBlock) {
            const predecessorsCnt = model.getPredecessors().length;
            if (predecessorsCnt <= 1) {
                targetDepth = prevDepth + 1;
            } else {
                targetDepth = prevDepth;
            }
        } else if (model instanceof ArkFile && prevModel instanceof ArkFile) {
            targetDepth = prevDepth;
        } else if (model instanceof ArkNamespace && prevModel instanceof ArkNamespace) {
            targetDepth = prevDepth;
        } else if (model instanceof ArkClass && prevModel instanceof ArkClass) {
            targetDepth = prevDepth;
        } else if (model instanceof ArkMethod && prevModel instanceof ArkMethod) {
            targetDepth = prevDepth;
        }
        return targetDepth;
    }

    private getVisibleValuesIntoFileOrNameSpace(fileOrNameSpace: ArkFile | ArkNamespace): Value[] {
        let values: Value[] = [];
        return values;
    }

    private getVisibleValuesIntoClass(cls: ArkClass): Value[] {
        const values: Value[] = [];
        const fields = cls.getFields();
        const classSignature = cls.getSignature();
        for (const field of fields) {
            if (field.isStatic()) {
                const staticFieldRef = new ArkStaticFieldRef(field.getSignature());
                values.push(staticFieldRef);
            } else {
                const instanceFieldRef = new ArkInstanceFieldRef(new Local('this', new ClassType(classSignature)), field.getSignature());
                values.push(instanceFieldRef);
            }
        }
        return values;
    }

    private getVisibleValuesIntoMethod(method: ArkMethod): Value[] {
        let visibleValues: Value[] = [];
        return visibleValues;
    }

    private getVisibleValuesIntoBasicBlock(basiceBlock: BasicBlock): Value[] {
        const visibleValues: Value[] = [];
        for (const stmt of basiceBlock.getStmts()) {
            if (stmt instanceof ArkAssignStmt) {
                visibleValues.push(stmt.getLeftOp());
            }
        }
        return visibleValues;
    }
}

type ArkModel = ArkFile | ArkNamespace | ArkClass | ArkMethod | BasicBlock;

export class Scope {
    public values: Value[];
    public depth: number;
    public arkModel: ArkModel | null;
    constructor(values: Value[], depth: number = -1, arkModel: ArkModel | null = null) {
        this.values = values;
        this.depth = depth;
        this.arkModel = arkModel;
    }
}
