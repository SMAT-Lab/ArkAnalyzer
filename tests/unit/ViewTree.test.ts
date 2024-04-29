import { SceneConfig } from "../../src/Config";
import { assert, describe, it, vi,expect } from "vitest";
import { Scene } from "../../src/Scene";
import path from "path";

let config: SceneConfig = new SceneConfig();
config.buildFromProjectDir(path.join(__dirname, "../../tests/resources/viewtree"));
let scene = new Scene(config);
scene.inferTypes();


describe("ViewTree Test", () => {
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
        expect(type).equals('@State');

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
        expect(type?.toString()).equals('ObservedPropertySimple');

        let root = vt.getRoot();
        expect(root.name).equals('Column');
        expect(root.children[3].children[0].children[0].children[0].name).equals('IfBranch');
    })

    it('test @Builder', async () => {
        let arkFile =  scene.getFiles().find(file => file.getName() == 'SwipeLayout.ts');
        let arkClass = arkFile?.getClassWithName('SwipeLayout');
        if (arkClass == null) {
            assert.isNotNull(arkClass);
            return;
        }
        let vt = await arkClass.getViewTree();
        let type = vt.getClassFieldType('__SurfaceComponent');
        expect(type).equals('@BuilderParam');
        let root = vt.getRoot();
        expect(root.children[0].children[0].children[0].name).equals('@BuilderParam');
        expect(root.children[0].children[0].children[0].buildParam).equals('SurfaceComponent');
    })
})
