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


import path from 'path';

import { prepareDatasets } from './prepare';
import { runPerformanceProfiling } from './run';
import { OPENCV_PROJECT, PerfProjectConfig, PerfTarget, PHOTOS_PROJECT } from './utils';
import { compare } from './compare';

function envTrim(name: string): string | undefined {
    const v = process.env[name]?.trim();
    return v && v.length > 0 ? v : undefined;
}

function parsePerfTargetArg(): PerfTarget {
    const projectArg = process.argv.find((arg) => arg.startsWith('--project='));
    if (!projectArg) {
        return 'photos';
    }
    const value = projectArg.slice('--project='.length).toLowerCase();
    if (value === 'photos' || value === 'opencv') {
        return value;
    }
    console.warn(`Unknown --project value "${value}", fallback to "photos".`);
    return 'photos';
}

/**
 * Usage
 *
 * Built-in fixtures:
 *   PERF_ROUNDS=3 npm run perf:arkts
 *   PERF_ROUNDS=3 npm run perf:cpp
 *
 * Custom project + baseline:
 *   PERF_ROUNDS=3 NODE_OPTIONS="--expose-gc --perf-basic-prof" \
 *   PROJECT_ROOT=/abs/path/to/project \
 *   PROJECT_BASELINE=/abs/path/to/baseline-summary.json \
 *   node --max-old-space-size=16384 --expose-gc --perf-basic-prof -r ts-node/register tests/samples/perf/main.ts
 *
 * Optional C++ compile_commands.json:
 *   PROJECT_CCJSON=/abs/path/to/compile_commands.json
 *
 * Start heap snapshot:
 *   PERF_HEAP_SNAPSHOT=1 NODE_OPTIONS="--perf-basic-prof" npm run perf:arkts"
 */
async function main(): Promise<void> {
    const rounds = Math.max(1, Number.parseInt(process.env.PERF_ROUNDS ?? '1', 10) || 1);
    const projectRoot = envTrim('PROJECT_ROOT');
    const projectBaseline = envTrim('PROJECT_BASELINE');

    if (projectRoot || projectBaseline) {
        if (!projectRoot || !projectBaseline) {
            console.error('Custom perf run requires both PROJECT_ROOT and PROJECT_BASELINE.');
            process.exit(1);
        }
        const projectConfig: PerfProjectConfig = {
            url: '',
            project: path.basename(projectRoot),
            path: projectRoot,
            baseline: projectBaseline,
            ccJsonPath: envTrim('PROJECT_CCJSON'),
        };

        console.log(`Using ${rounds} profiling round(s).`);
        console.log(`PROJECT_ROOT     : ${projectRoot}`);
        console.log(`PROJECT_BASELINE : ${projectBaseline}`);
        console.log(`Perf id (key)    : ${projectConfig.project}`);
        if (projectConfig.ccJsonPath) {
            console.log(`PROJECT_CCJSON   : ${projectConfig.ccJsonPath}`);
        }
        console.log('Manual GC between rounds: enabled');

        const runId = await runPerformanceProfiling(rounds, projectConfig);
        compare(projectBaseline, runId);
        return;
    }

    const target = parsePerfTargetArg();
    console.log(`Using ${rounds} profiling round(s).`);
    console.log(`Target project(s): ${target}`);
    console.log('Manual GC between rounds: enabled');

    prepareDatasets(target);

    if (target === PHOTOS_PROJECT.project) {
        const runId = await runPerformanceProfiling(rounds, PHOTOS_PROJECT);
        compare(PHOTOS_PROJECT.baseline, runId);
    }

    if (target === OPENCV_PROJECT.project) {
        const runId = await runPerformanceProfiling(
            rounds,
            OPENCV_PROJECT
        );
        compare(OPENCV_PROJECT.baseline, runId);
    }
}

main();
