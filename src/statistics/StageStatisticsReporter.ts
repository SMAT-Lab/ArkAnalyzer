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

import * as fs from 'fs';
import { MemorySnapshot, StageStatisticsData } from './StageStatistics';

/**
 * A logical section of the statistics report.
 */
export interface ReportSection {
    title: string;
    data: Record<string, string | number>;
}

/**
 * Structured statistics report.
 */
export interface StageStatisticsReport {
    title: string;
    timestamp: string;
    summary: ReportSection;
    stages: ReportSection;
    custom: ReportSection;
}

function formatLocalTimestamp(date: Date = new Date()): string {
    const pad2 = (n: number): string => n.toString().padStart(2, '0');
    const pad3 = (n: number): string => n.toString().padStart(3, '0');
    const y = date.getFullYear();
    const mo = pad2(date.getMonth() + 1);
    const d = pad2(date.getDate());
    const h = pad2(date.getHours());
    const mi = pad2(date.getMinutes());
    const s = pad2(date.getSeconds());
    const ms = pad3(date.getMilliseconds());
    const offsetMin = -date.getTimezoneOffset();
    const sign = offsetMin >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMin);
    const offH = pad2(Math.floor(abs / 60));
    const offM = pad2(abs % 60);
    return `${y}-${mo}-${d}T${h}:${mi}:${s}.${ms}${sign}${offH}:${offM}`;
}

function fmtMB(v: number): string {
    return v.toFixed(2);
}

function fmtMs(v: number): string {
    return `${v} ms`;
}

function memLine(label: string, m: MemorySnapshot): string {
    return `${label}: RSS ${fmtMB(m.rssMB)} MB | Heap ${fmtMB(m.heapUsedMB)} MB`;
}

/**
 * Generates text reports from {@link StageStatisticsData}.
 *
 * Output format is a human-readable, sectioned text block suitable for
 * file output or logger.info.
 */
export class StageStatisticsReporter {
    /**
     * Build a structured report from raw statistics data.
     */
    public static generateReport(data: StageStatisticsData, title: string = 'ArkAnalyzer Stage Statistics Report'): StageStatisticsReport {
        return {
            title,
            timestamp: formatLocalTimestamp(),
            summary: this.generateSummarySection(data),
            stages: this.generateStagesSection(data),
            custom: this.generateCustomSection(data),
        };
    }

    private static generateSummarySection(data: StageStatisticsData): ReportSection {
        const incremental = data.globalMemPeak.rssMB - data.globalMemBefore.rssMB;
        return {
            title: 'Summary',
            data: {
                'Total Time': fmtMs(data.totalDurationMs),
                [memLine('Start', data.globalMemBefore)]: '',
                [memLine('Peak', data.globalMemPeak)]: '',
                [memLine('End', data.globalMemAfter)]: '',
                'Incremental RSS': `${fmtMB(incremental)} MB`,
                'Stage Count': data.stages.length,
            },
        };
    }

    private static generateStagesSection(data: StageStatisticsData): ReportSection {
        const entries: string[] = [];
        for (const stage of data.stages) {
            entries.push(`[${stage.name}]`);
            entries.push(`  Duration: ${fmtMs(stage.durationMs)}`);
            entries.push(`  ${memLine('  Before', stage.memBefore)}`);
            entries.push(`  ${memLine('  Peak', stage.memPeak)}`);
            entries.push(`  ${memLine('  After', stage.memAfter)}`);
        }
        if (entries.length === 0) {
            entries.push('(no stages recorded)');
        }
        const dataMap: Record<string, string | number> = {};
        entries.forEach((line, i) => {
            dataMap[`line${i}`] = line;
        });
        return {
            title: 'Stage Statistics',
            data: dataMap,
        };
    }

    private static generateCustomSection(data: StageStatisticsData): ReportSection {
        const dataMap: Record<string, string | number> = {};
        data.customCounters.forEach((value, key) => {
            dataMap[key] = value.toLocaleString();
        });
        return {
            title: 'Custom Statistics',
            data: dataMap,
        };
    }

    /**
     * Render a report as a text string.
     */
    public static exportToText(report: StageStatisticsReport): string {
        const sep = '='.repeat(40);
        let out = `${sep}\n`;
        out += `${report.title}\n`;
        out += `${sep}\n`;
        out += `Generated Time: ${report.timestamp}\n\n`;
        out += this.formatSection(report.summary);
        out += this.formatStageSection(report.stages);
        if (Object.keys(report.custom.data).length > 0) {
            out += this.formatSection(report.custom);
        }
        out += `${sep}\n`;
        return out;
    }

    private static formatSection(section: ReportSection): string {
        let out = `${section.title}\n`;
        out += '-'.repeat(section.title.length) + '\n';
        for (const [key, value] of Object.entries(section.data)) {
            if (value === '') {
                out += `${key}\n`;
            } else {
                out += `${key}: ${value}\n`;
            }
        }
        out += '\n';
        return out;
    }

    /**
     * Format the stages section: values are pre-formatted multi-line strings
     * stored as numbered keys; render them directly without `key: value`.
     */
    private static formatStageSection(section: ReportSection): string {
        let out = `${section.title}\n`;
        out += '-'.repeat(section.title.length) + '\n';
        for (const value of Object.values(section.data)) {
            out += `${value}\n`;
        }
        out += '\n';
        return out;
    }

    /**
     * Save a text report to a file.
     */
    public static saveReportToFile(report: StageStatisticsReport, filePath: string): void {
        const text = this.exportToText(report);
        const dir = filePath.substring(0, Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\')));
        if (dir) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, text, 'utf-8');
    }

    /**
     * Check whether statistics data contains meaningful values.
     */
    public static isStatisticsValid(data: StageStatisticsData): boolean {
        return data.totalDurationMs > 0 || data.stages.length > 0;
    }

    /**
     * Generate a one-line status message.
     */
    public static generateStatusMessage(data: StageStatisticsData): string {
        if (!this.isStatisticsValid(data)) {
            return 'No valid statistics data collected.';
        }
        return `Analysis completed in ${data.totalDurationMs} ms across ${data.stages.length} stage(s).`;
    }
}
