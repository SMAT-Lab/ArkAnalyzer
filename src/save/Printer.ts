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

    }

}