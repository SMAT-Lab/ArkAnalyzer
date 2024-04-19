import { SceneConfig } from "../../src/Config";
import { ClassSignature, FileSignature, MethodSignature } from "../../src/core/model/ArkSignature";
import { MethodSignatureManager, SceneManager, printCallGraphDetails } from "../../src/utils/callGraphUtils";
import { assert, describe, expect, it, vi } from "vitest";
import { Scene } from "../../src/Scene";
import path from "path";

describe("MethodSignatureManager Test", () => {

    it('addToWorkList removeFromWorkList case', () => {
        let test = new MethodSignatureManager();
        let ms = new MethodSignature();
        test.addToWorkList(ms);
        expect(test.workList.length).toBe(1);
        assert.equal(ms, test.findInWorkList(ms));
        test.removeFromWorkList(ms);
        expect(test.workList.length).toBe(0);
    })

    it('addToProcessedList removeFromProcessedList  case', () => {
        let test = new MethodSignatureManager();
        let ms = new MethodSignature();
        test.addToProcessedList(ms);
        let list = test.processedList;
        expect(list.length).toBe(1);
        assert.equal(ms, list[0]);
        test.removeFromProcessedList(ms);
        expect(test.processedList.length).toBe(0);
    })

})


describe("SceneManager Test", () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, "../../src/core/dataflow"));
    let sceneManager = new SceneManager();
    sceneManager.scene = new Scene(config);
    it('get Method case', () => {
        let ms = new MethodSignature();
        assert.isNull(sceneManager.getMethod(ms));
    })

    it('get Class case', () => {
        let clazz = new ClassSignature();
        clazz.setClassName("undefined");
        assert.isNull(sceneManager.getClass(clazz));
        clazz.setClassName("test");
        assert.isNull(sceneManager.getClass(clazz));
    })

    it('get exsit case', () => {
        let clazz = new ClassSignature();
        clazz.setClassName("Edge");
        let file = new FileSignature();
        file.setFileName("Edge.ts");
        file.setProjectName("dataflow");
        clazz.setDeclaringFileSignature(file);
        let res = sceneManager.getExtendedClasses(clazz);
        expect(res.length).toBe(1);
        assert.equal(clazz.toString(), res[0].getSignature().toString());
    })

})

describe("MethodSignatureManager Test", () => {

    it('normal case', () => {
        let set = new Set<MethodSignature>();
        let ms = new MethodSignature();
        set.add(ms);
        let map = new Map();
        map.set(ms, [ms]);
        const printSpy = vi.fn(printCallGraphDetails);
        printSpy(set, map, "");
        expect(printSpy).toBeCalled();
    })
})