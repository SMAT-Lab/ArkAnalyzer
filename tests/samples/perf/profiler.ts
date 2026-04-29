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


import * as inspector from 'inspector';
import { performance, PerformanceObserver } from 'perf_hooks';
import * as v8 from 'v8';
import * as path from 'path';
import * as fs from 'fs';

import { getCxxSourceFileExtensions, Scene, buildSceneConfigFromProject } from '../../../src';

const HEAP_SNAPSHOT_ENABLED = process.env.PERF_HEAP_SNAPSHOT === '1';
const HEAP_SAMPLING_INTERVAL_BYTES = 32 * 1024;
const RAW_OUTPUT_DIR = path.resolve(process.cwd(), 'output', 'raw');

export interface HeapSize {
    used: number; // Used heap size (bytes)
    total: number; // Total heap size (bytes)
    limit: number; // Heap size limit (bytes)
}

export interface GCPause {
    type: string; // GC type (Scavenge, MarkSweepCompact, etc.)
    durationMs: number; // Pause duration (ms)
    timestamp: number; // Timestamp relative to process start (ms)
    source: 'natural' | 'manual'; // GC trigger source
}

/**
 * Aggregated GC metrics for a stage (summary JSON stores this instead of per-pause detail).
 */
export interface GcPauseStats {
    count: number;
    totalDurationMs: number;
    naturalCount: number;
    naturalDurationMs: number;
    manualCount: number;
    manualDurationMs: number;
}

export function emptyGcPauseStats(): GcPauseStats {
    return {
        count: 0,
        totalDurationMs: 0,
        naturalCount: 0,
        naturalDurationMs: 0,
        manualCount: 0,
        manualDurationMs: 0,
    };
}

export function summarizeGcPauses(events: GCPause[]): GcPauseStats {
    let naturalCount = 0;
    let naturalDurationMs = 0;
    let manualCount = 0;
    let manualDurationMs = 0;
    for (const event of events) {
        if (event.source === 'manual') {
            manualCount += 1;
            manualDurationMs += event.durationMs;
        } else {
            naturalCount += 1;
            naturalDurationMs += event.durationMs;
        }
    }
    return {
        count: events.length,
        totalDurationMs: naturalDurationMs + manualDurationMs,
        naturalCount,
        naturalDurationMs,
        manualCount,
        manualDurationMs,
    };
}

export function averageGcPauseStats(runs: GcPauseStats[]): GcPauseStats {
    if (runs.length === 0) {
        return emptyGcPauseStats();
    }
    const mean = (values: number[]): number => {
        if (values.length === 0) {
            return 0;
        }
        return values.reduce((sum, value) => sum + value, 0) / values.length;
    };
    return {
        count: Math.round(mean(runs.map((run) => run.count))),
        totalDurationMs: mean(runs.map((run) => run.totalDurationMs)),
        naturalCount: Math.round(mean(runs.map((run) => run.naturalCount))),
        naturalDurationMs: mean(runs.map((run) => run.naturalDurationMs)),
        manualCount: Math.round(mean(runs.map((run) => run.manualCount))),
        manualDurationMs: mean(runs.map((run) => run.manualDurationMs)),
    };
}

export interface CpuHotFunctionStat {
    name: string;
    location: string; // fileName:lineNumber
    selfTimeMs: number;
    sampleCount: number;
    selfTimeStdDevMs?: number; // Optional stability metric across repeated runs
    selfTimeCv?: number; // Optional coefficient of variation (stddev / mean)
}

export interface AllocationStat {
    name: string;
    location: string;
    allocatedBytes: number;
    allocatedMb: number;
    allocatedBytesStdDev?: number; // Optional stability metric across repeated runs
    allocatedBytesCv?: number; // Optional coefficient of variation (stddev / mean)
    sampleCount?: number; // Optional allocation sample count
}

export interface SamplingHeapProfileNode {
    callFrame: inspector.Runtime.CallFrame;
    selfSize: number;
    children?: SamplingHeapProfileNode[];
}

export interface SamplingHeapProfile {
    head: SamplingHeapProfileNode;
}

export interface SamplingStopResult {
    profile?: SamplingHeapProfile;
}

export interface StageSamplingResult {
    stage: string;
    outputPath: string;
    profile?: SamplingHeapProfile;
}

export interface StageMetrics {
    stageName: string;
    durationMs: number;
    cpuProfile: inspector.Profiler.Profile; // Raw CPU profile data
    heapBefore: HeapSize;
    heapAfter: HeapSize;
    heapGrowthBytes: number;
    heapPeakUsedBytes: number;
    rssPeakBytes: number;
    gcPauses: GcPauseStats;
    cpuHotFunctions: CpuHotFunctionStat[]; // Top N functions by self time
    allocationHotFunctions: AllocationStat[];
}

/**
 * Optional summary metadata and Scene model sizes (filled after profiling / when persisting from run.ts).
 */
export interface ProfilerSummaryFields {
    /** Perf target id (e.g. photos, opencv); filled when persisting summary from run.ts. */
    project?: string;
    /** ArkAnalyzer workspace `git rev-parse HEAD` when the summary was written. */
    gitCommit?: string;
    /** ISO 8601 timestamp when the summary JSON was finalized. */
    reportTime?: string;
    /**
     * After `inferTypes`, from `Scene#getFiles`, `Scene#getClasses`, `Scene#getMethods`
     * (project `filesMap` scope; not `sdkArkFilesMap`).
     */
    arkFileCount?: number;
    arkClassCount?: number;
    arkMethodCount?: number;
    arkStmtCount?: number;
}

export interface ProfilerResult extends ProfilerSummaryFields {
    stages: StageMetrics[];
    totalDurationMs: number;
}

export interface ProfilerHooks {
    onStageStart?: (stageName: string) => void;
    onStageEnd?: (stageName: string, metrics: StageMetrics) => void;
}

type StageAction = () => void;

interface StageExecutionResult {
    metrics: StageMetrics;
}

function getHeapSize(): HeapSize {
    const stats = v8.getHeapStatistics();
    return {
        used: stats.used_heap_size,
        total: stats.total_heap_size,
        limit: stats.heap_size_limit,
    };
}

/**
 * Parse CPU profile data and extract Top-N hotspots by self time.
 */
function toMb(value: number): number {
    return value / 1024 / 1024;
}

function analyzeCpuHotFunctions(profile: inspector.Profiler.Profile, topN: number = 20): CpuHotFunctionStat[] {
    const samples = profile.samples ?? [];
    const timeDeltas = profile.timeDeltas ?? [];
    const nodeMap = new Map<number, inspector.Profiler.ProfileNode>();

    for (const node of profile.nodes) {
        nodeMap.set(node.id, node);
    }

    // Accumulate self time and sample count for each node.
    const selfTimeByNode = new Map<number, number>();
    const sampleCountByNode = new Map<number, number>();

    for (let i = 0; i < samples.length; i++) {
        const nodeId = samples[i];
        const deltaUs = timeDeltas[i] ?? 0;
        selfTimeByNode.set(nodeId, (selfTimeByNode.get(nodeId) ?? 0) + deltaUs / 1000);
        sampleCountByNode.set(nodeId, (sampleCountByNode.get(nodeId) ?? 0) + 1);
    }

    // Aggregate function stats.
    const aggregated = new Map<string, CpuHotFunctionStat>();
    for (const [nodeId, selfTimeMs] of selfTimeByNode) {
        const node = nodeMap.get(nodeId);
        if (!node) {
            continue;
        }
        const frame = node.callFrame;
        if (!frame.functionName || frame.functionName === '(idle)') { 
            continue;
        }

        const fileName = frame.url ? path.basename(frame.url) : 'unknown';
        const location = `${fileName}:${frame.lineNumber + 1}`;
        const key = `${frame.functionName}:${location}`;

        const current = aggregated.get(key) ?? {
            name: frame.functionName,
            location,
            selfTimeMs: 0,
            sampleCount: 0,
        };
        current.selfTimeMs += selfTimeMs;
        current.sampleCount += sampleCountByNode.get(nodeId) ?? 0;
        aggregated.set(key, current);
    }

    return Array.from(aggregated.values())
        .sort((a, b) => b.selfTimeMs - a.selfTimeMs)
        .slice(0, topN);
}


class StageProfiler {
    private session: inspector.Session;
    private stageStartTime: number = 0;
    private gcObserver: PerformanceObserver;
    private gcEvents: GCPause[] = [];
    private manualGcWindowStart: number | null = null;
    private manualGcWindowEnd: number | null = null;
    private heapBefore: HeapSize = { used: 0, total: 0, limit: 0 };
    private heapAfter: HeapSize = { used: 0, total: 0, limit: 0 };
    private heapPeakUsedBytes: number = 0;
    private rssPeakBytes: number = 0;
    private memoryPeakSampler?: NodeJS.Timeout;

    private static readonly HEAP_SNAPSHOT_EVENT = 'HeapProfiler.addHeapSnapshotChunk';

    constructor() {
        this.session = new inspector.Session();

        // Create a GC observer and only keep events from this stage.
        this.gcObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType !== 'gc') {
                    continue;
                }
                this.recordGcEntry(entry);
            }
        });
    }

    async start(): Promise<void> {
        // Capture stage start time and heap state.
        this.stageStartTime = performance.now();
        this.heapBefore = getHeapSize();
        this.heapPeakUsedBytes = this.heapBefore.used;
        this.rssPeakBytes = process.memoryUsage().rss;
        this.memoryPeakSampler = setInterval(() => {
            const used = getHeapSize().used;
            const rss = process.memoryUsage().rss;
            if (used > this.heapPeakUsedBytes) {
                this.heapPeakUsedBytes = used;
            }
            if (rss > this.rssPeakBytes) {
                this.rssPeakBytes = rss;
            }
        }, 10);
        this.memoryPeakSampler.unref();

        // Start GC observation.
        this.gcObserver.observe({ entryTypes: ['gc'], buffered: true });

        // Connect and start CPU profiler.
        this.session.connect();
        await this.post('Profiler.enable');
        await this.post('Profiler.start');

        // Start heap sampling profiler (using same session).
        await this.post('HeapProfiler.enable');
        await this.post('HeapProfiler.startSampling', { 
            samplingInterval: HEAP_SAMPLING_INTERVAL_BYTES 
        });
    }

    async stop(stageName: string): Promise<Omit<StageMetrics, 'stageName' | 'durationMs'>> {
        if (this.memoryPeakSampler) {
            clearInterval(this.memoryPeakSampler);
            this.memoryPeakSampler = undefined;
        }
        await this.triggerManualGcIfAvailable();
        this.collectPendingGcEntries();

        // Stop CPU profiler and collect result.
        const result = await this.post<{ profile: inspector.Profiler.Profile }>('Profiler.stop');
        await this.post('Profiler.disable');

        // Stop heap sampling profiler and collect result.
        const heapSamplingResult = await this.post<SamplingStopResult>('HeapProfiler.stopSampling');
        await this.post('HeapProfiler.disable');
        const allocationHotFunctions = heapSamplingResult.profile 
            ? summarizeAllocationHotFunctions(heapSamplingResult.profile, 20) 
            : [];

        // Stop GC observation.
        this.gcObserver.disconnect();

        // Capture heap state at stage end.
        this.heapAfter = getHeapSize();
        if (this.heapAfter.used > this.heapPeakUsedBytes) {
            this.heapPeakUsedBytes = this.heapAfter.used;
        }
        const rssAfter = process.memoryUsage().rss;
        if (rssAfter > this.rssPeakBytes) {
            this.rssPeakBytes = rssAfter;
        }

        // Analyze hotspot functions.
        const cpuHotFunctions = analyzeCpuHotFunctions(result.profile, 20);
        try {
            await this.takeHeapSnapshotIfEnabled(stageName);
            return {
                cpuProfile: result.profile,
                heapBefore: this.heapBefore,
                heapAfter: this.heapAfter,
                heapGrowthBytes: this.heapAfter.used - this.heapBefore.used,
                heapPeakUsedBytes: this.heapPeakUsedBytes,
                rssPeakBytes: this.rssPeakBytes,
                gcPauses: summarizeGcPauses(this.gcEvents),
                cpuHotFunctions,
                allocationHotFunctions,
            };
        } finally {
            this.session.disconnect();
        }
    }

    private createHeapSnapshotContext(): {
        fd: number | undefined;
        writeError: Error | undefined;
        heapProfilerEnabled: boolean;
        chunkHandler: (event: { params?: { chunk?: string } }) => void;
    } {
        const context = {
            fd: undefined as number | undefined,
            writeError: undefined as Error | undefined,
            heapProfilerEnabled: false,
            chunkHandler: (_event: { params?: { chunk?: string } }): void => {
                // assigned below
            },
        };

        context.chunkHandler = (event: { params?: { chunk?: string } }): void => {
            if (context.writeError || context.fd === undefined) {
                return;
            }
            const chunk = event.params?.chunk;
            if (!chunk) {
                return;
            }
            try {
                fs.writeSync(context.fd, chunk, undefined, 'utf8');
            } catch (error) {
                context.writeError = error instanceof Error ? error : new Error(String(error));
            }
        };

        return context;
    }

    private async enableHeapProfilerAndSubscribe(
        chunkHandler: (event: { params?: { chunk?: string } }) => void
    ): Promise<void> {
        await this.post('HeapProfiler.enable');
        this.session.on(StageProfiler.HEAP_SNAPSHOT_EVENT, chunkHandler);
    }

    private async disableHeapProfilerIfEnabled(heapProfilerEnabled: boolean): Promise<void> {
        if (!heapProfilerEnabled) {
            return;
        }
        try {
            await this.post('HeapProfiler.disable');
        } catch {
            // ignore cleanup errors
        }
    }

    private async cleanupHeapSnapshotContext(
        context: { fd: number | undefined; heapProfilerEnabled: boolean; chunkHandler: (event: { params?: { chunk?: string } }) => void }
    ): Promise<void> {
        this.session.off(StageProfiler.HEAP_SNAPSHOT_EVENT, context.chunkHandler);
        await this.disableHeapProfilerIfEnabled(context.heapProfilerEnabled);
        if (context.fd !== undefined) {
            fs.closeSync(context.fd);
        }
    }

    private async takeHeapSnapshotIfEnabled(stageName: string): Promise<void> {
        if (!HEAP_SNAPSHOT_ENABLED) {
            return;
        }

        ensureRawOutputDir();
        const snapshotPath = path.join(RAW_OUTPUT_DIR, `${formatTimestampForFile()}-${stageName}.heapsnapshot`);
        const context = this.createHeapSnapshotContext();

        try {
            context.fd = fs.openSync(snapshotPath, 'w');
            await this.enableHeapProfilerAndSubscribe(context.chunkHandler);
            context.heapProfilerEnabled = true;
            await this.post('HeapProfiler.takeHeapSnapshot', { reportProgress: false });
            if (context.writeError) {
                throw context.writeError;
            }
            console.log(`[HeapSnapshot] ${stageName}: ${snapshotPath}`);
        } catch (error) {
            console.warn(`[HeapSnapshot] ${stageName}: failed (${String(error)})`);
        } finally {
            await this.cleanupHeapSnapshotContext(context);
        }
    }

    private collectPendingGcEntries(): void {
        const pendingEntries = this.gcObserver.takeRecords();
        for (const entry of pendingEntries) {
            if (entry.entryType !== 'gc') {
                continue;
            }
            this.recordGcEntry(entry);
        }
    }

    private async triggerManualGcIfAvailable(): Promise<void> {
        if (typeof global.gc !== 'function') {
            return;
        }
        this.manualGcWindowStart = performance.now();
        global.gc();
        await new Promise<void>((resolve) => setImmediate(resolve));
        this.manualGcWindowEnd = performance.now();
    }

    private recordGcEntry(entry: PerformanceEntry): void {
        const gcEntry = entry as PerformanceEntry & { detail?: { kind?: number | string } };
        const timestamp = gcEntry.startTime ?? 0;
        if (timestamp < this.stageStartTime) {
            return;
        }
        const kind = gcEntry.detail?.kind;
        this.gcEvents.push({
            type: kind !== undefined ? String(kind) : 'unknown',
            durationMs: gcEntry.duration ?? 0,
            timestamp,
            source: this.isManualGc(timestamp) ? 'manual' : 'natural',
        });
    }

    private isManualGc(timestamp: number): boolean {
        if (this.manualGcWindowStart === null || this.manualGcWindowEnd === null) {
            return false;
        }
        return timestamp >= this.manualGcWindowStart && timestamp <= this.manualGcWindowEnd;
    }

    private async post<T = unknown>(method: string, params?: object): Promise<T> {
        return this.postWithSession(this.session, method, params);
    }

    private async postWithSession<T = unknown>(
        session: inspector.Session,
        method: string,
        params?: object
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const callback = (err: Error | null, result?: object): void => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve((result ?? {}) as T);
            };

            if (params === undefined) {
                session.post(method, callback);
                return;
            }
            session.post(method, params, callback);
        });
    }
}

function ensureRawOutputDir(): void {
    if (!fs.existsSync(RAW_OUTPUT_DIR)) {
        fs.mkdirSync(RAW_OUTPUT_DIR, { recursive: true });
    }
}

function formatTimestampForFile(date: Date = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-` +
        `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}-${date.getMilliseconds()}`;
}

function measureStage(action: StageAction): number {
    const stageStart = performance.now();
    action();
    return performance.now() - stageStart;
}

function createStageMetrics(
    stageName: string,
    durationMs: number,
    profilerData: Omit<StageMetrics, 'stageName' | 'durationMs'>
): StageMetrics {
    return {
        stageName,
        durationMs,
        ...profilerData,
    };
}

async function runProfiledStage(
    stageName: string,
    action: StageAction,
    hooks?: ProfilerHooks
): Promise<StageExecutionResult> {
    hooks?.onStageStart?.(stageName);
    const profiler = new StageProfiler();
    await profiler.start();

    const durationMs = measureStage(action);
    const profilerData = await profiler.stop(stageName);
    const metrics = createStageMetrics(stageName, durationMs, profilerData);
    hooks?.onStageEnd?.(stageName, metrics);

    return { metrics };
}

function applyCcJsonConfig(sceneConfig: ReturnType<typeof buildSceneConfigFromProject>, ccJsonPath?: string): void {
    if (!ccJsonPath) {
        return;
    }
    sceneConfig.getOptions().supportFileExts = [...getCxxSourceFileExtensions()];
    sceneConfig.setCcjsonPath(ccJsonPath);
}

function buildSceneConfigStage(projectPath: string, ccJsonPath: string | undefined): ReturnType<typeof buildSceneConfigFromProject> {
    const sceneConfig = buildSceneConfigFromProject(projectPath, process.env.OHOS_SDK_HOME);
    applyCcJsonConfig(sceneConfig, ccJsonPath);
    return sceneConfig;
}

function summarizeAllocationHotFunctions(profile: SamplingHeapProfile, topN: number): AllocationStat[] {
    const aggregated = new Map<string, { stat: AllocationStat; count: number }>();
    const stack: SamplingHeapProfileNode[] = [profile.head];

    while (stack.length > 0) {
        const current = stack.pop();
        if (!current) {
            continue;
        }
        const frame = current.callFrame;
        if (frame.functionName && frame.functionName !== '(idle)') {
            const fileName = frame.url ? path.basename(frame.url) : 'unknown';
            const location = `${fileName}:${frame.lineNumber + 1}`;
            const key = `${frame.functionName}:${location}`;
            const entry = aggregated.get(key) ?? {
                stat: {
                    name: frame.functionName,
                    location,
                    allocatedBytes: 0,
                    allocatedMb: 0,
                },
                count: 0,
            };
            entry.stat.allocatedBytes += current.selfSize;
            entry.stat.allocatedMb = toMb(entry.stat.allocatedBytes);
            entry.count += 1;
            aggregated.set(key, entry);
        }
        for (const child of current.children ?? []) {
            stack.push(child);
        }
    }

    return Array.from(aggregated.values())
        .map((entry) => {
            entry.stat.sampleCount = entry.count;
            return entry.stat;
        })
        .sort((a, b) => b.allocatedBytes - a.allocatedBytes)
        .slice(0, topN);
}

function countStmts(scene: Scene): number {
    let stmtCount = 0;
    for (const method of scene.getMethods()) {
        const cfg = method.getCfg();
        if (cfg) {
            stmtCount += cfg.getStmts().length;
        }
    }
    return stmtCount;
}

function summarizeResult(stages: StageMetrics[], scene: Scene): ProfilerResult {
    return {
        stages,
        totalDurationMs: stages.reduce((sum, stage) => sum + stage.durationMs, 0),
        arkFileCount: scene.getFiles().length,
        arkClassCount: scene.getClasses().length,
        arkMethodCount: scene.getMethods().length,
        arkStmtCount: countStmts(scene),
    };
}


/**
 * Run three-stage performance profiling for a TypeScript project.
 *
 * @param projectPath - Absolute path to the project to analyze.
 * @param hooks - Lifecycle hooks for stage start/end notifications.
 * @returns Result object containing detailed metrics for all three stages.
 *
 * @example
 * ```typescript
 * import { profileArkAnalyzer } from './profiler';
 * import { Scene, SceneConfig } from '../../src';
 *
 * const result = await profileArkAnalyzer('/path/to/project', {
 *   onStageStart: (name) => console.log(`Starting ${name}...`),
 *   onStageEnd: (name, metrics) => console.log(`${name} took ${metrics.durationMs}ms`),
 * });
 * ```
 */
export async function profileArkAnalyzer(
    projectPath: string,
    ccJsonPath?: string,
    hooks?: ProfilerHooks
): Promise<ProfilerResult> {
    const stages: StageMetrics[] = [];
    let sceneConfig = buildSceneConfigFromProject(projectPath, process.env.OHOS_SDK_HOME);
    const stage1 = await runProfiledStage('buildConfig', () => {
        sceneConfig = buildSceneConfigStage(projectPath, ccJsonPath);
    }, hooks);
    stages.push(stage1.metrics);

    const scene = new Scene();
    const stage2 = await runProfiledStage('buildScene', () => {
        scene.buildSceneFromFiles(sceneConfig);
    }, hooks);
    stages.push(stage2.metrics);

    const stage3 = await runProfiledStage('inferTypes', () => {
        scene.inferTypes();
    }, hooks);
    stages.push(stage3.metrics);

    return summarizeResult(stages, scene);
}

/**
 * Manually trigger garbage collection (requires --expose-gc at startup).
 */
export function forceGC(): void {
    if (typeof global.gc === 'function') {
        global.gc();
    }
}

/**
 * Serialize profiling result to a storable JSON string.
 */
export function serializeResult(result: ProfilerResult): string {
    // Deep-copy to avoid mutating the original result.
    const serializable = JSON.parse(JSON.stringify(result));
    // Optional: trim redundant fields and keep only required summary data.
    return JSON.stringify(serializable, null, 2);
}