import { SceneConfig } from "../../src/Config";
import { getArkFileByName } from "../../src/utils/typeReferenceUtils";
import { VariablePointerAnalysisAlogorithm as vaa } from "../../src/callgraph/VariablePointerAnalysisAlgorithm";
import { describe, it, assert } from "vitest";
import path from "path";
import { Scene } from "../../src/Scene";

let config: SceneConfig = new SceneConfig();
config.buildFromProjectDir(path.join(__dirname, "../resources/save"));
let scece = new Scene(config);
let arkfile = getArkFileByName("classes.ts", scece);
describe("AnalysisAlgorithm Test", () => {
    if (arkfile == null) {
        assert.isNotNull(arkfile);
        return;
    }
    let ms = arkfile.getAllMethodsUnderThisFile().map(x => x.getSignature());
    let ch = new vaa(scece);
    it('normal case', () => {
        ch.loadCallGraph(ms);
    })
})