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

import { profileArkAnalyzer, serializeResult, StageMetrics } from './profiler';

interface WorkerArgs {
    projectPath: string;
    resultPath: string;
    currentRound: number;
    totalRounds: number;
    ccJsonPath?: string;
}

function parseArg(name: string): string | undefined {
    const prefix = `--${name}=`;
    const value = process.argv.find((arg) => arg.startsWith(prefix));
    return value?.slice(prefix.length);
}

function parseWorkerArgs(): WorkerArgs {
    const projectPath = parseArg('project-path');
    const resultPath = parseArg('result-path');
    const currentRound = Number.parseInt(parseArg('current-round') ?? '1', 10);
    const totalRounds = Number.parseInt(parseArg('total-rounds') ?? '1', 10);
    const ccJsonPath = parseArg('cc-json');

    if (!projectPath || !resultPath) {
        throw new Error('Missing required args: --project-path and --result-path');
    }

    return {
        projectPath,
        resultPath,
        currentRound: Number.isInteger(currentRound) && currentRound > 0 ? currentRound : 1,
        totalRounds: Number.isInteger(totalRounds) && totalRounds > 0 ? totalRounds : 1,
        ...(ccJsonPath ? { ccJsonPath } : {}),
    };
}

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

async function main(): Promise<void> {
    const args = parseWorkerArgs();
    const result = await profileArkAnalyzer(args.projectPath, args.ccJsonPath, {
        onStageStart: (stageName) => {
            console.log(`[Round ${args.currentRound}/${args.totalRounds}] Starting ${stageName}...`);
        },
        onStageEnd: (_stageName, metrics) => {
            printStageSummary(metrics);
        },
    });
    fs.writeFileSync(args.resultPath, serializeResult(result));
}

main().catch((error) => {
    console.error('\nRound worker failed:', error);
    process.exit(1);
});
