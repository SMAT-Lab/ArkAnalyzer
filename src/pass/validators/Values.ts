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

import { SummaryReporter, ValueValidator } from './Validator';
import { Local } from '../../core/base/Local';
import { NAME_PREFIX } from '../../core/common/Const';
import { MethodCtx } from '../Pass';
import { ArkMethod } from '../../core/model/ArkMethod';

export class LocalValidator extends ValueValidator<Local> {
    private static readonly INSTANCE = new LocalValidator();

    validate(value: Local, ctx: SummaryReporter): void {
        if (value.getName().startsWith(NAME_PREFIX) && !value.getDeclaringStmt()) {
            ctx.info(`should have declaring stmt`);
        }
    }

    static {
        LocalValidator.register([Local, (v: Local, ctx: MethodCtx, mtd: ArkMethod): void => {
            LocalValidator.INSTANCE.run(v, ctx, mtd);
        }]);
    }
}