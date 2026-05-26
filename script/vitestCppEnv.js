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

const { resolve } = require('path');

const { getProjectRoot, isCppBuildReady } = require('./cppPackUtils');

const OHOS_SDK_HOME_DEPENDENT_TEST_FILES = [
    'tests/unit/cppCore/graph/Cfg.test.ts',
    'tests/unit/cppCore/export/ExportInfo.test.ts',
];

function loadIsCppEnvironmentReady() {
    for (const spec of [
        '@arkanalyzer/cxx-ast-runtime',
        resolve(getProjectRoot(), 'packages/cxx-ast-runtime/lib/index.js'),
    ]) {
        try {
            const mod = require(spec);
            if (typeof mod.isCppEnvironmentReady === 'function') {
                return mod.isCppEnvironmentReady.bind(mod);
            }
        } catch {
            // try next resolver
        }
    }
    return () => false;
}

/** @returns true when C++ addon and runtime package are loadable (used by vitest.config). */
function readCppEnvironmentReady() {
    return isCppBuildReady() && loadIsCppEnvironmentReady()();
}

/** @returns Vitest C++ env flags (addon + optional runtime package). */
function getVitestCppEnv() {
    const cppEnvironmentReady = readCppEnvironmentReady();
    const sdkHome = process.env.OHOS_SDK_HOME?.trim();
    return {
        cppEnvironmentReady,
        sdkHome,
        skipCoreCppTests: !cppEnvironmentReady,
        skipOhosSdkHomeDependentTests: cppEnvironmentReady && !sdkHome,
        ohosSdkHomeDependentTestFiles: OHOS_SDK_HOME_DEPENDENT_TEST_FILES,
    };
}

function logVitestCppWarnings(env) {
    if (!env.cppEnvironmentReady) {
        console.warn(
            '[vitest] reason=C++ environment not ready; impact=skip tests/unit/cppCore; action=npm run build:cpp to enable C++ tests.',
        );
    } else if (!env.sdkHome) {
        console.warn(
            `[vitest] reason=OHOS_SDK_HOME unset; impact=skip OHOS SDK-dependent tests (${OHOS_SDK_HOME_DEPENDENT_TEST_FILES.join(', ')}); action=export OHOS_SDK_HOME to your SDK root.`,
        );
    }
}

module.exports = { readCppEnvironmentReady, getVitestCppEnv, logVitestCppWarnings };
