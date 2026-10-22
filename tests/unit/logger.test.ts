/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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

import ConsoleLogger, { LOG_LEVEL, LOG_MODULE_TYPE } from '../../src/utils/logger';
import { describe, expect, it } from 'vitest';

describe('ConsoleLogger level gate Test', () => {
    it('gate reflects log4js level per category', () => {
        ConsoleLogger.configure('', LOG_LEVEL.ERROR, LOG_LEVEL.INFO, false);
        const arkanalyzer = ConsoleLogger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'gateTest');
        const tool = ConsoleLogger.getLogger(LOG_MODULE_TYPE.TOOL, 'gateTest');
        expect(ConsoleLogger.isDebugEnabled(arkanalyzer)).toBe(false);
        expect(ConsoleLogger.isWarnEnabled(arkanalyzer)).toBe(false);
        expect(ConsoleLogger.isDebugEnabled(tool)).toBe(false);
        expect(ConsoleLogger.isWarnEnabled(tool)).toBe(true);
    });

    it('gate follows reconfiguration', () => {
        ConsoleLogger.configure('', LOG_LEVEL.ERROR, LOG_LEVEL.INFO, false);
        const arkanalyzer = ConsoleLogger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'gateTest');
        expect(ConsoleLogger.isDebugEnabled(arkanalyzer)).toBe(false);
        ConsoleLogger.configure('', LOG_LEVEL.DEBUG, LOG_LEVEL.INFO, false);
        expect(ConsoleLogger.isDebugEnabled(arkanalyzer)).toBe(true);
        ConsoleLogger.configure('', LOG_LEVEL.ERROR, LOG_LEVEL.INFO, false);
        expect(ConsoleLogger.isDebugEnabled(arkanalyzer)).toBe(false);
    });
});
