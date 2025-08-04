/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import Logger, { LOG_MODULE_TYPE } from './logger';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ValueAsserts');

export class ValueAsserts {
    static ENABLE: boolean = false;

    public static enable(): void {
        this.ENABLE = true;
    }

    public static disable(): void {
        this.ENABLE = false;
    }

    public static assert(cond: boolean, msg?: string): any {
        if (!ValueAsserts.ENABLE || cond) {
            return;
        }
        let errorMsg = 'Assert failed: condition is false';
        if (msg) {
            errorMsg = 'Assert failed: ' + msg;
        }
        logger.error(errorMsg);
        throw Error(errorMsg);
    }

    public static assertDefined(val: any, msg?: string): asserts val {
        if (!ValueAsserts.ENABLE) {
            return;
        }
        if (val === undefined) {
            let errorMsg = 'Assert failed: value is undefined';
            if (msg) {
                errorMsg = 'Assert failed: ' + msg;
            }
            logger.error(errorMsg);
            throw Error(errorMsg);
        }
    }

    public static assertNotEmptyArray(val: any[], msg?: string): asserts val {
        if (!ValueAsserts.ENABLE) {
            return;
        }
        if (val.length === 0) {
            let errorMsg = 'Assert failed: array is empty';
            if (msg) {
                errorMsg = 'Assert failed: ' + msg;
            }
            logger.error(errorMsg);
            throw Error(errorMsg);
        }
    }
}