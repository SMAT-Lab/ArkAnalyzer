import { ExportInfo } from "../../core/common/ExportBuilder";
import { ImportInfo } from "../../core/common/ImportBuilder";
import { ArkFile } from "../../core/model/ArkFile";
import { SourceBase } from "./SourceBase";

export class SourceExportInfo extends SourceBase{
    info: ExportInfo;

    public constructor(indent: string, arkFile: ArkFile, info: ExportInfo) {
        super(indent, arkFile);
        this.info = info;
    }

    public getLine(): number {
        return -1;
    }

    public dump(): string {
        if (this.info.getExportClauseType() !== 'NamespaceExport' && this.info.getExportClauseType() !== 'NamedExports') {
            return '';
        }
        if (this.info.getExportClauseType() === 'NamespaceExport') {
            // just like: export * as xx from './yy'
            if (this.info.getNameBeforeAs()) {
                this.printer.writeIndent().write(`export ${this.info.getNameBeforeAs()} as ${this.info.getExportClauseName()}`);
            } else {
                this.printer.writeIndent().write(`export ${this.info.getExportClauseName()}`);
            }
        } else if (this.info.getExportClauseType() === 'NamedExports') {
            // just like: export {xxx as x} from './yy'
            if (this.info.getNameBeforeAs()) {
                this.printer.write(`export {${this.info.getNameBeforeAs()} as ${this.info.getExportClauseName()}}`);
            } else {
                this.printer.write(`export {${this.info.getExportClauseName()}}`);
            }
        }
        if (this.info.getExportFrom()) {
            this.printer.write(` from '${this.info.getExportFrom() as string}'`);
        }
        this.printer.writeLine(';');

        return this.printer.toString();
    }
    public dumpOriginalCode(): string {
        return this.dump();
    }
}

export class SourceImportInfo extends SourceBase{
    info: ImportInfo;

    public constructor(indent: string, arkFile: ArkFile, info: ImportInfo) {
        super(indent, arkFile);
        this.info = info;
    }

    public getLine(): number {
        return -1;
    }

    public dump(): string {
        if (this.info.getImportType() === 'Identifier') {
            // import fs from 'fs'
            this.printer.writeIndent().writeLine(`import ${this.info.getImportClauseName()} from '${this.info.getImportFrom() as string}';`);
        } else if (this.info.getImportType() === 'NamedImports') {
            // import {xxx} from './yyy'
            if (this.info.getNameBeforeAs()) {
                this.printer.writeIndent().writeLine(`import {${this.info.getNameBeforeAs()} as ${this.info.getImportClauseName()}} from '${this.info.getImportFrom() as string}';`);
            } else {
                this.printer.writeIndent().writeLine(`import {${this.info.getImportClauseName()}} from '${this.info.getImportFrom() as string}';`);
            }
        } else if (this.info.getImportType() === 'NamespaceImport') {
            // import * as ts from 'typescript'
            this.printer.writeIndent().writeLine(`import * as ${this.info.getImportClauseName()} from '${this.info.getImportFrom() as string}';`);
        } else if (this.info.getImportType() == 'EqualsImport') {
            // import mmmm = require('./xxx')
            this.printer.writeIndent().writeLine(`import ${this.info.getImportClauseName()} =  require('${this.info.getImportFrom() as string}');`);
        } else {
            // import '../xxx'
            this.printer.writeIndent().writeLine(`import '${this.info.getImportFrom() as string}';`);
        }
        return this.printer.toString();
    }
    public dumpOriginalCode(): string {
        return this.dump();
    }
}