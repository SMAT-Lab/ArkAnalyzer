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

import { ArkInstanceFieldRef } from '../../core/base/Ref';
import { Local } from '../../core/base/Local';
import { FieldSignature } from '../../core/model/ArkSignature';

/**
 * C++ member access implementation, designed as a derived class because it needs to distinguish between p.f
 * and p->f without intrusive modification to the original arkIR
 */
export class ArkCxxInstanceFieldRef extends ArkInstanceFieldRef {
    private isArrow: boolean;

    constructor(base: Local, isArrow: boolean, fieldSignature: FieldSignature) {
        super(base, fieldSignature);
        this.isArrow = isArrow;
    }

    public isArrowAccess(): boolean {
        return this.isArrow;
    }

    public toString(): string {
        return this.getBase().toString() + (this.isArrow ? '->' : '.') + '<' + this.getFieldSignature() + '>';
    }
}