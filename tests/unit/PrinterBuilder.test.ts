import { SceneConfig } from "../../src/Config";
import { PrinterBuilder } from "../../src/save/PrinterBuilder";
import { assert, describe, expect, it, vi } from "vitest";
import { getArkFileByName } from "../../src/utils/typeReferenceUtils";
import { Scene } from "../../src/Scene";
import path from "path";
import fs from "fs";
import { SourcePrinter } from "../../src/save/source/SourcePrinter";
import { ArkStream } from "../../src/save/ArkStream";
import { SourceDefaultClass } from "../../src/save/source/SourceClass";

let config: SceneConfig = new SceneConfig();
config.buildFromProjectDir(path.join(__dirname, "../resources/save"));
let scece = new Scene(config);
let arkfile = getArkFileByName("namespaces.ts", scece);

describe("PrinterBuilder Test", () => {
    let outputDir = "tests/resources/output";

    it('dumpToDot case 1', () => {
        if (arkfile == null) {
            assert.isNotNull(arkfile);
            return;
        }
        let printer = new PrinterBuilder();
        let file = outputDir + "/dumpDot.dot";
        printer.dumpToDot(arkfile, file);
        setTimeout(() => fs.access(file, fs.constants.F_OK, (err) => assert.isNull(err)), 100);
    })
    it('dumpToDot case 2', () => {
        if (arkfile == null) {
            assert.isNotNull(arkfile);
            return;
        }
        let printer = new PrinterBuilder();
        printer.dumpToDot(arkfile);
        let file = outputDir + "/namespaces.ts.dot";
        setTimeout(() => fs.access(file, fs.constants.F_OK, (err) => assert.isNull(err)), 100);
    })
    it('dumpToTs case 1', () => {
        if (arkfile == null) {
            assert.isNotNull(arkfile);
            return;
        }
        let printer = new PrinterBuilder();
        printer.dumpToTs(arkfile);
        let file = outputDir + "/namespaces.ts";
        setTimeout(() => fs.access(file, fs.constants.F_OK, (err) => assert.isNull(err)), 100);
    })
    it('dumpToTs case 2', () => {
        arkfile = getArkFileByName("modules.ts", scece);
        if (arkfile == null) {
            assert.isNotNull(arkfile);
            return;
        }
        let file = outputDir + "/modules.ts";
        let printer = new PrinterBuilder();
        printer.dumpToTs(arkfile, file);
        setTimeout(() => fs.access(file, fs.constants.F_OK, (err) => assert.isNull(err)), 100);
    })
    it('dumpToTs case 3', () => {
        let printer = new PrinterBuilder();
        const spy = vi.spyOn(printer, "dumpToTs");
        for (let f of scece.arkFiles) {
            for (let cls of f.getClasses()) {
                if (cls.hasViewTree()) {
                    cls.getViewTree();
                }
            }
            printer.dumpToTs(f);
        }
        expect(spy).toHaveBeenCalledTimes(scece.arkFiles.length);
    })

    it('printOriginalCode case', () => {
        let arkfile = getArkFileByName("basic.ts", scece);
        if (arkfile == null) {
            assert.isNotNull(arkfile);
            return;
        }
        let printer = new SourcePrinter(arkfile);
        let outstream = new ArkStream(fs.createWriteStream("tests/resources/output/basic.code.ts"));
        const spy = vi.spyOn(outstream, "write");
        printer.printOriginalCode(outstream);
        expect(spy).toHaveBeenCalled();
    })
    it('SourceDefaultClass dumpOriginalCode case', () => {
        let config: SceneConfig = new SceneConfig();
        config.buildFromProjectDir(path.join(__dirname, "../../src/core/base"));
        let scece = new Scene(config);
        let arkfile = getArkFileByName("Local.ts", scece);
        if (arkfile == null) {
            assert.isNotNull(arkfile);
            return;
        }
        let cls = arkfile.getClasses()[0];
        if (cls.isDefaultArkClass()) {
            let sdc = new SourceDefaultClass('', arkfile, cls);
            expect(sdc.dump()).match(new RegExp("\n+"));
            expect(sdc.dumpOriginalCode()).match(new RegExp("\n+"));
        }
    })
})


