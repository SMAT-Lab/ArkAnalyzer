[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / TypeReference

# Interface: TypeReference

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2844

Type references (ObjectFlags.Reference). When a class or interface has type parameters or
a "this" type, references to the class or interface are made using type references. The
typeArguments property specifies the types to substitute for the type parameters of the
class or interface and optionally includes an extra element that specifies the type to
substitute for "this" in the resulting instantiation. When no extra argument is present,
the type reference itself is substituted for "this". The typeArguments property is undefined
if the class or interface has no type parameters and the reference isn't specifying an
explicit "this" argument.

## Extends

- [`ObjectType`](ObjectType.md)

## Extended by

- [`DeferredTypeReference`](DeferredTypeReference.md)
- [`GenericType`](GenericType.md)
- [`TupleTypeReference`](TupleTypeReference.md)

## Properties

### aliasSymbol?

> `optional` **aliasSymbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2773

#### Inherited from

[`ObjectType`](ObjectType.md).[`aliasSymbol`](ObjectType.md#aliassymbol)

***

### aliasTypeArguments?

> `optional` **aliasTypeArguments**: readonly [`Type`](Type.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2774

#### Inherited from

[`ObjectType`](ObjectType.md).[`aliasTypeArguments`](ObjectType.md#aliastypearguments)

***

### flags

> **flags**: [`TypeFlags`](../enumerations/TypeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2770

#### Inherited from

[`ObjectType`](ObjectType.md).[`flags`](ObjectType.md#flags)

***

### node?

> `optional` **node**: [`TypeReferenceNode`](TypeReferenceNode.md) \| [`ArrayTypeNode`](ArrayTypeNode.md) \| [`TupleTypeNode`](TupleTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2846

***

### objectFlags

> **objectFlags**: [`ObjectFlags`](../enumerations/ObjectFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2818

#### Inherited from

[`ObjectType`](ObjectType.md).[`objectFlags`](ObjectType.md#objectflags)

***

### pattern?

> `optional` **pattern**: [`DestructuringPattern`](../type-aliases/DestructuringPattern.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2772

#### Inherited from

[`ObjectType`](ObjectType.md).[`pattern`](ObjectType.md#pattern)

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2771

#### Inherited from

[`ObjectType`](ObjectType.md).[`symbol`](ObjectType.md#symbol)

***

### target

> **target**: [`GenericType`](GenericType.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2845

***

### typeArguments?

> `optional` **typeArguments**: readonly [`Type`](Type.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6145

## Methods

### getApparentProperties()

> **getApparentProperties**(): [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6124

#### Returns

[`Symbol`](Symbol.md)[]

#### Inherited from

[`ObjectType`](ObjectType.md).[`getApparentProperties`](ObjectType.md#getapparentproperties)

***

### getBaseTypes()

> **getBaseTypes**(): `undefined` \| [`BaseType`](../type-aliases/BaseType.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6129

#### Returns

`undefined` \| [`BaseType`](../type-aliases/BaseType.md)[]

#### Inherited from

[`ObjectType`](ObjectType.md).[`getBaseTypes`](ObjectType.md#getbasetypes)

***

### getCallSignatures()

> **getCallSignatures**(): readonly [`Signature`](Signature.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6125

#### Returns

readonly [`Signature`](Signature.md)[]

#### Inherited from

[`ObjectType`](ObjectType.md).[`getCallSignatures`](ObjectType.md#getcallsignatures)

***

### getConstraint()

> **getConstraint**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6131

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`ObjectType`](ObjectType.md).[`getConstraint`](ObjectType.md#getconstraint)

***

### getConstructSignatures()

> **getConstructSignatures**(): readonly [`Signature`](Signature.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6126

#### Returns

readonly [`Signature`](Signature.md)[]

#### Inherited from

[`ObjectType`](ObjectType.md).[`getConstructSignatures`](ObjectType.md#getconstructsignatures)

***

### getDefault()

> **getDefault**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6132

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`ObjectType`](ObjectType.md).[`getDefault`](ObjectType.md#getdefault)

***

### getFlags()

> **getFlags**(): [`TypeFlags`](../enumerations/TypeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6120

#### Returns

[`TypeFlags`](../enumerations/TypeFlags.md)

#### Inherited from

[`ObjectType`](ObjectType.md).[`getFlags`](ObjectType.md#getflags)

***

### getNonNullableType()

> **getNonNullableType**(): [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6130

#### Returns

[`Type`](Type.md)

#### Inherited from

[`ObjectType`](ObjectType.md).[`getNonNullableType`](ObjectType.md#getnonnullabletype)

***

### getNumberIndexType()

> **getNumberIndexType**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6128

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`ObjectType`](ObjectType.md).[`getNumberIndexType`](ObjectType.md#getnumberindextype)

***

### getProperties()

> **getProperties**(): [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6122

#### Returns

[`Symbol`](Symbol.md)[]

#### Inherited from

[`ObjectType`](ObjectType.md).[`getProperties`](ObjectType.md#getproperties)

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

[`ObjectType`](ObjectType.md).[`getProperty`](ObjectType.md#getproperty)

***

### getStringIndexType()

> **getStringIndexType**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6127

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`ObjectType`](ObjectType.md).[`getStringIndexType`](ObjectType.md#getstringindextype)

***

### getSymbol()

> **getSymbol**(): `undefined` \| [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6121

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

#### Inherited from

[`ObjectType`](ObjectType.md).[`getSymbol`](ObjectType.md#getsymbol)

***

### isClass()

> **isClass**(): `this is InterfaceType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6141

#### Returns

`this is InterfaceType`

#### Inherited from

[`ObjectType`](ObjectType.md).[`isClass`](ObjectType.md#isclass)

***

### isClassOrInterface()

> **isClassOrInterface**(): `this is InterfaceType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6140

#### Returns

`this is InterfaceType`

#### Inherited from

[`ObjectType`](ObjectType.md).[`isClassOrInterface`](ObjectType.md#isclassorinterface)

***

### isIndexType()

> **isIndexType**(): `this is IndexType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6142

#### Returns

`this is IndexType`

#### Inherited from

[`ObjectType`](ObjectType.md).[`isIndexType`](ObjectType.md#isindextype)

***

### isIntersection()

> **isIntersection**(): `this is IntersectionType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6134

#### Returns

`this is IntersectionType`

#### Inherited from

[`ObjectType`](ObjectType.md).[`isIntersection`](ObjectType.md#isintersection)

***

### isLiteral()

> **isLiteral**(): `this is LiteralType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6136

#### Returns

`this is LiteralType`

#### Inherited from

[`ObjectType`](ObjectType.md).[`isLiteral`](ObjectType.md#isliteral)

***

### isNumberLiteral()

> **isNumberLiteral**(): `this is NumberLiteralType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6138

#### Returns

`this is NumberLiteralType`

#### Inherited from

[`ObjectType`](ObjectType.md).[`isNumberLiteral`](ObjectType.md#isnumberliteral)

***

### isStringLiteral()

> **isStringLiteral**(): `this is StringLiteralType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6137

#### Returns

`this is StringLiteralType`

#### Inherited from

[`ObjectType`](ObjectType.md).[`isStringLiteral`](ObjectType.md#isstringliteral)

***

### isTypeParameter()

> **isTypeParameter**(): `this is TypeParameter`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6139

#### Returns

`this is TypeParameter`

#### Inherited from

[`ObjectType`](ObjectType.md).[`isTypeParameter`](ObjectType.md#istypeparameter)

***

### isUnion()

> **isUnion**(): `this is UnionType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6133

#### Returns

`this is UnionType`

#### Inherited from

[`ObjectType`](ObjectType.md).[`isUnion`](ObjectType.md#isunion)

***

### isUnionOrIntersection()

> **isUnionOrIntersection**(): `this is UnionOrIntersectionType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6135

#### Returns

`this is UnionOrIntersectionType`

#### Inherited from

[`ObjectType`](ObjectType.md).[`isUnionOrIntersection`](ObjectType.md#isunionorintersection)
