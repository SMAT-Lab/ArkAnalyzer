import ts, { HeritageClause, ParameterDeclaration, TypeNode, TypeParameterDeclaration } from "typescript";
import { AnyType, ArrayType, ClassType, LiteralType, NumberType, Type, TypeLiteralType, UnclearReferenceType, UnionType, UnknownType } from "../../base/Type";
import { TypeInference } from "../../common/TypeInference";
import { ArkField } from "../ArkField";
import Logger from "../../../utils/logger";
import { LineColPosition } from "../../base/Position";
import { Value } from "../../base/Value";
import { Constant } from "../../base/Constant";
import { ArkBinopExpr, ArkInstanceInvokeExpr, ArkNewArrayExpr, ArkNewExpr, ArkStaticInvokeExpr, ArkUnopExpr, ArrayLiteralExpr, ObjectLiteralExpr } from "../../base/Expr";
import { ClassSignature, FieldSignature, MethodSignature, MethodSubSignature } from "../ArkSignature";
import { Local } from "../../base/Local";
import { ArkInstanceFieldRef, ArkStaticFieldRef } from "../../base/Ref";
import { ArkClass } from "../ArkClass";
import { ArkMethod } from "../ArkMethod";
import { Decorator, TypeDecorator } from "../../base/Decorator";
import { buildProperty2ArkField } from "./ArkFieldBuilder";
import { ArrayBindingPatternParameter, MethodParameter, ObjectBindingPatternParameter, buildArkMethodFromArkClass } from "./ArkMethodBuilder";
import { buildNormalArkClassFromArkMethod } from "./ArkClassBuilder";

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

export function buildModifiers(modifierArray: ts.NodeArray<ts.ModifierLike>, sourceFile: ts.SourceFile): Set<string | Decorator> {
    let modifiers: Set<string | Decorator> = new Set<string | Decorator>();
    modifierArray.forEach((modifier) => {
        //TODO: find reason!!
        if (ts.SyntaxKind[modifier.kind] == 'FirstContextualKeyword') {
            modifiers.add('AbstractKeyword');
        }
        else if (ts.isDecorator(modifier)) {
            if (ts.isDecorator(modifier)) {
                if (modifier.expression) {
                    let kind = "";
                    if (ts.isIdentifier(modifier.expression)) {
                        kind = modifier.expression.text;
                    }
                    else if (ts.isCallExpression(modifier.expression)) {
                        if (ts.isIdentifier(modifier.expression.expression)) {
                            kind = modifier.expression.expression.text;
                        }
                    }
                    if (kind != "Type") {
                        const decorator = new Decorator(kind);
                        decorator.setContent(modifier.expression.getText(sourceFile));
                        modifiers.add(decorator);
                    } else {
                        const arg = (modifier.expression as ts.CallExpression).arguments[0];
                        const body = (arg as ts.ArrowFunction).body;
                        if (ts.isIdentifier(body)) {
                            const typeDecorator = new TypeDecorator();
                            typeDecorator.setType(body.text);
                            typeDecorator.setContent(modifier.expression.getText(sourceFile));
                            modifiers.add(typeDecorator);
                        }
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

export function buildHeritageClauses(heritageClauses: ts.NodeArray<HeritageClause>): Map<string, string> {
    let heritageClausesMap: Map<string, string> = new Map<string, string>();
    heritageClauses?.forEach((heritageClause) => {
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

export function buildTypeParameters(typeParameters: ts.NodeArray<TypeParameterDeclaration>,
    sourceFile: ts.SourceFile, arkInstance: ArkMethod | ArkClass): Type[] {
    let typeParams: Type[] = [];
    typeParameters.forEach((typeParameter) => {
        tsNode2Type(typeParameter, sourceFile, arkInstance);

        if (typeParameter.modifiers) {
            logger.warn("This typeparameter has modifiers.");
        }

        if (typeParameter.expression) {
            logger.warn("This typeparameter has expression.");
        }
    });
    return typeParams;
}

export function buildParameters(params: ts.NodeArray<ParameterDeclaration>, arkMethod: ArkMethod, sourceFile: ts.SourceFile) {
    let parameters: MethodParameter[] = [];
    params.forEach((parameter) => {
        let methodParameter = new MethodParameter();

        // name
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
            logger.warn("Parameter name is not identifier, ObjectBindingPattern nor ArrayBindingPattern, please contact developers to support this!");
        }

        // questionToken
        if (parameter.questionToken) {
            methodParameter.setOptional(true);
        }

        // type
        if (parameter.type) {
            methodParameter.setType(tsNode2Type(parameter.type, sourceFile, arkMethod));
        }
        else {
            methodParameter.setType(UnknownType.getInstance());
        }

        // initializer
        if (parameter.initializer) {
            //TODO?
        }

        // dotDotDotToken
        if (parameter.dotDotDotToken) {
            //
        }

        // modifiers
        if (parameter.modifiers) {
            //
        }

        parameters.push(methodParameter);
    });
    return parameters;
}

export function buildReturnType(node: TypeNode, sourceFile: ts.SourceFile, method: ArkMethod) {
    if (node) {
        return tsNode2Type(node, sourceFile, method);
    }
    else {
        return new UnknownType();
    }
}

export function tsNode2Type(typeNode: ts.TypeNode | ts.TypeParameterDeclaration, sourceFile: ts.SourceFile,
    arkInstance: ArkMethod | ArkClass | ArkField) {
    if (ts.isTypeReferenceNode(typeNode)) {
        let referenceNodeName = typeNode.typeName;
        if (ts.isQualifiedName(referenceNodeName)) {
            let parameterTypeStr = handleQualifiedName(referenceNodeName as ts.QualifiedName);
            return new UnclearReferenceType(parameterTypeStr);
        }
        else {
            let parameterTypeStr = referenceNodeName.text;
            return new UnclearReferenceType(parameterTypeStr);
        }
    }
    else if (ts.isUnionTypeNode(typeNode)) {
        let unionTypePara: Type[] = [];
        typeNode.types.forEach((tmpType) => {
            unionTypePara.push(tsNode2Type(tmpType, sourceFile, arkInstance));
        });
        return new UnionType(unionTypePara);
    }
    else if (ts.isLiteralTypeNode(typeNode)) {
        return buildTypeFromPreStr(ts.SyntaxKind[typeNode.literal.kind]);
    }
    else if (ts.isTypeLiteralNode(typeNode)) {
        let cls: ArkClass = new ArkClass();
        if (arkInstance) {
            if (arkInstance instanceof ArkMethod) {
                let declaringClass = arkInstance.getDeclaringArkClass();
                if (declaringClass.getDeclaringArkNamespace()) {
                    cls.setDeclaringArkNamespace(declaringClass.getDeclaringArkNamespace());
                    cls.setDeclaringArkFile(declaringClass.getDeclaringArkFile());
                }
                else {
                    cls.setDeclaringArkFile(declaringClass.getDeclaringArkFile());
                }
                buildNormalArkClassFromArkMethod(typeNode, cls, sourceFile);
            }
            else if (arkInstance instanceof ArkClass) {
                //
            }
            else if (arkInstance instanceof ArkField) {
                //
            }
        }

        return new ClassType(cls.getSignature());
    }
    else if (ts.isFunctionTypeNode(typeNode)) {
        debugger;
        // let mtd: ArkMethod = new ArkMethod();
        // buildArkMethodFromArkClass(typeNode, arkMethod.getDeclaringArkClass(), mtd, sourceFile);
        // return buildTypeFromPreStr(ts.SyntaxKind[typeNode.kind]);
    }
    else {
        return buildTypeFromPreStr(ts.SyntaxKind[typeNode.kind]);
    }
    return UnknownType.getInstance();;
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

// export function buildProperty2ArkField(member: ts.PropertyDeclaration | ts.PropertyAssignment | ts.ShorthandPropertyAssignment
//     | ts.SpreadAssignment | ts.PropertySignature | ts.EnumMember, sourceFile: ts.SourceFile): ArkField {
//     let field = new ArkField();
//     field.setFieldType(ts.SyntaxKind[member.kind]);
//     field.setOriginPosition(LineColPosition.buildFromNode(member, sourceFile));

//     // construct initializer
//     if (ts.isPropertyDeclaration(member) || ts.isPropertyAssignment(member) || ts.isEnumMember(member)) {
//         if (member.initializer) {
//             field.setInitializer(tsNode2Value(member.initializer, sourceFile));
//         }
//     } else if (ts.isShorthandPropertyAssignment(member)) {
//         if (member.objectAssignmentInitializer) {
//             field.setInitializer(tsNode2Value(member.objectAssignmentInitializer, sourceFile));
//         }
//     } else if (ts.isSpreadAssignment(member)) {
//         field.setInitializer(tsNode2Value(member.expression, sourceFile));
//     }

//     if (member.name && ts.isComputedPropertyName(member.name)) {
//         if (ts.isIdentifier(member.name.expression)) {
//             let propertyName = member.name.expression.text;
//             field.setName(propertyName);
//         }
//         else if (ts.isPropertyAccessExpression(member.name.expression)) {
//             field.setName(handlePropertyAccessExpression(member.name.expression));
//         }
//         else {
//             logger.warn("Other property expression type found!");
//         }
//     }
//     else if (member.name && ts.isIdentifier(member.name)) {
//         let propertyName = member.name.text;
//         field.setName(propertyName);
//     }
//     else {
//         logger.warn("Other property type found!");
//     }

//     if ((ts.isPropertyDeclaration(member) || ts.isPropertySignature(member)) && member.modifiers) {
//         let modifiers = buildModifiers(member.modifiers, sourceFile);
//         modifiers.forEach((modifier) => {
//             field.addModifier(modifier);
//         });
//     }

//     if ((ts.isPropertyDeclaration(member) || ts.isPropertySignature(member)) && member.type) {
//         field.setType(buildFieldType(member.type));
//     }

//     if ((ts.isPropertyDeclaration(member) || ts.isPropertySignature(member)) && member.questionToken) {
//         field.setQuestionToken(true);
//     }

//     if (ts.isPropertyDeclaration(member) && member.exclamationToken) {
//         field.setExclamationToken(true);
//     }

//     return field;
// }

// export function buildIndexSignature2ArkField(member: ts.IndexSignatureDeclaration, sourceFile: ts.SourceFile): ArkField {
//     let field = new ArkField();
//     field.setFieldType(ts.SyntaxKind[member.kind]);
//     //parameters
//     field.setParameters(buildParameters(member, sourceFile));
//     field.setOriginPosition(LineColPosition.buildFromNode(member, sourceFile));
//     //modifiers
//     if (member.modifiers) {
//         buildModifiers(member.modifiers, sourceFile).forEach((modifier) => {
//             field.addModifier(modifier);
//         });
//     }
//     //type
//     field.setType(buildReturnType4Method(member, sourceFile));
//     return field;
// }

// export function buildGetAccessor2ArkField(member: ts.GetAccessorDeclaration, sourceFile: ts.SourceFile): ArkField {
//     let field = new ArkField();
//     if (ts.isIdentifier(member.name)) {
//         field.setName(member.name.text);
//     }
//     else {
//         logger.warn("Please contact developers to support new type of GetAccessor name!");
//         field.setName('');
//     }
//     field.setFieldType(ts.SyntaxKind[member.kind]);
//     field.setOriginPosition(LineColPosition.buildFromNode(member, sourceFile));
//     return field;
// }

// function buildFieldType(fieldType: ts.TypeNode): Type {
//     if (ts.isUnionTypeNode(fieldType)) {
//         let unionType: Type[] = [];
//         fieldType.types.forEach((tmpType) => {
//             if (ts.isTypeReferenceNode(tmpType)) {
//                 let tmpTypeName = "";
//                 if (ts.isQualifiedName(tmpType.typeName)) {
//                     tmpTypeName = handleQualifiedName(tmpType.typeName);
//                 }
//                 else if (ts.isIdentifier(tmpType.typeName)) {
//                     tmpTypeName = tmpType.typeName.text;
//                 }
//                 else {
//                     logger.warn("Other property type found!");
//                 }
//                 unionType.push(new UnclearReferenceType(tmpTypeName));
//             }
//             else if (ts.isLiteralTypeNode(tmpType)) {
//                 unionType.push(buildTypeFromPreStr(ts.SyntaxKind[tmpType.literal.kind]));
//             }
//             else {
//                 unionType.push(buildTypeFromPreStr(ts.SyntaxKind[tmpType.kind]));
//             }
//         });
//         return new UnionType(unionType)
//     }
//     else if (ts.isTypeReferenceNode(fieldType)) {
//         let tmpTypeName = "";
//         let referenceNodeName = fieldType.typeName;
//         if (ts.isQualifiedName(referenceNodeName)) {
//             tmpTypeName = handleQualifiedName(referenceNodeName);
//         }
//         else if (ts.isIdentifier(referenceNodeName)) {
//             tmpTypeName = referenceNodeName.text;
//         }
//         return new UnclearReferenceType(tmpTypeName);
//     }
//     else if (ts.isArrayTypeNode(fieldType)) {
//         let tmpTypeName = "";
//         if (ts.isTypeReferenceNode(fieldType.elementType)) {
//             if (ts.isQualifiedName(fieldType.elementType.typeName)) {
//                 tmpTypeName = handleQualifiedName(fieldType.elementType.typeName);
//             }
//             else if (ts.isIdentifier(fieldType.elementType.typeName)) {
//                 tmpTypeName = fieldType.elementType.typeName.text;
//             }
//             else {
//                 logger.warn("Other property type found!");
//             }
//             let elementType = new UnclearReferenceType(tmpTypeName);
//             return new ArrayType(elementType, 0);
//         }
//         else {
//             let elementType = buildTypeFromPreStr(ts.SyntaxKind[fieldType.elementType.kind]);
//             return new ArrayType(elementType, 0);
//         }
//     }
//     else if (ts.isLiteralTypeNode(fieldType)) {
//         return buildTypeFromPreStr(ts.SyntaxKind[fieldType.literal.kind]);
//     }
//     else {
//         return buildTypeFromPreStr(ts.SyntaxKind[fieldType.kind]);
//     }
// }

export function tsNode2Value(node: ts.Node, sourceFile: ts.SourceFile, cls: ArkClass): Value {
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
            let value = tsNode2Value(element, sourceFile, cls);
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
        let leftOp = tsNode2Value(node.left, sourceFile, cls);
        let rightOp = tsNode2Value(node.right, sourceFile, cls);
        let op = ts.SyntaxKind[node.operatorToken.kind];
        return new ArkBinopExpr(leftOp, rightOp, op);
    }
    else if (ts.isPrefixUnaryExpression(node)) {
        let op = ts.SyntaxKind[node.operator];
        let value = tsNode2Value(node.operand, sourceFile, cls);
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
        let base = tsNode2Value(node.expression, sourceFile, cls);
        //TODO: support question token?
        return new ArkInstanceFieldRef(base as Local, fieldSignature);
    }
    else if (ts.isCallExpression(node)) {
        let exprValue = tsNode2Value(node.expression, sourceFile, cls);
        let argumentParas: Value[] = [];
        node.arguments.forEach((argument) => {
            argumentParas.push(tsNode2Value(argument, sourceFile, cls));
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
        arkClass.setDeclaringArkFile(cls.getDeclaringArkFile());
        arkClass.genSignature();

        let classSig = new ClassSignature();
        classSig.setClassName(arkClass.getName());
        const classType = new ClassType(classSig);

        //gen arkfields
        let arkFields: ArkField[] = [];
        let arkMethods: ArkMethod[] = [];
        node.properties.forEach((property) => {
            if (ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property) || ts.isSpreadAssignment(property)) {
                arkFields.push(buildProperty2ArkField(property, sourceFile, arkClass));
            }
            else {
                // let methodInfo = buildMethodInfo4MethodNode(property, sourceFile);
                // let arkMethod = new ArkMethod();
                // const { line, character } = ts.getLineAndCharacterOfPosition(
                //     sourceFile,
                //     property.getStart(sourceFile)
                // );
                // arkMethod.setLine(line + 1);
                // arkMethod.setColumn(character + 1);

                // buildNormalArkMethodFromMethodInfo(methodInfo, arkMethod);
                // arkMethods.push(arkMethod);
                let arkMethod = new ArkMethod();
                arkMethod.setDeclaringArkClass(arkClass);
                arkMethod.setDeclaringArkFile();
                buildArkMethodFromArkClass(property, arkClass, arkMethod, sourceFile);
            }
        });
        arkMethods.forEach((mtd) => {
            arkClass.addMethod(mtd);
        });
        arkClass.addFields(arkFields);
        return new ObjectLiteralExpr(arkClass, classType);
    }
    else {
        logger.warn("Other type found for ts node.");
    }
    return new Constant('', UnknownType.getInstance())
}
function buildTypeLiteralNode2ArkClassBak(typeNode: ts.TypeLiteralNode) {
    throw new Error("Function not implemented.");
}

