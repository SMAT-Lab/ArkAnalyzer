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

import { assert, describe, it } from 'vitest';
import path from 'path';
import { SceneConfig } from '../../src/Config';
import { Scene } from '../../src/Scene';
import { ScenePassMgr } from '../../src/pass/ScenePassMgr';
import ConsoleLogger, { LOG_MODULE_TYPE } from '../../src/utils/logger';
import {
    AbstractExpr,
    AbstractRef,
    ArkAssignStmt,
    ArkClass,
    ArkFile,
    ArkMethod, Constant,
    Local,
    LOG_LEVEL,
    Stmt,
} from '../../src';
import { Dispatch, Dispatcher, StmtInit, ValueInit } from '../../src/pass/Dispatcher';
import Logger from '../../src/utils/logger';
import { ClassCtx, ClassPass, FileCtx, FilePass, MethodCtx, MethodPass } from '../../src/pass/Pass';


ConsoleLogger.configure('', LOG_LEVEL.INFO, LOG_LEVEL.INFO, true);

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'Test');


/**
 * The MethodCounter class extends the MethodPass class and is responsible for counting methods
 * during a method processing operation.
 */
class MethodCounter extends MethodPass {
    run(method: ArkMethod, ctx: MethodCtx): void {
        let counter = ctx.root().get(Counter)!;
        counter.method++;
        logger.info(`method ${method.getName()}`);
    }
}


/**
 * The ClassCounter class extends the ClassPass class and is responsible for counting class
 * during a class processing operation.
 */
class ClassCounter extends ClassPass {
    run(cls: ArkClass, ctx: ClassCtx): void {
        let counter = ctx.upper.upper.get(Counter)!;
        counter.klass++;
        logger.info(`class ${cls.getName()}`);
    }
}


/**
 * The FileCounter class extends the FilePass class and is responsible for counting files
 * during a file processing operation.
 */
class FileCounter extends FilePass {
    run(file: ArkFile, ctx: FileCtx): void {
        let counter = ctx.upper.get(Counter)!;
        counter.file++;
        logger.info(`file ${file.getName()}`);
    }
}

class Counter {
    name = 'counter';
    file: number = 0;
    klass: number = 0;
    method: number = 0;
    stmt: number = 0;
    expr: number = 0;
    ref: number = 0;
    constant: number = 0;
    local: number = 0;
}

/**
 * The InstCounter class extends the Dispatcher class and is responsible for counting various types of statements, expressions,
 * references, constants, and local variables encountered during processing.
 */
class InstCounter extends Dispatcher {
    constructor(ctx: MethodCtx) {
        const stmts: StmtInit[] = [
            [ArkAssignStmt, (v: ArkAssignStmt, ctx: MethodCtx): void => {
                logger.info(`asign ${v}`);
                let counter = ctx.root().get(Counter)!;
                counter.stmt++;
            }],
            [Stmt, [(v: Stmt, ctx: MethodCtx): void => {
                logger.info(`stmt ${v}`);
                let counter = ctx.root().get(Counter)!;
                counter.stmt++;
            }]],
        ];
        const values: ValueInit[] = [
            [AbstractExpr, (v: AbstractExpr, ctx: MethodCtx): void => {
                logger.info(`expr ${v}`);
                let counter = ctx.root().get(Counter)!;
                counter.expr++;
            }],
            [AbstractRef, (v: AbstractRef, ctx: MethodCtx): void => {
                logger.info(`ref ${v}`);
                let counter = ctx.root().get(Counter)!;
                counter.ref++;
            }],
            [Constant, (v: Constant, ctx: MethodCtx): void => {
                logger.info(`constant ${v}`);
                let counter = ctx.root().get(Counter)!;
                counter.constant++;
            }],
            [Local, (v: Local, ctx: MethodCtx): void => {
                logger.info(`local ${v}`);
                let counter = ctx.root().get(Counter)!;
                counter.local++;
            }],
        ];
        super(ctx, new Dispatch(stmts, values));
    }
}

describe('Anonymous Test', () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, '../resources/anonymous'));
    let projectScene: Scene = new Scene();
    projectScene.buildSceneFromProjectDir(config);
    it('iter inst', () => {
        let mgr = new ScenePassMgr({
            passes: {
                file: [FileCounter], klass: [ClassCounter], method: [MethodCounter],
            },
            selectors: {
                file: (scene: Scene): ArkFile[] => {
                    return scene.getFiles().filter(file => file.getName().includes('anonymous'));
                },
            },
            dispatcher: InstCounter,
        });
        let counter = new Counter();
        mgr.sceneContext().set(Counter, counter);
        mgr.run(projectScene);
        logger.info(`counter num ${JSON.stringify(counter)}`);
        assert.equal(projectScene.getMethods().length, 6);
    });

});
