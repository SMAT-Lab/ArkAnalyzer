[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArkCaughtExceptionRef

# Class: ArkCaughtExceptionRef

Defined in: src/core/base/Ref.ts:295

## Extends

- [`AbstractRef`](AbstractRef.md)

## Constructors

### Constructor

> **new ArkCaughtExceptionRef**(`type`): `ArkCaughtExceptionRef`

Defined in: src/core/base/Ref.ts:298

#### Parameters

##### type

[`Type`](Type.md)

#### Returns

`ArkCaughtExceptionRef`

#### Overrides

[`AbstractRef`](AbstractRef.md).[`constructor`](AbstractRef.md#constructor)

## Methods

### getType()

> **getType**(): [`Type`](Type.md)

Defined in: src/core/base/Ref.ts:303

Return the type of this value. The interface is encapsulated in [Value](../interfaces/Value.md). 
The `Type` is defined in type.ts, such as **Any**, **Unknown**, **TypeParameter**, 
**UnclearReference**, **Primitive**, **Number**, **String**, etc.

#### Returns

[`Type`](Type.md)

The type of this value.

#### Example

1. In the declaration statement, determine the left-value type and right-value type.

```typescript
let leftValue:Value;
let rightValue:Value;
...
if (leftValue.getType() instanceof UnknownType && 
   !(rightValue.getType() instanceof UnknownType) &&
   !(rightValue.getType() instanceof UndefinedType)) {
   ...
}
```

#### Overrides

[`AbstractRef`](AbstractRef.md).[`getType`](AbstractRef.md#gettype)

***

### getUses()

> **getUses**(): [`Value`](../interfaces/Value.md)[]

Defined in: src/core/base/Ref.ts:307

Return a list of values which are contained in this [Value](../interfaces/Value.md).
Value is a core interface in ArkAnalyzer, which may represent any value or expression.

#### Returns

[`Value`](../interfaces/Value.md)[]

An **array** of values used by this value.

#### Overrides

[`AbstractRef`](AbstractRef.md).[`getUses`](AbstractRef.md#getuses)

***

### inferType()

> **inferType**(`arkMethod`): [`AbstractRef`](AbstractRef.md)

Defined in: src/core/base/Ref.ts:36

#### Parameters

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

[`AbstractRef`](AbstractRef.md)

#### Inherited from

[`AbstractRef`](AbstractRef.md).[`inferType`](AbstractRef.md#infertype)

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Ref.ts:311

Returns a string representation of an object.

#### Returns

`string`
