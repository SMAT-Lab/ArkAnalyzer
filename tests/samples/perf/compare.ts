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

import * as fs from 'fs';
import * as path from 'path';
import { StageMetrics, ProfilerResult } from './profiler';
import { RAW_DIR, REPORTS_DIR } from './utils';


// Diff statistics structure
interface StageDiff {
    stageName: string;
    durationDelta: number; // Delta in milliseconds
    durationDeltaPercent: number;
    heapGrowthDelta: number; // Delta in bytes
    heapGrowthDeltaPercent: number;
    heapPeakDelta: number; // Delta in bytes
    heapPeakDeltaPercent: number;
    rssPeakDelta: number; // Delta in bytes
    rssPeakDeltaPercent: number;
    baselineHeapAfterUsedBytes: number;
    currentHeapAfterUsedBytes: number;
    heapAfterUsedDelta: number;
    heapAfterUsedDeltaPercent: number;
    baselineRssAfterBytes: number;
    currentRssAfterBytes: number;
    rssAfterDelta: number;
    rssAfterDeltaPercent: number;
    gcTimeDelta: number; // Delta in milliseconds
    gcTimeDeltaPercent: number;
    gcCountDelta: number;
}

interface ComparisonResult {
    baselineId: string;
    currentId: string;
    baselineTotalMs: number;
    currentTotalMs: number;
    baselineTotalHeapGrowthBytes: number;
    currentTotalHeapGrowthBytes: number;
    baselineMaxHeapPeakBytes: number;
    currentMaxHeapPeakBytes: number;
    baselineMaxRssPeakBytes: number;
    currentMaxRssPeakBytes: number;
    baselineResidentHeapUsedBytes: number;
    currentResidentHeapUsedBytes: number;
    baselineResidentRssBytes: number;
    currentResidentRssBytes: number;
    baselineTotalGcTimeMs: number;
    currentTotalGcTimeMs: number;
    baselineTotalGcCount: number;
    currentTotalGcCount: number;
    totalDurationDelta: number;
    totalDurationDeltaPercent: number;
    totalHeapGrowthDelta: number;
    totalHeapGrowthDeltaPercent: number;
    maxHeapPeakDelta: number;
    maxHeapPeakDeltaPercent: number;
    maxRssPeakDelta: number;
    maxRssPeakDeltaPercent: number;
    residentHeapUsedDelta: number;
    residentHeapUsedDeltaPercent: number;
    residentRssDelta: number;
    residentRssDeltaPercent: number;
    totalGcTimeDelta: number;
    totalGcTimeDeltaPercent: number;
    totalGcCountDelta: number;
    totalGcCountDeltaPercent: number;
    stages: StageDiff[];
}

/**
 * Ensure the reports directory exists.
 */
function ensureReportsDir(): void {
    if (!fs.existsSync(REPORTS_DIR)) {
        fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }
}

/**
 * Calculate total GC time for a single stage.
 */
function getGcTotalTime(stage: StageMetrics): number {
    return stage.gcPauses.totalDurationMs;
}

function getHeapPeakUsed(stage: StageMetrics): number {
    return stage.heapPeakUsedBytes ?? Math.max(stage.heapBefore.used, stage.heapAfter.used);
}

function getRssAfter(stage: StageMetrics): number {
    return stage.rssAfterBytes ?? 0;
}

/**
 * Calculate percent change with zero handling.
 */
function calcPercentChange(baseline: number, current: number): number {
    if (baseline === 0) {
        return current === 0 ? 0 : 100;
    }
    return ((current - baseline) / baseline) * 100;
}

interface RunAggregates {
    totalHeapGrowthBytes: number;
    maxHeapPeakBytes: number;
    maxRssPeakBytes: number;
    residentHeapUsedBytes: number;
    residentRssBytes: number;
    totalGcTimeMs: number;
    totalGcCount: number;
}

function computeRunAggregates(stages: StageMetrics[]): RunAggregates {
    const finalStage = stages[stages.length - 1];
    return {
        totalHeapGrowthBytes: stages.reduce((sum, stage) => sum + stage.heapGrowthBytes, 0),
        maxHeapPeakBytes: stages.reduce((max, stage) => Math.max(max, getHeapPeakUsed(stage)), 0),
        maxRssPeakBytes: stages.reduce((max, stage) => Math.max(max, stage.rssPeakBytes ?? 0), 0),
        residentHeapUsedBytes: finalStage?.heapAfter.used ?? 0,
        residentRssBytes: finalStage ? getRssAfter(finalStage) : 0,
        totalGcTimeMs: stages.reduce((sum, stage) => sum + getGcTotalTime(stage), 0),
        totalGcCount: stages.reduce((sum, stage) => sum + stage.gcPauses.count, 0),
    };
}

function buildStageDiffs(
    baselineStages: Map<string, StageMetrics>,
    currentStages: Map<string, StageMetrics>
): StageDiff[] {
    const stagesDiff: StageDiff[] = [];

    for (const stageName of baselineStages.keys()) {
        const base = baselineStages.get(stageName)!;
        const curr = currentStages.get(stageName);

        if (!curr) {
            console.warn(`Warning: Stage '${stageName}' not found in current result.`);
            continue;
        }

        const baseGcTime = getGcTotalTime(base);
        const currGcTime = getGcTotalTime(curr);
        const basePeak = getHeapPeakUsed(base);
        const currPeak = getHeapPeakUsed(curr);
        const baseRssPeak = base.rssPeakBytes ?? 0;
        const currRssPeak = curr.rssPeakBytes ?? 0;
        const baseHeapAfterUsed = base.heapAfter.used;
        const currHeapAfterUsed = curr.heapAfter.used;
        const baseRssAfter = getRssAfter(base);
        const currRssAfter = getRssAfter(curr);

        stagesDiff.push({
            stageName,
            durationDelta: curr.durationMs - base.durationMs,
            durationDeltaPercent: calcPercentChange(base.durationMs, curr.durationMs),
            heapGrowthDelta: curr.heapGrowthBytes - base.heapGrowthBytes,
            heapGrowthDeltaPercent: calcPercentChange(base.heapGrowthBytes, curr.heapGrowthBytes),
            heapPeakDelta: currPeak - basePeak,
            heapPeakDeltaPercent: calcPercentChange(basePeak, currPeak),
            rssPeakDelta: currRssPeak - baseRssPeak,
            rssPeakDeltaPercent: calcPercentChange(baseRssPeak, currRssPeak),
            baselineHeapAfterUsedBytes: baseHeapAfterUsed,
            currentHeapAfterUsedBytes: currHeapAfterUsed,
            heapAfterUsedDelta: currHeapAfterUsed - baseHeapAfterUsed,
            heapAfterUsedDeltaPercent: calcPercentChange(baseHeapAfterUsed, currHeapAfterUsed),
            baselineRssAfterBytes: baseRssAfter,
            currentRssAfterBytes: currRssAfter,
            rssAfterDelta: currRssAfter - baseRssAfter,
            rssAfterDeltaPercent: calcPercentChange(baseRssAfter, currRssAfter),
            gcTimeDelta: currGcTime - baseGcTime,
            gcTimeDeltaPercent: calcPercentChange(baseGcTime, currGcTime),
            gcCountDelta: curr.gcPauses.count - base.gcPauses.count,
        });
    }

    return stagesDiff;
}

function buildComparisonResult(
    baseline: ProfilerResult,
    current: ProfilerResult,
    stagesDiff: StageDiff[],
    baseAgg: RunAggregates,
    currAgg: RunAggregates
): ComparisonResult {
    return {
        baselineId: 'baseline',
        currentId: 'current',
        baselineTotalMs: baseline.totalDurationMs,
        currentTotalMs: current.totalDurationMs,
        baselineTotalHeapGrowthBytes: baseAgg.totalHeapGrowthBytes,
        currentTotalHeapGrowthBytes: currAgg.totalHeapGrowthBytes,
        baselineMaxHeapPeakBytes: baseAgg.maxHeapPeakBytes,
        currentMaxHeapPeakBytes: currAgg.maxHeapPeakBytes,
        baselineMaxRssPeakBytes: baseAgg.maxRssPeakBytes,
        currentMaxRssPeakBytes: currAgg.maxRssPeakBytes,
        baselineResidentHeapUsedBytes: baseAgg.residentHeapUsedBytes,
        currentResidentHeapUsedBytes: currAgg.residentHeapUsedBytes,
        baselineResidentRssBytes: baseAgg.residentRssBytes,
        currentResidentRssBytes: currAgg.residentRssBytes,
        baselineTotalGcTimeMs: baseAgg.totalGcTimeMs,
        currentTotalGcTimeMs: currAgg.totalGcTimeMs,
        baselineTotalGcCount: baseAgg.totalGcCount,
        currentTotalGcCount: currAgg.totalGcCount,
        totalDurationDelta: current.totalDurationMs - baseline.totalDurationMs,
        totalDurationDeltaPercent: calcPercentChange(baseline.totalDurationMs, current.totalDurationMs),
        totalHeapGrowthDelta: currAgg.totalHeapGrowthBytes - baseAgg.totalHeapGrowthBytes,
        totalHeapGrowthDeltaPercent: calcPercentChange(baseAgg.totalHeapGrowthBytes, currAgg.totalHeapGrowthBytes),
        maxHeapPeakDelta: currAgg.maxHeapPeakBytes - baseAgg.maxHeapPeakBytes,
        maxHeapPeakDeltaPercent: calcPercentChange(baseAgg.maxHeapPeakBytes, currAgg.maxHeapPeakBytes),
        maxRssPeakDelta: currAgg.maxRssPeakBytes - baseAgg.maxRssPeakBytes,
        maxRssPeakDeltaPercent: calcPercentChange(baseAgg.maxRssPeakBytes, currAgg.maxRssPeakBytes),
        residentHeapUsedDelta: currAgg.residentHeapUsedBytes - baseAgg.residentHeapUsedBytes,
        residentHeapUsedDeltaPercent: calcPercentChange(
            baseAgg.residentHeapUsedBytes,
            currAgg.residentHeapUsedBytes
        ),
        residentRssDelta: currAgg.residentRssBytes - baseAgg.residentRssBytes,
        residentRssDeltaPercent: calcPercentChange(baseAgg.residentRssBytes, currAgg.residentRssBytes),
        totalGcTimeDelta: currAgg.totalGcTimeMs - baseAgg.totalGcTimeMs,
        totalGcTimeDeltaPercent: calcPercentChange(baseAgg.totalGcTimeMs, currAgg.totalGcTimeMs),
        totalGcCountDelta: currAgg.totalGcCount - baseAgg.totalGcCount,
        totalGcCountDeltaPercent: calcPercentChange(baseAgg.totalGcCount, currAgg.totalGcCount),
        stages: stagesDiff,
    };
}

/**
 * Compare two profiler results and generate diffs.
 */
function compareResults(baseline: ProfilerResult, current: ProfilerResult): ComparisonResult {
    const baselineStages = new Map(baseline.stages.map(s => [s.stageName, s]));
    const currentStages = new Map(current.stages.map(s => [s.stageName, s]));
    const stagesDiff = buildStageDiffs(baselineStages, currentStages);
    const baseAgg = computeRunAggregates(baseline.stages);
    const currAgg = computeRunAggregates(current.stages);
    return buildComparisonResult(baseline, current, stagesDiff, baseAgg, currAgg);
}

/**
 * Format a signed numeric value.
 */
function formatSigned(value: number, unit: string = '', showSign: boolean = true): string {
    const sign = showSign ? (value >= 0 ? '+' : '') : '';
    return `${sign}${value.toFixed(2)}${unit}`;
}

/**
 * Format percentage value.
 */
function formatPercent(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
}

function formatDeltaWithPercent(delta: number, unit: string, percent: number): string {
    return `${formatSigned(delta, unit)} (${formatPercent(percent)})`;
}

function formatMbDeltaWithPercent(deltaBytes: number, percent: number): string {
    return formatDeltaWithPercent(deltaBytes / 1024 / 1024, 'MB', percent);
}

function formatSignedIntDelta(delta: number): string {
    return delta >= 0 ? `+${delta}` : `${delta}`;
}

function formatStageDiffCells(stage: StageDiff): {
    duration: string;
    heap: string;
    peak: string;
    rssPeak: string;
    gcTime: string;
    gcCount: string;
} {
    return {
        duration: formatDeltaWithPercent(stage.durationDelta, 'ms', stage.durationDeltaPercent),
        heap: formatMbDeltaWithPercent(stage.heapGrowthDelta, stage.heapGrowthDeltaPercent),
        peak: formatMbDeltaWithPercent(stage.heapPeakDelta, stage.heapPeakDeltaPercent),
        rssPeak: formatMbDeltaWithPercent(stage.rssPeakDelta, stage.rssPeakDeltaPercent),
        gcTime: formatDeltaWithPercent(stage.gcTimeDelta, 'ms', stage.gcTimeDeltaPercent),
        gcCount: formatSignedIntDelta(stage.gcCountDelta),
    };
}

function formatTotalsDiffCells(result: ComparisonResult): {
    duration: string;
    heap: string;
    peak: string;
    rssPeak: string;
    gcTime: string;
    gcCount: string;
} {
    return {
        duration: formatDeltaWithPercent(result.totalDurationDelta, 'ms', result.totalDurationDeltaPercent),
        heap: formatMbDeltaWithPercent(result.totalHeapGrowthDelta, result.totalHeapGrowthDeltaPercent),
        peak: formatMbDeltaWithPercent(result.maxHeapPeakDelta, result.maxHeapPeakDeltaPercent),
        rssPeak: formatMbDeltaWithPercent(result.maxRssPeakDelta, result.maxRssPeakDeltaPercent),
        gcTime: formatDeltaWithPercent(result.totalGcTimeDelta, 'ms', result.totalGcTimeDeltaPercent),
        gcCount: formatSignedIntDelta(result.totalGcCountDelta),
    };
}

const COMPARISON_TABLE_WIDTH = 116;

function logComparisonTableRow(
    label: string,
    duration: string,
    heap: string,
    peak: string,
    rssPeak: string,
    gcTime: string,
    gcCount: string
): void {
    console.log(
        label.padEnd(16) +
        duration.padEnd(20) +
        heap.padEnd(16) +
        peak.padEnd(16) +
        rssPeak.padEnd(16) +
        gcTime.padEnd(20) +
        gcCount.padStart(12)
    );
}

/**
 * Print a table-style comparison report to console.
 */
function printComparisonReport(result: ComparisonResult, baselineId: string, currentId: string): void {
    console.log('\n=== Performance Comparison ===');
    console.log(`Baseline : ${baselineId}`);
    console.log(`Current  : ${currentId}`);
    console.log('');

    logComparisonTableRow(
        'Stage',
        'Duration Δ',
        'Heap Growth Δ',
        'Heap Peak Δ',
        'RSS Peak Δ',
        'GC Time Δ',
        'GC Count Δ'
    );
    console.log('-'.repeat(COMPARISON_TABLE_WIDTH));

    for (const stage of result.stages) {
        const c = formatStageDiffCells(stage);
        logComparisonTableRow(stage.stageName, c.duration, c.heap, c.peak, c.rssPeak, c.gcTime, c.gcCount);
    }

    console.log('-'.repeat(COMPARISON_TABLE_WIDTH));
    const t = formatTotalsDiffCells(result);
    logComparisonTableRow('TOTAL', t.duration, t.heap, t.peak, t.rssPeak, t.gcTime, t.gcCount);
    console.log('');
}

function appendMarkdownOverallSection(lines: string[], result: ComparisonResult): void {
    lines.push('## Overall');
    lines.push('');
    lines.push(`| Metric | Baseline | Current | Delta | % |`);
    lines.push(`|--------|----------|---------|-------|---|`);
    lines.push(
        `| Total Duration | ${result.baselineTotalMs.toFixed(2)} ms | ${result.currentTotalMs.toFixed(2)} ms | ` +
        `${formatSigned(result.totalDurationDelta, 'ms')} | ${formatPercent(result.totalDurationDeltaPercent)} |`
    );
    lines.push(
        `| Total Heap Growth | ${(result.baselineTotalHeapGrowthBytes / 1024 / 1024).toFixed(2)} MB | ` +
        `${(result.currentTotalHeapGrowthBytes / 1024 / 1024).toFixed(2)} MB | ` +
        `${formatSigned(result.totalHeapGrowthDelta / 1024 / 1024, 'MB')} | ` +
        `${formatPercent(result.totalHeapGrowthDeltaPercent)} |`
    );
    lines.push(
        `| Max Heap Peak | ${(result.baselineMaxHeapPeakBytes / 1024 / 1024).toFixed(2)} MB | ` +
        `${(result.currentMaxHeapPeakBytes / 1024 / 1024).toFixed(2)} MB | ` +
        `${formatSigned(result.maxHeapPeakDelta / 1024 / 1024, 'MB')} | ` +
        `${formatPercent(result.maxHeapPeakDeltaPercent)} |`
    );
    lines.push(
        `| Max RSS Peak | ${(result.baselineMaxRssPeakBytes / 1024 / 1024).toFixed(2)} MB | ` +
        `${(result.currentMaxRssPeakBytes / 1024 / 1024).toFixed(2)} MB | ` +
        `${formatSigned(result.maxRssPeakDelta / 1024 / 1024, 'MB')} | ` +
        `${formatPercent(result.maxRssPeakDeltaPercent)} |`
    );
    lines.push(
        `| Resident Heap Used | ${(result.baselineResidentHeapUsedBytes / 1024 / 1024).toFixed(2)} MB | ` +
        `${(result.currentResidentHeapUsedBytes / 1024 / 1024).toFixed(2)} MB | ` +
        `${formatSigned(result.residentHeapUsedDelta / 1024 / 1024, 'MB')} | ` +
        `${formatPercent(result.residentHeapUsedDeltaPercent)} |`
    );
    lines.push(
        `| Resident RSS | ${(result.baselineResidentRssBytes / 1024 / 1024).toFixed(2)} MB | ` +
        `${(result.currentResidentRssBytes / 1024 / 1024).toFixed(2)} MB | ` +
        `${formatSigned(result.residentRssDelta / 1024 / 1024, 'MB')} | ` +
        `${formatPercent(result.residentRssDeltaPercent)} |`
    );
    lines.push(
        `| Total GC Time | ${result.baselineTotalGcTimeMs.toFixed(2)} ms | ${result.currentTotalGcTimeMs.toFixed(2)} ms | ` +
        `${formatSigned(result.totalGcTimeDelta, 'ms')} | ${formatPercent(result.totalGcTimeDeltaPercent)} |`
    );
    const gcCountDelta = formatSignedIntDelta(result.totalGcCountDelta);
    lines.push(
        `| Total GC Count | ${result.baselineTotalGcCount} | ${result.currentTotalGcCount} | ${gcCountDelta} | ` +
        `${formatPercent(result.totalGcCountDeltaPercent)} |`
    );
    lines.push('');
}

function appendMarkdownStageSection(lines: string[], result: ComparisonResult): void {
    lines.push('## Stage Details');
    lines.push('');
    lines.push('| Stage | Duration Δ | Heap Growth Δ | Heap Peak Δ | RSS Peak Δ | GC Time Δ | GC Count Δ |');
    lines.push('|-------|------------|---------------|-------------|------------|-----------|------------|');

    for (const stage of result.stages) {
        const c = formatStageDiffCells(stage);
        lines.push(`| ${stage.stageName} | ${c.duration} | ${c.heap} | ${c.peak} | ${c.rssPeak} | ${c.gcTime} | ${c.gcCount} |`);
    }
}

function appendMarkdownStageEndMemorySection(lines: string[], result: ComparisonResult): void {
    lines.push('');
    lines.push('## Stage End Memory');
    lines.push('');
    lines.push('| Metric | Baseline | Current | Delta | % |');
    lines.push('|--------|----------|---------|-------|---|');

    for (const stage of result.stages) {
        lines.push(
            `| ${stage.stageName} Heap Used End | ` +
            `${(stage.baselineHeapAfterUsedBytes / 1024 / 1024).toFixed(2)} MB | ` +
            `${(stage.currentHeapAfterUsedBytes / 1024 / 1024).toFixed(2)} MB | ` +
            `${formatSigned(stage.heapAfterUsedDelta / 1024 / 1024, 'MB')} | ` +
            `${formatPercent(stage.heapAfterUsedDeltaPercent)} |`
        );
        lines.push(
            `| ${stage.stageName} RSS End | ` +
            `${(stage.baselineRssAfterBytes / 1024 / 1024).toFixed(2)} MB | ` +
            `${(stage.currentRssAfterBytes / 1024 / 1024).toFixed(2)} MB | ` +
            `${formatSigned(stage.rssAfterDelta / 1024 / 1024, 'MB')} | ` +
            `${formatPercent(stage.rssAfterDeltaPercent)} |`
        );
    }
}

/**
 * Generate a Markdown report and write to file.
 */
function writeMarkdownReport(result: ComparisonResult, baselineId: string, currentId: string, outputPath: string): void {
    const lines: string[] = [];

    lines.push('# Performance Comparison Report');
    lines.push('');
    lines.push(`- **Baseline**: \`${baselineId}\`  `);
    lines.push(`- **Current**: \`${currentId}\`  `);
    lines.push(`- **Generated**: ${new Date().toISOString()}`);
    lines.push('');

    appendMarkdownOverallSection(lines, result);
    appendMarkdownStageSection(lines, result);
    appendMarkdownStageEndMemorySection(lines, result);

    fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
}

function resolveMarkdownOutputPath(outputFile: string | undefined, baselineId: string, currentId: string): string {
    if (outputFile) {
        return path.isAbsolute(outputFile) ? outputFile : path.join(REPORTS_DIR, outputFile);
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultFileName = `diff-${baselineId}-vs-${currentId}-${timestamp}.md`;
    return path.join(REPORTS_DIR, defaultFileName);
}

/**
 * Load a summary.json file by run ID.
 */
function loadSummary(summaryPath: string): ProfilerResult {
    if (!fs.existsSync(summaryPath)) {
        console.error(`Error: Summary file not found: ${summaryPath}`);
        process.exit(1);
    }
    const content = fs.readFileSync(summaryPath, 'utf-8');
    return JSON.parse(content) as ProfilerResult;
}

/**
 * Execute comparison command.
 */
export async function compare(baselinePath: string, currentId: string, outputFile?: string): Promise<void> {

    try {
        const baselineId = path.parse(baselinePath).name;
        console.log(`Loading baseline: ${baselineId}`);
        const baseline = loadSummary(baselinePath);

        console.log(`Loading current: ${currentId}`);
        const filePath = path.join(RAW_DIR, `${currentId}-summary.json`);
        const current = loadSummary(filePath);

        const result = compareResults(baseline, current);

        // Update run ID information.
        result.baselineId = baselineId;
        result.currentId = currentId;

        // Print console report.
        printComparisonReport(result, baselineId, currentId);

        ensureReportsDir();
        const outputPath = resolveMarkdownOutputPath(outputFile, baselineId, currentId);
        writeMarkdownReport(result, baselineId, currentId, outputPath);
        console.log(`Report saved to: ${outputPath}`);

    } catch (error) {
        console.error('\nComparison failed:', error);
        process.exit(1);
    }
}
