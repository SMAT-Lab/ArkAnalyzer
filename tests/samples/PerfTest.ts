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
import { Logger, LOG_LEVEL, LOG_MODULE_TYPE } from '../../src';
import { Sdk } from '../../src/Config'
import * as perf_hooks from 'perf_hooks';

const logger = Logger.getLogger(LOG_MODULE_TYPE.TOOL, 'PerfTest');
Logger.configure('', LOG_LEVEL.ERROR, LOG_LEVEL.INFO, false);
let PROJECT_ROOT: string | undefined;
let PROJECT_NAME: string | undefined;
let Sdks: Sdk[] = [];
const performance = perf_hooks.performance;

function testAppProject(): void {
    if (!PROJECT_NAME || !PROJECT_ROOT) {
        return;
    }
    let config: SceneConfig = new SceneConfig();
    config.buildConfig(PROJECT_NAME, PROJECT_ROOT, Sdks);
    let scene: Scene = new Scene();
    scene.buildBasicInfo(config);
    performance.mark('buildBasicInfo');
    scene.buildScene4HarmonyProject();
    performance.mark('buildScene4HarmonyProject');
    scene.inferTypes();
    performance.mark('inferTypes');
    printMemPerfInfo();
}

function runPerfTest(): void {
    performance.mark('start');
    testAppProject();
    performance.mark('end');
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

function printMemPerfInfo() {
    const g = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : undefined);
    if (g && typeof (g as { gc?: () => void }).gc === 'function') {
        (g as { gc: () => void }).gc();
    }
    const samples = collectRssSamples();
    const rssMedian = median(samples);
    const rssMb = rssMedian / 1024 / 1024;
    logger.info(`RSS Memory Size: ${Math.round(rssMb * 100) / 100} MB.`);
}

function printCPUPerfInfo() {
    performance.measure('start-to-end', 'start', 'end');
    performance.measure('start-to-buildBasicInfo', 'start', 'buildBasicInfo');
    performance.measure('buildBasicInfo-to-buildScene4HarmonyProject', 'buildBasicInfo', 'buildScene4HarmonyProject');
    performance.measure('buildScene4HarmonyProject-to-inferTypes', 'buildScene4HarmonyProject', 'inferTypes');
    performance.measure('inferTypes-to-end', 'inferTypes', 'end');

    let start_to_end = performance.getEntriesByName('start-to-end')[0].duration / 1000;
    let start_to_buildBasicInfo = performance.getEntriesByName('start-to-buildBasicInfo')[0].duration / 1000;
    let buildBasicInfo_to_buildScene4HarmonyProject = performance.getEntriesByName('buildBasicInfo-to-buildScene4HarmonyProject')[0].duration / 1000;
    let buildScene4HarmonyProject_to_inferTypes = performance.getEntriesByName('buildScene4HarmonyProject-to-inferTypes')[0].duration / 1000;
    let inferTypes_to_end = performance.getEntriesByName('inferTypes-to-end')[0].duration / 1000;

    logger.info('Take total time: ', start_to_end.toFixed(3), 's');
    logger.info('Detail: start <-', start_to_buildBasicInfo.toFixed(3),
        's -> buildBasicInfo <-', buildBasicInfo_to_buildScene4HarmonyProject.toFixed(3),
        's -> buildScene4HarmonyProject <-', buildScene4HarmonyProject_to_inferTypes.toFixed(3),
        's -> inferTypes <-', inferTypes_to_end.toFixed(3),
        's -> end');
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
