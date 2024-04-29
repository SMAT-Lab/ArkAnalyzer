import {SceneConfig} from "../../src/Config";
import {VariablePointerAnalysisAlogorithm as vaa} from "../../src/callgraph/VariablePointerAnalysisAlgorithm";
import {describe, it, assert} from "vitest";
import path from "path";
import {Scene} from "../../src/Scene";

let config: SceneConfig = new SceneConfig();
config.buildFromProjectDir(path.join(__dirname, "../resources/save"));
let scene = new Scene(config);
let arkfile = scene.getFiles().find(file => file.getName() == 'basic.ts');
describe("AnalysisAlgorithm Test", () => {
    let ms = scene.getMethods().map(x => x.getSignature());
    let ch = new vaa(scene);
    it('normal case', () => {
        ch.loadCallGraph(ms);
    })
})