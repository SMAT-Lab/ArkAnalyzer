import {SceneConfig} from "../../src/Config";
import {TypeInference} from "../../src/core/common/TypeInference"
import {assert, describe, expect, it, vi} from "vitest";
import {Scene} from "../../src/Scene";
import path from "path";

describe("StaticSingleAssignmentFormer Test", () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, "../resources/save"));
    let scene = new Scene(config);
    let methods = scene.getMethods();
    let ti = new TypeInference(scene);
    it('inferTypeInMethod case', () => {
        if (methods == null) {
            assert.isNotNull(methods);
            return;
        }

        for (const method of methods) {
            const spy = vi.spyOn(method, "getBody");
            ti.inferTypeInMethod(method);
            expect(spy).toHaveBeenCalledTimes(1);
        }
    })
    it('inferSimpleTypeInMethod case', () => {
        if (methods == null) {
            assert.isNotNull(methods);
            return;
        }

        for (const method of methods) {
            const spy = vi.spyOn(method, "getBody");
            ti.inferSimpleTypeInMethod(method);
            expect(spy).toHaveBeenCalledTimes(1);
        }
    })
})