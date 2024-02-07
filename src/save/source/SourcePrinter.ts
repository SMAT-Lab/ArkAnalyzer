
import { ArkStream } from '../ArkStream';
import { Printer } from '../Printer';
import { SourceBase } from './SourceBase';
import { SourceClass, SourceDefaultClass } from './SourceClass';
import { SourceEnum } from './SourceEnum';
import { SourceIntf } from './SourceIntf';
import { SourceExportInfo, SourceImportInfo } from './SourceModule';
import { SourceNamespace } from './SourceNamespace';

export class SourcePrinter extends Printer {
    items: SourceBase[] = [];

    public printTo(streamOut: ArkStream): void {
        // print imports
        for (let info of this.arkFile.getImportInfos()) {
            this.items.push(new SourceImportInfo('', this.arkFile.getScene(), info));
        }
        // print namespace
        for (let ns of this.arkFile.getNamespaces()) {
            this.items.push(new SourceNamespace('', this.arkFile.getScene(), ns));
        }

        // print enums
        for (let eNum of this.arkFile.getEnums()) {
            this.items.push(new SourceEnum('', this.arkFile.getScene(), eNum));
        }

        // print interface
        for (let intf of this.arkFile.getInterfaces()) {
            this.items.push(new SourceIntf('', this.arkFile.getScene(), intf));
        }
        
        // print class 
        for (let cls of this.arkFile.getClasses()) {
            if (cls.isDefaultArkClass()) {
                this.items.push(new SourceDefaultClass('', this.arkFile.getScene(), cls));
            } else {
                this.items.push(new SourceClass('', this.arkFile.getScene(), cls));
            }
        }
        // print export
        for (let info of this.arkFile.getExportInfos()) {
            this.items.push(new SourceExportInfo('', this.arkFile.getScene(), info));
        }

        this.items.sort();
        this.items.sort();
        this.items.forEach((v):void => {
            streamOut.write(v.dump());
        });
    }

    public printOriginalCode(streamOut: ArkStream): void {
        streamOut.write(this.arkFile.getCode());
    }
}