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

import { defineConfig } from 'vitest/config';
import { isAstJsonDumperAvailable } from './src/frontend/cppFrontend/ast';

const astJsonDumperAvailable = isAstJsonDumperAvailable();
const sdkHome = process.env.OHOS_SDK_HOME?.trim();

function isDevecoIncludeEnvConfigured(): boolean {
    const c = process.env.DEVECO_C?.trim() ?? '';
    const inc = process.env.DEVECO_INCLUDE?.trim() ?? '';
    const sys = process.env.DEVECO_SYSROOT_INCLUDE?.trim() ?? '';
    return c.length > 0 && inc.length > 0 && sys.length > 0;
}

const devecoIncludeEnvConfigured = isDevecoIncludeEnvConfigured();
const skipCoreCppTests = !astJsonDumperAvailable;

// These two need OHOS include roots: either OHOS_SDK_HOME or all of DEVECO_C / DEVECO_INCLUDE / DEVECO_SYSROOT_INCLUDE.
const skipOhosSdkHomeDependentTests =
    astJsonDumperAvailable && !sdkHome && !devecoIncludeEnvConfigured;

if (!astJsonDumperAvailable) {
    console.warn(
        '[vitest] astJsonDumper.node not found — skipping tests/unit/cppCore (build per src/frontend/cppFrontend/ast/README.md).',
    );
} else if (!sdkHome && !devecoIncludeEnvConfigured) {
    console.warn(
        '[vitest] OHOS_SDK_HOME and DEVECO_C / DEVECO_INCLUDE / DEVECO_SYSROOT_INCLUDE are unset — skipping Cfg.test.ts and ExportInfo.test.ts only.'
    );
}

const OHOS_SDK_HOME_DEPENDENT_TEST_FILES = [
    'tests/unit/cppCore/graph/Cfg.test.ts',
    'tests/unit/cppCore/export/ExportInfo.test.ts',
] as const;

export default defineConfig({
    test: {
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
