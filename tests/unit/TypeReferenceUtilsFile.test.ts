import { SceneConfig } from "../../src/Config";
import { assert, describe, it } from "vitest";
import * as tr from "../../src/utils/typeReferenceUtils";
import { Scene } from "../../src/Scene";
import path from "path";
import { ArkFile } from "../../src/core/model/ArkFile";
import { ArkClass } from "../../src/core/model/ArkClass";

let config: SceneConfig = new SceneConfig();
config.buildFromProjectDir(path.join(__dirname, "../../src/core/graph"));
let scece = new Scene(config);

describe("getArkFileByName Test", () => {
    it('normal case', () => {
        assert.isTrue(tr.getArkFileByName("Cfg.ts", scece) instanceof ArkFile)
    })
    it('no exist case', () => {
        assert.isNull(tr.getArkFileByName("NoExist.ts", scece))
    })
})

describe("resolveClassInstance Test", () => {
    let arkFile = tr.getArkFileByName("ViewTree.ts", scece);
    it('normal case', () => {
        assert.isTrue(tr.resolveClassInstance("ViewTree.ts.ViewTree", arkFile) instanceof ArkClass)
    })
    it('no exist case 1', () => {
        assert.isNull(tr.resolveClassInstance("NoExist.ts", null));
    })
    it('no exist case 2', () => {
        assert.isNull(tr.resolveClassInstance("NoExist.ts", arkFile));
    })
})

describe("typeStrToClassSignature Test", () => {
    it('normal case', () => {
        let cs = tr.typeStrToClassSignature("ViewTree.ts.ViewTree");
        assert.equal(cs.getClassName(), "ViewTree");
        assert.equal(cs.toString(), "@_UnkownProjectName/ViewTree: ViewTree");
    })
})

describe("resolveClassInstanceField Test", () => {
    let arkFile = tr.getArkFileByName("ViewTree.ts", scece);
    it('null case 1', () => {
        assert.isNull(tr.resolveClassInstanceField(["View","nonExistField"], arkFile));
    })
    it('null case 2', () => {
        assert.isEmpty(tr.resolveClassInstanceField(["ViewTree","root","nonExistField"], arkFile));
    })
})

describe("searchImportMessage Test", () => {
    let arkFile = tr.getArkFileByName("Cfg.ts", scece);
    it('normal case', () => {
        if (arkFile == null) {
            assert.isNotNull(arkFile);
            return;
        }
        assert.equal(tr.searchImportMessage(arkFile,"_DEFAULT_ARK_METHOD",tr.matchFunctionInFile),
        "@graph/Cfg: _DEFAULT_ARK_CLASS._DEFAULT_ARK_METHOD()");
    })
    it('nested case', () => {
        if (arkFile == null) {
            assert.isNotNull(arkFile);
            return;
        }
        assert.equal(tr.searchImportMessage(arkFile,"buildArkMethodFromArkClass",tr.matchFunctionInFile),"");
    })
    it('null case', () => {
        if (arkFile == null) {
            assert.isNotNull(arkFile);
            return;
        }
        assert.equal(tr.searchImportMessage(arkFile,"test",tr.matchFunctionInFile),"");
    })
})

describe("resolveNameSpace Test", () => {
    let oc:SceneConfig = new SceneConfig();
    oc.buildFromProjectDir(path.join(__dirname, "../resources/save"));
    let sce = new Scene(oc);
    let arkFile = tr.getArkFileByName("namespaces.ts", sce);
    it('normal case', () => {
        let ns = tr.resolveNameSpace(["Validation", "n3"], arkFile);
        assert.isNotNull(ns);
        assert.equal(ns?.getName(), "Validation");
    })
    it('null case 1', () => {
        let ns = tr.resolveNameSpace([], null);
        assert.isNull(ns);
    })
    it('null case 2', () => {
        let ns = tr.resolveNameSpace(["n1", "n2", "n3"], arkFile);
        assert.isNull(ns);
    })


})



