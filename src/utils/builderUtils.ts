import ts from "typescript";
import { AnyType, ClassType, LiteralType, NumberType, Type, TypeLiteralType, UnclearReferenceType, UnionType, UnknownType } from "../core/base/Type";
import { ArrayBindingPatternParameter, MethodParameter, ObjectBindingPatternParameter, buildMethodInfo4MethodNode } from "../core/common/MethodInfoBuilder";
import { TypeInference } from "../core/common/TypeInference";
import { ArkField } from "../core/model/ArkField";
import Logger from "./logger";
import { LineColPosition } from "../core/base/Position";
import { Value } from "../core/base/Value";
import { Constant } from "../core/base/Constant";
import { ArkBinopExpr, ArkInstanceInvokeExpr, ArkNewArrayExpr, ArkNewExpr, ArkStaticInvokeExpr, ArkUnopExpr, ArrayLiteralExpr, ObjectLiteralExpr } from "../core/base/Expr";
import { ClassSignature, FieldSignature, MethodSignature, MethodSubSignature } from "../core/model/ArkSignature";
import { Local } from "../core/base/Local";
import { ArkInstanceFieldRef, ArkStaticFieldRef } from "../core/base/Ref";
import { ArkClass } from "../core/model/ArkClass";
import { ArkMethod, buildNormalArkMethodFromMethodInfo } from "../core/model/ArkMethod";

const logger = Logger.getLogger();

export function handleQualifiedName(node: ts.QualifiedName): string {
    let right = (node.right as ts.Identifier).text;
    let left: string = '';
    if (ts.SyntaxKind[node.left.kind] == 'Identifier') {
        left = (node.left as ts.Identifier).text;
    }
    else if (ts.SyntaxKind[node.left.kind] == 'QualifiedName') {
        left = handleQualifiedName(node.left as ts.QualifiedName);
    }
    let qualifiedName = left + '.' + right;
    return qualifiedName;
}

export function handlePropertyAccessExpression(node: ts.PropertyAccessExpression): string {
    let right = (node.name as ts.Identifier).text;
    let left: string = '';
    if (ts.SyntaxKind[node.expression.kind] == 'Identifier') {
        left = (node.expression as ts.Identifier).text;
    }
    else if (ts.isStringLiteral(node.expression)) {
        left = node.expression.text;
    }
    else if (ts.isPropertyAccessExpression(node.expression)) {
        left = handlePropertyAccessExpression(node.expression as ts.PropertyAccessExpression);
    }
    let propertyAccessExpressionName = left + '.' + right;
    return propertyAccessExpressionName;
}

export function buildModifiers(modifierArray: ts.NodeArray<ts.ModifierLike>): Set<string> {
    let modifiers: Set<string> = new Set<string>();
    modifierArray.forEach((modifier) => {
        //TODO: find reason!!
        if (ts.SyntaxKind[modifier.kind] == 'FirstContextualKeyword') {
            modifiers.add('AbstractKeyword');
        }
        else if (ts.isDecorator(modifier)) {
            if (modifier.expression) {
                if (ts.isIdentifier(modifier.expression)) {
                    modifiers.add(modifier.expression.text);
                }
                else if (ts.isCallExpression(modifier.expression)) {
                    if (ts.isIdentifier(modifier.expression.expression)) {
                        modifiers.add(modifier.expression.expression.text);
                    }
                }
            }
        }
        else {
            modifiers.add(ts.SyntaxKind[modifier.kind]);
        }
    });
    return modifiers;
}

export function buildHeritageClauses(node: ts.ClassDeclaration | ts.ClassExpression | ts.InterfaceDeclaration): Map<string, string> {
    let heritageClausesMap: Map<string, string> = new Map<string, string>();
    node.heritageClauses?.forEach((heritageClause) => {
        heritageClause.types.forEach((type) => {
            let heritageClauseName: string = '';
            if (ts.isIdentifier(type.expression)) {
                heritageClauseName = (type.expression as ts.Identifier).text;
            }
            else if (ts.isPropertyAccessExpression(type.expression)) {
                heritageClauseName = handlePropertyAccessExpression(type.expression);
            }
            else {
                logger.warn("Other type expression found!!!");
            }
            heritageClausesMap.set(heritageClauseName, ts.SyntaxKind[heritageClause.token]);
        });
    });
    return heritageClausesMap;
}

export function buildTypeParameters(node: ts.ClassDeclaration | ts.ClassExpression |
    ts.InterfaceDeclaration | ts.FunctionDeclaration | ts.MethodDeclaration |
    ts.ConstructorDeclaration | ts.ArrowFunction | ts.AccessorDeclaration |
    ts.FunctionExpression | ts.MethodSignature | ts.ConstructSignatureDeclaration |
    ts.CallSignatureDeclaration): Type[] {
    let typeParameters: Type[] = [];
    node.typeParameters?.forEach((typeParameter) => {
        if (ts.isIdentifier(typeParameter.name)) {
            let parametersTypeStr = typeParameter.name.text;
            typeParameters.push(buildTypeFromPreStr(parametersTypeStr));
        }
        else {
            logger.warn("Other typeparameter found!!!");
        }
    });
    return typeParameters;
}

export function buildParameters(node: ts.FunctionDeclaration | ts.MethodDeclaration
    | ts.ConstructorDeclaration | ts.ArrowFunction | ts.AccessorDeclaration |
    ts.FunctionExpression | ts.CallSignatureDeclaration | ts.MethodSignature |
    ts.ConstructSignatureDeclaration | ts.IndexSignatureDeclaration, sourceFile: ts.SourceFile) {
    let parameters: MethodParameter[] = [];
    node.parameters.forEach((parameter) => {
        let methodParameter = new MethodParameter();
        if (ts.isIdentifier(parameter.name)) {
            methodParameter.setName(parameter.name.text);
        }
        else if (ts.isObjectBindingPattern(parameter.name)) {
            methodParameter.setName("ObjectBindingPattern");
            let elements: ObjectBindingPatternParameter[] = [];
            parameter.name.elements.forEach((element) => {
                let paraElement = new ObjectBindingPatternParameter();
                if (element.propertyName) {
                    if (ts.isIdentifier(element.propertyName)) {
                        paraElement.setPropertyName(element.propertyName.text);
                    }
                    else {
                        logger.warn("New propertyName of ObjectBindingPattern found, please contact developers to support this!");
                    }
                }

                if (element.name) {
                    if (ts.isIdentifier(element.name)) {
                        paraElement.setName(element.name.text);
                    }
                    else {
                        logger.warn("New name of ObjectBindingPattern found, please contact developers to support this!");
                    }
                }

                if (element.initializer) {
                    logger.warn("TODO: support ObjectBindingPattern initializer.");
                }

                if (element.dotDotDotToken) {
                    paraElement.setOptional(true);
                }
                elements.push(paraElement);
            });
            methodParameter.setObjElements(elements);
        }
        else if (ts.isArrayBindingPattern(parameter.name)) {
            methodParameter.setName("ArrayBindingPattern");
            let elements: ArrayBindingPatternParameter[] = [];
            parameter.name.elements.forEach((element) => {
                let paraElement = new ArrayBindingPatternParameter();
                if (ts.isBindingElement(element)) {
                    if (element.propertyName) {
                        if (ts.isIdentifier(element.propertyName)) {
                            paraElement.setPropertyName(element.propertyName.text);
                        }
                        else {
                            logger.warn("New propertyName of ArrayBindingPattern found, please contact developers to support this!");
                        }
                    }

                    if (element.name) {
                        if (ts.isIdentifier(element.name)) {
                            paraElement.setName(element.name.text);
                        }
                        else {
                            logger.warn("New name of ArrayBindingPattern found, please contact developers to support this!");
                        }
                    }

                    if (element.initializer) {
                        logger.warn("TODO: support ArrayBindingPattern initializer.");
                    }

                    if (element.dotDotDotToken) {
                        paraElement.setOptional(true);
                    }
                }
                else if (ts.isOmittedExpression(element)) {
                    logger.warn("TODO: support OmittedExpression for ArrayBindingPattern parameter name.");
                }
                elements.push(paraElement);
            });
            methodParameter.setArrayElements(elements);
        }
        else {
            logger.warn("Parameter name is not identifier, please contact developers to support this!");
        }
        if (parameter.questionToken) {
            methodParameter.setOptional(true);
        }
        if (parameter.type) {
            if (ts.isTypeReferenceNode(parameter.type)) {
                let referenceNodeName = parameter.type.typeName;
                if (ts.isQualifiedName(referenceNodeName)) {
                    let parameterTypeStr = handleQualifiedName(referenceNodeName as ts.QualifiedName);
                    let parameterType = new UnclearReferenceType(parameterTypeStr);
                    methodParameter.setType(parameterType);
                }
                else if (ts.isIdentifier(referenceNodeName)) {
                    let parameterTypeStr = (referenceNodeName as ts.Identifier).text;
                    let parameterType = new UnclearReferenceType(parameterTypeStr);
                    methodParameter.setType(parameterType);
                }
            }
            else if (ts.isUnionTypeNode(parameter.type)) {
                let unionTypePara: Type[] = [];
                parameter.type.types.forEach((tmpType) => {
                    if (ts.isTypeReferenceNode(tmpType)) {
                        let parameterType = "";
                        if (ts.isQualifiedName(tmpType.typeName)) {
                            parameterType = handleQualifiedName(tmpType.typeName);
                        }
                        else if (ts.isIdentifier(tmpType.typeName)) {
                            parameterType = tmpType.typeName.text;
                        }
                        unionTypePara.push(new UnclearReferenceType(parameterType));
                    }
                    else if (ts.isLiteralTypeNode(tmpType)) {
                        unionTypePara.push(buildTypeFromPreStr(ts.SyntaxKind[tmpType.literal.kind]));
                    }
                    else {
                        unionTypePara.push(buildTypeFromPreStr(ts.SyntaxKind[tmpType.kind]));
                    }
                });
                methodParameter.setType(new UnionType(unionTypePara));
            }
            else if (ts.isLiteralTypeNode(parameter.type)) {
                methodParameter.setType(buildTypeFromPreStr(ts.SyntaxKind[parameter.type.literal.kind]));
            }
            else if (ts.isTypeLiteralNode(parameter.type)) {
                let members: ArkField[] = [];
                parameter.type.members.forEach((member) => {
                    if (ts.isPropertySignature(member)) {
                        members.push(buildProperty2ArkField(member, sourceFile));
                    }
                    else if (ts.isIndexSignatureDeclaration(member)) {
                        members.push(buildIndexSignature2ArkField(member, sourceFile));
                    }
                    else if (ts.isConstructSignatureDeclaration(member)) {
                        //Bug, To be fixed
                        //members.push(buildMethodInfo4MethodNode(member));
                    }
                    else if (ts.isCallSignatureDeclaration(member)) {
                        //Bug, To be fixed
                        //members.push(buildMethodInfo4MethodNode(member));
                    }
                    else {
                        logger.warn("Please contact developers to support new TypeLiteral member!");
                    }
                });
                let type = new TypeLiteralType();
                type.setMembers(members);
                methodParameter.setType(type);
            }
            else {
                methodParameter.setType(buildTypeFromPreStr(ts.SyntaxKind[parameter.type.kind]));
            }
        }
        else {
            methodParameter.setType(UnknownType.getInstance());
        }

        parameters.push(methodParameter);
    });
    return parameters;
}

export function buildReturnType4Method(node: ts.FunctionDeclaration | ts.MethodDeclaration |
    ts.ConstructorDeclaration | ts.ArrowFunction | ts.AccessorDeclaration |
    ts.FunctionExpression | ts.MethodSignature | ts.ConstructSignatureDeclaration |
    ts.CallSignatureDeclaration | ts.IndexSignatureDeclaration, sourceFile: ts.SourceFile) {
    if (node.type) {
        if (ts.isTypeLiteralNode(node.type)) {
            let members: ArkField[] = [];
            node.type.members.forEach((member) => {
                if (ts.isPropertySignature(member)) {
                    members.push(buildProperty2ArkField(member, sourceFile));
                }
                else if (ts.isIndexSignatureDeclaration(member)) {
                    members.push(buildIndexSignature2ArkField(member, sourceFile));
                }
                else {
                    logger.warn("Please contact developers to support new TypeLiteral member!");
                }
            });
            let type = new TypeLiteralType();
            type.setMembers(members);
            return type;
        }
        else if (ts.isTypeReferenceNode(node.type)) {
            let referenceNodeName = node.type.typeName;
            let typeName = "";
            if (ts.isQualifiedName(referenceNodeName)) {
                typeName = handleQualifiedName(referenceNodeName);
            }
            else if (ts.isIdentifier(referenceNodeName)) {
                typeName = referenceNodeName.text;
            }
            else {
                logger.warn("New type of referenceNodeName found! Please contact developers to support this.");
            }
            return new UnclearReferenceType(typeName);
        }
        else if (ts.isUnionTypeNode(node.type)) {
            let unionType: Type[] = [];
            node.type.types.forEach((tmpType) => {
                if (ts.isTypeReferenceNode(tmpType)) {
                    let typeName = "";
                    if (ts.isIdentifier(tmpType.typeName)) {
                        typeName = tmpType.typeName.text;
                    }
                    else if (ts.isQualifiedName(tmpType.typeName)) {
                        typeName = handleQualifiedName(tmpType.typeName);
                    }
                    else if (ts.isTypeLiteralNode(tmpType.typeName)) {
                        logger.warn("Type name is TypeLiteral, please contact developers to add support for this!");
                    }
                    else {
                        logger.warn("New type name of TypeReference in UnionType.");
                    }
                    unionType.push(new UnclearReferenceType(typeName));
                }
                else if (ts.isLiteralTypeNode(tmpType)) {
                    let literalType: LiteralType = new LiteralType(ts.SyntaxKind[tmpType.literal.kind]);
                    unionType.push(literalType);
                }
                else {
                    unionType.push(buildTypeFromPreStr(ts.SyntaxKind[tmpType.kind]));
                }
            });
            return unionType;
        }
        else if (ts.isLiteralTypeNode(node.type)) {
            let literalType: LiteralType = new LiteralType(ts.SyntaxKind[node.type.literal.kind]);
            return literalType;
        }
        else {
            return buildTypeFromPreStr(ts.SyntaxKind[node.type.kind]);
        }
    }
    return new UnknownType();
}

export function buildTypeFromPreStr(preStr: string) {
    let postStr = "";
    switch (preStr) {
        case 'BooleanKeyword':
            postStr = "boolean";
            break;
        case 'FalseKeyword':
            postStr = "boolean";
            break;
        case 'TrueKeyword':
            postStr = "boolean";
            break;
        case 'NumberKeyword':
            postStr = "number";
            break;
        case 'NumericLiteral':
            postStr = "number";
            break;
        case 'FirstLiteralToken':
            postStr = "number";
            break;
        case 'StringKeyword':
            postStr = "string";
            break;
        case 'StringLiteral':
            postStr = "string";
            break;
        case 'UndefinedKeyword':
            postStr = "undefined";
            break;
        case 'NullKeyword':
            postStr = "null";
            break;
        case 'AnyKeyword':
            postStr = "any";
            break;
        case 'VoidKeyword':
            postStr = "void";
            break;
        case 'NeverKeyword':
            postStr = "never";
            break;
        default:
            postStr = preStr;
    }
    return TypeInference.buildTypeFromStr(postStr);
}

export function buildProperty2ArkField(member: ts.PropertyDeclaration | ts.PropertyAssignment | ts.ShorthandPropertyAssignment
    | ts.SpreadAssignment | ts.PropertySignature | ts.EnumMember, sourceFile: ts.SourceFile): ArkField {
    let field = new ArkField();
    field.setFieldType(ts.SyntaxKind[member.kind]);
    field.setOriginPosition(LineColPosition.buildFromNode(member, sourceFile));

    // construct initializer
    if (ts.isPropertyDeclaration(member) || ts.isEnumMember(member)) {
        if (member.initializer) {
            field.setInitializer(tsNode2Value(member.initializer, sourceFile));
        }
    }

    if (ts.isShorthandPropertyAssignment(member)) {
        if (member.objectAssignmentInitializer) {
            field.setInitializer(tsNode2Value(member.objectAssignmentInitializer, sourceFile));
        }
    }
    if (ts.isSpreadAssignment(member)) {
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
        let modifiers = buildModifiers(member.modifiers);
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

    return field;
}

export function buildIndexSignature2ArkField(member: ts.IndexSignatureDeclaration, sourceFile: ts.SourceFile): ArkField {
    let field = new ArkField();
    field.setFieldType(ts.SyntaxKind[member.kind]);
    //parameters
    field.setParameters(buildParameters(member, sourceFile));
    field.setOriginPosition(LineColPosition.buildFromNode(member, sourceFile));
    //modifiers
    if (member.modifiers) {
        buildModifiers(member.modifiers).forEach((modifier) => {
            field.addModifier(modifier);
        });
    }
    //type
    field.setType(buildReturnType4Method(member, sourceFile));
    return field;
}

export function buildGetAccessor2ArkField(member: ts.GetAccessorDeclaration, sourceFile: ts.SourceFile): ArkField {
    let field = new ArkField();
    if (ts.isIdentifier(member.name)) {
        field.setName(member.name.text);
    }
    else {
        logger.warn("Please contact developers to support new type of GetAccessor name!");
        field.setName('');
    }
    field.setFieldType(ts.SyntaxKind[member.kind]);
    field.setOriginPosition(LineColPosition.buildFromNode(member, sourceFile));
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
        return unionType;
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
    else if (ts.isLiteralTypeNode(fieldType)) {
        return buildTypeFromPreStr(ts.SyntaxKind[fieldType.literal.kind]);
    }
    else {
        return buildTypeFromPreStr(ts.SyntaxKind[fieldType.kind]);
    }
}

function tsNode2Value(node: ts.Node, sourceFile: ts.SourceFile): Value {
    let nodeKind = ts.SyntaxKind[node.kind];
    if (nodeKind == 'NumericLiteral' ||
        nodeKind == 'StringLiteral' ||
        nodeKind == 'TrueKeyword' ||
        nodeKind == 'FalseKeyword' ||
        nodeKind == 'FirstLiteralToken') {
        let type = buildTypeFromPreStr(nodeKind);
        let value = node.getText(sourceFile);
        return new Constant(value, type);
    }
    else if (ts.isNewExpression(node)) {
        if (ts.isIdentifier(node.expression)) {
            let className = node.expression.escapedText.toString();
            let tmpTypes: Type[] = [];
            node.typeArguments?.forEach((type) => {
                tmpTypes.push(buildTypeFromPreStr(ts.SyntaxKind[type.kind]));
            });
            let typeArguments: UnionType = new UnionType(tmpTypes);
            let arrayArguments: Constant[] = [];
            node.arguments?.forEach((argument) => {
                let value = argument.getText(sourceFile);
                let type: Type = AnyType.getInstance();
                if (ts.SyntaxKind[argument.kind] != 'Identifier') {
                    type = buildTypeFromPreStr(ts.SyntaxKind[argument.kind]);
                }
                arrayArguments.push(new Constant(value, type));
            });
            if (className === 'Array') {
                if (arrayArguments.length == 1 && (arrayArguments[0].getType() instanceof NumberType)) {
                    return new ArkNewArrayExpr(typeArguments, arrayArguments[0]);
                }
                else if (arrayArguments.length == 1 && !(arrayArguments[0].getType() instanceof NumberType)) {
                    //TODO, Local number or others
                    logger.warn("TODO, Local number or others.");
                }
                else if (arrayArguments.length > 1) {
                    let newArrayExpr = new ArkNewArrayExpr(typeArguments, new Constant(arrayArguments.length.toString(), NumberType.getInstance()));
                    //TODO: add each value for this array
                    logger.warn("TODO, Local number or others.");
                    return newArrayExpr;
                }
            }
            else {
                let classSignature = new ClassSignature();
                classSignature.setClassName(className);
                const classType = new ClassType(classSignature);
                return new ArkNewExpr(classType);
            }
        }
        else {
            logger.warn("Other newExpr type found for ts node.");
        }

    }
    else if (ts.isArrayLiteralExpression(node)) {
        let elements: Value[] = [];
        node.elements.forEach((element) => {
            let value = tsNode2Value(element, sourceFile);
            if (value == undefined) {
                elements.push(new Constant('', buildTypeFromPreStr('UndefinedKeyword')));
            }
            else {
                elements.push(value);
            }
        });
        let types: Type[] = [];
        elements.forEach((element) => {
            types.push(element.getType());
        });
        let type = new UnionType(types);
        return new ArrayLiteralExpr(elements, type);;
    }
    else if (ts.isBinaryExpression(node)) {
        let leftOp = tsNode2Value(node.left, sourceFile);
        let rightOp = tsNode2Value(node.right, sourceFile);
        let op = ts.SyntaxKind[node.operatorToken.kind];
        return new ArkBinopExpr(leftOp, rightOp, op);
    }
    else if (ts.isPrefixUnaryExpression(node)) {
        let op = ts.SyntaxKind[node.operator];
        let value = tsNode2Value(node.operand, sourceFile);
        return new ArkUnopExpr(value, op);
    }
    else if (ts.isIdentifier(node)) {
        let name = node.escapedText.toString();
        return new Local(name);
    }
    else if (ts.isPropertyAccessExpression(node)) {
        let fieldName = node.name.escapedText.toString();
        const fieldSignature = new FieldSignature();
        fieldSignature.setFieldName(fieldName);
        let base = tsNode2Value(node.expression, sourceFile);
        //TODO: support question token?
        return new ArkInstanceFieldRef(base as Local, fieldSignature);
    }
    else if (ts.isCallExpression(node)) {
        let exprValue = tsNode2Value(node.expression, sourceFile);
        let argumentParas: Value[] = [];
        node.arguments.forEach((argument) => {
            argumentParas.push(tsNode2Value(argument, sourceFile));
        });
        //TODO: support typeArguments

        let classSignature = new ClassSignature();
        let methodSubSignature = new MethodSubSignature();
        let methodSignature = new MethodSignature();
        methodSignature.setDeclaringClassSignature(classSignature);
        methodSignature.setMethodSubSignature(methodSubSignature);

        if (exprValue instanceof ArkInstanceFieldRef) {
            let methodName = exprValue.getFieldName();
            let base = exprValue.getBase()
            methodSubSignature.setMethodName(methodName);
            return new ArkInstanceInvokeExpr(base, methodSignature, argumentParas);
        } else if (exprValue instanceof ArkStaticFieldRef) {
            methodSubSignature.setMethodName(exprValue.getFieldName());
            return new ArkStaticInvokeExpr(methodSignature, argumentParas);
        } else {
            methodSubSignature.setMethodName(node.getText(sourceFile));
            return new ArkStaticInvokeExpr(methodSignature, argumentParas);
        }
    }
    else if (ts.isObjectLiteralExpression(node)) {

        let anonymousClassName = 'AnonymousClass-initializer';

        // TODO: 解析类体
        let arkClass: ArkClass = new ArkClass();
        arkClass.setName(anonymousClassName);
        const { line, character } = ts.getLineAndCharacterOfPosition(
            sourceFile,
            node.getStart(sourceFile)
        );
        arkClass.setLine(line + 1);
        arkClass.setColumn(character + 1);

        let classSig = new ClassSignature();
        classSig.setClassName(arkClass.getName());
        const classType = new ClassType(classSig);

        //gen arkfields
        let arkFields: ArkField[] = [];
        let arkMethods: ArkMethod[] = [];
        node.properties.forEach((property) => {
            if (ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property) || ts.isSpreadAssignment(property)) {
                arkFields.push(buildProperty2ArkField(property, sourceFile));
            }
            else {
                let methodInfo = buildMethodInfo4MethodNode(property, sourceFile);
                let arkMethod = new ArkMethod();
                const { line, character } = ts.getLineAndCharacterOfPosition(
                    sourceFile,
                    property.getStart(sourceFile)
                );
                arkMethod.setLine(line + 1);
                arkMethod.setColumn(character + 1);

                buildNormalArkMethodFromMethodInfo(methodInfo, arkMethod);
                arkMethods.push(arkMethod);
            }
        });
        arkMethods.forEach((mtd) => {
            arkClass.addMethod(mtd);
        });

        return new ObjectLiteralExpr(arkClass, classType);
    }
    else {
        logger.warn("Other type found for ts node.");
    }
    return new Constant('', UnknownType.getInstance())
}