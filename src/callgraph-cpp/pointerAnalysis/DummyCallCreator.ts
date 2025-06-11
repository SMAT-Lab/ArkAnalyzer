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

import { ArkInstanceInvokeExpr } from '../../core/base/Expr';
import { Local } from '../../core/base/Local';
import { Stmt, ArkInvokeStmt } from '../../core/base/Stmt';
import { ArkMethod } from '../../core/model/ArkMethod';
import { ClassSignature } from '../../core/model/ArkSignature';
import { Scene } from '../../Scene';
import { COMPONENT_LIFECYCLE_METHOD_NAME } from '../../utils/entryMethodUtils';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'Dummy Call');

/**
 * TODO: constructor pointer and cid
 */
export class DummyCallCreator {
    private scene: Scene;
    private pageMap;
    // TODO: classSig -> str ?
    private componentMap: Map<ClassSignature, Set<Stmt>>;

    constructor(scene: Scene) {
        this.scene = scene;
        this.componentMap = new Map();
        this.pageMap = new Map();
    }

    public getDummyCallByPage(classSig: ClassSignature, basePage: Local): Set<Stmt> {
        let dummyCallStmts = this.pageMap.get(classSig);
        if (dummyCallStmts) {
            return dummyCallStmts;
        }

        dummyCallStmts = this.buildDummyCallBody(classSig, basePage);

        this.pageMap.set(classSig, dummyCallStmts);
        return dummyCallStmts;
    }

    public getDummyCallByComponent(classSig: ClassSignature, baseComponent: Local): Set<Stmt> {
        let dummyCallStmts = this.componentMap.get(classSig);
        if (dummyCallStmts) {
            return dummyCallStmts;
        }

        dummyCallStmts = this.buildDummyCallBody(classSig, baseComponent);

        this.componentMap.set(classSig, dummyCallStmts);
        return dummyCallStmts;
    }

    /**
     * build dummy call edge with class signature, including a class new expr and call back function invokes
     * @param classSig class signature
     * @returns dummy call edges
     */
    private buildDummyCallBody(classSig: ClassSignature, baseComponent: Local): Set<Stmt> {
        let dummyCallStmts: Set<Stmt> = new Set();

        this.getComponentCallStmts(classSig, baseComponent).forEach(stmt => dummyCallStmts.add(stmt));

        return dummyCallStmts;
    }

    private getComponentCallStmts(classSig: ClassSignature, base: Local): Stmt[] {
        let componentClass = this.scene.getClass(classSig);
        if (!componentClass) {
            logger.error(`can not find class ${classSig.toString()}`);
            return [];
        }

        let callStmts: Stmt[] = [];
        // filter callback method
        componentClass
            .getMethods()
            .filter(method => COMPONENT_LIFECYCLE_METHOD_NAME.includes(method.getName()))
            .forEach((method: ArkMethod) => {
                // TODO: args pointer ?
                if (method.getParameters().length === 0) {
                    callStmts.push(new ArkInvokeStmt(new ArkInstanceInvokeExpr(base, method.getSignature(), [])));
                } else {
                    logger.warn(`parameters in callback function hasn't been processed: ${method.getSignature().toString()}`);
                }
            });

        return callStmts;
    }
}
