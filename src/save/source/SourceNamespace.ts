import { ArkNamespace } from "../../core/model/ArkNamespace";
import { SourceBase } from "./SourceBase";
import { SourceClass } from "./SourceClass";
import { SourceEnum } from "./SourceEnum";
import { SourceIntf } from "./SourceIntf";
import { SourceExportInfo } from "./SourceModule";

export class SourceNamespace extends SourceBase{
    ns: ArkNamespace;

    public constructor(indent: string, ns: ArkNamespace) {
        super(indent);
        this.ns = ns;
    }

    public dump(): string {
        this.printer.writeIndent().writeSpace(this.modifiersToString(this.ns.getModifiers())).writeLine(`namespace ${this.ns.getName()} {`);
        this.printer.incIndent();

        let items: SourceBase[] = [];

        // print enums
        for (let eNum of this.ns.getEnums()) {
            items.push(new SourceEnum(this.printer.getIndent(), eNum));
        }
        
        // print interface
        for (let intf of this.ns.getInterfaces()) {
            items.push(new SourceIntf(this.printer.getIndent(), intf));
        }
        
        // print class 
        for (let cls of this.ns.getClasses()) {
            items.push(new SourceClass(this.printer.getIndent(), cls));
        }

        // print namespace
        for (let childNs of this.ns.getNamespaces()) {
            items.push(new SourceNamespace(this.printer.getIndent(), childNs));
        }

        // print exportInfos
        for (let exportInfo of this.ns.getExportInfos()) {
            items.push(new SourceExportInfo(this.printer.getIndent(), exportInfo));
        }
        //TODO: fields /methods
        //TODO: sort by lineno
        items.sort();
        items.forEach((v):void => {
            this.printer.write(v.dump());
        });

        this.printer.decIndent();
        this.printer.writeIndent().writeLine('}');

        return this.printer.toString();
    }

    public dumpOriginalCode(): string {
        throw new Error("Method not implemented.");
    }

}