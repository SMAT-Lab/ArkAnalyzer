/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import { ArkMethod } from '../../core/model/ArkMethod';
import { ArkCodeBuffer } from '../ArkStream';

import { ArkIfStmt, Stmt } from '../../core/base/Stmt';
import { ArkMetadataKind, CommentsMetadata } from '../../core/model/ArkMetadata';
import { BasePrinter } from '../base/BasePrinter';
import { Cfg } from '../../core/graph/Cfg';
import { BasicBlock } from '../../core/graph/BasicBlock';

/**
 * @category save
 */
export class ArkIRMethodPrinter extends BasePrinter {
    private method: ArkMethod;

    public constructor(method: ArkMethod, indent: string = '') {
        super(indent);
        this.method = method;
    }

    public dump(): string {
        this.printer.clear();
        const commentsMetadata = this.method.getMetadata(ArkMetadataKind.LEADING_COMMENTS);
        if (commentsMetadata instanceof CommentsMetadata) {
            this.printComments(commentsMetadata);
        }

        this.printMethod(this.method);

        return this.printer.toString();
    }

    public getLine(): number {
        let line = this.method.getLine();
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

    private printMethod(method: ArkMethod): void {
        this.printDecorator(method.getDecorators());
        this.printer.writeIndent().write(this.methodProtoToString(method));
        // abstract function no body
        if (!method.getBody()) {
            this.printer.writeLine('');
            return;
        }

        this.printer.writeLine(' {');
        this.printer.incIndent();
        this.printBody(method);
        this.printer.decIndent();
        this.printer.writeIndent().writeLine('}');
    }

    private printBody(method: ArkMethod): void {
        if (method.getCfg()) {
            this.printCfg(method.getCfg()!);
        }
    }

    protected methodProtoToString(method: ArkMethod): string {
        let code = new ArkCodeBuffer();
        code.writeSpace(this.modifiersToString(method.getModifiers()));

        if (method.getAsteriskToken()) {
            code.writeSpace('*');
        }
        code.write(this.resolveMethodName(method.getName()));

        const genericTypes = method.getGenericTypes();
        if (genericTypes && genericTypes.length > 0) {
            let typeParameters: string[] = [];
            genericTypes.forEach(genericType => {
                typeParameters.push(genericType.toString());
            });
            code.write(`<${genericTypes.join(', ')}>`);
        }

        let parameters: string[] = [];
        method.getParameters().forEach(parameter => {
            let str: string = parameter.getName();
            if (parameter.isRest()) {
                str = `...${parameter.getName()}`;
            }
            if (parameter.isOptional()) {
                str += '?';
            }
            if (parameter.getType()) {
                str += ': ' + parameter.getType().toString();
            }
            parameters.push(str);
        });
        code.write(`(${parameters.join(', ')})`);
        const returnType = method.getReturnType();
        code.write(`: ${returnType.toString()}`);
        return code.toString();
    }

    private printCfg(cfg: Cfg): void {
        let isFirstBB = true;
        for (const block of cfg.getBlocks()) {
            if (!isFirstBB) {
                this.printer.writeLine('');
            }
            this.printBasicBlock(block);
            isFirstBB = false;
        }
    }

    private printBasicBlock(block: BasicBlock): void {
        let successors = block.getSuccessors();

        this.printer.writeIndent().writeLine(`label${block.getId()}:`);
        this.printer.incIndent();

        if (successors.length === 1) {
            block.getStmts().map(stmt => {
                this.printer.writeIndent().writeLine(stmt.toString());
            });
            this.printer.writeIndent().writeLine(`goto label${successors[0].getId()}`);
        } else if (successors.length === 2) {
            for (const stmt of block.getStmts()) {
                if (stmt instanceof ArkIfStmt) {
                    this.printer.writeIndent().writeLine(`${stmt.toString()} goto label${successors[0].getId()} label${successors[1].getId()}`);
                } else {
                    this.printer.writeIndent().writeLine(stmt.toString());
                }
            }
        } else {
            block.getStmts().map(stmt => {
                this.printer.writeIndent().writeLine(stmt.toString());
            });
        }

        this.printer.decIndent();
    }
}
