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

import { StmtValidator, SummaryReporter } from './Validator';
import { ArkAssignStmt } from '../../core/base/Stmt';
import { AbstractFieldRef } from '../../core/base/Ref';
import type { MethodCtx } from '../Pass';
import { Local } from '../../core/base/Local';
import type { ArkMethod } from '../../core/model/ArkMethod';

export class AssignStmtValidator extends StmtValidator<ArkAssignStmt> {
    private static readonly INSTANCE = new AssignStmtValidator();

    validate(value: ArkAssignStmt, ctx: SummaryReporter): void {
        let left = value.getLeftOp();
        if (!((left instanceof Local) || (left instanceof AbstractFieldRef))) {
            ctx.error(`must assign to local or field_ref`);
        }
    }

    static {
        AssignStmtValidator.register([ArkAssignStmt, (v: ArkAssignStmt, ctx: MethodCtx, mtd: ArkMethod): void => {
            AssignStmtValidator.INSTANCE.run(v, ctx, mtd);
        }]);
    }
}
