#!/usr/bin/env node
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

import { readFileSync } from 'fs';
import { join } from 'path';
import { Command } from 'commander';
import Logger, { LOG_LEVEL } from '../utils/logger';
import { ArkAnalyzerError } from '../core/common/ArkError';
import { registerCommands } from './commands';

Logger.configure('', LOG_LEVEL.ERROR, LOG_LEVEL.INFO, false);

function getPackageVersion(): string {
    const pkgPath = join(__dirname, '../../package.json');
    return JSON.parse(readFileSync(pkgPath, 'utf8')).version as string;
}

async function main(): Promise<void> {
    const program = new Command();

    program
        .name('arkanalyzer')
        .description('ArkAnalyzer command-line tools (call graph and future utilities)')
        .version(getPackageVersion(), '-V, --version');

    await registerCommands(program);
    program.parse();
}

void main().catch((err: unknown) => {
    let errCode = 1;
    if (err instanceof ArkAnalyzerError) {
        errCode = err.getErrCode();
        console.error(err.toString());
    } else {
        console.error(err);
    }
    process.exit(errCode);
});
