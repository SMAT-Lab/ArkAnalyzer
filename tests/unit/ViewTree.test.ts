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
import { assert, describe, expect, it } from 'vitest';
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
import { ViewTreePrinter } from '../../src';
import { CryptoUtils } from '../../src/utils/crypto_utils';

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

function testClassViewTree(scene: Scene, clsName: string, expectTree: any) {
    let arkFile = scene.getFiles().find((file) => file.getName().endsWith(`${clsName}.ets`));
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

function testNamespaceClassViewTree(scene: Scene, namespace: string, clsName: string, expectTree: any) {
    let arkFile = scene.getFiles().find((file) => file.getName() == `${clsName}.ets`);
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

describe('control-contentslot Test', () => {
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
    config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree/control-contentslot'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    it('test contentslot', async () => {
        testClassViewTree(scene, 'ContentSlotTest', ContentSlotTest_Expect_ViewTree);
    });
});

describe('control-foreach Test', () => {
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
    config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree/control-foreach'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    it('test foreach1', async () => {
        testClassViewTree(scene, 'ForEachTest1', ForEachTest1_Expect_ViewTree);
    });

    it('test foreach2', async () => {
        testClassViewTree(scene, 'ForEachTest2', ForEachTest2_Expect_ViewTree);
    });

    it('test foreach3', async () => {
        testClassViewTree(scene, 'ForEachTest3', ForEachTest3_Expect_ViewTree);
    });

    it('test foreach4', async () => {
        testClassViewTree(scene, 'ForEachSort', ForEachSort_Expect_ViewTree);
    });
});

describe('control-ifelse Test', () => {
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
    config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree/control-ifelse'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    it('test ifelse1', async () => {
        testClassViewTree(scene, 'IfElseTest1', IfElseTest1_Expect_ViewTree);
    });

    it('test ifelse2', async () => {
        testClassViewTree(scene, 'IfElseTest2', IfElseTest2_Expect_ViewTree);
    });

    it('test ifelse3', async () => {
        testClassViewTree(scene, 'IfElseTest3', IfElseTest3_Expect_ViewTree);
    });
});

describe('control-lazyforeach Test', () => {
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
    config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree/control-lazyforeach'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    it('test lazyforeach', async () => {
        testClassViewTree(scene, 'LazyForEachTest', LazyForEachTest_Expect_ViewTree);
    });
});

describe('control-repeat Test', () => {
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
    config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree/control-repeat'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    it('test repeat1', async () => {
        testClassViewTree(scene, 'RepeatTest1', RepeatTest1_Expect_ViewTree);
    });

    it('test repeat2', async () => {
        testClassViewTree(scene, 'RepeatTest2', RepeatTest2_Expect_ViewTree);
    });
});

describe('builder Test', () => {
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
    config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree/builder'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    it('test builder', async () => {
        testClassViewTree(scene, 'BuilderTest', BuilderTest_Expect_ViewTree);
    });

    it('test builder case1', async () => {
        testNamespaceClassViewTree(scene, 'Case1', 'BuilderTest', Case1_BuilderTest_Expect_ViewTree);
    });

    it('test builder case2', async () => {
        testNamespaceClassViewTree(scene, 'Case2', 'BuilderTest', Case2_BuilderTest_Expect_ViewTree);
    });

    it('test builder case3', async () => {
        testNamespaceClassViewTree(scene, 'Case3', 'BuilderTest', Case3_BuilderTest_Expect_ViewTree);
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
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
    config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree/builderparam'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    it('test builderparam', async () => {
        testClassViewTree(scene, 'BuilderParamTest', BuilderParamTest_Expect_ViewTree);
    });

    it('test builderparam case1', async () => {
        testNamespaceClassViewTree(scene, 'Case1', 'BuilderParamTest', Case1_BuilderParamTest_Expect_ViewTree);
    });

    // TODO: This use case relies on the ObjectLiteral arrow function parsing
    it('test builderparam case2', async () => {
        testNamespaceClassViewTree(scene, 'Case2', 'BuilderParamTest', Case2_BuilderParamTest_Expect_ViewTree);
    });

    it('test builderparam case3', async () => {
        testNamespaceClassViewTree(scene, 'Case3', 'BuilderParamTest', Case3_BuilderParamTest_Expect_ViewTree);
    });
});

describe('localstorage Test', () => {
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
    config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree/localstorage'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    it('test localstorage case1', async () => {
        let arkFile = scene.getFiles().find((file) => file.getName() == 'LocalStorageTest1.ets');
        let arkClass = arkFile?.getClassWithName('LocalStorageTest1');
        expect(arkClass?.hasEntryDecorator()).eq(true);
        expect(arkClass?.hasComponentDecorator()).eq(true);
    });
});

describe('normal Test', () => {
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
    config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree/normal'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    it('__Common__ test', async () => {
        testClassViewTree(scene, 'CommonTest', CommonTest_Expect_ViewTree);
    });

    it('test ControlCenterComponent', async () => {
        testClassViewTree(scene, 'ControlCenterComponent', ControlCenterComponent_Expect_ViewTree);
    });

    it('test ParentComponent', async () => {
        let vt = testClassViewTree(scene, 'ParentComponent', ParentComponent_Expect_ViewTree);
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
        testClassViewTree(scene, 'SelfDepends', SelfDepends_Expect_ViewTree);
    });
});

describe('project Test', () => {
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
    config.buildFromJson(path.join(__dirname, '../../tests/resources/viewtree/project/test-config.json'));
    let scene: Scene = new Scene();
    scene.buildBasicInfo(config);
    scene.buildScene4HarmonyProject();
    scene.inferTypes();

    it('test alias', async () => {
        testClassViewTree(scene, 'Page', Project_Page_Expect_ViewTree);
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
        expect(CryptoUtils.sha256(printer.dump())).eq('gA9b_8g9pqxGE0JjQkK19eC-Rq5LANgG6DuDtq_X8Fo');
    });
});

describe('tabbar Test', () => {
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
    config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree/tabbar'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    it('test TabsExample1', async () => {
        testClassViewTree(scene, 'TabbarTest', TabbarTest_Expect_ViewTree);
    });
});

describe('bindContextMenu Test', () => {
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
    config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree/bindContextMenu'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    it('test bindContextMenuTest', async () => {
        testClassViewTree(scene, 'bindContextMenuTest', bindContextMenuTest_Expect_ViewTree);
    });
});

describe('bindtMenu Test', () => {
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
    config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree/bindMenu'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    it('test bindMenuTest', async () => {
        testClassViewTree(scene, 'bindMenuTest', bindMenuTest_Expect_ViewTree);
    });
});

describe('navDestion Test', () => {
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
    config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree/navDestination'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    it('test navDestinationTest', async () => {
        testClassViewTree(scene, 'navDestinationTest', navDestinationTest_Expect_ViewTree);
    });
});
describe('bindContentCover Test', () => {
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
    config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree/bindContentCover'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    it('test bindContentCover', async () => {
        testClassViewTree(scene, 'bindContentCoverTest', bindContentCoverTest_Expect_ViewTree);
    });
});

describe('bindPopup Test', () => {
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
    config.buildFromProjectDir(path.join(__dirname, '../../tests/resources/viewtree/bindPopup'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    it('test bindContentCover', async () => {
        testClassViewTree(scene, 'bindPopupTest', bindPopupTest_Expect_ViewTree);
    });
});