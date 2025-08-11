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

import fs from 'fs';
import path from 'path';

const BASE_DIR = path.resolve(__dirname, '../../../resources_cpp/cfg');

function generateIndexFile(folderPath: string) {
    const files = fs.readdirSync(folderPath).filter(f => {
        return f.endsWith('.ts') && !f.endsWith('index.ts');
    });

    if (files.length === 0) {
        return;
    }

    const exports = files.map(f => `export * from './${f.replace(/\.ts$/, '')}';`).join('\n');

    const indexPath = path.join(folderPath, 'index.ts');
    fs.writeFileSync(indexPath, exports + '\n', 'utf8');
    console.log(`✅ Generated: ${path.relative(BASE_DIR, indexPath)}`);
}

function walkAndGenerate(baseDir: string):void {
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(baseDir, entry.name);
        if (entry.isDirectory()) {
            generateIndexFile(fullPath);
            walkAndGenerate(fullPath); // recursive for nested folders like lazyImport/case1
        }
    }
}

// run it
walkAndGenerate(BASE_DIR);
