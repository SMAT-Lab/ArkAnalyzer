import { SceneConfig } from "../../src/Config";
import { assert, describe, it, vi,expect } from "vitest";
import * as tr from "../../src/utils/typeReferenceUtils";
import { Scene } from "../../src/Scene";
import path from "path";

let config: SceneConfig = new SceneConfig();
config.buildFromProjectDir(path.join(__dirname, "../../tests/resources/viewtree"));
let scece = new Scene(config);


describe("ViewTree Test", () => {
    it('test state', async () => {
        let arkFile = tr.getArkFileByName("ControlCenterComponent.ts", scece);
        let arkClass = tr.resolveClassInstance("ControlCenterComponent.ts.ControlCenterComponent", arkFile);
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

    it('test if', async () => {
        let arkFile = tr.getArkFileByName("ParentComponent.ts", scece);
        let arkClass = tr.resolveClassInstance("ParentComponent.ts.ParentComponent", arkFile);
        if (arkClass == null) {
            assert.isNotNull(arkClass);
            return;
        }
        let vt = await arkClass.getViewTree();
        let type = vt.getClassFieldType('countDownStartValue');
        expect(type).equals('ObservedPropertySimple');

        let root = vt.getRoot();
        expect(root.name).equals('Column');
        expect(root.children[3].children[0].children[0].children[0].name).equals('IfBranch');
    })
})
