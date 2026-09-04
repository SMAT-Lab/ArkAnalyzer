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

import { SignatureCanonicalizerRegistry, TempSpaceStats } from '../core/common/SignatureCanonicalizerRegistry';

/**
 * Stage Statistics Module
 *
 * Collects time and memory metrics for execution stages (e.g. builder, inferTypes).
 * Designed as a generic, stage-name-agnostic collector so that future modules
 * (CG, PTA, etc.) can plug in via `startStage(name)` without interface changes.
 *
 * Key design points:
 * - `enabled` switch: every public method early-returns when disabled (zero overhead).
 * - Named timers via `startStage(name)` / `endStage(name)`; repeated names auto-suffix
 *   with `#2`, `#3`, ... so multiple `inferTypes()` calls are distinguished.
 * - Stage nesting: a stage started while another is still running becomes its child
 *   (stack top at start time = parent); the report renders children indented.
 * - Memory peak tracked via synchronous checkpoint sampling at key points
 *   (`start`, `startStage`, `endStage`, `finish`, and `recordMemoryCheckpoint`).
 *   No `setInterval` is used — Node.js single-threaded event loop cannot schedule
 *   timer callbacks during CPU-intensive synchronous operations (AST parsing, IR
 *   construction, type inference), making interval-based sampling unreliable.
 * - `customCounters` Map for extensible, module-specific counters.
 * - `recordSignatureStats(label)`: signature-space snapshots (formal canonicalizer
 *   sizes + temp index-table stats) at checkpoints like post-build / post-infer.
 */

/**
 * Built-in stage names used by ArkAnalyzer's core pipeline.
 *
 * `startStage` / `endStage` accept any `string`, so external modules and
 * future stages (e.g. CG, PTA) can pass their own names or extend this enum.
 * Using the enum provides compile-time safety and IDE autocompletion for
 * well-known stages, while the string overload keeps the interface open.
 *
 * Hierarchy: a stage started while another stage is still running becomes its
 * child (nesting is captured automatically; the report renders indentation).
 */
export enum StageName {
    /** 构建总阶段（Scene 构建入口整体，含其下全部细分阶段）。 */
    Builder = 'builder',
    /** 细分：构建期配置解析（build-profile / oh-package / tsconfig，SceneBuilder.parseProjectConfigs）。 */
    BuilderParseConfigs = 'builderParseConfigs',
    /** 细分：SDK 构建与推断阶段（SceneBuilder.buildSdkStage）。 */
    BuilderSdk = 'builderSdk',
    /** 细分（BuilderSdk 子阶段）：SDK 源文件注册构建（buildSdk 逐文件解析注册）。 */
    BuilderSdkFiles = 'builderSdkFiles',
    /** 细分（BuilderSdk 子阶段）：SDK 类型推导与 global API 合并（doInfer + mergeGlobalAPI + postInferredSdk）。 */
    BuilderSdkInfer = 'builderSdkInfer',
    /** 细分：project 文件 DFS 构建（SceneBuilder.buildProjectFiles）。 */
    BuilderFiles = 'builderFiles',
    /** 细分：方法体构建（SceneBuilder.buildAllMethodBodies）。 */
    BuilderBodies = 'builderBodies',
    /** 推断单轮（inferTypes 的每轮遍历，多轮自动 #2/#3 后缀）。 */
    InferTypes = 'inferTypes',
    /** 推断收尾（buildStage 推进 + temp 完整性检查 + validate + 各 dispose）。 */
    InferTypesFinalize = 'inferTypesFinalize',
}

/**
 * Snapshot of signature-space sizes at a checkpoint (e.g. post-build / post-infer).
 * - formal: entry count (size) of each formal canonicalizer (dense ID space = total interned).
 * - temp: index-table stats per space (live = non-retired, retired = migrated;
 *   three-number invariant total = live + retired, see TempSignatureCanonicalizer).
 */
export interface SignatureStatsSnapshot {
    label: string;
    formal: { file: number; class: number; namespace: number; field: number; method: number };
    temp: { class: TempSpaceStats; method: TempSpaceStats; field: TempSpaceStats };
}

/**
 * Memory snapshot captured at a point in time (all values in MB).
 */
export interface MemorySnapshot {
    rssMB: number;
    heapUsedMB: number;
    heapTotalMB: number;
}

/**
 * Statistics for a single named stage.
 */
export interface StageStatEntry {
    name: string;
    /** Unique name of the enclosing running stage at start time (undefined = top level). */
    parent?: string;
    durationMs: number;
    memBefore: MemorySnapshot;
    memPeak: MemorySnapshot;
    memAfter: MemorySnapshot;
}

/**
 * Complete statistics data collected by {@link StageStatistics}.
 */
export interface StageStatisticsData {
    stages: StageStatEntry[];
    totalDurationMs: number;
    globalMemBefore: MemorySnapshot;
    globalMemPeak: MemorySnapshot;
    globalMemAfter: MemorySnapshot;
    customCounters: Map<string, number>;
    /** Signature-space snapshots at checkpoints (post-build / post-infer), in record order. */
    signatureSnapshots: SignatureStatsSnapshot[];
}

function emptySnapshot(): MemorySnapshot {
    return { rssMB: 0, heapUsedMB: 0, heapTotalMB: 0 };
}

function captureMemory(): MemorySnapshot {
    const m = process.memoryUsage();
    return {
        rssMB: m.rss / 1024 / 1024,
        heapUsedMB: m.heapUsed / 1024 / 1024,
        heapTotalMB: m.heapTotal / 1024 / 1024,
    };
}

function maxSnapshot(a: MemorySnapshot, b: MemorySnapshot): MemorySnapshot {
    return {
        rssMB: Math.max(a.rssMB, b.rssMB),
        heapUsedMB: Math.max(a.heapUsedMB, b.heapUsedMB),
        heapTotalMB: Math.max(a.heapTotalMB, b.heapTotalMB),
    };
}

interface RunningStage {
    name: string;
    startTime: number;
    memBefore: MemorySnapshot;
    sampledPeak: MemorySnapshot;
    /** Unique name of the enclosing running stage (stack top at start time). */
    parentName?: string;
}

export class StageStatistics {
    private enabled: boolean;
    private startTime: number;
    private endTime: number;
    private globalSampledPeak: MemorySnapshot;
    private globalMemBefore: MemorySnapshot;
    private globalMemAfter: MemorySnapshot;
    private finished: boolean;

    private readonly runningStages: Map<string, RunningStage> = new Map();
    private readonly stageNameCounts: Map<string, number> = new Map();
    private readonly completedStages: StageStatEntry[] = [];
    private readonly customCounters: Map<string, number> = new Map();
    private readonly signatureSnapshots: SignatureStatsSnapshot[] = [];

    constructor(enabled: boolean = false) {
        this.enabled = enabled;
        this.startTime = 0;
        this.endTime = 0;
        this.globalSampledPeak = emptySnapshot();
        this.globalMemBefore = emptySnapshot();
        this.globalMemAfter = emptySnapshot();
        this.finished = false;
    }

    public enable(): void {
        this.enabled = true;
    }

    public disable(): void {
        this.enabled = false;
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Start global timing and memory sampling.
     */
    public start(): void {
        if (!this.enabled) {
            return;
        }
        this.startTime = Date.now();
        this.globalMemBefore = captureMemory();
        this.globalSampledPeak = { ...this.globalMemBefore };
        this.finished = false;
    }

    /**
     * Start a named stage. If the same name has been used before, a suffix `#N` is appended.
     *
     * Nesting: the most recently started still-running stage (stack top) becomes
     * this stage's parent — the report renders children indented under it.
     */
    public startStage(name: string): void {
        if (!this.enabled) {
            return;
        }
        const uniqueName = this.resolveUniqueName(name);
        const memBefore = captureMemory();
        this.globalSampledPeak = maxSnapshot(this.globalSampledPeak, memBefore);
        this.runningStages.set(uniqueName, {
            name: uniqueName,
            startTime: Date.now(),
            memBefore,
            sampledPeak: { ...memBefore },
            parentName: this.currentStackTop(uniqueName),
        });
    }

    /**
     * End a named stage and record its entry.
     * Looks up the running stage whose unique name equals `name` or matches the `name#N` pattern.
     */
    public endStage(name: string): void {
        if (!this.enabled) {
            return;
        }
        const uniqueName = this.findRunningStageName(name);
        if (!uniqueName) {
            return;
        }
        const rs = this.runningStages.get(uniqueName);
        if (!rs) {
            return;
        }
        this.runningStages.delete(uniqueName);
        const memAfter = captureMemory();
        this.globalSampledPeak = maxSnapshot(this.globalSampledPeak, memAfter);
        const memPeak = maxSnapshot(rs.sampledPeak, memAfter);
        this.completedStages.push({
            name: uniqueName,
            parent: rs.parentName,
            durationMs: Date.now() - rs.startTime,
            memBefore: rs.memBefore,
            memPeak,
            memAfter,
        });
    }

    /**
     * Record a memory checkpoint inside the current running stage.
     *
     * Synchronously captures memory and updates both the global peak and the
     * current running stage's peak. Use this at fine-grained points within
     * long-running stages (e.g. inside per-method or per-file loops) to track
     * memory growth that `startStage`/`endStage` alone would miss.
     */
    public recordMemoryCheckpoint(): void {
        if (!this.enabled) {
            return;
        }
        const cur = captureMemory();
        this.globalSampledPeak = maxSnapshot(this.globalSampledPeak, cur);
        for (const rs of this.runningStages.values()) {
            rs.sampledPeak = maxSnapshot(rs.sampledPeak, cur);
        }
    }

    /**
     * Finish global timing and records final memory.
     */
    public finish(): void {
        if (!this.enabled || this.finished) {
            return;
        }
        this.runningStages.clear();
        this.globalMemAfter = captureMemory();
        this.globalSampledPeak = maxSnapshot(this.globalSampledPeak, this.globalMemAfter);
        this.endTime = Date.now();
        this.finished = true;
    }

    /**
     * Increment a custom counter (extensible for future modules).
     */
    public incrementCustomCounter(name: string, value: number = 1): void {
        if (!this.enabled) {
            return;
        }
        this.customCounters.set(name, (this.customCounters.get(name) ?? 0) + value);
    }

    public getCustomCounter(name: string): number {
        return this.customCounters.get(name) ?? 0;
    }

    /**
     * Snapshot the signature-space sizes at a checkpoint (e.g. 'post-build' /
     * 'post-infer'): formal canonicalizer entry counts per space + temp
     * index-table stats (live/retired/replaced). Read-only against the registry.
     */
    public recordSignatureStats(label: string): void {
        if (!this.enabled) {
            return;
        }
        const reg = SignatureCanonicalizerRegistry.getInstance();
        this.signatureSnapshots.push({
            label,
            formal: {
                file: reg.fileSigCanonicalizer.size(),
                class: reg.classSigCanonicalizer.size(),
                namespace: reg.namespaceSigCanonicalizer.size(),
                field: reg.fieldSigCanonicalizer.size(),
                method: reg.methodSigCanonicalizer.size(),
            },
            temp: SignatureCanonicalizerRegistry.getTempSpacesStats(),
        });
    }

    /**
     * Get the complete statistics data. Auto-finishes if still running.
     */
    public getStatistics(): StageStatisticsData {
        if (this.enabled && !this.finished) {
            this.finish();
        }
        const totalDurationMs = this.startTime > 0 && this.endTime > 0 ? this.endTime - this.startTime : 0;
        return {
            stages: this.completedStages.map(s => ({ ...s })),
            totalDurationMs,
            globalMemBefore: { ...this.globalMemBefore },
            globalMemPeak: { ...this.globalSampledPeak },
            globalMemAfter: { ...this.globalMemAfter },
            customCounters: new Map(this.customCounters),
            signatureSnapshots: this.signatureSnapshots.map(s => ({
                label: s.label,
                formal: { ...s.formal },
                temp: { class: { ...s.temp.class }, method: { ...s.temp.method }, field: { ...s.temp.field } },
            })),
        };
    }

    /**
     * Reset all collected data.
     */
    public reset(): void {
        this.runningStages.clear();
        this.stageNameCounts.clear();
        this.completedStages.length = 0;
        this.customCounters.clear();
        this.signatureSnapshots.length = 0;
        this.startTime = 0;
        this.endTime = 0;
        this.globalSampledPeak = emptySnapshot();
        this.globalMemBefore = emptySnapshot();
        this.globalMemAfter = emptySnapshot();
        this.finished = false;
    }

    /**
     * Export statistics as a JSON string (Map is converted to a plain object).
     */
    public exportToJson(): string {
        const data = this.getStatistics();
        const customCounters: Record<string, number> = {};
        data.customCounters.forEach((v, k) => {
            customCounters[k] = v;
        });
        return JSON.stringify({ ...data, customCounters }, null, 2);
    }

    /**
     * Resolve a unique stage name by appending `#N` if the name was used before.
     * The first use keeps the original name; subsequent uses get `#2`, `#3`, ...
     */
    private resolveUniqueName(name: string): string {
        const count = (this.stageNameCounts.get(name) ?? 0) + 1;
        this.stageNameCounts.set(name, count);
        if (count === 1) {
            return name;
        }
        return `${name}#${count}`;
    }

    /**
     * The most recently started still-running stage (Map insertion order = start
     * order; the last key is the stack top). The stage being started itself is
     * excluded from the candidate set.
     */
    private currentStackTop(excludeName: string): string | undefined {
        let top: string | undefined;
        for (const key of this.runningStages.keys()) {
            if (key !== excludeName) {
                top = key;
            }
        }
        return top;
    }

    /**
     * Find the unique name of a currently running stage that matches the given base name.
     * Matches `name` exactly or the `name#N` pattern. Returns the most recently started match.
     */
    private findRunningStageName(name: string): string | undefined {
        if (this.runningStages.size === 0) {
            return undefined;
        }
        let exact: string | undefined;
        let suffixed: string | undefined;
        let suffixedNum = -1;
        for (const key of this.runningStages.keys()) {
            if (key === name) {
                exact = key;
            } else if (key.startsWith(`${name}#`)) {
                const num = parseInt(key.slice(name.length + 1), 10);
                if (!isNaN(num) && num > suffixedNum) {
                    suffixedNum = num;
                    suffixed = key;
                }
            }
        }
        return suffixed ?? exact;
    }
}
