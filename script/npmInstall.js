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

'use strict';

const { rmDirSafe } = require('./shared/fileUtils');
const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require('path');

const OHOS_TS_MARKER = '.ohos-typescript-version';

/**
 * 检查 ohos-typescript 是否已由本脚本安装完成。
 * 通过 node_modules/ohos-typescript 下的标识文件判断，避免仅依赖版本号（版本不变但内容可能变更）。
 * 若标识存在则跳过安装，包括：1）开发环境已安装 2）bundledDependencies 打包产物。
 */
function isOhosTypescriptInstalled() {
    const markerPath = path.join(__dirname, '../node_modules/ohos-typescript', OHOS_TS_MARKER);
    return fs.existsSync(markerPath);
}

/**
 * 写入安装标识文件，并将 .ohos-typescript-version 追加到 ohos-typescript 的 package.json files
 *（以便父包 npm pack / bundledDependencies 时将该文件打入 tgz）。
 */
function writeInstallMarker() {
    const ohosTsPath = path.join(__dirname, '../node_modules/ohos-typescript');
    const markerPath = path.join(ohosTsPath, OHOS_TS_MARKER);
    if (fs.existsSync(ohosTsPath)) {
        fs.writeFileSync(markerPath, `ohos-typescript-4.9.5-r4-OpenHarmony-6.0-Release`, 'utf-8');
    }
    const pkgPath = path.join(ohosTsPath, 'package.json');
    if (!fs.existsSync(pkgPath)) {
        return;
    }
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (!Array.isArray(pkg.files)) {
        return;
    }
    if (pkg.files.includes(OHOS_TS_MARKER)) {
        return;
    }
    pkg.files.push(OHOS_TS_MARKER);
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + '\n', 'utf8');
    console.log(`[npmInstall] Added '${OHOS_TS_MARKER}' to ohos-typescript package.json "files".`);
}

async function execCommand(command) {
    console.log(command);
    let result = await execSync(command, { encoding: 'utf-8' });
    console.log(result);
}

function removeFolder(folderPath) {
    console.log(`start to remove '${folderPath}'`);
    rmDirSafe(folderPath);
    console.log();
}

async function runCommands() {
    if (isOhosTypescriptInstalled()) {
        console.log('ohos-typescript already installed, skipping npmInstall.');
        return;
    }
    try {
        removeFolder('arktools');
        await execCommand('git clone https://gitee.com/yifei-xue/arktools.git');
        await execCommand('npm install arktools/lib/ohos-typescript-4.9.5-r4-OpenHarmony-6.0-Release.tgz --no-save');
        writeInstallMarker();
        removeFolder('arktools');
    } catch (error) {
        console.error(error);
    }
}

runCommands();