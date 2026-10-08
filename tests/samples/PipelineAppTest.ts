/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/// Use for auto regression test on pipeline
/// DO NOT change for offline testing

/// Testing target is application photo which getting from
///     git clone -b OpenHarmony-4.1-Release https://gitee.com/openharmony/applications_photos.git
/// Corresponding SDK is OH 4.1 SDK getting from 
///     https://gitee.com/openharmony/docs/blob/master/zh-cn/release-notes/OpenHarmony-v4.1-release.md

import { SceneConfig, Scene } from '../../src';
import { Logger, LOG_LEVEL, LOG_MODULE_TYPE } from '../../src';

const logger = Logger.getLogger(LOG_MODULE_TYPE.TOOL, 'PIPELINETEST');
Logger.configure('', LOG_LEVEL.ERROR, LOG_LEVEL.INFO, false);

let config: SceneConfig = new SceneConfig();
config.buildFromJson('./tests/resources/PipelineAppTestConfig.json');

function assertObj(obj: Object): void {
    const keys = Object.keys(obj);
    const vals = Object.values(obj);
    let idx = 0;
    for (const pair of vals) {
        if (pair.length == 2 && pair[0] != pair[1]) {
            let msg = 'App Tesing: Expected number of ' + keys[idx] + ' is ' + pair[0] + ', but getting ' + pair[1];
            throw new Error(msg);
        }
        idx++;
    }
}

function getScene4Json(config: SceneConfig): Scene {
    let scene: Scene = new Scene();
    scene.buildBasicInfo(config);
    scene.buildScene4HarmonyProject();
    scene.inferTypes();

    return scene;
}

function doValidation(scene: Scene): void {
    // Validation objects. 
    // Array holds two elements:
    //   element[0] is expected value
    //   element[1] is actual value
    // file 数量从 261 -> 262，因为有一个读取失败的文件，旧版本不会加入Scene里，新版本会对其进行注册（有 model、零类、零方法）。
    const obj = {
        filesNumber: [262],
        classesNumber: [1740],
        methodsNumber: [5766],
        customComponentsNumber: [1130]
    }

    let classes = scene.getClasses();
    let files = scene.getFiles();
    let methods = scene.getMethods();
    logger.info(`Actural numbers: File ${files.length}; Class ${classes.length}; Methods ${methods.length}`)

    obj.filesNumber[1] = files.length;

    try {
        assertObj(obj);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }

    logger.info('App Testing: All validation passed');
}

let scene = getScene4Json(config);
doValidation(scene);
