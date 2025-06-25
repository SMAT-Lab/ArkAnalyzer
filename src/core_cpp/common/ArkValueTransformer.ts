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

import * as ts from 'ohos-typescript';
import { Local } from '../../core/base/Local';
import { FullPosition } from '../../core/base/Position';
import { ArkAliasTypeDefineStmt, ArkAssignStmt, ArkIfStmt, ArkInvokeStmt, Stmt } from '../../core/base/Stmt';
import {
    AbstractBinopExpr,
    ArkCastExpr,
    ArkConditionExpr,
    ArkDeleteExpr,
    ArkInstanceInvokeExpr,
    ArkNewArrayExpr,
    ArkNewExpr,
    ArkNormalBinopExpr,
    ArkPtrInvokeExpr,
    ArkStaticInvokeExpr,
    ArkUnopExpr,
    BinaryOperator,
    NormalBinaryOperator,
    RelationalBinaryOperator,
    CompoundBinaryOperator
} from '../../core/base/Expr';
import {
    AliasType,
    AnyType,
    ArrayType,
    ClassType,
    FunctionType,
    LiteralType,
    NullType,
    NumberType,
    Type,
    UnclearReferenceType,
    UndefinedType,
    UnknownType,
    PointerType,
    ReferenceType
} from '../../core/base/Type';
import { ArkSignatureBuilder } from '../model/builder/ArkSignatureBuilder';
import { CONSTRUCTOR_NAME, THIS_NAME } from './TSConst';
import { ClassSignature, FieldSignature, MethodSignature } from '../../core/model/ArkSignature';
import { Value } from '../../core/base/Value';
import {
    COMPONENT_CREATE_FUNCTION,
    COMPONENT_CUSTOMVIEW,
    COMPONENT_FOR_EACH,
    COMPONENT_LAZY_FOR_EACH,
    COMPONENT_POP_FUNCTION,
} from './EtsConst';
import { ValueUtil } from './ValueUtil';
import { IRUtils } from './IRUtils';
import { AbstractFieldRef, ArkArrayRef, ArkInstanceFieldRef, GlobalRef, CXXArkInstanceFieldRef } from '../../core/base/Ref';
import { ModelUtils } from './ModelUtils';
import { ArkMethod } from '../../core/model/ArkMethod';
import { buildArkMethodFromArkClass } from '../model/builder/ArkMethodBuilder';
import { Builtin } from './Builtin';
import { Constant } from '../../core/base/Constant';
import { TEMP_LOCAL_PREFIX } from './Const';
import { ArkIRTransformer, DummyStmt, ValueAndStmts } from './ArkIRTransformer';
import {buildTypeFromPreStr, cppNode2Type, isCXXSTLContainer } from '../model/builder/builderUtils';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';


const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkValueTransformer');

function nodeInnerNode(node: any): any {
    if (node.inner && node.inner instanceof Array && !(node.inner.length === 1 && node.inner[0].kind === 'TypeRef')) {
        return node.inner[node.inner.length - 1];
    }
    logger.info('unsupported node !');
    const obj = {kind: 'unsupported kind', node};
    return obj;
}

export class ArkValueTransformer {
    private conditionalOperatorNo: number = 0;
    private tempLocalNo: number = 0;
    private sourceFile: ts.SourceFile;
    private locals: Map<string, Local> = new Map();
    private globals?: Map<string, GlobalRef>;
    private thisLocal: Local;
    private declaringMethod: ArkMethod;
    private arkIRTransformer: ArkIRTransformer;
    private aliasTypeMap: Map<string, [AliasType, ArkAliasTypeDefineStmt]> = new Map();
    private builderMethodContextFlag = false;

    constructor(arkIRTransformer: ArkIRTransformer, sourceFile: ts.SourceFile, declaringMethod: ArkMethod) {
        this.arkIRTransformer = arkIRTransformer;
        this.sourceFile = sourceFile;
        this.thisLocal = new Local(THIS_NAME, declaringMethod.getDeclaringArkClass().getSignature().getType());
        this.locals.set(this.thisLocal.getName(), this.thisLocal);
        this.declaringMethod = declaringMethod;
    }

    public getLocals(): Set<Local> {
        return new Set<Local>(this.locals.values());
    }

    public getThisLocal(): Local {
        return this.thisLocal;
    }

    public getAliasTypeMap(): Map<string, [AliasType, ArkAliasTypeDefineStmt]> {
        return this.aliasTypeMap;
    }

    public addNewLocal(localName: string, localType: Type = UnknownType.getInstance()): Local {
        let local = new Local(localName, localType);
        this.locals.set(localName, local);
        return local;
    }

    public getGlobals(): Map<string, GlobalRef> | null {
        return this.globals ?? null;
    }

    private addNewGlobal(name: string, ref?: Value): GlobalRef {
        let globalRef = new GlobalRef(name, ref);
        this.globals = this.globals ?? new Map();
        this.globals.set(name, globalRef);
        return globalRef;
    }

    private thisExpressionToValueAndStmts(thisExpression: any): ValueAndStmts {
        return {
            value: this.getThisLocal(),
            valueOriginalPositions: [FullPosition.buildFromNodeCpp(thisExpression,  this.sourceFile)],
            stmts: []
        }
    }

    // 判断当前节点是否与CPP的lambda函数相关
    private isNodeRelatedToCXXLambdaFunc(node: any): boolean {
        return node.type.qualType && node.type.qualType.startsWith('(lambda at');
    }

    private isNodeRelatedToImplicitNode(node: any): boolean {
        if (node.inner && node.inner instanceof Array) {
            return node.inner.length !== 0 && node.inner[0].kind === 'ImplicitCastExpr' &&
                (node.name === '_tree_const_iterator' || node.name === 'basic_string');
        }
        return false;
    }

    // 判断当前节点的子节点是否是优化后的临时变量
    private isNodeRelatedToMaterialize(node: any): boolean {
        return node.inner.length !== 0 && node.inner[0].kind === 'MaterializeTemporaryExpr';
    }

    // 判断当前节点的子节点是否是成员函数调用
    private isNodeRelatedToCXXMember(node: any): boolean {
        return node.inner.length !== 0 && node.inner[0].kind === 'CXXMemberCallExpr' ||
            (node.inner[0].kind === 'ImplicitCastExpr' && node.inner[0].inner[0] && node.inner[0].inner[0].kind === 'CXXMemberCallExpr');
    }

    // std::pair类型的构造
    private isPairConstructExpr(node: any): boolean {
        return node.type.qualType.includes('std::pair');
    }

    // 多层std::pair构造
    private isNodeRelatedToTemporary(node: any): boolean {
        return node.inner.length !== 0 && node.inner[0].kind === 'CXXBindTemporaryExpr' && node.code === node.inner[0].code;
    }

    // 不是new语句的表达式（排除构造函数作为参数）
    private isNotNewExpression(newExpression: any): boolean {
        return newExpression.inner.length && (
            newExpression.inner[0].kind === 'IntegerLiteral' || newExpression.inner[0].kind === 'InitListExpr' ||
            (newExpression.inner[0].kind === 'ImplicitCastExpr' && !newExpression.inner[0].code.includes('(')) ||
            newExpression.inner[0].kind === 'CompoundLiteralExpr'
        );
    }

    private isNodeRelatedToCXXFuncCast(node: any): boolean {
        return node.inner.length !== 0 && node.inner[0].kind === 'CXXFunctionalCastExpr';
    }

    public tsNodeToValueAndStmts(node: any): ValueAndStmts {
        if (node === undefined) {
            logger.error('ArkValueTransformer-TSNodeToValueAndStmts: node is undefined. Method signature is : ',
                this.declaringMethod?.getDeclareSignatures()?.toString());
            return {
                value: new Local('undefined'),
                valueOriginalPositions: [new FullPosition(0, 0, 0, 0)],
                stmts: [],
            };
        }
        if(node.kind === 'CXXConstructExpr') {
            if ((!this.isPairConstructExpr((node)) && (this.isNodeRelatedToCXXLambdaFunc(node) ||
                this.isNodeRelatedToMaterialize(node) || this.isNodeRelatedToImplicitNode(node)))) {
                return this.tsNodeToValueAndStmts(node.inner[0]);
            }
            return this.newExpressionToValueAndStmts(node);
        } else if (node.kind === 'CallExpr' && node.inner[0].kind === 'CXXPseudoDestructorExpression') {
            return this.callExpressionToValueAndStmts(node.inner[0]);
        } else if (node.kind === 'CallExpr' || node.kind === 'AtomicCallExpr' || node.kind === 'CXXFoldExpr') {
            return this.callExpressionToValueAndStmts(node);
        } else if (node.kind === 'CXXNoexceptExpr') {
            return this.cxxNoexceptExprToValueAndStmts(node);
        } else if (node.kind === 'CXXOperatorCallExpr') {
            return this.cxxOperatorExpressionToValueAndStmts(node);
        } else if (node.kind === 'RecoveryExpr') {
            return this.RecoverExpressionToValueAndStmts(node);
        } else if (node.kind === 'ConstantExpr' || node.kind === 'ExprWithCleanups' ||
            node.kind === 'CXXStdInitializerListExpr' || node.kind === 'ParenExpr' ||
            node.kind === 'CXXBindTemporaryExpr' || node.kind === 'VarDecl' || node.kind === 'UnexposedExpr') { // 处理隐式节点、变量节点
            if (node.inner.length !== 0) {
                return this.tsNodeToValueAndStmts(node.inner[0]);
            }
        } else if (node.kind === 'ImplicitCastExpr') {
            if (node.inner.length === 1) {
                return this.tsNodeToValueAndStmts(node.inner[0]);
            } else if (node.inner.length === 2) {
                return this.tsNodeToValueAndStmts(node.inner[1]);
            }
            // 把当前ImplicitCastExpr节点当作declRefExpr
            node.kind = 'DeclRefExpr';
            node.name = node.code;
            return this.tsNodeToValueAndStmts(node);
        } else if (node.kind === 'DeclRefExpr' || node.kind === 'typeRef') {
            if (!node.type) {
                return this.tsNodeToValueAndStmts(node.inner[0]);
            }
            return this.identifierToValueAndStmts(node);
        } else if (node.kind === 'UnresolvedLookupExpr') {
            return this.identifierToValueAndStmts(node);
        } else if (node.kind === 'CXXMemberCallExpr') {
            return this.cxxMemberCallExpressionToValueAndStmts(node);
        } else if (node.kind === 'MemberExpr') {
            return this.memberExpressionToValueAndStmts(node);
        } else if (node.kind === 'CXXNewExpr') {
            return this.newExpressionToValueAndStmts(node);
        } else if (node.kind === 'BinaryOperator') {
            return this.binaryExpressionToValueAndStmts(node);
        } else if (node.kind === 'MaterializeTemporaryExpr') {
            if (this.isNotNewExpression(node) || this.isNodeRelatedToCXXLambdaFunc(node) || this.isNodeRelatedToCXXMember(node) ||
                this.isNodeRelatedToTemporary(node) || this.isNodeRelatedToCXXFuncCast(node)) {
                return this.tsNodeToValueAndStmts(node.inner[0]);
            }
            return this.newExpressionToValueAndStmts(node);
        } else if (node.kind === 'CXXThisExpr') {
            return this.thisExpressionToValueAndStmts(node);
        } else if (node.kind === 'IntegerLiteral') {
            return this.literalNodeToValueAndStmts(node) as ValueAndStmts;
        } else if (node.kind === 'InitListExpr') {
            // 数组和结构体都可以用{}初始化，此处需要做区分
            if (this.resolveTypeNode(node.type.qualType) instanceof ClassType) {
                // 结构体初始化则调用构造函数去初始化
                return this.newExpressionToValueAndStmts(node);
            }
            return this.arrayLiteralExpressionToValueAndStmts(node);
        } else if (node.kind === 'DeclStmt') {
            return this.variableDeclarationListToValueAndStmts(node);
        } else if (node.kind === 'UnaryOperator') {
            if (node.isPostfix) {
                return this.postfixUnaryExpressionToValueAndStmts(node);
            } else {
                return this.prefixUnaryExpressionToValueAndStmts(node);
            }
        } else if (node.kind === 'ArraySubscriptExpr') {
            return this.elementAccessExpressionToValueAndStmts(node);
        } else if (node.kind === 'StringLiteral' || node.kind === 'CXXBoolLiteralExpr' ||
            node.kind === 'CharacterLiteral' || node.kind === 'FloatingLiteral' || node.kind === 'CXXNullPtrLiteralExpr') {
            return this.literalNodeToValueAndStmts(node) as ValueAndStmts;
        } else if (node.kind === 'CompoundAssignOperator') {
            return this.compoundAssignmentToValueAndStmts(node);
        } else if (node.kind === 'CompoundLiteralExpr') {
            return this.tsNodeToValueAndStmts(node.inner[0].kind === 'TypeRef' ? node.inner[1] : node.inner[0]);
        } else if (node.kind === 'ConditionalOperator' || node.kind === 'BinaryConditionalOperator') {
            return this.conditionalExpressionToValueAndStmts(node);
        } else if (node.kind === 'LambdaExpr') {
            return this.callableNodeToValueAndStmts(node);
        } else if (node.kind === 'CXXStaticCastExpr' || node.kind === 'CStyleCastExpr' || node.kind === 'CXXConstCastExpr' ||
            node.kind === 'CXXDynamicCastExpr' || node.kind === 'CXXReinterpretCastExpr' || node.kind === 'CXXFunctionalCastExpr') {
            return this.castExpressionToValueAndStmts(node);
        } else if (node.kind === 'CXXDeleteExpr') {
            return this.deleteExpressionToValueAndStmts(node);
        } else if (node.kind === 'CXXScalarValueInitExpr') {
            return this.cxxScalarValueInitToValueAndStmts(node) as ValueAndStmts;
        } else if (node.kind === 'CXXTypeidExpr') {
            return this.cxxTypeidExprToValueAndStmts(node);
        } else if (node.kind === 'ArrayTypeTraitExpr') {
            return this.arrayTypeTraitExprToValueAndStmts(node);
        }

        logger.warn(`ArkValueTransformer-tsNodeToValueAndStmts: node '${node.kind}' is not specially processed.`);
        return {
            value: new Local(node.code),
            valueOriginalPositions: [FullPosition.buildFromNodeCpp(node, this.sourceFile)],
            stmts: [],
        };
    }

    // ArrayTypeTraitExpr按照函数调用处理
    private arrayTypeTraitExprToValueAndStmts(ArrayTypeTraitExpr: any): ValueAndStmts {
        const stmts: Stmt[] = [];
        let innerNode = ArrayTypeTraitExpr;
        while (innerNode.inner instanceof Array && innerNode.inner.length !== 0) {
            innerNode = innerNode.inner[0];
            if(innerNode.kind !== 'ArrayTypeTraitExpr') {
                break;
            }
        }
        const callArgs = [{
            kind: 'StringLiteral',
            value: innerNode.type.qualType.toString()
        }];
        if(ArrayTypeTraitExpr.traitFunc === '__array_extent') {
            const traitArgs = ArrayTypeTraitExpr.traitArgs.split(',');
            const numArg = traitArgs[traitArgs.length - 1].trim();
            callArgs.push({
                kind: 'IntegerLiteral',
                value: numArg,
            });
        }
        const callNode = JSON.parse(JSON.stringify(ArrayTypeTraitExpr));
        callNode.kind = 'DeclRefExpr';
        callNode.name = ArrayTypeTraitExpr.traitFunc;
        const args = this.parseArgumentsOfCallExpression(stmts, callArgs);
        return this.generateInvokeValueAndStmts(callNode, args, stmts, ArrayTypeTraitExpr);
    }

    // CXXTypeidExpr按照函数调用处理
    private cxxTypeidExprToValueAndStmts(CXXTypeidExpr: any): ValueAndStmts {
        const stmts: Stmt[] = [];
        let typeArgs = CXXTypeidExpr.typeArg.toString();
        let typeidCallArgs = CXXTypeidExpr.inner;
        // [1.typeid的inner.length为0，则传入的是类型名； 2.std::Type引用命名空间中的类型] ==> 参数函数调用去构造类型对应字符串入参
        if (CXXTypeidExpr.inner.length === 0 || (CXXTypeidExpr.inner.length === 2 && CXXTypeidExpr.inner[1].kind === 'TypeRef')) {
            typeidCallArgs = [{
                kind: 'StringLiteral',
                value: typeArgs
            }];
        }
        // 构造节点作为函数名节点
        let typeidCallNode = JSON.parse(JSON.stringify(CXXTypeidExpr));
        typeidCallNode.kind = 'DeclRefExpr';
        typeidCallNode.name = 'typeid';
        const argus = this.parseArgumentsOfCallExpression(stmts, typeidCallArgs);
        return this.generateInvokeValueAndStmts(typeidCallNode, argus, stmts, CXXTypeidExpr);
    }

    private cxxNoexceptExprToValueAndStmts(CXXNoexceptExpr: any): ValueAndStmts {
        const stmts: Stmt[] = [];
        let cxxNoexceptCallNode = JSON.parse(JSON.stringify(CXXNoexceptExpr));
        cxxNoexceptCallNode.kind = 'DeclRefExpr';
        cxxNoexceptCallNode.name = 'CXXNoexceptExpr';
        const argus = this.parseArgumentsOfCallExpression(stmts, CXXNoexceptExpr.inner);
        return this.generateInvokeValueAndStmts(cxxNoexceptCallNode, argus, stmts, CXXNoexceptExpr);
    }

    private cxxScalarValueInitToValueAndStmts(CXXScalarValueInitExpr: any): ValueAndStmts | null {
        const initType = CXXScalarValueInitExpr.type.qualType;
        let constant: Constant | null = null;
        switch (initType) {
            case 'int':
                constant = ValueUtil.getOrCreateNumberConst(parseFloat('0'));
                break;
            case 'float':
            case 'double':
                constant = ValueUtil.getOrCreateNumberConst(parseFloat('0.0'));
                break;
            case 'char':
                constant = ValueUtil.createStringConst('');
                break;
            default:
                logger.warn(`The initType of ast node "CXXScalarValueInitExpr" is ${initType}, maybe it is not literalNode or is not processed`);
        }
        if (constant === null) {
            return null;
        }
        return {
            value: constant,
            valueOriginalPositions: [FullPosition.buildFromNodeCpp(CXXScalarValueInitExpr, this.sourceFile)],
            stmts: []
        };
    }

    private deleteExpressionToValueAndStmts(deleteExpression: any): ValueAndStmts {
        const { value: exprValue, valueOriginalPositions: exprPositions, stmts: stmts } =
            this.tsNodeToValueAndStmts(deleteExpression.inner[0]);
        const deleteExpr = new ArkDeleteExpr(exprValue);
        const deleteExprPosition = [FullPosition.buildFromNodeCpp(deleteExpression, this.sourceFile), ...exprPositions];
        return {value: deleteExpr, valueOriginalPositions: deleteExprPosition, stmts: stmts};
    }

    private castExpressionToValueAndStmts(castExpression: any): ValueAndStmts {
        const stmts: Stmt[] = [];
        let {value: exprValue, valueOriginalPositions: exprPositions, stmts: exprStmts} = this.tsNodeToValueAndStmts(castExpression.inner[castExpression.inner.length - 1]);
        exprStmts.forEach((stmt: Stmt) => stmts.push(stmt));
        if (IRUtils.moreThanOneAddress(exprValue)) {
            ({value: exprValue, valueOriginalPositions: exprPositions, stmts: exprStmts} = this.arkIRTransformer.generateAssignStmtForValue(exprValue, exprPositions));
            exprStmts.forEach((stmt: Stmt) => stmts.push(stmt));
        }
        const castExpr = new ArkCastExpr(exprValue, this.resolveTypeNode(castExpression.type.qualType));
        const castExprPosition = [FullPosition.buildFromNodeCpp(castExpression, this.sourceFile), ...exprPositions];
        return {value: castExpr, valueOriginalPositions: castExprPosition, stmts: stmts};
    }




    private tsNodeToSingleAddressValueAndStmts(node: ts.Node): ValueAndStmts {
        const allStmts: Stmt[] = [];
        let { value, valueOriginalPositions, stmts } = this.tsNodeToValueAndStmts(node);
        stmts.forEach(stmt => allStmts.push(stmt));
        if (IRUtils.moreThanOneAddress(value)) {
            ({ value, valueOriginalPositions, stmts } = this.arkIRTransformer.generateAssignStmtForValue(value, valueOriginalPositions));
            stmts.forEach(stmt => allStmts.push(stmt));
        }
        return { value, valueOriginalPositions, stmts: allStmts };
    }

    private conditionalExpressionToValueAndStmts(conditionalExpression: any): ValueAndStmts {
        let InnerIdx = 0;
        const stmts: Stmt[] = [];
        const currConditionalOperatorIndex = this.conditionalOperatorNo++;
        const {
            value: conditionValue,
            valueOriginalPositions: conditionPositions,
            stmts: conditionStmts,
        } = this.conditionToValueAndStmts(conditionalExpression.inner[InnerIdx]);
        conditionStmts.forEach(stmt => stmts.push(stmt));
        const ifStmt = new ArkIfStmt(conditionValue as ArkConditionExpr);
        ifStmt.setOperandOriginalPositions(conditionPositions);
        stmts.push(ifStmt);

        stmts.push(new DummyStmt(ArkIRTransformer.DUMMY_CONDITIONAL_OPERATOR_IF_TRUE_STMT + currConditionalOperatorIndex));
        if (conditionalExpression.inner.length === 3) {
            InnerIdx = 1;
        } else if (conditionalExpression.inner.length === 4) {
            InnerIdx = 0;
        }
        const {
            value: whenTrueValue,
            valueOriginalPositions: whenTruePositions,
            stmts: whenTrueStmts,
        } = this.tsNodeToValueAndStmts(conditionalExpression.inner[InnerIdx]);
        whenTrueStmts.forEach(stmt => stmts.push(stmt));
        const resultLocal = this.generateTempLocal();
        const assignStmtWhenTrue = new ArkAssignStmt(resultLocal, whenTrueValue);
        const resultLocalPosition: FullPosition[] = [whenTruePositions[0]];
        assignStmtWhenTrue.setOperandOriginalPositions([...resultLocalPosition, ...whenTruePositions]);
        stmts.push(assignStmtWhenTrue);

        stmts.push(new DummyStmt(ArkIRTransformer.DUMMY_CONDITIONAL_OPERATOR_IF_FALSE_STMT + currConditionalOperatorIndex));
        if (conditionalExpression.inner.length === 3) {
            InnerIdx = 2;
        } else if (conditionalExpression.inner.length === 4) {
            InnerIdx = 3;
        }
        const {
            value: whenFalseValue,
            valueOriginalPositions: whenFalsePositions,
            stmts: whenFalseStmts,
        } = this.tsNodeToValueAndStmts(conditionalExpression.inner[InnerIdx]);
        whenFalseStmts.forEach(stmt => stmts.push(stmt));
        const assignStmt = new ArkAssignStmt(resultLocal, whenFalseValue);
        assignStmt.setOperandOriginalPositions([...resultLocalPosition, ...whenFalsePositions]);
        stmts.push(assignStmt);
        stmts.push(new DummyStmt(ArkIRTransformer.DUMMY_CONDITIONAL_OPERATOR_END_STMT + currConditionalOperatorIndex));
        return {
            value: resultLocal,
            valueOriginalPositions: resultLocalPosition,
            stmts: stmts,
        };
    }

    public getArgumentNodeForRecover(innerAsNodes: any): any {
        let callNode = {};
        let argumentNodes: any[] = [];
        for (let i = 0; i < innerAsNodes.length; i++) {
            if (i == 0) {
                callNode = innerAsNodes[i];
            } else {
                argumentNodes.push(innerAsNodes[i]);
            }
        }
        return [callNode, argumentNodes];
    }

    public getArgumentNode(innerAstNodes: any): any {
        let callNode = {};
        let argumentNodes: any[] = [];
        // 此时innerAstNode为单独的点
        if (innerAstNodes.hasOwnProperty('id')) {
            callNode = this.getDeclRef(innerAstNodes.inner[0]);
            if (innerAstNodes.inner.length > 1) {
                for (let i = 1; i < innerAstNodes.inner.length; i++) {
                    argumentNodes.push(this.getDeclRef(innerAstNodes.inner[i]));
                }
            }
            return [callNode, argumentNodes];
        }
        for (let i = 0; i < innerAstNodes.length; i++) {
            if (i == 0 && innerAstNodes[i].inner?.length !== 0) {
                let firstNode = innerAstNodes[i].inner[0];
                while (firstNode && firstNode.kind.toString() === 'ImplicitCastExpr') {
                    firstNode = firstNode.inner[0];
                }
                if (!firstNode) {
                    continue;
                }
                // kind = MemberExpr为了处理多层Field结构
                if (firstNode.kind.toString() === 'DeclRefExpr' || firstNode.kind.toString() === 'MemberExpr' || firstNode.kind.toString() === 'OverloadedDeclRef') {
                    callNode = firstNode;
                } else {
                    argumentNodes.push(firstNode);
                }
            }else {
                argumentNodes.push(innerAstNodes[i]);
            }
        }
        return [callNode, argumentNodes];
    }

    private getDeclRef(astNode: any): any {
        while (astNode.inner) {
            astNode = astNode.inner[0];
            if (astNode.kind === 'DeclRefExpr') {
                return astNode;
            }
        }
    }

    private generateSystemComponentStmt(
        componentName: string,
        args: Value[],
        argPositionsAllFlat: FullPosition[],
        componentExpression: ts.EtsComponentExpression | ts.CallExpression,
        currStmts: Stmt[]
    ): ValueAndStmts {
        const stmts: Stmt[] = [...currStmts];
        const componentExpressionPosition = FullPosition.buildFromNodeCpp(componentExpression, this.sourceFile);
        const {
            value: componentValue,
            valueOriginalPositions: componentPositions,
            stmts: componentStmts,
        } = this.generateComponentCreationStmts(componentName, args, componentExpressionPosition, argPositionsAllFlat);
        componentStmts.forEach(stmt => stmts.push(stmt));

        if (ts.isEtsComponentExpression(componentExpression) && componentExpression.body) {
            for (const statement of componentExpression.body.statements) {
                this.arkIRTransformer.tsNodeToStmts(statement).forEach(stmt => stmts.push(stmt));
            }
        }
        stmts.push(this.generateComponentPopStmts(componentName, componentExpressionPosition));
        return {
            value: componentValue,
            valueOriginalPositions: componentPositions,
            stmts: stmts,
        };
    }

    private generateCustomViewStmt(
        componentName: string,
        args: Value[],
        argPositionsAllFlat: FullPosition[],
        componentExpression: ts.EtsComponentExpression | ts.CallExpression,
        currStmts: Stmt[]
    ): ValueAndStmts {
        const stmts: Stmt[] = [...currStmts];
        const componentExpressionPosition = FullPosition.buildFromNodeCpp(componentExpression, this.sourceFile);
        const classSignature = ArkSignatureBuilder.buildClassSignatureFromClassName(componentName);
        const classType = new ClassType(classSignature);
        const newExpr = new ArkNewExpr(classType);
        const {
            value: newExprLocal,
            valueOriginalPositions: newExprPositions,
            stmts: newExprStmts,
        } = this.arkIRTransformer.generateAssignStmtForValue(newExpr, [componentExpressionPosition]);
        newExprStmts.forEach(stmt => stmts.push(stmt));
        const constructorMethodSubSignature = ArkSignatureBuilder.buildMethodSubSignatureFromMethodName(CONSTRUCTOR_NAME);
        const constructorMethodSignature = new MethodSignature(classSignature, constructorMethodSubSignature);
        const instanceInvokeExpr = new ArkInstanceInvokeExpr(newExprLocal as Local, constructorMethodSignature, args);
        const instanceInvokeExprPositions = [componentExpressionPosition, ...newExprPositions, ...argPositionsAllFlat];
        const instanceInvokeStmt = new ArkInvokeStmt(instanceInvokeExpr);
        instanceInvokeStmt.setOperandOriginalPositions(instanceInvokeExprPositions);
        stmts.push(instanceInvokeStmt);
        const createViewArgs: Value[] = [newExprLocal];
        const createViewArgPositionsAll = [newExprPositions];
        if (ts.isEtsComponentExpression(componentExpression) && componentExpression.body) {
            const anonymous = ts.factory.createArrowFunction([], [], [], undefined, undefined, componentExpression.body);
            const { value: builderMethod, valueOriginalPositions: builderMethodPositions } = this.callableNodeToValueAndStmts(anonymous);
            createViewArgs.push(builderMethod);
            createViewArgPositionsAll.push(builderMethodPositions);
        }
        const {
            value: componentValue,
            valueOriginalPositions: componentPositions,
            stmts: componentStmts,
        } = this.generateComponentCreationStmts(COMPONENT_CUSTOMVIEW, createViewArgs, componentExpressionPosition, createViewArgPositionsAll.flat());
        componentStmts.forEach(stmt => stmts.push(stmt));
        stmts.push(this.generateComponentPopStmts(COMPONENT_CUSTOMVIEW, componentExpressionPosition));
        return {
            value: componentValue,
            valueOriginalPositions: componentPositions,
            stmts: stmts,
        };
    }

    private generateComponentCreationStmts(
        componentName: string,
        createArgs: Value[],
        componentExpressionPosition: FullPosition,
        createArgsPositionsAllFlat: FullPosition[]
    ): ValueAndStmts {
        const createMethodSignature = ArkSignatureBuilder.buildMethodSignatureFromClassNameAndMethodName(componentName, COMPONENT_CREATE_FUNCTION);
        const createInvokeExpr = new ArkStaticInvokeExpr(createMethodSignature, createArgs);
        const createInvokeExprPositions = [componentExpressionPosition, ...createArgsPositionsAllFlat];
        const {
            value: componentValue,
            valueOriginalPositions: componentPositions,
            stmts: componentStmts,
        } = this.arkIRTransformer.generateAssignStmtForValue(createInvokeExpr, createInvokeExprPositions);
        return {
            value: componentValue,
            valueOriginalPositions: componentPositions,
            stmts: componentStmts,
        };
    }

    private generateComponentPopStmts(componentName: string, componentExpressionPosition: FullPosition): Stmt {
        const popMethodSignature = ArkSignatureBuilder.buildMethodSignatureFromClassNameAndMethodName(componentName, COMPONENT_POP_FUNCTION);
        const popInvokeExpr = new ArkStaticInvokeExpr(popMethodSignature, []);
        const popInvokeExprPositions = [componentExpressionPosition];
        const popInvokeStmt = new ArkInvokeStmt(popInvokeExpr);
        popInvokeStmt.setOperandOriginalPositions(popInvokeExprPositions);
        return popInvokeStmt;
    }

    private identifierToValueAndStmts(identifier: any, variableDefFlag: boolean = false): ValueAndStmts {
        let identifierValue: Value;
        let identifierPositions = [FullPosition.buildFromNodeCpp(identifier, this.sourceFile)];
        let varNode: any;
        if (identifier.referencedDecl) {
            varNode = identifier.referencedDecl;
        } else {
            varNode = identifier;
        }
        if (varNode.name === UndefinedType.getInstance().getName()) {
            identifierValue = ValueUtil.getUndefinedConst();
        } else {
            if (variableDefFlag) {
                identifierValue = this.addNewLocal(varNode.name);
            } else {
                identifierValue = this.getOrCreateLocal(varNode.name);
            }
        }
        return {
            value: identifierValue,
            valueOriginalPositions: identifierPositions,
            stmts: [],
        };
    }

    private memberExpressionToValueAndStmts(memberExpression: any): ValueAndStmts {
        const stmts: Stmt[] = [];
        // 当返回成员变量memberExpr需构建cxxThisExpr
        if (memberExpression.kind === 'MemberExpr' && memberExpression.inner[0] === undefined) {
            let node = memberExpression;
            node.kind = 'CXXThisExpr';
            memberExpression.inner[0] = node;
        }
        let {value: baseValue, valueOriginalPositions: basePositions, stmts: baseStmts} = this.tsNodeToValueAndStmts(memberExpression.inner[0]);
        if (memberExpression.inner[0].kind === 'MemberExpr') {
            ({value: baseValue, valueOriginalPositions: basePositions, stmts: baseStmts} = this.arkIRTransformer.generateAssignStmtForValue(baseValue, basePositions));
        }
        stmts.push(...baseStmts);
        //获取域的签名
        let fieldSignature: FieldSignature;
        let baseType = baseValue.getType();
        let baseClassType: ClassType | null = null;
        if (baseType instanceof ClassType) {
            baseClassType = baseType as ClassType;
        } else if (baseType instanceof PointerType && (baseType as PointerType).getBaseType() instanceof ClassType) {
            baseClassType = (baseType as PointerType).getBaseType() as ClassType;
        } else if (baseType instanceof ReferenceType && (baseType as ReferenceType).getBaseType() instanceof ClassType) {
            baseClassType = (baseType as ReferenceType).getBaseType() as ClassType;
        }
        if (baseValue instanceof Local && baseClassType !== null) {
            fieldSignature = new FieldSignature(
                memberExpression.name, baseClassType.getClassSignature(), UnknownType.getInstance()
            );
        }else {
            fieldSignature = ArkSignatureBuilder.buildFieldSignatureFromFieldName(memberExpression.name);
        }
        fieldSignature.setType(this.resolveTypeNode(memberExpression.type.qualType));
        const fieldRef = new CXXArkInstanceFieldRef(baseValue as Local, memberExpression.isArrow, fieldSignature);
        const fieldRefPositions = [FullPosition.buildFromNodeCpp(memberExpression, this.sourceFile), ...basePositions];
        return {value: fieldRef, valueOriginalPositions: fieldRefPositions, stmts: stmts};
    }
    private elementAccessExpressionToValueAndStmts(elementAccessExpression: any): ValueAndStmts {
        const stmts: Stmt[] = [];
        let { value: baseValue, valueOriginalPositions: basePositions, stmts: baseStmts } = this.tsNodeToValueAndStmts(elementAccessExpression.inner[0]);
        baseStmts.forEach(stmt => stmts.push(stmt));
        if (!(baseValue instanceof Local)) {
            ({
                value: baseValue,
                valueOriginalPositions: basePositions,
                stmts: baseStmts,
            } = this.arkIRTransformer.generateAssignStmtForValue(baseValue, basePositions));
            baseStmts.forEach(stmt => stmts.push(stmt));
        }
        let {
            value: argumentValue,
            valueOriginalPositions: arguPositions,
            stmts: argumentStmts,
        } = this.tsNodeToValueAndStmts(elementAccessExpression.inner[1]);
        argumentStmts.forEach(stmt => stmts.push(stmt));
        if (IRUtils.moreThanOneAddress(argumentValue)) {
            ({
                value: argumentValue,
                valueOriginalPositions: arguPositions,
                stmts: argumentStmts,
            } = this.arkIRTransformer.generateAssignStmtForValue(argumentValue, arguPositions));
            argumentStmts.forEach(stmt => stmts.push(stmt));
        }

        let elementAccessExpr: Value;
        if (baseValue.getType() instanceof ArrayType || baseValue.getType() instanceof PointerType) {
            elementAccessExpr = new ArkArrayRef(baseValue as Local, argumentValue);
        } else {
            // TODO: deal with ArkStaticFieldRef
            const fieldSignature = ArkSignatureBuilder.buildFieldSignatureFromFieldName(argumentValue.toString());
            elementAccessExpr = new ArkInstanceFieldRef(baseValue as Local, fieldSignature);
        }
        // reserve positions for field name
        const exprPositions = [FullPosition.buildFromNodeCpp(elementAccessExpression, this.sourceFile), ...basePositions, ...arguPositions];
        return {
            value: elementAccessExpr,
            valueOriginalPositions: exprPositions,
            stmts: stmts,
        };
    }

    private callExpressionToValueAndStmts(callExpression: any): ValueAndStmts {
        const stmts: Stmt[] = [];
        const [callNode, argumentNodes] = this.getArgumentNode(callExpression.inner);
        const argus = this.parseArgumentsOfCallExpression(stmts, argumentNodes);
        return this.generateInvokeValueAndStmts(callNode, argus, stmts, callExpression);
    }

    public CXXOperatorExpressionCoutToValueAndStmts(callExpression: any, callArgus: any[]): any {
        const stmts: Stmt[] = [];
        // 因为inner是依次提取最后面的参数，所以倒序遍历最后面的参数
        for(let i = callExpression.inner.length - 1; i >= 0; i--) {
            let innerNode = callExpression.inner[i];
            if (!innerNode.code.includes('cout') && !innerNode.code.includes('<<') && !innerNode.code.includes('endl') && !callExpression.code.startsWith(innerNode.code)) {
                callArgus.push(innerNode);
            }
            if (innerNode.kind === 'CXXOperatorCallExpr') {
                // 递归调用处理CXXOperatorCallExpr
                return this.CXXOperatorExpressionCoutToValueAndStmts(innerNode, callArgus);
            }
            while (innerNode.kind === 'ImplicitCastExpr' && innerNode.valueCategory === 'lvalue') {
                innerNode = innerNode.inner[0];
            }
            if (innerNode.kind === 'DeclRefExpr') {
                // 获取DeclRefExpr及其后面的节点
                const callNode = innerNode;
                const argus = this.parseArgumentsOfCallExpression(stmts, callArgus.reverse());
                return this.generateInvokeValueAndStmts(callNode, argus, stmts, callExpression);
            }
        }
    }

    public CXXOperatorExpressionToBinaryOperator(expression: any): any {
        let operatorExpression = Object.assign({}, expression);
        operatorExpression['opcode'] = expression.inner[0].code;
        operatorExpression['inner'] = [expression.inner[1], expression.inner[2]];
        return this.binaryExpressionToValueAndStmts(operatorExpression);
    }

    public CXXOperatorExpressionToUnaryOperator(expression: any): any {
        let operatorExpression = Object.assign({}, expression);
        operatorExpression['opcode'] = expression.inner[0].code;
        operatorExpression['inner'] = [expression.inner[1]];
        if (expression.code.indexOf(expression.inner[0].cdoe) == 0) {
            return this.prefixUnaryExpressionToValueAndStmts(operatorExpression);
        }
        return this.postfixUnaryExpressionToValueAndStmts(operatorExpression);
    }

    public cxxOperatorExpressionToValueAndStmts(callExpression: any, layer: boolean = true): any {
        if ((callExpression.inner[0].kind === 'ImplicitCastExpr' && callExpression.inner[0].code.includes('<<') ||
            (callExpression.inner[1]?.type.qualType.toString().includes('(lambda at')))) {
            return this.CXXOperatorExpressionCoutToValueAndStmts(callExpression, []);
        }
        //cxxOperatorCallExpr实际是而二元操作，或者重载赋值运算符operator=
        if (callExpression.inner[0].kind === 'ImplicitCastExpr' && (ArkValueTransformer.isRelationalBinaryOperator(callExpression.inner[0].code) ||
            callExpression.name === 'operator=')) {
            return this.CXXOperatorExpressionToBinaryOperator(callExpression);
        }
        // cxxOperatorCallExpr实际是一元操作符（++，--）
        if (callExpression.inner[0].kind === 'ImplicitCastExpr' && ['++', '--'].includes(callExpression.inner[0].code)) {
            return this.CXXOperatorExpressionToUnaryOperator(callExpression);
        }
        // 迭代时->操作符的使用场景
        if (callExpression.inner[0].kind === 'ImplicitCastExpr' && callExpression.inner[0].code === '->') {
            return this.tsNodeToValueAndStmts(callExpression.inner[1]);
        }
        const innerStmts: ValueAndStmts[] = [];
        const stmts: Stmt[] = [];
        for (let innerNode of callExpression.inner) {
            if (innerNode.kind === 'CXXOperatorCallExpr' || innerNode.kind === 'MaterializeTemporaryExpr' || innerNode.kind === 'CXXBindTemporaryExpr' ||
                innerNode.kind === 'CXXConstructExpr' || (innerNode.kind === 'ImplicitCastExpr' && innerNode.castKind !== 'FunctionToPointerDecay')) {
                innerStmts.push(...this.cxxOperatorExpressionToValueAndStmts(innerNode, false));
            } else if (innerNode.kind === 'DeclRefExpr') {
                innerStmts.push(this.identifierToValueAndStmts(innerNode));
            } else if (innerNode.kind === 'IntegerLiteral' || innerNode.kind === 'StringLiteral') {
                let integerNode = this.literalNodeToValueAndStmts(innerNode);
                if (integerNode) {
                    innerStmts.push(integerNode);
                }
            }
        }
        if (!layer) { // 只在递归的第一层处理结果，其他层都直接返回
            return innerStmts;
        }
        const exprPositions = [FullPosition.buildFromNodeCpp(callExpression, this.sourceFile), ...innerStmts[0].valueOriginalPositions,
            ...innerStmts[1].valueOriginalPositions];
        let elementAccessExpr = new ArkArrayRef(innerStmts[0].value as Local, innerStmts[1].value);
        innerStmts[0].stmts.forEach(stmt => stmts.push(stmt));
        innerStmts[1].stmts.forEach(stmt => stmts.push(stmt));
        return {value: elementAccessExpr, valueOriginalPositions: exprPositions, stmts: stmts};
     }

     public RecoverExpressionToValueAndStmts(callExpression: any): ValueAndStmts {
        const stmts: Stmt[] = [];
        const [callNode, argumentNodes] = this.getArgumentNodeForRecover(callExpression.inner);
        const argus = this.parseArgumentsOfCallExpression(stmts, argumentNodes);
        return this.generateInvokeValueAndStmts(callNode, argus, stmts, callExpression);
     }


    private generateInvokeValueAndStmts(
        functionNameNode: any,
        argus: {
            realGenericTypes: Type[] | undefined;
            args: Value[];
            argPositions: FullPosition[];
        },
        currStmts: Stmt[],
        callExpression: any
    ): ValueAndStmts {
        const stmts: Stmt[] = [...currStmts];
        let { value: callerValue, valueOriginalPositions: callerPositions, stmts: callerStmts } = this.tsNodeToValueAndStmts(functionNameNode);
        callerStmts.forEach(stmt => stmts.push(stmt));

        let invokeValue: Value;
        let invokeValuePositions: FullPosition[] = [FullPosition.buildFromNodeCpp(callExpression, this.sourceFile)];
        const { args, argPositions, realGenericTypes } = argus;
        if (callerValue instanceof AbstractFieldRef) {
            invokeValue = this.buildInvokeValueForFieldRef(callerValue, args, realGenericTypes, invokeValuePositions, callerPositions);
        } else if (callerValue instanceof Local) {
            const callerName = callerValue.getName();
            let classSignature = ArkSignatureBuilder.buildClassSignatureFromClassName(callerName);
            let cls = ModelUtils.getClass(this.declaringMethod, classSignature);
            if (cls?.hasComponentDecorator() && ['CallExpr', 'CXXOperatorCallExpr'].includes(callExpression)) {
                return this.generateCustomViewStmt(callerName, args, argPositions, callExpression, stmts);
            } else if ((callerName === COMPONENT_FOR_EACH || callerName === COMPONENT_LAZY_FOR_EACH) && ts.isCallExpression(callExpression)) {
                // foreach/lazyforeach will be parsed as ts.callExpression
                return this.generateSystemComponentStmt(callerName, args, argPositions, callExpression, stmts);
            }
            const methodSignature = ArkSignatureBuilder.buildMethodSignatureFromMethodName(callerName);
            if (callerValue.getType() instanceof FunctionType) {
                invokeValue = new ArkPtrInvokeExpr(methodSignature, callerValue, args, realGenericTypes);
            } else {
                invokeValue = new ArkStaticInvokeExpr(methodSignature, args, realGenericTypes);
            }
        } else {
            ({
                value: callerValue,
                valueOriginalPositions: callerPositions,
                stmts: callerStmts,
            } = this.arkIRTransformer.generateAssignStmtForValue(callerValue, callerPositions));
            callerStmts.forEach(stmt => stmts.push(stmt));
            const methodSignature = ArkSignatureBuilder.buildMethodSignatureFromMethodName((callerValue as Local).getName());
            invokeValue = new ArkStaticInvokeExpr(methodSignature, args, realGenericTypes);
        }
        invokeValuePositions.push(...argPositions);
        return {
            value: invokeValue,
            valueOriginalPositions: invokeValuePositions,
            stmts: stmts,
        };
    }

    private cxxMemberCallExpressionToValueAndStmts(callExpression: any): ValueAndStmts {
        let realGenericTypes: Type[] | undefined;
        const stmts: Stmt[] = [];
        const [leftNode, rightNode] = this.getArgumentNode(callExpression.inner);
        leftNode;
        const {args, argPositions: argPositionsAll} = this.parseArguments(stmts, rightNode);
        const argPositionsAllFlat = argPositionsAll.flat();
        let { value: callerValue, valueOriginalPositions: callerPositions, stmts: callerStmts } = this.tsNodeToValueAndStmts(callExpression.inner[0]);
        stmts.push(...callerStmts);

        let invokeValue: Value;
        let invokeValuePositions: FullPosition[] = [FullPosition.buildFromNodeCpp(callExpression, this.sourceFile)];
        if (callerValue instanceof  ArkInstanceFieldRef) {
            invokeValue = this.buildInvokeValueForFieldRef(callerValue, args, realGenericTypes, invokeValuePositions, callerPositions);
        } else if (callerValue instanceof Local) {
            invokeValue = this.buildInvokeValueForLocal(callerValue, args, realGenericTypes);
        } else {
            ({
                value: callerValue,
                valueOriginalPositions: callerPositions,
                stmts: callerStmts,
            } = this.generateAssignStmtForValue(callerValue, callerPositions));
            stmts.push(...callerStmts);
            const methodSignature = ArkSignatureBuilder.buildMethodSignatureFromMethodName((callerValue as Local).getName());
            invokeValue = new ArkStaticInvokeExpr(methodSignature, args, realGenericTypes);
            invokeValuePositions.push(...argPositionsAllFlat);
        }
        invokeValuePositions.push(...argPositionsAllFlat);
        return {
            value: invokeValue,
            valueOriginalPositions: invokeValuePositions,
            stmts: stmts,
        };
    }

    private buildInvokeValueForFieldRef(callerValue: AbstractFieldRef, args: Value[], realGenericTypes: Type[] | undefined,
                                        invokeValuePositions: FullPosition[], callerPositions: FullPosition[]): ArkInstanceFieldRef | ArkStaticInvokeExpr {
        let methodSignature: MethodSignature;
        const declareSignature = callerValue.getFieldSignature().getDeclaringSignature();
        if (declareSignature instanceof ClassSignature) {
            methodSignature = new MethodSignature(declareSignature, ArkSignatureBuilder.buildMethodSubSignatureFromMethodName(callerValue.getFieldName()));
        } else {
            methodSignature = ArkSignatureBuilder.buildMethodSignatureFromMethodName(callerValue.getFieldName());
        }
        if (callerValue instanceof ArkInstanceFieldRef) {
            invokeValuePositions.push(...callerPositions.slice());
            return new ArkInstanceInvokeExpr(callerValue.getBase(), methodSignature, args, realGenericTypes);
        } else {
            return new ArkStaticInvokeExpr(methodSignature, args, realGenericTypes);
        }
    }

    private buildInvokeValueForLocal(callerValue: Local, args: Value[], realGenericTypes: Type[] | undefined): ArkPtrInvokeExpr | ArkStaticInvokeExpr {
        const callerName = callerValue.getName();
        const methodSignature = ArkSignatureBuilder.buildMethodSignatureFromMethodName(callerName);
        if (callerValue.getType() instanceof FunctionType) {
            return new ArkPtrInvokeExpr(methodSignature, callerValue, args, realGenericTypes);
        } else {
            return new ArkStaticInvokeExpr(methodSignature, args, realGenericTypes);
        }
    }

    public generateAssignStmtForValue(value: Value, valueOriginalPositions: FullPosition[]): ValueAndStmts {
        const leftOp = this.generateTempLocal(value.getType());
        const leftOpPosition = valueOriginalPositions[0];
        const assignStmt = new ArkAssignStmt(leftOp, value);
        assignStmt.setOperandOriginalPositions([leftOpPosition, ...valueOriginalPositions]);
        return {value: leftOp, valueOriginalPositions:  [leftOpPosition], stmts: [assignStmt]};
    }

    private parseArgumentsOfCallExpression(
        currStmts: Stmt[],
        callExpression: any
    ): {
        realGenericTypes: Type[] | undefined,
        args: Value[],
        argPositions: FullPosition[]
    } {
        let realGenericTypes: Type[] | undefined;
        let builderMethodIndexes: Set<number> | undefined;
        const { args: args, argPositions: argPositions } = this.parseArguments(currStmts, callExpression, builderMethodIndexes);
        return {
            realGenericTypes: realGenericTypes,
            args: args,
            argPositions: argPositions,
        };
    }

    private parseArguments(
        currStmts: Stmt[],
        argumentNodes?: ts.NodeArray<ts.Expression>,
        builderMethodIndexes?: Set<number>
    ): {
        args: Value[];
        argPositions: FullPosition[];
    } {
        const args: Value[] = [];
        const argPositions: FullPosition[] = [];
        if (argumentNodes) {
            for (let i = 0; i < argumentNodes.length; i++) {
                if (argumentNodes[i].kind.toString() === 'CXXDefaultArgExpr') {
                    continue;
                }
                const argument = argumentNodes[i];
                const prevBuilderMethodContextFlag = this.builderMethodContextFlag;
                if (builderMethodIndexes?.has(i)) {
                    this.builderMethodContextFlag = true;
                    this.arkIRTransformer.setBuilderMethodContextFlag(true);
                }
                let { value: argValue, valueOriginalPositions: argPositionsSingle, stmts: argStmts } = this.tsNodeToValueAndStmts(argument);
                this.builderMethodContextFlag = prevBuilderMethodContextFlag;
                this.arkIRTransformer.setBuilderMethodContextFlag(prevBuilderMethodContextFlag);
                argStmts.forEach(s => currStmts.push(s));
                if (IRUtils.moreThanOneAddress(argValue)) {
                    ({
                        value: argValue,
                        valueOriginalPositions: argPositionsSingle,
                        stmts: argStmts,
                    } = this.arkIRTransformer.generateAssignStmtForValue(argValue, argPositionsSingle));
                    argStmts.forEach(s => currStmts.push(s));
                }
                args.push(argValue);
                argPositions.push(argPositionsSingle[0]);
            }
        }
        return { args: args, argPositions: argPositions };
    }

    private callableNodeToValueAndStmts(callableNode: ts.ArrowFunction | ts.FunctionExpression): ValueAndStmts {
        const declaringClass = this.declaringMethod.getDeclaringArkClass();
        const arrowArkMethod = new ArkMethod();
        if (this.builderMethodContextFlag) {
            ModelUtils.implicitArkUIBuilderMethods.add(arrowArkMethod);
        }
        buildArkMethodFromArkClass(callableNode, declaringClass, arrowArkMethod, this.sourceFile, this.declaringMethod);

        const callableType = new FunctionType(arrowArkMethod.getSignature());
        const callableValue = this.addNewLocal(arrowArkMethod.getName(), callableType);
        return {
            value: callableValue,
            valueOriginalPositions: [FullPosition.buildFromNodeCpp(callableNode, this.sourceFile)],
            stmts: [],
        };
    }

    private newExpressionToValueAndStmts(newExpression: any): ValueAndStmts {
        let className = this.getNewExpressionClassName(newExpression);
        //新增处理动态数组创建： int *arr = new int[10]
        if (className === Builtin.ARRAY || newExpression.isArray) {
            return this.newArrayExpressionToValueAndStmts(newExpression);
        }

        const stmts: Stmt[] = [];
        let realGenericTypes: Type[] | undefined;
        if (newExpression.typeArguments) {
            realGenericTypes = [];
            newExpression.typeArguments.forEach((typeArgument: string) => {
                realGenericTypes!.push(this.resolveTypeNode(typeArgument));
            });
        }

        let curClass = this.declaringMethod.getDeclaringArkFile().getClassWithName(className);
        let classSignature = (curClass ? curClass.getSignature() : ArkSignatureBuilder.buildClassSignatureFromClassName(className));
        let classType = new ClassType(classSignature, realGenericTypes);
        if (className === Builtin.OBJECT) {
            classSignature = Builtin.OBJECT_CLASS_SIGNATURE;
            classType = Builtin.OBJECT_CLASS_TYPE;
        }

        const newExpr = new ArkNewExpr(classType);
        const {
            value: newLocal,
            valueOriginalPositions: newLocalPositions,
            stmts: newExprStmts,
        } = this.arkIRTransformer.generateAssignStmtForValue(newExpr, [FullPosition.buildFromNodeCpp(newExpression, this.sourceFile)]);
        newExprStmts.forEach(stmt => stmts.push(stmt));

        const constructorMethodSubSignature = ArkSignatureBuilder.buildMethodSubSignatureFromMethodName(CONSTRUCTOR_NAME);
        const constructorMethodSignature = new MethodSignature(classSignature, constructorMethodSubSignature);
        // 区分new class 和 C++ STL容器
        let constructArgs = newExpression.inner;
        if ((newExpression.kind === 'CXXNewExpr' && newExpression.inner[1]?.kind === 'CXXConstructExpr')) {
            constructArgs = [...newExpression.inner[1].inner];
        } else if (newExpression.kind === 'CompoundLiteralExpr') {
            constructArgs = this.getConstructArgs(constructArgs);
        } else if (newExpression.kind === 'CXXConstructExpr' && newExpression.type.qualType.startsWith('struct') &&
            constructArgs && constructArgs[0].inner[0]?.kind === 'CompoundLiteralExpr') {
            constructArgs = this.getConstructArgs(constructArgs[0].inner[0].inner);
        }

        const { args: argValues, argPositions: argPositions } = this.parseArguments(stmts, constructArgs);
        const instanceInvokeExpr = new ArkInstanceInvokeExpr(newLocal as Local, constructorMethodSignature, argValues);

        const invokeStmt = new ArkInvokeStmt(instanceInvokeExpr);
        const instanceInvokeExprPositions = [newLocalPositions[0], ...newLocalPositions, ...argPositions];
        invokeStmt.setOperandOriginalPositions(instanceInvokeExprPositions);
        stmts.push(invokeStmt);
        return { value: newLocal, valueOriginalPositions: newLocalPositions, stmts: stmts };
    }

    private getConstructArgs(constructArgs: Array<any>): Array<any> {
        if (constructArgs[1]?.kind === 'InitListExpr') {
            constructArgs = constructArgs[1].inner;
        }
        let newConstructArgs = [];
        for (let i =0; i < constructArgs.length; i++) {
            if (constructArgs[1].kind.toString() === 'ImplicitCastExpr') {
                newConstructArgs.push(constructArgs[i].inner[1]);
            }
        }
        return newConstructArgs;
    }

    private getNewExpressionClassName(newExpression: any): string {
        let oriType = '';
        if (newExpression.type.desugaredQualType) {
            oriType = newExpression.type.desugaredQualType;
        } else if (newExpression.type.qualType) {
            oriType = newExpression.type.qualType;
        } else if (newExpression.code) {
            oriType = newExpression.code;
        }
        if (isCXXSTLContainer(oriType)) {
            return oriType;
        }
        return oriType.replace(/[\(\)]/g, '').replace(' *', '');
    }

    private newArrayExpressionToValueAndStmts(newArrayExpression: any): ValueAndStmts {
        let baseType: Type = UnknownType.getInstance();
        if (newArrayExpression.type.qualType) {
            const argumentType = this.resolveTypeNode(newArrayExpression.type.qualType.replace('*', ''));
            if (!(argumentType instanceof AnyType || argumentType instanceof UnknownType)) {
                baseType = argumentType;
            }
        }
        const stmts: Stmt[] = [];
        const { args: argumentValues, argPositions: argPositions } = this.parseArguments(stmts, newArrayExpression.inner);
        let argumentsLength = newArrayExpression.inner ? newArrayExpression.inner.length : 0;
        let arrayLengthValue: Value;
        let arrayLength = -1;
        let arrayLengthPosition = FullPosition.DEFAULT;
        if (argumentsLength === 1 && (argumentValues[0].getType() instanceof NumberType || argumentValues[0].getType() instanceof UnknownType)) {
            arrayLengthValue = argumentValues[0];
            arrayLengthPosition = argPositions[0];
        } else {
            arrayLengthValue = ValueUtil.getOrCreateNumberConst(argumentsLength);
            arrayLength = argumentsLength;
        }
        if (baseType instanceof UnknownType) {
            if (argumentsLength > 1 && !(argumentValues[0].getType() instanceof UnknownType)) {
                baseType = argumentValues[0].getType();
            } else {
                baseType = AnyType.getInstance();
            }
        }
        const newArrayExprPosition = FullPosition.buildFromNodeCpp(newArrayExpression, this.sourceFile);
        return this.generateArrayExprAndStmts(
            baseType,
            arrayLengthValue,
            arrayLengthPosition,
            arrayLength,
            argumentValues,
            argPositions,
            stmts,
            newArrayExprPosition,
            false
        );
    }

    private arrayLiteralExpressionToValueAndStmts(arrayLiteralExpression: any): ValueAndStmts {
        const stmts: Stmt[] = [];
        const elementTypes: Set<Type> = new Set();
        const elementValues: Value[] = [];
        const elementPositions: FullPosition[] = [];
        const arrayLength = arrayLiteralExpression.inner.length;
        this.getArrayLiteralExpression(arrayLiteralExpression, stmts, elementTypes, elementValues, elementPositions);
        let baseType: Type = this.resolveTypeNode(arrayLiteralExpression.type.qualType);
        if (baseType === UnknownType.getInstance()) {
            // 如果类型不确定，当作未知引用类型
            return this.newExpressionToValueAndStmts(arrayLiteralExpression);
        }
        const newArrayExprPosition = FullPosition.buildFromNodeCpp(arrayLiteralExpression, this.sourceFile);
        return this.generateArrayExprAndStmts(
            baseType,
            ValueUtil.getOrCreateNumberConst(arrayLength),
            FullPosition.DEFAULT,
            arrayLength,
            elementValues,
            elementPositions,
            stmts,
            newArrayExprPosition,
            true
        );
    }

    private getArrayLiteralExpression(arrayLiteralExpression: any, stmts: Stmt[], elementTypes: Set<Type>, elementValues: Value[], elementPositions: FullPosition[]) {
        for (const element of arrayLiteralExpression.inner) {
            let { value: elementValue, valueOriginalPositions: elementPosition, stmts: elementStmts } = this.tsNodeToValueAndStmts(element);
            elementStmts.forEach(stmt => stmts.push(stmt));
            if (IRUtils.moreThanOneAddress(elementValue)) {
                ({
                    value: elementValue,
                    valueOriginalPositions: elementPosition,
                    stmts: elementStmts,
                } = this.arkIRTransformer.generateAssignStmtForValue(elementValue, elementPosition));
                elementStmts.forEach(stmt => stmts.push(stmt));
            }
            elementValues.push(elementValue);
            elementTypes.add(elementValue.getType());
            elementPositions.push(elementPosition[0]);
        }
    }

    private generateArrayExprAndStmts(
        baseType: Type,
        arrayLengthValue: Value,
        arrayLengthPosition: FullPosition,
        arrayLength: number,
        initializerValues: Value[],
        initializerPositions: FullPosition[],
        currStmts: Stmt[],
        newArrayExprPosition: FullPosition,
        fromLiteral: boolean
    ): ValueAndStmts {
        const stmts: Stmt[] = [...currStmts];
        const newArrayExpr = new ArkNewArrayExpr(baseType, arrayLengthValue, fromLiteral);
        const newArrayExprPositions = [newArrayExprPosition, arrayLengthPosition];
        const {
            value: arrayLocal,
            valueOriginalPositions: arrayLocalPositions,
            stmts: arrayStmts,
        } = this.arkIRTransformer.generateAssignStmtForValue(newArrayExpr, newArrayExprPositions);
        arrayStmts.forEach(stmt => stmts.push(stmt));
        for (let i = 0; i < arrayLength; i++) {
            const indexValue = ValueUtil.getOrCreateNumberConst(i);
            const arrayRef = new ArkArrayRef(arrayLocal as Local, indexValue);
            const arrayRefPositions = [arrayLocalPositions[0], ...arrayLocalPositions, FullPosition.DEFAULT];
            const assignStmt = new ArkAssignStmt(arrayRef, initializerValues[i]);
            assignStmt.setOperandOriginalPositions([...arrayRefPositions, initializerPositions[i]]);
            stmts.push(assignStmt);
        }
        return {
            value: arrayLocal,
            valueOriginalPositions: arrayLocalPositions,
            stmts: stmts,
        };
    }

    private prefixUnaryExpressionToValueAndStmts(prefixUnaryExpression: any): ValueAndStmts {
        const stmts: Stmt[] = [];
        let { value: operandValue, valueOriginalPositions: operandPositions, stmts: operandStmts } = this.tsNodeToValueAndStmts(prefixUnaryExpression.inner[0]);
        operandStmts.forEach(stmt => stmts.push(stmt));
        if (IRUtils.moreThanOneAddress(operandValue)) {
            ({
                value: operandValue,
                valueOriginalPositions: operandPositions,
                stmts: operandStmts,
            } = this.arkIRTransformer.generateAssignStmtForValue(operandValue, operandPositions));
            operandStmts.forEach(stmt => stmts.push(stmt));
        }

        const operatorToken = prefixUnaryExpression.opcode;
        let exprPositions = [FullPosition.buildFromNodeCpp(prefixUnaryExpression, this.sourceFile)];
        if (operatorToken === '++' || operatorToken === '--') {
            const binaryOperator = operatorToken === '++' ? NormalBinaryOperator.Addition : NormalBinaryOperator.Subtraction;
            const binopExpr = new ArkNormalBinopExpr(operandValue, ValueUtil.getOrCreateNumberConst(1), binaryOperator);
            exprPositions.push(...operandPositions, FullPosition.DEFAULT);
            const assignStmt = new ArkAssignStmt(operandValue, binopExpr);
            assignStmt.setOperandOriginalPositions([...operandPositions, ...exprPositions]);
            stmts.push(assignStmt);
            return {
                value: operandValue,
                valueOriginalPositions: operandPositions,
                stmts: stmts,
            };
        } else if (operatorToken === '+') {
            return {
                value: operandValue,
                valueOriginalPositions: operandPositions,
                stmts: stmts,
            };
        } else {
            let unopExpr: Value;
            const operator = ArkIRTransformer.tokenToUnaryOperator(operatorToken);
            if (operator) {
                unopExpr = new ArkUnopExpr(operandValue, operator);
                exprPositions.push(...operandPositions);
            } else {
                unopExpr = ValueUtil.getUndefinedConst();
                exprPositions = [FullPosition.DEFAULT];
            }
            return {
                value: unopExpr,
                valueOriginalPositions: exprPositions,
                stmts: stmts,
            };
        }
    }

    private postfixUnaryExpressionToValueAndStmts(postfixUnaryExpression: any): ValueAndStmts {
        const stmts: Stmt[] = [];
        let { value: operandValue, valueOriginalPositions: operandPositions, stmts: exprStmts } = this.tsNodeToValueAndStmts(postfixUnaryExpression.inner[0]);
        exprStmts.forEach(stmt => stmts.push(stmt));
        if (IRUtils.moreThanOneAddress(operandValue)) {
            ({
                value: operandValue,
                valueOriginalPositions: operandPositions,
                stmts: exprStmts,
            } = this.arkIRTransformer.generateAssignStmtForValue(operandValue, operandPositions));
            exprStmts.forEach(stmt => stmts.push(stmt));
        }

        let value: Value;
        let exprPositions = [FullPosition.buildFromNodeCpp(postfixUnaryExpression, this.sourceFile)];
        const operatorToken = postfixUnaryExpression.opcode;
        if (operatorToken === '++' || operatorToken === '--') {
            const binaryOperator = operatorToken === '++' ? NormalBinaryOperator.Addition : NormalBinaryOperator.Subtraction;
            const binopExpr = new ArkNormalBinopExpr(operandValue, ValueUtil.getOrCreateNumberConst(1), binaryOperator);
            exprPositions.push(...operandPositions, FullPosition.DEFAULT);
            const assignStmt = new ArkAssignStmt(operandValue, binopExpr);
            assignStmt.setOperandOriginalPositions([...operandPositions, ...exprPositions]);
            stmts.push(assignStmt);
            value = operandValue;
        } else {
            value = ValueUtil.getUndefinedConst();
            exprPositions = [FullPosition.DEFAULT];
        }

        return {
            value: value,
            valueOriginalPositions: exprPositions,
            stmts: stmts,
        };
    }
    public variableDeclarationListToValueAndStmts(variableDeclarationList: any): ValueAndStmts {
        const stmts: Stmt[] = [];
        for (const declaration of variableDeclarationList.inner) {
            let isConst = declaration.type!.qualType.toString().startsWith('const ');
            const { stmts: declaredStmts } = this.variableDeclarationToValueAndStmts(declaration, isConst);
            declaredStmts.forEach(s => stmts.push(s));
        }
        return {
            value: ValueUtil.getUndefinedConst(),
            valueOriginalPositions: [FullPosition.DEFAULT],
            stmts: stmts,
        };
    }

    public variableDeclarationToValueAndStmts(variableDeclaration: any, isConst: boolean, needRightOp: boolean = true): ValueAndStmts {
        const leftOpNode = variableDeclaration;
        let rightOpNode = null;
        if (variableDeclaration.inner !== null) {
            rightOpNode = nodeInnerNode(variableDeclaration);
        }
        const declarationType = variableDeclaration.type ? this.resolveTypeNode(variableDeclaration.type.qualType) : UnknownType.getInstance();
        return this.assignmentToValueAndStmts(leftOpNode, rightOpNode, true, isConst, declarationType, needRightOp);
    }

    private assignmentToValueAndStmts(
        leftOpNode: any,
        rightOpNode: any | undefined,
        variableDefFlag: boolean,
        isConst: boolean,
        declarationType: Type,
        needRightOp: boolean = true
    ): ValueAndStmts {
        let leftValueAndStmts: ValueAndStmts;
        if (leftOpNode.kind.toString() === 'VarDecl') {
            leftValueAndStmts = this.identifierToValueAndStmts(leftOpNode, variableDefFlag);
        } else {
            leftValueAndStmts = this.tsNodeToValueAndStmts(leftOpNode);
        }
        const { value: leftValue, valueOriginalPositions: leftPositions, stmts: leftStmts } = leftValueAndStmts;

        let stmts: Stmt[] = [];
        if (needRightOp) {
            const {
                value: rightValue,
                valueOriginalPositions: rightPositions,
                stmts: rightStmts,
            } = this.assignmentRightOpToValueAndStmts(rightOpNode, leftValue);
            if (leftValue instanceof Local) {
                if (variableDefFlag) {
                    leftValue.setConstFlag(isConst);
                    leftValue.setType(declarationType);
                }
                if (
                    leftValue.getType() instanceof UnknownType &&
                    !(rightValue.getType() instanceof UnknownType) &&
                    !(rightValue.getType() instanceof UndefinedType)
                ) {
                    leftValue.setType(rightValue.getType());
                }
            }
            const assignStmt = new ArkAssignStmt(leftValue, rightValue);
            assignStmt.setOperandOriginalPositions([...leftPositions, ...rightPositions]);
            if (ts.isArrayBindingPattern(leftOpNode) || leftOpNode.kind === 'InitListExpr' || ts.isObjectBindingPattern(leftOpNode)) {
                rightStmts.forEach(stmt => stmts.push(stmt));
                stmts.push(assignStmt);
                leftStmts.forEach(stmt => stmts.push(stmt));
            } else {
                rightStmts.forEach(stmt => stmts.push(stmt));
                leftStmts.forEach(stmt => stmts.push(stmt));
                stmts.push(assignStmt);
            }
        } else {
            stmts = leftStmts;
        }
        return {
            value: leftValue,
            valueOriginalPositions: leftPositions,
            stmts: stmts,
        };
    }

    private assignmentRightOpToValueAndStmts(rightOpNode: ts.Node | undefined, leftValue: Value): ValueAndStmts {
        let rightValue: Value;
        let rightPositions: FullPosition[];
        let tempRightStmts: Stmt[] = [];
        const rightStmts: Stmt[] = [];
        if (rightOpNode) {
            ({ value: rightValue, valueOriginalPositions: rightPositions, stmts: tempRightStmts } = this.tsNodeToValueAndStmts(rightOpNode));
            tempRightStmts.forEach(stmt => rightStmts.push(stmt));
        } else {
            rightValue = ValueUtil.getUndefinedConst();
            rightPositions = [FullPosition.DEFAULT];
        }
        if (IRUtils.moreThanOneAddress(leftValue) && IRUtils.moreThanOneAddress(rightValue)) {
            ({
                value: rightValue,
                valueOriginalPositions: rightPositions,
                stmts: tempRightStmts,
            } = this.arkIRTransformer.generateAssignStmtForValue(rightValue, rightPositions));
            tempRightStmts.forEach(stmt => rightStmts.push(stmt));
        }
        return {
            value: rightValue,
            valueOriginalPositions: rightPositions,
            stmts: rightStmts,
        };
    }

    // In assignment patterns, the left operand will be an array literal expression
// In assignment patterns, the left operand will be an object literal expression
    private binaryExpressionToValueAndStmts(binaryExpression: any): ValueAndStmts {
        const operatorToken = binaryExpression.opcode;
        const binaryExpressionLeft = binaryExpression.inner[0];
        const binaryExpressionRight = binaryExpression.inner[1];
        if (operatorToken === '=') {
            return this.assignmentToValueAndStmts(binaryExpressionLeft, binaryExpressionRight, false, false,
                UnknownType.getInstance(), true);
        }
        const stmts: Stmt[] = [];
        const binaryExpressionPosition = FullPosition.buildFromNodeCpp(binaryExpression, this.sourceFile);
        const { value: opValue1, valueOriginalPositions: opPositions1, stmts: opStmts1 } = this.tsNodeToSingleAddressValueAndStmts(binaryExpressionLeft);
        opStmts1.forEach(stmt => stmts.push(stmt));
        const { value: opValue2, valueOriginalPositions: opPositions2, stmts: opStmts2 } = this.tsNodeToSingleAddressValueAndStmts(binaryExpressionRight);
        opStmts2.forEach(stmt => stmts.push(stmt));
        let exprValue: Value;
        let exprValuePositions = [binaryExpressionPosition];
        if (operatorToken.kind === ',') {
            exprValue = opValue2;
        } else {
            if (operatorToken) {
                if (this.isRelationalOperator(operatorToken)) {
                    exprValue = new ArkConditionExpr(opValue1, opValue2, operatorToken as RelationalBinaryOperator);
                } else {
                    exprValue = new ArkNormalBinopExpr(opValue1, opValue2, operatorToken as NormalBinaryOperator);
                }
                exprValuePositions.push(...opPositions1, ...opPositions2);
            } else {
                exprValue = ValueUtil.getUndefinedConst();
                exprValuePositions.push(binaryExpressionPosition);
            }
        }
        return {
            value: exprValue,
            valueOriginalPositions: exprValuePositions,
            stmts: stmts,
        };
    }

    private compoundAssignmentToValueAndStmts(binaryExpression: any): ValueAndStmts {
        const stmts: Stmt[] = [];
        let { value: leftValue, valueOriginalPositions: leftPositions, stmts: leftStmts } = this.tsNodeToValueAndStmts(binaryExpression.inner[0]);
        leftStmts.forEach(stmt => stmts.push(stmt));
        let { value: rightValue, valueOriginalPositions: rightPositions, stmts: rightStmts } = this.tsNodeToValueAndStmts(binaryExpression.inner[1]);
        rightStmts.forEach(stmt => stmts.push(stmt));
        if (IRUtils.moreThanOneAddress(leftValue) && IRUtils.moreThanOneAddress(rightValue)) {
            const {
                value: newRightValue,
                valueOriginalPositions: newRightPositions,
                stmts: rightStmts,
            } = this.arkIRTransformer.generateAssignStmtForValue(rightValue, rightPositions);
            rightValue = newRightValue;
            rightPositions = newRightPositions;
            rightStmts.forEach(stmt => stmts.push(stmt));
        }

        let leftOpValue: Value;
        let leftOpPositions: FullPosition[];
        const operator = this.compoundAssignmentTokenToBinaryOperator(binaryExpression.opcode);
        if (operator) {
            const exprValue = new ArkNormalBinopExpr(leftValue, rightValue, operator);
            const exprValuePosition = FullPosition.buildFromNodeCpp(binaryExpression, this.sourceFile);
            const assignStmt = new ArkAssignStmt(leftValue, exprValue);
            assignStmt.setOperandOriginalPositions([...leftPositions, exprValuePosition, ...leftPositions, ...rightPositions]);
            stmts.push(assignStmt);
            leftOpValue = leftValue;
            leftOpPositions = leftPositions;
        } else {
            leftOpValue = ValueUtil.getUndefinedConst();
            leftOpPositions = [leftPositions[0]];
        }
        return {
            value: leftOpValue,
            valueOriginalPositions: leftOpPositions,
            stmts: stmts,
        };
    }

    private compoundAssignmentTokenToBinaryOperator(token: string): NormalBinaryOperator | null {
        switch (token) {
            case CompoundBinaryOperator.AdditionEquals:
                return NormalBinaryOperator.Addition;
            case CompoundBinaryOperator.SubtractionEquals:
                return NormalBinaryOperator.Subtraction;
            case CompoundBinaryOperator.MultiplicationEquals:
                return NormalBinaryOperator.Multiplication;
            case CompoundBinaryOperator.DivisionEquals:
                return NormalBinaryOperator.Division;
            case CompoundBinaryOperator.RemainderEquals:
                return NormalBinaryOperator.Remainder;
            case CompoundBinaryOperator.LeftShiftEquals:
                return NormalBinaryOperator.LeftShift;
            case CompoundBinaryOperator.RightShiftEquals:
                return NormalBinaryOperator.RightShift;
            case CompoundBinaryOperator.BitwiseAndEquals:
                return NormalBinaryOperator.BitwiseAnd;
            case CompoundBinaryOperator.BitwiseOrEquals:
                return NormalBinaryOperator.BitwiseOr;
            case CompoundBinaryOperator.BitwiseXorEquals:
                return NormalBinaryOperator.BitwiseXor;
            default:
        }
        return null;
    }

    public conditionToValueAndStmts(condition: any): ValueAndStmts {
        const stmts: Stmt[] = [];
        let { value: conditionValue, valueOriginalPositions: conditionPositions, stmts: conditionStmts } = this.tsNodeToValueAndStmts(condition);
        conditionStmts.forEach(stmt => stmts.push(stmt));
        let conditionExpr: ArkConditionExpr;
        if (conditionValue instanceof AbstractBinopExpr && this.isRelationalOperator(conditionValue.getOperator())) {
            const operator = conditionValue.getOperator() as RelationalBinaryOperator;
            conditionExpr = new ArkConditionExpr(conditionValue.getOp1(), conditionValue.getOp2(), operator);
        } else {
            if (IRUtils.moreThanOneAddress(conditionValue)) {
                ({
                    value: conditionValue,
                    valueOriginalPositions: conditionPositions,
                    stmts: conditionStmts,
                } = this.arkIRTransformer.generateAssignStmtForValue(conditionValue, conditionPositions));
                conditionStmts.forEach(stmt => stmts.push(stmt));
            }
            conditionExpr = new ArkConditionExpr(conditionValue, ValueUtil.getOrCreateNumberConst(0), RelationalBinaryOperator.InEquality);
            conditionPositions = [conditionPositions[0], ...conditionPositions, FullPosition.DEFAULT];
        }
        return {
            value: conditionExpr,
            valueOriginalPositions: conditionPositions,
            stmts: stmts,
        };
    }

    private literalNodeToValueAndStmts(literalNode: any): ValueAndStmts | null {
        const syntaxKind = literalNode.kind;
        let constant: Constant | null = null;
        switch (syntaxKind) {
            case 'IntegerLiteral':
                constant = ValueUtil.getOrCreateNumberConst(parseFloat(literalNode.value));
                break;
            case 'StringLiteral':
                constant = ValueUtil.createStringConst(literalNode.value);
                break;
            case 'CXXBoolLiteralExpr':
                constant = ValueUtil.getBooleanConstant(literalNode.value);
                break;
            case 'CharacterLiteral':
                constant = ValueUtil.createStringConst(literalNode.code);
                break;
            case 'FloatingLiteral':
                constant = ValueUtil.getOrCreateNumberConst(parseFloat(literalNode.code))
                break;
            case 'CXXNullPtrLiteralExpr':
                constant = ValueUtil.getNullPtrConstant();
                break;
            default:
                logger.warn(`ast node's syntaxKind is ${syntaxKind}, not literalNode`);
        }

        if (constant === null) {
            return null;
        }
        return {
            value: constant,
            valueOriginalPositions: [FullPosition.buildFromNodeCpp(literalNode, this.sourceFile)],
            stmts: [],
        };
    }

    private getOrCreateLocal(localName: string, localType: Type = UnknownType.getInstance()): Local {
        let local = this.locals.get(localName);
        if (local !== undefined) {
            return local;
        }
        local = this.addNewLocal(localName, localType);
        this.addNewGlobal(localName);
        return local;
    }

    public generateTempLocal(localType: Type = UnknownType.getInstance()): Local {
        const tempLocalName = TEMP_LOCAL_PREFIX + this.tempLocalNo;
        this.tempLocalNo++;
        const tempLocal: Local = new Local(tempLocalName, localType);
        this.locals.set(tempLocalName, tempLocal);
        return tempLocal;
    }

    private isRelationalOperator(operator: BinaryOperator): boolean {
        return (
            operator === RelationalBinaryOperator.LessThan ||
            operator === RelationalBinaryOperator.LessThanOrEqual ||
            operator === RelationalBinaryOperator.GreaterThan ||
            operator === RelationalBinaryOperator.GreaterThanOrEqual ||
            operator === RelationalBinaryOperator.Equality ||
            operator === RelationalBinaryOperator.InEquality ||
            operator === RelationalBinaryOperator.StrictEquality ||
            operator === RelationalBinaryOperator.StrictInequality
        );
    }
    public resolveTypeNode(qualType: string): Type {
        if (qualType.includes('[') && qualType.includes(']')) {
            const matches = qualType.match(/\[/g);
            const count = matches ? matches.length : 0;
            let baseType = cppNode2Type(qualType.slice(0, qualType.indexOf('[')), null, this.declaringMethod);
            if (baseType instanceof UnclearReferenceType) {
                return new ArrayType(new UnclearReferenceType(qualType.slice(0, qualType.indexOf('['))), count);
            }
            return new ArrayType(baseType, count);
        } else if (qualType.includes('vector')) {
            let dimension = 0;
            let dataType = this.resolveVectorType(qualType, dimension);
            return new ArrayType(buildTypeFromPreStr(dataType), dimension);
        }
        let nodeType = cppNode2Type(qualType, null, this.declaringMethod);
        return (nodeType instanceof UnclearReferenceType ? UnknownType.getInstance() : nodeType);
    }

    public resolveVectorType(kind: string, dimension: number) {
        if (!kind.includes('vector')) {
            return kind;
        }
        let lowDimension = kind.substring(kind.indexOf('vector<') + 7, kind.lastIndexOf('>'));
        dimension++;
        lowDimension = this.resolveVectorType(lowDimension, dimension);
        return lowDimension;
    }
    public static resolveLiteralTypeNode(literalTypeNode: ts.LiteralTypeNode, sourceFile: ts.SourceFile): Type {
        const literal = literalTypeNode.literal;
        const kind = literal.kind;
        switch (kind) {
            case ts.SyntaxKind.NullKeyword:
                return NullType.getInstance();
            case ts.SyntaxKind.TrueKeyword:
                return LiteralType.TRUE;
            case ts.SyntaxKind.FalseKeyword:
                return LiteralType.FALSE;
            case ts.SyntaxKind.NumericLiteral:
                return new LiteralType(parseFloat((literal as ts.NumericLiteral).text));
            case ts.SyntaxKind.PrefixUnaryExpression:
                return new LiteralType(parseFloat(literal.getText(sourceFile)));
            default:
        }
        return new LiteralType(literal.getText(sourceFile));
    }
    public static isCompoundAssignmentOperator(operator: any): boolean {
        return Object.values(CompoundBinaryOperator).includes(operator);
    }

    public static isRelationalBinaryOperator(operator: any): boolean {
        return Object.values(RelationalBinaryOperator).includes(operator);
    }
}
