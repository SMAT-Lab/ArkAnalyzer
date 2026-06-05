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

import { createRequire } from 'module';

import type { CppAstParams, CppAstResult } from './ArkCxxAstNode';

const nodeRequire = createRequire(__filename);
const DEV_WORKSPACE_PACKAGE = '@arkanalyzer/cxx-ast-parser';

/** Static type of {@link AstParser} from optional {@code @arkanalyzer/cxx-ast-parser}. */
export interface AstParserClass {
    runCppAst(params: CppAstParams): CppAstResult;
}

/** Shape of {@code require('@arkanalyzer/cxx-ast-parser')} (no compile-time package import). */
export interface CxxAstParserModule {
    AstParser: AstParserClass;
    isCppEnvironmentReady(): boolean;
}

/** npm platform package, e.g. {@code @arkanalyzer/cxx-ast-parser-linux-x64} */
export function platformCxxPackageName(): string {
    return cxxAstParserAccess.platformPackageName();
}

/** Load optional C++ parser module (resolved once per process). */
export function requireCxxAstParser(): CxxAstParserModule {
    return cxxAstParserAccess.loadModule();
}

const cxxAstParserAccess = (() => {
    let parserModule: CxxAstParserModule | undefined;
    let parserPackageName: string | undefined;

    function platformPackageName(): string {
        return `@arkanalyzer/cxx-ast-parser-${process.platform}-${process.arch}`;
    }

    function resolvePackageName(): string {
        if (parserPackageName !== undefined) {
            return parserPackageName;
        }
        const platformPkg = platformPackageName();
        for (const name of [platformPkg, DEV_WORKSPACE_PACKAGE]) {
            try {
                nodeRequire.resolve(name);
                parserPackageName = name;
                return name;
            } catch {
                // try next
            }
        }
        throw new Error(
            `C++ AST parser not found. Install ${platformPkg} (same version as arkanalyzer) ` +
                'or run npm run build:cpp in the ArkAnalyzer repo.',
        );
    }

    function loadModule(): CxxAstParserModule {
        if (parserModule !== undefined) {
            return parserModule;
        }
        parserModule = nodeRequire(resolvePackageName()) as CxxAstParserModule;
        return parserModule;
    }

    return { platformPackageName, loadModule };
})();
