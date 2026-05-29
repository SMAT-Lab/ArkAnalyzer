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

import { ArkField, FieldCategory } from '../../../../core/model/ArkField';
import { ArkClass } from '../../../../core/model/ArkClass';
import { buildModifiers, cxxNode2Type } from './builderUtils';
import { FieldSignature } from '../../../../core/model/ArkSignature';
import { ClassType, Type, UnknownType } from '../../../../core/base/Type';
import { FullPosition } from '../../../../core/base/Position';
import { ModifierType } from '../../../../core/model/ArkBaseModel';
import { IRUtils } from '../../common/IRUtils';
import { buildGenericType } from '../../../../core/model/builder/builderUtils';
import { CxxAstNode, AstKind } from '../../utils/ArkCxxAstNode';

export function buildProperty2ArkField(member: CxxAstNode, sourceFile: CxxAstNode, cls: ArkClass): ArkField {
    let field = new ArkField();
    field.setCategory(mapSyntaxKindToFieldOriginType(member.kind) as FieldCategory);
    field.setDeclaringArkClass(cls);
    field.setOriginFullPosition(FullPosition.cxxBuildFromNode(member, sourceFile));

    let fieldName = member.name;
    field.addModifier(buildModifiers(member));

    let fieldType: Type = UnknownType.getInstance();
    if ((member.kind === AstKind.FieldDecl || member.kind === AstKind.VarDecl) && member.type) {
        fieldType = buildGenericType(cxxNode2Type(member, cls, sourceFile), field);
    }
    if (member.kind === AstKind.EnumConstantDecl) {
        field.addModifier(ModifierType.STATIC);
        fieldType = new ClassType(cls.getSignature());
    }
    field.setSignature(new FieldSignature(fieldName, cls.getSignature(), fieldType, field.isStatic()));

    IRUtils.setComments(field, member, sourceFile, cls.getDeclaringArkFile().getScene().getOptions());
    cls.addField(field);
    return field;
}

function mapSyntaxKindToFieldOriginType(syntaxKind: AstKind): FieldCategory | null {
    let fieldOriginType: FieldCategory | null = null;
    switch (syntaxKind) {
        case AstKind.FieldDecl:
        case AstKind.TypeAliasDecl:
            fieldOriginType = FieldCategory.PROPERTY_DECLARATION;
            break;
        case AstKind.EnumConstantDecl:
            fieldOriginType = FieldCategory.ENUM_MEMBER;
            break;
        default:
    }
    return fieldOriginType;
}
