import { ArkFile } from "../../core/model/ArkFile";
import { ArkNamespace } from "../../core/model/ArkNamespace";
import { SourceBase } from "./SourceBase";
import { SourceClass } from "./SourceClass";
import { SourceEnum } from "./SourceEnum";
import { SourceIntf } from "./SourceIntf";
import { SourceExportInfo } from "./SourceModule";

export class SourceNamespace extends SourceBase{
    ns: ArkNamespace;

    public constructor(indent: string, arkFile: ArkFile, ns: ArkNamespace) {
        super(indent, arkFile);
        this.ns = ns;
    }

    public getLine(): number {
        return this.ns.getLine();
    }

    public dump(): string {
        this.printer.writeIndent().writeSpace(this.modifiersToString(this.ns.getModifiers())).writeLine(`namespace ${this.ns.getName()} {`);
        this.printer.incIndent();

        let items: SourceBase[] = [];

        // print enums
        for (let eNum of this.ns.getEnums()) {
            items.push(new SourceEnum(this.printer.getIndent(), this.arkFile, eNum));
        }
        
        // print interface
        for (let intf of this.ns.getInterfaces()) {
            items.push(new SourceIntf(this.printer.getIndent(), this.arkFile, intf));
        }
        
        // print class 
        for (let cls of this.ns.getClasses()) {
            items.push(new SourceClass(this.printer.getIndent(), this.arkFile, cls));
        }

        // print namespace
        for (let childNs of this.ns.getNamespaces()) {
            items.push(new SourceNamespace(this.printer.getIndent(), this.arkFile, childNs));
        }

        // print exportInfos
        for (let exportInfo of this.ns.getExportInfos()) {
            items.push(new SourceExportInfo(this.printer.getIndent(), this.arkFile, exportInfo));
        }
        //TODO: fields /methods
        //TODO: sort by lineno
        items.sort((a, b) => a.getLine() - b.getLine());
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