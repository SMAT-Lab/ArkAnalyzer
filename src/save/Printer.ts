import { ArkFile } from '../core/model/ArkFile';
import { ArkStream } from './ArkStream';
import fs from 'fs';
import { dirname, join } from 'path';
import { SourcePrinter } from './source/SourcePrinter';

export abstract class Printer {
    arkFile: ArkFile;
    constructor(arkFile: ArkFile) {
        this.arkFile = arkFile;
    }
    public abstract printTo(streamOut: ArkStream): void;
}