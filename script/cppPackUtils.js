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

const CXX_RUNTIME_PACKAGE = '@arkanalyzer/cxx-ast-runtime';

function getProjectRoot() {
    return join(__dirname, '..');
}

/** True after {@code npm run build:cpp} (or equivalent): addon + runtime lib exist. */
function isCppBuildReady(projectRoot = getProjectRoot()) {
    const dumper = join(projectRoot, 'packages', 'cxx-ast-runtime', 'dumper', 'astJsonDumper.node');
    const runtimeLib = join(projectRoot, 'packages', 'cxx-ast-runtime', 'lib', 'index.js');
    return existsSync(dumper) && existsSync(runtimeLib);
}

module.exports = { CXX_RUNTIME_PACKAGE, getProjectRoot, isCppBuildReady };
