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

import * as path from 'node:path';

import Logger, { LOG_MODULE_TYPE } from '../../../../utils/logger';
import { isAstJsonDumperAvailable } from '../astUtils';
import { runAstJsonArgv } from './napiRunner';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'astJsonDumper');

export interface AstJsonDumpRequest {
    sourceFile: string;
    outputFile: string;
    ccJsonPath?: string;
    includeDirs?: string[];
}

function buildRunEnv(llvmPath?: string): NodeJS.ProcessEnv {
    const out = { ...process.env } as NodeJS.ProcessEnv;
    if (!llvmPath) {
        return out;
    }

    const sep = path.delimiter;
    const cur = out.PATH ?? '';
    if (!cur.split(sep).includes(llvmPath)) {
        out.PATH = cur.length === 0 ? llvmPath : cur + sep + llvmPath;
    }
    return out;
}

function buildAstJsonArgv(request: AstJsonDumpRequest): string[] {
    const argv: string[] = [request.sourceFile, '-o', request.outputFile];
    if (request.ccJsonPath) {
        argv.push('-p', request.ccJsonPath);
    }
    if (request.includeDirs && request.includeDirs.length > 0) {
        request.includeDirs.forEach((dir) => {
            argv.push(`--extra-arg-before=-I${dir}`);
        });
    }
    return argv;
}

export function dumpAstJson(request: AstJsonDumpRequest, cwd: string, llvmPath?: string): number {
    const argv = buildAstJsonArgv(request);
    logger.info('================================================================');
    logger.info(`[Debug] CWD: ${cwd}`);
    logger.info(`[Debug] astJsonDumper args: ${JSON.stringify(argv)}`);
    logger.info('================================================================');

    if (!isAstJsonDumperAvailable()) {
        logger.error('[Debug] astJsonDumper backend is unavailable.');
        return -1;
    }

    const env = buildRunEnv(llvmPath);
    const code = runAstJsonArgv(argv, { cwd, env });
    if (code !== 0) {
        logger.error(`[Debug] astJsonDumper exited with code ${code}`);
        return code;
    }

    logger.info('[Debug] astJsonDumper finished successfully.');
    return 0;
}
