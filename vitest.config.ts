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
import { isAstJsonDumperAvailable } from './src/cpp_frontend/ast/const';

const astJsonDumperAvailable = isAstJsonDumperAvailable();
const sdkHome = process.env.OHOS_SDK_HOME?.trim();

const skipCoreCppTests = !astJsonDumperAvailable || !sdkHome;
if (!astJsonDumperAvailable) {
    console.warn('[vitest] astJsonDumper not found — skipping tests/unit/core_cpp (build src/frontend/cpp_frontend/ast per README).');
} else if (!sdkHome) {
    console.warn('[vitest] OHOS_SDK_HOME is not set — skipping tests/unit/core_cpp (set OHOS SDK path in environment).');
}

export default defineConfig({
    test: {
        include: ['tests/unit/**/*.test.ts'],
        exclude: skipCoreCppTests
            ? ['**/node_modules/**', '**/dist/**', 'tests/unit/core_cpp/**']
            : ['**/node_modules/**', '**/dist/**'],
        coverage: {
            include: ['src/**'],
        },
    },
});
