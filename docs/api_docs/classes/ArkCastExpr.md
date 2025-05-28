[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArkCastExpr

# Class: ArkCastExpr

Defined in: src/core/base/Expr.ts:862

## Extends

- [`AbstractExpr`](AbstractExpr.md)

## Constructors

### Constructor

> **new ArkCastExpr**(`op`, `type`): `ArkCastExpr`

Defined in: src/core/base/Expr.ts:866

#### Parameters

##### op

[`Value`](../interfaces/Value.md)

##### type

[`Type`](Type.md)

#### Returns

`ArkCastExpr`

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`constructor`](AbstractExpr.md#constructor)

## Methods

### getOp()

> **getOp**(): [`Value`](../interfaces/Value.md)

Defined in: src/core/base/Expr.ts:872

#### Returns

[`Value`](../interfaces/Value.md)

***

### getType()

> **getType**(): [`Type`](Type.md)

Defined in: src/core/base/Expr.ts:887

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

[`AbstractExpr`](AbstractExpr.md).[`getType`](AbstractExpr.md#gettype)

***

### getUses()

> **getUses**(): [`Value`](../interfaces/Value.md)[]

Defined in: src/core/base/Expr.ts:880

Return a list of values which are contained in this [Value](../interfaces/Value.md).
Value is a core interface in ArkAnalyzer, which may represent any value or expression.

#### Returns

[`Value`](../interfaces/Value.md)[]

An **array** of values used by this value.

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`getUses`](AbstractExpr.md#getuses)

***

### inferType()

> **inferType**(`arkMethod`): [`AbstractExpr`](AbstractExpr.md)

Defined in: src/core/base/Expr.ts:891

#### Parameters

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

[`AbstractExpr`](AbstractExpr.md)

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`inferType`](AbstractExpr.md#infertype)

***

### setOp()

> **setOp**(`newOp`): `void`

Defined in: src/core/base/Expr.ts:876

#### Parameters

##### newOp

[`Value`](../interfaces/Value.md)

#### Returns

`void`

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Expr.ts:902

Returns a string representation of an object.

#### Returns

`string`

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`toString`](AbstractExpr.md#tostring)
