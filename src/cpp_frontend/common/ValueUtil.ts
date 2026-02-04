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

import { Constant, StringConstant } from '../../core/base/Constant';
import { EMPTY_STRING, ValueUtil } from '../../core/common/ValueUtil';
import { CharConstant, compileConstants } from '../base/Constant';
import { Type } from '../../core/base/Type';

const charPrefixType = ['L"', "L\'", 'u"', "u\'", 'U"', "U\'"];

export class CxxValueUtil extends ValueUtil {
    /** Normalize the string constant.
     * Remove the prefix of the char-type variable and eliminate redundant double quotes
     */
    public static normalizeString(str: string): string {
        let preStr: string = str.substring(0, 2); // Get prefix processing long character type
        if (charPrefixType.includes(preStr)) {
            str = str.substring(2, str.length - 1).replace('\\', '');
        } else if (str.charAt(0) === "'" || (str.startsWith('"') && str.endsWith('"'))) {
            str = str.substring(1, str.length - 1);
        }
        return str;
    }

    /** Create C++ string constants */
    public static createStringConst(str: string): Constant {
        if (str === EMPTY_STRING) {
            return this.EMPTY_STRING_CONSTANT;
        }
        str = this.normalizeString(str);
        return new StringConstant(str);
    }

    /** Create C++ char constants */
    public static createCharConst(str: string): Constant {
        if (str === EMPTY_STRING) {
            return this.EMPTY_STRING_CONSTANT;
        }
        str = this.normalizeString(str);
        return new CharConstant(str);
    }

    /** Create C++ char constants */
    public static createCompileConst(str: string, compileType: Type): Constant {
        if (str === EMPTY_STRING) {
            return this.EMPTY_STRING_CONSTANT;
        }
        str = this.normalizeString(str);
        return new compileConstants(str, compileType);
    }
}
