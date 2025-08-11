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
    ArkStaticInvokeExpr,
    RelationalBinaryOperator,
    UnaryOperator,
} from '../../core/base/Expr';
import { ArkCaughtExceptionRef, ArkInstanceFieldRef, ArkParameterRef, ArkThisRef, GlobalRef } from '../../core/base/Ref';
import { Value } from '../../core/base/Value';
import * as ts from 'ohos-typescript';
import { Local } from '../../core/base/Local';
import { ArkAliasTypeDefineStmt, ArkAssignStmt, ArkIfStmt, ArkInvokeStmt, ArkReturnStmt, ArkReturnVoidStmt, ArkThrowStmt, Stmt } from '../../core/base/Stmt';
import { AliasType, BooleanType, ClassType, UnknownType } from '../../core/base/Type';
import { CppValueUtil } from './ValueUtil';
import { IRUtils } from './IRUtils';
import { ArkMethod } from '../../core/model/ArkMethod';
import { COMPONENT_BRANCH_FUNCTION, COMPONENT_CREATE_FUNCTION, COMPONENT_IF, COMPONENT_POP_FUNCTION, COMPONENT_REPEAT } from '../../core/common/EtsConst';
import { FullPosition, LineColPosition } from '../../core/base/Position';
import { ArkValueTransformerCpp } from './ArkValueTransformer';
import { AliasTypeSignature, ClassSignature, FieldSignature, MethodSignature, MethodSubSignature } from '../../core/model/ArkSignature';
import { Builtin } from '../../core/common/Builtin';
import { ArkSignatureBuilder } from '../../core/model/builder/ArkSignatureBuilder';
import { ArkIRTransformer } from '../../core/common/ArkIRTransformer';
import { AbstractTypeExpr } from '../../core/base/TypeExpr';
import { buildModifiers } from '../model/builder/builderUtils';
import { ModelUtils } from '../../core/common/ModelUtils';
import { ArkClass } from '../../core/model/ArkClass';
import { buildNormalArkClassFromArkMethod } from '../model/builder/ArkClassBuilder';
import {CppAstNode} from '../../ast/ArkCxxAstNode';

export type ValueAndStmts = {
    value: Value;
    valueOriginalPositions: FullPosition[]; // original positions of value and its uses
    stmts: Stmt[];
};

export class DummyStmt extends Stmt {
    constructor(text: string) {
        super();
        this.text = text;
    }

    public toString(): string {
        return this.text!;
    }
}

function nodeInnerNode(node: CppAstNode): CppAstNode {
    if (node.inner && node.inner.length > 0) {
        return node.inner[0];
    }
    console.log('unsupported node !');
    return { kind: 'unsupported kind' } as CppAstNode;
}

export class ArkIRTransformerCpp extends ArkIRTransformer {
    private readonly sourceFileCpp: CppAstNode;
    private arkValueTransformerCpp: ArkValueTransformerCpp;

    constructor(sourceFile: CppAstNode, declaringMethod: ArkMethod) {
        super(sourceFile as unknown as ts.SourceFile, declaringMethod);
        this.sourceFileCpp = sourceFile;
        this.arkValueTransformerCpp = new ArkValueTransformerCpp(this, sourceFile, this.declaringMethod);
    }

    public getLocals(): Set<Local> {
        return this.arkValueTransformerCpp.getLocals();
    }

    public getGlobals(): Map<string, GlobalRef> | null {
        return this.arkValueTransformerCpp.getGlobals();
    }

    public getThisLocal(): Local {
        return this.arkValueTransformerCpp.getThisLocal();
    }

    public getAliasTypeMap(): Map<string, [AliasType, ArkAliasTypeDefineStmt]> {
        return this.arkValueTransformerCpp.getAliasTypeMap();
    }

    public prebuildStmts(): Stmt[] {
        const stmts: Stmt[] = [];
        let index = 0;
        for (const methodParameter of this.declaringMethod.getParameters()) {
            const parameterRef = new ArkParameterRef(index, methodParameter.getType());
            stmts.push(new ArkAssignStmt(this.arkValueTransformerCpp.addNewLocal(methodParameter.getName(), parameterRef.getType()), parameterRef));
            index++;
        }

        const thisRef = new ArkThisRef(this.arkValueTransformerCpp.getThisLocal().getType() as ClassType);
        stmts.push(new ArkAssignStmt(this.arkValueTransformerCpp.getThisLocal(), thisRef));
        return stmts;
    }

    // 根据操作符判断是否生成临时变量赋值语句
    private shouldGenerateExtraAssignStmtCpp(expression: CppAstNode): boolean {
        if (expression.kind.toString() === 'ParentExpr') {
            return this.shouldGenerateExtraAssignStmtCpp(expression.inner[0]);
        }
        return !(
            (expression.kind.toString() === 'BinaryOperator' && expression.opcode === '=') ||
            ArkValueTransformerCpp.isCompoundAssignmentOperatorCpp(expression.opcode) ||
            expression.kind.toString() === 'CXXNewExpr' ||
            expression.kind.toString() === 'CallExpr' ||
            (expression.kind.toString() === 'UnaryOperator' && (expression.opcode === '++' || expression.opcode === '--')) ||
            expression.kind.toString() === 'CXXOperatorCallExpr' ||
            expression.kind.toString() === 'CXXConstructExpr' ||
            expression.kind.toString() === 'CXXCtorInitializer'
        );
    }

    public cppNodeToStmts(node: CppAstNode): Stmt[] {
        let stmts: Stmt[] = [];
        switch (node.kind) {
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
                stmts = this.expressionStatementToStmtsCpp(node);
                break;
            case 'DeclStmt':
                stmts = this.declStatementToStmtsCpp(node);
                break;
            case 'VarDecl':
                stmts = this.variableStatementToStmtsCpp(node);
                break;
            case 'CompoundStmt':
                stmts = this.compoundToStmts(node);
                break;
            case 'CXXMemberCallExpr':
                stmts = this.memberCallExprToStmts(node);
                break;
            case 'CXXCatchStmt':
                stmts = this.catchClauseToStmtsCpp(node);
                break;
            case 'CXXThrowExpr':
                stmts = this.throwStatementToStmtsCpp(node);
                break;
            case 'DoStmt':
                stmts = this.doStatementToStmtsCpp(node);
                break;
            case 'ExprWithCleanups':
                stmts = this.expressionWithCleanup(node);
                break;
            case 'ForStmt':
                stmts = this.forStatementToStmtsCpp(node);
                break;
            case 'IfStmt':
                stmts = this.ifStatementToStmtsCpp(node);
                break;
            case 'ReturnStmt':
                stmts = this.returnStatementToStmtsCpp(node);
                break;
            case 'WhileStmt':
                stmts = this.whileStatementToStmtsCpp(node);
                break;
            case 'CXXForRangeStmt':
                stmts = this.forRangeStatementToStmts(node);
                break;
            case 'TypedefDecl':
                stmts = this.typeDefDeclToStmts(node);
                break;
            case 'CXXRecordDecl':
                stmts = this.classDeclarationToStmtsCpp(node);
                break;
            case 'unsupported kind':
                break;
        }
        this.mapStmtsToTsStmtCpp(stmts, node);
        if (stmts.length > 0) {
            IRUtils.setComments(stmts[0], node, this.sourceFileCpp, this.declaringMethod.getDeclaringArkFile().getScene().getOptions());
        }
        return stmts;
    }

    protected classDeclarationToStmtsCpp(node: CppAstNode): Stmt[] {
        const cls = new ArkClass();
        const declaringArkNamespace = this.declaringMethod.getDeclaringArkClass().getDeclaringArkNamespace();
        if (declaringArkNamespace) {
            cls.setDeclaringArkNamespace(declaringArkNamespace);
        }
        cls.setDeclaringArkFile(this.declaringMethod.getDeclaringArkFile());
        buildNormalArkClassFromArkMethod(node, cls, this.sourceFileCpp, this.declaringMethod);
        return [];
    }

    private typeDefDeclToStmts(typeAliasDeclaration: CppAstNode): Stmt[] {
        const aliasName = typeAliasDeclaration.name;
        const typeNode: CppAstNode | undefined =
            Array.isArray(typeAliasDeclaration.inner) ? typeAliasDeclaration.inner[0] : undefined;
        const rightOp = typeNode && typeNode.code ? typeNode.code : 'int'; // 若无type code 使用int类型托底

        let rightType;
        // 识别tagUsed属性用于对struct, union, enum 节点进行判断
        rightType = this.arkValueTransformerCpp.resolveTypeNodeCpp(typeNode);

        if (rightType instanceof AbstractTypeExpr) {
            rightType = rightType.getType();
        }

        const aliasType = new AliasType(aliasName, rightType, new AliasTypeSignature(aliasName, this.declaringMethod.getSignature()));
        let expr = this.generateAliasTypeExprCpp(rightOp, aliasType);
        const modifiers = buildModifiers(typeAliasDeclaration);
        aliasType.setModifiers(modifiers);

        const aliasTypeDefineStmt = new ArkAliasTypeDefineStmt(aliasType, expr);
        const leftPosition = FullPosition.buildFromNodeCpp(typeAliasDeclaration, this.sourceFile);
        const rightPosition = FullPosition.buildFromNodeCpp(typeNode, this.sourceFile);
        const operandOriginalPositions = [leftPosition, rightPosition];
        aliasTypeDefineStmt.setOperandOriginalPositions(operandOriginalPositions);

        this.getAliasTypeMap().set(aliasName, [aliasType, aliasTypeDefineStmt]);

        return [aliasTypeDefineStmt];
    }

    protected generateAliasTypeExprCpp(rightOp: String, aliasType: AliasType): AliasTypeExpr {
        let rightType = aliasType.getOriginalType();
        let expr: AliasTypeExpr;
        expr = new AliasTypeExpr(rightType, false);
        // 对于type A = {x:1, y:2}语句，当前阶段即可精确获取ClassType类型，需找到对应的ArkClass作为originalObject
        // 对于其他情况此处为UnclearReferenceTye并由类型推导进行查找和处理
        if (rightType instanceof ClassType) {
            const classObject = ModelUtils.getClassWithName(rightType.getClassSignature().getClassName(), this.declaringMethod.getDeclaringArkClass());
            if (classObject) {
                expr.setOriginalObject(classObject);
            }
        }
        return expr;
    }

    private forRangeStatementToStmts(forOfStatement: CppAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        let entry = forOfStatement.inner[1];
        // 处理iterable初始化
        let { value: iterableValue, valueOriginalPositions: iterablePositions, stmts: iterableStmts } = this.cppNodeToValueAndStmts(entry);
        iterableStmts.forEach(stmt => stmts.push(stmt));
        if (!(iterableValue instanceof Local)) {
            ({
                value: iterableValue,
                valueOriginalPositions: iterablePositions,
                stmts: iterableStmts,
            } = this.generateAssignStmtForValue(iterableValue, iterablePositions));
            iterableStmts.forEach(stmt => stmts.push(stmt));
        }
        const iteratorMethodSubSignature = new MethodSubSignature(Builtin.ITERATOR_FUNCTION, [], Builtin.ITERATOR_CLASS_TYPE);
        const iteratorMethodSignature = new MethodSignature(ClassSignature.DEFAULT, iteratorMethodSubSignature);
        const iteratorInvokeExpr = new ArkInstanceInvokeExpr(iterableValue as Local, iteratorMethodSignature, []);
        const iteratorInvokeExprPositions = [iterablePositions[0], ...iterablePositions];
        // 处理iterable.next
        const {
            value: iterator,
            valueOriginalPositions: iteratorPositions,
            stmts: iteratorStmts,
        } = this.generateAssignStmtForValue(iteratorInvokeExpr, iteratorInvokeExprPositions);
        iteratorStmts.forEach(stmt => stmts.push(stmt));
        (iterator as Local).setType(Builtin.ITERATOR_CLASS_TYPE);

        const nextMethodSubSignature = new MethodSubSignature(Builtin.ITERATOR_NEXT, [], Builtin.ITERATOR_RESULT_CLASS_TYPE);
        const nextMethodSignature = new MethodSignature(ClassSignature.DEFAULT, nextMethodSubSignature);
        const iteratorNextInvokeExpr = new ArkInstanceInvokeExpr(iterator as Local, nextMethodSignature, []);
        const iteratorNextInvokeExprPositions = [iteratorPositions[0], ...iterablePositions];
        //处理iterable 取值result
        const {
            value: iteratorResult,
            valueOriginalPositions: iteratorResultPositions,
            stmts: iteratorResultStmts,
        } = this.generateAssignStmtForValue(iteratorNextInvokeExpr, iteratorNextInvokeExprPositions);
        iteratorResultStmts.forEach(stmt => stmts.push(stmt));
        (iteratorResult as Local).setType(Builtin.ITERATOR_CLASS_TYPE);
        const doneFieldSignature = new FieldSignature(Builtin.ITERATOR_RESULT_DONE, Builtin.ITERATOR_RESULT_CLASS_SIGNATURE, BooleanType.getInstance(), false);
        const doneFieldRef = new ArkInstanceFieldRef(iteratorResult as Local, doneFieldSignature);
        const doneFieldRefPositions = [iteratorResultPositions[0], ...iteratorResultPositions];
        // 处理iterable.done 结束
        const {
            value: doneFlag,
            valueOriginalPositions: doneFlagPositions,
            stmts: doneFlagStmts,
        } = this.generateAssignStmtForValue(doneFieldRef, doneFieldRefPositions);
        doneFlagStmts.forEach(stmt => stmts.push(stmt));
        (doneFlag as Local).setType(BooleanType.getInstance());
        const conditionExpr = new ArkConditionExpr(doneFlag, CppValueUtil.getBooleanConstant(true), RelationalBinaryOperator.Equality);
        const conditionExprPositions = [doneFlagPositions[0], ...doneFlagPositions, FullPosition.DEFAULT];
        const ifStmt = new ArkIfStmt(conditionExpr);
        ifStmt.setOperandOriginalPositions(conditionExprPositions);
        stmts.push(ifStmt);

        const valueFieldSignature = new FieldSignature(
            Builtin.ITERATOR_RESULT_VALUE,
            Builtin.ITERATOR_RESULT_CLASS_SIGNATURE,
            UnknownType.getInstance(),
            false
        );
        const valueFieldRef = new ArkInstanceFieldRef(iterableValue as Local, valueFieldSignature);
        const valueFieldRefPositions = [iteratorResultPositions[0], ...iteratorResultPositions];

        // 处理iterable是否结束
        const {
            value: yieldValue,
            valueOriginalPositions: yieldValuePositions,
            stmts: yieldValueStmts,
        } = this.generateAssignStmtForValue(valueFieldRef, valueFieldRefPositions);
        yieldValueStmts.forEach(stmt => stmts.push(stmt));

        const castExpr = new ArkCastExpr(yieldValue, UnknownType.getInstance());
        const castExprPositions = [yieldValuePositions[0], ...yieldValuePositions];
        const declStmts: CppAstNode = forOfStatement.inner[0];
        if (declStmts.kind === 'VarDecl') {
            const {
                value: initValue,
                valueOriginalPositions: initOriPos,
                stmts: initStmts,
            } = this.arkValueTransformerCpp.variableDeclarationToValueAndStmtsCpp(declStmts, true, false);
            const assignStmt = new ArkAssignStmt(initValue, castExpr);
            assignStmt.setOperandOriginalPositions([...initOriPos, ...castExprPositions]);
            stmts.push(assignStmt);
            initStmts.forEach(stmt => stmts.push(stmt));
        } else {
            const { value: initValue, valueOriginalPositions: initOriPos, stmts: initStmts } = this.cppNodeToValueAndStmts(declStmts);
            const assignStmt = new ArkAssignStmt(initValue, castExpr);
            assignStmt.setOperandOriginalPositions([...initOriPos, ...castExprPositions]);
            initStmts.forEach(stmt => stmts.push(stmt));
            stmts.push(assignStmt);
        }
        return stmts;
    }

    private catchClauseToStmtsCpp(catchClause: CppAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        if (catchClause.inner) {
            const {
                value: catchValue,
                valueOriginalPositions: catchOriPos,
                stmts: catchStmts,
            } = this.arkValueTransformerCpp.variableDeclarationToValueAndStmtsCpp(catchClause.inner[0], false, false);
            const caughtExceptionRef = new ArkCaughtExceptionRef(UnknownType.getInstance());
            const assignStmt = new ArkAssignStmt(catchValue, caughtExceptionRef);
            assignStmt.setOperandOriginalPositions(catchOriPos);
            stmts.push(assignStmt);
            catchStmts.forEach(stmt => stmts.push(stmt));
        }
        return stmts;
    }

    public cppNodeToValueAndStmts(node: CppAstNode): ValueAndStmts {
        return this.arkValueTransformerCpp.tsNodeToValueAndStmts(node);
    }

    private returnStatementToStmtsCpp(returnStatement: CppAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        if (returnStatement.inner.length > 0) {
            let { value: exprValue, valueOriginalPositions: exprPositions, stmts: exprStmts } = this.cppNodeToValueAndStmts(returnStatement.inner[0]);
            exprStmts.forEach(stmt => stmts.push(stmt));
            if (IRUtils.moreThanOneAddress(exprValue)) {
                ({ value: exprValue, valueOriginalPositions: exprPositions, stmts: exprStmts } = this.generateAssignStmtForValue(exprValue, exprPositions));
                exprStmts.forEach(stmt => stmts.push(stmt));
            }
            const returnStmt = new ArkReturnStmt(exprValue);
            returnStmt.setOperandOriginalPositions(exprPositions);
            stmts.push(returnStmt);
        } else {
            stmts.push(new ArkReturnVoidStmt());
        }
        return stmts;
    }

    private expressionStatementToStmtsCpp(expressionStatement: CppAstNode): Stmt[] {
        const { value: exprValue, valueOriginalPositions: exprPositions, stmts: stmts } = this.cppNodeToValueAndStmts(expressionStatement);
        if (exprValue instanceof AbstractInvokeExpr) {
            this.addInvokeStmtsCpp(exprValue, exprPositions, stmts);
        } else if (this.shouldGenerateExtraAssignStmtCpp(expressionStatement)) {
            const { stmts: exprStmts } = this.generateAssignStmtForValue(exprValue, exprPositions);
            exprStmts.forEach(stmt => stmts.push(stmt));
        }
        return stmts;
    }

    private addInvokeStmtsCpp(invokeExpr: AbstractInvokeExpr, exprPositions: FullPosition[], stmts: Stmt[]): void {
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

    public switchStatementToValueAndStmtsCpp(switchStatement: CppAstNode): ValueAndStmts[] {
        const valueAndStmtsOfSwitchAndCases: ValueAndStmts[] = [];
        const exprStmts: Stmt[] = [];
        let { value: exprValue, valueOriginalPositions: exprPositions, stmts: exprTempStmts } = this.cppNodeToValueAndStmts(switchStatement.inner[0]);
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
                let { value: clauseValue, valueOriginalPositions: clausePositions, stmts: clauseTempStmts } = this.cppNodeToValueAndStmts(clause.inner[0]);
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

    private forStatementToStmtsCpp(forStatement: CppAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        let initNode: CppAstNode | undefined;
        let conditionNoe: CppAstNode | undefined;
        let incrementor: CppAstNode | undefined;
        for (const node of forStatement.inner) {
            if (node.kind === 'DeclStmt') {
                initNode = node;
            } else if (node.kind === 'BinaryOperator' || node.kind === 'ExprWithCleanups') {
                conditionNoe = node;
            } else if (node.kind === 'UnaryOperator' || node.kind === 'CXXOperatorCallExpr') {
                incrementor = node;
            }
        }

        if (initNode) {
            this.cppNodeToStmts(initNode).forEach(stmt => stmts.push(stmt));
        }
        const dummyInitializerStmt = new DummyStmt(ArkIRTransformer.DUMMY_LOOP_INITIALIZER_STMT);
        stmts.push(dummyInitializerStmt);

        if (conditionNoe) {
            const { value: conditionValue, stmts: conditionStmts } = this.arkValueTransformerCpp.conditionToValueAndStmtsCpp(conditionNoe);
            conditionStmts.forEach(stmt => stmts.push(stmt));
            stmts.push(new ArkIfStmt(conditionValue as ArkConditionExpr));
        } else {
            // The omitted condition always evaluates to true.
            const trueConstant = CppValueUtil.getBooleanConstant(true);
            const conditionExpr = new ArkConditionExpr(trueConstant, trueConstant, RelationalBinaryOperator.Equality);
            stmts.push(new ArkIfStmt(conditionExpr));
        }
        if (incrementor) {
            this.cppNodeToValueAndStmts(incrementor).stmts.forEach(stmt => stmts.push(stmt));
        }
        return stmts;
    }

    private whileStatementToStmtsCpp(whileStatement: CppAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        const dummyInitializerStmt = new DummyStmt(ArkIRTransformer.DUMMY_LOOP_INITIALIZER_STMT);
        stmts.push(dummyInitializerStmt);

        const { value: conditionExpr, stmts: conditionStmts } = this.arkValueTransformerCpp.conditionToValueAndStmtsCpp(whileStatement.inner[0]);
        conditionStmts.forEach(stmt => stmts.push(stmt));
        stmts.push(new ArkIfStmt(conditionExpr as ArkConditionExpr));
        return stmts;
    }

    private doStatementToStmtsCpp(doStatement: CppAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        const { value: conditionExpr, stmts: conditionStmts } = this.arkValueTransformerCpp.conditionToValueAndStmtsCpp(doStatement.inner[1]);
        conditionStmts.forEach(stmt => stmts.push(stmt));
        stmts.push(new ArkIfStmt(conditionExpr as ArkConditionExpr));
        return stmts;
    }

    private expressionWithCleanup(exprWithCleanup: CppAstNode): Stmt[] {
        return this.expressionToStmts(nodeInnerNode(exprWithCleanup));
    }

    private compoundToStmts(expressionStatement: CppAstNode): Stmt[] {
        return this.memberCallExpressionToStmts(expressionStatement.inner[0]);
    }

    private memberCallExprToStmts(expressionStatement: CppAstNode): Stmt[] {
        return this.memberCallExpressionToStmts(expressionStatement);
    }

    private memberCallExpressionToStmts(expression: CppAstNode): Stmt[] {
        const { value: exprValue, valueOriginalPositions: exprPositions, stmts: stmts } = this.cppNodeToValueAndStmts(expression);
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

    private expressionToStmts(expression: CppAstNode): Stmt[] {
        const { value: exprValue, valueOriginalPositions: exprPositions, stmts: stmts } = this.cppNodeToValueAndStmts(expression);
        if (exprValue instanceof AbstractInvokeExpr) {
            const invokeStmt = new ArkInvokeStmt(exprValue);
            invokeStmt.setOperandOriginalPositions(exprPositions);
            stmts.push(invokeStmt);

            let hasRepeat: boolean = false;
            for (const stmt of stmts) {
                // 不是赋值语句：跳过
                if (!(stmt instanceof ArkAssignStmt)) {
                    continue;
                }
                const rightOp = stmt.getRightOp?.(); // 如果可能没有这个方法，用可选调用更安全
                // 右侧不存在或不是静态调用：跳过
                if (!(rightOp instanceof ArkStaticInvokeExpr)) {
                    continue;
                }
                const methodName = rightOp.getMethodSignature().getMethodSubSignature().getMethodName();
                // 不是 COMPONENT_REPEAT：跳过
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

    private variableStatementToStmtsCpp(variableStatement: CppAstNode): Stmt[] {
        return this.variableDeclarationListToStmtsCpp(variableStatement);
    }

    public declStatementToStmtsCpp(declStatement: CppAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        if (declStatement.inner.length === 0) {
            return this.arkValueTransformerCpp.declStmtToValueAndStmts(declStatement).stmts;
        }
        for (const child of declStatement.inner) {
            const childStmts = this.cppNodeToStmts(child);
            stmts.push(...childStmts);
        }
        return stmts;
    }

    private variableDeclarationListToStmtsCpp(variableDeclarationList: CppAstNode): Stmt[] {
        return this.arkValueTransformerCpp.declStmtToValueAndStmts(variableDeclarationList).stmts;
    }

    private ifStatementToStmtsCpp(ifStatement: CppAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        if (this.inBuilderMethod) {
            const {value: conditionExpr, valueOriginalPositions: conditionExprPositions, stmts: conditionStmts, } =
                this.arkValueTransformerCpp.conditionToValueAndStmtsCpp(ifStatement.inner[0]);
            conditionStmts.forEach(stmt => stmts.push(stmt));
            const createMethodSignature = ArkSignatureBuilder.buildMethodSignatureFromClassNameAndMethodName(COMPONENT_IF, COMPONENT_CREATE_FUNCTION);
            const {value: conditionLocal, valueOriginalPositions: conditionLocalPositions,
                stmts: assignConditionStmts, } = this.generateAssignStmtForValue(conditionExpr, conditionExprPositions);
            assignConditionStmts.forEach(stmt => stmts.push(stmt));
            const createInvokeExpr = new ArkStaticInvokeExpr(createMethodSignature, [conditionLocal]);
            const createInvokeExprPositions = [conditionLocalPositions[0], ...conditionLocalPositions];
            const { stmts: createStmts } = this.generateAssignStmtForValue(createInvokeExpr, createInvokeExprPositions);
            createStmts.forEach(stmt => stmts.push(stmt));
            const branchMethodSignature = ArkSignatureBuilder.buildMethodSignatureFromClassNameAndMethodName(COMPONENT_IF, COMPONENT_BRANCH_FUNCTION);
            const branchInvokeExpr = new ArkStaticInvokeExpr(branchMethodSignature, [CppValueUtil.getOrCreateNumberConst(0)]);
            const branchInvokeExprPositions = [conditionLocalPositions[0], FullPosition.DEFAULT];
            const branchInvokeStmt = new ArkInvokeStmt(branchInvokeExpr);
            branchInvokeStmt.setOperandOriginalPositions(branchInvokeExprPositions);
            stmts.push(branchInvokeStmt);
            this.cppNodeToStmts(ifStatement.inner[1]).forEach((stmt: Stmt) => {
                stmts.push(stmt);
            });
            if (ifStatement.inner.length > 2) {
                const branchElseMethodSignature = ArkSignatureBuilder.buildMethodSignatureFromClassNameAndMethodName(COMPONENT_IF, COMPONENT_BRANCH_FUNCTION);
                const branchElseInvokeExpr = new ArkStaticInvokeExpr(branchElseMethodSignature, [CppValueUtil.getOrCreateNumberConst(1)]);
                const branchElseInvokeExprPositions = [FullPosition.buildFromNodeCpp(ifStatement.inner[2], this.sourceFile), FullPosition.DEFAULT];
                const branchElseInvokeStmt = new ArkInvokeStmt(branchElseInvokeExpr);
                branchElseInvokeStmt.setOperandOriginalPositions(branchElseInvokeExprPositions);
                stmts.push(branchElseInvokeStmt);

                this.cppNodeToStmts(ifStatement.inner[2]).forEach(stmt => stmts.push(stmt));
            }
            const popMethodSignature = ArkSignatureBuilder.buildMethodSignatureFromClassNameAndMethodName(COMPONENT_IF, COMPONENT_POP_FUNCTION);
            const popInvokeExpr = new ArkStaticInvokeExpr(popMethodSignature, []);
            const popInvokeStmt = new ArkInvokeStmt(popInvokeExpr);
            stmts.push(popInvokeStmt);
        } else {
            const {value: conditionExpr, valueOriginalPositions: conditionExprPositions, stmts: conditionStmts, } =
                this.arkValueTransformerCpp.conditionToValueAndStmtsCpp(ifStatement.inner[0]);
            conditionStmts.forEach(stmt => stmts.push(stmt));
            const ifStmt = new ArkIfStmt(conditionExpr as ArkConditionExpr);
            ifStmt.setOperandOriginalPositions(conditionExprPositions);
            stmts.push(ifStmt);
        }
        return stmts;
    }

    private throwStatementToStmtsCpp(throwStatement: CppAstNode): Stmt[] {
        const stmts: Stmt[] = [];
        const { value: throwValue, valueOriginalPositions: throwValuePositions, stmts: throwStmts } = this.cppNodeToValueAndStmts(throwStatement.inner[0]);
        throwStmts.forEach(stmt => stmts.push(stmt));
        const throwStmt = new ArkThrowStmt(throwValue);
        throwStmt.setOperandOriginalPositions(throwValuePositions);
        stmts.push(throwStmt);
        return stmts;
    }

    public mapStmtsToTsStmtCpp(stmts: Stmt[], node: CppAstNode): void {
        for (const stmt of stmts) {
            if (!this.stmtsHaveOriginalText.has(stmt)) {
                this.stmtsHaveOriginalText.add(stmt);
                stmt.setOriginPositionInfo(LineColPosition.buildFromNodeCpp(node, this.sourceFile));
                stmt.setOriginalText(node.code);
            }
        }
    }

    public static tokenToUnaryOperatorCpp(token: String): UnaryOperator | null {
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
        const leftOp = this.arkValueTransformerCpp.generateTempLocal(value.getType());
        const leftOpPosition = valueOriginalPositions[0];
        const assignStmt = new ArkAssignStmt(leftOp, value);
        assignStmt.setOperandOriginalPositions([leftOpPosition, ...valueOriginalPositions]);
        return {
            value: leftOp,
            valueOriginalPositions: [leftOpPosition],
            stmts: [assignStmt],
        };
    }

    public generateIfStmtForValues(
        leftValue: Value,
        leftOpOriginalPositions: FullPosition[],
        rightValue: Value,
        rightOpOriginalPositions: FullPosition[]
    ): Stmt[] {
        const stmts: Stmt[] = [];
        if (IRUtils.moreThanOneAddress(leftValue)) {
            const {
                value: tempLeftValue,
                valueOriginalPositions: tempLeftPositions,
                stmts: leftStmts,
            } = this.generateAssignStmtForValue(leftValue, leftOpOriginalPositions);
            leftStmts.forEach(stmt => stmts.push(stmt));
            leftValue = tempLeftValue;
            leftOpOriginalPositions = tempLeftPositions;
        }
        if (IRUtils.moreThanOneAddress(rightValue)) {
            const {
                value: tempRightValue,
                valueOriginalPositions: tempRightPositions,
                stmts: rightStmts,
            } = this.generateAssignStmtForValue(rightValue, rightOpOriginalPositions);
            rightStmts.forEach(stmt => stmts.push(stmt));
            rightValue = tempRightValue;
            rightOpOriginalPositions = tempRightPositions;
        }

        const conditionExpr = new ArkConditionExpr(leftValue, rightValue, RelationalBinaryOperator.Equality);
        const conditionPositions = [...leftOpOriginalPositions, ...rightOpOriginalPositions];
        const ifStmt = new ArkIfStmt(conditionExpr);
        ifStmt.setOperandOriginalPositions([...conditionPositions]);
        stmts.push(ifStmt);
        return stmts;
    }

    public setBuilderMethodContextFlag(builderMethodContextFlag: boolean): void {}
}
