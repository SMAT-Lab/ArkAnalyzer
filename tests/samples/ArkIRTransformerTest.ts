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

import {
    ArkBody,
    LOG_LEVEL,
    LOG_MODULE_TYPE,
    Logger,
    ModelUtils,
    PrinterBuilder,
    Scene,
    SceneConfig,
    Stmt,
} from '../../src';
import { ArkMetadataKind, CommentsMetadata } from '../../src/core/model/ArkMetadata';
import { ArkIRMethodPrinter } from '../../src/save/arkir/ArkIRMethodPrinter';

const logger = Logger.getLogger(LOG_MODULE_TYPE.TOOL, 'ArkIRTransformerTest');
Logger.configure('out/ArkIRTransformerTest.log', LOG_LEVEL.INFO, LOG_LEVEL.INFO, false);

class ArkIRTransformerTest {
    public testStmtsOfSimpleProject() {
        logger.info('testStmtsOfSimpleProject start');

        const projectDir = 'tests/resources/arkIRTransformer/mainModule';
        const sceneConfig: SceneConfig = new SceneConfig({ enableTrailingComments: true, enableLeadingComments: true });
        sceneConfig.buildFromProjectDir(projectDir);

        const scene = new Scene();
        scene.buildSceneFromProjectDir(sceneConfig);
        logger.info('before inferTypes');
        this.printScene(scene);
        scene.inferTypes();
        logger.info('after inferTypes');
        this.printScene(scene);

        logger.info('testStmtsOfSimpleProject end\n');
    }

    public testBuildSceneWithJsonFile(): void {
        logger.info('testBuildSceneWithJsonFile start');

        const configPath = 'tests/resources/arkIRTransformer/ArkIRTransformerTestConfig.json';
        const sceneConfig: SceneConfig = new SceneConfig();
        sceneConfig.buildFromJson(configPath);

        const scene = new Scene();
        scene.buildSceneFromProjectDir(sceneConfig);
        logger.info('before inferTypes');
        this.printScene(scene);
        scene.inferTypes();
        logger.info('after inferTypes');
        this.printScene(scene);

        logger.info('testBuildSceneWithJsonFile end\n');
    }

    public testStmtsOfEtsProject() {
        logger.info('testStmtsOfEtsProject start\n');

        // build config
        const configPath = 'tests/resources/arkIRTransformer/ArkIRTransformerTestConfig.json';
        const sceneConfig: SceneConfig = new SceneConfig();
        sceneConfig.buildFromJson(configPath);

        // build scene
        const scene = new Scene();
        scene.buildBasicInfo(sceneConfig);
        scene.buildScene4HarmonyProject();
        this.printScene(scene);
        scene.inferTypes();
        logger.info('\nafter inferTypes');
        this.printScene(scene);

        logger.info('testStmtsOfEtsProject end\n');
    }

    private printStmts(body: ArkBody): void {
        logger.info('--- threeAddressStmts ---');
        const cfg = body.getCfg();
        for (const threeAddressStmt of cfg.getStmts()) {
            logger.info(`text: '${threeAddressStmt.toString()}'`);
        }
    }

    public printOperandOriginalPositions(stmt: Stmt): void {
        const operandOriginalPositions: any[] = [];
        for (const operand of stmt.getDefAndUses()) {
            const operandOriginalPosition = stmt.getOperandOriginalPosition(operand);
            if (operandOriginalPosition) {
                operandOriginalPositions.push(
                    [operandOriginalPosition.getFirstLine(), operandOriginalPosition.getFirstCol(),
                        operandOriginalPosition.getLastLine(), operandOriginalPosition.getLastCol()]);
            } else {
                operandOriginalPositions.push(operandOriginalPosition);
            }
        }
        logger.info(`operandOriginalPositions: [${operandOriginalPositions.join('], [')}]`);
    }

    public printMetadata(stmt: Stmt): void {
        const leadingCommentsMetadata = stmt.getMetadata(ArkMetadataKind.LEADING_COMMENTS);
        if (leadingCommentsMetadata instanceof CommentsMetadata) {
            const comments = leadingCommentsMetadata.getComments();
            for (const comment of comments) {
                logger.info(`leading comment content: ${comment.content}`);
                logger.info(`leading comment position: ${comment.position.getFirstLine()}:${comment.position.getFirstCol()}-${comment.position.getLastLine()}:${comment.position.getLastCol()}`);
            }
        }
        const trailingCommentsMetadata = stmt.getMetadata(ArkMetadataKind.TRAILING_COMMENTS);
        if (trailingCommentsMetadata instanceof CommentsMetadata) {
            const comments = trailingCommentsMetadata.getComments();
            for (const comment of comments) {
                logger.info(`trailing comment content: ${comment.content}`);
                logger.info(`trailing comment position: ${comment.position.getFirstLine()}:${comment.position.getFirstCol()}-${comment.position.getLastLine()}:${comment.position.getLastCol()}`);
            }
        }
    }

    private printScene(scene: Scene): void {
        for (const arkFile of scene.getFiles()) {
            logger.info('+++++++++++++ arkFile:', arkFile.getFilePath(), ' +++++++++++++');
            for (const arkClass of ModelUtils.getAllClassesInFile(arkFile)) {
                logger.info('========= arkClass:', arkClass.getSignature().toString(), ' =======');
                for (const arkMethod of arkClass.getMethods(true)) {
                    logger.info('***** arkMethod: ', arkMethod.getName());
                    const body = arkMethod.getBody();
                    if (body) {
                        this.printStmts(body);
                        logger.info('-- locals:');
                        body.getLocals().forEach(local => {
                            logger.info(`name: ${local.getName()}, type: ${local.getType()}`);
                        });
                        logger.info('-- usedGlobals:');
                        body.getUsedGlobals()?.forEach(usedGlobalName => {
                            logger.info(`name: ${usedGlobalName}`);
                        });
                    }
                }
            }
        }
    }

    public printCfg() {
        logger.info('printCfg start');
        const projectDir = 'tests/resources/arkIRTransformer/mainModule';
        const sceneConfig: SceneConfig = new SceneConfig();
        sceneConfig.buildFromProjectDir(projectDir);
        const scene = new Scene();
        scene.buildSceneFromProjectDir(sceneConfig);

        const printerBuilder = new PrinterBuilder('out');
        for (const arkFile of scene.getFiles()) {
            printerBuilder.dumpToDot(arkFile);
        }
        logger.info('printCfg end');
    }

    public printIR(): void {
        logger.info('printIR start');

        const configJsonPath = 'tests/resources/arkIRTransformer/mainModule';
        const sceneConfig: SceneConfig = new SceneConfig();
        sceneConfig.buildFromProjectDir(configJsonPath);
        const scene = new Scene();
        scene.buildSceneFromProjectDir(sceneConfig);
        scene.inferTypes();

        const printerBuilder = new PrinterBuilder('out');
        for (const arkFile of scene.getFiles()) {
            printerBuilder.dumpToIR(arkFile);

            for (const arkClass of ModelUtils.getAllClassesInFile(arkFile)) {
                logger.info('========= arkClass:', arkClass.getSignature().toString(), ' =======');
                for (const arkMethod of arkClass.getMethods(true)) {
                    logger.info('***** arkMethod: ', arkMethod.getName());
                    const printer = new ArkIRMethodPrinter(arkMethod);
                    logger.info(printer.dump());
                }
            }
        }

        logger.info('printIR end');
    }

    public simpleTest() {
        logger.info('simpleTest start');
        const projectDir = 'tests/resources/arkIRTransformer/mainModule';
        const sceneConfig: SceneConfig = new SceneConfig({ enableTrailingComments: true, enableLeadingComments: true });
        sceneConfig.buildFromProjectDir(projectDir);
        const scene = new Scene();
        scene.buildSceneFromProjectDir(sceneConfig);

        const cfg = scene.getFiles().find((file) => file.getName().endsWith(`main.ts`))
            ?.getClassWithName('Main')
            ?.getMethodWithName('foo')?.getBody()?.getCfg();
        if (cfg) {
            const stmts = cfg.getStmts();
            logger.info(`${stmts}`);
        } else {
            logger.info(`cfg is undefined`);
        }

        logger.info('simpleTest end');
    }
}

const arkIRTransformerTest = new ArkIRTransformerTest();
arkIRTransformerTest.printIR();

