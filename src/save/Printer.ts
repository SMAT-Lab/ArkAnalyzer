import { ArkBody } from '../core/model/ArkBody';
import { ArkClass } from '../core/model/ArkClass';
import { ArkFile } from '../core/model/ArkFile';
import { ArkInterface } from '../core/model/ArkInterface';
import { ArkMethod } from '../core/model/ArkMethod';
import { ArkStream } from './ArkStream';


export abstract class Printer {
    constructor() {

    }

    public printTo(arkFile: ArkFile, streamOut: ArkStream): void {
        this.printImports(arkFile, streamOut);

        // print interface
        for (let intf of arkFile.getInterfaces()) {
            this.printInterface(intf, streamOut);
        }
        
        // print class 
        for (let cls of arkFile.getClasses()) {
            if (cls.isDefault()) {
                this.printMethods(cls, streamOut);
            } else {
                this.printClass(cls, streamOut);
            }
        }
        this.printExports(arkFile, streamOut);
    }

    protected printMethods(cls: ArkClass, streamOut: ArkStream): void {
        for (let method of cls.getMethods()) {
            if (method.isDefault()) {
                this.printBody(method.getBody(), streamOut, true);
            } else {
                this.printMethod(method, streamOut);
            }
        }
    }

    protected abstract printImports(arkFile: ArkFile, streamOut: ArkStream): void;
    protected abstract printExports(arkFile: ArkFile, streamOut: ArkStream): void;
    protected abstract printInterface(cls: ArkInterface, streamOut: ArkStream): void;
    protected abstract printClass(cls: ArkClass, streamOut: ArkStream): void;
    protected abstract printMethod(method: ArkMethod, streamOut: ArkStream): void;
    protected abstract printBody(method: ArkBody, streamOut: ArkStream, isDefault: boolean): void;
}