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
import { ArkAssignStmt, ArkIfStmt, ArkInvokeStmt, Stmt } from '../../core/base/Stmt';
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
    NormalBinaryOperator,
    RelationalBinaryOperator,
    CompoundBinaryOperator,
    AbstractInvokeExpr,
} from '../../core/base/Expr';
import {
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
    ReferenceType,
    AliasType,
    Thread,
    functionPointer,
} from '../../core/base/Type';
import { ArkSignatureBuilder } from '../../core/model/builder/ArkSignatureBuilder';
import { ClassSignature, FieldSignature, MethodSignature, FileSignature } from '../../core/model/ArkSignature';
import { Value } from '../../core/base/Value';
import { COMPONENT_CREATE_FUNCTION, COMPONENT_CUSTOMVIEW, COMPONENT_FOR_EACH, COMPONENT_LAZY_FOR_EACH } from '../../core/common/EtsConst';
import { CppValueUtil } from './ValueUtil';
import { IRUtils } from '../../core/common/IRUtils';
import { AbstractFieldRef, ArkArrayRef, ArkInstanceFieldRef, CXXArkInstanceFieldRef } from '../../core/base/Ref';
import { ArkMethod } from '../../core/model/ArkMethod';
import { buildArkMethodFromArkClass, buildDefaultConstructor } from '../model/builder/ArkMethodBuilder';
import { Builtin } from '../../core/common/Builtin';
import { Constant } from '../../core/base/Constant';
import { TEMP_LOCAL_PREFIX } from '../../core/common/Const';
import { ArkIRTransformerCpp, DummyStmt, ValueAndStmts } from './ArkIRTransformer';
import { buildTypeFromPreStr, convertDataType, cppNode2Type, isCXXSTLContainer } from '../model/builder/builderUtils';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { ArkValueTransformer } from '../../core/common/ArkValueTransformer';
import { ModelUtils } from '../../core/common/ModelUtils';
import { CONSTRUCTOR_NAME, THIS_NAME } from '../../core/common/TSConst';
import { ClassCategory } from '../../core/model/ArkClass';
import { TypeInference } from './TypeInference';
import { setTs2CppFuncMapOfClass } from './ModelUtils';
import {CppAstNode} from '../../ast/ArkCxxAstNode';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkValueTransformer');

function nodeInnerNode(node: CppAstNode): CppAstNode {
    if (Array.isArray(node?.inner) && node.inner.length > 0) {
        const last = node.inner[node.inner.length - 1];

        // 优先返回 InitListExpr
        if (last?.kind === 'InitListExpr') {
            return last;
        }
        // 只包含一个 TypeRef 节点的数组不返回
        if (!(node.inner.length === 1 && node.inner[0]?.kind === 'TypeRef')) {
            return last;
        }
    }
    logger.info(`unsupported node! kind: ${node?.kind ?? ''}, node:`, node);
    return { kind: 'unsupported kind' } as CppAstNode;
}

const COMPOUND_BIN_OPS = new Set<string>(Object.values(CompoundBinaryOperator));

export class ArkValueTransformerCpp extends ArkValueTransformer {
    private arkIRTransformerCpp: ArkIRTransformerCpp;

    constructor(arkIRTransformer: ArkIRTransformerCpp, sourceFile: ts.SourceFile, declaringMethod: ArkMethod) {
        super(arkIRTransformer, sourceFile, declaringMethod);
        this.arkIRTransformerCpp = arkIRTransformer;
    }

    private thisExpressionToValueAndStmtsCpp(thisExpression: CppAstNode): ValueAndStmts {
        return {
            value: this.getThisLocal(),
            valueOriginalPositions: [FullPosition.buildFromNodeCpp(thisExpression, this.sourceFile)],
            stmts: [],
        };
    }

    // 判断当前节点是否与CPP的lambda函数相关
    private isNodeRelatedToCXXLambdaFunc(node: CppAstNode): boolean {
        return !!node.type?.qualType?.startsWith('(lambda at');
    }

    private isNodeRelatedToImplicitNode(node: CppAstNode): boolean {
        if (node.inner && node.inner instanceof Array) {
            return (
                node.inner.length !== 0 && node.inner[0].kind === 'ImplicitCastExpr' && (node.name === '_tree_const_iterator' || node.name === 'basic_string')
            );
        }
        return false;
    }

    // 判断当前节点的子节点是否是优化后的临时变量
    private isNodeRelatedToMaterialize(node: CppAstNode): boolean {
        return node.inner.length !== 0 && node.inner[0].kind === 'MaterializeTemporaryExpr';
    }

// 判断当前节点的子节点是否是成员函数调用
    private isNodeRelatedToCXXMember(node: CppAstNode): boolean {
        return (
            (node.inner.length !== 0 && node.inner[0].kind === 'CXXMemberCallExpr') ||
            (node.inner[0].kind === 'ImplicitCastExpr' && node.inner[0].inner[0] && node.inner[0].inner[0].kind === 'CXXMemberCallExpr')
        );
    }


    // std::pair类型的构造
    private isPairConstructExpr(node: CppAstNode): boolean {
        return node.type.qualType.includes('std::pair');
    }

    // 多层std::pair构造
    private isNodeRelatedToTemporary(node: CppAstNode): boolean {
        return node.inner.length !== 0 && node.inner[0].kind === 'CXXBindTemporaryExpr' && node.code === node.inner[0].code;
    }

    // 不是new语句的表达式（排除构造函数作为参数）
    private isNotNewExpression(newExpression: CppAstNode): boolean {
        return (
            newExpression.inner.length > 0 &&
            (newExpression.inner[0].kind === 'IntegerLiteral' ||
                newExpression.inner[0].kind === 'InitListExpr' ||
                (newExpression.inner[0].kind === 'ImplicitCastExpr' && !newExpression.inner[0].code.includes('(')) ||
                newExpression.inner[0].kind === 'CompoundLiteralExpr')
        );
    }


    private isNodeRelatedToCXXFuncCast(node: CppAstNode): boolean {
        return node.inner.length !== 0 && node.inner[0].kind === 'CXXFunctionalCastExpr';
    }


    public tsNodeToValueAndStmts(node: CppAstNode | any ): ValueAndStmts {
        if (node === undefined) {
            logger.error(
                'ArkValueTransformer-TSNodeToValueAndStmts: node is undefined. Method signature is : ',
                this.declaringMethod?.getSignature()?.toString()
            );
            return {
                value: new Local('undefined'),
                valueOriginalPositions: [new FullPosition(0, 0, 0, 0)],
                stmts: [],
            };
        }
        if (node.kind === 'CXXConstructExpr') {
            let parent = node.getParent();
            if (parent && parent.kind === 'CXXConstructorDecl') {
                return this.superExpressionToValueAndStmtsCpp(node);
            }
            if (
                !this.isPairConstructExpr(node) &&
                (this.isNodeRelatedToCXXLambdaFunc(node) || this.isNodeRelatedToMaterialize(node) || this.isNodeRelatedToImplicitNode(node)) &&
                node.inner?.length > 0
            ) {
                return this.tsNodeToValueAndStmts(node.inner[0]);
            }
            return this.newExpressionToValueAndStmtsCpp(node);
        } else if (node.kind === 'CallExpr' && node.inner?.length > 0 && node.getParent().type.qualType === 'std::thread') {
            return this.newExpressionToValueAndStmtsCpp(node);
        } else if (node.kind === 'CallExpr' && node.inner?.length > 0 && node.inner[0].kind === 'CXXPseudoDestructorExpression') {
            return this.callExpressionToValueAndStmtsCpp(node.inner[0]);
        } else if (node.kind === 'CallExpr' && node.name === 'basic_string' && node.inner?.length > 0) {
            return this.tsNodeToValueAndStmts(node.inner[0]);
        } else if (node.kind === 'CallExpr' || node.kind === 'AtomicCallExpr' || node.kind === 'CXXFoldExpr') {
            return this.callExpressionToValueAndStmtsCpp(node);
        } else if (node.kind === 'CXXNoexceptExpr') {
            return this.cxxNoexceptExprToValueAndStmts(node);
        } else if (node.kind === 'CXXOperatorCallExpr') {
            return this.cxxOperatorExpressionToValueAndStmts(node);
        } else if (node.kind === 'RecoveryExpr') {
            return this.RecoverExpressionToValueAndStmts(node);
        } else if (
            node.kind === 'ConstantExpr' ||
            node.kind === 'ExprWithCleanups' ||
            node.kind === 'CXXStdInitializerListExpr' ||
            node.kind === 'ParenExpr' ||
            node.kind === 'CXXBindTemporaryExpr' ||
            node.kind === 'VarDecl' ||
            node.kind === 'UnexposedExpr'
        ) {
            if (node.inner?.length > 0) {
                return this.tsNodeToValueAndStmts(node.inner[0]);
            }
        } else if (node.kind === 'ImplicitCastExpr') {
            if (node.inner?.length === 1) {
                return this.tsNodeToValueAndStmts(node.inner[0]);
            } else if (node.inner?.length === 2) {
                if (node.code.includes('=')) {
                    let operatorExpression = Object.assign({}, node);
                    operatorExpression.opcode = '=';
                    return this.binaryExpressionToValueAndStmtsCpp(operatorExpression);
                }
                return this.tsNodeToValueAndStmts(node.inner[1]);
            }
            node.kind = 'DeclRefExpr';
            node.name = node.code;
            return this.tsNodeToValueAndStmts(node);
        } else if ((node.kind === 'DeclRefExpr' || node.kind === 'TypeRef') && node.inner?.length > 0 && !node.type) {
            return this.tsNodeToValueAndStmts(node.inner[0]);
        } else if (node.kind === 'DeclRefExpr' || node.kind === 'TypeRef') {
            // 处理类的静态成员调用，如A::a
            if (node.code.includes('::') && node.inner?.[0].kind === 'TypeRef') {
                return this.staticMemberExprToValueAndStmtsCpp(node);
            }
            return this.identifierToValueAndStmtsCpp(node);
        } else if (node.kind === 'UnresolvedLookupExpr') {
            return this.identifierToValueAndStmtsCpp(node);
        } else if (node.kind === 'CXXMemberCallExpr') {
            return this.cxxMemberCallExpressionToValueAndStmtsCpp(node);
        } else if (node.kind === 'MemberExpr' || node.kind === 'MemberRef') {
            return this.memberExpressionToValueAndStmts(node);
        } else if (node.kind === 'CXXNewExpr') {
            return this.newExpressionToValueAndStmtsCpp(node);
        } else if (node.kind === 'BinaryOperator') {
            return this.binaryExpressionToValueAndStmtsCpp(node);
        } else if (node.kind === 'MaterializeTemporaryExpr' && node.inner?.length > 0) {
            if (
                this.isNotNewExpression(node) ||
                this.isNodeRelatedToCXXLambdaFunc(node) ||
                this.isNodeRelatedToCXXMember(node) ||
                this.isNodeRelatedToTemporary(node) ||
                this.isNodeRelatedToCXXFuncCast(node)
            ) {
                return this.tsNodeToValueAndStmts(node.inner[0]);
            }
            return this.newExpressionToValueAndStmtsCpp(node);
        } else if (node.kind === 'CXXThisExpr') {
            return this.thisExpressionToValueAndStmtsCpp(node);
        } else if (node.kind === 'IntegerLiteral') {
            return this.literalNodeToValueAndStmtsCpp(node) as ValueAndStmts;
        } else if (node.kind === 'InitListExpr') {
            if ((node.type?.qualType?.includes('[') && node.type.qualType.includes(']')) || node.type.qualType === 'void') {
                return this.arrayLiteralExpressionToValueAndStmtsCpp(node);
            }
            let pNode = node.getParent(true);
            if (
                pNode?.inner?.length > 0 &&
                (pNode.inner[0].kind === 'TypeRef' || !node.type.qualType.includes('[') || this.resolveTypeNodeCpp(node) instanceof ClassType)
            ) {
                return this.newExpressionToValueAndStmtsCpp(node);
            }
            return this.arrayLiteralExpressionToValueAndStmtsCpp(node);
        } else if (node.kind === 'DeclStmt') {
            return this.declStmtToValueAndStmts(node);
        } else if (node.kind === 'UnaryOperator') {
            if (node.isPostfix) {
                return this.postfixUnaryExpressionToValueAndStmtsCpp(node);
            } else {
                return this.prefixUnaryExpressionToValueAndStmtsCpp(node);
            }
        } else if (node.kind === 'ArraySubscriptExpr') {
            return this.elementAccessExpressionToValueAndStmtsCpp(node);
        } else if (
            ['StringLiteral', 'CXXBoolLiteralExpr', 'CharacterLiteral', 'FloatingLiteral', 'CXXNullPtrLiteralExpr', 'AddrLabelExpr'].includes(node.kind)
        ) {
            return this.literalNodeToValueAndStmtsCpp(node) as ValueAndStmts;
        } else if (node.kind === 'CompoundAssignOperator') {
            return this.compoundAssignmentToValueAndStmtsCpp(node);
        } else if (node.kind === 'CompoundLiteralExpr') {
            return this.newExpressionToValueAndStmtsCpp(node);
        } else if (node.kind === 'ConditionalOperator' || node.kind === 'BinaryConditionalOperator') {
            return this.conditionalExpressionToValueAndStmtsCpp(node);
        } else if (node.kind === 'LambdaExpr') {
            return this.callableNodeToValueAndStmtsCpp(node);
        } else if (
            ['CXXStaticCastExpr', 'CStyleCastExpr', 'CXXConstCastExpr', 'CXXDynamicCastExpr', 'CXXReinterpretCastExpr', 'CXXFunctionalCastExpr'].includes(
                node.kind
            )
        ) {
            return this.castExpressionToValueAndStmts(node);
        } else if (node.kind === 'CXXDeleteExpr') {
            return this.deleteExpressionToValueAndStmtsCpp(node);
        } else if (node.kind === 'CXXScalarValueInitExpr') {
            return this.cxxScalarValueInitToValueAndStmts(node) as ValueAndStmts;
        } else if (node.kind === 'CXXTypeidExpr') {
            return this.cxxTypeidExprToValueAndStmts(node);
        } else if (node.kind === 'ArrayTypeTraitExpr') {
            return this.arrayTypeTraitExprToValueAndStmts(node);
        } else if (node.kind === 'CXXCtorInitializer') {
            return this.cxxCtorInitializerToValueAndStmts(node);
        } else if (node.kind === 'UserDefinedLiteral') {
            return this.userDefinedLiteralToValueAndStmts(node);
        }

        logger.warn(`ArkValueTransformer-tsNodeToValueAndStmts: node '${node.kind}' is not specially processed.`);
        return this.unprocessedNodeToValueAndStmts(node);
    }

    private unprocessedNodeToValueAndStmts(node: CppAstNode): ValueAndStmts {
        return {
            value: new Local(node.code),
            valueOriginalPositions: [FullPosition.buildFromNodeCpp(node, this.sourceFile)],
            stmts: [],
        };
    }

    private staticMemberExprToValueAndStmtsCpp(declRefExpr: CppAstNode): ValueAndStmts {
        declRefExpr.kind = 'MemberExpr'; // 类型替换成“成员调用”
        return this.memberExpressionToValueAndStmts(declRefExpr);
    }

    private userDefinedLiteralToValueAndStmts(userDefinedLiteral: CppAstNode): ValueAndStmts {
        // 用户定义字面量的语法是：原始值+后缀（如 123_km、"hello"_s、'a'_s）
        if (userDefinedLiteral.inner?.length < 2) {
            return this.unprocessedNodeToValueAndStmts(userDefinedLiteral);
        }
        const stmts: Stmt[] = [];
        const literalStr = userDefinedLiteral.name.replace('operator""', '');
        const argNode = userDefinedLiteral.inner[1];
        argNode.code = argNode.code.replace(literalStr, ''); // 获取原始值（比如123，'a'）
        return this.buildValueAndStmtsForMemberCall(stmts, userDefinedLiteral.inner[0], [argNode], userDefinedLiteral, undefined);
    }

    /* 1. c++使用初始化列表对类成员变量的初始化：Base(char pname) : name(pname) {...}，最终效果类似this->name = pname，此处也处理成赋值的形式
     *  2. using parent::parent，子类的构造函数调用从父类继承的构造函数; */
    private cxxCtorInitializerToValueAndStmts(cxxCtorInitializer: CppAstNode): ValueAndStmts {
        if (!cxxCtorInitializer.inner || cxxCtorInitializer.inner.length === 0) {
            return this.unprocessedNodeToValueAndStmts(cxxCtorInitializer);
        }
        if (cxxCtorInitializer.inner[0].kind === 'CXXInheritedCtorInitExpr') {
            // 处理using parent::parent的情况
            return this.cxxInheritedCtorInitExprToValueAndStmts(cxxCtorInitializer.inner[0]);
        }
        const assignRight = cxxCtorInitializer.inner[0];
        const CtorInit2ThisMemberExpr = {
            kind: 'MemberExpr',
            name: cxxCtorInitializer.anyInit?.name ?? '',
            inner: [
                {
                    kind: 'CXXThisExpr',
                },
            ],
            type: cxxCtorInitializer.anyInit?.type ?? '',
        };
        return this.assignmentToValueAndStmtsCpp(CtorInit2ThisMemberExpr, assignRight, false, false, UnknownType.getInstance(), true);
    }

    // using parent::parent==》子类的构造函数调用从父类继承的构造函数==》等同直接调用父类构造函数
    private cxxInheritedCtorInitExprToValueAndStmts(cxxInheritedCtorInitExpr: CppAstNode): ValueAndStmts {
        cxxInheritedCtorInitExpr.code = `using ${cxxInheritedCtorInitExpr.code}::${cxxInheritedCtorInitExpr.code}`;
        const cls = this.declaringMethod.getDeclaringArkClass();
        const clsInitMtd = cls.getInstanceInitMethod();
        if (!clsInitMtd) {
            return this.unprocessedNodeToValueAndStmts(cxxInheritedCtorInitExpr);
        }
        const superClass = cls.getHeritageClass(cxxInheritedCtorInitExpr.type.qualType);
        if (!superClass) {
            return this.unprocessedNodeToValueAndStmts(cxxInheritedCtorInitExpr);
        }
        buildDefaultConstructor(superClass);
        const superConstructor = superClass.getMethodWithName(CONSTRUCTOR_NAME);
        if (!superConstructor) {
            return this.unprocessedNodeToValueAndStmts(cxxInheritedCtorInitExpr);
        }
        let base = clsInitMtd.getBody()?.getLocals().get(THIS_NAME);
        if (base === undefined) {
            return this.unprocessedNodeToValueAndStmts(cxxInheritedCtorInitExpr);
        }
        const params = this.declaringMethod.getParameters();
        const argValues: Value[] = [];
        params.forEach(param => {
            argValues.push(this.getOrCreateLocal(param.getName()));
        });
        const newSuperInvokeExpr = new ArkInstanceInvokeExpr(base, superConstructor.getSignature(), argValues);
        return {
            value: newSuperInvokeExpr,
            valueOriginalPositions: [FullPosition.buildFromNodeCpp(cxxInheritedCtorInitExpr, this.sourceFile)],
            stmts: [],
        };
    }

    // C++中子类调用父类构造函数进行初始化，类似ts的super(xx)。比如Left(const char& name, int power) : Base(name) { ... }
    public superExpressionToValueAndStmtsCpp(cxxConstructExpr: CppAstNode): ValueAndStmts {
        const cls = this.declaringMethod.getDeclaringArkClass();
        if (!cls) {
            return this.newExpressionToValueAndStmtsCpp(cxxConstructExpr);
        }
        const clsInitMtd = cls.getInstanceInitMethod();
        if (!clsInitMtd) {
            return this.newExpressionToValueAndStmtsCpp(cxxConstructExpr);
        }
        const stmts: Stmt[] = [];
        const { args: argValues } = this.parseArgumentsCpp(stmts, cxxConstructExpr.inner);
        const superClass = cls.getHeritageClass(cxxConstructExpr.name);
        if (!superClass) {
            return this.newExpressionToValueAndStmtsCpp(cxxConstructExpr);
        }
        buildDefaultConstructor(superClass);
        const superConstructor = superClass.getMethodWithName(CONSTRUCTOR_NAME);
        if (superConstructor !== null) {
            let base = clsInitMtd.getBody()?.getLocals().get(THIS_NAME);
            if (base === undefined) {
                return this.newExpressionToValueAndStmtsCpp(cxxConstructExpr);
            }
            const newSuperInvokeExpr = new ArkInstanceInvokeExpr(base, superConstructor.getSignature(), argValues);
            return {
                value: newSuperInvokeExpr,
                valueOriginalPositions: [FullPosition.buildFromNodeCpp(cxxConstructExpr, this.sourceFile)],
                stmts: [],
            };
        }
        return this.newExpressionToValueAndStmtsCpp(cxxConstructExpr);
    }

    // ArrayTypeTraitExpr按照函数调用处理
    private arrayTypeTraitExprToValueAndStmts(ArrayTypeTraitExpr: CppAstNode): ValueAndStmts {
        const stmts: Stmt[] = [];
        let innerNode = ArrayTypeTraitExpr;
        while (innerNode.inner instanceof Array && innerNode.inner.length !== 0) {
            innerNode = innerNode.inner[0];
            if (innerNode.kind !== 'ArrayTypeTraitExpr') {
                break;
            }
        }
        const callArgs = [
            {
                kind: 'StringLiteral',
                value: innerNode.type.qualType.toString(),
            },
        ];
        if (ArrayTypeTraitExpr.traitFunc === '__array_extent') {
            const traitArgs = ArrayTypeTraitExpr.traitArgs?.split(',') ?? [];
            const numArg = traitArgs[traitArgs.length - 1].trim();
            callArgs.push({
                kind: 'IntegerLiteral',
                value: numArg,
            });
        }
        const callNode = JSON.parse(JSON.stringify(ArrayTypeTraitExpr));
        callNode.kind = 'DeclRefExpr';
        callNode.name = ArrayTypeTraitExpr.traitFunc;
        const args = this.parseArgumentsCppOfCallExpressionCpp(stmts, callArgs);
        return this.generateInvokeValueAndStmtsCpp(callNode, args, stmts, ArrayTypeTraitExpr);
    }

    // CXXTypeidExpr按照函数调用处理
    private cxxTypeidExprToValueAndStmts(CXXTypeidExpr: CppAstNode): ValueAndStmts {
        const stmts: Stmt[] = [];
        let typeArgs = CXXTypeidExpr.typeArg?.toString() ?? '';
        let typeidCallArgs = CXXTypeidExpr.inner;
        // [1.typeid的inner.length为0，则传入的是类型名； 2.std::Type引用命名空间中的类型] ==> 参数函数调用去构造类型对应字符串入参
        if (CXXTypeidExpr.inner.length === 0 || (CXXTypeidExpr.inner.length === 2 && CXXTypeidExpr.inner[1].kind === 'TypeRef')) {
            typeidCallArgs = [
                {
                    kind: 'StringLiteral',
                    name: '',
                    code: '',
                    value: typeArgs,
                    type: { qualType: '' },
                    inner: [],
                },
            ];
        }
        // 构造节点作为函数名节点
        let typeidCallNode = JSON.parse(JSON.stringify(CXXTypeidExpr));
        typeidCallNode.kind = 'DeclRefExpr';
        typeidCallNode.name = 'typeid';
        const argus = this.parseArgumentsCppOfCallExpressionCpp(stmts, typeidCallArgs);
        return this.generateInvokeValueAndStmtsCpp(typeidCallNode, argus, stmts, CXXTypeidExpr);
    }

    private cxxNoexceptExprToValueAndStmts(CXXNoexceptExpr: CppAstNode): ValueAndStmts {
        const stmts: Stmt[] = [];
        let cxxNoexceptCallNode = JSON.parse(JSON.stringify(CXXNoexceptExpr));
        cxxNoexceptCallNode.kind = 'DeclRefExpr';
        cxxNoexceptCallNode.name = 'CXXNoexceptExpr';
        const argus = this.parseArgumentsCppOfCallExpressionCpp(stmts, CXXNoexceptExpr.inner);
        return this.generateInvokeValueAndStmtsCpp(cxxNoexceptCallNode, argus, stmts, CXXNoexceptExpr);
    }

    private cxxScalarValueInitToValueAndStmts(CXXScalarValueInitExpr: CppAstNode): ValueAndStmts | null {
        const initType = CXXScalarValueInitExpr.type.qualType;
        let constant: Constant | null = null;
        switch (initType) {
            case 'int':
                constant = CppValueUtil.getOrCreateNumberConst(parseFloat('0'));
                break;
            case 'float':
            case 'double':
                constant = CppValueUtil.getOrCreateNumberConst(parseFloat('0.0'));
                break;
            case 'char':
                constant = CppValueUtil.createStringConst('');
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
            stmts: [],
        };
    }

    private deleteExpressionToValueAndStmtsCpp(deleteExpression: CppAstNode): ValueAndStmts {
        const { value: exprValue, valueOriginalPositions: exprPositions, stmts: stmts } = this.tsNodeToValueAndStmts(deleteExpression.inner[0]);
        const deleteExpr = new ArkDeleteExpr(exprValue);
        const deleteExprPosition = [FullPosition.buildFromNodeCpp(deleteExpression, this.sourceFile), ...exprPositions];
        return { value: deleteExpr, valueOriginalPositions: deleteExprPosition, stmts: stmts };
    }

    private castExpressionToValueAndStmts(castExpression: CppAstNode): ValueAndStmts {
        const stmts: Stmt[] = [];
        let {
            value: exprValue,
            valueOriginalPositions: exprPositions,
            stmts: exprStmts,
        } = this.tsNodeToValueAndStmts(castExpression.inner[castExpression.inner.length - 1]);
        exprStmts.forEach((stmt: Stmt) => stmts.push(stmt));
        if (IRUtils.moreThanOneAddress(exprValue)) {
            ({
                value: exprValue,
                valueOriginalPositions: exprPositions,
                stmts: exprStmts,
            } = this.arkIRTransformerCpp.generateAssignStmtForValue(exprValue, exprPositions));
            exprStmts.forEach((stmt: Stmt) => stmts.push(stmt));
        }
        const castExpr = new ArkCastExpr(exprValue, this.resolveTypeNodeCpp(castExpression));
        const castExprPosition = [FullPosition.buildFromNodeCpp(castExpression, this.sourceFile), ...exprPositions];
        return { value: castExpr, valueOriginalPositions: castExprPosition, stmts: stmts };
    }

    private conditionalExpressionToValueAndStmtsCpp(conditionalExpression: CppAstNode): ValueAndStmts {
        let InnerIdx = 0;
        const stmts: Stmt[] = [];
        const currConditionalOperatorIndex = this.conditionalOperatorNo++;
        const {value: conditionValue, valueOriginalPositions: conditionPositions, stmts: conditionStmts, } =
            this.conditionToValueAndStmtsCpp(conditionalExpression.inner[InnerIdx]);
        conditionStmts.forEach(stmt => stmts.push(stmt));
        const ifStmt = new ArkIfStmt(conditionValue as ArkConditionExpr);
        ifStmt.setOperandOriginalPositions(conditionPositions);
        stmts.push(ifStmt);
        stmts.push(new DummyStmt(ArkIRTransformerCpp.DUMMY_CONDITIONAL_OPERATOR_IF_TRUE_STMT + currConditionalOperatorIndex));
        if (conditionalExpression.inner.length === 3) {
            InnerIdx = 1;
        } else if (conditionalExpression.inner.length === 4) {
            InnerIdx = 0;
        }
        const {value: whenTrueValue, valueOriginalPositions: whenTruePositions, stmts: whenTrueStmts, } =
            this.tsNodeToValueAndStmts(conditionalExpression.inner[InnerIdx]);
        whenTrueStmts.forEach(stmt => stmts.push(stmt));
        const resultLocal = this.generateTempLocal();
        const assignStmtWhenTrue = new ArkAssignStmt(resultLocal, whenTrueValue);
        const resultLocalPosition: FullPosition[] = [whenTruePositions[0]];
        assignStmtWhenTrue.setOperandOriginalPositions([...resultLocalPosition, ...whenTruePositions]);
        stmts.push(assignStmtWhenTrue);
        stmts.push(new DummyStmt(ArkIRTransformerCpp.DUMMY_CONDITIONAL_OPERATOR_IF_FALSE_STMT + currConditionalOperatorIndex));
        if (conditionalExpression.inner.length === 3) {
            InnerIdx = 2;
        } else if (conditionalExpression.inner.length === 4) {
            InnerIdx = 3;
        }
        const {value: whenFalseValue, valueOriginalPositions: whenFalsePositions, stmts: whenFalseStmts, } =
            this.tsNodeToValueAndStmts(conditionalExpression.inner[InnerIdx]);
        whenFalseStmts.forEach(stmt => stmts.push(stmt));
        const assignStmt = new ArkAssignStmt(resultLocal, whenFalseValue);
        assignStmt.setOperandOriginalPositions([...resultLocalPosition, ...whenFalsePositions]);
        stmts.push(assignStmt);
        stmts.push(new DummyStmt(ArkIRTransformerCpp.DUMMY_CONDITIONAL_OPERATOR_END_STMT + currConditionalOperatorIndex));
        return {
            value: resultLocal,
            valueOriginalPositions: resultLocalPosition,
            stmts: stmts,
        };
    }

    public getArgumentNodeForRecover(innerAsNodes: CppAstNode[]): {}[]  {
        let callNode = {};
        let argumentNodes = [];
        for (let i = 0; i < innerAsNodes.length; i++) {
            if (i === 0) {
                callNode = innerAsNodes[i];
            } else {
                argumentNodes.push(innerAsNodes[i]);
            }
        }
        return [callNode, argumentNodes];
    }

    public getArgumentNode(innerAstNodes: CppAstNode[] | CppAstNode): [call: CppAstNode | undefined, args: CppAstNode[]] {
        // 此时innerAstNode为单独的点
        if (!Array.isArray(innerAstNodes)) {
            const firstInner = innerAstNodes.inner?.[0];
            if (!firstInner) {
                return [undefined, []];
            }
            const call = this.getDeclRef(firstInner) as CppAstNode;
            const args = (innerAstNodes.inner?.slice(1) ?? [])
                .map(n => this.getDeclRef(n) as CppAstNode);
            return [call, args];
        }
        // 可调用的若干 kind
        const CALLABLE_KINDS = new Set([
            'DeclRefExpr',
            'MemberExpr',
            'OverloadedDeclRef',
            'ArraySubscriptExpr',
        ]);
        function unwrapImplicit(n?: CppAstNode): CppAstNode | undefined {
            while (n && n.kind === 'ImplicitCastExpr') {
                n = n.inner?.[0];
            }
            return n;
        }
        let callNode: CppAstNode | undefined;
        const argumentNodes: CppAstNode[] = [];
        for (let i = 0; i < innerAstNodes.length; i++) {
            const node = innerAstNodes[i];
            if (i === 0 && node.inner?.length) {
                const first = unwrapImplicit(node.inner[0]);
                if (!first) {
                    continue;
                }
                if (CALLABLE_KINDS.has(first.kind)) {
                    callNode = first;
                } else {
                    argumentNodes.push(first);
                }
                continue;
            }
            argumentNodes.push(node);
        }
        return [callNode, argumentNodes];
    }

    private getDeclRef(astNode: CppAstNode): CppAstNode | undefined {
        let n: CppAstNode | undefined = astNode;
        while (n) {
            if (n.kind === 'DeclRefExpr') {
                return n;
            }
            // 没有子节点或子节点为空，结束
            if (!n.inner || n.inner.length === 0) {
                break;
            }
            // 沿着第一个子节点往下走
            n = n.inner[0];
        }
        return undefined;
    }

    private generateSystemComponentStmtCpp(
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
        } = this.generateComponentCreationStmtsCpp(componentName, args, componentExpressionPosition, argPositionsAllFlat);
        componentStmts.forEach(stmt => stmts.push(stmt));

        if (ts.isEtsComponentExpression(componentExpression) && componentExpression.body) {
            for (const statement of componentExpression.body.statements) {
                this.arkIRTransformerCpp.cppNodeToStmts(statement).forEach(stmt => stmts.push(stmt));
            }
        }
        stmts.push(this.generateComponentPopStmts(componentName, componentExpressionPosition));
        return {
            value: componentValue,
            valueOriginalPositions: componentPositions,
            stmts: stmts,
        };
    }

    private generateCustomViewStmtCpp(
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
        } = this.arkIRTransformerCpp.generateAssignStmtForValue(newExpr, [componentExpressionPosition]);
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
        const {
            value: componentValue,
            valueOriginalPositions: componentPositions,
            stmts: componentStmts,
        } = this.generateComponentCreationStmtsCpp(COMPONENT_CUSTOMVIEW, createViewArgs, componentExpressionPosition, createViewArgPositionsAll.flat());
        componentStmts.forEach(stmt => stmts.push(stmt));
        stmts.push(this.generateComponentPopStmts(COMPONENT_CUSTOMVIEW, componentExpressionPosition));
        return {
            value: componentValue,
            valueOriginalPositions: componentPositions,
            stmts: stmts,
        };
    }

    private generateComponentCreationStmtsCpp(
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
        } = this.arkIRTransformerCpp.generateAssignStmtForValue(createInvokeExpr, createInvokeExprPositions);
        return {
            value: componentValue,
            valueOriginalPositions: componentPositions,
            stmts: componentStmts,
        };
    }

    private identifierToValueAndStmtsCpp(identifier: CppAstNode | any, variableDefFlag: boolean = false): ValueAndStmts {
        let identifierValue: Value;
        let identifierPositions = [FullPosition.buildFromNodeCpp(identifier, this.sourceFile)];
        let varNode: CppAstNode;
        if (identifier.referencedDecl) {
            varNode = identifier.referencedDecl;
        } else {
            varNode = identifier;
        }
        const varName = varNode.kind === 'TypeRef' ? varNode.code : varNode.name;
        if (varNode.kind && identifier.referencedDecl && varNode.kind === 'FunctionDecl') {
            //
            const type = new functionPointer(varNode.type);
            identifierValue = this.getOrCreateLocal(varName, type);
        } else if (varName === UndefinedType.getInstance().getName()) {
            identifierValue = CppValueUtil.getUndefinedConst();
        } else {
            if (variableDefFlag) {
                identifierValue = this.addNewLocal(varName);
            } else {
                identifierValue = this.getOrCreateLocal(varName);
            }
        }
        return {
            value: identifierValue,
            valueOriginalPositions: identifierPositions,
            stmts: [],
        };
    }

    /**
     * 将 C++ 的成员表达式（如 testMap.insert）转换为 Ark IR 的 ValueAndStmts
     * @param memberExpression - 形如 AST MemberExpr/MemberRef 节点，通常表示 obj.field 或 obj->field
     * @param localValue - （可选）直接指定 baseValue 的场景（如解析父节点时提前确定 base）
     */
    private memberExpressionToValueAndStmts(memberExpression: CppAstNode | any, localValue?: Value): ValueAndStmts {
        const stmts: Stmt[] = [];
        // 【场景1】处理 C++ 代码中 this->field 或 this->method 调用
        // 如果是类成员引用（MemberExpr/MemberRef）但没有 inner[0]，说明是隐式 this，需补充 this 节点
        if ((memberExpression.kind === 'MemberExpr' || memberExpression.kind === 'MemberRef') && memberExpression.inner[0] === undefined) {
            let node = memberExpression;
            node.kind = 'CXXThisExpr'; // 转换为显式 this 指针
            memberExpression.inner[0] = node; // 作为 base 节点
        }
        // 【场景2】递归处理 base 对象，如 testMap.insert 里的 testMap
        // 得到 baseValue（如 testMap）、位置信息和可能的前置语句（如 auto tmp = ...;）
        let { value: baseValue, valueOriginalPositions: basePositions, stmts: baseStmts } = this.tsNodeToValueAndStmts(memberExpression.inner[0]);
        // 【场景3】处理链式成员访问，如 a.b.c 或 (*ptr).field
        // 如果 base 是成员访问，再生成赋值语句保证 SSA 合法性
        if (memberExpression.inner[0].kind === 'MemberExpr' || memberExpression.kind === 'MemberRef') {
            ({
                value: baseValue,
                valueOriginalPositions: basePositions,
                stmts: baseStmts,
            } = this.arkIRTransformerCpp.generateAssignStmtForValue(baseValue, basePositions));
        }
        // 【场景4】特殊场合，调用方直接指定 baseValue（一般用于替换 base，比如虚拟成员、泛型等情况）
        if (localValue !== undefined && localValue !== null) {
            baseValue = localValue;
        }
        // 合并前置语句，保证顺序完整
        stmts.push(...baseStmts);
        // 【场景5】获取成员的字段签名
        // 目的是将 testMap.insert 里的 insert 与 base 类型（如 testMap 的类型）关联，形成完整 field signature
        let fieldSignature: FieldSignature;
        let baseType = baseValue.getType();
        let baseClassType: ClassType | null = null;
        // 判断 base 是不是类类型或其指针/引用
        if (baseType instanceof ClassType) {
            baseClassType = baseType as ClassType;
        } else if (baseType instanceof PointerType && (baseType as PointerType).getBaseType() instanceof ClassType) {
            baseClassType = (baseType as PointerType).getBaseType() as ClassType;
        } else if (baseType instanceof ReferenceType && (baseType as ReferenceType).getBaseType() instanceof ClassType) {
            baseClassType = (baseType as ReferenceType).getBaseType() as ClassType;
        }
        // 【场景6】构造字段签名
        // 如果 base 是类局部变量，则用完整的类签名
        const memberName = memberExpression.name || memberExpression.code;
        if (baseValue instanceof Local && baseClassType !== null) {
            fieldSignature = new FieldSignature(
                memberName, // 字段名（如 insert）
                baseClassType.getClassSignature(), // 基类类型签名
                UnknownType.getInstance() // 类型未知先占位
            );
        } else {
            // 否则只根据字段名生成
            fieldSignature = ArkSignatureBuilder.buildFieldSignatureFromFieldName(memberName);
        }
        // 【场景7】设置字段类型，支持 C++ 复杂类型解析（如模板、指针、const等）
        fieldSignature.setType(this.resolveTypeNodeCpp(memberExpression));
        // 【场景8】生成 IR 层的字段引用对象（如 testMap.insert）
        const fieldRef = new CXXArkInstanceFieldRef(
            baseValue as Local, // baseValue（如 testMap）
            memberExpression.isArrow, // 是否为箭头访问（->）
            fieldSignature // 字段签名（如 insert）
        );
        // 记录节点位置信息，方便后续溯源和 debug
        const fieldRefPositions = [FullPosition.buildFromNodeCpp(memberExpression, this.sourceFile), ...basePositions];
        // 返回解析结果，包括 IR 字段引用、位置信息和相关 SSA 语句
        return { value: fieldRef, valueOriginalPositions: fieldRefPositions, stmts: stmts };
    }

    private elementAccessExpressionToValueAndStmtsCpp(elementAccessExpression: CppAstNode): ValueAndStmts {
        const stmts: Stmt[] = [];
        let { value: baseValue, valueOriginalPositions: basePositions, stmts: baseStmts } = this.tsNodeToValueAndStmts(elementAccessExpression.inner[0]);
        baseStmts.forEach(stmt => stmts.push(stmt));
        if (!(baseValue instanceof Local)) {
            ({
                value: baseValue,
                valueOriginalPositions: basePositions,
                stmts: baseStmts,
            } = this.arkIRTransformerCpp.generateAssignStmtForValue(baseValue, basePositions));
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
            } = this.arkIRTransformerCpp.generateAssignStmtForValue(argumentValue, arguPositions));
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

    private callExpressionToValueAndStmtsCpp(callExpression: CppAstNode | any): ValueAndStmts {
        const stmts: Stmt[] = [];
        const [callNode, argumentNodes] = this.getArgumentNode(callExpression.inner);
        const argus = this.parseArgumentsCppOfCallExpressionCpp(stmts, argumentNodes);
        if (callExpression.name === 'napi_define_class') {
            setTs2CppFuncMapOfClass(argus.args, true, this.declaringMethod);
        }
        return this.generateInvokeValueAndStmtsCpp(callNode, argus, stmts, callExpression);
    }

    public CXXOperatorExpressionCoutToValueAndStmts(callExpression: CppAstNode, callArgus: any[]): any {
        const stmts: Stmt[] = [];
        // 因为inner是依次提取最后面的参数，所以倒序遍历最后面的参数
        for (let i = callExpression.inner.length - 1; i >= 0; i--) {
            let innerNode = callExpression.inner[i];
            if (
                !innerNode.code.includes('cout') &&
                !innerNode.code.includes('<<') &&
                !innerNode.code.includes('endl') &&
                !callExpression.code.startsWith(innerNode.code)
            ) {
                callArgus.push(innerNode);
            }
            if (innerNode.kind === 'CXXOperatorCallExpr') {
                // 递归调用处理CXXOperatorCallExpr
                if (innerNode.type.qualType !== 'std::ostream') {
                    return this.CXXOperatorExpressionCoutToValueAndStmts(innerNode, callArgus);
                }
                // 类型为std::ostream时，说明是重载的流运算符，记录该流运算符重载节点
                callArgus.push(innerNode);
                // 递归调用，处理CXXOperatorCallExpr的inner中嵌套的CXXOperatorCallExpr
                if (innerNode.inner[1].kind === 'CXXOperatorCallExpr') {
                    return this.CXXOperatorExpressionCoutToValueAndStmts(innerNode.inner[1], callArgus);
                }
                // 无嵌套CXXOperatorCallExpr，则直接构建重载的流运算符的ValueAndStmts
                return this.buildValueAndStmtsForStream(innerNode.inner[1], callArgus.reverse(), stmts, callExpression);
            }
            while (innerNode.kind === 'ImplicitCastExpr' && innerNode.valueCategory === 'lvalue' && innerNode.inner.length > 0) {
                innerNode = innerNode.inner[0];
            }
            if (
                innerNode.kind === 'DeclRefExpr' &&
                (innerNode.type.qualType.includes('iostream') ||
                    innerNode.type.qualType.includes('ostream') ||
                    innerNode.type.qualType.includes('istream') ||
                    innerNode.type.qualType.includes('lambda at'))
            ) {
                // 获取DeclRefExpr及其后面的节点
                return this.buildValueAndStmtsForStream(innerNode, callArgus.reverse(), stmts, callExpression);
            }
        }
    }

    private buildValueAndStmtsForStream(streamNode: CppAstNode, args: any[], stmts: Stmt[], streamExpr: CppAstNode): ValueAndStmts {
        let nonOverloadedArgs = [];
        const currValueAndStmts: ValueAndStmts = {
            value: new Local(streamExpr.code),
            valueOriginalPositions: [],
            stmts: [...stmts],
        };
        for (let i = 0; i < args.length; i += 1) {
            let arg = args[i];
            if (arg.kind === 'CXXOperatorCallExpr') {
                // 标准流运算符 + 重载流运算符
                // 1.标准流运算符的对象，调用std::stream函数
                this.buildValueAndStmtsForStdStream(streamNode, nonOverloadedArgs, streamExpr, currValueAndStmts);
                // 2.重载输出运算符的对象，调用重载函数
                this.buildValueAndStmtsForOverloadedStream(streamNode, arg, currValueAndStmts);
                nonOverloadedArgs = [];
            } else {
                nonOverloadedArgs.push(arg);
                if (i !== args.length - 1) {
                    continue;
                }
                // 循环结束时，处理剩余的标准流运算符
                this.buildValueAndStmtsForStdStream(streamNode, nonOverloadedArgs, streamExpr, currValueAndStmts);
            }
        }
        return currValueAndStmts;
    }

    private buildValueAndStmtsForOverloadedStream(streamNode: CppAstNode, overloadedArg: CppAstNode, currValueAndStmts: ValueAndStmts): void {
        overloadedArg.inner[1] = streamNode; // 将第2个子节点替换成重载的运算符节点，以避免重复处理嵌套CXXOperatorCallExpr
        let overloadedStreamValueAndStmts = this.handleOverloadedOp(overloadedArg);
        if (!overloadedStreamValueAndStmts) {
            return;
        }
        currValueAndStmts.stmts.push(...overloadedStreamValueAndStmts.stmts);
        currValueAndStmts.valueOriginalPositions.push(...overloadedStreamValueAndStmts.valueOriginalPositions);
        if (overloadedStreamValueAndStmts.value instanceof AbstractInvokeExpr) {
            const invokeStmt = new ArkInvokeStmt(overloadedStreamValueAndStmts.value as AbstractInvokeExpr);
            invokeStmt.setOperandOriginalPositions(overloadedStreamValueAndStmts.valueOriginalPositions);
            currValueAndStmts.stmts.push(invokeStmt);
        }
    }

    private buildValueAndStmtsForStdStream(streamNode: CppAstNode, nonOverloadedArgs: [] | any,
                                           streamExpr: CppAstNode | any, currValueAndStmts: ValueAndStmts): void {
        if (nonOverloadedArgs.length === 0) {
            return;
        }
        const stmts: Stmt[] = [];
        const argus = this.parseArgumentsCppOfCallExpressionCpp(stmts, nonOverloadedArgs);
        const normalCoutValueAndStmts = this.generateInvokeValueAndStmtsCpp(streamNode, argus, stmts, streamExpr);
        currValueAndStmts.stmts.push(...normalCoutValueAndStmts.stmts);
        currValueAndStmts.valueOriginalPositions = normalCoutValueAndStmts.valueOriginalPositions;
        if (streamNode.type.qualType.includes('lambda at')) {
            currValueAndStmts.value = normalCoutValueAndStmts.value;
        } else if (normalCoutValueAndStmts.value instanceof AbstractInvokeExpr) {
            const invokeStmt = new ArkInvokeStmt(normalCoutValueAndStmts.value as AbstractInvokeExpr);
            invokeStmt.setOperandOriginalPositions(normalCoutValueAndStmts.valueOriginalPositions);
            currValueAndStmts.stmts.push(invokeStmt);
        }
    }

    public CXXOperatorExpressionToBinaryOperator(expression: CppAstNode): ValueAndStmts {
        let operatorExpression = Object.assign({}, expression);
        operatorExpression.opcode = expression.inner[0].code;
        operatorExpression.inner = [expression.inner[1], expression.inner[2]];
        return this.binaryExpressionToValueAndStmtsCpp(operatorExpression);
    }

    public CXXOperatorExpressionToUnaryOperator(expression: CppAstNode): ValueAndStmts {
        let operatorExpression = Object.assign({}, expression);
        operatorExpression.opcode = expression.inner[0].code;
        operatorExpression.inner = [expression.inner[1]];
        if (expression.code.indexOf(expression.inner[0].code) === 0) {
            return this.prefixUnaryExpressionToValueAndStmtsCpp(operatorExpression);
        }
        return this.postfixUnaryExpressionToValueAndStmtsCpp(operatorExpression);
    }

    public cxxOperatorExpressionToValueAndStmts(callExpression: CppAstNode, layer: boolean = true): any {
        // First handle overloaded operators or other special cases
        const specialResult = this.handleSpecialOperators(callExpression);
        if (specialResult) {
            return specialResult;
        }

        const innerStmts: ValueAndStmts[] = [];
        const stmts: Stmt[] = [];

        // Collect statements from all inner nodes
        this.collectInnerOperatorStmts(callExpression, innerStmts);

        if (!layer) {
            // Only process final output in the first recursive layer
            return innerStmts;
        }

        // Merge results and build element access expression
        const exprPositions = [
            FullPosition.buildFromNodeCpp(callExpression, this.sourceFile),
            ...innerStmts[0].valueOriginalPositions,
            ...innerStmts[1].valueOriginalPositions,
        ];
        let elementAccessExpr = new ArkArrayRef(innerStmts[0].value as Local, innerStmts[1].value);

        innerStmts[0].stmts.forEach(stmt => stmts.push(stmt));
        innerStmts[1].stmts.forEach(stmt => stmts.push(stmt));

        return { value: elementAccessExpr, valueOriginalPositions: exprPositions, stmts: stmts };
    }

    /**
     * Handle special operator scenarios and return early if matched
     */
    private handleSpecialOperators(callExpression: CppAstNode): ValueAndStmts | null {
        // Overloaded operator
        const overloadedOpToValueAndStmts = this.handleOverloadedOp(callExpression);
        if (overloadedOpToValueAndStmts) {
            return overloadedOpToValueAndStmts;
        }
        // operator<< / operator>> and lambda cout scenario
        if (
            (callExpression.inner[0].kind === 'ImplicitCastExpr' && callExpression.inner[0].name === 'operator>>') ||
            callExpression.name === 'operator<<' ||
            callExpression.inner[0].name === 'operator<<' ||
            callExpression.inner[1]?.type.qualType.toString().includes('(lambda at')) {
            return this.CXXOperatorExpressionCoutToValueAndStmts(callExpression, []);
        }

        // Relational binary operator or assignment operator
        if (callExpression.inner[0].kind === 'ImplicitCastExpr' &&
            (ArkValueTransformerCpp.isRelationalBinaryOperator(callExpression.inner[0].code) ||
                callExpression.name === 'operator=')) {
            return this.CXXOperatorExpressionToBinaryOperator(callExpression);
        }

        // Unary operators (++ / --)
        if (callExpression.inner[0].kind === 'ImplicitCastExpr' &&
            ['++', '--'].includes(callExpression.inner[0].code)) {
            return this.CXXOperatorExpressionToUnaryOperator(callExpression);
        }

        // Arrow operator (->) in iteration
        if (callExpression.inner[0].kind === 'ImplicitCastExpr' &&
            callExpression.inner[0].code === '->') {
            return this.tsNodeToValueAndStmts(callExpression.inner[1]);
        }
        return null;
    }

    /**
     * Collect ValueAndStmts from each inner node
     */
    private collectInnerOperatorStmts(callExpression: CppAstNode, innerStmts: ValueAndStmts[]): void {
        for (let innerNode of callExpression.inner) {
            if (
                innerNode.kind === 'CXXOperatorCallExpr' ||
                innerNode.kind === 'MaterializeTemporaryExpr' ||
                innerNode.kind === 'CXXBindTemporaryExpr' ||
                innerNode.kind === 'CXXConstructExpr' ||
                (innerNode.kind === 'ImplicitCastExpr' && innerNode.castKind !== 'FunctionToPointerDecay')
            ) {
                innerStmts.push(...this.cxxOperatorExpressionToValueAndStmts(innerNode, false));
            } else if (innerNode.kind === 'DeclRefExpr') {
                innerStmts.push(this.identifierToValueAndStmtsCpp(innerNode));
            } else if (innerNode.kind === 'IntegerLiteral' || innerNode.kind === 'StringLiteral') {
                let literalNode = this.literalNodeToValueAndStmtsCpp(innerNode);
                if (literalNode) {
                    innerStmts.push(literalNode);
                }
            }
        }
    }

    private handleOverloadedOp(cxxOperatorCallExpr: CppAstNode): ValueAndStmts | null {
        if (cxxOperatorCallExpr.type?.qualType === '' || cxxOperatorCallExpr.inner?.[0].castKind !== 'FunctionToPointerDecay') {
            return null;
        }
        let callType = cppNode2Type(cxxOperatorCallExpr.type.qualType, this.declaringMethod, null);
        if (callType instanceof ReferenceType) {
            callType = callType.getBaseType();
        }
        if (callType.getTypeString() === 'std::istream' || callType.getTypeString() === 'std::ostream') {
            return this.buildInvokeValueForOverloadedStreamOp(cxxOperatorCallExpr);
        }
        if (!(callType instanceof ClassType)) {
            return null;
        }
        const classSignature = callType.getClassSignature();
        const arkClass = this.declaringMethod.getDeclaringArkFile().getScene().getClass(classSignature);
        if (!arkClass) {
            return null;
        }
        const overloadOpMethod = cxxOperatorCallExpr.name ? arkClass.getMethodWithName(cxxOperatorCallExpr.name) : null;
        if (!overloadOpMethod) {
            return null;
        }
        return this.buildInvokeValueForNormalOverloadedOp(cxxOperatorCallExpr);
    }

    /* 对输入输出流运算符operator<<、operator>>的重载 构建对应的函数调用IR */
    private buildInvokeValueForOverloadedStreamOp(cxxOperatorCallExpr: CppAstNode): ValueAndStmts | null {
        if (!cxxOperatorCallExpr.inner || cxxOperatorCallExpr.inner.length < 2) {
            return null;
        }
        const stmts: Stmt[] = [];
        const { args, argPositions: argPositionsAll } = this.parseArgumentsCpp(stmts, cxxOperatorCallExpr.inner.slice(1));
        // 输入/输出运算符必须作为全局函数重载，且重载函数只会有2个参数，因为输入/输出运算符实际为二元运算：流（左操作数） + 对象（右操作数）
        const defaultClass = this.declaringMethod.getDeclaringArkFile().getDefaultClass();
        const arkMtds = defaultClass.getAllMethodsWithName(cxxOperatorCallExpr.name);
        if (arkMtds.length === 0) {
            return null;
        }
        let matchMtd: ArkMethod | undefined;
        for (const mtd of arkMtds) {
            const params = mtd.getParameters();
            let objType = params[1]!.getType();
            if (objType instanceof ReferenceType) {
                objType = objType.getBaseType();
            }
            if (objType.getTypeString() === args[1]!.getType().getTypeString()) {
                matchMtd = mtd;
                break;
            }
        }
        if (!matchMtd) {
            return null;
        }
        // 构造callNode
        const callNode = {
            code: cxxOperatorCallExpr.name,
            name: cxxOperatorCallExpr.name,
            kind: 'DeclRefExpr',
            inner: [],
            range: cxxOperatorCallExpr.range,
            type: cxxOperatorCallExpr.type,
        };
        const argus = {
            realGenericTypes: undefined,
            args: args,
            argPositions: argPositionsAll,
        };
        const valueAndStmts = this.generateInvokeValueAndStmtsCpp(callNode, argus, stmts, cxxOperatorCallExpr);
        if (valueAndStmts.value instanceof ArkStaticInvokeExpr) {
            valueAndStmts.value.setMethodSignature(matchMtd.getSignature());
        }
        return valueAndStmts;
    }

    /* 对普通的运算符的重载构建对应的函数调用IR */
    private buildInvokeValueForNormalOverloadedOp(cxxOperatorCallExpr: CppAstNode): ValueAndStmts | null {
        // 重载运算符节点的子节点不会少于2（inner[0]为FunctionToPointerDecay，inner[1]为实例对象DeclRefExpr）
        const innerLen = cxxOperatorCallExpr.inner?.length;
        if (!innerLen || innerLen < 2) {
            return null;
        }
        const stmts: Stmt[] = [];
        const argNodes = innerLen === 2 ? [] : cxxOperatorCallExpr.inner.slice(2);
        // 如重载operator+时，a + b等价于 a.operator+(b)，构造a.operator+这个memberExpr作为caller
        const callNode = {
            code: cxxOperatorCallExpr.inner[1].code + '.' + cxxOperatorCallExpr.name,
            name: cxxOperatorCallExpr.name,
            range: cxxOperatorCallExpr.range,
            kind: 'MemberExpr',
            type: { qualType: '<bound member function type>' },
            inner: [cxxOperatorCallExpr.inner[1]],
        };
        return this.buildValueAndStmtsForMemberCall(stmts, callNode, argNodes, cxxOperatorCallExpr, undefined);
    }

    public RecoverExpressionToValueAndStmts(callExpression: CppAstNode | any): ValueAndStmts {
        const stmts: Stmt[] = [];
        const [callNode, argumentNodes] = this.getArgumentNodeForRecover(callExpression.inner);
        const argus = this.parseArgumentsCppOfCallExpressionCpp(stmts, argumentNodes);
        return this.generateInvokeValueAndStmtsCpp(callNode, argus, stmts, callExpression);
    }

    private generateInvokeValueAndStmtsCpp(
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
                return this.generateCustomViewStmtCpp(callerName, args, argPositions, callExpression, stmts);
            } else if ((callerName === COMPONENT_FOR_EACH || callerName === COMPONENT_LAZY_FOR_EACH) && ts.isCallExpression(callExpression)) {
                // foreach/lazyforeach will be parsed as ts.callExpression
                return this.generateSystemComponentStmtCpp(callerName, args, argPositions, callExpression, stmts);
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
            } = this.arkIRTransformerCpp.generateAssignStmtForValue(callerValue, callerPositions));
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

    private cxxMemberCallExpressionToValueAndStmtsCpp(callExpression: CppAstNode | any): ValueAndStmts {
        let realGenericTypes: Type[] | undefined;
        const stmts: Stmt[] = [];
        const [_, rightNodes] = this.getArgumentNode(callExpression.inner);
        return this.buildValueAndStmtsForMemberCall(stmts, callExpression.inner[0], rightNodes, callExpression, realGenericTypes);
    }

    private buildValueAndStmtsForMemberCall(
        stmts: Stmt[],
        callerNode: any,
        argNodes: any[],
        callExpression: any,
        realGenericTypes: Type[] | undefined
    ): ValueAndStmts {
        const { args, argPositions: argPositionsAll } = this.parseArgumentsCpp(stmts, argNodes);
        const argPositionsAllFlat = argPositionsAll.flat();
        let { value: callerValue, valueOriginalPositions: callerPositions, stmts: callerStmts } = this.tsNodeToValueAndStmts(callerNode);
        stmts.push(...callerStmts);

        let invokeValue: Value;
        let invokeValuePositions: FullPosition[] = [FullPosition.buildFromNodeCpp(callExpression, this.sourceFile)];
        if (callerValue instanceof ArkInstanceFieldRef) {
            invokeValue = this.buildInvokeValueForFieldRef(callerValue, args, realGenericTypes, invokeValuePositions, callerPositions);
        } else if (callerValue instanceof Local) {
            invokeValue = this.buildInvokeValueForLocal(callerValue, args, realGenericTypes);
        } else {
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

    private buildInvokeValueForFieldRef(
        callerValue: AbstractFieldRef,
        args: Value[],
        realGenericTypes: Type[] | undefined,
        invokeValuePositions: FullPosition[],
        callerPositions: FullPosition[]
    ): ArkInstanceFieldRef | ArkStaticInvokeExpr {
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
        return { value: leftOp, valueOriginalPositions: [leftOpPosition], stmts: [assignStmt] };
    }

    private parseArgumentsCppOfCallExpressionCpp(
        currStmts: Stmt[],
        callExpression: any
    ): {
        realGenericTypes: Type[] | undefined;
        args: Value[];
        argPositions: FullPosition[];
    } {
        let realGenericTypes: Type[] | undefined;
        let builderMethodIndexes: Set<number> | undefined;
        const { args: args, argPositions: argPositions } = this.parseArgumentsCpp(currStmts, callExpression, builderMethodIndexes);
        return {
            realGenericTypes: realGenericTypes,
            args: args,
            argPositions: argPositions,
        };
    }

    private parseArgumentsCpp(
        currStmts: Stmt[],
        argumentNodes?: any[],
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
                    this.arkIRTransformerCpp.setBuilderMethodContextFlag(true);
                }
                let { value: argValue, valueOriginalPositions: argPositionsSingle, stmts: argStmts } = this.tsNodeToValueAndStmts(argument);
                this.builderMethodContextFlag = prevBuilderMethodContextFlag;
                this.arkIRTransformerCpp.setBuilderMethodContextFlag(prevBuilderMethodContextFlag);
                argStmts.forEach(s => currStmts.push(s));
                if (IRUtils.moreThanOneAddress(argValue)) {
                    ({
                        value: argValue,
                        valueOriginalPositions: argPositionsSingle,
                        stmts: argStmts,
                    } = this.arkIRTransformerCpp.generateAssignStmtForValue(argValue, argPositionsSingle));
                    argStmts.forEach(s => currStmts.push(s));
                }
                args.push(argValue);
                argPositions.push(argPositionsSingle[0]);
            }
        }
        return { args: args, argPositions: argPositions };
    }

    private callableNodeToValueAndStmtsCpp(callableNode: CppAstNode): ValueAndStmts {
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

    private newExpressionToValueAndStmtsCpp(newExpression: CppAstNode): ValueAndStmts {
        let className = this.getNewExpressionClassName(newExpression);
        //新增处理动态数组创建： int *arr = new int[10]
        if (className === Builtin.ARRAY || newExpression.isArray) {
            return this.newArrayExpressionToValueAndStmtsCpp(newExpression);
        }
        const stmts: Stmt[] = [];
        let realGenericTypes: Type[] | undefined;
        if (newExpression.typeArguments) {
            realGenericTypes = [];
            newExpression.typeArguments.forEach((typeArgument: string) => {
                realGenericTypes!.push(this.resolveTypeNodeCpp('', typeArgument));
            });
        }
        let curClass = this.declaringMethod.getDeclaringArkFile().getClassWithName(className);
        let classSignature = curClass ? curClass.getSignature() : ArkSignatureBuilder.buildClassSignatureFromClassName(className);
        let classType = new ClassType(classSignature, realGenericTypes);
        if (className === Builtin.OBJECT) {
            classSignature = Builtin.OBJECT_CLASS_SIGNATURE;
            classType = Builtin.OBJECT_CLASS_TYPE;
        }
        const newExpr = new ArkNewExpr(classType);
        const {value: newLocal, valueOriginalPositions: newLocalPositions, stmts: newExprStmts, } =
            this.arkIRTransformerCpp.generateAssignStmtForValue(newExpr, [FullPosition.buildFromNodeCpp(newExpression, this.sourceFile)]);
        newExprStmts.forEach(stmt => stmts.push(stmt));
        const constructorMethodSubSignature = ArkSignatureBuilder.buildMethodSubSignatureFromMethodName(CONSTRUCTOR_NAME);
        const constructorMethodSignature = new MethodSignature(classSignature, constructorMethodSubSignature);
        this.emitCtorInvokeAndMemberInitsCpp(stmts, newExpression, newLocal as Local, newLocalPositions, constructorMethodSignature, className);
        return { value: newLocal, valueOriginalPositions: newLocalPositions, stmts: stmts };
    }
    // 抽出的尾部逻辑：构造调用 + 特例处理 + 成员初始化
    private emitCtorInvokeAndMemberInitsCpp(
        stmts: Stmt[],
        newExpression: any,
        newLocal: Local,
        newLocalPositions: FullPosition[],
        constructorMethodSignature: MethodSignature,
        className: string,
    ): void {
        // 对象构造，使用 invokeStmt 表达
        const constructArgs = (() => {
            let args = newExpression.inner;
            if (newExpression.kind === 'CXXNewExpr' && newExpression.inner[1]?.kind === 'CXXConstructExpr') {
                return [...newExpression.inner[1].inner];
            } else if (newExpression.kind === 'CompoundLiteralExpr') {
                return this.getConstructArgs(args);
            } else if (
                newExpression.kind === 'CXXConstructExpr' &&
                newExpression.type.qualType.startsWith('struct') &&
                args && args[0].inner[0]?.kind === 'CompoundLiteralExpr'
            ) {
                return this.getConstructArgs(args[0].inner[0].inner);
            } else if (newExpression.kind === 'InitListExpr') {
                return this.getConstructArgs(newExpression);
            }
            return args;
        })();

        const { args: argValues, argPositions } = this.parseArgumentsCpp(stmts, constructArgs);
        const instanceInvokeExpr = new ArkInstanceInvokeExpr(newLocal, constructorMethodSignature, argValues);
        const invokeStmt = new ArkInvokeStmt(instanceInvokeExpr);
        const instanceInvokeExprPositions = [newLocalPositions[0], ...newLocalPositions, ...argPositions];
        invokeStmt.setOperandOriginalPositions(instanceInvokeExprPositions);
        stmts.push(invokeStmt);

        // 处理 cpp 与 ts 之间的接口
        if (className === 'napi_property_descriptor') {
            setTs2CppFuncMapOfClass(argValues, false, this.declaringMethod);
        }

        // 处理初始化语句含有成员变量的场景
        if (newExpression.kind === 'CompoundLiteralExpr' && newExpression.inner[1].kind === 'InitListExpr') {
            const newExprInit = newExpression.inner[1];
            for (const element of newExprInit.inner) {
                const memberValueAndStmts = this.memberExpressionToValueAndStmts(element.inner[0], newLocal);
                const fieldRef = memberValueAndStmts.value;
                const rightOpNode = element.inner[1];
                const rightValueAndStmts = this.assignmentRightOpToValueAndStmtsCpp(rightOpNode, fieldRef);
                const assignStmt = new ArkAssignStmt(fieldRef, rightValueAndStmts.value);
                const leftPositions = memberValueAndStmts.valueOriginalPositions;
                const rightPositions = rightValueAndStmts.valueOriginalPositions;
                assignStmt.setOperandOriginalPositions([...leftPositions, ...rightPositions]);
                stmts.push(assignStmt);
            }
        }
    }


    // 构造参数表格
    private getConstructArgs(constructArgs: CppAstNode | any): Array<any> {
        if (constructArgs.kind === 'InitListExpr') {
            constructArgs = constructArgs.inner;
        }
        if (constructArgs[1]?.kind === 'InitListExpr') {
            constructArgs = constructArgs[1].inner;
        }
        let newConstructArgs = [];
        for (let i = 0; i < constructArgs.length; i++) {
            if (constructArgs[1]?.kind.toString() === 'ImplicitCastExpr') {
                newConstructArgs.push(constructArgs[i].inner[1]);
            } else {
                newConstructArgs.push(constructArgs[i]);
            }
        }
        return newConstructArgs;
    }

    private getNewExpressionClassName(newExpression: CppAstNode): string {
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
        return oriType.replace(/[()]/g, '').replace(' *', '');
    }

    private newArrayExpressionToValueAndStmtsCpp(newArrayExpression: CppAstNode): ValueAndStmts {
        let baseType: Type = UnknownType.getInstance();
        if (newArrayExpression.type.qualType) {
            const argumentType = this.resolveTypeNodeCpp(newArrayExpression);
            if (!(argumentType instanceof AnyType || argumentType instanceof UnknownType)) {
                baseType = argumentType;
            }
        }
        const stmts: Stmt[] = [];
        const { args: argumentValues, argPositions: argPositions } = this.parseArgumentsCpp(stmts, newArrayExpression.inner);
        let argumentsLength = newArrayExpression.inner ? newArrayExpression.inner.length : 0;
        let arrayLengthValue: Value;
        let arrayLength = -1;
        let arrayLengthPosition = FullPosition.DEFAULT;
        if (argumentsLength === 1 && (argumentValues[0].getType() instanceof NumberType || argumentValues[0].getType() instanceof UnknownType)) {
            arrayLengthValue = argumentValues[0];
            arrayLengthPosition = argPositions[0];
        } else {
            arrayLengthValue = CppValueUtil.getOrCreateNumberConst(argumentsLength);
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
        return this.generateArrayExprAndStmtsCpp(
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

    private arrayLiteralExpressionToValueAndStmtsCpp(arrayLiteralExpression: CppAstNode): ValueAndStmts {
        const stmts: Stmt[] = [];
        const elementTypes: Set<Type> = new Set();
        const elementValues: Value[] = [];
        const elementPositions: FullPosition[] = [];
        const arrayLength = arrayLiteralExpression.inner.length;
        this.getArrayLiteralExpression(arrayLiteralExpression, stmts, elementTypes, elementValues, elementPositions);
        let baseType: Type = this.resolveTypeNodeCpp(arrayLiteralExpression);
        if (baseType === UnknownType.getInstance()) {
            // 如果类型不确定，当作未知引用类型
            return this.newExpressionToValueAndStmtsCpp(arrayLiteralExpression);
        }
        const newArrayExprPosition = FullPosition.buildFromNodeCpp(arrayLiteralExpression, this.sourceFile);
        return this.generateArrayExprAndStmtsCpp(baseType, CppValueUtil.getOrCreateNumberConst(arrayLength),
            FullPosition.DEFAULT, arrayLength, elementValues, elementPositions, stmts, newArrayExprPosition, true);
    }

    private getArrayLiteralExpression(
        arrayLiteralExpression: any,
        stmts: Stmt[],
        elementTypes: Set<Type>,
        elementValues: Value[],
        elementPositions: FullPosition[]
    ): void {
        for (const element of arrayLiteralExpression.inner) {
            let { value: elementValue, valueOriginalPositions: elementPosition, stmts: elementStmts } = this.tsNodeToValueAndStmts(element);
            elementStmts.forEach(stmt => stmts.push(stmt));
            if (IRUtils.moreThanOneAddress(elementValue)) {
                ({
                    value: elementValue,
                    valueOriginalPositions: elementPosition,
                    stmts: elementStmts,
                } = this.arkIRTransformerCpp.generateAssignStmtForValue(elementValue, elementPosition));
                elementStmts.forEach(stmt => stmts.push(stmt));
            }
            elementValues.push(elementValue);
            elementTypes.add(elementValue.getType());
            elementPositions.push(elementPosition[0]);
        }
    }

    private generateArrayExprAndStmtsCpp(
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
        } = this.arkIRTransformerCpp.generateAssignStmtForValue(newArrayExpr, newArrayExprPositions);
        arrayStmts.forEach(stmt => stmts.push(stmt));
        for (let i = 0; i < arrayLength; i++) {
            const indexValue = CppValueUtil.getOrCreateNumberConst(i);
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

    private prefixUnaryExpressionToValueAndStmtsCpp(prefixUnaryExpression: CppAstNode | any): ValueAndStmts {
        const stmts: Stmt[] = [];
        let { value: operandValue, valueOriginalPositions: operandPositions, stmts: operandStmts } = this.tsNodeToValueAndStmts(prefixUnaryExpression.inner[0]);
        operandStmts.forEach(stmt => stmts.push(stmt));
        if (IRUtils.moreThanOneAddress(operandValue)) {
            ({
                value: operandValue,
                valueOriginalPositions: operandPositions,
                stmts: operandStmts,
            } = this.arkIRTransformerCpp.generateAssignStmtForValue(operandValue, operandPositions));
            operandStmts.forEach(stmt => stmts.push(stmt));
        }

        const operatorToken = prefixUnaryExpression.opcode;
        let exprPositions = [FullPosition.buildFromNodeCpp(prefixUnaryExpression, this.sourceFile)];
        if (operatorToken === '++' || operatorToken === '--') {
            const binaryOperator = operatorToken === '++' ? NormalBinaryOperator.Addition : NormalBinaryOperator.Subtraction;
            const binopExpr = new ArkNormalBinopExpr(operandValue, CppValueUtil.getOrCreateNumberConst(1), binaryOperator);
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
            const operator = ArkIRTransformerCpp.tokenToUnaryOperatorCpp(operatorToken);
            if (operator) {
                unopExpr = new ArkUnopExpr(operandValue, operator);
                exprPositions.push(...operandPositions);
            } else {
                unopExpr = CppValueUtil.getUndefinedConst();
                exprPositions = [FullPosition.DEFAULT];
            }
            return {
                value: unopExpr,
                valueOriginalPositions: exprPositions,
                stmts: stmts,
            };
        }
    }

    private postfixUnaryExpressionToValueAndStmtsCpp(postfixUnaryExpression: CppAstNode): ValueAndStmts {
        const stmts: Stmt[] = [];
        let { value: operandValue, valueOriginalPositions: operandPositions, stmts: exprStmts } = this.tsNodeToValueAndStmts(postfixUnaryExpression.inner[0]);
        exprStmts.forEach(stmt => stmts.push(stmt));
        if (IRUtils.moreThanOneAddress(operandValue)) {
            ({
                value: operandValue,
                valueOriginalPositions: operandPositions,
                stmts: exprStmts,
            } = this.arkIRTransformerCpp.generateAssignStmtForValue(operandValue, operandPositions));
            exprStmts.forEach(stmt => stmts.push(stmt));
        }

        let value: Value;
        let exprPositions = [FullPosition.buildFromNodeCpp(postfixUnaryExpression, this.sourceFile)];
        const operatorToken = postfixUnaryExpression.opcode;
        if (operatorToken === '++' || operatorToken === '--') {
            const binaryOperator = operatorToken === '++' ? NormalBinaryOperator.Addition : NormalBinaryOperator.Subtraction;
            const binopExpr = new ArkNormalBinopExpr(operandValue, CppValueUtil.getOrCreateNumberConst(1), binaryOperator);
            exprPositions.push(...operandPositions, FullPosition.DEFAULT);
            const assignStmt = new ArkAssignStmt(operandValue, binopExpr);
            assignStmt.setOperandOriginalPositions([...operandPositions, ...exprPositions]);
            stmts.push(assignStmt);
            value = operandValue;
        } else {
            value = CppValueUtil.getUndefinedConst();
            exprPositions = [FullPosition.DEFAULT];
        }

        return {
            value: value,
            valueOriginalPositions: exprPositions,
            stmts: stmts,
        };
    }

    public declStmtToValueAndStmts(variableDeclarationList: CppAstNode): ValueAndStmts {
        const stmts: Stmt[] = [];
        let isConst = variableDeclarationList.type!.qualType.toString().startsWith('const ');
        const { stmts: declaredStmts } = this.variableDeclarationToValueAndStmtsCpp(variableDeclarationList, isConst);
        declaredStmts.forEach(s => stmts.push(s));
        return {
            value: CppValueUtil.getUndefinedConst(),
            valueOriginalPositions: [FullPosition.DEFAULT],
            stmts: stmts,
        };
    }

    public variableDeclarationToValueAndStmtsCpp(variableDeclaration: CppAstNode, isConst: boolean, needRightOp: boolean = true): ValueAndStmts {
        const leftOpNode = variableDeclaration;
        let rightOpNode = null;
        if (variableDeclaration.inner !== null && variableDeclaration.inner.length !== 0) {
            rightOpNode = nodeInnerNode(variableDeclaration);
        }
        if (variableDeclaration.type.qualType.toString() === 'int' && variableDeclaration.code.startsWith('std::')) {
            const containerType = this.getStdContainerType(variableDeclaration.code);
            if (containerType) {
                variableDeclaration.type.qualType = containerType;
            }
        }
        const declarationType = variableDeclaration.type ? this.resolveTypeNodeCpp(variableDeclaration) : UnknownType.getInstance();
        if (rightOpNode && declarationType instanceof functionPointer) {
            rightOpNode.code = declarationType.getFunType().toString();
            rightOpNode.type.qualType = declarationType.getFunType().toString();
        }
        const assignment = this.assignmentToValueAndStmtsCpp(leftOpNode, rightOpNode, true, isConst, declarationType, needRightOp);
        if (declarationType instanceof ReferenceType && assignment.stmts[0] instanceof ArkAssignStmt) {
            declarationType.setSourceValue(assignment.stmts[0].getRightOp());
        }
        return assignment;
    }

    private getStdContainerType(declCode: string): string | null {
        const match = /\b(std::\w+)</g.exec(declCode);
        return match ? match[1] : null;
    }

    private assignmentToValueAndStmtsCpp(leftOpNode: any, rightOpNode: any | undefined, variableDefFlag: boolean,
        isConst: boolean, declarationType: Type, needRightOp: boolean = true): ValueAndStmts {
        let leftValueAndStmts: ValueAndStmts;
        if (leftOpNode.kind.toString() === 'VarDecl') {
            leftValueAndStmts = this.identifierToValueAndStmtsCpp(leftOpNode, variableDefFlag);
        } else {
            leftValueAndStmts = this.tsNodeToValueAndStmts(leftOpNode);
        }
        const { value: leftValue, valueOriginalPositions: leftPositions, stmts: leftStmts } = leftValueAndStmts;
        let stmts: Stmt[] = [];
        if (needRightOp) {
            const {value: rightValue, valueOriginalPositions: rightPositions, stmts: rightStmts, } =
                this.assignmentRightOpToValueAndStmtsCpp(rightOpNode, leftValue);
            if (leftValue instanceof Local) {
                if (variableDefFlag) {
                    leftValue.setConstFlag(isConst);
                    leftValue.setType(declarationType);
                }
                if (leftValue.getType() instanceof UnknownType && !(rightValue.getType() instanceof UnknownType) &&
                    !(rightValue.getType() instanceof UndefinedType)
                ) {
                    leftValue.setType(rightValue.getType());
                }
            }
            const assignStmt = new ArkAssignStmt(leftValue, rightValue);
            assignStmt.setOperandOriginalPositions([...leftPositions, ...rightPositions]);
            if (leftOpNode.kind === 'InitListExpr') {
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

    private assignmentRightOpToValueAndStmtsCpp(rightOpNode: CppAstNode | undefined, leftValue: Value): ValueAndStmts {
        let rightValue: Value;
        let rightPositions: FullPosition[];
        let tempRightStmts: Stmt[] = [];
        const rightStmts: Stmt[] = [];
        if (rightOpNode) {
            ({ value: rightValue, valueOriginalPositions: rightPositions, stmts: tempRightStmts } = this.tsNodeToValueAndStmts(rightOpNode));
            tempRightStmts.forEach(stmt => rightStmts.push(stmt));
        } else {
            rightValue = CppValueUtil.getUndefinedConst();
            rightPositions = [FullPosition.DEFAULT];
        }
        if (IRUtils.moreThanOneAddress(leftValue) && IRUtils.moreThanOneAddress(rightValue)) {
            ({
                value: rightValue,
                valueOriginalPositions: rightPositions,
                stmts: tempRightStmts,
            } = this.arkIRTransformerCpp.generateAssignStmtForValue(rightValue, rightPositions));
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
    private binaryExpressionToValueAndStmtsCpp(binaryExpression: CppAstNode | any): ValueAndStmts {
        const operatorToken = binaryExpression.opcode;
        const binaryExpressionLeft = binaryExpression.inner[0];
        const binaryExpressionRight = binaryExpression.inner[1];
        if (operatorToken === '=') {
            return this.assignmentToValueAndStmtsCpp(binaryExpressionLeft, binaryExpressionRight, false, false, UnknownType.getInstance(), true);
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
                exprValue = CppValueUtil.getUndefinedConst();
                exprValuePositions.push(binaryExpressionPosition);
            }
        }
        return {
            value: exprValue,
            valueOriginalPositions: exprValuePositions,
            stmts: stmts,
        };
    }

    private compoundAssignmentToValueAndStmtsCpp(binaryExpression: CppAstNode | any): ValueAndStmts {
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
            } = this.arkIRTransformerCpp.generateAssignStmtForValue(rightValue, rightPositions);
            rightValue = newRightValue;
            rightPositions = newRightPositions;
            rightStmts.forEach(stmt => stmts.push(stmt));
        }

        let leftOpValue: Value;
        let leftOpPositions: FullPosition[];
        const operator = this.compoundAssignmentTokenToBinaryOperatorCpp(binaryExpression.opcode);
        if (operator) {
            const exprValue = new ArkNormalBinopExpr(leftValue, rightValue, operator);
            const exprValuePosition = FullPosition.buildFromNodeCpp(binaryExpression, this.sourceFile);
            const assignStmt = new ArkAssignStmt(leftValue, exprValue);
            assignStmt.setOperandOriginalPositions([...leftPositions, exprValuePosition, ...leftPositions, ...rightPositions]);
            stmts.push(assignStmt);
            leftOpValue = leftValue;
            leftOpPositions = leftPositions;
        } else {
            leftOpValue = CppValueUtil.getUndefinedConst();
            leftOpPositions = [leftPositions[0]];
        }
        return {
            value: leftOpValue,
            valueOriginalPositions: leftOpPositions,
            stmts: stmts,
        };
    }

    private compoundAssignmentTokenToBinaryOperatorCpp(token: string): NormalBinaryOperator | null {
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

    public conditionToValueAndStmtsCpp(condition: CppAstNode | undefined): ValueAndStmts {
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
                } = this.arkIRTransformerCpp.generateAssignStmtForValue(conditionValue, conditionPositions));
                conditionStmts.forEach(stmt => stmts.push(stmt));
            }
            conditionExpr = new ArkConditionExpr(conditionValue, CppValueUtil.getOrCreateNumberConst(0), RelationalBinaryOperator.InEquality);
            conditionPositions = [conditionPositions[0], ...conditionPositions, FullPosition.DEFAULT];
        }
        return {
            value: conditionExpr,
            valueOriginalPositions: conditionPositions,
            stmts: stmts,
        };
    }

    private literalNodeToValueAndStmtsCpp(literalNode: CppAstNode | any): ValueAndStmts | null {
        const syntaxKind = literalNode.kind;
        let constant: Constant | null = null;
        switch (syntaxKind) {
            case 'IntegerLiteral':
                constant = CppValueUtil.getOrCreateNumberConst(parseFloat(literalNode.value));
                break;
            case 'StringLiteral':
                constant = CppValueUtil.createStringConst(literalNode.value);
                break;
            case 'CXXBoolLiteralExpr':
                constant = CppValueUtil.getBooleanConstant(literalNode.value);
                break;
            case 'CharacterLiteral':
                constant = CppValueUtil.createStringConst(literalNode.code);
                break;
            case 'FloatingLiteral':
                constant = CppValueUtil.getOrCreateNumberConst(parseFloat(literalNode.code));
                break;
            case 'CXXNullPtrLiteralExpr':
                constant = CppValueUtil.getNullPtrConstant();
                break;
            case 'AddrLabelExpr':
                // 在AddrLabelExpr结构下包含LabelRef节点，处于inner[0]的位置
                constant = CppValueUtil.getLabelPtrConstant(literalNode.inner[0].code);
                let p = literalNode.parent ? literalNode.parent : literalNode.getParent();
                const point = p.code.match(/void\s*([^=]+)=/)[1].trim();
                let stored = false;
                for (const [key, gotoStmts] of this.declaringMethod.gotoStmtMap) {
                    if (key === literalNode.inner[0].code) {
                        this.declaringMethod.gotoStmtMap.set(point, gotoStmts);
                    }
                }
                if (!stored) {
                    this.declaringMethod.gotoStmtMap.set(point, []);
                }
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

    public generateTempLocal(localType: Type = UnknownType.getInstance()): Local {
        const tempLocalName = TEMP_LOCAL_PREFIX + this.tempLocalNo;
        this.tempLocalNo++;
        const tempLocal: Local = new Local(tempLocalName, localType);
        this.locals.set(tempLocalName, tempLocal);
        return tempLocal;
    }

    public resolveTypeNodeCpp(node: CppAstNode | any, stringItem?: string): Type {
        // Step 1: Extract qualType and tagUsed
        const { qualType, tagUsed } = this.extractQualTypeAndTag(node, stringItem);
        // Step 2: Build Type object from qualType and tagUsed
        return this.buildCppTypeFromQualType(node, qualType, tagUsed);
    }

    /**
     * Extract qualType and tagUsed from input parameters
     */
    private extractQualTypeAndTag(node: CppAstNode, stringItem?: string): { qualType: string; tagUsed: string } {
        // If a valid string is provided, use it as qualType first;
        // otherwise, try to use the node's type information or code.
        let qualType: string;
        if (typeof stringItem === 'string' && stringItem.trim()) {
            qualType = stringItem;
        } else if (typeof node?.type?.qualType === 'string' && node.type.qualType.trim()) {
            qualType = node.type.qualType;
        } else if (typeof node?.code === 'string' && node.code.trim()) {
            qualType = node.code;
        } else {
            qualType = '';
        }

        const tagUsed = typeof node?.tagUsed === 'string' ? node.tagUsed : '';
        return { qualType, tagUsed };
    }

    /**
     * Build Type object according to qualType/tagUsed
     */
    private buildCppTypeFromQualType(node: CppAstNode, qualType: string, tagUsed: string): Type {
        if (qualType.includes('[') && qualType.includes(']')) {
            const matches = qualType.match(/\[/g);
            const count = matches ? matches.length : 0;
            let baseType = cppNode2Type(qualType.slice(0, qualType.indexOf('[')), this.declaringMethod, null);
            if (baseType instanceof UnclearReferenceType) {
                return new ArrayType(new UnclearReferenceType(qualType.slice(0, qualType.indexOf('['))), count);
            }
            return new ArrayType(baseType, count);
        } else if (node && Object.prototype.hasOwnProperty.call(node, 'kind') && node.kind === 'InitListExpr') {
            return new ArrayType(new UnclearReferenceType(qualType), node.inner.length);
        } else if (qualType.startsWith('std::')) {
            const match = /std::(\w+)/g.exec(qualType);  // Handle standard library container types
            const containerName = match ? match[1] : null;
            if (containerName && convertDataType(containerName) === 'unsupported' && this.isCppStdContainer(containerName)) {
                const fileSignature = new FileSignature('std', containerName + '.h');
                const classSignature = new ClassSignature(containerName, fileSignature);
                return new ClassType(classSignature);
            } else if (containerName === 'thread') {
                return new Thread();
            }
        } else if (qualType === 'std' && node.kind === 'NamespaceRef') {
            const fileSignature = new FileSignature('std', 'iostream.h');
            const classSignature = new ClassSignature('iostream', fileSignature);
            return new ClassType(classSignature);
        } else if (tagUsed === 'struct') {
            const fileSignature = new FileSignature(this.sourceFile?.projectName ?? '', this.sourceFile.fileName);
            const classSignature = new ClassSignature('struct', fileSignature, null, ClassCategory.STRUCT);
            return new ClassType(classSignature);
        } else if (tagUsed === 'enum') {
            const fileSignature = new FileSignature(this.sourceFile?.projectName ?? '', this.sourceFile.fileName);
            const classSignature = new ClassSignature('enum', fileSignature, null, ClassCategory.ENUM);
            return new ClassType(classSignature);
        } else if (tagUsed === 'union') {
            const fileSignature = new FileSignature(this.sourceFile?.projectName ?? '', this.sourceFile.fileName);
            const classSignature = new ClassSignature('struct', fileSignature, null, ClassCategory.UNION);
            return new ClassType(classSignature);
        } else if (qualType.includes('vector')) {
            let dimension = 0; // Handle std::vector scenarios (must be after std:: check)
            let dataType = this.resolveVectorType(qualType, dimension);
            return new ArrayType(buildTypeFromPreStr(dataType), dimension);
        } else if (qualType === 'thread') {
            return new Thread();
        } else {
            let type = this.resolveCppTypeReferenceNode(qualType); // Handle alias type references
            if (!(type instanceof UnclearReferenceType)) {
                return this.resolveCppTypeReferenceNode(qualType);
            }
        }
        let nodeType = cppNode2Type(qualType, this.declaringMethod, null);
        return nodeType instanceof UnclearReferenceType ? UnknownType.getInstance() : nodeType;
    }


    private isCppStdContainer(typeName: string): boolean {
        const typeNameInLowerCase = typeName.toLowerCase();
        const stdContainerLists = ['map', 'vector', 'deque', 'list', 'array', 'set', 'stack', 'queue'];
        return stdContainerLists.some(containerType => typeNameInLowerCase.includes(containerType));
    }

    private resolveCppTypeReferenceNode(typeReferenceNode: string | any): Type {
        const typeReferenceFullName = typeReferenceNode;
        if (typeReferenceFullName === Builtin.OBJECT) {
            return Builtin.OBJECT_CLASS_TYPE;
        }
        const aliasTypeAndStmt = this.aliasTypeMap.get(typeReferenceFullName);

        const genericTypes: Type[] = [];
        if (typeReferenceNode.typeArguments) {
            for (const typeArgument of typeReferenceNode.typeArguments) {
                genericTypes.push(this.resolveTypeNode(typeArgument));
            }
        }

        if (!aliasTypeAndStmt) {
            const typeName = typeReferenceNode;
            const local = this.locals.get(typeName);
            if (local !== undefined) {
                return local.getType();
            }
            return new UnclearReferenceType(typeName, genericTypes);
        } else {
            if (genericTypes.length > 0) {
                const oldAlias = aliasTypeAndStmt[0];
                let alias = new AliasType(
                    oldAlias.getName(),
                    TypeInference.replaceTypeWithReal(oldAlias.getOriginalType(), genericTypes),
                    oldAlias.getSignature(),
                    oldAlias.getGenericTypes()
                );
                alias.setRealGenericTypes(genericTypes);
                return alias;
            }
            return aliasTypeAndStmt[0];
        }
    }

    public resolveVectorType(kind: string, dimension: number): string {
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

    public static isCompoundAssignmentOperatorCpp(op?: string): boolean {
        return !!op && COMPOUND_BIN_OPS.has(op);
    }

    public static isRelationalBinaryOperator(op: string): boolean {
        return (Object.values(RelationalBinaryOperator) as string[]).includes(op);
    }
}
