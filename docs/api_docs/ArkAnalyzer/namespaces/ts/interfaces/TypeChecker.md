[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / TypeChecker

# Interface: TypeChecker

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2384

## Properties

### getIndexInfosOfIndexSymbol()

> **getIndexInfosOfIndexSymbol**: (`indexSymbol`) => [`IndexInfo`](IndexInfo.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2392

#### Parameters

##### indexSymbol

[`Symbol`](Symbol.md)

#### Returns

[`IndexInfo`](IndexInfo.md)[]

## Methods

### clearConstEnumRelate()?

> `optional` **clearConstEnumRelate**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2486

#### Returns

`void`

***

### deleteConstEnumRelate()?

> `optional` **deleteConstEnumRelate**(`path`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2487

#### Parameters

##### path

`string`

#### Returns

`void`

***

### getAliasedSymbol()

> **getAliasedSymbol**(`symbol`): [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2467

Follow all aliases to get the original symbol.

#### Parameters

##### symbol

[`Symbol`](Symbol.md)

#### Returns

[`Symbol`](Symbol.md)

***

### getAmbientModules()

> **getAmbientModules**(): [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2473

#### Returns

[`Symbol`](Symbol.md)[]

***

### getApparentType()

> **getApparentType**(`type`): [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2475

#### Parameters

##### type

[`Type`](Type.md)

#### Returns

[`Type`](Type.md)

***

### getAugmentedPropertiesOfType()

> **getAugmentedPropertiesOfType**(`type`): [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2448

#### Parameters

##### type

[`Type`](Type.md)

#### Returns

[`Symbol`](Symbol.md)[]

***

### getBaseConstraintOfType()

> **getBaseConstraintOfType**(`type`): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2476

#### Parameters

##### type

[`Type`](Type.md)

#### Returns

`undefined` \| [`Type`](Type.md)

***

### getBaseTypeOfLiteralType()

> **getBaseTypeOfLiteralType**(`type`): [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2396

#### Parameters

##### type

[`Type`](Type.md)

#### Returns

[`Type`](Type.md)

***

### getBaseTypes()

> **getBaseTypes**(`type`): [`BaseType`](../type-aliases/BaseType.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2395

#### Parameters

##### type

[`InterfaceType`](InterfaceType.md)

#### Returns

[`BaseType`](../type-aliases/BaseType.md)[]

***

### getConstantValue()

> **getConstantValue**(`node`): `undefined` \| `string` \| `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2464

#### Parameters

##### node

[`EnumMember`](EnumMember.md) | [`PropertyAccessExpression`](PropertyAccessExpression.md) | [`ElementAccessExpression`](ElementAccessExpression.md)

#### Returns

`undefined` \| `string` \| `number`

***

### getConstEnumRelate()?

> `optional` **getConstEnumRelate**(): [`ESMap`](ESMap.md)\<`string`, [`ESMap`](ESMap.md)\<`string`, `string`\>\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2485

#### Returns

[`ESMap`](ESMap.md)\<`string`, [`ESMap`](ESMap.md)\<`string`, `string`\>\>

***

### getContextualType()

> **getContextualType**(`node`): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2451

#### Parameters

##### node

[`Expression`](Expression.md)

#### Returns

`undefined` \| [`Type`](Type.md)

***

### getDeclaredTypeOfSymbol()

> **getDeclaredTypeOfSymbol**(`symbol`): [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2386

#### Parameters

##### symbol

[`Symbol`](Symbol.md)

#### Returns

[`Type`](Type.md)

***

### getDefaultFromTypeParameter()

> **getDefaultFromTypeParameter**(`type`): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2477

#### Parameters

##### type

[`Type`](Type.md)

#### Returns

`undefined` \| [`Type`](Type.md)

***

### getExportsOfModule()

> **getExportsOfModule**(`moduleSymbol`): [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2470

#### Parameters

##### moduleSymbol

[`Symbol`](Symbol.md)

#### Returns

[`Symbol`](Symbol.md)[]

***

### getExportSpecifierLocalTargetSymbol()

> **getExportSpecifierLocalTargetSymbol**(`location`): `undefined` \| [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2428

#### Parameters

##### location

[`Identifier`](Identifier.md) | [`ExportSpecifier`](ExportSpecifier.md)

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

***

### getExportSymbolOfSymbol()

> **getExportSymbolOfSymbol**(`symbol`): [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2437

If a symbol is a local symbol with an associated exported symbol, returns the exported symbol.
Otherwise returns its input.
For example, at `export type T = number;`:
    - `getSymbolAtLocation` at the location `T` will return the exported symbol for `T`.
    - But the result of `getSymbolsInScope` will contain the *local* symbol for `T`, not the exported symbol.
    - Calling `getExportSymbolOfSymbol` on that local symbol will return the exported symbol.

#### Parameters

##### symbol

[`Symbol`](Symbol.md)

#### Returns

[`Symbol`](Symbol.md)

***

### getFullyQualifiedName()

> **getFullyQualifiedName**(`symbol`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2447

#### Parameters

##### symbol

[`Symbol`](Symbol.md)

#### Returns

`string`

***

### getImmediateAliasedSymbol()

> **getImmediateAliasedSymbol**(`symbol`): `undefined` \| [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2469

Follow a *single* alias to get the immediately aliased symbol.

#### Parameters

##### symbol

[`Symbol`](Symbol.md)

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

***

### getIndexInfoOfType()

> **getIndexInfoOfType**(`type`, `kind`): `undefined` \| [`IndexInfo`](IndexInfo.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2390

#### Parameters

##### type

[`Type`](Type.md)

##### kind

[`IndexKind`](../enumerations/IndexKind.md)

#### Returns

`undefined` \| [`IndexInfo`](IndexInfo.md)

***

### getIndexInfosOfType()

> **getIndexInfosOfType**(`type`): readonly [`IndexInfo`](IndexInfo.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2391

#### Parameters

##### type

[`Type`](Type.md)

#### Returns

readonly [`IndexInfo`](IndexInfo.md)[]

***

### getIndexTypeOfType()

> **getIndexTypeOfType**(`type`, `kind`): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2394

#### Parameters

##### type

[`Type`](Type.md)

##### kind

[`IndexKind`](../enumerations/IndexKind.md)

#### Returns

`undefined` \| [`Type`](Type.md)

***

### getJsxIntrinsicTagNamesAt()

> **getJsxIntrinsicTagNamesAt**(`location`): [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2471

#### Parameters

##### location

[`Node`](Node.md)

#### Returns

[`Symbol`](Symbol.md)[]

***

### getNonNullableType()

> **getNonNullableType**(`type`): [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2400

#### Parameters

##### type

[`Type`](Type.md)

#### Returns

[`Type`](Type.md)

***

### getNullableType()

> **getNullableType**(`type`, `flags`): [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2399

#### Parameters

##### type

[`Type`](Type.md)

##### flags

[`TypeFlags`](../enumerations/TypeFlags.md)

#### Returns

[`Type`](Type.md)

***

### getPrivateIdentifierPropertyOfType()

> **getPrivateIdentifierPropertyOfType**(`leftType`, `name`, `location`): `undefined` \| [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2389

#### Parameters

##### leftType

[`Type`](Type.md)

##### name

`string`

##### location

[`Node`](Node.md)

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

***

### getPropertiesOfType()

> **getPropertiesOfType**(`type`): [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2387

#### Parameters

##### type

[`Type`](Type.md)

#### Returns

[`Symbol`](Symbol.md)[]

***

### getPropertyOfType()

> **getPropertyOfType**(`type`, `propertyName`): `undefined` \| [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2388

#### Parameters

##### type

[`Type`](Type.md)

##### propertyName

`string`

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

***

### getPropertySymbolOfDestructuringAssignment()

> **getPropertySymbolOfDestructuringAssignment**(`location`): `undefined` \| [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2438

#### Parameters

##### location

[`Identifier`](Identifier.md)

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

***

### getResolvedSignature()

> **getResolvedSignature**(`node`, `candidatesOutArray?`, `argumentCount?`): `undefined` \| [`Signature`](Signature.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2457

returns unknownSignature in the case of an error.
returns undefined if the node is not valid.

#### Parameters

##### node

[`CallLikeExpression`](../type-aliases/CallLikeExpression.md)

##### candidatesOutArray?

[`Signature`](Signature.md)[]

##### argumentCount?

`number`

Apparent number of arguments, passed in case of a possibly incomplete call. This should come from an ArgumentListInfo. See `signatureHelp.ts`.

#### Returns

`undefined` \| [`Signature`](Signature.md)

***

### getReturnTypeOfSignature()

> **getReturnTypeOfSignature**(`signature`): [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2398

#### Parameters

##### signature

[`Signature`](Signature.md)

#### Returns

[`Type`](Type.md)

***

### getRootSymbols()

> **getRootSymbols**(`symbol`): readonly [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2449

#### Parameters

##### symbol

[`Symbol`](Symbol.md)

#### Returns

readonly [`Symbol`](Symbol.md)[]

***

### getShorthandAssignmentValueSymbol()

> **getShorthandAssignmentValueSymbol**(`location`): `undefined` \| [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2427

The function returns the value (local variable) symbol of an identifier in the short-hand property assignment.
This is necessary as an identifier in short-hand property assignment can contains two meaning: property name and property value.

#### Parameters

##### location

`undefined` | [`Node`](Node.md)

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

***

### getSignatureFromDeclaration()

> **getSignatureFromDeclaration**(`declaration`): `undefined` \| [`Signature`](Signature.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2459

#### Parameters

##### declaration

[`SignatureDeclaration`](../type-aliases/SignatureDeclaration.md)

#### Returns

`undefined` \| [`Signature`](Signature.md)

***

### getSignaturesOfType()

> **getSignaturesOfType**(`type`, `kind`): readonly [`Signature`](Signature.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2393

#### Parameters

##### type

[`Type`](Type.md)

##### kind

[`SignatureKind`](../enumerations/SignatureKind.md)

#### Returns

readonly [`Signature`](Signature.md)[]

***

### getSymbolAtLocation()

> **getSymbolAtLocation**(`node`): `undefined` \| [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2421

#### Parameters

##### node

[`Node`](Node.md)

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

***

### getSymbolOfExpando()

> **getSymbolOfExpando**(`node`, `allowDeclaration`): `undefined` \| [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2450

#### Parameters

##### node

[`Node`](Node.md)

##### allowDeclaration

`boolean`

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

***

### getSymbolsInScope()

> **getSymbolsInScope**(`location`, `meaning`): [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2420

#### Parameters

##### location

[`Node`](Node.md)

##### meaning

[`SymbolFlags`](../enumerations/SymbolFlags.md)

#### Returns

[`Symbol`](Symbol.md)[]

***

### getSymbolsOfParameterPropertyDeclaration()

> **getSymbolsOfParameterPropertyDeclaration**(`parameter`, `parameterName`): [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2422

#### Parameters

##### parameter

[`ParameterDeclaration`](ParameterDeclaration.md)

##### parameterName

`string`

#### Returns

[`Symbol`](Symbol.md)[]

***

### getTypeArguments()

> **getTypeArguments**(`type`): readonly [`Type`](Type.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2401

#### Parameters

##### type

[`TypeReference`](TypeReference.md)

#### Returns

readonly [`Type`](Type.md)[]

***

### getTypeAtLocation()

> **getTypeAtLocation**(`node`): [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2440

#### Parameters

##### node

[`Node`](Node.md)

#### Returns

[`Type`](Type.md)

***

### getTypeFromTypeNode()

> **getTypeFromTypeNode**(`node`): [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2442

#### Parameters

##### node

[`TypeNode`](TypeNode.md)

#### Returns

[`Type`](Type.md)

***

### getTypeOfAssignmentPattern()

> **getTypeOfAssignmentPattern**(`pattern`): [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2439

#### Parameters

##### pattern

[`AssignmentPattern`](../type-aliases/AssignmentPattern.md)

#### Returns

[`Type`](Type.md)

***

### getTypeOfSymbolAtLocation()

> **getTypeOfSymbolAtLocation**(`symbol`, `node`): [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2385

#### Parameters

##### symbol

[`Symbol`](Symbol.md)

##### node

[`Node`](Node.md)

#### Returns

[`Type`](Type.md)

***

### getTypePredicateOfSignature()

> **getTypePredicateOfSignature**(`signature`): `undefined` \| [`TypePredicate`](../type-aliases/TypePredicate.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2478

#### Parameters

##### signature

[`Signature`](Signature.md)

#### Returns

`undefined` \| [`TypePredicate`](../type-aliases/TypePredicate.md)

***

### getWidenedType()

> **getWidenedType**(`type`): [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2397

#### Parameters

##### type

[`Type`](Type.md)

#### Returns

[`Type`](Type.md)

***

### indexInfoToIndexSignatureDeclaration()

> **indexInfoToIndexSignatureDeclaration**(`indexInfo`, `enclosingDeclaration`, `flags`): `undefined` \| [`IndexSignatureDeclaration`](IndexSignatureDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2409

Note that the resulting nodes cannot be checked.

#### Parameters

##### indexInfo

[`IndexInfo`](IndexInfo.md)

##### enclosingDeclaration

`undefined` | [`Node`](Node.md)

##### flags

`undefined` | [`NodeBuilderFlags`](../enumerations/NodeBuilderFlags.md)

#### Returns

`undefined` \| [`IndexSignatureDeclaration`](IndexSignatureDeclaration.md)

***

### isArgumentsSymbol()

> **isArgumentsSymbol**(`symbol`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2462

#### Parameters

##### symbol

[`Symbol`](Symbol.md)

#### Returns

`boolean`

***

### isImplementationOfOverload()

> **isImplementationOfOverload**(`node`): `undefined` \| `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2460

#### Parameters

##### node

[`SignatureDeclaration`](../type-aliases/SignatureDeclaration.md)

#### Returns

`undefined` \| `boolean`

***

### isOptionalParameter()

> **isOptionalParameter**(`node`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2472

#### Parameters

##### node

[`ParameterDeclaration`](ParameterDeclaration.md)

#### Returns

`boolean`

***

### isUndefinedSymbol()

> **isUndefinedSymbol**(`symbol`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2461

#### Parameters

##### symbol

[`Symbol`](Symbol.md)

#### Returns

`boolean`

***

### isUnknownSymbol()

> **isUnknownSymbol**(`symbol`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2463

#### Parameters

##### symbol

[`Symbol`](Symbol.md)

#### Returns

`boolean`

***

### isValidPropertyAccess()

> **isValidPropertyAccess**(`node`, `propertyName`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2465

#### Parameters

##### node

[`PropertyAccessExpression`](PropertyAccessExpression.md) | [`QualifiedName`](QualifiedName.md) | [`ImportTypeNode`](ImportTypeNode.md)

##### propertyName

`string`

#### Returns

`boolean`

***

### runWithCancellationToken()

> **runWithCancellationToken**\<`T`\>(`token`, `cb`): `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2484

Depending on the operation performed, it may be appropriate to throw away the checker
if the cancellation token is triggered. Typically, if it is used for error checking
and the operation is cancelled, then it should be discarded, otherwise it is safe to keep.

#### Type Parameters

##### T

`T`

#### Parameters

##### token

[`CancellationToken`](CancellationToken.md)

##### cb

(`checker`) => `T`

#### Returns

`T`

***

### signatureToSignatureDeclaration()

> **signatureToSignatureDeclaration**(`signature`, `kind`, `enclosingDeclaration`, `flags`): `undefined` \| SignatureDeclaration & \{ typeArguments?: NodeArray\<TypeNode\> \| undefined; \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2405

Note that the resulting nodes cannot be checked.

#### Parameters

##### signature

[`Signature`](Signature.md)

##### kind

[`SyntaxKind`](../enumerations/SyntaxKind.md)

##### enclosingDeclaration

`undefined` | [`Node`](Node.md)

##### flags

`undefined` | [`NodeBuilderFlags`](../enumerations/NodeBuilderFlags.md)

#### Returns

`undefined` \| SignatureDeclaration & \{ typeArguments?: NodeArray\<TypeNode\> \| undefined; \}

***

### signatureToString()

> **signatureToString**(`signature`, `enclosingDeclaration?`, `flags?`, `kind?`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2443

#### Parameters

##### signature

[`Signature`](Signature.md)

##### enclosingDeclaration?

[`Node`](Node.md)

##### flags?

[`TypeFormatFlags`](../enumerations/TypeFormatFlags.md)

##### kind?

[`SignatureKind`](../enumerations/SignatureKind.md)

#### Returns

`string`

***

### symbolToEntityName()

> **symbolToEntityName**(`symbol`, `meaning`, `enclosingDeclaration`, `flags`): `undefined` \| [`EntityName`](../type-aliases/EntityName.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2411

Note that the resulting nodes cannot be checked.

#### Parameters

##### symbol

[`Symbol`](Symbol.md)

##### meaning

[`SymbolFlags`](../enumerations/SymbolFlags.md)

##### enclosingDeclaration

`undefined` | [`Node`](Node.md)

##### flags

`undefined` | [`NodeBuilderFlags`](../enumerations/NodeBuilderFlags.md)

#### Returns

`undefined` \| [`EntityName`](../type-aliases/EntityName.md)

***

### symbolToExpression()

> **symbolToExpression**(`symbol`, `meaning`, `enclosingDeclaration`, `flags`): `undefined` \| [`Expression`](Expression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2413

Note that the resulting nodes cannot be checked.

#### Parameters

##### symbol

[`Symbol`](Symbol.md)

##### meaning

[`SymbolFlags`](../enumerations/SymbolFlags.md)

##### enclosingDeclaration

`undefined` | [`Node`](Node.md)

##### flags

`undefined` | [`NodeBuilderFlags`](../enumerations/NodeBuilderFlags.md)

#### Returns

`undefined` \| [`Expression`](Expression.md)

***

### symbolToParameterDeclaration()

> **symbolToParameterDeclaration**(`symbol`, `enclosingDeclaration`, `flags`): `undefined` \| [`ParameterDeclaration`](ParameterDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2417

Note that the resulting nodes cannot be checked.

#### Parameters

##### symbol

[`Symbol`](Symbol.md)

##### enclosingDeclaration

`undefined` | [`Node`](Node.md)

##### flags

`undefined` | [`NodeBuilderFlags`](../enumerations/NodeBuilderFlags.md)

#### Returns

`undefined` \| [`ParameterDeclaration`](ParameterDeclaration.md)

***

### symbolToString()

> **symbolToString**(`symbol`, `enclosingDeclaration?`, `meaning?`, `flags?`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2445

#### Parameters

##### symbol

[`Symbol`](Symbol.md)

##### enclosingDeclaration?

[`Node`](Node.md)

##### meaning?

[`SymbolFlags`](../enumerations/SymbolFlags.md)

##### flags?

[`SymbolFormatFlags`](../enumerations/SymbolFormatFlags.md)

#### Returns

`string`

***

### symbolToTypeParameterDeclarations()

> **symbolToTypeParameterDeclarations**(`symbol`, `enclosingDeclaration`, `flags`): `undefined` \| [`NodeArray`](NodeArray.md)\<[`TypeParameterDeclaration`](TypeParameterDeclaration.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2415

Note that the resulting nodes cannot be checked.

#### Parameters

##### symbol

[`Symbol`](Symbol.md)

##### enclosingDeclaration

`undefined` | [`Node`](Node.md)

##### flags

`undefined` | [`NodeBuilderFlags`](../enumerations/NodeBuilderFlags.md)

#### Returns

`undefined` \| [`NodeArray`](NodeArray.md)\<[`TypeParameterDeclaration`](TypeParameterDeclaration.md)\>

***

### tryGetMemberInModuleExports()

> **tryGetMemberInModuleExports**(`memberName`, `moduleSymbol`): `undefined` \| [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2474

#### Parameters

##### memberName

`string`

##### moduleSymbol

[`Symbol`](Symbol.md)

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

***

### tryGetResolvedSignatureWithoutCheck()

> **tryGetResolvedSignatureWithoutCheck**(`node`, `candidatesOutArray?`, `argumentCount?`): `undefined` \| [`Signature`](Signature.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2458

#### Parameters

##### node

[`CallLikeExpression`](../type-aliases/CallLikeExpression.md)

##### candidatesOutArray?

[`Signature`](Signature.md)[]

##### argumentCount?

`number`

#### Returns

`undefined` \| [`Signature`](Signature.md)

***

### tryGetTypeAtLocationWithoutCheck()

> **tryGetTypeAtLocationWithoutCheck**(`node`): [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2441

#### Parameters

##### node

[`Node`](Node.md)

#### Returns

[`Type`](Type.md)

***

### typeParameterToDeclaration()

> **typeParameterToDeclaration**(`parameter`, `enclosingDeclaration`, `flags`): `undefined` \| [`TypeParameterDeclaration`](TypeParameterDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2419

Note that the resulting nodes cannot be checked.

#### Parameters

##### parameter

[`TypeParameter`](TypeParameter.md)

##### enclosingDeclaration

`undefined` | [`Node`](Node.md)

##### flags

`undefined` | [`NodeBuilderFlags`](../enumerations/NodeBuilderFlags.md)

#### Returns

`undefined` \| [`TypeParameterDeclaration`](TypeParameterDeclaration.md)

***

### typePredicateToString()

> **typePredicateToString**(`predicate`, `enclosingDeclaration?`, `flags?`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2446

#### Parameters

##### predicate

[`TypePredicate`](../type-aliases/TypePredicate.md)

##### enclosingDeclaration?

[`Node`](Node.md)

##### flags?

[`TypeFormatFlags`](../enumerations/TypeFormatFlags.md)

#### Returns

`string`

***

### typeToString()

> **typeToString**(`type`, `enclosingDeclaration?`, `flags?`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2444

#### Parameters

##### type

[`Type`](Type.md)

##### enclosingDeclaration?

[`Node`](Node.md)

##### flags?

[`TypeFormatFlags`](../enumerations/TypeFormatFlags.md)

#### Returns

`string`

***

### typeToTypeNode()

> **typeToTypeNode**(`type`, `enclosingDeclaration`, `flags`): `undefined` \| [`TypeNode`](TypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2403

Note that the resulting nodes cannot be checked.

#### Parameters

##### type

[`Type`](Type.md)

##### enclosingDeclaration

`undefined` | [`Node`](Node.md)

##### flags

`undefined` | [`NodeBuilderFlags`](../enumerations/NodeBuilderFlags.md)

#### Returns

`undefined` \| [`TypeNode`](TypeNode.md)
