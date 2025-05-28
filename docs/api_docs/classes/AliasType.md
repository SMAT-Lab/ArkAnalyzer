[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / AliasType

# Class: AliasType

Defined in: src/core/base/Type.ts:574

alias type

## Example

```typescript
// alias type A is defined without any genericTypes (undefined) or realGenericTypes (undefined)
type A = number;

// alias type B is defined with genericTypes but not instance with realGenericTypes (undefined)
type B<T> = T[];

// alias type could also be defined with another instance generic type such as aliaType, FunctionType and ClassType
// genericTypes and realGenericTypes of C are both undefined
// originalType of C is an instance of B with genericTypes [T] and realGenericTypes [numberType]
type C = B<number>;
```

## Extends

- [`Type`](Type.md)

## Implements

- `ArkExport`

## Constructors

### Constructor

> **new AliasType**(`name`, `originalType`, `signature`, `genericTypes?`): `AliasType`

Defined in: src/core/base/Type.ts:582

#### Parameters

##### name

`string`

##### originalType

[`Type`](Type.md)

##### signature

[`AliasTypeSignature`](AliasTypeSignature.md)

##### genericTypes?

[`GenericType`](GenericType.md)[]

#### Returns

`AliasType`

#### Overrides

[`Type`](Type.md).[`constructor`](Type.md#constructor)

## Properties

### modifiers?

> `protected` `optional` **modifiers**: `number`

Defined in: src/core/base/Type.ts:578

## Methods

### addModifier()

> **addModifier**(`modifier`): `void`

Defined in: src/core/base/Type.ts:636

#### Parameters

##### modifier

`number`

#### Returns

`void`

***

### containsModifier()

> **containsModifier**(`modifierType`): `boolean`

Defined in: src/core/base/Type.ts:622

#### Parameters

##### modifierType

`ModifierType`

#### Returns

`boolean`

#### Implementation of

`ArkExport.containsModifier`

***

### getExportType()

> **getExportType**(): `ExportType`

Defined in: src/core/base/Type.ts:611

#### Returns

`ExportType`

#### Implementation of

`ArkExport.getExportType`

***

### getGenericTypes()

> **getGenericTypes**(): `undefined` \| [`GenericType`](GenericType.md)[]

Defined in: src/core/base/Type.ts:655

#### Returns

`undefined` \| [`GenericType`](GenericType.md)[]

***

### getModifiers()

> **getModifiers**(): `number`

Defined in: src/core/base/Type.ts:615

#### Returns

`number`

#### Implementation of

`ArkExport.getModifiers`

***

### getName()

> **getName**(): `string`

Defined in: src/core/base/Type.ts:590

#### Returns

`string`

#### Implementation of

`ArkExport.getName`

***

### getOriginalType()

> **getOriginalType**(): [`Type`](Type.md)

Defined in: src/core/base/Type.ts:598

#### Returns

[`Type`](Type.md)

***

### getRealGenericTypes()

> **getRealGenericTypes**(): `undefined` \| [`Type`](Type.md)[]

Defined in: src/core/base/Type.ts:663

#### Returns

`undefined` \| [`Type`](Type.md)[]

***

### getSignature()

> **getSignature**(): [`AliasTypeSignature`](AliasTypeSignature.md)

Defined in: src/core/base/Type.ts:647

#### Returns

[`AliasTypeSignature`](AliasTypeSignature.md)

#### Implementation of

`ArkExport.getSignature`

***

### getTypeString()

> **getTypeString**(): `string`

Defined in: src/core/base/Type.ts:602

#### Returns

`string`

#### Overrides

[`Type`](Type.md).[`getTypeString`](Type.md#gettypestring)

***

### removeModifier()

> **removeModifier**(`modifier`): `void`

Defined in: src/core/base/Type.ts:640

#### Parameters

##### modifier

`ModifierType`

#### Returns

`void`

***

### setGenericTypes()

> **setGenericTypes**(`genericTypes`): `void`

Defined in: src/core/base/Type.ts:651

#### Parameters

##### genericTypes

[`GenericType`](GenericType.md)[]

#### Returns

`void`

***

### setModifiers()

> **setModifiers**(`modifiers`): `void`

Defined in: src/core/base/Type.ts:630

#### Parameters

##### modifiers

`number`

#### Returns

`void`

***

### setOriginalType()

> **setOriginalType**(`type`): `void`

Defined in: src/core/base/Type.ts:594

#### Parameters

##### type

[`Type`](Type.md)

#### Returns

`void`

***

### setRealGenericTypes()

> **setRealGenericTypes**(`realGenericTypes`): `void`

Defined in: src/core/base/Type.ts:659

#### Parameters

##### realGenericTypes

[`Type`](Type.md)[]

#### Returns

`void`

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Type.ts:38

#### Returns

`string`

#### Inherited from

[`Type`](Type.md).[`toString`](Type.md#tostring)
