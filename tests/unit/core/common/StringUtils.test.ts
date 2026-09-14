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

import { describe, expect, it } from 'vitest';
import {
    buildLineStarts,
    extractSourceTextByFullPosition,
} from '../../../../src/core/common/StringUtils';
import { FullPosition } from '../../../../src/core/base/Position';

describe('buildLineStarts / extractSourceTextByFullPosition cache', () => {
    it('matches one-shot extract when using precomputed lineStarts', () => {
        const text = 'line1\nline2\r\nline3';
        const pos = new FullPosition(2, 1, 2, 6);
        const cached = extractSourceTextByFullPosition(text, pos, buildLineStarts(text));
        const oneshot = extractSourceTextByFullPosition(text, pos);
        expect(cached).toBe('line2');
        expect(cached).toBe(oneshot);
    });
});
