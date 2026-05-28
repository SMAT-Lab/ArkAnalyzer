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

'use strict';

const { existsSync } = require('fs');
const { join } = require('path');

const projectRoot = join(__dirname, '..');
const localAddonPath = join(projectRoot, 'packages', 'cxx-ast-runtime', 'dumper', 'astJsonDumper.node');

/**
 * Path A (ArkTS-only): no addon on disk → no cxx-ast-runtime / flatc checks.
 * Path B (after build:cpp or prebuilt addon): ensure @arkanalyzer/cxx-ast-runtime is loadable before vitest.
 */
function prepareVitestCpp() {
    if (!existsSync(localAddonPath)) {
        return;
    }
    const { ensureCxxAstRuntimeInstalled } = require('./ensureCxxAstRuntime');
    ensureCxxAstRuntimeInstalled();
}

prepareVitestCpp();
