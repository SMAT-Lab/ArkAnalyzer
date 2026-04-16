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


import path from 'path';
import fs from 'fs';

const PHOTOS_REPO = 'https://gitcode.com/openharmony/applications_photos.git';
const OPENCV_REPO = 'https://gitee.com/opencv/opencv.git';
export const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');
export const BASELINE_DIR = path.join(__dirname, 'baseline');
export const RAW_DIR = path.resolve(process.cwd(), 'output', 'raw');
export const REPORTS_DIR = path.resolve(process.cwd(), 'output', 'reports');
export type PerfTarget = 'photos' | 'opencv';

/** Built-in perf fixture: clone URL, local path, baseline summary path, optional C++ compile_commands.json. */
export type PerfProjectConfig = {
    url: string;
    project: string;
    path: string;
    baseline: string;
    ccJsonPath?: string;
};

export const PHOTOS_PROJECT: PerfProjectConfig = {
    url: PHOTOS_REPO,
    project: 'photos',
    path: path.join(FIXTURES_DIR, 'photos'),
    baseline: path.join(BASELINE_DIR, 'photos.json'),
};

export const OPENCV_PROJECT: PerfProjectConfig = {
    url: OPENCV_REPO,
    project: 'opencv',
    path: path.join(FIXTURES_DIR, 'opencv'),
    baseline: path.join(BASELINE_DIR, 'opencv.json'),
    ccJsonPath: path.join(FIXTURES_DIR, 'opencv', 'build_ninja_ccdb', 'compile_commands.json'),
};

export const PROJECTS: PerfProjectConfig[] = [
    PHOTOS_PROJECT,
    OPENCV_PROJECT,
];


export function ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

export async function triggerProjectLevelGc(): Promise<void> {
    if (typeof global.gc !== 'function') {
        console.warn('[GC] Skipped between projects: global.gc is unavailable. Start Node with --expose-gc to enable it.');
        return;
    }
    const before = process.memoryUsage().heapUsed;
    global.gc();
    await new Promise<void>((resolve) => setImmediate(resolve));
    const after = process.memoryUsage().heapUsed;
    console.log(
        `[GC] Between projects reclaimed ${((before - after) / 1024 / 1024).toFixed(2)} MB ` +
        `(heap: ${(before / 1024 / 1024).toFixed(2)} -> ${(after / 1024 / 1024).toFixed(2)} MB)`
    );
}