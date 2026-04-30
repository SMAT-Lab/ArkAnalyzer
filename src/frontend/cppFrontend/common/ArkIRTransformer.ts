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

import {
    AbstractExpr,
    AbstractInvokeExpr,
    AliasTypeExpr,
    ArkCastExpr,
    ArkConditionExpr,
    ArkInstanceInvokeExpr,
    ArkNormalBinopExpr,
    ArkStaticInvokeExpr,
    ArkUnopExpr,
    NormalBinaryOperator,
    RelationalBinaryOperator,
    UnaryOperator,
} from '../../../core/base/Expr';
import {
    ArkArrayRef,
    ArkCaughtExceptionRef,
    ArkInstanceFieldRef,
    ArkParameterRef,
    ArkThisRef,
    GlobalRef,
} from '../../../core/base/Ref';
import { Value } from '../../../core/base/Value';
import * as ts from 'ohos-typescript';
import { Local } from '../../../core/base/Local';
import {
    ArkAliasTypeDefineStmt,
    ArkAssignStmt,
    ArkIfStmt,
    ArkInvokeStmt,
    ArkReturnStmt,
    ArkReturnVoidStmt,
    ArkThrowStmt,
    Stmt,
} from '../../../core/base/Stmt';
import {
    AliasType,
    BooleanType,
    ClassType,
    UnknownType,
    VoidType,
    Type,
    AnyType,
    ArrayType,
    StringType,
} from '../../../core/base/Type';
import { CxxValueUtil } from './ValueUtil';
import { IRUtils } from './IRUtils';
import { ArkMethod } from '../../../core/model/ArkMethod';
import { COMPONENT_CREATE_FUNCTION, COMPONENT_POP_FUNCTION, COMPONENT_REPEAT } from '../../../core/common/EtsConst';
import { FullPosition } from '../../../core/base/Position';
import { ArkCxxValueTransformer } from './ArkValueTransformer';
import {
    AliasTypeSignature,
    ClassSignature,
    FieldSignature,
    MethodSignature,
    MethodSubSignature,
} from '../../../core/model/ArkSignature';
import { BuiltinCxx } from './Builtin';
import { ArkSignatureBuilder } from '../../../core/model/builder/ArkSignatureBuilder';
import { ArkIRTransformer, DummyStmt } from '../../../core/common/ArkIRTransformer';
import { AbstractTypeExpr } from '../../../core/base/TypeExpr';
import { buildModifiers, buildTypeParameters, cxxNode2Type } from '../model/builder/builderUtils';
import { ModelUtils } from '../../../core/common/ModelUtils';
import { ArkClass } from '../../../core/model/ArkClass';
import { buildNormalArkClassFromArkMethod } from '../model/builder/ArkClassBuilder';
import { astKind, CxxAstNode, CxxTranslationUnit } from '../ast';
import { ValueUtil } from '../../../core/common/ValueUtil';
import { CxxCharType, CxxStdTypeName, CxxTypeBitWidth, CxxTypeSigned, PointerType } from '../base/Type';
import { buildGenericType } from '../../../core/model/builder/builderUtils';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import { classMap } from '../model/builder/ArkFileBuilder';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkIRTransformer');
export type ValueAndStmts = {
    value: Value;
    valueOriginalPositions: FullPosition[]; // original positions of value and its uses
    stmts: Stmt[];
};

function nodeInnerNode(node: CxxAstNode): CxxAstNode {
    if (node.inner && node.inner.length > 0) {
        return node.inner[0];
    }
    console.log('unsupported node !');
    return { kind: 'unsupported kind' } as CxxAstNode;
}

export class ArkCxxIRTransformer extends ArkIRTransformer {
    public static readonly DUMMY_IF_OPERATOR_AND_SIGNAL = 'If(&&)';
    public static readonly DUMMY_IF_OPERATOR_END = 'IfEnd';
    public static readonly DUMMY_IF_OPERATOR_OR_SIGNAL = 'If(||)';
    private readonly cxxSourceFile: CxxTranslationUnit;
    private ArkCxxValueTransformer: ArkCxxValueTransformer;
    private catchedExceptions: Value[] = [];

    constructor(sourceFile: CxxTranslationUnit, declaringMethod: ArkMethod) {
        super(sourceFile as unknown as ts.SourceFile, declaringMethod);
        this.cxxSourceFile = sourceFile;
        this.ArkCxxValueTransformer = new ArkCxxValueTransformer(this, this.cxxSourceFile, this.declaringMethod);
    }

    public getLocals(): Set<Local> {
        return this.ArkCxxValueTransformer.getLocals();
    }

    public getGlobals(): Map<string, GlobalRef> | null {
        return this.ArkCxxValueTransformer.getGlobals();
    }

    public getThisLocal(): Local {
        return this.ArkCxxValueTransformer.getThisLocal();
    }

    public getAliasTypeMap(): Map<string, [AliasType, ArkAliasTypeDefineStmt]> {
        return this.ArkCxxValueTransformer.getAliasTypeMap();
    }

    public prebuildStmts(): Stmt[] {
        const stmts: Stmt[] = [];
        let index = 0;
        for (const methodParameter of this.declaringMethod.getParameters()) {
            const parameterRef = new ArkParameterRef(index, methodParameter.getType());
            stmts.push(new ArkAssignStmt(this.ArkCxxValueTransformer.addNewLocal(methodParameter.getName(), parameterRef.getType()), parameterRef));
            index++;
        }

        const thisRef = new ArkThisRef(this.ArkCxxValueTransformer.getThisLocal().getType() as ClassType);
        stmts.push(new ArkAssignStmt(this.ArkCxxValueTransformer.getThisLocal(), thisRef));
        return stmts;
    }

    // Determine whether to generate temporary variable assignment statement based on operator
    private shouldGenerateCxxExtraAssignStmt(expression: CxxAstNode): boolean {
        if (expression.kind === astKind.ParentExpr) {
            return this.shouldGenerateCxxExtraAssignStmt(expression.inner[0]);
        }
        return !(
            (expression.kind === astKind.BinaryOperator && expression.opcode === '=') ||
            ArkCxxValueTransformer.isCxxCompoundAssignmentOperator(expression.opcode) ||
            expression.kind === astKind.CXXNewExpr ||
            expression.kind === astKind.CallExpr ||
            (expression.kind === astKind.UnaryOperator && (expression.opcode === '++' || expression.opcode === '--')) ||
            expression.kind === astKind.CXXOperatorCallExpr ||
            expression.kind === astKind.CXXConstructExpr ||
            expression.kind === astKind.CXXCtorInitializer
        );
    }

    /** The main function for converting C++ AST nodes to Stmts */
    public cxxNodeToStmts(node: CxxAstNode): Stmt[] {
        let stmts: Stmt[] = [];
        switch (node.kind) {
            case astKind.ParmVarDecl:
                stmts = this.cxxParameterToStmts(node);
                break;
            case astKind.BreakStmt:
            case astKind.ContinueStmt:
            case astKind.GotoStmt:
                stmts = [];
                break;
            case astKind.CXXRewrittenBinaryOperator:
            case astKind.BinaryOperator:
            case astKind.CallExpr:
            case astKind.CompoundAssignOperator:
            case astKind.CXXConstructExpr:
            case astKind.CXXOperatorCallExpr:
            case astKind.UnaryOperator:
            case astKind.RecoveryExpr:
            case astKind.CXXDeleteExpr:
            case astKind.AtomicCallExpr:
            case astKind.CXXCtorInitializer:
                stmts = this.cxxExpressionStatementToStmts(node);
                break;
            case astKind.DeclStmt:
                stmts = this.cxxDeclStatementToStmts(node);
                break;
            case astKind.VarDecl:
                stmts = this.cxxVariableDeclarationListToStmts(node);
                break;
            case astKind.CompoundStmt:
                stmts = this.compoundToStmts(node);
                break;
            case astKind.CXXMemberCallExpr:
                stmts = this.memberCallExprToStmts(node);
                break;
            case astKind.CXXCatchStmt:
                stmts = this.cxxCatchClauseToStmts(node);
                break;
            case astKind.CXXThrowExpr:
                stmts = this.cxxThrowStatementToStmts(node);
                break;
            case astKind.DoStmt:
                stmts = this.cxxDoStatementToStmts(node);
                break;
            case astKind.ExprWithCleanups:
                stmts = this.expressionWithCleanup(node);
                break;
            case astKind.ForStmt:
                stmts = this.cxxForStatementToStmts(node);
                break;
            case astKind.IfStmt:
                stmts = this.cxxIfStatementToStmts(node);
                break;
            case astKind.ReturnStmt:
                stmts = this.cxxReturnStatementToStmts(node);
                break;
            case astKind.WhileStmt:
                stmts = this.cxxWhileStatementToStmts(node);
                break;
            case astKind.CXXForRangeStmt:
                stmts = this.forRangeStatementToStmts(node);
                break;
            case astKind.TypedefDecl:
            case astKind.TypeAliasDecl:
                stmts = this.typeDefDeclToStmts(node);
                break;
            case astKind.TypeAliasTemplateDecl:
                stmts = this.typeDefDeclToStmts(node);
                break;
            case astKind.EnumDecl:
            case astKind.CXXRecordDecl:
                stmts = this.cxxClassDeclarationToStmts(node);
                break;
            case astKind.DecompositionDecl:
                stmts = this.decompositionDeclToStmts(node);
                break;
            default:
                logger.warn('this ' + node.kind + ' is not supported');
                break;
        }
        this.cxxMapStmtsToTsStmt(stmts, node);
        if (stmts.length > 0) {
            IRUtils.setComments(stmts[0], node, this.cxxSourceFile, this.declaringMethod.getDeclaringArkFile().getScene().getOptions());
        }
        return stmts;
    }

    private cxxClassDeclarationToStmts(node: CxxAstNode): Stmt[] {
        const cls = new ArkClass();
        const declaringArkNamespace = this.declaringMethod.getDeclaringArkClass().getDeclaringArkNamespace();
        if (declaringArkNamespace) {
            cls.setDeclaringArkNamespace(declaringArkNamespace);
        }
        cls.setDeclaringArkFile(this.declaringMethod.getDeclaringArkFile());
        buildNormalArkClassFromArkMethod(node, cls, this.cxxSourceFile, this.declaringMethod);
        return [];
    }

    private typeDefDeclToStmts(typeAliasDeclaration: CxxAstNode): Stmt[] {
        // 1. Preprocess node to get the actual declaration and type string
        const { rightOp, typeNode } = this.preprocessTypeAlias(typeAliasDeclaration);

        // 2. Resolve the underlying type (handling anonymous types and AbstractTypeExpr)
        let rightType = this.resolveInitialRightType(typeAliasDeclaration);

        // 3. Create the AliasType instance
        const aliasName = typeAliasDeclaration.name;
        const aliasType = new AliasType(aliasName, rightType,
            new AliasTypeSignature(aliasName, this.declaringMethod.getSignature()));

        // 4. Handle Template definitions and 'typename' keyword logic
        this.configureTemplateAndTypename(typeAliasDeclaration, aliasType, rightOp, rightType);

        // 5. Generate the type expression
        const expr = this.cxxGenerateAliasTypeExpr(rightOp, aliasType);

        // 6. Populate real generic types if it is a template declaration
        this.populateRealGenericTypes(typeAliasDeclaration, expr);

        // 7. Set modifiers
        aliasType.setModifiers(buildModifiers(typeAliasDeclaration));

        // 8. Create and return the statement
        const stmt = this.createAliasStmt(aliasType, expr, typeAliasDeclaration, typeNode);

        this.getAliasTypeMap().set(aliasName, [aliasType, stmt]);
        return [stmt];
    }

    /**
     * Extracts the target declaration node and the type string (right operand).
     */
    private preprocessTypeAlias(node: CxxAstNode): {
        targetDecl: CxxAstNode,
        rightOp: string,
        typeNode: CxxAstNode | undefined
    } {
        let targetDecl: CxxAstNode = node;
        if (node.kind === astKind.TypeAliasTemplateDecl) {
            targetDecl = node.inner[node.inner.length - 1];
        }

        const typeNode: CxxAstNode | undefined = Array.isArray(targetDecl.inner) ? targetDecl.inner[0] : undefined;

        let rightOp = node.type?.desugaredQualType ?? 'unknown';
        if (rightOp === 'unknown') {
            logger.warn(`${node} is a new style that is not supported.`);
        }

        return { targetDecl, rightOp, typeNode };
    }

    /**
     * Resolves the basic right-hand side type, handling anonymous structs/unions/enums.
     */
    private resolveInitialRightType(node: CxxAstNode): Type {
        let rightType = this.getAnonymousInformation(node);
        if (rightType instanceof AbstractTypeExpr) {
            rightType = rightType.getType();
        }
        return rightType;
    }

    /**
     * Configures generics for template aliases and handles the 'typename' keyword.
     */
    private configureTemplateAndTypename(node: CxxAstNode, aliasType: AliasType, rightOp: string, initialRightType: Type): void {
        // Handle Template Alias
        if (node.kind === astKind.TypeAliasTemplateDecl) {
            const genericTypes = buildTypeParameters(node, this.cxxSourceFile, this.declaringMethod);
            aliasType.setGenericTypes(genericTypes);
            aliasType.setOriginalType(buildGenericType(initialRightType, aliasType));
        }

        // Handle scenario: template<typename T> using value_type_t = typename T::value_type;
        if (rightOp.startsWith(BuiltinCxx.TYPENAME_KEYWORD)) {
            const firstGeneric = aliasType.getGenericTypes()?.[0];
            if (firstGeneric) {
                aliasType.setOriginalType(firstGeneric);
            }
        }
    }

    /**
     * Extracts real generic types from TemplateTypeParmDecl nodes and sets them on the expression.
     */
    private populateRealGenericTypes(node: CxxAstNode, expr: AliasTypeExpr): void {
        if (node.kind === astKind.TypeAliasTemplateDecl) {
            const realGenericTypes: Type[] = [];
            node.inner.filter(inn => inn.kind === astKind.TemplateTypeParmDecl)
                .forEach(typeArgument => {
                    realGenericTypes.push(cxxNode2Type(typeArgument, this.declaringMethod));
                });
            expr.setRealGenericTypes(realGenericTypes);
        }
    }

    /**
     * Constructs the final ArkAliasTypeDefineStmt and sets source positions.
     */
    private createAliasStmt(aliasType: AliasType, expr: AliasTypeExpr, node: CxxAstNode, typeNode: CxxAstNode | undefined): ArkAliasTypeDefineStmt {
        const stmt = new ArkAliasTypeDefineStmt(aliasType, expr);

        const leftPosition = FullPosition.cxxBuildFromNode(node, this.cxxSourceFile);
        const rightPosition = FullPosition.cxxBuildFromNode(typeNode, this.cxxSourceFile);

        stmt.setOperandOriginalPositions([leftPosition, rightPosition]);
        return stmt;
    }

    private getAnonymousInformation(node: CxxAstNode): Type {
        if (node.inner.length === 0 && node.originalId) {
            const cls = classMap.get(node.originalId);
            if (cls) {
                return new ClassType(cls.getSignature());
            }
        }
        return cxxNode2Type(node, this.declaringMethod);
    }

    // When there are default parameters, how to handle them
    private cxxParameterToStmts(parameter: CxxAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        let paramName: string = parameter.name;
        const paramLocal = Array.from(this.getLocals()).find(local => local.getName() === paramName);
        if (paramLocal === undefined) {
            return stmts;
        }
        // Inner contains only one element, indicating that no default value has been declared
        const length = parameter.inner.length;
        if (parameter.inner[0].code === 'maybe_unused' && length === 1) {
            return stmts;
        }
        // The last element is the default value
        const {
            value: paramInitValue,
            valueOriginalPositions: paramInitPositions,
            stmts: paramInitStmts,
        } = this.cxxNodeToValueAndStmts(parameter.inner[length - 1]);

        stmts.push(...paramInitStmts);

        const ifStmt = new ArkIfStmt(new ArkConditionExpr(paramLocal, ValueUtil.getUndefinedConst(), RelationalBinaryOperator.Equality));
        ifStmt.setOperandOriginalPositions([FullPosition.DEFAULT, FullPosition.DEFAULT]);
        stmts.push(ifStmt);

        const currConditionalOperatorIndex = this.arkValueTransformer.conditionalOperatorNo++;
        stmts.push(new DummyStmt(ArkIRTransformer.DUMMY_CONDITIONAL_OPERATOR_IF_TRUE_STMT + currConditionalOperatorIndex));

        const assignStmt = new ArkAssignStmt(paramLocal, paramInitValue);
        assignStmt.setOperandOriginalPositions([FullPosition.DEFAULT, ...paramInitPositions]);
        stmts.push(assignStmt);
        stmts.push(new DummyStmt(ArkIRTransformer.DUMMY_CONDITIONAL_OPERATOR_IF_FALSE_STMT + currConditionalOperatorIndex));
        stmts.push(new DummyStmt(ArkIRTransformer.DUMMY_CONDITIONAL_OPERATOR_END_STMT + currConditionalOperatorIndex));

        return stmts;
    }

    private cxxGenerateAliasTypeExpr(rightOp: String, aliasType: AliasType): AliasTypeExpr {
        let rightType = aliasType.getOriginalType();
        let expr: AliasTypeExpr;
        expr = new AliasTypeExpr(rightType, false);
        // For statements like type A = {x:1, y:2}, the ClassType can be accurately obtained at this stage,
        // and the corresponding ArkClass needs to be found as originalObject.
        // For other cases, this is UnclearReferenceType here and will be found and processed by type inference
        if (rightType instanceof ClassType) {
            const classObject = ModelUtils.getClassWithName(rightType.getClassSignature().getClassName(), this.declaringMethod.getDeclaringArkClass());
            if (classObject) {
                expr.setOriginalObject(classObject);
            }
        }
        return expr;
    }

    private forRangeStatementToStmts(forOfStatement: CxxAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        let entry = forOfStatement.inner[1];
        // Handle iterable initialization
        let {
            iterablePositions,
            iteratorInvokeExpr,
            iteratorInvokeExprPositions,
        } = this.handleForRangeIterInit(entry, stmts);
        const base = iteratorInvokeExpr.getBase();
        // Handle iterable begin
        const {
            iterator,
            doneFieldRef,
            doneFieldRefPositions,
        } = this.handleForRangeIterBegin(iteratorInvokeExpr, iteratorInvokeExprPositions, stmts, iterablePositions, base);
        // Handle iterable end
        const {
            iteratorNextInvokeExpr, iteratorNextInvokeExprPositions,
        } = this.handleForRangeIterEnd(doneFieldRef, doneFieldRefPositions, stmts, iterator as Local);
        // Handle iterable result value
        const {
            valueFieldRef,
            valueFieldRefPositions,
        } = this.handleForRangeIterResult(iteratorNextInvokeExpr, iteratorNextInvokeExprPositions, stmts, iterator as Local);

        // Handle whether iterable is finished
        const {
            value: yieldValue,
            valueOriginalPositions: yieldValuePositions,
            stmts: yieldValueStmts,
        } = this.generateAssignStmtForValue(valueFieldRef, valueFieldRefPositions);
        stmts.push(...yieldValueStmts);
        const castExpr = new ArkCastExpr(yieldValue, UnknownType.getInstance());
        const castExprPositions = [yieldValuePositions[0], ...yieldValuePositions];
        let declStmts: CxxAstNode = forOfStatement.inner[0];
        declStmts = declStmts.kind === astKind.DeclStmt ? declStmts.inner[0] : declStmts;
        if (declStmts.kind === astKind.VarDecl) {
            const {
                value: initValue,
                valueOriginalPositions: initOriPos,
                stmts: initStmts,
            } = this.ArkCxxValueTransformer.cxxVariableDeclarationToValueAndStmts(declStmts, false);
            const assignStmt = new ArkAssignStmt(initValue, castExpr);
            assignStmt.setOperandOriginalPositions([...initOriPos, ...castExprPositions]);
            stmts.push(assignStmt);
            stmts.push(...initStmts);
            // Processing structured binding under cyclic conditions
        } else if (declStmts.kind === astKind.DecompositionDecl) {
            const {
                stmts: initStmts,
            } = this.ArkCxxValueTransformer.bindingNodeToValueAndStmts(declStmts, yieldValue);
            stmts.push(...initStmts);
        } else {
            const {
                value: initValue,
                valueOriginalPositions: initOriPos,
                stmts: initStmts,
            } = this.cxxNodeToValueAndStmts(declStmts);
            const assignStmt = new ArkAssignStmt(initValue, castExpr);
            assignStmt.setOperandOriginalPositions([...initOriPos, ...castExprPositions]);
            stmts.push(...initStmts);
            stmts.push(assignStmt);
        }
        return stmts;
    }

    private handleForRangeIterInit(entry: CxxAstNode, stmts: Stmt[],
    ): {
        iterablePositions: FullPosition[],
        iteratorInvokeExpr: ArkInstanceInvokeExpr,
        iteratorInvokeExprPositions: FullPosition[]
    } {
        let {
            value: iterableValue,
            valueOriginalPositions: iterablePositions,
            stmts: iterableStmts,
        } = this.cxxNodeToValueAndStmts(entry);
        stmts.push(...iterableStmts);
        if (!(iterableValue instanceof Local)) {
            ({
                value: iterableValue,
                valueOriginalPositions: iterablePositions,
                stmts: iterableStmts,
            } = this.generateAssignStmtForValue(iterableValue, iterablePositions));
            stmts.push(...iterableStmts);
        }
        const iteratorMethodSubSignature = new MethodSubSignature(BuiltinCxx.ITERATOR_FUNCTION, [], BuiltinCxx.ITERATOR_CLASS_TYPE);
        const iteratorMethodSignature = new MethodSignature(ClassSignature.DEFAULT, iteratorMethodSubSignature);
        const iteratorInvokeExpr = new ArkInstanceInvokeExpr(iterableValue as Local, iteratorMethodSignature, []);
        const iteratorInvokeExprPositions = [iterablePositions[0], ...iterablePositions];
        return { iterablePositions, iteratorInvokeExpr, iteratorInvokeExprPositions };
    }

    private handleForRangeIterBegin(
        iteratorInvokeExpr: ArkInstanceInvokeExpr,
        iteratorInvokeExprPositions: FullPosition[],
        stmts: Stmt[],
        iterablePositions: FullPosition[],
        base: Local,
    ): { iterator: Value, doneFieldRef: ArkInstanceFieldRef, doneFieldRefPositions: FullPosition[] } {
        const {
            value: iterator,
            valueOriginalPositions: iteratorPositions,
            stmts: iteratorStmts,
        } = this.generateAssignStmtForValue(iteratorInvokeExpr, iteratorInvokeExprPositions);
        stmts.push(...iteratorStmts);
        if (iterator instanceof Local) {
            iterator.setType(BuiltinCxx.ITERATOR_CLASS_TYPE);
        } else {
            logger.error(LOG_MODULE_TYPE.DEFAULT, 'iterator is not a local');
        }

        const baseType = base.getType();
        const beginFieldSignature = baseType instanceof ClassType ? new FieldSignature(BuiltinCxx.ITERATOR_RESULT_BEGIN,
                baseType.getClassSignature(), BooleanType.getInstance(), false) :
            new FieldSignature(BuiltinCxx.ITERATOR_RESULT_BEGIN, BuiltinCxx.ITERATOR_RESULT_CLASS_SIGNATURE,
                BooleanType.getInstance(), false);
        const beginFieldRef = new ArkInstanceFieldRef(base, beginFieldSignature);
        const beginStmt = new ArkAssignStmt(iterator, beginFieldRef);
        stmts.push(beginStmt);
        const dummyInitializerStmt = new DummyStmt(ArkIRTransformer.DUMMY_LOOP_INITIALIZER_STMT);
        stmts.push(dummyInitializerStmt);
        const doneFieldSignature = baseType instanceof ClassType ? new FieldSignature(BuiltinCxx.ITERATOR_RESULT_END,
                baseType.getClassSignature(), BooleanType.getInstance(), false) :
            new FieldSignature(BuiltinCxx.ITERATOR_RESULT_END, BuiltinCxx.ITERATOR_RESULT_CLASS_SIGNATURE,
                BooleanType.getInstance(), false);
        const doneFieldRef = new ArkInstanceFieldRef(base, doneFieldSignature);
        const doneFieldRefPositions = [iteratorPositions[0], ...iterablePositions];
        return { iterator, doneFieldRef, doneFieldRefPositions };
    }

    private handleForRangeIterEnd(
        doneFieldRef: ArkInstanceFieldRef,
        doneFieldRefPositions: FullPosition[],
        stmts: Stmt[],
        iterator: Local,
    ): { iteratorNextInvokeExpr: ArkInstanceInvokeExpr, iteratorNextInvokeExprPositions: FullPosition[] } {
        const {
            value: doneFlag,
            valueOriginalPositions: doneFlagPositions,
            stmts: doneFlagStmts,
        } = this.generateAssignStmtForValue(doneFieldRef, doneFieldRefPositions);
        stmts.push(...doneFlagStmts);
        (doneFlag as Local).setType(BooleanType.getInstance());
        const conditionExpr = new ArkConditionExpr(iterator, doneFlag, RelationalBinaryOperator.Equality);
        const conditionExprPositions = [doneFlagPositions[0], ...doneFlagPositions, FullPosition.DEFAULT];
        const ifStmt = new ArkIfStmt(conditionExpr);
        ifStmt.setOperandOriginalPositions(conditionExprPositions);
        stmts.push(ifStmt);

        const nextMethodSubSignature = new MethodSubSignature(BuiltinCxx.ITERATOR_NEXT, [], BuiltinCxx.ITERATOR_RESULT_CLASS_TYPE);
        const nextMethodSignature = new MethodSignature(ClassSignature.DEFAULT, nextMethodSubSignature);
        const iteratorNextInvokeExpr = new ArkInstanceInvokeExpr(iterator as Local, nextMethodSignature, []);
        const iteratorNextInvokeExprPositions = [doneFieldRefPositions[0], ...doneFieldRefPositions];

        return { iteratorNextInvokeExpr, iteratorNextInvokeExprPositions };
    }

    private handleForRangeIterResult(iteratorNextInvokeExpr: ArkInstanceInvokeExpr,
                                     iteratorNextInvokeExprPositions: FullPosition[], stmts: Stmt[], iterator: Local,
    ): { valueFieldRef: ArkInstanceFieldRef, valueFieldRefPositions: FullPosition[] } {
        const nextStmt = new ArkAssignStmt(iterator, iteratorNextInvokeExpr);
        stmts.push(nextStmt);
        const valueFieldSignature = new FieldSignature(
            BuiltinCxx.ITERATOR_VALUE,
            BuiltinCxx.ITERATOR_CLASS_SIGNATURE,
            UnknownType.getInstance(),
            false,
        );
        const valueFieldRef = new ArkInstanceFieldRef(iterator, valueFieldSignature);
        const valueFieldRefPositions = [iteratorNextInvokeExprPositions[0], ...iteratorNextInvokeExprPositions];
        return { valueFieldRef, valueFieldRefPositions };
    }

    private cxxCatchClauseToStmts(catchClause: CxxAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        // When the scenario is catch (...), inner [0] is the exception handling content, and in other cases, it is the exception type
        if (catchClause.inner && catchClause.inner.length > 1) {
            const {
                value: catchValue,
                valueOriginalPositions: catchOriPos,
                stmts: catchStmts,
            } = this.ArkCxxValueTransformer.cxxVariableDeclarationToValueAndStmts(catchClause.inner[0], false);
            this.catchedExceptions.push(catchValue);
            const caughtExceptionRef = new ArkCaughtExceptionRef(catchValue.getType());
            const assignStmt = new ArkAssignStmt(catchValue, caughtExceptionRef);
            assignStmt.setOperandOriginalPositions(catchOriPos);
            stmts.push(assignStmt);
            stmts.push(...catchStmts);
        } else { // When the scenario is catch (...)
            const caughtExceptionRef = new ArkCaughtExceptionRef(AnyType.getInstance());
            const catchValue = new Local('error');
            this.catchedExceptions.push(catchValue);
            const assignStmt = new ArkAssignStmt(catchValue, caughtExceptionRef);
            assignStmt.setOriginFullPosition(FullPosition.cxxBuildFromNode(catchClause, this.cxxSourceFile));
            stmts.push(assignStmt);
        }

        return stmts;
    }

    /** The main function for converting C++ AST nodes to ValueAndStmts */
    public cxxNodeToValueAndStmts(node: CxxAstNode): ValueAndStmts {
        return this.ArkCxxValueTransformer.cxxNodeToValueAndStmts(node);
    }

    private cxxReturnStatementToStmts(returnStatement: CxxAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        if (returnStatement.inner.length > 0) {
            let {
                value: exprValue,
                valueOriginalPositions: exprPositions,
                stmts: exprStmts,
            } = this.cxxNodeToValueAndStmts(returnStatement.inner[0]);
            stmts.push(...exprStmts);
            if (IRUtils.moreThanOneAddress(exprValue)) {
                ({
                    value: exprValue,
                    valueOriginalPositions: exprPositions,
                    stmts: exprStmts,
                } = this.generateAssignStmtForValue(exprValue, exprPositions));
                stmts.push(...exprStmts);
            }
            const returnStmt = new ArkReturnStmt(exprValue);
            returnStmt.setOperandOriginalPositions(exprPositions);
            stmts.push(returnStmt);
            if (this.declaringMethod.getSubSignature().getReturnType() instanceof UnknownType) {
                this.declaringMethod.getSubSignature().setReturnType(exprValue.getType());
            }
            return stmts;
        }
        stmts.push(new ArkReturnVoidStmt());
        if (this.declaringMethod.getSubSignature().getReturnType() instanceof UnknownType) {
            this.declaringMethod.getSubSignature().setReturnType(VoidType.getInstance());
        }
        return stmts;
    }

    private cxxExpressionStatementToStmts(expressionStatement: CxxAstNode): Stmt[] {
        const {
            value: exprValue,
            valueOriginalPositions: exprPositions,
            stmts: stmts,
        } = this.cxxNodeToValueAndStmts(expressionStatement);
        if (exprValue instanceof AbstractInvokeExpr) {
            this.cxxAddInvokeStmts(exprValue, exprPositions, stmts);
        } else if (this.shouldGenerateCxxExtraAssignStmt(expressionStatement)) {
            const { stmts: exprStmts } = this.generateAssignStmtForValue(exprValue, exprPositions);
            stmts.push(...exprStmts);
        }
        return stmts;
    }

    private cxxAddInvokeStmts(invokeExpr: AbstractInvokeExpr, exprPositions: FullPosition[], stmts: Stmt[]): void {
        const invokeStmt = new ArkInvokeStmt(invokeExpr);
        invokeStmt.setOperandOriginalPositions(exprPositions);
        stmts.push(invokeStmt);

        let hasRepeat: boolean = false;
        for (const stmt of stmts) {
            if (stmt instanceof ArkAssignStmt && stmt.getRightOp() instanceof ArkStaticInvokeExpr) {
                const rightOp = stmt.getRightOp() as ArkStaticInvokeExpr;
                if (rightOp.getMethodSignature().getMethodSubSignature().getMethodName() === COMPONENT_REPEAT) {
                    const createMethodSignature = ArkSignatureBuilder.buildMethodSignatureFromClassNameAndMethodName(
                        COMPONENT_REPEAT,
                        COMPONENT_CREATE_FUNCTION,
                    );
                    const createInvokeExpr = new ArkStaticInvokeExpr(createMethodSignature, rightOp.getArgs());
                    stmt.setRightOp(createInvokeExpr);
                    hasRepeat = true;
                }
            }
        }
        if (hasRepeat) {
            const popMethodSignature = ArkSignatureBuilder.buildMethodSignatureFromClassNameAndMethodName(COMPONENT_REPEAT, COMPONENT_POP_FUNCTION);
            const popInvokeExpr = new ArkStaticInvokeExpr(popMethodSignature, []);
            const popInvokeStmt = new ArkInvokeStmt(popInvokeExpr);
            stmts.push(popInvokeStmt);
        }
    }

    /** Convert C++ switch statements to ValueAndStmts */
    public cxxSwitchStatementToValueAndStmts(switchStatement: CxxAstNode): ValueAndStmts[] {
        // switchNode.inner[length - 2] is the value
        const valueAndStmtsOfSwitchAndCases: ValueAndStmts[] = [];
        const exprStmts: Stmt[] = [];
        for (let i = 0; i < switchStatement.inner.length - 2; i++) {
            exprStmts.push(...this.cxxNodeToValueAndStmts(switchStatement.inner[i]).stmts);
        }
        let {
            value: exprValue,
            valueOriginalPositions: exprPositions,
            stmts: exprTempStmts,
        } = this.cxxNodeToValueAndStmts(switchStatement.inner[switchStatement.inner.length - 2]);
        exprStmts.push(...exprTempStmts);
        if (IRUtils.moreThanOneAddress(exprValue)) {
            ({
                value: exprValue,
                valueOriginalPositions: exprPositions,
                stmts: exprTempStmts,
            } = this.generateAssignStmtForValue(exprValue, exprPositions));
            exprStmts.push(...exprTempStmts);
        }
        valueAndStmtsOfSwitchAndCases.push({
            value: exprValue,
            valueOriginalPositions: exprPositions,
            stmts: exprStmts,
        });
        // switchNode.inner[length - 1] is the cases
        for (const clause of switchStatement.inner[switchStatement.inner.length - 1].inner) {
            if (clause.kind.toString() === astKind.CaseStmt) {
                const clauseStmts: Stmt[] = [];
                let {
                    value: clauseValue,
                    valueOriginalPositions: clausePositions,
                    stmts: clauseTempStmts,
                } = this.cxxNodeToValueAndStmts(clause.inner[0]);
                clauseStmts.push(...clauseTempStmts);
                if (IRUtils.moreThanOneAddress(clauseValue)) {
                    ({
                        value: clauseValue,
                        valueOriginalPositions: clausePositions,
                        stmts: clauseTempStmts,
                    } = this.generateAssignStmtForValue(clauseValue, clausePositions));
                    clauseStmts.push(...clauseTempStmts);
                }
                valueAndStmtsOfSwitchAndCases.push({
                    value: clauseValue,
                    valueOriginalPositions: clausePositions,
                    stmts: clauseStmts,
                });
            }
        }
        return valueAndStmtsOfSwitchAndCases;
    }
    /**
     * Convert C++for statement nodes to Ark IR statement arrays
     * Under forStmt, there will be 5 child nodes. Taking for (a ; b; c) as an example,
     * the content of block a is at node 0, if block b contains assignments, it will be at node 1,
     * the Boolean judgment of block b is at node 2, the successor operation of block c's loop body is at node 3,
     * and the loop body is at node 4
     * @param forStatement -The for statement node in C++AST
     * @returns Converted Ark IR statement array
     */
    private cxxForStatementToStmts(forStatement: CxxAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        let initNode: CxxAstNode[] | undefined;
        let conditionNoe: CxxAstNode | undefined;
        let incrementor: CxxAstNode | undefined;
        // The complete for structure allocates corresponding statements in order, so we need to process them in order.
        if (forStatement.inner.length === 5) {
            initNode = forStatement.inner.slice(0, 2);
            conditionNoe = forStatement.inner[2];
            incrementor = forStatement.inner[3];
        } else {
            logger.error('Current node syntax tree generation error');
            return stmts;
        }

        if (initNode) {
            initNode.forEach(node=>this.cxxNodeToStmts( node).forEach(stmt=>stmts.push(stmt)));
        }
        const dummyInitializerStmt = new DummyStmt(ArkIRTransformer.DUMMY_LOOP_INITIALIZER_STMT);
        stmts.push(dummyInitializerStmt);
        if (conditionNoe.kind === undefined) {
            // The omitted condition always evaluates to true.
            const trueConstant = CxxValueUtil.getBooleanConstant(true);
            const conditionExpr = new ArkConditionExpr(trueConstant, trueConstant, RelationalBinaryOperator.Equality);
            stmts.push(new ArkIfStmt(conditionExpr));
        } else if (conditionNoe) {
            stmts.push(...this.cxxIfStatementToStmts(conditionNoe));
        }
        if (incrementor) {
            stmts.push(...this.cxxNodeToValueAndStmts(incrementor).stmts);
        }
        return stmts;
    }

    private cxxWhileStatementToStmts(whileStatement: CxxAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        const dummyInitializerStmt = new DummyStmt(ArkIRTransformer.DUMMY_LOOP_INITIALIZER_STMT);
        stmts.push(dummyInitializerStmt);
        stmts.push(...this.cxxIfStatementToStmts(whileStatement.inner[0]));
        return stmts;
    }

    private cxxDoStatementToStmts(doStatement: CxxAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        stmts.push(...this.cxxIfStatementToStmts(doStatement.inner[1]));
        return stmts;
    }

    private expressionWithCleanup(exprWithCleanup: CxxAstNode): Stmt[] {
        return this.expressionToStmts(nodeInnerNode(exprWithCleanup));
    }

    private compoundToStmts(expressionStatement: CxxAstNode): Stmt[] {
        return this.memberCallExpressionToStmts(expressionStatement.inner[0]);
    }

    private memberCallExprToStmts(expressionStatement: CxxAstNode): Stmt[] {
        return this.memberCallExpressionToStmts(expressionStatement);
    }

    private memberCallExpressionToStmts(expression: CxxAstNode): Stmt[] {
        const {
            value: exprValue,
            valueOriginalPositions: exprPositions,
            stmts: stmts,
        } = this.cxxNodeToValueAndStmts(expression);
        if (exprValue instanceof AbstractInvokeExpr) {
            const invokeStmt = new ArkInvokeStmt(exprValue);
            invokeStmt.setOperandOriginalPositions(exprPositions);
            stmts.push(invokeStmt);

            let hasRepeat: boolean = false;
            for (const stmt of stmts) {
                if (!(stmt instanceof ArkAssignStmt)) {
                    continue;
                }
                if (!(stmt.getRightOp() instanceof ArkStaticInvokeExpr)) {
                    continue;
                }
                const rightOp = stmt.getRightOp() as ArkStaticInvokeExpr;
                if (rightOp.getMethodSignature().getMethodSubSignature().getMethodName() !== COMPONENT_REPEAT) {
                    continue;
                }
                const createMethodSignature = ArkSignatureBuilder.buildMethodSignatureFromClassNameAndMethodName(
                    COMPONENT_REPEAT,
                    COMPONENT_CREATE_FUNCTION,
                );
                const createInvokeExpr = new ArkStaticInvokeExpr(createMethodSignature, rightOp.getArgs());
                stmt.setRightOp(createInvokeExpr);
                hasRepeat = true;
            }
            if (hasRepeat) {
                const popMethodSignature = ArkSignatureBuilder.buildMethodSignatureFromClassNameAndMethodName(COMPONENT_REPEAT, COMPONENT_POP_FUNCTION);
                const popInvokeExpr = new ArkStaticInvokeExpr(popMethodSignature, []);
                const popInvokeStmt = new ArkInvokeStmt(popInvokeExpr);
                stmts.push(popInvokeStmt);
            }
        } else if (exprValue instanceof AbstractExpr) {
            const { stmts: exprStmts } = this.generateAssignStmtForValue(exprValue, exprPositions);
            stmts.push(...exprStmts);
        }
        return stmts;
    }

    private expressionToStmts(expression: CxxAstNode): Stmt[] {
        const {
            value: exprValue,
            valueOriginalPositions: exprPositions,
            stmts: stmts,
        } = this.cxxNodeToValueAndStmts(expression);
        if (exprValue instanceof AbstractInvokeExpr) {
            const invokeStmt = new ArkInvokeStmt(exprValue);
            invokeStmt.setOperandOriginalPositions(exprPositions);
            stmts.push(invokeStmt);

            let hasRepeat: boolean = false;
            for (const stmt of stmts) {
                // Not an assignment statement: skip
                if (!(stmt instanceof ArkAssignStmt)) {
                    continue;
                }
                const rightOp = stmt.getRightOp?.(); // 如果可能没有这个方法，用可选调用更安全
                // Right side does not exist or is not a static call: skip
                if (!(rightOp instanceof ArkStaticInvokeExpr)) {
                    continue;
                }
                const methodName = rightOp.getMethodSignature().getMethodSubSignature().getMethodName();
                // Not COMPONENT_REPEAT: skip
                if (methodName !== COMPONENT_REPEAT) {
                    continue;
                }
                const createMethodSignature =
                    ArkSignatureBuilder.buildMethodSignatureFromClassNameAndMethodName(
                        COMPONENT_REPEAT,
                        COMPONENT_CREATE_FUNCTION,
                    );

                const createInvokeExpr = new ArkStaticInvokeExpr(
                    createMethodSignature,
                    rightOp.getArgs(),
                );

                stmt.setRightOp(createInvokeExpr);
                hasRepeat = true;
            }
            if (hasRepeat) {
                const popMethodSignature = ArkSignatureBuilder.buildMethodSignatureFromClassNameAndMethodName(COMPONENT_REPEAT, COMPONENT_POP_FUNCTION);
                const popInvokeExpr = new ArkStaticInvokeExpr(popMethodSignature, []);
                const popInvokeStmt = new ArkInvokeStmt(popInvokeExpr);
                stmts.push(popInvokeStmt);
            }
        } else if (exprValue instanceof AbstractExpr) {
            const { stmts: exprStmts } = this.generateAssignStmtForValue(exprValue, exprPositions);
            stmts.push(...exprStmts);
        }
        return stmts;
    }

    private cxxDeclStatementToStmts(declStatement: CxxAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        if (declStatement.inner.length === 0) {
            return this.ArkCxxValueTransformer.cxxVariableDeclarationToValueAndStmts(declStatement).stmts;
        }
        for (const child of declStatement.inner) {
            const childStmts = this.cxxNodeToStmts(child);
            stmts.push(...childStmts);
        }
        return stmts;
    }

    private decompositionDeclToStmts(decompositionDecl: CxxAstNode): Stmt[] {
        return this.ArkCxxValueTransformer.bindingNodeToValueAndStmts(decompositionDecl).stmts;
    }

    private cxxVariableDeclarationListToStmts(variableDeclarationList: CxxAstNode): Stmt[] {
        return this.ArkCxxValueTransformer.cxxVariableDeclarationToValueAndStmts(variableDeclarationList).stmts;
    }

    public cxxIfStatementToStmts(ifStatement: CxxAstNode, depth: number = 0, context?: {
        conditionExpr: Value | undefined
    }): Stmt[] {
        const stmts: Stmt[] = [];
        if (ifStatement.kind === astKind.IfStmt) {
            return this.cxxIfStatementToStmts(ifStatement.inner[0], depth);
        } else if (ifStatement.kind === astKind.BinaryOperator && ifStatement.opcode === '||') {
            // || The child of a node must have two child nodes
            stmts.push(...this.cxxIfStatementToStmts(ifStatement.inner[0], depth + 1));
            stmts.push(new DummyStmt(ArkCxxIRTransformer.DUMMY_IF_OPERATOR_OR_SIGNAL + depth));
            stmts.push(...this.cxxIfStatementToStmts(ifStatement.inner[1], depth + 1));
            stmts.push(new DummyStmt(ArkCxxIRTransformer.DUMMY_IF_OPERATOR_END + depth));
        } else if (ifStatement.kind === astKind.BinaryOperator && ifStatement.opcode === '&&') {
            // && The child of a node must have two child nodes
            stmts.push(...this.cxxIfStatementToStmts(ifStatement.inner[0], depth + 1));
            stmts.push(new DummyStmt(ArkCxxIRTransformer.DUMMY_IF_OPERATOR_AND_SIGNAL + depth));
            stmts.push(...this.cxxIfStatementToStmts(ifStatement.inner[1], depth + 1));
            stmts.push(new DummyStmt(ArkCxxIRTransformer.DUMMY_IF_OPERATOR_END + depth));
        } else if (ifStatement.kind === astKind.ParenExpr) {
            return this.cxxIfStatementToStmts(ifStatement.inner[0], depth);
        } else {
            const { value: conditionExpr, valueOriginalPositions: conditionExprPositions, stmts: conditionStmts } =
                this.ArkCxxValueTransformer.cxxConditionToValueAndStmts(ifStatement);
            stmts.push(...conditionStmts);
            const ifStmt = new ArkIfStmt(conditionExpr as ArkConditionExpr);
            ifStmt.setOperandOriginalPositions(conditionExprPositions);
            stmts.push(ifStmt);
            if (context) {
                context.conditionExpr = conditionExpr;
            }
        }
        return stmts;
    }

    private cxxThrowStatementToStmts(throwStatement: CxxAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        let {
            value: throwValue,
            valueOriginalPositions: throwValuePositions,
            stmts: throwStmts,
        } = this.cxxNodeToValueAndStmts(throwStatement.inner[0]);
        if (throwStatement.inner.length === 0 && this.catchedExceptions.length !== 0) {
            throwValue = this.catchedExceptions[this.catchedExceptions.length - 1];
        }
        stmts.push(...throwStmts);
        const throwStmt = new ArkThrowStmt(throwValue);
        throwStmt.setOperandOriginalPositions(throwValuePositions);
        stmts.push(throwStmt);
        return stmts;
    }

    public cxxMapStmtsToTsStmt(stmts: Stmt[], node: CxxAstNode): void {
        for (const stmt of stmts) {
            if (!this.stmtsHaveOriginalText.has(stmt)) {
                this.stmtsHaveOriginalText.add(stmt);
                stmt.setOriginFullPosition(FullPosition.cxxBuildFromNode(node, this.cxxSourceFile));
                stmt.setOriginalText(node.code);
            }
        }
    }

    /**
     * Converts a C++ token to the corresponding unary operator.
     *
     * @param token - The C++ token to be converted.
     * @returns - The corresponding `UnaryOperator` if the token matches, otherwise `null`.
     */
    public static cxxTokenToUnaryOperator(token: string): UnaryOperator | null {
        switch (token) {
            case '-':
                return UnaryOperator.Neg;
            case '~':
                return UnaryOperator.BitwiseNot;
            case '!':
                return UnaryOperator.LogicalNot;
            case '&':
                return UnaryOperator.Addr;
            case '*':
                return UnaryOperator.Deref;
            default:
        }
        return null;
    }

    public generateAssignStmtForValue(value: Value, valueOriginalPositions: FullPosition[]): ValueAndStmts {
        let valueType: Type;
        if (value instanceof ArkUnopExpr) {
            valueType = this.buildTypeForUnopExpr(value);
        } else if (value instanceof ArkNormalBinopExpr) {
            valueType = this.buildTypeForBinOpExpr(value);
        } else if (value instanceof ArkArrayRef) {
            valueType = this.buildTypeForArrayRefExpr(value);
        } else if (value instanceof ArkInstanceInvokeExpr) {
            valueType = value.getMethodSignature().getMethodSubSignature().getReturnType();
        } else {
            valueType = value.getType();
        }
        const leftOp = this.ArkCxxValueTransformer.generateTempLocal(valueType);
        const leftOpPosition = valueOriginalPositions[0];
        const assignStmt = new ArkAssignStmt(leftOp, value);
        assignStmt.setOperandOriginalPositions([leftOpPosition, ...valueOriginalPositions]);
        return {
            value: leftOp,
            valueOriginalPositions: [leftOpPosition],
            stmts: [assignStmt],
        };
    }

    private buildTypeForUnopExpr(value: ArkUnopExpr): Type {
        const opType = value.getOp().getType();
        const opCode = value.getOperator();
        let valueType: Type;
        switch (opCode) {
            case UnaryOperator.Addr:
                if (opType instanceof PointerType) {
                    valueType = new PointerType(opType.getBaseType(), opType.getLevel() + 1);
                } else {
                    valueType = new PointerType(opType, 1);
                }
                break;
            case UnaryOperator.Deref:
                valueType = this.buildTypeForDerefExpr(opType);
                break;
            default:
                valueType = opType;
        }
        return valueType;
    }

    private buildTypeForDerefExpr(opType: Type | PointerType): Type {
        if (opType instanceof PointerType) {
            if (opType.getLevel() === 1) {
                return opType.getBaseType();
            } else {
                return new PointerType(opType.getBaseType(), opType.getLevel() - 1);
            }
        }
        return opType;
    }

    private buildTypeForBinOpExpr(value: ArkNormalBinopExpr): Type {
        const valueOpCode = value.getOperator();
        if (valueOpCode !== NormalBinaryOperator.Addition && valueOpCode !== NormalBinaryOperator.Subtraction) {
            return value.getType();
        }
        const opValue1Type = value.getOp1().getType();
        const opValue2Type = value.getOp2().getType();
        if (opValue1Type instanceof PointerType) {
            return opValue1Type;
        } else if (opValue2Type instanceof PointerType) {
            return opValue2Type;
        }
        return value.getType();
    }

    private buildTypeForArrayRefExpr(value: ArkArrayRef): Type {
        const valueBaseType = value.getBase().getType();
        if (valueBaseType instanceof ArrayType) {
            const dimension = valueBaseType.getDimension();
            const baseTypeOfArray = valueBaseType.getBaseType();
            if (dimension === 1) {
                return baseTypeOfArray;
            }
            // Handle multi-dimension array
            return new ArrayType(baseTypeOfArray, dimension - 1);
        } else if (valueBaseType instanceof StringType) {
            return CxxCharType.getInstance(CxxTypeSigned.UNKNOWN, CxxTypeBitWidth.EIGHT_BITS, CxxStdTypeName.CHAR);
        }
        return value.getBase().getType();
    }

    public setBuilderMethodContextFlag(builderMethodContextFlag: boolean): void {
    }
}
