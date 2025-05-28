[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / FieldSignature

# Class: FieldSignature

Defined in: src/core/model/ArkSignature.ts:217

## Constructors

### Constructor

> **new FieldSignature**(`fieldName`, `declaringSignature`, `type`, `staticFlag`): `FieldSignature`

Defined in: src/core/model/ArkSignature.ts:223

#### Parameters

##### fieldName

`string`

##### declaringSignature

[`BaseSignature`](../type-aliases/BaseSignature.md)

##### type

[`Type`](Type.md)

##### staticFlag

`boolean` = `false`

#### Returns

`FieldSignature`

## Methods

### getBaseName()

> **getBaseName**(): `string`

Defined in: src/core/model/ArkSignature.ts:234

#### Returns

`string`

***

### getDeclaringSignature()

> **getDeclaringSignature**(): [`BaseSignature`](../type-aliases/BaseSignature.md)

Defined in: src/core/model/ArkSignature.ts:230

#### Returns

[`BaseSignature`](../type-aliases/BaseSignature.md)

***

### getFieldName()

> **getFieldName**(): `string`

Defined in: src/core/model/ArkSignature.ts:238

#### Returns

`string`

***

### getType()

> **getType**(): [`Type`](Type.md)

Defined in: src/core/model/ArkSignature.ts:242

#### Returns

[`Type`](Type.md)

***

### isStatic()

> **isStatic**(): `boolean`

Defined in: src/core/model/ArkSignature.ts:246

#### Returns

`boolean`

***

### setStaticFlag()

> **setStaticFlag**(`flag`): `void`

Defined in: src/core/model/ArkSignature.ts:256

#### Parameters

##### flag

`boolean`

#### Returns

`void`

***

### setType()

> **setType**(`type`): `void`

Defined in: src/core/model/ArkSignature.ts:251

#### Parameters

##### type

[`Type`](Type.md)

#### Returns

`void`

***

### toString()

> **toString**(): `string`

Defined in: src/core/model/ArkSignature.ts:260

#### Returns

`string`
