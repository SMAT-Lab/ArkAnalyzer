import fs from 'fs';
import { dirname, join } from 'path';
import { ArkFile } from '../core/model/ArkFile';
import { ArkStream } from './ArkStream';
import { DotPrinter } from './DotPrinter';
import { SourcePrinter } from './source/SourcePrinter';
import { Printer } from './Printer';

export class PrinterBuilder {    
    public static dumpToDot(arkFile: ArkFile): void {
        let filename = join(arkFile.getProjectDir(), 'output', arkFile.getName() +'.dot');
        fs.mkdirSync(dirname(filename), {recursive: true});
        let streamOut = new ArkStream(fs.createWriteStream(filename));
        let printer: Printer = new DotPrinter(arkFile);
        printer.printTo(streamOut);
        streamOut.close();
    }

    public static dumpToTs(arkFile: ArkFile): void {
        let filename = join(arkFile.getProjectDir(), 'output', arkFile.getName());
        fs.mkdirSync(dirname(filename), {recursive: true});
        let streamOut = new ArkStream(fs.createWriteStream(filename));
        let printer: Printer = new SourcePrinter(arkFile);
        printer.printTo(streamOut);
        streamOut.close();
    }
}