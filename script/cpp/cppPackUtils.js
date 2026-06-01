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

'use strict';

const { spawnSync } = require('child_process');
const {
    chmodSync,
    cpSync,
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    renameSync,
    rmSync,
    statSync,
    writeFileSync,
} = require('fs');
const { dirname, join } = require('path');
const os = require('os');

const useShell = process.platform === 'win32';
const CXX_PARSER_PACKAGE = '@arkanalyzer/cxx-ast-parser';

function getProjectRoot() {
    return join(__dirname, '..', '..');
}

const cxxAstRuntimeRoot = () => join(getProjectRoot(), 'packages', 'cxx-ast-parser');
const astCppDir = () => join(cxxAstRuntimeRoot(), 'cpp');
const linkedCxxAstRuntimeDir = () => join(getProjectRoot(), 'node_modules', '@arkanalyzer', 'cxx-ast-parser');

function spawnCommand(command, args = [], options = {}) {
    let stdio = options.stdio;
    if (stdio === undefined) {
        // encoding implies we need captured stdout (default inherit leaves stdout null).
        stdio = options.encoding ? ['ignore', 'pipe', 'inherit'] : 'inherit';
    }
    return spawnSync(command, args, {
        cwd: options.cwd,
        stdio,
        env: options.env ? { ...process.env, ...options.env } : process.env,
        encoding: options.encoding,
        maxBuffer: options.maxBuffer,
        shell: useShell,
    });
}

function runCommand(command, args, options = {}) {
    const result = spawnCommand(command, args, options);
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
    return result;
}

function runCommandOptional(command, args, options = {}) {
    return spawnCommand(command, args, options).status === 0;
}

function isCommandAvailable(command) {
    return spawnCommand(command, ['--version'], { stdio: 'ignore' }).status === 0;
}

function isCppBuildReady(projectRoot = getProjectRoot()) {
    const dumper = join(projectRoot, 'packages', 'cxx-ast-parser', 'dumper', 'astJsonDumper.node');
    const runtimeLib = join(projectRoot, 'packages', 'cxx-ast-parser', 'lib', 'index.js');
    return existsSync(dumper) && existsSync(runtimeLib);
}

// --- FlatBuffers toolchain (flatc + C++ headers under tools/, gitignored) ---

const FLATBUFFERS_VERSION_STAMP = '.flatbuffers-version';

function flatbuffersToolsLayout(root = getProjectRoot()) {
    const toolsDir = join(root, 'tools');
    const flatcName = process.platform === 'win32' ? 'flatc.exe' : 'flatc';
    return {
        toolsDir,
        flatbuffersDir: join(toolsDir, 'flatbuffers'),
        includeDir: join(toolsDir, 'flatbuffers', 'include'),
        headerMarker: join(toolsDir, 'flatbuffers', 'include', 'flatbuffers', 'flatbuffers.h'),
        flatcPath: join(toolsDir, flatcName),
        versionStampPath: join(toolsDir, FLATBUFFERS_VERSION_STAMP),
    };
}

function readPinnedFlatbuffersVersion() {
    if (process.env.ARKANALYZER_FLATBUFFERS_VERSION) {
        return process.env.ARKANALYZER_FLATBUFFERS_VERSION.trim();
    }
    const pkg = JSON.parse(readFileSync(join(cxxAstRuntimeRoot(), 'package.json'), 'utf8'));
    const dep = pkg.dependencies?.flatbuffers ?? '25.2.10';
    const match = String(dep).match(/(\d+\.\d+\.\d+)/);
    return match ? match[1] : '25.2.10';
}

function readFlatbuffersVersionStamp(root) {
    const { versionStampPath } = flatbuffersToolsLayout(root);
    if (!existsSync(versionStampPath)) {
        return undefined;
    }
    return readFileSync(versionStampPath, 'utf8').trim();
}

function writeFlatbuffersVersionStamp(root, version) {
    const { toolsDir, versionStampPath } = flatbuffersToolsLayout(root);
    mkdirSync(toolsDir, { recursive: true });
    writeFileSync(versionStampPath, `${version}\n`);
}

function hasVendoredFlatbuffersHeaders(root = getProjectRoot()) {
    return existsSync(flatbuffersToolsLayout(root).headerMarker);
}

function hasVendoredFlatc(root = getProjectRoot()) {
    return existsSync(flatbuffersToolsLayout(root).flatcPath);
}

function isFlatbuffersToolchainReady(root = getProjectRoot()) {
    const version = readPinnedFlatbuffersVersion();
    return (
        hasVendoredFlatbuffersHeaders(root) &&
        hasVendoredFlatc(root) &&
        readFlatbuffersVersionStamp(root) === version
    );
}

function downloadUrlToFile(url, destPath, logPrefix) {
    mkdirSync(dirname(destPath), { recursive: true });
    console.log(`${logPrefix} downloading ${url}`);
    const result = spawnCommand('curl', ['-L', '--retry', '3', '-f', '-o', destPath, url], {
        cwd: getProjectRoot(),
        stdio: 'inherit',
    });
    if (result.status !== 0) {
        console.error(`${logPrefix} download failed (${result.status ?? 'unknown'}): ${url}`);
        process.exit(result.status ?? 1);
    }
}

function windowsSystemTarPath() {
    const systemRoot = process.env.SystemRoot || process.env.WINDIR || 'C:\\Windows';
    const winTar = join(systemRoot, 'System32', 'tar.exe');
    return existsSync(winTar) ? winTar : undefined;
}

function extractZipArchive(zipPath, destDir, logPrefix) {
    mkdirSync(destDir, { recursive: true });
    if (process.platform === 'win32') {
        // MSYS tar treats D:\... as a host name ("Cannot connect to D:"). Use Windows tar or PowerShell.
        const winTar = windowsSystemTarPath();
        if (winTar) {
            runCommand(winTar, ['-xf', zipPath, '-C', destDir], { cwd: getProjectRoot() });
            return;
        }
        const psDest = destDir.replace(/'/g, "''");
        const psZip = zipPath.replace(/'/g, "''");
        runCommand(
            'powershell',
            [
                '-NoProfile',
                '-Command',
                `Expand-Archive -LiteralPath '${psZip}' -DestinationPath '${psDest}' -Force`,
            ],
            { cwd: getProjectRoot() },
        );
        return;
    }
    runCommand('unzip', ['-q', '-o', zipPath, '-d', destDir], { cwd: getProjectRoot() });
}

/** Locate extracted FlatBuffers source root (zip layout varies on Windows). */
function resolveFlatbuffersSourceTree(extractRoot, version) {
    const candidates = [join(extractRoot, `flatbuffers-${version}`), extractRoot];
    for (const root of candidates) {
        if (existsSync(join(root, 'include', 'flatbuffers', 'flatbuffers.h'))) {
            return root;
        }
    }
    const headerPath = findFileRecursive(extractRoot, 'flatbuffers.h');
    if (headerPath) {
        const root = join(headerPath, '..', '..', '..');
        if (existsSync(join(root, 'include', 'flatbuffers', 'flatbuffers.h'))) {
            return root;
        }
    }
    return undefined;
}

function findFileRecursive(rootDir, fileName) {
    for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
        const entryPath = join(rootDir, entry.name);
        if (entry.isDirectory()) {
            const nested = findFileRecursive(entryPath, fileName);
            if (nested) {
                return nested;
            }
            continue;
        }
        if (entry.name === fileName) {
            return entryPath;
        }
    }
    return undefined;
}

function installFlatbuffersHeaders(version, logPrefix) {
    const root = getProjectRoot();
    const { toolsDir, includeDir, flatbuffersDir } = flatbuffersToolsLayout(root);
    const zipPath = join(toolsDir, `flatbuffers-${version}-src.zip`);
    const srcUrl = `https://github.com/google/flatbuffers/archive/refs/tags/v${version}.zip`;
    downloadUrlToFile(srcUrl, zipPath, logPrefix);
    const extractRoot = join(toolsDir, `_flatbuffers-src-${version}`);
    rmSync(extractRoot, { recursive: true, force: true });
    extractZipArchive(zipPath, extractRoot, logPrefix);
    const extracted = resolveFlatbuffersSourceTree(extractRoot, version);
    if (!extracted) {
        console.error(`${logPrefix} unexpected FlatBuffers source layout under ${extractRoot}`);
        process.exit(1);
    }
    rmSync(flatbuffersDir, { recursive: true, force: true });
    mkdirSync(flatbuffersDir, { recursive: true });
    cpSync(join(extracted, 'include'), includeDir, { recursive: true });
    rmSync(extractRoot, { recursive: true, force: true });
    rmSync(zipPath, { force: true });
    console.log(`${logPrefix} installed headers -> ${includeDir}`);
}

function resolveFlatcReleaseAssetName() {
    if (process.platform === 'win32') {
        return 'Windows.flatc.binary.zip';
    }
    if (process.platform === 'darwin') {
        return process.arch === 'arm64' ? 'Mac.flatc.binary.zip' : 'MacIntel.flatc.binary.zip';
    }
    if (process.platform === 'linux' && process.arch === 'x64') {
        return 'Linux.flatc.binary.g++-13.zip';
    }
    return undefined;
}

function installFlatcFromReleaseBinary(version, logPrefix) {
    const asset = resolveFlatcReleaseAssetName();
    if (!asset) {
        return false;
    }
    const root = getProjectRoot();
    const { toolsDir, flatcPath } = flatbuffersToolsLayout(root);
    const zipPath = join(toolsDir, asset);
    const url = `https://github.com/google/flatbuffers/releases/download/v${version}/${asset}`;
    downloadUrlToFile(url, zipPath, logPrefix);
    const extractDir = join(toolsDir, `_flatc-bin-${version}`);
    rmSync(extractDir, { recursive: true, force: true });
    extractZipArchive(zipPath, extractDir, logPrefix);
    const flatcName = process.platform === 'win32' ? 'flatc.exe' : 'flatc';
    const found = findFileRecursive(extractDir, flatcName);
    if (!found) {
        console.error(`${logPrefix} ${asset} did not contain ${flatcName}`);
        process.exit(1);
    }
    cpSync(found, flatcPath);
    if (process.platform !== 'win32') {
        chmodSync(flatcPath, 0o755);
    }
    rmSync(extractDir, { recursive: true, force: true });
    rmSync(zipPath, { force: true });
    console.log(`${logPrefix} installed flatc -> ${flatcPath}`);
    return true;
}

function ensureFlatbuffersSourceTree(version, toolsDir, zipPath, logPrefix) {
    const srcRoot = join(toolsDir, `flatbuffers-${version}-src`);
    if (existsSync(join(srcRoot, 'CMakeLists.txt'))) {
        return srcRoot;
    }
    const extractRoot = join(toolsDir, `_flatbuffers-src-${version}`);
    rmSync(extractRoot, { recursive: true, force: true });
    extractZipArchive(zipPath, extractRoot, logPrefix);
    const extracted = resolveFlatbuffersSourceTree(extractRoot, version);
    if (!extracted) {
        console.error(`${logPrefix} unexpected FlatBuffers source layout under ${extractRoot}`);
        process.exit(1);
    }
    rmSync(srcRoot, { recursive: true, force: true });
    renameSync(extracted, srcRoot);
    rmSync(extractRoot, { recursive: true, force: true });
    return srcRoot;
}

function installFlatcFromSourceBuild(version, logPrefix) {
    const root = getProjectRoot();
    const { toolsDir, flatcPath } = flatbuffersToolsLayout(root);
    const zipPath = join(toolsDir, `flatbuffers-${version}-src.zip`);
    const srcUrl = `https://github.com/google/flatbuffers/archive/refs/tags/v${version}.zip`;
    if (!existsSync(zipPath)) {
        downloadUrlToFile(srcUrl, zipPath, logPrefix);
    }
    const srcRoot = ensureFlatbuffersSourceTree(version, toolsDir, zipPath, logPrefix);
    const buildDir = join(toolsDir, `_flatc-build-${version}`);
    rmSync(buildDir, { recursive: true, force: true });
    mkdirSync(buildDir, { recursive: true });
    const cmakeConfigure = [
        '-S',
        srcRoot,
        '-B',
        buildDir,
        '-DCMAKE_BUILD_TYPE=Release',
        '-DFLATBUFFERS_BUILD_TESTS=OFF',
        '-DFLATBUFFERS_BUILD_GRPCT=OFF',
        '-DFLATBUFFERS_BUILD_FLATHASH=OFF',
        '-DFLATBUFFERS_BUILD_FLATLIB=OFF',
        '-DFLATBUFFERS_BUILD_FLATC=ON',
    ];
    runCommand('cmake', cmakeConfigure, { cwd: root });
    const jobs = String(Math.max(1, os.cpus().length));
    runCommand('cmake', ['--build', buildDir, '--target', 'flatc', '-j', jobs], { cwd: root });
    const flatcName = process.platform === 'win32' ? 'flatc.exe' : 'flatc';
    const found = findFileRecursive(buildDir, flatcName);
    if (!found) {
        console.error(`${logPrefix} cmake build did not produce ${flatcName} under ${buildDir}`);
        process.exit(1);
    }
    cpSync(found, flatcPath);
    if (process.platform !== 'win32') {
        chmodSync(flatcPath, 0o755);
    }
    console.log(`${logPrefix} built flatc from source -> ${flatcPath}`);
}

function ensureFlatbuffersTools(options = {}) {
    const logPrefix = options.logPrefix ?? '[flatbuffers]';
    const root = getProjectRoot();
    const version = readPinnedFlatbuffersVersion();
    if (isFlatbuffersToolchainReady(root)) {
        return;
    }
    if (
        hasVendoredFlatbuffersHeaders(root) &&
        hasVendoredFlatc(root) &&
        readFlatbuffersVersionStamp(root) === undefined
    ) {
        writeFlatbuffersVersionStamp(root, version);
        console.log(`${logPrefix} using existing tools/ FlatBuffers toolchain (stamped ${version})`);
        return;
    }
    console.log(`${logPrefix} preparing FlatBuffers ${version} under tools/ (not in git)...`);
    mkdirSync(flatbuffersToolsLayout(root).toolsDir, { recursive: true });
    if (!hasVendoredFlatbuffersHeaders(root) || readFlatbuffersVersionStamp(root) !== version) {
        installFlatbuffersHeaders(version, logPrefix);
    }
    if (!hasVendoredFlatc(root) || readFlatbuffersVersionStamp(root) !== version) {
        if (!installFlatcFromReleaseBinary(version, logPrefix)) {
            console.log(`${logPrefix} no prebuilt flatc for ${process.platform}-${process.arch}; building from source...`);
            installFlatcFromSourceBuild(version, logPrefix);
        }
    }
    writeFlatbuffersVersionStamp(root, version);
}

function resolveFlatbuffersIncludeDir(root = getProjectRoot()) {
    const candidates = [
        join(cxxAstRuntimeRoot(), 'node_modules', 'flatbuffers', 'include'),
        join(root, 'node_modules', 'flatbuffers', 'include'),
        flatbuffersToolsLayout(root).includeDir,
    ];
    for (const dir of candidates) {
        if (existsSync(join(dir, 'flatbuffers', 'flatbuffers.h'))) {
            return dir;
        }
    }
    return undefined;
}

// --- flatc (astWire.fbs → flatGenerated) ---

const FLATC_TS_OUTPUT_MARKERS = [
    'astWire.ts',
    join('ark-cxx-ast-fb', 'cxx-ast-payload.ts'),
    join('ark-cxx-ast-fb', 'cxx-ast-node-wire.ts'),
];
const FLATC_CPP_OUTPUT_MARKER = 'astWire_generated.h';

function flatGeneratedOutputDirs() {
    return {
        cppOut: join(astCppDir(), 'serialization', 'flatGenerated'),
        tsOut: join(cxxAstRuntimeRoot(), 'ts', 'serialization', 'flatGenerated'),
    };
}

function flatGeneratedOutputsPresent(cppOut, tsOut) {
    if (!existsSync(join(cppOut, FLATC_CPP_OUTPUT_MARKER))) {
        return false;
    }
    return FLATC_TS_OUTPUT_MARKERS.every((rel) => existsSync(join(tsOut, rel)));
}

function resolveFlatcCommand() {
    const root = getProjectRoot();
    const cxxRoot = cxxAstRuntimeRoot();
    const { flatcPath } = flatbuffersToolsLayout(root);
    const candidates = [
        flatcPath,
        join(cxxRoot, 'node_modules', 'flatbuffers', 'flatc'),
        join(cxxRoot, 'node_modules', '.bin', 'flatc'),
        join(root, 'node_modules', 'flatbuffers', 'flatc'),
        join(root, 'node_modules', '.bin', 'flatc'),
        join(root, 'tools', 'flatc'),
        join(root, 'tools', 'flatc.exe'),
        'flatc',
    ];
    for (const command of candidates) {
        if (command === 'flatc') {
            if (isCommandAvailable('flatc')) {
                return command;
            }
            continue;
        }
        if (existsSync(command)) {
            return command;
        }
    }
    return undefined;
}

function patchFlatcTsImports(tsOutDir) {
    for (const entry of readdirSync(tsOutDir, { withFileTypes: true })) {
        const filePath = join(tsOutDir, entry.name);
        if (entry.isDirectory()) {
            patchFlatcTsImports(filePath);
            continue;
        }
        if (!entry.name.endsWith('.ts')) {
            continue;
        }
        const source = readFileSync(filePath, 'utf8');
        const patched = source.replace(/(from\s+['"])([^'"]+)\.js(['"])/g, '$1$2$3');
        if (patched !== source) {
            writeFileSync(filePath, patched);
        }
    }
}

function runFlatcCodegen(options = {}) {
    const logPrefix = options.logPrefix ?? '[flatc]';
    const exitOnError = options.exitOnError !== false;
    const fbsPath = join(astCppDir(), 'serialization', 'astWire.fbs');
    const { cppOut, tsOut } = flatGeneratedOutputDirs();
    mkdirSync(cppOut, { recursive: true });
    mkdirSync(tsOut, { recursive: true });

    ensureFlatbuffersTools({ logPrefix: `${logPrefix} toolchain` });
    const flatc = resolveFlatcCommand();
    if (!flatc) {
        const message =
            `${logPrefix} flatc not found after ensureFlatbuffersTools. ` +
            'Check network access to github.com or set ARKANALYZER_FLATBUFFERS_VERSION.';
        if (exitOnError) {
            console.error(message);
            process.exit(1);
        }
        console.warn(message);
        return false;
    }

    console.log(`${logPrefix} flatc codegen: ${fbsPath}`);
    const root = getProjectRoot();
    runCommand(flatc, ['--cpp', '-o', cppOut, fbsPath], { cwd: root });
    runCommand(flatc, ['--ts', '-o', tsOut, fbsPath], { cwd: root });
    patchFlatcTsImports(tsOut);
    return flatGeneratedOutputsPresent(cppOut, tsOut);
}

// --- cxx-ast-parser install / lib build / node_modules link ---

function removeLinkedCxxAstRuntimeFromNodeModules() {
    const linked = linkedCxxAstRuntimeDir();
    if (existsSync(linked)) {
        rmSync(linked, { recursive: true, force: true });
    }
}

function platformPackageNameForCurrentPlatform() {
    return `@arkanalyzer/cxx-ast-parser-${process.platform}-${process.arch}`;
}

function isCxxAstRuntimeLoadable() {
    const platformPkg = platformPackageNameForCurrentPlatform();
    const script = [
        `try { require('${platformPkg}'); process.exit(0); }`,
        "catch (e) { try { require('@arkanalyzer/cxx-ast-parser'); process.exit(0); }",
        'catch (e2) { process.exit(1); } }',
    ].join(' ');
    const result = spawnSync(process.execPath, ['-e', script], {
        cwd: getProjectRoot(),
        stdio: 'pipe',
        env: process.env,
    });
    if (result.status !== 0 && result.stderr?.length) {
        console.error(`[cppPackUtils] require C++ runtime failed: ${result.stderr.toString().trim()}`);
    }
    return result.status === 0;
}

function installLocalCxxAstRuntimePackage() {
    if (!existsSync(join(cxxAstRuntimeRoot(), 'package.json'))) {
        return false;
    }
    removeLinkedCxxAstRuntimeFromNodeModules();
    return runCommandOptional('npm', ['install', './packages/cxx-ast-parser', '--no-save'], { cwd: getProjectRoot() });
}

function readCxxAstRuntimeVersion() {
    const pkg = JSON.parse(readFileSync(join(getProjectRoot(), 'package.json'), 'utf8'));
    return pkg.version;
}

function cxxAstRuntimeLibNeedsRebuild() {
    const libMarker = join(cxxAstRuntimeRoot(), 'lib', 'serialization', 'WireDecoder.js');
    if (!existsSync(libMarker)) {
        return true;
    }
    const libMtime = statSync(libMarker).mtimeMs;
    const root = getProjectRoot();
    const inputs = [
        join(cxxAstRuntimeRoot(), 'cpp', 'serialization', 'astWire.fbs'),
        join(cxxAstRuntimeRoot(), 'dumper', 'astJsonDumper.node'),
        join(root, 'src', 'frontend', 'cppFrontend', 'utils', 'ArkCxxAstNode.ts'),
        join(root, 'src', 'frontend', 'cppFrontend', 'utils', 'cppUtils.ts'),
        join(cxxAstRuntimeRoot(), 'ts', 'serialization', 'WireDecoder.ts'),
        join(cxxAstRuntimeRoot(), 'ts', 'CxxAstFlatInfo.ts'),
        join(cxxAstRuntimeRoot(), 'ts', 'serialization', 'flatGenerated', 'ark-cxx-ast-fb', 'cxx-ast-payload.ts'),
    ];
    return inputs.some((p) => existsSync(p) && statSync(p).mtimeMs > libMtime);
}

function installCxxAstRuntimeDeps() {
    if (!existsSync(join(cxxAstRuntimeRoot(), 'package.json'))) {
        return false;
    }
    runCommand('npm', ['--prefix', 'packages/cxx-ast-parser', 'install'], { cwd: getProjectRoot() });
    return true;
}

function buildCxxAstRuntimeLib(options = {}) {
    const logPrefix = options.logPrefix ?? '[build:cpp]';
    if (!existsSync(join(cxxAstRuntimeRoot(), 'package.json'))) {
        console.error(`${logPrefix} packages/cxx-ast-parser not found`);
        process.exit(1);
    }
    installCxxAstRuntimeDeps();
    console.log(`${logPrefix} Building cxx-ast-parser lib (JS wire decoder)...`);
    runCommand('npm', ['--prefix', 'packages/cxx-ast-parser', 'run', 'build'], { cwd: getProjectRoot() });
}

function syncCxxAstRuntimeLibIfStale() {
    if (!existsSync(join(cxxAstRuntimeRoot(), 'package.json'))) {
        return;
    }
    if (!cxxAstRuntimeLibNeedsRebuild()) {
        return;
    }
    buildCxxAstRuntimeLib({ logPrefix: '[vitest]' });
}

function buildLocalCxxAstRuntimePackage() {
    if (!existsSync(join(cxxAstRuntimeRoot(), 'package.json'))) {
        return false;
    }
    console.log('[cppPackUtils] Building local packages/cxx-ast-parser...');
    if (!runFlatcCodegen({ logPrefix: '[cppPackUtils]', exitOnError: false })) {
        console.error(
            '[cppPackUtils] flatGenerated outputs missing and flatc codegen failed. Run: npm run build:cpp',
        );
        return false;
    }
    buildCxxAstRuntimeLib({ logPrefix: '[cppPackUtils]' });
    if (!installLocalCxxAstRuntimePackage()) {
        return false;
    }
    if (!isCxxAstRuntimeLoadable()) {
        console.error('[cppPackUtils] linked packages/cxx-ast-parser but require(@arkanalyzer/cxx-ast-parser) failed');
        return false;
    }
    return true;
}

function ensureCxxAstRuntimeInstalled() {
    if (isCxxAstRuntimeLoadable()) {
        return;
    }
    const hasLocalPackage = existsSync(join(cxxAstRuntimeRoot(), 'package.json'));
    if (hasLocalPackage) {
        if (installLocalCxxAstRuntimePackage() && isCxxAstRuntimeLoadable()) {
            console.log('[cppPackUtils] @arkanalyzer/cxx-ast-parser linked from packages/cxx-ast-parser');
            return;
        }
        if (!buildLocalCxxAstRuntimePackage()) {
            console.error('[cppPackUtils] Failed to build/link local packages/cxx-ast-parser');
            process.exit(1);
        }
        console.log('[cppPackUtils] @arkanalyzer/cxx-ast-parser linked from packages/cxx-ast-parser');
        return;
    }
    const version = readCxxAstRuntimeVersion();
    const platformPkg = platformPackageNameForCurrentPlatform();
    console.log(`[cppPackUtils] Trying registry ${platformPkg}@${version}...`);
    if (
        runCommandOptional('npm', ['install', `${platformPkg}@${version}`, '--no-save'], { cwd: getProjectRoot() }) &&
        isCxxAstRuntimeLoadable()
    ) {
        console.log(`[cppPackUtils] ${platformPkg} installed from registry`);
        return;
    }
    console.error(
        `[cppPackUtils] C++ runtime is not loadable. Run: npm run build:cpp, or npm install ${platformPkg}@${version}`,
    );
    process.exit(1);
}

if (require.main === module) {
    ensureCxxAstRuntimeInstalled();
}

module.exports = {
    CXX_PARSER_PACKAGE,
    getProjectRoot,
    isCppBuildReady,
    spawnCommand,
    runCommand,
    runCommandOptional,
    isCommandAvailable,
    ensureFlatbuffersTools,
    resolveFlatbuffersIncludeDir,
    readPinnedFlatbuffersVersion,
    runFlatcCodegen,
    flatGeneratedOutputDirs,
    flatGeneratedOutputsPresent,
    resolveFlatcCommand,
    ensureCxxAstRuntimeInstalled,
    isCxxAstRuntimeLoadable,
    installCxxAstRuntimeDeps,
    buildCxxAstRuntimeLib,
    syncCxxAstRuntimeLibIfStale,
};
