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

import path from 'path';
import fs from 'fs';

export class CmakeUtils {

    /**
     * Scan the CMakeLists.txt files in the directory and obtain all dependent header file directories.
     * @param dir - the target project directory.
     * @returns - include directories set by CMakeLists.txt
     */
    public static scanCMakeIncludeDirsOnly(dir: string): string[] {
        const result: string[] = [];

        const cmakePath = path.join(dir, 'CMakeLists.txt');
        if (!fs.existsSync(cmakePath)) {
            // Return early, recurse into subdirectories
            const subdirs = fs
                .readdirSync(dir, { withFileTypes: true })
                .filter(f => f.isDirectory())
                .map(f => path.join(dir, f.name));

            return subdirs.flatMap(subdir => this.scanCMakeIncludeDirsOnly(subdir));
        }

        // Normal processing flow with CMakeLists.txt
        const varTable: Record<string, string> = {
            CMAKE_CURRENT_SOURCE_DIR: dir.replace(/\\/g, '/'),
            PROJECT_SOURCE_DIR: dir.replace(/\\/g, '/'),
        };

        const lines = fs.readFileSync(cmakePath, 'utf-8').split(/\r?\n/);

        for (const line of lines) {
            const s = this.extractSetVar(line);
            if (s) {
                const [name, val] = s;
                varTable[name] = this.resolveCMakeVar(val, varTable);
            }
        }

        const allIncludeArgArrs = this.extractAllIncludeDirs(lines);
        for (const argArr of allIncludeArgArrs) {
            for (let raw of argArr) {
                let resolved = this.resolveCMakeVar(raw, varTable);
                if (/\$\{[A-Za-z_0-9]+\}/.test(resolved)) {
                    continue;
                }
                if (!path.isAbsolute(resolved)) {
                    resolved = path.resolve(dir, resolved);
                }
                result.push(resolved);
            }
        }

        // Recursive subdirectories
        const subdirs = fs
            .readdirSync(dir, { withFileTypes: true })
            .filter(f => f.isDirectory())
            .map(f => path.join(dir, f.name));

        for (const subdir of subdirs) {
            result.push(...this.scanCMakeIncludeDirsOnly(subdir));
        }

        return result;
    }

    /**
     * Get the variable and definition in the set statements, e.g. set(VAR value)
     * @param line - The line content in CMakeLists.
     * @returns - an array containing variable names and set values, or null
     */
    private static extractSetVar(line: string): [string, string] | null {
        const m = line.match(/^\s*set\s*\(\s*([A-Za-z_0-9]+)\s+(.+?)\s*\)$/);
        if (m) {
            const [, varName, value] = m;
            return [varName, value];
        }
        return null;
    }

    /**
     * Recursively parse variables in current CMakeLists.
     * @param val - the definition of variables. e.g. set(VAR value)
     * @param varTable - variable definition record
     * @param depth - current recursive depth
     * @returns - include directory set by Set statement.
     */
    private static resolveCMakeVar(val: string, varTable: Record<string, string>, depth = 0): string {
        if (depth > 10) {
            return val;
        }
        return val.replace(/\$\{([A-Za-z_0-9]+)\}/g, (m, varName) => {
            if (varTable[varName] !== undefined) {
                return this.resolveCMakeVar(varTable[varName], varTable, depth + 1);
            }
            // If it cannot be parsed, return the original string for subsequent filtering purposes
            return m;
        });
    }

    /**
     * Determine whether the current line is the start of include_directories or target_include_directories,
     * If so, enter the collection state and handle scenarios where a single line is immediately closed.
     * @param line - The line content in CMakeLists.
     * @param results - Include directories.
     * @returns new collecting state, funcType, buffer(supporting multi-line parameters).
     */
    private static tryStartCollectingIncludeDirs(
        line: string,
        results: string[][]
    ): {
        collecting: boolean;
        funcType: 'include' | 'target' | null;
        buffer: string[];
    } {
        if (line.startsWith('include_directories(')) {
            let collecting = true;
            let funcType: 'include' | 'target' | null = 'include';
            let buffer = [line];
            if (line.includes(')')) {
                collecting = false;
                results.push(this.parseCMakeArgs(buffer, false));
                buffer = [];
                funcType = null;
            }
            return { collecting, funcType, buffer };
        } else if (line.startsWith('target_include_directories(')) {
            let collecting = true;
            let funcType: 'include' | 'target' | null = 'target';
            let buffer = [line];
            if (line.includes(')')) {
                collecting = false;
                results.push(this.parseCMakeArgs(buffer, true));
                buffer = [];
                funcType = null;
            }
            return { collecting, funcType, buffer };
        } else {
            return { collecting: false, funcType: null, buffer: [] };
        }
    }

    /**
     * Extract all include directories from CMakeLists.
     * @param lines - All lines in CMakeLists.
     * @returns - include Directories.
     */
    private static extractAllIncludeDirs(lines: string[]): string[][] {
        const results: string[][] = [];
        let collecting = false;
        let buffer: string[] = [];
        let funcType: 'include' | 'target' | null = null;

        for (const lineOrig of lines) {
            // remove comments
            const line = lineOrig.replace(/#.*$/, '').trim();
            if (!collecting) {
                const state = this.tryStartCollectingIncludeDirs(line, results);
                collecting = state.collecting;
                funcType = state.funcType;
                buffer = state.buffer;
            } else {
                buffer.push(line);
                if (line.includes(')')) {
                    collecting = false;
                    results.push(this.parseCMakeArgs(buffer, funcType === 'target'));
                    buffer = [];
                    funcType = null;
                }
            }
        }
        return results;
    }

    /**
     * Parse parameters in line buffer.
     * @param buffer - line buffer.
     * @param isTarget - is it a target variable name
     * @returns - parameters.
     */
    private static parseCMakeArgs(buffer: string[], isTarget: boolean): string[] {
        // Join into one line and remove extra line breaks and whitespace
        let line = buffer.join(' ').replace(/\s+/g, ' ');
        // Remove header directives
        const lidx = line.indexOf('(');
        const ridx = line.lastIndexOf(')');
        if (lidx === -1 || ridx === -1) {
            return [];
        }
        line = line.substring(lidx + 1, ridx).trim();
        // Split parameters by quotation marks and spaces
        const args: string[] = [];
        let curr = '';
        let inQuote = false;
        for (let i = 0; i < line.length; ++i) {
            const c = line[i];
            // Handle quotation marks uniformly.
            if (c === '"') {
                if (inQuote) {
                    inQuote = false;
                    args.push(curr);
                    curr = '';
                } else {
                    inQuote = true;
                }
                continue;
            }
            // In quotes: literal append
            if (inQuote) {
                curr += c;
                continue;
            }
            // Not in quotes: space separated, otherwise literal append
            if (/\s/.test(c)) {
                if (curr.length > 0) {
                    args.push(curr);
                    curr = '';
                }
                continue;
            }
            curr += c;
        }
        if (curr.length > 0) {
            args.push(curr);
        }
        if (isTarget) {
            //  skipping the target names and the keywords PUBLIC/PRIVATE/INTERFACE.
            const idx = args.findIndex(a => ['PUBLIC', 'PRIVATE', 'INTERFACE'].includes(a.toUpperCase()));
            if (args.length < 3 || (idx < 1 || idx + 1 >= args.length)) {
                return [];
            }
            return args.slice(idx + 1);
        } else {
            return args;
        }
    }
}