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

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { FIXTURES_DIR, OPENCV_PROJECT, PROJECTS, PerfTarget, ensureDir } from './utils';


function runOrThrow(command: string, args: string[], cwd: string, env?: NodeJS.ProcessEnv): void {
    const commandLine = `${command} ${args.join(' ')}`;
    const proc = spawnSync(command, args, {
        cwd,
        env,
        stdio: 'inherit',
    });

    if (proc.error) {
        throw proc.error;
    }

    if (proc.status !== 0) {
        throw new Error(`Command failed: ${commandLine}\n${proc.stderr}`);
    }
}

function trySetNinjaPathFromWhich(): boolean {
    const proc = spawnSync('which', ['ninja'], { encoding: 'utf8' });
    if (proc.status === 0 && proc.stdout.trim()) {
        process.env.CPP_BENCHMARK_NINJA_PATH = proc.stdout.trim();
        return true;
    }
    return false;
}

function warnOptionalStep(message: string): void {
    console.warn(`[perf/prepare] ${message}`);
}

function ensureOpenCvCompilationDatabase(openCvRoot: string): void {
    const ccdbPath = OPENCV_PROJECT.ccJsonPath;
    if (!ccdbPath) {
        warnOptionalStep('Skip OpenCV compile_commands generation: ccJsonPath is not set on OPENCV_PROJECT.');
        return;
    }
    if (fs.existsSync(ccdbPath)) {
        return;
    }

    let ninjaPath = process.env.CPP_BENCHMARK_NINJA_PATH?.trim() ?? '';
    if (!ninjaPath) {
        trySetNinjaPathFromWhich();
        ninjaPath = process.env.CPP_BENCHMARK_NINJA_PATH?.trim() ?? '';
    }
    if (!ninjaPath || !fs.existsSync(ninjaPath)) {
        warnOptionalStep(
            'Skip OpenCV compile_commands generation: ninja not found. ' +
            'Set CPP_BENCHMARK_NINJA_PATH or put ninja on PATH, then re-run prepare.ts if needed.',
        );
        return;
    }

    const binDir = path.dirname(ninjaPath);
    const envPath = `${binDir}${path.delimiter}${process.env.PATH ?? ''}`;
    const env = { ...process.env, PATH: envPath };
    try {
        runOrThrow(
            'cmake',
            [
                '-S', '.',
                '-B', 'build_ninja_ccdb',
                '-G', 'Ninja',
                '-DCMAKE_EXPORT_COMPILE_COMMANDS=ON',
                '-DCMAKE_BUILD_TYPE=Release',
                '-DWITH_IPP=OFF',
                '-DWITH_FFMPEG=OFF',
                '-DENABLE_LIBJPEG_TURBO_SIMD=OFF',
            ],
            openCvRoot,
            env
        );
    } catch (error) {
        warnOptionalStep(`Skip OpenCV compile_commands generation: ${String(error)}`);
        return;
    }

    if (!fs.existsSync(ccdbPath)) {
        warnOptionalStep(`Skip OpenCV compile_commands generation: compile_commands.json not generated at ${ccdbPath}.`);
    }
}

export function prepareProject(
    repoUrl: string,
    projectName: string,
    options?: { depth?: number; force?: boolean }
): void {
    const targetRoot = path.join(FIXTURES_DIR, projectName);
    const gitDir = path.join(targetRoot, '.git');
    const depth = options?.depth;
    const force = options?.force ?? false;

    if (force && fs.existsSync(targetRoot)) {
        fs.rmSync(targetRoot, { recursive: true, force: true });
    }

    if (fs.existsSync(gitDir)) {
        return;
    }

    ensureDir(FIXTURES_DIR);

    const args = ['clone'];
    if (typeof depth === 'number' && Number.isInteger(depth) && depth > 0) {
        args.push('--depth', String(depth));
    }
    args.push(repoUrl, targetRoot);
    runOrThrow('git', args, FIXTURES_DIR);
}

export function prepareDatasets(target: PerfTarget): void {
    for (const project of PROJECTS) {
        if (target !== project.project) {
            continue;
        }
        prepareProject(project.url, project.project, { depth: 1 });
        if (project.project === OPENCV_PROJECT.project) {
            ensureOpenCvCompilationDatabase(project.path);
        }
    }
}