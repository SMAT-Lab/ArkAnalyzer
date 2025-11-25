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
} from '../../core/base/Expr';
import {
    ArkArrayRef,
    ArkCaughtExceptionRef,
    ArkInstanceFieldRef,
    ArkParameterRef,
    ArkThisRef,
    GlobalRef,
} from '../../core/base/Ref';
import { Value } from '../../core/base/Value';
import * as ts from 'ohos-typescript';
import { Local } from '../../core/base/Local';
import { ArkAliasTypeDefineStmt, ArkAssignStmt, ArkIfStmt, ArkInvokeStmt, ArkReturnStmt, ArkReturnVoidStmt, ArkThrowStmt, Stmt } from '../../core/base/Stmt';
import { AliasType, BooleanType, ClassType, UnknownType, VoidType, Type, AnyType, ArrayType, StringType } from '../../core/base/Type';
import { CxxValueUtil } from './ValueUtil';
import { IRUtils } from './IRUtils';
import { ArkMethod } from '../../core/model/ArkMethod';
import { COMPONENT_CREATE_FUNCTION, COMPONENT_POP_FUNCTION, COMPONENT_REPEAT } from '../../core/common/EtsConst';
import { FullPosition, LineColPosition } from '../../core/base/Position';
import { ArkCxxValueTransformer } from './ArkValueTransformer';
import { AliasTypeSignature, ClassSignature, FieldSignature, MethodSignature, MethodSubSignature } from '../../core/model/ArkSignature';
import { BuiltinCxx } from './Builtin';
import { ArkSignatureBuilder } from '../../core/model/builder/ArkSignatureBuilder';
import { ArkIRTransformer, DummyStmt } from '../../core/common/ArkIRTransformer';
import { AbstractTypeExpr } from '../../core/base/TypeExpr';
import { buildModifiers, buildTypeParameters } from '../model/builder/builderUtils';
import { ModelUtils } from '../../core/common/ModelUtils';
import { ArkClass } from '../../core/model/ArkClass';
import { buildNormalArkClassFromArkMethod } from '../model/builder/ArkClassBuilder';
import { CxxAstNode, CxxTranslationUnit } from '../ast/ArkCxxAstNode';
import { ValueUtil } from '../../core/common/ValueUtil';
import { CxxCharType, CxxStdTypeName, CxxTypeBitWidth, CxxTypeSigned, PointerType } from '../base/Type';
import { buildGenericType } from '../../core/model/builder/builderUtils';

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
        if (expression.kind.toString() === 'ParentExpr') {
            return this.shouldGenerateCxxExtraAssignStmt(expression.inner[0]);
        }
        return !(
            (expression.kind.toString() === 'BinaryOperator' && expression.opcode === '=') ||
            ArkCxxValueTransformer.isCxxCompoundAssignmentOperator(expression.opcode) ||
            expression.kind.toString() === 'CXXNewExpr' ||
            expression.kind.toString() === 'CallExpr' ||
            (expression.kind.toString() === 'UnaryOperator' && (expression.opcode === '++' || expression.opcode === '--')) ||
            expression.kind.toString() === 'CXXOperatorCallExpr' ||
            expression.kind.toString() === 'CXXConstructExpr' ||
            expression.kind.toString() === 'CXXCtorInitializer'
        );
    }

    /** The main function for converting C++ AST nodes to Stmts */
    public cxxNodeToStmts(node: CxxAstNode): Stmt[] {
        let stmts: Stmt[] = [];
        switch (node.kind) {
            case 'ParmDecl':
                stmts = this.cxxParameterToStmts(node);
                break;
            case 'BreakStmt':
            case 'ContinueStmt':
            case 'GotoStmt':
                stmts = [];
                break;
            case 'BinaryOperator':
            case 'CallExpr':
            case 'CompoundAssignOperator':
            case 'CXXConstructExpr':
            case 'CXXOperatorCallExpr':
            case 'UnaryOperator':
            case 'RecoveryExpr':
            case 'CXXDeleteExpr':
            case 'AtomicCallExpr':
            case 'CXXCtorInitializer':
                stmts = this.cxxExpressionStatementToStmts(node);
                break;
            case 'DeclStmt':
                stmts = this.cxxDeclStatementToStmts(node);
                break;
            case 'VarDecl':
                stmts = this.cxxVariableStatementToStmts(node);
                break;
            case 'CompoundStmt':
                stmts = this.compoundToStmts(node);
                break;
            case 'CXXMemberCallExpr':
                stmts = this.memberCallExprToStmts(node);
                break;
            case 'CXXCatchStmt':
                stmts = this.cxxCatchClauseToStmts(node);
                break;
            case 'CXXThrowExpr':
                stmts = this.cxxThrowStatementToStmts(node);
                break;
            case 'DoStmt':
                stmts = this.cxxDoStatementToStmts(node);
                break;
            case 'ExprWithCleanups':
                stmts = this.expressionWithCleanup(node);
                break;
            case 'ForStmt':
                stmts = this.cxxForStatementToStmts(node);
                break;
            case 'IfStmt':
                stmts = this.cxxIfStatementToStmts(node);
                break;
            case 'ReturnStmt':
                stmts = this.cxxReturnStatementToStmts(node);
                break;
            case 'WhileStmt':
                stmts = this.cxxWhileStatementToStmts(node);
                break;
            case 'CXXForRangeStmt':
                stmts = this.forRangeStatementToStmts(node);
                break;
            case 'TypedefDecl':
            case 'TypeAliasDecl':
                stmts = this.typeDefDeclToStmts(node);
                break;
            case 'TypeAliasTemplateDecl':
                stmts = this.typeDefDeclToStmts(node);
                break;
            case 'CXXRecordDecl':
                stmts = this.cxxClassDeclarationToStmts(node);
                break;
            case 'DecompositionDecl':
                stmts = this.decompositionDeclToStmts(node);
            case 'unsupported kind':
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
        const aliasName = typeAliasDeclaration.name;
        let typeDefDecl: CxxAstNode = typeAliasDeclaration;
        if (typeAliasDeclaration.kind === 'TypeAliasTemplateDecl') {
            typeDefDecl = typeAliasDeclaration.inner[typeAliasDeclaration.inner.length - 1];
        }
        const typeNode: CxxAstNode | undefined =
            Array.isArray(typeDefDecl.inner) ? typeDefDecl.inner[0] : undefined;
        const rightOp = typeNode?.code ?? typeNode?.name ?? 'int'; // If there is no type code, use int type as fallback

        let rightType;
        //  Identify the tagUsed attribute to determine struct, union, and enum nodes
        rightType = this.ArkCxxValueTransformer.cxxResolveTypeNode(typeNode);

        if (rightType instanceof AbstractTypeExpr) {
            rightType = rightType.getType();
        }

        const aliasType = new AliasType(aliasName, rightType, new AliasTypeSignature(aliasName, this.declaringMethod.getSignature()));
        if (typeAliasDeclaration.kind === 'TypeAliasTemplateDecl') {
            const genericTypes = buildTypeParameters(typeAliasDeclaration, this.cxxSourceFile, this.declaringMethod);
            aliasType.setGenericTypes(genericTypes);
            aliasType.setOriginalType(buildGenericType(rightType, aliasType));
            rightType = aliasType.getOriginalType();
        }
        // scenario: template<typename T> , using value_type_t = typename T::value_type;
        if (rightOp.startsWith(BuiltinCxx.TYPENAME_KEYWORD)) {
            rightType = aliasType.getGenericTypes()?.[0];
            if (rightType) {
                aliasType.setOriginalType(rightType);
            }
        }

        let expr = this.cxxGenerateAliasTypeExpr(rightOp, aliasType);

        if (typeAliasDeclaration.kind === 'TypeAliasTemplateDecl') {
            let realGenericTypes: Type[] = [];
            typeAliasDeclaration.inner.filter(inn => inn.kind === 'TemplateTypeParameter')
                .forEach(typeArgument => { realGenericTypes.push(this.ArkCxxValueTransformer.cxxResolveTypeNode(typeArgument));
            });
            expr.setRealGenericTypes(realGenericTypes);
        }

        const modifiers = buildModifiers(typeAliasDeclaration);
        aliasType.setModifiers(modifiers);

        const aliasTypeDefineStmt = new ArkAliasTypeDefineStmt(aliasType, expr);
        const leftPosition = FullPosition.cxxBuildFromNode(typeAliasDeclaration, this.cxxSourceFile);
        const rightPosition = FullPosition.cxxBuildFromNode(typeNode, this.cxxSourceFile);
        const operandOriginalPositions = [leftPosition, rightPosition];
        aliasTypeDefineStmt.setOperandOriginalPositions(operandOriginalPositions);

        this.getAliasTypeMap().set(aliasName, [aliasType, aliasTypeDefineStmt]);

        return [aliasTypeDefineStmt];
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
        let { iterablePositions, iteratorInvokeExpr, iteratorInvokeExprPositions } = this.handleForRangeIterInit(entry, stmts);
        // Handle iterable.next
        const {
            iteratorNextInvokeExpr,
            iteratorNextInvokeExprPositions,
        } = this.handleForRangeIterNext(iteratorInvokeExpr, iteratorInvokeExprPositions, stmts, iterablePositions);
        // Handle iterable result value
        const {
            iteratorResult,
            iteratorResultPositions,
            doneFieldRef,
            doneFieldRefPositions,
        } = this.handleForRangeIterResult(iteratorNextInvokeExpr, iteratorNextInvokeExprPositions, stmts);
        // Handle iterable.done end
        const {
            valueFieldRef,
            valueFieldRefPositions,
        } = this.handleForRangeIterDone(doneFieldRef, doneFieldRefPositions, stmts, iteratorResult, iteratorResultPositions);
        // Handle whether iterable is finished
        const {
            value: yieldValue,
            valueOriginalPositions: yieldValuePositions,
            stmts: yieldValueStmts,
        } = this.generateAssignStmtForValue(valueFieldRef, valueFieldRefPositions);
        yieldValueStmts.forEach(stmt => stmts.push(stmt));
        const castExpr = new ArkCastExpr(yieldValue, UnknownType.getInstance());
        const castExprPositions = [yieldValuePositions[0], ...yieldValuePositions];
        const declStmts: CxxAstNode = forOfStatement.inner[0];
        if (declStmts.kind === 'VarDecl') {
            const {
                value: initValue,
                valueOriginalPositions: initOriPos,
                stmts: initStmts,
            } = this.ArkCxxValueTransformer.cxxVariableDeclarationToValueAndStmts(declStmts, true, false);
            const assignStmt = new ArkAssignStmt(initValue, castExpr);
            assignStmt.setOperandOriginalPositions([...initOriPos, ...castExprPositions]);
            stmts.push(assignStmt);
            initStmts.forEach(stmt => stmts.push(stmt));
            // Processing structured binding under cyclic conditions
        } else if (declStmts.kind === 'DecompositionDecl') {
            const {
                stmts: initStmts,
            } = this.ArkCxxValueTransformer.bindingNodeToValueAndStmts(declStmts, yieldValue);
            initStmts.forEach(stmt => stmts.push(stmt));
        } else {
            const { value: initValue, valueOriginalPositions: initOriPos, stmts: initStmts } = this.cxxNodeToValueAndStmts(declStmts);
            const assignStmt = new ArkAssignStmt(initValue, castExpr);
            assignStmt.setOperandOriginalPositions([...initOriPos, ...castExprPositions]);
            initStmts.forEach(stmt => stmts.push(stmt));
            stmts.push(assignStmt);
        }
        return stmts;
    }

    private handleForRangeIterInit(entry: CxxAstNode, stmts: Stmt[]
    ): {
        iterablePositions: FullPosition[],
        iteratorInvokeExpr: ArkInstanceInvokeExpr,
        iteratorInvokeExprPositions: FullPosition[] }
    {
        let {
            value: iterableValue,
            valueOriginalPositions: iterablePositions,
            stmts: iterableStmts,
        } = this.cxxNodeToValueAndStmts(entry);
        iterableStmts.forEach(stmt => stmts.push(stmt));
        if (!(iterableValue instanceof Local)) {
            ({
                value: iterableValue,
                valueOriginalPositions: iterablePositions,
                stmts: iterableStmts,
            } = this.generateAssignStmtForValue(iterableValue, iterablePositions));
            iterableStmts.forEach(stmt => stmts.push(stmt));
        }
        const iteratorMethodSubSignature = new MethodSubSignature(BuiltinCxx.ITERATOR_FUNCTION, [], BuiltinCxx.ITERATOR_CLASS_TYPE);
        const iteratorMethodSignature = new MethodSignature(ClassSignature.DEFAULT, iteratorMethodSubSignature);
        const iteratorInvokeExpr = new ArkInstanceInvokeExpr(iterableValue as Local, iteratorMethodSignature, []);
        const iteratorInvokeExprPositions = [iterablePositions[0], ...iterablePositions];
        return { iterablePositions, iteratorInvokeExpr, iteratorInvokeExprPositions };
    }

    private handleForRangeIterNext(
        iteratorInvokeExpr: ArkInstanceInvokeExpr,
        iteratorInvokeExprPositions: FullPosition[],
        stmts: Stmt[],
        iterablePositions: FullPosition[]
    ): { iteratorNextInvokeExpr: ArkInstanceInvokeExpr, iteratorNextInvokeExprPositions: FullPosition[] } {
        const {
            value: iterator,
            valueOriginalPositions: iteratorPositions,
            stmts: iteratorStmts,
        } = this.generateAssignStmtForValue(iteratorInvokeExpr, iteratorInvokeExprPositions);
        iteratorStmts.forEach(stmt => stmts.push(stmt));
        (iterator as Local).setType(BuiltinCxx.ITERATOR_CLASS_TYPE);
        const nextMethodSubSignature = new MethodSubSignature(BuiltinCxx.ITERATOR_NEXT, [], BuiltinCxx.ITERATOR_RESULT_CLASS_TYPE);
        const nextMethodSignature = new MethodSignature(ClassSignature.DEFAULT, nextMethodSubSignature);
        const iteratorNextInvokeExpr = new ArkInstanceInvokeExpr(iterator as Local, nextMethodSignature, []);
        const iteratorNextInvokeExprPositions = [iteratorPositions[0], ...iterablePositions];
        return { iteratorNextInvokeExpr, iteratorNextInvokeExprPositions };
    }

    private handleForRangeIterDone(
        doneFieldRef: ArkInstanceFieldRef,
        doneFieldRefPositions: FullPosition[],
        stmts: Stmt[],
        iterableValue: Value,
        iteratorResultPositions: FullPosition[]
    ): { valueFieldRef: ArkInstanceFieldRef, valueFieldRefPositions: FullPosition[] } {
        const {
            value: doneFlag,
            valueOriginalPositions: doneFlagPositions,
            stmts: doneFlagStmts,
        } = this.generateAssignStmtForValue(doneFieldRef, doneFieldRefPositions);
        doneFlagStmts.forEach(stmt => stmts.push(stmt));
        (doneFlag as Local).setType(BooleanType.getInstance());
        const conditionExpr = new ArkConditionExpr(doneFlag, CxxValueUtil.getBooleanConstant(true), RelationalBinaryOperator.Equality);
        const conditionExprPositions = [doneFlagPositions[0], ...doneFlagPositions, FullPosition.DEFAULT];
        const ifStmt = new ArkIfStmt(conditionExpr);
        ifStmt.setOperandOriginalPositions(conditionExprPositions);
        stmts.push(ifStmt);

        const valueFieldSignature = new FieldSignature(
            BuiltinCxx.ITERATOR_RESULT_VALUE,
            BuiltinCxx.ITERATOR_RESULT_CLASS_SIGNATURE,
            UnknownType.getInstance(),
            false,
        );
        const valueFieldRef = new ArkInstanceFieldRef(iterableValue as Local, valueFieldSignature);
        const valueFieldRefPositions = [iteratorResultPositions[0], ...iteratorResultPositions];
        return { valueFieldRef, valueFieldRefPositions };
    }

    private handleForRangeIterResult(iteratorNextInvokeExpr: ArkInstanceInvokeExpr, iteratorNextInvokeExprPositions: FullPosition[], stmts: Stmt[]
    ): { iteratorResult: Value, iteratorResultPositions: FullPosition[], doneFieldRef: ArkInstanceFieldRef, doneFieldRefPositions: FullPosition[] } {
        const {
            value: iteratorResult,
            valueOriginalPositions: iteratorResultPositions,
            stmts: iteratorResultStmts,
        } = this.generateAssignStmtForValue(iteratorNextInvokeExpr, iteratorNextInvokeExprPositions);
        iteratorResultStmts.forEach(stmt => stmts.push(stmt));
        (iteratorResult as Local).setType(BuiltinCxx.ITERATOR_RESULT_CLASS_TYPE);
        const doneFieldSignature = new FieldSignature(BuiltinCxx.ITERATOR_RESULT_DONE,
            BuiltinCxx.ITERATOR_RESULT_CLASS_SIGNATURE, BooleanType.getInstance(), false);
        const doneFieldRef = new ArkInstanceFieldRef(iteratorResult as Local, doneFieldSignature);
        const doneFieldRefPositions = [iteratorResultPositions[0], ...iteratorResultPositions];
        return { iteratorResult, iteratorResultPositions, doneFieldRef, doneFieldRefPositions };
    }

    private cxxCatchClauseToStmts(catchClause: CxxAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        // When the scenario is catch (...), inner [0] is the exception handling content, and in other cases, it is the exception type
        if (catchClause.inner && catchClause.inner.length > 1) {
            const {
                value: catchValue,
                valueOriginalPositions: catchOriPos,
                stmts: catchStmts,
            } = this.ArkCxxValueTransformer.cxxVariableDeclarationToValueAndStmts(catchClause.inner[0], false, false);
            this.catchedExceptions.push(catchValue);
            const caughtExceptionRef = new ArkCaughtExceptionRef(catchValue.getType());
            const assignStmt = new ArkAssignStmt(catchValue, caughtExceptionRef);
            assignStmt.setOperandOriginalPositions(catchOriPos);
            stmts.push(assignStmt);
            catchStmts.forEach(stmt => stmts.push(stmt));
        } else { // When the scenario is catch (...)
            const caughtExceptionRef = new ArkCaughtExceptionRef(AnyType.getInstance());
            const catchValue = new Local('error');
            this.catchedExceptions.push(catchValue);
            const assignStmt = new ArkAssignStmt(catchValue, caughtExceptionRef);
            assignStmt.setOriginPositionInfo(LineColPosition.cxxBuildFromNode(catchClause));
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
            let { value: exprValue, valueOriginalPositions: exprPositions, stmts: exprStmts } = this.cxxNodeToValueAndStmts(returnStatement.inner[0]);
            exprStmts.forEach(stmt => stmts.push(stmt));
            if (IRUtils.moreThanOneAddress(exprValue)) {
                ({ value: exprValue, valueOriginalPositions: exprPositions, stmts: exprStmts } = this.generateAssignStmtForValue(exprValue, exprPositions));
                exprStmts.forEach(stmt => stmts.push(stmt));
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
        const { value: exprValue, valueOriginalPositions: exprPositions, stmts: stmts } = this.cxxNodeToValueAndStmts(expressionStatement);
        if (exprValue instanceof AbstractInvokeExpr) {
            this.cxxAddInvokeStmts(exprValue, exprPositions, stmts);
        } else if (this.shouldGenerateCxxExtraAssignStmt(expressionStatement)) {
            const { stmts: exprStmts } = this.generateAssignStmtForValue(exprValue, exprPositions);
            exprStmts.forEach(stmt => stmts.push(stmt));
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
                        COMPONENT_CREATE_FUNCTION
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
        const valueAndStmtsOfSwitchAndCases: ValueAndStmts[] = [];
        const exprStmts: Stmt[] = [];
        let { value: exprValue, valueOriginalPositions: exprPositions, stmts: exprTempStmts } = this.cxxNodeToValueAndStmts(switchStatement.inner[0]);
        exprTempStmts.forEach(stmt => exprStmts.push(stmt));
        if (IRUtils.moreThanOneAddress(exprValue)) {
            ({ value: exprValue, valueOriginalPositions: exprPositions, stmts: exprTempStmts } = this.generateAssignStmtForValue(exprValue, exprPositions));
            exprTempStmts.forEach(stmt => exprStmts.push(stmt));
        }
        valueAndStmtsOfSwitchAndCases.push({
            value: exprValue,
            valueOriginalPositions: exprPositions,
            stmts: exprStmts,
        });

        for (const clause of switchStatement.inner[1].inner) {
            if (clause.kind.toString() === 'CaseStmt') {
                const clauseStmts: Stmt[] = [];
                let { value: clauseValue, valueOriginalPositions: clausePositions, stmts: clauseTempStmts } = this.cxxNodeToValueAndStmts(clause.inner[0]);
                clauseTempStmts.forEach(stmt => clauseStmts.push(stmt));
                if (IRUtils.moreThanOneAddress(clauseValue)) {
                    ({
                        value: clauseValue,
                        valueOriginalPositions: clausePositions,
                        stmts: clauseTempStmts,
                    } = this.generateAssignStmtForValue(clauseValue, clausePositions));
                    clauseTempStmts.forEach(stmt => clauseStmts.push(stmt));
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

    private cxxForStatementToStmts(forStatement: CxxAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        let initNode: CxxAstNode | undefined;
        let conditionNoe: CxxAstNode | undefined;
        let incrementor: CxxAstNode | undefined;
        if (forStatement.inner.length < 4) {
            // When the for structure is incomplete, allocate positions according to the statement type. In cases of misclassification, the syntax tree structure needs to be further improved
            for (const node of forStatement.inner) {
                if (node.kind === 'DeclStmt') {
                    initNode = node;
                } else if (node.kind === 'BinaryOperator' || node.kind === 'ExprWithCleanups') {
                    conditionNoe = node;
                } else if (node.kind === 'UnaryOperator' || node.kind === 'CXXOperatorCallExpr' || node.kind === 'CompoundAssignOperator') {
                    incrementor = node;
                }
            }
        } else {
            // The complete for structure allocates corresponding statements in order
            initNode = forStatement.inner[0];
            conditionNoe = forStatement.inner[1];
            incrementor = forStatement.inner[2];
        }

        if (initNode) {
            this.cxxNodeToStmts(initNode).forEach(stmt => stmts.push(stmt));
        }
        const dummyInitializerStmt = new DummyStmt(ArkIRTransformer.DUMMY_LOOP_INITIALIZER_STMT);
        stmts.push(dummyInitializerStmt);

        if (conditionNoe) {
            const { value: conditionValue, valueOriginalPositions: conditionPositions, stmts: conditionStmts } =
                this.ArkCxxValueTransformer.cxxConditionToValueAndStmts(conditionNoe);
            conditionStmts.forEach(stmt => stmts.push(stmt));
            const ifStmt = new ArkIfStmt(conditionValue as ArkConditionExpr);
            ifStmt.setOperandOriginalPositions(conditionPositions);
            stmts.push(ifStmt);
        } else {
            // The omitted condition always evaluates to true.
            const trueConstant = CxxValueUtil.getBooleanConstant(true);
            const conditionExpr = new ArkConditionExpr(trueConstant, trueConstant, RelationalBinaryOperator.Equality);
            stmts.push(new ArkIfStmt(conditionExpr));
        }
        if (incrementor) {
            this.cxxNodeToValueAndStmts(incrementor).stmts.forEach(stmt => stmts.push(stmt));
        }
        return stmts;
    }

    private cxxWhileStatementToStmts(whileStatement: CxxAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        const dummyInitializerStmt = new DummyStmt(ArkIRTransformer.DUMMY_LOOP_INITIALIZER_STMT);
        stmts.push(dummyInitializerStmt);

        const { value: conditionExpr, valueOriginalPositions: conditionPositions, stmts: conditionStmts } =
            this.ArkCxxValueTransformer.cxxConditionToValueAndStmts(whileStatement.inner[0]);
        conditionStmts.forEach(stmt => stmts.push(stmt));
        const ifStmt = new ArkIfStmt(conditionExpr as ArkConditionExpr);
        ifStmt.setOperandOriginalPositions(conditionPositions);
        stmts.push(ifStmt);
        return stmts;
    }

    private cxxDoStatementToStmts(doStatement: CxxAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        const { value: conditionExpr, valueOriginalPositions: conditionPositions, stmts: conditionStmts } =
            this.ArkCxxValueTransformer.cxxConditionToValueAndStmts(doStatement.inner[1]);
        conditionStmts.forEach(stmt => stmts.push(stmt));
        const ifStmt = new ArkIfStmt(conditionExpr as ArkConditionExpr);
        ifStmt.setOperandOriginalPositions(conditionPositions);
        stmts.push(ifStmt);
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
        const { value: exprValue, valueOriginalPositions: exprPositions, stmts: stmts } = this.cxxNodeToValueAndStmts(expression);
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
                    COMPONENT_CREATE_FUNCTION
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
        const { value: exprValue, valueOriginalPositions: exprPositions, stmts: stmts } = this.cxxNodeToValueAndStmts(expression);
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
                        COMPONENT_CREATE_FUNCTION
                    );

                const createInvokeExpr = new ArkStaticInvokeExpr(
                    createMethodSignature,
                    rightOp.getArgs()
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

    private cxxVariableStatementToStmts(variableStatement: CxxAstNode): Stmt[] {
        return this.cxxVariableDeclarationListToStmts(variableStatement);
    }

    private cxxDeclStatementToStmts(declStatement: CxxAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        if (declStatement.inner.length === 0) {
            return this.ArkCxxValueTransformer.declStmtToValueAndStmts(declStatement).stmts;
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
        return this.ArkCxxValueTransformer.declStmtToValueAndStmts(variableDeclarationList).stmts;
    }

    private cxxIfStatementToStmts(ifStatement: CxxAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        const {value: conditionExpr, valueOriginalPositions: conditionExprPositions, stmts: conditionStmts, } =
            this.ArkCxxValueTransformer.cxxConditionToValueAndStmts(ifStatement.inner[0]);
        conditionStmts.forEach(stmt => stmts.push(stmt));
        const ifStmt = new ArkIfStmt(conditionExpr as ArkConditionExpr);
        ifStmt.setOperandOriginalPositions(conditionExprPositions);
        stmts.push(ifStmt);
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
        throwStmts.forEach(stmt => stmts.push(stmt));
        const throwStmt = new ArkThrowStmt(throwValue);
        throwStmt.setOperandOriginalPositions(throwValuePositions);
        stmts.push(throwStmt);
        return stmts;
    }

    public cxxMapStmtsToTsStmt(stmts: Stmt[], node: CxxAstNode): void {
        for (const stmt of stmts) {
            if (!this.stmtsHaveOriginalText.has(stmt)) {
                this.stmtsHaveOriginalText.add(stmt);
                stmt.setOriginPositionInfo(LineColPosition.cxxBuildFromNode(node));
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
        }else {
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

    public setBuilderMethodContextFlag(builderMethodContextFlag: boolean): void {}
}
