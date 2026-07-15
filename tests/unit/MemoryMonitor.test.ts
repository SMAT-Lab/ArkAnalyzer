/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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
import { MemoryMonitor } from '../../src/frontend/common/MemoryMonitor';

describe('MemoryMonitor', () => {
    it('is disabled when memoryLimitMB is 0 or undefined', () => {
        const monitor1 = new MemoryMonitor();
        expect(monitor1.isEnabled()).toBe(false);

        const monitor2 = new MemoryMonitor({ memoryLimitMB: 0 });
        expect(monitor2.isEnabled()).toBe(false);
    });

    it('is enabled when memoryLimitMB > 0', () => {
        const monitor = new MemoryMonitor({ memoryLimitMB: 4096 });
        expect(monitor.isEnabled()).toBe(true);
    });

    it('getHeapUsedLimitBytes returns memoryLimitMB converted to heapUsed bytes (with ratio)', () => {
        const monitor = new MemoryMonitor({ memoryLimitMB: 1024 });
        // heapUsedLimit = 1024 * 1024 * 1024 * 0.85
        expect(monitor.getHeapUsedLimitBytes()).toBe(Math.floor(1024 * 1024 * 1024 * 0.85));
    });

    it('isHeapUsedOverLimit returns false when disabled', () => {
        const monitor = new MemoryMonitor();
        expect(monitor.isHeapUsedOverLimit()).toBe(false);
    });

    it('isHeapUsedOverTarget returns false when disabled', () => {
        const monitor = new MemoryMonitor();
        expect(monitor.isHeapUsedOverTarget(0)).toBe(false);
    });
});
