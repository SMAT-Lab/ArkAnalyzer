/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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
import { SceneConfig } from '../../src';
import { Scene } from '../../src';
import ConsoleLogger, { LOG_MODULE_TYPE } from '../../src/utils/logger';
import { ArkAssignStmt, ArkInvokeStmt, ArkMethod, Constant, Local, LOG_LEVEL } from '../../src';
import Logger from '../../src/utils/logger';
import {
    SceneValidator,
} from '../../src/pass/validators/SceneValidator';
import { MethodCtx } from '../../src/pass/Pass';
import { StmtValidator, SummaryReporter, ValueValidator } from '../../src/pass/validators/Validator';

ConsoleLogger.configure('', LOG_LEVEL.INFO, LOG_LEVEL.INFO, true);

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'Test');

export class ConstValidator extends ValueValidator<Constant> {
    private static readonly INSTANCE = new ConstValidator();

    validate(value: Constant, ctx: SummaryReporter): void {
        ctx.info(`constant ${value}`);
    }

    static {
        ConstValidator.register([Constant, (v: Constant, ctx: MethodCtx, mtd: ArkMethod): void => {
            ConstValidator.INSTANCE.run(v, ctx, mtd);
        }]);
    }
}

export class InvokeValidator extends StmtValidator<ArkInvokeStmt> {
    private static readonly INSTANCE = new InvokeValidator();

    validate(value: ArkInvokeStmt, ctx: SummaryReporter): void {
        ctx.info(`invoke ${value}`);
    }

    static {
        InvokeValidator.register([ArkInvokeStmt, (v: ArkInvokeStmt, ctx: MethodCtx, mtd: ArkMethod): void => {
            InvokeValidator.INSTANCE.run(v, ctx, mtd);
        }]);
    }
}

export class AssignValidator extends StmtValidator<ArkAssignStmt> {
    private static readonly INSTANCE = new AssignValidator();

    validate(value: ArkAssignStmt, ctx: SummaryReporter): void {
        let left = value.getLeftOp();
        if (!(left instanceof Local)) {
            ctx.error(`must assign to local`);
        }
    }

    static {
        AssignValidator.register([ArkAssignStmt, (v: ArkAssignStmt, ctx: MethodCtx, mtd: ArkMethod): void => {
            AssignValidator.INSTANCE.run(v, ctx, mtd);
        }]);
    }
}

describe('Anonymous Test', () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, '../resources/anonymous'));
    let projectScene: Scene = new Scene();
    projectScene.buildSceneFromProjectDir(config);
    it('iter inst', () => {
        let mgr = new SceneValidator();
        let summary = mgr.validate(projectScene);
        logger.info(`validated ${JSON.stringify(summary)}`);
        for (const [file, fs] of summary.files) {
            logger.info(`validated file ${JSON.stringify(file.getName())}`);
            for (const [cls, cs] of fs.classes) {
                logger.info(`validated class ${JSON.stringify(cls.getName())}`);
                for (const [mtd, ms] of cs.methods) {
                    logger.info(`validated method ${JSON.stringify(mtd.getName())}`);
                    logger.info(`validated stmt ${ms.stmts.size}`);
                    logger.info(`validated value ${ms.values.size}`);
                }
            }
        }
        assert.equal(projectScene.getMethods().length, 6);
    });

});
