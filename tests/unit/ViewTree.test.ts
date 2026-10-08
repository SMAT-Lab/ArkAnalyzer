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

import { SceneConfig } from '../../src/Config';
import { assert, beforeAll, describe, expect, it } from 'vitest';
import { Scene } from '../../src/Scene';
import path from 'path';
import { Decorator } from '../../src/core/base/Decorator';
import { ArkField } from '../../src/core/model/ArkField';
import {
    CommonTest_Expect_ViewTree,
    ControlCenterComplexToggleLayout_Expect_ViewTree,
    ControlCenterComponent_Expect_ViewTree,
    ParentComponent_Expect_ViewTree,
    SelfDepends_Expect_ViewTree,
} from '../resources/viewtree/normal/ExpectView';
import { ViewTreeNode } from '../../src/core/graph/ViewTree';
import {
    ForEachSort_Expect_ViewTree,
    ForEachTest1_Expect_ViewTree,
    ForEachTest2_Expect_ViewTree,
    ForEachTest3_Expect_ViewTree,
} from '../resources/viewtree/control-foreach/ExpectView';
import {
    IfElseTest1_Expect_ViewTree,
    IfElseTest2_Expect_ViewTree,
    IfElseTest3_Expect_ViewTree,
    TernaryIfElseTest_Expect_ViewTree,
} from '../resources/viewtree/control-ifelse/ExpectView';
import { LazyForEachTest_Expect_ViewTree } from '../resources/viewtree/control-lazyforeach/ExpectView';
import {
    RepeatTest1_Expect_ViewTree,
    RepeatTest2_Expect_ViewTree,
} from '../resources/viewtree/control-repeat/ExpectView';
import { ContentSlotTest_Expect_ViewTree } from '../resources/viewtree/control-contentslot/ExpectView';
import {
    BuilderTest_Expect_ViewTree,
    Case1_BuilderTest_Expect_ViewTree,
    Case2_BuilderTest_Expect_ViewTree,
    Case3_BuilderTest_Expect_ViewTree,
    Case_ComplexStateValueTest_Expect_ViewTree,
    Case_moreRootBuilderTest_Expect_ViewTree,
    WaterFlowTest_Expect_ViewTree,
} from '../resources/viewtree/builder/ExpectView';
import {
    BuilderParamTest_Expect_ViewTree,
    Case1_BuilderParamTest_Expect_ViewTree,
    Case2_BuilderParamTest_Expect_ViewTree,
    Case3_BuilderParamTest_Expect_ViewTree,
} from '../resources/viewtree/builderparam/ExpectView';
import {
    TabbarTest_Expect_ViewTree
} from '../resources/viewtree/tabbar/ExpectView';
import {
    bindContextMenuTest_Expect_ViewTree
} from '../resources/viewtree/bindContextMenu/ExpectView';
import {
    bindMenuTest_Expect_ViewTree
} from '../resources/viewtree/bindMenu/ExpectView';
import {
    navDestinationTest_Expect_ViewTree
} from '../resources/viewtree/navDestination/ExpectView';
import {
    bindContentCoverTest_Expect_ViewTree
} from '../resources/viewtree/bindContentCover/ExpectView';
import {
    bindPopupTest_Expect_ViewTree
} from '../resources/viewtree/bindPopup/ExpectView';
import { Project_Page_Expect_ViewTree } from '../resources/viewtree/project/ExpectView';
import { ArkFile, ViewTreePrinter } from '../../src';
import * as crypto from 'crypto';

function expectViewTree(root: ViewTreeNode | null, expectTree: any) {
    if (!root) {
        assert.isDefined(root);
        return;
    }
    if (expectTree.skip) {
        return;
    }
    expect(root.name).eq(expectTree.name);
    expect(root.children.length).eq(expectTree.children.length);
    if (expectTree.attributes) {
        expect(root.attributes.size).eq(expectTree.attributes.length);
        const set = new Set(expectTree.attributes);
        root.attributes.forEach((value, key) => {
            expect(set.has(key)).eq(true);
        });
    }
    if (root.stateValues?.size > 0 || expectTree.stateValues?.length > 0) {
        assert.isDefined(root.stateValues);
        assert.isDefined(expectTree.stateValues);
        expect(root.stateValues.size).eq(expectTree.stateValues.length);
        const set = new Set(expectTree.stateValues);
        root.stateValues.forEach((value) => {
            expect(set.has(value.getName())).eq(true);
        });
    }
    root.children.forEach((value, index) => {
        expectViewTree(value, expectTree.children[index]);
    });
}

function testClassViewTree(arkFile: ArkFile, clsName: string, expectTree: any) {
    let arkClass = arkFile?.getClassWithName(clsName);
    let vt = arkClass?.getViewTree();
    if (!vt) {
        assert.isDefined(vt);
        return;
    }
    expectViewTree(vt.getRoot(), expectTree);
    if (expectTree.total) {
        expect(vt.getStateValues().size).eq(expectTree.total.length);
    }
    return vt;
}

function testNamespaceClassViewTree(arkFile: ArkFile, namespace: string, clsName: string, expectTree: any) {
    let ns = arkFile?.getNamespaceWithName(namespace);
    let arkClass = ns?.getClassWithName(clsName);
    let vt = arkClass?.getViewTree();
    if (!vt) {
        assert.isDefined(vt);
        return;
    }
    expectViewTree(vt.getRoot(), expectTree);
    if (expectTree.total) {
        expect(vt.getStateValues().size).eq(expectTree.total.length);
    }
}

describe('control Test', () => {
    let scene: Scene;

    beforeAll(() => {
        let config: SceneConfig = new SceneConfig();
        config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
        config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree'));
        scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();
    });

    it('test contentslot', async () => {
        const clsName = 'ContentSlotTest';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, ContentSlotTest_Expect_ViewTree);
    });

    it('test foreach1', async () => {
        const clsName = 'ForEachTest1';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, ForEachTest1_Expect_ViewTree);
    });

    it('test foreach2', async () => {
        const clsName = 'ForEachTest2';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, ForEachTest2_Expect_ViewTree);
    });

    it('test foreach3', async () => {
        const clsName = 'ForEachTest3';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, ForEachTest3_Expect_ViewTree);
    });

    it('test foreach4', async () => {
        const clsName = 'ForEachSort';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, ForEachSort_Expect_ViewTree);
    });

    it('test ifelse1', async () => {
        const clsName = 'IfElseTest1';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, IfElseTest1_Expect_ViewTree);
    });

    it('test ifelse2', async () => {
        const clsName = 'IfElseTest2';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, IfElseTest2_Expect_ViewTree);
    });

    it('test ifelse3', async () => {
        const clsName = 'IfElseTest3';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, IfElseTest3_Expect_ViewTree);
    });

    it('test ternary ifelse (UI / mixed / nested / value-in-arg / @Builder)', async () => {
        const clsName = 'TernaryIfElseTest';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, TernaryIfElseTest_Expect_ViewTree);
    });
});

describe('control-lazyforeach Test', () => {
    let scene: Scene;

    beforeAll(() => {
        let config: SceneConfig = new SceneConfig();
        config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
        config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree/control-lazyforeach'));
        scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();
    });

    it('test lazyforeach', async () => {
        const clsName = 'LazyForEachTest';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, LazyForEachTest_Expect_ViewTree);
    });
});

describe('control-repeat Test', () => {
    let scene: Scene;

    beforeAll(() => {
        let config: SceneConfig = new SceneConfig();
        config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
        config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree/control-repeat'));
        scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();
    });

    it('test repeat1', async () => {
        const clsName = 'RepeatTest1';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, RepeatTest1_Expect_ViewTree);
    });

    it('test repeat2', async () => {
        const clsName = 'RepeatTest2';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, RepeatTest2_Expect_ViewTree);
    });
});

describe('builder Test', () => {
    let scene: Scene;

    beforeAll(() => {
        let config: SceneConfig = new SceneConfig();
        config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
        config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree/builder'));
        scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();
    });

    it('test builder', async () => {
        const clsName = 'BuilderTest';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, BuilderTest_Expect_ViewTree);
    });

    it('test builder case1', async () => {
        const nsName = 'Case1';
        const clsName = 'BuilderTest';
        const arkFile = scene.getFiles().find((file) => file.getName() == `${clsName}.ets`)!;
        testNamespaceClassViewTree(arkFile, nsName, clsName, Case1_BuilderTest_Expect_ViewTree);
    });

    it('test builder case2', async () => {
        const nsName = 'Case2';
        const clsName = 'BuilderTest';
        const arkFile = scene.getFiles().find((file) => file.getName() == `${clsName}.ets`)!;
        testNamespaceClassViewTree(arkFile, nsName, clsName, Case2_BuilderTest_Expect_ViewTree);
    });

    it('test builder case3', async () => {
        const nsName = 'Case3';
        const clsName = 'BuilderTest';
        const arkFile = scene.getFiles().find((file) => file.getName() == `${clsName}.ets`)!;
        testNamespaceClassViewTree(arkFile, nsName, clsName, Case3_BuilderTest_Expect_ViewTree);
    });

    it('test WaterFlowTest', async () => {
        let arkFile = scene.getFiles().find((file) => file.getName().endsWith(`BuilderTest.ets`));
        let arkClass = arkFile?.getClassWithName('WaterFlowTest');
        let vt = arkClass?.getViewTree();
        if (!vt) {
            assert.isDefined(vt);
            return;
        }
        expectViewTree(vt.getRoot(), WaterFlowTest_Expect_ViewTree);
    });

    it('test @Builder-function-Decorator', async () => {
        let arkFile = scene.getFiles().find((file) => file.getName() == 'Builder.ets');
        let arkDefaultClass = arkFile?.getDefaultClass();
        let method = arkDefaultClass?.getMethodWithName('childBuilder');
        if (method) {
            let hasBuilder = false;
            for (let decorator of await method.getDecorators()) {
                if (decorator.getKind() == 'Builder') {
                    hasBuilder = true;
                }
            }

            expect(hasBuilder).eq(true);
        }
    });

    it('test moreRootBuilderTest ', async () => {
        let arkFile = scene.getFiles().find((file) => file.getName() == 'Builder.ets');
        let arkDefaultClass = arkFile?.getDefaultClass();
        let method = arkDefaultClass?.getMethodWithName('moreRootBuilderTest');
        if (!method) {
            return;
        }

        let vt = method.getViewTree()!;
        let root = vt.getRoot();
        expectViewTree(root, Case_moreRootBuilderTest_Expect_ViewTree);
    });

    it('test ComplexStateValueTest ', async () => {
        let arkFile = scene.getFiles().find((file) => file.getName() == 'BuilderTest.ets');
        let arkClass = arkFile?.getClassWithName('ComplexStateValueTest');
        let vt = arkClass?.getViewTree()!;
        if (!vt) {
            assert.isDefined(vt);
            return;
        }
        let root = vt.getRoot();
        expectViewTree(root, Case_ComplexStateValueTest_Expect_ViewTree);
    });
});

describe('builderParam Test', () => {
    let scene: Scene;

    beforeAll(() => {
        let config: SceneConfig = new SceneConfig();
        config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
        config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree/builderparam'));
        scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();
    });

    it('test builderparam', async () => {
        const clsName = 'BuilderParamTest';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, BuilderParamTest_Expect_ViewTree);
    });

    it('test builderparam case1', async () => {
        const nsName = 'Case1';
        const clsName = 'BuilderParamTest';
        const arkFile = scene.getFiles().find((file) => file.getName() == `${clsName}.ets`)!;
        testNamespaceClassViewTree(arkFile, nsName, clsName, Case1_BuilderParamTest_Expect_ViewTree);
    });

    // TODO: This use case relies on the ObjectLiteral arrow function parsing
    it('test builderparam case2', async () => {
        const nsName = 'Case2';
        const clsName = 'BuilderParamTest';
        const arkFile = scene.getFiles().find((file) => file.getName() == `${clsName}.ets`)!;
        testNamespaceClassViewTree(arkFile, nsName, clsName, Case2_BuilderParamTest_Expect_ViewTree);
    });

    it('test builderparam case3', async () => {
        const nsName = 'Case3';
        const clsName = 'BuilderParamTest';
        const arkFile = scene.getFiles().find((file) => file.getName() == `${clsName}.ets`)!;
        testNamespaceClassViewTree(arkFile, nsName, clsName, Case3_BuilderParamTest_Expect_ViewTree);
    });
});

describe('localstorage Test', () => {
    let scene: Scene;

    beforeAll(() => {
        let config: SceneConfig = new SceneConfig();
        config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
        config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree/localstorage'));
        scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();
    });

    it('test localstorage case1', async () => {
        let arkFile = scene.getFiles().find((file) => file.getName() == 'LocalStorageTest1.ets');
        let arkClass = arkFile?.getClassWithName('LocalStorageTest1');
        expect(arkClass?.hasEntryDecorator()).eq(true);
        expect(arkClass?.hasComponentDecorator()).eq(true);
    });
});

describe('normal Test', () => {
    let scene: Scene;

    beforeAll(() => {
        let config: SceneConfig = new SceneConfig();
        config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
        config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree/normal'));
        scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();
    });

    it('__Common__ test', async () => {
        const clsName = 'CommonTest';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, CommonTest_Expect_ViewTree);
    });

    it('test ControlCenterComponent', async () => {
        const clsName = 'ControlCenterComponent';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, ControlCenterComponent_Expect_ViewTree);
    });

    it('test ParentComponent', async () => {
        const clsName = 'ParentComponent';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        let vt = testClassViewTree(arkFile, clsName, ParentComponent_Expect_ViewTree);
        let root = vt?.getRoot();
        root?.children[3].stateValuesTransfer?.forEach((value, key) => {
            expect(value.getName()).eq('countDownStartValue');
            expect(key.getName()).eq('count');
        });
    });

    it('test ForEach stateValues', async () => {
        let arkFile = scene.getFiles().find((file) => file.getName() == 'ControlCenterComponent.ets');
        let arkClass = arkFile?.getClassWithName('ControlCenterComplexToggleLayout');
        if (arkClass == null) {
            assert.isNotNull(arkClass);
            return;
        }
        let vt = await arkClass.getViewTree()!;
        let type = vt.getClassFieldType('mComplexToggleLayout');
        expect((type as Decorator).getKind()).equals('StorageLink');
        let stateValues = vt.getStateValues();
        expect(stateValues.size).eq(2);
        expect(stateValues.get(arkClass.getFieldWithName('mComplexToggleLayout') as ArkField)?.size).eq(2);
        expectViewTree(vt.getRoot(), ControlCenterComplexToggleLayout_Expect_ViewTree);
    });

    it('test class.hasEntryDecorator()', async () => {
        let arkFile = scene.getFiles().find((file) => file.getName() == 'ParentComponent.ets');
        let arkClass = arkFile?.getClassWithName('ParentComponent');
        if (arkClass == null) {
            assert.isNotNull(arkClass);
            return;
        }

        let isEntry = arkClass.hasEntryDecorator();
        expect(isEntry).eq(true);
    });

    it('test SelfDepends', async () => {
        const clsName = 'SelfDepends';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, SelfDepends_Expect_ViewTree);
    });
});

describe('project Test', () => {
    let scene: Scene;

    beforeAll(() => {
        let config: SceneConfig = new SceneConfig();
        config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
        config.buildFromJson(path.join(__dirname, '../../tests/resources/viewtree/project/test-config.json'));
        scene = new Scene();
        scene.buildBasicInfo(config);
        scene.buildScene4HarmonyProject();
        scene.inferTypes();
    });

    it('test alias', async () => {
        const clsName = 'Page';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, Project_Page_Expect_ViewTree);
    });

    it('test viewtree dot', async () => {
        let arkFile = scene.getFiles().find((file) => file.getName().endsWith(`Page.ets`));
        let arkClass = arkFile?.getClassWithName('Page');
        let vt = arkClass?.getViewTree();
        if (!vt) {
            assert.isDefined(vt);
            return;
        }
        let printer = new ViewTreePrinter(vt);
        expect(crypto.createHash('sha256').update(printer.dump()).digest('base64url')).eq('gA9b_8g9pqxGE0JjQkK19eC-Rq5LANgG6DuDtq_X8Fo');
    });
});

describe('other Test', () => {
    let scene: Scene;

    beforeAll(() => {
        let config: SceneConfig = new SceneConfig();
        config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
        config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree'));
        scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();
    });

    it('test tabbar TabsExample1', async () => {
        const clsName = 'TabbarTest';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, TabbarTest_Expect_ViewTree);
    });

    it('test bindContextMenuTest', async () => {
        const clsName = 'bindContextMenuTest';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, bindContextMenuTest_Expect_ViewTree);
    });

    it('test bindMenuTest', async () => {
        const clsName = 'bindMenuTest';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, bindMenuTest_Expect_ViewTree);
    });

    it('test navDestinationTest', async () => {
        const clsName = 'navDestinationTest';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, navDestinationTest_Expect_ViewTree);
    });

    it('test bindContentCover', async () => {
        const clsName = 'bindContentCoverTest';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, bindContentCoverTest_Expect_ViewTree);
    });

    it('test bindContentCover', async () => {
        const clsName = 'bindPopupTest';
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`))!;
        testClassViewTree(arkFile, clsName, bindPopupTest_Expect_ViewTree);
    });
});
