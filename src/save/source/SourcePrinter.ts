import { ArkBody } from '../../core/model/ArkBody';
import { ArkClass } from '../../core/model/ArkClass';
import { ArkInterface } from '../../core/model/ArkInterface';
import { ArkMethod } from '../../core/model/ArkMethod';
import { ArkStream } from '../ArkStream';
import { Printer } from '../Printer';
import { SourceBody } from './SourceBody';

export class SourcePrinter extends Printer {

    public printOriginalCode(streamOut: ArkStream): void {
        streamOut.write(this.arkFile.getCode());
    }

    // defaultClass using OriginalCfg stmts, others using code
    public printOriginalClass(cls: ArkClass, streamOut: ArkStream): void {
        if (cls.isDefaultArkClass()) {
            for (let method of cls.getMethods()) {
                if (method.isDefaultArkMethod()) {
                    for (let stmt of method.getBody().getOriginalCfg().getStmts()) {
                        let code = stmt.toString();
                        if (!code.startsWith('import') && code !== 'return;') {
                            streamOut.writeLine(code);
                        }
                    }
                } else {
                    streamOut.writeLine(method.getCode());
                }
            }
        } else {
            streamOut.writeLine(cls.getCode());
        }
    }

    // print imports
    protected printStart(streamOut: ArkStream): void {
        for (let info of this.arkFile.getImportInfos()) {
            if (info.getImportType() === 'Identifier') {
                // import fs from 'fs'
                streamOut.write('import ' + info.getImportClauseName() + ' from ')
                    .writeStringLiteral(info.getImportFrom() as string).writeLine(';');
            } else if (info.getImportType() === 'NamedImports') {
                // import {xxx} from './yyy'
                streamOut.write('import {' + info.getImportClauseName() + '} from ')
                    .writeStringLiteral(info.getImportFrom() as string).writeLine(';');
            } else if (info.getImportType() === 'NamespaceImport') {
                // import * as ts from 'typescript'
                streamOut.write('import * as ' + info.getImportClauseName() + ' from ')
                    .writeStringLiteral(info.getImportFrom() as string).writeLine(';');
            } else if (info.getImportType() == 'EqualsImport') {
                // import mmmm = require('./xxx')
                streamOut.write('import ' + info.getImportClauseName() + ' = require(')
                    .writeStringLiteral(info.getImportFrom() as string).writeLine(');');
            } else {
                // import '../xxx'
                streamOut.write('import ').writeStringLiteral(info.getImportFrom() as string).writeLine(';');
            }
        }
    }

    // print export * from
    protected printEnd(streamOut: ArkStream): void {
        for (let info of this.arkFile.getExportInfos()) {
            if (info.getExportClauseType() !== 'NamespaceExport' && info.getExportClauseType() !== 'NamedExports') {
                continue;
            }
            if (info.getExportClauseType() === 'NamespaceExport') {
                // just like: export * as xx from './yy'
                if (info.getNameBeforeAs()) {
                    streamOut.write('export ' + info.getNameBeforeAs() + ' as ' + info.getExportClauseName());
                } else {
                    streamOut.write('export ' + info.getExportClauseName());
                }
            } else if (info.getExportClauseType() === 'NamedExports') {
                // just like: export {xxx as x} from './yy'
                if (info.getNameBeforeAs()) {
                    streamOut.write('export {' + info.getNameBeforeAs() + ' as ' + info.getExportClauseName() + '}');
                } else {
                    streamOut.write('export {' + info.getExportClauseName() + '}');
                }
            }
            if (info.getExportFrom()) {
                streamOut.write(' from ').writeStringLiteral(info.getExportFrom() as string);
            }
            streamOut.writeLine(';');
        }
    }

    protected printInterface(intf: ArkInterface, streamOut: ArkStream): void {
        streamOut.writeIndent().writeSpace(this.modifiersToString(intf.getModifiers()));
        streamOut.writeSpace(`interface ${intf.getName()}`).writeLine('{');
        streamOut.incIndent();
        for (let member of intf.getMembers()) {
            let method = member.method as ArkMethod;
            if (method) {
                this.printIntfMethod(method, streamOut);
            }
        }
        streamOut.decIndent();
        streamOut.writeLine('}')
    }

    protected printClass(cls: ArkClass, streamOut: ArkStream): void {
        // TODO：If there no modifications, use the original code.
        // this.printOriginalClass(cls, streamOut);
        if (cls.isDefaultArkClass()) {
            return this.printMethods(cls, streamOut);
        }
        // print export class name + extends c0 implements x1, x2 {
        streamOut.writeSpace(this.modifiersToString(cls.getModifiers()))
            .writeSpace(`class ${cls.getName()} `);
        if (cls.getSuperClassName()) {
            streamOut.write(`extends ${cls.getSuperClassName()} `);
        }
        if (cls.getImplementedInterfaceNames().length > 0) {
            streamOut.write(`implements ${cls.getImplementedInterfaceNames().join(',')}`);
        }
        streamOut.writeLine('{');
        streamOut.incIndent();

        this.printFields(cls, streamOut);
        this.printMethods(cls, streamOut);
        
        streamOut.decIndent();
        streamOut.writeLine('}')
    }
    
    private printMethods(cls: ArkClass, streamOut: ArkStream): void {
        for (let method of cls.getMethods()) {
            if (method.isDefaultArkMethod()) {
                this.printBody(method.getBody(), streamOut, true);
            } else {
                this.printMethod(method, streamOut);
            }
        }
    }

    private printMethod(method: ArkMethod, streamOut: ArkStream): void {
        this.printMethodProto(method, streamOut);
        // abstract function no body
        if (method.containsModifier('AbstractKeyword')) {
            streamOut.writeLine(';');
            return;
        }

        streamOut.writeLine('{');
        streamOut.incIndent();
        this.printBody(method.getBody(), streamOut, false);
        streamOut.decIndent();

        streamOut.writeIndent();
        streamOut.writeLine('}');
    }

    private printBody(body: ArkBody, streamOut: ArkStream, isDefault: boolean): void {
        let src = new SourceBody(body, isDefault);
        src.dump(streamOut);
        
    }

    private printMethodProto(method: ArkMethod, streamOut: ArkStream): void {
        streamOut.writeIndent();
        streamOut.writeSpace(this.modifiersToString(method.getModifiers()));
        if (method.getDeclaringArkClass()?.isDefaultArkClass()) {
            streamOut.writeSpace('function');
        }
        let parameters: string[] = [];
        method.getParameters().forEach((parameterType, parameterName) => {
            parameters.push(parameterName + ': ' + this.resolveKeywordType(parameterType));
        });

        streamOut.write(this.resolveMethodName(method.getName()) + '(' + parameters.join(',') + ')');
        if (method.getReturnType().length > 1) {
            let rtnTypes: string[] = [];
            method.getReturnType().forEach((returnType) => {
                rtnTypes.push(this.resolveKeywordType(returnType));
            });
            streamOut.write(`: [${rtnTypes.join(',')}]`);
        } else if (method.getReturnType().length == 1) {
            streamOut.writeSpace(`: ${this.resolveKeywordType(method.getReturnType()[0])}`);
        }
    }

    private printIntfMethod(method: ArkMethod, streamOut: ArkStream): void {
        this.printMethodProto(method, streamOut);
        streamOut.writeLine(';');
    }

    private printFields(cls: ArkClass, streamOut: ArkStream): void {
        for (let property of cls.getProperties()) {
            streamOut.writeIndent()
                .writeSpace(this.modifiersToString(property.getModifiers()))
                .write(property.getPropertyName());

            // property.getInitializer() PropertyAccessExpression ArrowFunction ClassExpression FirstLiteralToken StringLiteral 
            // TODO: Initializer not ready
            if (property.getType().length > 0) {
                streamOut.write(':' + this.resolveKeywordType(property.getType()));
            }
            if (property.getInitializer() == 'ClassExpression') {
                streamOut.writeLine(' = class {');
                streamOut.writeIndent().writeLine('}');
            } else if (property.getInitializer() == 'ArrowFunction') {
                streamOut.writeLine(' = ()=> {');
                streamOut.writeIndent().writeLine('}');
            } else {
                streamOut.writeLine(';');
            }
        }
    }

    private modifiersToString(modifiers: Set<string>): string {
        let modifiersStr: string[] = [];
        modifiers.forEach((value) => {
            modifiersStr.push(this.resolveKeywordType(value))
        });

        return modifiersStr.join(' ');
    }

    private resolveKeywordType(keywordStr: string): string {
        if (keywordStr.endsWith('Keyword')) {
            return keywordStr.substring(0, keywordStr.length - 'Keyword'.length).toLowerCase();
        }
        
        return keywordStr;
    }

    private resolveMethodName(name: string): string {
        if (name === '_Constructor') {
            return 'constructor';
        }
        return name;
    }
}