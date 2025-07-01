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

import ts from 'ohos-typescript';
import { ArkField, FieldCategory } from '../../../core/model/ArkField';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import { ArkClass } from '../../../core/model/ArkClass';
import { ArkMethod } from '../../../core/model/ArkMethod';
import {
    buildGenericType,
    buildModifiers,
    handlePropertyAccessExpression,
    cppNode2Type,
} from './builderUtils';
import { FieldSignature } from '../../../core/model/ArkSignature';
import { ArrayType, ClassType, Type, UnclearReferenceType, UnknownType } from '../../../core/base/Type';
import { LineColPosition } from '../../../core/base/Position';
import { ModifierType } from '../../../core/model/ArkBaseModel';
import { IRUtils } from '../../common/IRUtils';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkFieldBuilder');

export type PropertyLike = ts.PropertyDeclaration | ts.PropertyAssignment;

export function buildProperty2ArkField(
    member: any,
    sourceFile: ts.SourceFile,
    cls: ArkClass
): ArkField {
    let field = new ArkField();
    field.setCategory(mapSyntaxKindToFieldOriginType(member.kind) as FieldCategory);
    field.setCode(member.code);
    field.setDeclaringArkClass(cls);
    field.setOriginPosition(LineColPosition.buildFromNodeCpp(member, sourceFile));

    let fieldName = member.name;
    field.addModifier(buildModifiers(member));

    let fieldType: Type = UnknownType.getInstance();
    if ((member.kind == 'FieldDecl' || member.kind == 'VarDecl') && member.type){
        fieldType = buildGenericType(cppNode2Type(member.type.qualType, sourceFile, cls), field);
    }
    if(member.kind == 'EnumConstantDecl'){
        field.addModifier(ModifierType.STATIC);
        fieldType = new ClassType(cls.getSignature());
    }
    if (member.type.qualType.includes('[') && member.type.qualType.includes(']')) {
        const matches = member.type.qualType.match(/\[/g);
        const count = matches ? matches.length : 0;
        let baseType = cppNode2Type(member.type.qualType.slice(0, member.type.qualType.indexOf('[')), sourceFile, cls);
        if (baseType instanceof UnclearReferenceType) {
            fieldType = new ArrayType(new UnclearReferenceType(member.type.qualType.slice(0, member.type.qualType.indexOf('['))), count);
        }
        fieldType = new ArrayType(baseType, count);
    }
    field.setSignature(new FieldSignature(fieldName, cls.getSignature(), fieldType, field.isStatic()));

    IRUtils.setComments(field, member, sourceFile, cls.getDeclaringArkFile().getScene().getOptions());
    cls.addField(field);
    return field;
}

export function buildIndexSignature2ArkField(member: any, sourceFile: any, cls: ArkClass): void {
    const field = new ArkField();
    field.setCode(member.code);
    field.setCategory(mapSyntaxKindToFieldOriginType(member.kind.toString()) as FieldCategory);
    field.setDeclaringArkClass(cls);

    field.setOriginPosition(LineColPosition.buildFromNodeCpp(member, sourceFile));

    if (member.modifiers) {
        let modifier = buildModifiers(member);
        field.addModifier(modifier);
    }

    const fieldName = '[' + member.parameters[0].getText(sourceFile) + ']';
    const fieldType = buildGenericType(cppNode2Type(member.type.qualType, sourceFile, field), field);
    const fieldSignature = new FieldSignature(fieldName, cls.getSignature(), fieldType, true);
    field.setSignature(fieldSignature);
    IRUtils.setComments(field, member, sourceFile, cls.getDeclaringArkFile().getScene().getOptions());
    cls.addField(field);
}

export function buildGetAccessor2ArkField(member: ts.GetAccessorDeclaration, mthd: ArkMethod, sourceFile: ts.SourceFile): void {
    let cls = mthd.getDeclaringArkClass();
    let field = new ArkField();
    field.setDeclaringArkClass(cls);

    field.setCode(member.getText(sourceFile));
    field.setCategory(mapSyntaxKindToFieldOriginType(member.kind.toString()) as FieldCategory);
    field.setOriginPosition(LineColPosition.buildFromNodeCpp(member, sourceFile));

    let fieldName = member.getText(sourceFile);
    if (ts.isIdentifier(member.name) || ts.isLiteralExpression(member.name)) {
        fieldName = member.name.text;
    } else if (ts.isComputedPropertyName(member.name)) {
        if (ts.isIdentifier(member.name.expression)) {
            let propertyName = member.name.expression.text;
            fieldName = propertyName;
        } else if (ts.isPropertyAccessExpression(member.name.expression)) {
            fieldName = handlePropertyAccessExpression(member.name.expression);
        } else if (ts.isLiteralExpression(member.name.expression)) {
            fieldName = member.name.expression.text;
        } else {
            logger.warn('Other type of computed property name found!');
        }
    } else {
        logger.warn('Please contact developers to support new type of GetAccessor name!');
    }

    const fieldType = mthd.getReturnType();
    const fieldSignature = new FieldSignature(fieldName, cls.getSignature(), fieldType, false);
    field.setSignature(fieldSignature);
    cls.addField(field);
}

function mapSyntaxKindToFieldOriginType(syntaxKind: String): FieldCategory | null {
    let fieldOriginType: FieldCategory | null = null;
    switch (syntaxKind) {
        case 'FieldDecl':
            fieldOriginType = FieldCategory.PROPERTY_DECLARATION;
            break;
        default:
    }
    return fieldOriginType;
}
