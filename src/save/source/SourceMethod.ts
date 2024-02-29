import { TypeLiteralType, UnknownType } from "../../core/base/Type";
import { ArkBody } from "../../core/model/ArkBody";
import { ArkFile } from "../../core/model/ArkFile";
import { ArkMethod } from "../../core/model/ArkMethod";
import { ArkCodeBuffer } from "../ArkStream";
import { SourceBase } from "./SourceBase";
import { SourceBody } from "./SourceBody";
import { SourceUtils } from "./SourceUtils";

export class SourceMethod extends SourceBase{
    method: ArkMethod;

    public constructor(indent: string, arkFile: ArkFile, method: ArkMethod) {
        super(indent, arkFile);
        this.method = method;
    }

    public dump(): string {
        if (this.method.isDefaultArkMethod()) {
            this.printBody(this.method.getBody());
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
        if (method.containsModifier('AbstractKeyword') 
            || method.getDeclaringArkClass().getOriginType().toLowerCase() == 'interface') {
            this.printer.writeLine(';');
            return;
        }

        this.printer.writeLine('{');
        this.printer.incIndent();
        this.printBody(method.getBody());
        this.printer.decIndent();

        this.printer.writeIndent();
        this.printer.writeLine('}');
    }

    public printBody(body: ArkBody): void {
        let srcBody = new SourceBody(this.printer.getIndent(), this.arkFile, body);
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
            let typeParameters: string[] = [];
            method.getTypeParameter().forEach((parameter) => {
                typeParameters.push(SourceUtils.typeToString(parameter));
            });
            code.write(`<${SourceUtils.typeArrayToString(method.getTypeParameter())}>`);
        }

        let parameters: string[] = [];
        method.getParameters().forEach((parameter) => {
            if (parameter.getType() instanceof UnknownType || !parameter.getType()) {
                parameters.push(parameter.getName());
            } else {
                parameters.push(parameter.getName() + ': ' + SourceUtils.typeToString(parameter.getType()));
            }
        });
        code.write(`(${parameters.join(',')})`);
        const returnType = method.getReturnType();
        if (!(returnType instanceof UnknownType)) {
            code.writeSpace(`: ${SourceUtils.typeToString(returnType)}`);
        }
        return code.toString();
    }

}