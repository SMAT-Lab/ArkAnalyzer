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
import { ArkField, FieldCategory } from '../ArkField';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import { ArkClass } from '../ArkClass';
import { ArkMethod } from '../ArkMethod';
import { buildDecorators, buildGenericType, buildModifiers, handlePropertyAccessExpression, tsNode2Type } from './builderUtils';
import { FieldSignature } from '../ArkSignature';
import { ClassType, Type, UnknownType } from '../../base/Type';
import { FullPosition } from '../../base/Position';
import { ModifierType } from '../ArkBaseModel';
import { IRUtils } from '../../common/IRUtils';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkFieldBuilder');

export type PropertyLike = ts.PropertyDeclaration | ts.PropertyAssignment;

export function buildProperty2ArkField(
    member: ts.PropertyDeclaration | ts.PropertyAssignment | ts.ShorthandPropertyAssignment | ts.SpreadAssignment | ts.PropertySignature | ts.EnumMember,
    sourceFile: ts.SourceFile,
    cls: ArkClass
): ArkField {
    let field = new ArkField();
    field.setCategory(mapSyntaxKindToFieldOriginType(member.kind) as FieldCategory);
    field.setCode(member.getText(sourceFile));
    field.setDeclaringArkClass(cls);
    field.setOriginFullPosition(FullPosition.buildFromNode(member, sourceFile));

    let fieldName = member.getText(sourceFile);
    if (member.name && ts.isComputedPropertyName(member.name)) {
        if (ts.isIdentifier(member.name.expression)) {
            fieldName = member.name.expression.text;
        } else if (ts.isPropertyAccessExpression(member.name.expression)) {
            fieldName = handlePropertyAccessExpression(member.name.expression);
        } else {
            logger.warn(`Other property expression type found: ${member.name.expression.getText()}!`);
        }
    } else if (member.name && (ts.isIdentifier(member.name) || ts.isLiteralExpression(member.name))) {
        fieldName = member.name.text;
    } else if (member.name && ts.isPrivateIdentifier(member.name)) {
        let propertyName = member.name.text;
        fieldName = propertyName.substring(1);
        field.addModifier(ModifierType.PRIVATE);
    } else {
        logger.warn(`Other type of property name found: ${member.getText()}!`);
    }

    let fieldType: Type = UnknownType.getInstance();
    if (ts.isPropertyDeclaration(member) || ts.isPropertySignature(member)) {
        if (member.modifiers) {
            field.addModifier(buildModifiers(member));
        }
        field.addModifier(0);
        field.setDecorators(buildDecorators(member, sourceFile));
        field.setQuestionToken(member.questionToken !== undefined);

        if (member.type) {
            fieldType = buildGenericType(tsNode2Type(member.type, sourceFile, cls), field);
        }
    }

    if (ts.isEnumMember(member)) {
        field.addModifier(ModifierType.STATIC);
        fieldType = new ClassType(cls.getSignature());
    }
    field.setSignature(new FieldSignature(fieldName, cls.getSignature(), fieldType, field.isStatic()));

    if (ts.isPropertyDeclaration(member) && member.exclamationToken) {
        field.setExclamationToken(true);
    }
    IRUtils.setComments(field, member, sourceFile, cls.getDeclaringArkFile().getScene().getOptions());
    cls.addField(field);
    return field;
}

export function buildIndexSignature2ArkField(member: ts.IndexSignatureDeclaration, sourceFile: ts.SourceFile, cls: ArkClass): void {
    const field = new ArkField();
    field.setCode(member.getText(sourceFile));
    field.setCategory(mapSyntaxKindToFieldOriginType(member.kind) as FieldCategory);
    field.setDeclaringArkClass(cls);

    field.setOriginFullPosition(FullPosition.buildFromNode(member, sourceFile));

    if (member.modifiers) {
        let modifier = buildModifiers(member);
        field.addModifier(modifier);
    }

    const fieldName = '[' + member.parameters[0].getText(sourceFile) + ']';
    const fieldType = buildGenericType(tsNode2Type(member.type, sourceFile, field), field);
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
    field.setCategory(mapSyntaxKindToFieldOriginType(member.kind) as FieldCategory);
    field.setOriginFullPosition(FullPosition.buildFromNode(member, sourceFile));

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

function mapSyntaxKindToFieldOriginType(syntaxKind: ts.SyntaxKind): FieldCategory | null {
    let fieldOriginType: FieldCategory | null = null;
    switch (syntaxKind) {
        case ts.SyntaxKind.PropertyDeclaration:
            fieldOriginType = FieldCategory.PROPERTY_DECLARATION;
            break;
        case ts.SyntaxKind.PropertyAssignment:
            fieldOriginType = FieldCategory.PROPERTY_ASSIGNMENT;
            break;
        case ts.SyntaxKind.ShorthandPropertyAssignment:
            fieldOriginType = FieldCategory.SHORT_HAND_PROPERTY_ASSIGNMENT;
            break;
        case ts.SyntaxKind.SpreadAssignment:
            fieldOriginType = FieldCategory.SPREAD_ASSIGNMENT;
            break;
        case ts.SyntaxKind.PropertySignature:
            fieldOriginType = FieldCategory.PROPERTY_SIGNATURE;
            break;
        case ts.SyntaxKind.EnumMember:
            fieldOriginType = FieldCategory.ENUM_MEMBER;
            break;
        case ts.SyntaxKind.IndexSignature:
            fieldOriginType = FieldCategory.INDEX_SIGNATURE;
            break;
        case ts.SyntaxKind.GetAccessor:
            fieldOriginType = FieldCategory.GET_ACCESSOR;
            break;
        default:
    }
    return fieldOriginType;
}
