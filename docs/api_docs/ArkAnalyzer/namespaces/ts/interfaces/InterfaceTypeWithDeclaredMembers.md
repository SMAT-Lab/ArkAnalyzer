[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / InterfaceTypeWithDeclaredMembers

# Interface: InterfaceTypeWithDeclaredMembers

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2828

Class and interface types (ObjectFlags.Class and ObjectFlags.Interface).

## Extends

- [`InterfaceType`](InterfaceType.md)

## Properties

### aliasSymbol?

> `optional` **aliasSymbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2773

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`aliasSymbol`](InterfaceType.md#aliassymbol)

***

### aliasTypeArguments?

> `optional` **aliasTypeArguments**: readonly [`Type`](Type.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2774

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`aliasTypeArguments`](InterfaceType.md#aliastypearguments)

***

### declaredCallSignatures

> **declaredCallSignatures**: [`Signature`](Signature.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2830

***

### declaredConstructSignatures

> **declaredConstructSignatures**: [`Signature`](Signature.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2831

***

### declaredIndexInfos

> **declaredIndexInfos**: [`IndexInfo`](IndexInfo.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2832

***

### declaredProperties

> **declaredProperties**: [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2829

***

### flags

> **flags**: [`TypeFlags`](../enumerations/TypeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2770

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`flags`](InterfaceType.md#flags)

***

### localTypeParameters

> **localTypeParameters**: `undefined` \| [`TypeParameter`](TypeParameter.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2824

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`localTypeParameters`](InterfaceType.md#localtypeparameters)

***

### objectFlags

> **objectFlags**: [`ObjectFlags`](../enumerations/ObjectFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2818

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`objectFlags`](InterfaceType.md#objectflags)

***

### outerTypeParameters

> **outerTypeParameters**: `undefined` \| [`TypeParameter`](TypeParameter.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2823

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`outerTypeParameters`](InterfaceType.md#outertypeparameters)

***

### pattern?

> `optional` **pattern**: [`DestructuringPattern`](../type-aliases/DestructuringPattern.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2772

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`pattern`](InterfaceType.md#pattern)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2771

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`symbol`](InterfaceType.md#symbol)

***

### thisType

> **thisType**: `undefined` \| [`TypeParameter`](TypeParameter.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2825

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`thisType`](InterfaceType.md#thistype)

***

### typeParameters

> **typeParameters**: `undefined` \| [`TypeParameter`](TypeParameter.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2822

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`typeParameters`](InterfaceType.md#typeparameters)

## Methods

### getApparentProperties()

> **getApparentProperties**(): [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6124

#### Returns

[`Symbol`](Symbol.md)[]

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`getApparentProperties`](InterfaceType.md#getapparentproperties)

***

### getBaseTypes()

> **getBaseTypes**(): `undefined` \| [`BaseType`](../type-aliases/BaseType.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6129

#### Returns

`undefined` \| [`BaseType`](../type-aliases/BaseType.md)[]

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`getBaseTypes`](InterfaceType.md#getbasetypes)

***

### getCallSignatures()

> **getCallSignatures**(): readonly [`Signature`](Signature.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6125

#### Returns

readonly [`Signature`](Signature.md)[]

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`getCallSignatures`](InterfaceType.md#getcallsignatures)

***

### getConstraint()

> **getConstraint**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6131

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`getConstraint`](InterfaceType.md#getconstraint)

***

### getConstructSignatures()

> **getConstructSignatures**(): readonly [`Signature`](Signature.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6126

#### Returns

readonly [`Signature`](Signature.md)[]

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`getConstructSignatures`](InterfaceType.md#getconstructsignatures)

***

### getDefault()

> **getDefault**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6132

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`getDefault`](InterfaceType.md#getdefault)

***

### getFlags()

> **getFlags**(): [`TypeFlags`](../enumerations/TypeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6120

#### Returns

[`TypeFlags`](../enumerations/TypeFlags.md)

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`getFlags`](InterfaceType.md#getflags)

***

### getNonNullableType()

> **getNonNullableType**(): [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6130

#### Returns

[`Type`](Type.md)

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`getNonNullableType`](InterfaceType.md#getnonnullabletype)

***

### getNumberIndexType()

> **getNumberIndexType**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6128

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`getNumberIndexType`](InterfaceType.md#getnumberindextype)

***

### getProperties()

> **getProperties**(): [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6122

#### Returns

[`Symbol`](Symbol.md)[]

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`getProperties`](InterfaceType.md#getproperties)

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

[`InterfaceType`](InterfaceType.md).[`getProperty`](InterfaceType.md#getproperty)

***

### getStringIndexType()

> **getStringIndexType**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6127

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`getStringIndexType`](InterfaceType.md#getstringindextype)

***

### getSymbol()

> **getSymbol**(): `undefined` \| [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6121

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`getSymbol`](InterfaceType.md#getsymbol)

***

### isClass()

> **isClass**(): `this is InterfaceType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6141

#### Returns

`this is InterfaceType`

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`isClass`](InterfaceType.md#isclass)

***

### isClassOrInterface()

> **isClassOrInterface**(): `this is InterfaceType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6140

#### Returns

`this is InterfaceType`

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`isClassOrInterface`](InterfaceType.md#isclassorinterface)

***

### isIndexType()

> **isIndexType**(): `this is IndexType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6142

#### Returns

`this is IndexType`

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`isIndexType`](InterfaceType.md#isindextype)

***

### isIntersection()

> **isIntersection**(): `this is IntersectionType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6134

#### Returns

`this is IntersectionType`

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`isIntersection`](InterfaceType.md#isintersection)

***

### isLiteral()

> **isLiteral**(): `this is LiteralType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6136

#### Returns

`this is LiteralType`

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`isLiteral`](InterfaceType.md#isliteral)

***

### isNumberLiteral()

> **isNumberLiteral**(): `this is NumberLiteralType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6138

#### Returns

`this is NumberLiteralType`

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`isNumberLiteral`](InterfaceType.md#isnumberliteral)

***

### isStringLiteral()

> **isStringLiteral**(): `this is StringLiteralType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6137

#### Returns

`this is StringLiteralType`

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`isStringLiteral`](InterfaceType.md#isstringliteral)

***

### isTypeParameter()

> **isTypeParameter**(): `this is TypeParameter`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6139

#### Returns

`this is TypeParameter`

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`isTypeParameter`](InterfaceType.md#istypeparameter)

***

### isUnion()

> **isUnion**(): `this is UnionType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6133

#### Returns

`this is UnionType`

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`isUnion`](InterfaceType.md#isunion)

***

### isUnionOrIntersection()

> **isUnionOrIntersection**(): `this is UnionOrIntersectionType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6135

#### Returns

`this is UnionOrIntersectionType`

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`isUnionOrIntersection`](InterfaceType.md#isunionorintersection)
