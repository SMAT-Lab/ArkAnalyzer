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

import { BasicBlock, SceneConfig } from '../../src';
import { Scene } from '../../src';
import { DEFAULT_ARK_METHOD_NAME } from '../../src';
import { Logger, LOG_LEVEL, LOG_MODULE_TYPE } from '../../src';

const logger = Logger.getLogger(LOG_MODULE_TYPE.TOOL, 'CfgTest');
Logger.configure('', LOG_LEVEL.ERROR, LOG_LEVEL.INFO, false);

export class Test {
    public buildScene(): Scene {
        const prjDir = "tests/resources/cfg/for";
        let config: SceneConfig = new SceneConfig();
        config.buildFromProjectDir(prjDir);
        let projectScene: Scene = new Scene();
        projectScene.buildSceneFromProjectDir(config);
        return projectScene;
    }

    public printBlocks(blocks: BasicBlock[]): void {
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            logger.info('block' + i);
            for (const stmt of block.getStmts()) {
                logger.info('  ' + stmt.toString());
            }
            let succesText = 'succes:';
            for (const next of block.getSuccessors()) {
                succesText += blocks.indexOf(next) + ' ';
            }
            let exceptionalSuccesText = 'exceptionalSucces:';
            const exceptionalSucces = block.getExceptionalSuccessorBlocks();
            if (exceptionalSucces !== undefined) {
                for (const exceptionalSucce of exceptionalSucces) {
                    exceptionalSuccesText += blocks.indexOf(exceptionalSucce) + ' ';
                }
            }
            let predsText = 'preds:';
            for (const pred of block.getPredecessors()) {
                predsText += blocks.indexOf(pred) + ' ';
            }
            let exceptionalPredsText = 'exceptionalPreds:';
            const exceptionalPreds = block.getExceptionalPredecessorBlocks();
            if (exceptionalPreds !== undefined) {
                for (const exceptionPred of exceptionalPreds) {
                    exceptionalPredsText += blocks.indexOf(exceptionPred) + ' ';
                }
            }
            logger.info(succesText);
            logger.info(exceptionalSuccesText);
            logger.info(predsText);
            logger.info(exceptionalPredsText);
        }
    }


    public test() {
        let scene = this.buildScene();
        scene.inferTypes();

        for (const arkFile of scene.getFiles()) {
            logger.info('### arkFile: ', arkFile.getName());
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    if (arkMethod.getName() == DEFAULT_ARK_METHOD_NAME) {
                        continue;
                    }
                    logger.info('*** arkMethod: ', arkMethod.getName());

                    const body = arkMethod.getBody();
                    if (body == null) {
                        logger.info('null');
                        continue;
                    }
                    this.printBlocks([...body!.getCfg().getBlocks()]);
                }
            }
        }
    }
}

let t = new Test();
t.test();
