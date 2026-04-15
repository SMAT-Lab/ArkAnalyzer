/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

import { performance } from 'perf_hooks';
import * as fs from 'fs';
import * as inspector from 'inspector';
import * as path from 'path';
import { Scene, SceneConfig } from '../../src';

type StageDuration = {
    buildConfigMs: number;
    buildSceneMs: number;
    inferTypesMs: number;
    totalMs: number;
};

type FunctionStat = {
    name: string;
    location: string;
    selfTimeMs: number;
    sampleCount: number;
};

const DEFAULT_PROJECT_PATH = 'tests/resources/arkIRTransformer/mainModule';
const OUTPUT_DIR = path.resolve('out', 'profile');
const TOP_N = 20;

function resolveProjectPath(): string {
    const argPath = process.argv[2]?.trim();
    const envPath = process.env.PROJECT_PATH?.trim();
    return argPath || envPath || DEFAULT_PROJECT_PATH;
}

async function postInspector<T = unknown>(session: inspector.Session, method: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        session.post(method, (error: Error | null, result?: T) => {
            if (error) {
                reject(error);
                return;
            }
            resolve((result as T | undefined) ?? ({} as T));
        });
    });
}

function ensureOutputDir(): void {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
}

function formatTimestamp(date: Date): string {
    const pad = (value: number): string => String(value).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    const second = pad(date.getSeconds());
    return `${year}${month}${day}-${hour}${minute}${second}`;
}

function printStageReport(duration: StageDuration, projectPath: string): void {
    console.log('=== ArkAnalyzer Main Flow CPU Profiling ===');
    console.log(`Project: ${projectPath}`);
    console.log(`- buildFromProjectDir: ${duration.buildConfigMs.toFixed(2)} ms`);
    console.log(`- buildSceneFromFiles: ${duration.buildSceneMs.toFixed(2)} ms`);
    console.log(`- inferTypes: ${duration.inferTypesMs.toFixed(2)} ms`);
    console.log(`- total: ${duration.totalMs.toFixed(2)} ms`);
}

function summarizeHotFunctions(profile: inspector.Profiler.Profile, topN: number): FunctionStat[] {
    const samples = profile.samples ?? [];
    const timeDeltas = profile.timeDeltas ?? [];
    const nodeMap = new Map<number, inspector.Profiler.ProfileNode>();

    for (const node of profile.nodes) {
        nodeMap.set(node.id, node);
    }

    const selfTimeByNode = new Map<number, number>();
    const sampleCountByNode = new Map<number, number>();
    for (let i = 0; i < samples.length; i++) {
        const nodeId = samples[i];
        const deltaUs = timeDeltas[i] ?? 0;
        selfTimeByNode.set(nodeId, (selfTimeByNode.get(nodeId) ?? 0) + deltaUs / 1000);
        sampleCountByNode.set(nodeId, (sampleCountByNode.get(nodeId) ?? 0) + 1);
    }

    const aggregated = new Map<string, FunctionStat>();
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

    return Array.from(aggregated.values()).sort((a, b) => b.selfTimeMs - a.selfTimeMs).slice(0, topN);
}

function printHotFunctionReport(hotFunctions: FunctionStat[]): void {
    if (hotFunctions.length === 0) {
        console.log('No CPU samples captured.');
        return;
    }
    console.log(`\nTop ${hotFunctions.length} hot functions (self time):`);
    console.log('Function'.padEnd(44) + 'Location'.padEnd(28) + 'Samples'.padStart(10) + 'Self Time'.padStart(14));
    console.log('-'.repeat(96));
    for (const item of hotFunctions) {
        const fn = item.name.length > 42 ? `${item.name.slice(0, 39)}...` : item.name;
        console.log(
            fn.padEnd(44) +
            item.location.padEnd(28) +
            String(item.sampleCount).padStart(10) +
            `${item.selfTimeMs.toFixed(2)} ms`.padStart(14),
        );
    }
}

async function runArkAnalyzerMainFlowCpuProfiling(): Promise<void> {
    ensureOutputDir();
    const projectPath = resolveProjectPath();
    const profileOutput = path.join(OUTPUT_DIR, `ArkAnalyzerMainFlow-${formatTimestamp(new Date())}.cpuprofile`);

    const sceneConfig = new SceneConfig();
    const scene = new Scene();
    const duration: StageDuration = {
        buildConfigMs: 0,
        buildSceneMs: 0,
        inferTypesMs: 0,
        totalMs: 0,
    };

    const session = new inspector.Session();
    session.connect();

    try {
        await postInspector(session, 'Profiler.enable');
        await postInspector(session, 'Profiler.start');

        const flowStart = performance.now();

        const stage1Start = performance.now();
        sceneConfig.buildFromProjectDir(projectPath);
        duration.buildConfigMs = performance.now() - stage1Start;

        const stage2Start = performance.now();
        scene.buildSceneFromFiles(sceneConfig);
        duration.buildSceneMs = performance.now() - stage2Start;

        const stage3Start = performance.now();
        scene.inferTypes();
        duration.inferTypesMs = performance.now() - stage3Start;

        duration.totalMs = performance.now() - flowStart;

        const stopResult = await postInspector<{ profile: inspector.Profiler.Profile }>(session, 'Profiler.stop');
        fs.writeFileSync(profileOutput, JSON.stringify(stopResult.profile));

        printStageReport(duration, projectPath);
        console.log(`CPU profile saved to: ${profileOutput}`);
        printHotFunctionReport(summarizeHotFunctions(stopResult.profile, TOP_N));
    } finally {
        await postInspector(session, 'Profiler.disable');
        session.disconnect();
    }
}

runArkAnalyzerMainFlowCpuProfiling().catch((error: unknown) => {
    console.error('CPU profiling failed:', error);
    process.exitCode = 1;
});

export { runArkAnalyzerMainFlowCpuProfiling };
