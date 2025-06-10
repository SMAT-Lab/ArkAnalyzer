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

import { Value } from '../base/Value';
import { ArkAssignStmt, Stmt } from '../base/Stmt';
import { IRUtils } from './IRUtils';

/**
 * Replace old def(Value) of a Stmt inplace
 */
export class StmtDefReplacer {
    private oldDef: Value;
    private newDef: Value;

    constructor(oldDef: Value, newDef: Value) {
        this.oldDef = oldDef;
        this.newDef = newDef;
    }

    public caseStmt(stmt: Stmt): void {
        if (stmt instanceof ArkAssignStmt) {
            this.caseAssignStmt(stmt);
        }
    }

    private caseAssignStmt(stmt: ArkAssignStmt): void {
        const lValue = stmt.getLeftOp();
        if (lValue === this.oldDef) {
            IRUtils.adjustOperandOriginalPositions(stmt, this.oldDef, this.newDef);
            stmt.setLeftOp(this.newDef);
        }
    }
}
