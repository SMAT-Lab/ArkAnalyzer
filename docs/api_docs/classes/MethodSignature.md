[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / MethodSignature

# Class: MethodSignature

Defined in: src/core/model/ArkSignature.ts:327

## Constructors

### Constructor

> **new MethodSignature**(`declaringClassSignature`, `methodSubSignature`): `MethodSignature`

Defined in: src/core/model/ArkSignature.ts:331

#### Parameters

##### declaringClassSignature

[`ClassSignature`](ClassSignature.md)

##### methodSubSignature

[`MethodSubSignature`](MethodSubSignature.md)

#### Returns

`MethodSignature`

## Methods

### getDeclaringClassSignature()

> **getDeclaringClassSignature**(): [`ClassSignature`](ClassSignature.md)

Defined in: src/core/model/ArkSignature.ts:354

Return the declaring class signature.
A [ClassSignature](ClassSignature.md) includes:
- File Signature: including the **string** names of the project and file, respectively.
The default value of project's name is "%unk" and the default value of file's name is "%unk".
- Namespace Signature | **null**:  it may be a namespace signature or **null**.
A namespace signature can indicate its **string** name of namespace and its file signature.
- Class Name: the **string** name of this class.

#### Returns

[`ClassSignature`](ClassSignature.md)

The declaring class signature.

#### Example

1. get class signature from ArkMethod.

```typescript
let methodSignature = expr.getMethodSignature();
let name = methodSignature.getDeclaringClassSignature().getClassName();
```

***

### getMethodSubSignature()

> **getMethodSubSignature**(): [`MethodSubSignature`](MethodSubSignature.md)

Defined in: src/core/model/ArkSignature.ts:364

Returns the sub-signature of this method signature.
The sub-signature is part of the method signature, which is used to
identify the name of the method, its parameters and the return value type.

#### Returns

[`MethodSubSignature`](MethodSubSignature.md)

The sub-signature of this method signature.

***

### getParamLength()

> **getParamLength**(): `number`

Defined in: src/core/model/ArkSignature.ts:384

#### Returns

`number`

***

### getType()

> **getType**(): [`Type`](Type.md)

Defined in: src/core/model/ArkSignature.ts:368

#### Returns

[`Type`](Type.md)

***

### isMatch()

> **isMatch**(`signature`): `boolean`

Defined in: src/core/model/ArkSignature.ts:380

#### Parameters

##### signature

`MethodSignature`

#### Returns

`boolean`

***

### toMapKey()

> **toMapKey**(): `string`

Defined in: src/core/model/ArkSignature.ts:376

#### Returns

`string`

***

### toString()

> **toString**(`ptrName?`): `string`

Defined in: src/core/model/ArkSignature.ts:372

#### Parameters

##### ptrName?

`string`

#### Returns

`string`
