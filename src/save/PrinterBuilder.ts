import fs from 'fs';
import { dirname, join } from 'path';
import { ArkFile } from '../core/model/ArkFile';
import { ArkStream } from './ArkStream';
import { DotPrinter } from './DotPrinter';
import { SourcePrinter } from './source/SourcePrinter';
import { Printer } from './Printer';

export class PrinterBuilder {    
    outputDir: string;
    constructor(outputDir: string='') {
        this.outputDir = outputDir;
    }

    protected getOutputDir(arkFile: ArkFile): string {
        if (this.outputDir === '') {
            return join(arkFile.getProjectDir(), '..', 'output');
        } else {
            return join(this.outputDir);
        }
    }

    public dumpToDot(arkFile: ArkFile): void {
        let filename = join(this.getOutputDir(arkFile), arkFile.getName() +'.dot');
        fs.mkdirSync(dirname(filename), {recursive: true});
        let streamOut = new ArkStream(fs.createWriteStream(filename));
        let printer: Printer = new DotPrinter(arkFile);
        printer.printTo(streamOut);
        streamOut.close();
    }

    public dumpToTs(arkFile: ArkFile): void {
        let filename = join(this.getOutputDir(arkFile), arkFile.getName());        
        fs.mkdirSync(dirname(filename), {recursive: true});
        let streamOut = new ArkStream(fs.createWriteStream(filename));
        let printer: Printer = new SourcePrinter(arkFile);
        printer.printTo(streamOut);
        streamOut.close();
    }
}