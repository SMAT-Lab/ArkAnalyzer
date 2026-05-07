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

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';


export interface SdkPaths {
    cxxIncludeDir: string;
    sysrootIncludeDir: string;
    configSiteDirs: string[];
}

export function resolveSdkPaths(): SdkPaths {
    const sdkHome = process.env.OHOS_SDK_HOME;
    if (!sdkHome) {
        return {
            cxxIncludeDir: '',
            sysrootIncludeDir: '',
            configSiteDirs: [],
        };
    }

    const sdkRoot = path.join(sdkHome, 'openharmony');
    const nativeDir = path.join(sdkRoot, 'native');
    const llvmDir = path.join(nativeDir, 'llvm');

    return {
        cxxIncludeDir: path.join(llvmDir, 'include', 'c++', 'v1'),
        sysrootIncludeDir: path.join(nativeDir, 'sysroot', 'usr', 'include'),
        configSiteDirs: discoverConfigSiteDirs(path.join(llvmDir, 'include')),
    };
}

function discoverConfigSiteDirs(llvmIncludeDir: string): string[] {
    if (!fs.existsSync(llvmIncludeDir)) {
        return [];
    }

    const results: string[] = [];
    for (const entry of fs.readdirSync(llvmIncludeDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) {
            continue;
        }
        // OHOS SDK separates __config_site from the main libc++ headers. LibTooling bypasses
        // the Clang driver so target-specific include dirs are not added automatically.
        // Pattern 1: <triplet>/c++/v1/__config_site (e.g. x86_64-unknown-linux-gnu/c++/v1/__config_site)
        // Pattern 2: <target>/include/c++/v1/__config_site (e.g. libcxx-ohos/include/c++/v1/__config_site)
        const candidates = [
            path.join(llvmIncludeDir, entry.name, 'c++', 'v1'),
            path.join(llvmIncludeDir, entry.name, 'include', 'c++', 'v1'),
        ];
        for (const dir of candidates) {
            if (isConfigSiteOnly(dir)) {
                results.push(dir);
            }
        }
    }
    return results;
}

/**
 * Returns true if the directory contains __config_site but NOT __config.
 * Full libc++ copies (containing __config) would conflict with the base c++/v1/ include dir.
 */
function isConfigSiteOnly(dir: string): boolean {
    return fs.existsSync(path.join(dir, '__config_site')) && !fs.existsSync(path.join(dir, '__config'));
}

export function ensureCompileDb(projectDir: string, buildDir: string): void {
    const sdkHome = process.env.OHOS_SDK_HOME;
    if (!sdkHome) {
        return;
    }

    const toolchainFile = path.join(sdkHome, 'openharmony', 'native', 'build', 'cmake', 'ohos.toolchain.cmake');
    if (!fs.existsSync(toolchainFile)) {
        return;
    }

    execSync(
        [
            'cmake',
            `-S "${projectDir}"`,
            `-B "${buildDir}"`,
            '-DOHOS_ARCH=arm64-v8a',
            `-DCMAKE_TOOLCHAIN_FILE="${toolchainFile}"`,
            '-DCMAKE_EXPORT_COMPILE_COMMANDS=ON',
        ].join(' '),
        { stdio: 'pipe' }
    );
}
