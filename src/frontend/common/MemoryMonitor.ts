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

import type { SceneOptions } from '../../Config';

/**
 * Monitors process memory usage (heapUsed) and determines whether the memory limit has been exceeded.
 *
 * Uses heapUsed (V8 heap used) as the memory metric for cache management. The configured RSS limit
 * ({@link SceneOptions.memoryLimitMB}) is converted to a heapUsed limit via {@link RSS_TO_HEAPUSED_RATIO}.
 *
 * Sampling is throttled: if the last sample was taken less than {@link THROTTLE_MS}
 * milliseconds ago, the cached result is reused to avoid excessive
 * `process.memoryUsage()` calls during rapid module loading.
 *
 * Configuration is read from {@link SceneOptions}:
 * - `memoryLimitMB`: max process memory (RSS) in MB; 0 or undefined disables monitoring.
 *   Internally converted to a heapUsed limit: `heapUsedLimit = memoryLimitMB * 1024 * 1024 * RSS_TO_HEAPUSED_RATIO`.
 *
 * @category frontend/common
 */
export class MemoryMonitor {
    private readonly heapUsedLimitBytes: number;
    private lastSampleTime: number = 0;
    private cachedUsage: { rss: number; heapUsed: number } | null = null;

    /** Minimum interval between consecutive memory samples, in milliseconds. */
    private static readonly THROTTLE_MS = 50;

    /**
     * Ratio for converting an RSS-based memory limit to a heapUsed-based limit.
     * Calibrated from scene_board_ext BODIES-level run (no eviction, no GC):
     * P50 of heapUsed/RSS = 0.911, rounded down to 0.85 for extra safety margin
     * to reduce OOM risk when node --max-old-space-size is close to memoryLimitMB.
     */
    private static readonly RSS_TO_HEAPUSED_RATIO = 0.85;

    constructor(options?: SceneOptions) {
        const limitMB = options?.memoryLimitMB ?? 0;
        this.heapUsedLimitBytes = limitMB > 0
            ? Math.floor(limitMB * 1024 * 1024 * MemoryMonitor.RSS_TO_HEAPUSED_RATIO)
            : 0;
    }

    /** Whether memory monitoring is enabled (memoryLimitMB > 0). */
    public isEnabled(): boolean {
        return this.heapUsedLimitBytes > 0;
    }

    /** Returns the heapUsed limit in bytes (converted from the RSS-based memoryLimitMB). */
    public getHeapUsedLimitBytes(): number {
        return this.heapUsedLimitBytes;
    }

    /**
     * Check whether the current heapUsed exceeds the memory limit.
     *
     * Sampling is throttled: calls within {@link THROTTLE_MS} of the last sample
     * return the cached result.
     */
    public isHeapUsedOverLimit(): boolean {
        if (!this.isEnabled()) {
            return false;
        }
        return this.getUsage().heapUsed >= this.heapUsedLimitBytes;
    }

    /**
     * Check whether the current heapUsed exceeds the given target value.
     *
     * Sampling is throttled: calls within {@link THROTTLE_MS} of the last sample
     * return the cached result.
     */
    public isHeapUsedOverTarget(targetBytes: number): boolean {
        if (!this.isEnabled()) {
            return false;
        }
        return this.getUsage().heapUsed >= targetBytes;
    }

    /**
     * Get the current heapUsed in bytes, bypassing the throttle for one-shot measurements.
     *
     * Unlike {@link isHeapUsedOverTarget} / {@link isHeapUsedOverLimit} (which use throttled sampling),
     * this method always calls `process.memoryUsage()` directly. It is intended for
     * one-shot measurements such as heapUsed recording before/after module loading and
     * real-time heapUsed checks during eviction (each unload/downgrade calls this to
     * decide whether more eviction is needed).
     */
    public getCurrentHeapUsed(): number {
        return process.memoryUsage().heapUsed;
    }

    private getUsage(): { rss: number; heapUsed: number } {
        const now = Date.now();
        if (this.cachedUsage && now - this.lastSampleTime < MemoryMonitor.THROTTLE_MS) {
            return this.cachedUsage;
        }
        this.lastSampleTime = now;
        const usage = process.memoryUsage();
        this.cachedUsage = { rss: usage.rss, heapUsed: usage.heapUsed };
        return this.cachedUsage;
    }
}
