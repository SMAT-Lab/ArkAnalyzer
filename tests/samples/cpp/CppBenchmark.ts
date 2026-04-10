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
/**
 * Linux-only C++ benchmark: OpenCV under {@code tests/third_party}, compile_commands.json, astJsonDumper, Scene.
 * Exports {@link getCompileCommandsPathForCppProjectRoot} and {@link isProjectRootPreparedCppTree} for {@code PerfTest}.
 *
 * Run from repo root: {@code npx ts-node tests/samples/cpp/CppBenchmark.ts}
 *
 * Env: {@code CPP_BENCHMARK_NINJA_PATH}; optional {@code CPP_BENCHMARK_OPENCV_DIR}; optional apt via {@code tryLinuxCppBenchmarkToolchainOptional}.
 *
 * Full run on Linux also requires {@code git}, {@code cmake}, and network for OpenCV clone unless {@code CPP_BENCHMARK_OPENCV_DIR} is set.
 * {@code astJsonDumper} is not built here — generate it beforehand per {@code docs/cppFrontend/ArkAnalyzer-cpp_usage_guide.md} and place it under
 * {@code src/frontend/cppFrontend/ast/dumper/astJsonDumper}.
 */
import path from 'path';
import { spawn, spawnSync } from 'node:child_process';
import { access, cp, mkdir, rm } from 'node:fs/promises';
import { Scene, SceneConfig, getCxxSourceFileExtensions } from '../../../src';

/** Path to {@code compile_commands.json} for a tree configured like this benchmark ({@code build_ninja_ccdb}). */
export function getCompileCommandsPathForCppProjectRoot(projectRoot: string): string {
    return path.join(projectRoot, 'build_ninja_ccdb', 'compile_commands.json');
}

/**
 * True when {@code PROJECT_ROOT}’s last path segment ends with {@code _cpp} (prepared C++/OpenCV tree for PerfTest).
 */
export function isProjectRootPreparedCppTree(projectRoot: string): boolean {
    return path.basename(path.resolve(projectRoot)).endsWith('_cpp');
}

const CUSTOM_OPENCV_SOURCE_DIR = process.env.CPP_BENCHMARK_OPENCV_DIR ?? '';

const OPENCV_REPO_CANDIDATES = [
    'https://gitee.com/opencv/opencv.git',
    'https://github.com/opencv/opencv.git',
];

const SETTINGS = {
    logPrefix: '[CppBenchmark]',
} as const;

const PATHS = {
    projectRoot: process.cwd(),
    workDir: path.resolve(process.cwd(), 'tests', 'third_party'),
    astRootDir: path.resolve(process.cwd(), 'src', 'frontend', 'cppFrontend', 'ast'),
} as const;

/** Expected path for a prebuilt astJsonDumper (see configuration docs; this script does not compile it). */
const AST_JSON_DUMPER_PATH = path.join(PATHS.astRootDir, 'dumper', 'astJsonDumper');

enum StageName {
    ResetWorkspace = 'Reset workspace',
    PrepareOpenCV = 'Prepare OpenCV repository',
    GenerateCcdb = 'Generate OpenCV compilation database',
    VerifyAstJsonDumper = 'Verify prebuilt astJsonDumper',
    BuildScene = 'Build Scene for OpenCV',
}

const RUN_STAMP = new Date().toISOString().replace(/[:.]/g, '-');
const DEFAULT_OPENCV_DIR = path.join(PATHS.workDir, `opencv_${RUN_STAMP}`);
let activeOpenCvDir = DEFAULT_OPENCV_DIR;

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

function trySetNinjaPathFromWhich(): boolean {
    const w = spawnSync('which', ['ninja'], { encoding: 'utf8' });
    if (w.status === 0 && w.stdout.trim().length > 0) {
        process.env.CPP_BENCHMARK_NINJA_PATH = w.stdout.trim();
        log(`CPP_BENCHMARK_NINJA_PATH=${process.env.CPP_BENCHMARK_NINJA_PATH} (from PATH)`);
        return true;
    }
    return false;
}

/** Best-effort Linux setup; sudo/apt failures only log. */
function tryLinuxCppBenchmarkToolchainOptional(): void {
    if (process.platform !== 'linux') {
        return;
    }
    const existing = process.env.CPP_BENCHMARK_NINJA_PATH?.trim() ?? '';
    if (existing.length > 0) {
        return;
    }
    if (trySetNinjaPathFromWhich()) {
        return;
    }

    const whichApt = spawnSync('which', ['apt-get'], { encoding: 'utf8' });
    if (whichApt.status !== 0) {
        log('apt-get not found. Install ninja/cmake/git (or put ninja on PATH) and set CPP_BENCHMARK_NINJA_PATH if needed; continuing pipeline.');
        return;
    }
    log('Attempting ninja-build, build-essential, cmake, git via sudo apt-get (optional; failure is OK if you install manually)...');
    const inherit = { stdio: 'inherit' as const };
    let r = spawnSync('sudo', ['apt-get', 'update'], inherit);
    if (r.status !== 0) {
        log('sudo apt-get update failed (e.g. no permission). Install toolchain yourself and set CPP_BENCHMARK_NINJA_PATH or PATH; continuing pipeline.');
        return;
    }
    r = spawnSync('sudo', [
        'apt-get', 'install', '-y',
        'ninja-build', 'build-essential', 'cmake', 'git',
    ], inherit);
    if (r.status !== 0) {
        log('sudo apt-get install failed. Install ninja-build build-essential cmake git yourself; continuing pipeline.');
        return;
    }
    if (!trySetNinjaPathFromWhich()) {
        log('ninja not found in PATH after apt install. Set CPP_BENCHMARK_NINJA_PATH to the ninja binary; continuing pipeline.');
    }
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

async function ensureOpenCvCompilationDatabase(): Promise<void> {
    const ccdbPath = getCompileCommandsPathForCppProjectRoot(activeOpenCvDir);
    if (await exists(ccdbPath)) {
        log(`Found existing compile_commands.json: ${ccdbPath}`);
        return;
    }
    const ninjaPath = process.env.CPP_BENCHMARK_NINJA_PATH?.trim() ?? '';
    if (!ninjaPath || !(await exists(ninjaPath))) {
        throw new Error(
            'CPP_BENCHMARK_NINJA_PATH must be set to the full path of the ninja executable and the file must exist, or put ninja on PATH and re-run so the optional step can pick it up. See file header in tests/samples/cpp/CppBenchmark.ts.',
        );
    }
    const binDir = path.dirname(ninjaPath);
    const envPath = `${binDir}${path.delimiter}${process.env.PATH ?? ''}`;
    const env = { ...process.env, PATH: envPath };

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

/**
 * Does not compile astJsonDumper. Per {@code docs/cppFrontend/ArkAnalyzer-cpp_usage_guide.md}, build the tool in advance and
 * install it at {@link AST_JSON_DUMPER_PATH}. This pipeline assumes that step is already done; if the file is missing, fail fast.
 */
async function requirePrebuiltAstJsonDumper(): Promise<void> {
    if (await exists(AST_JSON_DUMPER_PATH)) {
        log(`astJsonDumper found: ${AST_JSON_DUMPER_PATH}`);
        return;
    }
    throw new Error(
        `astJsonDumper not found at ${AST_JSON_DUMPER_PATH}. Build it beforehand per docs/cppFrontend/ArkAnalyzer-cpp_usage_guide.md ` +
            '(Linux / toolchain sections), copy the binary to ast/dumper/astJsonDumper, then re-run this benchmark.',
    );
}

function buildSceneForOpenCv(): void {
    const config = new SceneConfig({ supportFileExts: [...getCxxSourceFileExtensions()] });
    config.setCcjsonPath(getCompileCommandsPathForCppProjectRoot(activeOpenCvDir));
    config.buildFromProjectDir(activeOpenCvDir);

    const scene = new Scene();
    scene.buildSceneFromFiles(config);
    log(`Scene built successfully for OpenCV: ${activeOpenCvDir}`);
}

async function runCppBenchmarkPipeline(): Promise<void> {
    if (process.platform !== 'linux') {
        log('This benchmark is supported on Linux only.');
        process.exit(1);
    }
    const start = Date.now();
    log('Pipeline started');
    tryLinuxCppBenchmarkToolchainOptional();
    await executeStage(`${StageName.ResetWorkspace}: ${PATHS.workDir}`, resetThirdPartyWorkspace);
    await executeStage(StageName.PrepareOpenCV, prepareOpenCvRepository);
    await executeStage(StageName.GenerateCcdb, ensureOpenCvCompilationDatabase);
    await executeStage(StageName.VerifyAstJsonDumper, requirePrebuiltAstJsonDumper);
    await executeStage(StageName.BuildScene, buildSceneForOpenCv);
    log(`Pipeline completed, totalElapsed=${formatDurationMs(Date.now() - start)}`);
}

const entryPath = process.argv[1]?.replace(/\\/g, '/') ?? '';
if (entryPath.endsWith('CppBenchmark.ts') || entryPath.endsWith('CppBenchmark.js')) {
    void runCppBenchmarkPipeline().catch((error) => {
        console.error(`${SETTINGS.logPrefix} Pipeline failed:`, error);
        process.exit(1);
    });
}
