/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { UnknownType } from '../../core/base/Type';
import { ArkMethod } from '../../core/model/ArkMethod';
import { ArkCodeBuffer } from '../ArkStream';
import { SourceBase } from './SourceBase';
import { SourceBody } from './SourceBody';
import { SourceStmt } from './SourceStmt';
import { SourceTransformer } from './SourceTransformer';
import { PrinterUtils } from '../base/PrinterUtils';
import { Stmt } from '../../core/base/Stmt';
import { ArkNamespace } from '../../core/model/ArkNamespace';
import { ArkMetadataKind, CommentsMetadata } from '../../core/model/ArkMetadata';
import { getLineNo } from '../../core/base/Position';
import { MethodSignature } from '../../core/model/ArkSignature';
import { LEXICAL_ENV_NAME_PREFIX } from '../../core/common/Const';

/**
 * @category save
 */
export class SourceMethod extends SourceBase {
    private method: ArkMethod;
    private transformer: SourceTransformer;

    public constructor(method: ArkMethod, indent: string = '') {
        super(method.getDeclaringArkFile(), indent);
        this.method = method;
        this.transformer = new SourceTransformer(this);
        this.inBuilder = this.initInBuilder();
    }

    public getDeclaringArkNamespace(): ArkNamespace | undefined {
        return this.method.getDeclaringArkClass().getDeclaringArkNamespace();
    }

    public setInBuilder(inBuilder: boolean): void {
        this.inBuilder = inBuilder;
    }

    public dump(): string {
        this.printer.clear();
        const commentsMetadata = this.method.getMetadata(ArkMetadataKind.LEADING_COMMENTS);
        if (commentsMetadata instanceof CommentsMetadata) {
            const comments = commentsMetadata.getComments();
            comments.forEach(comment => {
                this.printer.writeIndent().writeLine(comment.content);
            });
        }
        if (!this.method.isDefaultArkMethod()) {
            this.printMethod(this.method);
        } else {
            this.printBody(this.method);
        }
        return this.printer.toString();
    }

    public getLine(): number {
        let line = this.method.getLine();
        if (line === null && this.method.getDeclareLineCols()) {
            line = getLineNo(this.method.getDeclareLineCols()![0]);
        }
        if (line === null) {
            line = 0;
        }
        if (line > 0) {
            return line;
        }

        const stmts: Stmt[] = [];
        const cfg = this.method.getCfg();
        if (cfg) {
            cfg.getStmts()
                .reverse()
                .forEach(stmt => stmts.push(stmt));
        }
        for (const stmt of stmts) {
            if (stmt.getOriginPositionInfo().getLineNo() > 0) {
                return stmt.getOriginPositionInfo().getLineNo();
            }
        }

        return line;
    }

    public dumpDefaultMethod(): SourceStmt[] {
        let srcBody = new SourceBody(this.printer.getIndent(), this.method, false);
        return srcBody.getStmts();
    }

    private printMethod(method: ArkMethod): void {
        this.printDecorator(method.getDecorators());

        let implementationSig = method.getImplementationSignature();

        if (this.method.getDeclareSignatures()) {
            for (const methodSig of this.method.getDeclareSignatures()!) {
                this.printer.writeIndent().writeLine(`${this.methodProtoToString(methodSig)};`);
            }
        }

        if (!implementationSig) {
            return;
        }

        this.printer.writeIndent().write(this.methodProtoToString(implementationSig!));

        // abstract function no body
        if (SourceMethod.getPrinterOptions().noMethodBody) {
            this.printer.writeIndent().writeLine(`;`);
            return;
        }

        this.printer.writeLine(' {');
        this.printer.incIndent();
        this.printBody(method);
        this.printer.decIndent();

        this.printer.writeIndent();
        if (PrinterUtils.isAnonymousMethod(method.getName())) {
            this.printer.write('}');
        } else {
            this.printer.writeLine('}');
        }
    }

    private printBody(method: ArkMethod): void {
        let srcBody = new SourceBody(this.printer.getIndent(), method, this.inBuilder);
        this.printer.write(srcBody.dump());
    }

    private methodProtoToString(methodSig: MethodSignature): string {
        let code = new ArkCodeBuffer();
        code.writeSpace(this.modifiersToString(this.method.getModifiers()));
        if (!PrinterUtils.isAnonymousMethod(methodSig.getMethodSubSignature().getMethodName())) {
            if (this.method.getDeclaringArkClass()?.isDefaultArkClass()) {
                code.writeSpace('function');
            }
            if (this.method.getAsteriskToken()) {
                code.writeSpace('*');
            }
            code.write(this.resolveMethodName(methodSig.getMethodSubSignature().getMethodName()));
        }

        const genericTypes = this.method.getGenericTypes();
        if (genericTypes && genericTypes.length > 0) {
            code.write(`<${this.transformer.typeArrayToString(genericTypes)}>`);
        }

        let parameters: string[] = [];
        methodSig
            .getMethodSubSignature()
            .getParameters()
            .forEach(parameter => {
                let str: string = parameter.getName();
                if (parameter.isRest()) {
                    str = `...${parameter.getName()}`;
                }
                if (parameter.isOptional()) {
                    str += '?';
                }
                if (parameter.getType()) {
                    str += ': ' + this.transformer.typeToString(parameter.getType());
                }
                if (!str.startsWith(LEXICAL_ENV_NAME_PREFIX)) {
                    parameters.push(str);
                }
            });
        code.write(`(${parameters.join(', ')})`);
        const returnType = methodSig.getMethodSubSignature().getReturnType();
        if (methodSig.getMethodSubSignature().getMethodName() !== 'constructor' && !(returnType instanceof UnknownType)) {
            code.write(`: ${this.transformer.typeToString(returnType)}`);
        }
        if (PrinterUtils.isAnonymousMethod(methodSig.getMethodSubSignature().getMethodName())) {
            code.write(' =>');
        }
        return code.toString();
    }

    public toArrowFunctionTypeString(): string {
        let code = new ArkCodeBuffer();

        let parameters: string[] = [];
        this.method.getParameters().forEach(parameter => {
            let str: string = parameter.getName();
            if (parameter.isOptional()) {
                str += '?';
            }
            if (parameter.getType()) {
                str += ': ' + this.transformer.typeToString(parameter.getType());
            }
            parameters.push(str);
        });
        code.write(`(${parameters.join(', ')}) => `);
        const returnType = this.method.getReturnType();
        if (!(returnType instanceof UnknownType)) {
            code.writeSpace(`${this.transformer.typeToString(returnType)}`);
        }

        return code.toString();
    }

    private initInBuilder(): boolean {
        return (
            this.method.hasBuilderDecorator() ||
            ((this.method.getName() === 'build' || this.method.getName() === 'pageTransition') &&
                !this.method.isStatic() &&
                this.method.getDeclaringArkClass().hasViewTree())
        );
    }
}
