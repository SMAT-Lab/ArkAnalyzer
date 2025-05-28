[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArkInstanceOfExpr

# Class: ArkInstanceOfExpr

Defined in: src/core/base/Expr.ts:812

## Extends

- [`AbstractExpr`](AbstractExpr.md)

## Constructors

### Constructor

> **new ArkInstanceOfExpr**(`op`, `checkType`): `ArkInstanceOfExpr`

Defined in: src/core/base/Expr.ts:816

#### Parameters

##### op

[`Value`](../interfaces/Value.md)

##### checkType

[`Type`](Type.md)

#### Returns

`ArkInstanceOfExpr`

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`constructor`](AbstractExpr.md#constructor)

## Methods

### getCheckType()

> **getCheckType**(): [`Type`](Type.md)

Defined in: src/core/base/Expr.ts:830

#### Returns

[`Type`](Type.md)

***

### getOp()

> **getOp**(): [`Value`](../interfaces/Value.md)

Defined in: src/core/base/Expr.ts:822

#### Returns

[`Value`](../interfaces/Value.md)

***

### getType()

> **getType**(): [`Type`](Type.md)

Defined in: src/core/base/Expr.ts:834

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

Defined in: src/core/base/Expr.ts:838

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

Defined in: src/core/base/Expr.ts:849

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

Defined in: src/core/base/Expr.ts:826

#### Parameters

##### newOp

[`Value`](../interfaces/Value.md)

#### Returns

`void`

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Expr.ts:845

Returns a string representation of an object.

#### Returns

`string`

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`toString`](AbstractExpr.md#tostring)
