[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / UnionType

# Interface: UnionType

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2877

## Extends

- [`UnionOrIntersectionType`](UnionOrIntersectionType.md)

## Properties

### aliasSymbol?

> `optional` **aliasSymbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2773

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`aliasSymbol`](UnionOrIntersectionType.md#aliassymbol)

***

### aliasTypeArguments?

> `optional` **aliasTypeArguments**: readonly [`Type`](Type.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2774

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`aliasTypeArguments`](UnionOrIntersectionType.md#aliastypearguments)

***

### flags

> **flags**: [`TypeFlags`](../enumerations/TypeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2770

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`flags`](UnionOrIntersectionType.md#flags)

***

### pattern?

> `optional` **pattern**: [`DestructuringPattern`](../type-aliases/DestructuringPattern.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2772

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`pattern`](UnionOrIntersectionType.md#pattern)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2771

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`symbol`](UnionOrIntersectionType.md#symbol)

***

### types

> **types**: [`Type`](Type.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2875

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`types`](UnionOrIntersectionType.md#types)

## Methods

### getApparentProperties()

> **getApparentProperties**(): [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6124

#### Returns

[`Symbol`](Symbol.md)[]

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getApparentProperties`](UnionOrIntersectionType.md#getapparentproperties)

***

### getBaseTypes()

> **getBaseTypes**(): `undefined` \| [`BaseType`](../type-aliases/BaseType.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6129

#### Returns

`undefined` \| [`BaseType`](../type-aliases/BaseType.md)[]

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getBaseTypes`](UnionOrIntersectionType.md#getbasetypes)

***

### getCallSignatures()

> **getCallSignatures**(): readonly [`Signature`](Signature.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6125

#### Returns

readonly [`Signature`](Signature.md)[]

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getCallSignatures`](UnionOrIntersectionType.md#getcallsignatures)

***

### getConstraint()

> **getConstraint**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6131

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getConstraint`](UnionOrIntersectionType.md#getconstraint)

***

### getConstructSignatures()

> **getConstructSignatures**(): readonly [`Signature`](Signature.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6126

#### Returns

readonly [`Signature`](Signature.md)[]

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getConstructSignatures`](UnionOrIntersectionType.md#getconstructsignatures)

***

### getDefault()

> **getDefault**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6132

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getDefault`](UnionOrIntersectionType.md#getdefault)

***

### getFlags()

> **getFlags**(): [`TypeFlags`](../enumerations/TypeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6120

#### Returns

[`TypeFlags`](../enumerations/TypeFlags.md)

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getFlags`](UnionOrIntersectionType.md#getflags)

***

### getNonNullableType()

> **getNonNullableType**(): [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6130

#### Returns

[`Type`](Type.md)

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getNonNullableType`](UnionOrIntersectionType.md#getnonnullabletype)

***

### getNumberIndexType()

> **getNumberIndexType**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6128

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getNumberIndexType`](UnionOrIntersectionType.md#getnumberindextype)

***

### getProperties()

> **getProperties**(): [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6122

#### Returns

[`Symbol`](Symbol.md)[]

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getProperties`](UnionOrIntersectionType.md#getproperties)

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

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getProperty`](UnionOrIntersectionType.md#getproperty)

***

### getStringIndexType()

> **getStringIndexType**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6127

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getStringIndexType`](UnionOrIntersectionType.md#getstringindextype)

***

### getSymbol()

> **getSymbol**(): `undefined` \| [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6121

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`getSymbol`](UnionOrIntersectionType.md#getsymbol)

***

### isClass()

> **isClass**(): `this is InterfaceType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6141

#### Returns

`this is InterfaceType`

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`isClass`](UnionOrIntersectionType.md#isclass)

***

### isClassOrInterface()

> **isClassOrInterface**(): `this is InterfaceType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6140

#### Returns

`this is InterfaceType`

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`isClassOrInterface`](UnionOrIntersectionType.md#isclassorinterface)

***

### isIndexType()

> **isIndexType**(): `this is IndexType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6142

#### Returns

`this is IndexType`

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`isIndexType`](UnionOrIntersectionType.md#isindextype)

***

### isIntersection()

> **isIntersection**(): `this is IntersectionType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6134

#### Returns

`this is IntersectionType`

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`isIntersection`](UnionOrIntersectionType.md#isintersection)

***

### isLiteral()

> **isLiteral**(): `this is LiteralType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6136

#### Returns

`this is LiteralType`

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`isLiteral`](UnionOrIntersectionType.md#isliteral)

***

### isNumberLiteral()

> **isNumberLiteral**(): `this is NumberLiteralType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6138

#### Returns

`this is NumberLiteralType`

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`isNumberLiteral`](UnionOrIntersectionType.md#isnumberliteral)

***

### isStringLiteral()

> **isStringLiteral**(): `this is StringLiteralType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6137

#### Returns

`this is StringLiteralType`

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`isStringLiteral`](UnionOrIntersectionType.md#isstringliteral)

***

### isTypeParameter()

> **isTypeParameter**(): `this is TypeParameter`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6139

#### Returns

`this is TypeParameter`

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`isTypeParameter`](UnionOrIntersectionType.md#istypeparameter)

***

### isUnion()

> **isUnion**(): `this is UnionType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6133

#### Returns

`this is UnionType`

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`isUnion`](UnionOrIntersectionType.md#isunion)

***

### isUnionOrIntersection()

> **isUnionOrIntersection**(): `this is UnionOrIntersectionType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6135

#### Returns

`this is UnionOrIntersectionType`

#### Inherited from

[`UnionOrIntersectionType`](UnionOrIntersectionType.md).[`isUnionOrIntersection`](UnionOrIntersectionType.md#isunionorintersection)
