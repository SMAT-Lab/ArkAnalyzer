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
import path from 'path';
import { SceneConfig } from '../../src';
import { Scene } from '../../src';
import { getCxxSourceFileExtensions } from '../../src';
import { Logger, LOG_LEVEL, LOG_MODULE_TYPE } from '../../src';
import { Sdk } from '../../src/Config'
import * as perf_hooks from 'perf_hooks';
import {
    getCompileCommandsPathForCppProjectRoot,
    isProjectRootPreparedCppTree,
} from './cpp/CppBenchmark';

const logger = Logger.getLogger(LOG_MODULE_TYPE.TOOL, 'PerfTest');
Logger.configure('', LOG_LEVEL.ERROR, LOG_LEVEL.INFO, false);
let PROJECT_ROOT: string | undefined;
let PROJECT_NAME: string | undefined;
let Sdks: Sdk[] = [];
const performance = perf_hooks.performance;

/**
 * Same five marks for Harmony and Cpp so timing uses one capture/measures layout.
 * Cleared after each pipeline capture so the next run can reuse the names.
 */
const PERF_PIPELINE_MARK = {
    START: 'perfPipelineStart',
    AFTER_BASIC_INFO: 'buildBasicInfo',
    AFTER_BUILD_SCENE: 'buildScene4Project',
    AFTER_INFER_TYPES: 'inferTypes',
    END: 'perfPipelineEnd',
} as const;

type PipelinePhaseSeconds = {
    pipelineSeconds: number;
    startToBasicInfoSeconds: number;
    basicInfoToSceneSeconds: number;
    sceneToInferTypesSeconds: number;
    inferTypesToEndSeconds: number;
};

function emptyPipelinePhaseSeconds(): PipelinePhaseSeconds {
    return {
        pipelineSeconds: 0,
        startToBasicInfoSeconds: 0,
        basicInfoToSceneSeconds: 0,
        sceneToInferTypesSeconds: 0,
        inferTypesToEndSeconds: 0,
    };
}

let lastHarmonyPhaseSeconds: PipelinePhaseSeconds;
let lastCppPhaseSeconds: PipelinePhaseSeconds = emptyPipelinePhaseSeconds();
/** Set only after Harmony pipeline finishes all phases (marks + capture). */
let harmonyPerfFinished = false;
/** Set only after C++ / OpenCV pipeline finishes all phases (including RSS sample path). */
let cppPerfFinished = false;

function capturePipelinePhases(measureNamePrefix: string): PipelinePhaseSeconds {
    const m = (suffix: string): string => `${measureNamePrefix}-${suffix}`;
    const out: PipelinePhaseSeconds = {
        pipelineSeconds: measureSeconds(m('total'), PERF_PIPELINE_MARK.START, PERF_PIPELINE_MARK.END),
        startToBasicInfoSeconds: measureSeconds(m('s0'), PERF_PIPELINE_MARK.START, PERF_PIPELINE_MARK.AFTER_BASIC_INFO),
        basicInfoToSceneSeconds: measureSeconds(m('s1'), PERF_PIPELINE_MARK.AFTER_BASIC_INFO, PERF_PIPELINE_MARK.AFTER_BUILD_SCENE),
        sceneToInferTypesSeconds: measureSeconds(m('s2'), PERF_PIPELINE_MARK.AFTER_BUILD_SCENE, PERF_PIPELINE_MARK.AFTER_INFER_TYPES),
        inferTypesToEndSeconds: measureSeconds(m('s3'), PERF_PIPELINE_MARK.AFTER_INFER_TYPES, PERF_PIPELINE_MARK.END),
    };
    for (const name of Object.values(PERF_PIPELINE_MARK)) {
        performance.clearMarks(name);
    }
    return out;
}

function testAppProject(): void {
    if (!PROJECT_NAME || !PROJECT_ROOT) {
        throw new Error('PROJECT_ROOT / PROJECT_NAME must be set before Harmony perf run.');
    }
    const resolvedRoot = path.resolve(PROJECT_ROOT);
    if (isProjectRootPreparedCppTree(resolvedRoot)) {
        logger.info('[PerfTest] PROJECT_ROOT basename ends with _cpp; skipping Harmony perf.');
        return;
    }
    performance.mark(PERF_PIPELINE_MARK.START);
    let config: SceneConfig = new SceneConfig();
    config.buildConfig(PROJECT_NAME, PROJECT_ROOT, Sdks);
    let scene: Scene = new Scene();
    scene.buildBasicInfo(config);
    performance.mark(PERF_PIPELINE_MARK.AFTER_BASIC_INFO);
    scene.buildScene4HarmonyProject();
    performance.mark(PERF_PIPELINE_MARK.AFTER_BUILD_SCENE);
    scene.inferTypes();
    performance.mark(PERF_PIPELINE_MARK.AFTER_INFER_TYPES);
    performance.mark(PERF_PIPELINE_MARK.END);
    lastHarmonyPhaseSeconds = capturePipelinePhases('harmony');
    harmonyPerfFinished = true;
}

/**
 * C++: compile_commands.json + Scene from ccdb.
 * Runs only when {@code PROJECT_ROOT}’s basename ends with {@code _cpp}; otherwise skips all C++ perf (no clone/ccdb/toolchain).
 * Not Harmony: no buildConfig / buildScene4HarmonyProject.
 */
function testCppProject(): void {
    if (!PROJECT_ROOT) {
        throw new Error('PROJECT_ROOT must be set before C++ perf run.');
    }
    const resolvedRoot = path.resolve(PROJECT_ROOT);
    if (!isProjectRootPreparedCppTree(resolvedRoot)) {
        logger.info('[PerfTest] PROJECT_ROOT basename does not end with _cpp; skipping C++ perf.');
        return;
    }
    const cppRoot = resolvedRoot;
    const ccdbPath = getCompileCommandsPathForCppProjectRoot(cppRoot);

    performance.mark(PERF_PIPELINE_MARK.START);
    const config = new SceneConfig({ supportFileExts: [...getCxxSourceFileExtensions()] });
    config.setCcjsonPath(ccdbPath);
    config.buildFromProjectDir(cppRoot);
    performance.mark(PERF_PIPELINE_MARK.AFTER_BASIC_INFO);

    const scene = new Scene();
    scene.buildSceneFromFiles(config);
    performance.mark(PERF_PIPELINE_MARK.AFTER_BUILD_SCENE);
    scene.inferTypes();
    performance.mark(PERF_PIPELINE_MARK.AFTER_INFER_TYPES);
    performance.mark(PERF_PIPELINE_MARK.END);
    lastCppPhaseSeconds = capturePipelinePhases('cpp');
    cppPerfFinished = true;
}

/** Harmony then Cpp scene perf; C++ runs only when {@code PROJECT_ROOT} basename ends with {@code _cpp}. */
function runPerfTest(): void {
    harmonyPerfFinished = false;
    cppPerfFinished = false;
    testAppProject();
    testCppProject();
}

const RSS_SAMPLE_COUNT = 7;
const RSS_SAMPLE_INTERVAL_MS = 50;

function collectRssSamples(): number[] {
    const samples: number[] = [];
    for (let i = 0; i < RSS_SAMPLE_COUNT; i++) {
        samples.push(process.memoryUsage().rss);
        if (i < RSS_SAMPLE_COUNT - 1) {
            const deadline = Date.now() + RSS_SAMPLE_INTERVAL_MS;
            while (Date.now() < deadline) { /* spin wait */ }
        }
    }
    return samples;
}

function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** One segment in seconds (creates a named measure; name must be unique per run). */
function measureSeconds(measureName: string, startMark: string, endMark: string): number {
    performance.measure(measureName, startMark, endMark);
    return performance.getEntriesByName(measureName)[0].duration / 1000;
}

/** Same five milestones as Harmony log line: start → buildBasicInfo → buildScene4HarmonyProject → inferTypes → end (four gaps s0–s3). */
function formatUnifiedPhaseDetail(s0: number, s1: number, s2: number, s3: number): string {
    return `start <-${s0.toFixed(3)}s -> buildBasicInfo <-${s1.toFixed(3)}s -> buildScene4Project <-${s2.toFixed(3)}s -> inferTypes <-${s3.toFixed(3)}s -> end`;
}

function printCPUPerfBlock(prefix: string, totalSeconds: number, detailText: string): void {
    logger.info(`${prefix}Take total time: `, totalSeconds.toFixed(3), 's');
    logger.info(`${prefix}Detail: ` + detailText);
}

function printMemPerfInfo(prefix = '') {
    const g = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : undefined);
    if (g && typeof (g as { gc?: () => void }).gc === 'function') {
        (g as { gc: () => void }).gc();
    }
    const samples = collectRssSamples();
    const rssMedian = median(samples);
    const rssMb = rssMedian / 1024 / 1024;
    logger.info(`${prefix}RSS Memory Size: ${Math.round(rssMb * 100) / 100} MB.`);
}

function printCPUPerfInfo(): void {
    if (harmonyPerfFinished) {
        const h = lastHarmonyPhaseSeconds;
        printCPUPerfBlock(
            '[Harmony] ',
            h.pipelineSeconds,
            formatUnifiedPhaseDetail(
                h.startToBasicInfoSeconds,
                h.basicInfoToSceneSeconds,
                h.sceneToInferTypesSeconds,
                h.inferTypesToEndSeconds,
            ),
        );
        printMemPerfInfo('[Harmony] ');
    }
    if (cppPerfFinished) {
        const o = lastCppPhaseSeconds;
        printCPUPerfBlock(
            '[Cpp] ',
            o.pipelineSeconds,
            formatUnifiedPhaseDetail(
                o.startToBasicInfoSeconds,
                o.basicInfoToSceneSeconds,
                o.sceneToInferTypesSeconds,
                o.inferTypesToEndSeconds,
            ),
        );
        printMemPerfInfo('[Cpp] ');
    }
}

function basicSetup() {
    PROJECT_ROOT = process.env.PROJECT_ROOT;
    if (!PROJECT_ROOT) {
        logger.error('Project root path not specified.');
        process.exit(1);
    }
    PROJECT_NAME = path.basename(PROJECT_ROOT);
    if (process.env.OHOS_SDK_PATH !== undefined) {
        Sdks.push({
            name: 'ohos',
            path: process.env.OHOS_SDK_PATH,
            moduleName: ''
        });
    }
    if (process.env.HMS_SDK_PATH !== undefined) {
        Sdks.push({
            name: 'hms',
            path: process.env.HMS_SDK_PATH,
            moduleName: ''
        });
    }
}


basicSetup();
runPerfTest();
printCPUPerfInfo();
