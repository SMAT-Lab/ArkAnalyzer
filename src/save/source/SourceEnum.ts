import { Scene } from "../../Scene";
import { ArkEnum } from "../../core/model/ArkEnum";
import { SourceBase } from "./SourceBase";

export class SourceEnum extends SourceBase{
    eNum: ArkEnum;

    public constructor(indent: string, scene: Scene, eNum: ArkEnum) {
        super(indent, scene);
        this.eNum = eNum;
    }

    public getLine(): number {
        return this.eNum.getLine();
    }

    public dump(): string {
        this.printer.writeIndent().writeSpace(this.modifiersToString(this.eNum.getModifiers()))
            .writeLine(`enum ${this.eNum.getName()} {`)
            .incIndent();

        // TODO: initial
        for (let member of this.eNum.getMembers()) {
            if (member.getInitializerType() == 'StringLiteral') {
                this.printer.writeIndent().writeLine(`${member.getMemberName()} = '${member.getInitializer()}',`);
            } else if(member.getInitializerType() == 'FirstLiteralToken') {
                this.printer.writeIndent().writeLine(`${member.getMemberName()} = ${member.getInitializer()},`);
            } else {
                if (member.getInitializerType()) {
                    console.log('SourceEnum->dump:', member);
                }
                this.printer.writeIndent().writeLine(`${member.getMemberName()},`);
            }
        }

        for (let method of this.eNum.getMethods()) {
            // need to print method
            this.printer.writeIndent().writeLine(`${this.methodProtoToString(method)};`);
        }
        
        this.printer.decIndent().writeIndent().writeLine('}');
        return this.printer.toString();
    }
    public dumpOriginalCode(): string {
        return this.eNum.getCode();
    }
}