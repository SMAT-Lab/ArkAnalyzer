import { ArkFile } from '../core/model/ArkFile';
import { ArkStream } from './ArkStream';

export abstract class Printer {
    arkFile: ArkFile;
    constructor(arkFile: ArkFile) {
        this.arkFile = arkFile;
    }
    public abstract printTo(streamOut: ArkStream): void;
}