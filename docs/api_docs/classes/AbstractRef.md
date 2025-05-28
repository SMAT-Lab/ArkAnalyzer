[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / AbstractRef

# Class: `abstract` AbstractRef

Defined in: src/core/base/Ref.ts:31

## Extended by

- [`ArkArrayRef`](ArkArrayRef.md)
- [`AbstractFieldRef`](AbstractFieldRef.md)
- [`ArkParameterRef`](ArkParameterRef.md)
- [`ArkThisRef`](ArkThisRef.md)
- [`ArkCaughtExceptionRef`](ArkCaughtExceptionRef.md)
- [`GlobalRef`](GlobalRef.md)
- [`ClosureFieldRef`](ClosureFieldRef.md)

## Implements

- [`Value`](../interfaces/Value.md)

## Constructors

### Constructor

> **new AbstractRef**(): `AbstractRef`

#### Returns

`AbstractRef`

## Methods

### getType()

> `abstract` **getType**(): [`Type`](Type.md)

Defined in: src/core/base/Ref.ts:34

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

#### Implementation of

[`Value`](../interfaces/Value.md).[`getType`](../interfaces/Value.md#gettype)

***

### getUses()

> `abstract` **getUses**(): [`Value`](../interfaces/Value.md)[]

Defined in: src/core/base/Ref.ts:32

Return a list of values which are contained in this [Value](../interfaces/Value.md).
Value is a core interface in ArkAnalyzer, which may represent any value or expression.

#### Returns

[`Value`](../interfaces/Value.md)[]

An **array** of values used by this value.

#### Implementation of

[`Value`](../interfaces/Value.md).[`getUses`](../interfaces/Value.md#getuses)

***

### inferType()

> **inferType**(`arkMethod`): `AbstractRef`

Defined in: src/core/base/Ref.ts:36

#### Parameters

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

`AbstractRef`
