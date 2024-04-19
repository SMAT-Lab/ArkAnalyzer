import { SceneConfig } from "../../src/Config";
import { StaticSingleAssignmentFormer } from "../../src/transformer/StaticSingleAssignmentFormer"
import { assert, describe, it } from "vitest";
import { getArkFileByName, resolveClassInstance } from "../../src/utils/typeReferenceUtils";
import { Scene } from "../../src/Scene";
import path from "path";

describe("StaticSingleAssignmentFormer Test", () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, "../resources/ssa"));
    let scece = new Scene(config);
    let arkClass = resolveClassInstance("main.ts._DEFAULT_ARK_CLASS", getArkFileByName("main.ts", scece));
    it('normal case', () => {
        if (arkClass == null) {
            assert.isNotNull(arkClass);
            return;
        }
        let ssaf = new StaticSingleAssignmentFormer();
        for (const arkMethod of arkClass.getMethods()) {
            if (arkMethod.getName() === '_DEFAULT_ARK_METHOD') {
                continue;
            }
            let locals = arkMethod.getBody().getLocals().size;
            ssaf.transformBody(arkMethod.getBody());
            assert.isTrue(arkMethod.getBody().getLocals().size > locals)
        }

    })

})