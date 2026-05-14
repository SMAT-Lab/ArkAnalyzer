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

import { getAstJsonDumperNodePath } from '../astUtils';

/**
 * One AST record as delivered by the addon’s per-TU callback (`onFileAst` in native docs).
 * `index` matches the manifest `files` array order.
 */
export type CppAstNapiRecord = {
    index: number;
    exitCode: number;
    payload: string;
};

/** Minimal `exports` shape of `astJsonDumper.node`. */
interface AstJsonDumperAddon {
    parseCppFilesToAst(manifest: string, onRecord: (rec: CppAstNapiRecord) => void): number;
}

/**
 * Runs one C++ AST batch from a serialized manifest (same content as the former worklist file).
 *
 * @returns Native batch status (0 = success convention). Non-number addon results are coerced to 1.
 */
export function callCppAstParser(manifest: string, onRecord: (rec: CppAstNapiRecord) => void): number {
    // LibTooling runs each compile command with the JSON "directory" as CWD; that can mutate the
    // host Node process cwd and break other Vitest files that use relative project paths.
    const savedCwd = process.cwd();
    try {
        const addonPath = getAstJsonDumperNodePath();
        const addon = require(addonPath) as AstJsonDumperAddon;
        const status = addon.parseCppFilesToAst(manifest, onRecord);
        return typeof status === 'number' ? status : 1;
    } finally {
        try {
            process.chdir(savedCwd);
        } catch {
            // Original cwd may no longer exist; avoid masking the real test failure.
        }
    }
}
