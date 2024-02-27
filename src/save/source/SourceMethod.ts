import { UnknownType } from "../../core/base/Type";
import { ArkBody } from "../../core/model/ArkBody";
import { ArkFile } from "../../core/model/ArkFile";
import { ArkMethod } from "../../core/model/ArkMethod";
import { ArkCodeBuffer } from "../ArkStream";
import { SourceBase } from "./SourceBase";
import { SourceBody } from "./SourceBody";

export class SourceMethod extends SourceBase{
    method: ArkMethod;

    public constructor(indent: string, arkFile: ArkFile, method: ArkMethod) {
        super(indent, arkFile);
        this.method = method;
    }

    public dump(): string {
        if (this.method.isDefaultArkMethod()) {
            this.printBody(this.method.getBody(), true);
        } else {
            this.printMethod(this.method);
        }
        return this.printer.toString();
    }
    public dumpOriginalCode(): string {
        return this.method.getCode() + '\n';
    }
    public getLine(): number {
        return this.method.getLine();
    }

    public printMethod(method: ArkMethod): void {
        this.printer.writeIndent().write(this.methodProtoToString(method));
        // abstract function no body
        if (method.containsModifier('AbstractKeyword')) {
            this.printer.writeLine(';');
            return;
        }

        this.printer.writeLine('{');
        this.printer.incIndent();
        this.printBody(method.getBody(), false);
        this.printer.decIndent();

        this.printer.writeIndent();
        this.printer.writeLine('}');
    }

    public printBody(body: ArkBody, isDefault: boolean): void {
        let srcBody = new SourceBody(this.printer.getIndent(), this.arkFile, body, isDefault);
        this.printer.write(srcBody.dump());
    }

    protected methodProtoToString(method: ArkMethod): string {
        let code = new ArkCodeBuffer();
        code.writeSpace(this.modifiersToString(method.getModifiers()));
        if (method.getDeclaringArkClass()?.isDefaultArkClass()) {
            code.writeSpace('function');
        }
        code.write(this.resolveMethodName(method.getName()));
        if (method.getTypeParameter().length > 0) {
            code.write(`<${method.getTypeParameter().join(',')}>`);
        }

        let parameters: string[] = [];
        method.getParameters().forEach((parameter) => {
            if (parameter.getType()) {
                parameters.push(parameter.getName() + ': ' + parameter.getType());
            } else {
                parameters.push(parameter.getName());
            }
        });
        code.write(`(${parameters.join(',')})`);
        if (!(method.getReturnType() instanceof UnknownType)) {
            code.writeSpace(`: ${method.getReturnType()}`);
        }
        return code.toString();
    }

}