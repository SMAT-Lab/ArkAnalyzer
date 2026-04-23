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

import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
    profileArkAnalyzer,
    serializeResult,
    StageMetrics,
    ProfilerResult,
    CpuHotFunctionStat,
    AllocationStat,
    GcPauseStats,
    averageGcPauseStats,
} from './profiler';
import { ensureDir, PerfProjectConfig, RAW_DIR } from './utils';

/** Repository root (arkanalyzer) from `tests/samples/perf`. */
const ARKANALYZER_REPO_ROOT = path.join(__dirname, '../../..');

/**
 * Read `git rev-parse HEAD` for the given repo root; empty string on failure.
 */
function readGitHeadCommit(repoRoot: string): string {
    try {
        const out = cp.execFileSync('git', ['-C', repoRoot, 'rev-parse', 'HEAD'], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        });
        return out.trim();
    } catch {
        return '';
    }
}

/**
 * Generate a timestamp string (format: YYYYMMDD-HHMMSS).
 */
function formatTimestamp(date: Date = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-` +
        `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

/**
 * Save a single-stage CPU profile to file.
 */
function saveCpuProfile(stage: StageMetrics, runId: string): string {
    const fileName = `${runId}-${stage.stageName}.cpuprofile`;
    const filePath = path.join(RAW_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(stage.cpuProfile));
    return filePath;
}

/**
 * Save summary data as JSON.
 */
function saveSummary(result: ProfilerResult, runId: string): string {
    const summaryJson = serializeResult(result);

    const jsonFileName = `${runId}-summary.json`;
    const jsonFilePath = path.join(RAW_DIR, jsonFileName);
    fs.writeFileSync(jsonFilePath, summaryJson);

    const reportTemplatePath = path.resolve(__dirname, 'report.html');
    const reportHtml = fs.readFileSync(reportTemplatePath, 'utf-8');
    const scriptTag = '<script id="summary-data" type="application/json"></script>';
    const summaryScriptTag = `<script id="summary-data" type="application/json">${summaryJson}</script>`;
    const hydratedReportHtml = reportHtml.replace(scriptTag, summaryScriptTag);

    const htmlFileName = `${runId}-summary.html`;
    const htmlFilePath = path.join(RAW_DIR, htmlFileName);
    fs.writeFileSync(htmlFilePath, hydratedReportHtml);

    return jsonFilePath;
}

/**
 * Print stage metrics to console.
 */
function printStageSummary(stage: StageMetrics): void {
    console.log(`\n[${stage.stageName}]`);
    console.log(`  Duration      : ${stage.durationMs.toFixed(2)} ms`);
    console.log(`  Heap Growth   : ${(stage.heapGrowthBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Peak     : ${(stage.heapPeakUsedBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  RSS Peak      : ${((stage.rssPeakBytes ?? 0) / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  GC Pauses     : ${stage.gcPauses.count} (${stage.gcPauses.totalDurationMs.toFixed(2)} ms)`);
    console.log(`  CPU Hot Functions : ${stage.cpuHotFunctions.length}`);
    if (stage.cpuHotFunctions.length > 0) {
        const top = stage.cpuHotFunctions[0];
        console.log(`    Top: ${top.name} (${top.selfTimeMs.toFixed(2)} ms)`);
    }
    console.log(`  Allocation Hot Functions : ${stage.allocationHotFunctions.length}`);
    if (stage.allocationHotFunctions.length > 0) {
        const top = stage.allocationHotFunctions[0];
        console.log(`    Top: ${top.name} (${top.allocatedMb.toFixed(2)} MB)`);
    }
}

function average(values: number[]): number {
    if (values.length === 0) {
        return 0;
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
    if (values.length <= 1) {
        return 0;
    }
    const mean = average(values);
    const variance = values.reduce((sum, value) => {
        const delta = value - mean;
        return sum + (delta * delta);
    }, 0) / values.length;
    return Math.sqrt(variance);
}

interface StageAccumulator {
    stageName: string;
    durations: number[];
    heapGrowths: number[];
    heapPeakUsedBytes: number[];
    rssPeakBytes: number[];
    heapBeforeUsed: number[];
    heapBeforeTotal: number[];
    heapBeforeLimit: number[];
    heapAfterUsed: number[];
    heapAfterTotal: number[];
    heapAfterLimit: number[];
    gcStatsRuns: GcPauseStats[];
    cpuHotFunctionRuns: CpuHotFunctionStat[][];
    allocationHotFunctionRuns: AllocationStat[][];
}

function aggregateAverageCpuHotFunctions(cpuHotFunctionRuns: CpuHotFunctionStat[][], topN: number = 20): CpuHotFunctionStat[] {
    const grouped = new Map<string, {
        name: string;
        location: string;
        selfTimes: number[];
        sampleCounts: number[];
    }>();
    const rounds = cpuHotFunctionRuns.length;

    for (let runIndex = 0; runIndex < rounds; runIndex++) {
        const cpuHotFunctions = cpuHotFunctionRuns[runIndex];
        for (const fn of cpuHotFunctions) {
            const key = `${fn.name}:${fn.location}`;
            const current = grouped.get(key) ?? {
                name: fn.name,
                location: fn.location,
                selfTimes: Array.from({ length: rounds }, () => 0),
                sampleCounts: Array.from({ length: rounds }, () => 0),
            };
            current.selfTimes[runIndex] = fn.selfTimeMs;
            current.sampleCounts[runIndex] = fn.sampleCount;
            grouped.set(key, current);
        }
    }

    return Array.from(grouped.values())
        .map((item) => {
            const selfTimeMs = average(item.selfTimes);
            const selfTimeStdDevMs = standardDeviation(item.selfTimes);
            const selfTimeCv = selfTimeMs > 0 ? selfTimeStdDevMs / selfTimeMs : 0;
            return {
                name: item.name,
                location: item.location,
                selfTimeMs,
                sampleCount: Math.round(average(item.sampleCounts)),
                selfTimeStdDevMs,
                selfTimeCv,
            };
        })
        .sort((a, b) => b.selfTimeMs - a.selfTimeMs)
        .slice(0, topN);
}

function aggregateAverageAllocationHotFunctions(allocationHotFunctionRuns: AllocationStat[][], topN: number = 20): AllocationStat[] {
    const grouped = new Map<string, {
        name: string;
        location: string;
        allocatedBytes: number[];
        sampleCounts: number[];
    }>();
    const rounds = allocationHotFunctionRuns.length;

    for (let runIndex = 0; runIndex < rounds; runIndex++) {
        const allocationHotFunctions = allocationHotFunctionRuns[runIndex];
        for (const fn of allocationHotFunctions) {
            const key = `${fn.name}:${fn.location}`;
            const current = grouped.get(key) ?? {
                name: fn.name,
                location: fn.location,
                allocatedBytes: Array.from({ length: rounds }, () => 0),
                sampleCounts: Array.from({ length: rounds }, () => 0),
            };
            current.allocatedBytes[runIndex] = fn.allocatedBytes;
            current.sampleCounts[runIndex] = fn.sampleCount ?? 0;
            grouped.set(key, current);
        }
    }

    return Array.from(grouped.values())
        .map((item) => {
            const allocatedBytes = average(item.allocatedBytes);
            const allocatedBytesStdDev = standardDeviation(item.allocatedBytes);
            const allocatedBytesCv = allocatedBytes > 0 ? allocatedBytesStdDev / allocatedBytes : 0;
            return {
                name: item.name,
                location: item.location,
                allocatedBytes,
                allocatedMb: allocatedBytes / 1024 / 1024,
                allocatedBytesStdDev,
                allocatedBytesCv,
                sampleCount: Math.round(average(item.sampleCounts)),
            };
        })
        .sort((a, b) => b.allocatedBytes - a.allocatedBytes)
        .slice(0, topN);
}

function createStageAccumulator(stageName: string): StageAccumulator {
    return {
        stageName,
        durations: [],
        heapGrowths: [],
        heapPeakUsedBytes: [],
        rssPeakBytes: [],
        heapBeforeUsed: [],
        heapBeforeTotal: [],
        heapBeforeLimit: [],
        heapAfterUsed: [],
        heapAfterTotal: [],
        heapAfterLimit: [],
        gcStatsRuns: [],
        cpuHotFunctionRuns: [],
        allocationHotFunctionRuns: [],
    };
}

async function triggerManualGcBetweenRounds(currentRound: number, totalRounds: number): Promise<void> {
    if (typeof global.gc !== 'function') {
        console.warn('[GC] Skipped: global.gc is unavailable. Start Node with --expose-gc to enable manual GC.');
        return;
    }
    const before = process.memoryUsage().heapUsed;
    global.gc();
    await new Promise<void>((resolve) => setImmediate(resolve));
    const after = process.memoryUsage().heapUsed;
    const reclaimedMb = (before - after) / 1024 / 1024;
    console.log(
        `[GC] After round ${currentRound}/${totalRounds}, reclaimed ${reclaimedMb.toFixed(2)} MB ` +
        `(heap: ${(before / 1024 / 1024).toFixed(2)} -> ${(after / 1024 / 1024).toFixed(2)} MB)`
    );
}

interface SceneCountSeries {
    arkFileCounts: number[];
    arkClassCounts: number[];
    arkMethodCounts: number[];
    arkStmtCounts: number[];
}

interface RunSeries {
    totalDurations: number[];
    sceneCounts: SceneCountSeries;
}

function createRunSeries(): RunSeries {
    return {
        totalDurations: [],
        sceneCounts: {
            arkFileCounts: [],
            arkClassCounts: [],
            arkMethodCounts: [],
            arkStmtCounts: [],
        },
    };
}

function normalizeRounds(rounds: number): number {
    return Number.isInteger(rounds) && rounds > 0 ? rounds : 1;
}

function printRunHeader(rounds: number, projectConfig: PerfProjectConfig, runId: string): void {
    console.log('=== ArkAnalyzer Performance Profiling ===');
    console.log(`Perf id : ${projectConfig.project}`);
    console.log(`Project : ${projectConfig.path}`);
    console.log(`Run ID  : ${runId}`);
    console.log(`Rounds  : ${rounds}`);
    console.log('GC Between Rounds : enabled');
    console.log(`Output  : ${RAW_DIR}`);
    if (projectConfig.ccJsonPath) {
        console.log(`CC JSON : ${projectConfig.ccJsonPath}`);
    }
    console.log('');
}

function pushSceneCounts(series: RunSeries, result: ProfilerResult): void {
    series.totalDurations.push(result.totalDurationMs);
    series.sceneCounts.arkFileCounts.push(result.arkFileCount ?? 0);
    series.sceneCounts.arkClassCounts.push(result.arkClassCount ?? 0);
    series.sceneCounts.arkMethodCounts.push(result.arkMethodCount ?? 0);
    series.sceneCounts.arkStmtCounts.push(result.arkStmtCount ?? 0);
}

function appendStageMetrics(accumulator: StageAccumulator, stage: StageMetrics): void {
    accumulator.durations.push(stage.durationMs);
    accumulator.heapGrowths.push(stage.heapGrowthBytes);
    accumulator.heapPeakUsedBytes.push(stage.heapPeakUsedBytes);
    accumulator.rssPeakBytes.push(stage.rssPeakBytes ?? 0);
    accumulator.heapBeforeUsed.push(stage.heapBefore.used);
    accumulator.heapBeforeTotal.push(stage.heapBefore.total);
    accumulator.heapBeforeLimit.push(stage.heapBefore.limit);
    accumulator.heapAfterUsed.push(stage.heapAfter.used);
    accumulator.heapAfterTotal.push(stage.heapAfter.total);
    accumulator.heapAfterLimit.push(stage.heapAfter.limit);
    accumulator.gcStatsRuns.push(stage.gcPauses);
    accumulator.cpuHotFunctionRuns.push(stage.cpuHotFunctions);
    accumulator.allocationHotFunctionRuns.push(stage.allocationHotFunctions);
}

function saveRoundProfilesAndAccumulate(
    result: ProfilerResult,
    runId: string,
    currentRound: number,
    stageAccumulators: StageAccumulator[]
): void {
    console.log('Saving CPU profiles...');
    const roundRunId = `${runId}-round${currentRound}`;
    for (let stageIndex = 0; stageIndex < result.stages.length; stageIndex++) {
        const stage = result.stages[stageIndex];
        const filePath = saveCpuProfile(stage, roundRunId);
        console.log(`  ${stage.stageName}: ${path.basename(filePath)}`);
        appendStageMetrics(stageAccumulators[stageIndex], stage);
    }
}

function enrichAveragedResult(averageResult: ProfilerResult, projectConfig: PerfProjectConfig): void {
    averageResult.project = projectConfig.project;
    averageResult.gitCommit = readGitHeadCommit(ARKANALYZER_REPO_ROOT);
    averageResult.reportTime = new Date().toISOString();
}

function buildAverageResult(
    stageAccumulators: StageAccumulator[],
    totalDurations: number[],
    sceneCounts: SceneCountSeries
): ProfilerResult {
    if (totalDurations.length === 0 || stageAccumulators.length === 0) {
        throw new Error('No profiling results to average.');
    }

    const averagedStages: StageMetrics[] = stageAccumulators.map((accumulator) => {
        const gcPauses = averageGcPauseStats(accumulator.gcStatsRuns);

        return {
            stageName: accumulator.stageName,
            durationMs: average(accumulator.durations),
            cpuProfile: {} as StageMetrics['cpuProfile'],
            heapGrowthBytes: average(accumulator.heapGrowths),
            heapPeakUsedBytes: average(accumulator.heapPeakUsedBytes),
            rssPeakBytes: average(accumulator.rssPeakBytes),
            heapBefore: {
                used: average(accumulator.heapBeforeUsed),
                total: average(accumulator.heapBeforeTotal),
                limit: average(accumulator.heapBeforeLimit),
            },
            heapAfter: {
                used: average(accumulator.heapAfterUsed),
                total: average(accumulator.heapAfterTotal),
                limit: average(accumulator.heapAfterLimit),
            },
            gcPauses,
            cpuHotFunctions: aggregateAverageCpuHotFunctions(accumulator.cpuHotFunctionRuns),
            allocationHotFunctions: aggregateAverageAllocationHotFunctions(accumulator.allocationHotFunctionRuns),
        };
    });

    return {
        stages: averagedStages,
        totalDurationMs: average(totalDurations),
        arkFileCount: Math.round(average(sceneCounts.arkFileCounts)),
        arkClassCount: Math.round(average(sceneCounts.arkClassCounts)),
        arkMethodCount: Math.round(average(sceneCounts.arkMethodCounts)),
        arkStmtCount: Math.round(average(sceneCounts.arkStmtCounts)),
    };
}

/**
 * Execute profiling command.
 */
export async function runPerformanceProfiling(
    rounds: number,
    projectConfig: PerfProjectConfig,
    runId: string = formatTimestamp()
): Promise<string> {
    // Check whether the project path exists.
    if (!fs.existsSync(projectConfig.path)) {
        console.error(`Error: Project path does not exist: ${projectConfig.path}`);
        return '';
    }

    ensureDir(RAW_DIR);

    try {
        const normalizedRounds = normalizeRounds(rounds);
        printRunHeader(normalizedRounds, projectConfig, runId);
        const runSeries = createRunSeries();
        let stageAccumulators: StageAccumulator[] = [];

        for (let i = 0; i < normalizedRounds; i++) {
            const currentRound = i + 1;
            console.log(`--- Round ${currentRound}/${normalizedRounds} ---`);
            const result = await profileArkAnalyzer(projectConfig.path, projectConfig.ccJsonPath, {
                onStageStart: (stageName) => {
                    console.log(`[Round ${currentRound}/${normalizedRounds}] Starting ${stageName}...`);
                },
                onStageEnd: (_stageName, metrics) => {
                    printStageSummary(metrics);
                },
            });

            if (stageAccumulators.length === 0) {
                stageAccumulators = result.stages.map((stage) => createStageAccumulator(stage.stageName));
            }

            pushSceneCounts(runSeries, result);
            saveRoundProfilesAndAccumulate(result, runId, currentRound, stageAccumulators);

            console.log(`[Round ${currentRound}/${normalizedRounds}] Total time: ${result.totalDurationMs.toFixed(2)} ms\n`);

            if (currentRound < normalizedRounds) {
                await triggerManualGcBetweenRounds(currentRound, normalizedRounds);
                console.log('');
            }
        }

        const averageResult = buildAverageResult(stageAccumulators, runSeries.totalDurations, runSeries.sceneCounts);
        enrichAveragedResult(averageResult, projectConfig);

        // Save averaged summary JSON.
        const summaryPath = saveSummary(averageResult, runId);
        console.log(`\nSummary saved: ${path.basename(summaryPath)}`);

        // Print averaged total duration.
        console.log(`\nAverage total time (${normalizedRounds} rounds): ${averageResult.totalDurationMs.toFixed(2)} ms`);
        console.log('Done.');

        return runId;
    } catch (error) {
        console.error('\nProfiling failed:', error);
        return '';
    }
}