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

import { LOG_LEVEL, LOG_MODULE_TYPE, Logger, Scene, SceneConfig } from '../../src';

const logPath = 'out/ArkAnalyzer.log';
Logger.configure(logPath, LOG_LEVEL.ERROR, LOG_LEVEL.DEBUG, true);
const logger = Logger.getLogger(LOG_MODULE_TYPE.TOOL, 'SceneTest');

class SceneTest {
    public testETsWholePipline() {
        logger.debug('testETsWholePipline start');
        const buildConfigStartTime = new Date().getTime();
        let { rss: rssStart, heapTotal: heapTotalStart, heapUsed: heapUsedStart } = process.memoryUsage();
        rssStart = Math.round(rssStart / 1024 / 1024);
        heapTotalStart = Math.round(heapTotalStart / 1024 / 1024);
        heapUsedStart = Math.round(heapUsedStart / 1024 / 1024);
        logger.debug(
            `memoryUsage before buildConfig in MB, rss: ${rssStart}, heapTotal: ${heapTotalStart}, heapUsed: ${heapUsedStart}`);

        // build config
        // tests/resources/scene/mainModule
        const configPath = 'tests/resources/scene/SceneTestConfig.json';
        let sceneConfig: SceneConfig = new SceneConfig();
        sceneConfig.buildFromJson(configPath);

        const buildConfigEndTime = new Date().getTime();
        logger.debug('projectFiles cnt:', sceneConfig.getProjectFiles().length);
        logger.debug(`buildConfig took ${(buildConfigEndTime - buildConfigStartTime) / 1000} s`);

        // build scene
        let scene = new Scene();
        scene.buildBasicInfo(sceneConfig);
        scene.buildScene4HarmonyProject();
        let {
            rss: rssBuildSceneEnd,
            heapTotal: heapTotalBuildSceneEnd,
            heapUsed: heapUsedBuildSceneEnd,
        } = process.memoryUsage();
        rssBuildSceneEnd = Math.round(rssBuildSceneEnd / 1024 / 1024);
        heapTotalBuildSceneEnd = Math.round(heapTotalBuildSceneEnd / 1024 / 1024);
        heapUsedBuildSceneEnd = Math.round(heapUsedBuildSceneEnd / 1024 / 1024);
        logger.debug(
            `memoryUsage after buildScene in MB, rss: ${rssBuildSceneEnd}, heapTotal: ${heapTotalBuildSceneEnd}, heapUsed: ${heapUsedBuildSceneEnd}`);
        logger.debug(
            `memoryUsage by buildScene in MB, rss: ${rssBuildSceneEnd - rssStart}, heapTotal: ${heapTotalBuildSceneEnd - heapTotalStart}, heapUsed: ${heapUsedBuildSceneEnd - heapUsedStart}`);
        const buildSceneEndTime = new Date().getTime();
        logger.debug(`buildScene took ${(buildSceneEndTime - buildConfigEndTime) / 1000} s`);

        // infer types
        scene.inferTypes();
        let {
            rss: rssInferTypesEnd,
            heapTotal: heapTotalInferTypesEnd,
            heapUsed: heapUsedInferTypesEnd,
        } = process.memoryUsage();
        rssInferTypesEnd = Math.round(rssInferTypesEnd / 1024 / 1024);
        heapTotalInferTypesEnd = Math.round(heapTotalInferTypesEnd / 1024 / 1024);
        heapUsedInferTypesEnd = Math.round(heapUsedInferTypesEnd / 1024 / 1024);
        logger.debug(
            `memoryUsage after inferTypes in MB, rss: ${rssInferTypesEnd}, heapTotal: ${heapTotalInferTypesEnd}, heapUsed: ${heapUsedInferTypesEnd}`);
        logger.debug(
            `memoryUsage by inferTypes in MB, rss: ${rssInferTypesEnd - rssBuildSceneEnd}, heapTotal: ${heapTotalInferTypesEnd - heapTotalBuildSceneEnd}, heapUsed: ${heapUsedInferTypesEnd - heapUsedBuildSceneEnd}`);
        const inferTypesEndTime = new Date().getTime();
        logger.debug(`inferTypes took ${(inferTypesEndTime - buildSceneEndTime) / 1000} s`);

        // get viewTree
        for (const arkFile of scene.getFiles()) {
            for (const arkClass of arkFile.getClasses()) {
                arkClass.getViewTree()?.getRoot();
            }
        }
        let {
            rss: rssGetViewTreeEnd,
            heapTotal: heapTotalGetViewTreeEnd,
            heapUsed: heapUsedGetViewTreeEnd,
        } = process.memoryUsage();
        rssGetViewTreeEnd = Math.round(rssGetViewTreeEnd / 1024 / 1024);
        heapTotalGetViewTreeEnd = Math.round(heapTotalGetViewTreeEnd / 1024 / 1024);
        heapUsedGetViewTreeEnd = Math.round(heapUsedGetViewTreeEnd / 1024 / 1024);
        logger.debug(
            `memoryUsage after getViewTree in MB, rss: ${rssGetViewTreeEnd}, heapTotal: ${heapTotalGetViewTreeEnd}, heapUsed: ${heapUsedGetViewTreeEnd}`);
        logger.debug(
            `memoryUsage by getViewTree in MB, rss: ${rssGetViewTreeEnd - rssInferTypesEnd}, heapTotal: ${heapTotalGetViewTreeEnd - heapTotalInferTypesEnd}, heapUsed: ${heapUsedGetViewTreeEnd - heapUsedInferTypesEnd}`);
        const getViewTreeEndTime = new Date().getTime();
        logger.debug(`get viewTree took ${(getViewTreeEndTime - inferTypesEndTime) / 1000} s`);

        logger.debug('testETsWholePipline end\n');
    }

    public testSimpleProject() {
        logger.debug('testSimpleProject start');

        // build config
        // 'tests/resources/scene/mainModule';
        const projectDir = 'tests/resources/scene/mainModuleEts';
        const sceneConfig: SceneConfig = new SceneConfig();
        sceneConfig.buildFromProjectDir(projectDir);

        // build scene
        const scene = new Scene();
        scene.buildSceneFromProjectDir(sceneConfig);
        scene.inferTypes();

        // get viewTree
        for (const arkFile of scene.getFiles()) {
            for (const arkClass of arkFile.getClasses()) {
                arkClass.getViewTree();
                logger.debug(`getViewTree of ${arkClass.getName()} done`);
            }
        }

        logger.debug('testSimpleProject end\n');
    }

    public testEtsProject() {
        logger.debug('testEtsProject start');

        // build config
        const configPath = 'tests/resources/scene/SceneTestConfig.json';
        const sceneConfig: SceneConfig = new SceneConfig();
        sceneConfig.buildFromJson(configPath);

        // build scene
        const scene = new Scene();
        scene.buildBasicInfo(sceneConfig);
        scene.buildScene4HarmonyProject();

        logger.debug('testEtsProject end\n');
    }
}

let sceneTest = new SceneTest();
sceneTest.testSimpleProject();