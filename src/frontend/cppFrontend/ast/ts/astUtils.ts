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
import * as path from 'path';

// Module level cache: Sub project root directory (including .cxx directory) -> compile_commands.json absolute path
const ccJsonCache: Map<string, string> = new Map();

export function findProjectRoot(startDir: string = __dirname): string {
    let dir = path.resolve(startDir);
    while (true) {
        if (fs.existsSync(path.join(dir, 'package.json'))) {
            return dir;
        }
        const parentDir = path.dirname(dir);
        if (parentDir === dir) {
            return dir;
        }
        dir = parentDir;
    }
}

/**
 * Resolved path to the astJsonDumper N-API addon ({@code astJsonDumper.node} under dumper/ or lib/ast/).
 */
export function getAstJsonDumperNodePath(): string {
    const projectRoot = findProjectRoot(__dirname);
    const platformArch = `${process.platform}-${process.arch}`;
    const addonPackageName = `@arkanalyzer/ast-addon-${platformArch}`;
    const candidates = [
        path.join(projectRoot, 'src', 'frontend', 'cppFrontend', 'ast', 'dumper', 'astJsonDumper.node'),
        path.join(projectRoot, 'node_modules', addonPackageName, 'runtime', 'astJsonDumper.node'),
        path.join(projectRoot, 'lib', 'ast', 'astJsonDumper.node'), // Backward compatibility with old package layout.
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return candidates[0];
}

/** True when {@link getAstJsonDumperNodePath} exists on disk. */
export function isAstJsonDumperAvailable(): boolean {
    return fs.existsSync(getAstJsonDumperNodePath());
}

/** Project-root anchor for C++ AST output paths (legacy name: historically held Clang binary paths). */
export class ClangPath {
    public static protectRoot = findProjectRoot(__dirname);
}

export function extractAllCppModifiers(code: string): string[] {
    if (!code) {
        return [];
    }
    const cppModifiers = [
        'static',
        'public',
        'private',
        'protected',
        'const',
        'virtual',
        'inline',
        'mutable',
        'explicit',
        'friend',
        'constexpr',
        'volatile'
    ];
    const pattern = new RegExp(`\\b(${cppModifiers.join('|')})\\b`, 'g');
    const matches = code.match(pattern);
    return matches ? matches : [];
}

/**
 * Find the absolute path of compile_commands.json starting from a file path.
 * Strict logic: only traverses upward (ancestors) to find a ".cxx" directory.
 */
export function findCompileCommands(filePath: string): string {
    for (const [projectRoot, jsonPath] of ccJsonCache) {
        if (filePath === projectRoot || filePath.startsWith(projectRoot + path.sep)) {
            return jsonPath;
        }
    }

    let currentDir = path.dirname(filePath);
    while (true) {
        const cxxDir = path.join(currentDir, '.cxx');

        if (fs.existsSync(cxxDir) && fs.statSync(cxxDir).isDirectory()) {
            const result = searchCompileCommandsInDir(cxxDir);
            if (result) {
                ccJsonCache.set(currentDir, result);
                return result;
            }
            return '';
        }

        const parent = path.dirname(currentDir);
        if (parent === currentDir) {
            break;
        }
        currentDir = parent;
    }

    return '';
}

/**
 * Recursively search for compile_commands.json inside .cxx directory.
 */
function searchCompileCommandsInDir(dir: string): string {
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return '';
    }

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name === 'compile_commands.json') {
            return dir;
        }
        if (entry.isDirectory()) {
            const result = searchCompileCommandsInDir(fullPath);
            if (result) {
                return result;
            }
        }
    }
    return '';
}
