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

import { BigIntConstant, BooleanConstant, Constant, NullConstant, NumberConstant, StringConstant, UndefinedConstant } from '../base/Constant';

export const EMPTY_STRING = '';

export class ValueUtil {
    private static readonly NumberConstantCache: Map<string, Constant> = new Map();
    public static readonly EMPTY_STRING_CONSTANT = new StringConstant(EMPTY_STRING);

    /*
     * Set static field to be null, then all related objects could be freed by GC.
     * Class SdkUtils is only internally used by ArkAnalyzer, the dispose method should be called by users themselves before drop Scene.
     */
    public static dispose(): void {
        this.NumberConstantCache.clear();
    }

    /*
     * Get the number constant instance according to its value, and create a new one if didn't find.
     * In order to distinguish 1, 1.0, 0x0001, here support to find with string instead of only number.
     */
    public static getOrCreateNumberConst(n: number | string): Constant {
        let nStr: string;
        if (typeof n === 'number') {
            nStr = n.toString();
        } else {
            nStr = n;
        }
        let constant = this.NumberConstantCache.get(nStr);
        if (constant === undefined) {
            constant = new NumberConstant(nStr);
            this.NumberConstantCache.set(nStr, constant);
        }
        return constant;
    }

    public static createBigIntConst(bigInt: bigint): BigIntConstant {
        return new BigIntConstant(bigInt);
    }

    public static createStringConst(str: string): Constant {
        if (str === EMPTY_STRING) {
            return this.EMPTY_STRING_CONSTANT;
        }
        return new StringConstant(str);
    }

    public static createConst(str: string): Constant {
        const n = Number(str);
        if (!isNaN(n)) {
            return this.getOrCreateNumberConst(str);
        }
        return new StringConstant(str);
    }

    public static getUndefinedConst(): Constant {
        return UndefinedConstant.getInstance();
    }

    public static getNullConstant(): Constant {
        return NullConstant.getInstance();
    }

    public static getBooleanConstant(value: boolean): Constant {
        return BooleanConstant.getInstance(value);
    }
}
