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

import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

import { readCppEnvironmentReady } from './script/cpp/vitestCpp.js';

const OHOS_SDK_HOME_DEPENDENT_TEST_FILES = [
    'tests/unit/cppCore/graph/Cfg.test.ts',
    'tests/unit/cppCore/export/ExportInfo.test.ts',
] as const;

const cppEnvironmentReady = readCppEnvironmentReady();
const sdkHome = process.env.OHOS_SDK_HOME?.trim();
const skipCoreCppTests = !cppEnvironmentReady;
const skipOhosSdkHomeDependentTests = cppEnvironmentReady && !sdkHome;

if (!cppEnvironmentReady) {
    console.warn(
        '[vitest] reason=C++ environment not ready; impact=skip tests/unit/cppCore; action=npm run build:cpp to enable C++ tests.',
    );
} else if (!sdkHome) {
    console.warn(
        `[vitest] reason=OHOS_SDK_HOME unset; impact=skip OHOS SDK-dependent tests (${OHOS_SDK_HOME_DEPENDENT_TEST_FILES.join(', ')}); action=export OHOS_SDK_HOME to your SDK root.`,
    );
}

export default defineConfig({
    resolve: {
        alias: {
            '@arkanalyzer/cxx-ast-parser': resolve(__dirname, 'packages/cxx-ast-parser/lib/index.js'),
        },
    },
    test: {
        pool: 'forks',
        setupFiles: ['./tests/unit/vitest.setup.ts'],
        include: ['tests/unit/**/*.test.ts'],
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            ...(skipCoreCppTests ? ['tests/unit/cppCore/**'] : []),
            ...(skipOhosSdkHomeDependentTests ? [...OHOS_SDK_HOME_DEPENDENT_TEST_FILES] : []),
        ],
        coverage: {
            include: ['src/**'],
        },
    },
});
