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
import { Local } from '../../../core/base/Local';
import { FullPosition } from '../../../core/base/Position';
import { ArkAssignStmt, ArkInvokeStmt, Stmt } from '../../../core/base/Stmt';
import {
    AbstractBinopExpr,
    AbstractInvokeExpr,
    ArkConditionExpr,
    ArkDeleteExpr,
    ArkInstanceInvokeExpr,
    ArkNewExpr,
    ArkPtrInvokeExpr,
    ArkStaticInvokeExpr,
    ArkUnopExpr,
    BinaryOperator,
    NormalBinaryOperator,
    RelationalBinaryOperator,
} from '../../../core/base/Expr';
import {
    ArkAggregateExpr,
    ArkArrayTypeTraitExpr,
    ArkCxxCastExpr,
    ArkCxxDeleteArrayExpr,
    ArkCxxFolderExpr,
    ArkCxxInitArrayExpr,
    ArkCxxNewArrayExpr,
    ArkCxxNormalBinOpExpr,
    ArkDesignatedInitExpr,
    ArkNoExpectExpr,
    ArkTypeIdExpr,
    ArkCxxUnaryExpr, Operator,
} from '../base/Expr';
import {
    AliasType,
    AnyType,
    ClassType,
    FunctionType,
    NumberType,
    Type,
    UnclearReferenceType,
    UndefinedType,
    UnknownType,
} from '../../../core/base/Type';
import { CxxArrayType, PointerType, ReferenceType } from '../base/Type';
import { ArkSignatureBuilder } from '../../../core/model/builder/ArkSignatureBuilder';
import { ClassSignature, FieldSignature, MethodSignature } from '../../../core/model/ArkSignature';
import { Value } from '../../../core/base/Value';
import {
    COMPONENT_CREATE_FUNCTION,
    COMPONENT_CUSTOMVIEW,
    COMPONENT_FOR_EACH,
    COMPONENT_LAZY_FOR_EACH,
} from '../../../core/common/EtsConst';
import { CxxValueUtil } from './ValueUtil';
import { IRUtils } from './IRUtils';
import { AbstractFieldRef, ArkArrayRef, ArkInstanceFieldRef, ArkStaticFieldRef } from '../../../core/base/Ref';
import { ArkCxxInstanceFieldRef } from '../base/Ref';
import { ArkMethod } from '../../../core/model/ArkMethod';
import { buildArkMethodFromArkClass, buildDefaultConstructor } from '../model/builder/ArkMethodBuilder';
import { Builtin } from '../../../core/common/Builtin';
import { Constant, NullConstant } from '../../../core/base/Constant';
import { ArkCxxIRTransformer, ValueAndStmts } from './ArkIRTransformer';
import {
    cxxNode2Type,
    isCxxBasicString,
    buildTypeFromPreStr,
    isCxxFunctionPointer,
    isCXXSTLContainer,
    isFuncInClassOrNamespace,
} from '../model/builder/builderUtils';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import { ArkValueTransformer } from '../../../core/common/ArkValueTransformer';
import { ModelUtils } from '../../../core/common/ModelUtils';
import { CONSTRUCTOR_NAME, THIS_NAME } from '../../../core/common/TSConst';
import { TypeInference } from './TypeInference';
import { CxxModelUtils, setTs2CxxFuncMapOfClass } from './ModelUtils';
import { astKind, CxxAstNode, CxxTranslationUnit } from '../ast';
import { DummyStmt } from '../../../core/common/ArkIRTransformer';
import { BuiltinCxx } from './Builtin';
import { ArkClass } from '../../../core/model/ArkClass';
import { ValueUtil } from '../../../core/common/ValueUtil';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkValueTransformer');

enum CompoundBinaryOperator {
    AdditionEquals = '+=',
    SubtractionEquals = '-=',
    MultiplicationEquals = '*=',
    DivisionEquals = '/=',
    RemainderEquals = '%=',
    LeftShiftEquals = '<<=',
    RightShiftEquals = '>>=',
    BitwiseAndEquals = '&=',
    BitwiseOrEquals = '|=',
    BitwiseXorEquals = '^=',
}

/**
 * Get the inner node of an AST node
 *
 * @param node - C++ AST node object
 * @returns Returns the processed C++ AST node, or an unsupported type node if unable to process
 */
function nodeInnerNode(node: CxxAstNode): CxxAstNode {
    if (Array.isArray(node?.inner) && node.inner.length > 0) {
        const last = node.inner[node.inner.length - 1];

        // Return InitListExpr first
        if (last?.kind === astKind.InitListExpr) {
            return last;
        }
        // Arrays containing only one TypeRef node do not return
        if (!(node.inner.length === 1 && node.inner[0]?.kind === astKind.TypeRef) && !isCxxFunctionPointer(node.type.qualType)) {
            return last;
        }
    }
    logger.info(`unsupported node! kind: ${node?.kind ?? ''}, node:`, node);
    return { kind: 'unsupported kind' } as CxxAstNode;
}

const COMPOUND_BIN_OPS = new Set<string>(Object.values(CompoundBinaryOperator));

type TransformerType = {
    [key: string]: (node: CxxAstNode) => ValueAndStmts | null;
};

export class ArkCxxValueTransformer extends ArkValueTransformer {
    private ArkCxxIRTransformer: ArkCxxIRTransformer;
    private readonly cxxSourceFile: CxxTranslationUnit;

    // An object that records the corresponding processing functions of CXX ast nodes.
    private nodeTransformerFuncMap: TransformerType = {
        [astKind.ArraySubscriptExpr]: this.cxxElementAccessExpressionToValueAndStmts,
        [astKind.ArrayTypeTraitExpr]: this.arrayTypeTraitExprToValueAndStmts,
        [astKind.AtomicCallExpr]: this.cxxCallExpressionToValueAndStmts,
        [astKind.BinaryConditionalOperator]: this.cxxConditionalExpressionToValueAndStmts,
        [astKind.CXXRewrittenBinaryOperator]: this.cxxBinaryExpressionToValueAndStmts,
        [astKind.BinaryOperator]: this.cxxBinaryExpressionToValueAndStmts,
        [astKind.BindingDecl]: this.bindingNodeToValueAndStmts,
        [astKind.CallExpr]: this.cxxCallExpressionToValueAndStmts,
        [astKind.CharacterLiteral]: this.cxxLiteralNodeToValueAndStmts,
        [astKind.CompoundAssignOperator]: this.cxxCompoundAssignmentToValueAndStmts,
        [astKind.CompoundLiteralExpr]: this.cxxAggregateToValueAndStmts,
        [astKind.ConditionalOperator]: this.cxxConditionalExpressionToValueAndStmts,
        [astKind.ConstantExpr]: this.processInnerNodeToValueAndStmts,
        [astKind.CXXBindTemporaryExpr]: this.processInnerNodeToValueAndStmts,
        [astKind.CXXBoolLiteralExpr]: this.cxxLiteralNodeToValueAndStmts,
        [astKind.CXXConstCastExpr]: this.castExpressionToValueAndStmts,
        [astKind.CXXConstructExpr]: this.cxxConstructExprToValueAndStmts,
        [astKind.CXXCtorInitializer]: this.cxxCtorInitializerToValueAndStmts,
        [astKind.CXXDeleteExpr]: this.cxxDeleteExpressionToValueAndStmts,
        [astKind.CXXDynamicCastExpr]: this.castExpressionToValueAndStmts,
        [astKind.CXXFoldExpr]: this.cxxFoldExprToValueAndStmts,
        [astKind.CXXFunctionalCastExpr]: this.castExpressionToValueAndStmts,
        [astKind.CXXMemberCallExpr]: this.cxxMemberCallExpressionToValueAndStmts,
        [astKind.CXXNewExpr]: this.cxxNewExpressionToValueAndStmts,
        [astKind.CXXNoexceptExpr]: this.cxxNoexceptExprToValueAndStmts,
        [astKind.CXXNullPtrLiteralExpr]: this.cxxLiteralNodeToValueAndStmts,
        [astKind.CXXOperatorCallExpr]: this.cxxOperatorExpressionToValueAndStmts,
        [astKind.CXXReinterpretCastExpr]: this.castExpressionToValueAndStmts,
        [astKind.CXXScalarValueInitExpr]: this.cxxScalarValueInitToValueAndStmts,
        [astKind.CXXStdInitializerListExpr]: this.processInnerNodeToValueAndStmts,
        [astKind.CXXStaticCastExpr]: this.castExpressionToValueAndStmts,
        [astKind.CXXThisExpr]: this.cxxThisExpressionToValueAndStmts,
        [astKind.CXXTypeidExpr]: this.cxxTypeidExprToValueAndStmts,
        [astKind.CStyleCastExpr]: this.castExpressionToValueAndStmts,
        [astKind.CXXTemporaryObjectExpr]: this.cxxTemporaryObjectExprToValueAndStmts,
        [astKind.DeclRefExpr]: this.declAndTypeRefToValueAndStmts,
        [astKind.DeclStmt]: this.declStmtToValueAndStmts,
        [astKind.DecompositionDecl]: this.bindingNodeToValueAndStmts,
        [astKind.ExprWithCleanups]: this.processInnerNodeToValueAndStmts,
        [astKind.FloatingLiteral]: this.cxxLiteralNodeToValueAndStmts,
        [astKind.ImplicitCastExpr]: this.implicitCastExprToValueAndStmts,
        [astKind.InitListExpr]: this.initListExprToValueAndStmts,
        [astKind.IntegerLiteral]: this.cxxLiteralNodeToValueAndStmts,
        [astKind.LambdaExpr]: this.cxxCallableNodeToValueAndStmts,
        [astKind.MaterializeTemporaryExpr]: this.materializeTemporaryExprToValueAndStmts,
        [astKind.MemberExpr]: this.memberExpressionToValueAndStmts,
        [astKind.MemberRef]: this.memberExpressionToValueAndStmts,
        [astKind.NamespaceRef]: this.cxxNamespaceRefToValueAndStmts,
        [astKind.ParenExpr]: this.processInnerNodeToValueAndStmts,
        [astKind.ParenListExpr]: this.processInnerNodeToValueAndStmts,
        [astKind.RecoveryExpr]: this.RecoverExpressionToValueAndStmts,
        [astKind.StringLiteral]: this.cxxLiteralNodeToValueAndStmts,
        [astKind.TypeRef]: this.declAndTypeRefToValueAndStmts,
        [astKind.UnaryExprOrTypeTraitExpr]: this.unaryExprToValueAndStmts,
        [astKind.UnaryOperator]: this.unaryOperatorToValueAndStmts,
        [astKind.UnexposedExpr]: this.processInnerNodeToValueAndStmts,
        [astKind.UnresolvedLookupExpr]: this.declAndTypeRefToValueAndStmts,
        [astKind.UserDefinedLiteral]: this.userDefinedLiteralToValueAndStmts,
        [astKind.VarDecl]: this.cxxVariableDeclarationToValueAndStmts,
    };


    constructor(arkIRTransformer: ArkCxxIRTransformer, sourceFile: CxxTranslationUnit, declaringMethod: ArkMethod) {
        super(arkIRTransformer, sourceFile as unknown as ts.SourceFile, declaringMethod);
        this.ArkCxxIRTransformer = arkIRTransformer;
        this.cxxSourceFile = sourceFile;
    }


    /**
     *Convert C++AST nodes into a combination of values and statements
     *@ param node - C++AST node to be converted
     *@ returns Objects containing converted values and related statements
     */
    public cxxNodeToValueAndStmts(node: CxxAstNode): ValueAndStmts {
        if (node === undefined) {
            return this.undefinedToValueAndStmts();
        }

        const nodeKind = node.kind;
        if (nodeKind in this.nodeTransformerFuncMap) {
            const valueAndStmts = this.nodeTransformerFuncMap[nodeKind].bind(this)(node);
            if (valueAndStmts) {
                return valueAndStmts;
            }
        }

        return this.unprocessedNodeToValueAndStmts(node);
    }
    /**
     * Convert an unprocessed C++AST node into a combination of values and statements
     * @param aggregate - C++AST node to be converted
     * @returns Objects containing converted values and related statements
     * @throws Error if the node cannot be processed
     * For example:
     *     struct Point q = (struct Point){.x = 5, .y = 8, .name = 'c'};
     *     int* arr = (int[5]){1, 2, 3, 4, 5};
     *     the right value is {},its kind is CompoundLiteralExpr or InitListExpr
    */
    private cxxAggregateToValueAndStmts(aggregate: CxxAstNode): ValueAndStmts {
        const stmts: Stmt[] = [];
        const type = cxxNode2Type(aggregate, this.declaringMethod);
        const typeName = aggregate.type?.qualType ?? 'unknown';
        let classSignature: ClassSignature;
        if (!(type instanceof ClassType)) {
            classSignature = ArkSignatureBuilder.buildClassSignatureFromClassName(typeName);
        } else {
            classSignature = type.getClassSignature();
        }
        const list = aggregate.kind === astKind.InitListExpr ? aggregate : aggregate.inner[aggregate.inner.length - 1];
        let elements: Value[] = [];
        if (list.kind !== astKind.InitListExpr) {
            return this.unprocessedNodeToValueAndStmts(aggregate);
        }
        const aggregateExpr = new ArkAggregateExpr(elements, type);
        const fullPosition = [FullPosition.cxxBuildFromNode(aggregate, this.cxxSourceFile)];
        let {
            value: temp,
            valueOriginalPositions: tempPositions,
            stmts: exprStmts,
        } = this.ArkCxxIRTransformer.generateAssignStmtForValue(aggregateExpr, fullPosition);
        for (let i = 0; i < list.inner.length; i++) {
            if (list.inner[i].kind === astKind.DesignatedInitExpr) {
                // Because the syntax tree does not have fields representing field information,
                // regular matching is used to preserve the information.
                // If there are any changes to the syntax tree, optimization can be made here
                const dotIndex = list.inner[i].code.indexOf('.');
                const equalsIndex = list.inner[i].code.indexOf('=');
                const field = list.inner[i].code.substring(dotIndex + 1, equalsIndex).trim();
                const type = cxxNode2Type(list.inner[i].inner[0], this.declaringMethod);
                const fieldSignature = new FieldSignature(field, classSignature, type, false);
                const init = new ArkCxxInstanceFieldRef(temp as Local, false, fieldSignature);
                const valueAndStmts = this.cxxNodeToValueAndStmts(list.inner[i].inner[0]);
                const designator = valueAndStmts.value;
                stmts.push(...valueAndStmts.stmts);
                const designatedInitExpr = new ArkDesignatedInitExpr(init, designator);
                elements.push(designatedInitExpr);
            } else {
                const valueAndStmts = this.cxxNodeToValueAndStmts(list.inner[i]);
                elements.push(valueAndStmts.value);
                stmts.push(...valueAndStmts.stmts);
            }
        }
        stmts.push(...exprStmts);
        if (typeName === 'napi_property_descriptor') {
            setTs2CxxFuncMapOfClass(elements, false, this.declaringMethod);
        }
        return {
            value: temp,
            valueOriginalPositions: tempPositions,
            stmts: stmts,
        };
    }

    private cxxThisExpressionToValueAndStmts(thisExpression: CxxAstNode): ValueAndStmts {
        return {
            value: this.getThisLocal(),
            valueOriginalPositions: [FullPosition.cxxBuildFromNode(thisExpression, this.cxxSourceFile)],
            stmts: [],
        };
    }

    // Judge whether the current node is related to the lambda function of CPP
    private isNodeRelatedToCXXLambdaFunc(node: CxxAstNode): boolean {
        return node.type?.qualType?.startsWith('(lambda at') || node.inner?.[0]?.kind === astKind.LambdaExpr;
    }

    private isNodeRelatedToImplicitNode(node: CxxAstNode): boolean {
        if (node.inner) {
            return (
                node.inner?.[0]?.kind === astKind.ImplicitCastExpr && (node.name === '__tree_const_iterator')
            );
        }
        return false;
    }

    // Judge whether the child nodes of the current node are materializing temporary variables
    private isNodeRelatedToMaterializeTemporaryExpr(node: CxxAstNode): boolean {
        return node.inner?.[0]?.kind === astKind.MaterializeTemporaryExpr;
    }

    // Check if the child nodes of the current node are member function calls
    private isNodeRelatedToCXXMember(node: CxxAstNode): boolean {
        return (
            (node.inner?.[0]?.kind === astKind.CXXMemberCallExpr) ||
            (node.inner[0].kind === astKind.ImplicitCastExpr && node.inner[0].inner[0] && node.inner[0].inner[0].kind === astKind.CXXMemberCallExpr)
        );
    }

    // Construction of std::pair type
    private isPairConstructExpr(node: CxxAstNode): boolean {
        return node.type.qualType.includes('std::pair');
    }

    // Multi-layer std::pair construction
    private isNodeRelatedToTemporary(node: CxxAstNode): boolean {
        return node.inner?.[0]?.kind === astKind.CXXBindTemporaryExpr && node.code === node.inner[0].code;
    }

    // Expressions that are not new statements (excluding constructors as parameters)
    private isNotNewExpression(newExpression: CxxAstNode): boolean {
        const firstChildKind = newExpression.inner.length > 0 ? newExpression.inner[0].kind : undefined;
        if (!firstChildKind) {
            return false;
        }

        const targetKinds: string[] = [
            astKind.IntegerLiteral,
            astKind.InitListExpr,
            astKind.CompoundLiteralExpr,
            astKind.CXXOperatorCallExpr,
            astKind.BinaryOperator
        ];

        return (
            targetKinds.includes(firstChildKind) ||
            (firstChildKind === astKind.ImplicitCastExpr && !newExpression.inner[0].code.includes('('))
        );
    }

    private isNodeRelatedToCXXFuncCast(node: CxxAstNode): boolean {
        return node.inner[0]?.kind === 'CXXFunctionalCastExpr';
    }

    private undefinedToValueAndStmts(): ValueAndStmts {
        logger.warn(
            'ArkValueTransformer-Cpp NodeToValueAndStmts: node is undefined. Method signature is : ',
            this.declaringMethod?.getSignature()?.toString(),
        );
        return {
            value: new Local('undefined'),
            valueOriginalPositions: [new FullPosition(0, 0, 0, 0)],
            stmts: [],
        };
    }

    private unprocessedNodeToValueAndStmts(node: CxxAstNode): ValueAndStmts {
        logger.warn(`ArkValueTransformer-cxxNodeToValueAndStmts: node '${node.kind}' is not specially processed.`);
        return {
            value: new Local(node.code),
            valueOriginalPositions: [FullPosition.cxxBuildFromNode(node, this.cxxSourceFile)],
            stmts: [],
        };
    }

    private cxxNamespaceRefToValueAndStmts(node: CxxAstNode): ValueAndStmts {
        return {
            value: new Local(node.code),
            valueOriginalPositions: [FullPosition.cxxBuildFromNode(node, this.cxxSourceFile)],
            stmts: [],
        };
    }

    private cxxTemporaryObjectExprToValueAndStmts(node: CxxAstNode): ValueAndStmts {
        // if case: return Vector(x + other.x, y + other.y); ==> In the C++17 standard, a temporary object is no longer created in the return statement,
        // instead, the object is directly constructed at the return value location. Therefore, it is processed here as a ConstructExpr.
        const parentNode = node.getParent?.(false) as CxxAstNode;
        // case: Vector{1,2,3} Implicit call to destructor
        if (parentNode?.dtor?.kind === astKind.CXXDestructorDecl && node.inner.length > 0) {
            return this.cxxConstructExprToValueAndStmts(node.inner[0]);
        }
        if (!parentNode || parentNode.kind !== astKind.ExprWithCleanups && parentNode.kind !== astKind.ReturnStmt) {
            return this.unprocessedNodeToValueAndStmts(node);
        }
        return this.cxxConstructExprToValueAndStmts(node);
    }

    /**
     *Convert the C++construction expression node into a combination of values and statements.
     * The main scenarios are structure and class construction, STL data structure object construction, and thread object construction
     *@ param node - C++AST node, representing the construction expression
     *@ returns ValueAndStmts object, including converted values and related statements
     */
    private cxxConstructExprToValueAndStmts(node: CxxAstNode): ValueAndStmts {
        if (!this.isPairConstructExpr(node) &&
            (this.isNodeRelatedToCXXLambdaFunc(node) ||
            (this.isNodeRelatedToMaterializeTemporaryExpr(node) &&
                (isCxxBasicString(node.type.desugaredQualType ?? ''))) ||
            this.isNodeRelatedToImplicitNode(node)) && node.inner?.length > 0) {
            return this.cxxNodeToValueAndStmts(node.inner[0]);
        }
        return this.cxxNewExpressionToValueAndStmts(node);
    }

    public bindingNodeToValueAndStmts(node: CxxAstNode, yieldValue?: Value): ValueAndStmts {
        const length = node.inner?.length;
        if (length <= 0) {
            return this.unprocessedNodeToValueAndStmts(node);
        }
        const stmts: Stmt[] = [];
        let objectValue: Value;
        let valueOriginalPositions: FullPosition[];
        let innerStmts: Stmt[];
        if (yieldValue !== undefined) {
            // If yieldValue exists, use it as the objectValue
            objectValue = yieldValue;
            valueOriginalPositions = [FullPosition.cxxBuildFromNode(node, this.cxxSourceFile)];
            innerStmts = [];
        } else {
            // If yieldValue does not exist, obtain it by recursively calling cxxNodeToValueAndSTms
            const result = this.cxxNodeToValueAndStmts(node.inner[0]);
            valueOriginalPositions = result.valueOriginalPositions;
            innerStmts = result.stmts;
            const tempVas = this.ArkCxxIRTransformer.generateAssignStmtForValue(result.value, valueOriginalPositions);
            innerStmts.push(...tempVas.stmts);
            objectValue = tempVas.value;
        }
        stmts.push(...innerStmts);
        let index = 0;
        for (let i = 0; i < length; i++) {
            if (node.inner[i].kind !== astKind.BindingDecl) {
                continue;
            }
            const leftValueAndStmts = this.cxxIdentifierToValueAndStmts(node.inner[i]);
            const indexValue = CxxValueUtil.getOrCreateNumberConst(index++);
            const arrayRef = new ArkArrayRef(objectValue as Local, indexValue);
            const assignStmt = new ArkAssignStmt(leftValueAndStmts.value, arrayRef);
            stmts.push(assignStmt);
            valueOriginalPositions = [FullPosition.cxxBuildFromNode(node.inner[i], this.cxxSourceFile)];
        }
        return {
            value: objectValue,
            valueOriginalPositions: valueOriginalPositions,
            stmts: stmts,
        };
    }

    private processInnerNodeToValueAndStmts(node: CxxAstNode): ValueAndStmts {
        if (node.inner?.length > 0) {
            // When a node is an implicit node, the actual node is the last internal node
            return this.cxxNodeToValueAndStmts(node.inner[node.inner?.length - 1]);
        }
        return this.unprocessedNodeToValueAndStmts(node);
    }

    /**
     *Converts an implicit conversion expression node to a combination of values and statements
     *@ param node - C++AST node, representing implicit type conversion expression
     *@ returns ValueAndStmts object, including converted values and related statements
     */
    private implicitCastExprToValueAndStmts(node: CxxAstNode): ValueAndStmts {
        if (node.inner?.length === 1) {
            return this.cxxNodeToValueAndStmts(node.inner[0]);
        }

        node.kind = 'DeclRefExpr';
        node.name = node.code;
        return this.cxxNodeToValueAndStmts(node);
    }

    /**
     *Convert declaration and type reference nodes to collections of values and statements
     *@ param node - C++AST node
     *@ returns ValueAndStmts object, including converted values and related statements
     */
    private declAndTypeRefToValueAndStmts(node: CxxAstNode): ValueAndStmts {
        if (node.inner?.length > 0 && !node.type) {
            return this.cxxNodeToValueAndStmts(node.inner[0]);
        }
        // Handle the scenario: using Color::RED; Color c = RED;
        if (node.referencedDecl?.kind === astKind.EnumConstantDecl && node.inner.length === 0) {
            const typeRefNode = {
                kind: 'TypeRef',
                name: node.referencedDecl!.name,
                code: node.referencedDecl!.name,
                inner: [],
                type: node.referencedDecl!.type,
            } as CxxAstNode;
            node.inner.push(typeRefNode);
            return this.staticMemberExprToValueAndStmts(node);
        }
        // when node.referencedDecl?.kind === astKind.NonTypeTemplateParmDecl ,this value is a const expr
        if (node.referencedDecl?.kind === astKind.NonTypeTemplateParmDecl) {
            return {
                value: CxxValueUtil.createCompileConst(node.name, cxxNode2Type(node, this.declaringMethod)),
                valueOriginalPositions: [],
                stmts: [],
            };
        }

        // Handle the invocation of static members of a class, such as A::a
        if (node.code?.includes('::') && node.inner.length > 0 &&
            (node.inner[0]?.kind === astKind.TypeRef || node.inner[0]?.kind === astKind.NamespaceRef && node.inner[0]?.name !== BuiltinCxx.CXXSTD)) {
            return this.staticMemberExprToValueAndStmts(node);
        }
        return this.cxxIdentifierToValueAndStmts(node);
    }

    private staticMemberExprToValueAndStmts(declRefExpr: CxxAstNode): ValueAndStmts {
        declRefExpr.kind = astKind.MemberExpr; // Replace the type with "member invocation"
        return this.memberExpressionToValueAndStmts(declRefExpr);
    }

    private materializeTemporaryExprToValueAndStmts(node: CxxAstNode): ValueAndStmts {
        if (
            this.isNotNewExpression(node) ||
            this.isNodeRelatedToCXXLambdaFunc(node) ||
            this.isNodeRelatedToCXXMember(node) ||
            this.isNodeRelatedToTemporary(node) ||
            this.isNodeRelatedToCXXFuncCast(node)
        ) {
            return this.cxxNodeToValueAndStmts(node.inner[0]);
        }
        return this.cxxNewExpressionToValueAndStmts(node);
    }

    /**
     *Initialize a list expression into a collection of values and statements
     *@ param node - C++abstract syntax tree node
     *@ returns ValueAndStmts object, including converted values and related statements
     */
    private initListExprToValueAndStmts(node: CxxAstNode): ValueAndStmts {
        if ((node.type?.qualType?.includes('[') && node.type.qualType.includes(']')) || node.type.qualType === 'void') {
            return this.cxxArrayLiteralExpressionToValueAndStmts(node);
        }
        let pNode = (node.parent ?? node.getParent?.(true)) ?? null;
        if (
            pNode && pNode?.inner?.length > 0 &&
            (pNode.inner[0]?.kind === astKind.TypeRef || !node.type.qualType.includes('[') || cxxNode2Type(node, this.declaringMethod) instanceof ClassType)
        ) {
            try {
                return this.cxxAggregateToValueAndStmts(node);
            } catch (error) {
                logger.error(`Error in cxxAggregateToValueAndStmts.`);
                return this.unprocessedNodeToValueAndStmts(node);
            }
        }
        return this.cxxArrayLiteralExpressionToValueAndStmts(node);
    }

    /**
     *Convert the unary operator node into a combination of values and statements
     *@ param node - C++AST node, representing unary operator expression
     *@ returns ValueAndStmts object, including converted values and related statements
     */
    private unaryOperatorToValueAndStmts(node: CxxAstNode): ValueAndStmts {
        if (node.isPostfix) {
            return this.cxxPostfixUnaryExpressionToValueAndStmts(node);
        } else {
            return this.cxxPrefixUnaryExpressionToValueAndStmts(node);
        }
    }

    // expression with either a type or (unevaluated) expression operand.
    // Used for sizeof/alignof (C99 6.5.3.4) and vec_step (OpenCL 1.1 6.11.12).
    private unaryExprToValueAndStmts(unaryExprNode: CxxAstNode): ValueAndStmts {
        const stmts: Stmt[] = [];
        let unaryValue: Value | Type;
        const operatorString = unaryExprNode.name ?? '';
        let operator:Operator;
        switch (operatorString) {
            case Operator.sizeof:
                operator = Operator.sizeof;
                break;
            case Operator.alignof:
                operator = Operator.alignof;
                break;
            default:
                operator = Operator.Unknown;
                logger.warn(`Unsupported unary operator: ${operatorString}`);
        }
        let operpositions: FullPosition[] = [FullPosition.cxxBuildFromNode(unaryExprNode, this.cxxSourceFile)];
        if (unaryExprNode.inner.length > 0) {
            let { value: innerValue, valueOriginalPositions: innerPositions, stmts: innerStmts } =
                this.cxxNodeToValueAndStmts(unaryExprNode.inner[0]);
            unaryValue = innerValue;
            stmts.push(...innerStmts);
            operpositions.push(...innerPositions);
        } else {
            const typeNameMatch = unaryExprNode.code.match(/\(([^)]*)\)/);
            const typeName = typeNameMatch ? typeNameMatch[1] : '';
            unaryValue = buildTypeFromPreStr(typeName, unaryExprNode, this.declaringMethod);
        }
        const unaryExpr = new ArkCxxUnaryExpr(operator, unaryValue);
        return {
            value: unaryExpr,
            valueOriginalPositions: operpositions,
            stmts: stmts,
        };
    }

    /**
     *Convert user-defined literals into sets of values and statements
     *The syntax format of user-defined literals is: original value+suffix (for example: 123_km, "hello" _s, 'a' _s)
     *
     *@ param userDefinedLiteral - AST node of user-defined literal
     *@ returns The ValueAndStmts object containing the converted value and related statements
     */
    private userDefinedLiteralToValueAndStmts(userDefinedLiteral: CxxAstNode): ValueAndStmts {
        // The syntax for user-defined literals is: raw value + suffix (e.g., 123_km, "hello"_s, 'a'_s)
        if (userDefinedLiteral.inner?.length < 2) {
            return this.unprocessedNodeToValueAndStmts(userDefinedLiteral);
        }
        const stmts: Stmt[] = [];
        const literalStr = this.getOverloadOpName(userDefinedLiteral).replace('operator""', '');
        const argNode = userDefinedLiteral.inner[1];
        argNode.code = argNode.code.replace(literalStr, ''); // Get the primitive value (e.g., 123, 'a')
        return this.buildValueAndStmtsForMemberCall(stmts, userDefinedLiteral.inner[0], [argNode], userDefinedLiteral, undefined);
    }

    /**
     *Convert the C++constructor initialization list node to a collection of values and statements
     *  1. C++uses the initialization list to initialize class member variables: Base (char pname): name (pname) {...}.
     *         The final effect is similar to this ->name=pname, which is also processed as an assignment here
     *  2. using parent::parent， The constructor of the subclass calls the constructor inherited from the parent class
     *@ param cxxCtorInitializer C++constructor initializes list nodes
     *@ returns An object containing a collection of values and statements
     */
    private cxxCtorInitializerToValueAndStmts(cxxCtorInitializer: CxxAstNode): ValueAndStmts {
        if (!cxxCtorInitializer.inner || cxxCtorInitializer.inner.length === 0) {
            return this.unprocessedNodeToValueAndStmts(cxxCtorInitializer);
        }
        const firstInnerNode = cxxCtorInitializer.inner[0];
        if (firstInnerNode.kind === astKind.CXXInheritedCtorInitExpr) {
            // Processing of using parent:: parent
            return this.cxxInheritedCtorInitExprToValueAndStmts(firstInnerNode);
        } else if (firstInnerNode.kind === astKind.CXXConstructExpr && cxxCtorInitializer.baseInit) {
            // Processing of case: Left(const char& name) : Base(name) // call base class constructor
            return this.cxxSuperExpressionToValueAndStmts(firstInnerNode);
        }
        // If the kind of firstNode is CXXConstructExpr and firstNode does not correspond to a parent class initialization call,
        // it is equivalent to directly assigning a value to the class member.
        // For example, the constructor of class Circle in file 'tests/cppResources/exports/crossFileCase/include/myHeader.h'.
        const assignRight =
            (firstInnerNode.kind === astKind.CXXConstructExpr && firstInnerNode.inner.length > 0) ? firstInnerNode.inner[0] : firstInnerNode;
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
        const initType = cxxNode2Type(CtorInit2ThisMemberExpr as CxxAstNode, undefined);
        return this.cxxAssignmentToValueAndStmts(CtorInit2ThisMemberExpr as CxxAstNode, assignRight, false, false, initType, true);
    }

    /**
     *Convert the C++inheritance constructor initialization expression to a collection of values and statements
     * Using parent:: parent==>The constructor of the sub——class calls the constructor inherited from the parent
     * class==>The same as calling the constructor of the parent class directly
     *@ param cxxInheritedCtorInitExpr - C++inheritance constructor initialization expression node
     *@ returns The object containing the converted value and statement array
     */
    private cxxInheritedCtorInitExprToValueAndStmts(cxxInheritedCtorInitExpr: CxxAstNode): ValueAndStmts {
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
            valueOriginalPositions: [FullPosition.cxxBuildFromNode(cxxInheritedCtorInitExpr, this.cxxSourceFile)],
            stmts: [],
        };
    }

    /**
     *Convert super expression in C++to IR
     * C++subclasses call the parent class constructor for initialization,
     * similar to ts super (xx). For example, Left (const char&name, int power): Base (name) {...}
     *@ param cxxConstructExpr C++construction expression node
     *@ returns The ValueAndStmts object containing the converted value and related statements
     */
    private cxxSuperExpressionToValueAndStmts(cxxConstructExpr: CxxAstNode): ValueAndStmts {
        const cls = this.declaringMethod.getDeclaringArkClass();
        if (!cls) {
            return this.cxxNewExpressionToValueAndStmts(cxxConstructExpr);
        }
        const clsInitMtd = cls.getInstanceInitMethod();
        if (!clsInitMtd) {
            return this.cxxNewExpressionToValueAndStmts(cxxConstructExpr);
        }
        const stmts: Stmt[] = [];
        const { args: argValues } = this.cxxParseArguments(stmts, cxxConstructExpr.inner);
        const superClass = cls.getHeritageClass(cxxConstructExpr.type.qualType ?? '');
        if (!superClass) {
            return this.cxxNewExpressionToValueAndStmts(cxxConstructExpr);
        }
        buildDefaultConstructor(superClass);
        const superConstructor = superClass.getMethodWithName(CONSTRUCTOR_NAME);
        if (superConstructor !== null) {
            let base = clsInitMtd.getBody()?.getLocals().get(THIS_NAME);
            if (base === undefined) {
                return this.cxxNewExpressionToValueAndStmts(cxxConstructExpr);
            }
            const newSuperInvokeExpr = new ArkInstanceInvokeExpr(base, superConstructor.getSignature(), argValues);
            return {
                value: newSuperInvokeExpr,
                valueOriginalPositions: [FullPosition.cxxBuildFromNode(cxxConstructExpr, this.cxxSourceFile)],
                stmts: [],
            };
        }
        return this.cxxNewExpressionToValueAndStmts(cxxConstructExpr);
    }

    /**
     *Convert array type characteristic expression to IR
     * ArrayTypeTraitExpr is processed by function call
     *@ param ArrayTypeTraitExpr - C++AST node, representing array type characteristic expression
     *@ returns ValueAndStmts object, including converted values and related statements
     */
    private arrayTypeTraitExprToValueAndStmts(ArrayTypeTraitExpr: CxxAstNode): ValueAndStmts {
        const stmts: Stmt[] = [];
        let dimensionSizes: number[] = [];
        let op: Value | null = null;
        for (let i = 0; i < ArrayTypeTraitExpr.inner.length; i++) {
            if (ArrayTypeTraitExpr.inner[i].kind === astKind.IntegerLiteral) {
                dimensionSizes.push(Number(ArrayTypeTraitExpr.inner[i].value));
            } else if (ArrayTypeTraitExpr.inner[i].kind === astKind.DeclRefExpr) {
                const innerValueAndStmts = this.cxxNodeToValueAndStmts(ArrayTypeTraitExpr.inner[i]);
                op = innerValueAndStmts.value;
                stmts.push(...innerValueAndStmts.stmts);
            }
        }
        const arrayRankExpr = new ArkArrayTypeTraitExpr(dimensionSizes, op);
        return {
            value: arrayRankExpr,
            valueOriginalPositions: [FullPosition.cxxBuildFromNode(ArrayTypeTraitExpr, this.cxxSourceFile)],
            stmts: stmts,
        };
    }

    /**
     * Convert C++typeid expression to IR, And CXXTypeidExpr is processed by function call.
     *@ param CXXTypeidExpr - typeid expression node in C++AST
     *@ returns Objects containing converted values and related statements
     */
    private cxxTypeidExprToValueAndStmts(CXXTypeidExpr: CxxAstNode): ValueAndStmts {
        const stmts: Stmt[] = [];
        let typeValue: Value;
        // [1.typeid's inner.length is 0 or 2, then the type name is passed in; 2. std:: Type refers to the type in the namespace]==>
        // Parameter function call to construct the string corresponding to the type into the parameter
        if (CXXTypeidExpr.inner.length === 0) {
            const innerType = cxxNode2Type(CXXTypeidExpr, undefined, undefined);
            typeValue = new Local(innerType.toString(), innerType);
        } else {
            let innerValueAndStmts = this.cxxNodeToValueAndStmts(CXXTypeidExpr.inner[0]);
            stmts.push(...innerValueAndStmts.stmts);
            typeValue = innerValueAndStmts.value;
        }
        const typeIdExpr = new ArkTypeIdExpr(typeValue);
        return {
            value: typeIdExpr,
            valueOriginalPositions: [FullPosition.cxxBuildFromNode(CXXTypeidExpr, this.cxxSourceFile)],
            stmts: stmts,
        };
    }

    /**
     *Convert the noexcept expression of C++syntax tree to IR
     *@ param CXXNoexceptExpr - AST node representing C++noexcept expression
     *@ returns Objects containing converted values and related statements
     */
    private cxxNoexceptExprToValueAndStmts(CXXNoexceptExpr: CxxAstNode): ValueAndStmts {
        const stmts: Stmt[] = [];
        let innerValueAndStmts = this.cxxNodeToValueAndStmts(CXXNoexceptExpr.inner[0]);
        stmts.push(...innerValueAndStmts.stmts);
        const noExpectExpr = new ArkNoExpectExpr(innerValueAndStmts.value);
        return {
            value: noExpectExpr,
            valueOriginalPositions: [FullPosition.cxxBuildFromNode(CXXNoexceptExpr, this.cxxSourceFile)],
            stmts: stmts,
        };
    }

    /**
     *Process the C++scalar value initialization expression and convert it to IR
     *@ param CXXScalarValueInitExpr - C++abstract syntax tree node, representing scalar value initialization expression
     *@ returns an object containing initialization values and related statements. If it cannot be processed, it returns null
     */
    private cxxScalarValueInitToValueAndStmts(CXXScalarValueInitExpr: CxxAstNode): ValueAndStmts | null {
        const initType = CXXScalarValueInitExpr.type.qualType;
        let constant: Constant | null = null;
        switch (initType) {
            case 'int':
                constant = CxxValueUtil.getOrCreateNumberConst(parseFloat('0'));
                break;
            case 'float':
            case 'double':
                constant = CxxValueUtil.getOrCreateNumberConst(parseFloat('0.0'));
                break;
            case 'char':
                constant = CxxValueUtil.createStringConst('');
                break;
            default:
                logger.warn(`The initType of ast node "CXXScalarValueInitExpr" is ${initType}, maybe it is not literalNode or is not processed`);
        }
        if (constant === null) {
            return null;
        }
        return {
            value: constant,
            valueOriginalPositions: [FullPosition.cxxBuildFromNode(CXXScalarValueInitExpr, this.cxxSourceFile)],
            stmts: [],
        };
    }

    /**
     *Convert C++delete expression to IR
     *@ param deleteExpression - C++AST node, representing delete expression
     *@ returns The object containing the converted value and statement array
     */
    private cxxDeleteExpressionToValueAndStmts(deleteExpression: CxxAstNode): ValueAndStmts {
        const {
            value: exprValue,
            valueOriginalPositions: exprPositions,
            stmts: stmts,
        } = this.cxxNodeToValueAndStmts(deleteExpression.inner[0]);
        const isArray = deleteExpression.isArray;
        const deleteExpr = isArray ? new ArkCxxDeleteArrayExpr(exprValue) : new ArkDeleteExpr(exprValue);
        const deleteExprPosition = [FullPosition.cxxBuildFromNode(deleteExpression, this.cxxSourceFile), ...exprPositions];
        return { value: deleteExpr, valueOriginalPositions: deleteExprPosition, stmts: stmts };
    }

    /**
     *Convert C++type conversion expression to IR
     *@ param castExpression C++AST node, representing type conversion expression
     *@ returns ValueAndStmts object, including converted values, original location information and related statements
     */
    private castExpressionToValueAndStmts(castExpression: CxxAstNode): ValueAndStmts {
        const stmts: Stmt[] = [];
        let {
            value: exprValue,
            valueOriginalPositions: exprPositions,
            stmts: exprStmts,
        } = this.cxxNodeToValueAndStmts(castExpression.inner[castExpression.inner.length - 1]);
        stmts.push(...exprStmts);
        if (IRUtils.moreThanOneAddress(exprValue)) {
            ({
                value: exprValue,
                valueOriginalPositions: exprPositions,
                stmts: exprStmts,
            } = this.ArkCxxIRTransformer.generateAssignStmtForValue(exprValue, exprPositions));
            stmts.push(...exprStmts);
        }
        const castType = castExpression.kind;
        const castExpr = new ArkCxxCastExpr(exprValue, cxxNode2Type(castExpression, this.declaringMethod), castType);
        const castExprPosition = [FullPosition.cxxBuildFromNode(castExpression, this.cxxSourceFile), ...exprPositions];
        return { value: castExpr, valueOriginalPositions: castExprPosition, stmts: stmts };
    }

    private cxxFoldExprToValueAndStmts(CXXFoldExpr: CxxAstNode): ValueAndStmts {
        const stmts: Stmt[] = [];
        let {
            value: exprValue,
            valueOriginalPositions: exprPositions,
            stmts: exprStmts,
        } = this.cxxNodeToValueAndStmts(CXXFoldExpr.inner[CXXFoldExpr.inner.length - 1]);
        stmts.push(...exprStmts);
        if (IRUtils.moreThanOneAddress(exprValue)) {
            ({
                value: exprValue,
                valueOriginalPositions: exprPositions,
                stmts: exprStmts,
            } = this.ArkCxxIRTransformer.generateAssignStmtForValue(exprValue, exprPositions));
            stmts.push(...exprStmts);
        }
        const foldOp = CXXFoldExpr.op ?? ' ';
        const folderExpr = new ArkCxxFolderExpr(exprValue, foldOp);
        const folderExprPosition = [FullPosition.cxxBuildFromNode(CXXFoldExpr, this.cxxSourceFile), ...exprPositions];
        return { value: folderExpr, valueOriginalPositions: folderExprPosition, stmts: stmts };

    }

    /**
     *Convert C++conditional expression to IR
     *@ param conditionalExpression - C++AST node, representing conditional expression
     *@ returns ValueAndStmts object, including converted values, original location information and related statements
     */
    private cxxConditionalExpressionToValueAndStmts(conditionalExpression: CxxAstNode): ValueAndStmts {
        // Starting from 0 to access internal nodes
        let InnerIdx = 0;
        const stmts: Stmt[] = [];
        const currConditionalOperatorIndex = this.conditionalOperatorNo++;
        // Peel off 'ImplicitCastExpr'
        const conditionNode = conditionalExpression.inner[InnerIdx].kind === astKind.ImplicitCastExpr ?
            conditionalExpression.inner[InnerIdx].inner[0] : conditionalExpression.inner[InnerIdx];
        let conditionExpr: Value | undefined;
        const context = { conditionExpr: conditionExpr };
        const ifStmts = this.ArkCxxIRTransformer.cxxIfStatementToStmts(conditionNode, 0, context);
        stmts.push(...ifStmts);
        let isBooleanExpr = conditionNode.type.qualType === 'bool';
        stmts.push(new DummyStmt(ArkCxxIRTransformer.DUMMY_CONDITIONAL_OPERATOR_IF_TRUE_STMT + currConditionalOperatorIndex));
        // inner[1] is a value whose expression is true
        InnerIdx++;
        let whenTrueValueAndStmts: ValueAndStmts;
        if (conditionalExpression.kind === astKind.ConditionalOperator) {
            whenTrueValueAndStmts = this.cxxNodeToValueAndStmts(conditionalExpression.inner[InnerIdx]);
            // else kind is BinaryConditionalOperator,No need to parse the node again, the result of the judgment is its value
        } else {
            whenTrueValueAndStmts = {
                value: isBooleanExpr ? CxxValueUtil.getOrCreateNumberConst(1) : (context.conditionExpr! as ArkConditionExpr).getOp1(),
                stmts: [],
                valueOriginalPositions: [],
            };
        }
        stmts.push(...whenTrueValueAndStmts.stmts);
        const resultLocal = this.generateTempLocal();
        const assignStmtWhenTrue = new ArkAssignStmt(resultLocal, whenTrueValueAndStmts.value);
        const resultLocalPosition: FullPosition[] = [whenTrueValueAndStmts.valueOriginalPositions[0]];
        assignStmtWhenTrue.setOperandOriginalPositions([...resultLocalPosition, ...whenTrueValueAndStmts.valueOriginalPositions]);
        stmts.push(assignStmtWhenTrue);


        stmts.push(new DummyStmt(ArkCxxIRTransformer.DUMMY_CONDITIONAL_OPERATOR_IF_FALSE_STMT + currConditionalOperatorIndex));
        // The last internal node is the value when the expression is false
        InnerIdx = conditionalExpression.inner.length - 1;
        const { value: whenFalseValue, valueOriginalPositions: whenFalsePositions, stmts: whenFalseStmts } =
            this.cxxNodeToValueAndStmts(conditionalExpression.inner[InnerIdx]);
        stmts.push(...whenFalseStmts);
        const assignStmt = new ArkAssignStmt(resultLocal, whenFalseValue);
        assignStmt.setOperandOriginalPositions([...resultLocalPosition, ...whenFalsePositions]);
        stmts.push(assignStmt);
        stmts.push(new DummyStmt(ArkCxxIRTransformer.DUMMY_CONDITIONAL_OPERATOR_END_STMT + currConditionalOperatorIndex));
        return {
            value: resultLocal,
            valueOriginalPositions: resultLocalPosition,
            stmts: stmts,
        };
    }

    /**
     *Extract the calling node and parameter node from the internal AST node array for overwriting
     *@ param innerAsNodes An AST node array containing call information and parameters. The first element is the call node, and the rest are parameter nodes
     *@ returns an array containing two elements: the first element is the call node, and the second element is the parameter node array
     */
    private getArgumentNodeForRecover(innerAsNodes: CxxAstNode[]): [CxxAstNode | undefined, CxxAstNode[]] {
        const [callNode, ...argumentNodes] = innerAsNodes;
        return [callNode, argumentNodes];
    }


    private getArgumentNode(innerAstNodes: CxxAstNode[] | CxxAstNode): [call: CxxAstNode | undefined, args: CxxAstNode[]] {
        // At this time, innerAstNode is a separate point
        if (!Array.isArray(innerAstNodes)) {
            const firstInner = innerAstNodes.inner?.[0];
            if (!firstInner) {
                return [undefined, []];
            }
            const call = this.getDeclRef(firstInner) as CxxAstNode;
            const args = (innerAstNodes.inner?.slice(1) ?? [])
                .map(n => this.getDeclRef(n) as CxxAstNode);
            return [call, args];
        }
        // Several callable kinds
        const CALLABLE_KINDS = new Set<string>([
            astKind.DeclRefExpr,
            astKind.MemberExpr,
            astKind.OverloadedDeclRef,
            astKind.ArraySubscriptExpr,
            astKind.CXXOperatorCallExpr,
            astKind.UnresolvedLookupExpr,
        ]);

        function unwrapImplicit(n?: CxxAstNode): CxxAstNode | undefined {
            while (n && n.kind === astKind.ImplicitCastExpr) {
                n = n.inner?.[0];
            }
            return n;
        }

        let callNode: CxxAstNode | undefined;
        const argumentNodes: CxxAstNode[] = [];
        for (let i = 0; i < innerAstNodes.length; i++) {
            const node = innerAstNodes[i];
            if (i === 0) {
                const first = unwrapImplicit(node);
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

    private getDeclRef(astNode: CxxAstNode): CxxAstNode | undefined {
        let n: CxxAstNode | undefined = astNode;
        while (n) {
            if (n.kind === astKind.DeclRefExpr) {
                return n;
            }
            // No child node or empty child node, end
            if (!n.inner || n.inner.length === 0) {
                break;
            }
            // Go down the first child node
            n = n.inner[0];
        }
        return undefined;
    }

    private cxxGenerateSystemComponentStmt(
        componentName: string,
        args: Value[],
        argPositionsAllFlat: FullPosition[],
        componentExpression: CxxAstNode,
        currStmts: Stmt[],
    ): ValueAndStmts {
        const stmts: Stmt[] = [...currStmts];
        const componentExpressionPosition = FullPosition.cxxBuildFromNode(componentExpression, this.cxxSourceFile);
        const {
            value: componentValue,
            valueOriginalPositions: componentPositions,
            stmts: componentStmts,
        } = this.cxxGenerateComponentCreationStmts(componentName, args, componentExpressionPosition, argPositionsAllFlat);
        stmts.push(...componentStmts);

        stmts.push(this.generateComponentPopStmts(componentName, componentExpressionPosition));
        return {
            value: componentValue,
            valueOriginalPositions: componentPositions,
            stmts: stmts,
        };
    }

    private cxxGenerateCustomViewStmt(
        componentName: string,
        args: Value[],
        argPositionsAllFlat: FullPosition[],
        componentExpression: CxxAstNode,
        currStmts: Stmt[],
    ): ValueAndStmts {
        const stmts: Stmt[] = [...currStmts];
        const componentExpressionPosition = FullPosition.cxxBuildFromNode(componentExpression, this.cxxSourceFile);
        const classSignature = ArkSignatureBuilder.buildClassSignatureFromClassName(componentName);
        const classType = new ClassType(classSignature);
        const newExpr = new ArkNewExpr(classType);
        const {
            value: newExprLocal,
            valueOriginalPositions: newExprPositions,
            stmts: newExprStmts,
        } = this.ArkCxxIRTransformer.generateAssignStmtForValue(newExpr, [componentExpressionPosition]);
        stmts.push(...newExprStmts);
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
        } = this.cxxGenerateComponentCreationStmts(COMPONENT_CUSTOMVIEW, createViewArgs, componentExpressionPosition, createViewArgPositionsAll.flat());
        stmts.push(...componentStmts);
        stmts.push(this.generateComponentPopStmts(COMPONENT_CUSTOMVIEW, componentExpressionPosition));
        return {
            value: componentValue,
            valueOriginalPositions: componentPositions,
            stmts: stmts,
        };
    }

    private cxxGenerateComponentCreationStmts(
        componentName: string,
        createArgs: Value[],
        componentExpressionPosition: FullPosition,
        createArgsPositionsAllFlat: FullPosition[],
    ): ValueAndStmts {
        const createMethodSignature = ArkSignatureBuilder.buildMethodSignatureFromClassNameAndMethodName(componentName, COMPONENT_CREATE_FUNCTION);
        const createInvokeExpr = new ArkStaticInvokeExpr(createMethodSignature, createArgs);
        const createInvokeExprPositions = [componentExpressionPosition, ...createArgsPositionsAllFlat];
        const {
            value: componentValue,
            valueOriginalPositions: componentPositions,
            stmts: componentStmts,
        } = this.ArkCxxIRTransformer.generateAssignStmtForValue(createInvokeExpr, createInvokeExprPositions);
        return {
            value: componentValue,
            valueOriginalPositions: componentPositions,
            stmts: componentStmts,
        };
    }

    /**
     *Convert C++identifiers to collections of values and statements
     *@ param identifier C++AST node identifier
     *@ param variableDefFlag Optional variable definition flag, used to distinguish variable declaration from variable use
     *@ returns Objects containing values, location information and statement arrays
     */
    private cxxIdentifierToValueAndStmts(identifier: CxxAstNode, variableDefFlag?: boolean): ValueAndStmts {
        let identifierValue: Value;
        let identifierPositions = [FullPosition.cxxBuildFromNode(identifier, this.cxxSourceFile)];
        let varNode: CxxAstNode;
        if (identifier.referencedDecl) {
            varNode = identifier.referencedDecl as CxxAstNode;
        } else {
            varNode = identifier;
        }
        let varName = varNode.kind === astKind.TypeRef ? varNode.code : varNode.name;
        const varType = cxxNode2Type(identifier, this.declaringMethod);
        if (varName === UndefinedType.getInstance().getName()) {
            identifierValue = CxxValueUtil.getUndefinedConst();
        } else {
            if (variableDefFlag) {
                identifierValue = this.addNewLocal(varName, varType);
            } else {
                if (identifier.name?.includes('::' + varName + '<')) { // Determine whether it is a variable template
                    varName = identifier.name;
                }
                identifierValue = this.getOrCreateLocal(varName, varType);
            }
        }
        return {
            value: identifierValue,
            valueOriginalPositions: identifierPositions,
            stmts: [],
        };
    }

    /**
     *Convert the member expression of C++(such as testMap. insert) to ValueAndStmts of Ark IR
     *@ param memberExpression - shaped like an AST MemberExpr/MemberRef node, which usually means obj. field or obj ->field
     *@ param localValue - (Optional) The scenario where the baseValue is specified directly (
     *  such as determining the base in advance when resolving the parent node)
     */
    private memberExpressionToValueAndStmts(memberExpression: CxxAstNode, localValue?: Value): ValueAndStmts {
        const stmts: Stmt[] = [];
        // [Scenario 1] Process this ->field or this ->method calls in C++code
        // If it's a class member reference (MemberExpr/MemberRef) but has no inner[0], it means implicit this, need to supplement this node
        if ((memberExpression.kind === astKind.MemberExpr || memberExpression.kind === astKind.MemberRef) && memberExpression.inner[0] === undefined) {
            memberExpression.inner[0] = {
                kind: 'CXXThisExpr', // Convert to explicit this pointer
                name: memberExpression.name,
                code: '',
                type: { qualType: 'void' },
                inner: [],
            }; //  As base node
        }
        // [Scenario 2] Recursively process base object, such as testMap in testMap.insert
        //  Get baseValue (e.g., testMap), position information, and possible preceding statements (e.g., auto tmp = ...;)
        let {
            value: baseValue,
            valueOriginalPositions: basePositions,
            stmts: baseStmts,
        } = this.cxxNodeToValueAndStmts(memberExpression.inner[0]);
        // [Scenario 3] Processing chained member access, such as a.b.c or (* ptr). field
        // If the base is a member access, generate an assignment statement to ensure the validity of SSA
        if (memberExpression.inner[0]?.kind === astKind.MemberExpr || memberExpression.kind === astKind.MemberRef) {
            ({ value: baseValue, valueOriginalPositions: basePositions, stmts: baseStmts } =
                this.ArkCxxIRTransformer.generateAssignStmtForValue(baseValue, basePositions));
        }
        // [Scenario 4] On special occasions, the caller directly specifies the baseValue (generally used to replace the base,
        // such as virtual members, generics, etc.)
        if (localValue) {
            baseValue = localValue;
        }
        // Combine preceding statements to ensure complete order
        stmts.push(...baseStmts);
        // [Scenario 5] Get the member's field signature
        // The purpose is to associate the insert in testMap.insert with the base type (such as the type of testMap) to form a complete field signature
        const fieldSignature = this.buildFieldSignatureFromMemberExpr(baseValue, memberExpression);
        // [Scenario 6] Generate the field reference object of IR layer (such as testMap. insert)
        let fieldRef: ArkCxxInstanceFieldRef | ArkStaticFieldRef;
        if (memberExpression.referencedDecl?.kind === astKind.EnumConstantDecl) {
            fieldRef = new ArkStaticFieldRef(fieldSignature);
        } else {
            fieldRef = new ArkCxxInstanceFieldRef(
                baseValue as Local, // baseValue（eg: testMap）
                memberExpression.isArrow ?? false, // Whether it is arrow access (->)
                fieldSignature, // Field signature (such as insert)
            );
        }
        // Record node location information for subsequent traceability and debugging
        const fieldRefPositions = [FullPosition.cxxBuildFromNode(memberExpression, this.cxxSourceFile), ...basePositions];
        // Return resolution results, including IR field references, location information, and related SSA statements
        return { value: fieldRef, valueOriginalPositions: fieldRefPositions, stmts: stmts };
    }

    private buildFieldSignatureFromMemberExpr(baseValue: Value, memberExpression: CxxAstNode): FieldSignature {
        let fieldSignature: FieldSignature;
        const memberName = memberExpression.referencedDecl?.name || memberExpression.name || memberExpression.code;
        // ==Scenarios for Special Handling of Enum Members==
        if (memberExpression.referencedDecl?.kind === astKind.EnumConstantDecl) {
            const enumClassName = memberExpression.type.qualType.replace('enum', '').trim();
            const enumArkClass = CxxModelUtils.findSymbolInFileWithName(enumClassName, this.declaringMethod.getDeclaringArkClass());
            const enumSignature =
                (enumArkClass instanceof ArkClass) ?
                    enumArkClass.getSignature() :
                    ArkSignatureBuilder.buildClassSignatureFromClassName(enumClassName);
            return new FieldSignature(memberName, enumSignature, enumSignature.getType(), true);
        }
        // ==Handling common scenarios==
        let baseType = baseValue.getType();
        if (baseValue instanceof ArkArrayRef) {
            let arrayBaseType = TypeInference.replaceTypeWithReal(baseValue.getBase().getType());
            if (arrayBaseType instanceof CxxArrayType) {
                baseType = arrayBaseType.getBaseType();
            }
        }
        let baseClassType: ClassType | null = null;
        // Judge whether the base is a class type or its pointer/reference
        if (baseType instanceof ClassType) {
            baseClassType = baseType as ClassType;
        } else if (baseType instanceof PointerType && (baseType as PointerType).getBaseType() instanceof ClassType) {
            baseClassType = (baseType as PointerType).getBaseType() as ClassType;
        } else if (baseType instanceof ReferenceType && (baseType as ReferenceType).getBaseType() instanceof ClassType) {
            baseClassType = (baseType as ReferenceType).getBaseType() as ClassType;
        }
        // Construction field signature
        // If base is a class local variable, use the complete class signature
        if ((baseValue instanceof Local || baseValue instanceof ArkArrayRef) && baseClassType !== null) {
            fieldSignature = new FieldSignature(
                memberName, // Field name (such as insert)
                baseClassType.getClassSignature(), // Base class type signature
                baseType, // baseType as its type
            );
        } else {
            // Otherwise, it is generated only according to the field name
            fieldSignature = ArkSignatureBuilder.buildFieldSignatureFromFieldName(memberName);
        }
        // Set field types to support C++complex type resolution (such as template, pointer, const, etc.)
        fieldSignature.setType(cxxNode2Type(memberExpression, this.declaringMethod));
        return fieldSignature;
    }

    /**
     *Convert element access expressions (such as array [index] or object. field) in C++AST to values and statements in intermediate representation (IR).
     *
     *@ param elementAccessExpression represents the AST node of C++element access expression
     *@ returns contains the generated IR value, original location information and the ValueAndStmts object of related statements
     */
    private cxxElementAccessExpressionToValueAndStmts(elementAccessExpression: CxxAstNode): ValueAndStmts {
        const stmts: Stmt[] = [];
        let {
            value: baseValue,
            valueOriginalPositions: basePositions,
            stmts: baseStmts,
        } = this.cxxNodeToValueAndStmts(elementAccessExpression.inner[0]);
        stmts.push(...baseStmts);
        if (!(baseValue instanceof Local)) {
            ({
                value: baseValue,
                valueOriginalPositions: basePositions,
                stmts: baseStmts,
            } = this.ArkCxxIRTransformer.generateAssignStmtForValue(baseValue, basePositions));
            stmts.push(...baseStmts);
        }
        let {
            value: argumentValue,
            valueOriginalPositions: arguPositions,
            stmts: argumentStmts,
        } = this.cxxNodeToValueAndStmts(elementAccessExpression.inner[1]);
        stmts.push(...argumentStmts);
        if (IRUtils.moreThanOneAddress(argumentValue)) {
            ({
                value: argumentValue,
                valueOriginalPositions: arguPositions,
                stmts: argumentStmts,
            } = this.ArkCxxIRTransformer.generateAssignStmtForValue(argumentValue, arguPositions));
            stmts.push(...argumentStmts);
        }

        let elementAccessExpr: Value;
        if (baseValue.getType() instanceof CxxArrayType || baseValue.getType() instanceof PointerType) {
            elementAccessExpr = new ArkArrayRef(baseValue as Local, argumentValue);
        } else {
            const fieldSignature = ArkSignatureBuilder.buildFieldSignatureFromFieldName(argumentValue.toString());
            elementAccessExpr = new ArkInstanceFieldRef(baseValue as Local, fieldSignature);
        }
        // reserve positions for field name
        const exprPositions = [FullPosition.cxxBuildFromNode(elementAccessExpression, this.cxxSourceFile), ...basePositions, ...arguPositions];
        return {
            value: elementAccessExpr,
            valueOriginalPositions: exprPositions,
            stmts: stmts,
        };
    }

    private cxxCallExpressionToValueAndStmts(callExpression: CxxAstNode): ValueAndStmts {
        if (callExpression.kind === astKind.CallExpr && callExpression.inner?.length > 0) {
            if ((callExpression.parent ?? callExpression.getParent?.(true))?.type?.qualType === 'std::thread') {
                return this.cxxNewExpressionToValueAndStmts(callExpression);
            } else if (callExpression.inner[0].kind === astKind.CXXPseudoDestructorExpression) {
                return this.cxxCallExpressionToValueAndStmts(callExpression.inner[0]);
            } else if (callExpression.name === 'basic_string' || callExpression.inner[0].kind === astKind.MaterializeTemporaryExpr) {
                return this.cxxNodeToValueAndStmts(callExpression.inner[0]);
            }
        }

        const stmts: Stmt[] = [];
        const [callNode, argumentNodes] = this.getArgumentNode(callExpression.inner);

        if (callNode && isFuncInClassOrNamespace(callNode) && callNode.referencedDecl?.name) {
            // Process static function calls
            callNode.kind = 'MemberExpr';
            const replaceFuncName = callNode.referencedDecl.name;
            callNode.name = replaceFuncName;
            const outerName = callNode.code.replace('::' + replaceFuncName, '');
            callNode.inner[0] = {
                kind: 'DeclRefExpr',
                name: outerName,
                code: outerName,
                type: { qualType: outerName },
                inner: [],
            } as CxxAstNode;
            return this.buildValueAndStmtsForMemberCall(stmts, callNode, argumentNodes, callExpression, undefined);
        }
        const argus = this.cxxParseArgumentsOfCallExpression(stmts, argumentNodes, callNode);
        if (callExpression.name === 'napi_define_class') {
            setTs2CxxFuncMapOfClass(argus.args, true, this.declaringMethod);
        }
        const returnType = cxxNode2Type(callExpression, this.declaringMethod);
        return this.cxxGenerateInvokeValueAndStmts(callNode, argus, stmts, callExpression, returnType);
    }

    /**
     *Process the 'cout<<...' or lambda expression in C++, extract its operands and construct corresponding statements and values.
     *
     *@ param callExpression - The currently processed C++AST node, which represents an operator calling expression (such as<<).
     *@ param callArgus - An array used to collect the parameter nodes involved in the expression.
     *@ returns the ValueAndStmts object containing values and statements. If it cannot be processed, it returns null.
     */
    private streamOrLambdaExprToValueAndStmts(callExpression: CxxAstNode, callArgus: CxxAstNode[]): ValueAndStmts | null {
        const stmts: Stmt[] = [];
        // Because inner extracts the last parameters in turn, it traverses the last parameters in reverse order
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
            if (innerNode.kind === astKind.CXXOperatorCallExpr) {
                // Recursive call processing CXXOperatorCallExpr
                if (innerNode.type.qualType !== 'std::ostream') {
                    return this.streamOrLambdaExprToValueAndStmts(innerNode, callArgus);
                }
                // When the type is std:: ostream, it indicates an overloaded stream operator and records the overloaded node of the stream operator
                callArgus.push(innerNode);
                // Recursive call to process CXXOperatorCallExpr nested in the inner of CXXOperatorCallExpr
                if (innerNode.inner[1].kind === astKind.CXXOperatorCallExpr) {
                    return this.streamOrLambdaExprToValueAndStmts(innerNode.inner[1], callArgus);
                }
                // If there is no nested CXXOperatorCallExpr, the ValueAndStmts of overloaded stream operators will be built directly
                return this.buildValueAndStmtsForStreamOrLambdaCall(innerNode.inner[1], callArgus.reverse(), stmts, callExpression);
            }
            while (innerNode.kind === astKind.ImplicitCastExpr && innerNode.valueCategory === 'lvalue' && innerNode.inner.length > 0) {
                innerNode = innerNode.inner[0];
            }
            if (
                innerNode.kind === astKind.DeclRefExpr &&
                (innerNode.type.qualType.includes('iostream') ||
                    innerNode.type.qualType.includes('ostream') ||
                    innerNode.type.qualType.includes('istream') ||
                    innerNode.type.qualType.includes('lambda at'))
            ) {
                // Get DeclRefExpr and its subsequent nodes
                return this.buildValueAndStmtsForStreamOrLambdaCall(innerNode, callArgus.reverse(), stmts, callExpression);
            }
        }
        return null;
    }

    /**
     *Build a collection of values and statements for stream operations or lambda function call
     *
     *@ param streamNode The AST node of the stream node
     *@ param args parameter array of stream operation
     *@ param stmts statement array
     *@ param streamExpr AST node of stream expression
     *@ returns The ValueAndStmts object containing values and statements
     */
    private buildValueAndStmtsForStreamOrLambdaCall(streamNode: CxxAstNode, args: CxxAstNode[], stmts: Stmt[], streamExpr: CxxAstNode): ValueAndStmts {
        let nonOverloadedArgs = [];
        const currValueAndStmts: ValueAndStmts = {
            value: new Local(streamExpr.code),
            valueOriginalPositions: [],
            stmts: [...stmts],
        };
        for (let i = 0; i < args.length; i += 1) {
            let arg = args[i];
            if (arg.kind === astKind.CXXOperatorCallExpr) {
                // Standard stream operator+overloaded stream operator
                // 1. Object of standard stream operator, call std:: stream function
                this.buildValueAndStmtsForStdStreamOrLambdaCall(streamNode, nonOverloadedArgs, streamExpr, currValueAndStmts);
                // 2. Overload the object of the output operator and call the overloaded function
                this.buildValueAndStmtsForOverloadedStream(streamNode, arg, currValueAndStmts);
                nonOverloadedArgs = [];
            } else {
                nonOverloadedArgs.push(arg);
            }
        }
        // process the remaining standard stream operators
        this.buildValueAndStmtsForStdStreamOrLambdaCall(streamNode, nonOverloadedArgs, streamExpr, currValueAndStmts);
        return currValueAndStmts;
    }

    /**
     *Build values and statements of overloaded flow operators
     *@ param streamNode
     *@ param overloadedArg overload parameter node
     *@ param currValueAndStmts Current value and statement collection
     */
    private buildValueAndStmtsForOverloadedStream(streamNode: CxxAstNode, overloadedArg: CxxAstNode, currValueAndStmts: ValueAndStmts): void {
        // Replace the second child node with an overloaded operator node to avoid repeated processing of nested CXXOperatorCallExpr
        overloadedArg.inner[1] = streamNode;
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

    /**
     *Build a collection of values and statements for standard flow or lambda call nodes
     *@ param streamNode - AST node of the stream node
     *@ param nonOverlooadedArgs - non overloaded parameter array
     *@ param streamExpr - AST node of stream expression
     *@ param currValueAndStmts - current value and statement collection object, used to store processing results
     */
    private buildValueAndStmtsForStdStreamOrLambdaCall(streamNode: CxxAstNode, nonOverloadedArgs: CxxAstNode[],
                                           streamExpr: CxxAstNode, currValueAndStmts: ValueAndStmts): void {
        const stmts: Stmt[] = [];
        const argus = this.cxxParseArgumentsOfCallExpression(stmts, nonOverloadedArgs);
        const normalCoutValueAndStmts = this.cxxGenerateInvokeValueAndStmts(streamNode, argus, stmts, streamExpr);
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

    /**
     *Convert C++operator expression to binary operator expression
     *@ param expression - C++AST node, representing operator expression
     *@ returns the converted values and statements
     */
    private CXXOperatorExpressionToBinaryOperator(expression: CxxAstNode): ValueAndStmts {
        let operatorExpression = Object.assign({}, expression);
        operatorExpression.opcode = expression.inner[0].code;
        operatorExpression.inner = [expression.inner[1], expression.inner[2]];
        return this.cxxBinaryExpressionToValueAndStmts(operatorExpression);
    }

    /**
     *Convert C++operator expression to unary operator expression
     *@ param expression - C++AST node, representing operator expression
     *@ returns ValueAndStmts object, including converted values and statements
     */
    private CXXOperatorExpressionToUnaryOperator(expression: CxxAstNode): ValueAndStmts {
        let operatorExpression = Object.assign({}, expression);
        operatorExpression.opcode = expression.inner[0].code;
        operatorExpression.inner = [expression.inner[1]];
        if (expression.code.indexOf(expression.inner[0].code) === 0) {
            return this.cxxPrefixUnaryExpressionToValueAndStmts(operatorExpression);
        }
        return this.cxxPostfixUnaryExpressionToValueAndStmts(operatorExpression);
    }

    /**
     *Convert C++operator expressions to lists of values and statements
     *@ param callExpression - C++AST node, representing the operator expression to be converted
     *@ param layer - Boolean value, which controls whether to process the final output layer. The default value is true
     *@ returns a list of converted values and statements, which may include special operator processing results or array reference expressions
     */
    private cxxOperatorExpressionToValueAndStmts(callExpression: CxxAstNode): ValueAndStmts | null;
    private cxxOperatorExpressionToValueAndStmts(callExpression: CxxAstNode, layer: true): ValueAndStmts | null;
    private cxxOperatorExpressionToValueAndStmts(callExpression: CxxAstNode, layer: false): ValueAndStmts[];
    private cxxOperatorExpressionToValueAndStmts(
        callExpression: CxxAstNode,
        layer: boolean = true
    ): ValueAndStmts | ValueAndStmts[] | null {
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
        const exprPositions = [FullPosition.cxxBuildFromNode(callExpression, this.cxxSourceFile)];
        for (const stmt of innerStmts) {
            exprPositions.push(...stmt.valueOriginalPositions);
        }
        // *ptr,When ptr is a smart pointer and the node type is CXXOperatorCallExpr, we will perform pointer dereference parsing here
        let elementAccessExpr: Value;
        if (innerStmts.length >= 2) {
            elementAccessExpr = new ArkArrayRef(innerStmts[0].value as Local, innerStmts[1].value);
        } else {
            const operatorToken: string = (callExpression.name ?? '').replace('operator', '');
            const operator = ArkCxxIRTransformer.cxxTokenToUnaryOperator(operatorToken);
            if (operator && innerStmts.length > 0) {
                elementAccessExpr = new ArkUnopExpr(innerStmts[0].value, operator);
            } else {
                elementAccessExpr = CxxValueUtil.getUndefinedConst();
            }
        }

        innerStmts.forEach(innerStmt => {
            stmts.push(...innerStmt.stmts);
        });
        return { value: elementAccessExpr, valueOriginalPositions: exprPositions, stmts: stmts };
    }

    /**
     * Handle special operator scenarios and return early if matched
     */
    private handleSpecialOperators(callExpression: CxxAstNode): ValueAndStmts | null {
        // Overloaded operator
        const overloadedOpToValueAndStmts = this.handleOverloadedOp(callExpression);
        if (overloadedOpToValueAndStmts) {
            return overloadedOpToValueAndStmts;
        }
        // operator<< / operator>> and lambda cout scenario
        if (
            (callExpression.inner[0]?.kind === astKind.ImplicitCastExpr && callExpression.inner[0]?.name === 'operator>>') ||
            callExpression.name === 'operator<<' ||
            callExpression.inner[0]?.name === 'operator<<' ||
            callExpression.inner[1]?.type.qualType.toString().includes('(lambda at')) {
            return this.streamOrLambdaExprToValueAndStmts(callExpression, []);
        }

        // Relational binary operator or assignment operator
        if (callExpression.inner[0]?.kind === astKind.ImplicitCastExpr &&
            (ArkCxxValueTransformer.isRelationalBinaryOperator(callExpression.inner[0]?.code) ||
                this.getOverloadOpName(callExpression) === 'operator=')) {
            return this.CXXOperatorExpressionToBinaryOperator(callExpression);
        }

        // Unary operators (++ / --)
        if (callExpression.inner[0]?.kind === astKind.ImplicitCastExpr &&
            ['++', '--', '*'].includes(callExpression.inner[0]?.code)) {
            return this.CXXOperatorExpressionToUnaryOperator(callExpression);
        }

        // Arrow operator (->) in iteration
        if (callExpression.inner[0]?.kind === astKind.ImplicitCastExpr &&
            callExpression.inner[0]?.code === '->') {
            return this.cxxNodeToValueAndStmts(callExpression.inner[1]);
        }
        return null;
    }

    /**
     * Collect ValueAndStmts from each inner node
     */
    private collectInnerOperatorStmts(callExpression: CxxAstNode, innerStmts: ValueAndStmts[]): void {
        for (let innerNode of callExpression.inner) {
            // 将第一组递归表达式类型定义为 string 数组
            const recursiveKinds: string[] = [
                astKind.CXXOperatorCallExpr,
                astKind.MaterializeTemporaryExpr,
                astKind.CXXBindTemporaryExpr,
                astKind.CXXConstructExpr
            ];

            if (
                recursiveKinds.includes(innerNode.kind) ||
                (innerNode.kind === astKind.ImplicitCastExpr && innerNode.castKind !== 'FunctionToPointerDecay')
            ) {
                innerStmts.push(...this.cxxOperatorExpressionToValueAndStmts(innerNode, false));
            } else if (innerNode.kind === astKind.DeclRefExpr) {
                innerStmts.push(this.cxxIdentifierToValueAndStmts(innerNode));
            } else if (innerNode.kind === astKind.IntegerLiteral || innerNode.kind === astKind.StringLiteral) {
                let literalNode = this.cxxLiteralNodeToValueAndStmts(innerNode);
                if (literalNode) {
                    innerStmts.push(literalNode);
                }
            }
        }
    }

    private getOverloadOpName(cxxOperatorCallExpr: CxxAstNode): string {
        return cxxOperatorCallExpr.inner[0]?.inner[0]?.referencedDecl?.name ?? '';
    }

    /**
     *Handling C++overloaded operator call expressions
     *@ param cxxOperatorCallExpr C++AST node, representing operator calling expression
     *@ returns the processed value and statement object. If it cannot be processed, it returns null
     */
    private handleOverloadedOp(cxxOperatorCallExpr: CxxAstNode): ValueAndStmts | null {
        if (cxxOperatorCallExpr.type?.qualType === '' ||
            cxxOperatorCallExpr.inner?.[0]?.castKind !== 'FunctionToPointerDecay') {
            return null;
        }

        // Handling Recursive function, e.g. Case10 in lambdaFuncSample.cpp
        if (cxxOperatorCallExpr.inner?.[1]) {
            let callNode = cxxOperatorCallExpr.inner[1];
            while (callNode.kind === astKind.ImplicitCastExpr && callNode.valueCategory === 'lvalue' && callNode.inner.length > 0) {
                callNode = callNode.inner[0];
            }
            if (callNode.type.qualType.includes('std::function') || this.isNodeRelatedToCXXLambdaFunc(callNode)) {
                return this.buildValueAndStmtsForMemberCall(
                    [], cxxOperatorCallExpr.inner[1], [...cxxOperatorCallExpr.inner.slice(2)], cxxOperatorCallExpr, undefined);
            }
        }

        let callType = cxxNode2Type(cxxOperatorCallExpr, this.declaringMethod);
        if (callType instanceof ReferenceType) {
            callType = callType.getBaseType();
        }
        // Handling overloaded stream operators
        const callTypeStr = callType.toString();
        if (callTypeStr.includes('istream') || callTypeStr.includes('ostream')) {
            return this.buildInvokeValueForOverloadedStreamOp(cxxOperatorCallExpr);
        }
        if (!(callType instanceof ClassType)) {
            return null;
        }
        // Handling overloaded operators in user-defined class
        const classSignature = callType.getClassSignature();
        const arkClass = this.declaringMethod.getDeclaringArkFile().getScene().getClass(classSignature);
        if (!arkClass) {
            return null;
        }
        const overloadOpName = this.getOverloadOpName(cxxOperatorCallExpr);
        const overloadOpMethod = overloadOpName ? arkClass.getMethodWithName(overloadOpName) : null;
        if (!overloadOpMethod) {
            return null;
        }
        return this.buildInvokeValueForNormalOverloadedOp(cxxOperatorCallExpr);
    }

    /**
     *Build values and statements called by overloaded flow operators, such as<<or>>.
     * Call IR for the function corresponding to the overload construction of the input/output stream operators operator<<, operator>>
     *This function is used to handle operator overloading call expressions in C++, especially for input/output stream operators.
     *It will parse parameters, find matching Ark methods, and generate corresponding call expressions.
     *
     *@ param cxxOperatorCallExpr represents the AST node of the C++operator call expression
     *@ returns an object containing values and statements. If it cannot be constructed, it returns null
     */
    private buildInvokeValueForOverloadedStreamOp(cxxOperatorCallExpr: CxxAstNode): ValueAndStmts | null {
        if (!cxxOperatorCallExpr.inner || cxxOperatorCallExpr.inner.length < 2) {
            return null;
        }
        const stmts: Stmt[] = [];
        const {
            args,
            argPositions: argPositionsAll,
        } = this.cxxParseArguments(stmts, cxxOperatorCallExpr.inner.slice(1));
        // The input/output operator must be overloaded as a global function, and the overloaded function only has 2 parameters,
        // because the input/output operator is actually a binary operation: stream (left operand)+object (right operand)
        const defaultClass = this.declaringMethod.getDeclaringArkFile().getDefaultClass();
        const arkMtds = defaultClass.getAllMethodsWithName(cxxOperatorCallExpr.name);
        let matchMtd: ArkMethod | undefined;
        for (const mtd of arkMtds) {
            const params = mtd.getParameters();
            let objType = params[1]!.getType();
            if (objType instanceof ReferenceType) {
                objType = objType.getBaseType();
            }
            if (objType.toString() === args[1]!.getType().toString()) {
                matchMtd = mtd;
                break;
            }
        }
        const argus = {
            realGenericTypes: undefined,
            args: args,
            argPositions: argPositionsAll,
        };
        if (!matchMtd) {
            return this.cxxGenerateInvokeValueAndStmts(cxxOperatorCallExpr.inner[0], argus, stmts, cxxOperatorCallExpr);
        }
        // Construct callNode
        const callNode = {
            code: cxxOperatorCallExpr.name,
            name: cxxOperatorCallExpr.name,
            kind: 'DeclRefExpr',
            inner: [],
            range: cxxOperatorCallExpr.range,
            type: cxxOperatorCallExpr.type,
        };

        const valueAndStmts = this.cxxGenerateInvokeValueAndStmts(callNode, argus, stmts, cxxOperatorCallExpr);
        if (valueAndStmts.value instanceof ArkStaticInvokeExpr) {
            valueAndStmts.value.setMethodSignature(matchMtd.getSignature());
        }
        return valueAndStmts;
    }

    /* Build corresponding function call IR for overloading ordinary operators */
    private buildInvokeValueForNormalOverloadedOp(cxxOperatorCallExpr: CxxAstNode): ValueAndStmts | null {
        // The child nodes of the overloaded operator node cannot be less than 2 (inner [0] is FunctionToPointerDecay,
        // and inner [1] is the instance object DeclRefExpr)
        const innerLen = cxxOperatorCallExpr.inner?.length;
        if (!innerLen || innerLen < 2) {
            return null;
        }
        const stmts: Stmt[] = [];
        const argNodes = innerLen === 2 ? [] : cxxOperatorCallExpr.inner.slice(2);
        // For example, when overloading operator+, a+b is equivalent to a.operator+(b), and the memberExpr of a.operator+is constructed as the caller
        const overloadOpName = this.getOverloadOpName(cxxOperatorCallExpr);
        const callNode = {
            code: cxxOperatorCallExpr.inner[1].code + '.' + overloadOpName,
            name: overloadOpName,
            range: cxxOperatorCallExpr.range,
            kind: 'MemberExpr',
            type: { qualType: '<bound member function type>' },
            inner: [cxxOperatorCallExpr.inner[1]],
        };
        return this.buildValueAndStmtsForMemberCall(stmts, callNode, argNodes, cxxOperatorCallExpr, undefined);
    }

    private RecoverExpressionToValueAndStmts(callExpression: CxxAstNode): ValueAndStmts {
        const stmts: Stmt[] = [];
        const [callNode, argumentNodes] = this.getArgumentNodeForRecover(callExpression.inner);
        const argus = this.cxxParseArgumentsOfCallExpression(stmts, argumentNodes);
        return this.cxxGenerateInvokeValueAndStmts(callNode, argus, stmts, callExpression);
    }

    /**
     *Generate the value and statement block of the C++call expression (ValueAndStmts).
     *
     *@ param functionNameNode - the node corresponding to the function name, which is used to resolve the caller information.
     *@ param argus - The object containing the actual generic type, parameter value list, and parameter location information.
     *- realGenericTypes: list of actual generic types.
     *- args: parameter value list.
     *- argPositions: The location information of the parameter in the source code.
     *@ param currStmts - List of existing statements. The newly generated statements will be appended on this basis.
     *@ param callExpression - represents the AST node of the call expression, which is used to obtain the call location information.
     *@ returns a ValueAndStmts object that contains the call value, value location information, and related statements.
     */
    private cxxGenerateInvokeValueAndStmts(
        functionNameNode: CxxAstNode | undefined,
        argus: {
            realGenericTypes: Type[] | undefined;
            args: Value[];
            argPositions: FullPosition[];
        },
        currStmts: Stmt[],
        callExpression: CxxAstNode,
        returnType?: Type,
    ): ValueAndStmts {
        functionNameNode = functionNameNode ?? callExpression;
        const stmts: Stmt[] = [...currStmts];
        let {
            value: callerValue,
            valueOriginalPositions: callerPositions,
            stmts: callerStmts,
        } = this.cxxNodeToValueAndStmts(functionNameNode);
        stmts.push(...callerStmts);

        let invokeValue: Value;
        let invokeValuePositions: FullPosition[] = [FullPosition.cxxBuildFromNode(callExpression, this.cxxSourceFile)];
        const { args, argPositions, realGenericTypes } = argus;
        if (callerValue instanceof AbstractFieldRef) {
            invokeValue = this.buildInvokeValueForFieldRef(callerValue, args, realGenericTypes, invokeValuePositions, callerPositions, returnType);
        } else if (callerValue instanceof Local) {
            const callerName = callerValue.getName();
            let classSignature = ArkSignatureBuilder.buildClassSignatureFromClassName(callerName);
            let cls = ModelUtils.getClass(this.declaringMethod, classSignature);
            const callExprs: string[] = [astKind.CallExpr, astKind.CXXOperatorCallExpr];
            if (cls?.hasComponentDecorator() && callExprs.includes(callExpression.kind)) {
                return this.cxxGenerateCustomViewStmt(callerName, args, argPositions, callExpression, stmts);
            } else if (callerName === COMPONENT_FOR_EACH || callerName === COMPONENT_LAZY_FOR_EACH) {
                // foreach/lazyforeach will be parsed as ts.callExpression
                return this.cxxGenerateSystemComponentStmt(callerName, args, argPositions, callExpression, stmts);
            }
            const methodSignature = ArkSignatureBuilder.buildMethodSignatureFromMethodName(callerName);
            const callerType = callerValue.getType();
            if (callerType instanceof FunctionType || (callerType instanceof PointerType && callerType.getBaseType() instanceof FunctionType) ||
                !this.getGlobals()?.has(callerName)) {
                invokeValue = new ArkPtrInvokeExpr(methodSignature, callerValue, args, realGenericTypes);
            } else {
                invokeValue = new ArkStaticInvokeExpr(methodSignature, args, realGenericTypes);
            }
        } else {
            ({
                value: callerValue,
                stmts: callerStmts,
            } = this.ArkCxxIRTransformer.generateAssignStmtForValue(callerValue, callerPositions));
            stmts.push(...callerStmts);
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

    /**
     *IR Processing of C++Function Calls
     *@ param callExpression - C++AST node, representing member call expression
     *@ returns ValueAndStmts object, including converted values and related statements
     */
    private cxxMemberCallExpressionToValueAndStmts(callExpression: CxxAstNode): ValueAndStmts {
        if ((callExpression.parent ?? callExpression.getParent?.(true))?.type?.qualType === 'std::thread') {
            return this.cxxNewExpressionToValueAndStmts(callExpression);
        }
        const cxxMemberCallExprType = cxxNode2Type(callExpression, this.declaringMethod, this.cxxSourceFile, callExpression);
        let realGenericTypes: Type[] | undefined;
        const stmts: Stmt[] = [];
        const [_, rightNodes] = this.getArgumentNode(callExpression.inner);
        return this.buildValueAndStmtsForMemberCall(stmts, callExpression.inner[0], rightNodes, callExpression, realGenericTypes, cxxMemberCallExprType);
    }

    /**
     *Build values and statements called by members
     *@ param stmts statement array, used to collect generated statements
     *@ param callerNode Caller Node
     *@ param argNodes parameter node array
     *@ param callExpression calls the expression node
     *@ param realGenericTypes Actual generic type array
     *@ returns The ValueAndStmts object containing values, location information, and statements
     */
    private buildValueAndStmtsForMemberCall(
        stmts: Stmt[],
        callerNode: CxxAstNode,
        argNodes: CxxAstNode[],
        callExpression: CxxAstNode,
        realGenericTypes: Type[] | undefined,
        cxxMemberCallExprType?: Type,
    ): ValueAndStmts {
        const { args, argPositions: argPositionsAll } = this.cxxParseArguments(stmts, argNodes);
        const argPositionsAllFlat = argPositionsAll.flat();
        let {
            value: callerValue,
            valueOriginalPositions: callerPositions,
            stmts: callerStmts,
        } = this.cxxNodeToValueAndStmts(callerNode);
        stmts.push(...callerStmts);

        let invokeValue: Value;
        let invokeValuePositions: FullPosition[] = [FullPosition.cxxBuildFromNode(callExpression, this.cxxSourceFile)];
        if (callerValue instanceof ArkInstanceFieldRef) {
            invokeValue = this.buildInvokeValueForFieldRef(callerValue, args, realGenericTypes, invokeValuePositions, callerPositions, cxxMemberCallExprType);
        } else if (callerValue instanceof Local) {
            invokeValue = this.buildInvokeValueForLocal(callerValue, args, realGenericTypes, cxxMemberCallExprType);
        } else {
            ({
                value: callerValue,
                valueOriginalPositions: callerPositions,
                stmts: callerStmts,
            } = this.ArkCxxIRTransformer.generateAssignStmtForValue(callerValue, callerPositions));
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

    /**
     *Build the call value referenced by the field
     *
     *@ param callerValue The caller value indicates the field reference
     *@ param args calls the parameter array
     *@ param realGenericTypes The actual generic type array may be undefined
     *@ param invokeValuePositions calls the value position information array
     *@ param callerPositions Caller position information array
     *@ returns the ArkInstanceFieldRef or ArkStaticInvokeExpr instance
     */
    private buildInvokeValueForFieldRef(
        callerValue: AbstractFieldRef,
        args: Value[],
        realGenericTypes: Type[] | undefined,
        invokeValuePositions: FullPosition[],
        callerPositions: FullPosition[],
        returnType?: Type,
    ): ArkInstanceFieldRef | ArkStaticInvokeExpr {
        let methodSignature: MethodSignature;
        const declareSignature = callerValue.getFieldSignature().getDeclaringSignature();
        if (declareSignature instanceof ClassSignature) {
            methodSignature = new MethodSignature(declareSignature, ArkSignatureBuilder.buildMethodSubSignatureFromMethodName(callerValue.getFieldName()));
        } else {
            methodSignature = ArkSignatureBuilder.buildMethodSignatureFromMethodName(callerValue.getFieldName());
        }
        methodSignature.getMethodSubSignature().setReturnType(returnType ?? UnknownType.getInstance());
        if (callerValue instanceof ArkInstanceFieldRef) {
            invokeValuePositions.push(...callerPositions.slice());
            return new ArkInstanceInvokeExpr(callerValue.getBase(), methodSignature, args, realGenericTypes);
        } else {
            return new ArkStaticInvokeExpr(methodSignature, args, realGenericTypes);
        }
    }

    private buildInvokeValueForLocal(callerValue: Local,
                                     args: Value[],
                                     realGenericTypes: Type[] | undefined,
                                     cxxMemberCallExprType?: Type,
    ): ArkPtrInvokeExpr | ArkStaticInvokeExpr {
        const callerName = callerValue.getName();
        const methodSignature = ArkSignatureBuilder.buildMethodSignatureFromMethodName(callerName);
        methodSignature.getMethodSubSignature().setReturnType(cxxMemberCallExprType ?? UnknownType.getInstance());
        if (callerValue.getType() instanceof FunctionType) {
            return new ArkPtrInvokeExpr(methodSignature, callerValue, args, realGenericTypes);
        } else {
            return new ArkStaticInvokeExpr(methodSignature, args, realGenericTypes);
        }
    }

    private cxxParseArgumentsOfCallExpression(
        currStmts: Stmt[],
        callExpression: CxxAstNode[],
        callNode?: CxxAstNode,
    ): {
        realGenericTypes: Type[] | undefined;
        args: Value[];
        argPositions: FullPosition[];
    } {
        let realGenericTypes = this.getRealGenericTypes(callNode);
        let builderMethodIndexes: Set<number> | undefined;
        const {
            args: args,
            argPositions: argPositions,
        } = this.cxxParseArguments(currStmts, callExpression, builderMethodIndexes);
        return {
            realGenericTypes: realGenericTypes,
            args: args,
            argPositions: argPositions,
        };
    }

    private getRealGenericTypes(node: CxxAstNode | undefined, qualType?: string): Type[] | undefined {
        if (!node) {
            return undefined;
        }

        // 1. Determine the target type string
        const nodeType = this.getTargetQualType(node, qualType);
        if (!nodeType) {
            return undefined;
        }

        // 2. Extract and split template content
        const match = nodeType.match(/<(.*)>/);
        if (!match || !match[1]) {
            return undefined;
        }

        const members = this.splitTemplateArguments(match[1]);

        // 3. Map to Type objects
        return members.map(arg => buildTypeFromPreStr(arg, node, this.declaringMethod));
    }

    /**
     * Resolves the type string based on priority (provided qualType > desugared > default).
     */
    private getTargetQualType(node: CxxAstNode, qualType?: string): string | undefined {
        if (qualType) {
            return qualType;
        }

        return (node.type.desugaredQualType && node.type.typeAliasDeclId)
            ? node.type.desugaredQualType
            : node.type.qualType;
    }

    /**
     * Splits template arguments by comma, but remains aware of nested brackets
     * to prevent incorrect splitting of nested templates.
     */
    private splitTemplateArguments(content: string): string[] {
        const parts: string[] = [];
        let current = '';
        let depth = 0;

        for (const char of content) {
            if (char === '<') {
                depth++;
            }
            if (char === '>') {
                depth--;
            }

            if (char === ',' && depth === 0) {
                parts.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        if (current.trim()) {
            parts.push(current.trim());
        }
        return parts;
    }

    private cxxParseArguments(
        currStmts: Stmt[],
        argumentNodes?: CxxAstNode[],
        builderMethodIndexes?: Set<number>,
    ): {
        args: Value[];
        argPositions: FullPosition[];
    } {
        const args: Value[] = [];
        const argPositions: FullPosition[] = [];
        if (argumentNodes) {
            for (let i = 0; i < argumentNodes.length; i++) {
                if (argumentNodes[i].kind === astKind.CXXDefaultArgExpr) {
                    continue;
                }
                const argument = argumentNodes[i];
                const prevBuilderMethodContextFlag = this.builderMethodContextFlag;
                if (builderMethodIndexes?.has(i)) {
                    this.builderMethodContextFlag = true;
                    this.ArkCxxIRTransformer.setBuilderMethodContextFlag(true);
                }
                let {
                    value: argValue,
                    valueOriginalPositions: argPositionsSingle,
                    stmts: argStmts,
                } = this.cxxNodeToValueAndStmts(argument);
                this.builderMethodContextFlag = prevBuilderMethodContextFlag;
                this.ArkCxxIRTransformer.setBuilderMethodContextFlag(prevBuilderMethodContextFlag);
                currStmts.push(...argStmts);
                if (IRUtils.moreThanOneAddress(argValue)) {
                    ({
                        value: argValue,
                        valueOriginalPositions: argPositionsSingle,
                        stmts: argStmts,
                    } = this.ArkCxxIRTransformer.generateAssignStmtForValue(argValue, argPositionsSingle));
                    currStmts.push(...argStmts);
                }
                args.push(argValue);
                argPositions.push(argPositionsSingle[0]);
            }
        }
        return { args: args, argPositions: argPositions };
    }

    private cxxCallableNodeToValueAndStmts(callableNode: CxxAstNode): ValueAndStmts {
        const declaringClass = this.declaringMethod.getDeclaringArkClass();
        const lambdaArkMethod = new ArkMethod();
        buildArkMethodFromArkClass(callableNode, declaringClass, lambdaArkMethod, this.cxxSourceFile, this.declaringMethod);

        const callableType = new FunctionType(lambdaArkMethod.getSignature());
        const callableValue = this.addNewLocal(lambdaArkMethod.getName(), callableType);
        return {
            value: callableValue,
            valueOriginalPositions: [FullPosition.cxxBuildFromNode(callableNode, this.cxxSourceFile)],
            stmts: [],
        };
    }

    private cxxNewExpressionToValueAndStmts(newExpression: CxxAstNode): ValueAndStmts {
        let className = this.getNewExpressionClassName(newExpression);
        // Add handling for dynamic array creation: int *arr = new int[10]
        if (className === Builtin.ARRAY || newExpression.isArray) {
            return this.cxxNewArrayExpressionToValueAndStmts(newExpression);
        }
        const stmts: Stmt[] = [];
        let realGenericTypes = this.getRealGenericTypes(newExpression);
        // Handle the scenarios of namespace::Member and class::member
        const parentClassOrNs = newExpression.getParent?.(true).inner.filter(
            inn => ([astKind.TypeRef, astKind.NamespaceRef] as string[]).includes(inn.kind));
        let refType: Type | null = null;
        // If the parent node has a namespaceRef or TypeRef, it indicates a constructor call,
        // and should infer the type of the corresponding namespace/class.
        if (parentClassOrNs && parentClassOrNs.length > 0) {
            refType = TypeInference.inferUnclearRefName(className, this.declaringMethod.getDeclaringArkClass()) ??
                cxxNode2Type(newExpression, this.declaringMethod.getDeclaringArkClass());
        }
        let classType: ClassType;
        let classSignature: ClassSignature;
        if (refType instanceof ClassType) {
            classType = refType;
        } else if (refType instanceof AliasType && refType.getOriginalType() instanceof ClassType) {
            classType = refType.getOriginalType() as ClassType;
        } else {
            let curClass = this.declaringMethod.getDeclaringArkFile().getClassWithName(className);
            classSignature = curClass ? curClass.getSignature() : ArkSignatureBuilder.buildClassSignatureFromClassName(className);
            classType = new ClassType(classSignature, realGenericTypes);
        }
        const expr = new ArkNewExpr(classType);
        const { value: newLocal, valueOriginalPositions: newLocalPositions, stmts: newExprStmts } =
            this.ArkCxxIRTransformer.generateAssignStmtForValue(expr, [FullPosition.cxxBuildFromNode(newExpression, this.cxxSourceFile)]);
        // When using the new keyword, the type of Local should be a pointer type.
        if (newExpression.kind === astKind.CXXNewExpr) {
            (newLocal as Local).setType(new PointerType(classType, 1));
        }
        stmts.push(...newExprStmts);
        this.cxxEmitCtorInvokeAndMemberInits(stmts, newExpression, newLocal as Local, newLocalPositions, classType, className);
        return { value: newLocal, valueOriginalPositions: newLocalPositions, stmts: stmts };
    }

    /**
     *Generate C++code representation of constructor calls and member initialization, and add related statements to stmts.
     * Extracted tail logic: construction call+special case processing+member initialization
     *@ param stmts - an array that stores the generated statement nodes
     *@ param newExpression - C++AST node representing new expression
     *@ param newLocal - local variable representing the newly created object
     *@ param newLocalPositions - the location information of the new local variable in the source code
     *@ param constructorMethodSignature - constructor's method signature
     *@ param className - the name of the current class, which is used for special processing of certain types (such as napi_property_descriptor)
     */
    private cxxEmitCtorInvokeAndMemberInits(
        stmts: Stmt[],
        newExpression: CxxAstNode,
        newLocal: Local,
        newLocalPositions: FullPosition[],
        classType: ClassType,
        className: string,
    ): void {
        // 对象构造，使用 invokeStmt 表达
        const constructArgs: CxxAstNode[] = ((): CxxAstNode[] => {
            let args: CxxAstNode[] = newExpression.inner;
            if (newExpression.kind === astKind.CXXNewExpr && newExpression.inner[0]?.kind === astKind.CXXConstructExpr) {
                return [...newExpression.inner[0].inner];
            } else if (newExpression.kind === astKind.CompoundLiteralExpr) {
                return this.getConstructArgs(args);
            } else if (
                // if case : struct LargeStruct s;, inner.length is 0, so we need to avoid it
                newExpression.kind === astKind.CXXConstructExpr &&
                newExpression.type.qualType.startsWith('struct') &&
                args.length > 0 && args[0].inner[0]?.kind === astKind.CompoundLiteralExpr
            ) {
                return this.getConstructArgs(args[0].inner[0].inner);
            } else if (newExpression.kind === astKind.InitListExpr) {
                return this.getConstructArgs(newExpression);
            }
            return args.filter(arg =>
                arg?.kind !== astKind.TemplateRef &&
                arg?.kind !== astKind.NamespaceRef &&
                arg?.kind !== astKind.TypeRef,
            );
        })();

        const { args: argValues, argPositions } = this.cxxParseArguments(stmts, constructArgs);
        const constructorMethodSignature = this.getConstructorSignatureByClassTypeAndArgs(classType, argValues);
        const instanceInvokeExpr = new ArkInstanceInvokeExpr(newLocal, constructorMethodSignature, argValues);
        const invokeStmt = new ArkInvokeStmt(instanceInvokeExpr);
        const instanceInvokeExprPositions = [newLocalPositions[0], ...newLocalPositions, ...argPositions];
        invokeStmt.setOperandOriginalPositions(instanceInvokeExprPositions);
        stmts.push(invokeStmt);

        // Processing the interface between cpp and ts
        if (className === 'napi_property_descriptor') {
            setTs2CxxFuncMapOfClass(argValues, false, this.declaringMethod);
        }
    }

    private getConstructorSignatureByClassTypeAndArgs(classType: ClassType, args: Value[]): MethodSignature {
        const file = this.declaringMethod.getDeclaringArkFile();
        const arkClass = file.getClass(classType.getClassSignature());
        const constructorMethodSubSignature = ArkSignatureBuilder.buildMethodSubSignatureFromMethodName(CONSTRUCTOR_NAME);
        if (!arkClass) {
            return new MethodSignature(
                ArkSignatureBuilder.buildClassSignatureFromClassName(classType.getClassSignature().getClassName()), constructorMethodSubSignature);
        }
        const constructors = arkClass.getMethodsWithName(CONSTRUCTOR_NAME);
        if (constructors.length === 0) {
            return new MethodSignature(classType.getClassSignature(), constructorMethodSubSignature);
        } else if (constructors.length === 1) {
            return constructors[0].getSignature();
        }
        const argsStr = args.map(arg => arg.getType().toString());
        for (const constructor of constructors) {
            const paramTypes = constructor.getSignature().getMethodSubSignature().getParameterTypes();
            if (paramTypes.length !== args.length) {
                continue;
            }
            for (const [idx, paramType] of paramTypes.entries()) {
                const paramTypeStr = paramType.toString();
                if (!paramTypeStr.includes(argsStr[idx]) && !argsStr[idx].includes(paramTypeStr)) {
                    break;
                }
                if (idx === paramTypes.length - 1) {
                    return constructor.getSignature();
                }
            }
        }
        return new MethodSignature(classType.getClassSignature(), constructorMethodSubSignature);
    }

    /**
     *Get the constructor parameter list, and process parameter resolution and conversion of various AST node types
     *@ param constructArgs constructor parameter, which can be a single AST node or AST node array
     *@ returns The constructor parameter array after parsing
     */
    private getConstructArgs(constructArgs: CxxAstNode): CxxAstNode[];
    private getConstructArgs(constructArgs: CxxAstNode[]): CxxAstNode[];
    private getConstructArgs(constructArgs: CxxAstNode | CxxAstNode[]): CxxAstNode[] {
        // 1) Regularize to "parameter array"
        let arr: CxxAstNode[];
        if (Array.isArray(constructArgs)) {
            arr = constructArgs;
        } else if (constructArgs.kind === astKind.InitListExpr) {
            arr = constructArgs.inner ?? [];
        } else {
            // Parameters of some scenarios (such as CXXConstructExpr) may be placed in InitListExpr of inner [1]
            arr = constructArgs.inner ?? [];
        }
        // 2) If the second element itself is InitListExpr, take its inner as the real parameter
        if (arr[1]?.kind === astKind.InitListExpr) {
            arr = arr[1].inner ?? [];
        }
        // 3) If there is "implicit conversion" (original logic: check whether the second element is ImplicitCastExpr)
        const useInner1 = arr[1]?.kind === astKind.ImplicitCastExpr;
        // 4) Generate a new parameter list (equivalent to the original logic)
        const newConstructArgs: CxxAstNode[] = [];
        for (let i = 0; i < arr.length; i++) {
            if (useInner1) {
                const inner1 = arr[i]?.inner?.[1];
                newConstructArgs.push(inner1 ?? arr[i]); // 防御：缺少 inner[1] 时退回 arr[i]
            } else {
                newConstructArgs.push(arr[i]);
            }
        }
        return newConstructArgs;
    }

    /**
     *Get the class name of the new expression
     *@ param newExpression - new expression node of CxxAstNode type
     *@ returns the processed class name string
     */
    private getNewExpressionClassName(newExpression: CxxAstNode): string {
        let oriType = '';
        if (newExpression.type.desugaredQualType) {
            oriType = newExpression.type.desugaredQualType.replace(BuiltinCxx.ANONYMOUS_NAMESPACE_REF, '');
        } else if (newExpression.type.qualType) {
            oriType = newExpression.type.qualType;
        } else if (newExpression.code) {
            oriType = newExpression.code;
        }
        oriType = this.removeOutermostTemplateArgs(oriType);
        if (isCXXSTLContainer(oriType)) {
            return oriType;
        }
        return oriType.replace(/[()]|\ \*|struct\ |union\ |const\ /g, '');
    }

    /**
     *Remove the outermost template parameter (angle brackets and their contents) from the string
     *@ param typeStr is a type string containing template parameters
     *@ returns string after removing the outermost template parameter
     */
    private removeOutermostTemplateArgs(typeStr: string): string {
        // Find the position of the first '<'
        const start = typeStr.indexOf('<');
        if (start === -1) {
            return typeStr; // Cannot find '<', return the original string directly
        }

        let bracketCount = 1;
        let end = -1;

        // Starting from the first '<', search and calculate bracket matches
        for (let i = start + 1; i < typeStr.length; i++) {
            if (typeStr[i] === '<') {
                bracketCount++;
            } else if (typeStr[i] === '>') {
                bracketCount--;
                if (bracketCount === 0) {
                    end = i;
                    break;
                }
            }
        }

        // If a matching ending '>' is found, remove this paragraph
        if (end !== -1) {
            return typeStr.substring(0, start) + typeStr.substring(end + 1);
        }
        return typeStr;
    }

    /**
     *Convert the new array expression of C++to ValueAndStmts
     *@ param newArrayExpression - C++AST node, representing new array expression
     *@ returns ValueAndStmts object, including converted values and related statements
     */
    private cxxNewArrayExpressionToValueAndStmts(newArrayExpression: CxxAstNode): ValueAndStmts {
        let baseType: Type = UnknownType.getInstance();
        if (newArrayExpression.type.qualType) {
            const argumentType = cxxNode2Type(newArrayExpression, this.declaringMethod);
            if (!(argumentType instanceof AnyType || argumentType instanceof UnknownType)) {
                baseType = argumentType;
            }
        }
        const stmts: Stmt[] = [];
        const {
            args: argumentValues,
            argPositions: argPositions,
        } = this.cxxParseArguments(stmts, newArrayExpression.inner);
        let argumentsLength = newArrayExpression.inner ? newArrayExpression.inner.length : 0;
        let arrayLengthValue: Value;
        let fromLiteral: boolean; // Does it contain specific elements
        let arrayLengthPosition = FullPosition.DEFAULT;
        if (argumentsLength === 1 && (argumentValues[0].getType() instanceof NumberType || argumentValues[0].getType() instanceof UnknownType)) {
            arrayLengthValue = argumentValues[0];
            arrayLengthPosition = argPositions[0];
            fromLiteral = false;
        } else {
            arrayLengthValue = CxxValueUtil.getOrCreateNumberConst(argumentsLength);
            fromLiteral = true;
        }
        if (baseType instanceof UnknownType) {
            if (argumentsLength > 1 && !(argumentValues[0].getType() instanceof UnknownType)) {
                baseType = argumentValues[0].getType();
            } else {
                baseType = AnyType.getInstance();
            }
        }
        const newArrayExprPosition = FullPosition.cxxBuildFromNode(newArrayExpression, this.cxxSourceFile);
        return this.cxxGenerateArrayExprAndStmts(
            baseType,
            arrayLengthValue,
            arrayLengthPosition,
            argumentValues,
            argPositions,
            stmts,
            newArrayExprPosition,
            fromLiteral,
        );
    }

    /**
     *Convert C++array literal expression to ValueAndStmts
     *@ param arrayLiteralExpression - Array literal node in C++abstract syntax tree
     *@ returns The ValueAndStmts object containing the converted value and related statements
     */
    private cxxArrayLiteralExpressionToValueAndStmts(arrayLiteralExpression: CxxAstNode, dimensions?: number[], isInitZero?: boolean): ValueAndStmts {
        const stmts: Stmt[] = [];
        const elementTypes: Set<Type> = new Set();
        const elementValues: Value[] = [];
        const elementPositions: FullPosition[] = [];
        const oriType = arrayLiteralExpression.type.qualType;
        let arrayLength = 0; // Indicate the length of the array
        let elementsNumber = 0; // Indicates the total number of elements included
        if (!dimensions) {
            // Obtain dimensional information
            dimensions = this.getArrayDimensions(oriType);
        }
        arrayLength = dimensions[0] ?? arrayLiteralExpression.inner.length;
        elementsNumber = dimensions.reduce((acc, cur) => acc * cur, 1) ?? arrayLength;
        dimensions.shift();
        isInitZero = (arrayLiteralExpression.inner?.length === 1 && arrayLiteralExpression.inner[0].code === '0' ||
            arrayLiteralExpression.inner?.length === 0);
        this.getArrayLiteralExpression(arrayLiteralExpression, stmts, elementTypes, elementValues, elementPositions, dimensions, isInitZero);
        if (isCxxFunctionPointer(oriType)) {
            // If it's an array of function pointers, the array symbols in the type should be removed here before resolving for the base type.
            arrayLiteralExpression.type.qualType = arrayLiteralExpression.type.qualType.replace(/\[.*?\]/g, '');
        }
        let baseType: Type = cxxNode2Type(arrayLiteralExpression, this.declaringMethod);
        arrayLiteralExpression.type.qualType = oriType;
        if (baseType === UnknownType.getInstance()) {
            // If the type is uncertain, it is regarded as an unknown reference type
            return this.cxxNewExpressionToValueAndStmts(arrayLiteralExpression);
        }
        const newArrayExprPosition = FullPosition.cxxBuildFromNode(arrayLiteralExpression, this.cxxSourceFile);
        return this.cxxGenerateArrayExprAndStmts(baseType, CxxValueUtil.getOrCreateNumberConst(arrayLength),
            FullPosition.DEFAULT, elementValues, elementPositions, stmts, newArrayExprPosition, true, elementsNumber, isInitZero);
    }

    // Analyze array dimension information
    private getArrayDimensions(declaration: string): number[] {
        // Extract all dimensional numbers using regular expressions
        const dimensions = declaration.match(/\[(\d+)\]/g);
        if (!dimensions) {
            return [];
        }
        // Parse numbers and return a dimension array
        return dimensions
            .map(dim => parseInt(dim.replace(/[\[\]]/g, '')));
    }

    /**
     *Process array literal expression and convert it to intermediate representation
     *@ param arrayLiteralExpression array literal expression node
     *@ param stmts is used to collect the generated statement list
     *@ param elementTypes is used to collect the collection of array element types
     *@ param elementValues is used to collect the list of array element values
     *@ param elementPositions is used to collect the list of array element position information
     */
    private getArrayLiteralExpression(
        arrayLiteralExpression: CxxAstNode,
        stmts: Stmt[],
        elementTypes: Set<Type>,
        elementValues: Value[],
        elementPositions: FullPosition[],
        dimensions: number[],
        isInitZero: boolean,
    ): void {
        for (const element of arrayLiteralExpression.inner) {
            // If there is still dimension information in the array, build an internal array
            let { value: elementValue, valueOriginalPositions: elementPosition, stmts: elementStmts } =
                dimensions.length > 0 ? this.cxxArrayLiteralExpressionToValueAndStmts(element, dimensions) : this.cxxNodeToValueAndStmts(element);
            stmts.push(...elementStmts);
            if (IRUtils.moreThanOneAddress(elementValue)) {
                ({
                    value: elementValue,
                    valueOriginalPositions: elementPosition,
                    stmts: elementStmts,
                } = this.ArkCxxIRTransformer.generateAssignStmtForValue(elementValue, elementPosition));
                stmts.push(...elementStmts);
            }
            elementValues.push(elementValue);
            elementTypes.add(elementValue.getType());
            elementPositions.push(elementPosition[0]);
        }
    }

    /**
     *Generate IR expressed by C++array
     *
     *@ param baseType - the basic type of the array element
     *@ param arrayLengthValue - value object of array length
     *@ param arrayLengthPosition - position information of array length
     *@ param arrayLength - the actual length of the array
     *@ param initializerValues - array initialization value list
     *@ param initializerPositions - List of location information of initialization values
     *@ param currStmts - List of existing statements
     *@ param newArrayExprPosition - position information of the new array expression
     *@ param fromLiteral - whether from literal
     *@ returns The ValueAndStmts object containing values and statements
     */
    private cxxGenerateArrayExprAndStmts(
        baseType: Type,
        arrayLengthValue: Value,
        arrayLengthPosition: FullPosition,
        initializerValues: Value[],
        initializerPositions: FullPosition[],
        currStmts: Stmt[],
        newArrayExprPosition: FullPosition,
        fromLiteral: boolean,
        elementsNumber?: number,
        isInitZero?: boolean,
    ): ValueAndStmts {
        const stmts: Stmt[] = [...currStmts];
        const newArrayExpr = new ArkCxxNewArrayExpr(baseType, arrayLengthValue, fromLiteral, elementsNumber);
        const newArrayExprPositions = [newArrayExprPosition, arrayLengthPosition];
        const {
            value: arrayLocal,
            valueOriginalPositions: arrayLocalPositions,
            stmts: arrayStmts,
        } = this.ArkCxxIRTransformer.generateAssignStmtForValue(newArrayExpr, newArrayExprPositions);
        stmts.push(...arrayStmts);
        const initializerZero = CxxValueUtil.getOrCreateNumberConst(0);
        for (let i = 0; i < initializerValues.length; i++) {
            // If the array is initialized with 0 or does not contain specific elements, do not create element statements
            if (isInitZero || !fromLiteral) {
                break;
            }
            const indexValue = CxxValueUtil.getOrCreateNumberConst(i);
            const arrayRef = new ArkArrayRef(arrayLocal as Local, indexValue);
            const arrayRefPositions = [arrayLocalPositions[0], ...arrayLocalPositions, FullPosition.DEFAULT];
            const assignStmt = new ArkAssignStmt(arrayRef, initializerValues[i]);
            assignStmt.setOperandOriginalPositions([...arrayRefPositions, initializerPositions[i]]);
            stmts.push(assignStmt);
        }
        if (isInitZero) {
            // When the array is initialized to 0, initialize Values only contains one element for use by the upper layer
            let initExpr = new ArkCxxInitArrayExpr(initializerValues[0] ?? initializerZero);
            let assignStmt = new ArkAssignStmt(arrayLocal, initExpr);
            stmts.push(assignStmt);
        }
        return {
            value: arrayLocal,
            valueOriginalPositions: arrayLocalPositions,
            stmts: stmts,
        };
    }

    /**
     *Converts C++prefix unary expression nodes to IR values and statement lists.
     *
     *@ param prefixUnaryExpression - prefix unary expression node in C++AST
     *@ returns The object containing the converted value and the generated statement list
     */
    private cxxPrefixUnaryExpressionToValueAndStmts(prefixUnaryExpression: CxxAstNode): ValueAndStmts {
        const stmts: Stmt[] = [];
        let { value: operandValue, valueOriginalPositions: operandPositions, stmts: operandStmts } =
            this.cxxNodeToValueAndStmts(prefixUnaryExpression.inner[0]);
        stmts.push(...operandStmts);
        if (IRUtils.moreThanOneAddress(operandValue)) {
            ({
                value: operandValue,
                valueOriginalPositions: operandPositions,
                stmts: operandStmts,
            } = this.ArkCxxIRTransformer.generateAssignStmtForValue(operandValue, operandPositions));
            stmts.push(...operandStmts);
        }

        const operatorToken: string = prefixUnaryExpression.opcode ?? ''; // Optional fields default to empty strings.
        let exprPositions = [FullPosition.cxxBuildFromNode(prefixUnaryExpression, this.cxxSourceFile)];
        if (operatorToken === '++' || operatorToken === '--') {
            const binaryOperator = operatorToken === '++' ? NormalBinaryOperator.Addition : NormalBinaryOperator.Subtraction;
            const binopExpr = new ArkCxxNormalBinOpExpr(operandValue, CxxValueUtil.getOrCreateNumberConst(1), binaryOperator);
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
            const operator = ArkCxxIRTransformer.cxxTokenToUnaryOperator(operatorToken);
            if (operator) {
                unopExpr = new ArkUnopExpr(operandValue, operator);
                exprPositions.push(...operandPositions);
            } else {
                unopExpr = CxxValueUtil.getUndefinedConst();
                exprPositions = [FullPosition.DEFAULT];
            }
            return {
                value: unopExpr,
                valueOriginalPositions: exprPositions,
                stmts: stmts,
            };
        }
    }

    /**
     *Convert a C++suffix unary expression to a sequence of values and statements
     *
     *@ param postfixUnaryExpression - suffix unary expression node in C++AST
     *@ returns The object containing the converted value and related statements
     */
    private cxxPostfixUnaryExpressionToValueAndStmts(postfixUnaryExpression: CxxAstNode): ValueAndStmts {
        const stmts: Stmt[] = [];
        let {
            value: operandValue,
            valueOriginalPositions: operandPositions,
            stmts: exprStmts,
        } = this.cxxNodeToValueAndStmts(postfixUnaryExpression.inner[0]);
        stmts.push(...exprStmts);
        if (IRUtils.moreThanOneAddress(operandValue)) {
            ({
                value: operandValue, valueOriginalPositions: operandPositions, stmts: exprStmts,
            } = this.ArkCxxIRTransformer.generateAssignStmtForValue(operandValue, operandPositions));
            stmts.push(...exprStmts);
        }

        let value: Value | undefined = undefined;
        let exprPositions = [FullPosition.cxxBuildFromNode(postfixUnaryExpression, this.cxxSourceFile)];
        const operatorToken = postfixUnaryExpression.opcode;
        // Use temporary variables to store the value before self increment, and avoid this expression for some non assignment operation scenarios
        if (operatorToken === '++' || operatorToken === '--') {
            const needAssign: string[] = [
                astKind.VarDecl, astKind.BinaryOperator, astKind.BinaryConditionalOperator,
                astKind.ConditionalOperator, astKind.ArraySubscriptExpr,
            ];
            let parent = (postfixUnaryExpression.parent ?? postfixUnaryExpression.getParent?.(true)) ?? null;
            if (parent && needAssign.includes(parent.kind)) {
                let {
                    value: tempValue,
                    stmts: tempStmts,
                } = this.arkIRTransformer.generateAssignStmtForValue(operandValue, exprPositions);
                stmts.push(...tempStmts);
                value = tempValue;
            }
            const binaryOperator = operatorToken === '++' ? NormalBinaryOperator.Addition : NormalBinaryOperator.Subtraction;
            const binopExpr = new ArkCxxNormalBinOpExpr(operandValue, CxxValueUtil.getOrCreateNumberConst(1), binaryOperator);
            exprPositions.push(...operandPositions, FullPosition.DEFAULT);
            const assignStmt = new ArkAssignStmt(operandValue, binopExpr);
            assignStmt.setOperandOriginalPositions([...operandPositions, ...exprPositions]);
            stmts.push(assignStmt);
            if (value === undefined) {
                value = operandValue;
            }
        } else {
            value = CxxValueUtil.getUndefinedConst();
            exprPositions = [FullPosition.DEFAULT];
        }

        return {
            value: value, valueOriginalPositions: exprPositions, stmts: stmts,
        };
    }

    public declStmtToValueAndStmts(decl: CxxAstNode): ValueAndStmts {
        const stmt: Stmt[] = [];
        let value: Value = ValueUtil.getUndefinedConst();
        let fullPositions: FullPosition[] = [];
        for (const node of decl.inner) {
            const valueAndStmts = this.cxxNodeToValueAndStmts(node);
            stmt.push(...valueAndStmts.stmts);
            value = valueAndStmts.value;
            fullPositions.push(...valueAndStmts.valueOriginalPositions);
        }
        return {
            value: value,
            valueOriginalPositions: fullPositions,
            stmts: stmt,
        };
    }

    /**
     *Convert C++variable declarations to combinations of values and statements
     *@ param variableDeclaration - C++variable declaration node
     *@ param isConst - whether it is a constant declaration
     *@ param needRightOp - Whether the right operand is required, the default is true
     *@ returns the ValueAndStmts object containing values and statements
     */
    public cxxVariableDeclarationToValueAndStmts(variableDeclaration: CxxAstNode, needRightOp: boolean = true): ValueAndStmts {
        let isConst = variableDeclaration.type.qualType.includes('const');
        const leftOpNode = variableDeclaration;
        let rightOpNode: CxxAstNode | undefined = undefined;
        if (variableDeclaration.inner !== null && variableDeclaration.inner.length !== 0) {
            rightOpNode = nodeInnerNode(variableDeclaration);
        }
        // In this case, the non assigned information on the right node needs to be discarded
        if (this.isCxxArray(leftOpNode.type.qualType) && rightOpNode?.kind === astKind.IntegerLiteral) {
            rightOpNode = undefined;
        }
        const declarationType = variableDeclaration.type ? cxxNode2Type(variableDeclaration, this.declaringMethod) : UnknownType.getInstance();
        const assignment = this.cxxAssignmentToValueAndStmts(leftOpNode, rightOpNode, true, isConst, declarationType, needRightOp);
        if (declarationType instanceof ReferenceType && assignment.stmts[0] instanceof ArkAssignStmt) {
            declarationType.setSourceValue(assignment.stmts[0].getRightOp());
        }
        return assignment;
    }

    private isCxxArray(qualType: string): boolean {
        const pattern = /\[.*\]/;
        return pattern.test(qualType);
    }

    /**
     *Process C++assignment expressions and convert them into ValueAndStmts structures.
     *
     *@ param leftOpNode The AST node of the left operand
     *@ param rightOpNode The AST node of the right operand, which may be undefined
     *@ param variableDefFlag indicates whether the variable is defined
     *@ param isConst indicates whether it is a constant
     *@ param declarationType Declared type
     *@ param needRightOp Whether to process the right operand, the default is true
     *@ returns the ValueAndStmts object containing the value, original position and statement list
     */
    private cxxAssignmentToValueAndStmts(leftOpNode: CxxAstNode, rightOpNode: CxxAstNode | undefined, variableDefFlag: boolean,
                                         isConst: boolean, declarationType: Type, needRightOp: boolean = true): ValueAndStmts {
        let leftValueAndStmts: ValueAndStmts;
        if (leftOpNode.kind.toString() === astKind.VarDecl) {
            leftValueAndStmts = this.cxxIdentifierToValueAndStmts(leftOpNode, variableDefFlag);
        } else {
            leftValueAndStmts = this.cxxNodeToValueAndStmts(leftOpNode);
        }
        const { value: leftValue, valueOriginalPositions: leftPositions, stmts: leftStmts } = leftValueAndStmts;
        let stmts: Stmt[] = [];
        if (needRightOp) {
            const { value: rightValue, valueOriginalPositions: rightPositions, stmts: rightStmts } =
                this.cxxAssignmentRightOpToValueAndStmts(rightOpNode, leftValue);
            if (leftValue instanceof Local) {
                if (variableDefFlag) {
                    leftValue.setConstFlag(isConst);
                    leftValue.setType(declarationType);
                }
                if ((leftValue.getType() instanceof UnknownType || leftValue.getType() instanceof UnclearReferenceType) &&
                    !(rightValue.getType() instanceof UnknownType) && !(rightValue.getType() instanceof UndefinedType)) {
                    leftValue.setType(rightValue.getType());
                }
            }
            const assignStmt = new ArkAssignStmt(leftValue, rightValue);
            assignStmt.setOperandOriginalPositions([...leftPositions, ...rightPositions]);
            if (leftOpNode.kind === astKind.InitListExpr) {
                stmts.push(...rightStmts);
                stmts.push(assignStmt);
                stmts.push(...leftStmts);
            } else {
                stmts.push(...rightStmts);
                stmts.push(...leftStmts);
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

    /**
     *CPP implementation of converting the right operand node to a list of values and statements
     *@ param rightOpNode The AST node of the right operand, which may be undefined
     *@ param leftValue Left value object
     *@ returns Objects containing values, location information, and statement lists
     */
    private cxxAssignmentRightOpToValueAndStmts(rightOpNode: CxxAstNode | undefined, leftValue: Value): ValueAndStmts {
        let rightValue: Value;
        let rightPositions: FullPosition[];
        let tempRightStmts: Stmt[] = [];
        const rightStmts: Stmt[] = [];
        if (rightOpNode) {
            ({
                value: rightValue,
                valueOriginalPositions: rightPositions,
                stmts: tempRightStmts,
            } = this.cxxNodeToValueAndStmts(rightOpNode));
            rightStmts.push(...tempRightStmts);
        } else {
            rightValue = CxxValueUtil.getUndefinedConst();
            rightPositions = [FullPosition.DEFAULT];
        }
        if (IRUtils.moreThanOneAddress(leftValue) && IRUtils.moreThanOneAddress(rightValue)) {
            ({
                value: rightValue,
                valueOriginalPositions: rightPositions,
                stmts: tempRightStmts,
            } = this.ArkCxxIRTransformer.generateAssignStmtForValue(rightValue, rightPositions));
            rightStmts.push(...tempRightStmts);
        }
        return {
            value: rightValue,
            valueOriginalPositions: rightPositions,
            stmts: rightStmts,
        };
    }

    /**
     *Convert the C++AST node to a single address value and statement list
     *@ param node - C++AST node to be converted
     *@ returns An object containing a list of values, original positions, and statements
     */
    private cxxNodeToSingleAddressValueAndStmts(node: CxxAstNode): ValueAndStmts {
        const allStmts: Stmt[] = [];
        let { value, valueOriginalPositions, stmts } = this.cxxNodeToValueAndStmts(node);
        allStmts.push(...stmts);
        if (IRUtils.moreThanOneAddress(value)) {
            ({
                value,
                valueOriginalPositions,
                stmts,
            } = this.arkIRTransformer.generateAssignStmtForValue(value, valueOriginalPositions));
            allStmts.push(...stmts);
        }
        return { value, valueOriginalPositions, stmts: allStmts };
    }

    /**
     *Converts a C++binary expression node to a list of values and statements.
     *In assignment patterns, the left operand will be an array literal expression
     *In assignment patterns, the left operand will be an object literal expression
     *@ param binaryExpression - Binary expression node in C++AST
     *@ returns The ValueAndStmts object containing calculated values and related statements
     */
    private cxxBinaryExpressionToValueAndStmts(binaryExpression: CxxAstNode): ValueAndStmts {
        const operatorToken = binaryExpression.opcode ?? '!=';
        const binaryExpressionLeft = binaryExpression.inner[0];
        const binaryExpressionRight = binaryExpression.inner[1];
        if (operatorToken === '=') {
            const leftType = cxxNode2Type(binaryExpressionLeft, undefined);
            return this.cxxAssignmentToValueAndStmts(binaryExpressionLeft, binaryExpressionRight, false, false, leftType, true);
        }
        const stmts: Stmt[] = [];
        const binaryExpressionPosition = FullPosition.cxxBuildFromNode(binaryExpression, this.cxxSourceFile);
        const {
            value: opValue1,
            valueOriginalPositions: opPositions1,
            stmts: opStmts1,
        } = this.cxxNodeToSingleAddressValueAndStmts(binaryExpressionLeft);
        stmts.push(...opStmts1);
        const {
            value: opValue2,
            valueOriginalPositions: opPositions2,
            stmts: opStmts2,
        } = this.cxxNodeToSingleAddressValueAndStmts(binaryExpressionRight);
        stmts.push(...opStmts2);
        let exprValue: Value;
        let exprValuePositions = [binaryExpressionPosition];
        // In scenarios where the operator is', 'and' value 'is the rightmost value
        if (operatorToken === ',') {
            exprValue = opValue2;
            exprValuePositions.push(...opPositions1, ...opPositions2);
        } else if (operatorToken) {
            if (this.isRelationalOperator(operatorToken as BinaryOperator)) {
                exprValue = new ArkConditionExpr(opValue1, opValue2, operatorToken as RelationalBinaryOperator);
            } else {
                exprValue = new ArkCxxNormalBinOpExpr(opValue1, opValue2, operatorToken as NormalBinaryOperator);
                const exprTye = cxxNode2Type(binaryExpression, undefined, undefined);
                (exprValue as ArkCxxNormalBinOpExpr).setCxxType(exprTye);
            }
            exprValuePositions.push(...opPositions1, ...opPositions2);
        } else {
            exprValue = CxxValueUtil.getUndefinedConst();
            exprValuePositions.push(binaryExpressionPosition);
        }
        return {
            value: exprValue,
            valueOriginalPositions: exprValuePositions,
            stmts: stmts,
        };
    }

    /**
     *Convert compound assignment expressions (such as+=, -=, etc.) in C++to values and statement lists in intermediate representation (IR).
     *
     *@ param binaryExpression represents the C++AST node of the compound assignment operation
     *@ returns an object containing the calculated value, the original location information, and the generated statement list
     */
    private cxxCompoundAssignmentToValueAndStmts(binaryExpression: CxxAstNode): ValueAndStmts {
        const stmts: Stmt[] = [];
        let {
            value: leftValue,
            valueOriginalPositions: leftPositions,
            stmts: leftStmts,
        } = this.cxxNodeToValueAndStmts(binaryExpression.inner[0]);
        stmts.push(...leftStmts);
        let {
            value: rightValue,
            valueOriginalPositions: rightPositions,
            stmts: rightStmts,
        } = this.cxxNodeToValueAndStmts(binaryExpression.inner[1]);
        stmts.push(...rightStmts);
        if (IRUtils.moreThanOneAddress(leftValue) && IRUtils.moreThanOneAddress(rightValue)) {
            const {
                value: newRightValue,
                valueOriginalPositions: newRightPositions,
                stmts: rightStmts,
            } = this.ArkCxxIRTransformer.generateAssignStmtForValue(rightValue, rightPositions);
            rightValue = newRightValue;
            rightPositions = newRightPositions;
            stmts.push(...rightStmts);
        }

        let leftOpValue: Value;
        let leftOpPositions: FullPosition[];
        const operator = this.cxxCcompoundAssignmentTokenToBinaryOperator(binaryExpression.opcode ?? '');
        if (operator) {
            const exprValue = new ArkCxxNormalBinOpExpr(leftValue, rightValue, operator);
            const exprValuePosition = FullPosition.cxxBuildFromNode(binaryExpression, this.cxxSourceFile);
            const assignStmt = new ArkAssignStmt(leftValue, exprValue);
            assignStmt.setOperandOriginalPositions([...leftPositions, exprValuePosition, ...leftPositions, ...rightPositions]);
            stmts.push(assignStmt);
            leftOpValue = leftValue;
            leftOpPositions = leftPositions;
        } else {
            leftOpValue = CxxValueUtil.getUndefinedConst();
            leftOpPositions = [leftPositions[0]];
        }
        return {
            value: leftOpValue,
            valueOriginalPositions: leftOpPositions,
            stmts: stmts,
        };
    }

    /**
     *Convert the compound assignment operator to the corresponding binary operator
     *
     *@ param token - compound assignment operator string
     *@ returns The corresponding binary operator. If no match is found, null is returned
     */
    private cxxCcompoundAssignmentTokenToBinaryOperator(token: string): NormalBinaryOperator | null {
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

    /**
     *Convert C++conditional expression nodes to a combination of values and statements
     *@ param condition - Condition node in C++abstract syntax tree
     *@ returns Objects containing conditional expression values and related statements
     */
    public cxxConditionToValueAndStmts(condition: CxxAstNode): ValueAndStmts {
        const stmts: Stmt[] = [];
        let {
            value: conditionValue,
            valueOriginalPositions: conditionPositions,
            stmts: conditionStmts,
        } = this.cxxNodeToValueAndStmts(condition);
        stmts.push(...conditionStmts);
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
                } = this.ArkCxxIRTransformer.generateAssignStmtForValue(conditionValue, conditionPositions));
                stmts.push(...conditionStmts);
            }
            conditionExpr = new ArkConditionExpr(conditionValue, CxxValueUtil.getOrCreateNumberConst(0), RelationalBinaryOperator.InEquality);
            conditionPositions = [conditionPositions[0], ...conditionPositions, FullPosition.DEFAULT];
        }
        return {
            value: conditionExpr,
            valueOriginalPositions: conditionPositions,
            stmts: stmts,
        };
    }

    private parseFloatAsCxxFloat(s: string): number {
        const num = Number.parseFloat(s);
        // perform a float32 round-trip using Float32Array to simulate C++ 'float' precision
        const f32 = new Float32Array(1);
        f32[0] = num;
        return +f32[0].toFixed(5);
    }

    /**
     *Convert literal nodes in C++AST into corresponding value and statement lists.
     *Literals currently processed: integer, floating point, string, character, Boolean value, null pointer, address label
     *@ param literalNode - an AST node representing a C++literal
     *@ returns the object containing the value, original location information and statement list. If the node type cannot be processed, null is returned
     */

    private cxxLiteralNodeToValueAndStmts(literalNode: CxxAstNode): ValueAndStmts | null {
        const stmts: Stmt[] = [];
        const pos = [FullPosition.cxxBuildFromNode(literalNode, this.cxxSourceFile)];
        const S = (v: string | undefined | null): string => v ?? '';

        switch (literalNode.kind) {
            case astKind.IntegerLiteral: {
                const num = (S(literalNode.value) || S(literalNode.code));
                const constant = CxxValueUtil.getOrCreateNumberConst(num ? num : 0);
                return { value: constant, valueOriginalPositions: pos, stmts };
            }
            case astKind.FloatingLiteral: {
                const num = this.parseFloatAsCxxFloat(S(literalNode.value) || S(literalNode.code));
                const constant = CxxValueUtil.getOrCreateNumberConst(Number.isFinite(num) ? num : 0);
                return { value: constant, valueOriginalPositions: pos, stmts };
            }
            case astKind.StringLiteral: {
                const constant = CxxValueUtil.createStringConst(S(literalNode.value) || S(literalNode.code));
                return { value: constant, valueOriginalPositions: pos, stmts };
            }
            case astKind.CharacterLiteral: {
                const constant = CxxValueUtil.createCharConst(S(literalNode.code));
                return { value: constant, valueOriginalPositions: pos, stmts };
            }
            case astKind.CXXBoolLiteralExpr: {
                const raw = (literalNode.value ?? literalNode.code ?? '').toString().trim().toLowerCase();
                const b = raw === 'true' || raw === '1';
                const constant = CxxValueUtil.getBooleanConstant(b);
                return { value: constant, valueOriginalPositions: pos, stmts };
            }
            case astKind.CXXNullPtrLiteralExpr: {
                const constant = NullConstant.getInstance();
                return { value: constant, valueOriginalPositions: pos, stmts };
            }
            default: {
                logger.warn(`ast node's syntaxKind is ${literalNode.kind}, not literalNode`);
                return null;
            }
        }
    }

    public static isCxxCompoundAssignmentOperator(op?: string): boolean {
        return !!op && COMPOUND_BIN_OPS.has(op);
    }

    private static isRelationalBinaryOperator(op: string): boolean {
        return (Object.values(RelationalBinaryOperator) as string[]).includes(op);
    }
}
