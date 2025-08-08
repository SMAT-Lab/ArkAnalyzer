/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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
    let printAstExePath = path.join(projectRoot, 'src', 'ast', 'arkCppAstDumper.exe');
    if (!fs.existsSync(printAstExePath)) {
        printAstExePath = path.join(projectRoot, 'lib', 'ast', 'arkCppAstDumper.exe');
    }
    return printAstExePath;
}

const printAstExePath = getPrintAstExePath();

export class ClangPath {
    static WindowsPath = printAstExePath;
    static LinuxPath = '';
    static Unknown = '';
    static protectRoot = projectRoot;
}
