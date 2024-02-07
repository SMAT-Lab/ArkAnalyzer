import { InterfaceProperty } from "../../core/common/InterfaceInfoBuilder";
import { ArkInterface } from "../../core/model/ArkInterface";
import { ArkMethod } from "../../core/model/ArkMethod";
import { SourceBase } from "./SourceBase";

export class SourceIntf extends SourceBase{
    
    intf: ArkInterface;

    public constructor(indent: string, intf: ArkInterface) {
        super(indent);
        this.intf = intf;
    }

    public dump(): string {
        this.printer.writeIndent().writeSpace(this.modifiersToString(this.intf.getModifiers()));
        this.printer.writeSpace(`interface ${this.intf.getName()}`).writeLine('{');
        this.printer.incIndent();
        for (let member of this.intf.getMembers()) {
            if (member.getMemberType() == 'MethodSignature') {
                this.printIntfMethod(member.getMethod() as ArkMethod);
            } else if (member.getMemberType() == 'PropertySignature') {
                this.printIntfProperty(member.getProperty() as InterfaceProperty);
            }
        }
        this.printer.decIndent();
        this.printer.writeLine('}')
        return this.printer.toString();
    }

    public dumpOriginalCode(): string {
        return this.intf.getCode();
    }

    private printIntfMethod(method: ArkMethod): void {
        this.printer.writeIndent().writeLine(`${this.methodProtoToString(method)};`);
    }

    private printIntfProperty(property: InterfaceProperty): void {
        this.printer.writeIndent()
                .writeSpace(this.modifiersToString(property.getModifiers()))
                .write(property.getPropertyName());

        // property.getInitializer() PropertyAccessExpression ArrowFunction ClassExpression FirstLiteralToken StringLiteral 
        // TODO: Initializer not ready
        if (property.getType().length > 0) {
            this.printer.write(`:${this.resolveKeywordType(property.getType())}`);
        }
        this.printer.writeLine(';');
    }
}

