[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArkSignatureBuilder

# Class: ArkSignatureBuilder

Defined in: src/core/model/builder/ArkSignatureBuilder.ts:19

## Constructors

### Constructor

> **new ArkSignatureBuilder**(): `ArkSignatureBuilder`

#### Returns

`ArkSignatureBuilder`

## Methods

### buildClassSignatureFromClassName()

> `static` **buildClassSignatureFromClassName**(`className`): [`ClassSignature`](ClassSignature.md)

Defined in: src/core/model/builder/ArkSignatureBuilder.ts:35

#### Parameters

##### className

`string`

#### Returns

[`ClassSignature`](ClassSignature.md)

***

### buildFieldSignatureFromFieldName()

> `static` **buildFieldSignatureFromFieldName**(`fieldName`, `staticFlag`): [`FieldSignature`](FieldSignature.md)

Defined in: src/core/model/builder/ArkSignatureBuilder.ts:39

#### Parameters

##### fieldName

`string`

##### staticFlag

`boolean` = `false`

#### Returns

[`FieldSignature`](FieldSignature.md)

***

### buildMethodSignatureFromClassNameAndMethodName()

> `static` **buildMethodSignatureFromClassNameAndMethodName**(`className`, `methodName`, `staticFlag`): [`MethodSignature`](MethodSignature.md)

Defined in: src/core/model/builder/ArkSignatureBuilder.ts:20

#### Parameters

##### className

`string`

##### methodName

`string`

##### staticFlag

`boolean` = `false`

#### Returns

[`MethodSignature`](MethodSignature.md)

***

### buildMethodSignatureFromMethodName()

> `static` **buildMethodSignatureFromMethodName**(`methodName`, `staticFlag`): [`MethodSignature`](MethodSignature.md)

Defined in: src/core/model/builder/ArkSignatureBuilder.ts:26

#### Parameters

##### methodName

`string`

##### staticFlag

`boolean` = `false`

#### Returns

[`MethodSignature`](MethodSignature.md)

***

### buildMethodSubSignatureFromMethodName()

> `static` **buildMethodSubSignatureFromMethodName**(`methodName`, `staticFlag`): [`MethodSubSignature`](MethodSubSignature.md)

Defined in: src/core/model/builder/ArkSignatureBuilder.ts:31

#### Parameters

##### methodName

`string`

##### staticFlag

`boolean` = `false`

#### Returns

[`MethodSubSignature`](MethodSubSignature.md)
