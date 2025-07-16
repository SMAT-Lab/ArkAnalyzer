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
import { ArkClass } from '../../../core/model/ArkClass';
import {
    buildModifiers,
    cppNode2Type,
} from './builderUtils';
import { FieldSignature } from '../../../core/model/ArkSignature';
import { ArrayType, ClassType, Type, UnclearReferenceType, UnknownType } from '../../../core/base/Type';
import { LineColPosition } from '../../../core/base/Position';
import { ModifierType } from '../../../core/model/ArkBaseModel';
import { IRUtils } from '../../../core/common/IRUtils';
import { buildGenericType } from '../../../core/model/builder/builderUtils';

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
