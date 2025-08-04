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

import { ArkClass } from '../../core/model/ArkClass';
import { ClassValidator, FileValidator, MethodValidator, SummaryReporter } from './Validator';
import { ArkErrorCode } from '../../core/common/ArkError';
import { ArkFile } from '../../core/model/ArkFile';
import { ArkMethod } from '../../core/model/ArkMethod';

export class ArkMethodValidator extends MethodValidator {
    validate(mtd: ArkMethod, ctx: SummaryReporter): void {
        const err = mtd.validate();
        if (err.errCode !== ArkErrorCode.OK) {
            ctx.error(`code: ${err.errCode} msg: ${err.errMsg}`);
        }
    }
}

export class ArkClassValidator extends ClassValidator {
    validate(cls: ArkClass, ctx: SummaryReporter): void {
        const err = cls.validate();
        if (err.errCode !== ArkErrorCode.OK) {
            ctx.error(`code: ${err.errCode} msg: ${err.errMsg}`);
        }
    }
}

export class ArkFileValidator extends FileValidator {
    validate(file: ArkFile, ctx: SummaryReporter): void {
    }
}