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

import { ArkParameterRef, ArkThisRef } from '../base/Ref';
import { ArkAssignStmt, ArkReturnStmt, ArkReturnVoidStmt, Stmt } from '../base/Stmt';
import { FunctionType, GenericType, Type } from '../base/Type';
import { Value } from '../base/Value';
import { Cfg } from '../graph/Cfg';
import { ViewTree } from '../graph/ViewTree';
import { ArkBody } from './ArkBody';
import { ArkClass, ClassCategory } from './ArkClass';
import { MethodSignature, MethodSubSignature } from './ArkSignature';
import { BodyBuilder } from './builder/BodyBuilder';
import { ArkExport, ExportType } from './ArkExport';
import { ANONYMOUS_METHOD_PREFIX, DEFAULT_ARK_METHOD_NAME } from '../common/Const';
import { FullPosition, getColNo, getLineNo, INVALID_LINE, LineCol, setLineCol } from '../base/Position';
import { ArkBaseModel, BaseModelTag, ModifierType } from './ArkBaseModel';
import { ArkError, ArkErrorCode } from '../common/ArkError';
import { Local } from '../base/Local';
import { ArkFile, Language } from './ArkFile';
import { CONSTRUCTOR_NAME } from '../common/TSConst';
import { MethodParameter } from './builder/ArkMethodBuilder';
import { CxxBodyBuilder } from '../../frontend/cppFrontend/model/builder/BodyBuilder';
import { extractSourceTextByFullPosition } from '../common/StringUtils';
import { PointerType } from '../../frontend/cppFrontend/base/Type';
import { ModelUtils } from '../common/ModelUtils';

export const arkMethodNodeKind = [
    'MethodDeclaration',
    'Constructor',
    'FunctionDeclaration',
    'GetAccessor',
    'SetAccessor',
    'ArrowFunction',
    'FunctionExpression',
    'MethodSignature',
    'ConstructSignature',
    'CallSignature',
];

/**
 * @category core/model
 */
export class ArkMethod extends ArkBaseModel implements ArkExport {
    private declaringArkClass!: ArkClass;
    // used for the nested function to locate its outer function
    private outerMethod?: ArkMethod;

    private genericTypes?: GenericType[];

    private declareSignatures?: MethodSignature[];
    /** The full positions of the method declarations (for interface/abstract methods with separate declarations). */
    private declareOriginFullPositions?: FullPosition[];

    private implSignature?: MethodSignature;
    /** The full position of the method implementation.
     *  Undefined when the method has no implementation (e.g., interface method). */
    private implOriginFullPosition?: FullPosition;
    private sourceCode?: string;

    private body?: ArkBody;
    private viewTree?: ViewTree;

    private bodyBuilder?: BodyBuilder;
    // CXXTodo: The bodybuilder for Cxx. After the subsequent abstraction of BodyBuilder, this field will be refactored.
    private CxxBodyBuilder?: CxxBodyBuilder;

    constructor() {
        super();
    }

    /**
     * Returns the program language of the file where this method defined.
     */
    public getLanguage(): Language {
        return this.getDeclaringArkClass().getLanguage();
    }

    public getExportType(): ExportType {
        return ExportType.METHOD;
    }

    public getName(): string {
        return this.getSignature().getMethodSubSignature().getMethodName();
    }

    /**
     * Returns the source text of the method extracted from the declaring ArkFile
     * using the method's origin position. Implements lazy loading with caching.
     * Returns implementation position's source if available, otherwise returns
     * first declaration position's source.
     * @returns The source text of the method, or undefined if unavailable.
     */
    public getCode(): string | undefined {
        if (this.sourceCode !== undefined) {
            return this.sourceCode;
        }
        if (this.implOriginFullPosition !== undefined) {
            const code = extractSourceTextByFullPosition(this.getDeclaringArkFile().getCode(), this.implOriginFullPosition);
            if (code !== undefined) {
                this.sourceCode = code;
            }
            return code;
        }
        if (this.declareOriginFullPositions && this.declareOriginFullPositions.length > 0) {
            const code = extractSourceTextByFullPosition(this.getDeclaringArkFile().getCode(), this.declareOriginFullPositions[0]);
            if (code !== undefined) {
                this.sourceCode = code;
            }
            return code;
        }
        return undefined;
    }

    /**
     * @deprecated Source text is now stored on ArkFile only. This method has no effect.
     * @param _code - The source code (ignored).
     */
    public setCode(_code: string): void {
    }

    /**
     * @deprecated Use getDeclareOriginFullPositions().map(p => p.getFirstLine()) instead.
     * @returns null or the lines of the method's declarations with number type.
     */
    public getDeclareLines(): number[] | null {
        if (this.declareOriginFullPositions === undefined) {
            return null;
        }
        let lines: number[] = [];
        this.declareOriginFullPositions.forEach(position => {
            lines.push(position.getFirstLine());
        });
        return lines;
    }

    /**
     * @deprecated Use getDeclareOriginFullPositions().map(p => p.getFirstCol()) instead.
     * @returns null or the columns of the method's declarations with number type.
     */
    public getDeclareColumns(): number[] | null {
        if (this.declareOriginFullPositions === undefined) {
            return null;
        }
        let columns: number[] = [];
        this.declareOriginFullPositions.forEach(position => {
            columns.push(position.getFirstCol());
        });
        return columns;
    }

    /**
     * @deprecated Use setDeclareOriginFullPositions() instead.
     * @param lines - the number of lines.
     * @param columns - the number of columns.
     */
    public setDeclareLinesAndCols(lines: number[], columns: number[]): void {
        if (lines?.length !== columns?.length) {
            return;
        }
        this.declareOriginFullPositions = lines.map((line, index) => new FullPosition(line, columns[index], line, columns[index]));
    }

    /**
     * @deprecated Use setDeclareOriginFullPositions() instead.
     * @param lineCols - the encoded lines and columns with LineCol type.
     */
    public setDeclareLineCols(lineCols: LineCol[]): void {
        this.declareOriginFullPositions = lineCols.map(lineCol => {
            const line = getLineNo(lineCol);
            const col = getColNo(lineCol);
            return new FullPosition(line, col, line, col);
        });
    }

    /**
     * @deprecated Use getDeclareOriginFullPositions().map() instead.
     * @returns null or the encoded lines and columns of the method's declarations with LineCol type.
     */
    public getDeclareLineCols(): LineCol[] | null {
        if (!this.declareOriginFullPositions) {
            return null;
        }
        return this.declareOriginFullPositions.map(position => setLineCol(position.getFirstLine(), position.getFirstCol()));
    }

    /**
     * Returns the full positions of the method declarations in the source file.
     * @returns An array of full positions in the source code, or null if the method has no separate declarations.
     */
    public getDeclareOriginFullPositions(): FullPosition[] | null {
        return this.declareOriginFullPositions ? [...this.declareOriginFullPositions] : null;
    }

    /**
     * Sets the full positions of the method declarations in the source file.
     * @param positions - An array of full positions in the source code to set.
     */
    public setDeclareOriginFullPositions(positions: FullPosition[]): void {
        this.declareOriginFullPositions = [...positions];
    }

    /**
     * @deprecated Use getImplOriginFullPosition()?.getFirstLine() instead.
     * @returns null or the number of the line.
     */
    public getLine(): number | null {
        if (this.implOriginFullPosition === undefined) {
            return null;
        }
        return this.implOriginFullPosition.getFirstLine();
    }

    /**
     * @deprecated Use setImplOriginFullPosition() instead.
     * @param line - the line number of the method implementation.
     */
    public setLine(line: number): void {
        if (this.implOriginFullPosition) {
            const firstCol = this.implOriginFullPosition.getFirstCol();
            const lastLine = this.implOriginFullPosition.getLastLine();
            const lastCol = this.implOriginFullPosition.getLastCol();
            this.implOriginFullPosition = new FullPosition(line, firstCol, lastLine, lastCol);
        } else {
            this.implOriginFullPosition = new FullPosition(line, INVALID_LINE, INVALID_LINE, INVALID_LINE);
        }
    }

    /**
     * @deprecated Use getImplOriginFullPosition()?.getFirstCol() instead.
     * @returns null or the number of the column.
     */
    public getColumn(): number | null {
        if (this.implOriginFullPosition === undefined) {
            return null;
        }
        return this.implOriginFullPosition.getFirstCol();
    }

    /**
     * @deprecated Use setImplOriginFullPosition() instead.
     * @param column - the column number of the method implementation.
     */
    public setColumn(column: number): void {
        if (this.implOriginFullPosition) {
            const firstLine = this.implOriginFullPosition.getFirstLine();
            const lastLine = this.implOriginFullPosition.getLastLine();
            const lastCol = this.implOriginFullPosition.getLastCol();
            this.implOriginFullPosition = new FullPosition(firstLine, column, lastLine, lastCol);
        } else {
            this.implOriginFullPosition = new FullPosition(INVALID_LINE, column, INVALID_LINE, INVALID_LINE);
        }
    }

    /**
     * @deprecated Use getImplOriginFullPosition() instead.
     * @returns null or the encoded line and column of the method's implementation with LineCol type.
     */
    public getLineCol(): LineCol | null {
        if (this.implOriginFullPosition === undefined) {
            return null;
        }
        return setLineCol(this.implOriginFullPosition.getFirstLine(), this.implOriginFullPosition.getFirstCol());
    }

    /**
     * @deprecated Use setImplOriginFullPosition() instead.
     * @param lineCol - the encoded line and column with LineCol type.
     */
    public setLineCol(lineCol: LineCol): void {
        const line = getLineNo(lineCol);
        const col = getColNo(lineCol);
        this.implOriginFullPosition = new FullPosition(line, col, line, col);
    }

    /**
     * Returns the full position of the method implementation in the source file.
     * @returns The full position in the source code, or undefined if the method has no implementation
     *          (e.g., interface/abstract methods with separate declarations) or was automatically
     *          generated during IR construction.
     */
    public getImplOriginFullPosition(): FullPosition | undefined {
        return this.implOriginFullPosition;
    }

    /**
     * Sets the full position of the method implementation in the source file.
     * @param position - The full position in the source code to set.
     */
    public setImplOriginFullPosition(position: FullPosition): void {
        this.implOriginFullPosition = position;
    }

    /**
     * Returns the declaring class of the method.
     * @returns The declaring class of the method.
     */
    public getDeclaringArkClass(): ArkClass {
        return this.declaringArkClass;
    }

    public setDeclaringArkClass(declaringArkClass: ArkClass): void {
        this.declaringArkClass = declaringArkClass;
    }

    public getDeclaringArkFile(): ArkFile {
        return this.declaringArkClass.getDeclaringArkFile();
    }

    public isDefaultArkMethod(): boolean {
        return this.getName() === DEFAULT_ARK_METHOD_NAME;
    }

    public isAnonymousMethod(): boolean {
        return this.getName().startsWith(ANONYMOUS_METHOD_PREFIX);
    }

    public getParameters(): MethodParameter[] {
        return this.getSignature().getMethodSubSignature().getParameters();
    }

    public getReturnType(): Type {
        return this.getSignature().getType();
    }

    /**
     * Get all declare signatures.
     * The results could be null if there is no seperated declaration of the method.
     * @returns null or the method declare signatures.
     */
    public getDeclareSignatures(): MethodSignature[] | null {
        return this.declareSignatures ?? null;
    }

    /**
     * Get the index of the matched method declare signature among all declare signatures.
     * The index will be -1 if there is no matched signature found.
     * @param targetSignature - the target declare signature want to search.
     * @returns -1 or the index of the matched signature.
     */
    public getDeclareSignatureIndex(targetSignature: MethodSignature): number {
        let declareSignatures = this.declareSignatures;
        if (declareSignatures === undefined) {
            return -1;
        }
        for (let i = 0; i < declareSignatures.length; i++) {
            if (declareSignatures[i].isMatch(targetSignature)) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Get the method signature of the implementation.
     * The signature could be null if the method is only a declaration which body is undefined.
     * @returns null or the method implementation signature.
     */
    public getImplementationSignature(): MethodSignature | null {
        return this.implSignature ?? null;
    }

    /**
     * Get the method signature of the implementation or the first declaration if there is no implementation.
     * For a method, the implementation and declaration signatures must not be undefined at the same time.
     * A {@link MethodSignature} includes:
     * - Class Signature: indicates which class this method belong to.
     * - Method SubSignature: indicates the detail info of this method such as method name, parameters, returnType, etc.
     * @returns The method signature.
     * @example
     * 1. Get the signature of method mtd.

     ```typescript
     let signature = mtd.getSignature();
     // ... ...
     ```
     */
    public getSignature(): MethodSignature {
        return this.implSignature ?? (this.declareSignatures as MethodSignature[])[0];
    }

    /**
     * Set signatures of all declarations.
     * It will reset the declaration signatures if they are already defined before.
     * @param signatures - one signature or a list of signatures.
     */
    public setDeclareSignatures(signatures: MethodSignature | MethodSignature[]): void {
        if (Array.isArray(signatures)) {
            this.declareSignatures = signatures;
        } else {
            this.declareSignatures = [signatures];
        }
    }

    /**
     * Reset signature of one declaration with the specified index.
     * Will do nothing if the index doesn't exist.
     * @param signature - new signature want to set.
     * @param index - index of signature want to set.
     */
    public setDeclareSignatureWithIndex(signature: MethodSignature, index: number): void {
        if (this.declareSignatures === undefined || this.declareSignatures.length <= index) {
            return;
        }
        this.declareSignatures[index] = signature;
    }

    /**
     * Set signature of implementation.
     * It will reset the implementation signature if it is already defined before.
     * @param signature - signature of implementation.
     */
    public setImplementationSignature(signature: MethodSignature): void {
        this.implSignature = signature;
    }

    public getSubSignature(): MethodSubSignature {
        return this.getSignature().getMethodSubSignature();
    }

    public getGenericTypes(): GenericType[] | undefined {
        return this.genericTypes;
    }

    public isGenericsMethod(): boolean {
        return this.genericTypes !== undefined;
    }

    public setGenericTypes(genericTypes: GenericType[]): void {
        this.genericTypes = genericTypes;
    }

    public getBodyBuilder(): BodyBuilder | undefined {
        return this.bodyBuilder;
    }

    public getCxxBodyBuilder(): CxxBodyBuilder | undefined {
        return this.CxxBodyBuilder;
    }

    /**
     * Get {@link ArkBody} of a Method.
     * A {@link ArkBody} contains the CFG and actual instructions or operations to be executed for a method.
     * It is analogous to the body of a function or method in high-level programming languages,
     * which contains the statements and expressions that define what the function does.
     * @returns The {@link ArkBody} of a method.
     * @example
     * 1. Get cfg or stmt through ArkBody.

     ```typescript
     let cfg = this.scene.getMethod()?.getBody().getCfg();
     const body = arkMethod.getBody()
     ```

     2. Get local variable through ArkBody.

     ```typescript
     arkClass.getDefaultArkMethod()?.getBody().getLocals.forEach(local=>{...})
     let locals = arkFile().getDefaultClass().getDefaultArkMethod()?.getBody()?.getLocals();
     ```
     */
    public getBody(): ArkBody | undefined {
        return this.body;
    }

    public setBody(body: ArkBody): void {
        this.body = body;
    }

    /**
     * Get the CFG (i.e., control flow graph) of a method.
     * The CFG is a graphical representation of all possible control flow paths within a method's body.
     * A CFG consists of blocks, statements and goto control jumps.
     * @returns The CFG (i.e., control flow graph) of a method.
     * @example
     * 1. get stmt through ArkBody cfg.

     ```typescript
     body = arkMethod.getBody();
     const cfg = body.getCfg();
     for (const threeAddressStmt of cfg.getStmts()) {
     ... ...
     }
     ```

     2. get blocks through ArkBody cfg.

     ```typescript
     const body = arkMethod.getBody();
     const blocks = [...body.getCfg().getBlocks()];
     for (let i=0; i<blocks.length; i++) {
     const block = blocks[i];
     ... ...
     for (const stmt of block.getStmts()) {
     ... ...
     }
     let text = "next;"
     for (const next of block.getSuccessors()) {
     text += blocks.indexOf(next) + ' ';
     }
     // ... ...
     }
     ```
     */
    public getCfg(): Cfg | undefined {
        return this.body?.getCfg();
    }

    public getOriginalCfg(): Cfg | undefined {
        return undefined;
    }

    public getParameterRefs(): ArkParameterRef[] | null {
        let paramRefs: ArkParameterRef[] = [];
        const stmts = this.getBody()?.getCfg().getStartingBlock()?.getStmts();
        if (stmts === undefined) {
            return null;
        }
        for (let stmt of stmts) {
            if (stmt instanceof ArkAssignStmt && stmt.getRightOp() instanceof ArkParameterRef) {
                paramRefs.push((stmt as ArkAssignStmt).getRightOp() as ArkParameterRef);
            }
        }
        return paramRefs;
    }

    public getParameterInstances(): Value[] {
        // 获取方法体中参数Local实例
        let stmts: Stmt[] = [];
        if (this.getCfg()) {
            const cfg = this.getCfg() as Cfg;
            cfg.getStmts().forEach(stmt => stmts.push(stmt));
        }
        let results: Value[] = [];
        for (let stmt of stmts) {
            if (stmt instanceof ArkAssignStmt) {
                if (stmt.getRightOp() instanceof ArkParameterRef) {
                    results.push((stmt as ArkAssignStmt).getLeftOp());
                }
            }
            if (results.length === this.getParameters().length) {
                return results;
            }
        }
        return results;
    }

    public getThisInstance(): Value | null {
        // 获取方法体中This实例
        let stmts: Stmt[] = [];
        if (this.getCfg()) {
            const cfg = this.getCfg() as Cfg;
            cfg.getStmts().forEach(stmt => stmts.push(stmt));
        }
        for (let stmt of stmts) {
            if (stmt instanceof ArkAssignStmt) {
                if (stmt.getRightOp() instanceof ArkThisRef) {
                    return stmt.getLeftOp();
                }
            }
        }
        return null;
    }

    public getReturnValues(): Value[] {
        // 获取方法体中return值实例
        let resultValues: Value[] = [];
        this.getCfg()
            ?.getStmts()
            .forEach(stmt => {
                if (stmt instanceof ArkReturnStmt) {
                    resultValues.push(stmt.getOp());
                }
            });
        return resultValues;
    }

    public getReturnStmt(): Stmt[] {
        return (
            this.getCfg()
                ?.getStmts()
                .filter(stmt => stmt instanceof ArkReturnStmt) ?? []
        );
    }

    public getReturnVoidStmt(): ArkReturnVoidStmt[] {
        return (
            this.getCfg()
                ?.getStmts()
                .filter(stmt => stmt instanceof ArkReturnVoidStmt) ?? []
        );
    }

    public setViewTree(viewTree: ViewTree): void {
        this.viewTree = viewTree;
    }

    public getViewTree(): ViewTree | undefined {
        return this.viewTree;
    }

    public hasViewTree(): boolean {
        return this.viewTree !== undefined;
    }

    public setBodyBuilder(bodyBuilder: BodyBuilder): void {
        this.bodyBuilder = bodyBuilder;
        if (this.getDeclaringArkFile().getScene().buildClassDone()) {
            this.buildBody();
        }
    }

    public setCxxBodyBuilder(bodyBuilder: CxxBodyBuilder): void {
        this.CxxBodyBuilder = bodyBuilder;
        if (this.getDeclaringArkFile().getScene().buildClassDone()) {
            this.buildBody();
        }
    }

    public freeBodyBuilder(): void {
        this.bodyBuilder = undefined;
    }

    public freeCxxBodyBuilder(): void {
        this.CxxBodyBuilder = undefined;
    }

    public buildBody(): void {
        if (this.bodyBuilder) {
            const arkBody: ArkBody | null = this.bodyBuilder.build();
            if (arkBody) {
                this.setBody(arkBody);
                arkBody.getCfg().setDeclaringMethod(this);
                if (this.getOuterMethod() === undefined) {
                    this.bodyBuilder.handleGlobalAndClosure();
                }
            }
        }
        // CXXTodo: Building body for Cxx. After the BodyBuilder completes abstraction, this part needs to be refactored.
        if (this.CxxBodyBuilder) {
            const arkBody: ArkBody | null = this.CxxBodyBuilder.build();
            if (arkBody) {
                this.setBody(arkBody);
                arkBody.getCfg().setDeclaringMethod(this);
                if (this.getOuterMethod() === undefined) {
                    this.CxxBodyBuilder.handleGlobalAndClosure();
                }
            }
        }
    }

    public isGenerated(): boolean {
        return this.containsTag(BaseModelTag.GENERATED);
    }

    public setIsGeneratedFlag(isGeneratedFlag: boolean): void {
        if (isGeneratedFlag) {
            this.addTag(BaseModelTag.GENERATED);
        } else {
            this.removeTag(BaseModelTag.GENERATED);
        }
    }

    public getAsteriskToken(): boolean {
        return this.containsTag(BaseModelTag.ASTERISK_TOKEN);
    }

    public setAsteriskToken(asteriskToken: boolean): void {
        if (asteriskToken) {
            this.addTag(BaseModelTag.ASTERISK_TOKEN);
        } else {
            this.removeTag(BaseModelTag.ASTERISK_TOKEN);
        }
    }

    public validate(): ArkError {
        const declareSignatures = this.getDeclareSignatures();
        const declarePositions = this.getDeclareOriginFullPositions();
        const signature = this.getImplementationSignature();
        const originFullPosition = this.getImplOriginFullPosition();

        if (declareSignatures === null && signature === null) {
            return {
                errCode: ArkErrorCode.METHOD_SIGNATURE_UNDEFINED,
                errMsg: 'declareSignatures and methodSignature are both undefined.',
            };
        }
        if ((declareSignatures === null) !== (declarePositions === null)) {
            return {
                errCode: ArkErrorCode.METHOD_SIGNATURE_LINE_UNMATCHED,
                errMsg: 'declareSignatures and declareOriginFullPositions are not matched.',
            };
        }
        if (declareSignatures !== null && declarePositions !== null && declareSignatures.length !== declarePositions.length) {
            return {
                errCode: ArkErrorCode.METHOD_SIGNATURE_LINE_UNMATCHED,
                errMsg: 'declareSignatures and declareOriginFullPositions are not matched.',
            };
        }
        if ((signature === null) !== (originFullPosition === undefined)) {
            return {
                errCode: ArkErrorCode.METHOD_SIGNATURE_LINE_UNMATCHED,
                errMsg: 'methodSignature and originFullPosition are not matched.',
            };
        }
        return this.validateFields(['declaringArkClass']);
    }

    public matchMethodSignature(args: Value[]): MethodSignature {
        const signatures = this.declareSignatures?.filter((f: MethodSignature) => {
            const parameters = f.getMethodSubSignature().getParameters();
            const max = parameters.length;
            let min = 0;
            while (min < max && !parameters[min].isOptional()) {
                min++;
            }
            return args.length >= min && args.length <= max;
        });
        return (
            signatures?.find((p: MethodSignature) =>
                ModelUtils.isMatched(
                    p.getMethodSubSignature().getParameters(),
                    args,
                    this.getDeclaringArkFile().getScene()
                )
            ) ??
            signatures?.[0] ??
            this.getSignature()
        );
    }

    public getOuterMethod(): ArkMethod | undefined {
        return this.outerMethod;
    }

    public setOuterMethod(method: ArkMethod): void {
        this.outerMethod = method;
    }

    public getFunctionLocal(name: string): Local | null {
        const local = this.getBody()?.getLocals().get(name);
        // CXXTodo: The type of a function pointer in CXX is 'PointerType(FunctionType, 1)'
        if (!local) {
            return null;
        }
        const localType = local.getType();
        if (localType instanceof FunctionType || (localType instanceof PointerType && localType.getBaseType() instanceof FunctionType)) {
            return local;
        }
        return null;
    }

    public setQuestionToken(questionToken: boolean): void {
        if (questionToken) {
            this.addTag(BaseModelTag.QUESTION_TOKEN);
        } else {
            this.removeTag(BaseModelTag.QUESTION_TOKEN);
        }
    }

    public getQuestionToken(): boolean {
        return this.containsTag(BaseModelTag.QUESTION_TOKEN);
    }

    // For class method, if there is no public/private/protected access modifier, it is actually public
    public isPublic(): boolean {
        if (
            !this.containsModifier(ModifierType.PUBLIC) &&
            !this.containsModifier(ModifierType.PRIVATE) &&
            !this.containsModifier(ModifierType.PROTECTED) &&
            !this.getDeclaringArkClass().isDefaultArkClass() &&
            !this.isGenerated() &&
            !this.isAnonymousMethod() &&
            this.getName() !== CONSTRUCTOR_NAME &&
            this.getDeclaringArkClass().getCategory() === ClassCategory.CLASS
        ) {
            return true;
        }
        return this.containsModifier(ModifierType.PUBLIC);
    }
}
