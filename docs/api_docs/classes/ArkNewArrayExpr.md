[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArkNewArrayExpr

# Class: ArkNewArrayExpr

Defined in: src/core/base/Expr.ts:372

## Extends

- [`AbstractExpr`](AbstractExpr.md)

## Constructors

### Constructor

> **new ArkNewArrayExpr**(`baseType`, `size`, `fromLiteral`): `ArkNewArrayExpr`

Defined in: src/core/base/Expr.ts:378

#### Parameters

##### baseType

[`Type`](Type.md)

##### size

[`Value`](../interfaces/Value.md)

##### fromLiteral

`boolean` = `false`

#### Returns

`ArkNewArrayExpr`

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`constructor`](AbstractExpr.md#constructor)

## Methods

### getBaseType()

> **getBaseType**(): [`Type`](Type.md)

Defined in: src/core/base/Expr.ts:397

#### Returns

[`Type`](Type.md)

***

### getSize()

> **getSize**(): [`Value`](../interfaces/Value.md)

Defined in: src/core/base/Expr.ts:385

#### Returns

[`Value`](../interfaces/Value.md)

***

### getType()

> **getType**(): [`ArrayType`](ArrayType.md)

Defined in: src/core/base/Expr.ts:393

Return the type of this value. The interface is encapsulated in [Value](../interfaces/Value.md). 
The `Type` is defined in type.ts, such as **Any**, **Unknown**, **TypeParameter**, 
**UnclearReference**, **Primitive**, **Number**, **String**, etc.

#### Returns

[`ArrayType`](ArrayType.md)

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

Defined in: src/core/base/Expr.ts:417

Return a list of values which are contained in this [Value](../interfaces/Value.md).
Value is a core interface in ArkAnalyzer, which may represent any value or expression.

#### Returns

[`Value`](../interfaces/Value.md)[]

An **array** of values used by this value.

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`getUses`](AbstractExpr.md#getuses)

***

### inferType()

> **inferType**(`arkMethod`): `ArkNewArrayExpr`

Defined in: src/core/base/Expr.ts:409

#### Parameters

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

`ArkNewArrayExpr`

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`inferType`](AbstractExpr.md#infertype)

***

### isFromLiteral()

> **isFromLiteral**(): `boolean`

Defined in: src/core/base/Expr.ts:405

#### Returns

`boolean`

***

### setBaseType()

> **setBaseType**(`newType`): `void`

Defined in: src/core/base/Expr.ts:401

#### Parameters

##### newType

[`Type`](Type.md)

#### Returns

`void`

***

### setSize()

> **setSize**(`newSize`): `void`

Defined in: src/core/base/Expr.ts:389

#### Parameters

##### newSize

[`Value`](../interfaces/Value.md)

#### Returns

`void`

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Expr.ts:423

Returns a string representation of an object.

#### Returns

`string`

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`toString`](AbstractExpr.md#tostring)
