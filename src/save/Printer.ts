import { ArkClass } from '../core/model/ArkClass';
import { ArkFile } from '../core/model/ArkFile';
import { ArkInterface } from '../core/model/ArkInterface';
import { ArkStream } from './ArkStream';

export abstract class Printer {
    arkFile: ArkFile;

    constructor(arkFile: ArkFile) {
        this.arkFile = arkFile;
    }

    public printTo(streamOut: ArkStream): void {
        this.printStart(streamOut);
        // print interface
        for (let intf of this.arkFile.getInterfaces()) {
            this.printInterface(intf, streamOut);
        }
        
        // print class 
        for (let cls of this.arkFile.getClasses()) {
            this.printClass(cls, streamOut);
        }
        this.printEnd(streamOut);
    }

    protected abstract printStart(streamOut: ArkStream): void;
    protected abstract printInterface(cls: ArkInterface, streamOut: ArkStream): void;
    protected abstract printClass(cls: ArkClass, streamOut: ArkStream): void;
    protected abstract printEnd(streamOut: ArkStream): void;
}