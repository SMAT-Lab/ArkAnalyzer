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

import {
    BigIntConstant,
    BooleanConstant,
    Constant,
    NullConstant,
    NullPtrConstant,
    NumberConstant,
    StringConstant,
    UndefinedConstant,
} from '../base/Constant';

export const EMPTY_STRING = '';

const charPrefixType = ["L\"","L\'","u\"","u\'","U\"","U\'"]

export class ValueUtil {
    private static readonly NumberConstantCache: Map<number, Constant> = new Map();
    public static readonly EMPTY_STRING_CONSTANT = new StringConstant(EMPTY_STRING);

    public static getOrCreateNumberConst(n: number): Constant {
        let constant = this.NumberConstantCache.get(n);
        if (constant === undefined) {
            constant = new NumberConstant(n);
            this.NumberConstantCache.set(n, constant);
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
        let preStr: String = str.substring(0, 2); //获取前缀处理长字符类型
        if (charPrefixType.includes(preStr)) {
            str = str.substring(2, str.length-1).replace("\\", "");
        } else if (str.charAt(0) === "'"){
            str = str.substring(1, str.length-1);
        }
        return new StringConstant(str);
    }

    public static createConst(str: string): Constant {
        const n = Number(str);
        if (!isNaN(n)) {
            return this.getOrCreateNumberConst(n);
        }
        return new StringConstant(str);
    }

    public static getUndefinedConst(): Constant {
        return UndefinedConstant.getInstance();
    }

    public static getNullConstant(): Constant {
        return NullConstant.getInstance();
    }

    public static getBooleanConstant(value: string | boolean): Constant {
        return BooleanConstant.getInstance(value);
    }

    public static getNullPtrConstant():Constant {
        return NullPtrConstant.getInstance();
    }
}
