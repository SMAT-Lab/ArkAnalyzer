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

import { Command } from 'commander';
import { Scene } from '../../Scene';
import { buildSceneConfigFromProject } from '../../Config';
import { ScenePrinter } from '../../save/PrinterBuilder';
import { ArkAnalyzerError, ArkErrorCode } from '../../core/common/ArkError';

export interface IrCommandOptions {
    project: string;
    output: string;
    format?: 'json' | 'text' | 'dot';
    inferTypes: boolean;
    ohosSdkHome?: string;
}

export function dumpProjectToReadableIR(options: IrCommandOptions): { output: string; fileCount: number; formatUsed: string } {
    const config = buildSceneConfigFromProject(options.project, options.ohosSdkHome);

    const scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    if (options.inferTypes) {
        scene.inferTypes();
    }

    const fileCount = scene.getFiles().length;
    const printer = new ScenePrinter(scene, options.output);
    const rawFormat = options.format ?? 'text';
    let formatUsed = rawFormat;
    switch (rawFormat) {
        case 'json':
            printer.dumpToJson();
            break;
        case 'dot':
            printer.dumpToDot();
            break;
        case 'text':
        default:
            formatUsed = 'text';
            printer.dumpToIR();
            break;
    }
    return { output: options.output, fileCount, formatUsed };
}

/**
 * Register IR export command.
 *
 * Usage:
 *   arkanalyzer ir <input> [options]
 *
 * Examples:
 *   arkanalyzer ir ./my_project -f text
 *   arkanalyzer ir ./my_project -f json -o ./out/ir
 *   arkanalyzer ir ./my_project -f dot --ohos-sdk-home /path/to/sdk
 */
export function register(program: Command): void {
    program
        .command('ir <input>')
        .description('Export project IR-related artifacts')
        .option('-o, --output <dir>', 'Output directory for generated artifacts', 'out')
        .option('-f, --format <type>', 'Output format: json | text | dot', 'text')
        .option('--ohos-sdk-home <path>', 'OHOS SDK home. Fallback to env OHOS_SDK_HOME')
        .option('--no-infer-types', 'Skip Scene.inferTypes() for speed')
        .action((input: string, opts: { output: string; format: string; inferTypes: boolean; ohosSdkHome?: string }) => {
            const requestedFormat = (opts.format ?? 'json').toLowerCase();
            if (!['json', 'text', 'dot'].includes(requestedFormat)) {
                throw new ArkAnalyzerError({
                    errCode: ArkErrorCode.CLI_INVALID_OPTION,
                    errMsg: `Unsupported ir format: ${opts.format}. Expected one of: json, text, dot`,
                });
            }
            const result = dumpProjectToReadableIR({
                project: input,
                output: opts.output,
                format: requestedFormat as 'json' | 'text' | 'dot',
                inferTypes: opts.inferTypes !== false,
                ohosSdkHome: opts.ohosSdkHome,
            });
            const output = {
                input,
                format: result.formatUsed,
                outputDir: result.output,
                fileCount: result.fileCount,
            };
            process.stdout.write(`${JSON.stringify(output)}\n`);
        });
}
