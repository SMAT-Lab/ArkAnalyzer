[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / GenericType

# Interface: GenericType

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2850

Class and interface types (ObjectFlags.Class and ObjectFlags.Interface).

## Extends

- [`InterfaceType`](InterfaceType.md).[`TypeReference`](TypeReference.md)

## Extended by

- [`TupleType`](TupleType.md)

## Properties

### aliasSymbol?

> `optional` **aliasSymbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2773

#### Inherited from

[`TypeReference`](TypeReference.md).[`aliasSymbol`](TypeReference.md#aliassymbol)

***

### aliasTypeArguments?

> `optional` **aliasTypeArguments**: readonly [`Type`](Type.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2774

#### Inherited from

[`TypeReference`](TypeReference.md).[`aliasTypeArguments`](TypeReference.md#aliastypearguments)

***

### flags

> **flags**: [`TypeFlags`](../enumerations/TypeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2770

#### Inherited from

[`TypeReference`](TypeReference.md).[`flags`](TypeReference.md#flags)

***

### localTypeParameters

> **localTypeParameters**: `undefined` \| [`TypeParameter`](TypeParameter.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2824

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`localTypeParameters`](InterfaceType.md#localtypeparameters)

***

### node?

> `optional` **node**: [`TypeReferenceNode`](TypeReferenceNode.md) \| [`ArrayTypeNode`](ArrayTypeNode.md) \| [`TupleTypeNode`](TupleTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2846

#### Inherited from

[`TypeReference`](TypeReference.md).[`node`](TypeReference.md#node)

***

### objectFlags

> **objectFlags**: [`ObjectFlags`](../enumerations/ObjectFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2818

#### Inherited from

[`TypeReference`](TypeReference.md).[`objectFlags`](TypeReference.md#objectflags)

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

[`TypeReference`](TypeReference.md).[`pattern`](TypeReference.md#pattern)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2771

#### Inherited from

[`TypeReference`](TypeReference.md).[`symbol`](TypeReference.md#symbol)

***

### target

> **target**: `GenericType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2845

#### Inherited from

[`TypeReference`](TypeReference.md).[`target`](TypeReference.md#target)

***

### thisType

> **thisType**: `undefined` \| [`TypeParameter`](TypeParameter.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2825

#### Inherited from

[`InterfaceType`](InterfaceType.md).[`thisType`](InterfaceType.md#thistype)

***

### typeArguments?

> `optional` **typeArguments**: readonly [`Type`](Type.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6145

#### Inherited from

[`TypeReference`](TypeReference.md).[`typeArguments`](TypeReference.md#typearguments)

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

[`TypeReference`](TypeReference.md).[`getApparentProperties`](TypeReference.md#getapparentproperties)

***

### getBaseTypes()

> **getBaseTypes**(): `undefined` \| [`BaseType`](../type-aliases/BaseType.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6129

#### Returns

`undefined` \| [`BaseType`](../type-aliases/BaseType.md)[]

#### Inherited from

[`TypeReference`](TypeReference.md).[`getBaseTypes`](TypeReference.md#getbasetypes)

***

### getCallSignatures()

> **getCallSignatures**(): readonly [`Signature`](Signature.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6125

#### Returns

readonly [`Signature`](Signature.md)[]

#### Inherited from

[`TypeReference`](TypeReference.md).[`getCallSignatures`](TypeReference.md#getcallsignatures)

***

### getConstraint()

> **getConstraint**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6131

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`TypeReference`](TypeReference.md).[`getConstraint`](TypeReference.md#getconstraint)

***

### getConstructSignatures()

> **getConstructSignatures**(): readonly [`Signature`](Signature.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6126

#### Returns

readonly [`Signature`](Signature.md)[]

#### Inherited from

[`TypeReference`](TypeReference.md).[`getConstructSignatures`](TypeReference.md#getconstructsignatures)

***

### getDefault()

> **getDefault**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6132

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`TypeReference`](TypeReference.md).[`getDefault`](TypeReference.md#getdefault)

***

### getFlags()

> **getFlags**(): [`TypeFlags`](../enumerations/TypeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6120

#### Returns

[`TypeFlags`](../enumerations/TypeFlags.md)

#### Inherited from

[`TypeReference`](TypeReference.md).[`getFlags`](TypeReference.md#getflags)

***

### getNonNullableType()

> **getNonNullableType**(): [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6130

#### Returns

[`Type`](Type.md)

#### Inherited from

[`TypeReference`](TypeReference.md).[`getNonNullableType`](TypeReference.md#getnonnullabletype)

***

### getNumberIndexType()

> **getNumberIndexType**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6128

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`TypeReference`](TypeReference.md).[`getNumberIndexType`](TypeReference.md#getnumberindextype)

***

### getProperties()

> **getProperties**(): [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6122

#### Returns

[`Symbol`](Symbol.md)[]

#### Inherited from

[`TypeReference`](TypeReference.md).[`getProperties`](TypeReference.md#getproperties)

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

[`TypeReference`](TypeReference.md).[`getProperty`](TypeReference.md#getproperty)

***

### getStringIndexType()

> **getStringIndexType**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6127

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`TypeReference`](TypeReference.md).[`getStringIndexType`](TypeReference.md#getstringindextype)

***

### getSymbol()

> **getSymbol**(): `undefined` \| [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6121

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

#### Inherited from

[`TypeReference`](TypeReference.md).[`getSymbol`](TypeReference.md#getsymbol)

***

### isClass()

> **isClass**(): `this is InterfaceType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6141

#### Returns

`this is InterfaceType`

#### Inherited from

[`TypeReference`](TypeReference.md).[`isClass`](TypeReference.md#isclass)

***

### isClassOrInterface()

> **isClassOrInterface**(): `this is InterfaceType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6140

#### Returns

`this is InterfaceType`

#### Inherited from

[`TypeReference`](TypeReference.md).[`isClassOrInterface`](TypeReference.md#isclassorinterface)

***

### isIndexType()

> **isIndexType**(): `this is IndexType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6142

#### Returns

`this is IndexType`

#### Inherited from

[`TypeReference`](TypeReference.md).[`isIndexType`](TypeReference.md#isindextype)

***

### isIntersection()

> **isIntersection**(): `this is IntersectionType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6134

#### Returns

`this is IntersectionType`

#### Inherited from

[`TypeReference`](TypeReference.md).[`isIntersection`](TypeReference.md#isintersection)

***

### isLiteral()

> **isLiteral**(): `this is LiteralType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6136

#### Returns

`this is LiteralType`

#### Inherited from

[`TypeReference`](TypeReference.md).[`isLiteral`](TypeReference.md#isliteral)

***

### isNumberLiteral()

> **isNumberLiteral**(): `this is NumberLiteralType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6138

#### Returns

`this is NumberLiteralType`

#### Inherited from

[`TypeReference`](TypeReference.md).[`isNumberLiteral`](TypeReference.md#isnumberliteral)

***

### isStringLiteral()

> **isStringLiteral**(): `this is StringLiteralType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6137

#### Returns

`this is StringLiteralType`

#### Inherited from

[`TypeReference`](TypeReference.md).[`isStringLiteral`](TypeReference.md#isstringliteral)

***

### isTypeParameter()

> **isTypeParameter**(): `this is TypeParameter`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6139

#### Returns

`this is TypeParameter`

#### Inherited from

[`TypeReference`](TypeReference.md).[`isTypeParameter`](TypeReference.md#istypeparameter)

***

### isUnion()

> **isUnion**(): `this is UnionType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6133

#### Returns

`this is UnionType`

#### Inherited from

[`TypeReference`](TypeReference.md).[`isUnion`](TypeReference.md#isunion)

***

### isUnionOrIntersection()

> **isUnionOrIntersection**(): `this is UnionOrIntersectionType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6135

#### Returns

`this is UnionOrIntersectionType`

#### Inherited from

[`TypeReference`](TypeReference.md).[`isUnionOrIntersection`](TypeReference.md#isunionorintersection)
