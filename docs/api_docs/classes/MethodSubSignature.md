[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / MethodSubSignature

# Class: MethodSubSignature

Defined in: src/core/model/ArkSignature.ts:269

## Constructors

### Constructor

> **new MethodSubSignature**(`methodName`, `parameters`, `returnType`, `staticFlag`): `MethodSubSignature`

Defined in: src/core/model/ArkSignature.ts:275

#### Parameters

##### methodName

`string`

##### parameters

`MethodParameter`[]

##### returnType

[`Type`](Type.md)

##### staticFlag

`boolean` = `false`

#### Returns

`MethodSubSignature`

## Methods

### getMethodName()

> **getMethodName**(): `string`

Defined in: src/core/model/ArkSignature.ts:282

#### Returns

`string`

***

### getParameters()

> **getParameters**(): `MethodParameter`[]

Defined in: src/core/model/ArkSignature.ts:286

#### Returns

`MethodParameter`[]

***

### getParameterTypes()

> **getParameterTypes**(): [`Type`](Type.md)[]

Defined in: src/core/model/ArkSignature.ts:290

#### Returns

[`Type`](Type.md)[]

***

### getReturnType()

> **getReturnType**(): [`Type`](Type.md)

Defined in: src/core/model/ArkSignature.ts:298

#### Returns

[`Type`](Type.md)

***

### isStatic()

> **isStatic**(): `boolean`

Defined in: src/core/model/ArkSignature.ts:306

#### Returns

`boolean`

***

### setReturnType()

> **setReturnType**(`returnType`): `void`

Defined in: src/core/model/ArkSignature.ts:302

#### Parameters

##### returnType

[`Type`](Type.md)

#### Returns

`void`

***

### toString()

> **toString**(`ptrName?`): `string`

Defined in: src/core/model/ArkSignature.ts:310

#### Parameters

##### ptrName?

`string`

#### Returns

`string`
