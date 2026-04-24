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

import { fork, spawnSync } from 'node:child_process';
import type { ChildProcess, SpawnSyncReturns } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

import Logger, { LOG_MODULE_TYPE } from '../../../../../utils/logger';
import { getAstJsonDumperNodePath } from '../astUtils';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'astJsonDumper');

interface AstJsonRunContext {
    cwd: string;
    env: NodeJS.ProcessEnv;
}

type RunArgvFn = (context: AstJsonRunContext, ...argv: string[]) => number;

let selectedRunArgv: RunArgvFn | null = null;

function startNewAstJsonWorker(
    addonAbsolutePath: string,
    onExit: (proc: ChildProcess, code: number | null, signal: NodeJS.Signals | null) => void,
): ChildProcess {
    const workerPath = path.join(__dirname, 'napiWorker.cjs');
    const proc = fork(workerPath, [addonAbsolutePath], {
        serialization: 'advanced',
        stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    });
    proc.stdout?.on('data', (chunk: Buffer | string) => {
        const text = chunk.toString();
        if (text.trim().length > 0) {
            logger.info(`[Debug] astJsonDumper worker stdout:\n${text}`);
        }
    });
    proc.stderr?.on('data', (chunk: Buffer | string) => {
        const text = chunk.toString();
        if (text.trim().length > 0) {
            logger.error(`[Debug] astJsonDumper worker stderr:\n${text}`);
        }
    });
    proc.on('exit', (code, signal) => {
        onExit(proc, code, signal);
    });
    return proc;
}

function awaitWorkerArgvReply(
    proc: ChildProcess,
    workerStillCurrent: () => boolean,
    disposeOnSendFail: (proc: ChildProcess) => void,
    context: AstJsonRunContext,
    argv: string[],
): number {
    const state = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2));
    try {
        proc.send({
            type: 'run',
            argv,
            cwd: context.cwd,
            envPath: context.env.PATH,
            state: state.buffer,
        });
    } catch (error) {
        logger.error('[Debug] Failed to send astJsonDumper request to worker:', error);
        disposeOnSendFail(proc);
        return -1;
    }

    while (Atomics.load(state, 0) === 0) {
        Atomics.wait(state, 0, 0, 1000);
        if (!workerStillCurrent() || proc.exitCode !== null || proc.killed) {
            logger.error('[Debug] astJsonDumper worker exited before replying.');
            return -1;
        }
    }
    return Atomics.load(state, 1);
}

function createPersistentWorkerRunner(addonAbsolutePath: string): RunArgvFn {
    let worker: ChildProcess | null = null;

    const disposeWorker = (proc: ChildProcess): void => {
        if (worker === proc) {
            worker = null;
        }
        if (proc.exitCode === null && !proc.killed) {
            proc.kill();
        }
    };

    const ensureWorker = (): ChildProcess => {
        if (worker && worker.exitCode === null && !worker.killed) {
            return worker;
        }
        const proc = startNewAstJsonWorker(addonAbsolutePath, (exitedProc, code, signal) => {
            if (worker === exitedProc) {
                worker = null;
            }
            logger.warn(`[Debug] astJsonDumper worker exited (code=${code}, signal=${signal}).`);
        });
        worker = proc;
        return proc;
    };

    return (context, ...argv): number => {
        const proc = ensureWorker();
        return awaitWorkerArgvReply(proc, () => worker === proc, disposeWorker, context, argv);
    };
}

function logSpawnSyncFailure(result: SpawnSyncReturns<string>): number {
    if (result.stdout) {
        logger.error(`[Debug] child stdout:\n${result.stdout}`);
    }
    if (result.stderr) {
        logger.error(`[Debug] child stderr:\n${result.stderr}`);
    }
    logger.error(`[Debug] astJsonDumper child exited with code ${result.status}`);
    return -1;
}

function runArgvInSubprocess(context: AstJsonRunContext, ...argv: string[]): number {
    const addonPath = getAstJsonDumperNodePath();
    const childScript =
        'const addon = require(process.argv[1]); ' +
        'const rc = addon.runArgv(process.argv.slice(2)); ' +
        "process.exitCode = typeof rc === 'number' ? rc : 1;";
    const quoted = ['-e', childScript, addonPath, ...argv]
        .map((arg) => (arg.includes(' ') ? `"${arg}"` : arg))
        .join(' ');
    logger.info('================================================================');
    logger.info(`[Debug] CWD: ${context.cwd}`);
    logger.info(`[Debug] astJsonDumper.node: ${addonPath}`);
    logger.info(`[Debug] CMD: "${process.execPath}" ${quoted}`);
    logger.info('================================================================');

    if (!fs.existsSync(addonPath)) {
        logger.error(`[Debug] Missing addon: ${addonPath}`);
        return -1;
    }

    const result = spawnSync(process.execPath, ['-e', childScript, addonPath, ...argv], {
        stdio: ['inherit', 'pipe', 'pipe'],
        encoding: 'utf-8',
        env: context.env,
        cwd: context.cwd,
    });
    if (result.status !== 0) {
        return logSpawnSyncFailure(result);
    }
    return 0;
}

function shouldIsolateRuns(): boolean {
    if (process.env.ARKANALYZER_AST_JSON_SUBPROCESS === '1') {
        return true;
    }
    if (process.env.ARKANALYZER_AST_JSON_SUBPROCESS === '0') {
        return false;
    }
    return process.env.VITEST === 'true';
}

function getRunArgv(): RunArgvFn {
    if (!selectedRunArgv) {
        selectedRunArgv = shouldIsolateRuns()
            ? runArgvInSubprocess
            : createPersistentWorkerRunner(getAstJsonDumperNodePath());
    }
    return selectedRunArgv;
}

export function runAstJsonArgv(argv: string[], context: AstJsonRunContext): number {
    return getRunArgv()(context, ...argv);
}
