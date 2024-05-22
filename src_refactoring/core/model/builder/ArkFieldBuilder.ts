import ts from "typescript";
import { ArrayType, Type, UnclearReferenceType, UnionType } from "../../base/Type";
import { ArkField } from "../ArkField";
import Logger from "../../../utils/logger";
import { LineColPosition } from "../../base/Position";
import { ArkClass } from "../ArkClass";
import { ArkMethod } from "../ArkMethod";
import { buildModifiers, buildParameters, buildReturnType, buildTypeFromPreStr, handlePropertyAccessExpression, handleQualifiedName, tsNode2Value } from "./builderUtils";

const logger = Logger.getLogger();

export type PropertyLike = ts.PropertyDeclaration | ts.PropertyAssignment;

export function buildProperty2ArkField(member: ts.PropertyDeclaration | ts.PropertyAssignment | ts.ShorthandPropertyAssignment
    | ts.SpreadAssignment | ts.PropertySignature | ts.EnumMember, sourceFile: ts.SourceFile, cls?: ArkClass): ArkField {
    let field = new ArkField();
    field.setFieldType(ts.SyntaxKind[member.kind]);
    field.setOriginPosition(LineColPosition.buildFromNode(member, sourceFile));

    // construct initializer
    if (ts.isPropertyDeclaration(member) || ts.isPropertyAssignment(member) || ts.isEnumMember(member)) {
        if (member.initializer) {
            field.setInitializer(tsNode2Value(member.initializer, sourceFile));
        }
    } else if (ts.isShorthandPropertyAssignment(member)) {
        if (member.objectAssignmentInitializer) {
            field.setInitializer(tsNode2Value(member.objectAssignmentInitializer, sourceFile));
        }
    } else if (ts.isSpreadAssignment(member)) {
        field.setInitializer(tsNode2Value(member.expression, sourceFile));
    }

    if (member.name && ts.isComputedPropertyName(member.name)) {
        if (ts.isIdentifier(member.name.expression)) {
            let propertyName = member.name.expression.text;
            field.setName(propertyName);
        }
        else if (ts.isPropertyAccessExpression(member.name.expression)) {
            field.setName(handlePropertyAccessExpression(member.name.expression));
        }
        else {
            logger.warn("Other property expression type found!");
        }
    }
    else if (member.name && ts.isIdentifier(member.name)) {
        let propertyName = member.name.text;
        field.setName(propertyName);
    }
    else {
        logger.warn("Other property type found!");
    }

    if ((ts.isPropertyDeclaration(member) || ts.isPropertySignature(member)) && member.modifiers) {
        let modifiers = buildModifiers(member.modifiers, sourceFile);
        modifiers.forEach((modifier) => {
            field.addModifier(modifier);
        });
    }

    if ((ts.isPropertyDeclaration(member) || ts.isPropertySignature(member)) && member.type) {
        field.setType(buildFieldType(member.type));
    }

    if ((ts.isPropertyDeclaration(member) || ts.isPropertySignature(member)) && member.questionToken) {
        field.setQuestionToken(true);
    }

    if (ts.isPropertyDeclaration(member) && member.exclamationToken) {
        field.setExclamationToken(true);
    }

    field.genSignature();
    if (cls) {
        cls.addField(field);
        field.setDeclaringClass(cls);
    }
    return field;
}

export function buildIndexSignature2ArkField(member: ts.IndexSignatureDeclaration, sourceFile: ts.SourceFile, cls?: ArkClass): ArkField {
    let field = new ArkField();
    field.setFieldType(ts.SyntaxKind[member.kind]);

    //parameters
    field.setParameters(buildParameters(member.parameters, sourceFile));
    field.setOriginPosition(LineColPosition.buildFromNode(member, sourceFile));
    //modifiers
    if (member.modifiers) {
        buildModifiers(member.modifiers, sourceFile).forEach((modifier) => {
            field.addModifier(modifier);
        });
    }
    //type
    field.setType(buildReturnType(member.type, sourceFile));

    field.genSignature();
    if (cls) {
        field.setDeclaringClass(cls);
        cls.addField(field);
    }
    return field;
}

export function buildGetAccessor2ArkField(member: ts.GetAccessorDeclaration, mthd: ArkMethod, sourceFile: ts.SourceFile): ArkField {
    let field = new ArkField();
    if (ts.isIdentifier(member.name)) {
        field.setName(member.name.text);
    }
    else {
        logger.warn("Please contact developers to support new type of GetAccessor name!");
        field.setName('');
    }
    let cls = mthd.getDeclaringArkClass();
    field.setFieldType(ts.SyntaxKind[member.kind]);
    field.setOriginPosition(LineColPosition.buildFromNode(member, sourceFile));
    field.setDeclaringClass(cls);
    field.setParameters(mthd.getParameters());
    field.setType(mthd.getReturnType());
    field.setTypeParameters(mthd.getTypeParameter());
    field.setArkMethodSignature(mthd.getSignature());
    field.genSignature();
    cls.addField(field);
    return field;
}

function buildFieldType(fieldType: ts.TypeNode): Type {
    if (ts.isUnionTypeNode(fieldType)) {
        let unionType: Type[] = [];
        fieldType.types.forEach((tmpType) => {
            if (ts.isTypeReferenceNode(tmpType)) {
                let tmpTypeName = "";
                if (ts.isQualifiedName(tmpType.typeName)) {
                    tmpTypeName = handleQualifiedName(tmpType.typeName);
                }
                else if (ts.isIdentifier(tmpType.typeName)) {
                    tmpTypeName = tmpType.typeName.text;
                }
                else {
                    logger.warn("Other property type found!");
                }
                unionType.push(new UnclearReferenceType(tmpTypeName));
            }
            else if (ts.isLiteralTypeNode(tmpType)) {
                unionType.push(buildTypeFromPreStr(ts.SyntaxKind[tmpType.literal.kind]));
            }
            else {
                unionType.push(buildTypeFromPreStr(ts.SyntaxKind[tmpType.kind]));
            }
        });
        return new UnionType(unionType)
    }
    else if (ts.isTypeReferenceNode(fieldType)) {
        let tmpTypeName = "";
        let referenceNodeName = fieldType.typeName;
        if (ts.isQualifiedName(referenceNodeName)) {
            tmpTypeName = handleQualifiedName(referenceNodeName);
        }
        else if (ts.isIdentifier(referenceNodeName)) {
            tmpTypeName = referenceNodeName.text;
        }
        return new UnclearReferenceType(tmpTypeName);
    }
    else if (ts.isArrayTypeNode(fieldType)) {
        let tmpTypeName = "";
        if (ts.isTypeReferenceNode(fieldType.elementType)) {
            if (ts.isQualifiedName(fieldType.elementType.typeName)) {
                tmpTypeName = handleQualifiedName(fieldType.elementType.typeName);
            }
            else if (ts.isIdentifier(fieldType.elementType.typeName)) {
                tmpTypeName = fieldType.elementType.typeName.text;
            }
            else {
                logger.warn("Other property type found!");
            }
            let elementType = new UnclearReferenceType(tmpTypeName);
            return new ArrayType(elementType, 0);
        }
        else {
            let elementType = buildTypeFromPreStr(ts.SyntaxKind[fieldType.elementType.kind]);
            return new ArrayType(elementType, 0);
        }
    }
    else if (ts.isLiteralTypeNode(fieldType)) {
        return buildTypeFromPreStr(ts.SyntaxKind[fieldType.literal.kind]);
    }
    else {
        return buildTypeFromPreStr(ts.SyntaxKind[fieldType.kind]);
    }
}