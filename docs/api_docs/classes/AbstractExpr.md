[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / AbstractExpr

# Class: `abstract` AbstractExpr

Defined in: src/core/base/Expr.ts:50

## Extended by

- [`AbstractInvokeExpr`](AbstractInvokeExpr.md)
- [`ArkNewExpr`](ArkNewExpr.md)
- [`ArkNewArrayExpr`](ArkNewArrayExpr.md)
- [`ArkDeleteExpr`](ArkDeleteExpr.md)
- [`ArkAwaitExpr`](ArkAwaitExpr.md)
- [`ArkYieldExpr`](ArkYieldExpr.md)
- [`AbstractBinopExpr`](AbstractBinopExpr.md)
- [`ArkTypeOfExpr`](ArkTypeOfExpr.md)
- [`ArkInstanceOfExpr`](ArkInstanceOfExpr.md)
- [`ArkCastExpr`](ArkCastExpr.md)
- [`ArkPhiExpr`](ArkPhiExpr.md)
- [`ArkUnopExpr`](ArkUnopExpr.md)
- [`AliasTypeExpr`](AliasTypeExpr.md)

## Implements

- [`Value`](../interfaces/Value.md)

## Constructors

### Constructor

> **new AbstractExpr**(): `AbstractExpr`

#### Returns

`AbstractExpr`

## Methods

### getType()

> `abstract` **getType**(): [`Type`](Type.md)

Defined in: src/core/base/Expr.ts:53

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

Defined in: src/core/base/Expr.ts:51

Return a list of values which are contained in this [Value](../interfaces/Value.md).
Value is a core interface in ArkAnalyzer, which may represent any value or expression.

#### Returns

[`Value`](../interfaces/Value.md)[]

An **array** of values used by this value.

#### Implementation of

[`Value`](../interfaces/Value.md).[`getUses`](../interfaces/Value.md#getuses)

***

### inferType()

> **inferType**(`arkMethod`): `AbstractExpr`

Defined in: src/core/base/Expr.ts:57

#### Parameters

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

`AbstractExpr`

***

### toString()

> `abstract` **toString**(): `string`

Defined in: src/core/base/Expr.ts:55

Returns a string representation of an object.

#### Returns

`string`
