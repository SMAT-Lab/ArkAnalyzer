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

import {
    ANONYMOUS_METHOD_PREFIX,
    ArkIfStmt, ArkInvokeStmt, ArkReturnVoidStmt, BasicBlock,
    Cfg,
    COMPONENT_LIFECYCLE_METHOD_NAME, CONSTRUCTOR_NAME,
    DummyMainCreater,
    LIFECYCLE_METHOD_NAME, Local,
    Scene,
    SceneConfig, STATIC_INIT_METHOD_NAME,
    Stmt,
} from '../../src/index';
import { assert, beforeAll, describe, expect, it } from 'vitest';
import path from 'path';
import { Sdk } from '../../src/Config';

const SDK_DIR = path.join(__dirname, '../../tests/resources/Sdk');
const sdk: Sdk = {
    name: '',
    path: SDK_DIR,
    moduleName: ''
};

function buildScene(projectPath: string): Scene {
    let config: SceneConfig = new SceneConfig();
    config.buildConfig(projectPath, projectPath, [sdk]);
    config.buildFromProjectDir(projectPath);
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();
    return scene;
}

function getUIAbilityInvokes(stmts: Stmt[]): string[] {
    const result: string[] = [];
    stmts.forEach(s => {
        const invokeExpr = s.getInvokeExpr();
        if (!invokeExpr) {
            return;
        }
        const methodSignature = invokeExpr.getMethodSignature();
        if (LIFECYCLE_METHOD_NAME.includes(methodSignature.getMethodSubSignature().getMethodName())) {
            result.push(methodSignature.toString());
        }
    });
    return result;
}

function getComponentInvokes(stmts: Stmt[]): string[] {
    const result: string[] = [];
    stmts.forEach(s => {
        const invokeExpr = s.getInvokeExpr();
        if (!invokeExpr) {
            return;
        }
        const methodSignature = invokeExpr.getMethodSignature();
        if (COMPONENT_LIFECYCLE_METHOD_NAME.includes(methodSignature.getMethodSubSignature().getMethodName())) {
            result.push(methodSignature.toString());
        }
    });
    return result;
}

function getInvokes(stmts: Stmt[]): string[] {
    const result: string[] = [];
    stmts.forEach(s => {
        const invokeExpr = s.getInvokeExpr();
        if (!invokeExpr) {
            return;
        }
        result.push(invokeExpr.getMethodSignature().toString());
    });
    return result;
}

function getCallBackInvokeStmt(stmts: Stmt[]): Stmt[] {
    return stmts.filter(s => {
        const invokeExpr = s.getInvokeExpr();
        if (!invokeExpr) {
            return false;
        }
        const methodName = invokeExpr.getMethodSignature().getMethodSubSignature().getMethodName();
        return methodName.startsWith(ANONYMOUS_METHOD_PREFIX);
    });
}

function getIfBlocks(cfg: Cfg): BasicBlock[] {
    const result: BasicBlock[] = [];
    for (let bb of cfg.getBlocks()) {
        const stmts = bb.getStmts();
        if (stmts.length !== 1) {
            continue;
        }
        if (stmts[0] instanceof ArkIfStmt) {
            result.push(bb);
        }
    }
    return result;
}

describe('DummyMainTest1: Basic UIAbility and Component', () => {
    let cfg: Cfg;
    const abilityPrefix = '@normal/EntryAbility.ets: EntryAbility';
    const componentPrefix = '@normal/Index.ets: Index';

    beforeAll(() => {
        const scene = buildScene('tests/resources/dummyMain/normal');
        const creater = new DummyMainCreater(scene);
        creater.createDummyMain();
        const dummyMain = creater.getDummyMain();
        cfg = dummyMain.getCfg()!;
    });

    it('case1: Ability LifeCycle', () => {
        const invokes = getUIAbilityInvokes(cfg.getStmts());
        const expected = [
            `${abilityPrefix}.onCreate`, `${abilityPrefix}.onWindowStageCreate`,
            `${abilityPrefix}.onForeground`, `${abilityPrefix}.onBackground`,
            `${abilityPrefix}.onWindowStageDestroy`, `${abilityPrefix}.onDestroy`
        ];
        assert.equal(invokes.length, expected.length);
        for (let index = 0; index < invokes.length; index++) {
            assert.isTrue(invokes[index].startsWith(expected[index]));
        }
    });

    it('case2: Component LifeCycle', () => {
        const invokes = getComponentInvokes(cfg.getStmts());
        const expected = [
            `${componentPrefix}.aboutToAppear`, `${componentPrefix}.build`, `${componentPrefix}.aboutToDisappear`
        ];
        assert.equal(invokes.length, expected.length);
        for (let index = 0; index < invokes.length; index++) {
            assert.isTrue(invokes[index].startsWith(expected[index]));
        }
    });

    it('case3: First Block Stmts', () => {
        const firstBlock = cfg.getStartingBlock()!;
        const invokes = getInvokes(firstBlock.getStmts());
        const expected = [
            `${abilityPrefix}.${STATIC_INIT_METHOD_NAME}`, `${componentPrefix}.${STATIC_INIT_METHOD_NAME}`,
            `${abilityPrefix}.${CONSTRUCTOR_NAME}`, `${componentPrefix}.${CONSTRUCTOR_NAME}`,
            `${abilityPrefix}.onCreate`, `${abilityPrefix}.onWindowStageCreate`, `${componentPrefix}.aboutToAppear`
        ];
        assert.equal(invokes.length, expected.length);
        for (let index = 0; index < invokes.length; index++) {
            assert.isTrue(invokes[index].startsWith(expected[index]));
        }
    });

    it('case4: Last Block Stmts', () => {
        let lastBlock: BasicBlock | undefined;
        cfg.getBlocks()!.forEach(bb => {
            if (bb.getTail() instanceof ArkReturnVoidStmt) {
                lastBlock = bb;
            }
        });
        assert.isDefined(lastBlock);
        const invokes = getInvokes(lastBlock!.getStmts());
        const expected = [
            `${componentPrefix}.aboutToDisappear`,
            `${abilityPrefix}.onWindowStageDestroy`, `${abilityPrefix}.onDestroy`
        ];
        assert.equal(invokes.length, expected.length);
        for (let index = 0; index < invokes.length; index++) {
            assert.isTrue(invokes[index].startsWith(expected[index]));
        }
    });

    it('case5: Whole DummyMain', () => {
        assert.equal(cfg.getBlocks().size, 11);
        const ifBlocks = getIfBlocks(cfg);
        assert.equal(ifBlocks.length, 5);
    });
});

describe('DummyMainTest2: UIAbility with Child UIAbility', () => {
    let cfg: Cfg;
    const parentPrefix = '@child/EntryAbility.ets: EntryAbility';
    const childPrefix = '@child/ChildAbility.ets: ChildAbility';

    beforeAll(() => {
        const scene = buildScene('tests/resources/dummyMain/child');
        const creater = new DummyMainCreater(scene);
        creater.createDummyMain();
        const dummyMain = creater.getDummyMain();
        cfg = dummyMain.getCfg()!;
    });

    it('case1: Ability LifeCycle', () => {
        const invokes = getUIAbilityInvokes(cfg.getStmts());
        const expected = [
            `${childPrefix}.onCreate`, `${parentPrefix}.onCreate`,
            `${childPrefix}.onWindowStageCreate`, `${parentPrefix}.onWindowStageCreate`,
            `${childPrefix}.onForeground`, `${childPrefix}.onBackground`,
            `${parentPrefix}.onForeground`, `${parentPrefix}.onBackground`,
            `${childPrefix}.onWindowStageDestroy`, `${parentPrefix}.onWindowStageDestroy`,
            `${childPrefix}.onDestroy`, `${parentPrefix}.onDestroy`,
        ];
        assert.equal(invokes.length, expected.length);
        for (let index = 0; index < invokes.length; index++) {
            assert.isTrue(invokes[index].startsWith(expected[index]));
        }
    });

    it('case2: Component LifeCycle', () => {
        const invokes = getComponentInvokes(cfg.getStmts());
        assert.equal(invokes.length, 0);
    });

    it('case3: First Block Stmts', () => {
        const firstBlock = cfg.getStartingBlock()!;
        const invokes = getInvokes(firstBlock.getStmts());
        const expected = [
            `${childPrefix}.${STATIC_INIT_METHOD_NAME}`, `${parentPrefix}.${STATIC_INIT_METHOD_NAME}`,
            `${childPrefix}.${CONSTRUCTOR_NAME}`, `${parentPrefix}.${CONSTRUCTOR_NAME}`,
            `${childPrefix}.onCreate`, `${parentPrefix}.onCreate`,
            `${childPrefix}.onWindowStageCreate`, `${parentPrefix}.onWindowStageCreate`,
        ];
        assert.equal(invokes.length, expected.length);
        for (let index = 0; index < invokes.length; index++) {
            assert.isTrue(invokes[index].startsWith(expected[index]));
        }
    });

    it('case4: Last Block Stmts', () => {
        let lastBlock: BasicBlock | undefined;
        cfg.getBlocks()!.forEach(bb => {
            if (bb.getTail() instanceof ArkReturnVoidStmt) {
                lastBlock = bb;
            }
        });
        assert.isDefined(lastBlock);
        const invokes = getInvokes(lastBlock!.getStmts());
        const expected: string[] = [
            `${childPrefix}.onWindowStageDestroy`, `${parentPrefix}.onWindowStageDestroy`,
            `${childPrefix}.onDestroy`, `${parentPrefix}.onDestroy`,
        ];
        assert.equal(invokes.length, expected.length);
        for (let index = 0; index < invokes.length; index++) {
            assert.isTrue(invokes[index].startsWith(expected[index]));
        }
    });

    it('case5: Whole DummyMain', () => {
        assert.equal(cfg.getBlocks().size, 11);
        const ifBlocks = getIfBlocks(cfg);
        assert.equal(ifBlocks.length, 5);
    });
});

describe('DummyMainTest3: UIAbility Lifecycle Call with Args', () => {
    let cfg: Cfg;
    const abilityPrefix1 = '@param/EntryAbility1.ets: EntryAbility1';
    const abilityPrefix2 = '@param/EntryAbility2.ets: EntryAbility2';
    const classCPrefix = '@param/EntryAbility2.ets: A.C';

    beforeAll(() => {
        const scene = buildScene('tests/resources/dummyMain/param');
        const creater = new DummyMainCreater(scene);
        creater.createDummyMain();
        const dummyMain = creater.getDummyMain();
        cfg = dummyMain.getCfg()!;
    });

    it('case1: Ability LifeCycle', () => {
        const invokes = getUIAbilityInvokes(cfg.getStmts());
        const expected = [
            `${abilityPrefix1}.onCreate`, `${abilityPrefix2}.onCreate`,
        ];
        assert.equal(invokes.length, expected.length);
        for (let index = 0; index < invokes.length; index++) {
            assert.isTrue(invokes[index].startsWith(expected[index]));
        }
    });

    it('case2: Component LifeCycle', () => {
        const invokes = getComponentInvokes(cfg.getStmts());
        assert.equal(invokes.length, 0);
    });

    it('case3: First Block Stmts', () => {
        const firstBlock = cfg.getStartingBlock()!;
        const invokes = getInvokes(firstBlock.getStmts());
        const expected = [
            `${abilityPrefix1}.${STATIC_INIT_METHOD_NAME}`, `${abilityPrefix2}.${STATIC_INIT_METHOD_NAME}`, `${classCPrefix}.${STATIC_INIT_METHOD_NAME}`,
            `${abilityPrefix1}.${CONSTRUCTOR_NAME}`, `${abilityPrefix2}.${CONSTRUCTOR_NAME}`,
            `${abilityPrefix1}.onCreate`, `${abilityPrefix2}.onCreate`
        ];
        assert.equal(invokes.length, expected.length);
        for (let index = 0; index < invokes.length; index++) {
            assert.isTrue(invokes[index].startsWith(expected[index]));
        }
    });

    it('case4: Last Block Stmts', () => {
        let lastBlock: BasicBlock | undefined;
        cfg.getBlocks()!.forEach(bb => {
            if (bb.getTail() instanceof ArkReturnVoidStmt) {
                lastBlock = bb;
            }
        });
        assert.isDefined(lastBlock);
        const invokes = getInvokes(lastBlock!.getStmts());
        assert.equal(invokes.length, 0);
    });

    it('case5: Whole DummyMain', () => {
        assert.equal(cfg.getBlocks().size, 3);
        const ifBlocks = getIfBlocks(cfg);
        assert.equal(ifBlocks.length, 1);
    });

    it('case6: LifeCycle Params and Args', () => {
        const stmts = cfg.getStmts();

        const abilityCall1 = stmts.filter(s => s.toString().includes(`${abilityPrefix1}.onCreate`));
        assert.equal(abilityCall1.length, 1);
        assert.isTrue(abilityCall1[0] instanceof ArkInvokeStmt);
        const args1 = (abilityCall1[0] as ArkInvokeStmt).getInvokeExpr().getArgs();
        assert.equal(args1.length, 3);
        const expected1 = ['%2', '%3', '%4'];
        for (let index = 0; index < args1.length; index++) {
            assert.equal((args1[index] as Local).getName(), expected1[index]);
        }

        const abilityCall2 = stmts.filter(s => s.toString().includes(`${abilityPrefix2}.onCreate`));
        assert.equal(abilityCall2.length, 1);
        assert.isTrue(abilityCall2[0] instanceof ArkInvokeStmt);
        const args2 = (abilityCall2[0] as ArkInvokeStmt).getInvokeExpr().getArgs();
        assert.equal(args2.length, 3);
        const expected2 = ['%5', '%6', '%7'];
        for (let index = 0; index < args2.length; index++) {
            assert.equal((args2[index] as Local).getName(), expected2[index]);
        }
    });
});

describe('DummyMainTest4: Callback Methods', () => {
    let cfg: Cfg;

    beforeAll(() => {
        const scene = buildScene('tests/resources/dummyMain/entry_methods_order');
        const creater = new DummyMainCreater(scene);
        creater.createDummyMain();
        const dummyMain = creater.getDummyMain();
        cfg = dummyMain.getCfg()!;
    });

    it('case1: Callback Method Order', () => {
        const callbackMethodCalls = getCallBackInvokeStmt(cfg.getStmts());
        expect(callbackMethodCalls.length).eq(3);
        expect(callbackMethodCalls[0].getInvokeExpr()!.getMethodSignature().getMethodSubSignature().getMethodName()).eq(`%AM0$foo`);
        expect(callbackMethodCalls[1].getInvokeExpr()!.getMethodSignature().getMethodSubSignature().getMethodName()).eq(`%AM0$goo`);
        expect(callbackMethodCalls[2].getInvokeExpr()!.getMethodSignature().getMethodSubSignature().getMethodName()).eq(`%AM0$build`);
    });
});

describe('DummyMainTest5: Static Lifecycle Method', () => {
    let cfg: Cfg;
    const abilityPrefix = '@static/EntryAbility.ets: EntryAbility';

    beforeAll(() => {
        const scene = buildScene('tests/resources/dummyMain/static');
        const creater = new DummyMainCreater(scene);
        creater.createDummyMain();
        const dummyMain = creater.getDummyMain();
        cfg = dummyMain.getCfg()!;
    });

    it('case1: Ability LifeCycle', () => {
        const invokes = getUIAbilityInvokes(cfg.getStmts());
        const expected = [`${abilityPrefix}.[static]onCreate`, `${abilityPrefix}.onDestroy`];
        assert.equal(invokes.length, expected.length);
        for (let index = 0; index < invokes.length; index++) {
            assert.isTrue(invokes[index].startsWith(expected[index]));
        }
    });

    it('case2: Component LifeCycle', () => {
        const invokes = getComponentInvokes(cfg.getStmts());
        assert.equal(invokes.length, 0);
    });

    it('case3: First Block Stmts', () => {
        const firstBlock = cfg.getStartingBlock()!;
        const invokes = getInvokes(firstBlock.getStmts());
        const expected = [
            `${abilityPrefix}.${STATIC_INIT_METHOD_NAME}`,
            `${abilityPrefix}.${CONSTRUCTOR_NAME}`,
            `${abilityPrefix}.[static]onCreate`
        ];
        assert.equal(invokes.length, expected.length);
        for (let index = 0; index < invokes.length; index++) {
            assert.isTrue(invokes[index].startsWith(expected[index]));
        }
    });

    it('case4: Last Block Stmts', () => {
        let lastBlock: BasicBlock | undefined;
        cfg.getBlocks()!.forEach(bb => {
            if (bb.getTail() instanceof ArkReturnVoidStmt) {
                lastBlock = bb;
            }
        });
        assert.isDefined(lastBlock);
        const invokes = getInvokes(lastBlock!.getStmts());
        const expected: string[] = [`${abilityPrefix}.onDestroy`];
        assert.equal(invokes.length, expected.length);
        for (let index = 0; index < invokes.length; index++) {
            assert.isTrue(invokes[index].startsWith(expected[index]));
        }
    });

    it('case5: Whole DummyMain', () => {
        assert.equal(cfg.getBlocks().size, 3);
        const ifBlocks = getIfBlocks(cfg);
        assert.equal(ifBlocks.length, 1);
    });
});