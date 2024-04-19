import { SceneConfig } from "../../src/Config";
import { assert, describe, it, vi,expect } from "vitest";
import * as tr from "../../src/utils/typeReferenceUtils";
import { Scene } from "../../src/Scene";
import path from "path";
import { ViewTree } from "../../src/core/graph/ViewTree";

let config: SceneConfig = new SceneConfig();
config.buildFromProjectDir(path.join(__dirname, "../../src/core/graph"));
let scece = new Scene(config);
let arkFile = tr.getArkFileByName("ViewTree.ts", scece);
let arkClass = tr.resolveClassInstance("ViewTree.ts.ViewTree", arkFile);

describe("getArkFileByName Test", () => {
    if (arkClass == null) {
        assert.isNotNull(arkClass);
        return;
    }
    let arkMethod = arkClass.getMethods()[1];
    it('true case', () => {
        let vt: ViewTree = new ViewTree(arkMethod);
        const spy = vi.spyOn(vt, "isInitialized");
        vt.buildViewTree();
        expect(spy).toHaveBeenCalled();
    })
})
