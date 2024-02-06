import { ArkClass } from '../core/model/ArkClass';
import { ArkFile } from '../core/model/ArkFile';
import { ArkInterface } from '../core/model/ArkInterface';
import { ArkStream } from './ArkStream';
import { ArkNamespace } from '../core/model/ArkNamespace';
import { ArkEnum } from '../core/model/ArkEnum';
import { ExportInfo } from '../core/common/ExportBuilder';
import { ImportInfo } from '../core/common/ImportBuilder';

export abstract class Printer {
    arkFile: ArkFile;

    constructor(arkFile: ArkFile) {
        this.arkFile = arkFile;
    }

    public printTo(streamOut: ArkStream): void {
        this.printStart(streamOut);
        // print imports
        for (let info of this.arkFile.getImportInfos()) {
            this.printImportInfo(info, streamOut);
        }
        // print namespace
        for (let ns of this.arkFile.getNamespaces()) {
            this.printNamespace(ns, streamOut);
        }

        // print enums
        for (let eNum of this.arkFile.getEnums()) {
            this.printEnum(eNum, streamOut);
        }

        // print interface
        for (let intf of this.arkFile.getInterfaces()) {
            this.printInterface(intf, streamOut);
        }
        
        // print class 
        for (let cls of this.arkFile.getClasses()) {
            this.printClass(cls, streamOut);
        }
        // print export
        for (let exportInfo of this.arkFile.getExportInfos()) {
            this.printExportInfo(exportInfo, streamOut);
        }

        this.printEnd(streamOut);
    }
    protected printStart(streamOut: ArkStream): void {};
    protected printEnd(streamOut: ArkStream): void {};

    protected abstract printNamespace(ns: ArkNamespace, streamOut: ArkStream): void;
    protected abstract printInterface(cls: ArkInterface, streamOut: ArkStream): void;
    protected abstract printClass(cls: ArkClass, streamOut: ArkStream): void;
    protected abstract printEnum(eNum:ArkEnum, streamOut: ArkStream): void;
    protected abstract printExportInfo(exportInfo: ExportInfo, streamOut: ArkStream): void;
    protected abstract printImportInfo(exportInfo: ImportInfo, streamOut: ArkStream): void;
}