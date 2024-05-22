import { SceneConfig } from "../../src/Config";
import { assert, describe, it, expect } from "vitest";
import { Scene } from "../../src/Scene";
import path from "path";
import { Decorator } from "../../src/core/base/Decorator";

describe("ViewTree Test API12", () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, "../../tests/resources/viewtree/12"));
    let scene = new Scene(config);
    scene.inferTypes();

    it('test __Common__', async () => {
        let arkFile =  scene.getFiles().find(file => file.getName() == 'ControlCenterComponent.ts');
        let arkClass = arkFile?.getClassWithName('OutComponent');
        if (arkClass == null) {
            assert.isNotNull(arkClass);
            return;
        }
        let vt = await arkClass.getViewTree();
        vt.buildViewTree();
        
        let root = vt.getRoot();
        expect(root.name).equals('__Common__');
        expect(root.children[0].name).equals('ViewPU');
    })

    it ('test ForEach', async () => {
        let arkFile =  scene.getFiles().find(file => file.getName() == 'ControlCenterComponent.ts');
        let arkClass = arkFile?.getClassWithName('ControlCenterComplexToggleLayout');
        if (arkClass == null) {
            assert.isNotNull(arkClass);
            return;
        }

        let vt = await arkClass.getViewTree();
        let root = vt.getRoot();
        expect(root.name).eq('Grid');
        expect(root.children[0].name).eq('ForEach');
        expect(root.children[0].children[0].name).eq('GridItem');
    })

    it('test @State', async () => {
        let arkFile =  scene.getFiles().find(file => file.getName() == 'ControlCenterComponent.ts');
        let arkClass = arkFile?.getClassWithName('ControlCenterComponent');
        if (arkClass == null) {
            assert.isNotNull(arkClass);
            return;
        }
        let vt = await arkClass.getViewTree();
        vt.buildViewTree();   

        let type = vt.getClassFieldType('mSimpleToggleColumnCount');
        expect((type as Decorator).getKind()).equals('State');

        let root = vt.getRoot();
        expect(root.name).equals('Column');
        expect(root.children[0].children[0].children[0].children[1].children[0].children[0].children[0].name).equals('Grid');
    })

    it('test If', async () => {
        let arkFile =  scene.getFiles().find(file => file.getName() == 'ParentComponent.ts');
        let arkClass = arkFile?.getClassWithName('ParentComponent');
        if (arkClass == null) {
            assert.isNotNull(arkClass);
            return;
        }
        let vt = await arkClass.getViewTree();
        let type = vt.getClassFieldType('countDownStartValue');

        expect((type as Decorator).getKind()).equals('State'); 

        let root = vt.getRoot();
        expect(root.name).equals('Column');
        expect(root.children[3].children[0].children[0].children[0].name).equals('IfBranch');
    })

    it('test @Builder', async () => {
        let arkFile =  scene.getFiles().find(file => file.getName() == 'Builder.ts');
        let arkClass = arkFile?.getClassWithName('BuilderTest');
        if (arkClass == null) {
            assert.isNotNull(arkClass);
            return;
        }
        let vt = await arkClass.getViewTree();
        let root = vt.getRoot();
        expect(root.children[0].name).eq('Column');
        expect(root.children[0].children[0].name).eq('Text');
        let method = arkClass.getMethodWithName('builderTest');
        if (method) {
            let hasBuilder = false;
            for (let decorator of method.getModifiers()) {
                if (decorator instanceof Decorator) {
                    if (decorator.getKind() == 'Builder') {
                        hasBuilder = true;
                    }
                }
            }
            expect(hasBuilder).eq(true);

        }
    })

    it('test @BuilderParam', async () => {
        let arkFile =  scene.getFiles().find(file => file.getName() == 'SwipeLayout.ts');
        let arkClass = arkFile?.getClassWithName('SwipeLayout');
        if (arkClass == null) {
            assert.isNotNull(arkClass);
            return;
        }
        let vt = await arkClass.getViewTree();
        let type = vt.getClassFieldType('__SurfaceComponent');
        expect((type as Decorator).getKind()).equals('BuilderParam');
        let root = vt.getRoot();
        expect(root.children[0].children[0].children[0].name).equals('BuilderParam');
        expect(root.children[0].children[0].children[0].buildParam).equals('SurfaceComponent');
    })
})


describe("ViewTree Test API9", () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, "../../tests/resources/viewtree/9"));
    let scene = new Scene(config);
    scene.inferTypes();

    it('test __Common__', async () => {
        let arkFile =  scene.getFiles().find(file => file.getName() == 'ControlCenterComponent.ts');
        let arkClass = arkFile?.getClassWithName('OutComponent');
        if (arkClass == null) {
            assert.isNotNull(arkClass);
            return;
        }
        let vt = await arkClass.getViewTree();
        vt.buildViewTree();
        
        let root = vt.getRoot();
        expect(root.name).equals('__Common__');
        expect(root.children[0].name).equals('ViewPU');
    })

    it ('test ForEach', async () => {
        let arkFile =  scene.getFiles().find(file => file.getName() == 'ControlCenterComponent.ts');
        let arkClass = arkFile?.getClassWithName('ControlCenterComplexToggleLayout');
        if (arkClass == null) {
            assert.isNotNull(arkClass);
            return;
        }

        let vt = await arkClass.getViewTree();
        let root = vt.getRoot();
        expect(root.name).eq('Grid');
        expect(root.children[0].name).eq('ForEach');
        expect(root.children[0].children[0].name).eq('GridItem');
    })

    it('test @State', async () => {
        let arkFile =  scene.getFiles().find(file => file.getName() == 'ControlCenterComponent.ts');
        let arkClass = arkFile?.getClassWithName('ControlCenterComponent');
        if (arkClass == null) {
            assert.isNotNull(arkClass);
            return;
        }
        let vt = await arkClass.getViewTree();
        vt.buildViewTree();   

        let type = vt.getClassFieldType('mSimpleToggleColumnCount');
        expect((type as Decorator).getKind()).equals('State');

        let root = vt.getRoot();
        expect(root.name).equals('Column');
        expect(root.children[0].children[0].children[0].children[1].children[0].children[0].children[0].name).equals('Grid');
    })

    it('test If', async () => {
        let arkFile =  scene.getFiles().find(file => file.getName() == 'ParentComponent.ts');
        let arkClass = arkFile?.getClassWithName('ParentComponent');
        if (arkClass == null) {
            assert.isNotNull(arkClass);
            return;
        }
        let vt = await arkClass.getViewTree();
        let type = vt.getClassFieldType('countDownStartValue');

        expect((type as Decorator).getKind()).equals('State'); 

        let root = vt.getRoot();
        expect(root.name).equals('Column');
        expect(root.children[3].children[0].children[0].children[0].name).equals('IfBranch');
    })

    it('test @Builder', async () => {
        let arkFile =  scene.getFiles().find(file => file.getName() == 'ControlCenterComponent.ts');
        let arkClass = arkFile?.getClassWithName('OutComponent');
        if (arkClass == null) {
            assert.isNotNull(arkClass);
            return;
        }
        let vt = await arkClass.getViewTree();
        let method = arkClass.getMethodWithName('builderTest');
        if (method) {
            let hasBuilder = false;
            for (let decorator of method.getModifiers()) {
                if (decorator instanceof Decorator) {
                    if (decorator.getKind() == 'Builder') {
                        hasBuilder = true;
                    }
                }
            }
            expect(hasBuilder).eq(true);
        }
    })

    it('test @BuilderParam', async () => {
        let arkFile =  scene.getFiles().find(file => file.getName() == 'SwipeLayout.ts');
        let arkClass = arkFile?.getClassWithName('SwipeLayout');
        if (arkClass == null) {
            assert.isNotNull(arkClass);
            return;
        }
        let vt = await arkClass.getViewTree();

        let type = vt.getClassFieldType('__SurfaceComponent');
        expect((type as Decorator).getKind()).equals('BuilderParam');
        let root = vt.getRoot();
        expect(root.children[0].children[0].children[0].name).equals('BuilderParam');
        expect(root.children[0].children[0].children[0].buildParam).equals('SurfaceComponent');
    })

    


})
