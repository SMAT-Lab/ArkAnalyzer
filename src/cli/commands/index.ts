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

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';

export interface CliCommandModule {
    register(program: Command): void;
}

function isCommandFile(file: string): boolean {
    if (file === 'index.ts' || file === 'index.js') {
        return false;
    }
    if (!/\.(ts|js)$/.test(file)) {
        return false;
    }
    if (file.endsWith('.d.ts')) {
        return false;
    }
    return true;
}

export async function registerCommands(program: Command): Promise<void> {
    const commandsDir = __dirname;
    const files = fs.readdirSync(commandsDir).sort();

    for (const file of files) {
        if (!isCommandFile(file)) {
            continue;
        }

        const abs = path.join(commandsDir, file);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const commandModule = require(abs) as Partial<CliCommandModule>;
        if (typeof commandModule.register === 'function') {
            commandModule.register(program);
        } else {
            console.warn(`Command file ${file} does not export register`);
        }
    }
}
