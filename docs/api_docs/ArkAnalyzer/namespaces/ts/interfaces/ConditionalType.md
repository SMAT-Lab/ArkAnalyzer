[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ConditionalType

# Interface: ConditionalType

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2912

## Extends

- [`InstantiableType`](InstantiableType.md)

## Properties

### aliasSymbol?

> `optional` **aliasSymbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2773

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`aliasSymbol`](InstantiableType.md#aliassymbol)

***

### aliasTypeArguments?

> `optional` **aliasTypeArguments**: readonly [`Type`](Type.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2774

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`aliasTypeArguments`](InstantiableType.md#aliastypearguments)

***

### checkType

> **checkType**: [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2914

***

### extendsType

> **extendsType**: [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2915

***

### flags

> **flags**: [`TypeFlags`](../enumerations/TypeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2770

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`flags`](InstantiableType.md#flags)

***

### pattern?

> `optional` **pattern**: [`DestructuringPattern`](../type-aliases/DestructuringPattern.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2772

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`pattern`](InstantiableType.md#pattern)

***

### resolvedFalseType?

> `optional` **resolvedFalseType**: [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2917

***

### resolvedTrueType?

> `optional` **resolvedTrueType**: [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2916

***

### root

> **root**: [`ConditionalRoot`](ConditionalRoot.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2913

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2771

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`symbol`](InstantiableType.md#symbol)

## Methods

### getApparentProperties()

> **getApparentProperties**(): [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6124

#### Returns

[`Symbol`](Symbol.md)[]

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`getApparentProperties`](InstantiableType.md#getapparentproperties)

***

### getBaseTypes()

> **getBaseTypes**(): `undefined` \| [`BaseType`](../type-aliases/BaseType.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6129

#### Returns

`undefined` \| [`BaseType`](../type-aliases/BaseType.md)[]

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`getBaseTypes`](InstantiableType.md#getbasetypes)

***

### getCallSignatures()

> **getCallSignatures**(): readonly [`Signature`](Signature.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6125

#### Returns

readonly [`Signature`](Signature.md)[]

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`getCallSignatures`](InstantiableType.md#getcallsignatures)

***

### getConstraint()

> **getConstraint**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6131

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`getConstraint`](InstantiableType.md#getconstraint)

***

### getConstructSignatures()

> **getConstructSignatures**(): readonly [`Signature`](Signature.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6126

#### Returns

readonly [`Signature`](Signature.md)[]

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`getConstructSignatures`](InstantiableType.md#getconstructsignatures)

***

### getDefault()

> **getDefault**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6132

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`getDefault`](InstantiableType.md#getdefault)

***

### getFlags()

> **getFlags**(): [`TypeFlags`](../enumerations/TypeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6120

#### Returns

[`TypeFlags`](../enumerations/TypeFlags.md)

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`getFlags`](InstantiableType.md#getflags)

***

### getNonNullableType()

> **getNonNullableType**(): [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6130

#### Returns

[`Type`](Type.md)

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`getNonNullableType`](InstantiableType.md#getnonnullabletype)

***

### getNumberIndexType()

> **getNumberIndexType**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6128

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`getNumberIndexType`](InstantiableType.md#getnumberindextype)

***

### getProperties()

> **getProperties**(): [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6122

#### Returns

[`Symbol`](Symbol.md)[]

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`getProperties`](InstantiableType.md#getproperties)

***

### getProperty()

> **getProperty**(`propertyName`): `undefined` \| [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6123

#### Parameters

##### propertyName

`string`

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`getProperty`](InstantiableType.md#getproperty)

***

### getStringIndexType()

> **getStringIndexType**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6127

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`getStringIndexType`](InstantiableType.md#getstringindextype)

***

### getSymbol()

> **getSymbol**(): `undefined` \| [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6121

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`getSymbol`](InstantiableType.md#getsymbol)

***

### isClass()

> **isClass**(): `this is InterfaceType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6141

#### Returns

`this is InterfaceType`

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`isClass`](InstantiableType.md#isclass)

***

### isClassOrInterface()

> **isClassOrInterface**(): `this is InterfaceType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6140

#### Returns

`this is InterfaceType`

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`isClassOrInterface`](InstantiableType.md#isclassorinterface)

***

### isIndexType()

> **isIndexType**(): `this is IndexType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6142

#### Returns

`this is IndexType`

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`isIndexType`](InstantiableType.md#isindextype)

***

### isIntersection()

> **isIntersection**(): `this is IntersectionType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6134

#### Returns

`this is IntersectionType`

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`isIntersection`](InstantiableType.md#isintersection)

***

### isLiteral()

> **isLiteral**(): `this is LiteralType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6136

#### Returns

`this is LiteralType`

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`isLiteral`](InstantiableType.md#isliteral)

***

### isNumberLiteral()

> **isNumberLiteral**(): `this is NumberLiteralType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6138

#### Returns

`this is NumberLiteralType`

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`isNumberLiteral`](InstantiableType.md#isnumberliteral)

***

### isStringLiteral()

> **isStringLiteral**(): `this is StringLiteralType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6137

#### Returns

`this is StringLiteralType`

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`isStringLiteral`](InstantiableType.md#isstringliteral)

***

### isTypeParameter()

> **isTypeParameter**(): `this is TypeParameter`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6139

#### Returns

`this is TypeParameter`

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`isTypeParameter`](InstantiableType.md#istypeparameter)

***

### isUnion()

> **isUnion**(): `this is UnionType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6133

#### Returns

`this is UnionType`

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`isUnion`](InstantiableType.md#isunion)

***

### isUnionOrIntersection()

> **isUnionOrIntersection**(): `this is UnionOrIntersectionType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6135

#### Returns

`this is UnionOrIntersectionType`

#### Inherited from

[`InstantiableType`](InstantiableType.md).[`isUnionOrIntersection`](InstantiableType.md#isunionorintersection)
