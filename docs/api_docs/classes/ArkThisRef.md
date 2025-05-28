[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArkThisRef

# Class: ArkThisRef

Defined in: src/core/base/Ref.ts:274

## Extends

- [`AbstractRef`](AbstractRef.md)

## Constructors

### Constructor

> **new ArkThisRef**(`type`): `ArkThisRef`

Defined in: src/core/base/Ref.ts:277

#### Parameters

##### type

[`ClassType`](ClassType.md)

#### Returns

`ArkThisRef`

#### Overrides

[`AbstractRef`](AbstractRef.md).[`constructor`](AbstractRef.md#constructor)

## Methods

### getType()

> **getType**(): [`ClassType`](ClassType.md)

Defined in: src/core/base/Ref.ts:282

Return the type of this value. The interface is encapsulated in [Value](../interfaces/Value.md). 
The `Type` is defined in type.ts, such as **Any**, **Unknown**, **TypeParameter**, 
**UnclearReference**, **Primitive**, **Number**, **String**, etc.

#### Returns

[`ClassType`](ClassType.md)

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

Defined in: src/core/base/Ref.ts:286

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

Defined in: src/core/base/Ref.ts:290

Returns a string representation of an object.

#### Returns

`string`
