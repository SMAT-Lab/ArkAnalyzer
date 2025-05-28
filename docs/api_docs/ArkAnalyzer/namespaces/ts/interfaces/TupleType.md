[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / TupleType

# Interface: TupleType

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2862

Class and interface types (ObjectFlags.Class and ObjectFlags.Interface).

## Extends

- [`GenericType`](GenericType.md)

## Properties

### aliasSymbol?

> `optional` **aliasSymbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2773

#### Inherited from

[`GenericType`](GenericType.md).[`aliasSymbol`](GenericType.md#aliassymbol)

***

### aliasTypeArguments?

> `optional` **aliasTypeArguments**: readonly [`Type`](Type.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2774

#### Inherited from

[`GenericType`](GenericType.md).[`aliasTypeArguments`](GenericType.md#aliastypearguments)

***

### combinedFlags

> **combinedFlags**: [`ElementFlags`](../enumerations/ElementFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2867

***

### elementFlags

> **elementFlags**: readonly [`ElementFlags`](../enumerations/ElementFlags.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2863

***

### fixedLength

> **fixedLength**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2865

***

### flags

> **flags**: [`TypeFlags`](../enumerations/TypeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2770

#### Inherited from

[`GenericType`](GenericType.md).[`flags`](GenericType.md#flags)

***

### hasRestElement

> **hasRestElement**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2866

***

### labeledElementDeclarations?

> `optional` **labeledElementDeclarations**: readonly ([`ParameterDeclaration`](ParameterDeclaration.md) \| [`NamedTupleMember`](NamedTupleMember.md))[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2869

***

### localTypeParameters

> **localTypeParameters**: `undefined` \| [`TypeParameter`](TypeParameter.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2824

#### Inherited from

[`GenericType`](GenericType.md).[`localTypeParameters`](GenericType.md#localtypeparameters)

***

### minLength

> **minLength**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2864

***

### node?

> `optional` **node**: [`TypeReferenceNode`](TypeReferenceNode.md) \| [`ArrayTypeNode`](ArrayTypeNode.md) \| [`TupleTypeNode`](TupleTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2846

#### Inherited from

[`GenericType`](GenericType.md).[`node`](GenericType.md#node)

***

### objectFlags

> **objectFlags**: [`ObjectFlags`](../enumerations/ObjectFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2818

#### Inherited from

[`GenericType`](GenericType.md).[`objectFlags`](GenericType.md#objectflags)

***

### outerTypeParameters

> **outerTypeParameters**: `undefined` \| [`TypeParameter`](TypeParameter.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2823

#### Inherited from

[`GenericType`](GenericType.md).[`outerTypeParameters`](GenericType.md#outertypeparameters)

***

### pattern?

> `optional` **pattern**: [`DestructuringPattern`](../type-aliases/DestructuringPattern.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2772

#### Inherited from

[`GenericType`](GenericType.md).[`pattern`](GenericType.md#pattern)

***

### readonly

> **readonly**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2868

***

### symbol

> **symbol**: [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2771

#### Inherited from

[`GenericType`](GenericType.md).[`symbol`](GenericType.md#symbol)

***

### target

> **target**: [`GenericType`](GenericType.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2845

#### Inherited from

[`GenericType`](GenericType.md).[`target`](GenericType.md#target)

***

### thisType

> **thisType**: `undefined` \| [`TypeParameter`](TypeParameter.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2825

#### Inherited from

[`GenericType`](GenericType.md).[`thisType`](GenericType.md#thistype)

***

### typeArguments?

> `optional` **typeArguments**: readonly [`Type`](Type.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6145

#### Inherited from

[`GenericType`](GenericType.md).[`typeArguments`](GenericType.md#typearguments)

***

### typeParameters

> **typeParameters**: `undefined` \| [`TypeParameter`](TypeParameter.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2822

#### Inherited from

[`GenericType`](GenericType.md).[`typeParameters`](GenericType.md#typeparameters)

## Methods

### getApparentProperties()

> **getApparentProperties**(): [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6124

#### Returns

[`Symbol`](Symbol.md)[]

#### Inherited from

[`GenericType`](GenericType.md).[`getApparentProperties`](GenericType.md#getapparentproperties)

***

### getBaseTypes()

> **getBaseTypes**(): `undefined` \| [`BaseType`](../type-aliases/BaseType.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6129

#### Returns

`undefined` \| [`BaseType`](../type-aliases/BaseType.md)[]

#### Inherited from

[`GenericType`](GenericType.md).[`getBaseTypes`](GenericType.md#getbasetypes)

***

### getCallSignatures()

> **getCallSignatures**(): readonly [`Signature`](Signature.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6125

#### Returns

readonly [`Signature`](Signature.md)[]

#### Inherited from

[`GenericType`](GenericType.md).[`getCallSignatures`](GenericType.md#getcallsignatures)

***

### getConstraint()

> **getConstraint**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6131

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`GenericType`](GenericType.md).[`getConstraint`](GenericType.md#getconstraint)

***

### getConstructSignatures()

> **getConstructSignatures**(): readonly [`Signature`](Signature.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6126

#### Returns

readonly [`Signature`](Signature.md)[]

#### Inherited from

[`GenericType`](GenericType.md).[`getConstructSignatures`](GenericType.md#getconstructsignatures)

***

### getDefault()

> **getDefault**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6132

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`GenericType`](GenericType.md).[`getDefault`](GenericType.md#getdefault)

***

### getFlags()

> **getFlags**(): [`TypeFlags`](../enumerations/TypeFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6120

#### Returns

[`TypeFlags`](../enumerations/TypeFlags.md)

#### Inherited from

[`GenericType`](GenericType.md).[`getFlags`](GenericType.md#getflags)

***

### getNonNullableType()

> **getNonNullableType**(): [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6130

#### Returns

[`Type`](Type.md)

#### Inherited from

[`GenericType`](GenericType.md).[`getNonNullableType`](GenericType.md#getnonnullabletype)

***

### getNumberIndexType()

> **getNumberIndexType**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6128

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`GenericType`](GenericType.md).[`getNumberIndexType`](GenericType.md#getnumberindextype)

***

### getProperties()

> **getProperties**(): [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6122

#### Returns

[`Symbol`](Symbol.md)[]

#### Inherited from

[`GenericType`](GenericType.md).[`getProperties`](GenericType.md#getproperties)

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

[`GenericType`](GenericType.md).[`getProperty`](GenericType.md#getproperty)

***

### getStringIndexType()

> **getStringIndexType**(): `undefined` \| [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6127

#### Returns

`undefined` \| [`Type`](Type.md)

#### Inherited from

[`GenericType`](GenericType.md).[`getStringIndexType`](GenericType.md#getstringindextype)

***

### getSymbol()

> **getSymbol**(): `undefined` \| [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6121

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

#### Inherited from

[`GenericType`](GenericType.md).[`getSymbol`](GenericType.md#getsymbol)

***

### isClass()

> **isClass**(): `this is InterfaceType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6141

#### Returns

`this is InterfaceType`

#### Inherited from

[`GenericType`](GenericType.md).[`isClass`](GenericType.md#isclass)

***

### isClassOrInterface()

> **isClassOrInterface**(): `this is InterfaceType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6140

#### Returns

`this is InterfaceType`

#### Inherited from

[`GenericType`](GenericType.md).[`isClassOrInterface`](GenericType.md#isclassorinterface)

***

### isIndexType()

> **isIndexType**(): `this is IndexType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6142

#### Returns

`this is IndexType`

#### Inherited from

[`GenericType`](GenericType.md).[`isIndexType`](GenericType.md#isindextype)

***

### isIntersection()

> **isIntersection**(): `this is IntersectionType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6134

#### Returns

`this is IntersectionType`

#### Inherited from

[`GenericType`](GenericType.md).[`isIntersection`](GenericType.md#isintersection)

***

### isLiteral()

> **isLiteral**(): `this is LiteralType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6136

#### Returns

`this is LiteralType`

#### Inherited from

[`GenericType`](GenericType.md).[`isLiteral`](GenericType.md#isliteral)

***

### isNumberLiteral()

> **isNumberLiteral**(): `this is NumberLiteralType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6138

#### Returns

`this is NumberLiteralType`

#### Inherited from

[`GenericType`](GenericType.md).[`isNumberLiteral`](GenericType.md#isnumberliteral)

***

### isStringLiteral()

> **isStringLiteral**(): `this is StringLiteralType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6137

#### Returns

`this is StringLiteralType`

#### Inherited from

[`GenericType`](GenericType.md).[`isStringLiteral`](GenericType.md#isstringliteral)

***

### isTypeParameter()

> **isTypeParameter**(): `this is TypeParameter`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6139

#### Returns

`this is TypeParameter`

#### Inherited from

[`GenericType`](GenericType.md).[`isTypeParameter`](GenericType.md#istypeparameter)

***

### isUnion()

> **isUnion**(): `this is UnionType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6133

#### Returns

`this is UnionType`

#### Inherited from

[`GenericType`](GenericType.md).[`isUnion`](GenericType.md#isunion)

***

### isUnionOrIntersection()

> **isUnionOrIntersection**(): `this is UnionOrIntersectionType`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6135

#### Returns

`this is UnionOrIntersectionType`

#### Inherited from

[`GenericType`](GenericType.md).[`isUnionOrIntersection`](GenericType.md#isunionorintersection)
