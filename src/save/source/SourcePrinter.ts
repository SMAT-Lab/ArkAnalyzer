import { ArkCompoundStmt} from '../../core/base/Stmt';
import { BasicBlock } from '../../core/graph/BasicBlock';
import { ArkBody } from '../../core/model/ArkBody';
import { ArkClass } from '../../core/model/ArkClass';
import { ArkFile } from '../../core/model/ArkFile';
import { ArkInterface } from '../../core/model/ArkInterface';
import { ArkMethod } from '../../core/model/ArkMethod';
import { ArkStream } from '../ArkStream';
import { Printer } from '../Printer';

export class SourcePrinter extends Printer {
    protected printStart(streamOut: ArkStream): void {
        for (let info of this.arkFile.getImportInfos()) {
            if (info.getimportType() === 'Identifier') {
                // import fs from 'fs'
                streamOut.write('import ' + info.getImportClauseName() + ' from ')
                    .writeStringLiteral(info.getImportFrom() as string).writeLine(';');
            } else if (info.getimportType() === 'NamedImports') {
                // import {xxx} from './yyy'
                streamOut.write('import {' + info.getImportClauseName() + '} from ')
                    .writeStringLiteral(info.getImportFrom() as string).writeLine(';');
            } else if (info.getimportType() === 'NamespaceImport') {
                // import * as ts from 'typescript'
                streamOut.write('import * as ' + info.getImportClauseName() + ' from ')
                    .writeStringLiteral(info.getImportFrom() as string).writeLine(';');
            } else if (info.getimportType() == 'EqualsImport') {
                // import mmmm = require('./xxx')
                streamOut.write('import ' + info.getImportClauseName() + ' = require(')
                    .writeStringLiteral(info.getImportFrom() as string).writeLine(');');
            } else {
                // import '../xxx'
                streamOut.write('import ').writeStringLiteral(info.getImportFrom() as string).writeLine(';');
            }
        }
    }
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
        for (let m of intf.getModifiers()) {
            streamOut.write(this.resolveKeywordType(m) + ' ');
        }
        streamOut.write('interface ' + intf.getName() + ' ');
        streamOut.writeLine('{');
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
        if (cls.isDefault()) {
            return this.printMethods(cls, streamOut);
        }

        // print export class name + extends c0 implements x1, x2 {
        for (let m of cls.getModifiers()) {
            streamOut.write(this.resolveKeywordType(m) + ' ');
        }
        streamOut.write('class ' + cls.getName() + ' ');
        if (cls.getSuperClassName()) {
            streamOut.write('extends ' + cls.getSuperClassName() + ' ');
        }
        if (cls.getImplementedInterfaceNames().length > 0) {
            streamOut.write('implements '+ cls.getImplementedInterfaceNames().join(','));
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
            if (method.isDefault()) {
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
        let blocks = body.getOriginalCfg().getBlocks();
        let visitor = new Set<BasicBlock>();

        for (let block of blocks) {
            this.printBasicBlock(block, streamOut, visitor);
        }
    }

    private printMethodProto(method: ArkMethod, streamOut: ArkStream): void {
        streamOut.writeIndent();
        
        for (let m of method.getModifiers()) {
            streamOut.write(this.resolveKeywordType(m) + ' ');
        }

        if (method.getDeclaringArkClass()?.isDefault()) {
            streamOut.write('function ');
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
            streamOut.write(':[' + rtnTypes.join(',') + '] ');
        } else if (method.getReturnType().length == 1) {
            streamOut.write(': ' + this.resolveKeywordType(method.getReturnType()[0]));
        }
    }

    private printIntfMethod(method: ArkMethod, streamOut: ArkStream): void {
        this.printMethodProto(method, streamOut);
        streamOut.writeLine(';');
    }

    private printFields(cls: ArkClass, streamOut: ArkStream): void {
        for (let field of cls.getFields()) {
            streamOut.writeIndent();
            streamOut.writeLine(field.getName() + ':' + this.resolveKeywordType(field.getType()) + ';');
        }
    }

    private printBasicBlock(block: BasicBlock, streamOut: ArkStream, visitor: Set<BasicBlock>): void {
        if (visitor.has(block)) {
            return;
        }

        for (let stmt of block.getStmts()) {
            if (stmt instanceof ArkCompoundStmt) {
                streamOut.writeIndent();
                streamOut.writeLine(stmt.toString() + '{');
                streamOut.incIndent();
                // printBlock
                for (let sub of block.getSuccessors()) {
                    this.printBasicBlock(sub, streamOut, visitor);
                    visitor.add(sub);
                }
                block.getSuccessors();
                streamOut.decIndent();
                streamOut.writeIndent();
                streamOut.writeLine('}');
            } else {
                streamOut.writeIndent();
                streamOut.writeLine(stmt.toString());
            }
        }
        visitor.add(block);
    }

    private resolveKeywordType(keywordStr: string): string {
        if (keywordStr.endsWith('Keyword')) {
            return keywordStr.substring(0, keywordStr.length - 'Keyword'.length).toLowerCase();
        }
        switch (keywordStr) {
            case 'FirstLiteralToken':
                return 'number'
            case 'StringLiteralToken':
                return 'string'
            default:
                return keywordStr;
        }
    }

    private resolveMethodName(name: string): string {
        if (name === '_Constructor') {
            return 'constructor';
        }
        return name;
    }
}