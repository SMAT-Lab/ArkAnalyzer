import { ArkBody } from "../../core/model/ArkBody";
import { ArkMethod } from "../../core/model/ArkMethod";
import { ArkCodeBuffer } from "../ArkStream";
import { SourceBody } from "./SourceBody";

export abstract class SourceBase {
    printer: ArkCodeBuffer;

    public constructor(indent: string) {
        this.printer = new ArkCodeBuffer(indent);
    }

    public abstract dump(): string;
    public abstract dumpOriginalCode(): string;

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
        let srcBody = new SourceBody(this.printer.getIndent(), body, isDefault);
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
        method.getParameters().forEach((parameterType, parameterName) => {
            parameters.push(parameterName + ': ' + this.resolveKeywordType(parameterType));
        });
        code.write(`(${parameters.join(',')})`);
        if (method.getReturnType().length > 1) {
            let rtnTypes: string[] = [];
            method.getReturnType().forEach((returnType) => {
                rtnTypes.push(this.resolveKeywordType(returnType));
            });
            code.write(`: [${rtnTypes.join(',')}]`);
        } else if (method.getReturnType().length == 1) {
            code.writeSpace(`: ${this.resolveKeywordType(method.getReturnType()[0])}`);
        }

        return code.toString();
    }

    protected modifiersToString(modifiers: Set<string>): string {
        let modifiersStr: string[] = [];
        modifiers.forEach((value) => {
            modifiersStr.push(this.resolveKeywordType(value))
        });
    
        return modifiersStr.join(' ');
    }
    
    protected resolveKeywordType(keywordStr: string): string {
        if (keywordStr.endsWith('Keyword')) {
            return keywordStr.substring(0, keywordStr.length - 'Keyword'.length).toLowerCase();
        }
        
        return keywordStr;
    }
    
    protected resolveMethodName(name: string): string {
        if (name === '_Constructor') {
            return 'constructor';
        }
        if (name.startsWith('Get-')) {
            return name.replace('Get-', 'get ');
        }
        if (name.startsWith('Set-')) {
            return name.replace('Set-', 'set ');
        }
        return name;
    }
}

