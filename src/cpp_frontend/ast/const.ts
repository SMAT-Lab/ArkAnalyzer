/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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
import * as os from 'os';
import * as path from 'path';

/** C/C++ implementation file extensions (translation units). */
const CXX_IMPLEMENTATION_EXTENSIONS: readonly string[] = ['.c', '.cc', '.cpp', '.cxx'];

/** C/C++ header extensions. */
const CXX_HEADER_EXTENSIONS: readonly string[] = ['.h', '.hh', '.hpp'];

const CXX_IMPLEMENTATION_EXTENSION_SET: ReadonlySet<string> = new Set(CXX_IMPLEMENTATION_EXTENSIONS);
const CXX_SOURCE_EXTENSION_SET: ReadonlySet<string> = new Set([
    ...CXX_IMPLEMENTATION_EXTENSIONS,
    ...CXX_HEADER_EXTENSIONS,
]);

/**
 * Returns extensions for C/C++ implementation and header files used across the C++ frontend
 * (scanning, SceneConfig defaults, language detection).
 */
export function getCxxSourceFileExtensions(): readonly string[] {
    return [...CXX_IMPLEMENTATION_EXTENSIONS, ...CXX_HEADER_EXTENSIONS];
}

/** Returns a read-only set for fast C/C++ source/header extension checks. */
export function getCxxSourceFileExtensionSet(): ReadonlySet<string> {
    return CXX_SOURCE_EXTENSION_SET;
}

/**
 * Returns extensions for C/C++ translation units only (no headers), e.g. for IR passes that
 * walk implementation files.
 */
export function getCxxImplementationFileExtensions(): readonly string[] {
    return [...CXX_IMPLEMENTATION_EXTENSIONS];
}

/** Returns a read-only set for fast C/C++ implementation-file checks. */
export function getCxxImplementationFileExtensionSet(): ReadonlySet<string> {
    return CXX_IMPLEMENTATION_EXTENSION_SET;
}

export function findProjectRoot(startDIr: string = __dirname): string {
    let dir = path.resolve(startDIr);
    while (true) {
        if (fs.existsSync(path.join(dir, 'package.json'))) {
            return dir;
        }
        const parentDIr = path.dirname(dir);
        if (parentDIr === dir) {
            return dir;
        }
        dir = parentDIr;
    }
}

const projectRoot = findProjectRoot(__dirname);

function getPrintAstExePath(): string {
    let printAstExePath = path.join(projectRoot, 'src', 'cpp_frontend', 'ast', 'dumper', 'astJsonDumper.exe');
    if (!fs.existsSync(printAstExePath)) {
        printAstExePath = path.join(projectRoot, 'lib', 'ast', 'astJsonDumper.exe');
    }
    return printAstExePath;
}

function getPrintAstExePathLinux(): string {
    let printAstExePath = path.join(projectRoot, 'src', 'cpp_frontend', 'ast', 'dumper', 'astJsonDumper');
    if (!fs.existsSync(printAstExePath)) {
        printAstExePath = path.join(projectRoot, 'lib', 'ast', 'astJsonDumper');
    }
    return printAstExePath;
}

const printAstExePath = getPrintAstExePath();
const printAstExePathLinux = getPrintAstExePathLinux();

/**
 * Resolved path to the astJsonDumper executable for the current OS (Windows: .exe under dumper/ or lib/ast/).
 */
export function getAstJsonDumperPath(): string {
    return os.platform() === 'win32' ? getPrintAstExePath() : getPrintAstExePathLinux();
}

/** True when the astJsonDumper binary exists at {@link getAstJsonDumperPath}. */
export function isAstJsonDumperAvailable(): boolean {
    return fs.existsSync(getAstJsonDumperPath());
}

export class ClangPath {
    static WindowsPath = printAstExePath;
    static LinuxPath = printAstExePathLinux;
    static Unknown = '';
    static protectRoot = projectRoot;
}
