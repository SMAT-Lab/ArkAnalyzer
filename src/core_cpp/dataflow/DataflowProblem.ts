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

import { Stmt } from '../base/Stmt';
import { ArkMethod } from '../model/ArkMethod';

export abstract class DataflowProblem<D> {
    /**
     * Transfer the outFact of srcStmt to the inFact of tgtStmt
     *
     * Return true if keeping progagation (i.e., tgtStmt will be added to the WorkList for further analysis)
     */
    /*
    abstract transferNormalEdge(srcStmt: Stmt, tgtStmt: Stmt, result: DataflowResult): boolean;
    
    abstract transferCallToReturnEdge(srcStmt: Stmt, tgtStmt: Stmt, result: DataflowResult): boolean;

    abstract transferCallEdge(srcStmt: Stmt, tgtStmt: Stmt, result: DataflowResult): boolean;

    abstract transferReturnEdge(srcStmt: Stmt, tgtStmt: Stmt, result: DataflowResult): boolean;
    */

    abstract getNormalFlowFunction(srcStmt: Stmt, tgtStmt: Stmt): FlowFunction<D>;

    abstract getCallFlowFunction(srcStmt: Stmt, method: ArkMethod): FlowFunction<D>;

    abstract getExitToReturnFlowFunction(srcStmt: Stmt, tgtStmt: Stmt, callStmt: Stmt): FlowFunction<D>;

    abstract getCallToReturnFlowFunction(srcStmt: Stmt, tgtStmt: Stmt): FlowFunction<D>;

    abstract createZeroValue(): D;

    abstract getEntryPoint(): Stmt;

    abstract getEntryMethod(): ArkMethod;

    abstract factEqual(d1: D, d2: D): boolean;
}

export interface FlowFunction<D> {
    getDataFacts(d: D): Set<D>;
}
