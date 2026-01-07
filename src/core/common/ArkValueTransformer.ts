/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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
import { Local } from '../base/Local';
import { FullPosition } from '../base/Position';
import { ArkAliasTypeDefineStmt, ArkAssignStmt, ArkIfStmt, ArkInvokeStmt, Stmt } from '../base/Stmt';
import {
    AbstractBinopExpr,
    ArkAwaitExpr,
    ArkCastExpr,
    ArkConditionExpr,
    ArkDeleteExpr,
    ArkInstanceInvokeExpr,
    ArkInstanceOfExpr,
    ArkNewArrayExpr,
    ArkNewExpr,
    ArkNormalBinopExpr,
    ArkPtrInvokeExpr,
    ArkStaticInvokeExpr,
    ArkTypeOfExpr,
    ArkUnopExpr,
    ArkYieldExpr,
    BinaryOperator,
    NormalBinaryOperator,
    RelationalBinaryOperator,
} from '../base/Expr';
import { ArkClass } from '../model/ArkClass';
import { buildNormalArkClassFromArkFile, buildNormalArkClassFromArkNamespace } from '../model/builder/ArkClassBuilder';
import {
    AliasType,
    AnyType,
    ArrayType,
    BigIntType,
    BooleanType,
    ClassType,
    FunctionType,
    IntersectionType,
    LiteralType,
    NeverType,
    NullType,
    NumberType,
    StringType,
    TupleType,
    Type,
    UnclearReferenceType,
    UndefinedType,
    UnionType,
    UnknownType,
    VoidType,
} from '../base/Type';
import { ArkSignatureBuilder } from '../model/builder/ArkSignatureBuilder';
import { CONSTRUCTOR_NAME, SUPER_NAME, THIS_NAME } from './TSConst';
import { ClassSignature, FieldSignature, MethodSignature } from '../model/ArkSignature';
import { Value } from '../base/Value';
import {
    COMPONENT_CREATE_FUNCTION,
    COMPONENT_CUSTOMVIEW,
    COMPONENT_FOR_EACH,
    COMPONENT_LAZY_FOR_EACH,
    COMPONENT_POP_FUNCTION,
    isEtsSystemComponent,
} from './EtsConst';
import { ValueUtil } from './ValueUtil';
import { IRUtils } from './IRUtils';
import { AbstractFieldRef, ArkArrayRef, ArkInstanceFieldRef, ArkStaticFieldRef, GlobalRef } from '../base/Ref';
import { ModelUtils } from './ModelUtils';
import { ArkMethod } from '../model/ArkMethod';
import { buildArkMethodFromArkClass } from '../model/builder/ArkMethodBuilder';
import { Builtin } from './Builtin';
import { Constant } from '../base/Constant';
import { TEMP_LOCAL_PREFIX } from './Const';
import { ArkIRTransformer, DummyStmt, ValueAndStmts } from './ArkIRTransformer';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { TypeInference } from './TypeInference';
import { KeyofTypeExpr, TypeQueryExpr } from '../base/TypeExpr';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkValueTransformer');

export class ArkValueTransformer {
    public conditionalOperatorNo: number = 0;
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

    public tsNodeToValueAndStmts(node: ts.Node): ValueAndStmts {
        if (ts.isBinaryExpression(node)) {
            return this.binaryExpressionToValueAndStmts(node);
        } else if (ts.isCallExpression(node)) {
            return this.callExpressionToValueAndStmts(node);
        } else if (ts.isVariableDeclarationList(node)) {
            return this.variableDeclarationListToValueAndStmts(node);
        } else if (ts.isIdentifier(node)) {
            return this.identifierToValueAndStmts(node);
        } else if (ts.isPropertyAccessExpression(node)) {
            return this.propertyAccessExpressionToValue(node);
        } else if (ts.isPrefixUnaryExpression(node)) {
            return this.prefixUnaryExpressionToValueAndStmts(node);
        } else if (ts.isPostfixUnaryExpression(node)) {
            return this.postfixUnaryExpressionToValueAndStmts(node);
        } else if (ts.isTemplateExpression(node)) {
            return this.templateExpressionToValueAndStmts(node);
        } else if (ts.isTaggedTemplateExpression(node)) {
            return this.taggedTemplateExpressionToValueAndStmts(node);
        } else if (ts.isAwaitExpression(node)) {
            return this.awaitExpressionToValueAndStmts(node);
        } else if (ts.isYieldExpression(node)) {
            return this.yieldExpressionToValueAndStmts(node);
        } else if (ts.isDeleteExpression(node)) {
            return this.deleteExpressionToValueAndStmts(node);
        } else if (ts.isVoidExpression(node)) {
            return this.voidExpressionToValueAndStmts(node);
        } else if (ts.isElementAccessExpression(node)) {
            return this.elementAccessExpressionToValueAndStmts(node);
        } else if (ts.isNewExpression(node)) {
            return this.newExpressionToValueAndStmts(node);
        } else if (ts.isParenthesizedExpression(node)) {
            return this.parenthesizedExpressionToValueAndStmts(node);
        } else if (ts.isAsExpression(node)) {
            return this.asExpressionToValueAndStmts(node);
        } else if (ts.isNonNullExpression(node)) {
            return this.nonNullExpressionToValueAndStmts(node);
        } else if (ts.isTypeAssertionExpression(node)) {
            return this.typeAssertionToValueAndStmts(node);
        } else if (ts.isTypeOfExpression(node)) {
            return this.typeOfExpressionToValueAndStmts(node);
        } else if (ts.isArrayLiteralExpression(node)) {
            return this.arrayLiteralExpressionToValueAndStmts(node);
        } else if (this.isLiteralNode(node)) {
            return this.literalNodeToValueAndStmts(node) as ValueAndStmts;
        } else if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
            return this.callableNodeToValueAndStmts(node);
        } else if (ts.isClassExpression(node)) {
            return this.classExpressionToValueAndStmts(node);
        } else if (ts.isEtsComponentExpression(node)) {
            return this.etsComponentExpressionToValueAndStmts(node);
        } else if (ts.isObjectLiteralExpression(node)) {
            return this.objectLiteralExpresionToValueAndStmts(node);
        } else if (node.kind === ts.SyntaxKind.ThisKeyword) {
            return this.thisExpressionToValueAndStmts(node as ts.ThisExpression);
        } else if (node.kind === ts.SyntaxKind.SuperKeyword) {
            return this.superExpressionToValueAndStmts(node as ts.SuperExpression);
        } else if (ts.isConditionalExpression(node)) {
            return this.conditionalExpressionToValueAndStmts(node);
        } else if (ts.isSpreadElement(node)) {
            return this.tsNodeToValueAndStmts(node.expression);
        }

        return {
            value: new Local(node.getText(this.sourceFile)),
            valueOriginalPositions: [FullPosition.buildFromNode(node, this.sourceFile)],
            stmts: [],
        };
    }

    private tsNodeToSingleAddressValueAndStmts(node: ts.Node): ValueAndStmts {
        const allStmts: Stmt[] = [];
        let { value, valueOriginalPositions, stmts } = this.tsNodeToValueAndStmts(node);
        stmts.forEach(stmt => allStmts.push(stmt));
        if (IRUtils.moreThanOneAddress(value)) {
            ({
                value,
                valueOriginalPositions,
                stmts,
            } = this.arkIRTransformer.generateAssignStmtForValue(value, valueOriginalPositions));
            stmts.forEach(stmt => allStmts.push(stmt));
        }
        return { value, valueOriginalPositions, stmts: allStmts };
    }

    private thisExpressionToValueAndStmts(thisExpression: ts.ThisExpression): ValueAndStmts {
        return {
            value: this.getThisLocal(),
            valueOriginalPositions: [FullPosition.buildFromNode(thisExpression, this.sourceFile)],
            stmts: [],
        };
    }

    private superExpressionToValueAndStmts(superExpression: ts.SuperExpression): ValueAndStmts {
        return {
            value: this.getOrCreateLocal(SUPER_NAME),
            valueOriginalPositions: [FullPosition.buildFromNode(superExpression, this.sourceFile)],
            stmts: [],
        };
    }

    private conditionalExpressionToValueAndStmts(conditionalExpression: ts.ConditionalExpression): ValueAndStmts {
        const stmts: Stmt[] = [];
        const currConditionalOperatorIndex = this.conditionalOperatorNo++;
        const {
            value: conditionValue,
            valueOriginalPositions: conditionPositions,
            stmts: conditionStmts,
        } = this.conditionToValueAndStmts(conditionalExpression.condition);
        conditionStmts.forEach(stmt => stmts.push(stmt));
        const ifStmt = new ArkIfStmt(conditionValue as ArkConditionExpr);
        ifStmt.setOperandOriginalPositions(conditionPositions);
        stmts.push(ifStmt);

        stmts.push(new DummyStmt(ArkIRTransformer.DUMMY_CONDITIONAL_OPERATOR_IF_TRUE_STMT + currConditionalOperatorIndex));
        const {
            value: whenTrueValue,
            valueOriginalPositions: whenTruePositions,
            stmts: whenTrueStmts,
        } = this.tsNodeToValueAndStmts(conditionalExpression.whenTrue);
        whenTrueStmts.forEach(stmt => stmts.push(stmt));
        const resultLocal = this.generateTempLocal();
        const assignStmtWhenTrue = new ArkAssignStmt(resultLocal, whenTrueValue);
        const resultLocalPosition: FullPosition[] = [whenTruePositions[0]];
        assignStmtWhenTrue.setOperandOriginalPositions([...resultLocalPosition, ...whenTruePositions]);
        stmts.push(assignStmtWhenTrue);

        stmts.push(new DummyStmt(ArkIRTransformer.DUMMY_CONDITIONAL_OPERATOR_IF_FALSE_STMT + currConditionalOperatorIndex));
        const {
            value: whenFalseValue,
            valueOriginalPositions: whenFalsePositions,
            stmts: whenFalseStmts,
        } = this.tsNodeToValueAndStmts(conditionalExpression.whenFalse);
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

    private objectLiteralExpresionToValueAndStmts(objectLiteralExpression: ts.ObjectLiteralExpression): ValueAndStmts {
        const declaringArkClass = this.declaringMethod.getDeclaringArkClass();
        const declaringArkNamespace = declaringArkClass.getDeclaringArkNamespace();
        const anonymousClass = new ArkClass();
        if (declaringArkNamespace) {
            buildNormalArkClassFromArkNamespace(objectLiteralExpression, declaringArkNamespace, anonymousClass, this.sourceFile, this.declaringMethod);
        } else {
            const declaringArkFile = declaringArkClass.getDeclaringArkFile();
            buildNormalArkClassFromArkFile(objectLiteralExpression, declaringArkFile, anonymousClass, this.sourceFile, this.declaringMethod);
        }

        const objectLiteralExpressionPosition = FullPosition.buildFromNode(objectLiteralExpression, this.sourceFile);
        const stmts: Stmt[] = [];
        const anonymousClassSignature = anonymousClass.getSignature();
        const anonymousClassType = new ClassType(anonymousClassSignature);
        const newExpr = new ArkNewExpr(anonymousClassType);
        const {
            value: newExprLocal,
            valueOriginalPositions: newExprLocalPositions,
            stmts: newExprStmts,
        } = this.arkIRTransformer.generateAssignStmtForValue(newExpr, [objectLiteralExpressionPosition]);
        newExprStmts.forEach(stmt => stmts.push(stmt));

        const constructorMethodSubSignature = ArkSignatureBuilder.buildMethodSubSignatureFromMethodName(CONSTRUCTOR_NAME);
        const constructorMethodSignature = new MethodSignature(anonymousClassSignature, constructorMethodSubSignature);
        const constructorInvokeExpr = new ArkInstanceInvokeExpr(newExprLocal as Local, constructorMethodSignature, []);

        const assignStmt = new ArkAssignStmt(newExprLocal, constructorInvokeExpr);
        const assignStmtPositions = [newExprLocalPositions[0], newExprLocalPositions[0], ...newExprLocalPositions];
        assignStmt.setOperandOriginalPositions(assignStmtPositions);
        stmts.push(assignStmt);
        return { value: newExprLocal, valueOriginalPositions: assignStmtPositions, stmts: stmts };
    }

    private generateSystemComponentStmt(componentName: string, args: Value[], argPositionsAllFlat: FullPosition[],
        componentExpression: ts.EtsComponentExpression | ts.CallExpression, currStmts: Stmt[]): ValueAndStmts {
        const stmts: Stmt[] = [...currStmts];
        const componentExpressionPosition = FullPosition.buildFromNode(componentExpression, this.sourceFile);
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

    private generateCustomViewStmt(componentName: string, args: Value[], argPositionsAllFlat: FullPosition[],
        componentExpression: ts.EtsComponentExpression | ts.CallExpression, currStmts: Stmt[]): ValueAndStmts {
        const stmts: Stmt[] = [...currStmts];
        const componentExpressionPosition = FullPosition.buildFromNode(componentExpression, this.sourceFile);
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
        const assignStmt = new ArkAssignStmt(newExprLocal, instanceInvokeExpr);
        const assignStmtPositions = [componentExpressionPosition, componentExpressionPosition, ...newExprPositions, ...argPositionsAllFlat];
        assignStmt.setOperandOriginalPositions(assignStmtPositions);
        stmts.push(assignStmt);
        const createViewArgs: Value[] = [newExprLocal];
        const createViewArgPositionsAll = [newExprPositions];
        if (ts.isEtsComponentExpression(componentExpression) && componentExpression.body) {
            const anonymous = ts.factory.createArrowFunction([], [], [], undefined, undefined, componentExpression.body);
            // @ts-expect-error: add pos info for the created ArrowFunction
            anonymous.pos = componentExpression.body.pos;
            // @ts-expect-error: add end info for the created ArrowFunction
            anonymous.end = componentExpression.body.end;
            const {
                value: builderMethod,
                valueOriginalPositions: builderMethodPositions,
            } = this.callableNodeToValueAndStmts(anonymous);
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
        createArgsPositionsAllFlat: FullPosition[],
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

    private etsComponentExpressionToValueAndStmts(etsComponentExpression: ts.EtsComponentExpression): ValueAndStmts {
        const stmts: Stmt[] = [];
        const componentName = (etsComponentExpression.expression as ts.Identifier).text;
        const {
            argValues: argValues,
            argPositions: argPositions,
        } = this.parseArguments(stmts, etsComponentExpression.arguments);
        if (isEtsSystemComponent(componentName)) {
            return this.generateSystemComponentStmt(componentName, argValues, argPositions, etsComponentExpression, stmts);
        }
        return this.generateCustomViewStmt(componentName, argValues, argPositions, etsComponentExpression, stmts);
    }

    private classExpressionToValueAndStmts(classExpression: ts.ClassExpression): ValueAndStmts {
        const declaringArkClass = this.declaringMethod.getDeclaringArkClass();
        const declaringArkNamespace = declaringArkClass.getDeclaringArkNamespace();
        const newClass = new ArkClass();
        if (declaringArkNamespace) {
            buildNormalArkClassFromArkNamespace(classExpression, declaringArkNamespace, newClass, this.sourceFile, this.declaringMethod);
        } else {
            const declaringArkFile = declaringArkClass.getDeclaringArkFile();
            buildNormalArkClassFromArkFile(classExpression, declaringArkFile, newClass, this.sourceFile, this.declaringMethod);
        }
        const classValue = this.addNewLocal(newClass.getName(), new ClassType(newClass.getSignature()));
        return {
            value: classValue,
            valueOriginalPositions: [FullPosition.buildFromNode(classExpression, this.sourceFile)],
            stmts: [],
        };
    }

    private templateExpressionToValueAndStmts(templateExpression: ts.TemplateExpression): ValueAndStmts {
        const {
            stmts,
            stringTextValues,
            placeholderValues,
            stringTextPositions,
            placeholderPositions,
        } = this.collectTemplateValues(templateExpression);

        const { placeholderStringLocals, placeholderStringLocalPositions, newStmts } = this.processTemplatePlaceholders(
            placeholderValues,
            placeholderPositions,
            stmts,
        );

        return this.combineTemplateParts(stringTextValues, stringTextPositions, placeholderStringLocals, placeholderStringLocalPositions, newStmts);
    }

    private processTemplatePlaceholders(
        placeholderValues: Value[],
        placeholderPositions: FullPosition[],
        currStmts: Stmt[],
    ): {
        placeholderStringLocals: Local[];
        placeholderStringLocalPositions: FullPosition[];
        newStmts: Stmt[];
    } {
        const placeholderStringLocals: Local[] = [];
        const placeholderStringLocalPositions: FullPosition[] = [];
        const newStmts: Stmt[] = [...currStmts];

        for (let i = 0; i < placeholderValues.length; i++) {
            let placeholderValue = placeholderValues[i];
            let placeholderPosition: FullPosition[] = [placeholderPositions[i]];
            let placeholderStmts: Stmt[] = [];

            if (!(placeholderValue instanceof Local)) {
                ({
                    value: placeholderValue,
                    valueOriginalPositions: placeholderPosition,
                    stmts: placeholderStmts,
                } = this.arkIRTransformer.generateAssignStmtForValue(placeholderValue, placeholderPosition));
            }

            placeholderStmts.forEach(stmt => newStmts.push(stmt));
            const toStringExpr = new ArkInstanceInvokeExpr(placeholderValue as Local, Builtin.TO_STRING_METHOD_SIGNATURE, []);
            const toStringExprPosition: FullPosition[] = [placeholderPosition[0], placeholderPosition[0]];
            const {
                value: placeholderStringLocal,
                valueOriginalPositions: placeholderStringPositions,
                stmts: toStringStmts,
            } = this.arkIRTransformer.generateAssignStmtForValue(toStringExpr, toStringExprPosition);
            placeholderStringLocals.push(placeholderStringLocal as Local);
            placeholderStringLocalPositions.push(placeholderStringPositions[0]);
            toStringStmts.forEach(stmt => newStmts.push(stmt));
        }

        return {
            placeholderStringLocals,
            placeholderStringLocalPositions,
            newStmts,
        };
    }

    private combineTemplateParts(
        stringTextValues: Value[],
        stringTextPositions: FullPosition[],
        placeholderStringLocals: Local[],
        placeholderStringLocalPositions: FullPosition[],
        currStmts: Stmt[],
    ): ValueAndStmts {
        const templateParts: Value[] = [];
        const templatePartPositions: FullPosition[] = [];

        for (let i = 0; i < placeholderStringLocals.length; i++) {
            if (stringTextValues[i] !== ValueUtil.EMPTY_STRING_CONSTANT) {
                templateParts.push(stringTextValues[i]);
                templatePartPositions.push(stringTextPositions[i]);
            }
            templateParts.push(placeholderStringLocals[i]);
            templatePartPositions.push(placeholderStringLocalPositions[i]);
        }

        if (stringTextValues[stringTextValues.length - 1] !== ValueUtil.EMPTY_STRING_CONSTANT) {
            templateParts.push(stringTextValues[stringTextValues.length - 1]);
            templatePartPositions.push(stringTextPositions[stringTextPositions.length - 1]);
        }

        let currTemplateResult: Value = templateParts[0];
        let currTemplateResultPosition: FullPosition = templatePartPositions[0];
        const finalStmts: Stmt[] = [...currStmts];

        for (let i = 1; i < templateParts.length; i++) {
            const nextTemplatePartPosition = templatePartPositions[i];
            const normalBinopExpr = new ArkNormalBinopExpr(currTemplateResult, templateParts[i], NormalBinaryOperator.Addition);
            const normalBinopExprPositions = [
                FullPosition.merge(currTemplateResultPosition, nextTemplatePartPosition),
                currTemplateResultPosition,
                nextTemplatePartPosition,
            ];
            const {
                value: combinationValue,
                valueOriginalPositions: combinationValuePositions,
                stmts: combinationStmts,
            } = this.arkIRTransformer.generateAssignStmtForValue(normalBinopExpr, normalBinopExprPositions);
            combinationStmts.forEach(stmt => finalStmts.push(stmt));
            currTemplateResult = combinationValue;
            currTemplateResultPosition = combinationValuePositions[0];
        }

        return {
            value: currTemplateResult,
            valueOriginalPositions: [currTemplateResultPosition],
            stmts: finalStmts,
        };
    }

    private taggedTemplateExpressionToValueAndStmts(taggedTemplateExpression: ts.TaggedTemplateExpression): ValueAndStmts {
        const {
            stmts, stringTextValues, placeholderValues, stringTextPositions, placeholderPositions,
        } = this.collectTemplateValues(taggedTemplateExpression.template);
        const stringTextBaseType = StringType.getInstance();
        const stringTextArrayLen = stringTextValues.length;
        const stringTextArrayLenValue = ValueUtil.getOrCreateNumberConst(stringTextArrayLen);
        const stringTextArrayLenPosition = FullPosition.DEFAULT;
        const {
            value: templateObjectLocal, valueOriginalPositions: templateObjectLocalPositions,
            stmts: templateObjectStmts,
        } = this.generateArrayExprAndStmts(stringTextBaseType, stringTextArrayLenValue, stringTextArrayLenPosition,
            stringTextArrayLen, stringTextValues, stringTextPositions, stmts, FullPosition.DEFAULT, true);

        const placeholderBaseType = AnyType.getInstance();
        const placeholdersArrayLen = placeholderValues.length;
        const placeholdersArrayLenValue = ValueUtil.getOrCreateNumberConst(placeholdersArrayLen);
        const placeholdersArrayLenPosition = FullPosition.DEFAULT;
        const {
            value: placeholdersLocal, valueOriginalPositions: placeholdersLocalPositions, stmts: placeholdersStmts,
        } = this.generateArrayExprAndStmts(placeholderBaseType, placeholdersArrayLenValue, placeholdersArrayLenPosition,
            placeholdersArrayLen, placeholderValues, placeholderPositions, templateObjectStmts, FullPosition.DEFAULT,
            true);

        const taggedFuncArgus = {
            realGenericTypes: undefined, argValues: [templateObjectLocal, placeholdersLocal],
            argPositions: [templateObjectLocalPositions[0], placeholdersLocalPositions[0]],
        };
        return this.generateInvokeValueAndStmts(taggedTemplateExpression.tag, taggedFuncArgus, placeholdersStmts, taggedTemplateExpression);
    }

    private collectTemplateValues(templateLiteral: ts.TemplateLiteral): {
        stmts: Stmt[];
        stringTextValues: Value[];
        placeholderValues: Value[];
        stringTextPositions: FullPosition[];
        placeholderPositions: FullPosition[];
    } {
        const stmts: Stmt[] = [];
        if (ts.isNoSubstitutionTemplateLiteral(templateLiteral)) {
            const templateLiteralString = templateLiteral.getText(this.sourceFile);
            return {
                stmts: [],
                stringTextValues: [ValueUtil.createStringConst(templateLiteralString)],
                placeholderValues: [],
                stringTextPositions: [FullPosition.buildFromNode(templateLiteral, this.sourceFile)],
                placeholderPositions: [],
            };
        }
        const head = templateLiteral.head;
        const stringTextValues: Value[] = [ValueUtil.createStringConst(head.rawText || '')];
        const placeholderValues: Value[] = [];
        const stringTextPositions: FullPosition[] = [FullPosition.buildFromNode(head, this.sourceFile)];
        const placeholderPositions: FullPosition[] = [];
        for (const templateSpan of templateLiteral.templateSpans) {
            let {
                value: exprValue,
                valueOriginalPositions: exprPositions,
                stmts: exprStmts,
            } = this.tsNodeToValueAndStmts(templateSpan.expression);
            exprStmts.forEach(stmt => stmts.push(stmt));
            if (IRUtils.moreThanOneAddress(exprValue)) {
                ({
                    value: exprValue,
                    valueOriginalPositions: exprPositions,
                    stmts: exprStmts,
                } = this.arkIRTransformer.generateAssignStmtForValue(exprValue, exprPositions));
                exprStmts.forEach(stmt => stmts.push(stmt));
            }
            placeholderValues.push(exprValue);
            placeholderPositions.push(exprPositions[0]);
            stringTextPositions.push(FullPosition.buildFromNode(templateSpan.literal, this.sourceFile));
            stringTextValues.push(ValueUtil.createStringConst(templateSpan.literal.rawText || ''));
        }
        return {
            stmts,
            stringTextValues,
            placeholderValues,
            stringTextPositions,
            placeholderPositions,
        };
    }

    private identifierToValueAndStmts(identifier: ts.Identifier, variableDefFlag: boolean = false): ValueAndStmts {
        let identifierValue: Value;
        let identifierPositions = [FullPosition.buildFromNode(identifier, this.sourceFile)];
        if (identifier.text === UndefinedType.getInstance().getName()) {
            identifierValue = ValueUtil.getUndefinedConst();
        } else {
            if (variableDefFlag) {
                identifierValue = this.addNewLocal(identifier.text);
            } else {
                identifierValue = this.getOrCreateLocal(identifier.text);
            }
        }
        return {
            value: identifierValue,
            valueOriginalPositions: identifierPositions,
            stmts: [],
        };
    }

    private propertyAccessExpressionToValue(propertyAccessExpression: ts.PropertyAccessExpression): ValueAndStmts {
        const stmts: Stmt[] = [];
        let {
            value: baseValue,
            valueOriginalPositions: basePositions,
            stmts: baseStmts,
        } = this.tsNodeToValueAndStmts(propertyAccessExpression.expression);
        baseStmts.forEach(stmt => stmts.push(stmt));
        if (IRUtils.moreThanOneAddress(baseValue)) {
            ({
                value: baseValue,
                valueOriginalPositions: basePositions,
                stmts: baseStmts,
            } = this.arkIRTransformer.generateAssignStmtForValue(baseValue, basePositions));
            baseStmts.forEach(stmt => stmts.push(stmt));
        }
        if (!(baseValue instanceof Local)) {
            ({
                value: baseValue,
                valueOriginalPositions: basePositions,
                stmts: baseStmts,
            } = this.arkIRTransformer.generateAssignStmtForValue(baseValue, basePositions));
            baseStmts.forEach(stmt => stmts.push(stmt));
        }

        const fieldRefPositions = [FullPosition.buildFromNode(propertyAccessExpression, this.sourceFile), ...basePositions];

        // this if for the case: const obj: Object = Object.create(Object.prototype);
        if (baseValue instanceof Local && baseValue.getName() === Builtin.OBJECT) {
            this.locals.delete(baseValue.getName());
            const fieldSignature = new FieldSignature(
                propertyAccessExpression.name.getText(this.sourceFile),
                Builtin.OBJECT_CLASS_SIGNATURE,
                UnknownType.getInstance(),
                true,
            );
            const fieldRef = new ArkStaticFieldRef(fieldSignature);
            return {
                value: fieldRef,
                valueOriginalPositions: fieldRefPositions,
                stmts: stmts,
            };
        }

        let fieldSignature: FieldSignature;
        if (baseValue instanceof Local && baseValue.getType() instanceof ClassType) {
            fieldSignature = new FieldSignature(
                propertyAccessExpression.name.getText(this.sourceFile),
                (baseValue.getType() as ClassType).getClassSignature(),
                UnknownType.getInstance(),
            );
        } else {
            fieldSignature = ArkSignatureBuilder.buildFieldSignatureFromFieldName(propertyAccessExpression.name.getText(this.sourceFile));
        }
        const fieldRef = new ArkInstanceFieldRef(baseValue as Local, fieldSignature);

        return {
            value: fieldRef,
            valueOriginalPositions: fieldRefPositions,
            stmts: stmts,
        };
    }

    private elementAccessExpressionToValueAndStmts(elementAccessExpression: ts.ElementAccessExpression): ValueAndStmts {
        const stmts: Stmt[] = [];
        let {
            value: baseValue,
            valueOriginalPositions: basePositions,
            stmts: baseStmts,
        } = this.tsNodeToValueAndStmts(elementAccessExpression.expression);
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
        } = this.tsNodeToValueAndStmts(elementAccessExpression.argumentExpression);
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
        if (baseValue.getType() instanceof ArrayType) {
            elementAccessExpr = new ArkArrayRef(baseValue as Local, argumentValue);
        } else {
            // TODO: deal with ArkStaticFieldRef
            const fieldSignature = ArkSignatureBuilder.buildFieldSignatureFromFieldName(argumentValue.toString());
            elementAccessExpr = new ArkInstanceFieldRef(baseValue as Local, fieldSignature, true);
        }
        // reserve positions for field name
        const exprPositions = [FullPosition.buildFromNode(elementAccessExpression, this.sourceFile), ...basePositions, ...arguPositions];
        return {
            value: elementAccessExpr,
            valueOriginalPositions: exprPositions,
            stmts: stmts,
        };
    }

    private callExpressionToValueAndStmts(callExpression: ts.CallExpression): ValueAndStmts {
        const stmts: Stmt[] = [];
        const argus = this.parseArgumentsOfCallExpression(stmts, callExpression);
        return this.generateInvokeValueAndStmts(callExpression.expression, argus, stmts, callExpression);
    }

    private generateInvokeValueAndStmts(
        functionNameNode: ts.LeftHandSideExpression,
        args: {
            realGenericTypes: Type[] | undefined;
            argValues: Value[];
            argPositions: FullPosition[];
            spreadFlags?: boolean[];
        },
        currStmts: Stmt[],
        callExpression: ts.CallExpression | ts.TaggedTemplateExpression,
    ): ValueAndStmts {
        const stmts = [...currStmts];
        const { value: calleeValue, valueOriginalPositions: calleePositions, stmts: calleeStmts } =
            this.tsNodeToValueAndStmts(functionNameNode);
        stmts.push(...calleeStmts);

        const invokeExprPosition = FullPosition.buildFromNode(callExpression, this.sourceFile);

        if (calleeValue instanceof AbstractFieldRef) {
            return this.handleFieldRefInvoke(calleeValue, args, invokeExprPosition, calleePositions, stmts);
        }

        if (calleeValue instanceof Local) {
            return this.handleLocalInvoke(calleeValue, callExpression, args, invokeExprPosition, calleePositions, stmts);
        }

        if (calleeValue instanceof ArkArrayRef && ts.isElementAccessExpression(functionNameNode)) {
            return this.handleArrayRefInvoke(calleeValue, functionNameNode as ts.ElementAccessExpression, args,
                invokeExprPosition, calleePositions, stmts);
        }

        return this.handleDefaultInvoke(calleeValue, args, invokeExprPosition, calleePositions, stmts);
    }

    private handleFieldRefInvoke(
        calleeValue: AbstractFieldRef,
        args: {
            realGenericTypes: Type[] | undefined;
            argValues: Value[];
            argPositions: FullPosition[];
            spreadFlags?: boolean[];
        },
        invokeExprPosition: FullPosition,
        calleePositions: FullPosition[],
        currStmts: Stmt[],
    ): ValueAndStmts {
        let methodSignature: MethodSignature;
        const declareSignature = calleeValue.getFieldSignature().getDeclaringSignature();
        if (declareSignature instanceof ClassSignature) {
            methodSignature =
                new MethodSignature(declareSignature, ArkSignatureBuilder.buildMethodSubSignatureFromMethodName(calleeValue.getFieldName()));
        } else {
            methodSignature = ArkSignatureBuilder.buildMethodSignatureFromMethodName(calleeValue.getFieldName());
        }

        let invokeExpr: Value;
        const invokeExprPositions: FullPosition[] = [invokeExprPosition];
        if (calleeValue instanceof ArkInstanceFieldRef) {
            invokeExpr =
                new ArkInstanceInvokeExpr(calleeValue.getBase(), methodSignature, args.argValues, args.realGenericTypes, args.spreadFlags);
            invokeExprPositions.push(...calleePositions.slice(1));
        } else {
            invokeExpr = new ArkStaticInvokeExpr(methodSignature, args.argValues, args.realGenericTypes, args.spreadFlags);
        }
        invokeExprPositions.push(...args.argPositions);
        return {
            value: invokeExpr,
            valueOriginalPositions: invokeExprPositions,
            stmts: currStmts,
        };
    }

    private handleLocalInvoke(
        calleeValue: Local,
        callExpression: ts.CallExpression | ts.TaggedTemplateExpression,
        args: {
            realGenericTypes: Type[] | undefined;
            argValues: Value[];
            argPositions: FullPosition[];
            spreadFlags?: boolean[];
        },
        invokeExprPosition: FullPosition,
        calleePositions: FullPosition[],
        currStmts: Stmt[],
    ): ValueAndStmts {
        let invokeExpr: Value;
        const invokeExprPositions: FullPosition[] = [invokeExprPosition];
        const calleeName = calleeValue.getName();

        if (this.isCustomViewCall(calleeName, callExpression)) {
            return this.generateCustomViewStmt(calleeName, args.argValues, args.argPositions, callExpression as ts.CallExpression, currStmts);
        } else if (this.isSystemComponentCall(calleeName, callExpression)) {
            return this.generateSystemComponentStmt(calleeName, args.argValues, args.argPositions, callExpression as ts.CallExpression, currStmts);
        }

        const methodSignature = ArkSignatureBuilder.buildMethodSignatureFromMethodName(calleeName);
        if (!this.getGlobals()?.has(calleeName) || calleeValue.getType() instanceof FunctionType) {
            // the call to the left value or a value of function type should be ptr invoke expr.
            invokeExpr = new ArkPtrInvokeExpr(methodSignature, calleeValue, args.argValues, args.realGenericTypes, args.spreadFlags);
            invokeExprPositions.push(...calleePositions.slice(1));
        } else {
            invokeExpr = new ArkStaticInvokeExpr(
                methodSignature,
                args.argValues,
                args.realGenericTypes, args.spreadFlags,
            );
        }

        invokeExprPositions.push(...args.argPositions);
        return {
            value: invokeExpr,
            valueOriginalPositions: invokeExprPositions,
            stmts: currStmts,
        };
    }

    private isCustomViewCall(
        callerName: string,
        callExpression: ts.CallExpression | ts.TaggedTemplateExpression,
    ): boolean {
        if (!ts.isCallExpression(callExpression)) {
            return false;
        }
        const classSignature = ArkSignatureBuilder.buildClassSignatureFromClassName(callerName);
        const cls = ModelUtils.getClass(this.declaringMethod, classSignature);
        return cls?.hasComponentDecorator() ?? false;
    }

    private isSystemComponentCall(
        calleeName: string,
        callExpression: ts.CallExpression | ts.TaggedTemplateExpression,
    ): boolean {
        return (calleeName === COMPONENT_FOR_EACH || calleeName === COMPONENT_LAZY_FOR_EACH) &&
            ts.isCallExpression(callExpression);
    }

    private handleArrayRefInvoke(
        calleeValue: ArkArrayRef,
        functionNameNode: ts.ElementAccessExpression,
        args: {
            realGenericTypes: Type[] | undefined;
            argValues: Value[];
            argPositions: FullPosition[];
            spreadFlags?: boolean[];
        },
        invokeExprPosition: FullPosition,
        calleePositions: FullPosition[],
        currStmts: Stmt[],
    ): ValueAndStmts {
        const stmts = [...currStmts];
        const methodSignature = ArkSignatureBuilder.buildMethodSignatureFromMethodName(
            functionNameNode.argumentExpression.getText(),
        );
        stmts.pop();
        const invokeExpr = new ArkInstanceInvokeExpr(calleeValue.getBase(), methodSignature, args.argValues, args.realGenericTypes, args.spreadFlags);
        const invokeExprPositions: FullPosition[] = [invokeExprPosition, calleePositions.slice(1)[0],
            ...args.argPositions];
        return {
            value: invokeExpr,
            valueOriginalPositions: invokeExprPositions,
            stmts: stmts,
        };
    }

    private handleDefaultInvoke(
        calleeValue: Value,
        args: {
            realGenericTypes: Type[] | undefined;
            argValues: Value[];
            argPositions: FullPosition[];
            spreadFlags?: boolean[];
        },
        invokeExprPosition: FullPosition,
        calleePositions: FullPosition[],
        currStmts: Stmt[],
    ): ValueAndStmts {
        const stmts = [...currStmts];
        const { value: newCalleeValue, stmts: newStmts } =
            this.arkIRTransformer.generateAssignStmtForValue(calleeValue, calleePositions);
        stmts.push(...newStmts);

        const invokeExpr = new ArkPtrInvokeExpr(ArkSignatureBuilder.buildMethodSignatureFromMethodName((newCalleeValue as Local).getName()),
            newCalleeValue as Local, args.argValues, args.realGenericTypes, args.spreadFlags);
        const invokeExprPositions: FullPosition[] = [invokeExprPosition, calleePositions.slice(1)[0],
            ...args.argPositions];
        return {
            value: invokeExpr,
            valueOriginalPositions: invokeExprPositions,
            stmts: stmts,
        };
    }

    private parseArgumentsOfCallExpression(
        currStmts: Stmt[],
        callExpression: ts.CallExpression,
    ): {
        realGenericTypes: Type[] | undefined;
        argValues: Value[];
        argPositions: FullPosition[];
        spreadFlags?: boolean[];
    } {
        let realGenericTypes: Type[] | undefined;
        if (callExpression.typeArguments) {
            realGenericTypes = [];
            callExpression.typeArguments.forEach(typeArgument => {
                realGenericTypes!.push(this.resolveTypeNode(typeArgument));
            });
        }

        let builderMethodIndexes: Set<number> | undefined;
        if (ts.isIdentifier(callExpression.expression)) {
            const callerName = callExpression.expression.text;
            if (callerName === COMPONENT_FOR_EACH || callerName === COMPONENT_LAZY_FOR_EACH) {
                builderMethodIndexes = new Set<number>([1]);
            }
        }
        const {
            argValues,
            argPositions, spreadFlags,
        } = this.parseArguments(currStmts, callExpression.arguments, builderMethodIndexes);
        return { realGenericTypes, argValues, argPositions, spreadFlags };
    }

    private parseArguments(
        currStmts: Stmt[],
        argumentNodes?: ts.NodeArray<ts.Expression>,
        builderMethodIndexes?: Set<number>,
    ): {
        argValues: Value[];
        argPositions: FullPosition[];
        spreadFlags?: boolean[];
    } {
        const argValues: Value[] = [];
        const argPositions: FullPosition[] = [];
        let spreadFlags: boolean[] | undefined = [];
        if (argumentNodes) {
            spreadFlags = new Array<boolean>(argumentNodes.length).fill(false);
            for (let i = 0; i < argumentNodes.length; i++) {
                spreadFlags[i] = ts.isSpreadElement(argumentNodes[i]);
                const argument = argumentNodes[i];
                const prevBuilderMethodContextFlag = this.builderMethodContextFlag;
                if (builderMethodIndexes?.has(i)) {
                    this.builderMethodContextFlag = true;
                    this.arkIRTransformer.setBuilderMethodContextFlag(true);
                }
                let {
                    value: argValue,
                    valueOriginalPositions: argPositionsSingle,
                    stmts: argStmts,
                } = this.tsNodeToSingleAddressValueAndStmts(argument);
                this.builderMethodContextFlag = prevBuilderMethodContextFlag;
                this.arkIRTransformer.setBuilderMethodContextFlag(prevBuilderMethodContextFlag);
                argStmts.forEach(s => currStmts.push(s));
                argValues.push(argValue);
                argPositions.push(argPositionsSingle[0]);
            }
        }
        return {
            argValues,
            argPositions,
            spreadFlags: spreadFlags.every((f) => f === false) ? undefined : spreadFlags,
        };
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
            valueOriginalPositions: [FullPosition.buildFromNode(callableNode, this.sourceFile)],
            stmts: [],
        };
    }

    private newExpressionToValueAndStmts(newExpression: ts.NewExpression): ValueAndStmts {
        let className = '';
        if (ts.isClassExpression(newExpression.expression) && newExpression.expression.name) {
            className = newExpression.expression.name.text;
        } else {
            className = newExpression.expression.getText(this.sourceFile);
        }
        if (className === Builtin.ARRAY) {
            return this.newArrayExpressionToValueAndStmts(newExpression);
        }

        const stmts: Stmt[] = [];
        let realGenericTypes: Type[] | undefined;
        if (newExpression.typeArguments) {
            realGenericTypes = [];
            newExpression.typeArguments.forEach(typeArgument => {
                realGenericTypes!.push(this.resolveTypeNode(typeArgument));
            });
        }

        let classSignature = ArkSignatureBuilder.buildClassSignatureFromClassName(className);
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
        } = this.arkIRTransformer.generateAssignStmtForValue(newExpr, [FullPosition.buildFromNode(newExpression, this.sourceFile)]);
        newExprStmts.forEach(stmt => stmts.push(stmt));

        const constructorMethodSubSignature = ArkSignatureBuilder.buildMethodSubSignatureFromMethodName(CONSTRUCTOR_NAME);
        const constructorMethodSignature = new MethodSignature(classSignature, constructorMethodSubSignature);

        const {
            argValues: argValues,
            argPositions: argPositions,
        } = this.parseArguments(stmts, newExpression.arguments);
        const instanceInvokeExpr = new ArkInstanceInvokeExpr(newLocal as Local, constructorMethodSignature, argValues);

        const assignStmt = new ArkAssignStmt(newLocal, instanceInvokeExpr);
        const assignStmtPositions = [newLocalPositions[0], newLocalPositions[0], ...newLocalPositions, ...argPositions];
        assignStmt.setOperandOriginalPositions(assignStmtPositions);
        stmts.push(assignStmt);
        return { value: newLocal, valueOriginalPositions: assignStmtPositions, stmts: stmts };
    }

    private newArrayExpressionToValueAndStmts(newArrayExpression: ts.NewExpression): ValueAndStmts {
        let baseType: Type = UnknownType.getInstance();
        if (newArrayExpression.typeArguments && newArrayExpression.typeArguments.length > 0) {
            const argumentType = this.resolveTypeNode(newArrayExpression.typeArguments[0]);
            if (!(argumentType instanceof AnyType || argumentType instanceof UnknownType)) {
                baseType = argumentType;
            }
        }
        const stmts: Stmt[] = [];
        const { argValues, argPositions } = this.parseArguments(stmts, newArrayExpression.arguments);
        let argumentsLength = newArrayExpression.arguments ? newArrayExpression.arguments.length : 0;
        let arrayLengthValue: Value;
        let arrayLength = -1;
        let arrayLengthPosition = FullPosition.DEFAULT;
        if (argumentsLength === 1 && (argValues[0].getType() instanceof NumberType || argValues[0].getType() instanceof UnknownType)) {
            arrayLengthValue = argValues[0];
            arrayLengthPosition = argPositions[0];
        } else {
            arrayLengthValue = ValueUtil.getOrCreateNumberConst(argumentsLength);
            arrayLength = argumentsLength;
        }
        if (baseType instanceof UnknownType) {
            if (argumentsLength > 1 && !(argValues[0].getType() instanceof UnknownType)) {
                baseType = argValues[0].getType();
            } else {
                baseType = AnyType.getInstance();
            }
        }
        const newArrayExprPosition = FullPosition.buildFromNode(newArrayExpression, this.sourceFile);
        return this.generateArrayExprAndStmts(
            baseType,
            arrayLengthValue,
            arrayLengthPosition,
            arrayLength,
            argValues,
            argPositions,
            stmts,
            newArrayExprPosition,
            false,
        );
    }

    private arrayLiteralExpressionToValueAndStmts(arrayLiteralExpression: ts.ArrayLiteralExpression): ValueAndStmts {
        const stmts: Stmt[] = [];
        const elementTypes: Type[] = [];
        const elementValues: Value[] = [];
        const elementPositions: FullPosition[] = [];
        const arrayLength = arrayLiteralExpression.elements.length;
        let firstSpreadIdx = -1;
        for (let i = 0; i < arrayLength; i++) {
            if (ts.isSpreadElement(arrayLiteralExpression.elements[i]) && firstSpreadIdx === -1) {
                firstSpreadIdx = i;
            }
            const { value: elementValue, valueOriginalPositions: elementPosition, stmts: elementStmts } =
                this.tsNodeToSingleAddressValueAndStmts(arrayLiteralExpression.elements[i]);
            elementStmts.forEach(stmt => stmts.push(stmt));
            elementValues.push(elementValue);
            elementTypes.push(elementValue.getType());
            elementPositions.push(elementPosition[0]);
        }

        const wholePosition = FullPosition.buildFromNode(arrayLiteralExpression, this.sourceFile);
        if (firstSpreadIdx === -1) { // only literal elements
            return this.generateArrayExprFromLiteral(elementValues, elementTypes, elementPositions, wholePosition, 0,
                arrayLength, stmts);
        } else if (firstSpreadIdx === 0) {
            const scene = this.declaringMethod.getDeclaringArkFile().getScene();
            if (arrayLength === 1) { // only spread element
                const sliceMethodSignature = Builtin.buildArrayMethodSignature(Builtin.SLICE, scene);
                const sliceInvokeExpr = new ArkInstanceInvokeExpr(elementValues[0] as Local, sliceMethodSignature, []);
                const sliceInvokeExprPositions = [wholePosition, elementPositions[0]];
                return { value: sliceInvokeExpr, valueOriginalPositions: sliceInvokeExprPositions, stmts: stmts };
            } else { // spread element start
                const concatMethodSignature = Builtin.buildArrayMethodSignature(Builtin.CONCAT, scene);
                const concatInvokeExpr = new ArkInstanceInvokeExpr(elementValues[0] as Local, concatMethodSignature, elementValues.slice(1));
                const concatInvokeExprPositions = [wholePosition, ...elementPositions];
                return { value: concatInvokeExpr, valueOriginalPositions: concatInvokeExprPositions, stmts: stmts };
            }
        } else { // contains spread elements and begins with literal elements.
            const beginLiteralValueAndStmts = this.generateArrayExprFromLiteral(elementValues, elementTypes,
                elementPositions, wholePosition, 0, firstSpreadIdx, stmts);
            const scene = this.declaringMethod.getDeclaringArkFile().getScene();
            const concatMethodSignature = Builtin.buildArrayMethodSignature(Builtin.CONCAT, scene);
            const concatInvokeExpr = new ArkInstanceInvokeExpr(beginLiteralValueAndStmts.value as Local,
                concatMethodSignature, elementValues.slice(firstSpreadIdx));

            const concatInvokeExprPositions = [wholePosition, beginLiteralValueAndStmts.valueOriginalPositions[0],
                ...elementPositions.slice(firstSpreadIdx)];
            return { value: concatInvokeExpr, valueOriginalPositions: concatInvokeExprPositions, stmts: beginLiteralValueAndStmts.stmts };
        }

    }

    private generateArrayExprFromLiteral(elementValues: Value[], elementTypes: Type[], elementPositions: FullPosition[],
        wholePosition: FullPosition, start: number, end: number, currStmts: Stmt[]): ValueAndStmts {
        const elementTypesSet = new Set(elementTypes.slice(start, end));
        let baseType: Type = AnyType.getInstance();
        if (elementTypesSet.size === 1) {
            baseType = elementTypes[0];
        } else if (elementTypesSet.size > 1) {
            baseType = new UnionType(Array.from(elementTypesSet));
        }

        const newArrayExprPosition = (start === end || (end - start) === elementPositions.length)
            ? wholePosition : FullPosition.merge(elementPositions[0], elementPositions[end - 1]);
        return this.generateArrayExprAndStmts(
            baseType,
            ValueUtil.getOrCreateNumberConst(end - start),
            FullPosition.DEFAULT,
            end - start,
            elementValues.slice(start, end),
            elementPositions.slice(start, end),
            currStmts,
            newArrayExprPosition,
            true,
        );
    }

    private generateArrayExprAndStmts(baseType: Type, arrayLengthValue: Value, arrayLengthPosition: FullPosition,
        arrayLength: number, initializerValues: Value[], initializerPositions: FullPosition[], currStmts: Stmt[],
        newArrayExprPosition: FullPosition, fromLiteral: boolean): ValueAndStmts {
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

    private prefixUnaryExpressionToValueAndStmts(prefixUnaryExpression: ts.PrefixUnaryExpression): ValueAndStmts {
        const stmts: Stmt[] = [];
        let {
            value: originOperandValue,
            valueOriginalPositions: originOperandPositions,
            stmts: operandStmts,
        } = this.tsNodeToValueAndStmts(prefixUnaryExpression.operand);
        operandStmts.forEach(stmt => stmts.push(stmt));
        let operandValue: Value;
        let operandPositions: FullPosition[];
        if (IRUtils.moreThanOneAddress(originOperandValue)) {
            ({
                value: operandValue,
                valueOriginalPositions: operandPositions,
                stmts: operandStmts,
            } = this.arkIRTransformer.generateAssignStmtForValue(originOperandValue, originOperandPositions));
            operandStmts.forEach(stmt => stmts.push(stmt));
        } else {
            operandValue = originOperandValue;
            operandPositions = originOperandPositions;
        }

        const operatorToken = prefixUnaryExpression.operator;
        let exprPositions = [FullPosition.buildFromNode(prefixUnaryExpression, this.sourceFile)];
        if (operatorToken === ts.SyntaxKind.PlusPlusToken || operatorToken === ts.SyntaxKind.MinusMinusToken) {
            const binaryOperator = operatorToken === ts.SyntaxKind.PlusPlusToken ? NormalBinaryOperator.Addition : NormalBinaryOperator.Subtraction;
            const binopExpr = new ArkNormalBinopExpr(operandValue, ValueUtil.getOrCreateNumberConst(1), binaryOperator);
            exprPositions.push(...operandPositions, FullPosition.DEFAULT);
            const assignStmt = new ArkAssignStmt(operandValue, binopExpr);
            assignStmt.setOperandOriginalPositions([...operandPositions, ...exprPositions]);
            stmts.push(assignStmt);
            if (operandValue !== originOperandValue) {
                const lastAssignStmt = new ArkAssignStmt(originOperandValue, operandValue);
                lastAssignStmt.setOperandOriginalPositions([...originOperandPositions, ...operandPositions]);
                stmts.push(lastAssignStmt);
            }
            return { value: originOperandValue, valueOriginalPositions: originOperandPositions, stmts: stmts };
        } else if (operatorToken === ts.SyntaxKind.PlusToken) {
            return { value: operandValue, valueOriginalPositions: operandPositions, stmts: stmts };
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
            return { value: unopExpr, valueOriginalPositions: exprPositions, stmts: stmts };
        }
    }

    private postfixUnaryExpressionToValueAndStmts(postfixUnaryExpression: ts.PostfixUnaryExpression): ValueAndStmts {
        const stmts: Stmt[] = [];
        let {
            value: originOperandValue, valueOriginalPositions: originOperandPositions, stmts: exprStmts,
        } = this.tsNodeToValueAndStmts(postfixUnaryExpression.operand);
        exprStmts.forEach(stmt => stmts.push(stmt));
        let operandValue: Value;
        let operandPositions: FullPosition[];
        if (IRUtils.moreThanOneAddress(originOperandValue)) {
            ({
                value: operandValue,
                valueOriginalPositions: operandPositions,
                stmts: exprStmts,
            } = this.arkIRTransformer.generateAssignStmtForValue(originOperandValue, originOperandPositions));
            exprStmts.forEach(stmt => stmts.push(stmt));
        } else {
            operandValue = originOperandValue;
            operandPositions = originOperandPositions;
        }

        let exprPositions = [FullPosition.buildFromNode(postfixUnaryExpression, this.sourceFile)];
        const operatorToken = postfixUnaryExpression.operator;
        if (operatorToken === ts.SyntaxKind.PlusPlusToken || operatorToken === ts.SyntaxKind.MinusMinusToken) {
            const binaryOperator = operatorToken === ts.SyntaxKind.PlusPlusToken ? NormalBinaryOperator.Addition : NormalBinaryOperator.Subtraction;
            const binopExpr = new ArkNormalBinopExpr(operandValue, ValueUtil.getOrCreateNumberConst(1), binaryOperator);
            exprPositions.push(...operandPositions, FullPosition.DEFAULT);
            const assignStmt = new ArkAssignStmt(operandValue, binopExpr);
            assignStmt.setOperandOriginalPositions([...operandPositions, ...exprPositions]);
            stmts.push(assignStmt);
            if (operandValue !== originOperandValue) {
                const lastAssignStmt = new ArkAssignStmt(originOperandValue, operandValue);
                lastAssignStmt.setOperandOriginalPositions([...originOperandPositions, ...operandPositions]);
                stmts.push(lastAssignStmt);
            }
            return {
                value: originOperandValue,
                valueOriginalPositions: originOperandPositions,
                stmts: stmts,
            };
        }

        return {
            value: ValueUtil.getUndefinedConst(),
            valueOriginalPositions: [FullPosition.DEFAULT],
            stmts: stmts,
        };
    }

    private awaitExpressionToValueAndStmts(awaitExpression: ts.AwaitExpression): ValueAndStmts {
        const stmts: Stmt[] = [];
        let {
            value: promiseValue,
            valueOriginalPositions: promisePositions,
            stmts: promiseStmts,
        } = this.tsNodeToValueAndStmts(awaitExpression.expression);
        promiseStmts.forEach(stmt => stmts.push(stmt));
        if (IRUtils.moreThanOneAddress(promiseValue)) {
            ({
                value: promiseValue,
                valueOriginalPositions: promisePositions,
                stmts: promiseStmts,
            } = this.arkIRTransformer.generateAssignStmtForValue(promiseValue, promisePositions));
            promiseStmts.forEach(stmt => stmts.push(stmt));
        }
        const awaitExpr = new ArkAwaitExpr(promiseValue);
        const awaitExprPositions = [FullPosition.buildFromNode(awaitExpression, this.sourceFile), ...promisePositions];
        return {
            value: awaitExpr,
            valueOriginalPositions: awaitExprPositions,
            stmts: stmts,
        };
    }

    private yieldExpressionToValueAndStmts(yieldExpression: ts.YieldExpression): ValueAndStmts {
        let yieldValue: Value = ValueUtil.getUndefinedConst();
        let yieldPositions = [FullPosition.DEFAULT];
        let stmts: Stmt[] = [];
        if (yieldExpression.expression) {
            ({
                value: yieldValue,
                valueOriginalPositions: yieldPositions,
                stmts: stmts,
            } = this.tsNodeToValueAndStmts(yieldExpression.expression));
        }

        const yieldExpr = new ArkYieldExpr(yieldValue);
        const yieldExprPositions = [FullPosition.buildFromNode(yieldExpression, this.sourceFile), ...yieldPositions];
        return {
            value: yieldExpr,
            valueOriginalPositions: yieldExprPositions,
            stmts: stmts,
        };
    }

    private deleteExpressionToValueAndStmts(deleteExpression: ts.DeleteExpression): ValueAndStmts {
        const {
            value: exprValue,
            valueOriginalPositions: exprPositions,
            stmts: stmts,
        } = this.tsNodeToValueAndStmts(deleteExpression.expression);
        const deleteExpr = new ArkDeleteExpr(exprValue as AbstractFieldRef);
        const deleteExprPositions = [FullPosition.buildFromNode(deleteExpression, this.sourceFile), ...exprPositions];
        return {
            value: deleteExpr,
            valueOriginalPositions: deleteExprPositions,
            stmts: stmts,
        };
    }

    private voidExpressionToValueAndStmts(voidExpression: ts.VoidExpression): ValueAndStmts {
        const {
            value: exprValue,
            valueOriginalPositions: exprPositions,
            stmts: stmts,
        } = this.tsNodeToValueAndStmts(voidExpression.expression);
        const { stmts: exprStmts } = this.arkIRTransformer.generateAssignStmtForValue(exprValue, exprPositions);
        exprStmts.forEach(stmt => stmts.push(stmt));
        return {
            value: ValueUtil.getUndefinedConst(),
            valueOriginalPositions: [FullPosition.DEFAULT],
            stmts: stmts,
        };
    }

    private nonNullExpressionToValueAndStmts(nonNullExpression: ts.NonNullExpression): ValueAndStmts {
        return this.tsNodeToValueAndStmts(nonNullExpression.expression);
    }

    private parenthesizedExpressionToValueAndStmts(parenthesizedExpression: ts.ParenthesizedExpression): ValueAndStmts {
        return this.tsNodeToValueAndStmts(parenthesizedExpression.expression);
    }

    private typeOfExpressionToValueAndStmts(typeOfExpression: ts.TypeOfExpression): ValueAndStmts {
        const {
            value: exprValue,
            valueOriginalPositions: exprPositions,
            stmts: exprStmts,
        } = this.tsNodeToValueAndStmts(typeOfExpression.expression);
        const typeOfExpr = new ArkTypeOfExpr(exprValue);
        const typeOfExprPositions = [FullPosition.buildFromNode(typeOfExpression, this.sourceFile), ...exprPositions];
        return {
            value: typeOfExpr,
            valueOriginalPositions: typeOfExprPositions,
            stmts: exprStmts,
        };
    }

    private asExpressionToValueAndStmts(asExpression: ts.AsExpression): ValueAndStmts {
        const stmts: Stmt[] = [];
        let {
            value: exprValue,
            valueOriginalPositions: exprPositions,
            stmts: exprStmts,
        } = this.tsNodeToValueAndStmts(asExpression.expression);
        exprStmts.forEach(stmt => stmts.push(stmt));
        if (IRUtils.moreThanOneAddress(exprValue)) {
            ({
                value: exprValue,
                valueOriginalPositions: exprPositions,
                stmts: exprStmts,
            } = this.arkIRTransformer.generateAssignStmtForValue(exprValue, exprPositions));
            exprStmts.forEach(stmt => stmts.push(stmt));
        }
        const castExpr = new ArkCastExpr(exprValue, this.resolveTypeNode(asExpression.type));
        const castExprPositions = [FullPosition.buildFromNode(asExpression, this.sourceFile), ...exprPositions];
        return {
            value: castExpr,
            valueOriginalPositions: castExprPositions,
            stmts: stmts,
        };
    }

    private typeAssertionToValueAndStmts(typeAssertion: ts.TypeAssertion): ValueAndStmts {
        const {
            value: exprValue,
            valueOriginalPositions: exprPositions,
            stmts: exprStmts,
        } = this.tsNodeToValueAndStmts(typeAssertion.expression);
        const castExpr = new ArkCastExpr(exprValue, this.resolveTypeNode(typeAssertion.type));
        const castExprPositions = [FullPosition.buildFromNode(typeAssertion, this.sourceFile), ...exprPositions];
        return {
            value: castExpr,
            valueOriginalPositions: castExprPositions,
            stmts: exprStmts,
        };
    }

    public variableDeclarationListToValueAndStmts(variableDeclarationList: ts.VariableDeclarationList): ValueAndStmts {
        const stmts: Stmt[] = [];
        const isConst = (variableDeclarationList.flags & ts.NodeFlags.Const) !== 0;
        for (const declaration of variableDeclarationList.declarations) {
            const { stmts: declaredStmts } = this.variableDeclarationToValueAndStmts(declaration, isConst);
            declaredStmts.forEach(s => stmts.push(s));
        }
        return {
            value: ValueUtil.getUndefinedConst(),
            valueOriginalPositions: [FullPosition.DEFAULT],
            stmts: stmts,
        };
    }

    public variableDeclarationToValueAndStmts(variableDeclaration: ts.VariableDeclaration, isConst: boolean,
        needRightOp: boolean = true): ValueAndStmts {
        const leftOpNode = variableDeclaration.name;
        const rightOpNode = variableDeclaration.initializer;
        const declarationType = variableDeclaration.type ? this.resolveTypeNode(variableDeclaration.type) : UnknownType.getInstance();
        return this.assignmentToValueAndStmts(leftOpNode, rightOpNode, true, isConst, declarationType, needRightOp);
    }

    private assignmentToValueAndStmts(leftOpNode: ts.Node, rightOpNode: ts.Node | undefined, variableDefFlag: boolean,
        isConst: boolean, declarationType: Type, needRightOp: boolean = true): ValueAndStmts {
        let leftValueAndStmts: ValueAndStmts;
        if (ts.isIdentifier(leftOpNode)) {
            leftValueAndStmts = this.identifierToValueAndStmts(leftOpNode, variableDefFlag);
        } else if (ts.isArrayBindingPattern(leftOpNode) || ts.isArrayLiteralExpression(leftOpNode)) {
            // In declaration, it is ArrayBindingPattern. And in assignment, it is ArrayLiteralExpression.
            leftValueAndStmts = this.arrayDestructuringToValueAndStmts(leftOpNode, isConst);
        } else if (ts.isObjectBindingPattern(leftOpNode) || ts.isObjectLiteralExpression(leftOpNode)) {
            // In declaration, it is ObjectBindingPattern. And in assignment, it is ObjectLiteralExpression.
            leftValueAndStmts = this.objectDestructuringToValueAndStmts(leftOpNode, isConst);
        } else {
            leftValueAndStmts = this.tsNodeToValueAndStmts(leftOpNode);
        }
        const { value: leftValue, valueOriginalPositions: leftPositions, stmts: leftStmts } = leftValueAndStmts;

        let stmts: Stmt[] = [];
        if (needRightOp) {
            const {
                value: rightValue, valueOriginalPositions: rightPositions, stmts: rightStmts,
            } = this.assignmentRightOpToValueAndStmts(rightOpNode, leftValue);
            if (leftValue instanceof Local) {
                if (variableDefFlag) {
                    leftValue.setConstFlag(isConst);
                    leftValue.setType(declarationType);
                }
                if (leftValue.getType() instanceof UnknownType && !(rightValue.getType() instanceof UnknownType) &&
                    !(rightValue.getType() instanceof UndefinedType)) {
                    leftValue.setType(rightValue.getType());
                }
            }
            const assignStmt = new ArkAssignStmt(leftValue, rightValue);
            assignStmt.setOperandOriginalPositions([...leftPositions, ...rightPositions]);
            if (ts.isArrayBindingPattern(leftOpNode) || ts.isArrayLiteralExpression(leftOpNode) ||
                ts.isObjectBindingPattern(leftOpNode) || ts.isObjectLiteralExpression(leftOpNode)
            ) {
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
            ({
                value: rightValue,
                valueOriginalPositions: rightPositions,
                stmts: tempRightStmts,
            } = this.tsNodeToValueAndStmts(rightOpNode));
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
    private arrayDestructuringToValueAndStmts(arrayDestructuring: ts.ArrayBindingPattern | ts.ArrayLiteralExpression,
        isConst: boolean = false): ValueAndStmts {
        const stmts: Stmt[] = [];
        const arrayTempLocal = this.generateTempLocal();
        const wholePosition = FullPosition.buildFromNode(arrayDestructuring, this.sourceFile);
        const elements = arrayDestructuring.elements;
        const isArrayBindingPattern = ts.isArrayBindingPattern(arrayDestructuring);
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            if (ts.isOmittedExpression(element)) {
                continue;
            }

            const targetLocalPosition = FullPosition.buildFromNode(element, this.sourceFile);
            if (ts.isSpreadElement(element) || (ts.isBindingElement(element) && element.dotDotDotToken)) {
                const nodeInsideRest = ts.isSpreadElement(element) ? element.expression : element.name;
                let targetLocal: Value;
                let stmtsInsideRest: Stmt[] = [];
                if (ts.isArrayBindingPattern(nodeInsideRest) || ts.isArrayLiteralExpression(nodeInsideRest)) {
                    ({ value: targetLocal, stmts: stmtsInsideRest } = this.arrayDestructuringToValueAndStmts(
                        nodeInsideRest, isConst));
                } else {
                    const elementName = nodeInsideRest.getText(this.sourceFile);
                    targetLocal = ts.isBindingElement(element) ? this.addNewLocal(elementName) : this.getOrCreateLocal(
                        elementName);
                }

                const sliceMethodSubSignature = ArkSignatureBuilder.buildMethodSubSignatureFromMethodName(
                    Builtin.SLICE);
                const sliceMethodSignature = new MethodSignature(Builtin.ARRAY_CLASS_SIGNATURE,
                    sliceMethodSubSignature);
                const sliceInvokeExpr = new ArkInstanceInvokeExpr(arrayTempLocal, sliceMethodSignature,
                    [ValueUtil.getOrCreateNumberConst(i)]);
                const sliceInvokeExprPositions = [wholePosition, targetLocalPosition];
                const assignStmt = new ArkAssignStmt(targetLocal, sliceInvokeExpr);
                assignStmt.setOperandOriginalPositions([targetLocalPosition, ...sliceInvokeExprPositions]);
                stmts.push(assignStmt);
                stmtsInsideRest.forEach(stmt => stmts.push(stmt));
            } else {
                const arrayRef = new ArkArrayRef(arrayTempLocal, ValueUtil.getOrCreateNumberConst(i));
                const arrayRefPositions = [wholePosition, wholePosition, FullPosition.DEFAULT];
                const itemName = element.getText(this.sourceFile);
                const targetLocal = isArrayBindingPattern ? this.addNewLocal(itemName) : this.getOrCreateLocal(
                    itemName);
                isArrayBindingPattern && targetLocal.setConstFlag(isConst);
                const assignStmt = new ArkAssignStmt(targetLocal, arrayRef);
                assignStmt.setOperandOriginalPositions([targetLocalPosition, ...arrayRefPositions]);
                stmts.push(assignStmt);
            }
        }
        return { value: arrayTempLocal, valueOriginalPositions: [wholePosition], stmts: stmts };
    }

    // In assignment patterns, the left operand will be an object literal expression
    private objectDestructuringToValueAndStmts(
        objectDestructuring: ts.ObjectBindingPattern | ts.ObjectLiteralExpression,
        isConst: boolean = false,
    ): ValueAndStmts {
        const stmts: Stmt[] = [];
        const objectTempLocal = this.generateTempLocal();
        const leftOriginalPosition = FullPosition.buildFromNode(objectDestructuring, this.sourceFile);
        const isObjectBindingPattern = ts.isObjectBindingPattern(objectDestructuring);
        const elements = isObjectBindingPattern ? objectDestructuring.elements : objectDestructuring.properties;
        for (const element of elements) {
            let fieldName = '';
            let targetName = '';
            if (ts.isBindingElement(element)) {
                fieldName = element.propertyName ? element.propertyName.getText(this.sourceFile) : element.name.getText(this.sourceFile);
                targetName = element.name.getText(this.sourceFile);
            } else if (ts.isPropertyAssignment(element)) {
                fieldName = element.name.getText(this.sourceFile);
                targetName = element.initializer.getText(this.sourceFile);
            } else if (ts.isShorthandPropertyAssignment(element)) {
                fieldName = element.name.getText(this.sourceFile);
                targetName = fieldName;
            } else {
                continue;
            }

            const fieldSignature = ArkSignatureBuilder.buildFieldSignatureFromFieldName(fieldName);
            const fieldRef = new ArkInstanceFieldRef(objectTempLocal, fieldSignature);
            const fieldRefPositions = [leftOriginalPosition, leftOriginalPosition];
            const targetLocal = isObjectBindingPattern ? this.addNewLocal(targetName) : this.getOrCreateLocal(targetName);
            isObjectBindingPattern && targetLocal.setConstFlag(isConst);
            const targetLocalPosition = FullPosition.buildFromNode(element, this.sourceFile);
            const assignStmt = new ArkAssignStmt(targetLocal, fieldRef);
            assignStmt.setOperandOriginalPositions([targetLocalPosition, ...fieldRefPositions]);
            stmts.push(assignStmt);
        }
        return {
            value: objectTempLocal,
            valueOriginalPositions: [leftOriginalPosition],
            stmts: stmts,
        };
    }

    private binaryExpressionToValueAndStmts(binaryExpression: ts.BinaryExpression): ValueAndStmts {
        const operatorToken = binaryExpression.operatorToken;
        if (operatorToken.kind === ts.SyntaxKind.FirstAssignment) {
            const leftOpNode = binaryExpression.left;
            const rightOpNode = binaryExpression.right;
            const declarationType = UnknownType.getInstance();
            return this.assignmentToValueAndStmts(leftOpNode, rightOpNode, false, false, declarationType, true);
        } else if (ArkValueTransformer.isCompoundAssignmentOperator(operatorToken.kind)) {
            return this.compoundAssignmentToValueAndStmts(binaryExpression);
        }
        const stmts: Stmt[] = [];
        const binaryExpressionPosition = FullPosition.buildFromNode(binaryExpression, this.sourceFile);
        const {
            value: opValue1,
            valueOriginalPositions: opPositions1,
            stmts: opStmts1,
        } = this.tsNodeToSingleAddressValueAndStmts(binaryExpression.left);
        opStmts1.forEach(stmt => stmts.push(stmt));

        if (operatorToken.kind === ts.SyntaxKind.InstanceOfKeyword) {
            const instanceOfExpr = new ArkInstanceOfExpr(opValue1, new UnclearReferenceType(binaryExpression.right.getText(this.sourceFile)));
            const instanceOfExprPositions = [binaryExpressionPosition, ...opPositions1];
            const {
                value: instanceofRes,
                valueOriginalPositions: instanceofPos,
                stmts: instanceofStmt,
            } = this.arkIRTransformer.generateAssignStmtForValue(instanceOfExpr, instanceOfExprPositions);
            instanceofStmt.forEach(stmt => stmts.push(stmt));
            return {
                value: instanceofRes,
                valueOriginalPositions: instanceofPos,
                stmts: stmts,
            };
        }

        const {
            value: opValue2,
            valueOriginalPositions: opPositions2,
            stmts: opStmts2,
        } = this.tsNodeToSingleAddressValueAndStmts(binaryExpression.right);
        opStmts2.forEach(stmt => stmts.push(stmt));
        let exprValue: Value;
        let exprValuePositions = [binaryExpressionPosition];
        if (operatorToken.kind === ts.SyntaxKind.CommaToken) {
            exprValue = opValue2;
        } else {
            const operator = ArkIRTransformer.tokenToBinaryOperator(operatorToken.kind);
            if (operator) {
                if (this.isRelationalOperator(operator)) {
                    exprValue = new ArkConditionExpr(opValue1, opValue2, operator as RelationalBinaryOperator);
                } else {
                    exprValue = new ArkNormalBinopExpr(opValue1, opValue2, operator as NormalBinaryOperator);
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

    private compoundAssignmentToValueAndStmts(binaryExpression: ts.BinaryExpression): ValueAndStmts {
        const stmts: Stmt[] = [];
        const {
            value: leftValueOrig,
            valueOriginalPositions: leftPositionsOrig,
            stmts: leftStmts
        } = this.tsNodeToValueAndStmts(binaryExpression.left);
        leftStmts.forEach(stmt => stmts.push(stmt));
        let leftValue: Value;
        let leftPositions: FullPosition[];
        if (leftValueOrig instanceof AbstractFieldRef) {
            const tempLocal = this.generateTempLocal();
            const readRefStmt = new ArkAssignStmt(tempLocal, leftValueOrig);
            stmts.push(readRefStmt);
            leftValue = tempLocal;
            leftPositions = [leftPositionsOrig[0]];
        } else {
            leftValue = leftValueOrig;
            leftPositions = leftPositionsOrig;
        }
        const {
            value: rightValue,
            valueOriginalPositions: rightPositions,
            stmts: rightStmts
        } = this.tsNodeToSingleAddressValueAndStmts(binaryExpression.right);
        rightStmts.forEach(stmt => stmts.push(stmt));
        const operator = this.compoundAssignmentTokenToBinaryOperator(binaryExpression.operatorToken.kind);
        if (operator) {
            const exprValue = new ArkNormalBinopExpr(leftValue, rightValue, operator);
            const exprValuePosition = FullPosition.buildFromNode(binaryExpression, this.sourceFile);
            const assignTarget = leftValueOrig instanceof AbstractFieldRef ? leftValueOrig : leftValue;
            const assignStmt = new ArkAssignStmt(assignTarget, exprValue);
            assignStmt.setOperandOriginalPositions([
                ...(assignTarget === leftValueOrig ? leftPositionsOrig : leftPositions),
                exprValuePosition,
                ...leftPositions,
                ...rightPositions
            ]);
            stmts.push(assignStmt);
        }
        return {
            value: leftValueOrig,
            valueOriginalPositions: leftPositionsOrig,
            stmts: stmts
        };
    }

    private compoundAssignmentTokenToBinaryOperator(token: ts.SyntaxKind): NormalBinaryOperator | null {
        switch (token) {
            case ts.SyntaxKind.QuestionQuestionEqualsToken:
                return NormalBinaryOperator.NullishCoalescing;
            case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
                return NormalBinaryOperator.Exponentiation;
            case ts.SyntaxKind.SlashEqualsToken:
                return NormalBinaryOperator.Division;
            case ts.SyntaxKind.PlusEqualsToken:
                return NormalBinaryOperator.Addition;
            case ts.SyntaxKind.MinusEqualsToken:
                return NormalBinaryOperator.Subtraction;
            case ts.SyntaxKind.AsteriskEqualsToken:
                return NormalBinaryOperator.Multiplication;
            case ts.SyntaxKind.PercentEqualsToken:
                return NormalBinaryOperator.Remainder;
            case ts.SyntaxKind.LessThanLessThanEqualsToken:
                return NormalBinaryOperator.LeftShift;
            case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
                return NormalBinaryOperator.RightShift;
            case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
                return NormalBinaryOperator.UnsignedRightShift;
            case ts.SyntaxKind.AmpersandEqualsToken:
                return NormalBinaryOperator.BitwiseAnd;
            case ts.SyntaxKind.BarEqualsToken:
                return NormalBinaryOperator.BitwiseOr;
            case ts.SyntaxKind.CaretEqualsToken:
                return NormalBinaryOperator.BitwiseXor;
            case ts.SyntaxKind.AmpersandAmpersandEqualsToken:
                return NormalBinaryOperator.LogicalAnd;
            case ts.SyntaxKind.BarBarEqualsToken:
                return NormalBinaryOperator.LogicalOr;
            default:
        }
        return null;
    }

    public conditionToValueAndStmts(condition: ts.Expression): ValueAndStmts {
        const stmts: Stmt[] = [];
        let {
            value: conditionValue,
            valueOriginalPositions: conditionPositions,
            stmts: conditionStmts,
        } = this.tsNodeToValueAndStmts(condition);
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

    private literalNodeToValueAndStmts(literalNode: ts.Node): ValueAndStmts | null {
        const syntaxKind = literalNode.kind;
        let constant: Constant | null = null;
        switch (syntaxKind) {
            case ts.SyntaxKind.NumericLiteral:
                constant = ValueUtil.getOrCreateNumberConst((literalNode as ts.NumericLiteral).getText(this.sourceFile));
                break;
            case ts.SyntaxKind.BigIntLiteral:
                constant = ValueUtil.createBigIntConst(BigInt((literalNode as ts.BigIntLiteral).text.slice(0, -1)));
                break;
            case ts.SyntaxKind.StringLiteral:
                constant = ValueUtil.createStringConst((literalNode as ts.StringLiteral).text);
                break;
            case ts.SyntaxKind.RegularExpressionLiteral:
                constant = new Constant((literalNode as ts.RegularExpressionLiteral).text, Builtin.REGEXP_CLASS_TYPE);
                break;
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
                constant = ValueUtil.createStringConst((literalNode as ts.NoSubstitutionTemplateLiteral).text);
                break;
            case ts.SyntaxKind.NullKeyword:
                constant = ValueUtil.getNullConstant();
                break;
            case ts.SyntaxKind.UndefinedKeyword:
                constant = ValueUtil.getUndefinedConst();
                break;
            case ts.SyntaxKind.TrueKeyword:
                constant = ValueUtil.getBooleanConstant(true);
                break;
            case ts.SyntaxKind.FalseKeyword:
                constant = ValueUtil.getBooleanConstant(false);
                break;
            default:
                logger.warn(`ast node's syntaxKind is ${ts.SyntaxKind[literalNode.kind]}, not literalNode`);
        }

        if (constant === null) {
            return null;
        }
        return {
            value: constant,
            valueOriginalPositions: [FullPosition.buildFromNode(literalNode, this.sourceFile)],
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

    private isLiteralNode(node: ts.Node): boolean {
        if (
            ts.isStringLiteral(node) ||
            ts.isNumericLiteral(node) ||
            ts.isBigIntLiteral(node) ||
            ts.isRegularExpressionLiteral(node) ||
            ts.isNoSubstitutionTemplateLiteral(node) ||
            node.kind === ts.SyntaxKind.NullKeyword ||
            node.kind === ts.SyntaxKind.TrueKeyword ||
            node.kind === ts.SyntaxKind.FalseKeyword ||
            node.kind === ts.SyntaxKind.UndefinedKeyword
        ) {
            return true;
        }
        return false;
    }

    public resolveTypeNode(type: ts.TypeNode): Type {
        const kind = type.kind;
        switch (kind) {
            case ts.SyntaxKind.BooleanKeyword:
                return BooleanType.getInstance();
            case ts.SyntaxKind.NumberKeyword:
                return NumberType.getInstance();
            case ts.SyntaxKind.StringKeyword:
                return StringType.getInstance();
            case ts.SyntaxKind.UndefinedKeyword:
                return UndefinedType.getInstance();
            case ts.SyntaxKind.AnyKeyword:
                return AnyType.getInstance();
            case ts.SyntaxKind.VoidKeyword:
                return VoidType.getInstance();
            case ts.SyntaxKind.NeverKeyword:
                return NeverType.getInstance();
            case ts.SyntaxKind.BigIntKeyword:
                return BigIntType.getInstance();
            case ts.SyntaxKind.TypeReference:
                return this.resolveTypeReferenceNode(type as ts.TypeReferenceNode);
            case ts.SyntaxKind.ArrayType:
                return new ArrayType(this.resolveTypeNode((type as ts.ArrayTypeNode).elementType), 1);
            case ts.SyntaxKind.UnionType: {
                const mayTypes: Type[] = [];
                (type as ts.UnionTypeNode).types.forEach(t => mayTypes.push(this.resolveTypeNode(t)));
                return new UnionType(mayTypes);
            }
            case ts.SyntaxKind.IntersectionType: {
                const intersectionTypes: Type[] = [];
                (type as ts.IntersectionTypeNode).types.forEach(t => intersectionTypes.push(this.resolveTypeNode(t)));
                return new IntersectionType(intersectionTypes);
            }
            case ts.SyntaxKind.TupleType: {
                const types: Type[] = [];
                (type as ts.TupleTypeNode).elements.forEach(element => {
                    types.push(this.resolveTypeNode(element));
                });
                return new TupleType(types);
            }
            case ts.SyntaxKind.NamedTupleMember:
                return this.resolveTypeNode((type as ts.NamedTupleMember).type);
            case ts.SyntaxKind.LiteralType:
                return ArkValueTransformer.resolveLiteralTypeNode(type as ts.LiteralTypeNode, this.sourceFile);
            case ts.SyntaxKind.TemplateLiteralType:
                return this.resolveTemplateLiteralTypeNode(type as ts.TemplateLiteralTypeNode);
            case ts.SyntaxKind.TypeLiteral:
                return this.resolveTypeLiteralNode(type as ts.TypeLiteralNode);
            case ts.SyntaxKind.FunctionType:
                return this.resolveFunctionTypeNode(type as ts.FunctionTypeNode);
            case ts.SyntaxKind.ImportType:
                return UnknownType.getInstance();
            case ts.SyntaxKind.TypeQuery:
                return this.resolveTypeQueryNode(type as ts.TypeQueryNode);
            case ts.SyntaxKind.ParenthesizedType:
                return this.resolveTypeNode((type as ts.ParenthesizedTypeNode).type);
            case ts.SyntaxKind.TypeOperator:
                return this.resolveTypeOperatorNode(type as ts.TypeOperatorNode);
            default:
                return UnknownType.getInstance();
        }
    }

    private resolveTypeQueryNode(typeQueryNode: ts.TypeQueryNode): Type {
        const genericTypes: Type[] = [];
        if (typeQueryNode.typeArguments) {
            for (const typeArgument of typeQueryNode.typeArguments) {
                genericTypes.push(this.resolveTypeNode(typeArgument));
            }
        }

        const exprNameNode = typeQueryNode.exprName;
        let opValue: Value;
        if (ts.isQualifiedName(exprNameNode)) {
            if (exprNameNode.left.getText(this.sourceFile) === THIS_NAME) {
                const fieldName = exprNameNode.right.getText(this.sourceFile);
                const fieldSignature =
                    this.declaringMethod.getDeclaringArkClass().getFieldWithName(fieldName)?.getSignature() ??
                    ArkSignatureBuilder.buildFieldSignatureFromFieldName(fieldName);
                const baseLocal =
                    this.locals.get(THIS_NAME) ?? new Local(THIS_NAME, new ClassType(this.declaringMethod.getDeclaringArkClass().getSignature(), genericTypes));
                opValue = new ArkInstanceFieldRef(baseLocal, fieldSignature);
            } else {
                const exprName = exprNameNode.getText(this.sourceFile);
                opValue = new Local(exprName, UnknownType.getInstance());
            }
        } else {
            const exprName = exprNameNode.escapedText.toString();
            opValue = this.locals.get(exprName) ?? this.globals?.get(exprName) ?? new Local(exprName, UnknownType.getInstance());
        }

        return new TypeQueryExpr(opValue, genericTypes);
    }

    private resolveTypeOperatorNode(typeOperatorNode: ts.TypeOperatorNode): Type {
        let type = this.resolveTypeNode(typeOperatorNode.type);

        switch (typeOperatorNode.operator) {
            case ts.SyntaxKind.ReadonlyKeyword: {
                if (type instanceof ArrayType || type instanceof TupleType) {
                    type.setReadonlyFlag(true);
                }
                return type;
            }
            case ts.SyntaxKind.KeyOfKeyword: {
                return new KeyofTypeExpr(type);
            }
            case ts.SyntaxKind.UniqueKeyword: {
                return UnknownType.getInstance();
            }
            default:
                return UnknownType.getInstance();
        }
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

    private resolveTemplateLiteralTypeNode(templateLiteralTypeNode: ts.TemplateLiteralTypeNode): Type {
        let stringLiterals: string[] = [''];
        const headString = templateLiteralTypeNode.head.rawText || '';
        let newStringLiterals: string[] = [];
        for (const stringLiteral of stringLiterals) {
            newStringLiterals.push(stringLiteral + headString);
        }
        stringLiterals = newStringLiterals;
        newStringLiterals = [];

        for (const templateSpan of templateLiteralTypeNode.templateSpans) {
            const templateType = this.resolveTypeNode(templateSpan.type);
            const unfoldTemplateTypes: Type[] = [];
            if (templateType instanceof UnionType) {
                unfoldTemplateTypes.push(...templateType.getTypes());
            } else {
                unfoldTemplateTypes.push(templateType);
            }
            const unfoldTemplateTypeStrs: string[] = [];
            for (const unfoldTemplateType of unfoldTemplateTypes) {
                unfoldTemplateTypeStrs.push(
                    unfoldTemplateType instanceof AliasType ? unfoldTemplateType.getOriginalType().toString() : unfoldTemplateType.toString(),
                );
            }

            const templateSpanString = templateSpan.literal.rawText || '';
            for (const stringLiteral of stringLiterals) {
                for (const unfoldTemplateTypeStr of unfoldTemplateTypeStrs) {
                    newStringLiterals.push(stringLiteral + unfoldTemplateTypeStr + templateSpanString);
                }
            }
            stringLiterals = newStringLiterals;
            newStringLiterals = [];
        }

        const templateTypes: Type[] = [];
        for (const stringLiteral of stringLiterals) {
            templateTypes.push(new LiteralType(stringLiteral));
        }
        if (templateTypes.length > 0) {
            return new UnionType(templateTypes);
        }
        return templateTypes[0];
    }

    private resolveTypeReferenceNode(typeReferenceNode: ts.TypeReferenceNode): Type {
        const typeReferenceFullName = ts.isIdentifier(typeReferenceNode.typeName) ? typeReferenceNode.typeName.text :
            typeReferenceNode.typeName.getText(this.sourceFile);
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
            const local = this.locals.get(typeReferenceFullName);
            if (local !== undefined) {
                return local.getType();
            }
            return new UnclearReferenceType(typeReferenceFullName, genericTypes);
        } else {
            if (genericTypes.length > 0) {
                const oldAlias = aliasTypeAndStmt[0];
                let alias = new AliasType(
                    oldAlias.getName(),
                    TypeInference.replaceTypeWithReal(oldAlias.getOriginalType(), genericTypes),
                    oldAlias.getSignature(),
                    oldAlias.getGenericTypes(),
                );
                alias.setRealGenericTypes(genericTypes);
                return alias;
            }
            return aliasTypeAndStmt[0];
        }
    }

    private resolveTypeLiteralNode(typeLiteralNode: ts.TypeLiteralNode): Type {
        const anonymousClass = new ArkClass();
        const declaringClass = this.declaringMethod.getDeclaringArkClass();
        const declaringNamespace = declaringClass.getDeclaringArkNamespace();
        if (declaringNamespace) {
            buildNormalArkClassFromArkNamespace(typeLiteralNode, declaringNamespace, anonymousClass, this.sourceFile);
        } else {
            buildNormalArkClassFromArkFile(typeLiteralNode, declaringClass.getDeclaringArkFile(), anonymousClass, this.sourceFile);
        }
        return new ClassType(anonymousClass.getSignature());
    }

    private resolveFunctionTypeNode(functionTypeNode: ts.FunctionTypeNode): Type {
        const anonymousMethod = new ArkMethod();
        const declaringClass = this.declaringMethod.getDeclaringArkClass();
        buildArkMethodFromArkClass(functionTypeNode, declaringClass, anonymousMethod, this.sourceFile);
        return new FunctionType(anonymousMethod.getSignature());
    }

    public static isCompoundAssignmentOperator(operator: ts.SyntaxKind): boolean {
        const compoundAssignmentOperators = [
            ts.SyntaxKind.PlusEqualsToken,
            ts.SyntaxKind.MinusEqualsToken,
            ts.SyntaxKind.AsteriskAsteriskEqualsToken,
            ts.SyntaxKind.AsteriskEqualsToken,
            ts.SyntaxKind.SlashEqualsToken,
            ts.SyntaxKind.PercentEqualsToken,
            ts.SyntaxKind.AmpersandEqualsToken,
            ts.SyntaxKind.BarEqualsToken,
            ts.SyntaxKind.CaretEqualsToken,
            ts.SyntaxKind.LessThanLessThanEqualsToken,
            ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
            ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
            ts.SyntaxKind.BarBarEqualsToken,
            ts.SyntaxKind.AmpersandAmpersandEqualsToken,
            ts.SyntaxKind.QuestionQuestionEqualsToken,
        ];
        return compoundAssignmentOperators.includes(operator);
    }
}
