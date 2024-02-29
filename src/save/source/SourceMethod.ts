import { UnknownType } from "../../core/base/Type";
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
            this.printBody(this.method);
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
        this.printBody(method);
        this.printer.decIndent();

        this.printer.writeIndent();
        this.printer.writeLine('}');
    }

    public printBody(method: ArkMethod): void {
        let srcBody = new SourceBody(this.printer.getIndent(), method);
        this.printer.write(srcBody.dump());
    }

    protected methodProtoToString(method: ArkMethod): string {
        let code = new ArkCodeBuffer();
        code.writeSpace(this.modifiersToString(method.getModifiers()));
        if (!method.getName().startsWith('AnonymousFunc$_')) {
            if (method.getDeclaringArkClass()?.isDefaultArkClass()) {
                code.writeSpace('function');
            }
            code.write(this.resolveMethodName(method.getName()));   
        } else {
            
        }
        if (method.getTypeParameter().length > 0) {
            let typeParameters: string[] = [];
            method.getTypeParameter().forEach((parameter) => {
                typeParameters.push(SourceUtils.typeToString(parameter));
            });
            code.write(`<${SourceUtils.typeArrayToString(method.getTypeParameter())}>`);
        } 
        
        let parameters: string[] = [];
        method.getParameters().forEach((parameter) => {
            let str: string = parameter.getName();
            if (parameter.isOptional()) {
                str += '?';
            }
            if (parameter.getType()) {
                str += ': ' + SourceUtils.typeToString(parameter.getType());
            } 
            parameters.push(str);
        });
        code.write(`(${parameters.join(',')})`);
        const returnType = method.getReturnType();
        if (!(returnType instanceof UnknownType)) {
            code.writeSpace(`: ${SourceUtils.typeToString(returnType)}`);
        }
        if (method.getName().startsWith('AnonymousFunc$_')) {
            code.write(' => ');
        }
        return code.toString();
    }

}