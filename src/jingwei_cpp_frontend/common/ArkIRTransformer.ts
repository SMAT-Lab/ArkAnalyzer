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
    ArkCastExpr,
    ArkConditionExpr,
    ArkInstanceInvokeExpr,
    ArkStaticInvokeExpr,
    BinaryOperator,
    NormalBinaryOperator,
    RelationalBinaryOperator,
    UnaryOperator,
} from '../../core/base/Expr';
import { ArkCaughtExceptionRef, ArkInstanceFieldRef, ArkParameterRef, ArkThisRef, GlobalRef } from '../../core/base/Ref';
import { Value } from '../../core/base/Value';
import * as ts from 'ohos-typescript';
import { Local } from '../../core/base/Local';
import {
    ArkAliasTypeDefineStmt,
    ArkAssignStmt,
    ArkIfStmt,
    ArkInvokeStmt,
    ArkReturnStmt,
    ArkReturnVoidStmt,
    ArkThrowStmt,
    Stmt,
} from '../../core/base/Stmt';
import { AliasType, BooleanType, ClassType, UnknownType } from '../../core/base/Type';
import { ValueUtil } from './ValueUtil';
import { IRUtils } from '../../core/common/IRUtils';
import { ArkMethod } from '../../core/model/ArkMethod';
import {
    COMPONENT_BRANCH_FUNCTION,
    COMPONENT_CREATE_FUNCTION,
    COMPONENT_IF,
    COMPONENT_POP_FUNCTION,
    COMPONENT_REPEAT,
} from '../../core/common/EtsConst';
import { FullPosition, LineColPosition } from '../../core/base/Position';
import { ModelUtils } from './ModelUtils';
import { ArkValueTransformer } from './ArkValueTransformer';
import {
    ClassSignature,
    FieldSignature,
    MethodSignature,
    MethodSubSignature,
} from '../../core/model/ArkSignature';
import { Builtin } from '../../core/common/Builtin';
import { ArkSignatureBuilder } from '../../core/model/builder/ArkSignatureBuilder';

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

function nodeInnerNode(node:any):any{
    if (node.inner){
        return node.inner[0];
    }
    console.log('unsupported node !');
    return {kind: 'unsupported kind', node};
}


export class ArkIRTransformer {
    public static readonly DUMMY_LOOP_INITIALIZER_STMT = 'LoopInitializer';
    public static readonly DUMMY_CONDITIONAL_OPERATOR = 'ConditionalOperator';
    public static readonly DUMMY_CONDITIONAL_OPERATOR_IF_TRUE_STMT = ArkIRTransformer.DUMMY_CONDITIONAL_OPERATOR + 'IfTrue';
    public static readonly DUMMY_CONDITIONAL_OPERATOR_IF_FALSE_STMT = ArkIRTransformer.DUMMY_CONDITIONAL_OPERATOR + 'IfFalse';
    public static readonly DUMMY_CONDITIONAL_OPERATOR_END_STMT = ArkIRTransformer.DUMMY_CONDITIONAL_OPERATOR + 'End';

    private sourceFile: ts.SourceFile;
    private declaringMethod: ArkMethod;
    private inBuilderMethod = false;
    private stmtsHaveOriginalText: Set<Stmt> = new Set();
    private arkValueTransformer: ArkValueTransformer;

    constructor(sourceFile: ts.SourceFile, declaringMethod: ArkMethod) {
        this.sourceFile = sourceFile;
        this.declaringMethod = declaringMethod;
        this.inBuilderMethod = ModelUtils.isArkUIBuilderMethod(declaringMethod);
        this.arkValueTransformer = new ArkValueTransformer(this, sourceFile, this.declaringMethod);
    }

    public getLocals(): Set<Local> {
        return this.arkValueTransformer.getLocals();
    }

    public getGlobals(): Map<string, GlobalRef> | null {
        return this.arkValueTransformer.getGlobals();
    }

    public getThisLocal(): Local {
        return this.arkValueTransformer.getThisLocal();
    }

    public getAliasTypeMap(): Map<string, [AliasType, ArkAliasTypeDefineStmt]> {
        return this.arkValueTransformer.getAliasTypeMap();
    }

    public prebuildStmts(): Stmt[] {
        const stmts: Stmt[] = [];
        let index = 0;
        for (const methodParameter of this.declaringMethod.getParameters()) {
            const parameterRef = new ArkParameterRef(index, methodParameter.getType());
            stmts.push(new ArkAssignStmt(this.arkValueTransformer.addNewLocal(methodParameter.getName(), parameterRef.getType()), parameterRef));
            index++;
        }

        const thisRef = new ArkThisRef(this.arkValueTransformer.getThisLocal().getType() as ClassType);
        stmts.push(new ArkAssignStmt(this.arkValueTransformer.getThisLocal(), thisRef));
        return stmts;
    }

    // 根据操作符判断是否生成临时变量赋值语句
    private shouldGenerateExtraAssignStmt(expression: any): boolean {
        if (expression.kind.toString() === 'ParentExpr') {
            return this.shouldGenerateExtraAssignStmt(expression.inner[0]);
        }
        if ((expression.kind.toString() === 'BinaryOperator' && (expression.opcode === '=')) ||
            ArkValueTransformer.isCompoundAssignmentOperator(expression.opcode) ||
            expression.kind.toString() === 'CXXNewExpr' || expression.kind.toString() === 'CallExpr' ||
            (expression.kind.toString() === 'UnaryOperator' && (expression.opcode === '++' || expression.opcode === '--')) ||
            (expression.kind.toString() === 'CXXOperatorCallExpr' && expression.name === 'operator=') ||
            expression.kind.toString() === 'CXXConstructExpr') {
            return false;
        }
        return true;
    }

    public tsNodeToStmts(node: any): Stmt[] {
        let stmts: Stmt[] = [];
        switch (node.kind) {
            case 'BreakStmt':
                stmts = this.gotoStatementToStmts(node);
                break;
            case 'BinaryOperator':
                stmts = this.expressionStatementToStmts(node);
                break;
            case 'CallExpr':
                stmts = this.expressionStatementToStmts(node);
                break;
            case 'CompoundStmt':
                stmts = this.compoundToStmts(node);
                break;
            case 'CompoundAssignOperator':
                stmts = this.expressionStatementToStmts(node);
                break;
            case 'ContinueStmt':
                stmts = this.gotoStatementToStmts(node);
                break;
            case 'CXXConstructExpr':
                stmts = this.expressionStatementToStmts(node);
                break;
            case 'CXXOperatorCallExpr':
                stmts = this.expressionStatementToStmts(node);
                break;
            case 'CXXMemberCallExpr':
                stmts = this.memberCallExprToStmts(node);
                break;
            case 'CXXCatchStmt':
                stmts = this.catchClauseToStmts(node);
                break;
            case 'CXXThrowExpr':
                stmts = this.throwStatementToStmts(node);
                break;
            case 'DeclStmt':
                stmts = this.variableStatementToStmts(node);
                break;
            case 'DoStmt':
                stmts = this.doStatementToStmts(node);
                break;
            case 'ExprWithCleanups':
                stmts = this.expressionWithCleanup(node);
                break;
            case 'ForStmt':
                stmts = this.forStatementToStmts(node);
                break;
            case 'GotoStmt':
                stmts = this.gotoStatementToStmts(node);
                break;
            case 'IfStmt':
                stmts = this.ifStatementToStmts(node);
                break;
            case 'ReturnStmt':
                stmts = this.returnStatementToStmts(node);
                break;
            case 'RecoveryExpr':
                stmts = this.expressionStatementToStmts(node);
                break;
            case 'UnaryOperator':
                stmts = this.expressionStatementToStmts(node);
                break;
            case 'unsupported kind':
                break;
            case 'VarDecl':
                stmts = this.variableStatementToStmts(node);
                break;
            case 'WhileStmt':
                stmts = this.whileStatementToStmts(node);
                break;
            case 'CXXForRangeStmt':
                stmts = this.forRangeStatementToStmts(node);
                break;
            case 'CXXDeleteExpr':
                stmts = this.expressionStatementToStmts(node);
                break;
            case 'AtomicCallExpr':
                stmts = this.expressionStatementToStmts(node);
                break;
        }
        this.mapStmtsToTsStmt(stmts, node);
        if (stmts.length > 0) {
            IRUtils.setComments(stmts[0], node, this.sourceFile, this.declaringMethod.getDeclaringArkFile().getScene().getOptions());
        }
        return stmts;
    }

    private forRangeStatementToStmts(forOfStatement: any): Stmt[] {
        const stmts: Stmt[] = [];
        let entry = forOfStatement.inner[1];
        // 处理iterable初始化
        let {
            value: iterableValue,
            valueOriginalPositions: iterablePositions,
            stmts: iterableStmts,
        } = this.tsNodeToValueAndStmts(entry);
        iterableStmts.forEach(stmt => stmts.push(stmt));
        if (!(iterableValue instanceof Local)) {
            ({ value: iterableValue, valueOriginalPositions: iterablePositions, stmts: iterableStmts } =
                this.generateAssignStmtForValue(iterableValue, iterablePositions));
            iterableStmts.forEach(stmt => stmts.push(stmt));
        }
        const iteratorMethodSubSignature = new MethodSubSignature(Builtin.ITERATOR_FUNCTION, [],
            Builtin.ITERATOR_CLASS_TYPE);
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

        const nextMethodSubSignature = new MethodSubSignature(Builtin.ITERATOR_NEXT, [],
            Builtin.ITERATOR_RESULT_CLASS_TYPE);
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
        const doneFieldSignature = new FieldSignature(Builtin.ITERATOR_RESULT_DONE,
            Builtin.ITERATOR_RESULT_CLASS_SIGNATURE, BooleanType.getInstance(), false);
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
        const conditionExpr = new ArkConditionExpr(doneFlag, ValueUtil.getBooleanConstant(true), RelationalBinaryOperator.Equality);
        const conditionExprPositions = [doneFlagPositions[0], ...doneFlagPositions, FullPosition.DEFAULT];
        const ifStmt = new ArkIfStmt(conditionExpr);
        ifStmt.setOperandOriginalPositions(conditionExprPositions);
        stmts.push(ifStmt);

        const valueFieldSignature = new FieldSignature(Builtin.ITERATOR_RESULT_VALUE,
            Builtin.ITERATOR_RESULT_CLASS_SIGNATURE, UnknownType.getInstance(), false);
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
        const declStmts: any = forOfStatement.inner[0];
        if (declStmts.kind === 'VarDecl') {
            const {
                value: initValue, valueOriginalPositions: initOriPos, stmts: initStmts,
            } = this.arkValueTransformer.variableDeclarationToValueAndStmts(declStmts, true, false);
            const assignStmt = new ArkAssignStmt(initValue, castExpr);
            assignStmt.setOperandOriginalPositions([...initOriPos, ...castExprPositions]);
            stmts.push(assignStmt);
            initStmts.forEach(stmt => stmts.push(stmt));
        } else {
            const {
                value: initValue, valueOriginalPositions: initOriPos, stmts: initStmts,
            } = this.tsNodeToValueAndStmts(declStmts);
            const assignStmt = new ArkAssignStmt(initValue, castExpr);
            assignStmt.setOperandOriginalPositions([...initOriPos, ...castExprPositions]);
            initStmts.forEach(stmt => stmts.push(stmt));
            stmts.push(assignStmt);
        }
        return stmts;
    }

    private catchClauseToStmts(catchClause: any): Stmt[] {
        const stmts: Stmt[] = [];
        if (catchClause.inner) {
            const {
                value: catchValue, valueOriginalPositions: catchOriPos, stmts: catchStmts,
            } = this.arkValueTransformer.variableDeclarationToValueAndStmts(catchClause.inner[0], false, false);
            const caughtExceptionRef = new ArkCaughtExceptionRef(UnknownType.getInstance());
            const assignStmt = new ArkAssignStmt(catchValue, caughtExceptionRef);
            assignStmt.setOperandOriginalPositions(catchOriPos);
            stmts.push(assignStmt);
            catchStmts.forEach(stmt => stmts.push(stmt));
        }
        return stmts;
    }


    public tsNodeToValueAndStmts(node: ts.Node): ValueAndStmts {
        return this.arkValueTransformer.tsNodeToValueAndStmts(node);
    }

    private returnStatementToStmts(returnStatement: any): Stmt[] {
        const stmts: Stmt[] = [];
        if (returnStatement.inner.length > 0) {
            let {
                value: exprValue,
                valueOriginalPositions: exprPositions,
                stmts: exprStmts,
            } = this.tsNodeToValueAndStmts(returnStatement.inner[0]);
            exprStmts.forEach(stmt => stmts.push(stmt));
            if (IRUtils.moreThanOneAddress(exprValue)) {
                ({
                    value: exprValue,
                    valueOriginalPositions: exprPositions,
                    stmts: exprStmts,
                } = this.generateAssignStmtForValue(exprValue, exprPositions));
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

    private expressionStatementToStmts(expressionStatement: ts.ExpressionStatement): Stmt[] {
        const {
            value: exprValue,
            valueOriginalPositions: exprPositions,
            stmts: stmts,
        } = this.tsNodeToValueAndStmts(expressionStatement);
        if (exprValue instanceof AbstractInvokeExpr) {
            this.addInvokeStmts(exprValue, exprPositions, stmts);
        } else if (this.shouldGenerateExtraAssignStmt(expressionStatement)) {
            const { stmts: exprStmts } = this.generateAssignStmtForValue(exprValue, exprPositions);
            exprStmts.forEach(stmt => stmts.push(stmt));
        }
        return stmts;
    }

    private addInvokeStmts(invokeExpr: AbstractInvokeExpr, exprPositions: FullPosition[], stmts: Stmt[]): void {
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

    public switchStatementToValueAndStmts(switchStatement: any): ValueAndStmts[] {
        const valueAndStmtsOfSwitchAndCases: ValueAndStmts[] = [];
        const exprStmts: Stmt[] = [];
        let {
            value: exprValue,
            valueOriginalPositions: exprPositions,
            stmts: exprTempStmts,
        } = this.tsNodeToValueAndStmts(switchStatement.inner[0]);
        exprTempStmts.forEach(stmt => exprStmts.push(stmt));
        if (IRUtils.moreThanOneAddress(exprValue)) {
            ({
                value: exprValue,
                valueOriginalPositions: exprPositions,
                stmts: exprTempStmts,
            } = this.generateAssignStmtForValue(exprValue, exprPositions));
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
                let {
                    value: clauseValue,
                    valueOriginalPositions: clausePositions,
                    stmts: clauseTempStmts,
                } = this.tsNodeToValueAndStmts(clause.inner[0]);
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

    private forStatementToStmts(forStatement: any): Stmt[] {
        const stmts: Stmt[] = [];
        let initNode: any | undefined = undefined;
        let conditionNoe: any | undefined = undefined;
        let incrementor: any | undefined = undefined;
        for (const node of forStatement.inner) {
            if (node.kind == 'DeclStmt') {
                initNode = node;
            } else if (node.kind == 'BinaryOperator' || node.kind == 'ExprWithCleanups') {
                conditionNoe = node;
            } else if (node.kind == 'UnaryOperator' || node.kind == 'CXXOperatorCallExpr') {
                incrementor = node;
            }
        }

        if (initNode) {
            this.tsNodeToValueAndStmts(initNode).stmts.forEach(stmt => stmts.push(stmt));
        }
        const dummyInitializerStmt = new DummyStmt(ArkIRTransformer.DUMMY_LOOP_INITIALIZER_STMT);
        stmts.push(dummyInitializerStmt);

        if (conditionNoe) {
            const {
                value: conditionValue,
                stmts: conditionStmts,
            } = this.arkValueTransformer.conditionToValueAndStmts(conditionNoe);
            conditionStmts.forEach(stmt => stmts.push(stmt));
            stmts.push(new ArkIfStmt(conditionValue as ArkConditionExpr));
        } else {
            // The omitted condition always evaluates to true.
            const trueConstant = ValueUtil.getBooleanConstant(true);
            const conditionExpr = new ArkConditionExpr(trueConstant, trueConstant, RelationalBinaryOperator.Equality);
            stmts.push(new ArkIfStmt(conditionExpr));
        }
        if (incrementor) {
            this.tsNodeToValueAndStmts(incrementor).stmts.forEach(stmt => stmts.push(stmt));
        }
        return stmts;
    }

    private whileStatementToStmts(whileStatement: any): Stmt[] {
        const stmts: Stmt[] = [];
        const dummyInitializerStmt = new DummyStmt(ArkIRTransformer.DUMMY_LOOP_INITIALIZER_STMT);
        stmts.push(dummyInitializerStmt);

        const {
            value: conditionExpr,
            stmts: conditionStmts,
        } = this.arkValueTransformer.conditionToValueAndStmts(whileStatement.inner[0]);
        conditionStmts.forEach(stmt => stmts.push(stmt));
        stmts.push(new ArkIfStmt(conditionExpr as ArkConditionExpr));
        return stmts;
    }

    private doStatementToStmts(doStatement: any): Stmt[] {
        const stmts: Stmt[] = [];
        const {
            value: conditionExpr,
            stmts: conditionStmts,
        } = this.arkValueTransformer.conditionToValueAndStmts(doStatement.inner[1]);
        conditionStmts.forEach(stmt => stmts.push(stmt));
        stmts.push(new ArkIfStmt(conditionExpr as ArkConditionExpr));
        return stmts;
    }

    private expressionWithCleanup(exprWithCleanup: any): Stmt[] {
        return this.expressionToStmts(nodeInnerNode(exprWithCleanup));
    }

    private compoundToStmts(expressionStatement: any): Stmt[] {
        return this.memberCallExpressionToStmts(expressionStatement.inner[0]);
    }

    private memberCallExprToStmts(expressionStatement: any): Stmt[] {
        return this.memberCallExpressionToStmts(expressionStatement);
    }

    private memberCallExpressionToStmts(expression: any): Stmt[] {
        const { value: exprValue, valueOriginalPositions: exprPositions, stmts: stmts } = this.tsNodeToValueAndStmts(
            expression);
        if (exprValue instanceof AbstractInvokeExpr) {
            const invokeStmt = new ArkInvokeStmt(exprValue);
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
        } else if (exprValue instanceof AbstractExpr) {
            const { stmts: exprStmts } = this.generateAssignStmtForValue(exprValue, exprPositions);
            stmts.push(...exprStmts);
        }
        return stmts;
    }

    private expressionToStmts(expression: any): Stmt[] {
        const { value: exprValue, valueOriginalPositions: exprPositions, stmts: stmts } = this.tsNodeToValueAndStmts(
            expression);
        if (exprValue instanceof AbstractInvokeExpr) {
            const invokeStmt = new ArkInvokeStmt(exprValue);
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
        } else if (exprValue instanceof AbstractExpr) {
            const { stmts: exprStmts } = this.generateAssignStmtForValue(exprValue, exprPositions);
            stmts.push(...exprStmts);
        }
        return stmts;
    }

    private variableStatementToStmts(variableStatement: any): Stmt[] {
        return this.variableDeclarationListToStmts(variableStatement);
    }

    private variableDeclarationListToStmts(variableDeclarationList: any): Stmt[] {
        return this.arkValueTransformer.variableDeclarationListToValueAndStmts(variableDeclarationList).stmts;
    }

    private ifStatementToStmts(ifStatement: any): Stmt[] {
        const stmts: Stmt[] = [];
        if (this.inBuilderMethod) {
            const {
                value: conditionExpr,
                valueOriginalPositions: conditionExprPositions,
                stmts: conditionStmts,
            } = this.arkValueTransformer.conditionToValueAndStmts(ifStatement.inner[0]);
            conditionStmts.forEach(stmt => stmts.push(stmt));
            const createMethodSignature = ArkSignatureBuilder.buildMethodSignatureFromClassNameAndMethodName(COMPONENT_IF, COMPONENT_CREATE_FUNCTION);
            const {
                value: conditionLocal,
                valueOriginalPositions: conditionLocalPositions,
                stmts: assignConditionStmts,
            } = this.generateAssignStmtForValue(conditionExpr, conditionExprPositions);
            assignConditionStmts.forEach(stmt => stmts.push(stmt));
            const createInvokeExpr = new ArkStaticInvokeExpr(createMethodSignature, [conditionLocal]);
            const createInvokeExprPositions = [conditionLocalPositions[0], ...conditionLocalPositions];
            const { stmts: createStmts } = this.generateAssignStmtForValue(createInvokeExpr, createInvokeExprPositions);
            createStmts.forEach(stmt => stmts.push(stmt));
            const branchMethodSignature = ArkSignatureBuilder.buildMethodSignatureFromClassNameAndMethodName(COMPONENT_IF, COMPONENT_BRANCH_FUNCTION);
            const branchInvokeExpr = new ArkStaticInvokeExpr(branchMethodSignature, [ValueUtil.getOrCreateNumberConst(0)]);
            const branchInvokeExprPositions = [conditionLocalPositions[0], FullPosition.DEFAULT];
            const branchInvokeStmt = new ArkInvokeStmt(branchInvokeExpr);
            branchInvokeStmt.setOperandOriginalPositions(branchInvokeExprPositions);
            stmts.push(branchInvokeStmt);
            this.tsNodeToStmts(ifStatement.inner[1]).forEach(stmt => stmts.push(stmt));
            if (ifStatement.inner.length > 2) {
                const branchElseMethodSignature = ArkSignatureBuilder.buildMethodSignatureFromClassNameAndMethodName(COMPONENT_IF, COMPONENT_BRANCH_FUNCTION);
                const branchElseInvokeExpr = new ArkStaticInvokeExpr(branchElseMethodSignature, [ValueUtil.getOrCreateNumberConst(1)]);
                const branchElseInvokeExprPositions = [FullPosition.buildFromNodeCpp(ifStatement.inner[2], this.sourceFile), FullPosition.DEFAULT];
                const branchElseInvokeStmt = new ArkInvokeStmt(branchElseInvokeExpr);
                branchElseInvokeStmt.setOperandOriginalPositions(branchElseInvokeExprPositions);
                stmts.push(branchElseInvokeStmt);

                this.tsNodeToStmts(ifStatement.inner[2]).forEach(stmt => stmts.push(stmt));
            }
            const popMethodSignature = ArkSignatureBuilder.buildMethodSignatureFromClassNameAndMethodName(COMPONENT_IF, COMPONENT_POP_FUNCTION);
            const popInvokeExpr = new ArkStaticInvokeExpr(popMethodSignature, []);
            const popInvokeStmt = new ArkInvokeStmt(popInvokeExpr);
            stmts.push(popInvokeStmt);
        } else {
            const {
                value: conditionExpr,
                valueOriginalPositions: conditionExprPositions,
                stmts: conditionStmts,
            } = this.arkValueTransformer.conditionToValueAndStmts(ifStatement.inner[0]);
            conditionStmts.forEach(stmt => stmts.push(stmt));
            const ifStmt = new ArkIfStmt(conditionExpr as ArkConditionExpr);
            ifStmt.setOperandOriginalPositions(conditionExprPositions);
            stmts.push(ifStmt);
        }
        return stmts;
    }

    private gotoStatementToStmts(gotoStatement: ts.BreakStatement | ts.ContinueStatement): Stmt[] {
        return [];
    }

    private throwStatementToStmts(throwStatement: any): Stmt[] {
        const stmts: Stmt[] = [];
        const {
            value: throwValue,
            valueOriginalPositions: throwValuePositions,
            stmts: throwStmts,
        } = this.tsNodeToValueAndStmts(throwStatement.inner[0]);
        throwStmts.forEach(stmt => stmts.push(stmt));
        const throwStmt = new ArkThrowStmt(throwValue);
        throwStmt.setOperandOriginalPositions(throwValuePositions);
        stmts.push(throwStmt);
        return stmts;
    }

    public mapStmtsToTsStmt(stmts: Stmt[], node: any): void {
        for (const stmt of stmts) {
            if (!this.stmtsHaveOriginalText.has(stmt)) {
                this.stmtsHaveOriginalText.add(stmt);
                stmt.setOriginPositionInfo(LineColPosition.buildFromNodeCpp(node, this.sourceFile));
                stmt.setOriginalText(node.code);
            }
        }
    }

    public static tokenToUnaryOperator(token: any): UnaryOperator | null {
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
                ;
        }
        return null;
    }

    public static tokenToBinaryOperator(token: ts.SyntaxKind): BinaryOperator | null {
        switch (token) {
            case ts.SyntaxKind.QuestionQuestionToken:
                return NormalBinaryOperator.NullishCoalescing;
            case ts.SyntaxKind.AsteriskAsteriskToken:
                return NormalBinaryOperator.Exponentiation;
            case ts.SyntaxKind.SlashToken:
                return NormalBinaryOperator.Division;
            case ts.SyntaxKind.PlusToken:
                return NormalBinaryOperator.Addition;
            case ts.SyntaxKind.MinusToken:
                return NormalBinaryOperator.Subtraction;
            case ts.SyntaxKind.AsteriskToken:
                return NormalBinaryOperator.Multiplication;
            case ts.SyntaxKind.PercentToken:
                return NormalBinaryOperator.Remainder;
            case ts.SyntaxKind.LessThanLessThanToken:
                return NormalBinaryOperator.LeftShift;
            case ts.SyntaxKind.GreaterThanGreaterThanToken:
                return NormalBinaryOperator.RightShift;
            case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
                return NormalBinaryOperator.UnsignedRightShift;
            case ts.SyntaxKind.AmpersandToken:
                return NormalBinaryOperator.BitwiseAnd;
            case ts.SyntaxKind.BarToken:
                return NormalBinaryOperator.BitwiseOr;
            case ts.SyntaxKind.CaretToken:
                return NormalBinaryOperator.BitwiseXor;
            case ts.SyntaxKind.AmpersandAmpersandToken:
                return NormalBinaryOperator.LogicalAnd;
            case ts.SyntaxKind.BarBarToken:
                return NormalBinaryOperator.LogicalOr;
            case ts.SyntaxKind.LessThanToken:
                return RelationalBinaryOperator.LessThan;
            case ts.SyntaxKind.LessThanEqualsToken:
                return RelationalBinaryOperator.LessThanOrEqual;
            case ts.SyntaxKind.GreaterThanToken:
                return RelationalBinaryOperator.GreaterThan;
            case ts.SyntaxKind.GreaterThanEqualsToken:
                return RelationalBinaryOperator.GreaterThanOrEqual;
            case ts.SyntaxKind.EqualsEqualsToken:
                return RelationalBinaryOperator.Equality;
            case ts.SyntaxKind.ExclamationEqualsToken:
                return RelationalBinaryOperator.InEquality;
            case ts.SyntaxKind.EqualsEqualsEqualsToken:
                return RelationalBinaryOperator.StrictEquality;
            case ts.SyntaxKind.ExclamationEqualsEqualsToken:
                return RelationalBinaryOperator.StrictInequality;
            default:
        }
        return null;
    }

    public generateAssignStmtForValue(value: Value, valueOriginalPositions: FullPosition[]): ValueAndStmts {
        const leftOp = this.arkValueTransformer.generateTempLocal(value.getType());
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
        rightOpOriginalPositions: FullPosition[],
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

    public setBuilderMethodContextFlag(builderMethodContextFlag: boolean): void {
    }
}
