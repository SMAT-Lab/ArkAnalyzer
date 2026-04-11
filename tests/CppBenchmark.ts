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

import { spawn } from 'node:child_process';
import { access, copyFile, cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { Scene, SceneConfig, getCxxSourceFileExtensions } from '../src';

// Optional overrides. Keep empty to use defaults.
const CUSTOM_NINJA_PATH = process.env.CPP_BENCHMARK_NINJA_PATH ?? '';
const CUSTOM_OPENCV_SOURCE_DIR = process.env.CPP_BENCHMARK_OPENCV_DIR ?? '';

const OPENCV_REPO_CANDIDATES = [
    'https://gitee.com/opencv/opencv.git',
    'https://github.com/opencv/opencv.git',
];

const SETTINGS = {
    logPrefix: '[CppBenchmark]',
    llvmCmakeDir: process.env.LLVM_DIR ?? '',
    clangCmakeDir: process.env.Clang_DIR ?? '',
} as const;

const PATHS = {
    projectRoot: process.cwd(),
    workDir: path.resolve(process.cwd(), 'tests', 'third_party'),
    astRootDir: path.resolve(process.cwd(), 'src', 'cppFrontend', 'ast'),
} as const;

const AST_PATHS = {
    buildDir: path.join(PATHS.astRootDir, 'build'),
    buildReleaseDir: path.join(PATHS.astRootDir, 'build', 'Release'),
    dumperDir: path.join(PATHS.astRootDir, 'dumper'),
    dumperBinaryName: process.platform === 'win32' ? 'astJsonDumper.exe' : 'astJsonDumper',
    dumperBinaryPath: path.join(PATHS.astRootDir, 'dumper', process.platform === 'win32' ? 'astJsonDumper.exe' : 'astJsonDumper'),
} as const;

enum StageName {
    ResetWorkspace = 'Reset workspace',
    PrepareOpenCV = 'Prepare OpenCV repository',
    GenerateCcdb = 'Generate OpenCV compilation database',
    BuildDumperExe = 'Build and deploy C++ AST dumper exe',
    BuildScene = 'Build Scene for OpenCV',
}

const RUN_STAMP = new Date().toISOString().replace(/[:.]/g, '-');
const DEFAULT_OPENCV_DIR = path.join(PATHS.workDir, `opencv_${RUN_STAMP}`);
let activeOpenCvDir = DEFAULT_OPENCV_DIR;
let activeNinjaPath = CUSTOM_NINJA_PATH;

function log(message: string): void {
    console.log(`${SETTINGS.logPrefix} ${message}`);
}

function formatDurationMs(durationMs: number): string {
    return `${(durationMs / 1000).toFixed(2)}s`;
}

async function exists(targetPath: string): Promise<boolean> {
    try {
        await access(targetPath);
        return true;
    } catch {
        return false;
    }
}

function runCommand(command: string, args: string[], cwd?: string, env?: NodeJS.ProcessEnv): Promise<void> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd,
            env,
            stdio: 'inherit',
            shell: false,
        });
        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed: ${command} ${args.join(' ')} (exit=${code ?? 'null'})`));
            }
        });
    });
}

async function executeStage(stageName: string, action: () => Promise<void> | void): Promise<void> {
    const start = Date.now();
    log(`Stage started: ${stageName}`);
    try {
        await action();
        log(`Stage finished: ${stageName}, elapsed=${formatDurationMs(Date.now() - start)}`);
    } catch (error) {
        log(`Stage failed: ${stageName}, elapsed=${formatDurationMs(Date.now() - start)}`);
        throw error;
    }
}

async function resetThirdPartyWorkspace(): Promise<void> {
    await rm(PATHS.workDir, { recursive: true, force: true });
    await mkdir(PATHS.workDir, { recursive: true });
}

function getOpenCvCMakeListsPath(targetDir: string): string {
    return path.join(targetDir, 'CMakeLists.txt');
}

function getOpenCvCompileCommandsPath(targetDir: string): string {
    return path.join(targetDir, 'build_ninja_ccdb', 'compile_commands.json');
}

async function prepareOpenCvRepository(): Promise<void> {
    activeOpenCvDir = DEFAULT_OPENCV_DIR;
    if (CUSTOM_OPENCV_SOURCE_DIR) {
        const cmakeLists = getOpenCvCMakeListsPath(CUSTOM_OPENCV_SOURCE_DIR);
        if (!(await exists(cmakeLists))) {
            throw new Error(`CUSTOM_OPENCV_SOURCE_DIR invalid: missing ${cmakeLists}`);
        }
        await cp(CUSTOM_OPENCV_SOURCE_DIR, activeOpenCvDir, { recursive: true });
        log(`Copied OpenCV from local source: ${CUSTOM_OPENCV_SOURCE_DIR}`);
        return;
    }

    for (const repo of OPENCV_REPO_CANDIDATES) {
        try {
            await runCommand('git', ['clone', repo, activeOpenCvDir], PATHS.workDir);
            log(`Cloned OpenCV from ${repo}`);
            return;
        } catch (error) {
            log(`Clone failed: ${repo}`);
        }
    }
    throw new Error('All OpenCV repository candidates failed.');
}

async function detectNinjaPath(): Promise<string> {
    if (activeNinjaPath && await exists(activeNinjaPath)) {
        return activeNinjaPath;
    }
    if (process.platform === 'win32') {
        const commonCandidates = [
            'C:\\tools\\ninja\\ninja.exe',
            'D:\\tools\\ninja\\ninja.exe',
        ];
        for (const c of commonCandidates) {
            if (await exists(c)) {
                activeNinjaPath = c;
                return c;
            }
        }
        throw new Error('Ninja not found on Windows. Set CPP_BENCHMARK_NINJA_PATH.');
    }
    return 'ninja';
}

function resolveCmakeDir(name: 'llvm' | 'clang'): string {
    const configured = name === 'llvm' ? SETTINGS.llvmCmakeDir : SETTINGS.clangCmakeDir;
    if (configured) {
        return configured;
    }
    if (process.platform === 'linux') {
        const linuxDefaults = name === 'llvm'
            ? ['/usr/lib/llvm-19/lib/cmake/llvm', '/usr/lib/llvm-18/lib/cmake/llvm', '/usr/lib/llvm-17/lib/cmake/llvm']
            : ['/usr/lib/llvm-19/lib/cmake/clang', '/usr/lib/llvm-18/lib/cmake/clang', '/usr/lib/llvm-17/lib/cmake/clang'];
        return linuxDefaults[0];
    }
    throw new Error(`Missing ${name.toUpperCase()}_DIR. Please set ${name === 'llvm' ? 'LLVM_DIR' : 'Clang_DIR'}.`);
}

async function ensureOpenCvCompilationDatabase(): Promise<void> {
    const ccdbPath = getOpenCvCompileCommandsPath(activeOpenCvDir);
    if (await exists(ccdbPath)) {
        log(`Found existing compile_commands.json: ${ccdbPath}`);
        return;
    }
    const ninja = await detectNinjaPath();
    const envPath = process.platform === 'win32'
        ? `${path.dirname(ninja)};${process.env.Path ?? ''}`
        : process.env.PATH ?? '';
    const env = { ...process.env, PATH: envPath, Path: envPath };

    await runCommand(
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
        activeOpenCvDir,
        env
    );
    if (!(await exists(ccdbPath))) {
        throw new Error(`compile_commands.json not generated: ${ccdbPath}`);
    }
}

async function buildAndDeployDumperExe(): Promise<void> {
    if (await exists(AST_PATHS.dumperBinaryPath)) {
        log(`Existing dumper executable found: ${AST_PATHS.dumperBinaryPath}`);
        return;
    }
    await mkdir(AST_PATHS.buildDir, { recursive: true });
    await mkdir(AST_PATHS.dumperDir, { recursive: true });

    if (process.platform === 'linux') {
        await runCommand(
            'cmake',
            ['-DCMAKE_TOOLCHAIN_FILE=../cmake/toolchains/linux.cmake', '..'],
            AST_PATHS.buildDir
        );
        await runCommand('make', [], AST_PATHS.buildDir);
    } else {
        const llvmDir = resolveCmakeDir('llvm');
        const clangDir = resolveCmakeDir('clang');
        await runCommand(
            'cmake',
            ['-S', '.', '-B', 'build', `-DLLVM_DIR=${llvmDir}`, `-DClang_DIR=${clangDir}`],
            PATHS.astRootDir
        );
        await runCommand(
            'cmake',
            ['--build', 'build', '--config', 'Release', '--target', 'astJsonDumper'],
            PATHS.astRootDir
        );
    }

    const builtDir = await exists(AST_PATHS.buildReleaseDir) ? AST_PATHS.buildReleaseDir : AST_PATHS.buildDir;
    const files = await readdir(builtDir);
    const candidates = files
        .filter((name) => name === AST_PATHS.dumperBinaryName)
        .map((name) => path.join(builtDir, name));
    if (candidates.length === 0) {
        throw new Error(`Cannot find built dumper executable in: ${builtDir}`);
    }

    let latest = candidates[0];
    let latestTime = (await stat(latest)).mtimeMs;
    for (let i = 1; i < candidates.length; i++) {
        const mtime = (await stat(candidates[i])).mtimeMs;
        if (mtime > latestTime) {
            latest = candidates[i];
            latestTime = mtime;
        }
    }
    await copyFile(latest, AST_PATHS.dumperBinaryPath);
    log(`Dumper executable deployed: ${AST_PATHS.dumperBinaryPath}`);
}

function buildSceneForOpenCv(): void {
    const config = new SceneConfig({ supportFileExts: [...getCxxSourceFileExtensions()] });
    config.setCcjsonPath(getOpenCvCompileCommandsPath(activeOpenCvDir));
    config.buildFromProjectDir(activeOpenCvDir);

    const scene = new Scene();
    scene.buildSceneFromFiles(config);
    log(`Scene built successfully for OpenCV: ${activeOpenCvDir}`);
}

async function runCppBenchmarkPipeline(): Promise<void> {
    const start = Date.now();
    log('Pipeline started');
    await executeStage(`${StageName.ResetWorkspace}: ${PATHS.workDir}`, resetThirdPartyWorkspace);
    await executeStage(StageName.PrepareOpenCV, prepareOpenCvRepository);
    await executeStage(StageName.GenerateCcdb, ensureOpenCvCompilationDatabase);
    await executeStage(StageName.BuildDumperExe, buildAndDeployDumperExe);
    await executeStage(StageName.BuildScene, buildSceneForOpenCv);
    log(`Pipeline completed, totalElapsed=${formatDurationMs(Date.now() - start)}`);
}

runCppBenchmarkPipeline().catch((error) => {
    console.error(`${SETTINGS.logPrefix} Pipeline failed:`, error);
    process.exit(1);
});

